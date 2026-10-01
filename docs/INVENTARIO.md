# Inventário e diagnóstico — frontend

Baseline: 01/10/2026, commit ffd8893b423879194e512f65de8db7de099d2b06. Análise local de código; funcionalidades não foram aprovadas por inspeção.

| Capacidade | Arquivos | Estado / oportunidade |
| --- | --- | --- |
| Next.js 15, React 19 | package.json, src/app/layout.tsx | build e lint disponíveis; sem script/suíte de testes |
| Busca de medicamentos em CSV | SearchBar, CardBusca, public/assets/*.csv | Busca local; medir carregamento e filtrar sem travar |
| Cadastro/login e sessão | cadastro/page.tsx, login/page.tsx, AuthContext | JWT da API; localStorage; presença de token assume autenticação |
| Medicamentos | MeusMedicamentosContent, CardCadastrar | Lista própria, criação/edição/exclusão e envio de doses; testar falha parcial |
| Lembretes | lembreteContext, MeusLembretesContent, AlarmeDose | Consulta /dose/me e PUT tomado; alertas com setTimeout dependem da página aberta |
| Histórico | historico/HistoricoContent.tsx | Gera registros e estados aleatórios, consulta /remedio sem token; não representa histórico real |
| Perfil/configurações | ConfiguracoesContent.tsx | Consulta/atualiza perfil; chama usuario/senha e usuario/foto ausentes no backend |
| Nuvem | utils/api.ts e chamadas diretas | URL Render fixa e repetida; deploy frontend não comprovado |

Possibilidades prioritárias: histórico persistido, sessão validada, tratamento de falhas, timers com limpeza/sem duplicação, ambiente parametrizado e testes do fluxo principal. Não afirmar alertas com navegador fechado ou adiamento persistido.
