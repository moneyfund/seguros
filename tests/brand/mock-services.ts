import { navigationByRole } from '../../src/data';
// Read-only adapters for the visual fixture; never imported by production code.
const blocked = async () => { throw new Error('La prueba visual no permite escrituras.'); };
export const auth = {}, db = {}, storage = {}, companyId = 'visual-fixture';
export const isVerifiedInitialAdminToken = () => false;
const records: Record<string, object[]> = {
  leads: [{id:'QA-001',name:'Cliente de prueba',product:'Seguro vehicular',value:350,status:'Contactado',channel:'Referencia'}],
  policies: [{id:'QA-002',clientName:'Expediente de ejemplo',product:'Seguro de hogar',premium:420,insurer:'INISER',status:'En revisión'}],
  tickets: [{id:'QA-003',subject:'Consulta de ejemplo',type:'Consulta',status:'Abierto',detail:'Registro ficticio para revisión visual'}],
  documents: [{id:'QA-004',name:'Documento de ejemplo.pdf',size:128000,status:'Registrado'}],
  commissions: [], members: [],
};
export const subscribeRecords = (name: string, next: (rows: object[]) => void) => { queueMicrotask(() => next(records[name] || [])); return () => {}; };
export const pendingRequests = async () => [];
export const memberFor = async () => null;
export const memberRef = () => ({}), requestRef = () => ({});
export const addLead = blocked, advanceLead = blocked, approveRequest = blocked, createTicket = blocked, registerPolicy = blocked, requestAccess = blocked, resolveTicket = blocked, uploadDocument = blocked;
export const departments = { direccion:'Dirección',ventas:'Comercial y ventas',operaciones:'Operaciones',servicio:'Servicio',finanzas:'Finanzas',supervision:'Supervisión' };
export const employeeCodeFor = () => 'QA-VENTAS-001';
export const sectionsForRoles = (roles: (keyof typeof navigationByRole)[]) => [...new Set(roles.flatMap(role => navigationByRole[role]))];
export const pendingStaffApplications = async () => [];
export const hasStaffInvitation = async () => false;
export const approveStaffApplication = blocked, createStaffInvitation = blocked, openProtectedStaffDocument = blocked, rejectStaffApplication = blocked, submitStaffApplication = blocked, updateStaffMember = blocked;
export const pilotCollectionNames = ['pilotClients','pilotLeads','pilotPolicies','pilotTickets','pilotCommissions','pilotDocuments','pilotActivities'];
export const subscribePilot = (_name: string, next: (rows: object[]) => void) => { queueMicrotask(() => next([])); return () => {}; };
export const advancePilotLead = blocked, createPilotClient = blocked, createPilotLead = blocked, createPilotPolicy = blocked, createPilotTicket = blocked, openPilotRenewalCase = blocked, downloadPilotDocument = blocked, resolvePilotTicket = blocked, uploadPilotDocument = blocked, seedInsurancePortfolio = blocked;
