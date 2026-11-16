import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Archive,ArrowLeft,ArrowRight,AtSign,Building2,CheckCircle2,ChevronRight,Clock,File,FileText,Inbox,LockKeyhole,Mail,MailOpen,Paperclip,PenLine,RefreshCw,Search,Send,ShieldCheck,Trash2,TriangleAlert,Users,X} from 'lucide-react';
import type {User} from 'firebase/auth';
import type {LiveRecord} from './backend';
import {mailCall,fileAsBase64,fileLimit,downloadMailFile,type MailStatus,type Mailbox,type Header,type Detail,type Listing,type Folder,type AuditEntry} from './acosMail';
import './acos-mail.css';
const departmentLabels:Record<string,string>={direccion:'Dirección general',ventas:'Comercial y ventas',operaciones:'Operaciones y emisión',servicio:'Atención al cliente',finanzas:'Finanzas',supervision:'Supervisión'};
const folders:{id:Folder;label:string;icon:typeof Inbox}[]=[{id:'inbox',label:'Recibidos',icon:Inbox},{id:'sent',label:'Enviados',icon:Send},{id:'drafts',label:'Borradores',icon:FileText},{id:'archive',label:'Archivo',icon:Archive},{id:'spam',label:'No deseado',icon:TriangleAlert},{id:'trash',label:'Papelera',icon:Trash2}];
const blank={to:'',cc:'',subject:'',body:'',replyTo:''};
const date=(raw:string)=>{const d=new Date(raw);return isNaN(d.getTime())?raw.slice(0,40):new Intl.DateTimeFormat('es-NI',{dateStyle:'short',timeStyle:'short',timeZone:'America/Managua'}).format(d);};
const address=(raw:string)=>raw.match(/<([^<>\s]+@[^<>\s]+)>/)?.[1]||raw.match(/[\w.!#$%&'*+/=?^_`{|}~-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]||'';
const author=(raw:string)=>raw.replace(/<[^>]*>/g,'').replace(/^"|"$/g,'').trim()||address(raw)||'Remitente';
const fmtSize=(n:number)=>n>=1048576?(n/1048576).toFixed(1)+' MB':Math.ceil(n/1024)+' KB';
const folderLabel=(id:string)=>folders.find(f=>f.id===id)?.label||id;
export default function AcosMail({user,admin,members,oversight}:{user:User;admin:boolean;members:LiveRecord[];oversight:boolean}){
 const [status,setStatus]=useState<MailStatus|null>(null),[boxId,setBoxId]=useState(''),[folder,setFolder]=useState<Folder>('inbox'),[listing,setListing]=useState<Listing|null>(null),[selected,setSelected]=useState<Header|null>(null),[detail,setDetail]=useState<Detail|null>(null);
 const [loading,setLoading]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[search,setSearch]=useState('');
 const [dept,setDept]=useState('all'),[person,setPerson]=useState(''),[reason,setReason]=useState(''),[audit,setAudit]=useState<AuditEntry[]|null>(null);
 const [composer,setComposer]=useState(false),[draft,setDraft]=useState(blank),[files,setFiles]=useState<File[]>([]);
 const [showCC,setShowCC]=useState(false);
 const lock=useRef(false), alive=useRef(true), controller=useRef<AbortController|null>(null);
 const box=status?.mailboxes.find(b=>b.id===boxId&&(oversight?b.supervised:b.own));
 const allowedBoxes=status?.mailboxes.filter(b=>oversight?b.supervised:b.own)||[];
 const busy=!!loading;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort();};},[]);
 async function action<T>(label:string,work:(signal:AbortSignal)=>Promise<T>,done:(value:T)=>void){
  if(lock.current)return;
  lock.current=true;setLoading(label);setError('');setNotice('');
  const abort=new AbortController();controller.current=abort;
  try{const result=await work(abort.signal);if(alive.current&&!abort.signal.aborted)done(result);}
  catch(e){if(alive.current&&!abort.signal.aborted)setError(e instanceof Error?e.message:String(e));}
  finally{if(alive.current)setLoading('');lock.current=false;controller.current=null;}
 }
 function refreshStatus(){void action('Conectando con ACOS Mail…',s=>mailCall<MailStatus>(user,{action:'status'},s),value=>{setStatus(value);if(!oversight){const mine=value.mailboxes.filter(b=>b.own);setBoxId(old=>mine.some(b=>b.id===old)?old:mine[0]?.id||'');}else if(!value.mailboxes.some(b=>b.id===boxId&&b.supervised)){setBoxId('');setListing(null);clearReader();} });}
 useEffect(()=>{refreshStatus();},[user.uid]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(composer&&(draft.to||draft.body||draft.subject||files.length)){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[composer,draft,files.length]);
 function context(target:string,f:Folder){return {mailbox:target,folder:f,oversight,reason};}
 function clearReader(){setSelected(null);setDetail(null);}
 function loadFolder(target=boxId,f=folder,before=''){
  if(!target)return;
  if(oversight&&reason.trim().length<8){setError('Indica el motivo de consulta (mínimo 8 caracteres).');return;}
  void action('Consultando '+folderLabel(f).toLowerCase()+'…',s=>mailCall<Listing>(user,{action:'list',...context(target,f),before},s),data=>{
   setBoxId(target);setFolder(f);setListing(data);clearReader();setAudit(null);setSearch('');
  });
 }
 function selectBox(b:Mailbox){if(busy)return;setBoxId(b.id);setFolder('inbox');setListing(null);clearReader();setAudit(null);setSearch('');setError('');if(!oversight)loadFolder(b.id,'inbox');}
 function open(header:Header){
  if(!listing||!box||busy)return;
  setSelected(header);setDetail(null);
  void action('Abriendo mensaje…',s=>mailCall<Detail>(user,{action:'read',...context(box.id,folder),uid:header.uid,validity:listing.validity},s),setDetail);
 }
 function getAttachment(index:number){
  if(!selected||!listing||!box)return;
  void action('Descargando archivo…',s=>mailCall<{data:string;name:string}>(user,{action:'attachment',...context(box.id,folder),uid:selected.uid,validity:listing.validity,index},s),v=>downloadMailFile(v.data,v.name));
 }
 function markRead(){
  if(!selected||!box||!listing||oversight)return;
  const uid=selected.uid;
  void action('Marcando como leído…',s=>mailCall(user,{action:'markRead',...context(box.id,folder),uid,validity:listing.validity},s),()=>{setSelected(v=>v?{...v,unread:false}:v);setListing(v=>v?{...v,messages:v.messages.map(m=>m.uid===uid?{...m,unread:false}:m)}:v);});
 }
 function startCompose(reply=false){
  if(oversight||!box?.own||!status?.enabled)return;
  if(reply&&detail){if(composer&&(draft.subject||draft.body||draft.to)&&!window.confirm('¿Reemplazar el borrador abierto?'))return;setDraft({to:address(detail.from),cc:'',subject:/^re:/i.test(detail.subject)?detail.subject:'Re: '+detail.subject,body:'',replyTo:detail.messageId});setFiles([]);setShowCC(false);}
  else if(!composer){setDraft(blank);setFiles([]);setShowCC(false);}
  setComposer(true);setError('');setNotice('');
 }
 function resumeDraft(){
  if(oversight||folder!=='drafts'||!detail||!box?.own)return;
  if(detail.attachments.length){setError('Este borrador tiene adjuntos. Descárgalos y vuelve a agregarlos al editar.');return;}
  setDraft({to:detail.to.split(',').map(address).filter(Boolean).join(', '),cc:detail.cc.split(',').map(address).filter(Boolean).join(', '),subject:detail.subject,body:detail.body,replyTo:''});setFiles([]);setShowCC(!!detail.cc);setComposer(true);
 }
 function selectFiles(next:FileList|null){
  if(!next)return;
  const all=[...files,...Array.from(next)];
  if(all.length>5||all.reduce((n,f)=>n+f.size,0)>fileLimit){setError('Máximo cinco archivos y 2 MB en total.');return;}
  setFiles(all);setError('');
 }
 async function sendOrDraft(save:boolean){
  if(!box?.own||oversight||!status?.enabled||busy)return;
  if(!save&&!window.confirm('¿Enviar este correo a los destinatarios indicados?'))return;
  void action(save?'Guardando borrador…':'Enviando correo…',async s=>{
   const attachments=await Promise.all(files.map(async f=>({name:f.name,data:await fileAsBase64(f)})));
   return mailCall<{saved?:boolean;sent?:boolean;sentCopy?:boolean;refused?:string[]}>(user,{action:save?'draft':'send',...context(box.id,folder),...draft,attachments},s);
  },result=>{
   if(save&&result.saved){setNotice('Borrador guardado en Namecheap.');setComposer(false);setDraft(blank);setFiles([]);}
   else if(result.sent){setComposer(false);setDraft(blank);setFiles([]);setNotice(result.refused?.length?'Envío parcial. Algunos destinatarios fueron rechazados; verifica el resultado en Enviados.':result.sentCopy?'Correo aceptado por SMTP y guardado en Enviados.':'Correo aceptado por SMTP, pero no se pudo guardar una copia en Enviados. No lo reenvíes automáticamente.');}
  });
 }
 function showHistory(){void action('Consultando auditoría…',s=>mailCall<{entries:AuditEntry[]}>(user,{action:'audit'},s),v=>{setAudit(v.entries);setListing(null);clearReader();});}
 const activeMembers=members.filter(m=>m.active===true&&m.role!=='cliente'&&Object.prototype.hasOwnProperty.call(departmentLabels,String(m.department||m.role)));
 const scopedMembers=activeMembers.filter(m=>dept==='all'||String(m.department||m.role)===dept);
 const scopedBoxes=(status?.mailboxes||[]).filter(b=>(dept==='all'||b.department===dept)&&(!person||b.uids?.includes(person)));
 const visible=(listing?.messages||[]).filter(m=>[m.from,m.to,m.subject].join(' ').toLowerCase().includes(search.trim().toLowerCase()));
 const connected=status?.enabled===true;
 return <div className="am-shell">
  <div className="am-banner"><div className="am-banner-brand"><span className="am-logo"><Mail size={26}/></span><div><h2>{oversight?'Supervisión de correo':'ACOS Mail'}</h2><small>{oversight?'Dirección · Solo lectura':status?.domain||'Correo empresarial'}</small></div></div><div className="am-banner-actions"><span className="am-connection"><span/>{status?connected?'Configurado':'Por conectar':'Sin verificar'}</span><button type="button" className="am-icon-button" aria-label="Actualizar conexión" disabled={busy} onClick={refreshStatus}><RefreshCw size={18}/></button></div></div>
  <div className="am-notice"><ShieldCheck size={16}/><span>Uso corporativo. Los buzones autorizados pueden ser supervisados por Dirección con motivo y registro de acceso. No se conectan cuentas personales.</span></div>
  {error&&<div className="am-error" role="alert"><TriangleAlert size={18}/><span>{error}</span><button type="button" aria-label="Cerrar error" onClick={()=>setError('')}><X size={16}/></button></div>}
  {notice&&<div className="am-success" role="status"><CheckCircle2 size={18}/><span>{notice}</span><button type="button" aria-label="Cerrar aviso" onClick={()=>setNotice('')}><X size={16}/></button></div>}
  {loading&&<div className="am-loading" role="status"><span/>{loading}</div>}
  {status&&!connected&&<div className="am-connect"><AtSign size={25}/><div><strong>Conexión pendiente</strong><p>Se habilitará al configurar los buzones corporativos de Namecheap.</p></div></div>}
  {oversight&&admin&&<section className="am-directory"><div className="am-section-head"><div><h3><Building2 size={19}/> Departamentos</h3><p>Selecciona un área y un colaborador.</p></div><button type="button" className="btn btn-soft" disabled={busy} onClick={showHistory}><Clock size={16}/> Auditoría</button></div><div className="am-departments">{[{id:'all',label:'Todos'},...Object.entries(departmentLabels).map(([id,label])=>({id,label}))].map(d=><button type="button" disabled={busy} key={d.id} aria-pressed={dept===d.id} onClick={()=>{setDept(d.id);setPerson('');setBoxId('');setListing(null);clearReader();setAudit(null);}}><Building2 size={15}/><span>{d.label}</span><b>{d.id==='all'?activeMembers.length:activeMembers.filter(m=>String(m.department||m.role)===d.id).length}</b></button>)}</div>
   <div className="am-directory-grid"><label>Colaborador<select disabled={busy} value={person} onChange={e=>{setPerson(e.target.value);setBoxId('');setListing(null);clearReader();setAudit(null);}}><option value="">Todos los colaboradores del área</option>{scopedMembers.map(m=><option key={m.id} value={m.id}>{String(m.displayName||m.employeeCode||'Colaborador')} · {departmentLabels[String(m.department||m.role)]}</option>)}</select></label><label>Motivo de consulta<input maxLength={250} disabled={busy} value={reason} onChange={e=>{setReason(e.target.value);setListing(null);clearReader();}} placeholder="Ej. Seguimiento de solicitud"/></label></div>
   <div className="am-people">{scopedMembers.map(m=><div key={m.id} className="am-person"><span className="am-avatar">{String(m.displayName||'C').slice(0,2).toUpperCase()}</span><div><strong>{String(m.displayName||'Colaborador')}</strong><small>{String(m.employeeCode||departmentLabels[String(m.department||m.role)])}</small></div><span>{status?.mailboxes.some(b=>b.uids?.includes(m.id)&&b.supervised)?'Autorizado':'Sin buzón autorizado'}</span><button type="button" className="btn btn-soft" disabled={busy} onClick={()=>{setPerson(m.id);setBoxId('');setListing(null);clearReader();setAudit(null);}}>Ver buzones</button></div>)}</div>
   <h4>Buzones del área</h4>{scopedBoxes.length===0?<p className="am-empty-inline">Sin buzones conectados para esta selección.</p>:<div className="am-boxes">{scopedBoxes.map(b=><button key={b.id} type="button" aria-pressed={boxId===b.id} disabled={busy||!b.supervised} onClick={()=>selectBox(b)}><Mail size={19}/><span><strong>{b.label}</strong><small>{b.address}</small></span><small>{b.supervised?'Supervisión autorizada':'No autorizado'}</small><ChevronRight size={16}/></button>)}</div>}
   {box&&<button className="btn btn-dark" type="button" disabled={busy||reason.trim().length<8} onClick={()=>loadFolder(box.id,'inbox')}>Abrir buzón de {box.label} <ArrowRight size={16}/></button>}
  </section>}
  {!oversight&&connected&&!allowedBoxes.length&&<div className="am-connect"><LockKeyhole size={20}/><div><strong>No tienes un buzón asignado</strong><p>Dirección debe vincular tu usuario al correo corporativo.</p></div></div>}
  {!oversight&&<div className="am-account"><label>Mi buzón<select disabled={busy||!connected||composer} value={boxId} onChange={e=>{const b=allowedBoxes.find(x=>x.id===e.target.value);if(b)selectBox(b);}}><option value="">Seleccionar buzón</option>{allowedBoxes.map(b=><option key={b.id} value={b.id}>{b.address}</option>)}</select></label><button type="button" className="btn btn-dark" disabled={!connected||!box?.own||busy} onClick={()=>startCompose()}><PenLine size={18}/> Redactar</button>{box&&connected&&<button type="button" className="btn btn-soft" disabled={busy} onClick={()=>loadFolder(box.id,folder)}><RefreshCw size={16}/> Sincronizar</button>}</div>}
  {audit&&<section className="am-directory"><div className="am-section-head"><h3><Clock size={19}/> Consultas registradas</h3><button type="button" className="btn btn-soft" onClick={()=>setAudit(null)}>Cerrar</button></div>{!audit.length?<p className="am-empty-inline">Sin consultas registradas.</p>:<div className="am-audit">{audit.map((e,i)=><div key={e.createdAt+'-'+i}><strong>{e.mailboxId} · {e.action==='list'?'Bandeja':e.action==='read'?'Mensaje':'Adjunto'}</strong><small>{departmentLabels[e.department]} · {folderLabel(e.folder)} · {date(e.createdAt)}</small><p>{e.reason}</p><small>Usuario: {String(members.find(m=>m.id===e.actorUid)?.displayName||e.actorUid)}</small></div>)}</div>}</section>}
  {!audit&&<div className={'am-inbox '+(selected?'am-reading':'')}>
   <aside className="am-folders" aria-label="Carpetas de correo">{folders.map(f=><button type="button" key={f.id} disabled={!box||!connected||busy||oversight&&reason.trim().length<8} aria-pressed={folder===f.id} onClick={()=>loadFolder(boxId,f.id)}><f.icon size={19}/><span>{f.label}</span>{f.id==='inbox'&&folder==='inbox'&&listing&&<b>{listing.messages.filter(m=>m.unread).length}</b>}</button>)}</aside>
   <section className="am-list"><div className="am-list-head"><div><h3>{folderLabel(folder)}</h3><small>{box?.address||'Sin cuenta conectada'}</small></div><button type="button" className="am-icon-button" disabled={!box||!connected||busy} aria-label="Actualizar bandeja" onClick={()=>loadFolder()}><RefreshCw size={18}/></button></div><label className="am-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar en esta página" aria-label="Buscar correos"/></label>
    {visible.length===0?<div className="am-empty"><Inbox size={34}/><strong>{!connected?'Tu bandeja estará aquí':!listing?'Selecciona una carpeta':'No hay mensajes'}</strong><small>{!connected?'Conecta el correo empresarial para empezar.':!listing?'Consulta el buzón autorizado.':'Sin resultados en esta página.'}</small></div>:<div className="am-messages">{visible.map(m=><button type="button" key={m.uid} disabled={busy} className={(m.unread?'am-unread ':'')+(selected?.uid===m.uid?'am-selected':'')} onClick={()=>open(m)}><span className="am-avatar">{author(folder==='sent'?m.to:m.from).slice(0,2).toUpperCase()}</span><span className="am-message-text"><strong>{author(folder==='sent'?m.to:m.from)}</strong><span>{m.subject||'(Sin asunto)'}</span><small>{date(m.date)}{m.size?' · '+fmtSize(m.size):''}</small></span>{m.unread&&<i aria-label="No leído"/>}<ChevronRight size={15}/></button>)}</div>}
    {listing?.next&&<button type="button" className="btn btn-soft am-next" disabled={busy} onClick={()=>loadFolder(boxId,folder,listing.next)}>Mensajes anteriores <ChevronRight size={16}/></button>}
   </section>
   <section className="am-reader">{selected?<><div className="am-reader-head"><button type="button" className="btn btn-soft" onClick={clearReader}><ArrowLeft size={16}/> Volver</button>{!oversight&&selected.unread&&detail&&<button type="button" disabled={busy} className="btn btn-soft" onClick={markRead}><MailOpen size={16}/> Marcar leído</button>}</div>{detail?<><h3>{detail.subject||'(Sin asunto)'}</h3><div className="am-headers"><strong>{detail.from}</strong><small>Para: {detail.to||'—'}</small>{detail.cc&&<small>CC: {detail.cc}</small>}<small>{date(detail.date)}</small></div><pre className="am-body">{detail.body||'(Mensaje sin texto disponible)'}</pre>{detail.attachments.length>0&&<div className="am-attachments"><h4>Archivos adjuntos</h4>{detail.attachments.map(a=><button type="button" className="btn btn-soft" key={a.index} disabled={busy} onClick={()=>getAttachment(a.index)}><Paperclip size={16}/><span>{a.name} · {fmtSize(a.size)}</span></button>)}</div>}{!oversight&&<div className="am-reader-head"><button type="button" className="btn btn-dark" disabled={busy} onClick={()=>startCompose(true)}>Responder <ArrowRight size={16}/></button>{folder==='drafts'&&<button type="button" className="btn btn-soft" disabled={busy} onClick={resumeDraft}>Editar como nuevo borrador</button>}</div>}</>:<p className="am-empty-inline">{busy?'Abriendo…':'No se pudo abrir el contenido.'}</p>}</>:<div className="am-empty"><MailOpen size={36}/><strong>Selecciona un mensaje</strong></div>}</section>
  </div>}
  {!oversight&&composer&&box&&<div className="am-compose-backdrop" onClick={e=>{if(e.target===e.currentTarget&&!busy&&!draft.body&&!draft.to&&!draft.subject&&!files.length)setComposer(false);}}><form className="am-compose" onSubmit={(e:FormEvent)=>{e.preventDefault();void sendOrDraft(false);}}><div className="am-compose-head"><strong>Nuevo mensaje</strong><button type="button" aria-label="Cerrar composición" disabled={busy} onClick={()=>{if(!draft.body&&!draft.to&&!draft.subject||window.confirm('¿Cerrar sin guardar? Se perderá el borrador no guardado.')){setComposer(false);setDraft(blank);setFiles([]);}}}><X size={20}/></button></div><div className="am-compose-fields"><div><span>De</span><strong>{box.address}</strong></div><label>Para<input required value={draft.to} onChange={e=>setDraft(v=>({...v,to:e.target.value}))} placeholder="correo@empresa.com"/><button type="button" className="am-text-button" onClick={()=>setShowCC(!showCC)}>CC</button></label>{showCC&&<label>CC<input value={draft.cc} onChange={e=>setDraft(v=>({...v,cc:e.target.value}))}/></label>}<label>Asunto<input required maxLength={300} value={draft.subject} onChange={e=>setDraft(v=>({...v,subject:e.target.value}))}/></label><textarea aria-label="Mensaje" required maxLength={150000} placeholder="Escribe tu mensaje" value={draft.body} onChange={e=>setDraft(v=>({...v,body:e.target.value}))}/></div>{files.length>0&&<div className="am-files">{files.map((f,i)=><span key={i}><File size={14}/>{f.name}<button type="button" aria-label={'Quitar '+f.name} disabled={busy} onClick={()=>setFiles(v=>v.filter((_,j)=>i!==j))}><X size={15}/></button></span>)}</div>}<div className="am-compose-actions"><button type="submit" className="btn btn-dark" disabled={busy}><Send size={17}/> Enviar</button><label className="am-attach" aria-label="Adjuntar archivo"><Paperclip size={20}/><input type="file" multiple disabled={busy} onChange={e=>{selectFiles(e.target.files);e.target.value='';}}/></label><button type="button" className="btn btn-soft" disabled={busy} onClick={()=>void sendOrDraft(true)}>Guardar borrador</button></div>{error&&<p className="am-compose-error" role="alert">{error}</p>}</form></div>}
 </div>;
}
