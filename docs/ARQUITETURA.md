# Arquitetura do frontend

Revisão local em 04/11/2026: `84b5ae7` mais integração no working tree. O diagnóstico de 01/10/2026 é histórico. Os diagramas representam a estrutura do código revisado, sem atestar implantação ou comportamento real da API.

```mermaid
flowchart LR
  Browser[Navegador] --> App[Next App Router]
  App --> Auth[AuthProvider]
  Auth --> Doses[LembreteProvider]
  Doses --> Alerts[Alertas em primeiro plano]
  App --> Pages[Páginas e componentes React]
  Pages --> HTTP[apiRequest / ApiError]
  Auth --> HTTP
  Doses --> HTTP
  HTTP --> API[API definida no build]
  Auth <--> Storage[localStorage: token e perfil]
  Pages --> CSV[CSV estático /assets]
```

[layout.tsx](../src/app/layout.tsx) compõe AuthProvider, LembreteProvider, alerta e SidebarProvider. Páginas interativas usam componentes cliente. Rotas protegidas passam por [ProtectedRoute](../src/app/components/ProtectedRoute/ProtectedRoute.tsx); a autorização efetiva de recursos pertence ao backend.

```mermaid
sequenceDiagram
  actor Pessoa
  participant UI as Login
  participant HTTP as apiRequest
  participant API
  participant Auth as AuthContext
  Pessoa->>UI: E-mail e senha
  UI->>HTTP: POST auth/login (público)
  HTTP->>API: Credenciais
  API-->>UI: access_token
  UI->>HTTP: GET usuario/me (Bearer recebido)
  API-->>UI: Envelope data do perfil
  UI->>Auth: login(token, perfil)
  Auth->>Auth: Storage e estado da sessão
  UI-->>Pessoa: Navegação inicial
```

O [cliente HTTP](../src/app/utils/api.ts) monta origem e endpoint, aplica Bearer/Content-Type quando pertinente, interpreta resposta e produz `ApiError` com status, mensagens e Retry-After. Não faz retry automático. Um 401 autenticado invalida a sessão por padrão; a troca de senha usa política operacional própria e revalida o perfil para distinguir senha atual incorreta de token inválido. O evento de invalidação alcança AuthContext.

```mermaid
sequenceDiagram
  participant Form as CardCadastrar
  participant API
  participant Doses as LembreteProvider
  participant Lista
  Form->>Form: Valida campos e calcula instantes
  Form->>API: POST tratamento + Idempotency-Key
  API-->>Form: Remédio e doses (transação)
  Form->>Doses: Atualiza lista
  Lista->>API: PUT dose/id {tomado:true}
  API-->>Lista: Resultado
  Lista->>Doses: Consulta dose/me
```

O frontend usa o contrato atômico para evitar anunciar sucesso após duas gravações independentes. A transação e o escopo da chave são garantias do backend, verificáveis em [E2E isolado](specs/integracao-backend/tasks.md). A interface só preserva a chave de reenvio e bloqueia submissões concorrentes.

O [histórico](../src/app/historico/HistoricoContent.tsx) lê doses autenticadas, filtra por medicamento/status/período e deriva nomes a partir do remédio associado. Respostas obsoletas são descartadas quando a identidade muda. O CSV é baixado via Fetch estático e processado por PapaParse nos componentes de busca; não passa pelo cliente da API.

`NEXT_PUBLIC_API_URL` é incorporada pelo Next no build; [`.env.example`](../.env.example) documenta a origem. `NEXT_PUBLIC_API_ENV=isolated` exige origem explícita. Sem configuração fora de teste isolado permanece o fallback legado de produção. O backend precisa permitir a origem do frontend e os headers usados via CORS. Alterar variável pública exige novo build. Segredos não pertencem às variáveis `NEXT_PUBLIC_*`.

Não há banco local, serviço de push ou confirmação de entrega em segundo plano. Escala e disponibilidade da API são fronteiras externas, detalhadas em [ESCALABILIDADE](ESCALABILIDADE.md).
