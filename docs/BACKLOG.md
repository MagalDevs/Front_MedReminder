# Backlog priorizado — frontend

Todos ABERTOS. P0 bloqueia entrega; P1 completa confiabilidade; P2 evolução. Dias estimados; papéis sugeridos.

| ID | Prioridade | Melhoria e evidência | Aceite | Dependência | Estimativa / papel |
| --- | --- | --- | --- | --- | --- |
| FE-01 | P0 | Instalação/build e lint reproduzíveis | npm ci, build e lint sem erro; comandos/Node registrados | Nenhuma | 0,5–1 / Web |
| FE-02 | P0 | Histórico real; HistoricoContent usa Math.random e GET /remedio sem token | Consulta autenticada /dose/me; mostra apenas estados persistidos; confirmação refletida após reload; nada simulado | BE-02/03 | 1–2 / Web + Qualidade |
| FE-03 | P0 | Validar sessão antes de dados protegidos; AuthContext confia em presença de token | Token inválido/expirado leva a login; logout limpa dados/lembretes; refresh preserva apenas sessão válida | BE-01/03 | 1 / Web |
| FE-04 | P1 | Alinhar configurações com API; senha/foto inexistentes | Implementar contratos backend ou retirar/desabilitar ações indisponíveis com mensagem clara; erro não anuncia sucesso | BE-06, MO-04 | 0,5–1 / Web |
| FE-05 | P1 | Ciclo de vida e confiabilidade dos alertas; setTimeout sem limpeza | Um alerta por dose pendente; cancela timers ao logout/edição; dose tomada não dispara; simultâneas não se perdem; documenta primeiro plano | FE-03 | 1–2 / Web |
| FE-06 | P1 | URL por ambiente e único cliente HTTP; múltiplas URLs fixas | Ambiente local/homologação sem editar telas; todas chamadas usam cliente central; 401 tratado consistentemente | BE-10 | 0,5–1 / Web + Nuvem |
| FE-07 | P1 | Testes de componentes e fluxo integrado | Suíte cobre login, cadastro, dose, histórico e falhas; evidências sanitizadas; CI executa | FE-01/02/03 | 2 / Qualidade |
| FE-08 | P1 | Estados de carregamento e falha parcial ao criar tratamento | Bloqueia submit duplo; falha no lote não anuncia tratamento completo; retry sem duplicação | BE-09 | 1 / Web |
| FE-09 | P1 | Acessibilidade e responsividade | Fluxo por teclado; labels, foco de modal, contraste; 360px/768px/desktop sem perda de controles | FE-01 | 1 / Web + Qualidade |
| FE-10 | P2 | Otimizar busca e versionar catálogo CSV | Mede tempo/memória; debounce/cache; origem e data do catálogo documentadas | FE-07 | 1 / Web |
| FE-11 | P2 | Notificação fora da página e adiar persistido | Escolher estratégia com API; permissão/negação testadas; status salvo | BE-12 | 2–3 / Web + API |

Prioridade de produto: fluxo correto e dados reais antes de expansão de recursos. Histórico simulado é bloqueio para apresentar histórico como parte do MVP; se excluído da demonstração, declarar a limitação.
