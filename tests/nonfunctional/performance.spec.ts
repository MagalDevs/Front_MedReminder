import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test, expect, setup, summary, evidence } from './support';
const TARGET = process.env.NF_TARGET_URL || 'http://localhost:3001';

test('NF-02 NF-WEB-02 ten fixed catalog queries before/after in three browser rounds', async ({ page }, info) => {
  await setup(page);
  await page.goto(TARGET);
  await expect(page.getByPlaceholder('Buscar medicamento...')).toBeVisible();
  const csv = readFileSync('public/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv', 'utf8');
  await page.addScriptTag({ path: 'node_modules/papaparse/papaparse.min.js' });
  const catalog = await page.evaluate(async () => {
    const downloadStart = performance.now();
    const response = await fetch('/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv', { cache: 'no-store' });
    const text = await response.text();
    return { text, downloadMs: performance.now() - downloadStart, status: response.status };
  });
  expect(catalog.status).toBe(200);
  expect(catalog.text).toBe(csv);
  const queries = ['', 'xyz-inexistente-999', 'a', 'dip', 'DIP', 'ácido', 'ÁCIDO', 'funed', 'FUNED LORATADINA', ' dip'];
  const measured = await page.evaluate(({ text, queries }) => {
    type Row = { NOME_PRODUTO: string; DESCRIÇÃO: string };
    const parser = (window as unknown as { Papa: { parse: (csv: string, options: object) => { data: Row[] } } }).Papa;
    const parsingMs = [];
    let rows: Row[] = [];
    for (let run = 0; run < 5; run++) {
      const start = performance.now();
      rows = parser.parse(text, { header: true, skipEmptyLines: true }).data;
      parsingMs.push(performance.now() - start);
    }
    const run = (query: string, optimized: boolean) => {
      if (!query) return [];
      const lower = query.toLowerCase();
      return rows.filter(row => row.NOME_PRODUTO?.toLowerCase().includes(optimized ? lower : query.toLowerCase()));
    };
    for (let warmup = 0; warmup < 20; warmup++) for (const query of queries) { run(query, false); run(query, true); }
    const rounds = Array.from({ length: 3 }, (_, round) => queries.map(query => {
      const beforeStart = performance.now();
      const before = run(query, false);
      const beforeMs = performance.now() - beforeStart;
      const afterStart = performance.now();
      const after = run(query, true);
      const afterMs = performance.now() - afterStart;
      return { round, query, beforeMs, afterMs, count: after.length,
        equivalent: JSON.stringify(before) === JSON.stringify(after) };
    }));
    return { rounds, parsingMs, rows: rows.length };
  }, { text: catalog.text, queries });
  const { rounds } = measured;
  expect(rounds.flat().every(sample => sample.equivalent)).toBe(true);
  const downloads = await page.evaluate(() => performance.getEntriesByType('resource')
    .filter(resource => resource.name.includes('DADOS_ABERTOS')).map(resource => {
      const entry = resource as PerformanceResourceTiming;
      return { durationMs: entry.duration, transferBytes: entry.transferSize, decodedBytes: entry.decodedBodySize };
    }));
  await evidence(info, 'catalog-performance', { csvBytes: Buffer.byteLength(csv), csvSha256: createHash('sha256').update(csv).digest('hex'),
    rows: measured.rows, queries, warmupPasses: 20, rounds, downloads,
    browserParsingMs: summary(measured.parsingMs), explicitNoStoreDownloadMs: catalog.downloadMs,
    parser: 'PapaParse 5.7.0 minified browser distribution, same header/skipEmptyLines options as application, five parses',
    before: summary(rounds.flat().map(x => x.beforeMs)), after: summary(rounds.flat().map(x => x.afterMs)),
    clock: 'Chromium performance.now for download, parsing and filtering',
    limitations: 'Parser is injected from installed browser distribution, measured separately from application mount/render. Microbenchmark compares original and optimized expressions on identical rows in browser. Ten samples/round give nearest-rank p95 equal to maximum; not robust tail estimation.',
    proposedTarget: 'p95 < 500 ms in PLANO_TESTES, proposal only; no field or production performance claim' });
});

test('NF-02 NF-WEB-03 production routes, five cold and warm samples', async ({ browser }, info) => {
  test.setTimeout(180_000);
  const routes = [];
  for (const route of ['/', '/login', '/novo-medicamento', '/meus-lembretes']) {
    const cold: number[] = [], warm: number[] = [], resources = [];
    for (let run = 0; run < 5; run++) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'America/Sao_Paulo' });
      const page = await context.newPage();
      const unexpected = await setup(page, 0, true, true);
      for (const condition of ['cold', 'warm']) {
        const start = performance.now();
        await page.goto(`${TARGET}${route}`, { waitUntil: 'load' });
        await expect(page.locator('body')).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        (condition === 'cold' ? cold : warm).push(performance.now() - start);
        const resourceSample = await page.evaluate(() => {
          const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
          return { requests: entries.length, jsUrls: [...new Set([...document.scripts].map(script => script.src)
            .concat(entries.map(entry => entry.name)).filter(url => url && new URL(url).pathname.endsWith('.js')))],
            navigation: (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.toJSON() };
        });
        // Chromium may report zero ResourceTiming sizes when request interception is
        // enabled. Read the actual same-origin response bodies outside timed navigation.
        let jsDecodedBytes = 0;
        for (const url of resourceSample.jsUrls) {
          expect(new URL(url).origin).toBe(new URL(TARGET).origin);
          const response = await page.request.get(url);
          expect(response.ok()).toBe(true);
          jsDecodedBytes += (await response.body()).byteLength;
        }
        resources.push({ ...resourceSample, jsDecodedBytes });
      }
      expect(unexpected, 'unplanned API requests blocked in isolated performance context').toEqual([]);
      await context.close();
    }
    routes.push({ route, coldMs: summary(cold), warmMs: summary(warm), resources });
  }
  await evidence(info, 'route-performance', { routes, cache: 'cold=new browser context; warm=second navigation same context. Route interception disables HTTP cache in Playwright; no claim of browser-cache benefit.',
    scope: 'Navigation load and fonts, not LCP/INP/CLS or interactive readiness; requests and decoded JS per observed route, not complete bundle inventory. JS body bytes read with same-origin APIRequestContext outside timed navigation because intercepted ResourceTiming can report zero sizes.',
    target: TARGET, comparison: 'Same runner supports historical/current builds via NF_TARGET_URL and NF_BUILD_COMMIT; compare dated artifacts without claiming causality from one run' });
});
