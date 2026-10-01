# Apresentação e aceite do MVP

## Roteiro de 8 a 10 minutos

| Tempo | Conteúdo | Evidência a mostrar |
| --- | --- | --- |
| 1 min | Problema: organizar tratamentos e confirmar doses; público e escopo | Inventário e critérios de aceite |
| 1 min | Arquitetura web + mobile + NestJS + persistência + Firebase no mobile | CLOUD.md e desenho de arquitetura |
| 4 min | Criar/login com conta sintética; buscar medicamento; configurar doses; consultar lembretes; marcar uma dose; recarregar e conferir persistência | Gravação/capturas da web e do dispositivo com ID do caso de teste |
| 1 min | Nuvem: ambiente, persistência e monitoramento | Deploy identificado, gráfico/status e evidência de restart |
| 1 min | Qualidade: execução, resultados, problemas e evolução | Relatório com logs; comparar baseline com revalidação |
| 1–2 min | Prioridades restantes e próximos ciclos | Backlog e planejamento |

## Preparação

- Usar duas contas sintéticas (A e B), medicamento de demonstração e doses em horários próximos.
- Confirmar acesso à API, web, Firebase e dispositivo antes do ensaio.
- Registrar commit de cada repositório e ambiente; ocultar tokens, senhas e dados pessoais.
- Não apresentar histórico aleatório como adesão real, botão sem endpoint como implementado ou lista de lembretes como notificação em segundo plano.
- Demonstração offline gravada pode servir como apoio; identificar a data/ambiente da gravação.

## Checklist de entrega

- [ ] API, web e mobile iniciam a partir das instruções documentadas.
- [ ] Fluxo crítico passa em homologação e o resultado continua após recarregar/reiniciar.
- [ ] Isolamento das contas A/B demonstrado.
- [ ] P0 fechados com evidências de revalidação.
- [ ] Infra/configuração e limite de escala documentados.
- [ ] Monitoramento básico e recuperação demonstrados.
- [ ] Plano de testes, relatório, logs e capturas disponíveis.
- [ ] Limitações e itens pós-MVP explicitados.

Estado inicial: este checklist é um gate de aceite, não atestado de aprovação. Consultar RELATORIO_QUALIDADE.md para os resultados efetivamente executados.

## Evidências de evolução

Guardar baseline e revalidações em pastas datadas. Vincular cada correção: ID do backlog → PR/commit → caso de teste → log/captura → resultado. Não preencher testes pendentes como aprovados. A documentação criada e os logs de validação são evidências desta etapa; execução funcional em navegador/dispositivo e operação cloud exigem evidências próprias.
