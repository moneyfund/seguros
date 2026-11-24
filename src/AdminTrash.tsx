import {useEffect,useState} from 'react';
import type {User} from 'firebase/auth';
import {Archive,RotateCcw,Search,Trash2,ShieldCheck,AlertTriangle} from 'lucide-react';
import {moveToTrash,restoreTrash,purgeTrash,subscribeTrash,type TrashKind,type TrashEntry} from './enterpriseTrash';
import type {EnterpriseRecords} from './enterpriseTrial';
import './enterprise-trash.css';
const kinds:TrashKind[]=['enterpriseClients','enterpriseIssuance'];
function title(entry:TrashEntry){return entry.kind==='enterpriseClients'?String(entry.record.fullName||'Cliente'):String(entry.record.policyNumber||entry.record.plate||'Solicitud')+' · '+String(entry.record.clientName||'Cliente');}
export default function AdminTrash({user,records}:{user:User;records:EnterpriseRecords}){
 const [rows,setRows]=useState<Record<TrashKind,TrashEntry[]>>({enterpriseClients:[],enterpriseIssuance:[]});
 const [loaded,setLoaded]=useState<TrashKind[]>([]),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [kind,setKind]=useState<TrashKind>('enterpriseClients'),[search,setSearch]=useState('');
 const [action,setAction]=useState<{mode:'restore'|'purge'|'move';entry:TrashEntry}|null>(null);
 const [reason,setReason]=useState(''),[confirmation,setConfirmation]=useState('');
 useEffect(()=>{setRows({enterpriseClients:[],enterpriseIssuance:[]});setLoaded([]);setError('');const stops=kinds.map(k=>subscribeTrash(k,items=>{setRows(prev=>({...prev,[k]:items}));setLoaded(prev=>prev.includes(k)?prev:[...prev,k]);},()=>setError('No se pudo acceder a la papelera privada. Verifica que las nuevas reglas de Firebase estén publicadas.')));return()=>stops.forEach(stop=>stop());},[user.uid]);
 const legacy:TrashEntry[]=(kind==='enterpriseClients'?records.archivedClients:records.archivedRequests).map(record=>({kind,id:record.id,record,movedBy:'',reason:'Retirado en la versión anterior',purging:false}));
 const ready=loaded.length===2&&!error&&records.enabled;
 const visible=rows[kind].filter(e=>title(e).toLowerCase().includes(search.toLowerCase()));
 const open=(mode:'restore'|'purge'|'move',entry:TrashEntry)=>{setAction({mode,entry});setReason('');setConfirmation('');setError('');setNotice('');};
 async function execute(){
  if(!action||busy||reason.trim().length<3||action.mode==='purge'&&confirmation!=='ELIMINAR')return;
  setBusy(true);setError('');setNotice('');
  try{const {mode,entry}=action;if(mode==='restore')await restoreTrash(user,entry.kind,entry.id,reason);else if(mode==='purge')await purgeTrash(user,entry.kind,entry.id,reason);else await moveToTrash(user,entry.kind,entry.id,reason);setNotice(mode==='restore'?'Registro restaurado a su ubicación original.':mode==='purge'?'Registro y archivos asociados eliminados.':'Registro trasladado a la papelera privada.');setAction(null);}
  catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
 }
 return <section className="data-card ed-block ac-trash">
  <div className="ac-trash-header"><div className="ac-trash-icon"><Trash2 size={25}/></div><div><h2>Papelera administrativa</h2><p>Los registros retirados dejan de aparecer en las carteras y conservan sus archivos hasta el borrado definitivo.</p></div></div>
  <div className="ac-trash-note"><ShieldCheck size={18}/><span>Acceso exclusivo de Administración General. Los movimientos financieros vinculados deben revisarse antes de borrar. No hay vaciado automático.</span></div>
  {!records.enabled&&<p className="ed-muted">Habilita el entorno operativo de validación para gestionar los registros.</p>}
  {loaded.length<2&&!error&&<p role="status">Cargando papelera…</p>}
  {error&&<p className="live-error" role="alert">{error}</p>}{notice&&<p className="ed-success" role="status">{notice}</p>}
  <div className="ac-trash-tools"><div className="ed-tabs">{kinds.map(k=><button type="button" key={k} aria-pressed={kind===k} onClick={()=>{setKind(k);setAction(null);}} disabled={busy}>{k==='enterpriseClients'?'Clientes':'Pólizas y solicitudes'} ({rows[k].length})</button>)}</div><label className="ac-trash-search"><Search size={17}/><input aria-label="Buscar en papelera" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar registro…"/></label></div>
  {action&&<div className="ac-trash-confirm" role="group" aria-label="Confirmar operación de papelera">
    <h3>{action.mode==='purge'?'Eliminar definitivamente':action.mode==='restore'?'Restaurar registro':'Trasladar registro anterior'}</h3><p><strong>{title(action.entry)}</strong></p>
    {action.mode==='purge'&&<p className="ac-trash-warning"><AlertTriangle size={18}/> Esta acción no puede deshacerse. Se eliminarán los registros y sus archivos de Storage. Si falla la limpieza, el registro seguirá aquí para reintentar y no podrá restaurarse.</p>}
    <label>Motivo (sin información personal)<textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={500} rows={2} disabled={busy}/></label>
    {action.mode==='purge'&&<label>Escribe ELIMINAR para confirmar<input value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy}/></label>}
    <div className="ed-button-row"><button className="btn btn-soft" disabled={busy} onClick={()=>setAction(null)}>Cancelar</button><button className={'btn '+(action.mode==='purge'?'btn-soft acos-danger':'btn-dark')} disabled={busy||!records.enabled||reason.trim().length<3||action.mode==='purge'&&confirmation!=='ELIMINAR'} onClick={()=>void execute()}>{busy?'Procesando…':action.mode==='purge'?'Eliminar definitivamente':action.mode==='restore'?'Restaurar':'Enviar a papelera'}</button></div>
  </div>}
  {loaded.length===2&&!visible.length&&!legacy.length&&<div className="live-empty"><Archive size={32}/><strong>La papelera está vacía</strong><p>Los registros que retires desde Administración aparecerán aquí.</p></div>}
  {visible.map(entry=><div className="ac-trash-row" key={entry.id}><div><strong>{title(entry)}</strong><small>{entry.purging?'Eliminación pendiente · solo reintentar':entry.movedAt?.toDate?.().toLocaleString('es-NI')||'Registro retirado'}</small><small>{entry.reason}</small></div><div className="ed-button-row"><button className="btn btn-soft" disabled={!ready||busy||entry.purging} onClick={()=>open('restore',entry)}><RotateCcw size={15}/> Restaurar</button><button className="btn btn-soft acos-danger" disabled={!ready||busy} onClick={()=>open('purge',entry)}><Trash2 size={15}/> {entry.purging?'Reintentar borrado':'Eliminar definitivamente'}</button></div></div>)}
  {!!legacy.length&&<><h3>Registros retirados anteriormente</h3><p className="ed-muted">Trasládalos a la nueva papelera privada para poder restaurarlos o eliminarlos definitivamente.</p>{legacy.filter(e=>title(e).toLowerCase().includes(search.toLowerCase())).map(entry=><div className="ac-trash-row" key={entry.id}><strong>{title(entry)}</strong><button className="btn btn-soft" disabled={!ready||busy} onClick={()=>open('move',entry)}><Archive size={16}/> Trasladar a papelera</button></div>)}</>}
 </section>;
}
