#!/usr/bin/env node
// Proteção de cobertura (DOC-06 / T32): compara coverage/coverage-summary.json
// com a baseline versionada tests/coverage-baseline.json.
//
// Regra: nenhuma das quatro métricas (linhas, branches, funções, statements)
// pode ter percentual menor que o da baseline para o mesmo escopo. Não há
// percentual mínimo arbitrário: o piso é a própria baseline. A comparação é
// exata (covered/total como fração), sem tolerância e sem arredondamento.
//
// Uso:
//   node scripts/check-coverage.mjs                      compara; sai 1 se alguma métrica cair
//   node scripts/check-coverage.mjs --print              imprime o JSON da medição atual (para criar/revisar a baseline)
//   node scripts/check-coverage.mjs --summary <arq> --baseline <arq>
//
// Códigos de saída: 0 = nenhuma métrica caiu; 1 = queda, escopo reduzido ou
// dado ausente/inválido; 2 = uso incorreto. Atualizar a baseline para cima é
// uma decisão revisada (edição do arquivo versionado), nunca automática.
import fs from "node:fs";
import path from "node:path";

const METRICS = ["lines", "branches", "functions", "statements"];
const LABEL = { lines: "linhas", branches: "branches", functions: "funções", statements: "statements" };

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  const value = process.argv[i + 1];
  if (!value || value.startsWith("--")) {
    console.error(`ERRO: ${name} exige um valor.`);
    process.exit(2);
  }
  return value;
}

const summaryPath = arg("--summary", "coverage/coverage-summary.json");
const baselinePath = arg("--baseline", "tests/coverage-baseline.json");
const printOnly = process.argv.includes("--print");

function readJson(file, what) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`ERRO: não foi possível ler ${what} (${file}): ${error.message}`);
    process.exit(1);
  }
}

// Mesmo critério do Vitest/Istanbul: trunca (não arredonda) em 2 casas.
function pct(covered, total) {
  return Math.floor((covered / total) * 10000) / 100;
}

function rel(file) {
  return path.relative(process.cwd(), file).replaceAll("\\", "/");
}

function measure(summary) {
  const total = summary.total;
  if (!total) {
    console.error(`ERRO: ${summaryPath} sem a chave "total".`);
    process.exit(1);
  }
  const metrics = {};
  for (const m of METRICS) {
    const { covered, total: denominator } = total[m] ?? {};
    if (!Number.isInteger(covered) || !Number.isInteger(denominator) || denominator <= 0) {
      console.error(`ERRO: métrica ${m} inválida ou com denominador zero em ${summaryPath}.`);
      process.exit(1);
    }
    metrics[m] = { covered, total: denominator, pct: pct(covered, denominator) };
  }
  const files = Object.keys(summary)
    .filter((key) => key !== "total")
    .map(rel)
    .sort();
  return { metrics, files };
}

const current = measure(readJson(summaryPath, "o resumo de cobertura"));

if (printOnly) {
  console.log(JSON.stringify({ metrics: current.metrics, files: current.files }, null, 2));
  process.exit(0);
}

const baseline = readJson(baselinePath, "a baseline");
let failed = false;

for (const m of METRICS) {
  const base = baseline.metrics?.[m];
  if (!base || !Number.isInteger(base.covered) || !Number.isInteger(base.total) || base.total <= 0) {
    console.error(`ERRO: baseline sem a métrica ${m} válida em ${baselinePath}.`);
    failed = true;
    continue;
  }
  const cur = current.metrics[m];
  // cur.covered / cur.total >= base.covered / base.total, sem ponto flutuante.
  const dropped = cur.covered * base.total < base.covered * cur.total;
  const improved = cur.covered * base.total > base.covered * cur.total;
  const status = dropped ? "QUEDA" : improved ? "melhorou" : "igual";
  const line = `${LABEL[m].padEnd(10)} baseline ${base.covered}/${base.total} (${pct(base.covered, base.total).toFixed(2)}%)  atual ${cur.covered}/${cur.total} (${cur.pct.toFixed(2)}%)  ${status}`;
  if (dropped) {
    failed = true;
    console.error(line);
  } else {
    console.log(line);
  }
}

// Mesmo escopo: um arquivo da baseline não pode sumir do relatório (isso
// reduziria o denominador e esconderia código não coberto).
const missing = (baseline.files ?? []).filter((file) => !current.files.includes(file));
if (missing.length > 0) {
  failed = true;
  console.error(`ERRO: arquivos da baseline ausentes da cobertura atual (escopo reduzido): ${missing.join(", ")}`);
}
const added = current.files.filter((file) => !(baseline.files ?? []).includes(file));
if (added.length > 0) {
  console.log(`Aviso: arquivos novos no escopo (entram no denominador): ${added.join(", ")}`);
}

if (failed) {
  console.error("FALHA: a cobertura diminuiu em relação à baseline (ou o escopo/dado é inválido).");
  process.exit(1);
}
console.log("OK: nenhuma métrica ficou abaixo da baseline. Se melhorou, revise e atualize tests/coverage-baseline.json.");
