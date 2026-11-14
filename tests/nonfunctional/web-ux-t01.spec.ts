import { test, expect, setup } from './support';

test.beforeEach(async ({ page }) => {
  await setup(page, 0, false);
  await page.goto('/');
});

test('WUX_T01_FONT Kantumruy is inherited by text and controls with all interface weights available', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const fixture = document.createElement('section');
    fixture.innerHTML = '<p>Horários das doses</p><button>Continuar</button><input aria-label="Nome" />';
    document.body.append(fixture);
    const weights = await Promise.all([400, 500, 600, 700].map(async weight =>
      (await document.fonts.load(`${weight} 16px Kantumruy`)).length));
    return { weights, fonts: [document.body, ...fixture.children].map(el => getComputedStyle(el).fontFamily) };
  });
  expect(result.weights).toEqual([1, 1, 1, 1]);
  for (const font of result.fonts) expect(font).toBe('Kantumruy, sans-serif');
});

test('WUX_T01_PALETTE semantic palette preserves identity and readable default, hover, secondary, disabled and feedback pairs', async ({ page }) => {
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(['action-primary', 'action-primary-hover', 'action-primary-text', 'brand-signature',
      'surface-page', 'surface-raised', 'text-primary', 'text-muted', 'border-default', 'focus',
      'error', 'error-surface', 'warning', 'warning-surface', 'success', 'success-surface',
      'disabled-text', 'disabled-surface'].map(name => {
        const value = style.getPropertyValue(`--${name}`).trim();
        // Production CSS minifies #ffffff to #fff; compare the same RGB value.
        return [name, /^#[0-9a-f]{3}$/i.test(value) ? `#${[...value.slice(1)].map(v => v + v).join('')}` : value];
      }));
  });
  expect(tokens['action-primary']).toBe('#0b6e71');
  expect(tokens['brand-signature']).toBe('#be185d');
  expect(tokens['surface-page']).toBe('#f6f6f6');
  expect(tokens['surface-raised']).toBe('#ffffff');
  expect(tokens['text-primary']).toBe('#171717');
  expect(tokens['border-default']).toBe('#d1d5db');
  expect(new Set(['brand-signature', 'error', 'warning', 'success', 'focus'].map(name => tokens[name])).size).toBe(5);
  const luminance = (hex: string) => {
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  for (const [foreground, background] of [
    ['action-primary-text', 'action-primary'], ['action-primary-text', 'action-primary-hover'],
    ['action-primary', 'surface-raised'], ['text-primary', 'surface-page'], ['text-muted', 'surface-raised'],
    ['disabled-text', 'disabled-surface'], ['error', 'error-surface'], ['warning', 'warning-surface'],
    ['success', 'success-surface'], ['focus', 'surface-raised'],
  ]) {
    const a = luminance(tokens[foreground]);
    const b = luminance(tokens[background]);
    expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), `${foreground}/${background}`).toBeGreaterThanOrEqual(4.5);
  }
});

test('WUX_T01_FOCUS keyboard focus has a visible semantic indicator', async ({ page }) => {
  await page.evaluate(() => {
    const button = document.createElement('button');
    button.textContent = 'Conferir dose';
    button.id = 'token-focus';
    document.body.prepend(button);
  });
  await page.keyboard.press('Tab');
  await expect(page.locator('#token-focus')).toBeFocused();
  await expect(page.locator('#token-focus')).toHaveCSS('outline-style', 'solid');
  await expect(page.locator('#token-focus')).toHaveCSS('outline-width', '3px');
  await expect(page.locator('#token-focus')).toHaveCSS('outline-color', 'rgb(7, 89, 133)');
});
