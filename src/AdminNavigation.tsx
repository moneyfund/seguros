import {useEffect,useId,useState} from 'react';
import {ChevronDown,Users,ShieldCheck,Wallet,UserRound,Mail,type LucideIcon} from 'lucide-react';
import type {MobileItem} from './MobileWorkspace';
import './admin-navigation.css';
const groups:{id:string;label:string;icon:LucideIcon;keys:string[]}[]=[
 {id:'commercial',label:'Clientes y ventas',icon:Users,keys:['clientes','prospectos','solicitudes']},
 {id:'policies',label:'Pólizas y documentos',icon:ShieldCheck,keys:['polizas','emision','renovaciones','documentos']},
 {id:'finance',label:'Finanzas y administración',icon:Wallet,keys:['finanzas','configuracion','papelera']},
 {id:'team',label:'Equipo y accesos',icon:UserRound,keys:['equipo','aprobaciones','vistas','registro','guia']},
 {id:'communication',label:'Comunicación y formación',icon:Mail,keys:['correo','correo-supervision','academy']}
];
export default function AdminNavigation({items,onSelect,variant='desktop'}:{items:MobileItem[];onSelect?:(fn:()=>void)=>void;variant?:'desktop'|'mobile'}){
 const active=items.find(item=>item.active)?.key;
 const activeGroup=groups.find(group=>active&&group.keys.includes(active))?.id||null;
 const [expanded,setExpanded]=useState<string[]>(()=>activeGroup?[activeGroup]:[]);
 const uid=useId();
 useEffect(()=>{if(activeGroup)setExpanded(prev=>prev.includes(activeGroup)?prev:[...prev,activeGroup]);},[active,activeGroup]);
 const byKey=new Map(items.map(item=>[item.key,item]));
 const itemButton=(item:MobileItem)=><button key={item.key} type="button" className={'sidebar-item ac-admin-link '+(item.active?'active':'')} aria-current={item.active?'page':undefined} onClick={()=>onSelect?onSelect(item.onClick):item.onClick()}><item.icon size={17}/><span>{item.label}</span>{!!item.count&&<i>{item.count}</i>}</button>;
 return <div className={'ac-admin-navigation ac-admin-navigation-'+variant}>
  {byKey.has('resumen')&&itemButton(byKey.get('resumen')!)}
  {groups.map(group=>{
   const children=group.keys.flatMap(key=>byKey.has(key)?[byKey.get(key)!]:[]);
   if(!children.length)return null;
   const open=expanded.includes(group.id),current=group.id===activeGroup,id=uid+'-'+group.id;
   return <div className="ac-admin-nav-group" key={group.id}>
    <button type="button" className={'ac-admin-nav-toggle '+(current?'ac-current':'')} aria-expanded={open} aria-controls={id} onClick={()=>setExpanded(prev=>prev.includes(group.id)?prev.filter(id=>id!==group.id):[...prev,group.id])}><group.icon size={18}/><span>{group.label}</span><ChevronDown className="ac-admin-chevron" size={16}/></button>
    <div id={id} className="ac-admin-nav-children" hidden={!open}>{children.map(itemButton)}</div>
   </div>;
  })}
 </div>;
}
