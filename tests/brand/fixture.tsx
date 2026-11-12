// Offline visual fixture only. Not imported by src/main.tsx or any production route.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LivePanel } from '../../src/ConnectedWorkspace';
import type { User } from 'firebase/auth';
import '../../src/brand-tokens.css';
import '../../src/styles.css';
import '../../src/live.css';
import '../../src/marketing.css';
import '../../src/refine.css';
import '../../src/acos.css';
import '../../src/staff.css';
import '../../src/access-routes.css';
import '../../src/admin-parity.css';
import '../../src/insurance-operations.css';
import '../../src/pilot.css';
import '../../src/brand-identity.css';

const admin = new URLSearchParams(location.search).get('profile') !== 'agent';
const roles = [admin ? 'direccion' : 'ventas'] as const;
const user = { uid: 'visual-fixture', email: 'revision@example.invalid', displayName: admin ? 'Dirección · prueba visual' : 'Agente · prueba visual' } as User;
function Fixture() {
  const [route, setRoute] = useState(() => location.hash.replace(/^#\/?/, '') || 'mi-panel');
  useEffect(() => {
    const update = () => setRoute(location.hash.replace(/^#\/?/, '') || 'mi-panel');
    addEventListener('hashchange', update);
    return () => removeEventListener('hashchange', update);
  }, []);
  return <>
    <div style={{background:'#F3EEEA',color:'#001929',padding:'8px 20px',fontSize:11,textAlign:'center'}}>PRUEBA VISUAL AISLADA · Datos ficticios · Sin conexión ni escrituras a Firebase</div>
    <LivePanel user={user} role={roles[0]} admin={admin} grantedRoles={[...roles]} grantedSections={null} onPublic={() => {}} route={route} />
  </>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
