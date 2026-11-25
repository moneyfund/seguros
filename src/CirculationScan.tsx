import {useEffect,useId,useRef,useState} from 'react';
import {Camera,ScanText,Check,AlertTriangle,X} from 'lucide-react';
import type {CirculationFields,CirculationResult} from './circulationParser';
import './circulation-scan.css';
const names:Record<keyof CirculationFields,string>={plate:'Placa',make:'Marca',model:'Modelo',year:'Año',color:'Color',vin:'VIN / chasis',use:'Uso'};
export default function CirculationScan({onApply}:{onApply:(fields:CirculationResult)=>void}){
 const id=useId(),picker=useRef<HTMLInputElement>(null),task=useRef<AbortController|null>(null);
 const [open,setOpen]=useState(false),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(''),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[message,setMessage]=useState(''),[error,setError]=useState(''),[result,setResult]=useState<CirculationResult|null>(null),[applied,setApplied]=useState(false);
 useEffect(()=>()=>task.current?.abort(),[]);
 useEffect(()=>{if(!file){setPreview('');return;}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
 function reset(){task.current?.abort();task.current=null;setBusy(false);setFile(null);setResult(null);setError('');setApplied(false);setMessage('');setProgress(0);if(picker.current)picker.current.value='';}
 async function scan(){
  if(!file||busy)return;const controller=new AbortController();task.current=controller;setBusy(true);setError('');setResult(null);setApplied(false);setProgress(0);setMessage('Preparando lector…');
  const timeout=window.setTimeout(()=>{if(task.current===controller){controller.abort();task.current=null;setBusy(false);setError('La lectura tardó demasiado. Intenta con una foto más clara o completa los datos manualmente.');}},90000);
  try{
   const {readCirculation}=await import('./circulationOcr');if(controller.signal.aborted)return;
   const data=await readCirculation(file,(m,p)=>{if(!controller.signal.aborted){setMessage(m);setProgress(p);}},controller.signal);
   if(!controller.signal.aborted){setResult(data.fields);if(!Object.keys(data.fields).length)setError('No se identificaron campos con suficiente claridad. Intenta con una foto frontal y bien iluminada.');}
  }catch{if(!controller.signal.aborted)setError('No se pudo leer la fotografía. Prueba otra imagen o utiliza el llenado manual.');}
  finally{clearTimeout(timeout);if(task.current===controller){task.current=null;setBusy(false);}}
 }
 const fields=result?Object.entries(result) as [keyof CirculationFields,string][]:[];
 return <div className="ed-span ac-circulation">
  <div className="ac-circulation-heading"><div><ScanText size={21}/><span><strong>Lectura de circulación</strong><small>Completa los campos manualmente o reconoce una fotografía.</small></span></div><button type="button" className="btn btn-soft" aria-expanded={open} aria-controls={id} onClick={()=>{if(open)reset();setOpen(!open);}}>{open?'Cerrar lector':'Leer circulación'}</button></div>
  {open&&<div id={id} className="ac-circulation-body">
   <p>Fotografía la circulación completa, sin reflejos y con los datos legibles. La imagen se procesa en este dispositivo; no se adjunta al expediente automáticamente.</p>
   <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Foto de circulación" disabled={busy} onChange={e=>{const selected=e.target.files?.[0];reset();if(!selected)return;if(!['image/jpeg','image/png','image/webp'].includes(selected.type)||selected.size>12*1024*1024||selected.size===0){setError('Selecciona una foto JPG, PNG o WEBP de hasta 12 MB.');return;}setFile(selected);}}/>
   {preview&&<img className="ac-circulation-preview" src={preview} alt="Vista previa de la circulación seleccionada"/>}
   <div className="ac-circulation-actions"><button type="button" className="btn btn-dark" disabled={!file||busy} onClick={()=>void scan()}><Camera size={16}/> {busy?'Reconociendo…':'Reconocer datos'}</button>{busy&&<button type="button" className="btn btn-soft" onClick={reset}><X size={15}/> Cancelar</button>}</div>
   {busy&&<div role="status"><small>{message}</small><progress aria-label="Progreso de lectura" max={100} value={progress}/></div>}
   {error&&<p role="alert" className="ac-circulation-warning"><AlertTriangle size={16}/>{error}</p>}
   {!!fields.length&&!applied&&<div className="ac-circulation-review"><strong>Verifica los datos detectados antes de aplicarlos</strong><p>Los campos sin identificar se conservan sin cambios. Comprueba especialmente placa y chasis con el documento original.</p>
    <div className="ac-circulation-grid">{fields.map(([key,value])=><label key={key}>{names[key]}{key==='use'?<select value={value} onChange={e=>setResult(prev=>({...prev,[key]:e.target.value}))}>{['Particular','Comercial','Taxi','Motocicleta','Otro'].map(v=><option key={v}>{v}</option>)}</select>:<input value={value} maxLength={key==='plate'?24:key==='make'?60:key==='model'?80:key==='year'?4:40} onChange={e=>setResult(prev=>({...prev,[key]:e.target.value}))}/>}</label>)}</div>
    <button type="button" className="btn btn-dark" onClick={()=>{const clean=Object.fromEntries(fields.filter(([key,v])=>v.trim()&&(key!=='year'||/^\d{4}$/.test(v))).map(([key,v])=>[key,v.trim()])) as CirculationResult;onApply(clean);setApplied(true);setFile(null);setResult(null);if(picker.current)picker.current.value='';}}><Check size={16}/> Aplicar datos al formulario</button>
   </div>}
   {applied&&<p role="status" className="ed-success"><Check size={16}/> Datos aplicados. Revísalos y guarda el expediente normalmente.</p>}
  </div>}
 </div>;
}
