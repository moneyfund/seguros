import {useEffect,useRef,useState,type FormEvent,type ReactNode} from 'react';
import {ArrowRight,Check,ChevronLeft,ChevronRight} from 'lucide-react';
export function useMobileViewport(){
 const [mobile,setMobile]=useState(()=>window.matchMedia('(max-width:760px)').matches);
 useEffect(()=>{const m=window.matchMedia('(max-width:760px)');const update=()=>setMobile(m.matches);m.addEventListener('change',update);update();return()=>m.removeEventListener('change',update);},[]);
 return mobile;
}
export function GuidedForm({id,steps,onSubmit,onClose,busy,submitLabel}:{id:string;steps:{title:string;content:ReactNode}[];onSubmit:(e:FormEvent<HTMLFormElement>)=>void;onClose:()=>void;busy:boolean;submitLabel:string}){
 const mobile=useMobileViewport(),[step,setStep]=useState(0);
 const form=useRef<HTMLFormElement>(null);
 function move(next:number){setStep(next);requestAnimationFrame(()=>form.current?.scrollIntoView({block:'start',behavior:'smooth'}));}
 function validate(index:number){
  const group=form.current?.querySelector('[data-form-stage="'+index+'"]');
  const invalid=Array.from(group?.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input,select,textarea')||[]).find(el=>!el.checkValidity());
  if(!invalid)return true;
  if(mobile&&index!==step){setStep(index);requestAnimationFrame(()=>invalid.reportValidity());}else invalid.reportValidity();
  return false;
 }
 function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(busy)return;if(mobile&&step<steps.length-1){if(validate(step))move(step+1);return;}for(let i=0;i<steps.length;i++)if(!validate(i))return;onSubmit(e);}
 return <form id={id} ref={form} className="ed-form ed-expanded acos-guided-form" noValidate onSubmit={submit}>
  <div className="acos-form-progress ed-span"><div><strong>Paso {step+1} de {steps.length}</strong><span>{steps[step].title}</span></div><progress max={steps.length} value={step+1} aria-label="Progreso del formulario"/></div>
  {steps.map((item,i)=><div key={item.title} data-form-stage={i} className={'acos-form-stage '+(mobile&&i!==step?'acos-stage-hidden':'')}><h4 className="ed-span">{item.title}</h4>{item.content}</div>)}
  <small className="acos-draft-note ed-span">Puedes volver durante esta sesión. Guarda el expediente para conservar los datos permanentemente.</small>
  <div className="ed-span ed-button-row acos-form-actions"><button type="button" className="btn btn-soft acos-close-form" disabled={busy} onClick={onClose}>Cerrar formulario</button>{mobile&&step>0&&<button type="button" className="btn btn-soft" disabled={busy} onClick={()=>move(step-1)}><ChevronLeft size={17}/> Atrás</button>}<button type="submit" className="btn btn-dark" disabled={busy}>{busy?'Guardando…':mobile&&step<steps.length-1?'Continuar':submitLabel}<ArrowRight size={17}/></button></div>
 </form>;
}
export function SlideConfirm({label,disabled,onConfirm}:{label:string;disabled?:boolean;onConfirm:()=>void}){
 const mobile=useMobileViewport(),[value,setValue]=useState(0),[armed,setArmed]=useState(false);
 const valueRef=useRef(0),lock=useRef(false),started=useRef(false);
 const reset=()=>{valueRef.current=0;setValue(0);};
 useEffect(()=>{if(disabled){reset();setArmed(false);}else lock.current=false;},[disabled]);
 function execute(){if(disabled||lock.current)return;lock.current=true;reset();setArmed(false);try{onConfirm();}finally{queueMicrotask(()=>{lock.current=false;});}}
 if(!mobile)return <button type="button" className="btn btn-dark" disabled={disabled} onClick={onConfirm}>{label}</button>;
 return <div className="acos-slide-confirm"><div className={'acos-slide-track '+(disabled?'acos-slide-disabled':'')}>
   <span className="acos-slide-fill" style={{width:value+'%'}}/><span className="acos-slide-thumb" style={{left:'calc('+value*.8+'% + 5px)'}}><ChevronRight size={23}/></span><span className="acos-slide-label">{disabled?'Completa los requisitos':value>=95?'Suelta para confirmar':'Desliza para confirmar'}</span>
   <input type="range" min={0} max={100} step={1} value={value} disabled={disabled} aria-label={'Deslizar para '+label} onChange={e=>{valueRef.current=Number(e.target.value);setValue(valueRef.current);}} onPointerDown={e=>{const b=e.currentTarget.getBoundingClientRect();started.current=e.clientX-b.left<=Math.max(60,b.width*.18);if(!started.current)e.preventDefault();}} onPointerUp={()=>{if(started.current&&valueRef.current>=95)execute();else reset();started.current=false;}} onPointerCancel={()=>{started.current=false;reset();}} onKeyDown={e=>{if((e.key==='Enter'||e.key===' ')&&valueRef.current>=95){e.preventDefault();execute();}}} onBlur={reset}/>
  </div>{!armed?<button type="button" className="acos-confirm-alternative" disabled={disabled} onClick={()=>setArmed(true)}>{label} con botón</button>:<div className="acos-confirm-prompt"><span>¿Confirmar esta operación?</span><button type="button" className="btn btn-soft" onClick={()=>setArmed(false)}>Cancelar</button><button type="button" className="btn btn-dark" disabled={disabled} onClick={execute}><Check size={16}/> Confirmar</button></div>}</div>;
}
export function PrivateSkeleton(){return <div className="acos-skeleton" role="status" aria-label="Cargando información"><span/><span/><span/><small>Consultando información autorizada…</small></div>;}
