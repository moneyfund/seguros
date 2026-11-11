import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowDown, ArrowRight, ArrowUpRight, BriefcaseBusiness, CarFront, Check,
  ChevronDown, ClipboardCheck, Copy, FileText, FolderOpen, HeartHandshake,
  HeartPulse, House, LockKeyhole, Mail, MapPin, Menu, MessageCircle, Phone,
  ShieldCheck, UsersRound, X,
} from 'lucide-react';
import { ACOS_LOGO } from './acos-logo';
import PublicInsurersCarousel from './PublicInsurersCarousel';
import { publicContact, publicSolutions, type SolutionId } from './public-site-config';
import './public-site.css';

const navigation = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'soluciones', label: 'Nuestros seguros' },
  { id: 'empresas', label: 'Para empresas' },
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'proceso', label: 'Cómo trabajamos' },
  { id: 'contacto', label: 'Contacto' },
];
const icons = { vida: UsersRound, vehiculos: CarFront, salud: HeartPulse, hogar: House, empresas: BriefcaseBusiness, asesoria: HeartHandshake };
const processSteps = [
  ['Te escuchamos', 'Contanos qué necesitás proteger y qué es importante para vos.'],
  ['Analizamos', 'Revisamos tu situación y los riesgos que debés considerar.'],
  ['Te orientamos', 'Exploramos alternativas y explicamos sus condiciones.'],
  ['Te acompañamos', 'Te guiamos con los requisitos y la gestión de tu seguro.'],
  ['Seguimos con vos', 'Damos seguimiento a tus consultas y próximas gestiones.'],
];
const questions = [
  ['¿ACOS es una aseguradora?', 'ACOS es una empresa de asesoría y corretaje de seguros. Te orientamos sobre alternativas de protección y acompañamos tus gestiones. La evaluación, emisión y condiciones de cada póliza corresponden a la aseguradora.'],
  ['¿Qué necesito para solicitar asesoría?', 'Para empezar, basta con saber qué querés proteger: tu familia, salud, vehículo, hogar o negocio. Durante la asesoría se revisan tus necesidades y se indican los documentos que correspondan.'],
  ['¿Cómo sé cuál seguro me conviene?', 'El punto de partida son tus necesidades y tu presupuesto. Te ayudamos a revisar alcances, límites, deducibles y exclusiones para que puedas decidir con información clara.'],
  ['¿También me acompañan después de elegir?', 'Nuestro acompañamiento incluye orientación sobre documentos, seguimiento de consultas y apoyo en las gestiones relacionadas con tu seguro. El alcance de cada gestión se revisa según tu caso.'],
];
const sectionHref = (id: string) => id === 'inicio' ? '#/inicio' : '#/inicio/' + id;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Modal({ title, description, onClose, children, wide = false }: {
  title: string; description: string; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    ref.current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      focused?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog ref={ref} className={'ap-dialog' + (wide ? ' ap-dialog-wide' : '')}
      aria-labelledby="ap-dialog-title" aria-describedby="ap-dialog-description"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="ap-dialog-inner">
        <button className="ap-icon-button ap-dialog-close" onClick={onClose} aria-label="Cerrar ventana" autoFocus><X size={22} /></button>
        <span className="ap-eyebrow">ESTAMOS PARA ASESORARTE</span>
        <h2 id="ap-dialog-title">{title}</h2>
        <p id="ap-dialog-description">{description}</p>
        {children}
      </div>
    </dialog>
  );
}

/** Public content only: never reads operational stores, client records or authentication data. */
export default function PublicSite({ openWorkspace }: { openWorkspace: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('inicio');
  const [audience, setAudience] = useState<'todos' | 'personas' | 'empresas'>('todos');
  const [detail, setDetail] = useState<SolutionId | null>(null);
  const [consultation, setConsultation] = useState<SolutionId | null>(null);
  const [privacy, setPrivacy] = useState(false);
  const [copied, setCopied] = useState<'idle' | 'done' | 'error'>('idle');
  const detailSolution = publicSolutions.find(item => item.id === detail);
  const contactSolution = publicSolutions.find(item => item.id === consultation);
  const message = 'Hola, ACOS. Me gustaría recibir asesoría sobre ' + (contactSolution?.name.toLowerCase() || 'seguros') + '. Quisiera conocer las alternativas disponibles, sus condiciones y los siguientes pasos.';
  const whatsapp = publicContact.whatsapp.replace(/\D/g, '');
  const hasChannel = Boolean(whatsapp || publicContact.email || publicContact.phone);
  const visibleSolutions = publicSolutions.filter(item => audience === 'todos' || item.audience === audience || item.audience === 'todos');

  useEffect(() => {
    const sections = root.current?.querySelectorAll<HTMLElement>('section[data-nav]') || [];
    let frame: number | null = null;
    const update = () => {
      setScrolled(window.scrollY > 35);
      let current = 'inicio';
      sections.forEach(section => { if (section.getBoundingClientRect().top <= 180) current = section.dataset.nav!; });
      setActive(current);
      frame = null;
    };
    const onScroll = () => { if (frame === null) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    const previousBehavior = document.documentElement.style.scrollBehavior;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const setMotion = () => { document.documentElement.style.scrollBehavior = media.matches ? 'auto' : 'smooth'; };
    setMotion();
    media.addEventListener('change', setMotion);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      media.removeEventListener('change', setMotion);
      document.documentElement.style.scrollBehavior = previousBehavior;
    };
  }, []);

  useEffect(() => {
    const scrollToHash = () => {
      const legacy: Record<string, string> = { '#inicio': 'inicio', '#servicios': 'soluciones', '#filosofia': 'nosotros', '#proceso': 'proceso', '#contacto': 'contacto' };
      const id = legacy[window.location.hash] || window.location.hash.split('/')[2] || 'inicio';
      const target = document.getElementById(navigation.some(item => item.id === id) ? id : 'inicio');
      if (id === 'inicio') window.scrollTo({ top: 0, behavior: reducedMotion() ? 'instant' : 'smooth' });
      else target?.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' });
      target?.focus({ preventScroll: true });
      setMobile(false);
    };
    const frame = requestAnimationFrame(scrollToHash);
    window.addEventListener('hashchange', scrollToHash);
    window.addEventListener('popstate', scrollToHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', scrollToHash);
      window.removeEventListener('popstate', scrollToHash);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion() || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('ap-in-view'); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    root.current?.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const desktop = window.matchMedia('(min-width: 1181px)');
    const closeOnDesktop = () => { if (desktop.matches) setMobile(false); };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobile(false); menuButton.current?.focus(); }
      if (event.key === 'Tab') {
        const elements = Array.from(root.current?.querySelectorAll<HTMLElement>('.ap-header a, .ap-header button') || []).filter(element => element.getClientRects().length > 0);
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', keyboard);
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [mobile]);

  function consult(id: SolutionId = 'asesoria') {
    setDetail(null); setCopied('idle'); setConsultation(id); setMobile(false);
  }
  function sectionClick(id: string) {
    setMobile(false);
    if (window.location.hash === sectionHref(id)) {
      const target = document.getElementById(id);
      if (id === 'inicio') window.scrollTo({ top: 0, behavior: reducedMotion() ? 'instant' : 'smooth' });
      else target?.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth' });
      target?.focus({ preventScroll: true });
    }
  }
  async function copyMessage() {
    try { await navigator.clipboard.writeText(message); setCopied('done'); }
    catch { setCopied('error'); }
  }

  return (
    <div className="acos-public" ref={root}>
      <a href="#ap-main" className="ap-skip" onClick={event => { event.preventDefault(); document.getElementById('ap-main')?.focus(); }}>Saltar al contenido</a>
      <div className="ap-topbar">
        <div className="ap-container"><span><MapPin size={13} /> Asesoría y corretaje de seguros en Nicaragua</span><button onClick={openWorkspace}><LockKeyhole size={13} /> Acceso empresarial <ArrowUpRight size={13} /></button></div>
      </div>
      <header className={'ap-header' + (scrolled ? ' ap-header-scrolled' : '')}>
        <div className="ap-container ap-navbar">
          <a href="#/inicio" className="ap-brand" aria-label="ACOS, inicio" onClick={() => sectionClick('inicio')}>
            <img src={ACOS_LOGO} alt="ACOS" width="92" height="71" />
            <span>ASESORÍA Y CORRETAJE<br />DE SEGUROS</span>
          </a>
          <button className="ap-icon-button ap-menu-toggle" ref={menuButton} aria-label={mobile ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={mobile} aria-controls="ap-navigation" onClick={() => setMobile(!mobile)}>{mobile ? <X /> : <Menu />}</button>
          <nav id="ap-navigation" aria-label="Navegación principal" className={'ap-nav' + (mobile ? ' ap-nav-open' : '')}>
            {navigation.map(item => <a key={item.id} href={sectionHref(item.id)} aria-current={active === item.id ? 'location' : undefined} onClick={() => sectionClick(item.id)}>{item.label}</a>)}
            <button className="ap-button ap-nav-cta" onClick={() => consult()}>Solicitar asesoría <ArrowUpRight size={16} /></button>
            <button className="ap-mobile-enterprise" onClick={openWorkspace}><LockKeyhole size={15} /> Acceso empresarial</button>
          </nav>
        </div>
      </header>
      {mobile && <button className="ap-menu-scrim" aria-label="Cerrar menú de navegación" tabIndex={-1} onClick={() => setMobile(false)} />}
      <main id="ap-main" tabIndex={-1} inert={mobile}>
        <section id="inicio" data-nav="inicio" className="ap-hero" tabIndex={-1} aria-labelledby="ap-hero-title">
          <img className="ap-hero-photo" src="/images/familia-hero.webp" alt="Una familia compartiendo un momento juntos al aire libre." width="1400" height="933" fetchPriority="high" />
          <div className="ap-hero-shade" />
          <div className="ap-container ap-hero-content">
            <span className="ap-eyebrow ap-light-eyebrow"><span /> TUS PLANES MERECEN PROTECCIÓN</span>
            <h1 id="ap-hero-title">Protegé lo que<br /><span>más importa.</span></h1>
            <p>Tu familia, tu salud, tu vehículo, tu hogar.<br />Seguros para cada parte de tu vida,<br className="ap-desktop-break" /> con ACOS a tu lado.</p>
            <div className="ap-actions">
              <a className="ap-button ap-button-lime" href={sectionHref('soluciones')} onClick={() => sectionClick('soluciones')}>Encontrá tu seguro <ArrowRight size={19} /></a>
              <button className="ap-hero-consult" onClick={() => consult()}>Hablemos <MessageCircle size={18} /></button>
            </div>
            <div className="ap-hero-assurance"><ShieldCheck size={20} /><span>Asesoría personal. Decisiones con confianza.</span></div>
          </div>
          <div className="ap-hero-caption"><span>PARA VIVIR EL PRESENTE.</span><strong>Y cuidar lo que viene.</strong></div>
        </section>

        <div className="ap-container ap-shortcut-wrap">
          <div className="ap-shortcuts" aria-label="Explorá las categorías de seguros">
            <div className="ap-shortcut-intro"><span>EMPECEMOS POR VOS</span><strong>¿Qué querés<br />proteger?</strong></div>
            {publicSolutions.map(item => {
              const Icon = icons[item.id];
              return <button key={item.id} onClick={() => setDetail(item.id)} aria-label={'Conocer ' + item.name.toLowerCase()}><Icon size={29} strokeWidth={1.5} /><span>{item.shortName}</span><ArrowUpRight size={14} /></button>;
            })}
          </div>
        </div>

        <section className="ap-section ap-products" id="soluciones" data-nav="soluciones" tabIndex={-1} aria-labelledby="ap-products-title">
          <div className="ap-container">
            <div className="ap-section-heading">
              <div><span className="ap-eyebrow">NUESTROS SEGUROS</span><h2 id="ap-products-title">Para tu vida de hoy.<br /><span>Y tus planes de mañana.</span></h2></div>
              <div className="ap-products-intro"><p>Conocé las áreas de protección y encontrá el punto de partida para tu próxima decisión.</p>
                <div className="ap-filters" role="group" aria-label="Filtrar seguros">
                  {([['todos', 'Todos'], ['personas', 'Para vos'], ['empresas', 'Para tu empresa']] as const).map(([id, label]) => <button key={id} aria-pressed={audience === id} onClick={() => setAudience(id)}>{label}</button>)}
                </div>
              </div>
            </div>
            <div className={'ap-product-grid' + (audience !== 'todos' ? ' ap-grid-filtered' : '')}>
              {visibleSolutions.map(item => {
                const Icon = icons[item.id];
                return <article key={item.id} className={'ap-product ap-product-' + item.id}>
                  {item.id !== 'asesoria' && <img src={item.image} alt={item.alt} width="1000" height="667" loading="lazy" decoding="async" />}
                  <div className="ap-product-shade" />
                  <div className="ap-product-top"><span className="ap-product-icon"><Icon size={25} strokeWidth={1.6} /></span><span>{item.audience === 'empresas' ? 'PARA TU NEGOCIO' : item.id === 'asesoria' ? 'SIEMPRE A TU LADO' : 'PARA VOS'}</span></div>
                  <div className="ap-product-body"><h3>{item.name}</h3><p>{item.summary}</p><button onClick={() => setDetail(item.id)} aria-label={'Ver detalles de ' + item.name.toLowerCase()}>{item.id === 'asesoria' ? 'Conocé cómo te ayudamos' : 'Conocé este seguro'}<ArrowUpRight size={18} /></button></div>
                </article>;
              })}
            </div>
            <div className="ap-product-note"><ShieldCheck size={17} /><p>Te orientamos sobre estas categorías. La disponibilidad y las coberturas se revisan según tu caso y las condiciones de cada aseguradora.</p></div>
          </div>
        </section>

        <PublicInsurersCarousel />

        <section className="ap-business" id="empresas" data-nav="empresas" tabIndex={-1} aria-labelledby="ap-business-title">
          <div className="ap-business-image"><img src="/images/negocio.webp" alt="Área de atención de una cafetería, con iluminación cálida y mobiliario de madera." width="1000" height="667" loading="lazy" decoding="async" /><span>DETRÁS DE CADA NEGOCIO,<br /><strong>hay un gran esfuerzo.</strong></span></div>
          <div className="ap-business-copy">
            <span className="ap-eyebrow ap-light-eyebrow">SEGUROS PARA EMPRESAS</span>
            <h2 id="ap-business-title">Vos hacés<br />crecer tu negocio.<br /><span>Juntos, lo cuidamos.</span></h2>
            <p>Tu equipo, tus activos y tu operación. Te ayudamos a identificar lo que necesitás proteger para seguir construyendo.</p>
            <div className="ap-business-needs"><span><BriefcaseBusiness size={19} /> Tu operación</span><span><House size={19} /> Tus activos</span><span><UsersRound size={19} /> Tu equipo</span></div>
            <button className="ap-button ap-button-lime" onClick={() => consult('empresas')}>Asesoría para mi empresa <ArrowUpRight size={18} /></button>
          </div>
        </section>

        <section className="ap-section ap-about" id="nosotros" data-nav="nosotros" tabIndex={-1} aria-labelledby="ap-about-title">
          <div className="ap-container ap-about-layout" data-reveal>
            <div className="ap-about-visual"><img src="/images/asesoria.webp" alt="Revisión de documentos y alternativas durante una asesoría." width="1000" height="667" loading="lazy" decoding="async" /><div className="ap-about-label"><HeartHandshake size={31} strokeWidth={1.4} /><div><strong>Entender antes de elegir.</strong><span>Ese es nuestro punto de partida.</span></div></div></div>
            <div className="ap-about-copy"><span className="ap-eyebrow">CONOCÉ ACOS</span><h2 id="ap-about-title">Los seguros son<br />importantes.<br /><span>Las personas, más.</span></h2><p>Somos una empresa de asesoría y corretaje de seguros en Nicaragua. Escuchamos lo que necesitás, te explicamos tus opciones y te acompañamos en cada gestión.</p>
              <ul className="ap-about-benefits"><li><Check size={17} /><div><strong>Asesoría que parte de vos</strong><span>Tu situación y tus prioridades van primero.</span></div></li><li><Check size={17} /><div><strong>Información que se entiende</strong><span>Alcances y condiciones, con claridad.</span></div></li><li><Check size={17} /><div><strong>Acompañamiento que continúa</strong><span>Atención, documentos y seguimiento.</span></div></li></ul>
              <a className="ap-text-link" href={sectionHref('proceso')} onClick={() => sectionClick('proceso')}>Así trabajamos con vos <ArrowRight size={18} /></a>
            </div>
          </div>
        </section>

        <section className="ap-process ap-section" id="proceso" data-nav="proceso" tabIndex={-1} aria-labelledby="ap-process-title">
          <div className="ap-container">
            <div className="ap-section-heading"><div><span className="ap-eyebrow">DE LA PRIMERA CONSULTA AL SEGUIMIENTO</span><h2 id="ap-process-title">El siguiente paso,<br /><span>lo damos con vos.</span></h2></div><button className="ap-text-link" onClick={() => consult()}>Empezá con una consulta <ArrowRight size={18} /></button></div>
            <ol className="ap-journey" data-reveal>{processSteps.map(([title, description], index) => <li key={title}><div className="ap-step-number"><span>0{index + 1}</span><ArrowRight size={17} /></div><h3>{title}</h3><p>{description}</p></li>)}</ol>
          </div>
        </section>

        <section className="ap-digital" aria-labelledby="ap-digital-title">
          <div className="ap-container ap-digital-layout">
            <div className="ap-digital-copy"><span className="ap-eyebrow">ACOS DIGITAL <span className="ap-development">EN DESARROLLO</span></span><h2 id="ap-digital-title">Una atención cercana.<br /><span>Cada vez más conectada.</span></h2><p>Estamos desarrollando nuestra plataforma para organizar documentos, expedientes y seguimiento. Más orden en cada gestión, con las personas siempre en el centro.</p><small>El portal de clientes aún no está disponible.</small></div>
            <div className="ap-workspace-preview" aria-label="Vista ilustrativa de la plataforma de ACOS en desarrollo. Sin datos de clientes.">
              <div className="ap-workspace-top"><span><ShieldCheck size={18} /> ACOS <b>/ OPERACIONES</b></span><LockKeyhole size={15} /></div>
              <div className="ap-workspace-body"><span className="ap-preview-label">ORGANIZACIÓN Y SEGUIMIENTO</span><div className="ap-workspace-items"><span><FolderOpen size={25} /><strong>Expedientes</strong></span><span><FileText size={25} /><strong>Documentos</strong></span><span><ClipboardCheck size={25} /><strong>Gestiones</strong></span></div><div className="ap-workspace-flow"><span>Solicitud</span><ArrowRight size={14} /><span>Revisión</span><ArrowRight size={14} /><span>Seguimiento</span></div><small>VISTA ILUSTRATIVA · SIN DATOS DE CLIENTES</small></div>
            </div>
          </div>
        </section>

        <section className="ap-section ap-faq" aria-labelledby="ap-faq-title">
          <div className="ap-container ap-faq-layout"><div><span className="ap-eyebrow">RESOLVÉ TUS DUDAS</span><h2 id="ap-faq-title">Hablemos claro<br /><span>de seguros.</span></h2><p>Lo que necesitás saber para dar el primer paso.</p><button className="ap-text-link" onClick={() => consult()}>Tengo otra consulta <MessageCircle size={18} /></button></div><div className="ap-questions">{questions.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={19} /></summary><p>{answer}</p></details>)}</div></div>
        </section>

        <section className="ap-contact" id="contacto" data-nav="contacto" tabIndex={-1} aria-labelledby="ap-contact-title">
          <div className="ap-container ap-contact-layout"><div><span className="ap-eyebrow">TU TRANQUILIDAD EMPIEZA CON UNA CONVERSACIÓN</span><h2 id="ap-contact-title">Contanos tus planes.<br /><span>Hablemos de protección.</span></h2></div><div><button className="ap-button" onClick={() => consult()}>Solicitar asesoría <ArrowUpRight size={20} /></button><p>Para vos, tu familia y tu empresa.</p>{(publicContact.email || publicContact.phone || publicContact.address) && <address>{publicContact.email && <a href={'mailto:' + publicContact.email}><Mail size={16} />{publicContact.email}</a>}{publicContact.phone && <a href={'tel:' + publicContact.phone.replace(/[^+\d]/g, '')}><Phone size={16} />{publicContact.phone}</a>}{publicContact.address && <span>{publicContact.address}</span>}</address>}</div></div>
        </section>
      </main>

      <footer className="ap-footer" inert={mobile}>
        <div className="ap-container">
          <div className="ap-footer-main">
            <div className="ap-footer-brand"><a href="#/inicio" aria-label="ACOS, volver al inicio" onClick={() => sectionClick('inicio')}><img src={ACOS_LOGO} alt="ACOS" width="124" height="95" /></a><p>Asesoría y corretaje de seguros.<br />Cerca de vos. Cerca de lo que importa.</p><span><MapPin size={14} /> Nicaragua</span></div>
            <div><h2>Conocé ACOS</h2><a href={sectionHref('nosotros')} onClick={() => sectionClick('nosotros')}>Nosotros</a><a href={sectionHref('proceso')} onClick={() => sectionClick('proceso')}>Cómo trabajamos</a><a href={sectionHref('contacto')} onClick={() => sectionClick('contacto')}>Contacto</a><button onClick={() => setPrivacy(true)}>Aviso de privacidad</button></div>
            <div><h2>Nuestros seguros</h2>{publicSolutions.slice(0, 5).map(item => <button key={item.id} onClick={() => setDetail(item.id)}>{item.name}</button>)}</div>
            <div className="ap-footer-help"><h2>Estamos para orientarte</h2><p>Elegí con información clara.<br />Empezá por una consulta.</p><button className="ap-text-link" onClick={() => consult()}>Solicitar asesoría <ArrowUpRight size={16} /></button><button className="ap-footer-access" onClick={openWorkspace}><LockKeyhole size={14} /> Acceso empresarial</button></div>
          </div>
          <div className="ap-footer-bottom"><span>© {new Date().getFullYear()} ACOS. Todos los derechos reservados.</span><span>Diseño y desarrollo <strong>XARCON</strong></span><a href="#/inicio" onClick={() => sectionClick('inicio')}>Volver arriba <ArrowDown size={14} /></a></div>
        </div>
      </footer>

      {detailSolution && <Modal wide title={detailSolution.name} description={detailSolution.headline} onClose={() => setDetail(null)}>
        <div className="ap-detail-layout"><img src={detailSolution.image} alt={detailSolution.alt} width="1000" height="667" /><div><p>{detailSolution.description}</p><h3>¿Qué revisamos con vos?</h3><ul>{detailSolution.topics.map(topic => <li key={topic}><Check size={17} />{topic}</li>)}</ul><button className="ap-button" onClick={() => consult(detailSolution.id)}>Solicitar asesoría <ArrowUpRight size={17} /></button></div></div><p className="ap-dialog-note">Información orientativa. Los alcances, requisitos y disponibilidad deben confirmarse con la aseguradora antes de contratar.</p>
      </Modal>}
      {consultation && <Modal title={hasChannel ? 'Hablemos de tu seguro.' : 'Prepará tu consulta.'} description={hasChannel ? 'Elegí un canal de atención para continuar tu consulta con ACOS.' : 'Los canales de atención de esta web estarán disponibles próximamente. Por ahora, podés preparar y copiar tu consulta.'} onClose={() => setConsultation(null)}>
        <div className="ap-consultation"><label htmlFor="ap-interest">¿Qué te gustaría proteger?</label><select id="ap-interest" value={consultation} onChange={event => { setConsultation(event.target.value as SolutionId); setCopied('idle'); }}>{publicSolutions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><label htmlFor="ap-message">Tu mensaje inicial</label><textarea id="ap-message" value={message} readOnly rows={5} /><div className="ap-consultation-actions">{whatsapp && <a className="ap-button" href={'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(message)} target="_blank" rel="noopener noreferrer">Continuar en WhatsApp <ArrowUpRight size={16} /></a>}{publicContact.email && <a className="ap-button" href={'mailto:' + publicContact.email + '?subject=' + encodeURIComponent('Consulta de seguros — ACOS') + '&body=' + encodeURIComponent(message)}>Escribir por correo <Mail size={16} /></a>}{publicContact.phone && <a className="ap-text-link" href={'tel:' + publicContact.phone.replace(/[^+\d]/g, '')}>Llamar a ACOS <Phone size={16} /></a>}<button className={hasChannel ? 'ap-text-link' : 'ap-button'} onClick={copyMessage}>{copied === 'done' ? 'Mensaje copiado' : 'Copiar consulta'}{copied === 'done' ? <Check size={16} /> : <Copy size={16} />}</button></div><p className="ap-copy-status" role="status">{copied === 'done' ? 'Copiado. Podés compartirlo por un canal que ya conozcás de ACOS.' : copied === 'error' ? 'No pudimos copiar automáticamente. Seleccioná el mensaje de arriba y copialo manualmente.' : ''}</p><p className="ap-dialog-note"><LockKeyhole size={14} />No se envía ni se guarda una solicitud desde esta ventana.</p></div>
      </Modal>}
      {privacy && <Modal title="Aviso de privacidad" description="Información sobre esta web pública y sus accesos." onClose={() => setPrivacy(false)}>
        <div className="ap-privacy"><h3>Consultas desde esta página</h3><p>El asistente de consulta prepara un texto en tu navegador. No solicita datos personales, no almacena el mensaje en una base de datos y no registra una solicitud. Al copiar, el texto pasa al portapapeles de tu dispositivo.</p><h3>Canales externos</h3><p>Si se habilitan enlaces de correo, teléfono o WhatsApp, la comunicación continúa en ese servicio y está sujeta a sus condiciones de privacidad.</p><h3>Acceso empresarial</h3><p>El entorno privado tiene autenticación y permisos propios. Esta página no permite consultar expedientes ni información de clientes.</p><h3>Servicios técnicos</h3><p>La entrega del sitio puede implicar el procesamiento de datos técnicos, como la dirección IP y el navegador, por parte de los proveedores de alojamiento y de fuentes tipográficas.</p><h3>Información de seguros</h3><p>El contenido es orientativo. No constituye una cotización, confirmación de cobertura ni contrato de seguro. Las condiciones deben verificarse antes de contratar.</p></div>
      </Modal>}
    </div>
  );
}
