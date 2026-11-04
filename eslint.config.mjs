import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Flat config nativa do eslint-config-next 16 (sem FlatCompat), mesmas regras
// que next/core-web-vitals + next/typescript aplicavam antes. Nenhuma regra
// é desativada aqui; achados preexistentes ficam visíveis no lint.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Padrões do eslint-config-next
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Artefatos gerados por dependências e pelas ferramentas de teste
    "node_modules/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
