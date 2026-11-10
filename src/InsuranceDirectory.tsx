import { ArrowRight, Building2, ExternalLink, ShieldCheck } from 'lucide-react';
import {
  nicaraguanInsurers, regulatorDirectory,
  insurerFromText, type NicaraguanInsurer
} from './insurers';
import type { PilotPolicy } from './pilotData';
import { money } from './data';

export default function InsuranceDirectory({
  policies,onSelect
}:{
  policies:PilotPolicy[];
  onSelect:(insurer:NicaraguanInsurer)=>void;
}) {
  const max=Math.max(1,...nicaraguanInsurers.map(i=>
    policies.filter(p=>p.insurerId===i.id||insurerFromText(p.insurer)?.id===i.id).length
  ));
  return <div className="ins-directory">
    <div className="ins-catalog-top">
      <div>
        <span className="ins-eyebrow"><Building2 size={15}/> DIRECTORIO DE ENTIDADES ASEGURADORAS</span>
        <h3>Aseguradoras de Nicaragua</h3>
        <p>Catálogo de referencia basado en las instituciones aseguradoras supervisadas por la SIBOIF. Asociá tus expedientes ficticios a una de estas entidades.</p>
      </div>
      <a href={regulatorDirectory} target="_blank" rel="noopener noreferrer" className="ins-regulator-link">Ver registro SIBOIF <ExternalLink size={14}/></a>
    </div>
    <div className="ins-partner-grid">
      {nicaraguanInsurers.map(company=>{
        const associated=policies.filter(p=>p.insurerId===company.id||insurerFromText(p.insurer)?.id===company.id);
        const premium=associated.reduce((total,policy)=>total+Number(policy.premium||0),0);
        return <article key={company.id} className="ins-partner-card">
          <div className="ins-partner-head">
            <span className="ins-monogram" aria-hidden="true">{company.monogram}</span>
            <span className="ins-registry-tag"><ShieldCheck size={13}/> SIBOIF #{company.registryId}</span>
          </div>
          <strong>{company.displayName}</strong>
          <p>{company.legalName}</p>
          <div className="ins-card-divider"/>
          <div className="ins-mini-stats">
            <span><small>PÓLIZAS DE EJEMPLO</small><b>{associated.length}</b></span>
            <span><small>PRIMAS DE REFERENCIA</small><b>{money(premium)}</b></span>
          </div>
          <div className="ins-portfolio-bar" aria-label={associated.length+' registros ficticios'}><span style={{width:(associated.length/max*100)+'%'}}/></div>
          <button type="button" onClick={()=>onSelect(company)}>Registrar póliza de ejemplo <ArrowRight size={15}/></button>
        </article>;
      })}
    </div>
    <p className="ins-catalog-disclaimer"><ShieldCheck size={17}/> Las aseguradoras son entidades reales del registro público; las cifras y expedientes son ficticios. Este módulo no consulta sus sistemas, no cotiza con ellas ni emite pólizas válidas.</p>
  </div>;
}
