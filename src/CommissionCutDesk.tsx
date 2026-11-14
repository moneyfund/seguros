import {useState} from 'react';
import type {LiveRecord} from './backend';
import {nicaraguanInsurers,insurerById} from './insurers';
import './enterprise-desk.css';
type Item={id:string;agentUid:string;policyId:string;insurerId:string;cutId:string;periodStart:string;periodEnd:string;currency:'USD'|'NIO';amountCents:number;paidCents:number};
function parse(r:LiveRecord):Item|null{
 const {agentUid,policyId,insurerId,cutId,periodStart,periodEnd,currency,amountCents,paidCents}=r;
 if(typeof agentUid!=='string'||!agentUid||typeof policyId!=='string'||!policyId||typeof insurerId!=='string'||!insurerById(insurerId)||typeof cutId!=='string'||!cutId||typeof periodStart!=='string'||typeof periodEnd!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(periodStart)||!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)||periodStart>periodEnd||(currency!=='USD'&&currency!=='NIO')||typeof amountCents!=='number'||!Number.isSafeInteger(amountCents)||amountCents<0||typeof paidCents!=='number'||!Number.isSafeInteger(paidCents)||paidCents<0||paidCents>amountCents)return null;
 return {id:r.id,agentUid,policyId,insurerId,cutId,periodStart,periodEnd,currency,amountCents,paidCents};
}
const price=(amount:number,currency:string)=>new Intl.NumberFormat('es-NI',{style:'currency',currency}).format(amount/100);
export default function CommissionCutDesk({rows,own}:{rows:LiveRecord[];own:boolean}){
 const [insurer,setInsurer]=useState(''),[state,setState]=useState(''),[period,setPeriod]=useState(''),[agent,setAgent]=useState('');
 const parsed=rows.map(parse).filter((x):x is Item=>x!==null);
 const items=parsed.filter(x=>(!insurer||insurer===x.insurerId)&&(!period||period===x.cutId)&&(!agent||agent===x.agentUid)&&(!state||(state==='paid'?x.paidCents===x.amountCents:x.paidCents<x.amountCents)));
 const groups=new Map<string,{item:Item;policies:Set<string>;total:number;paid:number}>();
 for(const x of items){const key=JSON.stringify([x.cutId,x.insurerId,x.periodStart,x.periodEnd,x.currency,x.agentUid]);const g=groups.get(key)||{item:x,policies:new Set<string>(),total:0,paid:0};g.policies.add(x.policyId);g.total+=x.amountCents;g.paid+=x.paidCents;groups.set(key,g);}
 return <section className="data-card ed-block"><div className="ed-head"><div><h3>{own?'Mis comisiones':'Cortes y liquidaciones'}</h3><p>Importes registrados y conciliados, separados por aseguradora, período, moneda y agente.</p></div></div><p className="ed-muted">No se generan comisiones ni fechas de corte automáticamente: faltan las reglas de cada aseguradora que proporcionará ACOS.</p>
 <div className="ed-form"><label>Aseguradora<select value={insurer} onChange={e=>setInsurer(e.target.value)}><option value="">Todas</option>{nicaraguanInsurers.map(i=><option key={i.id} value={i.id}>{i.displayName}</option>)}</select></label><label>Corte<select value={period} onChange={e=>setPeriod(e.target.value)}><option value="">Todos</option>{[...new Set(parsed.map(x=>x.cutId))].map(id=><option key={id} value={id}>{id}</option>)}</select></label>{!own&&<label>Agente (UID)<select value={agent} onChange={e=>setAgent(e.target.value)}><option value="">Todos</option>{[...new Set(parsed.map(x=>x.agentUid))].map(id=><option key={id}>{id}</option>)}</select></label>}<label>Estado<select value={state} onChange={e=>setState(e.target.value)}><option value="">Todos</option><option value="pending">Pendientes / parciales</option><option value="paid">Pagadas</option></select></label></div>
 {groups.size===0?<p className="ed-muted">Todavía no hay cortes estructurados en esta selección.</p>:<div className="table-wrap"><table><thead><tr><th>Aseguradora / corte</th><th>Período</th>{!own&&<th>Agente</th>}<th>Pólizas</th><th>Total</th><th>Pagado</th><th>Pendiente</th></tr></thead><tbody>{[...groups.entries()].map(([k,g])=><tr key={k}><td>{insurerById(g.item.insurerId)?.displayName}<br/>{g.item.cutId}</td><td>{g.item.periodStart} — {g.item.periodEnd}</td>{!own&&<td>{g.item.agentUid}</td>}<td>{g.policies.size}</td><td>{price(g.total,g.item.currency)}</td><td>{price(g.paid,g.item.currency)}</td><td>{price(g.total-g.paid,g.item.currency)}</td></tr>)}</tbody></table></div>}
 {rows.length>parsed.length&&<p className="ed-muted">{rows.length-parsed.length} registros anteriores requieren conciliación con el nuevo formato y no se incluyen en los totales.</p>}</section>;
}
