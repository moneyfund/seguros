import { collection, doc, getDocs, getDoc, query, where, setDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getBlob, ref, uploadBytes } from 'firebase/storage';
import type { User } from 'firebase/auth';
import { companyId, db, storage } from './firebase';
import { navigationByRole, type Section } from './data';
import type { EnterpriseRole } from './backend';

export type StaffDepartment = 'direccion' | 'ventas' | 'operaciones' | 'servicio' | 'finanzas' | 'supervision';
export type StaffApplication = {
  id: string; email: string; displayName: string; phone: string; requestedDepartment: StaffDepartment;
  status: 'draft' | 'pending' | 'approved' | 'rejected'; profilePhotoPath?: string; identityDocumentPath?: string;
};
export type StaffMember = {
  id: string; displayName: string; email: string; role: EnterpriseRole;
  roles?: EnterpriseRole[]; department?: StaffDepartment; employeeCode?: string;
  allowedSections?: Section[]; active: boolean;
};

export const departments: Record<StaffDepartment, string> = {
  direccion: 'Dirección general', ventas: 'Comercial y ventas', operaciones: 'Operaciones y pólizas',
  servicio: 'Servicio al cliente', finanzas: 'Finanzas y comisiones', supervision: 'Supervisión'
};
export const departmentCodes: Record<StaffDepartment, string> = {
  direccion: 'DIR', ventas: 'VEN', operaciones: 'OPE', servicio: 'SAC', finanzas: 'FIN', supervision: 'SUP'
};
export const staffEmailDomain = String(import.meta.env.VITE_ACOS_STAFF_DOMAIN || '').trim().toLowerCase();
export function isInstitutionalEmail(email: string): boolean {
  return !!staffEmailDomain && email.trim().toLowerCase().endsWith('@' + staffEmailDomain);
}
export function employeeCodeFor(department: StaffDepartment, uid: string): string {
  // Stable and department-specific. Production SQL must enforce a UNIQUE constraint.
  return departmentCodes[department] + '-' + uid.slice(0, 8).toUpperCase();
}
export function sectionsForRoles(roles: EnterpriseRole[]): Section[] {
  return [...new Set(roles.flatMap(r => navigationByRole[r] || []))];
}
const requestDoc = (uid: string) => doc(db, 'companies', companyId, 'accessRequests', uid);
const memberDoc = (uid: string) => doc(db, 'companies', companyId, 'members', uid);
function validateFile(file: File, types: string[], maxMB: number, label: string) {
  if (!file || !types.includes(file.type) || file.size < 1 || file.size > maxMB * 1024 * 1024)
    throw new Error(label + ': formato no admitido o archivo demasiado grande.');
}
function extensionFor(file: File) {
  return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' } as Record<string,string>)[file.type];
}

export async function submitStaffApplication(user: User, input: {
  displayName: string; phone: string; department: StaffDepartment; photo: File; identity: File;
}) {
  if (!user.emailVerified || !user.email || !isInstitutionalEmail(user.email))
    throw new Error('Debes iniciar sesión con una cuenta institucional verificada. El dominio puede estar pendiente de configuración.');
  const displayName = input.displayName.trim();
  const phone = input.phone.trim();
  if (displayName.length < 3 || displayName.length > 90) throw new Error('Introduce tu nombre completo.');
  if (!/^\+?[0-9 ()-]{8,20}$/.test(phone)) throw new Error('Introduce un teléfono válido.');
  if (!Object.prototype.hasOwnProperty.call(departments, input.department)) throw new Error('Selecciona un área válida.');
  validateFile(input.photo, ['image/jpeg','image/png','image/webp'], 3, 'Fotografía');
  validateFile(input.identity, ['image/jpeg','image/png','image/webp','application/pdf'], 8, 'Identificación');
  const existing = await getDoc(requestDoc(user.uid));
  if (existing.exists() && existing.data()?.status !== 'draft')
    throw new Error('Ya existe una solicitud. Dirección debe revisarla antes de enviar otra.');
  const draftFields = {
    email: user.email.toLowerCase(), displayName, phone, requestedDepartment: input.department,
    requestedRole: input.department, status: 'draft'
  };
  if (existing.exists()) {
    await updateDoc(requestDoc(user.uid), draftFields);
  } else {
    await setDoc(requestDoc(user.uid), { ...draftFields, requestedAt: serverTimestamp() });
  }
  const prefix = 'companies/' + companyId + '/onboarding/' + user.uid + '/';
  const photoPath = prefix + 'photo-' + crypto.randomUUID() + '.' + extensionFor(input.photo);
  const identityPath = prefix + 'identity-' + crypto.randomUUID() + '.' + extensionFor(input.identity);
  await uploadBytes(ref(storage, photoPath), input.photo, { contentType: input.photo.type });
  await uploadBytes(ref(storage, identityPath), input.identity, { contentType: input.identity.type });
  await updateDoc(requestDoc(user.uid), {
    status: 'pending', profilePhotoPath: photoPath, identityDocumentPath: identityPath, submittedAt: serverTimestamp()
  });
}
export async function pendingStaffApplications(): Promise<StaffApplication[]> {
  const snapshots = await getDocs(query(collection(db, 'companies', companyId, 'accessRequests'), where('status','==','pending')));
  return snapshots.docs.map(d => ({ ...d.data(), id: d.id } as StaffApplication));
}
export async function approveStaffApplication(
  item: StaffApplication, department: StaffDepartment, roles: EnterpriseRole[], allowedSections: Section[]
) {
  if (item.status !== 'pending' || !item.profilePhotoPath || !item.identityDocumentPath || !item.phone)
    throw new Error('La solicitud no contiene la documentación obligatoria. No puede aprobarse.');
  if (!staffEmailDomain || !isInstitutionalEmail(item.email))
    throw new Error('El dominio institucional no coincide con la solicitud.');
  if (!roles.length || roles.some(r=>!Object.keys(navigationByRole).includes(r)))
    throw new Error('Elige al menos un rol válido.');
  const validSections = sectionsForRoles(roles);
  if (!allowedSections.length || allowedSections.some(section=>!validSections.includes(section)))
    throw new Error('Las vistas seleccionadas deben pertenecer a los roles asignados.');
  const code = employeeCodeFor(department, item.id);
  const batch = writeBatch(db);
  batch.set(memberDoc(item.id), {
    email: item.email, displayName: item.displayName, phone: item.phone,
    role: roles[0], roles, department, employeeCode: code, allowedSections,
    profilePhotoPath: item.profilePhotoPath, identityDocumentPath: item.identityDocumentPath,
    active: true, approvedAt: serverTimestamp()
  });
  batch.update(requestDoc(item.id), {
    status:'approved', reviewedAt:serverTimestamp(),
    approvedDepartment:department, employeeCode:code, notificationStatus:'pending_configuration'
  });
  await batch.commit();
  return code;
}
export async function rejectStaffApplication(item: StaffApplication) {
  if (item.status !== 'pending') throw new Error('La solicitud ya fue procesada.');
  await updateDoc(requestDoc(item.id), { status:'rejected', reviewedAt:serverTimestamp() });
}
export async function updateStaffMember(
  member: StaffMember, department: StaffDepartment, roles: EnterpriseRole[], sections: Section[]
) {
  const valid = sectionsForRoles(roles);
  if (!roles.length || !sections.length || sections.some(s=>!valid.includes(s)))
    throw new Error('Selecciona permisos válidos.');
  await updateDoc(memberDoc(member.id), {
    department, employeeCode:member.department===department && member.employeeCode ? member.employeeCode : employeeCodeFor(department,member.id),
    role:roles[0], roles, allowedSections:sections, updatedAt:serverTimestamp()
  });
}
export async function openProtectedStaffDocument(path: string) {
  if (!path.startsWith('companies/' + companyId + '/onboarding/'))
    throw new Error('Ruta documental no autorizada.');
  const file = await getBlob(ref(storage,path));
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url; link.download = path.includes('/photo-') ? 'fotografia-colaborador' : 'identificacion-colaborador';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 90_000);
}
