import { defineConfig, devices } from "@playwright/test";

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

// Build de produção servido na porta 3001. Em CI nunca reutiliza um servidor
// existente (evita testar um build desatualizado).
export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: BASE_URL,
    // Trace só na primeira repetição. Traces e relatórios ficam fora do git e
    // podem conter dados da sessão; não publicar sem sanitizar.
    trace: "on-first-retry",
    // Sem storageState: cada teste usa um contexto novo e sem credenciais.
  },
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      // Navegador real com API controlada por interceptação (mocks).
      name: "functional",
      testDir: "./tests/functional",
      testMatch: "**/*.spec.ts",
      testIgnore: "**/backend-cors.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Provas CORS reais, separadas da regressão funcional com API simulada.
      name: "isolated-cors",
      testDir: "./tests/functional",
      testMatch: "**/backend-cors.spec.ts",
      use: { ...devices["Desktop Chrome"], trace: "off" },
    },
    {
      // Navegador real contra API isolada. Exige E2E_API_URL; sem ela os
      // testes falham com BLOQUEADO (ver tests/support/e2e.ts), nunca são pulados.
      name: "e2e",
      testDir: "./tests/e2e",
      testMatch: "**/*.spec.ts",
      use: { ...devices["Desktop Chrome"], trace: "off" },
    },
    {
      name: "nonfunctional",
      testDir: "./tests/nonfunctional",
      testMatch: "**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
