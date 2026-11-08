import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
 Activity, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Bell, BriefcaseBusiness,
 CalendarDays, Camera, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Clock3,
 CloudUpload, CreditCard, Download, ExternalLink, FileCheck2, FileClock, FileText, Filter,
 Globe2, Headphones, LayoutDashboard, LockKeyhole, Mail, Menu, MoreHorizontal, Plus,
 ScanLine, Search, Send, Settings2, Shield, ShieldCheck, SlidersHorizontal, Sparkles, TrendingUp,
 Upload, UserRound, UserRoundPlus, Users, Wallet, X, Building2, Phone, MapPin, type LucideIcon
} from 'lucide-react';
import {
 initialCommissions, initialDocuments, initialLeads, initialPolicies, initialTickets, money,
 navigationByRole, roles, team, type DemoFile, type Lead, type LeadStatus, type Policy,
 type Role, type Section, type Ticket
} from './data';

const navInfo: Record<Section,{label:string;icon:LucideIcon}> = {
 resumen:{label:'Vista general',icon:LayoutDashboard},
 prospectos:{label:'Comercial y ventas',icon:TrendingUp},
 polizas:{label:'Pólizas y emisión',icon:ShieldCheck},
 clientes:{label:'Directorio de clientes',icon:Users},
 solicitudes:{label:'Atención y solicitudes',icon:Headphones},
 finanzas:{label:'Finanzas y comisiones',icon:Wallet},
 equipo:{label:'Equipo y permisos',icon:UserRoundPlus},
 documentos:{label:'Centro documental',icon:FileText},
 configuracion:{label:'Configuración',icon:Settings2}
};
const stages:LeadStatus[]=['Nuevo','Contactado','Cotización','Negociación','Ganado'];
const products = [
 {name:'Seguro de vida',description:'Respaldo para las personas que más importan.',icon:Shield},
 {name:'Seguro vehicular',description:'Tranquilidad y acompañamiento en cada trayecto.',icon:BriefcaseBusiness},
 {name:'Seguro de salud',description:'Opciones para proteger tu bienestar.',icon:Activity},
 {name:'Seguro empresarial',description:'Protección a la medida de tu operación.',icon:Building2}
];
const today='08 de noviembre de 2026';
const Pill=({children,tone='neutral'}:{children:ReactNode;tone?:'neutral'|'green'|'amber'|'red'|'blue'})=><span className={'pill pill-'+tone}><span className="pill-dot"/>{children}</span>;
function statusTone(value:string):'neutral'|'green'|'amber'|'red'|'blue'{
 if(['Vigente','Ganado','Conciliada','Resuelto','Activo','Verificado'].includes(value))return 'green';
 if(['Vencida','Alta'].includes(value))return 'red';
 if(['Por renovar','Pendiente','Por revisar','En emisión','Negociación'].includes(value))return 'amber';
 if(['En proceso','Cotización','Contactado'].includes(value))return 'blue';
 return 'neutral';
}
function Brand({small=false}:{small?:boolean}){
 return <div className={'brand '+(small?'brand-small':'')}><span className="brand-mark"><ShieldCheck size={24} strokeWidth={1.9}/></span><span className="brand-type"><strong>SEGUROS<span className="brand-dot">.</span></strong><small>PLATAFORMA EMPRESARIAL</small></span></div>;
}
function Modal({title,description,onClose,children}:{title:string;description?:string;onClose:()=>void;children:ReactNode}){
 return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
  <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
   <div className="modal-header"><div><span className="eyebrow">PLATAFORMA DEMOSTRATIVA</span><h2>{title}</h2>{description&&<p>{description}</p>}</div><button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20}/></button></div>
   {children}
  </div>
 </div>;
}
function PrimaryButton({children,onClick,outline=false,icon:Icon=ArrowRight,type='button'}:{children:ReactNode;onClick?:()=>void;outline?:boolean;icon?:LucideIcon;type?:'button'|'submit'}){
 return <button type={type} onClick={onClick} className={'btn '+(outline?'btn-outline':'btn-primary')}>{children}<Icon size={16}/></button>;
}
function PublicSite({openDemo}:{openDemo:()=>void}){
 const [quote,setQuote]=useState(false);
 const [submitted,setSubmitted]=useState(false);
 return <div className="public-site">
  <div className="announcement"><span className="announcement-dot"/> Experiencia de demostración · Identidad corporativa provisional <span className="announcement-end">Desarrollado por <strong>XARCON</strong></span></div>
  <header className="public-header"><div className="public-nav wrap"><Brand/><nav aria-label="Navegación pública"><a href="#soluciones">Soluciones</a><a href="#nosotros">Nuestra propuesta</a><a href="#contacto">Contacto</a></nav><div className="nav-actions"><button className="text-button" onClick={openDemo}>Acceso de demostración <ArrowUpRight size={15}/></button><button className="btn btn-primary" onClick={()=>setQuote(true)}>Solicitar asesoría <ArrowRight size={16}/></button></div><button className="mobile-nav-trigger" aria-label="Ir a la plataforma" onClick={openDemo}><Menu size={22}/></button></div></header>
  <main>
   <section className="hero"><div className="hero-grain"/><div className="wrap hero-grid">
    <div className="hero-copy"><div className="hero-tag"><span className="hero-tag-icon"><Sparkles size={14}/></span> ACOMPAÑAMIENTO EN CADA ETAPA <span className="tiny-arrow">↗</span></div><h1>Protegemos<br/>lo que <em>construyes.</em></h1><p>Soluciones de seguros con una experiencia más humana, clara y cercana. Estamos aquí para ayudarte a elegir con confianza.</p><div className="hero-actions"><PrimaryButton onClick={()=>setQuote(true)}>Explorar coberturas</PrimaryButton><button className="hero-outline" onClick={openDemo}>Conocer nuestra plataforma <ArrowUpRight size={17}/></button></div><div className="hero-trust"><div className="hero-avatars"><span>ML</span><span>CR</span><span>SR</span></div><div><strong>Atención pensada para ti</strong><small>Asesoría, seguimiento y acompañamiento</small></div></div></div>
    <div className="hero-art"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-art-star hero-star-one">✦</div><div className="hero-art-star hero-star-two">✦</div><div className="glass-card glass-card-back"><div className="card-symbol"><ShieldCheck size={32}/></div><div className="glass-faint">SOLUCIONES DE PROTECCIÓN</div><div className="glass-line"/><div className="glass-line short"/></div><div className="glass-card glass-card-main"><div className="glass-card-top"><span className="glass-emblem"><Shield size={24}/></span><span>PROTECCIÓN PERSONAL</span><span className="glass-glint">✧</span></div><div className="glass-main-title">Tu tranquilidad,<br/>nuestra prioridad.</div><div className="glass-card-bottom"><span>COBERTURA • CONFIANZA • RESPALDO</span><div className="glass-small-dot"/></div></div><div className="hero-floating"><CheckCircle2 size={19}/><span><strong>Tu póliza, siempre cerca</strong><small>Seguimiento digital y atención personalizada</small></span></div></div>
   </div><div className="hero-bottom"><div className="wrap hero-bottom-inner"><span>UNA NUEVA FORMA DE GESTIONAR TU PROTECCIÓN</span><span>01 — 04 <ArrowDownRight size={16}/></span></div></div></section>
   <section className="services-section wrap" id="soluciones"><div className="section-kicker"><span className="section-line"/> NUESTROS PRODUCTOS</div><div className="section-topline"><h2>Protección para cada<br/><em>momento de tu vida.</em></h2><p>Descubre las alternativas disponibles. Cada solicitud es acompañada por un asesor que te ayuda a encontrar una opción adecuada.</p></div><div className="product-grid">{products.map((p,i)=><button key={p.name} className="product-card" onClick={()=>setQuote(true)}><span className="product-index">0{i+1} / 04</span><span className="product-icon"><p.icon size={28} strokeWidth={1.5}/></span><h3>{p.name}</h3><p>{p.description}</p><span className="product-link">Consultar opciones <ArrowUpRight size={18}/></span></button>)}</div></section>
   <section className="public-process" id="nosotros"><div className="wrap process-grid"><div><div className="section-kicker light"><span className="section-line"/> NUESTRO ENFOQUE</div><h2>Simple para ti.<br/><em>Completo por dentro.</em></h2><p>Combinamos la atención cercana con procesos digitales para ofrecerte acompañamiento desde la primera cotización hasta la renovación.</p><PrimaryButton onClick={openDemo} outline>Conoce la experiencia digital</PrimaryButton></div><div className="process-steps">{[{n:'01',title:'Nos cuentas qué necesitas',detail:'Recibimos tu solicitud y conocemos tus prioridades.'},{n:'02',title:'Exploramos alternativas',detail:'Te acompañamos a comparar opciones y condiciones.'},{n:'03',title:'Gestionamos tu póliza',detail:'Damos seguimiento a la solicitud ante la aseguradora.'},{n:'04',title:'Seguimos a tu lado',detail:'Recordatorios, consultas y asistencia posventa.'}].map(s=><div className="process-step" key={s.n}><span>{s.n}</span><div><h3>{s.title}</h3><p>{s.detail}</p></div><ArrowUpRight size={19}/></div>)}</div></div></section>
   <section className="public-cta" id="contacto"><div className="wrap cta-inner"><div className="section-kicker"><span className="section-line"/> EMPECEMOS</div><h2>Hablemos de lo<br/><em>que quieres proteger.</em></h2><p>Una buena decisión comienza con una conversación clara.</p><PrimaryButton onClick={()=>setQuote(true)}>Solicitar una asesoría</PrimaryButton><span className="cta-decoration">S</span></div></section>
  </main>
  <footer className="public-footer"><div className="wrap footer-row"><Brand small/><span>Demostración conceptual · Sin operaciones ni coberturas reales</span><span>Diseñado por <strong>XARCON</strong> · 2026</span></div></footer>
  {quote&&<Modal title={submitted?'Solicitud de muestra registrada':'Solicitar asesoría'} description={submitted?'Esta acción fue simulada. No se enviaron datos a ninguna empresa.':'Completa la información ficticia para explorar esta experiencia de demostración.'} onClose={()=>{setQuote(false);setSubmitted(false);}}>{submitted?<div className="success-state"><CheckCircle2 size={42}/><h3>Así se vería la confirmación</h3><p>En la versión definitiva, la solicitud ingresará al panel comercial.</p><PrimaryButton onClick={()=>{setQuote(false);setSubmitted(false);}}>Entendido</PrimaryButton></div>:<form className="modal-form" onSubmit={e=>{e.preventDefault();setSubmitted(true);}}><label>Nombre<input required placeholder="Nombre completo" autoComplete="name"/></label><label>Correo de contacto<input required type="email" placeholder="correo@ejemplo.com" autoComplete="email"/></label><label>Seguro de interés<select><option>Seguro de vida</option><option>Seguro vehicular</option><option>Seguro de salud</option><option>Seguro empresarial</option></select></label><p className="input-note"><LockKeyhole size={14}/> Demostración: no introduzcas información personal real.</p><button className="btn btn-primary full" type="submit">Simular solicitud <ArrowRight size={16}/></button></form>}</Modal>}
 </div>;
}
function MiniChart(){
 const values=[28,34,30,42,40,55,51,61,57,72,68,84];
 const points=values.map((v,i)=>`${i*37},${110-v}`).join(' ');
 return <div className="chart-area"><div className="chart-grid"><span>$12k</span><span>$8k</span><span>$4k</span><span>$0</span></div><svg viewBox="0 0 410 120" preserveAspectRatio="none" role="img" aria-label="Tendencia simulada creciente durante 12 periodos"><defs><linearGradient id="chartfill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#5e9f87" stopOpacity=".35"/><stop offset="1" stopColor="#5e9f87" stopOpacity="0"/></linearGradient></defs><path d={`M0,120 L${points.replaceAll(' ', ' L')} L407,120 Z`} fill="url(#chartfill)"/><polyline points={points} fill="none" stroke="#247962" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="407" cy="26" r="6" fill="#247962" stroke="white" strokeWidth="3"/></svg><div className="chart-months"><span>ENE</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOV</span></div></div>;
}
function Metric({label,value,trend,icon:Icon,quiet=false}:{label:string;value:string;trend:string;icon:LucideIcon;quiet?:boolean}){
 return <div className="metric"><div className="metric-head"><span>{label}</span><span className="metric-icon"><Icon size={18}/></span></div><strong>{value}</strong><div className="metric-footer"><span className={quiet?'trend-quiet':'trend-positive'}>{quiet?<Clock3 size={13}/>:<ArrowUpRight size={14}/>} {trend}</span><span className="metric-context">Datos de ejemplo</span></div></div>;
}
function SectionHeader({eyebrow,title,desc,action}:{eyebrow:string;title:string;desc:string;action?:ReactNode}){
 return <div className="section-head"><div><div className="section-eyebrow">{eyebrow}</div><h2>{title}</h2><p>{desc}</p></div>{action&&<div className="section-actions">{action}</div>}</div>;
}
function CardTable({children,header,sub,action}:{children:ReactNode;header:string;sub?:string;action?:ReactNode}){
 return <section className="data-card"><div className="data-card-head"><div><h3>{header}</h3>{sub&&<p>{sub}</p>}</div>{action}</div><div className="table-wrap">{children}</div></section>;
}
function DemoApp({goPublic}:{goPublic:()=>void}){
 const [role,setRole]=useState<Role>('direccion');
 const [section,setSection]=useState<Section>('resumen');
 const [mobileOpen,setMobileOpen]=useState(false);
 const [search,setSearch]=useState('');
 const [leads,setLeads]=useState<Lead[]>(initialLeads);
 const [tickets,setTickets]=useState<Ticket[]>(initialTickets);
 const [documents,setDocuments]=useState<DemoFile[]>(initialDocuments);
 const [modal,setModal]=useState<'lead'|'upload'|'request'|'agent'|'detail'|null>(null);
 const [selectedPolicy,setSelectedPolicy]=useState<Policy|null>(null);
 const [notification,setNotification]=useState<string|null>(null);
 const [settings,setSettings]=useState({email:true,renewals:true,alerts:true});
 const [newLead,setNewLead]=useState({name:'',product:'Seguro de vida',channel:'Web',value:'650'});
 const fileRef=useRef<HTMLInputElement>(null);
 const scanRef=useRef<HTMLInputElement>(null);
 const permitted=navigationByRole[role];
 const current=permitted.includes(section)?section:'resumen';
 const roleInfo=roles.find(r=>r.id===role)!;
 const filter=(a:string,b='')=>(a+' '+b).toLowerCase().includes(search.toLowerCase());
 const visibleLeads=leads.filter(l=>filter(l.name,l.product+' '+l.assignee));
 const visiblePolicies=initialPolicies.filter(p=>role!=='cliente'||p.client==='Carlos Mendoza').filter(p=>filter(p.client,p.id+' '+p.insurer+' '+p.product));
 const visibleTickets=tickets.filter(t=>role!=='cliente'||t.customer==='Carlos Mendoza').filter(t=>filter(t.customer,t.topic));
 const stats=role==='cliente'?[{label:'Pólizas vigentes',value:'01',trend:'Mis coberturas',icon:ShieldCheck},{label:'Próxima renovación',value:'21 nov',trend:'Recordatorio activo',icon:CalendarDays},{label:'Solicitudes abiertas',value:'01',trend:'En seguimiento',icon:Headphones},{label:'Documentos',value:'04',trend:'Disponibles',icon:FileText}]:[
  {label:role==='finanzas'?'Comisiones del mes':'Primas gestionadas',value:role==='finanzas'?'$8,420':'$42,580',trend:'+12.8 % vs. periodo anterior',icon:Wallet},
  {label:role==='operaciones'?'Pólizas en gestión':'Pólizas activas',value:role==='operaciones'?'08':'186',trend:'+8.2 % vs. periodo anterior',icon:ShieldCheck},
  {label:role==='servicio'?'Solicitudes abiertas':'Oportunidades',value:role==='servicio'?'12':'32',trend:'7 requieren seguimiento',icon:TrendingUp},
  {label:'Renovaciones próximas',value:'14',trend:'Próximos 30 días',icon:CalendarDays}
 ];
 function chooseRole(r:Role){setRole(r);setSection('resumen');setSearch('');setMobileOpen(false);}
 function chooseSection(s:Section){setSection(s);setSearch('');setMobileOpen(false);}
 function notify(message:string){setNotification(message);}
 function nextStage(id:string){setLeads(old=>old.map(l=>l.id===id?{...l,status:stages[Math.min(stages.indexOf(l.status)+1,4)]}:l));notify('Oportunidad actualizada únicamente en esta demostración.');}
 function resolveTicket(id:string){setTickets(old=>old.map(t=>t.id===id?{...t,status:t.status==='Resuelto'?'Pendiente':'Resuelto'}:t));notify('Estado de la solicitud actualizado en la demostración.');}
 function addLead(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!newLead.name.trim())return;setLeads(l=>[{id:'OP-'+String(1050+l.length-initialLeads.length),name:newLead.name.trim(),product:newLead.product,value:Number(newLead.value)||0,assignee:'Agente demostrativo',status:'Nuevo',date:'08 nov 2026',channel:newLead.channel},...l]);setModal(null);setNewLead({name:'',product:'Seguro de vida',channel:'Web',value:'650'});notify('Prospecto agregado a la sesión de demostración.');chooseSection('prospectos');}
 function addFiles(files:FileList|null){if(!files)return;const items=Array.from(files).map(f=>({name:f.name,type:'Carga local · Demo',owner:'Sin expediente',date:'Hoy',size:f.size>1024*1024?(f.size/1024/1024).toFixed(1)+' MB':Math.ceil(f.size/1024)+' KB'}));setDocuments(d=>[...items,...d]);setModal(null);notify('Archivo visualizado en la sesión. No se cargó ni almacenó en la nube.');chooseSection('documentos');}
 function exportCsv(){const rows=[['Póliza','Aseguradora','Prima','Comisión','Estado'],...initialCommissions.map(c=>[c.policy,c.company,String(c.base),String(c.amount),c.status])];const csv=rows.map(r=>r.map(s=>'"'+s.replaceAll('"','""')+'"').join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='comisiones-demo.csv';a.click();URL.revokeObjectURL(url);notify('CSV descargado con información ficticia.');}
 const totalLeadValue=leads.reduce((s,l)=>s+l.value,0);
 return <div className="app-shell">
  {mobileOpen&&<button className="sidebar-scrim" onClick={()=>setMobileOpen(false)} aria-label="Cerrar menú"/>}
  <aside className={'sidebar '+(mobileOpen?'sidebar-open':'')}>
   <div className="sidebar-top"><Brand small/><button className="mobile-close" onClick={()=>setMobileOpen(false)} aria-label="Cerrar menú"><X size={20}/></button></div>
   <div className="workspace-title">ESPACIO DE TRABAJO <span className="workspace-demo">DEMO</span></div>
   <div className="workspace-profile"><span className="workspace-avatar">{role==='cliente'?'CL':role==='direccion'?'DG':role==='supervision'?'SP':role.substring(0,2).toUpperCase()}</span><div className="workspace-profile-copy"><strong>{roleInfo.label}</strong><span>Vista de demostración</span></div><ChevronDown size={15}/></div>
   <div className="sidebar-group-label">PLATAFORMA</div>
   <nav className="sidebar-nav" aria-label="Navegación de la plataforma">{permitted.map(n=>{const Icon=navInfo[n].icon;return <button key={n} onClick={()=>chooseSection(n)} className={'sidebar-item '+(current===n?'active':'')}><Icon size={18}/><span>{navInfo[n].label}</span>{n==='solicitudes'&&<i>4</i>}</button>;})}</nav>
   <div className="sidebar-spacer"/>
   <div className="sidebar-switch"><label htmlFor="role-select">CAMBIAR PERFIL DEMO</label><div className="role-select"><select id="role-select" value={role} onChange={e=>chooseRole(e.target.value as Role)}>{roles.map(r=><option value={r.id} key={r.id}>{r.label}</option>)}</select><ChevronDown size={15}/></div><small>Las vistas no representan permisos de seguridad reales.</small></div>
   <button className="sidebar-public" onClick={goPublic}><Globe2 size={17}/> Volver a web pública <ArrowUpRight size={16}/></button>
   <div className="sidebar-bottom"><span className="xarcon-symbol">X</span><div><strong>POWERED BY XARCON</strong><small>Enterprise systems · 2026</small></div></div>
  </aside>
  <div className="app-main">
   <header className="app-topbar"><div className="breadcrumbs"><button className="mobile-menu" onClick={()=>setMobileOpen(true)} aria-label="Abrir menú"><Menu size={23}/></button><span>Workspace</span><ChevronRight size={14}/><strong>{navInfo[current].label}</strong></div><div className="topbar-right"><span className="demo-top-note"><span/> ENTORNO DE PRUEBAS</span><button className="topbar-icon" onClick={()=>notify('No hay nuevas notificaciones reales. Esta es una simulación.')} aria-label="Notificaciones"><Bell size={18}/><b/></button><span className="topbar-avatar">{role==='cliente'?'CL':'DG'}</span></div></header>
   <main className="workspace">
    <div className="workspace-greeting"><span className="date-line"><CalendarDays size={15}/> {today.toUpperCase()} <span className="date-sep">·</span> VERSIÓN DEMOSTRATIVA 01</span><div className="page-hero"><div><h1>{current==='resumen'?'Un panorama más claro,':'Gestión inteligente,'}<br/><em>{current==='resumen'?'mejores decisiones.':'un solo lugar.'}</em></h1><p>{current==='resumen'?roleInfo.description+'. Todo lo esencial, conectado en una sola experiencia.':'Explora los procesos de esta área mediante información ficticia y acciones simuladas.'}</p></div><div className="hero-page-actions">{current==='resumen'&&role!=='cliente'&&<button className="btn btn-dark" onClick={()=>setModal('lead')}><Plus size={17}/> Nueva oportunidad</button>}{role==='cliente'&&<button className="btn btn-dark" onClick={()=>setModal('request')}><Plus size={17}/> Nueva solicitud</button>}</div></div></div>
    <div className="workspace-content">
     {current==='resumen'&&<>
      <div className="metric-grid">{stats.map((s,i)=><Metric key={s.label} {...s} quiet={i===3}/>)}</div>
      <div className="dash-grid">
       <section className="data-card trend-card"><div className="data-card-head"><div><div className="section-eyebrow">ANÁLISIS DE DESEMPEÑO</div><h3>{role==='cliente'?'Historial de mi protección':'Evolución comercial'}</h3><p>{role==='cliente'?'Vista ilustrativa de pólizas y solicitudes':'Volumen gestionado durante el año · datos ficticios'}</p></div><span className="range-chip"><CalendarDays size={14}/> Últimos 12 meses</span></div><div className="trend-top"><strong>{role==='cliente'?'2 pólizas':money(42580)}</strong><span><TrendingUp size={14}/> +12.8%</span></div><MiniChart/></section>
       <section className="data-card activities-card"><div className="data-card-head"><div><div className="section-eyebrow">EN TIEMPO REAL · DEMO</div><h3>Prioridades del día</h3><p>Acciones que necesitan tu atención</p></div><span className="counter">04</span></div><div className="activity-list">{[{icon:FileClock,title:'Renovaciones pendientes',sub:'4 pólizas en próximos 15 días',tone:'amber'},{icon:UserRound,title:'Nuevas solicitudes',sub:'3 prospectos por contactar',tone:'green'},{icon:CreditCard,title:'Comisiones por conciliar',sub:'2 movimientos por validar',tone:'blue'},{icon:Headphones,title:'Atención al cliente',sub:'1 caso prioritario abierto',tone:'red'}].map((a,i)=><button key={a.title} onClick={()=>chooseSection((['polizas','prospectos','finanzas','solicitudes'] as Section[])[i])} className="activity-item"><span className={'activity-icon '+a.tone}><a.icon size={19}/></span><span><strong>{a.title}</strong><small>{a.sub}</small></span><ArrowUpRight size={16}/></button>)}</div></section>
      </div>
      <CardTable header={role==='cliente'?'Mis pólizas':'Pólizas recientes'} sub="Estado de cobertura y seguimiento de expedientes" action={<button className="table-link" onClick={()=>chooseSection('polizas')}>Ver todas <ArrowRight size={15}/></button>}>
       <table><thead><tr><th>REFERENCIA</th><th>ASEGURADO</th><th>PRODUCTO</th><th>VENCIMIENTO</th><th>ESTADO</th><th/></tr></thead><tbody>{visiblePolicies.slice(0,4).map(p=><tr key={p.id}><td className="td-id">{p.id}</td><td><span className="client-name"><span className="client-avatar">{p.client.split(' ').map(x=>x[0]).join('')}</span>{p.client}</span></td><td>{p.product}</td><td>{p.end}</td><td><Pill tone={statusTone(p.status)}>{p.status}</Pill></td><td><button className="row-action" onClick={()=>{setSelectedPolicy(p);setModal('detail');}} aria-label={'Ver '+p.id}><ChevronRight size={18}/></button></td></tr>)}</tbody></table>
      </CardTable>
     </>}
     {current==='prospectos'&&<>
      <SectionHeader eyebrow="OPERACIÓN COMERCIAL" title="Embudo de oportunidades" desc="Capta, organiza y da seguimiento al proceso de cotización." action={<PrimaryButton onClick={()=>setModal('lead')} icon={Plus}>Nuevo prospecto</PrimaryButton>}/>
      <div className="sales-summary"><div><span>Oportunidades en cartera</span><strong>{leads.length.toString().padStart(2,'0')}</strong></div><div><span>Valor estimado de oportunidades</span><strong>{money(totalLeadValue)}</strong></div><div><span>Etapas comerciales</span><strong>05</strong></div></div>
      <div className="pipeline">{stages.map((stage,index)=>{const cards=visibleLeads.filter(l=>l.status===stage);return <div className="pipeline-col" key={stage}><div className="pipeline-col-head"><span className={'stage-dot stage-'+index}/><strong>{stage}</strong><small>{cards.length}</small></div><div className="pipeline-cards">{cards.map(l=><div className="lead-card" key={l.id}><div className="lead-card-top"><span>{l.id}</span><MoreHorizontal size={17}/></div><h4>{l.name}</h4><p>{l.product}</p><div className="lead-divider"/><div className="lead-card-money">{money(l.value)} <span>{l.channel}</span></div><div className="lead-card-bottom"><span>{l.assignee}</span>{l.status!=='Ganado'&&<button title="Avanzar a siguiente etapa en demo" onClick={()=>nextStage(l.id)}><ArrowRight size={15}/></button>}</div></div>)}</div>{cards.length===0&&<span className="empty-stage">Sin oportunidades</span>}</div>;})}</div>
     </>}
     {current==='polizas'&&<>
      <SectionHeader eyebrow="OPERACIONES Y EMISIÓN" title="Gestión de pólizas" desc="Un expediente para cada cobertura, desde solicitud hasta renovación." action={<button className="btn btn-soft" onClick={()=>notify('La emisión real se habilitará al conectar aseguradoras y aprobaciones.')}><Plus size={16}/> Nueva póliza (próximamente)</button>}/>
      <div className="mini-insights"><div><ShieldCheck size={19}/><span>Vigentes</span><strong>186</strong></div><div><Clock3 size={19}/><span>Próximas a vencer</span><strong>14</strong></div><div><FileClock size={19}/><span>En emisión</span><strong>08</strong></div><div><CalendarDays size={19}/><span>Renovaciones este mes</span><strong>12</strong></div></div>
      <CardTable header="Cartera de pólizas" sub="Todas las operaciones que aparecen aquí son ficticias" action={<span className="table-count">{visiblePolicies.length} registros</span>}><table><thead><tr><th>PÓLIZA</th><th>CLIENTE</th><th>ASEGURADORA</th><th>PRODUCTO</th><th>PRIMA</th><th>VENCIMIENTO</th><th>ESTADO</th><th/></tr></thead><tbody>{visiblePolicies.map(p=><tr key={p.id}><td className="td-id">{p.id}</td><td className="strong-cell">{p.client}</td><td>{p.insurer}</td><td>{p.product}</td><td className="strong-cell">{money(p.premium)}</td><td>{p.end}</td><td><Pill tone={statusTone(p.status)}>{p.status}</Pill></td><td><button className="row-action" onClick={()=>{setSelectedPolicy(p);setModal('detail');}} title="Abrir expediente"><ChevronRight size={18}/></button></td></tr>)}</tbody></table></CardTable>
     </>}
     {current==='clientes'&&<>
      <SectionHeader eyebrow="BASE COMERCIAL" title="Directorio de asegurados" desc="Información organizada por cliente, contratos y solicitudes." action={<button className="btn btn-soft" onClick={()=>notify('Alta de clientes disponible después de conectar la base de datos.')}><Plus size={16}/> Registrar cliente</button>}/>
      <div className="client-grid">{initialPolicies.filter((p,i,a)=>a.findIndex(x=>x.client===p.client)===i).filter(p=>filter(p.client,p.product)).map(p=><button key={p.id} className="customer-card" onClick={()=>{setSelectedPolicy(p);setModal('detail');}}><div className="customer-card-top"><span className="client-avatar large">{p.client.split(' ').map(x=>x[0]).join('')}</span><ArrowUpRight size={17}/></div><h3>{p.client}</h3><p>Cliente de demostración</p><div className="customer-card-data"><span><ShieldCheck size={15}/> {p.product}</span><Pill tone={statusTone(p.status)}>{p.status}</Pill></div></button>)}</div>
     </>}
     {current==='solicitudes'&&<>
      <SectionHeader eyebrow="SERVICIO AL ASEGURADO" title="Centro de solicitudes" desc="Consultas, siniestros, cambios y seguimiento, todo en un mismo flujo." action={<PrimaryButton onClick={()=>setModal('request')} icon={Plus}>Nueva solicitud</PrimaryButton>}/>
      <div className="support-layout"><div className="support-list">{visibleTickets.map(t=><article className="support-ticket" key={t.id}><div className="support-ticket-top"><span>{t.id} · {t.type}</span><Pill tone={statusTone(t.status)}>{t.status}</Pill></div><h3>{t.topic}</h3><p><UserRound size={15}/>{t.customer}<span className="ticket-dot"/> <Clock3 size={14}/>{t.time}</p><div className="ticket-footer"><span className={'priority priority-'+t.priority.toLowerCase()}>{t.priority} prioridad</span><button onClick={()=>resolveTicket(t.id)}>{t.status==='Resuelto'?'Reabrir caso':'Marcar resuelto'} <ArrowRight size={15}/></button></div></article>)}</div><aside className="support-aside"><div className="support-stat"><Headphones size={25}/><h3>Atención conectada</h3><p>Una sola línea de seguimiento para cada caso, con responsables y estados visibles.</p><div className="support-numbers"><span><strong>{tickets.filter(t=>t.status!=='Resuelto').length}</strong> abiertos</span><span><strong>{tickets.filter(t=>t.status==='Resuelto').length}</strong> resueltos</span></div></div></aside></div>
     </>}
     {current==='finanzas'&&<>
      <SectionHeader eyebrow="CONTROL FINANCIERO" title="Comisiones y conciliación" desc="Seguimiento de primas, liquidaciones de aseguradoras y diferencias por verificar." action={<button className="btn btn-soft" onClick={exportCsv}><Download size={16}/> Exportar CSV demo</button>}/>
      <div className="metric-grid finance-metrics"><Metric label="Comisiones estimadas" value="$8,420" trend="+9.4 % vs. periodo anterior" icon={TrendingUp}/><Metric label="Comisiones conciliadas" value="$6,180" trend="73.4 % conciliado" icon={CheckCircle2}/><Metric label="Pendientes de pago" value="$1,720" trend="Revisión requerida" icon={Clock3} quiet/><Metric label="Diferencias detectadas" value="$520" trend="2 movimientos abiertos" icon={Filter} quiet/></div>
      <div className="finance-grid"><CardTable header="Movimientos de comisiones" sub="Ejemplos de liquidaciones por aseguradora"><table><thead><tr><th>ASEGURADORA</th><th>PÓLIZA</th><th>BASE</th><th>TASA</th><th>COMISIÓN</th><th>ESTADO</th></tr></thead><tbody>{initialCommissions.map(c=><tr key={c.id}><td className="strong-cell">{c.company}</td><td className="td-id">{c.policy}</td><td>{money(c.base)}</td><td>{c.rate}%</td><td className="strong-cell">{money(c.amount)}</td><td><Pill tone={statusTone(c.status)}>{c.status}</Pill></td></tr>)}</tbody></table></CardTable><div className="data-card commission-card"><div className="data-card-head"><div><h3>Distribución</h3><p>Por estado de conciliación</p></div></div><div className="donut"><div className="donut-inner"><strong>73%</strong><span>conciliado</span></div></div><div className="donut-legend"><span><i className="legend-green"/> Conciliado <strong>73%</strong></span><span><i className="legend-silver"/> Pendiente <strong>21%</strong></span><span><i className="legend-gold"/> Revisión <strong>6%</strong></span></div></div></div>
     </>}
     {current==='equipo'&&<>
      <SectionHeader eyebrow="PERSONAL Y SUPERVISIÓN" title="Equipo y permisos" desc="Una estructura por áreas con supervisores y perfiles diferenciados." action={<button className="btn btn-soft" onClick={()=>setModal('agent')}><Plus size={16}/> Invitar colaborador</button>}/>
      <div className="team-grid">{team.filter(a=>filter(a.name,a.role+' '+a.area)).map(a=><article className="team-card" key={a.code}><div className="team-card-top"><span className="team-avatar">{a.initials}</span><Pill tone="green">{a.status}</Pill></div><h3>{a.name}</h3><p>{a.role}</p><div className="team-card-foot"><span>{a.area}</span><span>{a.code}</span></div></article>)}</div><div className="security-note"><LockKeyhole size={21}/><div><strong>Permisos por rol y validación administrativa</strong><p>En producción, los usuarios no podrán asignarse áreas o privilegios. El acceso deberá verificarse en el servidor y en las reglas de seguridad de Firebase.</p></div></div>
     </>}
     {current==='documentos'&&<>
      <SectionHeader eyebrow="ARCHIVO DIGITAL" title="Centro documental" desc="Carga de archivos desde dispositivos, cámara y digitalización asistida." action={<PrimaryButton onClick={()=>setModal('upload')} icon={CloudUpload}>Agregar documento</PrimaryButton>}/>
      <div className="upload-options"><button onClick={()=>fileRef.current?.click()}><Upload size={24}/><strong>Subir desde dispositivo</strong><span>PDF, imágenes y archivos digitales</span><ArrowUpRight size={17}/></button><button onClick={()=>scanRef.current?.click()}><Camera size={24}/><strong>Usar cámara</strong><span>Captura desde un dispositivo compatible</span><ArrowUpRight size={17}/></button><button onClick={()=>scanRef.current?.click()}><ScanLine size={24}/><strong>Escanear documento</strong><span>Vista preliminar de futura digitalización</span><ArrowUpRight size={17}/></button></div>
      <input hidden ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" multiple onChange={e=>{addFiles(e.target.files);e.target.value='';}}/><input hidden ref={scanRef} type="file" accept="image/*" capture="environment" onChange={e=>{addFiles(e.target.files);e.target.value='';}}/>
      <div className="security-note"><LockKeyhole size={20}/><div><strong>Modo de demostración: no se guardan archivos.</strong><p>Los nombres de los archivos seleccionados solo aparecen en la sesión actual. OCR, corrección de perspectiva, Storage y expedientes privados se habilitarán en fases posteriores.</p></div></div>
      <CardTable header="Biblioteca documental" sub="Ejemplos de los archivos que tendrá la plataforma" action={<span className="table-count">{documents.filter(f=>role!=='cliente'||f.owner==='Carlos Mendoza').length} archivos</span>}><table><thead><tr><th>DOCUMENTO</th><th>TIPO</th><th>EXPEDIENTE</th><th>FECHA</th><th>TAMAÑO</th><th>ESTADO</th></tr></thead><tbody>{documents.filter(f=>role!=='cliente'||f.owner==='Carlos Mendoza').filter(f=>filter(f.name,f.owner)).map((d,i)=><tr key={d.name+i}><td className="doc-title"><FileText size={19}/>{d.name}</td><td>{d.type}</td><td>{d.owner}</td><td>{d.date}</td><td>{d.size}</td><td><Pill tone={d.type.includes('Demo')?'amber':'green'}>{d.type.includes('Demo')?'Solo sesión':'Ejemplo'}</Pill></td></tr>)}</tbody></table></CardTable>
     </>}
     {current==='configuracion'&&<>
      <SectionHeader eyebrow="ADMINISTRACIÓN GLOBAL" title="Configuración del entorno" desc="Preferencias visuales para explorar los parámetros de la plataforma."/>
      <div className="settings-layout"><section className="data-card settings-card"><div className="data-card-head"><div><h3>Preferencias de notificación</h3><p>Controles locales de demostración</p></div></div>{([{key:'email',title:'Notificaciones de correo',desc:'Avisos de actividad del equipo'},{key:'renewals',title:'Alertas de renovación',desc:'Recordatorios de vencimientos próximos'},{key:'alerts',title:'Eventos importantes',desc:'Alertas de solicitudes y conciliaciones'}] as const).map(item=><label className="setting-row" key={item.key}><span><strong>{item.title}</strong><small>{item.desc}</small></span><input type="checkbox" checked={settings[item.key]} onChange={e=>setSettings(s=>({...s,[item.key]:e.target.checked}))}/></label>)}</section><aside className="data-card integration-card"><span className="integration-icon"><LockKeyhole size={24}/></span><h3>Integraciones pendientes</h3><p>Firebase Authentication, Firestore y Cloud Storage se conectarán tras aprobar alcance y políticas de seguridad.</p><div className="integration-list"><span><i/> Firebase Auth <b>Pendiente</b></span><span><i/> Firestore <b>Pendiente</b></span><span><i/> Cloud Storage <b>Pendiente</b></span></div></aside></div>
     </>}
     <footer className="workspace-footer"><span>© 2026 · Concepto demostrativo para intermediación de seguros</span><span><Shield size={13}/> Sin datos personales reales <span className="footer-dot"/> XARCON SYSTEMS</span></footer>
    </div>
   </main>
  </div>
  {notification&&<div className="toast" role="status"><CheckCircle2 size={18}/><span>{notification}</span><button onClick={()=>setNotification(null)} aria-label="Cerrar aviso"><X size={16}/></button></div>}
  {modal==='lead'&&<Modal title="Registrar oportunidad" description="El nuevo prospecto solo se guardará mientras esta página permanezca abierta." onClose={()=>setModal(null)}><form className="modal-form" onSubmit={addLead}><label>Nombre del prospecto<input autoFocus required value={newLead.name} onChange={e=>setNewLead(s=>({...s,name:e.target.value}))} placeholder="Nombre de ejemplo"/></label><div className="form-two"><label>Producto<select value={newLead.product} onChange={e=>setNewLead(s=>({...s,product:e.target.value}))}>{products.map(p=><option key={p.name}>{p.name}</option>)}</select></label><label>Origen<select value={newLead.channel} onChange={e=>setNewLead(s=>({...s,channel:e.target.value}))}>{['Web','Referido','WhatsApp','Redes','Otro'].map(c=><option key={c}>{c}</option>)}</select></label></div><label>Valor estimado (USD)<input required type="number" min="0" value={newLead.value} onChange={e=>setNewLead(s=>({...s,value:e.target.value}))}/></label><p className="input-note"><LockKeyhole size={14}/> Usa datos de prueba. Todavía no existe base de datos conectada.</p><button type="submit" className="btn btn-primary full">Agregar a demostración <ArrowRight size={16}/></button></form></Modal>}
  {modal==='upload'&&<Modal title="Adjuntar documento" description="Selecciona un archivo local para mostrar su nombre en la biblioteca de demostración." onClose={()=>setModal(null)}><div className="modal-upload-choices"><button onClick={()=>fileRef.current?.click()}><Upload size={26}/><strong>Elegir archivo</strong><span>PDF · JPG · PNG</span></button><button onClick={()=>scanRef.current?.click()}><Camera size={26}/><strong>Abrir cámara</strong><span>En dispositivos compatibles</span></button></div><p className="input-note"><LockKeyhole size={14}/> No se enviará información a servidores.</p></Modal>}
  {modal==='request'&&<Modal title="Nueva solicitud" description="Simula un requerimiento de soporte o gestión de póliza." onClose={()=>setModal(null)}><form className="modal-form" onSubmit={e=>{e.preventDefault();setModal(null);notify('Solicitud simulada. No se ha enviado información real.');}}><label>Tipo de solicitud<select><option>Consulta de cobertura</option><option>Modificación de póliza</option><option>Reporte de siniestro</option><option>Renovación</option></select></label><label>Descripción<textarea required placeholder="Describe brevemente la solicitud ficticia" rows={4}/></label><button type="submit" className="btn btn-primary full">Simular solicitud <Send size={16}/></button></form></Modal>}
  {modal==='agent'&&<Modal title="Invitar colaborador" description="Vista conceptual de creación de perfiles y asignación de departamento." onClose={()=>setModal(null)}><form className="modal-form" onSubmit={e=>{e.preventDefault();setModal(null);notify('Invitación simulada. Sin correos enviados ni permisos asignados.');}}><label>Nombre completo<input required placeholder="Nombre del colaborador"/></label><div className="form-two"><label>Cédula / identificación<input required placeholder="Identificación de prueba"/></label><label>Teléfono<input required type="tel" placeholder="Teléfono de prueba"/></label></div><label>Código interno<input placeholder="Se generará al validar el perfil"/></label><label>Fotografía de perfil<input type="file" accept="image/*"/></label><label>Correo empresarial<input required type="email" placeholder="agente@empresa.com"/></label><label>Departamento<select><option>Comercial y ventas</option><option>Operaciones y pólizas</option><option>Servicio al cliente</option><option>Finanzas</option></select></label><label>Rol propuesto<select><option>Agente</option><option>Supervisor de área</option></select></label><p className="input-note"><LockKeyhole size={14}/> La invitación real requerirá aprobación de administradores y autenticación verificada.</p><button type="submit" className="btn btn-primary full">Simular invitación <ArrowRight size={16}/></button></form></Modal>}
  {modal==='detail'&&selectedPolicy&&<Modal title={'Expediente '+selectedPolicy.id} description="Información de muestra, sin conexión con aseguradoras." onClose={()=>setModal(null)}><div className="policy-detail"><div className="detail-banner"><span><ShieldCheck size={24}/> PÓLIZA DE SEGURO</span><Pill tone={statusTone(selectedPolicy.status)}>{selectedPolicy.status}</Pill></div>{[['Asegurado',selectedPolicy.client],['Aseguradora',selectedPolicy.insurer],['Producto',selectedPolicy.product],['Prima estimada',money(selectedPolicy.premium)],['Comisión estimada',money(selectedPolicy.commission)],['Vencimiento',selectedPolicy.end]].map(([k,v])=><div key={k} className="detail-row"><span>{k}</span><strong>{v}</strong></div>)}<button className="btn btn-primary full" onClick={()=>{setModal(null);chooseSection('documentos');}}>Ver centro documental <ArrowRight size={16}/></button></div></Modal>}
 </div>;
}
export default function App(){
 const [mode,setMode]=useState<'public'|'app'>(()=>window.location.hash.startsWith('#/demo')?'app':'public');
 function go(mode:'public'|'app'){setMode(mode);window.history.replaceState({},'',mode==='app'?'#/demo':'#/');window.scrollTo({top:0,behavior:'instant'});}
 return mode==='public'?<PublicSite openDemo={()=>go('app')}/>:<DemoApp goPublic={()=>go('public')}/>;
}
