import { useState } from 'react';
import { Pause, Play, ShieldCheck } from 'lucide-react';
import { nicaraguanInsurers } from './insurers';
import InsurerLogo from './InsurerLogo';
import './public-insurers-carousel.css';

/**
 * Public insurer showcase. Brand assets are served locally from /public.
 * Duplicating the group makes the medium-speed CSS motion truly seamless.
 * The duplicate is hidden from assistive technologies.
 */
export default function PublicInsurersCarousel() {
  const [paused, setPaused] = useState(false);

  return (
    <section className="ap-insurers" aria-labelledby="ap-insurers-title">
      <div className="ap-container ap-insurers-top">
        <div className="ap-insurers-intro">
          <span className="ap-eyebrow">CONFIANZA Y OPCIONES DE PROTECCIÓN</span>
          <h2 id="ap-insurers-title">Aseguradoras con las<br /><span>que trabajamos.</span></h2>
          <p>Te acompañamos a conocer alternativas de protección con aseguradoras presentes en Nicaragua, para que elijás con información clara.</p>
        </div>
        <button
          type="button"
          className="ap-insurers-motion-control"
          aria-label={paused ? 'Reanudar movimiento de aseguradoras' : 'Pausar movimiento de aseguradoras'}
          aria-pressed={paused}
          onClick={() => setPaused(value => !value)}
        >
          {paused ? <Play size={16} fill="currentColor" aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          <span>{paused ? 'Reanudar' : 'Pausar'}</span>
        </button>
      </div>
      <div
        className="ap-insurers-viewport"
        role="group"
        aria-label="Logotipos de aseguradoras con las que trabaja ACOS"
      >
        <div className={'ap-insurers-track' + (paused ? ' ap-insurers-track-paused' : '')}>
          {[0, 1].map(copy => (
            <div
              key={copy}
              className="ap-insurers-loop"
              aria-hidden={copy === 1 ? true : undefined}
            >
              {nicaraguanInsurers.map(insurer => (
                <div className="ap-insurers-item" key={insurer.id}>
                  <InsurerLogo insurer={insurer} size="featured" />
                  <span className="ap-insurers-name">{insurer.displayName}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="ap-container ap-insurers-foot">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>Las condiciones, coberturas y disponibilidad de cada seguro dependen de la aseguradora correspondiente.</span>
      </div>
    </section>
  );
}
