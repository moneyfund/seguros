import {createWorker,OEM,PSM,type Worker} from 'tesseract.js';
import {parseCirculation,type CirculationResult} from './circulationParser';
export type CirculationSide='front'|'back';
export type CirculationPhoto={side:CirculationSide;file:File};
const sideLabel={front:'Anverso',back:'Reverso'};
export async function readCirculation(photos:CirculationPhoto[],onProgress:(message:string,percent:number)=>void,signal:AbortSignal){
 let worker:Worker|undefined,position=0;
 const results:Partial<Record<CirculationSide,CirculationResult>>={},failed:CirculationSide[]=[];
 const check=()=>{if(signal.aborted)throw new DOMException('Cancelado','AbortError');};
 const cancel=()=>{if(worker)void worker.terminate().catch(()=>{});};
 signal.addEventListener('abort',cancel,{once:true});
 try{
  check();
  const base=new URL('/ocr/',window.location.origin).href;
  onProgress('Preparando lector de circulación',0);
  worker=await createWorker('spa',OEM.LSTM_ONLY,{workerPath:base+'worker.min.js',corePath:base+'core',langPath:base+'lang',workerBlobURL:false,cacheMethod:'none',logger:m=>{if(!signal.aborted&&m.status==='recognizing text')onProgress('Reconociendo '+sideLabel[photos[position].side].toLowerCase(),Math.round((position+m.progress)*100/photos.length));}});
  check();
  await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT});
  for(position=0;position<photos.length;position++){
   check();
   const {side,file}=photos[position];
   onProgress('Preparando '+sideLabel[side].toLowerCase(),Math.round(position*100/photos.length));
   let canvas:HTMLCanvasElement|undefined;
   try{
    const bitmap=await createImageBitmap(file);
    try{
     const scale=Math.min(1,2600/Math.max(bitmap.width,bitmap.height));
     canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
     const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo preparar la imagen.');
     ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    }finally{bitmap.close();}
    check();
    const {data}=await worker.recognize(canvas);check();
    const parsed=parseCirculation(data.text);
    if(Object.keys(parsed).length)results[side]=parsed;else failed.push(side);
   }catch(e){check();failed.push(side);}
   finally{if(canvas){canvas.width=0;canvas.height=0;}}
  }
  onProgress('Lectura finalizada',100);
  return {results,failed};
 }finally{signal.removeEventListener('abort',cancel);if(worker)await worker.terminate().catch(()=>{});}
}
