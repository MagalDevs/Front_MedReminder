import { test, expect, setup, evidence } from './support';

for (const width of [360, 768, 1440]) {
  test(`NF-01 NF-WEB-01 keyboard, labels and layout at ${width}px (assessment)`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await setup(page);
    const screens = [];
    for (const route of ['/', '/login', '/novo-medicamento', '/meus-lembretes']) {
      await page.goto(route);
      await expect(page.locator('body')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const audit = await page.evaluate(() => {
        const visible = (el: Element) => !!el.getClientRects().length;
        const controls = [...document.querySelectorAll('input:not([type=hidden]),select,textarea,button,a[href]')].filter(visible);
        const name = (el: Element) => el.getAttribute('aria-label') ||
          (el.getAttribute('aria-labelledby') || '').split(' ').map(id => document.getElementById(id)?.textContent || '').join(' ').trim() ||
          ((el as HTMLInputElement).labels ? [...((el as HTMLInputElement).labels || [])].map(l => l.textContent).join(' ').trim() : '') ||
          (el.matches('button,a') ? el.textContent?.trim() : '') || '';
        return { lang: document.documentElement.lang, viewportWidth: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          controls: controls.map(el => ({ tag: el.tagName, type: el.getAttribute('type'), name: name(el),
            placeholder: el.getAttribute('placeholder'), tabIndex: (el as HTMLElement).tabIndex })),
          unnamedControls: controls.filter(el => !name(el)).map(el => ({ tag: el.tagName, placeholder: el.getAttribute('placeholder') })) };
      });
      const focus = [];
      for (let step = 0; step < Math.min(audit.controls.length + 1, 15); step++) {
        await page.keyboard.press('Tab');
        focus.push(await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const style = getComputedStyle(el);
          return { tag: el.tagName, text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 90),
            outline: style.outline, boxShadow: style.boxShadow };
        }));
      }
      screens.push({ route, ...audit, focus, horizontalOverflow: audit.documentWidth > width });
      expect(audit.lang).toBe('pt-BR');
      expect(audit.controls.length).toBeGreaterThan(0);
    }
    await evidence(info, `accessibility-${width}`, { screens,
      scope: 'DOM names, Tab path, computed focus styles, horizontal overflow; observations, not WCAG certification',
      issue: 'FE-09 https://github.com/MagalDevs/Front_MedReminder/issues/33',
      manual: { screenReader: 'BLOCKED: no identified screen reader session', contrast: 'NOT ASSESSED manually',
        zoomAndModalFocus: 'NOT ASSESSED; requires manual flow review' } });
  });
}
