import { test, expect, setup, summary, evidence } from './support';

test('NF-04 NF-SCALE-01 local list 10/100/1000 records, five runs per volume', async ({ browser }, info) => {
  test.setTimeout(180_000);
  const volumes = [];
  for (const volume of [10, 100, 1000]) {
    const loading = [], filtering = [], memory = [], failures: string[] = [];
    for (let run = 0; run < 5; run++) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'America/Sao_Paulo' });
      const page = await context.newPage();
      page.on('pageerror', error => failures.push(error.message));
      const unexpected = await setup(page, volume, true, true);
      const start = performance.now();
      await page.goto('http://localhost:3001/meus-lembretes');
      await expect(page.locator('h3').filter({ hasText: /^Medicamento NF / })).toHaveCount(volume);
      loading.push(performance.now() - start);
      const filterStart = performance.now();
      await page.locator('select').nth(1).selectOption('true');
      await expect(page.locator('h3').filter({ hasText: /^Medicamento NF / })).toHaveCount(volume / 2);
      filtering.push(performance.now() - filterStart);
      memory.push(await page.evaluate(() => (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? null));
      expect(unexpected, 'unplanned API requests blocked in isolated scale context').toEqual([]);
      await context.close();
    }
    volumes.push({ volume, renderedRecords: volume, loadingMs: summary(loading), filteringMs: summary(filtering),
      usedJSHeapBytes: memory, pageErrors: failures, cpuUtilization: 'NOT MEASURED', renders: 'DOM card count, not React render count' });
    expect(failures).toEqual([]);
  }
  await evidence(info, 'scale', { volumes, limitations: 'Single local browser; no API, database, multiuser concurrency, availability or cloud scale evidence' });
});
