import {useState} from 'react';
import {ArrowUpRight,Search,X} from 'lucide-react';
import {insuranceCatalog,searchCatalog,type InsuranceProduct,type CatalogAudience} from './insuranceCatalog';
import './insurance-catalog.css';
export function ProductOptions(){return <>{insuranceCatalog.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}</>;}
export default function InsuranceCatalogBrowser({internal=true}:{internal?:boolean}){
 const [audience,setAudience]=useState<CatalogAudience>('personas'),[query,setQuery]=useState(''),[selected,setSelected]=useState<InsuranceProduct|null>(null);
 const products=searchCatalog(query,audience);
 return <div className="ac-catalog-internal">
  <div className="ac-catalog-controls"><div className="ac-catalog-tabs" role="group" aria-label="Segmento comercial">{(['personas','empresas'] as const).map(a=><button type="button" key={a} aria-pressed={audience===a} onClick={()=>{setAudience(a);setSelected(null);}}>{a==='personas'?'Personas':'Empresas'}</button>)}</div><label className="ac-catalog-search"><Search size={16}/><input aria-label="Buscar seguro" placeholder="Buscar seguro…" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
  <div className="ac-catalog-list">{products.map(p=><button key={p.id} type="button" onClick={()=>setSelected(p)}><span>{p.name}</span><ArrowUpRight size={15}/></button>)}{!products.length&&<p>No hay seguros que coincidan.</p>}</div>
  {selected&&<div className="ac-catalog-selected"><div><h4>{selected.name}</h4><p>{selected.summary}</p><ul>{selected.topics.map(t=><li key={t}>{t}</li>)}</ul><small>{selected.flow==='vehicle-mandatory'?'Flujo vehicular existente en pruebas.':'Clasificación comercial disponible; requisitos de emisión pendientes de validación.'}</small></div><button type="button" aria-label="Cerrar ficha" onClick={()=>setSelected(null)}><X size={18}/></button></div>}
 </div>;
}
