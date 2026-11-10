import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { Check, FileBadge2, ImagePlus, LockKeyhole, RefreshCw, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { navigationByRole, roles as roleDefinitions, type Section } from './data';
import type { EnterpriseRole } from './backend';
import {
  approveStaffApplication, createStaffInvitation, departments, employeeCodeFor, hasStaffInvitation,
  openProtectedStaffDocument, pendingStaffApplications, rejectStaffApplication,
  sectionsForRoles, submitStaffApplication, updateStaffMember,
  type StaffApplication, type StaffDepartment, type StaffMember
} from './staff';

const displaySection: Record<Section,string> = {
  resumen:'Vista general',prospectos:'Oportunidades',polizas:'Pólizas y expedientes',clientes:'Clientes',
  solicitudes:'Solicitudes',finanzas:'Comisiones',equipo:'Equipo y permisos',documentos:'Documentos',
  configuracion:'Configuración'
};
const staffRoles: EnterpriseRole[] = ['direccion','ventas','operaciones','servicio','finanzas','supervision'];
function friendly(error: unknown) { return error instanceof Error ? error.message : String(error); }
function Selector({ department, setDepartment, roleValues, setRoleValues, views, setViews }: {
  department: StaffDepartment; setDepartment:(d:StaffDepartment)=>void;
  roleValues:EnterpriseRole[];setRoleValues:(r:EnterpriseRole[])=>void;
  views:Section[];setViews:(s:Section[])=>void;
}) {
  const eligible = sectionsForRoles(roleValues);
  function toggleRole(r:EnterpriseRole) {
    const next = roleValues.includes(r) ? roleValues.filter(x=>x!==r) : [...roleValues,r];
    if (!next.length) return;
    setRoleValues(next);setViews(sectionsForRoles(next));
  }
  return <div className="staff-editor">
    <label>Departamento asignado<select value={department} onChange={e=>setDepartment(e.target.value as StaffDepartment)}>{Object.entries(departments).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
    <fieldset><legend>Roles operativos</legend><div className="staff-options">{staffRoles.map(r=><label key={r}><input type="checkbox" checked={roleValues.includes(r)} onChange={()=>toggleRole(r)} /> {roleDefinitions.find(v=>v.id===r)?.short||r}</label>)}</div></fieldset>
    <fieldset><legend>Vistas habilitadas</legend><div className="staff-options">{eligible.map(s=><label key={s}><input type="checkbox" checked={views.includes(s)} onChange={()=>setViews(views.includes(s)?views.filter(v=>v!==s):[...views,s])} /> {displaySection[s]}</label>)}</div></fieldset>
    <small className="staff-note">Las vistas controlan navegación. El acceso a registros debe coincidir también con las reglas de autorización del servidor.</small>
  </div>;
}

export function StaffApplicationForm({user,onSubmitted}:{user:User|null;onSubmitted:()=>Promise<void>}) {
  const [name,setName]=useState(user?.displayName||'');
  const [phone,setPhone]=useState('');
  const [department,setDepartment]=useState<StaffDepartment>('ventas');
  const [photo,setPhoto]=useState<File|null>(null);
  const [identity,setIdentity]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [invited,setInvited]=useState(false);
  const [checking,setChecking]=useState(true);
  const [refreshVersion,setRefreshVersion]=useState(0);
  useEffect(()=>{
    let valid=true;
    setChecking(true);setError('');
    if (!user) {setChecking(false);setInvited(false);return;}
    void hasStaffInvitation(user).then(allowed=>{if(valid){setInvited(allowed);setChecking(false);}})
      .catch(ex=>{if(valid){setError('No pudimos verificar tu invitación: '+friendly(ex));setInvited(false);setChecking(false);}});
    return ()=>{valid=false;};
  },[user?.uid,user?.emailVerified,refreshVersion]);
  const enabled=!!user?.email && user.emailVerified && invited;
  async function submit(e:FormEvent) {
    e.preventDefault();
    if(!enabled){setError('No se puede enviar una solicitud sin una invitación vigente de Dirección.');return;}
    if (!user || !photo || !identity) {setError('Debes adjuntar una fotografía y un documento de prueba.');return;}
    setBusy(true);setError('');
    try {
      await submitStaffApplication(user,{displayName:name,phone,department,photo,identity});
      await onSubmitted();
    } catch(ex) {setError(friendly(ex));} finally {setBusy(false);}
  }
  return <div className="staff-application">
    <span className="staff-kicker">INCORPORACIÓN EMPRESARIAL</span>
    <h1>Solicita tu acceso a ACOS.</h1>
    <p>Completa tu perfil. Dirección verificará tu identidad y decidirá tu departamento, código y permisos.</p>
    <div className="staff-email-info"><ShieldCheck size={17}/><span>Correo verificado: <strong>{user?.email||'No disponible'}</strong></span></div>
    {checking?<div className="staff-invite-gate" role="status"><RefreshCw size={21}/><strong>Comprobando invitación empresarial…</strong></div>
    :!invited?<div className="staff-invite-gate" role="status">
       <LockKeyhole size={25}/>
       <strong>Tu correo todavía no tiene una invitación activa.</strong>
       <p>Para proteger la información de ACOS, Dirección debe autorizar este correo antes de que puedas enviar una solicitud. No hace falta completar el formulario hasta entonces.</p>
       <button className="btn btn-dark" type="button" onClick={()=>setRefreshVersion(v=>v+1)}><RefreshCw size={15}/> Volver a comprobar invitación</button>
     </div>:<p className="staff-invite-confirmed"><ShieldCheck size={16}/> Invitación verificada. Podés completar tu expediente con datos de prueba.</p>}
    {invited&&<form className="live-form" onSubmit={submit}>
      <label>Nombre completo<input required minLength={3} maxLength={90} value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre y apellidos"/></label>
      <label>Teléfono de contacto<input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+505 8888 8888"/></label>
      <label>Área solicitada<select value={department} onChange={e=>setDepartment(e.target.value as StaffDepartment)}>{Object.entries(departments).filter(([k])=>k!=='direccion').map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
      <label className="staff-file"><ImagePlus size={18}/> Fotografía de perfil (JPG, PNG o WebP; hasta 3 MB)<input type="file" required accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0]||null)} /></label>
      <label className="staff-file"><FileBadge2 size={18}/> Documento de identidad (PDF o imagen; hasta 8 MB)<input type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e=>setIdentity(e.target.files?.[0]||null)} /></label>
      <p className="staff-warning"><LockKeyhole size={14}/> Estamos validando el sistema. Por ahora utilizá imágenes y documentos ficticios, nunca cédulas auténticas ni datos personales de terceros.</p>
      {error&&<p className="live-error">{error}</p>}
      <button className="btn btn-dark full" disabled={!enabled||busy} type="submit">{busy?'Enviando solicitud…':'Enviar solicitud de incorporación'} <Check size={16}/></button>
    </form>}
    {!invited&&error&&<p role="alert" className="live-error">{error}</p>}
  </div>;
}

function ApprovalEntry({item,onProcessed}:{item:StaffApplication;onProcessed:()=>Promise<void>}) {
  const initialDepartment:StaffDepartment=Object.prototype.hasOwnProperty.call(departments,item.requestedDepartment)?item.requestedDepartment:'ventas';
  const [department,setDepartment]=useState<StaffDepartment>(initialDepartment);
  const [selectedRoles,setSelectedRoles]=useState<EnterpriseRole[]>([initialDepartment]);
  const [sections,setSections]=useState<Section[]>(sectionsForRoles([initialDepartment]));
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const preview=async(path?:string)=>{
    if(!path)return;
    try {await openProtectedStaffDocument(path);}catch(ex){setError('No se pudo acceder al archivo protegido: '+friendly(ex));}
  };
  const execute=async(action:()=>Promise<unknown>)=>{
    setBusy(true);setError('');setNotice('');
    try {await action();await onProcessed();}catch(ex){setError(friendly(ex));}finally{setBusy(false);}
  };
  return <article className="staff-request-card">
    <div className="staff-person">
      <div className="staff-avatar">{item.displayName?.slice(0,2).toUpperCase()||'AC'}</div>
      <div><strong>{item.displayName}</strong><small>{item.email}</small><small>{item.phone||'Teléfono no adjuntado'} · Solicitó: {departments[item.requestedDepartment]||'Sin área'}</small></div>
    </div>
    <div className="staff-documents">
      <button className="btn btn-soft" disabled={!item.profilePhotoPath} onClick={()=>void preview(item.profilePhotoPath)}>Revisar fotografía</button>
      <button className="btn btn-soft" disabled={!item.identityDocumentPath} onClick={()=>void preview(item.identityDocumentPath)}>Revisar cédula</button>
    </div>
    <Selector department={department} setDepartment={setDepartment} roleValues={selectedRoles} setRoleValues={setSelectedRoles} views={sections} setViews={setSections} />
    <div className="staff-code">Código de empleado: <strong>{employeeCodeFor(department,item.id)}</strong></div>
    {error&&<p className="live-error">{error}</p>}{notice&&<p>{notice}</p>}
    <div className="staff-actions">
      <button disabled={busy} className="btn btn-dark" onClick={()=>void execute(()=>approveStaffApplication(item,department,selectedRoles,sections))}><UserRoundCheck size={16}/> Aprobar y asignar</button>
      <button disabled={busy} className="btn btn-soft" onClick={()=>void execute(()=>rejectStaffApplication(item))}>Rechazar</button>
    </div>
  </article>;
}

export function StaffInvitations({user}:{user:User}) {
  const [email,setEmail]=useState('');
  const [department,setDepartment]=useState<StaffDepartment>('ventas');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  async function submit(e:FormEvent) {
    e.preventDefault();setBusy(true);setError('');setNotice('');
    try {
      await createStaffInvitation(user,email,department);
      setNotice('Invitación autorizada para '+email.trim().toLowerCase()+'. El colaborador ya puede iniciar sesión con ese correo verificado y enviar su solicitud.');
      setEmail('');
    } catch(ex) {setError(friendly(ex));} finally {setBusy(false);}
  }
  return <section className="data-card live-list staff-center">
    <div className="data-card-head"><div><span className="staff-kicker">CONTROL DE INCORPORACIONES</span>
      <h3>Autorizar correo para crear perfil</h3>
      <p>Registra primero el correo del colaborador. Puede ser una cuenta de prueba verificada mientras se adquiere el dominio institucional.</p></div></div>
    <form className="staff-invite-form" onSubmit={submit}>
      <label>Correo a invitar<input type="email" required autoComplete="off" value={email}
        onChange={e=>setEmail(e.target.value)} placeholder="colaborador@correo.com"/></label>
      <label>Área prevista<select value={department} onChange={e=>setDepartment(e.target.value as StaffDepartment)}>
        {Object.entries(departments).filter(([k])=>k!=='direccion').map(([k,v])=><option key={k} value={k}>{v}</option>)}
      </select></label>
      <button className="btn btn-dark" disabled={busy} type="submit">{busy?'Autorizando…':'Crear invitación'}</button>
      {error&&<p className="live-error">{error}</p>}{notice&&<p className="staff-invite-success">{notice}</p>}
      <p className="staff-note">No envía correos automáticamente. Dirección debe comunicar al empleado que puede crear su perfil. Las reglas de Firebase impiden solicitar acceso sin invitación.</p>
    </form>
  </section>;
}

export function StaffApprovalCenter({user}:{user:User}) {
  const [applications,setApplications]=useState<StaffApplication[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const refresh=useCallback(async()=>{
    setLoading(true);setError('');
    try{setApplications(await pendingStaffApplications());}catch(ex){setError(friendly(ex));}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  return <><StaffInvitations user={user}/><section className="data-card live-list staff-center">
    <div className="data-card-head"><div><span className="staff-kicker">DIRECCIÓN GENERAL</span><h3>Solicitudes de incorporación</h3><p>Revisa identificación y autoriza exclusivamente los permisos necesarios.</p></div><button className="btn btn-soft" onClick={()=>void refresh()}><RefreshCw size={15}/> Actualizar</button></div>
    {error&&<p className="live-error">{error}</p>}
    {loading?<p className="staff-muted">Consultando solicitudes…</p>
    :applications.length===0?<div className="live-empty"><UserRoundCheck size={28}/><strong>Sin solicitudes pendientes</strong><p>Las nuevas solicitudes se mostrarán aquí.</p></div>
    :<div className="staff-request-grid">{applications.map(a=><ApprovalEntry key={a.id} item={a} onProcessed={refresh}/>)}</div>}
    <p className="staff-note">Avisos por correo: pendientes de integrar un servicio de envío seguro. La aprobación activa el perfil en Firebase, pero todavía no envía correos automáticos.</p>
  </section></>;
}

function MemberEditor({member,onSaved}:{member:StaffMember;onSaved:()=>void}) {
  const initial = member.department||'ventas';
  const [department,setDepartment]=useState<StaffDepartment>(initial);
  const [memberRoles,setMemberRoles]=useState<EnterpriseRole[]>(member.roles?.length?member.roles:[member.role]);
  const [sections,setSections]=useState<Section[]>(member.allowedSections?.length?member.allowedSections:sectionsForRoles(member.roles?.length?member.roles:[member.role]));
  const [editing,setEditing]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  return <article className="staff-member-card"><div className="staff-person"><div className="staff-avatar">{member.displayName?.slice(0,2).toUpperCase()}</div><div><strong>{member.displayName}</strong><small>{member.email}</small><small>{member.employeeCode||'Código pendiente'} · {departments[initial]}</small></div></div>
    {editing&&<Selector department={department} setDepartment={setDepartment} roleValues={memberRoles} setRoleValues={setMemberRoles} views={sections} setViews={setSections}/>}
    {error&&<p className="live-error">{error}</p>}
    <div className="staff-actions"><button className="btn btn-soft" disabled={busy} onClick={()=>{setEditing(!editing);setError('');}}>{editing?'Cancelar':'Editar permisos'}</button>
    {editing&&<button disabled={busy} className="btn btn-dark" onClick={()=>void (async()=>{setBusy(true);try{await updateStaffMember(member,department,memberRoles,sections);setEditing(false);onSaved();}catch(ex){setError(friendly(ex));}finally{setBusy(false);}})()}>Guardar permisos</button>}</div>
  </article>;
}

export function StaffMembersCenter({members}:{members:StaffMember[]}) {
  const [revision,setRevision]=useState(0);
  return <section className="data-card live-list staff-center">
    <div className="data-card-head"><div><span className="staff-kicker">ADMINISTRACIÓN DE PERSONAL</span><h3>Perfiles activos y permisos</h3><p>Actualiza roles y vistas de miembros autorizados.</p></div></div>
    {members.length===0?<p className="staff-muted">Todavía no hay miembros registrados.</p>
    :<div className="staff-request-grid">{members.map(m=><MemberEditor key={m.id+'-'+revision} member={m} onSaved={()=>setRevision(x=>x+1)}/>)}</div>}
  </section>;
}
