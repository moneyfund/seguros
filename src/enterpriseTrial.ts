import { useEffect,useState } from 'react';
import { collection,doc,onSnapshot,query,where,addDoc,setDoc,runTransaction,serverTimestamp, type DocumentReference } from 'firebase/firestore';
import { ref,uploadBytesResumable,getBlob,getMetadata } from 'firebase/storage';
import type { User } from 'firebase/auth';
import { db,storage,companyId } from './firebase';
import type { EnterpriseRole } from './backend';
import type { Section } from './data';
import {validateIssuanceTransition,mandatoryVehicleDocuments,type IssuanceStatus} from './issuanceWorkflow';

export const documentSlots=['front','back','registration'] as const;
export type Slot=typeof documentSlots[number];
export const slotLabels:Record<Slot,string>={front:'Cédula · frente',back:'Cédula · reverso',registration:'Circulación del vehículo'};
export const statusLabels:Record<IssuanceStatus,string>={DRAFT:'Borrador',SUBMITTED:'Recibida',IN_REVIEW:'En revisión',NEEDS_CORRECTION:'Requiere corrección',ISSUED:'PDF disponible',REJECTED:'Rechazada',CANCELLED:'Cancelada'};
export type CustomerProfile={documentType:string;documentNumber:string;birthDate:string;nationality:string;occupation:string;department:string;address:string;alternatePhone:string};
export type VehicleDetails={make:string;model:string;year:string;color:string;vin:string;use:string};
export const emptyProfile:CustomerProfile={documentType:'CEDULA',documentNumber:'',birthDate:'',nationality:'',occupation:'',department:'',address:'',alternatePhone:''};
export const emptyVehicle:VehicleDetails={make:'',model:'',year:'',color:'',vin:'',use:'Particular'};
export type Customer={id:string;fullName:string;email:string;phone:string;city:string;profile?:CustomerProfile;ownerUid:string;trial:true};
export type RequestRecord={id:string;clientId:string;clientName:string;agentUid:string;insurerId:string;productKey:string;plate:string;vehicle?:VehicleDetails;status:IssuanceStatus;files:Record<Slot,string>;pdf:string;policyNumber:string;startDate:string;endDate:string;premiumCents:number;currency:'USD'|'NIO';operatorUid:string;reason:string;revision:number;agentSeenRevision:number;trial:true};
const root=(name:string)=>collection(db,'companies',companyId,name);
const requestDoc=(id:string)=>doc(root('enterpriseIssuance'),id);
const path=(id:string,name:string)=>'companies/'+companyId+'/enterpriseTrial/'+id+'/'+name;
const feature=()=>doc(db,'companies',companyId,'settings','enterpriseTrial');
// Firebase enforces owner-only writes to settings; never trust the UI for authorization.
export async function setEnterpriseTrialEnabled(user:User,enabled:boolean){
 await setDoc(feature(),{enabled,updatedAt:serverTimestamp(),updatedBy:user.uid},{merge:true});
}
export function permissions(admin:boolean,roles:EnterpriseRole[],sections:Section[]){
 const canView=admin||(sections.includes('clientes')&&roles.some(r=>['direccion','ventas','operaciones','servicio'].includes(r)));
 return {canView,wide:canView&&(admin||roles.some(r=>['direccion','operaciones','servicio'].includes(r))),sales:canView&&(admin||roles.some(r=>['direccion','ventas'].includes(r))),operator:canView&&(admin||(sections.includes('polizas')&&roles.some(r=>['direccion','operaciones'].includes(r)))),issuance:canView&&(admin||sections.includes('polizas'))};
}
export function useEnterpriseRecords(uid:string,canView:boolean,wide:boolean){
 const [enabled,setEnabled]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [clients,setClients]=useState<Customer[]>([]),[requests,setRequests]=useState<RequestRecord[]>([]);
 useEffect(()=>{
  setEnabled(false);setClients([]);setRequests([]);setLoading(true);setError('');
  if(!canView||companyId!=='main'){setLoading(false);return;}
  let live=true;
  const stop=onSnapshot(feature(),s=>{if(live){setEnabled(s.data()?.enabled===true);setLoading(false);setError('');}},()=>{if(live){setEnabled(false);setLoading(false);setError('El entorno de validación aún no está habilitado o sus reglas no se han publicado.');}});
  return()=>{live=false;stop();};
 },[uid,canView]);
 useEffect(()=>{
  setClients([]);setRequests([]);
  if(!enabled||!canView)return;
  const scoped=(name:string,key:string)=>wide?root(name):query(root(name),where(key,'==',uid));
  let live=true;
  const fail=(e:Error)=>{if(live){setClients([]);setRequests([]);setError(e.message);}};
  const a=onSnapshot(scoped('enterpriseClients','ownerUid'),s=>{if(live)setClients(s.docs.map(d=>({...d.data(),id:d.id} as Customer)));},fail);
  const b=onSnapshot(scoped('enterpriseIssuance','agentUid'),s=>{if(live)setRequests(s.docs.map(d=>({...d.data(),id:d.id} as RequestRecord)));},fail);
  return()=>{live=false;a();b();};
 },[uid,enabled,canView,wide]);
 return {enabled,loading,error,clients,requests};
}
export type EnterpriseRecords=ReturnType<typeof useEnterpriseRecords>;
export async function createCustomer(user:User,values:Omit<Customer,'id'|'ownerUid'|'trial'>){
 const fullName=values.fullName.trim(),email=values.email.trim().toLowerCase(),phone=values.phone.trim(),city=values.city.trim();
 if(fullName.length<2||fullName.length>120||email.length>150||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))||phone.length>32||city.length>100)throw Error('Revisa los datos del cliente.');
 const profile=values.profile?Object.fromEntries(Object.entries(values.profile).map(([key,value])=>[key,value.trim()])) as CustomerProfile:undefined;
 if(profile&&(profile.documentNumber.length>40||profile.birthDate&&!/^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate)||profile.nationality.length>60||profile.occupation.length>100||profile.department.length>80||profile.address.length>240||profile.alternatePhone.length>32||!['CEDULA','PASAPORTE','RESIDENCIA','RUC','OTRO'].includes(profile.documentType)))throw Error('Revisa los datos adicionales del expediente.');
 const d=await addDoc(root('enterpriseClients'),{fullName,email,phone,city,...(profile?{profile}:{}),ownerUid:user.uid,trial:true,createdAt:serverTimestamp()});
 return d.id;
}
export async function createRequest(user:User,client:Customer,insurerId:string,plate:string,vehicle?:VehicleDetails){
 if(client.ownerUid!==user.uid)throw Error('Solo puedes crear solicitudes para tus clientes.');
 const clean=plate.trim().toUpperCase();if(!clean||clean.length>24)throw Error('Introduce una placa o referencia ficticia.');
 const detail=vehicle?Object.fromEntries(Object.entries(vehicle).map(([k,v])=>[k,v.trim()])) as VehicleDetails:undefined;
 if(detail&&(detail.make.length>60||detail.model.length>80||detail.year&&!/^\d{4}$/.test(detail.year)||detail.color.length>40||detail.vin.length>40||!['Particular','Comercial','Taxi','Motocicleta','Otro'].includes(detail.use)))throw Error('Revisa los datos del vehículo.');
 const d=await addDoc(root('enterpriseIssuance'),{...(detail?{vehicle:detail}:{}),clientId:client.id,clientName:client.fullName,agentUid:user.uid,insurerId,productKey:'VEHICLE_MANDATORY',plate:clean,files:{front:'',back:'',registration:''},status:'DRAFT',pdf:'',policyNumber:'',startDate:'',endDate:'',premiumCents:0,currency:'USD',operatorUid:'',reason:'',revision:0,agentSeenRevision:0,trial:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});return d.id;
}
const mimeExt:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
const maxUploadBytes=8*1024*1024;
export type AttachmentProgress={phase:'preparing'|'uploading'|'saving';percent:number;bytesTransferred?:number;totalBytes?:number;originalBytes?:number;paused?:boolean};
type ProgressCallback=(progress:AttachmentProgress)=>void;
async function detectImageType(file:Blob){
 const b=new Uint8Array(await file.slice(0,12).arrayBuffer());
 if(b[0]===255&&b[1]===216&&b[2]===255)return 'image/jpeg';
 if(b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)return 'image/png';
 if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return 'image/webp';
 throw Error('Formato no compatible. Selecciona una fotografía JPG, PNG o WebP; si es HEIC, conviértela a JPG.');
}
async function preparePhoto(file:File):Promise<Blob>{
 if(!file.size)throw Error('La fotografía está vacía.');
 if(file.size>40*1024*1024)throw Error('La imagen supera 40 MB. Elige una fotografía de menor tamaño.');
 const type=await detectImageType(file);
 const original=file.slice(0,file.size,type);
 if(original.size<=1024*1024)return original;
 const url=URL.createObjectURL(original);
 try{
  const image=new Image();
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('No se pudo leer la imagen.'));image.src=url;});
  const scale=Math.min(1,2600/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const ctx=canvas.getContext('2d');
  if(ctx){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
   // Retain full resolution when possible; keep original if re-encoding increases size.
   const compressed=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',0.88));
   if(compressed&&compressed.type==='image/jpeg'&&compressed.size>0&&compressed.size<original.size&&compressed.size<=maxUploadBytes)return compressed;
  }
 }catch{/* Fall back to validated original when browser cannot compress it. */}
 finally{URL.revokeObjectURL(url);}
 if(original.size>maxUploadBytes)throw Error('No se pudo reducir la fotografía a menos de 8 MB. Usa una imagen de menor resolución.');
 return original;
}
export function attachmentError(error:unknown){
 const code=typeof error==='object'&&error!==null&&'code' in error?String(error.code):'';
 const message=error instanceof Error?error.message:String(error);
 if(code==='storage/unauthorized')return 'Storage rechazó la carga. Comprueba tu acceso y las reglas publicadas. ('+code+')';
 if(code==='storage/retry-limit-exceeded')return 'La conexión tardó demasiado. Intenta de nuevo con una red estable. ('+code+')';
 if(code==='storage/quota-exceeded')return 'Storage alcanzó su cuota de uso. ('+code+')';
 if(code==='storage/canceled')return 'Carga cancelada. Puedes reintentar.';
 return message+(code&&!message.includes(code)?' ('+code+')':'');
}
async function upload(id:string,kind:Slot|'policy',file:File,onProgress?:ProgressCallback){
 onProgress?.({phase:'preparing',percent:0,originalBytes:file.size});
 const payload=kind==='policy'?file:await preparePhoto(file);
 const ext=kind==='policy'?(payload.type==='application/pdf'?'pdf':''):mimeExt[payload.type];
 if(!ext||payload.size<1||payload.size>maxUploadBytes)throw Error('Tipo no permitido o archivo superior a 8 MB.');
 if(kind==='policy'){
  const bytes=new Uint8Array(await payload.slice(0,5).arrayBuffer());
  if(String.fromCharCode(...bytes)!=='%PDF-')throw Error('El contenido no coincide con un PDF.');
 }
 const name=kind+'-'+crypto.randomUUID()+'.'+ext;
 const report=(bytesTransferred:number,totalBytes:number,paused=false)=>onProgress?.({phase:'uploading',percent:Math.min(100,Math.floor(bytesTransferred/totalBytes*100)),bytesTransferred,totalBytes,originalBytes:file.size,paused});
 report(0,payload.size);
 const task=uploadBytesResumable(ref(storage,path(id,name)),payload,{contentType:payload.type});
 await new Promise<void>((resolve,reject)=>{task.on('state_changed',s=>report(s.bytesTransferred,s.totalBytes,s.state==='paused'),reject,()=>resolve());});
 onProgress?.({phase:'saving',percent:100,bytesTransferred:payload.size,totalBytes:payload.size,originalBytes:file.size});
 return name;
}
async function change(id:string,fn:(current:RequestRecord)=>Record<string,unknown>){
 await runTransaction(db,async tx=>{const d=requestDoc(id),s=await tx.get(d);if(!s.exists())throw Error('Solicitud no encontrada.');const current={...s.data(),id:s.id} as RequestRecord;tx.update(d,fn(current));});
}
export async function attachDocument(user:User,record:RequestRecord,slot:Slot,file:File,onProgress?:ProgressCallback){
 if(record.agentUid!==user.uid||!['DRAFT','NEEDS_CORRECTION'].includes(record.status))throw Error('No puedes adjuntar a esta solicitud.');
 const name=await upload(record.id,slot,file,onProgress);
 await change(record.id,current=>{if(current.agentUid!==user.uid||!['DRAFT','NEEDS_CORRECTION'].includes(current.status))throw Error('La solicitud cambió.');return {files:{...current.files,[slot]:name},updatedAt:serverTimestamp()};});
}
async function verifyDocuments(r:RequestRecord){
 for(const slot of documentSlots){if(!r.files[slot])throw Error('Falta: '+slotLabels[slot]);const m=await getMetadata(ref(storage,path(r.id,r.files[slot])));if(!m.size||!m.contentType?.startsWith('image/'))throw Error('No se pudo verificar '+slotLabels[slot]);}
}
const sameFiles=(a:RequestRecord,b:RequestRecord)=>documentSlots.every(s=>a.files[s]===b.files[s]);
export async function submitRequest(user:User,r:RequestRecord){
 await verifyDocuments(r);
 await change(r.id,c=>{if(c.agentUid!==user.uid||!sameFiles(r,c))throw Error('La solicitud cambió. Revisa los adjuntos.');const revision=validateIssuanceTransition({from:c.status,to:'SUBMITTED',actor:'AGENT',expectedRevision:r.revision,currentRevision:c.revision,requiredKinds:mandatoryVehicleDocuments,verifiedKinds:mandatoryVehicleDocuments});return {status:'SUBMITTED',operatorUid:'',reason:'',revision,updatedAt:serverTimestamp()};});
}
export async function claimRequest(user:User,r:RequestRecord){
 await change(r.id,c=>{const revision=validateIssuanceTransition({from:c.status,to:'IN_REVIEW',actor:'OPERATOR',expectedRevision:r.revision,currentRevision:c.revision,requiredKinds:[],verifiedKinds:[]});return {status:'IN_REVIEW',operatorUid:user.uid,revision,updatedAt:serverTimestamp()};});
}
export async function returnRequest(user:User,r:RequestRecord,reason:string,reject=false){
 const clean=reason.trim();if(clean.length<2||clean.length>1000)throw Error('Indica el motivo de 2 a 1000 caracteres.');
 await change(r.id,c=>{if(c.operatorUid!==user.uid)throw Error('No eres el revisor asignado.');const status=reject?'REJECTED':'NEEDS_CORRECTION';const revision=validateIssuanceTransition({from:c.status,to:status,actor:'OPERATOR',expectedRevision:r.revision,currentRevision:c.revision,requiredKinds:[],verifiedKinds:[],reason:clean});return {status,reason:clean,revision,updatedAt:serverTimestamp()};});
}
export async function issueRequest(user:User,r:RequestRecord,details:{policyNumber:string;startDate:string;endDate:string;premiumCents:number;currency:'USD'|'NIO'},file:File){
 const policyNumber=details.policyNumber.trim();if(r.operatorUid!==user.uid||r.status!=='IN_REVIEW'||!policyNumber||policyNumber.length>100||!details.startDate||!details.endDate||details.endDate<details.startDate||!Number.isSafeInteger(details.premiumCents)||details.premiumCents<0||details.premiumCents>1000000000)throw Error('Revisa los datos de la póliza.');
 const pdf=await upload(r.id,'policy',file);const m=await getMetadata(ref(storage,path(r.id,pdf)));if(m.contentType!=='application/pdf'||!m.size)throw Error('PDF no verificado.');
 await change(r.id,c=>{if(c.operatorUid!==user.uid)throw Error('No eres el revisor asignado.');const revision=validateIssuanceTransition({from:c.status,to:'ISSUED',actor:'OPERATOR',expectedRevision:r.revision,currentRevision:c.revision,requiredKinds:[],verifiedKinds:['ISSUED_POLICY_PDF']});return {...details,policyNumber,pdf,status:'ISSUED',revision,updatedAt:serverTimestamp()};});
}
export async function markSeen(user:User,r:RequestRecord){
 await change(r.id,c=>{if(c.agentUid!==user.uid)throw Error('No autorizado.');return {agentSeenRevision:c.revision};});
}
export async function downloadAttachment(r:RequestRecord,name:string){
 if(!name||![...Object.values(r.files),r.pdf].includes(name))throw Error('Archivo no asociado a la solicitud.');
 const blob=await getBlob(ref(storage,path(r.id,name)),8*1024*1024);
 const url=URL.createObjectURL(blob);try{const a=document.createElement('a');a.href=url;a.download=name;a.click();}finally{setTimeout(()=>URL.revokeObjectURL(url),30000);}
}
export function unseen(r:RequestRecord,uid:string){return r.agentUid===uid&&r.agentSeenRevision<r.revision&&['ISSUED','NEEDS_CORRECTION','REJECTED'].includes(r.status);}

export async function readImageAttachment(r:RequestRecord,slot:Slot){const name=r.files[slot];if(!name)throw Error('Documento no disponible.');const blob=await getBlob(ref(storage,path(r.id,name)),8*1024*1024);if(!['image/jpeg','image/png','image/webp'].includes(blob.type))throw Error('No es una imagen compatible.');return blob;}
