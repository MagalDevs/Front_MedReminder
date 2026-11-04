# Correções dos checks de CI

Diagnóstico da execução [41905158770](https://github.com/MagalDevs/Front_MedReminder/actions/runs/41905158770), sobre `8491a88`: lint Node 22/24 reprovado por sete erros e dois avisos; funcional com 50 casos atendendo às expectativas e três snapshots reprovados. Build, tipos, unitários, integração e proteção de cobertura passaram nessa execução remota.

## Alterações

- SearchBar/CardBusca calculam filtros a partir dos dados atuais durante render, com memoização. A seleção explícita de duplicados/prefixos, callbacks e regras de acentos/espaços permanecem cobertas; quatro regressões de gesto foram acrescentadas.
- Nome/tipo do tratamento e seleção da query são ajustados quando a prop/query muda, sem cascata de setState dentro de efeito. O callback do formulário pai é estável.
- A home preserva o placeholder de hidratação com `useSyncExternalStore`, usando snapshot inicial idêntico no servidor e na hidratação.
- O efeito da lista declara `getLembretes` como dependência. A função já é memoizada no provider; atualização e confirmação continuam testadas.
- O cliente HTTP limpa a sessão e emite o evento já existente. AuthProvider trata esse evento, limpa o estado em memória e navega com `router.push('/login')`. Não há atribuição direta de URL interna; testes do cliente verificam a notificação e um teste entre provider/cliente real comprova a navegação e limpeza.
- Somente os três snapshots de novo medicamento foram atualizados: os dois inputs nativos de data e o input de hora são mascarados, mantendo asserções de quantidade e valores canônicos `''`, `2026-11-04`, `10:00`. O restante da captura continua comparado. Não houve aumento de tolerância, alteração visual do produto, skip ou desativação de regras.
- O comando de lint no workflow exige também zero avisos (`--max-warnings=0`). Comentários antigos que descreviam falhas intencionais/ausência de execução GitHub foram atualizados.

A divergência de captura era a apresentação regional dos controles nativos: a referência local mostrava `dd/mm/yyyy`, `04/11/2026`, `10:00`; o Windows remoto mostrava `mm/dd/yyyy`, `11/04/2026`, `10:00 AM`. O valor da data era o mesmo. `locale: pt-BR` e o fuso já estavam configurados, portanto adicioná-los novamente não resolveria a apresentação nativa.

## Verificação local

- `npx eslint . --max-warnings=0`: saída 0, zero erros e avisos.
- `npx tsc --noEmit`: saída 0.
- Build de produção executado pelo Playwright: aprovado.
- `CI=1 npx playwright test --project=functional --workers=4 --retries=0`: 53 casos atenderam às expectativas, incluindo um expected failure preexistente da rota FE-03. Capturas atualizadas apenas para os três controles mascarados; as outras nove referências permaneceram inalteradas.
- `npx vitest run --coverage --reporter=dot`: 16 arquivos, 321 aprovados e quatro expected fail conhecidos dos alertas. O helper de envio do teste de tratamento passou a aguardar `act` assíncrono; suas assertivas de reenvio e idempotência foram preservadas.
- Cobertura: linhas 794/1020 (77,84%), branches 600/814 (73,71%), funções 170/215 (79,06%), statements 843/1094 (77,05%). `node scripts/check-coverage.mjs` aprovou as quatro métricas contra a baseline versionada original, sem retirar arquivos do escopo.

Os resultados remotos desta correção são publicados pelo [workflow quality](https://github.com/MagalDevs/Front_MedReminder/actions/workflows/quality.yml). O E2E real do GitHub continua condicionado às variáveis do ambiente isolado; seu job de bloqueio não é aprovação de persistência. Esta correção não conclui revisão manual de acessibilidade nem os defeitos FE-03/FE-05 fora do escopo dos checks vermelhos.

A execução remota [41915065573](https://github.com/MagalDevs/Front_MedReminder/actions/runs/41915065573) confirmou lint, build, tipos e cobertura aprovados em Node 22/24. No funcional, 52 passaram e restou apenas a captura de 360px: o controle de hora tinha largura mínima intrínseca 16px maior no Windows em formato AM/PM (672 pixels no diff, somente na borda da máscara). `native-controls.css`, aplicado apenas durante essa captura via `stylePath`, normaliza a largura mínima ao `w-28` já declarado pelo produto (7rem). Valores continuam testados, tolerância permanece intacta e o CSS da aplicação não é alterado.
