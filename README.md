# MedReminder — Frontend

O MedReminder é uma aplicação web para organizar medicamentos, configurar horários de tratamento e acompanhar a confirmação das doses. A interface em português reúne busca de medicamentos, formulários de cadastro, listas de tratamentos e lembretes em uma experiência construída com Next.js e React.

Este repositório contém o frontend web. Os dados de usuários, medicamentos e doses são persistidos por uma API compartilhada com o aplicativo mobile.

## Funcionalidades

- Busca de medicamentos por nome a partir de um catálogo CSV.
- Cadastro de usuário e login.
- Cadastro de medicamentos com informações do tratamento, dosagem, intervalo e duração.
- Consulta dos medicamentos cadastrados e exclusão de registros.
- Consulta de lembretes com filtros e confirmação de dose tomada.
- Alerta visual no horário da dose enquanto a página permanece aberta.
- Consulta e atualização de informações do perfil.

A interface também possui uma tela de histórico com filtros. Na versão atual, seus registros são simulados. As ações de troca de senha e envio de foto exibidas nas configurações dependem de endpoints ainda indisponíveis na API.

## Tecnologias

| Tecnologia | Uso no frontend |
| --- | --- |
| Next.js 15 | Rotas com App Router, desenvolvimento e build |
| React 19 | Componentes e gerenciamento de estado da interface |
| TypeScript | Tipagem do código |
| Tailwind CSS | Estilização |
| React Context | Estado de autenticação, lembretes e sidebar |
| Papa Parse | Leitura do catálogo de medicamentos em CSV |
| Lucide React | Ícones |
| React Datepicker | Seleção de datas |
| React Input Mask | Máscaras de campos |
| ESLint | Análise estática |

As versões das dependências estão registradas em `package.json` e `package-lock.json`.

## Como executar

### Pré-requisitos

- Node.js e npm.
- Git para clonar o repositório.
- Acesso à API para utilizar cadastro, login e dados persistidos.

O ambiente utilizado na execução local foi Node.js **v24.21.0** e npm **11.19.0**.

### Instalação

```bash
git clone https://github.com/MagalDevs/Front_MedReminder.git
cd Front_MedReminder
npm ci
```

### Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Para utilizar outra porta, por exemplo quando uma API local estiver na porta 3000:

```bash
npm run dev -- --port 3001
```

Nesse caso, abra [http://localhost:3001](http://localhost:3001).

### Build e execução

```bash
npm run build
npm run start
```

Para iniciar o build em outra porta:

```bash
npm run start -- --port 3001
```

### Comandos disponíveis

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o ambiente de desenvolvimento com Turbopack |
| `npm run build` | Gera o build da aplicação |
| `npm run start` | Inicia a aplicação a partir do build |
| `npm run lint` | Executa a análise estática |

## Navegação

| Rota | Tela |
| --- | --- |
| `/` | Página inicial e busca de medicamentos |
| `/cadastro` | Cadastro de usuário |
| `/login` | Login |
| `/novo-medicamento` | Seleção de medicamento e configuração de tratamento |
| `/meus-medicamentos` | Medicamentos cadastrados |
| `/meus-lembretes` | Lembretes e confirmação de doses |
| `/historico` | Histórico com filtros |
| `/Configuracoes` | Configurações do perfil |

A rota `/Configuracoes` utiliza inicial maiúscula, conforme a estrutura atual.

## Organização do frontend

```text
src/app/
  layout.tsx           Layout principal e providers
  page.tsx             Página inicial
  globals.css          Estilos globais
  components/          Busca, formulários, sidebar e alertas
  contexts/            Autenticação, lembretes e sidebar
  utils/api.ts         Cliente HTTP autenticado
  cadastro/            Cadastro de usuário
  login/               Login
  novo-medicamento/    Configuração de medicamento e tratamento
  meus-medicamentos/   Lista de medicamentos
  meus-lembretes/      Consulta e confirmação de doses
  historico/           Tela de histórico
  Configuracoes/       Configurações de perfil
public/
  assets/              Imagens e catálogo CSV
  fonts/               Recursos de fontes
```

O layout principal reúne os providers de autenticação, lembretes e sidebar. Os componentes de busca e cadastro compõem o fluxo de configuração de tratamentos, enquanto as telas de consulta apresentam os medicamentos e doses recebidos da API.

## Catálogo de medicamentos

A busca lê o arquivo:

```text
public/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv
```

O arquivo é disponibilizado pelo frontend em `/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv` e interpretado com Papa Parse. A interface utiliza os campos `NOME_PRODUTO` e `DESCRIÇÃO` para apresentar os resultados e selecionar um medicamento.

## Integração com a API

A aplicação utiliza a API em:

```text
https://medreminder-backend.onrender.com
```

O cliente HTTP principal está em `src/app/utils/api.ts`. Ele adiciona o token Bearer às requisições autenticadas e trata respostas de erro. Também existem chamadas diretas nas telas de cadastro, histórico e configurações.

| Recurso | Operações utilizadas |
| --- | --- |
| Autenticação | `POST /auth/login` |
| Usuário | `POST /usuario`, `GET /usuario/me`, `PATCH /usuario/me` |
| Medicamentos | `POST /remedio`, `GET /remedio/me`, `DELETE /remedio/:id` |
| Doses | `POST /dose/doses`, `GET /dose/me`, `PUT /dose/:id` |

O token da sessão é armazenado no `localStorage` com a chave `access_token`, e os dados do perfil com a chave `user_data`.

A URL da API está definida no código. Atualmente, `NEXT_PUBLIC_API_URL` não é utilizada; para conectar outra API, é necessário ajustar as URLs existentes e autorizar a origem do frontend na configuração CORS do servidor.

## Fluxo de uso

1. Criar uma conta e realizar o login.
2. Buscar e selecionar um medicamento.
3. Informar os dados do tratamento e configurar seus horários.
4. Consultar os medicamentos e lembretes cadastrados.
5. Confirmar uma dose como tomada para atualizar seu estado na API.

Os alertas visuais usam temporizadores no navegador e dependem da página aberta. A aplicação atual não oferece garantia de notificação com a página fechada.
