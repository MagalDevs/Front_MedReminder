import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const frontendUrl = 'http://localhost:3000';
const backendUrl = 'http://localhost:3001';
const backendDirectory = ['../medreminder-backend', '../backend']
  .map((directory) => path.resolve(__dirname, directory))
  .find((directory) => {
    const manifest = path.join(directory, 'package.json');
    return existsSync(manifest)
      && JSON.parse(readFileSync(manifest, 'utf8')).name === 'medreminder-backend';
  });
if (!backendDirectory) throw new Error('Backend local de testes não encontrado.');

export default defineConfig({
  testDir: './tests/feedback',
  outputDir: './test-results/feedback',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    baseURL: frontendUrl,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  webServer: [
    {
      cwd: backendDirectory,
      command: 'npm run build && node dist/src/main.js',
      env: {
        NODE_ENV: 'test',
        PORT: '3001',
        JWT_SECRET: 'feedback-browser-synthetic-secret-at-least-32-characters',
        FIREBASE_ENABLED: 'false',
        CORS_ORIGINS: frontendUrl,
      },
      url: `${backendUrl}/health/ready`,
      reuseExistingServer: false,
      timeout: 300_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run build -- --webpack && npm run start -- --port 3000',
      env: { NEXT_PUBLIC_API_URL: backendUrl },
      url: frontendUrl,
      reuseExistingServer: false,
      timeout: 300_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
