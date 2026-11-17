import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.ACOS_QA_MODULES ? resolve(process.env.ACOS_QA_MODULES, 'playwright') : 'playwright');
const axePath = require.resolve(process.env.ACOS_QA_MODULES ? resolve(process.env.ACOS_QA_MODULES, 'axe-core') : 'axe-core');
const dist = resolve('dist');
const output = resolve('public-site-qa');
await mkdir(output, { recursive: true });
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const file = resolve(dist, '.' + new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '/index.html'));
    if (!file.startsWith(dist + sep)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(4173, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const results = [], runtimeErrors = [], accessibility = [];
page.on('pageerror', error => runtimeErrors.push(error.message));
const base = 'http://127.0.0.1:4173/';
const test = async (name, run) => { await run(); results.push({ name, status: 'PASS' }); console.log('PASS', name); };
const load = async (hash = '#/inicio') => {
  await page.goto(base + hash);
  await page.locator('.acos-public').waitFor();
  await page.locator('#acos-public-loader').waitFor({state:'hidden'});
  await page.evaluate(() => { document.querySelectorAll('img').forEach(img => { img.loading = 'eager'; }); });
  await page.waitForFunction(() => Array.from(document.querySelectorAll('.acos-public img')).every(img => img.complete && img.naturalWidth > 0));
  await page.evaluate(() => Promise.all(Array.from(document.querySelectorAll('.acos-public img')).map(img => img.decode())));
  await page.evaluate(() => document.fonts.ready);
};
try {
  await page.goto(base+'#/academy');await page.locator('.aa-site').waitFor();await page.locator('#acos-public-loader').waitFor({state:'hidden'});
  await test('Academy public route and interactive quiz',async()=>{
    assert.equal(await page.locator('.aa-track').count(),3);assert.ok(await page.locator('.aa-lesson').count()>=6);
    const cards=await page.locator('.aa-track,.aa-lesson,.aa-exam-card').evaluateAll(nodes=>nodes.map(el=>({radius:getComputedStyle(el).borderRadius,photo:getComputedStyle(el,'::before').backgroundImage})));
    for(const card of cards){assert.equal(card.radius,'0px');assert.match(card.photo,/https:\/\/images\.pexels\.com\/photos\/\d+\//);}
    const initialPhotos=await page.locator('.aa-track,.aa-exam-card,.aa-lesson').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el,'::before').backgroundImage));
    assert.ok(new Set(initialPhotos).size>=12,'Expected distinct photos for initial Academy cards');
    const cue=page.getByRole('button',{name:'Explorar rutas de aprendizaje',exact:true});
    assert.equal(await cue.locator('svg').count(),2);await cue.click();
    await page.waitForFunction(()=>{const top=document.querySelector('#aa-rutas').getBoundingClientRect().top;return top>=0&&top<160;});
    await page.locator('.aa-exams button').first().click();
    const picks=[1,2,0,1,2];for(let i=0;i<picks.length;i++){await page.locator('.aa-options button').nth(picks[i]).click();await page.locator('.aa-quiz .aa-button').click();}
    assert.match(await page.locator('.aa-score strong').innerText(),/5\/5/);
    await page.reload();await page.locator('.aa-exams').waitFor();assert.match(await page.locator('.aa-exams button').first().innerText(),/5\/5/);
    await page.setViewportSize({width:360,height:800});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:resolve(output,'academy-mobile.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:resolve(output,'academy-desktop.png'),fullPage:true});
    await page.evaluate(()=>localStorage.removeItem('acos-academy-progress-v1'));
  });
  await test('Public branded loading transition, route scope and reduced-motion exit',async()=>{
    const loadingContext=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'no-preference'});
    try{const p=await loadingContext.newPage();await p.route('**/assets/*.js',async route=>{await new Promise(r=>setTimeout(r,650));await route.continue();});
      await p.goto(base+'#/inicio',{waitUntil:'commit'});const loader=p.locator('#acos-public-loader');await loader.waitFor({state:'visible'});
      assert.match(await loader.innerText(),/Aseguramos tu futuro/);assert.match(await loader.locator('img').getAttribute('src'),/acos-horizontal-negative\.svg/);
      await p.screenshot({path:resolve(output,'acos-loading.png')});await loader.waitFor({state:'hidden'});
      await p.locator('.ap-academy-link').first().click();await loader.waitFor({state:'visible'});assert.match(await loader.innerText(),/ACOS ACADEMY/);await loader.waitFor({state:'hidden'});
      await p.getByRole('link',{name:'Rutas',exact:true}).click();assert.equal(await loader.isVisible(),false);
      await p.goto(base+'#/acceso',{waitUntil:'commit'});await p.locator('#root').waitFor({state:'attached'});assert.equal(await loader.isVisible(),false);
    }finally{await loadingContext.close();}
  });
  await test('Academy cards reveal when scrolled into view',async()=>{
    const motion=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'no-preference'});
    try {const motionPage=await motion.newPage();await motionPage.goto(base+'#/academy');await motionPage.locator('.aa-site').waitFor();
      const last=motionPage.locator('.aa-lesson').last();
      await motionPage.waitForFunction(()=>document.querySelector('.aa-lessons .aa-lesson:last-child')?.classList.contains('aa-awaiting'));
      await last.scrollIntoViewIfNeeded();
      await motionPage.waitForFunction(()=>document.querySelector('.aa-lessons .aa-lesson:last-child')?.classList.contains('aa-arrived'));
      await motionPage.waitForFunction(()=>getComputedStyle(document.querySelector('.aa-lessons .aa-lesson:last-child')).opacity==='1');
    }finally{await motion.close();}
  });
  await load();
  await test('Production root renders the commercial website without login', async () => {
    await page.goto(base);
    await page.locator('.acos-public').waitFor();
    assert.equal(await page.locator('input[type=password]').count(), 0);
    await load();
  });
  await test('Photographs, six products and the commercial heading render', async () => {
    assert.match(await page.locator('h1').innerText(), /Aseguramos/);
    assert.equal(await page.locator('.ap-product').count(), 6);
    assert.equal(await page.locator('.ap-shortcuts>button').count(), 6);
    assert.equal(await page.locator('a[href^="tel:"],a[href^="mailto:"],a[href*="wa.me"]').count(), 0);
  });
  await test('Official artwork, local fonts and navy brand identity are present', async () => {
    assert.match(await page.locator('.ap-brand img').getAttribute('src'), /acos-horizontal-negative\.svg$/);
    assert.match(await page.locator('.ap-footer-brand img').getAttribute('src'), /acos-primary\.svg$/);
    assert.match(await page.locator('link[rel=icon]').getAttribute('href'), /acos-symbol\.svg$/);
    assert.equal(await page.locator('.ap-header').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(0, 25, 41)');
    assert.equal(await page.locator('.ap-brand .acos-mark').evaluate(el=>getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    assert.ok(await page.locator('.ap-brand img').evaluate(el=>el.complete && el.naturalWidth>0));
    assert.match(await page.locator('h1').evaluate(el => getComputedStyle(el).fontFamily), /ACOS Lunaquete/);
    assert.equal(await page.evaluate(() => document.fonts.check('16px "ACOS Lunaquete"')), true);
  });
  for (const width of [1440, 1024, 768, 390, 320]) {
    await test('Responsive layout and accessibility at ' + width + ' px', async () => {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: resolve(output, 'home-' + width + '.png'), fullPage: true });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Horizontal page overflow');
      const clipped = await page.locator('.ap-button,.ap-shortcuts>button,.ap-product button,.ap-filters button').evaluateAll(elements => elements.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
      }).map(el => el.textContent));
      assert.deepEqual(clipped, [], 'Controls outside viewport');
      await page.addScriptTag({ path: axePath });
      const findings = await page.evaluate(async () => (await window.axe.run('.acos-public', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations);
      accessibility.push({ width, violations: findings.map(item => ({ id: item.id, impact: item.impact, description: item.description, nodes: item.nodes.map(node => ({ html: node.html, summary: node.failureSummary })) })) });
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await test('Product filters retain their active state and matching categories', async () => {
    await page.getByRole('button', { name: 'Para tu empresa', exact: true }).click();
    assert.equal(await page.locator('.ap-product').count(), 2);
    assert.equal(await page.locator('.ap-product-empresas').count(), 1);
    await page.getByRole('button', { name: 'Para vos', exact: true }).click();
    assert.equal(await page.locator('.ap-product').count(), 5);
    assert.equal(await page.locator('.ap-product-empresas').count(), 0);
    await page.getByRole('button', { name: 'Todos', exact: true }).click();
    assert.equal(await page.locator('.ap-product').count(), 6);
  });
  await test('Every product opens its details and a consultation for that product', async () => {
    for (const id of ['vida', 'vehiculos', 'salud', 'hogar', 'empresas', 'asesoria']) {
      await page.locator('.ap-product-' + id + ' button').click();
      await page.locator('dialog[open]').waitFor();
      assert.equal(await page.locator('.ap-detail-layout li').count(), 3);
      if (id === 'vida') await page.screenshot({ path: resolve(output, 'product-details.png') });
      await page.locator('dialog').getByRole('button', { name: 'Solicitar asesoría' }).click();
      await page.locator('#ap-interest').waitFor();
      assert.equal(await page.locator('#ap-interest').inputValue(), id);
      assert.match(await page.locator('.ap-dialog-note').innerText(), /No se envía ni se guarda/);
      assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('dialog').count(), 0);
      assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
    }
  });
  await test('Clipboard success, topic change and failure all produce accurate feedback', async () => {
    await page.locator('.ap-nav-cta').click();
    await page.getByRole('button', { name: 'Copiar consulta' }).click();
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /Hola, ACOS/);
    assert.match(await page.locator('[role=status]').innerText(), /Copiado/);
    await page.locator('#ap-interest').selectOption('hogar');
    assert.match(await page.locator('#ap-message').inputValue(), /hogar/);
    assert.equal(await page.locator('[role=status]').innerText(), '');
    await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied'); }; });
    await page.getByRole('button', { name: 'Copiar consulta' }).click();
    assert.match(await page.locator('[role=status]').innerText(), /manualmente/);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('ap-nav-cta')), true);
  });
  await test('FAQ disclosure and privacy dialog work by keyboard', async () => {
    await page.locator('.ap-questions summary').first().focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.ap-questions details').first().getAttribute('open'), '');
    await page.getByRole('button', { name: 'Aviso de privacidad', exact: true }).click();
    assert.match(await page.locator('dialog').innerText(), /Aviso de privacidad/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').count(), 0);
  });
  await test('Mobile menu isolates the page, closes with Escape and navigates', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
    assert.equal(await page.locator('.ap-menu-toggle').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('main').getAttribute('inert'), '');
    await page.screenshot({ path: resolve(output, 'mobile-menu.png') });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.ap-menu-toggle').getAttribute('aria-expanded'), 'false');
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
    await page.locator('.ap-nav').getByRole('link', { name: 'Nuestros seguros', exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#/inicio/soluciones');
    assert.equal(await page.locator('.ap-menu-toggle').getAttribute('aria-expanded'), 'false');
    await page.locator('.ap-product-salud button').click();
    await page.screenshot({ path: resolve(output, 'mobile-details.png') });
    await page.keyboard.press('Escape');
  });
  await test('Canonical and legacy public routes still render the public website', async () => {
    for (const hash of ['#/inicio', '#/web', '#/inicio/nosotros', '#/inicio/soluciones', '#/inicio/empresas', '#/inicio/proceso', '#/inicio/contacto', '#inicio', '#servicios', '#filosofia', '#proceso', '#contacto']) {
      await page.goto(base + hash);
      await page.locator('.acos-public').waitFor();
    }
  });
  await test('All existing private routes retain the unauthenticated access gate', async () => {
    for (const hash of ['#/acceso', '#/registro', '#/direccion/solicitudes', '#/mi-panel', '#/demo', '#/dashboard', '#/admin']) {
      await page.goto(base + hash);
      await page.locator('input[type=password]').waitFor();
      assert.equal(await page.locator('.acos-public').count(), 0);
      if (['#/demo', '#/dashboard', '#/admin'].includes(hash)) assert.equal(new URL(page.url()).hash, '#/acceso');
    }
    await page.goto(base + '#/inicio');
    await page.locator('.acos-public').waitFor();
  });
  await test('No uncaught browser errors', async () => assert.deepEqual(runtimeErrors, []));
  // Keep complete axe evidence even when an issue fails the build.
  await writeFile(resolve(output, 'accessibility.json'), JSON.stringify(accessibility, null, 2));
  await test('No WCAG A/AA issues detected by axe', async () => {
    assert.equal(accessibility.flatMap(result => result.violations).length, 0, JSON.stringify(accessibility.filter(result => result.violations.length > 0)));
  });
} catch (error) {
  results.push({ status: 'FAIL', message: error.message });
  await page.screenshot({ path: resolve(output, 'failure.png'), fullPage: true }).catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(resolve(output, 'results.json'), JSON.stringify({ results, runtimeErrors, accessibility }, null, 2));
  await browser.close();
  await new Promise(done => server.close(done));
}
