import { useEffect,useState } from 'react';
import { collection,doc,onSnapshot,query,where,addDoc,setDoc,runTransaction,writeBatch,serverTimestamp, type DocumentReference } from 'firebase/firestore';
import { ref,uploadBytesResumable,getBlob,getMetadata,deleteObject } from 'firebase/storage';
import type { User } from 'firebase/auth';
import { db,storage,companyId } from './firebase';
import type { EnterpriseRole } from './backend';
import type { Section } from './data';
import {dateOnly} from './operationMath';
import {withDeadline} from './attachmentDeadline';
import {validateIssuanceTransition,mandatoryVehicleDocuments,type IssuanceStatus} from './issuanceWorkflow';

export const documentSlots=['front','back','registration'] as const;
export type Slot=typeof documentSlots[number];
export const slotLabels:Record<Slot,string>={front:'Cédula · frente',back:'Cédula · reverso',registration:'Circulación del vehículo'};
export const statusLabels:Record<IssuanceStatus,string>={DRAFT:'Borrador',SUBMITTED:'Recibida',IN_REVIEW:'En revisión',NEEDS_CORRECTION:'Requiere corrección',ISSUED:'PDF disponible',REJECTED:'Rechazada',CANCELLED:'Cancelada'};
export type CustomerProfile={documentType:string;documentNumber:string;birthDate:string;nationality:string;occupation:string;department:string;address:string;alternatePhone:string};
export type VehicleDetails={make:string;model:string;year:string;color:string;vin:string;use:string};
export const emptyProfile:CustomerProfile={documentType:'CEDULA',documentNumber:'',birthDate:'',nationality:'',occupation:'',department:'',address:'',alternatePhone:''};
export const emptyVehicle:VehicleDetails={make:'',model:'',year:'',color:'',vin:'',use:'Particular'};
export type Customer={id:string;fullName:string;email:string;phone:string;city:string;profile?:CustomerProfile;ownerUid:string;trial:true;archived?:boolean};
export type RequestRecord={id:string;clientId:string;clientName:string;agentUid:string;insurerId:string;productKey:string;plate:string;vehicle?:VehicleDetails;status:IssuanceStatus;files:Record<Slot,string>;pdf:string;policyNumber:string;startDate:string;endDate:string;premiumCents:number;currency:'USD'|'NIO';operatorUid:string;reason:string;revision:number;agentSeenRevision:number;trial:true;source?:'EXTERNAL';registeredBy?:string;archived?:boolean};
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
export function useEnterpriseRecords(uid:string,canView:boolean,wide:boolean,admin=false){
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
 const visibleClients=clients.filter(c=>!c.archived);
 const visibleRequests=requests.filter(r=>!r.archived&&visibleClients.some(c=>c.id===r.clientId)).map(r=>({...r,clientName:clients.find(c=>c.id===r.clientId)?.fullName||r.clientName}));
 return {enabled,loading,error,clients:visibleClients,requests:visibleRequests,archivedClients:admin?clients.filter(c=>c.archived):[],archivedRequests:admin?requests.filter(r=>r.archived):[]};
}
export type EnterpriseRecords=ReturnType<typeof useEnterpriseRecords>;
function cleanCustomer(values:Omit<Customer,'id'|'ownerUid'|'trial'>){
 const fullName=values.fullName.trim(),email=values.email.trim().toLowerCase(),phone=values.phone.trim(),city=values.city.trim();
 if(fullName.length<2||fullName.length>120||email.length>150||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))||phone.length>32||city.length>100)throw Error('Revisa los datos del cliente.');
 const profile=values.profile?Object.fromEntries(Object.entries(values.profile).map(([key,value])=>[key,value.trim()])) as CustomerProfile:undefined;
 if(profile&&(profile.documentNumber.length>40||profile.birthDate&&!/^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate)||profile.nationality.length>60||profile.occupation.length>100||profile.department.length>80||profile.address.length>240||profile.alternatePhone.length>32||!['CEDULA','PASAPORTE','RESIDENCIA','RUC','OTRO'].includes(profile.documentType)))throw Error('Revisa los datos adicionales del expediente.');
 return {fullName,email,phone,city,...(profile?{profile}:{})};
}
export async function createCustomer(user:User,values:Omit<Customer,'id'|'ownerUid'|'trial'>){
 const d=await addDoc(root('enterpriseClients'),{...cleanCustomer(values),ownerUid:user.uid,trial:true,createdAt:serverTimestamp()});
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
 if(code==='storage/unauthorized')return 'Storage rechazó la operación. Comprueba los permisos y las reglas publicadas. ('+code+')';
 if(code==='storage/object-not-found')return 'El archivo no existe en Storage. Solicita que se adjunte de nuevo. ('+code+')';
 if(code==='storage/retry-limit-exceeded')return 'Storage agotó el tiempo de conexión. Revisa la red y, si falla al leer, la configuración CORS del bucket. ('+code+')';
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
 await Promise.all(documentSlots.map(async slot=>{
  if(!r.files[slot])throw Error('Falta: '+slotLabels[slot]);
  const m=await withDeadline(getMetadata(ref(storage,path(r.id,r.files[slot]))),20000,'No se pudo verificar '+slotLabels[slot]+' a tiempo. Revisa la conexión e intenta nuevamente.');
  if(!m.size||!m.contentType?.startsWith('image/'))throw Error('No se pudo verificar '+slotLabels[slot]);
 }));
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
export async function issueRequest(user:User,r:RequestRecord,details:{policyNumber:string;startDate:string;endDate:string;premiumCents:number;currency:'USD'|'NIO'},file:File,onProgress?:ProgressCallback){
 const policyNumber=details.policyNumber.trim();if(r.operatorUid!==user.uid||r.status!=='IN_REVIEW'||!policyNumber||policyNumber.length>100||!details.startDate||!details.endDate||details.endDate<details.startDate||!Number.isSafeInteger(details.premiumCents)||details.premiumCents<0||details.premiumCents>1000000000)throw Error('Revisa los datos de la póliza.');
 const pdf=await upload(r.id,'policy',file,onProgress);const m=await withDeadline(getMetadata(ref(storage,path(r.id,pdf))),20000,'No se pudo verificar el PDF a tiempo. Revisa la conexión.');if(m.contentType!=='application/pdf'||!m.size)throw Error('PDF no verificado.');
 await change(r.id,c=>{if(c.operatorUid!==user.uid)throw Error('No eres el revisor asignado.');const revision=validateIssuanceTransition({from:c.status,to:'ISSUED',actor:'OPERATOR',expectedRevision:r.revision,currentRevision:c.revision,requiredKinds:[],verifiedKinds:['ISSUED_POLICY_PDF']});return {...details,policyNumber,pdf,status:'ISSUED',revision,updatedAt:serverTimestamp()};});
}
export async function markSeen(user:User,r:RequestRecord){
 await change(r.id,c=>{if(c.agentUid!==user.uid)throw Error('No autorizado.');return {agentSeenRevision:c.revision};});
}
// Authenticated reads only. No download-token URLs or persistent document cache.
export async function readAttachment(r:RequestRecord,name:string){
 if(!name||![...Object.values(r.files),r.pdf].includes(name))throw Error('Archivo no asociado a la solicitud.');
 const blob=await withDeadline(getBlob(ref(storage,path(r.id,name)),maxUploadBytes),25000,'La lectura excedió 25 segundos. Revisa la conexión y la configuración CORS de Storage; puedes reintentar sin cerrar el expediente.');
 if(!blob.size)throw Error('El documento está vacío.');
 if(name===r.pdf){if(blob.type!=='application/pdf')throw Error('El archivo no es un PDF válido.');}
 else if(!['image/jpeg','image/png','image/webp'].includes(blob.type))throw Error('El archivo no es una fotografía compatible.');
 return blob;
}
export function saveAttachment(blob:Blob,name:string){
 const url=URL.createObjectURL(blob);
 try{const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();}finally{setTimeout(()=>URL.revokeObjectURL(url),30000);}
}
export async function downloadAttachment(r:RequestRecord,name:string){saveAttachment(await readAttachment(r,name),name);}
export function unseen(r:RequestRecord,uid:string){return r.agentUid===uid&&r.agentSeenRevision<r.revision&&['ISSUED','NEEDS_CORRECTION','REJECTED'].includes(r.status);}

export async function readImageAttachment(r:RequestRecord,slot:Slot){return readAttachment(r,r.files[slot]);}

export type PolicyDetails={insurerId:string;plate:string;vehicle:VehicleDetails;policyNumber:string;startDate:string;endDate:string;premiumCents:number;currency:'USD'|'NIO'};
function cleanPolicy(values:PolicyDetails){
 const plate=values.plate.trim().toUpperCase(),policyNumber=values.policyNumber.trim();
 const vehicle=Object.fromEntries(Object.entries(values.vehicle).map(([k,v])=>[k,v.trim()])) as VehicleDetails;
 if(!['iniser','assa','america','lafise','mapfre'].includes(values.insurerId)||!plate||plate.length>24||!policyNumber||policyNumber.length>100||dateOnly(values.startDate)===null||dateOnly(values.endDate)===null||values.endDate<values.startDate||!Number.isSafeInteger(values.premiumCents)||values.premiumCents<0||values.premiumCents>1000000000||!['USD','NIO'].includes(values.currency))throw Error('Revisa los datos de la póliza.');
 if(vehicle.make.length>60||vehicle.model.length>80||vehicle.year&&!/^\d{4}$/.test(vehicle.year)||vehicle.color.length>40||vehicle.vin.length>40||!['Particular','Comercial','Taxi','Motocicleta','Otro'].includes(vehicle.use))throw Error('Revisa los datos del vehículo.');
 return {...values,plate,policyNumber,vehicle};
}
export async function registerExternalPolicy(user:User,customer:Omit<Customer,'id'|'ownerUid'|'trial'>|Customer,agentUid:string,details:PolicyDetails){
 const values=cleanPolicy(details);
 const existing='id' in customer;
 if(existing&& (customer.ownerUid!==agentUid||customer.archived))throw Error('La póliza debe asociarse al agente del expediente activo.');
 const clientRef=existing?doc(root('enterpriseClients'),customer.id):doc(root('enterpriseClients'));
 const policyRef=doc(root('enterpriseIssuance'));
 const batch=writeBatch(db);
 const personal=cleanCustomer(customer);
 if(!existing)batch.set(clientRef,{...personal,ownerUid:agentUid,trial:true,createdAt:serverTimestamp()});
 batch.set(policyRef,{...values,clientId:clientRef.id,clientName:personal.fullName,agentUid,productKey:'VEHICLE_MANDATORY',status:'ISSUED',files:{front:'',back:'',registration:''},pdf:'',operatorUid:'',reason:'',revision:0,agentSeenRevision:0,trial:true,source:'EXTERNAL',registeredBy:user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
 await batch.commit();return {clientId:clientRef.id,policyId:policyRef.id};
}
function adminReason(reason:string){const text=reason.trim();if(text.length<3||text.length>500)throw Error('Indica un motivo de 3 a 500 caracteres.');return text;}
async function adminChange(user:User,kind:'enterpriseClients'|'enterpriseIssuance',id:string,action:string,reason:string,fn:(data:Record<string,unknown>)=>Record<string,unknown>){
 const clean=adminReason(reason),target=doc(root(kind),id),audit=doc(root('enterpriseAdminAudit'));
 await runTransaction(db,async tx=>{
  const snap=await tx.get(target);if(!snap.exists())throw Error('El registro no existe.');
  const values=fn(snap.data());tx.update(target,{...values,adminUpdatedAt:serverTimestamp(),adminUpdatedBy:user.uid,adminReason:clean});
  tx.set(audit,{targetType:kind,targetId:id,action,reason:clean,actorUid:user.uid,createdAt:serverTimestamp()});
 });
}
export async function adminUpdateCustomer(user:User,c:Customer,values:Omit<Customer,'id'|'ownerUid'|'trial'>,reason:string){
 await adminChange(user,'enterpriseClients',c.id,'EDIT_CLIENT',reason,()=>cleanCustomer(values));
}
export async function adminUpdatePolicy(user:User,r:RequestRecord,values:PolicyDetails,reason:string){
 await adminChange(user,'enterpriseIssuance',r.id,'EDIT_POLICY',reason,current=>{if(current.status!=='ISSUED')throw Error('Solo se corrigen pólizas emitidas desde este formulario.');return {...cleanPolicy(values),updatedAt:serverTimestamp()};});
}
export async function adminArchive(user:User,kind:'enterpriseClients'|'enterpriseIssuance',id:string,reason:string,archived=true){
 await adminChange(user,kind,id,archived?'ARCHIVE':'RESTORE',reason,()=>({archived}));
}
export async function adminRemoveAttachment(user:User,r:RequestRecord,slot:Slot|'policy',reason:string){
 const clean=adminReason(reason),name=slot==='policy'?r.pdf:r.files[slot];
 if(!name)throw Error('No existe un archivo asociado.');
 // Storage and Firestore are not atomic; retain the pointer on failure so an owner can retry.
 try{await withDeadline(deleteObject(ref(storage,path(r.id,name))),25000,'No se confirmó la eliminación del archivo. Reintenta.');}catch(e){if(!(typeof e==='object'&&e!==null&&'code' in e&&e.code==='storage/object-not-found'))throw e;}
 await adminChange(user,'enterpriseIssuance',r.id,'DELETE_ATTACHMENT',clean,current=>{
  const files=current.files as Record<Slot,string>;
  if((slot==='policy'?current.pdf:files[slot])!==name)throw Error('El archivo asociado cambió; actualiza el expediente.');
  return slot==='policy'?{pdf:'',updatedAt:serverTimestamp()}:{files:{...files,[slot]:''},updatedAt:serverTimestamp()};
 });
}
export async function attachExternalDocument(user:User,r:RequestRecord,slot:Slot|'policy',file:File,onProgress?:ProgressCallback){
 if(r.source!=='EXTERNAL'||r.archived||r.status!=='ISSUED'||(slot==='policy'?r.pdf:r.files[slot]))throw Error('Solo puedes adjuntar documentos faltantes.');
 const name=await upload(r.id,slot,file,onProgress);
 await change(r.id,c=>{
  if(c.source!=='EXTERNAL'||c.archived||c.status!=='ISSUED'||(slot==='policy'?c.pdf:c.files[slot]))throw Error('El expediente cambió.');
  return slot==='policy'?{pdf:name,updatedAt:serverTimestamp()}:{files:{...c.files,[slot]:name},updatedAt:serverTimestamp()};
 });
}
