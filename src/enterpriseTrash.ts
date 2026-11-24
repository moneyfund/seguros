import {collection,doc,getDocsFromServer,query,where,runTransaction,serverTimestamp,onSnapshot,type DocumentData} from 'firebase/firestore';
import {ref,listAll,deleteObject} from 'firebase/storage';
import type {User} from 'firebase/auth';
import {db,storage,companyId} from './firebase';
import {withDeadline} from './attachmentDeadline';
export type TrashKind='enterpriseClients'|'enterpriseIssuance';
export type TrashEntry={id:string;kind:TrashKind;record:DocumentData;movedAt?:{toDate?:()=>Date};movedBy:string;reason:string;purging:boolean};
const names:Record<TrashKind,string>={enterpriseClients:'enterpriseTrashClients',enterpriseIssuance:'enterpriseTrashIssuance'};
const root=(name:string)=>collection(db,'companies',companyId,name);
const source=(kind:TrashKind,id:string)=>doc(root(kind),id);
const trash=(kind:TrashKind,id:string)=>doc(root(names[kind]),id);
function cleanReason(value:string){const reason=value.trim();if(reason.length<3||reason.length>500)throw Error('Indica un motivo de 3 a 500 caracteres. No incluyas datos personales.');return reason;}
function audit(tx:Parameters<Parameters<typeof runTransaction>[1]>[0],user:User,kind:TrashKind,id:string,action:string,reason:string){
 tx.set(doc(root('enterpriseAdminAudit')),{targetType:kind,targetId:id,action,reason,actorUid:user.uid,createdAt:serverTimestamp()});
}
async function hasLinks(collectionName:string,field:string,id:string){
 return !(await getDocsFromServer(query(root(collectionName),where(field,'==',id)))).empty;
}
async function ensureUnlinked(kind:TrashKind,id:string,permanent:boolean){
 if(kind==='enterpriseClients'){
  if(await hasLinks('enterpriseIssuance','clientId',id))throw Error('Envía primero todas las pólizas y solicitudes de este cliente a la papelera.');
  if(permanent&&await hasLinks('enterpriseTrashIssuance','record.clientId',id))throw Error('Elimina definitivamente o restaura primero las pólizas de este cliente que siguen en la papelera.');
 }else if(await hasLinks('commissions','policyId',id))throw Error('Esta póliza tiene movimientos financieros asociados. Deben revisarse antes de retirarla o borrarla.');
}
export function subscribeTrash(kind:TrashKind,onRows:(rows:TrashEntry[])=>void,onError:(e:Error)=>void){
 return onSnapshot(root(names[kind]),snapshot=>onRows(snapshot.docs.map(d=>({...d.data(),id:d.id,kind} as TrashEntry))),onError);
}
/** Atomically remove the original and store its complete data, without copying or deleting files. */
export async function moveToTrash(user:User,kind:TrashKind,id:string,reason:string){
 const clean=cleanReason(reason);
 await ensureUnlinked(kind,id,false);
 await runTransaction(db,async tx=>{
  const original=source(kind,id),destination=trash(kind,id);
  const [record,existing]=await Promise.all([tx.get(original),tx.get(destination)]);
  if(!record.exists()||existing.exists())throw Error('El registro cambió o ya está en la papelera.');
  tx.set(destination,{record:record.data(),movedAt:serverTimestamp(),movedBy:user.uid,reason:clean,purging:false});
  tx.delete(original);
  audit(tx,user,kind,id,'ARCHIVE',clean);
 });
}
/** Preserve document ID, relationships and file paths when restoring. */
export async function restoreTrash(user:User,kind:TrashKind,id:string,reason:string){
 const clean=cleanReason(reason);
 await runTransaction(db,async tx=>{
  const destination=source(kind,id),entry=trash(kind,id);
  const [saved,existing]=await Promise.all([tx.get(entry),tx.get(destination)]);
  const data=saved.data();
  if(!data||existing.exists()||data.purging)throw Error('No se puede restaurar este registro.');
  if(kind==='enterpriseIssuance'){
   const customer=await tx.get(source('enterpriseClients',data.record.clientId));
   if(!customer.exists()||customer.data()?.archived)throw Error('Restaura primero el cliente asociado.');
  }
  tx.set(destination,{...data.record,archived:false});
  tx.delete(entry);
  audit(tx,user,kind,id,'RESTORE',clean);
 });
}
async function removeFolder(id:string){
 const folder=ref(storage,'companies/'+companyId+'/enterpriseTrial/'+id);
 const listed=await withDeadline(listAll(folder),25000,'No se pudo enumerar la carpeta de archivos. Reintenta.');
 if(listed.prefixes.length)throw Error('Hay subcarpetas inesperadas. Se requiere una revisión administrativa antes de continuar.');
 for(const item of listed.items){
  try{await withDeadline(deleteObject(item),25000,'No se confirmó el borrado de un archivo. Reintenta.');}
  catch(e){if(!(typeof e==='object'&&e!==null&&'code' in e&&e.code==='storage/object-not-found'))throw e;}
 }
 const remaining=await withDeadline(listAll(folder),25000,'No se pudo verificar que la carpeta esté vacía. Reintenta.');
 if(remaining.items.length||remaining.prefixes.length)throw Error('Todavía quedan archivos. Reintenta la eliminación.');
}
/** Once file cleanup begins, restore is disabled. A failed purge remains retryable. */
export async function purgeTrash(user:User,kind:TrashKind,id:string,reason:string){
 const clean=cleanReason(reason);
 await ensureUnlinked(kind,id,true);
 const entry=trash(kind,id);
 await runTransaction(db,async tx=>{
  const snapshot=await tx.get(entry),active=await tx.get(source(kind,id));
  if(!snapshot.exists()||active.exists())throw Error('El registro no está exclusivamente en la papelera.');
  if(!snapshot.data().purging)tx.update(entry,{purging:true});
 });
 if(kind==='enterpriseIssuance')await removeFolder(id);
 await ensureUnlinked(kind,id,true);
 await runTransaction(db,async tx=>{
  const snapshot=await tx.get(entry),active=await tx.get(source(kind,id));
  if(!snapshot.exists()||snapshot.data().purging!==true||active.exists())throw Error('La eliminación no se pudo confirmar.');
  tx.delete(entry);
  audit(tx,user,kind,id,'PURGE','Eliminación definitiva autorizada');
 });
}
