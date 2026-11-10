import { useState } from 'react';
import {
  ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, CheckCircle2, ClipboardCheck,
  FileBadge, FileText, Fingerprint, LayoutDashboard, LockKeyhole, MailCheck,
  Settings2, ShieldCheck, UserPlus, Users
} from 'lucide-react';
import { navigationByRole, roles, type Role, type Section } from './data';

const sectionLabels:Record<Section,string>={
  resumen:'Vista general',prospectos:'Oportunidades',polizas:'Pólizas y expedientes',
  clientes:'Clientes',solicitudes:'Solicitudes',finanzas:'Comisiones',
  equipo:'Equipo y permisos',documentos:'Documentos',configuracion:'Configuración'
};
const sectionExplanations:Record<Section,string>={
  resumen:'Indicadores y tareas pendientes correspondientes a los permisos del empleado.',
  prospectos:'Prospectos asignados, cotizaciones, embudo comercial y seguimiento.',
  polizas:'Pólizas autorizadas, vigencias, aseguradoras y estado de emisión.',
  clientes:'Directorio de clientes disponible según la asignación y el área.',
  solicitudes:'Atención de casos, consultas, siniestros y solicitudes de asegurados.',
  finanzas:'Comisiones, liquidaciones y reportes con acceso financiero restringido.',
  equipo:'Revisión de equipo y operaciones delegadas de supervisión.',
  documentos:'Expedientes y archivos controlados por identidad, área y relación.',
  configuracion:'Preferencias y configuración administrativa autorizadas.'
};
const staffRoles:Role[]=['ventas','operaciones','servicio','finanzas','supervision','direccion'];

export function RoleViewPreview() {
  const [selectedRole,setSelectedRole]=useState<Role>('ventas');
  const [selectedTab,setSelectedTab]=useState<Section>('resumen');
  const role=roles.find(r=>r.id===selectedRole);
  const tabs=navigationByRole[selectedRole];
  const visibleTab=tabs.includes(selectedTab)?selectedTab:tabs[0];
  function chooseRole(next:Role) {
    setSelectedRole(next);
    setSelectedTab(navigationByRole[next][0]);
  }
  return <section className="access-preview">
    <div className="access-preview-intro">
      <span className="access-eyebrow"><Settings2 size={15}/> VISTA GUIADA DE PERMISOS</span>
      <h2>Así cambia ACOS según el departamento.</h2>
      <p>Seleccioná un perfil y explorá el menú que tendría un colaborador de esa área. Esta vista utiliza información ilustrativa: <strong>no crea usuarios ni cambia permisos reales</strong>.</p>
    </div>
    <div className="access-role-chips" role="group" aria-label="Seleccionar departamento">
      {staffRoles.map(r=><button type="button" className={r===selectedRole?'selected':''} key={r} onClick={()=>chooseRole(r)}>{roles.find(x=>x.id===r)?.short||r}</button>)}
    </div>
    <div className="access-preview-app">
      <aside className="access-mini-sidebar">
        <div className="access-mini-brand"><Building2 size={20}/><div><strong>ACOS</strong><small>PORTAL EMPRESARIAL</small></div></div>
        <div className="access-mini-person"><span>{selectedRole.slice(0,2).toUpperCase()}</span><div><strong>Empleado de ejemplo</strong><small>{role?.label}</small></div></div>
        <div className="access-mini-label">MÓDULOS DE ESTA ÁREA</div>
        {tabs.map(t=><button key={t} onClick={()=>setSelectedTab(t)} className={t===visibleTab?'selected':''}>{sectionLabels[t]}</button>)}
      </aside>
      <section className="access-mini-main">
        <span className="access-eyebrow">PANEL DE {role?.short.toUpperCase()} · EJEMPLO</span>
        <h3>{sectionLabels[visibleTab]}</h3>
        <p>{sectionExplanations[visibleTab]}</p>
        <div className="access-mini-notice"><ShieldCheck size={18}/>
          <span>Los módulos definitivos los selecciona Dirección al aprobar la cuenta. Un rol por sí solo no garantiza acceso a los expedientes.</span>
        </div>
        <div className="access-mini-stats">
          <div><small>PERFIL</small><strong>{role?.short}</strong></div>
          <div><small>VISTAS DE REFERENCIA</small><strong>{tabs.length}</strong></div>
          <div><small>AUTORIZACIÓN</small><strong>Por Dirección</strong></div>
        </div>
        <div className="access-mini-empty"><LayoutDashboard size={28}/><strong>Área de trabajo personal</strong>
          <span>Al iniciar sesión con un perfil aprobado aparecerán los registros que pueda consultar este colaborador. No se muestran clientes ficticios como si fueran reales.</span></div>
      </section>
    </div>
    <p className="access-note"><LockKeyhole size={15}/> Vista de diseño para Dirección. Para validar los permisos efectivos, realizaremos pruebas con cuentas Firebase independientes.</p>
  </section>;
}

export function RegistrationPreview() {
  return <section className="access-registration">
    <div className="access-preview-intro">
      <span className="access-eyebrow"><UserPlus size={15}/> INCORPORACIÓN DEL PERSONAL</span>
      <h2>Así se registra un nuevo colaborador.</h2>
      <p>Estás en una sesión administrativa. Para probar el registro real, primero invitá un correo desde la bandeja de Dirección y abrí este mismo enlace en una ventana privada con esa cuenta.</p>
    </div>
    <div className="access-signup-layout">
      <div className="access-signup-card">
        <span className="access-eyebrow">FORMULARIO · VISTA ILUSTRATIVA</span>
        <h3>Solicitud de incorporación</h3>
        <div className="access-signup-field"><span>Correo verificado</span><div><MailCheck size={15}/> colaborador@ejemplo.com</div></div>
        <div className="access-signup-field"><span>Nombre completo</span><div>Nombre y apellidos</div></div>
        <div className="access-signup-field"><span>Teléfono</span><div>+505 0000 0000</div></div>
        <div className="access-signup-field"><span>Departamento solicitado</span><div>Comercial y ventas</div></div>
        <div className="access-signup-files">
          <div><FileBadge size={20}/> Fotografía de perfil</div>
          <div><FileText size={20}/> Documento de identificación</div>
        </div>
        <div className="access-signup-disabled"><LockKeyhole size={15}/> Enviar solicitud — disponible para cuenta invitada</div>
      </div>
      <div className="access-signup-steps">
        {[
          {icon:MailCheck,title:'Dirección invita',text:'Se registra el correo verificado antes de conceder acceso.'},
          {icon:Fingerprint,title:'El colaborador completa su perfil',text:'Adjunta información de contacto y documentos protegidos.'},
          {icon:ClipboardCheck,title:'Dirección aprueba',text:'Asigna departamento, código, roles y secciones permitidas.'},
          {icon:BadgeCheck,title:'Se habilita su panel',text:'El menú muestra únicamente las vistas aprobadas.'}
        ].map((step,i)=><div className="access-signup-step" key={step.title}>
          <span className="access-signup-step-num">{String(i+1).padStart(2,'0')}</span>
          <step.icon size={19}/><div><strong>{step.title}</strong><p>{step.text}</p></div>
        </div>)}
        <a className="access-inline-action" href="#/direccion/solicitudes">Abrir bandeja de aprobaciones <ArrowRight size={16}/></a>
      </div>
    </div>
  </section>;
}

export function AccessFlowGuide({onPublic}:{onPublic:()=>void}) {
  const destinations=[
    {id:'01',icon:UserPlus,title:'Solicitud del colaborador',desc:'Cuenta Firebase, verificación de correo, fotografía e identificación. Requiere invitación previa.',hash:'#/registro',cta:'Abrir registro'},
    {id:'02',icon:ClipboardCheck,title:'Aprobaciones de Dirección',desc:'Invitar personal, revisar solicitudes, autorizar departamentos, roles y vistas. Acceso administrativo.',hash:'#/direccion/solicitudes',cta:'Abrir aprobaciones'},
    {id:'03',icon:BriefcaseBusiness,title:'Panel del colaborador',desc:'El sistema reconoce su identidad y habilita únicamente los módulos asignados.',hash:'#/mi-panel',cta:'Abrir mi panel'}
  ];
  return <main className="access-guide-page">
    <div className="access-guide-shell">
      <header className="access-guide-header"><div><span className="access-guide-logotype">ACOS<span> / ACCESOS</span></span><small>PLATAFORMA EMPRESARIAL</small></div><button onClick={onPublic}>Ir al sitio corporativo <ArrowRight size={15}/></button></header>
      <div className="access-guide-heading"><span className="access-eyebrow"><ShieldCheck size={15}/> IDENTIDADES · ROLES · PERMISOS</span>
        <h1>Tres accesos. Una sola plataforma.</h1>
        <p>La experiencia del colaborador cambia según su estado de aprobación. Dirección controla quién puede entrar y qué operaciones tendrá disponibles.</p>
      </div>
      <div className="access-guide-grid">{destinations.map(card=><a key={card.id} href={card.hash} className="access-guide-card">
        <div className="access-guide-card-top"><span>{card.id}</span><card.icon size={25}/></div>
        <h2>{card.title}</h2><p>{card.desc}</p>
        <span className="access-guide-card-link">{card.cta}<ArrowRight size={17}/></span>
      </a>)}</div>
      <div className="access-guide-footnote"><CheckCircle2 size={17}/><span>Este recorrido no concede permisos por sí mismo. Todas las operaciones privadas exigen autenticación y autorización del servidor.</span></div>
    </div>
  </main>;
}
