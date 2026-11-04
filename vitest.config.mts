import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

// Fuso fixo para os cenários temporais (test-plan.md, "Fixtures and Isolation").
// Precisa ser definido antes de os workers iniciarem.
process.env.TZ = "America/Sao_Paulo";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

// O Vitest sai com 0 quando um filtro de nome (-t) deixa todos os testes
// "skipped". Para impedir sucesso sem execução, a execução termina com código 1
// se nenhum teste passou ou falhou. Usa apenas a API pública (configureVitest,
// onClose, state) e independe de --reporter na linha de comando.
function failWhenNoTestExecuted(): Plugin {
  const registered = new WeakSet<object>();
  return {
    name: "medreminder:fail-when-no-test-executed",
    configureVitest({ vitest }) {
      // Chamado uma vez por projeto (unit/integration); registrar só uma vez.
      if (registered.has(vitest)) return;
      registered.add(vitest);
      vitest.onClose(() => {
        let executed = 0;
        for (const testModule of vitest.state.getTestModules()) {
          for (const testCase of testModule.children.allTests()) {
            const { state } = testCase.result();
            if (state === "passed" || state === "failed") executed += 1;
          }
        }
        if (executed === 0) {
          console.error(
            "ERRO: nenhum teste foi executado (seleção vazia ou todos os testes ignorados pelo filtro).",
          );
          process.exitCode = 1;
        }
      });
    },
  };
}

// Sem passWithNoTests: seleção vazia (diretório sem testes ou filtro sem
// correspondência) deve terminar com código diferente de zero.
export default defineConfig({
  plugins: [react(), failWhenNoTestExecuted()],
  resolve: {
    alias: { "@": srcDir },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: false,
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    coverage: {
      provider: "v8",
      // `include` coloca no denominador também os arquivos de src nunca importados
      // (DOC-06): fonte não exercitada conta como 0% em vez de sumir do relatório.
      include: ["src/**/*.{ts,tsx}"],
      // Exclusões justificadas por arquivo/padrão (nenhuma outra é permitida):
      // - src/**/*.d.ts: apenas declarações de tipo, sem código executável.
      // Nenhum arquivo de produto (página, componente, contexto, util) é excluído.
      exclude: ["src/**/*.d.ts"],
      // json-summary alimenta scripts/check-coverage.mjs (comparação com
      // tests/coverage-baseline.json); json (coverage-final.json), lcov e html
      // são os relatórios completos; text-summary imprime as 4 métricas no log.
      reporter: ["text-summary", "json-summary", "json", "lcov", "html"],
      reportsDirectory: "./coverage",
    },
    // Diretórios separados por tipo; `npm run test:unit` e `test:integration`
    // selecionam cada um pelo caminho.
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
