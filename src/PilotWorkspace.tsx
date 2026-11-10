import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  Activity, ArrowRight, BadgeCheck, CalendarDays, CheckCircle2, CloudUpload, Database,
  Download, FileText, FlaskConical, Inbox, Plus, RefreshCw, ShieldCheck, Users, Wallet
} from 'lucide-react';
import { money } from './data';
import { nicaraguanInsurers, insurerById, insurerFromText } from './insurers';
import InsuranceDirectory from './InsuranceDirectory';
import ExecutiveDashboard from './ExecutiveDashboard';
import CustomerDossier from './CustomerDossier';
import { seedInsurancePortfolio } from './insuranceSeed';
import {
  advancePilotLead, createPilotClient, createPilotLead, createPilotPolicy, createPilotTicket,
  downloadPilotDocument, pilotCollectionNames, resolvePilotTicket,
  subscribePilot, uploadPilotDocument,
  type PilotRows, type PilotCollection, type PilotDocument, type PilotLead, type PilotTicket
} from './pilotData';

type Tab='resumen'|'clientes'|'oportunidades'|'polizas'|'aseguradoras'|'solicitudes'|'documentos'|'actividad';
const nav: {id:Tab;label:string}[]=[
  {id:'resumen',label:'Vista ejecutiva'},
  {id:'clientes',label:'Clientes'},
  {id:'oportunidades',label:'Oportunidades'},
  {id:'polizas',label:'Pólizas y comisiones'},
  {id:'aseguradoras',label:'Aseguradoras'},
  {id:'solicitudes',label:'Servicio'},
  {id:'documentos',label:'Documentos'},
  {id:'actividad',label:'Auditoría'}
];
const emptyRows:PilotRows={
  pilotClients:[],pilotLeads:[],pilotPolicies:[],pilotTickets:[],
  pilotCommissions:[],pilotDocuments:[],pilotActivities:[]
};
const makeForm=()=>({
  fullName:'',email:'',phone:'',city:'Matagalpa',clientId:'',
  product:'Seguro vehicular',estimatedPremium:'',source:'Web',
  leadId:'',insurerId:'assa',premium:'',
  commissionRate:'15',startDate:'',endDate:'',
  subject:'',detail:'',policyId:''
});
const messageOf=(e:unknown)=>e instanceof Error?e.message:String(e);
function formatDate(v:unknown) {
  if(v&&typeof v==='object'&&'toDate' in v&&typeof v.toDate==='function')
    return new Intl.DateTimeFormat('es-NI',{dateStyle:'medium',timeStyle:'short'}).format(v.toDate());
  return 'Pendiente de fecha';
}
function empty(label:string) {
  return <div className="pilot-empty"><Inbox size={26}/><strong>{label}</strong><span>Crea un registro o carga el escenario ficticio para comenzar.</span></div>;
}
function Field({title,children}:{title:string;children:React.ReactNode}) {
  return <label className="pilot-field"><span>{title}</span>{children}</label>;
}

export default function PilotWorkspace({user}:{user:User}) {
  const [tab,setTab]=useState<Tab>('resumen');
  const [selectedClientId,setSelectedClientId]=useState('');
  const [listQuery,setListQuery]=useState('');
  const [rows,setRows]=useState<PilotRows>(emptyRows);
  const [loaded,setLoaded]=useState<PilotCollection[]>([]);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [form,setForm]=useState(makeForm);
  const [file,setFile]=useState<File|null>(null);
  const inputFile=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    const unsubs=pilotCollectionNames.map(name=>subscribePilot(name,
      list=>{
        setRows(previous=>({...previous,[name]:list}));
        setLoaded(previous=>previous.includes(name)?previous:[...previous,name]);
      },
      e=>setError('No fue posible consultar el laboratorio: '+messageOf(e))
    ));
    return()=>unsubs.forEach(stop=>stop());
  },[]);
  const clients=rows.pilotClients;
  const leads=rows.pilotLeads;
  const policies=rows.pilotPolicies;
  const tickets=rows.pilotTickets;
  const commissions=rows.pilotCommissions;
  const docs=rows.pilotDocuments;
  const activities=rows.pilotActivities;
  const clientName=(id:string)=>clients.find(c=>c.id===id)?.fullName||'Cliente sin referencia';
  const selectedClient=clients.find(c=>c.id===selectedClientId);
  const matchesQuery=(...fields:unknown[])=>fields.some(value=>String(value||'').toLowerCase().includes(listQuery.trim().toLowerCase()));
  const opportunities=useMemo(()=>leads.filter(l=>l.clientId===form.clientId),[leads,form.clientId]);
  const clientPolicies=useMemo(()=>policies.filter(p=>p.clientId===form.clientId),[policies,form.clientId]);
  const totalPremium=policies.reduce((sum,p)=>sum+Number(p.premium||0),0);
  const totalCommission=commissions.reduce((sum,c)=>sum+Number(c.amount||0),0);
  const pendingTickets=tickets.filter(t=>t.status!=='Resuelto').length;

  function change(key:keyof ReturnType<typeof makeForm>,value:string) {
    setForm(previous=>({...previous,[key]:value,...(key==='clientId'?{leadId:'',policyId:''}:{})}));
  }
  async function perform(task:()=>Promise<unknown>,successMessage:string,resetForm=true) {
    setBusy(true);setError('');setNotice('');
    try{
      await task();
      setNotice(successMessage);
      if(resetForm) {setForm(makeForm());setFile(null);if(inputFile.current)inputFile.current.value='';}
    }catch(e){setError(messageOf(e));}
    finally{setBusy(false);}
  }
  async function onSubmit(e:FormEvent) {
    e.preventDefault();
    if(tab==='clientes') return perform(()=>createPilotClient(user,{
      fullName:form.fullName,email:form.email,phone:form.phone,city:form.city
    }),'Cliente ficticio guardado en Firestore.');
    if(!form.clientId){setError('Primero selecciona un cliente.');return;}
    if(tab==='oportunidades') return perform(()=>createPilotLead(user,{
      clientId:form.clientId,product:form.product,estimatedPremium:Number(form.estimatedPremium),source:form.source,
      insurerId:form.insurerId
    }),'Oportunidad registrada y vinculada al cliente.');
    if(tab==='polizas') return perform(()=>createPilotPolicy(user,{
      clientId:form.clientId,leadId:form.leadId,insurerId:form.insurerId,product:form.product,
      premium:Number(form.premium),commissionRate:Number(form.commissionRate),
      startDate:form.startDate,endDate:form.endDate
    }),'Póliza creada, comisión calculada y oportunidad actualizada.');
    if(tab==='solicitudes') return perform(()=>createPilotTicket(user,{
      clientId:form.clientId,subject:form.subject,detail:form.detail
    }),'Solicitud registrada en el expediente del cliente.');
    if(tab==='documentos') {
      if(!file){setError('Selecciona un archivo ficticio antes de continuar.');return;}
      return perform(()=>uploadPilotDocument(user,{clientId:form.clientId,policyId:form.policyId,file}),
        'Documento de prueba guardado en Storage y vinculado a su responsable.');
    }
  }
  const clientSelection=<Field title="Cliente del expediente"><select required value={form.clientId} onChange={e=>change('clientId',e.target.value)}>
    <option value="">Seleccionar cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.fullName}</option>)}
  </select></Field>;

  const formTitle:Record<string,string>={
    clientes:'Nuevo cliente de prueba',oportunidades:'Nueva oportunidad',
    polizas:'Registrar póliza de prueba',solicitudes:'Nueva solicitud',
    documentos:'Adjuntar archivo de prueba'
  };
  const listTitle:Record<string,string>={
    clientes:'Directorio de clientes',oportunidades:'Embudo comercial',
    polizas:'Cartera de pólizas',aseguradoras:'Directorio de aseguradoras',resumen:'Vista ejecutiva',solicitudes:'Casos en atención',
    documentos:'Centro documental',actividad:'Registro de operaciones'
  };

  return <div className="pilot-root">
    <div className="pilot-hero">
      <div><span className="pilot-kicker"><FlaskConical size={15}/> LABORATORIO OPERATIVO · DIRECCIÓN</span>
        <h2>Un centro de operaciones, no solo formularios.</h2>
        <p>Cartera, renovaciones, aseguradoras, comisiones y casos de servicio conectados en tiempo real. Catálogo real de aseguradoras y operaciones exclusivamente ficticias.</p>
      </div>
      <button disabled={busy} className="btn btn-dark pilot-seed-button" onClick={()=>void perform(
        async()=>{const inserted=await seedInsurancePortfolio(user);if(!inserted)throw new Error('La cartera de ejemplo ya está cargada. Continuá trabajando con sus registros.')},
        'Cartera de ejemplo cargada: cinco aseguradoras, pólizas, comisiones y renovaciones.',false
      )}><Plus size={15}/> Cargar cartera operativa ficticia</button>
    </div>
    <div className="pilot-status-row">
      <span><ShieldCheck size={14}/> Acceso exclusivo de dirección</span>
      <span><Database size={14}/> Firestore · Colecciones piloto</span>
      <span><RefreshCw size={14}/> Sincronización en vivo</span>
      <span className="pilot-test-warning">CATÁLOGO REAL · PÓLIZAS FICTICIAS · SIN CONEXIÓN CON ASEGURADORAS</span>
    </div>
    {error&&<div role="alert" className="pilot-alert pilot-error">{error}<button onClick={()=>setError('')} aria-label="Cerrar mensaje">×</button></div>}
    {notice&&<div role="status" className="pilot-alert pilot-success"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice('')} aria-label="Cerrar mensaje">×</button></div>}
    {loaded.length<pilotCollectionNames.length&&<p className="pilot-loading">Conectando módulos a Firebase… {loaded.length}/{pilotCollectionNames.length}</p>}
    <div className="pilot-metrics">
      {[
        {label:'Clientes',value:clients.length,icon:Users},
        {label:'Oportunidades',value:leads.length,icon:Activity},
        {label:'Prima de referencia',value:money(totalPremium),icon:ShieldCheck},
        {label:'Comisión de referencia',value:money(totalCommission),icon:Wallet},
        {label:'Casos pendientes',value:pendingTickets,icon:Inbox}
      ].map(m=><div className="pilot-metric" key={m.label}><span>{m.label}<m.icon size={18}/></span><strong>{m.value}</strong></div>)}
    </div>
    <nav className="pilot-tabs" aria-label="Módulos del laboratorio">
      {nav.map(n=><button key={n.id} className={tab===n.id?'selected':''} onClick={()=>{setTab(n.id);setListQuery('');setError('');setNotice('');setForm(makeForm());}}>{n.label}</button>)}
    </nav>
    {tab==='resumen'&&<ExecutiveDashboard
      clients={clients} leads={leads} policies={policies} commissions={commissions}
      tickets={tickets} documents={docs} activities={activities}
      onNavigate={setTab}
    />}
    {tab==='aseguradoras'&&<InsuranceDirectory policies={policies} onSelect={company=>{
      setForm({...makeForm(),insurerId:company.id});
      setTab('polizas');setError('');setNotice('');
    }}/>}
    {tab!=='resumen'&&tab!=='aseguradoras'&&<div className={'pilot-layout '+(tab==='actividad'?'pilot-layout-full':'')}>
      <section className="pilot-list-panel">
        <div className="pilot-panel-heading"><div><span className="pilot-panel-eyebrow">INFORMACIÓN EN VIVO</span><h3>{listTitle[tab]}</h3></div>
        <span className="pilot-list-count">{tab==='clientes'?clients.length:tab==='oportunidades'?leads.length:tab==='polizas'?policies.length:tab==='solicitudes'?tickets.length:tab==='documentos'?docs.length:activities.length} registros</span></div>
        <div className="pilot-filter-row">
          <input type="search" value={listQuery} onChange={e=>setListQuery(e.target.value)}
            aria-label="Filtrar registros del módulo" placeholder="Buscar por nombre, producto, aseguradora o referencia…" />
          {listQuery&&<button onClick={()=>setListQuery('')}>Limpiar</button>}
        </div>

        {tab==='clientes'&&(clients.length?clients.filter(c=>matchesQuery(c.fullName,c.city,c.email)).map(c=><div className="pilot-row" key={c.id}>
          <div className="pilot-monogram">{c.fullName.slice(0,2).toUpperCase()}</div>
          <div className="pilot-row-body"><strong>{c.fullName}</strong><small>{c.city} · {c.email||'Sin correo'}</small>
            <small>{leads.filter(l=>l.clientId===c.id).length} oportunidades · {policies.filter(p=>p.clientId===c.id).length} pólizas · {docs.filter(d=>d.clientId===c.id).length} documentos</small>
          </div><button className="ins-dossier-open" onClick={()=>setSelectedClientId(c.id)}>Abrir expediente <ArrowRight size={14}/></button>
        </div>):empty('Aún no hay clientes'))}

        {tab==='oportunidades'&&(leads.length?leads.filter(l=>matchesQuery(clientName(l.clientId),l.product,l.source,insurerById(l.insurerId||'')?.displayName)).map(l=><div className="pilot-row" key={l.id}>
          <div className="pilot-icon"><Activity size={19}/></div>
          <div className="pilot-row-body"><strong>{clientName(l.clientId)}</strong><small>{l.product} · {l.source} · {insurerById(l.insurerId||'')?.displayName||'Sin aseguradora asignada'}</small><small>{money(l.estimatedPremium)} · Responsable: {l.assignedTo===user.uid?'Dirección':'Colaborador'}</small></div>
          <div className="pilot-row-side"><span className="pilot-status">{l.status}</span>{l.status!=='Ganado'&&<button disabled={busy} className="pilot-inline" onClick={()=>void perform(()=>advancePilotLead(user,l),'Oportunidad actualizada.',false)}>Avanzar <ArrowRight size={13}/></button>}</div>
        </div>):empty('Aún no hay oportunidades'))}

        {tab==='polizas'&&<>
          {policies.length?policies.filter(p=>matchesQuery(p.policyNumber,clientName(p.clientId),p.insurer,p.product)).map(p=><div className="pilot-row" key={p.id}>
            <div className="pilot-icon"><ShieldCheck size={19}/></div>
            <div className="pilot-row-body"><strong>{p.policyNumber}</strong><small>{clientName(p.clientId)} · {p.product}</small><small>{p.insurer} · {p.startDate} — {p.endDate}</small>
              <small>Prima {money(p.premium)} · Comisión {p.commissionRate}% · {insurerFromText(p.insurer)?.shortName||'Referencia anterior'}</small></div><span className="pilot-status positive">{p.endDate<new Date().toISOString().slice(0,10)?'Vencimiento de prueba':p.status}</span>
          </div>):empty('Aún no hay pólizas')}
          {commissions.length>0&&<div className="pilot-commission-area"><h4>Comisiones vinculadas</h4>
            {commissions.map(c=><div key={c.id} className="pilot-commission-line"><span>{clientName(c.clientId)} · {c.rate}%</span><strong>{money(c.amount)}</strong><span className="pilot-status">{c.status}</span></div>)}
          </div>}
        </>}

        {tab==='solicitudes'&&(tickets.length?tickets.filter(t=>matchesQuery(t.subject,t.detail,clientName(t.clientId))).map(t=><div className="pilot-row" key={t.id}>
          <div className="pilot-icon"><Inbox size={19}/></div>
          <div className="pilot-row-body"><strong>{t.subject}</strong><small>{clientName(t.clientId)}</small><small>{t.detail}</small></div>
          <div className="pilot-row-side"><span className="pilot-status">{t.status}</span>{t.status!=='Resuelto'&&<button disabled={busy} className="pilot-inline" onClick={()=>void perform(()=>resolvePilotTicket(user,t),'Solicitud resuelta.',false)}>Resolver <CheckCircle2 size={13}/></button>}</div>
        </div>):empty('Aún no hay solicitudes'))}

        {tab==='documentos'&&(docs.length?docs.filter(d=>matchesQuery(d.fileName,clientName(d.clientId),d.uploaderEmail)).map((d:PilotDocument)=><div className="pilot-row" key={d.id}>
          <div className="pilot-icon"><FileText size={19}/></div>
          <div className="pilot-row-body"><strong>{d.fileName}</strong><small>{clientName(d.clientId)} · {Math.ceil(d.bytes/1024)} KB</small><small>Subido por: {d.uploaderEmail} · {formatDate(d.createdAt)}</small></div>
          <button className="pilot-icon-button" title="Descargar archivo autorizado" onClick={()=>void perform(()=>downloadPilotDocument(d),'Archivo de prueba descargado.',false)}><Download size={18}/></button>
        </div>):empty('Todavía no hay documentos'))}

        {tab==='actividad'&&(activities.length? [...activities].filter(a=>matchesQuery(a.label,a.category,a.actorEmail,clientName(a.clientId))).sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0)).map(a=><div className="pilot-row" key={a.id}>
          <div className="pilot-icon"><CalendarDays size={19}/></div>
          <div className="pilot-row-body"><strong>{a.label}</strong><small>{clientName(a.clientId)} · {a.actorEmail}</small><small>{formatDate(a.createdAt)} · {a.category}</small></div><BadgeCheck size={17} className="pilot-audit-mark"/>
        </div>):empty('Sin actividad registrada'))}
      </section>

      {tab!=='actividad'&&<aside className="pilot-form-panel">
        <div className="pilot-panel-heading"><div><span className="pilot-panel-eyebrow">NUEVA OPERACIÓN</span><h3>{formTitle[tab]}</h3></div><Plus size={18}/></div>
        <form className="pilot-form" onSubmit={e=>void onSubmit(e)}>
          {tab==='clientes'&&<>
            <Field title="Nombre ficticio"><input required maxLength={120} value={form.fullName} onChange={e=>change('fullName',e.target.value)} placeholder="Cliente Ejemplo 05"/></Field>
            <Field title="Correo de ejemplo (opcional)"><input type="email" maxLength={150} value={form.email} onChange={e=>change('email',e.target.value)} placeholder="cliente@example.invalid"/></Field>
            <Field title="Teléfono ficticio"><input maxLength={32} value={form.phone} onChange={e=>change('phone',e.target.value)} placeholder="0000 0000"/></Field>
            <Field title="Localidad"><input required value={form.city} onChange={e=>change('city',e.target.value)}/></Field>
          </>}
          {tab!=='clientes'&&clientSelection}
          {tab==='oportunidades'&&<>
            <Field title="Producto"><select value={form.product} onChange={e=>change('product',e.target.value)}><option>Seguro vehicular</option><option>Seguro de vida</option><option>Seguro de salud</option><option>Seguro de hogar</option><option>Seguro empresarial</option></select></Field>
            <Field title="Prima estimada (USD)"><input required type="number" min="0" step=".01" value={form.estimatedPremium} onChange={e=>change('estimatedPremium',e.target.value)}/></Field>
            <Field title="Aseguradora de interés"><select value={form.insurerId} onChange={e=>change('insurerId',e.target.value)}>{nicaraguanInsurers.map(i=><option key={i.id} value={i.id}>{i.displayName}</option>)}</select></Field>
            <Field title="Origen"><select value={form.source} onChange={e=>change('source',e.target.value)}><option>Web</option><option>Referido</option><option>Teléfono</option><option>WhatsApp</option><option>Redes sociales</option></select></Field>
          </>}
          {tab==='polizas'&&<>
            <Field title="Vincular oportunidad (opcional)"><select value={form.leadId} onChange={e=>change('leadId',e.target.value)}><option value="">Sin oportunidad asociada</option>{opportunities.map(l=><option key={l.id} value={l.id}>{l.product} · {l.status}</option>)}</select></Field>
            <Field title="Aseguradora (catálogo oficial)"><select required value={form.insurerId} onChange={e=>change('insurerId',e.target.value)}>{nicaraguanInsurers.map(i=><option key={i.id} value={i.id}>{i.displayName} · SIBOIF {i.registryId}</option>)}</select></Field>
            <div className="ins-policy-ref"><ShieldCheck size={15}/><span>{insurerById(form.insurerId)?.legalName}<small>Referencia de directorio; no existe conexión de emisión con la aseguradora.</small></span></div>
            <Field title="Producto"><select value={form.product} onChange={e=>change('product',e.target.value)}><option>Seguro vehicular</option><option>Seguro de vida</option><option>Seguro de hogar</option><option>Seguro de salud</option><option>Seguro empresarial</option></select></Field>
            <div className="pilot-form-duo"><Field title="Prima (USD)"><input required type="number" min="0" step=".01" value={form.premium} onChange={e=>change('premium',e.target.value)}/></Field>
            <Field title="Comisión (%)"><input required type="number" min="0" max="100" step=".01" value={form.commissionRate} onChange={e=>change('commissionRate',e.target.value)}/></Field></div>
            <div className="pilot-form-duo"><Field title="Inicio de vigencia"><input required type="date" value={form.startDate} onChange={e=>change('startDate',e.target.value)}/></Field>
            <Field title="Final de vigencia"><input required type="date" min={form.startDate||undefined} value={form.endDate} onChange={e=>change('endDate',e.target.value)}/></Field></div>
            {form.premium&&<div className="pilot-preview">Comisión estimada: <strong>{money(Number(form.premium)*Number(form.commissionRate)/100)}</strong></div>}
          </>}
          {tab==='solicitudes'&&<>
            <Field title="Asunto"><input required maxLength={130} value={form.subject} onChange={e=>change('subject',e.target.value)} placeholder="Consulta sobre cobertura"/></Field>
            <Field title="Detalle"><textarea required maxLength={1500} rows={4} value={form.detail} onChange={e=>change('detail',e.target.value)} placeholder="Describe la gestión de ejemplo"/></Field>
          </>}
          {tab==='documentos'&&<>
            <Field title="Póliza vinculada (opcional)"><select value={form.policyId} onChange={e=>change('policyId',e.target.value)}><option value="">Expediente general del cliente</option>{clientPolicies.map(p=><option key={p.id} value={p.id}>{p.policyNumber}</option>)}</select></Field>
            <Field title="PDF o imagen ficticia, máx. 8 MB"><input ref={inputFile} required type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></Field>
            <p className="pilot-file-warning">No adjuntes cédulas auténticas, pólizas reales ni documentos con datos personales. Los metadatos conservarán el usuario que realizó la carga.</p>
          </>}
          <button type="submit" className="btn btn-dark pilot-save" disabled={busy||(tab!=='clientes'&&!clients.length)}>
            {busy?'Procesando…':tab==='documentos'?'Guardar documento':'Guardar en Firebase'} {tab==='documentos'?<CloudUpload size={15}/>:<ArrowRight size={15}/>}
          </button>
          <p className="pilot-form-footnote">Los registros de prueba se guardan en Firestore. Los nombres de aseguradoras provienen de SIBOIF; ninguna operación genera una póliza auténtica.</p>
        </form>
      </aside>}
    </div>}
    {selectedClient&&<CustomerDossier client={selectedClient} leads={leads}
      policies={policies} commissions={commissions} tickets={tickets} documents={docs}
      onClose={()=>setSelectedClientId('')}
      onAction={(next,clientId)=>{
        setSelectedClientId('');
        setTab(next);
        setListQuery('');
        setForm({...makeForm(),clientId});
        setNotice('Expediente seleccionado: '+clientName(clientId));
      }}
    />}
  </div>;
}
