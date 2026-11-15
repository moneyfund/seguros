import {useEffect,useRef,useState} from 'react';
import {Download,Eye,LoaderCircle,X} from 'lucide-react';
import {attachmentError,readAttachment,saveAttachment,type RequestRecord} from './enterpriseTrial';
/** Each file has its own loading/error state; no global workspace lock or persistent cache. */
export default function AttachmentActions({record,name,label,allowPreview=true,disabled=false,downloadLabel='Descargar'}:{record:RequestRecord;name:string;label:string;allowPreview?:boolean;disabled?:boolean;downloadLabel?:string}){
 const [working,setWorking]=useState<'view'|'download'|null>(null);
 const [error,setError]=useState('');
 const [preview,setPreview]=useState<string|null>(null);
 const [slow,setSlow]=useState(false);
 const generation=useRef(0),lock=useRef(false);
 useEffect(()=>{return()=>{generation.current++;lock.current=false;};},[]);
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
 useEffect(()=>{if(!working)return;const t=setTimeout(()=>setSlow(true),5000);return()=>clearTimeout(t);},[working]);
 async function read(mode:'view'|'download'){
  if(lock.current||disabled)return;lock.current=true;
  const current=++generation.current;setWorking(mode);setSlow(false);setError('');
  try{
   const blob=await readAttachment(record,name);
   if(current!==generation.current)return;
   if(mode==='view')setPreview(URL.createObjectURL(blob));
   else saveAttachment(blob,name);
  }catch(e){if(current===generation.current)setError(attachmentError(e));}
  finally{if(current===generation.current){lock.current=false;setWorking(null);}}
 }
 const isPdf=name===record.pdf;
 return <div className="ed-attachment-actions">
  <div className="ed-attachment-buttons">
   {allowPreview&&!isPdf&&<button type="button" className="btn btn-soft" disabled={disabled||!!working} onClick={()=>void read('view')}>{working==='view'?<LoaderCircle className="ed-spin" size={15}/>:<Eye size={15}/>} {working==='view'?'Abriendo…':'Ver fotografía'}</button>}
   <button type="button" className="btn btn-soft" disabled={disabled||!!working} onClick={()=>void read('download')}>{working==='download'?<LoaderCircle className="ed-spin" size={15}/>:<Download size={15}/>} {working==='download'?'Descargando…':downloadLabel}</button>
  </div>
  {working&&<p className="ed-read-message" role="status">{slow?'La conexión está tardando. Se mostrará un aviso si no se completa.':'Consultando documento privado en Storage…'}</p>}
  {error&&<p className="ed-upload-error" role="alert">{error}</p>}
  {preview&&<div className="ed-image-modal" role="dialog" aria-modal="false" aria-label={'Vista previa: '+label} onClick={e=>{if(e.target===e.currentTarget)setPreview(null);}}><div className="ed-image-panel"><div className="ed-head"><strong>{label}</strong><button type="button" className="btn btn-soft" onClick={()=>setPreview(null)}><X size={17}/> Cerrar</button></div><img src={preview} alt={label} onError={()=>{setPreview(null);setError('No se pudo mostrar la fotografía. Verifica el archivo original.');}}/></div></div>}
 </div>;
}
