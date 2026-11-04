# Solução MedReminder

Estado documentado em 04/11/2026, sobre `84b5ae7` e alterações de integração no working tree. Esta descrição acompanha o código local; o aceite com API real é condicionado às evidências de [integração](specs/integracao-backend/tasks.md).

O MedReminder permite cadastrar uma conta, autenticar, buscar medicamentos em catálogo CSV e organizar tratamentos e doses. O fluxo principal liga a busca ao formulário de tratamento, lista os lembretes e permite confirmar uma dose. O histórico consulta doses do usuário; a versão histórica de 01/10/2026 usava simulação, preservada somente no relatório antigo.

Pessoas que acompanham seus medicamentos e cuidadores são os perfis contemplados pelo cadastro. O campo de cuidador não comprova compartilhamento de prontuário nem acesso a contas de terceiros: o servidor continua responsável por identidade e autorização.

| Capacidade no cliente | Fonte e fronteira |
| --- | --- |
| Cadastro público e login | [cadastro](../src/app/cadastro/page.tsx), [login](../src/app/login/page.tsx), cliente HTTP central. Validação do servidor continua obrigatória. |
| Restauração da sessão | [AuthContext](../src/app/contexts/AuthContext.tsx) consulta `/usuario/me` antes de publicar sessão restaurada. Token/perfil locais permanecem acessíveis ao JavaScript da origem. |
| Busca no catálogo | [SearchBar](../src/app/components/SearchBar/SearchBar.tsx), [CSV](../public/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv). Busca por substring sem distinguir caixa, sem normalização de acentos. |
| Tratamento e confirmação | [CardCadastrar](../src/app/components/CardCadastrar/cardCadastrar.tsx), [Lembrete](../src/app/components/AlarmeDose/Lembrete.tsx). Fluxo atômico e idempotência usam o contrato da API. |
| Histórico de doses | [HistoricoContent](../src/app/historico/HistoricoContent.tsx) lê `/dose/me`, sem geração aleatória de registros. Persistência real depende da API. |
| Perfil e senha | [Configurações](../src/app/Configuracoes/ConfiguracoesContent.tsx), contratos distintos para atualização de perfil e senha. Foto não tem contrato disponível. |

Os alertas dependem da página aberta e do navegador em execução. Não há comprovação de push em segundo plano, entrega garantida ou monitoramento clínico. A aplicação registra a informação fornecida pela pessoa; não comprova ingestão do medicamento.

Limitações e aceite são rastreados em [FE-02 a FE-11](BACKLOG.md), nas [specs de integração](specs/integracao-backend/README.md) e no [relatório de qualidade](RELATORIO_QUALIDADE.md). Testes com rede simulada aprovam o comportamento do cliente; persistência, isolamento entre contas e autorização exigem E2E real. A avaliação de [acessibilidade](evidencias/2026-11-04/nonfunctional/README.md) encontrou controles sem nome/foco e mantém etapas manuais pendentes. CI remoto, operação cloud e concorrência não foram comprovados nesta rodada.
