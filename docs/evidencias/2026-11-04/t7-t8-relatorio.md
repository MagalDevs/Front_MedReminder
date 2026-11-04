# T7 e T8 — caracterização HTTP e autenticação

Execução: 04/11/2026, 15:39, America/Sao_Paulo. Frontend HEAD `9e5d4ccf1f81b581b65f724565dcdd67527c258c`, checkout compartilhado com alterações não commitadas de outros workers. Windows, Node v26.8.1, npm 11.19.0, Vitest 5.1.0, jsdom; navegador e API reais não utilizados. Dados exclusivamente sintéticos; fetch controlado em todos os testes. Não há cenário temporal nestas duas suítes.

## Arquivos e cobertura

- `tests/unit/api.test.ts`: 42 casos aprovados, UT-01–UT-07 / TEST-01. Módulo HTTP real; apenas fetch, storage e localização são controlados. Cobre barras/opções, Bearer, ausência de token, chamada pública, Content-Type padrão e explícito nos quatro métodos, JSON/texto, cinco status com fallback e prioridade `message > error > errors`, 401 autenticado/público e erro/sucesso em HTTP 200.
- `tests/integration/auth.test.tsx`: 9 casos executados, 8 aprovados e 1 falha esperada vinculada a FE-03. AuthProvider, login, apiRequest e ProtectedRoute reais; somente next/navigation e fronteiras de rede/storage controlados. UT-08 / TEST-01: Usuário, Ana e ana; IT-01 / TEST-02: payload, Bearer do perfil, estado em processamento, sessão e navegação; IT-02: perfil indisponível e logout; IT-03: loading inicial, ausência de token, restauração e logout; IT-10: token inválido, bloqueado.
- `t7-api-isolado.log` e `t8-auth-isolado.log`: saída completa sanitizada, incluindo todos os nomes, contagens, durações e códigos de saída da seleção estrita destes arquivos.

## Comandos pedidos e saída observada

```text
npm run test:unit -- tests/unit/api.test.ts
> vitest run tests/unit --reporter=verbose tests/unit/api.test.ts
Test Files  4 passed (4)
Tests       70 passed (70)
Duration    2.33s
Exit code   0

npm run test:integration -- tests/integration/auth.test.tsx
> vitest run tests/integration --reporter=verbose tests/integration/auth.test.tsx
Test Files  2 passed (2)
Tests       20 passed | 5 expected fail (25)
Duration    4.06s
Exit code   0
```

Esses comandos foram executados exatamente como solicitados. Como os scripts já passam o diretório inteiro ao Vitest, acrescentar o nome do arquivo não restringe a seleção: também foram executados arquivos de outros workers. As contagens acima são da seleção total naquele instante, não apenas deste trabalho. As quatro outras falhas esperadas da execução de integração pertencem à suíte de lembretes de outro worker.

Para resolver essa ambiguidade, as suítes deste trabalho foram executadas separadamente:

```text
npx --no-install vitest run tests/unit/api.test.ts --reporter=verbose
Test Files  1 passed (1)
Tests       42 passed (42)
Duration    1.73s
Exit code   0

npx --no-install vitest run tests/integration/auth.test.tsx --reporter=verbose
Test Files  1 passed (1)
Tests       8 passed | 1 expected fail (9)
Duration    2.25s
Exit code   0

npx --no-install eslint tests/unit/api.test.ts tests/integration/auth.test.tsx
Sem diagnósticos; exit code 0.
```

## Achados e limites

**FE-03 confirmado:** AuthContext aceita token inválido apenas por estar presente no storage, sem consulta remota. O teste `IT-10 TEST-02 [BLOQUEADO FE-03] token inválido não deve habilitar dados protegidos` configura 401 para eventual validação e espera que dados privados não apareçam, mas o componente os renderiza. Usa `it.fails` com a expectativa correta: é um caso bloqueado, não uma aprovação da validade de sessão. Não houve skip.

**Exposição preexistente em logs:** os ramos de erro de apiRequest registram o corpo retornado pela API em console.error; o ramo HTTP 200 também registra mensagens. Isso aparece nos logs com fixtures sintéticas e confirma a observação já prevista no design para manutenção de logs; não foi corrigido nem tratado como sanitização aprovada neste trabalho.

**Seleção dos scripts:** os comandos npm com caminho adicional continuam incluindo todo o diretório da camada. Infra compartilhada não foi alterada; para seleção estrita, usar os comandos diretos acima ou um filtro de nome adequado.

Nenhum arquivo em `src/`, configuração compartilhada, tasks.md, CLAUDE.md ou AGENTS.md foi alterado; não houve git add nem commit. Correção funcional de FE-03 e manutenção dos logs permanecem fora de T7/T8; não foi executado gate funcional/build geral deste checkout compartilhado.
