import {createWorker,OEM,PSM,type Worker} from 'tesseract.js';
import {parseCirculation} from './circulationParser';
export async function readCirculation(file:File,onProgress:(message:string,percent:number)=>void,signal:AbortSignal){
 let worker:Worker|undefined;
 const cancel=()=>{if(worker)void worker.terminate();};
 signal.addEventListener('abort',cancel,{once:true});
 try{
  const base=new URL('/ocr/',window.location.origin).href;
  onProgress('Preparando lector de circulación',0);
  worker=await createWorker('spa',OEM.LSTM_ONLY,{workerPath:base+'worker.min.js',corePath:base+'core',langPath:base+'lang',workerBlobURL:false,cacheMethod:'none',logger:m=>{if(!signal.aborted)onProgress(m.status==='recognizing text'?'Reconociendo datos del vehículo':'Preparando lector de circulación',m.status==='recognizing text'?Math.round(m.progress*100):0);}});
  if(signal.aborted)throw new DOMException('Cancelado','AbortError');
  await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT});
  const bitmap=await createImageBitmap(file);
  let canvas:HTMLCanvasElement|undefined;
  try{
   const scale=Math.min(1,2600/Math.max(bitmap.width,bitmap.height));
   canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo preparar la imagen.');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  }finally{bitmap.close();}
  if(signal.aborted)throw new DOMException('Cancelado','AbortError');
  const {data}=await worker.recognize(canvas);
  return {fields:parseCirculation(data.text),confidence:data.confidence};
 }finally{signal.removeEventListener('abort',cancel);if(worker)await worker.terminate().catch(()=>{});}
}
