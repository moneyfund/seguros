import { ACOS_LOGO } from './acos-logo';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, reload, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, type User } from 'firebase/auth';
import { getDoc, onSnapshot } from 'firebase/firestore';
import {
  Activity, ArrowLeft, ArrowRight, Bell, CalendarClock, Camera, Check, CheckCircle2, ChevronRight,
  Clock3, CloudUpload, Database, FileText, Headphones, LayoutDashboard, LockKeyhole,
  LogOut, Menu, Plus, RefreshCw, Search, ShieldCheck, UserRound, Users, Wallet, X, type LucideIcon,
} from 'lucide-react';
import { auth, isInitialAdmin } from './firebase';
import {
  addLead, advanceLead, approveRequest, createTicket, memberFor, pendingRequests,
  memberRef, registerPolicy, requestAccess, requestRef, resolveTicket, subscribeRecords,
  uploadDocument, type AccessRequest, type EnterpriseRole, type LiveCollection, type LiveRecord
} from './backend';
import { money, navigationByRole, roles, type Section } from './data';
import { StaffApplicationForm, StaffApprovalCenter, StaffMembersCenter } from './StaffExperience';
import type { StaffMember } from './staff';
import PilotWorkspace from './PilotWorkspace';
import { AccessFlowGuide, RegistrationPreview, RoleViewPreview } from './AccessRoutes';
import { FlaskConical } from 'lucide-react';

const sections: Record<Section, { label: string; icon: LucideIcon }> = {
  resumen: { label: 'Vista general', icon: LayoutDashboard },
  prospectos: { label: 'Oportunidades', icon: Activity },
  polizas: { label: 'Pólizas y expedientes', icon: ShieldCheck },
  clientes: { label: 'Clientes', icon: Users },
  solicitudes: { label: 'Solicitudes', icon: Headphones },
  finanzas: { label: 'Comisiones', icon: Wallet },
  equipo: { label: 'Equipo y permisos', icon: UserRound },
  documentos: { label: 'Documentos', icon: FileText },
  configuracion: { label: 'Configuración', icon: Database }
};
const companyRoles: EnterpriseRole[] = ['direccion','ventas','operaciones','servicio','finanzas','supervision','cliente'];
const loadingText = 'Cargando entorno seguro…';
const readRoute = () => window.location.hash.replace(/^#\/?/, '').toLowerCase();
const readable = (value: unknown): string =>
  typeof value === 'number' ? new Intl.NumberFormat('es-NI').format(value)
  : typeof value === 'string' ? value : '—';
function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('auth/invalid-credential')) return 'Correo o contraseña incorrectos.';
  if (message.includes('auth/email-already-in-use')) return 'Ese correo ya tiene una cuenta.';
  if (message.includes('auth/weak-password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (message.includes('auth/operation-not-allowed')) return 'Activa el método Correo/Contraseña en Firebase Authentication.';
  if (message.includes('auth/unauthorized-domain')) return 'El dominio de Vercel debe autorizarse en Firebase Authentication.';
  if (message.includes('permission-denied') || message.includes('storage/unauthorized')) return 'Acceso rechazado: verifica que publicaste las reglas y que tu perfil esté autorizado.';
  if (message.includes('storage/retry-limit-exceeded')) return 'La carga no pudo completarse. Revisa Storage y la conexión.';
  return message;
}
function AuthBox({ user, stage, onRetry, onRequest, onBack, registrationMode }:{
 user: User | null;
 stage: 'signed-out'|'verify'|'request'|'pending'|'rejected';
 onRetry:()=>Promise<void>;
 onRequest:(name:string,role:EnterpriseRole)=>Promise<void>;
 onBack:()=>void;
 registrationMode:boolean;
}) {
 const [register,setRegister]=useState(registrationMode);
 useEffect(()=>{setRegister(registrationMode);},[registrationMode]);
 const googleLogin=()=>action(async()=>{ await signInWithPopup(auth,new GoogleAuthProvider()); });
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [name,setName]=useState('');
 const [area,setArea]=useState<EnterpriseRole>('ventas');
 async function action(work:()=>Promise<unknown>) {
   setBusy(true);setError('');
   try { await work(); } catch(e) { setError(friendlyError(e)); }
   finally { setBusy(false); }
 }
 async function authSubmit(e:FormEvent) {
   e.preventDefault();
   await action(async()=>{
     if(register) {
       const created=await createUserWithEmailAndPassword(auth,email.trim(),password);
       if(name.trim()) await updateProfile(created.user,{displayName:name.trim().slice(0,90)});
       await sendEmailVerification(created.user);
     } else {
       await signInWithEmailAndPassword(auth,email.trim(),password);
     }
   });
 }
 return <div className="live-auth-screen"><div className="live-auth-decoration"><div className="live-auth-orbit"/><ShieldCheck size={72} strokeWidth={1}/></div><div className="live-auth-card">
  <button className="live-back" onClick={onBack}><ArrowLeft size={16}/> Volver a la web</button>
  <div className="live-auth-brand acos-auth-logo"><img src={ACOS_LOGO} alt="ACOS — Logotipo oficial" /><span>ÁREA EMPRESARIAL SEGURA</span></div>
  {stage==='signed-out'&&<><div className="live-auth-title"><span>ACCESO EMPRESARIAL</span><h1>{register?'Solicita tu cuenta.':'Bienvenido de nuevo.'}</h1><p>{register?'Crea una cuenta y solicita autorización. Ninguna cuenta obtiene permisos automáticamente.':'Ingresa con tu correo empresarial y credenciales autorizadas.'}</p></div><form className="live-form" onSubmit={authSubmit}>
   {register&&<label>Nombre y apellido<input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo"/></label>}
   <label>Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nombre@empresa.com"/></label>
   <label>Contraseña<input type="password" minLength={6} autoComplete={register?'new-password':'current-password'} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/></label>
   {error&&<p className="live-error">{error}</p>}
   <button disabled={busy} className="btn btn-dark full" type="submit">{busy?'Procesando…':register?'Crear cuenta':'Iniciar sesión'} <ArrowRight size={16}/></button>
  </form><a className="access-guide-entry" href="#/accesos"><ShieldCheck size={15}/> Ver acceso de empleados, dirección y colaboradores <ArrowRight size={15}/></a><div className="live-google-divider">o accede con tu cuenta Google</div><button disabled={busy} className="live-google-btn" onClick={googleLogin}><span className="google-g">G</span> Continuar con Google <ArrowRight size={16}/></button><button className="live-switch" onClick={()=>{setRegister(!register);setError('');}}>{register?'¿Ya tienes una cuenta? Inicia sesión':'¿Aún no tienes acceso? Solicitar cuenta'}</button></>}
  {stage==='verify'&&<div className="live-auth-title"><span>VERIFICACIÓN OBLIGATORIA</span><h1>Revisa tu correo.</h1><p>Te enviamos un enlace de verificación a <strong>{user?.email}</strong>. Confírmalo y después actualiza tu acceso.</p><button disabled={busy} className="btn btn-dark full" onClick={()=>action(onRetry)}>Ya verifiqué mi correo <RefreshCw size={16}/></button><button className="live-switch" onClick={()=>action(async()=>{if(user)await sendEmailVerification(user);})}>Reenviar correo de verificación</button>{error&&<p className="live-error">{error}</p>}</div>}
  {stage==='request'&&<StaffApplicationForm user={user} onSubmitted={onRetry}/>}
  {stage==='rejected'&&<div className="live-auth-title"><span>SOLICITUD RECHAZADA</span><h1>No se habilitó tu acceso.</h1><p>Comunícate con dirección para revisar el resultado de tu solicitud. No adjuntes nuevamente documentos hasta que se autorice otra evaluación.</p></div>}
  {stage==='pending'&&<div className="live-auth-title"><span>ACCESO POR APROBAR</span><h1>Tu solicitud está en revisión.</h1><p>La dirección de la empresa debe autorizar tu perfil. Podrás entrar cuando se apruebe tu cuenta.</p><button disabled={busy} className="btn btn-dark full" onClick={()=>action(onRetry)}>Comprobar acceso <RefreshCw size={16}/></button>{error&&<p className="live-error">{error}</p>}</div>}
  {user&&<button className="live-switch" onClick={()=>void signOut(auth)}>Cerrar sesión · {user.email}</button>}
  <div className="live-auth-foot"><LockKeyhole size={14}/> Tus permisos se validan en Firebase, no en la interfaz.</div>
 </div><p className="live-auth-copyright">ACOS · PLATAFORMA EMPRESARIAL · XARCON 2026</p></div>;
}
type EntryModal = 'lead' | 'ticket' | 'policy' | 'file' | null;
const recordNames:LiveCollection[]=['leads','policies','tickets','commissions','documents','members'];
function accessibleCollections(role:EnterpriseRole,admin:boolean):LiveCollection[] {
  if(admin)return recordNames;
  switch(role) {
   case 'direccion':return recordNames.filter(n=>n!=='members');
   case 'ventas':return ['leads','policies','documents'];
   case 'operaciones':return ['policies','tickets','documents'];
   case 'servicio':return ['policies','tickets','documents'];
   case 'finanzas':return ['policies','commissions','documents'];
   case 'supervision':return ['leads','tickets','documents','members'];
   case 'cliente':return ['policies','tickets','documents'];
  }
}
function LivePanel({user,role,admin,grantedRoles,grantedSections,onPublic,route}:{
 user:User;role:EnterpriseRole;admin:boolean;grantedRoles:EnterpriseRole[];grantedSections:Section[]|null;onPublic:()=>void;route:string;
}) {
 const [section,setSection]=useState<Section|'piloto'|'roles-preview'|'registro-preview'|'sin-acceso'>('resumen');
 const [mobile,setMobile]=useState(false);
 const [search,setSearch]=useState('');
 const [rows,setRows]=useState<Partial<Record<LiveCollection,LiveRecord[]>>>({});
 const [pending,setPending]=useState<AccessRequest[]>([]);
 const [modal,setModal]=useState<EntryModal>(null);
 const [submitting,setSubmitting]=useState(false);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [roleSelections,setRoleSelections]=useState<Record<string,EnterpriseRole>>({});
 const fileInput=useRef<HTMLInputElement>(null);
 const [form,setForm]=useState({name:'',product:'Seguro de vida',amount:'',channel:'Web',type:'Consulta',detail:'',insurer:''});
 const activeTabs=admin?navigationByRole.direccion:(grantedSections!==null?grantedSections:navigationByRole[role]);
 const collections=useMemo(()=>{
   const viewFor:Partial<Record<LiveCollection,Section>>={
     leads:'prospectos',policies:'polizas',tickets:'solicitudes',
     commissions:'finanzas',documents:'documentos',members:'equipo'
   };
   const rolesForMember=grantedRoles.length?grantedRoles:[role];
   return [...new Set(rolesForMember.flatMap(r=>accessibleCollections(r,admin)))].filter(name=>{
     const view=viewFor[name];
     return !view || admin || activeTabs.includes(view);
   });
 },[role,admin,grantedRoles,activeTabs]);
 useEffect(()=>{
   const cleanups=collections.map(name=>subscribeRecords(name, data=>{
     setRows(prev=>({...prev,[name]:data}));
   },e=>setError('No pudimos consultar '+name+': '+friendlyError(e)),role==='cliente'&&['policies','tickets','documents'].includes(name)
      ? { field: 'clientUid' as const, uid: user.uid }
      : name==='leads'&&!admin&&!grantedRoles.some(r=>r==='direccion'||r==='supervision')
      ? { field: 'assignedToUid' as const, uid: user.uid }
      : name==='documents'&&!admin
      ? { field: 'uploaderUid' as const, uid: user.uid }
      : undefined));
   return ()=>cleanups.forEach(fn=>fn());
 },[collections,role,user.uid,admin,grantedRoles]);
 const refreshRequests=useCallback(async()=>{if(!admin)return;try{setPending(await pendingRequests());}catch(e){setError(friendlyError(e));}},[admin]);
 useEffect(()=>{if(admin)void refreshRequests();},[admin,refreshRequests]);
 const leads=rows.leads||[];
 const policies=rows.policies||[];
 const tickets=rows.tickets||[];
 const commissions=rows.commissions||[];
 const documents=rows.documents||[];
 const members=rows.members||[];
 const matches=(row:LiveRecord)=>JSON.stringify(row).toLowerCase().includes(search.toLowerCase());
 const filtered=(items:LiveRecord[])=>items.filter(matches);
 const name=roles.find(r=>r.id===role)?.label||role;
 const displaySection=section==='piloto'?'Laboratorio operativo':section==='roles-preview'?'Vista de colaboradores':section==='registro-preview'?'Registro de empleados':section==='sin-acceso'?'Acceso restringido':sections[section].label;
 const hasStaffRole=(allowed:EnterpriseRole[])=>admin||grantedRoles.some(r=>allowed.includes(r));
 const canSales=activeTabs.includes('prospectos')&&hasStaffRole(['direccion','ventas','supervision']);
 const canOperate=activeTabs.includes('polizas')&&hasStaffRole(['direccion','operaciones']);
 const canService=activeTabs.includes('solicitudes')&&hasStaffRole(['direccion','servicio','operaciones']);
 const canUpload=admin||activeTabs.includes('documentos');
 const canManage=admin;
 const go=(tab:Section)=>{
   if(!admin&&!activeTabs.includes(tab))return;
   setSection(tab);setMobile(false);setSearch('');setError('');
   window.location.hash='#/modulo/'+tab;
 };
 const special=(destination:string)=>{
   setMobile(false);setError('');setNotice('');
   window.location.hash='#/'+destination;
 };
 useEffect(()=>{
   if(admin && route==='direccion/solicitudes'){setSection('equipo');return;}
   if(admin && (route==='direccion/vistas'||route==='mi-panel')){setSection('roles-preview');return;}
   if(!admin && route.startsWith('direccion/')){setSection('sin-acceso');return;}
   if(admin && route==='registro'){setSection('registro-preview');return;}
   if(admin && route==='laboratorio'){setSection('piloto');return;}
   if(route.startsWith('modulo/')){
     const tab=route.slice('modulo/'.length) as Section;
     setSection(activeTabs.includes(tab)?tab:activeTabs[0]||'resumen');return;
   }
   setSection(activeTabs.includes('resumen')?'resumen':activeTabs[0]||'resumen');
 },[route,admin,activeTabs]);
 function clearForm(){setForm({name:'',product:'Seguro de vida',amount:'',channel:'Web',type:'Consulta',detail:'',insurer:''});setModal(null);}
 async function submit(e:FormEvent) {
   e.preventDefault();setSubmitting(true);setError('');
   try {
     if(modal==='lead')await addLead({name:form.name,product:form.product,value:Number(form.amount),channel:form.channel},user);
     if(modal==='ticket')await createTicket({subject:form.name,detail:form.detail,type:form.type},user,role);
     if(modal==='policy')await registerPolicy({clientName:form.name,insurer:form.insurer,product:form.product,premium:Number(form.amount)},user);
     setNotice('Registro guardado en Firestore.');
     clearForm();
   }catch(e){setError(friendlyError(e));}finally{setSubmitting(false);}
 }
 async function pickFile(files:FileList|null) {
   if(!files?.length)return;
   setSubmitting(true);setError('');
   try {await uploadDocument(files[0],user,role);setNotice('Documento almacenado en Firebase Storage y registrado en Firestore.');setModal(null);}
   catch(e){setError(friendlyError(e));}finally{setSubmitting(false);}
 }
 async function approve(item:AccessRequest) {
   setSubmitting(true);setError('');
   try{await approveRequest(item,roleSelections[item.id]||'ventas');setNotice('Perfil autorizado. El usuario debe actualizar su sesión.');await refreshRequests();}
   catch(e){setError(friendlyError(e));}finally{setSubmitting(false);}
 }
 return <div className="app-shell live-shell">
  {mobile&&<button className="sidebar-scrim" onClick={()=>setMobile(false)} aria-label="Cerrar menú"/>}
  <aside className={'sidebar '+(mobile?'sidebar-open':'')}>
   <div className="sidebar-top"><div className="acos-sidebar-brand"><img src={ACOS_LOGO} alt="ACOS" /><span>GESTIÓN DE SEGUROS</span></div><button className="mobile-close" onClick={()=>setMobile(false)} aria-label="Cerrar menú"><X size={19}/></button></div>
   <div className="workspace-title">MI ESPACIO <span className="workspace-demo live-environment">FIREBASE</span></div>
   <div className="workspace-profile"><span className="workspace-avatar">{user.email?.slice(0,2).toUpperCase()}</span><div className="workspace-profile-copy"><strong>{user.displayName||user.email?.split('@')[0]}</strong><span>{name}</span></div><ShieldCheck size={15}/></div>
   <div className="sidebar-group-label">MÓDULOS AUTORIZADOS</div>
   <nav className="sidebar-nav" aria-label="Áreas del sistema">{activeTabs.map(tab=>{const Icon=sections[tab].icon;const count=tab==='prospectos'?leads.length:tab==='polizas'?policies.length:tab==='solicitudes'?tickets.filter(t=>t.status!=='Resuelto').length:tab==='documentos'?documents.length:0;return <button key={tab} className={'sidebar-item '+(section===tab?'active':'')} onClick={()=>go(tab)}><Icon size={18}/><span>{sections[tab].label}</span>{count>0&&<i>{count}</i>}</button>;})}{admin&&<>
    <div className="sidebar-group-label">CONTROL DE ACCESOS</div>
    <button className={'sidebar-item '+(route==='direccion/solicitudes'?'active':'')} onClick={()=>special('direccion/solicitudes')}><UserRound size={18}/><span>Solicitudes de personal</span></button>
    <button className={'sidebar-item '+(route==='direccion/vistas'?'active':'')} onClick={()=>special('direccion/vistas')}><LayoutDashboard size={18}/><span>Vista de colaboradores</span></button>
    <button className={'sidebar-item '+(route==='registro'?'active':'')} onClick={()=>special('registro')}><ShieldCheck size={18}/><span>Ver proceso de registro</span></button>
    <button className={'sidebar-item '+(section==='piloto'?'active':'')} onClick={()=>special('laboratorio')}><FlaskConical size={18}/><span>Laboratorio operativo</span></button>
    </>}</nav>
   <div className="sidebar-spacer"/>
   <div className="live-sidebar-links"><button onClick={()=>special('accesos')}><ShieldCheck size={16}/> Guía de accesos</button><button onClick={onPublic}><ArrowLeft size={16}/> Sitio público</button><button onClick={()=>void signOut(auth)}><LogOut size={16}/> Cerrar sesión</button></div>
   <div className="sidebar-bottom"><strong className="live-brand-sign">X</strong><div><strong>ACOS · POWERED BY XARCON</strong><small>Gestión profesional de seguros</small></div></div>
  </aside>
  <div className="app-main">
   <header className="app-topbar"><div className="breadcrumbs"><button className="mobile-menu" onClick={()=>setMobile(true)} aria-label="Abrir menú"><Menu size={23}/></button><span>Empresa</span><ChevronRight size={14}/><strong>{displaySection}</strong></div><div className="topbar-right"><span className="demo-top-note"><span/> SESIÓN VERIFICADA</span><button className="live-top-docs" title="Ir al centro documental" onClick={()=>go('documentos')}><FileText size={16}/><span>Documentos</span></button><button className="live-top-signout" title="Cerrar sesión" onClick={()=>void signOut(auth)}><LogOut size={15}/></button><span className="topbar-avatar">{(user.displayName||user.email||'US').slice(0,2).toUpperCase()}</span></div></header>
   <main className="workspace live-workspace">
    <div className="date-line"><CalendarClock size={15}/> ACOS · PLATAFORMA EMPRESARIAL <span className="live-crumb-separator">/</span> {name.toUpperCase()} <span className="live-crumb-separator">/</span> {displaySection.toUpperCase()}</div>
    <div className="live-title-row"><div><h1>{displaySection}</h1><p>Registros sincronizados con tu espacio privado. Acceso y operaciones sujetos a permisos.</p></div><div className="live-actions">{section==='prospectos'&&canSales&&<button className="btn btn-dark" onClick={()=>setModal('lead')}><Plus size={16}/> Nueva oportunidad</button>}{section==='solicitudes'&&<button className="btn btn-dark" onClick={()=>setModal('ticket')}><Plus size={16}/> Nueva solicitud</button>}{section==='polizas'&&canOperate&&<button className="btn btn-dark" onClick={()=>setModal('policy')}><Plus size={16}/> Expediente preliminar</button>}{section==='documentos'&&canUpload&&<button className="btn btn-dark" onClick={()=>setModal('file')}><CloudUpload size={16}/> Subir archivo</button>}</div></div>
    {error&&<div className="live-error-banner"><LockKeyhole size={16}/><span>{error}</span><button onClick={()=>setError('')} aria-label="Cerrar error"><X size={16}/></button></div>}
    {notice&&<div className="live-success-banner"><CheckCircle2 size={17}/><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Cerrar aviso"><X size={16}/></button></div>}
    <div className="live-body">
     {section==='piloto'&&admin&&<PilotWorkspace user={user}/>}
     {section==='roles-preview'&&admin&&<RoleViewPreview/>}
     {section==='registro-preview'&&admin&&<RegistrationPreview/>}
     {section==='sin-acceso'&&!admin&&<div className="data-card live-narrow"><div className="live-empty"><LockKeyhole size={32}/><strong>Acceso reservado a Dirección</strong><p>Esta cuenta no tiene permisos administrativos. Tu panel muestra únicamente las vistas aprobadas para tu usuario.</p><button className="btn btn-dark" onClick={()=>special('mi-panel')}>Abrir mi panel <ArrowRight size={16}/></button></div></div>}
     {section==='resumen'&&<><div className="live-home-intro"><div><span className="live-home-eyebrow">CENTRO DE OPERACIONES / {name.toUpperCase()}</span><h2>{role==='cliente'?'Tu protección, organizada.':'Tu operación, a primera vista.'}</h2><p>Consulta la información disponible para tu perfil y continúa tus gestiones desde un solo lugar.</p></div><span className="live-home-security"><ShieldCheck size={16}/> Acceso controlado</span></div>
      <div className="metric-grid live-metric-grid">
       {[
         {label:role==='cliente'?'Mis pólizas':'Oportunidades',count:role==='cliente'?policies.length:leads.length,sub:role==='cliente'?'Coberturas asociadas':'Prospectos registrados',icon:Activity,tab:(role==='cliente'?'polizas':'prospectos') as Section},
         {label:'Pólizas en cartera',count:policies.length,sub:'Expedientes visibles',icon:ShieldCheck,tab:'polizas' as Section},
         {label:'Solicitudes abiertas',count:tickets.filter(t=>t.status!=='Resuelto').length,sub:'En seguimiento',icon:Headphones,tab:'solicitudes' as Section},
         {label:'Archivos digitales',count:documents.length,sub:'Documentos disponibles',icon:FileText,tab:'documentos' as Section}
       ].filter(metric=>activeTabs.includes(metric.tab)).map(metric=><button key={metric.label} className="metric live-metric-button" onClick={()=>go(metric.tab)}><span className="live-metric-label">{metric.label}<metric.icon size={19}/></span><strong>{metric.count}</strong><small>{metric.sub}<ArrowRight size={13}/></small></button>)}
      </div>
      <div className="live-work-panels"><section className="data-card live-workqueue"><div className="data-card-head"><div><span className="live-card-eyebrow">PRIORIDADES</span><h3>Actividad de la operación</h3><p>Seguimiento sobre registros existentes, sin indicadores inventados.</p></div><Clock3 size={18}/></div><div className="live-work-items">
       {([
         {key:'polizas' as Section,icon:ShieldCheck,label:'Pólizas en seguimiento',detail:policies.length?policies.length+' expedientes disponibles':'Comienza registrando tus expedientes',count:policies.length},
         {key:'solicitudes' as Section,icon:Headphones,label:'Atención al asegurado',detail:tickets.length?tickets.filter(t=>t.status!=='Resuelto').length+' casos pendientes':'Ninguna solicitud pendiente',count:tickets.filter(t=>t.status!=='Resuelto').length},
         {key:'documentos' as Section,icon:FileText,label:'Centro documental',detail:documents.length?documents.length+' archivos cargados':'Documentos privados y organizados',count:documents.length}
       ]).filter(item=>activeTabs.includes(item.key)).map(item=><button key={item.key} onClick={()=>go(item.key)}><span className="live-work-icon"><item.icon size={18}/></span><span><strong>{item.label}</strong><small>{item.detail}</small></span><span className="live-work-count">{item.count.toString().padStart(2,'0')}</span><ChevronRight size={17}/></button>)}
       </div></section>
       <section className="data-card live-quick-panel"><div className="data-card-head"><div><span className="live-card-eyebrow">ACCESOS RÁPIDOS</span><h3>Tu espacio de trabajo</h3><p>Herramientas disponibles según tus permisos.</p></div></div><div className="live-quick-grid">
       {activeTabs.filter(x=>x!=='resumen'&&x!=='configuracion').slice(0,6).map(x=>{const Icon=sections[x].icon;return <button key={x} onClick={()=>go(x)}><Icon size={20}/><span>{sections[x].label}</span><ArrowRight size={14}/></button>})}
       </div><div className="live-quick-footer"><LockKeyhole size={14}/><span>La plataforma consulta Firestore según tus permisos.</span></div></section>
      </div></>}
     {section!=='resumen'&&section!=='configuracion'&&section!=='piloto'&&section!=='roles-preview'&&section!=='registro-preview'&&section!=='sin-acceso'&&<>
      <div className="live-search-row"><label><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar registros…" /></label><span><Database size={15}/> ORIGEN: FIRESTORE</span></div>
      {(section==='prospectos'||section==='polizas'||section==='solicitudes'||section==='finanzas'||section==='documentos')&&(()=>{
        const kind:LiveCollection=section==='prospectos'?'leads':section==='polizas'?'policies':section==='solicitudes'?'tickets':section==='finanzas'?'commissions':'documents';
        const data=filtered(rows[kind]||[]);
        return <div className="data-card live-list"><div className="data-card-head"><div><h3>{displaySection}</h3><p>Registros asociados a tu nivel de acceso.</p></div><span className="table-count">{data.length} registros</span></div>
        {data.length===0?<div className="live-empty"><Database size={29}/><strong>Sin registros disponibles</strong><p>Todavía no hay registros para esta sección. Puedes comenzar con una nueva operación cuando tu perfil tenga autorización.</p></div>:<div className="table-wrap"><table><thead><tr><th>REFERENCIA</th><th>DETALLE</th><th>CLASIFICACIÓN</th><th>VALOR / TAMAÑO</th><th>ESTADO</th><th/></tr></thead><tbody>{data.map(record=><tr key={record.id}>
          <td className="td-id">{record.id.slice(0,11)}</td>
          <td className="strong-cell">{readable(record.name||record.clientName||record.subject||record.fileName||record.policyId)}</td>
          <td>{readable(record.product||record.type||record.insurer||record.contentType)}</td>
          <td>{kind==='leads'?money(Number(record.estimatedPremium)||0):kind==='policies'?money(Number(record.premium)||0):kind==='commissions'?money(Number(record.amount)||0):kind==='documents'?Math.round(Number(record.bytes||0)/1024)+' KB':'—'}</td>
          <td><span className="live-status">{readable(record.status||'Registrado')}</span></td>
          <td>{kind==='leads'&&canSales&&record.status!=='Ganado'&&<button className="live-row-button" title="Avanzar etapa" onClick={async()=>{try{await advanceLead(record);}catch(e){setError(friendlyError(e));}}}>Siguiente <ArrowRight size={14}/></button>}{kind==='tickets'&&canService&&record.status!=='Resuelto'&&<button className="live-row-button" onClick={async()=>{try{await resolveTicket(record.id);}catch(e){setError(friendlyError(e));}}}>Resolver <Check size={14}/></button>}</td>
         </tr>)}</tbody></table></div>}</div>;
      })()}
     </>}
     {section==='clientes'&&<div className="data-card live-narrow"><div className="live-empty"><Users size={30}/><strong>Directorio centralizado de clientes</strong><p>La colección de clientes se habilitará tras aprobar los campos, el consentimiento y las reglas de acceso. Por seguridad, todavía no se recopilan cédulas ni datos de salud.</p></div></div>}
     {section==='equipo'&&<>
      {canManage?<><StaffApprovalCenter user={user}/>{route!=='direccion/solicitudes'&&<StaffMembersCenter members={members as unknown as StaffMember[]}/>}</>:<div className="data-card live-list"><div className="data-card-head"><div><h3>Equipo autorizado</h3><p>Consulta de miembros según tu nivel de acceso.</p></div></div>
      {members.length===0?<div className="live-empty"><Users size={28}/><strong>Sin miembros disponibles</strong></div>:<div className="table-wrap"><table><thead><tr><th>COLABORADOR</th><th>ÁREA</th><th>ESTADO</th></tr></thead><tbody>{filtered(members).map(m=><tr key={m.id}><td>{readable(m.displayName)}</td><td>{readable(m.department||m.role)}</td><td>{m.active===true?'Activo':'Inactivo'}</td></tr>)}</tbody></table></div>}</div>}
     </>}
     {section==='configuracion'&&<div className="data-card live-narrow"><div className="live-feature-details"><h3>Sesión ACOS autorizada</h3><p><LockKeyhole size={16}/> {user.email}</p><p><ShieldCheck size={16}/> {name}</p><p><Database size={16}/> Proyecto Firebase: seguros-d1a86</p><p><CheckCircle2 size={16}/> Correo verificado</p><small>Las reglas de Firestore y Storage deben desplegarse desde Firebase. Un rol mostrado aquí nunca sustituye la validación en el servidor.</small></div></div>}
    </div><footer className="workspace-footer"><span>ACOS · SISTEMA DE GESTIÓN EMPRESARIAL</span><span>Acceso por rol validado con Firebase Authentication</span></footer>
   </main>
  </div>
  {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)clearForm();}}><div className="modal" role="dialog" aria-modal="true"><div className="modal-header"><div><span className="eyebrow">REGISTRO FIREBASE</span><h2>{modal==='lead'?'Nueva oportunidad':modal==='ticket'?'Nueva solicitud':modal==='policy'?'Expediente preliminar':'Adjuntar documento'}</h2><p>Esta acción afecta los datos reales de la empresa.</p></div><button className="icon-btn" onClick={clearForm} aria-label="Cerrar"><X size={18}/></button></div>{modal==='file'?<div className="live-file-form"><p>Se subirán documentos PDF o imágenes (máximo 8 MB), sujetos a las reglas privadas de Cloud Storage.</p><button className="btn btn-dark full" disabled={submitting} onClick={()=>fileInput.current?.click()}><CloudUpload size={16}/> {submitting?'Subiendo…':'Elegir desde el dispositivo'}</button><input ref={fileInput} hidden type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={e=>{void pickFile(e.target.files);e.target.value='';}}/><button className="btn btn-soft full" disabled={submitting} onClick={()=>document.getElementById('live-camera-input')?.click()}><Camera size={16}/> Abrir cámara</button><input hidden id="live-camera-input" type="file" accept="image/*" capture="environment" onChange={e=>{void pickFile(e.target.files);e.target.value='';}}/></div>:<form className="modal-form" onSubmit={e=>void submit(e)}>
      <label>{modal==='lead'?'Nombre del prospecto':modal==='policy'?'Nombre de referencia del cliente':'Asunto de la solicitud'}<input required minLength={2} value={form.name} onChange={e=>setForm(s=>({...s,name:e.target.value}))} placeholder={modal==='ticket'?'Ej. Solicitud de seguimiento':'Nombre de ejemplo'}/></label>
      {modal==='ticket'?<><label>Tipo<select value={form.type} onChange={e=>setForm(s=>({...s,type:e.target.value}))}><option>Consulta</option><option>Modificación</option><option>Renovación</option><option>Siniestro</option></select></label><label>Detalle<textarea required maxLength={2000} rows={4} value={form.detail} onChange={e=>setForm(s=>({...s,detail:e.target.value}))}/></label></>:<><label>Producto<select value={form.product} onChange={e=>setForm(s=>({...s,product:e.target.value}))}><option>Seguro de vida</option><option>Seguro vehicular</option><option>Seguro de salud</option><option>Seguro empresarial</option></select></label>{modal==='policy'&&<label>Aseguradora<input required value={form.insurer} onChange={e=>setForm(s=>({...s,insurer:e.target.value}))} placeholder="Nombre de aseguradora"/></label>}{modal==='lead'&&<label>Origen<select value={form.channel} onChange={e=>setForm(s=>({...s,channel:e.target.value}))}><option>Web</option><option>WhatsApp</option><option>Referido</option><option>Redes</option></select></label>}<label>{modal==='lead'?'Prima estimada (USD)':'Prima de referencia (USD)'}<input type="number" min={0} required value={form.amount} onChange={e=>setForm(s=>({...s,amount:e.target.value}))}/></label></>}
      {error&&<p className="live-error">{error}</p>}
      <button type="submit" className="btn btn-dark full" disabled={submitting}>{submitting?'Guardando…':'Registrar en Firestore'} <ArrowRight size={16}/></button>
    </form>}</div></div>}
 </div>;
}
export default function ConnectedWorkspace({onPublic}:{onPublic:()=>void}){
 const [user,setUser]=useState<User|null>(null);
 const [route,setRoute]=useState(readRoute);
 useEffect(()=>{
   const update=()=>setRoute(readRoute());
   window.addEventListener('hashchange',update);
   window.addEventListener('popstate',update);
   return()=>{window.removeEventListener('hashchange',update);window.removeEventListener('popstate',update);};
 },[]);
 const [stage,setStage]=useState<'loading'|'signed-out'|'verify'|'request'|'pending'|'rejected'|'active'>('loading');
 const [role,setRole]=useState<EnterpriseRole>('ventas');
 const [admin,setAdmin]=useState(false);
 const [grantedRoles,setGrantedRoles]=useState<EnterpriseRole[]>([]);
 const [grantedSections,setGrantedSections]=useState<Section[]|null>(null);
 const [error,setError]=useState('');
 const sync=useCallback(async(nextUser:User|null)=>{
   setUser(nextUser);setError('');
   if(!nextUser){setStage('signed-out');setAdmin(false);return;}
   if(!nextUser.emailVerified){setStage('verify');return;}
   try{
     const token=await nextUser.getIdTokenResult(true);
     if(isInitialAdmin(nextUser.email)||token.claims.admin===true){setAdmin(true);setRole('direccion');setGrantedRoles(['direccion']);setGrantedSections(null);setStage('active');return;}
     const member=await memberFor(nextUser);
     if(member){setAdmin(false);setRole(member.role);setGrantedRoles(member.roles?.length?member.roles:[member.role]);setGrantedSections(member.allowedSections!==undefined?member.allowedSections:null);setStage('active');return;}
     const request=await getDoc(requestRef(nextUser.uid));
     setAdmin(false);setStage(!request.exists() || request.data()?.status==='draft' ? 'request' : request.data()?.status==='rejected' ? 'rejected' : 'pending');
   }catch(e){setError(friendlyError(e));setStage('pending');}
 },[]);
 useEffect(()=>onAuthStateChanged(auth,u=>{void sync(u);},e=>{setError(friendlyError(e));setStage('signed-out');}),[sync]);
 // Revocations and role/view changes propagate while employees are online.
 useEffect(()=>{
   if(!user||admin||stage!=='active')return;
   return onSnapshot(memberRef(user.uid),snapshot=>{
     const current=snapshot.data();
     if(!current || current.active!==true){setStage('pending');setGrantedRoles([]);setGrantedSections([]);return;}
     const accepted:EnterpriseRole[]=['direccion','ventas','operaciones','servicio','finanzas','supervision','cliente'];
     const granted=Array.isArray(current.roles)?current.roles.filter((r:unknown):r is EnterpriseRole=>accepted.includes(r as EnterpriseRole)):[];
     if(accepted.includes(current.role))setRole(current.role);
     setGrantedRoles(granted.length?granted:[current.role as EnterpriseRole]);
     if(Array.isArray(current.allowedSections))setGrantedSections(
       current.allowedSections.filter((v:unknown):v is Section=>typeof v==='string'&&Object.prototype.hasOwnProperty.call(sections,v))
     );
     else setGrantedSections(null);
   },e=>{setError(friendlyError(e));setStage('pending');});
 },[user?.uid,admin,stage]);

 async function retry(){
   if(auth.currentUser){await reload(auth.currentUser);await auth.currentUser.getIdToken(true);await sync(auth.currentUser);}
 }
 async function sendRequest(name:string,requestedRole:EnterpriseRole){
   const u=auth.currentUser;if(!u)return;await requestAccess(u,name,requestedRole);await sync(u);
 }
 if(route==='accesos')return <AccessFlowGuide onPublic={onPublic}/>;
 return stage==='loading'?<div className="live-loading"><ShieldCheck size={40}/><span>{loadingText}</span></div>
 :stage==='active'&&user?<LivePanel user={user} role={role} admin={admin} grantedRoles={grantedRoles} grantedSections={grantedSections} onPublic={onPublic} route={route}/>
 :<><AuthBox user={user} stage={stage==='active'?'signed-out':stage} onRetry={retry} onRequest={sendRequest} onBack={onPublic} registrationMode={route==='registro'}/>{error&&<div className="live-fatal">{error}</div>}</>;
}
