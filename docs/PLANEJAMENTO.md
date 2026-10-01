# Planejamento integrado do MVP

Data-base: 01/10/2026. Plano proposto de três ciclos de cinco dias úteis, contado a partir do início acordado pela equipe. Estimativas em dias de trabalho, a confirmar pela equipe; responsáveis são papéis, não pessoas já designadas.

## Objetivo e escopo

Entregar cadastro/login, busca de medicamentos, cadastro de tratamento com doses, consulta dos próprios medicamentos e lembretes e confirmação persistida de dose, acessíveis pela web e pelo mobile sobre a mesma API. O histórico só é aceito com dados reais. Alertas web em primeiro plano e notificações nativas são capacidades diferentes: demonstrar apenas o comportamento comprovado.

P0 bloqueia o aceite; P1 completa confiabilidade e apresentação; P2 é evolução posterior. Itens do backlog são propostas abertas, não funcionalidades implementadas nesta entrega documental.

## Sequência e dependências

| Ciclo | Atividades | Responsável sugerido | Dependência | Saída verificável |
| --- | --- | --- | --- | --- |
| 1 — estabilização | Instalação reproduzível, build/typecheck, login sem travamento, isolamento entre usuários, contratos de API e URLs por ambiente | Desenvolvimento API/web/mobile + Qualidade | Nenhuma | Logs, testes de identidade, fluxo básico sem erros |
| 2 — integração das disciplinas | Persistência cloud e recuperação; configuração por ambiente; monitoramento; testes integrados; corrigir histórico e sessões | Nuvem + desenvolvimento + Qualidade | Ciclo 1; ambiente de homologação | Infra documentada, evidência de restart/restore, relatório de testes |
| 3 — validação e apresentação | Regressão integrada em navegador e dispositivo, desempenho, acessibilidade, coleta de evidências, ensaio e fechamento P0 | Qualidade + Nuvem + equipe MVP | Ambiente estável e correções integradas | MVP demonstrável, relatório final e roteiro de apresentação |

Cadência: reunião de 15 minutos por dia para bloqueios; revisão ao final de cada ciclo; um item por PR com ID do backlog, aceite, validação e evidência. Limitar trabalho simultâneo a um item por responsável.

## Acordos entre repositórios

1. Backend define autenticação JWT/Firebase, envelopes e códigos HTTP; web/mobile validam ambos com a mesma conta sintética quando houver vinculação de identidade.
2. Usar datas ISO com offset/UTC no transporte; exibir no fuso local. Testar virada de dia e intervalo do tratamento.
3. Identidade e propriedade dos recursos vêm do servidor; nunca aceitar usuarioId arbitrário como autorização.
4. Criar medicamento e doses precisa ter comportamento definido diante de falha parcial; evitar duplicação em novas tentativas.
5. Nuvem disponibiliza ambiente e observabilidade antes da carga; Qualidade usa somente dados sintéticos e ambiente autorizado.

## Critérios de entrada e conclusão

Entrada: tarefa com comportamento observado, cenário esperado, dependências e estimativa. Conclusão: código revisado, build e verificações pertinentes aprovados, critérios de aceite demonstrados, documentação e evidências atualizadas.

Aceite do MVP: nenhum P0 aberto; todos os cenários críticos funcionais aprovados na API, web e mobile; um cenário completo com persistência após reinício; nenhuma leitura/escrita de outra conta; logs sem senha/token; configuração cloud identificada; monitoramento comprovado; limitações restantes explicitadas. Não marcar o MVP funcional apenas pela presença de telas ou por build aprovado.

## Governança das disciplinas

| Disciplina | Responsabilidade | Artefatos | Aceite |
| --- | --- | --- | --- |
| Computação em Nuvem 2 | Ambiente, persistência, capacidade, disponibilidade e operação | CLOUD.md, configuração/script de infra, evidências de deploy, restart/restore e monitoramento | Ambiente reproduzível; URL HTTPS; política de escala compatível com banco |
| Qualidade e Teste de Software | Estratégia, execução, regressão, métricas e defeitos | PLANO_TESTES.md, tests/, RELATORIO_QUALIDADE.md, evidencias/ | Resultado rastreável por caso, ambiente, commit e comando |
| Equipe MVP | Integração e demonstração do fluxo de valor | INVENTARIO.md, BACKLOG.md, APRESENTACAO_MVP.md | Fluxo real demonstrado e pendências declaradas |
