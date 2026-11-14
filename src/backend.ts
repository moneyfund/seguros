import {
  addDoc, collection, doc, getDoc, getDocs, onSnapshot, query,
  serverTimestamp, setDoc, updateDoc, where,
  type DocumentData, type QuerySnapshot
} from 'firebase/firestore';
import { deleteObject, ref, uploadBytes } from 'firebase/storage';
import type { User } from 'firebase/auth';
import { companyId, db, storage } from './firebase';
import type { Section } from './data';

export type EnterpriseRole = 'direccion' | 'ventas' | 'operaciones' | 'servicio' | 'finanzas' | 'supervision' | 'cliente';
export type LiveCollection = 'leads' | 'policies' | 'tickets' | 'commissions' | 'documents' | 'members' | 'accessRequests';
export type LiveRecord = { id: string; [key: string]: unknown };
export type Member = {
  uid: string;
  role: EnterpriseRole;
  roles?: EnterpriseRole[];
  allowedSections?: Section[];
  active: boolean;
  displayName: string;
  email: string;
};
export type AccessRequest = {
  id: string;
  email: string;
  displayName: string;
  requestedRole: EnterpriseRole;
  status: 'pending' | 'approved' | 'rejected';
};

export function recordsCollection(name: LiveCollection) {
  return collection(db, 'companies', companyId, name);
}
export function memberRef(uid: string) {
  return doc(db, 'companies', companyId, 'members', uid);
}
export function requestRef(uid: string) {
  return doc(db, 'companies', companyId, 'accessRequests', uid);
}
export async function memberFor(user: User): Promise<Member | null> {
  const snapshot = await getDoc(memberRef(user.uid));
  const data = snapshot.data();
  if (!data || data.active !== true) return null;
  if (!['direccion','ventas','operaciones','servicio','finanzas','supervision','cliente'].includes(data.role)) return null;
  const validRoles: EnterpriseRole[]=['direccion','ventas','operaciones','servicio','finanzas','supervision','cliente'];
  const validSections: Section[]=['resumen','prospectos','polizas','clientes','solicitudes','finanzas','equipo','documentos','configuracion'];
  const additionalRoles = Array.isArray(data.roles)?data.roles.filter((r:unknown):r is EnterpriseRole=>typeof r==='string'&&validRoles.includes(r as EnterpriseRole)):[];
  const allowedSections=Array.isArray(data.allowedSections)?data.allowedSections.filter((v:unknown):v is Section=>typeof v==='string'&&validSections.includes(v as Section)):undefined;
  return { uid:user.uid, role:data.role, roles:additionalRoles.length?additionalRoles:[data.role], allowedSections, active:true, displayName:data.displayName||user.displayName||user.email||'Usuario', email:data.email||user.email||'' };
}
export async function requestAccess(user: User, displayName: string, requestedRole: EnterpriseRole) {
  if (!user.emailVerified) throw new Error('Verifica tu correo antes de solicitar acceso.');
  const reference = requestRef(user.uid);
  const existing = await getDoc(reference);
  if (!existing.exists()) {
    await setDoc(reference, {
      email: user.email || '',
      displayName: displayName.slice(0, 90),
      requestedRole,
      status: 'pending',
      requestedAt: serverTimestamp()
    });
  }
}
export async function approveRequest(item: AccessRequest, role: EnterpriseRole) {
  await setDoc(memberRef(item.id), {
    email: item.email,
    displayName: item.displayName,
    role,
    active: true,
    approvedAt: serverTimestamp()
  });
  await updateDoc(requestRef(item.id), { status: 'approved', reviewedAt: serverTimestamp() });
}
export type RecordScope = {
  field: 'clientUid' | 'uploaderUid' | 'assignedToUid' | 'agentUid';
  uid: string;
};
export function subscribeRecords(
  name: LiveCollection,
  callback: (rows: LiveRecord[]) => void,
  onError: (error: Error) => void,
  scope?: RecordScope
) {
  const source = scope
    ? query(recordsCollection(name), where(scope.field, '==', scope.uid))
    : recordsCollection(name);
  return onSnapshot(source, (snapshot: QuerySnapshot<DocumentData>) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  }, onError);
}
export async function addLead(input: { name: string; product: string; value: number; channel: string }, user: User) {
  await addDoc(recordsCollection('leads'), {
    name: input.name.trim().slice(0, 120),
    product: input.product,
    estimatedPremium: Math.max(0, Number(input.value)),
    status: 'Nuevo',
    channel: input.channel,
    assignedToUid: user.uid,
    assignedToName: user.displayName || user.email || 'Agente',
    createdBy: user.uid,
    createdAt: serverTimestamp()
  });
}
export async function advanceLead(record: LiveRecord) {
  const stages = ['Nuevo','Contactado','Cotización','Negociación','Ganado'];
  const current = stages.indexOf(String(record.status));
  if (current < 0 || current >= stages.length - 1) return;
  await updateDoc(doc(recordsCollection('leads'), record.id), { status: stages[current + 1], updatedAt: serverTimestamp() });
}
export async function createTicket(input: { subject: string; detail: string; type: string }, user: User, role: EnterpriseRole) {
  await addDoc(recordsCollection('tickets'), {
    subject: input.subject.trim().slice(0, 130),
    detail: input.detail.trim().slice(0, 2000),
    type: input.type,
    status: 'Pendiente',
    priority: 'Media',
    clientUid: role === 'cliente' ? user.uid : '',
    createdBy: user.uid,
    createdAt: serverTimestamp()
  });
}
export async function resolveTicket(id: string) {
  await updateDoc(doc(recordsCollection('tickets'), id), { status: 'Resuelto', updatedAt: serverTimestamp() });
}
export async function registerPolicy(input: { clientName: string; insurer: string; product: string; premium: number }, user: User) {
  await addDoc(recordsCollection('policies'), {
    clientName: input.clientName.trim().slice(0, 120),
    insurer: input.insurer.trim().slice(0, 120),
    product: input.product,
    premium: Math.max(0, Number(input.premium)),
    status: 'En gestión',
    clientUid: '',
    createdBy: user.uid,
    createdAt: serverTimestamp()
  });
}

const allowedTypes: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
export async function uploadDocument(file: File, user: User, role: EnterpriseRole) {
  if (!(file.type in allowedTypes)) throw new Error('Solo se permiten PDF, JPG, PNG o WebP.');
  if (file.size <= 0 || file.size > 8 * 1024 * 1024) throw new Error('El archivo debe pesar menos de 8 MB.');
  const uuid = crypto.randomUUID();
  const path = `companies/${companyId}/documents/${user.uid}/${uuid}.${allowedTypes[file.type]}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type, customMetadata: { uploaderUid: user.uid } });
  try {
    await addDoc(recordsCollection('documents'), {
      fileName: file.name.slice(0, 150),
      contentType: file.type,
      bytes: file.size,
      storagePath: path,
      uploaderUid: user.uid,
      clientUid: role === 'cliente' ? user.uid : '',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    try { await deleteObject(storageRef); } catch { /* la limpieza se audita manualmente */ }
    throw error;
  }
}
export async function pendingRequests() {
  const snapshot = await getDocs(query(recordsCollection('accessRequests'), where('status', '==', 'pending')));
  return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AccessRequest, 'id'>) }));
}
