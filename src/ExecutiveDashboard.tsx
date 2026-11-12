import {
  Activity, ArrowRight, CalendarClock, CheckCheck, Clock3, FileText,
  ShieldAlert, ShieldCheck, TrendingUp, UserPlus, Users, Wallet
} from 'lucide-react';
import type {
  PilotClient,PilotLead,PilotPolicy,PilotCommission,PilotTicket,
  PilotActivity,PilotDocument,LeadStage
} from './pilotData';
import { insurerFromText } from './insurers';
import { money } from './data';

type Destination='clientes'|'oportunidades'|'polizas'|'solicitudes'|'documentos'|'actividad'|'aseguradoras';
function daysUntil(value:string) {
  const target=new Date(value+'T12:00:00Z');
  if(Number.isNaN(target.valueOf()))return null;
  const today=new Date();
  today.setUTCHours(12,0,0,0);
  return Math.round((target.getTime()-today.getTime())/86400000);
}
export default function ExecutiveDashboard({
  clients,leads,policies,commissions,tickets,documents,activities,onNavigate,onStartRenewal,busy=false
}:{
  clients:PilotClient[];leads:PilotLead[];policies:PilotPolicy[];
  commissions:PilotCommission[];tickets:PilotTicket[];documents:PilotDocument[];
  activities:PilotActivity[];onNavigate:(tab:Destination)=>void;
  onStartRenewal:(policy:PilotPolicy)=>void;busy?:boolean;
}) {
  const stages:LeadStage[]=['Nuevo','Contactado','Cotización','Negociación','Ganado'];
  const activeLeads=leads.filter(l=>l.status!=='Ganado');
  const expirations=policies.map(p=>({policy:p,days:daysUntil(p.endDate)}))
    .filter((row):row is {policy:PilotPolicy;days:number}=>row.days!==null)
    .filter(row=>row.days<=60).sort((a,b)=>a.days-b.days);
  const pendingCases=tickets.filter(t=>t.status!=='Resuelto');
  const byCustomer=(id:string)=>clients.find(c=>c.id===id)?.fullName||'Cliente de ejemplo';
  const premium=policies.reduce((sum,p)=>sum+Number(p.premium||0),0);
  const commission=commissions.reduce((sum,c)=>sum+Number(c.amount||0),0);
  const metrics=[
    {label:'Clientes de ejemplo',value:String(clients.length),description:'Expedientes vinculables',icon:Users,go:'clientes' as Destination},
    {label:'Pólizas de referencia',value:String(policies.length),description:'Cartera ficticia',icon:ShieldCheck,go:'polizas' as Destination},
    {label:'Primas registradas',value:money(premium),description:'Valores ilustrativos USD',icon:TrendingUp,go:'polizas' as Destination},
    {label:'Comisiones estimadas',value:money(commission),description:'Sin conciliación real',icon:Wallet,go:'polizas' as Destination}
  ];
  return <div className="ins-executive">
    <div className="ins-exec-heading">
      <div><span className="ins-eyebrow"><Activity size={15}/> CENTRO DE CONTROL OPERATIVO</span>
        <h3>Cartera y gestiones, en un solo lugar.</h3>
        <p>Indicadores calculados a partir de registros ficticios guardados en Firebase. Las operaciones actualizan este tablero en tiempo real.</p>
      </div>
      <button className="ins-quick-primary" onClick={()=>onNavigate('aseguradoras')}>Explorar aseguradoras <ArrowRight size={16}/></button>
    </div>
    <div className="ins-exec-metrics">
      {metrics.map(metric=><button className="ins-exec-metric" key={metric.label} onClick={()=>onNavigate(metric.go)}>
        <span>{metric.label}<metric.icon size={19}/></span>
        <strong>{metric.value}</strong><small>{metric.description}</small>
      </button>)}
    </div>
    <div className="ins-exec-grid">
      <section className="ins-exec-panel">
        <div className="ins-panel-heading">
          <div><span className="ins-eyebrow">GESTIÓN COMERCIAL</span><h4>Embudo de oportunidades</h4></div>
          <button onClick={()=>onNavigate('oportunidades')}>Ver todas <ArrowRight size={14}/></button>
        </div>
        <div className="ins-funnel-list">
          {stages.map(stage=>{
            const count=leads.filter(l=>l.status===stage).length;
            return <div key={stage} className="ins-funnel-row">
              <span>{stage}</span><div><i style={{width:(leads.length?Math.max(count/leads.length*100, count?5:0):0)+'%'}}/></div><strong>{count}</strong>
            </div>;
          })}
        </div>
        <div className="ins-panel-footer"><span><Activity size={15}/> {activeLeads.length} oportunidades abiertas</span>
          <button onClick={()=>onNavigate('oportunidades')}>Trabajar oportunidades <ArrowRight size={14}/></button></div>
      </section>
      <section className="ins-exec-panel">
        <div className="ins-panel-heading">
          <div><span className="ins-eyebrow">PRÓXIMAS GESTIONES</span><h4>Renovaciones y alertas</h4></div>
          <CalendarClock size={18}/>
        </div>
        <div className="ins-renewal-list">
          {expirations.slice(0,5).length?expirations.slice(0,5).map(({policy,days})=><button key={policy.id} disabled={busy||tickets.some(t=>t.policyId===policy.id&&t.caseType==='Renovación')} title="Registrar caso de renovación ficticio" onClick={()=>onStartRenewal(policy)}>
            <span className={'ins-renewal-icon '+(days<0?'overdue':days<=30?'soon':'normal')}><Clock3 size={17}/></span>
            <span className="ins-renewal-copy"><strong>{byCustomer(policy.clientId)}</strong><small>{insurerFromText(policy.insurer)?.displayName||policy.insurer} · {policy.product}</small></span>
            <span className={'ins-renewal-days '+(days<0?'overdue':'')}>{tickets.some(t=>t.policyId===policy.id&&t.caseType==='Renovación')?'Caso abierto':days<0?'Gestionar · vencida '+Math.abs(days)+' d':days===0?'Gestionar hoy':'Gestionar · '+days+' d'}</span>
          </button>):<div className="ins-empty-mini"><CheckCheck size={23}/><strong>Sin vencimientos próximos</strong><small>Los registros con vigencia de hasta 60 días aparecerán aquí.</small></div>}
        </div>
        <div className="ins-panel-footer"><span><ShieldAlert size={15}/> {expirations.length} expedientes por revisar</span>
          <button onClick={()=>onNavigate('polizas')}>Abrir cartera <ArrowRight size={14}/></button></div>
      </section>
    </div>
    <div className="ins-exec-grid">
      <section className="ins-exec-panel">
        <div className="ins-panel-heading">
          <div><span className="ins-eyebrow">ATENCIÓN AL CLIENTE</span><h4>Solicitudes por resolver</h4></div>
          <button onClick={()=>onNavigate('solicitudes')}>Ir a servicio <ArrowRight size={14}/></button>
        </div>
        <div className="ins-case-list">
          {pendingCases.slice(0,4).length?pendingCases.slice(0,4).map(t=><button key={t.id} onClick={()=>onNavigate('solicitudes')}>
            <span className="ins-case-dot"/><span><strong>{t.subject}</strong><small>{byCustomer(t.clientId)}</small></span>
            <em>{t.status}</em>
          </button>):<div className="ins-empty-mini"><CheckCheck size={23}/><strong>Sin casos pendientes</strong></div>}
        </div>
      </section>
      <section className="ins-exec-panel">
        <div className="ins-panel-heading">
          <div><span className="ins-eyebrow">TRAZABILIDAD</span><h4>Actividad reciente</h4></div>
          <button onClick={()=>onNavigate('actividad')}>Ver auditoría <ArrowRight size={14}/></button>
        </div>
        <div className="ins-activity-list">
          {[...activities].sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0)).slice(0,4).length
           ? [...activities].sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0)).slice(0,4).map(a=><div key={a.id}>
              <span className="ins-case-dot"/><span><strong>{a.label}</strong><small>{a.actorEmail} · {a.category}</small></span>
             </div>):<div className="ins-empty-mini"><Activity size={23}/><strong>Sin actividad registrada</strong></div>}
        </div>
      </section>
    </div>
    <div className="ins-exec-actions">
      <span><FileText size={17}/> {documents.length} archivos de prueba en expedientes</span>
      <div><button onClick={()=>onNavigate('clientes')}><UserPlus size={15}/> Añadir cliente</button>
        <button onClick={()=>onNavigate('polizas')}><ShieldCheck size={15}/> Registrar póliza</button>
        <button onClick={()=>onNavigate('documentos')}><FileText size={15}/> Adjuntar documentos</button></div>
    </div>
  </div>;
}
