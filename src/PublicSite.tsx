import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronRight, Copy, FileText, FolderOpen, LayoutGrid, LockKeyhole, Mail, Menu, Phone, ShieldCheck, X } from 'lucide-react';
import { ACOS_LOGO } from './acos-logo';
import { ProtectionArchitecture, SolutionDrawing } from './PublicArt';
import { publicContact, publicSolutions, type SolutionId } from './public-site-config';
import './public-site.css';

const navigation = [
  { id: 'inicio', label: 'Inicio' }, { id: 'nosotros', label: 'Nosotros' },
  { id: 'soluciones', label: 'Soluciones' }, { id: 'empresas', label: 'Empresas' },
  { id: 'proceso', label: 'Cómo trabajamos' }, { id: 'contacto', label: 'Contacto' },
];
const processSteps = [
  ['Escuchamos', 'tus necesidades.', 'El punto de partida es entender qué querés proteger y qué te preocupa.'],
  ['Analizamos', 'tus riesgos.', 'Ponemos en contexto tu situación personal, patrimonial o empresarial.'],
  ['Exploramos', 'alternativas.', 'Revisamos opciones, alcances y condiciones para una decisión informada.'],
  ['Acompañamos', 'la gestión.', 'Te orientamos con los requisitos y los pasos ante la aseguradora.'],
  ['Seguimos', 'a tu lado.', 'Damos seguimiento a tus consultas, documentos y próximas gestiones.'],
];
const sectionHref = (id: string) => id === 'inicio' ? '#/inicio' : '#/inicio/' + id;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Modal({title,description,onClose,children}:{title:string;description:string;onClose:()=>void;children:ReactNode}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    ref.current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {document.body.style.overflow = previousOverflow;previouslyFocused?.focus({preventScroll:true});};
  }, []);
  return <dialog className="ap-dialog" ref={ref} aria-labelledby="ap-dialog-title" aria-describedby="ap-dialog-description" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="ap-dialog-inner"><button className="ap-icon-button ap-dialog-close" onClick={onClose} aria-label="Cerrar ventana" autoFocus><X size={21}/></button><span className="ap-eyebrow">ACOS / A TU LADO</span><h2 id="ap-dialog-title">{title}</h2><p id="ap-dialog-description">{description}</p>{children}</div>
  </dialog>;
}

/** Public presentation only. No operational stores, authentication or client records. */
export default function PublicSite({openWorkspace}:{openWorkspace:()=>void}) {
  const root = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('inicio');
  const [selected, setSelected] = useState<SolutionId>('vida');
  const [consultation, setConsultation] = useState<SolutionId | null>(null);
  const [privacy, setPrivacy] = useState(false);
  const [copied, setCopied] = useState<'idle'|'done'|'error'>('idle');
  const contactSolution = publicSolutions.find(item=>item.id===consultation);
  const message = `Hola, ACOS. Me gustaría recibir orientación sobre ${contactSolution?.name.toLowerCase() || 'seguros'}. Quisiera conocer las alternativas disponibles, sus condiciones y los siguientes pasos.`;
  const whatsapp = publicContact.whatsapp.replace(/\D/g, '');
  const hasChannel = Boolean(whatsapp || publicContact.email || publicContact.phone);

  useEffect(() => {
    const sections = root.current?.querySelectorAll<HTMLElement>('section[data-nav]') || [];
    let frame: number | null = null;
    const update = () => {
      setScrolled(window.scrollY > 35);
      let current = 'inicio';
      sections.forEach(section=>{if(section.getBoundingClientRect().top <= 180)current=section.dataset.nav!;});
      setActive(current); frame = null;
    };
    const onScroll = () => {if(frame===null)frame=requestAnimationFrame(update);};
    update(); window.addEventListener('scroll',onScroll,{passive:true});
    const previousBehavior = document.documentElement.style.scrollBehavior;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const setMotion = () => {document.documentElement.style.scrollBehavior=media.matches?'auto':'smooth';};
    setMotion(); media.addEventListener('change',setMotion);
    return () => {if(frame!==null)cancelAnimationFrame(frame);window.removeEventListener('scroll',onScroll);media.removeEventListener('change',setMotion);document.documentElement.style.scrollBehavior=previousBehavior;};
  }, []);

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      const legacy:Record<string,string> = {'#inicio':'inicio','#servicios':'soluciones','#filosofia':'nosotros','#proceso':'proceso','#contacto':'contacto'};
      const id = legacy[hash] || hash.split('/')[2] || 'inicio';
      const target = document.getElementById(navigation.some(n=>n.id===id)?id:'inicio');
      target?.scrollIntoView({behavior:reducedMotion()?'instant':'smooth',block:'start'});
      target?.focus({preventScroll:true}); setMobile(false);
    };
    const frame = requestAnimationFrame(scrollToHash);
    window.addEventListener('hashchange',scrollToHash);window.addEventListener('popstate',scrollToHash);
    return () => {cancelAnimationFrame(frame);window.removeEventListener('hashchange',scrollToHash);window.removeEventListener('popstate',scrollToHash);};
  }, []);

  useEffect(() => {
    if(reducedMotion() || !('IntersectionObserver' in window))return;
    const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('ap-in-view');observer.unobserve(entry.target);}}),{threshold:0.08});
    root.current?.querySelectorAll('[data-reveal]').forEach(el=>observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if(!mobile)return;
    const closeOnEscape = (event:globalThis.KeyboardEvent) => {if(event.key==='Escape'){setMobile(false);menuButton.current?.focus();}};
    const desktop = window.matchMedia('(min-width: 1161px)');
    const closeOnDesktop = () => {if(desktop.matches)setMobile(false);};
    document.addEventListener('keydown',closeOnEscape);desktop.addEventListener('change',closeOnDesktop);
    return () => {document.removeEventListener('keydown',closeOnEscape);desktop.removeEventListener('change',closeOnDesktop);};
  }, [mobile]);

  function consult(id:SolutionId='asesoria') {setCopied('idle');setConsultation(id);setMobile(false);}
  function sectionClick(id:string) {
    setMobile(false);
    if(window.location.hash===sectionHref(id)){
      const target=document.getElementById(id);
      target?.scrollIntoView({behavior:reducedMotion()?'instant':'smooth'});target?.focus({preventScroll:true});
    }
  }
  function tabKey(event:KeyboardEvent<HTMLButtonElement>,index:number) {
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();
    const next=event.key==='Home'?0:event.key==='End'?publicSolutions.length-1:(index+(event.key==='ArrowDown'?1:-1)+publicSolutions.length)%publicSolutions.length;
    setSelected(publicSolutions[next].id);document.getElementById('ap-tab-'+publicSolutions[next].id)?.focus();
  }
  async function copyMessage() {
    try {await navigator.clipboard.writeText(message);setCopied('done');}catch {setCopied('error');}
  }

  return <div className="acos-public" ref={root}>
    <a href="#ap-main" className="ap-skip" onClick={e=>{e.preventDefault();document.getElementById('ap-main')?.focus();}}>Saltar al contenido</a>
    <header className={'ap-header'+(scrolled?' ap-header-scrolled':'')}>
      <div className="ap-container ap-navbar">
        <a href="#/inicio" className="ap-brand" aria-label="ACOS, inicio" onClick={()=>sectionClick('inicio')}><img src={ACOS_LOGO} alt="ACOS" width="87" height="67"/><span>ASESORÍA Y CORRETAJE<br/>DE SEGUROS</span></a>
        <button className="ap-icon-button ap-menu-toggle" ref={menuButton} aria-label={mobile?'Cerrar menú':'Abrir menú'} aria-expanded={mobile} aria-controls="ap-navigation" onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button>
        <nav id="ap-navigation" aria-label="Navegación principal" className={'ap-nav'+(mobile?' ap-nav-open':'')}>
          {navigation.map(item=><a key={item.id} href={sectionHref(item.id)} aria-current={active===item.id?'location':undefined} onClick={()=>sectionClick(item.id)}>{item.label}</a>)}
          <button className="ap-enterprise" onClick={openWorkspace}><LockKeyhole size={14}/> Acceso empresarial <ArrowUpRight size={14}/></button>
          <button className="ap-mobile-contact ap-button" onClick={()=>consult()}>Solicitar asesoría <ArrowUpRight size={17}/></button>
        </nav>
      </div>
    </header>
    {mobile&&<button className="ap-menu-scrim" aria-label="Cerrar menú de navegación" tabIndex={-1} onClick={()=>setMobile(false)}/>}
    <main id="ap-main" tabIndex={-1}>
      <section id="inicio" data-nav="inicio" className="ap-hero" tabIndex={-1} aria-labelledby="ap-hero-title">
        <div className="ap-container ap-hero-content"><div className="ap-eyebrow ap-hero-eyebrow"><span className="ap-dot"/> ASESORÍA DE SEGUROS EN NICARAGUA</div><h1 id="ap-hero-title">Lo que construís<br/><em>merece respaldo.</em></h1><p>Tu familia. Tu patrimonio. Tu empresa.<br className="ap-mobile-break"/> Te acompañamos a tomar<br className="ap-desktop-break"/> decisiones de protección con claridad y criterio.</p><div className="ap-actions"><button className="ap-button" onClick={()=>consult()}>Solicitar asesoría <ArrowUpRight size={17}/></button><a href={sectionHref('soluciones')} onClick={()=>sectionClick('soluciones')} className="ap-link">Explorar soluciones <ArrowDown size={16}/></a></div></div>
        <div className="ap-container ap-hero-stage"><span className="ap-art-caption ap-art-caption-left"><span>01 / LO ESENCIAL</span>Tu tranquilidad,<br/>en el centro.</span><ProtectionArchitecture/><span className="ap-art-caption ap-art-caption-right"><span>02 / NUESTRO COMPROMISO</span>Una perspectiva clara.<br/>Un respaldo cercano.</span></div>
        <div className="ap-container ap-hero-foot"><span>PROTECCIÓN CON PERSPECTIVA</span><span>PERSONAS <i/> PATRIMONIO <i/> EMPRESAS</span><a href={sectionHref('nosotros')} aria-label="Descubrir ACOS" onClick={()=>sectionClick('nosotros')}><ArrowDown size={17}/></a></div>
      </section>

      <section className="ap-about ap-container ap-section" id="nosotros" data-nav="nosotros" tabIndex={-1} aria-labelledby="ap-about-title">
        <div className="ap-section-marker"><span>01 / NOSOTROS</span><span>UNA FORMA CERCANA DE ASESORAR</span></div>
        <div className="ap-about-layout" data-reveal><h2 id="ap-about-title">Antes de hablar de seguros,<br/><em>hablemos de vos.</em></h2><div className="ap-about-copy"><p>Detrás de cada decisión hay algo que vale la pena cuidar. En ACOS empezamos por entenderlo.</p><p>Somos una empresa de asesoría y corretaje de seguros en Nicaragua. Te ayudamos a comprender tus opciones y a dar el siguiente paso con información clara y acompañamiento.</p><a href={sectionHref('proceso')} className="ap-link" onClick={()=>sectionClick('proceso')}>Así trabajamos <ArrowUpRight size={17}/></a></div></div>
        <div className="ap-principles" data-reveal>{[['Escuchar.','Entender tu contexto antes de proponer.'],['Explicar.','Hacer claras las condiciones y los alcances.'],['Acompañar.','Estar presentes en las siguientes gestiones.']].map(([title,description],i)=><div key={title}><span>0{i+1}</span><h3>{title}</h3><p>{description}</p></div>)}</div>
      </section>

      <section className="ap-solutions ap-section" id="soluciones" data-nav="soluciones" tabIndex={-1} aria-labelledby="ap-solutions-title"><div className="ap-container">
        <div className="ap-section-marker"><span>02 / SOLUCIONES</span><span>PROTECCIÓN QUE PARTE DE TU REALIDAD</span></div>
        <div className="ap-section-heading" data-reveal><h2 id="ap-solutions-title">Cada vida es distinta.<br/><em>Tu protección también.</em></h2><p>Explorá las áreas sobre las que podemos conversar. El primer paso es conocer tus necesidades.</p></div>
        <div className="ap-solution-layout" data-reveal><div className="ap-solution-tabs" role="tablist" aria-label="Áreas de orientación en seguros" aria-orientation="vertical">{publicSolutions.map((item,index)=><button key={item.id} id={'ap-tab-'+item.id} role="tab" aria-selected={selected===item.id} aria-controls={'ap-panel-'+item.id} tabIndex={selected===item.id?0:-1} onKeyDown={event=>tabKey(event,index)} onClick={()=>setSelected(item.id)}><span>{item.number}</span><strong>{item.name}</strong><ArrowUpRight size={19}/></button>)}</div>
          {publicSolutions.map(item=><article key={item.id} id={'ap-panel-'+item.id} role="tabpanel" aria-labelledby={'ap-tab-'+item.id} tabIndex={0} hidden={selected!==item.id} className="ap-solution-panel"><div className="ap-solution-visual"><span>ACOS / {item.number}</span><SolutionDrawing kind={item.id}/><em>{item.word}</em></div><div className="ap-solution-content"><h3>{item.headline}</h3><p>{item.description}</p><ul>{item.topics.map(topic=><li key={topic}><Check size={13}/>{topic}</li>)}</ul><button className="ap-link" onClick={()=>consult(item.id)}>{item.cta} <ArrowUpRight size={17}/></button></div></article>)}
        </div><p className="ap-disclosure"><span>PARA TOMAR EN CUENTA</span> Categorías orientativas. La disponibilidad, las coberturas y la contratación dependen de la evaluación y las condiciones de cada aseguradora.</p>
      </div></section>

      <section className="ap-business" id="empresas" data-nav="empresas" tabIndex={-1} aria-labelledby="ap-business-title"><div className="ap-container ap-business-layout">
        <div className="ap-business-copy" data-reveal><span className="ap-eyebrow">03 / PERSPECTIVA EMPRESARIAL</span><h2 id="ap-business-title">Tu empresa avanza.<br/><em>El respaldo también.</em></h2><p>Cada operación tiene riesgos propios. Empezamos por entender tu actividad, tus activos y tu equipo para conversar sobre alternativas de protección.</p><button className="ap-button ap-button-light" onClick={()=>consult('empresas')}>Conversemos sobre tu empresa <ArrowUpRight size={17}/></button></div>
        <div className="ap-business-map" data-reveal><span className="ap-map-label">UNA VISIÓN DE CONJUNTO</span><div className="ap-business-orbits" aria-hidden="true"><i/><i/><i/><span>ACOS</span></div><div className="ap-business-axis"><span>Tu equipo</span><span>Tus activos</span><span>Tu operación</span></div><p>Entender el contexto.<br/><strong>Cuidar la continuidad.</strong></p></div>
      </div></section>

      <section className="ap-process ap-section ap-container" id="proceso" data-nav="proceso" tabIndex={-1} aria-labelledby="ap-process-title">
        <div className="ap-section-marker"><span>04 / CÓMO TRABAJAMOS</span><span>DE LA PRIMERA CONVERSACIÓN AL SEGUIMIENTO</span></div><div className="ap-section-heading" data-reveal><h2 id="ap-process-title">Un camino claro.<br/><em>En cada paso.</em></h2><p>La confianza se construye con atención, información comprensible y continuidad.</p></div>
        <ol className="ap-journey" data-reveal>{processSteps.map(([title,subtitle,description],index)=><li key={title}><div className="ap-journey-top"><span>0{index+1}</span><ArrowRight size={16}/></div><h3>{title}<br/><span>{subtitle}</span></h3><p>{description}</p></li>)}</ol><div className="ap-care-note"><ShieldCheck size={23} strokeWidth={1.4}/><p>Información clara. Documentos organizados. Comunicación oportuna.<br/><strong>El acompañamiento también está en los detalles.</strong></p></div>
      </section>

      <section className="ap-digital ap-section" aria-labelledby="ap-digital-title"><div className="ap-container ap-digital-layout">
        <div className="ap-digital-copy" data-reveal><span className="ap-eyebrow">05 / ACOS DIGITAL</span><h2 id="ap-digital-title">Más organización.<br/><em>La misma cercanía.</em></h2><p>Estamos desarrollando una plataforma empresarial para organizar expedientes, documentos y el seguimiento de nuestras operaciones.</p><p>La tecnología como apoyo para una atención más ordenada, con las personas siempre en el centro.</p><span className="ap-development"><span className="ap-dot"/> EN DESARROLLO</span><small>El portal de clientes aún no está disponible.</small></div>
        <div className="ap-workspace-scene" data-reveal><div className="ap-workspace-caption"><span>PLATAFORMA EMPRESARIAL</span><span>VISTA CONCEPTUAL</span></div><div className="ap-workspace-preview" role="img" aria-label="Vista conceptual de la plataforma en desarrollo: expedientes, documentos y seguimiento, sin datos de clientes."><div className="ap-workspace-rail"><img src={ACOS_LOGO} alt="" width="46" height="36"/><LayoutGrid size={18}/><FolderOpen size={18}/><FileText size={18}/><LockKeyhole size={17}/></div><div className="ap-workspace-content"><div className="ap-workspace-toolbar"><span>ACOS / OPERACIONES</span><LockKeyhole size={14}/></div><h3>Todo en su lugar.</h3><p>Organización que acompaña cada gestión.</p><div className="ap-workspace-folders"><div><FolderOpen size={24} strokeWidth={1.3}/><strong>Expedientes</strong><span>Información organizada</span></div><div><FileText size={24} strokeWidth={1.3}/><strong>Documentos</strong><span>Gestión documental</span></div></div><div className="ap-workspace-flow"><span>Solicitud</span><ChevronRight size={13}/><span>Revisión</span><ChevronRight size={13}/><span>Seguimiento</span></div><div className="ap-workspace-empty"><span/><span/><span/></div><span className="ap-workspace-note">DISEÑO ILUSTRATIVO · SIN DATOS DE CLIENTES</span></div></div></div>
      </div></section>

      <section className="ap-contact ap-section" id="contacto" data-nav="contacto" tabIndex={-1} aria-labelledby="ap-contact-title"><div className="ap-container ap-contact-layout" data-reveal><div><span className="ap-eyebrow">06 / EMPECEMOS POR LO IMPORTANTE</span><h2 id="ap-contact-title">¿Qué querés<br/><em>proteger hoy?</em></h2></div><div className="ap-contact-copy"><p>Una buena conversación puede darte una nueva perspectiva. Empecemos por la tuya.</p><button className="ap-button" onClick={()=>consult()}>Solicitar asesoría <ArrowUpRight size={18}/></button><span>PERSONAS, FAMILIAS Y EMPRESAS</span>{(publicContact.email||publicContact.phone||publicContact.address)&&<address>{publicContact.email&&<a href={'mailto:'+publicContact.email}><Mail size={15}/>{publicContact.email}</a>}{publicContact.phone&&<a href={'tel:'+publicContact.phone.replace(/[^+\d]/g,'')}><Phone size={15}/>{publicContact.phone}</a>}{publicContact.address&&<p>{publicContact.address}</p>}</address>}</div></div></section>
    </main>

    <footer className="ap-footer"><div className="ap-container"><div className="ap-footer-main"><div className="ap-footer-brand"><a href="#/inicio" aria-label="ACOS, volver al inicio" onClick={()=>sectionClick('inicio')}><img src={ACOS_LOGO} alt="ACOS" width="132" height="102"/></a><p>Asesoría y corretaje de seguros.<br/>Protección con perspectiva.<br/>Nicaragua.</p></div><div><h2>Conocé ACOS</h2><a href={sectionHref('nosotros')} onClick={()=>sectionClick('nosotros')}>Nosotros</a><a href={sectionHref('proceso')} onClick={()=>sectionClick('proceso')}>Cómo trabajamos</a><a href={sectionHref('contacto')} onClick={()=>sectionClick('contacto')}>Contacto</a></div><div><h2>Soluciones</h2>{publicSolutions.map(item=><button key={item.id} onClick={()=>consult(item.id)}>{item.name}</button>)}</div><div className="ap-footer-enterprise"><h2>Entorno empresarial</h2><p>Acceso para colaboradores<br/>autorizados.</p><button onClick={openWorkspace}>Ingresar <ArrowUpRight size={16}/></button></div></div><div className="ap-footer-bottom"><span>© {new Date().getFullYear()} ACOS. Todos los derechos reservados.</span><button onClick={()=>setPrivacy(true)}>Aviso de privacidad</button><span>Diseño y desarrollo <strong>XARCON</strong></span></div></div></footer>

    {consultation&&<Modal title={hasChannel?'Conversemos.':'Prepará tu consulta.'} description={hasChannel?'Elegí un canal de atención para continuar tu consulta con ACOS.':'La atención desde esta web estará disponible cuando se publiquen los canales oficiales. Mientras tanto, podés preparar y copiar tu consulta.'} onClose={()=>setConsultation(null)}><div className="ap-consultation"><label htmlFor="ap-interest">¿Sobre qué te gustaría conversar?</label><select id="ap-interest" value={consultation} onChange={event=>{setConsultation(event.target.value as SolutionId);setCopied('idle');}}>{publicSolutions.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><label htmlFor="ap-message">Tu mensaje inicial</label><textarea id="ap-message" value={message} readOnly rows={5}/><div className="ap-consultation-actions">{whatsapp&&<a className="ap-button" href={'https://wa.me/'+whatsapp+'?text='+encodeURIComponent(message)} target="_blank" rel="noopener noreferrer">Continuar en WhatsApp <ArrowUpRight size={16}/></a>}{publicContact.email&&<a className="ap-button" href={'mailto:'+publicContact.email+'?subject='+encodeURIComponent('Consulta de seguros — ACOS')+'&body='+encodeURIComponent(message)}>Escribir por correo <Mail size={16}/></a>}{publicContact.phone&&<a className="ap-link" href={'tel:'+publicContact.phone.replace(/[^+\d]/g,'')}>Llamar a ACOS <Phone size={16}/></a>}<button className={hasChannel?'ap-link':'ap-button'} onClick={copyMessage}>{copied==='done'?'Mensaje copiado':'Copiar consulta'}{copied==='done'?<Check size={16}/>:<Copy size={16}/>}</button></div><p className="ap-copy-status" role="status">{copied==='done'?'Copiado. Podés compartirlo por un canal que ya conozcás de ACOS.':copied==='error'?'No pudimos copiar automáticamente. Seleccioná el mensaje de arriba y copialo manualmente.':''}</p><p className="ap-dialog-note"><LockKeyhole size={14}/>No se envía ni se guarda una solicitud desde esta ventana.</p></div></Modal>}
    {privacy&&<Modal title="Aviso de privacidad" description="Información sobre esta web pública y sus accesos." onClose={()=>setPrivacy(false)}><div className="ap-privacy"><h3>Consultas desde esta página</h3><p>El asistente de consulta prepara un texto en tu navegador. No solicita datos personales, no almacena el mensaje en una base de datos y no registra una solicitud. Al copiar, el texto pasa al portapapeles de tu dispositivo.</p><h3>Canales externos</h3><p>Si se habilitan enlaces de correo, teléfono o WhatsApp, la comunicación continúa en ese servicio y está sujeta a sus condiciones de privacidad.</p><h3>Acceso empresarial</h3><p>El entorno privado tiene autenticación y permisos propios. Esta página no permite consultar expedientes ni información de clientes.</p><h3>Servicios técnicos</h3><p>La entrega del sitio puede implicar el procesamiento de datos técnicos, como la dirección IP y el navegador, por parte de los proveedores de alojamiento y de fuentes tipográficas.</p><h3>Información de seguros</h3><p>El contenido es orientativo. No constituye una cotización, confirmación de cobertura ni contrato de seguro. Las condiciones deben verificarse antes de contratar.</p></div></Modal>}
  </div>;
}
