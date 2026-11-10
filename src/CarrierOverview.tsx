import { ArrowRight, BadgeCheck, Building2, ExternalLink } from 'lucide-react';
import { nicaraguanInsurers, regulatorDirectory, insurerFromText } from './insurers';
import { money } from './data';
import InsurerLogo from './InsurerLogo';
import type { LiveRecord } from './backend';

/** Operational Firestore policies, not the isolated pilot collection. */
export default function CarrierOverview({
  policies,onOpenCatalogue
}:{
  policies:LiveRecord[];
  onOpenCatalogue?:()=>void;
}) {
  return <section className="ins-live-carriers">
    <div className="ins-live-carriers-heading">
      <div><span className="ins-eyebrow"><Building2 size={15}/> REFERENCIA NACIONAL</span>
        <h3>Aseguradoras disponibles para registrar expedientes</h3>
        <p>Seleccioná una entidad registrada ante SIBOIF cuando creés una póliza. El registro en ACOS es interno; no emite contratos.</p>
      </div>
      <a href={regulatorDirectory} target="_blank" rel="noopener noreferrer">Directorio oficial <ExternalLink size={14}/></a>
    </div>
    <div className="ins-live-carrier-grid">
      {nicaraguanInsurers.map(insurer=>{
        const matching=policies.filter(p=>insurerFromText(String(p.insurer||''))?.id===insurer.id);
        const total=matching.reduce((sum,p)=>sum+Number(p.premium||0),0);
        return <div className="ins-live-carrier" key={insurer.id}>
          <InsurerLogo insurer={insurer} size="compact"/>
          <div><strong>{insurer.displayName}</strong><small>{matching.length} expediente(s) · {money(total)}</small></div>
          <BadgeCheck size={15}/>
        </div>;
      })}
    </div>
    {onOpenCatalogue&&<button className="ins-live-carriers-action" onClick={onOpenCatalogue}>
      Abrir cartera operativa de ejemplo <ArrowRight size={16}/>
    </button>}
    <small className="ins-live-carriers-note">Catálogo oficial de nombres. No existe integración API, acuerdo comercial ni cotización automática con estas compañías.</small>
  </section>;
}
