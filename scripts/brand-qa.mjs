import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(resolve(process.env.ACOS_QA_MODULES, 'playwright'));
const axePath = require.resolve(resolve(process.env.ACOS_QA_MODULES, 'axe-core'));
const fixture = resolve('tests/brand/rendered'), assets = resolve('public'), dist = resolve('dist'), output = resolve('brand-qa');
await mkdir(output, { recursive:true });
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2'};
const server = createServer(async (req,res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const root = pathname.startsWith('/built/') ? dist : pathname.startsWith('/fonts/') || pathname.startsWith('/brand/') || /^\/[^/]+\.(png|webp|svg)$/.test(pathname) ? assets : fixture;
  const relative = pathname.startsWith('/built/') ? pathname.slice(6) : pathname;
  const file = resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
  if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, {'Content-Type':mime[extname(file)] || 'application/octet-stream'}).end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(4176, '127.0.0.1', done));
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{width:1440,height:1000}, reducedMotion:'reduce' });
const errors = [], results = [], contrast = [];
page.on('pageerror', e => errors.push(e.message));
// The private fixture must never access a real backend.
await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
const base = 'http://127.0.0.1:4176/';
const ready = async () => {
  await page.locator('.live-shell').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all(Array.from(document.querySelectorAll('img')).map(img => img.decode())));
};
const check = async (name, fn) => { await fn(); results.push({name,status:'PASS'}); console.log('PASS',name); };
const audit = async name => {
  await page.addScriptTag({path:axePath});
  const findings = await page.evaluate(async () => (await window.axe.run({runOnly:{type:'rule',values:['color-contrast']}})).violations);
  contrast.push({name,violations:findings.map(v=>({id:v.id,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))}))});
};
try {
  for (const profile of ['admin','agent']) {
    await page.goto(base + '?profile=' + profile + '#/mi-panel');
    await ready();
    await check(profile + ': role-specific menu and official brand render', async () => {
      assert.equal(await page.locator('.acos-sidebar-brand img').getAttribute('src'), '/brand/acos-horizontal-negative.svg');
      assert.equal(await page.locator('.sidebar').evaluate(el=>getComputedStyle(el).backgroundColor), 'rgb(0, 25, 41)');
      assert.match(await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily), /ACOS Poppins/);
      assert.equal(await page.getByRole('button',{name:'Solicitudes de personal',exact:true}).count(), profile==='admin'?1:0);
    });
    for (const width of [1440,1024,768,390,320]) {
      await page.setViewportSize({width,height:width<600?844:1000});
      await check(profile + ': responsive layout at ' + width, async () => {
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
        await page.screenshot({path:resolve(output,profile+'-'+width+'.png'),fullPage:true});
        await audit(profile+'-'+width);
      });
    }
    await page.setViewportSize({width:1440,height:1000});
    await check(profile + ': navigation and opportunity form remain usable', async () => {
      await page.locator('.sidebar-nav').getByRole('button',{name:/^Oportunidades/}).click();
      await page.getByRole('heading',{name:'Oportunidades',level:1,exact:true}).waitFor();
      assert.equal(await page.locator('tbody tr:visible').count(),1);
      await page.getByRole('button',{name:'Nueva oportunidad'}).click();
      await page.getByRole('dialog').waitFor();
      await page.screenshot({path:resolve(output,profile+'-form.png')});
      await audit(profile+'-form');
      await page.getByRole('button',{name:'Cerrar',exact:true}).click();
      assert.equal(await page.getByRole('dialog').count(),0);
    });
    await page.setViewportSize({width:390,height:844});
    await check(profile + ': bottom navigation, sheets and permissions', async () => {
      const nav=page.getByRole('navigation',{name:'Navegación móvil'});
      assert.equal(await nav.locator('button').count(),5);
      assert.match(await page.locator('.acos-mobile-hero').evaluate(el=>getComputedStyle(el).backgroundImage),/radial-gradient/);
      await nav.getByRole('button',{name:'Inicio',exact:true}).click();
      await page.getByRole('heading',{name:/Hola,/}).waitFor();
      await nav.getByRole('button',{name:'Más',exact:true}).click();
      const sheet=page.getByRole('dialog',{name:'Más opciones'});
      await sheet.waitFor();
      assert.equal(await sheet.getByRole('button',{name:'Solicitudes de personal',exact:true}).count(),profile==='admin'?1:0);
      await page.screenshot({path:resolve(output,profile+'-mobile-menu.png'),animations:'disabled'});
      await audit(profile+'-mobile-menu');
      await sheet.getByRole('button',{name:'Cerrar',exact:true}).click();
      await sheet.waitFor({state:'hidden'});
      await nav.getByRole('button',{name:/Actividad/}).click();
      await page.getByRole('dialog',{name:'Actividad'}).waitFor();
      await page.getByRole('dialog',{name:'Actividad'}).getByRole('button',{name:'Cerrar',exact:true}).click();
      await page.getByRole('dialog').waitFor({state:'hidden'});
    });
    await check(profile + ': mobile client wizard validates and preserves draft', async()=>{
      const nav=page.getByRole('navigation',{name:'Navegación móvil'});
      await page.locator('.acos-mobile-quick').getByRole('button',{name:'Registrar cliente'}).click();
      const form=page.locator('#acos-client-form');
      await form.waitFor();
      await form.getByRole('button',{name:'Continuar'}).click();
      assert.equal(await form.locator('.acos-form-progress strong').innerText(),'Paso 1 de 2');
      await form.getByLabel('Nombre completo').fill('Cliente de prueba temporal');
      await form.getByRole('button',{name:'Continuar'}).click();
      await form.getByLabel(/Correo electrónico/).fill('prueba@example.invalid');
      await page.screenshot({path:resolve(output,profile+'-wizard.png'),animations:'disabled'});
      await nav.getByRole('button',{name:'Inicio',exact:true}).click();
      await nav.getByRole('button',{name:'Clientes',exact:true}).click();
      await form.waitFor();
      if(await form.getByLabel('Nombre completo').isVisible())assert.equal(await form.getByLabel('Nombre completo').inputValue(),'Cliente de prueba temporal');
      else {await form.getByRole('button',{name:'Atrás'}).click();assert.equal(await form.getByLabel('Nombre completo').inputValue(),'Cliente de prueba temporal');}
      await form.getByRole('button',{name:'Continuar'}).click();
      assert.equal(await form.getByLabel(/Correo electrónico/).inputValue(),'prueba@example.invalid');
      await form.getByRole('button',{name:'Cerrar formulario'}).click();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Client page overflow');
    });
    await check(profile + ': emission opens from activity and accessible alternative works', async()=>{
      await page.getByRole('navigation',{name:'Navegación móvil'}).getByRole('button',{name:/Actividad/}).click();
      const sheet=page.getByRole('dialog',{name:'Actividad'});
      await sheet.getByRole('button',{name:/Cliente de ensayo/}).click();
      const detail=page.locator('#ed-request-detail');
      await detail.waitFor();
      await detail.getByRole('button',{name:'Enviar a emisión con botón'}).click();
      await detail.getByRole('button',{name:'Cancelar',exact:true}).click();
      assert.equal(await detail.getByRole('slider',{name:'Deslizar para Enviar a emisión'}).count(),1);
      await page.screenshot({path:resolve(output,profile+'-issuance.png'),animations:'disabled'});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Issuance overflow');
    });
  }
  for(const profile of ['operations','finance','service','client']){
    await page.setViewportSize({width:360,height:800});await page.goto(base+'?profile='+profile+'#/mi-panel');await ready();
    await check(profile+': mobile permission-specific navigation',async()=>{const nav=page.getByRole('navigation',{name:'Navegación móvil'});await nav.getByRole('button',{name:'Más',exact:true}).click();const sheet=page.getByRole('dialog',{name:'Más opciones'});await sheet.waitFor();assert.equal(await sheet.getByRole('button',{name:'Solicitudes de personal',exact:true}).count(),0);if(profile==='client'||profile==='finance')assert.equal(await sheet.getByRole('button',{name:'Emisión de pólizas',exact:true}).count(),0);await sheet.getByRole('button',{name:'Cerrar',exact:true}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:resolve(output,profile+'-360.png'),animations:'disabled'});});
  }
  await check('No runtime errors in the offline private visual fixture', async()=>assert.deepEqual(errors,[]));
  await writeFile(resolve(output,'contrast.json'),JSON.stringify(contrast,null,2));
  await check('No text contrast violations in the reviewed private surfaces',async()=>assert.equal(contrast.flatMap(x=>x.violations).length,0,JSON.stringify(contrast.filter(x=>x.violations.length))));
} catch(e) {
  results.push({status:'FAIL',message:e.message});console.error(e);
  await page.screenshot({path:resolve(output,'failure.png'),fullPage:true});process.exitCode=1;
} finally {
  await writeFile(resolve(output,'results.json'),JSON.stringify({scope:'Offline UI fixture. No authenticated Firebase data or permission writes.',results,errors,contrast},null,2));
  await browser.close();await new Promise(done=>server.close(done));
}
