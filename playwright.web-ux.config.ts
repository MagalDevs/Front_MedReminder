import { defineConfig } from '@playwright/test';
import config from './playwright.config';

// Keep the developer's port 3000 server intact while testing a fresh build.
const port = Number(process.env.WEB_UX_TEST_PORT || 3102);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('WEB_UX_TEST_PORT must be an integer between 1024 and 65535');
}

export default defineConfig({
  ...config,
  use: { ...config.use, baseURL: `http://localhost:${port}` },
  webServer: {
    ...config.webServer,
    command: `npm run build -- --webpack && npm run start -- --port ${port}`,
    url: `http://localhost:${port}`,
  },
});
