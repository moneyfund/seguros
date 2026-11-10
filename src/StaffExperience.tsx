import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { Check, FileBadge2, ImagePlus, LockKeyhole, RefreshCw, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { navigationByRole, roles as roleDefinitions, type Section } from './data';
import type { EnterpriseRole } from './backend';
import {
  approveStaffApplication, departments, employeeCodeFor, isInstitutionalEmail,
  openProtectedStaffDocument, pendingStaffApplications, rejectStaffApplication,
  sectionsForRoles, staffEmailDomain, submitStaffApplication, updateStaffMember,
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
  const enabled=!!user?.email && isInstitutionalEmail(user.email);
  async function submit(e:FormEvent) {
    e.preventDefault();
    if (!user || !photo || !identity) {setError('Debes adjuntar fotografía e identificación.');return;}
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
    {!staffEmailDomain?<p className="staff-warning">La recepción de solicitudes está pendiente de la compra y configuración del dominio institucional. Este formulario aún no permite enviar documentación.</p>
    :!enabled?<p className="staff-warning">Debes iniciar sesión con tu correo institucional @{staffEmailDomain}. No envíes cédulas desde cuentas personales.</p>:null}
    <form className="live-form" onSubmit={submit}>
      <label>Nombre completo<input required minLength={3} maxLength={90} value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre y apellidos"/></label>
      <label>Teléfono de contacto<input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+505 8888 8888"/></label>
      <label>Área solicitada<select value={department} onChange={e=>setDepartment(e.target.value as StaffDepartment)}>{Object.entries(departments).filter(([k])=>k!=='direccion').map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
      <label className="staff-file"><ImagePlus size={18}/> Fotografía de perfil (JPG, PNG o WebP; hasta 3 MB)<input type="file" required accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0]||null)} /></label>
      <label className="staff-file"><FileBadge2 size={18}/> Cédula de identidad (PDF o imagen; hasta 8 MB)<input type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e=>setIdentity(e.target.files?.[0]||null)} /></label>
      <p className="staff-note"><LockKeyhole size={14}/> Datos privados. Solo dirección y el solicitante autorizado deben poder consultar los documentos.</p>
      {error&&<p className="live-error">{error}</p>}
      <button className="btn btn-dark full" disabled={!enabled||busy} type="submit">{busy?'Enviando solicitud…':'Enviar solicitud de incorporación'} <Check size={16}/></button>
    </form>
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

export function StaffApprovalCenter() {
  const [applications,setApplications]=useState<StaffApplication[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const refresh=useCallback(async()=>{
    setLoading(true);setError('');
    try{setApplications(await pendingStaffApplications());}catch(ex){setError(friendly(ex));}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  return <section className="data-card live-list staff-center">
    <div className="data-card-head"><div><span className="staff-kicker">DIRECCIÓN GENERAL</span><h3>Solicitudes de incorporación</h3><p>Revisa identificación y autoriza exclusivamente los permisos necesarios.</p></div><button className="btn btn-soft" onClick={()=>void refresh()}><RefreshCw size={15}/> Actualizar</button></div>
    {error&&<p className="live-error">{error}</p>}
    {loading?<p className="staff-muted">Consultando solicitudes…</p>
    :applications.length===0?<div className="live-empty"><UserRoundCheck size={28}/><strong>Sin solicitudes pendientes</strong><p>Las nuevas solicitudes se mostrarán aquí.</p></div>
    :<div className="staff-request-grid">{applications.map(a=><ApprovalEntry key={a.id} item={a} onProcessed={refresh}/>)}</div>}
    <p className="staff-note">Avisos por correo: pendientes de integrar un servicio de envío seguro. La aprobación activa el perfil en Firebase, pero todavía no envía correos automáticos.</p>
  </section>;
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
