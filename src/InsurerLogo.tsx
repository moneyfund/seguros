import { useState } from 'react';
import type { NicaraguanInsurer } from './insurers';

type LogoSize = 'compact' | 'featured';

/**
 * Uses only image files committed to the repository by the project owner.
 * On a bad path or invalid image, shows the existing two-letter monogram.
 * Logos are never cropped or color-filtered; original proportions are kept.
 */
export default function InsurerLogo({
  insurer, size='compact'
}:{
  insurer:NicaraguanInsurer;
  size?:LogoSize;
}) {
  const [failed,setFailed]=useState(false);
  return <span className={'insurer-brand-mark '+(size==='featured'?'insurer-brand-featured':'insurer-brand-compact')}>
    {failed
      ? <span className="insurer-brand-fallback" aria-hidden="true">{insurer.monogram}</span>
      : <img src={insurer.logo} alt={'Logo de '+insurer.displayName}
          loading="lazy" decoding="async"
          onError={()=>setFailed(true)}
        />}
  </span>;
}
