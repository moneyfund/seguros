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
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2'};
const server = createServer(async (req,res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const root = pathname.startsWith('/built/') ? dist : pathname.startsWith('/fonts/') || pathname.startsWith('/brand/') || /^\/[^/]+\.(png|webp)$/.test(pathname) ? assets : fixture;
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
      assert.equal(await page.locator('.acos-sidebar-brand img').getAttribute('src'), '/brand/acos-horizontal-negative.png');
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
      await page.getByRole('heading',{name:'Oportunidades',exact:true}).waitFor();
      assert.equal(await page.locator('tbody tr').count(),1);
      await page.getByRole('button',{name:'Nueva oportunidad'}).click();
      await page.getByRole('dialog').waitFor();
      await page.screenshot({path:resolve(output,profile+'-form.png')});
      await audit(profile+'-form');
      await page.getByRole('button',{name:'Cerrar',exact:true}).click();
      assert.equal(await page.getByRole('dialog').count(),0);
    });
    await page.setViewportSize({width:390,height:844});
    await check(profile + ': mobile menu opens and closes', async () => {
      await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
      await page.locator('.sidebar-open').waitFor();
      await page.screenshot({path:resolve(output,profile+'-mobile-menu.png')});
      await page.locator('.sidebar .mobile-close').click();
      assert.equal(await page.locator('.sidebar-open').count(),0);
    });
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
