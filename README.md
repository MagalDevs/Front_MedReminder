# MedReminder — Frontend

Aplicação web para organizar medicamentos, configurar tratamentos e acompanhar a confirmação de doses. Este repositório contém a interface em português do MedReminder, integrada à API NestJS compartilhada com o aplicativo mobile.

## Estado do projeto

O frontend contém busca de medicamentos, cadastro/login, gerenciamento de medicamentos e lembretes, confirmação de doses e edição de perfil. A validação técnica de **01/10/2026** aprovou instalação, build e lint, com um aviso de dependência de `useEffect`.

O aceite funcional do MVP ainda depende da execução do fluxo integrado e do fechamento das tarefas P0. O histórico atual gera registros simulados; alertas dependem da página aberta; troca de senha e foto chamam endpoints ainda ausentes no backend analisado. Consulte o [relatório de qualidade](docs/RELATORIO_QUALIDADE.md) para os resultados e limites da validação.

## Funcionalidades e rotas

| Rota | Conteúdo | Situação |
| --- | --- | --- |
| `/` | Página inicial e busca de medicamentos no catálogo CSV | Implementada; desempenho e acessibilidade a validar |
| `/cadastro` | Cadastro de usuário na API | Implementada; fluxo integrado a validar |
| `/login` | Login com JWT e consulta de perfil | Implementada; validação de sessão a melhorar |
| `/novo-medicamento` | Seleção, configuração de tratamento e criação de doses | Implementada; recuperação de falha parcial pendente |
| `/meus-medicamentos` | Lista e manutenção dos medicamentos do usuário | Implementada; isolamento e regressão a validar |
| `/meus-lembretes` | Lista de doses, filtros e confirmação de dose tomada | Implementada; ciclo de atualização/alertas a melhorar |
| `/historico` | Histórico e filtros | Usa registros simulados; substituição planejada |
| `/Configuracoes` | Perfil, senha e foto | Perfil integrado; senha/foto dependem de contratos ausentes |

A rota `/Configuracoes` utiliza inicial maiúscula, conforme a pasta existente.

## Tecnologias

- Next.js 15 com App Router e React 19.
- TypeScript e Tailwind CSS.
- React Context para autenticação, lembretes e sidebar.
- Papa Parse para leitura do catálogo CSV.
- Lucide React, React Datepicker e React Input Mask.
- ESLint para análise estática.

As versões efetivas são determinadas por `package-lock.json`. O ambiente usado na validação inicial foi Windows, Node.js **v24.21.0** e npm **11.19.0**; isso registra o ambiente testado, sem definir uma matriz de compatibilidade completa.

## Executar localmente

### 1. Obter o projeto e instalar

```bash
git clone https://github.com/MagalDevs/Front_MedReminder.git
cd Front_MedReminder
npm ci
```

### 2. Iniciar em desenvolvimento

```bash
npm run dev -- --port 3001
```

Abra [http://localhost:3001](http://localhost:3001). A porta 3001 permite executar uma API local na porta 3000 sem conflito. O comando `npm run dev` sem porta usa a porta padrão do Next.js.

### 3. Compilar e iniciar o build

```bash
npm run build
npm run start -- --port 3001
```

### 4. Analisar o código

```bash
npm run lint
```

Não existe script `npm test` nem suíte funcional automatizada própria nesta versão. A tarefa [FE-07](https://github.com/MagalDevs/Front_MedReminder/issues/31) prevê testes de componentes, E2E e execução em CI.

## Integração com a API

A URL atualmente utilizada é `https://medreminder-backend.onrender.com`. Ela está definida em `src/app/utils/api.ts` e repetida em chamadas diretas nas telas de cadastro, histórico e configurações. A disponibilidade do serviço e a implantação cloud não foram comprovadas pela rodada local.

| Operação | Endpoint utilizado |
| --- | --- |
| Cadastro | `POST /usuario` |
| Login web | `POST /auth/login` |
| Consultar/atualizar perfil | `GET /usuario/me`, `PATCH /usuario/me` |
| Criar e listar medicamentos próprios | `POST /remedio`, `GET /remedio/me` |
| Atualizar/excluir medicamento | `PUT /remedio/:id`, `DELETE /remedio/:id` |
| Criar lote de doses | `POST /dose/doses` |
| Consultar/confirmar doses | `GET /dose/me`, `PUT /dose/:id` |

O cliente central adiciona o token Bearer salvo em `localStorage` sob `access_token`; o perfil é armazenado em `user_data`. O tratamento de sessão e a limpeza dos dados estão planejados em [FE-03](https://github.com/MagalDevs/Front_MedReminder/issues/27).

**Configuração por ambiente:** `NEXT_PUBLIC_API_URL` ainda não é lida pelo código. Criar um `.env.local` com essa variável não muda a API utilizada nesta versão. A implementação está em [FE-06](https://github.com/MagalDevs/Front_MedReminder/issues/30). Para integrar uma API local antes dessa tarefa, é necessário ajustar as URLs existentes e a configuração CORS do backend.

## Estrutura

```text
src/app/
  components/          Busca, formulários, sidebar e alertas
  contexts/            Autenticação, lembretes e sidebar
  utils/api.ts         Cliente HTTP autenticado
  cadastro/            Cadastro de usuário
  login/               Login
  novo-medicamento/    Configuração de medicamento e tratamento
  meus-medicamentos/   Gerenciamento de medicamentos
  meus-lembretes/      Consulta e confirmação de doses
  historico/           Histórico
  Configuracoes/       Configurações de perfil
public/assets/         Assets e catálogo CSV
docs/                  Backlog, planejamento, cloud, qualidade e evidências
tests/                 Organização e modelo de registro de execução
```

O catálogo utilizado pela busca está em `public/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv`. A documentação da origem, versão e atualização, junto da otimização da busca, está prevista em [FE-10](https://github.com/MagalDevs/Front_MedReminder/issues/34).

## Backlog e prioridades

As **15 tarefas do frontend** estão publicadas como issues com atividades, critérios de aceite, estimativas, dependências e evidências esperadas.

| Prioridade | Significado | Tarefas |
| --- | --- | --- |
| P0 | Bloqueiam o aceite | FE-01: execução reproduzível; FE-02: histórico real; FE-03: sessão |
| P1 | Confiabilidade e entrega | FE-04 a FE-09; FE-12 a FE-15 |
| P2 | Evolução posterior | FE-10: catálogo/busca; FE-11: notificação fora da página e adiamento |

Consulte o [índice das issues](docs/ISSUES.md), o [backlog detalhado](docs/BACKLOG.md) e o [planejamento por ciclos](docs/PLANEJAMENTO.md). Os IDs BE/MO referem-se a dependências planejadas dos outros repositórios; esta publicação criou somente issues do frontend.

## Integração das disciplinas

| Disciplina | Contribuição para o frontend | Tarefas |
| --- | --- | --- |
| Computação em Nuvem 2 | Configuração por ambiente, implantação HTTPS, capacidade/cache, rollback, monitoramento e evidências | FE-06, FE-12, FE-13 |
| Qualidade e Teste de Software | Testes de componentes/E2E, CI, acessibilidade, performance, execução e relatórios | FE-07, FE-09, FE-14 |
| Integração do MVP | Fluxo real, confirmação persistida, isolamento entre contas e apresentação com evidências | FE-15 |

A [documentação de cloud](docs/CLOUD.md) descreve o plano de implantação e operação. Ela não comprova infraestrutura configurada. O [plano de testes](docs/PLANO_TESTES.md) define os cenários funcionais e não funcionais.

## Validação e evidências

Resultados executados na baseline de 01/10/2026:

| Verificação | Resultado |
| --- | --- |
| `npm ci --no-audit --no-fund` | Aprovado |
| `npm run build` | Aprovado |
| `npm run lint` | Aprovado com aviso em `MeusLembretesContent.tsx` |
| Fluxo funcional em navegador e integração API/mobile | Pendente |
| Acessibilidade, desempenho e operação cloud | Pendentes |

Os [logs e hashes da baseline](docs/evidencias/2026-10-01/README.md) preservam os resultados. Para novas rodadas, registrar data, ambiente, commit, caso, resultado e evidência conforme [tests/REGISTRO_EXECUCAO.md](tests/REGISTRO_EXECUCAO.md).

O MVP será aceito após fechar P0, aprovar os cenários críticos e demonstrar cadastro/login → busca → tratamento → confirmação → recarga com dados persistidos e isolamento entre contas. A [apresentação do MVP](docs/APRESENTACAO_MVP.md) traz roteiro e checklist.

## Contribuir

1. Escolha uma [issue](https://github.com/MagalDevs/Front_MedReminder/issues) e confira prioridade, dependências e aceite.
2. Crie uma branch para a mudança e mantenha o escopo ligado à tarefa.
3. Execute lint, build e os testes pertinentes disponíveis.
4. Atualize documentação, relatório e evidências quando necessário.
5. Abra um PR com comportamento anterior/novo, validação e vínculo à issue, usando `Closes #numero` quando cumprir todo o aceite.

Evite incluir credenciais, tokens ou dados pessoais em commits, logs e capturas.

## Documentação

- [Índice geral](docs/README.md)
- [Inventário das funcionalidades](docs/INVENTARIO.md)
- [Backlog priorizado](docs/BACKLOG.md)
- [Issues publicadas](docs/ISSUES.md)
- [Planejamento integrado](docs/PLANEJAMENTO.md)
- [Cloud](docs/CLOUD.md)
- [Plano de testes](docs/PLANO_TESTES.md)
- [Relatório de qualidade](docs/RELATORIO_QUALIDADE.md)
- [Apresentação do MVP](docs/APRESENTACAO_MVP.md)
