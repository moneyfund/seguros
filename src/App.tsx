import { useEffect, useState } from 'react';
import ConnectedWorkspace from './ConnectedWorkspace';
import PublicSite from './PublicSite';

type Surface = 'public' | 'workspace';

const workspaceHash = /^#\/(?:acceso|workspace)(?:\/.*)?$/i;

/**
 * Entry policy:
 * - The public commercial website is the default at '/'.
 * - The protected business workspace lives at '#/acceso' or '#/workspace'.
 * - Legacy '#/demo' is no longer a public or available surface.
 * - Firebase Authentication is required before operational data is rendered.
 */
function getSurface(): Surface {
  return workspaceHash.test(window.location.hash) ? 'workspace' : 'public';
}

function normalizeLegacyUrl() {
  const hash = window.location.hash.toLowerCase();
  if (hash.startsWith('#/demo') || hash.startsWith('#/dashboard') || hash.startsWith('#/admin')) {
    window.history.replaceState({}, '', window.location.pathname + window.location.search + '#/acceso');
  }
}

export default function App() {
  const [surface, setSurface] = useState<Surface>(() => {
    normalizeLegacyUrl();
    return getSurface();
  });

  useEffect(() => {
    const updateFromBrowser = () => {
      normalizeLegacyUrl();
      setSurface(getSurface());
    };

    window.addEventListener('hashchange', updateFromBrowser);
    window.addEventListener('popstate', updateFromBrowser);
    return () => {
      window.removeEventListener('hashchange', updateFromBrowser);
      window.removeEventListener('popstate', updateFromBrowser);
    };
  }, []);

  function navigate(next: Surface) {
    const hash = next === 'public' ? '#/inicio' : '#/acceso';
    window.history.pushState({}, '', window.location.pathname + window.location.search + hash);
    setSurface(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  if (surface === 'public') {
    return <PublicSite openWorkspace={() => navigate('workspace')} />;
  }

  return <ConnectedWorkspace onPublic={() => navigate('public')} />;
}
