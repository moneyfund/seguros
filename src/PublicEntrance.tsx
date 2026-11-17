import {Component,Suspense,useEffect,useLayoutEffect,useState,type ReactNode} from 'react';

// 2.5 s total visual presentation, including the graceful exit, if content is ready.
const PRESENTATION_MS=2500;
const EXIT_MS=900;
const loader=()=>document.getElementById('acos-public-loader');
function reduced(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
function showPublicLoader(academy:boolean){
 const node=loader();if(!node)return performance.now();
 const alreadyVisible=!node.hidden&&!node.classList.contains('acos-loading-exit');
 const started=alreadyVisible?Number(node.dataset.started)||performance.now():performance.now();
 node.dataset.started=String(started);
 node.classList.remove('acos-loading-exit');
 const context=document.getElementById('acos-loading-context'),status=document.getElementById('acos-loading-status');
 if(context)context.textContent=academy?'ACOS ACADEMY':'CORREDURÍA DE SEGUROS Y FIANZAS';
 if(status)status.textContent=academy?'Preparando tu aprendizaje':'Cargando experiencia';
 node.setAttribute('aria-label',academy?'Cargando ACOS Academy':'Cargando ACOS');
 node.hidden=false;document.documentElement.classList.add('acos-loading-active');return started;
}
export function hidePublicLoader(){
 const node=loader();if(node){node.hidden=true;node.classList.remove('acos-loading-exit');delete node.dataset.started;}
 document.documentElement.classList.remove('acos-loading-active');
}
function ReadySignal({onReady}:{onReady:(ready:boolean)=>void}){
 useEffect(()=>{onReady(true);},[onReady]);return null;
}
class PublicLoadBoundary extends Component<{children:ReactNode;onReady:(ready:boolean)=>void},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(){this.props.onReady(true);}
 render(){return this.state.failed?<main className="acos-loading-error"><img src="/brand/acos-horizontal-negative.svg" alt="ACOS" width={240}/><h1>No se pudo abrir la página</h1><p>Comprueba tu conexión e inténtalo nuevamente.</p><button onClick={()=>window.location.reload()}>Recargar página</button><a href="#/inicio">Volver a ACOS</a></main>:this.props.children;}
}
/** Mounted only when entering the public website or Academy; hash anchors do not replay the entrance. */
export function PublicEntrance({children,academy=false}:{children:ReactNode;academy?:boolean}){
 const [ready,setReady]=useState(false),[done,setDone]=useState(false),[started,setStarted]=useState<number|null>(null);
 useLayoutEffect(()=>{setStarted(showPublicLoader(academy));},[academy]);
 useEffect(()=>{
  if(!ready||started===null)return;
  let exitTimer:number|undefined;
  const delay=reduced()?0:Math.max(0,PRESENTATION_MS-EXIT_MS-(performance.now()-started));
  const minimumTimer=window.setTimeout(()=>{
   loader()?.classList.add('acos-loading-exit');
   exitTimer=window.setTimeout(()=>{hidePublicLoader();setDone(true);},reduced()?0:EXIT_MS);
  },delay);
  return()=>{window.clearTimeout(minimumTimer);if(exitTimer!==undefined)window.clearTimeout(exitTimer);};
 },[ready,started]);
 return <div className="acos-public-surface" inert={!done} aria-busy={!done}>
  <PublicLoadBoundary onReady={setReady}>
   <Suspense fallback={null}>{children}<ReadySignal onReady={setReady}/></Suspense>
  </PublicLoadBoundary>
 </div>;
}
