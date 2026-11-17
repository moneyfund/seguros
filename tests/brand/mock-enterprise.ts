// Isolated browser fixture. Not included in the production entry or Vite build.
import {useMemo} from 'react';
const blocked=async()=>{throw Error('La prueba visual no permite escrituras.');};
export const documentSlots=['front','back','registration'] as const;
export const slotLabels={front:'Cédula · frente',back:'Cédula · reverso',registration:'Circulación del vehículo'};
export const statusLabels={DRAFT:'Borrador',SUBMITTED:'Recibida',IN_REVIEW:'En revisión',NEEDS_CORRECTION:'Requiere corrección',ISSUED:'PDF disponible',REJECTED:'Rechazada',CANCELLED:'Cancelada'};
export const emptyProfile={documentType:'CEDULA',documentNumber:'',birthDate:'',nationality:'',occupation:'',department:'',address:'',alternatePhone:''};
export const emptyVehicle={make:'',model:'',year:'',color:'',vin:'',use:'Particular'};
export const attachmentError=(e:unknown)=>String(e instanceof Error?e.message:e);
export const attachDocument=blocked,claimRequest=blocked,createCustomer=blocked,createRequest=blocked,issueRequest=blocked,markSeen=blocked,returnRequest=blocked,submitRequest=blocked,setEnterpriseTrialEnabled=blocked,readAttachment=blocked,downloadAttachment=blocked,readImageAttachment=blocked;
export const saveAttachment=()=>{};
export function permissions(admin:boolean,roles:string[],sections:string[]){
 const canView=admin||(sections.includes('clientes')&&roles.some(r=>['direccion','ventas','operaciones','servicio'].includes(r)));
 return {canView,wide:canView&&(admin||roles.some(r=>['direccion','operaciones','servicio'].includes(r))),sales:canView&&(admin||roles.some(r=>['direccion','ventas'].includes(r))),operator:canView&&(admin||(sections.includes('polizas')&&roles.some(r=>['direccion','operaciones'].includes(r)))),issuance:canView&&(admin||sections.includes('polizas'))};
}
export const unseen=(r:{agentUid:string;agentSeenRevision:number;revision:number;status:string},uid:string)=>r.agentUid===uid&&r.agentSeenRevision<r.revision&&['ISSUED','NEEDS_CORRECTION','REJECTED'].includes(r.status);
export function useEnterpriseRecords(uid:string,canView:boolean,wide:boolean){
 return useMemo(()=>({enabled:canView,loading:false,error:'',archivedClients:[],archivedRequests:[],clients:canView?[{id:'client-test',fullName:'Cliente de ensayo',email:'cliente@example.invalid',phone:'0000-0000',city:'Matagalpa',ownerUid:uid,trial:true,profile:emptyProfile}]:[],requests:canView?[{id:'Request-QA',clientId:'client-test',clientName:'Cliente de ensayo',agentUid:uid,insurerId:'lafise',productKey:'VEHICLE_MANDATORY',plate:'TEST-001',vehicle:emptyVehicle,status:'DRAFT',files:{front:'front-test.jpg',back:'back-test.jpg',registration:'registration-test.jpg'},pdf:'',policyNumber:'',startDate:'',endDate:'',premiumCents:0,currency:'USD',operatorUid:'',reason:'',revision:0,agentSeenRevision:0,trial:true}]:[]}),[uid,canView,wide]);
}

export const registerExternalPolicy=blocked,adminUpdateCustomer=blocked,adminUpdatePolicy=blocked,adminArchive=blocked,adminRemoveAttachment=blocked,attachExternalDocument=blocked;
