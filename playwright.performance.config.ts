import { defineConfig, devices } from '@playwright/test';

// Compare already-built local revisions without rebuilding either server.
const target = process.env.NF_TARGET_URL;
if (!target || !['localhost', '127.0.0.1', '[::1]'].includes(new URL(target).hostname)) {
  throw new Error('NF_TARGET_URL must identify an explicitly started loopback build.');
}

export default defineConfig({
  testDir: './tests/nonfunctional',
  testMatch: '**/performance.spec.ts',
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: './test-results/performance-comparison',
  use: { ...devices['Desktop Chrome'], baseURL: target, trace: 'off' },
});
