# Plano de testes — frontend

## Preparação

Usar API em homologação isolada, contas sintéticas A/B e navegador identificado. Ainda não há suíte automatizada própria. Comandos existentes:

```powershell
npm ci
npm run build
npm run lint
# Após build aprovado:
npm run start -- --port 3001
```

Se next lint não funcionar na versão instalada, registrar erro e executar ESLint diretamente sem --fix, adaptando script no FE-01. Não confundir build/lint com teste funcional.

## Funcionais

| Caso | Passos | Esperado | Prioridade |
| --- | --- | --- | --- |
| WEB-01 | Cadastro válido/inválido; login válido e senha errada | Mensagem correta; sem travar/duplicar; acesso somente válido | Crítica |
| WEB-02 | Abrir rota protegida sem token/expirado; recarregar/logout | Redireciona; dados de conta anterior não permanecem | Crítica |
| WEB-03 | Buscar CSV; selecionar; configurar tratamento e doses | Medicamento próprio e doses com horários corretos | Crítica |
| WEB-04 | Marcar tomado e recarregar lista/histórico | Persistência; histórico real coerente com API | Crítica |
| WEB-05 | Usar conta B após A; tentar ID de recurso A | Nenhum dado A; erro de acesso consistente | Crítica |
| WEB-06 | Editar/excluir medicamento; falha da API no lote | Sem confirmação falsa; recuperação definida | Alta |
| WEB-07 | Dose próxima, duas simultâneas, dose tomada, logout antes do horário | Alerta único, fila preservada e timers cancelados | Alta |
| WEB-08 | Atualizar perfil; trocar senha/foto | Apenas ações suportadas; erro não tratado como sucesso | Alta |
| WEB-09 | Simular offline/500 e submit duplo | Mensagem e retry; sem duplicação ou bloqueio eterno | Alta |

WEB-04 está condicionado a FE-02: os registros atuais são simulados. WEB-07 comprova primeiro plano; testar aba suspensa/fechada separadamente e registrar limitação.

## Não funcionais

| Caso | Procedimento | Aceite proposto |
| --- | --- | --- |
| NF-WEB-01 | Teclado, leitor de tela, contraste/foco e telas 360/768/1440px | Controles acessíveis e fluxo sem perda de conteúdo |
| NF-WEB-02 | Medir busca após carregar catálogo, 10 consultas | p95 < 500 ms no dispositivo documentado; tempo de carga registrado |
| NF-WEB-03 | Medir rotas e bundle após build/deploy | Baseline Lighthouse/performance registrado; metas definidas após baseline |
| NF-WEB-04 | Inspecionar logs/network/storage com dados sintéticos | Sem senha em logs; campos sensíveis minimizados; 401 não mantém sessão |

FE-07 prevê testes de componentes para sessão/formulários/alertas e E2E para fluxo API. Aceite: build aprovado, todos críticos aprovados, P0 resolvidos, evidências por caso. Testes manuais pendentes não foram executados nesta rodada.
