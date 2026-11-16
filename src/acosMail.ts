import type {User} from 'firebase/auth';
export type Folder='inbox'|'sent'|'drafts'|'archive'|'trash'|'spam';
export type Mailbox={id:string;address:string;label:string;department:string;own:boolean;supervised:boolean;uids?:string[]};
export type MailStatus={enabled:boolean;domain:string;admin:boolean;mailboxes:Mailbox[]};
export type Header={uid:string;from:string;to:string;cc:string;subject:string;date:string;messageId:string;size:number;unread:boolean};
export type Detail=Omit<Header,'uid'|'size'|'unread'>&{body:string;attachments:{index:number;name:string;size:number}[]};
export type Listing={messages:Header[];validity:string;next:string};
export type AuditEntry={actorUid:string;mailboxId:string;department:string;action:string;folder:string;messageUid:string;reason:string;createdAt:string};
export async function mailCall<T>(user:User,data:Record<string,unknown>,signal?:AbortSignal):Promise<T>{
 const token=await user.getIdToken();
 const controller=new AbortController();const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
 if(signal?.aborted)controller.abort();
 const timer=setTimeout(abort,55000);
 try{
  const res=await fetch('/api/acos-mail',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(data),cache:'no-store',signal:controller.signal});
  const result=await res.json().catch(()=>({error:'El servidor de correo no está disponible.'}));
  if(!res.ok)throw Error(typeof result.error==='string'?result.error:'No se pudo completar la operación.');
  return result as T;
 }catch(e){if(controller.signal.aborted)throw Error('La conexión tardó demasiado. Si estabas enviando, revisa Enviados antes de reintentar.');throw e;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export const fileLimit=2*1024*1024;
export function fileAsBase64(file:File):Promise<string>{
 return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('No se pudo leer '+file.name));reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');reader.readAsDataURL(file);});
}
export function downloadMailFile(data:string,name:string){
 const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));
 const url=URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'}));
 const a=document.createElement('a');a.download=name;a.href=url;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
