# Organização dos testes

Esta pasta reúne o catálogo de cenários e o modelo de execução. A existência deste diretório não implica que os testes foram executados ou aprovados.

Consulte ../docs/PLANO_TESTES.md para estratégia e comandos e ../docs/RELATORIO_QUALIDADE.md para o resultado inicial. Os logs ficam em ../docs/evidencias/2026-10-01/.

Os testes automatizados existentes do backend permanecem em src/**/*.spec.ts e test/; não foram movidos para não quebrar a configuração Jest. Web e mobile precisam de uma suíte funcional própria conforme o backlog.

Para cada rodada, copiar REGISTRO_EXECUCAO.md para docs/evidencias/<data>/, preencher casos e anexar logs/capturas sanitizados. Não usar produção para mutações ou teste de carga.
