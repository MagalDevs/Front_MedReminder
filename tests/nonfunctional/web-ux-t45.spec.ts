import { test, expect, PRODUCTION_API_ORIGIN } from '../support/api-guard';
import { contrastRatio, noHorizontalOverflow, openVisualRoute, pair, reachable, visualMedication, visualRoutes, visualSetup } from '../support/web-ux-visual';
test.use({ timezoneId: 'America/Sao_Paulo' });
test.beforeEach(async ({ page }) => { await visualSetup(page); });
test('B7 observe incumbent screens at actual viewport sizes', async ({ page }) => {
  test.setTimeout(90_000);
  for (const [width, height] of [[320,568],[390,844],[768,1024],[1440,900]]) {
    await page.setViewportSize({width,height});
    for (const [path, name] of visualRoutes) {
      await openVisualRoute(page, path); await noHorizontalOverflow(page);
      for (const target of await page.locator('input:not([type=radio]):not([type=checkbox]),select,textarea,button').all()) if (await target.isVisible()) await reachable(target);
      await page.screenshot({path:`.specs/features/web-ux-consistency/captures/b7-after-${name}-${width}.png`,fullPage:true});
    }
  }
});

test('WUX_NAV_08 narrow menu opens by Enter contains focus and closes with Escape returning to content', async ({ page }) => {
  await page.setViewportSize({ width:320, height:568 }); await openVisualRoute(page, '/hoje');
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await page.keyboard.press('Tab'); await expect(page.getByRole('link', {name:'Ir para o conteúdo'})).toBeFocused();
  await page.keyboard.press('Tab'); const trigger=page.getByRole('button',{name:'Menu',exact:true}); await expect(trigger).toBeFocused(); await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'Navegação'}); await expect(dialog).toBeVisible(); await expect(trigger).toHaveAttribute('aria-expanded','true');
  for(let i=0;i<8;i++){ await page.keyboard.press('Tab'); expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true); }
  await reachable(dialog.getByRole('link',{name:'Perfil',exact:true})); await noHorizontalOverflow(page);
  await page.screenshot({path:'.specs/features/web-ux-consistency/captures/b7-menu-320.png'});
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused(); await expect(page.getByRole('navigation')).toHaveCount(0);
  await page.keyboard.press('Tab'); await expect(page.getByRole('link',{name:'Adicionar medicamento',exact:true})).toBeFocused();
  const h=await page.getByRole('heading',{name:'Hoje',exact:true}).boundingBox(), header=await page.locator('header').boundingBox(); expect(h!.y).toBeGreaterThanOrEqual(header!.y+header!.height);
});

test('WUX_SYSTEM_01 interface font is Kantumruy on every route including headings and native controls', async ({ page }) => {
  for(const [path] of visualRoutes){ await openVisualRoute(page,path); const elements=page.locator('body,h1,h2,p,button,input,select,textarea'); expect(await elements.count()).toBeGreaterThan(3); for(const element of await elements.all()) await expect(element).toHaveCSS('font-family','Kantumruy, sans-serif'); }
});

test('WUX_SYSTEM_02 actual primary fields focus and feedback use the single semantic token palette', async ({ page }) => {
  await openVisualRoute(page,'/meus-medicamentos/17/editar');
  const tokens=await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return ['action-primary','text-primary','surface-raised','border-control','focus','error','warning','success'].map(name=>s.getPropertyValue(`--${name}`).trim());});
  expect(tokens.every(Boolean)).toBe(true); expect(new Set(tokens).size).toBe(8);
  await expect(page.getByRole('button',{name:'Salvar alterações'})).toHaveCSS('background-color','rgb(11, 110, 113)');
  await expect(page.getByLabel('Nome',{exact:true})).toHaveCSS('border-top-color','rgb(115, 115, 115)');
  await expect(page.locator('form')).toHaveCSS('background-color','rgb(255, 255, 255)'); await expect(page.locator('body')).toHaveCSS('color','rgb(23, 23, 23)');
});

test('WUX_SYSTEM_03 brand pink stays in identity and medication color never supplies error or success semantics', async ({ page }) => {
  await openVisualRoute(page,'/meus-medicamentos/17/editar');
  await expect(page.locator('header').getByText('MedReminder',{exact:true})).toHaveCSS('color','rgb(190, 24, 93)');
  await expect(page.locator('header img')).toHaveAttribute('src',/LogoMed/);
  let fail=true; await page.route(`${PRODUCTION_API_ORIGIN}/remedio/17`,route=>route.request().method()==='PUT'?route.fulfill(fail?{status:503,json:{}}:{json:{data:{...visualMedication,nome:'Nome revisado'}}}):route.fallback());
  await page.getByRole('radio',{name:'Vermelho',exact:true}).locator('..').click(); await page.getByLabel('Nome',{exact:true}).fill('Nome revisado'); await page.getByRole('button',{name:'Salvar alterações'}).click();
  const error=page.getByRole('alert').filter({hasText:'O serviço está temporariamente indisponível.'}); await expect(error).toHaveCSS('color','rgb(180, 35, 24)');
  fail=false; await page.getByRole('button',{name:'Salvar alterações'}).click(); await expect(page.getByRole('status').filter({hasText:'Medicamento atualizado.'})).toHaveCSS('color','rgb(22, 101, 52)');
});

test('WUX_SYSTEM_06 secondary controls remain distinct and readable on login and authenticated forms', async ({ page }) => {
  for(const [path,primary,secondary] of [['/login','Entrar','Mostrar senha'],['/cadastro','Continuar','Mostrar senha'],['/meus-medicamentos/17/editar','Salvar alterações','Sair']]){
    await openVisualRoute(page,path); const first=await pair(page.getByRole('button',{name:primary,exact:true})), second=await pair(page.getByRole('button',{name:secondary,exact:true})); expect(first.background).toBe('rgb(11, 110, 113)'); expect(second.background).toBe('rgb(255, 255, 255)'); expect(contrastRatio(second.foreground,second.background)).toBeGreaterThanOrEqual(4.5);
  }
});

test('WUX_SYSTEM_08 loading empty filtered recoverable error and success share feedback vocabulary and treatment', async ({ page }) => {
  let release:()=>void=()=>{}; const response=new Promise<void>(resolve=>{release=resolve;}); let phase='loading';
  await page.route(`${PRODUCTION_API_ORIGIN}/remedio/me`,async route=>{if(phase==='loading') await response; return route.fulfill(phase==='error'?{status:503,json:{}}:{json:{data:phase==='items'?[visualMedication]:[]}});});
  await page.goto('/meus-medicamentos'); const loading=page.getByRole('status').filter({hasText:'Carregando medicamentos…'}); await expect(loading).toBeVisible(); await expect(loading.locator('..')).toHaveCSS('border-radius','8px'); phase='empty';release();
  const empty=page.getByRole('status').filter({hasText:'Nenhum medicamento cadastrado'}); await expect(empty).toBeVisible(); await expect(empty.locator('..')).toHaveCSS('background-color','rgb(255, 255, 255)');
  phase='items'; await page.reload(); await expect(page.getByRole('article')).toHaveCount(1); await page.getByLabel('Nome',{exact:true}).fill('Nada'); const filtered=page.getByRole('status').filter({hasText:'Nenhum medicamento corresponde aos filtros'}); await expect(filtered).toBeVisible(); await expect(filtered.locator('..')).toHaveCSS('border-radius','8px');
  phase='error'; await page.reload(); const error=page.getByRole('alert').filter({hasText:'Ao carregar medicamentos'}); await expect(error).toBeVisible(); await expect(page.getByText('Nenhum medicamento cadastrado',{exact:true})).toHaveCount(0); await expect(error.locator('..')).toHaveCSS('background-color','rgb(254, 243, 242)');
  phase='empty'; await page.getByRole('button',{name:'Tentar novamente'}).click(); await expect(empty).toBeVisible();
  await openVisualRoute(page,'/meus-medicamentos/17/editar'); await page.getByRole('button',{name:'Salvar alterações'}).click(); const success=page.getByRole('status').filter({hasText:'Nenhuma alteração para salvar.'}); await expect(success).toBeVisible(); await expect(success.locator('..')).toHaveCSS('background-color','rgb(240, 253, 244)'); await expect(success.locator('..')).toHaveCSS('border-radius','8px');
});

test('WUX_ACCESS_01 every scoped field button selector and navigation control has an accessible name', async ({ page }) => {
  for(const [path] of visualRoutes){ await openVisualRoute(page,path); const controls=page.locator('input,select,textarea,button,nav a'); expect(await controls.count()).toBeGreaterThan(0); for(const control of await controls.all()) await expect(control).toHaveAccessibleName(/\S/); }
  await openVisualRoute(page,'/cadastro'); await page.getByLabel('E-mail',{exact:true}).fill('ana@example.test'); await page.getByLabel('Senha',{exact:true}).fill('Senha123!'); await page.getByLabel('Confirmar senha',{exact:true}).fill('Senha123!'); await page.getByRole('button',{name:'Continuar'}).click(); for(const control of await page.locator('input,button').all()) await expect(control).toHaveAccessibleName(/\S/);
});

test('WUX_ACCESS_06 rendered text placeholders primary hover disabled warning error and success meet contrast thresholds', async ({ page }) => {
  for(const [path] of visualRoutes){ await openVisualRoute(page,path); const pairs=await page.locator('h1,h2,h3,p,dt,dd,label,legend,button,a,li[aria-current],input,select,textarea').evaluateAll(elements=>elements.filter(el=>el.getBoundingClientRect().width>2&&getComputedStyle(el).visibility!=='hidden').map(el=>{const s=getComputedStyle(el);let a:Element|null=el;let bg='rgb(255, 255, 255)';while(a){const c=getComputedStyle(a).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'&&c!=='transparent'){bg=c;break;}a=a.parentElement;}return {text:el.textContent?.slice(0,80)||el.getAttribute('aria-label')||el.tagName,fg:s.color,bg,font:parseFloat(s.fontSize),weight:Number(s.fontWeight)};})); for(const value of pairs) expect(contrastRatio(value.fg,value.bg),`${path}: ${value.text}`).toBeGreaterThanOrEqual(value.font>=24||value.font>=18.66&&value.weight>=700?3:4.5); }
  await openVisualRoute(page,'/'); const placeholder=await page.getByRole('combobox').evaluate(el=>({fg:getComputedStyle(el,'::placeholder').color,bg:getComputedStyle(el).backgroundColor,opacity:getComputedStyle(el,'::placeholder').opacity})); expect(placeholder.opacity).toBe('1'); expect(contrastRatio(placeholder.fg,placeholder.bg)).toBeGreaterThanOrEqual(4.5);
  await openVisualRoute(page,'/login'); const button=page.getByRole('button',{name:'Entrar',exact:true}); await button.hover(); await expect(button).toHaveCSS('background-color','rgb(8, 86, 89)'); const hovered=await pair(button);expect(contrastRatio(hovered.foreground,hovered.background)).toBeGreaterThanOrEqual(4.5);
  let release:()=>void=()=>{}; const pending=new Promise<void>(resolve=>{release=resolve;}); await page.route(`${PRODUCTION_API_ORIGIN}/auth/login`,async route=>{await pending;await route.fulfill({status:429,headers:{'Retry-After':'5','access-control-expose-headers':'Retry-After'},json:{}});}); await page.getByLabel('E-mail').fill('ana@example.test');await page.getByLabel('Senha',{exact:true}).fill('Senha123!');await button.click();const disabled=page.getByRole('button',{name:'Entrando…',exact:true});await expect(disabled).toBeDisabled();const busy=await pair(disabled);expect(contrastRatio(busy.foreground,busy.background)).toBeGreaterThanOrEqual(4.5);release();await expect(page.getByRole('alert').filter({hasText:'Muitas tentativas.'})).toBeVisible();
  await openVisualRoute(page,'/meus-medicamentos/17/editar');await page.getByRole('button',{name:'Salvar alterações'}).click();const confirmed=await pair(page.getByRole('status').filter({hasText:'Nenhuma alteração para salvar.'}));expect(contrastRatio(confirmed.foreground,confirmed.background)).toBeGreaterThanOrEqual(4.5);await page.route(`${PRODUCTION_API_ORIGIN}/remedio/17`,route=>route.request().method()==='PUT'?route.fulfill({status:429,headers:{'Retry-After':'5','access-control-expose-headers':'Retry-After'},json:{}}):route.fallback());await page.getByLabel('Nome',{exact:true}).fill('Outro nome');await page.getByRole('button',{name:'Salvar alterações'}).click();
  for(const text of ['Muitas tentativas.','Aguarde antes de salvar novamente.']){const state=await pair(page.getByRole('alert').filter({hasText:text}));expect(contrastRatio(state.foreground,state.background)).toBeGreaterThanOrEqual(4.5);}
  await page.screenshot({path:'.specs/features/web-ux-consistency/captures/b7-warning-error-1280.png',fullPage:true});
});

test('WUX_ACCESS_07 visible focus and 44px targets include named radio labels with keyboard selection', async ({ page }) => {
  await openVisualRoute(page,'/meus-medicamentos/17/editar');
  for(const target of await page.locator('button, label:has(input[type=radio])').all()){ const box=await target.boundingBox(); expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44); }
  const selected=page.getByRole('radio',{name:'Azul',exact:true}); await selected.focus();await page.keyboard.press('ArrowRight');const next=page.getByRole('radio',{name:'Amarelo',exact:true});await expect(next).toBeFocused();await expect(next).toBeChecked();
  const label=next.locator('..');await expect(label).toHaveCSS('outline-style','solid');await expect(label).toHaveCSS('outline-width','3px');await expect(label).toHaveCSS('outline-color','rgb(7, 89, 133)');
  const save=page.getByRole('button',{name:'Salvar alterações'});await save.focus();await expect(save).toHaveCSS('outline-width','3px');await expect(save).toHaveCSS('outline-style','solid');
  await next.focus();await label.scrollIntoViewIfNeeded();await page.screenshot({path:'.specs/features/web-ux-consistency/captures/b7-color-focus-1280.png'});
});

test('WUX_ACCESS_08 forms remain reachable at all four viewport sizes with long content and modal clipping checked', async ({ page }) => {
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1440,900]]){
    await page.setViewportSize({width,height});await openVisualRoute(page,'/meus-medicamentos/17/editar');await page.getByLabel('Nome',{exact:true}).fill('Medicamento'.repeat(12));await page.getByRole('radio',{name:'Verde escuro',exact:true}).locator('..').click();await noHorizontalOverflow(page);await reachable(page.getByRole('button',{name:'Salvar alterações'}));
    await openVisualRoute(page,'/meus-medicamentos');const opener=page.getByRole('button',{name:'Excluir medicamento',exact:true});await opener.click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await reachable(dialog.getByRole('button',{name:'Confirmar exclusão'}));const bounds=await dialog.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);expect(bounds!.height).toBeLessThanOrEqual(height);await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(opener).toBeFocused();await noHorizontalOverflow(page);
  }
});

test('T45 review follow-up gives natural exact counts and places history after the complete daily agenda', async ({ page }) => {
  await page.setViewportSize({width:320,height:568});await openVisualRoute(page,'/hoje');
  await expect(page.getByRole('status').filter({hasText:'Hoje: 2 doses, 0 registradas e 2 não registradas.'})).toHaveText('Hoje: 2 doses, 0 registradas e 2 não registradas.');
  const list=page.getByRole('list',{name:'Doses de hoje'});await expect(list).toContainText(visualMedication.quantidadeDose);
  expect(await list.evaluate(el=>!!(el.compareDocumentPosition(document.querySelector('a[href="/historico"]:not(nav a)')!)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await page.route(`${PRODUCTION_API_ORIGIN}/dose/31`,route=>route.fulfill({json:{data:{id:31,data_dose:'2026-11-14T08:00:00-03:00',tomado:true,remedio:visualMedication}}}));
  await page.getByRole('button',{name:/Registrar dose de/}).click();await expect(page.getByRole('status').filter({hasText:'Hoje: 2 doses, 1 registrada e 1 não registrada.'})).toHaveText('Hoje: 2 doses, 1 registrada e 1 não registrada.');
  await page.getByRole('link',{name:'Ver Histórico',exact:true}).click();await expect(page).toHaveURL(/\/historico$/);
});
