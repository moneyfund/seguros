import {
  Activity, ArrowRight, CalendarClock, FileText, FolderOpen,
  Headphones, ShieldCheck, UserRound, Wallet, X
} from 'lucide-react';
import { money } from './data';
import { insurerFromText } from './insurers';
import type { PilotClient, PilotCommission, PilotDocument, PilotLead, PilotPolicy, PilotTicket } from './pilotData';

type Destination='oportunidades'|'polizas'|'solicitudes'|'documentos';
export default function CustomerDossier({
  client,leads,policies,commissions,tickets,documents,onAction,onClose
}:{
  client:PilotClient;leads:PilotLead[];policies:PilotPolicy[];commissions:PilotCommission[];
  tickets:PilotTicket[];documents:PilotDocument[];
  onAction:(tab:Destination,clientId:string)=>void;onClose:()=>void;
}) {
  const myLeads=leads.filter(l=>l.clientId===client.id);
  const myPolicies=policies.filter(p=>p.clientId===client.id);
  const myTickets=tickets.filter(t=>t.clientId===client.id);
  const myFiles=documents.filter(d=>d.clientId===client.id);
  const myCommission=commissions.filter(c=>c.clientId===client.id)
    .reduce((sum,c)=>sum+Number(c.amount||0),0);
  return <section className="ins-dossier">
    <header className="ins-dossier-header">
      <div className="ins-dossier-avatar"><UserRound size={21}/></div>
      <div><span className="ins-eyebrow"><FolderOpen size={14}/> EXPEDIENTE COMERCIAL FICTICIO</span>
        <h3>{client.fullName}</h3><p>{client.city} · {client.email||'Sin correo de referencia'}</p></div>
      <button type="button" className="ins-dossier-close" onClick={onClose} aria-label="Cerrar expediente"><X size={19}/></button>
    </header>
    <div className="ins-dossier-stats">
      <div><small>OPORTUNIDADES</small><strong>{myLeads.length}</strong></div>
      <div><small>PÓLIZAS VINCULADAS</small><strong>{myPolicies.length}</strong></div>
      <div><small>COMISIONES ESTIMADAS</small><strong>{money(myCommission)}</strong></div>
      <div><small>ARCHIVOS / CASOS</small><strong>{myFiles.length} / {myTickets.length}</strong></div>
    </div>
    <div className="ins-dossier-content">
      <div className="ins-dossier-section">
        <h4><ShieldCheck size={16}/> Historial de pólizas</h4>
        {myPolicies.length ? myPolicies.map(p=><div key={p.id} className="ins-dossier-policy">
          <div><strong>{p.policyNumber}</strong><small>{insurerFromText(p.insurer)?.displayName||p.insurer} · {p.product}</small></div>
          <div><strong>{money(p.premium)}</strong><small>Vence {p.endDate}</small></div>
        </div>):<p className="ins-dossier-muted">No hay pólizas asociadas todavía.</p>}
      </div>
      <div className="ins-dossier-section">
        <h4><Activity size={16}/> Seguimiento</h4>
        <div className="ins-dossier-facts">
          <span><CalendarClock size={14}/> {myLeads.length} oportunidades</span>
          <span><Headphones size={14}/> {myTickets.filter(t=>t.status!=='Resuelto').length} casos pendientes</span>
          <span><FileText size={14}/> {myFiles.length} documentos</span>
          <span><Wallet size={14}/> {money(myCommission)} en comisiones</span>
        </div>
      </div>
    </div>
    <footer className="ins-dossier-actions">
      <button onClick={()=>onAction('oportunidades',client.id)}>Nueva oportunidad <ArrowRight size={14}/></button>
      <button onClick={()=>onAction('polizas',client.id)}>Asociar póliza <ArrowRight size={14}/></button>
      <button onClick={()=>onAction('solicitudes',client.id)}>Abrir caso <ArrowRight size={14}/></button>
      <button onClick={()=>onAction('documentos',client.id)}>Adjuntar archivo <ArrowRight size={14}/></button>
    </footer>
    <p className="ins-dossier-note">Datos exclusivamente ficticios. Ninguna póliza mostrada constituye cobertura verificada ante una aseguradora.</p>
  </section>;
}
