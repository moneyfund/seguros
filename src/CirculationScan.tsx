import {useEffect,useId,useRef,useState} from 'react';
import {Camera,ScanText,Check,AlertTriangle,X} from 'lucide-react';
import {mergeCirculationSides,type CirculationFields,type CirculationResult,type CirculationConflict} from './circulationParser';
import type {CirculationSide,CirculationPhoto} from './circulationOcr';
import './circulation-scan.css';
type Field=keyof CirculationFields;
const names:Record<Field,string>={plate:'Placa',make:'Marca',model:'Modelo',year:'Año',color:'Color',vin:'VIN / chasis',use:'Uso'};
const sides:CirculationSide[]=['front','back'];
const sideLabel={front:'Anverso',back:'Reverso'};
const emptyPhotos=()=>({front:null,back:null}) as Record<CirculationSide,File|null>;
function PhotoSlot({side,file,busy,onChange}:{side:CirculationSide;file:File|null;busy:boolean;onChange:(file:File|null)=>void}){
 const input=useRef<HTMLInputElement>(null),[preview,setPreview]=useState('');
 useEffect(()=>{if(!file){setPreview('');if(input.current)input.current.value='';return;}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
 return <div className="ac-circulation-photo">
  <strong>{sideLabel[side]} <small>· {side==='front'?'Parte delantera':'Parte trasera'}</small></strong>
  <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label={'Foto de circulación: '+sideLabel[side]} disabled={busy} onChange={e=>{const selected=e.target.files?.[0];if(selected)onChange(selected);e.target.value='';}}/>
  {preview&&<><img className="ac-circulation-preview" src={preview} alt={'Vista previa: '+sideLabel[side]}/><button type="button" className="btn btn-soft" disabled={busy} onClick={()=>onChange(null)}><X size={14}/> Quitar {sideLabel[side].toLowerCase()}</button></>}
 </div>;
}
export default function CirculationScan({onApply}:{onApply:(fields:CirculationResult)=>void}){
 const id=useId(),task=useRef<AbortController|null>(null);
 const [open,setOpen]=useState(false),[photos,setPhotos]=useState(emptyPhotos),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[message,setMessage]=useState(''),[error,setError]=useState(''),[result,setResult]=useState<CirculationResult|null>(null),[conflicts,setConflicts]=useState<Partial<Record<Field,CirculationConflict>>>({}),[choices,setChoices]=useState<Partial<Record<Field,string>>>({}),[applied,setApplied]=useState(false);
 useEffect(()=>()=>task.current?.abort(),[]);
 function clearResult(){setResult(null);setConflicts({});setChoices({});setApplied(false);setError('');setMessage('');setProgress(0);}
 function cancel(){task.current?.abort();task.current=null;setBusy(false);clearResult();}
 function reset(){cancel();setPhotos(emptyPhotos());}
 function changePhoto(side:CirculationSide,file:File|null){
  clearResult();
  if(file&&(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024||!file.size)){setError('Selecciona una foto JPG, PNG o WEBP de hasta 12 MB por lado.');return;}
  setPhotos(prev=>({...prev,[side]:file}));
 }
 const count=sides.filter(side=>photos[side]).length;
 async function scan(){
  if(!count||busy)return;
  const selected:CirculationPhoto[]=sides.flatMap(side=>photos[side]?[{side,file:photos[side]!}]:[]);
  clearResult();const controller=new AbortController();task.current=controller;setBusy(true);setMessage('Preparando lector…');
  const timeout=window.setTimeout(()=>{if(task.current===controller){controller.abort();task.current=null;setBusy(false);setError('La lectura tardó demasiado. Intenta con fotos más claras o completa los datos manualmente.');}},90000*selected.length);
  try{
   const {readCirculation}=await import('./circulationOcr');if(controller.signal.aborted)return;
   const data=await readCirculation(selected,(m,p)=>{if(!controller.signal.aborted){setMessage(m);setProgress(p);}},controller.signal);
   if(!controller.signal.aborted){
    const merged=mergeCirculationSides(data.results.front||{},data.results.back||{});
    setResult(merged.fields);setConflicts(merged.conflicts);
    if(data.failed.length)setError('No se obtuvieron datos de: '+data.failed.map(side=>sideLabel[side]).join(', ')+'. Puedes revisar los datos reconocidos del otro lado o repetir la lectura.');
   }
  }catch{if(!controller.signal.aborted)setError('No se pudieron leer las fotografías. Intenta de nuevo o utiliza el llenado manual.');}
  finally{clearTimeout(timeout);if(task.current===controller){task.current=null;setBusy(false);}}
 }
 const fields=result?Object.entries(result) as [Field,string][]:[];
 const disputed=Object.entries(conflicts) as [Field,CirculationConflict][];
 const unresolved=disputed.some(([key])=>!choices[key]);
 const hasValues=fields.some(([,value])=>value.trim())||disputed.some(([key])=>choices[key]==='front'||choices[key]==='back');
 function apply(){
  const values:CirculationResult={...result};
  for(const [key,pair] of disputed){const choice=choices[key];if(choice==='front'||choice==='back')values[key]=pair[choice];}
  const clean=Object.fromEntries(Object.entries(values).filter(([key,v])=>v.trim()&&(key!=='year'||/^\d{4}$/.test(v))).map(([key,v])=>[key,v.trim()])) as CirculationResult;
  if(!Object.keys(clean).length){setError('No hay datos válidos para aplicar.');return;}
  onApply(clean);reset();setApplied(true);
 }
 return <div className="ed-span ac-circulation">
  <div className="ac-circulation-heading"><div><ScanText size={21}/><span><strong>Lectura de circulación</strong><small>Completa manualmente o reconoce el anverso y reverso.</small></span></div><button type="button" className="btn btn-soft" aria-expanded={open} aria-controls={id} onClick={()=>{if(open)reset();setOpen(!open);}}>{open?'Cerrar lector':'Leer circulación'}</button></div>
  {open&&<div id={id} className="ac-circulation-body">
   <p>Carga ambas caras de la circulación, sin reflejos y con los datos legibles. También puedes reconocer una sola foto. Las imágenes se procesan en este dispositivo y no se adjuntan automáticamente.</p>
   <div className="ac-circulation-photos">{sides.map(side=><PhotoSlot key={side} side={side} file={photos[side]} busy={busy} onChange={file=>changePhoto(side,file)}/>)}</div>
   <div className="ac-circulation-actions"><button type="button" className="btn btn-dark" disabled={!count||busy} onClick={()=>void scan()}><Camera size={16}/> {busy?'Reconociendo…':count===2?'Reconocer ambas caras':'Reconocer datos'}</button>{busy&&<button type="button" className="btn btn-soft" onClick={cancel}><X size={15}/> Cancelar</button>}</div>
   {busy&&<div role="status"><small>{message}</small><progress aria-label="Progreso de lectura" max={100} value={progress}/></div>}
   {error&&<p role="alert" className="ac-circulation-warning"><AlertTriangle size={16}/>{error}</p>}
   {!!(fields.length+disputed.length)&&!applied&&<div className="ac-circulation-review"><strong>Verifica los datos reconocidos antes de aplicarlos</strong><p>Los datos de ambas caras se combinan. Los campos no identificados se conservan sin cambios. Comprueba especialmente placa y chasis.</p>
    <div className="ac-circulation-grid">{fields.map(([key,value])=><label key={key}>{names[key]}{key==='use'?<select value={value} onChange={e=>setResult(prev=>({...prev,[key]:e.target.value}))}>{['Particular','Comercial','Taxi','Motocicleta','Otro'].map(v=><option key={v}>{v}</option>)}</select>:<input value={value} maxLength={key==='plate'?24:key==='make'?60:key==='model'?80:key==='year'?4:40} onChange={e=>setResult(prev=>({...prev,[key]:e.target.value}))}/>}</label>)}</div>
    {!!disputed.length&&<div className="ac-circulation-conflicts"><strong><AlertTriangle size={15}/> Diferencias entre las dos caras</strong><p>Selecciona el valor correcto de cada campo o decide no aplicarlo. No se sobrescribirán diferencias automáticamente.</p>{disputed.map(([key,pair])=><label key={key}>{names[key]}<select value={choices[key]||''} onChange={e=>setChoices(prev=>({...prev,[key]:e.target.value}))}><option value="">Seleccionar valor correcto</option><option value="front">Anverso: {pair.front}</option><option value="back">Reverso: {pair.back}</option><option value="omit">No aplicar este campo</option></select></label>)}</div>}
    <button type="button" className="btn btn-dark" disabled={unresolved||!hasValues} onClick={apply}><Check size={16}/> Aplicar datos al formulario</button>
   </div>}
   {applied&&<p role="status" className="ed-success"><Check size={16}/> Datos aplicados. Revísalos y guarda el expediente normalmente.</p>}
  </div>}
 </div>;
}
