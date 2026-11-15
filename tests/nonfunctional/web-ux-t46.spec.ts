import { test, expect, PRODUCTION_API_ORIGIN } from '../support/api-guard';
import { noHorizontalOverflow, openVisualRoute, reachable, visualMedication, visualRoutes, visualSetup } from '../support/web-ux-visual';
import { syntheticProfile } from '../support/web-ux-routes';

test.use({ timezoneId: 'America/Sao_Paulo' });
test.beforeEach(async ({ page }) => { await visualSetup(page); });

test('WUX_SYSTEM_04 equivalent save actions share default hover focus disabled loading and immediate feedback', async ({ page }) => {
  for (const [path, endpoint, method, loadingLabel, success] of [
    ['/meus-medicamentos/17/editar', '/remedio/17', 'PUT', 'Salvando…', 'Medicamento atualizado.'],
    ['/Configuracoes', '/usuario/me', 'PATCH', 'Salvando…', 'Perfil atualizado.'],
  ]) {
    await openVisualRoute(page, path);
    const button = page.getByRole('button', { name: 'Salvar alterações', exact: true });
    await expect(button).toHaveCSS('background-color', 'rgb(11, 110, 113)');
    await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(button).toHaveCSS('border-radius', '8px');
    await expect(button).toHaveCSS('transition-duration', '0.15s');
    await button.hover(); await expect(button).toHaveCSS('background-color', 'rgb(8, 86, 89)');
    await button.focus(); await expect(button).toHaveCSS('outline-width', '3px');
    await expect(button).toHaveCSS('outline-color', 'rgb(7, 89, 133)');
    let release: () => void = () => {}; const response = new Promise<void>(resolve => { release = resolve; });
    await page.route(`${PRODUCTION_API_ORIGIN}${endpoint}`, async route => {
      if (route.request().method() !== method) return route.fallback();
      await response;
      await route.fulfill({ json: { data: { ...(method === 'PUT' ? visualMedication : syntheticProfile), nome: 'Ana Revisada' } } });
    });
    await page.getByLabel('Nome', { exact: true }).fill('Ana Revisada');
    const request = page.waitForRequest(req => req.method() === method && new URL(req.url()).pathname === endpoint);
    await button.click(); await request;
    const loading = page.getByRole('button', { name: loadingLabel, exact: true });
    await expect(loading).toBeDisabled(); await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading).toHaveCSS('background-color', 'rgb(229, 231, 235)');
    await expect(loading).toHaveCSS('color', 'rgb(82, 82, 82)');
    release(); const feedback = page.getByRole('status').filter({ hasText: success });
    await expect(feedback).toBeVisible(); await expect(feedback.locator('..')).toHaveCSS('animation-duration', '0.15s');
  }
  await page.setViewportSize({ width: 390, height: 844 }); await openVisualRoute(page, '/hoje');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCSS('animation-duration', '0.25s');
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('WUX_ACCESS_09 effective 200 percent text reflows all routes and reduced motion leaves controls immediately usable', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 320, height: 568 });
  for (const [path, name] of visualRoutes) {
    await openVisualRoute(page, path);
    const before = await page.locator('body').evaluate(el => parseFloat(getComputedStyle(el).fontSize)); expect(before).toBe(16);
    const headingBefore = await page.locator('h1').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect(page.locator('body')).toHaveCSS('font-size', '32px');
    await expect(page.locator('h1').first()).toHaveCSS('font-size', `${headingBefore * 2}px`);
    const input = page.locator('input:not([type=radio]):not([type=checkbox]),select,textarea').first();
    if (await input.count()) await expect(input).toHaveCSS('font-size', '32px');
    for (const date of await page.locator('input[type=date]').all()) {
      const room = await date.evaluate(el => {
        const style = getComputedStyle(el); const canvas = document.createElement('canvas'); const context = canvas.getContext('2d')!;
        context.font = `${style.fontSize} ${style.fontFamily}`;
        return { available: el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), required: context.measureText('00/00/0000').width + 24 };
      });
      expect(room.available).toBeGreaterThanOrEqual(room.required);
    }
    await noHorizontalOverflow(page);
    for (const target of await page.locator('input:not([type=radio]):not([type=checkbox]),select,textarea,button,label:has(input[type=radio])').all()) if (await target.isVisible()) await reachable(target);
    if (name === 'edit' || name === 'profile' || name === 'login') await page.screenshot({ path: `.specs/features/web-ux-consistency/captures/b7-text200-${name}-320.png`, fullPage: true });
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    if (await menu.count()) {
      await menu.click(); const dialog = page.getByRole('dialog'); await reachable(dialog.getByRole('link', { name: 'Perfil', exact: true }));
      if (name === 'today') { await dialog.evaluate(el => { el.scrollTop = 0; }); await page.screenshot({ path: '.specs/features/web-ux-consistency/captures/b7-text200-menu-320.png' }); }
      const signOut = dialog.getByRole('button', { name: 'Sair', exact: true });
      for (let tab = 0; tab < 12 && !await signOut.evaluate(el => el === document.activeElement); tab++) await page.keyboard.press('Tab');
      await expect(signOut).toBeFocused(); await expect(signOut).toBeInViewport(); await reachable(signOut);
      await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(menu).toBeFocused();
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [path] of visualRoutes) {
    await openVisualRoute(page, path); await noHorizontalOverflow(page);
    const styles = await page.locator('main,button,input,select,textarea,[role=status],[role=alert]').evaluateAll(elements => elements.map(el => ({ animation: getComputedStyle(el).animationDuration, transition: getComputedStyle(el).transitionDuration, opacity: getComputedStyle(el).opacity })));
    for (const style of styles) { expect(style.animation).toBe('0s'); expect(style.transition).toBe('0s'); expect(style.opacity).toBe('1'); }
    for (const target of await page.locator('input:not([type=radio]):not([type=checkbox]),select,textarea,button').all()) if (await target.isVisible()) await reachable(target);
  }
  await openVisualRoute(page, '/hoje'); const menu = page.getByRole('button', { name: 'Menu', exact: true }); await menu.click();
  await expect(page.getByRole('dialog')).toHaveCSS('animation-duration', '0s');
  expect(await page.getByRole('dialog').evaluate(el => el.getAnimations().length)).toBe(0);
  await page.screenshot({ path: '.specs/features/web-ux-consistency/captures/b7-reduced-menu-320.png' });
  await page.keyboard.press('Escape'); await expect(menu).toBeFocused(); await expect(page.getByRole('dialog')).toHaveCount(0);
  await openVisualRoute(page, '/meus-medicamentos/17/editar'); await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Nenhuma alteração para salvar.' })).toBeVisible();
});

test('T46 wizard and registration stage changes keep entered values focus and immediate controls with either motion preference', async ({ page }) => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    await page.emulateMedia({ reducedMotion });
    await openVisualRoute(page, '/novo-medicamento');
    for (const [label, value] of [['Nome do medicamento', 'Vitamina Sintética'], ['Quantidade em estoque', '10'], ['Unidade do estoque', 'comprimidos'], ['Validade', '2027-01-01'], ['URL da foto', 'https://example.test/medication.png']]) await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByRole('radio', { name: 'Azul', exact: true }).locator('..').click();
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    const stage = page.locator('[aria-label="Etapa atual: Tratamento"]');
    await expect(stage).toBeFocused(); await expect(stage).toHaveCSS('animation-duration', reducedMotion === 'reduce' ? '0s' : '0.25s');
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    await expect(page.getByLabel('Nome do medicamento', { exact: true })).toHaveValue('Vitamina Sintética');
    await openVisualRoute(page, '/cadastro');
    await page.getByLabel('E-mail', { exact: true }).fill('ana@example.test'); await page.getByLabel('Senha', { exact: true }).fill('Senha123!'); await page.getByLabel('Confirmar senha', { exact: true }).fill('Senha123!');
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Dados pessoais', exact: true })).toBeFocused();
    await expect(page.locator('fieldset.wux-stage')).toHaveCSS('animation-duration', reducedMotion === 'reduce' ? '0s' : '0.25s');
    await page.getByRole('button', { name: 'Voltar para Conta' }).click();
    await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue('ana@example.test');
  }
});
