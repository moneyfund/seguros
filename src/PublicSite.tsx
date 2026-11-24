import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, BriefcaseBusiness, CarFront, Check,
  ChevronDown, ClipboardCheck, Copy, FileText, FolderOpen, HeartHandshake,
  HeartPulse, House, LockKeyhole, Mail, MapPin, Menu, MessageCircle, Phone,
  ShieldCheck, UsersRound, X, Plane, Stethoscope, Tractor, Truck, HardHat, Flame, Wrench, Scale, Building2,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import PublicInsurersCarousel from './PublicInsurersCarousel';
import { publicContact, publicSolutions, featuredSolutions, catalogSolutions, type SolutionId } from './public-site-config';
import type { CatalogAudience } from './insuranceCatalog';
import { productVisuals, type ProductVisual } from './productVisuals';
import './public-site.css';

const navigation = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'soluciones', label: 'Nuestros seguros' },
  { id: 'empresas', label: 'Para empresas' },
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'proceso', label: 'Cómo trabajamos' },
  { id: 'contacto', label: 'Contacto' },
];
const icons: Record<string, typeof ShieldCheck> = { vida: UsersRound, vehiculos: CarFront, salud: HeartPulse, hogar: House, empresas: BriefcaseBusiness, asesoria: HeartHandshake, soa: ShieldCheck, viajes: Plane, accidentes: HeartPulse, robos: LockKeyhole, agricola: Tractor, 'gastos-medicos': Stethoscope, 'micro-seguro': BriefcaseBusiness, maquinarias: Wrench, transportes: Truck, do: Building2, eo: Scale, incendios: Flame, responsabilidad: ShieldCheck, contratista: HardHat, construccion: HardHat };
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
const sectionHref = (id: string) => id === 'soluciones' ? '#/seguros' : id === 'inicio' ? '#/inicio' : '#/inicio/' + id;
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

/** An unavailable external image must not break the card or its consultation. */
function ProductPhoto({visual,className='',eager=false}:{visual:ProductVisual;className?:string;eager?:boolean}){
 const [failed,setFailed]=useState(false);
 const [fallbackFailed,setFallbackFailed]=useState(false);
 const image=failed?visual.fallback:visual.photo;
 if(fallbackFailed)return null;
 return <img className={className} src={image} alt="" width="1000" height="667" referrerPolicy="no-referrer" loading={eager?'eager':'lazy'} decoding="async" onError={()=>{if(failed||visual.photo===visual.fallback)setFallbackFailed(true);else setFailed(true);}} />;
}
function productStyle(visual:ProductVisual):CSSProperties{
 return {'--product-tone':visual.tone,'--product-ink':visual.ink,'--product-accent':visual.accent,'--product-position':visual.position} as CSSProperties;
}

type CatalogSolution = typeof catalogSolutions[number];
function InsuranceCard({item,audience,onOpen}:{item:CatalogSolution;audience:CatalogAudience;onOpen:(id:SolutionId)=>void}){
 const Icon=icons[item.id]||ShieldCheck;
 const visual=productVisuals[item.id];
 return <article className={'ap-product ap-product-'+item.id} style={productStyle(visual)}>
  <div className="ap-product-media" aria-hidden="true">
   <Icon className="ap-product-watermark" size={125} strokeWidth={.8}/>
   <ProductPhoto visual={visual}/>
   <div className="ap-product-media-shade"/>
   <span className="ap-product-icon"><Icon size={25} strokeWidth={1.65}/></span>
  </div>
  <div className="ap-product-body">
   <span className="ap-product-audience">{audience==='empresas'?'SEGUROS PARA EMPRESAS':'SEGUROS PARA PERSONAS'}</span>
   <h3>{item.name}</h3><p>{item.summary}</p>
   <button type="button" onClick={()=>onOpen(item.id)} aria-label={'Ver detalles de '+item.name.toLowerCase()}>Conocé este seguro<span className="ap-product-arrow"><ArrowUpRight size={18}/></span></button>
  </div>
 </article>;
}

function InsuranceCarousel({items,audience,onOpen}:{items:CatalogSolution[];audience:CatalogAudience;onOpen:(id:SolutionId)=>void}){
 const track=useRef<HTMLDivElement>(null);
 const region=useRef<HTMLDivElement>(null);
 const interaction=useRef(false),focused=useRef(false),visible=useRef(false);
 const [paused,setPaused]=useState(false);
 const [position,setPosition]=useState({index:0,max:0});
 const metrics=()=>{
  const el=track.current;if(!el)return null;
  const cards=el.children;
  const first=cards[0] as HTMLElement|undefined,second=cards[1] as HTMLElement|undefined;
  const step=first&&second?second.offsetLeft-first.offsetLeft:first?.offsetWidth||el.clientWidth;
  const limit=Math.max(0,el.scrollWidth-el.clientWidth);
  return {el,step,limit,index:step>0?Math.round(el.scrollLeft/step):0,max:step>0?Math.round(limit/step):0};
 };
 function sync(){const m=metrics();if(m)setPosition({index:Math.min(m.index,m.max),max:m.max});}
 function advance(direction:number){
  const m=metrics();if(!m||!m.limit||m.step<=0)return;
  const next=m.index+direction;
  const end=direction>0&&m.el.scrollLeft>=m.limit-4;
  const start=direction<0&&m.el.scrollLeft<=4;
  const destination=end?0:start?m.limit:Math.max(0,Math.min(m.limit,next*m.step));
  m.el.scrollTo({left:destination,behavior:reducedMotion()?'instant':'smooth'});
 }
 useEffect(()=>{
  const el=track.current;if(!el)return;
  el.scrollTo({left:0,behavior:'instant'});
  const observer=new ResizeObserver(sync);observer.observe(el);
  const viewport=new IntersectionObserver(entries=>{visible.current=entries.some(e=>e.isIntersecting);},{threshold:.15});
  if(region.current)viewport.observe(region.current);
  const frame=requestAnimationFrame(sync);
  return()=>{observer.disconnect();viewport.disconnect();cancelAnimationFrame(frame);};
 },[audience]);
 useEffect(()=>{
  if(paused)return;
  const timer=window.setInterval(()=>{
   if(!reducedMotion()&&visible.current&&!interaction.current&&!focused.current&&!document.hidden&&!document.querySelector('dialog[open]')&&!document.documentElement.classList.contains('acos-loading-active'))advance(1);
  },4500);
  return()=>window.clearInterval(timer);
 },[audience,paused]);
 return <div className="ap-insurance-carousel" ref={region} role="region" aria-label="Carrusel de seguros"
  onMouseEnter={()=>{interaction.current=true;}} onMouseLeave={()=>{interaction.current=false;}}
  onTouchStart={()=>{interaction.current=true;}} onTouchEnd={()=>{interaction.current=false;}} onTouchCancel={()=>{interaction.current=false;}}
  onFocusCapture={()=>{focused.current=true;}} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))focused.current=false;}}>
  <div ref={track} className="ap-exact-catalog ap-carousel-track" onScroll={sync} tabIndex={0} aria-label="Tarjetas de seguros, desplazamiento horizontal">
   {items.map(item=><InsuranceCard key={item.id} item={item} audience={audience} onOpen={onOpen}/>)}
  </div>
  <div className="ap-carousel-footer">
   <div className="ap-carousel-progress" aria-label="Posición del carrusel"><span className="ap-carousel-count">{String(position.index+1).padStart(2,'0')} / {String(position.max+1).padStart(2,'0')}</span><span className="ap-carousel-line" aria-hidden="true"><span style={{width:100*(position.index+1)/(position.max+1)+'%'}}/></span></div>
   <div className="ap-carousel-controls">
    <button type="button" onClick={()=>advance(-1)} aria-label="Seguro anterior"><ArrowLeft size={20}/></button>
    <button type="button" onClick={()=>setPaused(p=>!p)} aria-label={paused?'Reanudar carrusel':'Pausar carrusel'}>{paused?<Play size={16}/>:<Pause size={16}/>}</button>
    <button type="button" onClick={()=>advance(1)} aria-label="Siguiente seguro"><ArrowRight size={20}/></button>
   </div>
   <a className="ap-button ap-catalog-all" href="#/seguros">Ver todos los seguros <ArrowUpRight size={17}/></a>
  </div>
 </div>;
}

function FullInsuranceCatalog({onOpen}:{onOpen:(id:SolutionId)=>void}){
 return <div className="ap-catalog-page">
  <section id="catalogo" className="ap-catalog-hero" tabIndex={-1} aria-labelledby="ap-catalog-title">
   <div className="ap-container ap-catalog-hero-inner">
    <a className="ap-catalog-breadcrumb" href="#/inicio"><ArrowLeft size={15}/> Volver al inicio</a>
    <span className="ap-eyebrow">ACOS · PORTAFOLIO DE SEGUROS</span>
    <h1 id="ap-catalog-title">Nuestros seguros.<br/><span>Protección para cada etapa.</span></h1>
    <p>Conocé nuestras alternativas de protección para personas y empresas. Elegí el seguro que necesitás y descubrí cómo podemos asesorarte.</p>
    <div className="ap-catalog-jump"><button type="button" onClick={()=>document.getElementById('catalogo-personas')?.scrollIntoView({behavior:reducedMotion()?'instant':'smooth',block:'start'})}><UsersRound size={19}/> Personas <ArrowDown size={16}/></button><button type="button" onClick={()=>document.getElementById('catalogo-empresas')?.scrollIntoView({behavior:reducedMotion()?'instant':'smooth',block:'start'})}><BriefcaseBusiness size={19}/> Empresas <ArrowDown size={16}/></button></div>
   </div>
  </section>
  {(['personas','empresas'] as const).map(audience=>{
   const items=catalogSolutions.filter(item=>item.audiences.includes(audience));
   return <section className="ap-section ap-catalog-segment" id={'catalogo-'+audience} key={audience} aria-labelledby={'ap-catalog-'+audience+'-title'}>
    <div className="ap-container">
     <div className="ap-section-heading"><div><span className="ap-eyebrow">{audience==='personas'?'PROTECCIÓN PERSONAL Y FAMILIAR':'PROTECCIÓN PARA TU NEGOCIO'}</span><h2 id={'ap-catalog-'+audience+'-title'}>Seguros para <span>{audience}.</span></h2></div><p>{audience==='personas'?'Cuidá lo que más importa en tu vida.':'Protegé tu actividad, tus bienes y tu equipo.'}</p></div>
     <div className="ap-product-grid ap-exact-catalog ap-catalog-grid">{items.map(item=><InsuranceCard key={item.id} item={item} audience={audience} onOpen={onOpen}/>)}</div>
    </div>
   </section>;
  })}
  <div className="ap-container ap-catalog-disclaimer"><ShieldCheck size={19}/><p>Las coberturas, requisitos y disponibilidad se confirman según tu caso y las condiciones de cada aseguradora.</p></div>
 </div>;
}

/** Public content only: never reads operational stores, client records or authentication data. */
export default function PublicSite({ openWorkspace, catalogPage=false }: { openWorkspace: () => void; catalogPage?:boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('inicio');
  const [audience, setAudience] = useState<CatalogAudience>('personas');
  const [detail, setDetail] = useState<SolutionId | null>(null);
  const [consultation, setConsultation] = useState<SolutionId | null>(null);
  const [privacy, setPrivacy] = useState(false);
  const [copied, setCopied] = useState<'idle' | 'done' | 'error'>('idle');
  const detailSolution = publicSolutions.find(item => item.id === detail);
  const contactSolution = publicSolutions.find(item => item.id === consultation);
  const detailVisual = detail ? productVisuals[detail] : undefined;
  const message = 'Hola, ACOS. Me gustaría recibir asesoría sobre ' + (contactSolution?.name.toLowerCase() || 'seguros') + '. Quisiera conocer las alternativas disponibles, sus condiciones y los siguientes pasos.';
  const whatsapp = publicContact.whatsapp.replace(/\D/g, '');
  const hasChannel = Boolean(whatsapp || publicContact.email || publicContact.phone);
  const visibleSolutions = catalogSolutions.filter(item => item.audiences.includes(audience));

  useEffect(() => {
    const sections = root.current?.querySelectorAll<HTMLElement>('section[data-nav]') || [];
    let frame: number | null = null;
    const update = () => {
      setScrolled(window.scrollY > 35);
      let current = catalogPage ? 'soluciones' : 'inicio';
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
  }, [catalogPage]);

  useEffect(() => {
    const scrollToHash = () => {
      const isCatalog=/^#\/seguros(?:\/|$)/.test(window.location.hash);
      if(isCatalog!==catalogPage)return;
      if(catalogPage){window.scrollTo({top:0,behavior:'instant'});document.getElementById('catalogo')?.focus({preventScroll:true});setMobile(false);return;}
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
  }, [catalogPage]);

  useEffect(() => {
    if (reducedMotion() || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('ap-in-view'); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    root.current?.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [catalogPage]);

  useEffect(()=>{if(!catalogPage)return;const previous=document.title;document.title='Nuestros seguros | ACOS Seguros';return()=>{document.title=previous;};},[catalogPage]);

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
      const target = document.getElementById(catalogPage&&id==='soluciones'?'catalogo':id);
      if (catalogPage&&id==='soluciones') window.scrollTo({top:0,behavior:'instant'});
      else if (id === 'inicio') window.scrollTo({ top: 0, behavior: reducedMotion() ? 'instant' : 'smooth' });
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
            <BrandLogo variant="negative" compact />
          </a>
          <button className="ap-icon-button ap-menu-toggle" ref={menuButton} aria-label={mobile ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={mobile} aria-controls="ap-navigation" onClick={() => setMobile(!mobile)}>{mobile ? <X /> : <Menu />}</button>
          <nav id="ap-navigation" aria-label="Navegación principal" className={'ap-nav' + (mobile ? ' ap-nav-open' : '')}>
            {navigation.map(item => <a key={item.id} href={sectionHref(item.id)} aria-current={active === item.id ? 'location' : undefined} onClick={() => sectionClick(item.id)}>{item.label}</a>)}
            <a className="ap-academy-link" href={/^(www\.)?acosseguros\.com$/.test(window.location.hostname) ? 'https://academy.acosseguros.com' : '#/academy'} onClick={()=>setMobile(false)}>ACOS Academy</a>
            <button className="ap-button ap-nav-cta" onClick={() => consult()}>Solicitar asesoría <ArrowUpRight size={16} /></button>
            <button className="ap-mobile-enterprise" onClick={openWorkspace}><LockKeyhole size={15} /> Acceso empresarial</button>
          </nav>
        </div>
      </header>
      {mobile && <button className="ap-menu-scrim" aria-label="Cerrar menú de navegación" tabIndex={-1} onClick={() => setMobile(false)} />}
      <main id="ap-main" tabIndex={-1} inert={mobile}>
        {catalogPage?<FullInsuranceCatalog onOpen={setDetail}/>:<>
        <section id="inicio" data-nav="inicio" className="ap-hero" tabIndex={-1} aria-labelledby="ap-hero-title">
          <img className="ap-hero-photo" src="/images/familia-hero.webp" alt="Una familia compartiendo un momento juntos al aire libre." width="1400" height="933" fetchPriority="high" />
          <div className="ap-hero-shade" />
          <div className="ap-container ap-hero-content">
            <span className="ap-eyebrow ap-light-eyebrow"><span /> TUS PLANES MERECEN PROTECCIÓN</span>
            <h1 id="ap-hero-title">Aseguramos<br /><span>tu futuro.</span></h1>
            <p>Tu familia, tu salud, tu vehículo, tu hogar.<br />Seguros para cada parte de tu vida,<br className="ap-desktop-break" /> con ACOS a tu lado.</p>
            <div className="ap-actions">
              <a className="ap-button ap-button-gold" href={sectionHref('soluciones')} onClick={() => sectionClick('soluciones')}>Encontrá tu seguro <ArrowRight size={19} /></a>
              <button className="ap-hero-consult" onClick={() => consult()}>Hablemos <MessageCircle size={18} /></button>
            </div>
            <div className="ap-hero-assurance"><ShieldCheck size={20} /><span>Asesoría personal. Decisiones con confianza.</span></div>
          </div>
          <div className="ap-hero-caption"><span>PARA VIVIR EL PRESENTE.</span><strong>Y cuidar lo que viene.</strong></div>
        </section>

        <div className="ap-container ap-shortcut-wrap">
          <div className="ap-shortcuts" aria-label="Explorá las categorías de seguros">
            <div className="ap-shortcut-intro"><span>EMPECEMOS POR VOS</span><strong>¿Qué querés<br />proteger?</strong></div>
            {featuredSolutions.map(item => {
              const Icon = icons[item.id];
              return <button key={item.id} onClick={() => setDetail(item.id)} aria-label={'Conocer ' + item.name.toLowerCase()}><Icon size={29} strokeWidth={1.5} /><span>{item.shortName}</span><ArrowUpRight size={14} /></button>;
            })}
          </div>
        </div>

        <section className="ap-section ap-products" id="soluciones" data-nav="soluciones" tabIndex={-1} aria-labelledby="ap-products-title">
          <div className="ap-container">
            <div className="ap-section-heading">
              <div><span className="ap-eyebrow">NUESTROS SEGUROS</span><h2 id="ap-products-title">Para tu vida de hoy.<br /><span>Y tus planes de mañana.</span></h2></div>
              <div className="ap-products-intro"><p>Encontrá el seguro que necesitás, para vos o para tu empresa.</p>
                <div className="ap-filters" role="group" aria-label="Filtrar seguros">
                  {([['personas', 'Personas'], ['empresas', 'Empresas']] as const).map(([id, label]) => <button key={id} aria-pressed={audience === id} onClick={() => setAudience(id)}>{label}</button>)}
                </div>
              </div>
            </div>
            <InsuranceCarousel key={audience} items={visibleSolutions} audience={audience} onOpen={setDetail}/>
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
            <button className="ap-button ap-button-gold" onClick={() => consult('empresas')}>Asesoría para mi empresa <ArrowUpRight size={18} /></button>
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
        </>}
      </main>

      <footer className="ap-footer" inert={mobile}>
        <div className="ap-container">
          <div className="ap-footer-main">
            <div className="ap-footer-brand"><a href="#/inicio" aria-label="ACOS, volver al inicio" onClick={() => sectionClick('inicio')}><BrandLogo variant="primary" /></a><p>Correduría de seguros.<br />Aseguramos tu futuro.</p><span><MapPin size={14} /> Nicaragua</span></div>
            <div><h2>Conocé ACOS</h2><a href={sectionHref('nosotros')} onClick={() => sectionClick('nosotros')}>Nosotros</a><a href={sectionHref('proceso')} onClick={() => sectionClick('proceso')}>Cómo trabajamos</a><a href={sectionHref('contacto')} onClick={() => sectionClick('contacto')}>Contacto</a><a href={/^(www\.)?acosseguros\.com$/.test(window.location.hostname) ? 'https://academy.acosseguros.com' : '#/academy'}>ACOS Academy</a><button onClick={() => setPrivacy(true)}>Aviso de privacidad</button></div>
            <div><h2>Nuestros seguros</h2><a href="#/seguros">Ver todos los seguros</a>{catalogSolutions.slice(0, 5).map(item => <button key={item.id} onClick={() => setDetail(item.id)}>{item.name}</button>)}</div>
            <div className="ap-footer-help"><h2>Estamos para orientarte</h2><p>Elegí con información clara.<br />Empezá por una consulta.</p><button className="ap-text-link" onClick={() => consult()}>Solicitar asesoría <ArrowUpRight size={16} /></button><button className="ap-footer-access" onClick={openWorkspace}><LockKeyhole size={14} /> Acceso empresarial</button></div>
          </div>
          <div className="ap-footer-bottom"><span>© {new Date().getFullYear()} ACOS. Todos los derechos reservados.</span><span>Diseño y desarrollo <strong>XARCON</strong></span><a href={catalogPage?"#/seguros":"#/inicio"} onClick={() => sectionClick(catalogPage?"soluciones":"inicio")}>Volver arriba <ArrowDown size={14} /></a></div>
        </div>
      </footer>

      {detailSolution && <Modal wide title={detailSolution.name} description={detailSolution.headline} onClose={() => setDetail(null)}>
        <div className="ap-detail-layout">{detailVisual ? <div className="ap-product-detail-photo" style={productStyle(detailVisual)}><ProductPhoto key={detailSolution.id} visual={detailVisual} eager/></div> : <img src={detailSolution.image} alt="" width="1000" height="667" />}<div><p>{detailSolution.description}</p><h3>¿Qué revisamos con vos?</h3><ul>{detailSolution.topics.map(topic => <li key={topic}><Check size={17} />{topic}</li>)}</ul><button className="ap-button" onClick={() => consult(detailSolution.id)}>Solicitar asesoría <ArrowUpRight size={17} /></button></div></div><p className="ap-dialog-note">Información orientativa. Los alcances, requisitos y disponibilidad deben confirmarse con la aseguradora antes de contratar.</p>
      </Modal>}
      {consultation && <Modal title={hasChannel ? 'Hablemos de tu seguro.' : 'Prepará tu consulta.'} description={hasChannel ? 'Elegí un canal de atención para continuar tu consulta con ACOS.' : 'Los canales de atención de esta web estarán disponibles próximamente. Por ahora, podés preparar y copiar tu consulta.'} onClose={() => setConsultation(null)}>
        <div className="ap-consultation"><label htmlFor="ap-interest">¿Qué te gustaría proteger?</label><select id="ap-interest" value={consultation} onChange={event => { setConsultation(event.target.value as SolutionId); setCopied('idle'); }}><option value="asesoria">Asesoría general</option><option value="empresas">Asesoría empresarial</option>{catalogSolutions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><label htmlFor="ap-message">Tu mensaje inicial</label><textarea id="ap-message" value={message} readOnly rows={5} /><div className="ap-consultation-actions">{whatsapp && <a className="ap-button" href={'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(message)} target="_blank" rel="noopener noreferrer">Continuar en WhatsApp <ArrowUpRight size={16} /></a>}{publicContact.email && <a className="ap-button" href={'mailto:' + publicContact.email + '?subject=' + encodeURIComponent('Consulta de seguros — ACOS') + '&body=' + encodeURIComponent(message)}>Escribir por correo <Mail size={16} /></a>}{publicContact.phone && <a className="ap-text-link" href={'tel:' + publicContact.phone.replace(/[^+\d]/g, '')}>Llamar a ACOS <Phone size={16} /></a>}<button className={hasChannel ? 'ap-text-link' : 'ap-button'} onClick={copyMessage}>{copied === 'done' ? 'Mensaje copiado' : 'Copiar consulta'}{copied === 'done' ? <Check size={16} /> : <Copy size={16} />}</button></div><p className="ap-copy-status" role="status">{copied === 'done' ? 'Copiado. Podés compartirlo por un canal que ya conozcás de ACOS.' : copied === 'error' ? 'No pudimos copiar automáticamente. Seleccioná el mensaje de arriba y copialo manualmente.' : ''}</p><p className="ap-dialog-note"><LockKeyhole size={14} />No se envía ni se guarda una solicitud desde esta ventana.</p></div>
      </Modal>}
      {privacy && <Modal title="Aviso de privacidad" description="Información sobre esta web pública y sus accesos." onClose={() => setPrivacy(false)}>
        <div className="ap-privacy"><h3>Consultas desde esta página</h3><p>El asistente de consulta prepara un texto en tu navegador. No solicita datos personales, no almacena el mensaje en una base de datos y no registra una solicitud. Al copiar, el texto pasa al portapapeles de tu dispositivo.</p><h3>Canales externos</h3><p>Si se habilitan enlaces de correo, teléfono o WhatsApp, la comunicación continúa en ese servicio y está sujeta a sus condiciones de privacidad.</p><h3>Acceso empresarial</h3><p>El entorno privado tiene autenticación y permisos propios. Esta página no permite consultar expedientes ni información de clientes.</p><h3>Servicios técnicos</h3><p>La entrega del sitio puede implicar el procesamiento de datos técnicos, como la dirección IP y el navegador, por parte de los proveedores de alojamiento y de fuentes tipográficas.</p><h3>Información de seguros</h3><p>El contenido es orientativo. No constituye una cotización, confirmación de cobertura ni contrato de seguro. Las condiciones deben verificarse antes de contratar.</p></div>
      </Modal>}
    </div>
  );
}
