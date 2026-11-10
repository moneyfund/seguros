/**
 * ACOS — isolated operational laboratory.
 * Every record is fictitious, has isPilot=true and lives in dedicated collections.
 * Production data must NEVER be seeded here. Replace this adapter with SQL Connect
 * after the relational schema and authorization rules are ready.
 */
import {
  addDoc, collection, doc, getDoc, onSnapshot, runTransaction, serverTimestamp,
  updateDoc, writeBatch, type Timestamp
} from 'firebase/firestore';
import { deleteObject, getBlob, ref, uploadBytes } from 'firebase/storage';
import type { User } from 'firebase/auth';
import { companyId, db, storage } from './firebase';
import { insurerById } from './insurers';

export type PilotCollection =
  'pilotClients'|'pilotLeads'|'pilotPolicies'|'pilotTickets'|'pilotCommissions'|'pilotDocuments'|'pilotActivities';

interface PilotBase {
  id: string;
  isPilot: true;
  createdBy: string;
  createdAt?: Timestamp;
}
export interface PilotClient extends PilotBase {
  fullName: string; email: string; phone: string; city: string; status: 'Activo';
}
export type LeadStage = 'Nuevo'|'Contactado'|'Cotización'|'Negociación'|'Ganado';
export interface PilotLead extends PilotBase {
  clientId: string; product: string; estimatedPremium: number; source: string; status: LeadStage;
  insurerId?: string;
  assignedTo: string;
}
export interface PilotPolicy extends PilotBase {
  clientId: string; leadId: string; policyNumber: string; insurer: string; product: string;
  insurerId?: string; insurerRegistryId?: string;
  premium: number; startDate: string; endDate: string; commissionRate: number;
  status: 'Vigente'|'En emisión';
}
export interface PilotCommission extends PilotBase {
  clientId: string; policyId: string; base: number; rate: number; amount: number;
  status: 'Pendiente';
}
export interface PilotTicket extends PilotBase {
  clientId: string; subject: string; detail: string; status: 'Pendiente'|'En proceso'|'Resuelto';
  policyId?: string; caseType?: string;
}
export interface PilotDocument extends PilotBase {
  clientId: string; policyId: string; fileName: string; bytes: number;
  contentType: string; storagePath: string; uploaderUid: string; uploaderEmail: string;
}
export interface PilotActivity extends PilotBase {
  clientId: string; label: string; category: string; actorEmail: string;
}
export type PilotRows = {
  pilotClients: PilotClient[];
  pilotLeads: PilotLead[];
  pilotPolicies: PilotPolicy[];
  pilotTickets: PilotTicket[];
  pilotCommissions: PilotCommission[];
  pilotDocuments: PilotDocument[];
  pilotActivities: PilotActivity[];
};

const pilotCollection = (name:PilotCollection) => collection(db,'companies',companyId,name);
const pilotDoc = (name:PilotCollection,id:string) => doc(db,'companies',companyId,name,id);
export const pilotCollectionNames: PilotCollection[] = [
  'pilotClients','pilotLeads','pilotPolicies','pilotTickets',
  'pilotCommissions','pilotDocuments','pilotActivities'
];
export function subscribePilot<K extends PilotCollection>(
  name: K, success:(rows:PilotRows[K])=>void, failure:(error:Error)=>void
) {
  return onSnapshot(pilotCollection(name), result => {
    success(result.docs.map(d=>({ id:d.id,...d.data() })) as PilotRows[K]);
  }, failure);
}

function required(value:string,label:string,max=120) {
  const clean=value.trim();
  if (clean.length<2 || clean.length>max) throw new Error(label+': debe contener entre 2 y '+max+' caracteres.');
  return clean;
}
function amount(value:number,label='Monto') {
  if (!Number.isFinite(value)||value<0||value>10_000_000) throw new Error(label+': introduce un valor válido.');
  return Math.round(value*100)/100;
}
function activity(user:User,clientId:string,label:string,category:string) {
  return { isPilot:true,createdBy:user.uid,createdAt:serverTimestamp(),
    clientId,label,category,actorEmail:user.email||'Administrador' };
}
async function checkClient(id:string) {
  const result=await getDoc(pilotDoc('pilotClients',id));
  if (!result.exists()||result.data().isPilot!==true) throw new Error('El cliente seleccionado no existe en el laboratorio.');
}
function requireOwner(user:User) {
  if (!user.emailVerified) throw new Error('La sesión debe estar verificada.');
}

export async function createPilotClient(user:User,input:{fullName:string;email:string;phone:string;city:string}) {
  requireOwner(user);
  const fullName=required(input.fullName,'Nombre');
  const email=input.email.trim().toLowerCase();
  if (email&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>150))
    throw new Error('El correo tiene un formato inválido.');
  const phone=input.phone.trim().slice(0,32);
  const city=required(input.city,'Localidad',90);
  const newClient=doc(pilotCollection('pilotClients'));
  const batch=writeBatch(db);
  batch.set(newClient,{isPilot:true,fullName,email,phone,city,status:'Activo',
    createdBy:user.uid,createdAt:serverTimestamp()});
  batch.set(doc(pilotCollection('pilotActivities')),activity(user,newClient.id,'Cliente ficticio registrado','cliente'));
  await batch.commit();
  return newClient.id;
}

export async function createPilotLead(user:User,input:{
  clientId:string;product:string;estimatedPremium:number;source:string;insurerId?:string
}) {
  requireOwner(user);await checkClient(input.clientId);
  const product=required(input.product,'Producto',100);
  if(input.insurerId && !insurerById(input.insurerId))throw new Error('Seleccioná una aseguradora del catálogo.');
  const estimatedPremium=amount(input.estimatedPremium,'Prima estimada');
  const newLead=doc(pilotCollection('pilotLeads'));
  const batch=writeBatch(db);
  batch.set(newLead,{isPilot:true,clientId:input.clientId,product,estimatedPremium,
    source:required(input.source,'Origen',70),insurerId:input.insurerId||'',status:'Nuevo',assignedTo:user.uid,
    createdBy:user.uid,createdAt:serverTimestamp()});
  batch.set(doc(pilotCollection('pilotActivities')),activity(user,input.clientId,'Nueva oportunidad: '+product,'comercial'));
  await batch.commit();return newLead.id;
}

const leadStages:LeadStage[]=['Nuevo','Contactado','Cotización','Negociación','Ganado'];
export async function advancePilotLead(user:User,lead:PilotLead) {
  requireOwner(user);
  const position=leadStages.indexOf(lead.status);
  if(position<0||position===leadStages.length-1) return;
  const next=leadStages[position+1];
  const batch=writeBatch(db);
  batch.update(pilotDoc('pilotLeads',lead.id),{status:next,updatedAt:serverTimestamp()});
  batch.set(doc(pilotCollection('pilotActivities')),activity(user,lead.clientId,'Oportunidad avanzada a '+next,'comercial'));
  await batch.commit();
}

export async function createPilotPolicy(user:User,input:{
  clientId:string;leadId:string;insurerId:string;product:string;
  premium:number;commissionRate:number;startDate:string;endDate:string
}) {
  requireOwner(user);await checkClient(input.clientId);
  const insuranceCompany=insurerById(input.insurerId);
  if(!insuranceCompany)throw new Error('Seleccioná una de las aseguradoras verificadas ante SIBOIF.');
  const product=required(input.product,'Producto',100);
  const premium=amount(input.premium,'Prima');
  const commissionRate=amount(input.commissionRate,'Porcentaje de comisión');
  if (commissionRate>100) throw new Error('La comisión no puede superar el 100%.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)||! /^\d{4}-\d{2}-\d{2}$/.test(input.endDate)||
    input.endDate<input.startDate) throw new Error('Las fechas de vigencia no son válidas.');
  if (input.leadId) {
    const lead=await getDoc(pilotDoc('pilotLeads',input.leadId));
    if (!lead.exists()||lead.data().clientId!==input.clientId||lead.data().isPilot!==true)
      throw new Error('La oportunidad no corresponde al cliente.');
  }
  const policyRef=doc(pilotCollection('pilotPolicies'));
  const commissionRef=doc(pilotCollection('pilotCommissions'));
  const batch=writeBatch(db);
  batch.set(policyRef,{
    isPilot:true,clientId:input.clientId,leadId:input.leadId,
    policyNumber:'ACOS-PIL-'+policyRef.id.slice(0,7).toUpperCase(),
    insurerId:insuranceCompany.id,insurerRegistryId:insuranceCompany.registryId,
    insurer:insuranceCompany.displayName,product,premium,
    startDate:input.startDate,endDate:input.endDate,
    commissionRate,status:'Vigente',createdBy:user.uid,createdAt:serverTimestamp()
  });
  batch.set(commissionRef,{
    isPilot:true,clientId:input.clientId,policyId:policyRef.id,base:premium,rate:commissionRate,
    amount:Math.round(premium*commissionRate)/100,status:'Pendiente',
    createdBy:user.uid,createdAt:serverTimestamp()
  });
  if(input.leadId) batch.update(pilotDoc('pilotLeads',input.leadId),{
    status:'Ganado',updatedAt:serverTimestamp()
  });
  batch.set(doc(pilotCollection('pilotActivities')),activity(user,input.clientId,
    'Póliza registrada y comisión calculada','poliza'));
  await batch.commit();return policyRef.id;
}

export async function createPilotTicket(user:User,input:{clientId:string;subject:string;detail:string}) {
  requireOwner(user);await checkClient(input.clientId);
  const subject=required(input.subject,'Asunto',130);
  const detail=required(input.detail,'Detalle',1500);
  const batch=writeBatch(db);
  batch.set(doc(pilotCollection('pilotTickets')),{isPilot:true,clientId:input.clientId,subject,detail,
    status:'Pendiente',createdBy:user.uid,createdAt:serverTimestamp()});
  batch.set(doc(pilotCollection('pilotActivities')),activity(user,input.clientId,'Solicitud abierta: '+subject,'servicio'));
  await batch.commit();
}
/**
 * Open a repeat-safe renewal service case from an actual saved pilot policy.
 * This creates a case in Firestore; it does not contact or renew any insurer.
 */
export async function openPilotRenewalCase(user:User,policy:PilotPolicy):Promise<boolean> {
  requireOwner(user);
  const policyRef=pilotDoc('pilotPolicies',policy.id);
  const caseRef=pilotDoc('pilotTickets','renewal-'+policy.id);
  return runTransaction(db,async transaction=>{
    const stored=await transaction.get(policyRef);
    const previous=await transaction.get(caseRef);
    if(!stored.exists() || stored.data().isPilot!==true)
      throw new Error('No se encontró la póliza del laboratorio.');
    if(previous.exists()) return false;
    const customer=stored.data().clientId as string;
    transaction.set(caseRef,{
      isPilot:true,clientId:customer,policyId:policy.id,caseType:'Renovación',
      subject:'Renovación · '+String(stored.data().policyNumber||'póliza de ejemplo'),
      detail:'Caso de prueba generado para dar seguimiento al vencimiento '+String(stored.data().endDate||'')+'. No se ha renovado ni emitido ninguna cobertura.',
      status:'Pendiente',createdBy:user.uid,createdAt:serverTimestamp()
    });
    transaction.set(doc(pilotCollection('pilotActivities')),activity(
      user,customer,'Gestión ficticia de renovación abierta','renovacion'
    ));
    return true;
  });
}

export async function resolvePilotTicket(user:User,ticket:PilotTicket) {
  requireOwner(user);
  const batch=writeBatch(db);
  batch.update(pilotDoc('pilotTickets',ticket.id),{status:'Resuelto',updatedAt:serverTimestamp()});
  batch.set(doc(pilotCollection('pilotActivities')),activity(user,ticket.clientId,
    'Solicitud resuelta: '+ticket.subject,'servicio'));
  await batch.commit();
}

const fileExtensions:Record<string,string>={
  'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp'
};
export async function uploadPilotDocument(user:User,input:{file:File;clientId:string;policyId:string}) {
  requireOwner(user);await checkClient(input.clientId);
  const file=input.file;
  if(!fileExtensions[file.type]||file.size<=0||file.size>8*1024*1024)
    throw new Error('Adjunta un PDF o imagen de prueba de máximo 8 MB.');
  if(input.policyId) {
    const policy=await getDoc(pilotDoc('pilotPolicies',input.policyId));
    if(!policy.exists()||policy.data().clientId!==input.clientId)
      throw new Error('La póliza seleccionada no pertenece al cliente.');
  }
  const path='companies/'+companyId+'/pilotDocuments/'+user.uid+'/'+crypto.randomUUID()+'.'+fileExtensions[file.type];
  const storageRef=ref(storage,path);
  await uploadBytes(storageRef,file,{contentType:file.type});
  const batch=writeBatch(db);
  batch.set(doc(pilotCollection('pilotDocuments')),{isPilot:true,clientId:input.clientId,
    policyId:input.policyId,fileName:file.name.slice(0,150),bytes:file.size,contentType:file.type,
    storagePath:path,uploaderUid:user.uid,uploaderEmail:user.email||'',
    createdBy:user.uid,createdAt:serverTimestamp()});
  batch.set(doc(pilotCollection('pilotActivities')),activity(user,input.clientId,
    'Archivo ficticio cargado: '+file.name.slice(0,80),'documento'));
  try {await batch.commit();}
  catch(error){try{await deleteObject(storageRef);}catch{/* cleanup best effort */}throw error;}
}
export async function downloadPilotDocument(record:PilotDocument) {
  if (!record.storagePath.startsWith('companies/'+companyId+'/pilotDocuments/'))
    throw new Error('La ruta del archivo no corresponde al entorno piloto.');
  const blob=await getBlob(ref(storage,record.storagePath));
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download=record.fileName;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),60_000);
}

export async function seedPilotScenario(user:User) {
  requireOwner(user);
  const marker=doc(db,'companies',companyId,'pilotMeta','initialScenario');
  return runTransaction(db,async transaction=>{
    const previous=await transaction.get(marker);
    if(previous.exists()) return false;
    const now=serverTimestamp();
    const clientNames=['Cliente Ejemplo 01','Cliente Ejemplo 02','Cliente Ejemplo 03','Cliente Ejemplo 04'];
    const products=['Seguro vehicular','Seguro de vida','Seguro de hogar','Seguro empresarial'];
    const clientRefs=clientNames.map((_,i)=>pilotDoc('pilotClients','test-client-'+String(i+1).padStart(2,'0')));
    clientRefs.forEach((c,i)=>transaction.set(c,{isPilot:true,fullName:clientNames[i],
      email:'cliente'+(i+1)+'@example.invalid',phone:'0000 0000',city:'Matagalpa (ejemplo)',
      status:'Activo',createdBy:user.uid,createdAt:now}));
    const leadRefs=[1,2,3].map(i=>pilotDoc('pilotLeads','test-lead-0'+i));
    leadRefs.forEach((l,i)=>transaction.set(l,{
      isPilot:true,clientId:clientRefs[i].id,product:products[i],
      estimatedPremium:[620,840,480][i],source:['Web','Referido','Teléfono'][i],
      status:(['Cotización','Contactado','Nuevo'] as LeadStage[])[i],
      assignedTo:user.uid,createdBy:user.uid,createdAt:now
    }));
    const policyRef=pilotDoc('pilotPolicies','test-policy-01');
    transaction.set(policyRef,{isPilot:true,clientId:clientRefs[0].id,leadId:leadRefs[0].id,
      policyNumber:'ACOS-PIL-0001',insurer:'Aseguradora Ficticia A',product:products[0],
      premium:620,startDate:'2026-11-01',endDate:'2027-11-01',commissionRate:15,
      status:'Vigente',createdBy:user.uid,createdAt:now});
    transaction.set(pilotDoc('pilotCommissions','test-commission-01'),{
      isPilot:true,clientId:clientRefs[0].id,policyId:policyRef.id,
      base:620,rate:15,amount:93,status:'Pendiente',createdBy:user.uid,createdAt:now
    });
    transaction.set(pilotDoc('pilotTickets','test-ticket-01'),{
      isPilot:true,clientId:clientRefs[1].id,subject:'Consulta ficticia sobre cobertura',
      detail:'Solicitud de ejemplo para probar atención y resolución.',status:'Pendiente',
      createdBy:user.uid,createdAt:now
    });
    transaction.set(doc(pilotCollection('pilotActivities')),{...activity(user,clientRefs[0].id,
      'Escenario demostrativo inicializado','sistema')});
    transaction.set(marker,{isPilot:true,seedVersion:1,createdBy:user.uid,createdAt:now});
    return true;
  });
}
