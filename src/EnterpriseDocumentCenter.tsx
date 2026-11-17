import {useState} from 'react';
import type {User} from 'firebase/auth';
import {DeleteAttachmentAction} from './PolicyRegistry';
import type {Slot} from './enterpriseTrial';
import {Download,FolderOpen} from 'lucide-react';
import {documentSlots,slotLabels,type EnterpriseRecords} from './enterpriseTrial';
import AttachmentActions from './AttachmentActions';
import {insurerById} from './insurers';
import './enterprise-desk.css';
export default function EnterpriseDocumentCenter({records,search,user,admin}:{records:EnterpriseRecords;search:string;user:User;admin:boolean}){
 const [client,setClient]=useState(''),[kind,setKind]=useState('');
 const rows=records.requests.flatMap(r=>[...documentSlots.map(s=>({r,kind:s,name:r.files[s],label:slotLabels[s]})),{r,kind:'policy',name:r.pdf,label:'Póliza PDF de aseguradora'}]).filter(x=>x.name&&(!client||x.r.clientId===client)&&(!kind||x.kind===kind)&&[x.r.clientName,x.r.plate,x.label,x.r.policyNumber,insurerById(x.r.insurerId)?.displayName].join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
 return <section className="data-card ed-block"><div className="ed-head"><div><h3><FolderOpen size={18}/> Archivo por expediente</h3><p>Documentos vinculados a las solicitudes autorizadas. Solo datos ficticios en esta fase.</p></div><span>{rows.length} archivos</span></div>
 {!records.enabled?<p className="ed-muted">Archivo empresarial pendiente de habilitación en el entorno de validación.</p>:<><div className="ed-form"><label>Cliente<select value={client} onChange={e=>setClient(e.target.value)}><option value="">Todos los autorizados</option>{records.clients.map(c=><option key={c.id} value={c.id}>{c.fullName}</option>)}</select></label><label>Tipo de documento<select value={kind} onChange={e=>setKind(e.target.value)}><option value="">Todos</option>{documentSlots.map(s=><option value={s} key={s}>{slotLabels[s]}</option>)}<option value="policy">Póliza PDF</option></select></label></div>{records.error&&<p className="live-error">{records.error}</p>}{!rows.length?<p className="ed-muted">No hay archivos en esta selección.</p>:<div className="table-wrap"><table><thead><tr><th>Expediente</th><th>Tipo</th><th>Aseguradora</th><th>Referencia</th><th>Archivo</th></tr></thead><tbody>{rows.map(x=><tr key={x.r.id+':'+x.kind}><td>{x.r.clientName}</td><td>{x.label}</td><td>{insurerById(x.r.insurerId)?.displayName}</td><td>{x.r.policyNumber||x.r.plate}</td><td><AttachmentActions key={x.r.id+':'+x.name} record={x.r} name={x.name} label={x.label} allowPreview={x.kind!=='policy'}/>{admin&&<DeleteAttachmentAction user={user} record={x.r} slot={x.kind as Slot|'policy'}/>}</td></tr>)}</tbody></table></div>}</>}
 </section>;
}
