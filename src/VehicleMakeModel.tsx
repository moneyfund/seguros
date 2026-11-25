import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
import {Search,ChevronDown,Check} from 'lucide-react';
import type {VehicleDetails} from './enterpriseTrial';
import {vehicleMakes,modelsForMake,filterVehicleOptions,vehicleSearchKey} from './vehicleCatalog';
import './vehicle-selector.css';
function SearchableField({label,value,onChange,options,max,placeholder,emptyMessage}:{label:string;value:string;onChange:(value:string)=>void;options:readonly string[];max:number;placeholder:string;emptyMessage:string}){
 const [open,setOpen]=useState(false),[search,setSearch]=useState(''),[active,setActive]=useState(-1);
 const id=useId(),input=useRef<HTMLInputElement>(null),wrap=useRef<HTMLDivElement>(null);
 const filtered=filterVehicleOptions(options,search);
 function show(){setSearch('');setActive(-1);setOpen(true);}
 function close(){setOpen(false);setActive(-1);}
 function select(option:string){onChange(option);close();input.current?.focus();}
 useEffect(()=>{
  if(!open)return;
  function outside(event:PointerEvent){if(!wrap.current?.contains(event.target as Node))setOpen(false);}
  document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);
 },[open]);
 useEffect(()=>{if(open&&active>=0)document.getElementById(id+'-option-'+active)?.scrollIntoView({block:'nearest'});},[open,active,id]);
 function keys(e:KeyboardEvent<HTMLInputElement>){
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!open){show();setActive(e.key==='ArrowDown'?0:options.length-1);}else if(filtered.length)setActive(prev=>e.key==='ArrowDown'?Math.min(prev+1,filtered.length-1):prev<0?filtered.length-1:Math.max(prev-1,0));}
  else if(e.key==='Enter'&&open){e.preventDefault();if(active>=0&&filtered[active])select(filtered[active]);else close();}
  else if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();close();}
  else if(e.key==='Tab')close();
 }
 return <div ref={wrap} className="ac-vehicle-field" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))close();}}>
  <label htmlFor={id}>{label}</label>
  <div className="ac-vehicle-input"><input id={id} ref={input} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={id+'-options'} aria-activedescendant={open&&active>=0&&active<filtered.length?id+'-option-'+active:undefined} autoComplete="off" maxLength={max} value={value} placeholder={placeholder} onClick={()=>{if(!open)show();}} onChange={e=>{onChange(e.target.value);setSearch(e.target.value);setActive(-1);setOpen(true);}} onKeyDown={keys}/>
   <button type="button" aria-label={'Buscar '+label.toLowerCase()} aria-expanded={open} aria-controls={id+'-options'} className="ac-vehicle-trigger" onMouseDown={e=>e.preventDefault()} onClick={()=>{input.current?.focus();if(open)close();else show();}}><Search size={16}/><ChevronDown size={13}/></button>
  </div>
  {open&&<div className="ac-vehicle-options-wrap"><div role="listbox" id={id+'-options'} aria-label={label+' disponibles'} className="ac-vehicle-options">
   {filtered.map((option,i)=><div role="option" aria-selected={option===value} id={id+'-option-'+i} key={option} className={'ac-vehicle-option '+(active===i?'ac-vehicle-highlight':'')} onMouseDown={e=>e.preventDefault()} onClick={()=>select(option)}><span>{option}</span>{option===value&&<Check size={15}/>}</div>)}
  </div>{!filtered.length&&<p role="status">{emptyMessage}</p>}<small>También puedes escribir un valor que no aparezca en el catálogo.</small></div>}
 </div>;
}
export default function VehicleMakeModel({vehicle,onChange}:{vehicle:VehicleDetails;onChange:(value:VehicleDetails)=>void}){
 return <><SearchableField label="Marca" value={vehicle.make} onChange={make=>onChange({...vehicle,make,model:vehicleSearchKey(make)===vehicleSearchKey(vehicle.make)?vehicle.model:''})} options={vehicleMakes} max={60} placeholder="Buscar o seleccionar marca" emptyMessage="Marca no encontrada. Puedes registrarla manualmente."/>
 <SearchableField key={vehicleSearchKey(vehicle.make)} label="Modelo" value={vehicle.model} onChange={model=>onChange({...vehicle,model})} options={modelsForMake(vehicle.make)} max={80} placeholder={vehicle.make?'Buscar o seleccionar modelo':'Selecciona o escribe una marca'} emptyMessage={vehicle.make?'No hay coincidencias. Escribe el modelo de la circulación.':'Selecciona o escribe primero la marca.'}/></>;
}
