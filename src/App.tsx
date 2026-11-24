import { useEffect, useLayoutEffect, useState, lazy } from 'react';
import { PublicEntrance, hidePublicLoader } from './PublicEntrance';
import ConnectedWorkspace from './ConnectedWorkspace';
import PublicSite from './PublicSite';
const Academy = lazy(() => import('./Academy'));

const domain = 'acosseguros.com';
const official = (host: string) => host === domain || host === 'www.' + domain;
const privateHash = /^#\/(?:acceso(?:s)?|workspace|registro|mi-panel|direccion|modulo|laboratorio|admin|portal|demo|dashboard|ventas|operaciones|finanzas|servicio|supervision)(?:\/|$)/i;
const publicHash = /^#(?:\/inicio(?:\/.*)?|\/web(?:\/.*)?|\/seguros(?:\/.*)?|inicio|servicios|filosofia|proceso|contacto)$/;
const departmentPath = /^(ventas|operaciones|finanzas|servicio|supervision)(?:\/|$)/;

function resolve() {
  const { hostname, pathname, hash, search } = window.location;
  const path = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const legacy = hash.startsWith('#/') ? hash.slice(2).replace(/\/$/, '').toLowerCase() : '';
  const route = legacy || path;
  const admin = hostname === 'admin.' + domain;
  const portal = hostname === 'portal.' + domain;
  const clients = hostname === 'clientes.' + domain;
  const academy = hostname === 'academy.' + domain;
  const to = (host: string, suffix = '/') => 'https://' + host + suffix + search;
  if (official(hostname)) {
    if (route === 'academy') return {surface:'redirect', target:to('academy.' + domain)} as const;
    if (route === 'clientes') return {surface:'redirect', target:to('clientes.' + domain)} as const;
    if (route === 'admin' || route.startsWith('admin/') || route === 'direccion' || route.startsWith('direccion/')) {
      const suffix = route.startsWith('direccion/') ? '/' + route : '/';
      return {surface:'redirect', target:to('admin.' + domain, suffix)} as const;
    }
    if (privateHash.test(hash) || /^(acceso|accesos|workspace|registro|mi-panel|modulo|laboratorio|portal|demo|dashboard)(?:\/|$)/.test(path) || departmentPath.test(path)) {
      const clean = /^(portal|demo|dashboard|workspace)(?:\/|$)/.test(route) ? 'acceso' : route;
      return {surface:'redirect', target:to('portal.' + domain, '/' + clean)} as const;
    }
  }
  if (academy && (publicHash.test(hash) || path === 'inicio')) return {surface:'redirect', target:to(domain)} as const;
  if (portal && (route === 'direccion' || route.startsWith('direccion/'))) return {surface:'redirect', target:to('admin.' + domain, route === 'direccion' ? '/' : '/' + route)} as const;
  if (clients) return {surface:'clients'} as const;
  if (admin || portal) return {surface:'workspace'} as const;
  if (academy || route === 'academy') return {surface:'academy'} as const;
  if (path === 'clientes') return {surface:'clients'} as const;
  if ((path && path !== 'inicio') || (hash && hash !== '#' && !publicHash.test(hash))) return {surface:'workspace'} as const;
  return {surface:'public'} as const;
}

export default function App() {
  const [, refresh] = useState(0);
  useEffect(() => {
    const update = () => refresh(n => n + 1);
    window.addEventListener('hashchange', update);
    window.addEventListener('popstate', update);
    return () => {
      window.removeEventListener('hashchange', update);
      window.removeEventListener('popstate', update);
    };
  }, []);
  const entry = resolve();
  const target = entry.surface === 'redirect' ? entry.target : undefined;
  useLayoutEffect(() => {
    if (entry.surface !== 'public' && entry.surface !== 'academy') hidePublicLoader();
    if (target) window.location.replace(target);
  }, [entry.surface, target]);

  function navigate(next: 'public' | 'workspace') {
    const host = window.location.hostname;
    if (official(host) || host.endsWith('.' + domain)) {
      window.location.assign(next === 'public' ? 'https://' + domain : 'https://portal.' + domain);
      return;
    }
    const hash = next === 'public' ? '#/inicio' : '#/acceso';
    window.history.pushState({}, '', '/' + window.location.search + hash);
    refresh(n => n + 1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  if (entry.surface === 'redirect') return null;
  if (entry.surface === 'clients') return <main className="live-auth-screen"><div className="live-auth-card"><div className="live-auth-title"><span>ACOS SEGUROS</span><h1>Portal de clientes</h1><p>Estamos preparando tu espacio seguro. El acceso a pólizas y expedientes se habilitará cuando la plataforma esté validada.</p></div><button className="btn btn-dark full" onClick={() => navigate('public')}>Volver a ACOS</button></div></main>;
  if (entry.surface === 'academy') return <PublicEntrance key="academy" academy><Academy/></PublicEntrance>;
  if (entry.surface === 'public') return <PublicEntrance key="public"><PublicSite catalogPage={/^#\/seguros(?:\/|$)/.test(window.location.hash)} openWorkspace={() => navigate('workspace')}/></PublicEntrance>;
  return <ConnectedWorkspace onPublic={() => navigate('public')}/>;
}
