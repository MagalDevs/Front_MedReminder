---
name: MedReminder web
description: Interface de rotina para medicamentos e horários de doses.
colors:
  action-primary: "#0B6E71"
  action-primary-hover: "#085659"
  action-primary-text: "#FFFFFF"
  brand-signature: "#BE185D"
  surface-page: "#F6F6F6"
  surface-raised: "#FFFFFF"
  text-primary: "#171717"
  text-muted: "#525252"
  border-default: "#D1D5DB"
  border-control: "#737373"
  focus: "#075985"
  error: "#B42318"
  error-surface: "#FEF3F2"
  warning: "#854D0E"
  warning-surface: "#FEFCE8"
  success: "#166534"
  success-surface: "#F0FDF4"
  disabled-text: "#525252"
  disabled-surface: "#E5E7EB"
typography:
  body:
    fontFamily: "Kantumruy, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  page-title:
    fontFamily: "Kantumruy, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "2rem"
  section-title:
    fontFamily: "Kantumruy, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
rounded:
  control: "8px"
  surface: "12px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-6: "24px"
  space-8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action-primary}"
    textColor: "{colors.action-primary-text}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.action-primary}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
---

# Contrato visual do MedReminder web

## Overview

Contrato do código implementado em `src/app/globals.css`, `components/ui/`, `components/layout/AppShell.tsx` e `features/web-ux/`, revisado em 2026-11-15. O CSS e os componentes são a fonte executável; este documento descreve sua aplicação. A especificação aprovada continua em [.specs/features/web-ux-consistency/spec.md](.specs/features/web-ux-consistency/spec.md).

O modo é Operate: reconhecer o horário previsto, distinguir o registro e concluir a próxima ação. Conteúdo alinhado à esquerda, listas legíveis, agrupamento por tarefa e espaço entre grupos. A personalidade vem da marca existente e da precisão dos detalhes. Não há composição promocional, hero em tela inteira, shader, loop ou dependência visual nova.

O logotipo real é `public/assets/LogoMed-removebg-preview.png`. `Logo` o apresenta nas telas públicas e de acesso; o AppShell usa o mesmo símbolo compacto, com 40px, ao lado do wordmark. Não redesenhar o asset. Perfil usa iniciais, sem simular upload de foto. A moldura do logo respeita a largura disponível quando o texto aumenta.

## Colors

Os nomes do frontmatter correspondem às variáveis CSS de mesmo nome com prefixo `--`. Ação e seleção usam `action-primary`; texto sobre esse fundo usa `action-primary-text`. O hover primário usa `action-primary-hover`. `brand-signature` pertence à identidade, sem significado de erro ou sucesso.

`surface-page` é o fundo; `surface-raised` agrupa formulários, filtros e listas. `text-primary` serve ao conteúdo e `text-muted` às descrições. `border-default` separa grupos; `border-control` delimita campos e opções. A borda suave de uma superfície não substitui o indicador de foco.

Erro, espera/alerta e sucesso usam os pares `error/error-surface`, `warning/warning-surface` e `success/success-surface`. Loading/disabled usa `disabled-text/disabled-surface`. O foco tem token próprio. Placeholder usa `text-muted` opaco; caret usa a ação primária. A seleção de texto usa o par primário.

As cores nomeadas do medicamento permanecem opções de identificação: Vermelho, Azul, Amarelo, Laranja, Azul claro, Branco, Verde claro, Verde escuro, Preto e Orquídea. O rádio e seu rótulo informam seleção; a amostra não carrega estado clínico, erro ou sucesso.

Texto comum exige contraste de pelo menos 4,5:1; texto grande, 3:1. Os testes T1/T45 medem pares reais/default, hover, placeholder, loading/disabled e feedback. O botão troca texto/fundo juntos ao entrar em loading, evitando um par intermediário ilegível.

## Typography

Kantumruy é a família de interface, com fallback sans-serif e arquivos reais em `public/fonts/`. Pesos de interface são 400, 500, 600 e 700; o arquivo Light/300 e aliases históricos continuam disponíveis. Variáveis Geist ainda existem no layout, mas não definem a família das telas deste contrato.

O corpo usa 1rem, normalmente 16px, e line-height 1,5. Campos e botões herdam a fonte. Texto auxiliar usa 0,875rem/20px; seções, 1,25rem/28px; títulos autenticados, 1,5rem/32px. A entrada pública usa 1,875rem/36px. O título de acesso usa peso 600; não transformar essas diferenças de papel em famílias distintas. Horários usam numerais tabulares onde indicados pelo componente.

A tipografia continua relativa à preferência de tamanho. A 200%, o corpo e os campos calculam 32px e os títulos ampliam na mesma proporção. Texto estático quebra linhas; campos nativos de linha única permitem percorrer seus valores longos. Nenhuma redução de fonte, truncamento de conteúdo estático ou `overflow-x:hidden` compensa falta de espaço.

## Layout

O AppShell centraliza conteúdo em até 72rem, normalmente 1152px, com 16px de margem interna horizontal no estreito e 24px a partir de 768px. Formulários de tratamento, edição e Perfil limitam o conteúdo a 48rem. Entrada pública usa 48rem; login, 32rem; cadastro de conta, 36rem. Essas larguras são máximas, com reflow no viewport disponível.

A base de espaçamento do Tailwind é `--space-1`, em px. Assim os intervalos de 4/8/12/16/24/32px não duplicam junto com texto a 200%. Controles têm altura mínima de 44px e crescem com seu conteúdo. Formulários passam para duas colunas a partir de 640px; filtros usam até quatro a partir de 1024px. A navegação desktop aparece a partir de 768px e pode quebrar linha.

No estreito, Menu abre navegação em um diálogo nativo. O cabeçalho participa do fluxo; não encobre o título. O menu fechado não mantém links focáveis ou conteúdo na árvore acessível. Um menu ou diálogo comprido pode rolar verticalmente. A 200%, Tab chega também a Sair e o navegador o traz para dentro da área visível.

Hoje apresenta data/fuso, totais, próxima dose e a agenda do dia. Doses atrasadas continuam visíveis. “Ver Histórico” fica depois da agenda. O resumo flexiona os números, por exemplo: “Hoje: 2 doses, 1 registrada e 1 não registrada.” Uma consulta incompleta mantém o marcador “(parcial)”. Lista, filtros e revisão não são tabelas horizontais obrigatórias.

Viewports de referência: 320×568, 390×844, 768×1024 e 1440×900 CSS px. A matriz T45 percorre dez rotas e verifica overflow e controles alcançáveis. T46 amplia texto efetivamente e verifica movimento reduzido. Capturas nativas ficam em [.specs/features/web-ux-consistency/captures/](.specs/features/web-ux-consistency/captures/); não são referências de design vinculantes fornecidas pelo usuário.

## Elevation & Depth

As telas usam superfícies planas, bordas de separação e contraste de fundo. Não há sombra em cada linha de dose. Diálogos usam a camada superior nativa e backdrop preto a 40%, com portal no body, para escapar de contêineres e proteger o foco.

## Shapes

Controles e feedback usam raio `control`; formulários e superfícies maiores, `surface`. Campos usam borda de 1px, rótulo visível, preenchimento horizontal de 12px e vertical de 8px. Botões usam borda de 1px e preenchimento de 8px por 16px. Nomes e textos longos podem quebrar linha; as opções de cor também podem crescer verticalmente.

O indicador de foco tem 3px sólidos e afastamento de 3px. O rádio visualmente oculto projeta o foco em seu rótulo visível. Botões e rótulos de cor oferecem pelo menos 44×44 CSS px. Não fixar a altura de um controle a ponto de cortar texto ampliado.

## Components

| Componente real | Contrato de uso |
| --- | --- |
| `Button` | Variantes primary/secondary. `loading` mantém nome de ação apropriado, anuncia busy e desabilita a mesma operação. Default, hover, foco, disabled e loading são compartilhados entre telas. |
| `FormField` | Associa rótulo, descrição e erro ao controle por ID; conserva valor e mensagem textual. Erro não depende apenas de cor ou placeholder. |
| `ColorSelector` | Fieldset/legend e rádios nativos nomeados, seleção por teclado e marcador textual selecionada. Rótulo amplo recebe foco visível. |
| `Dialog` | Diálogo modal nativo, título associado, Tab/Shift+Tab contidos, Escape e fechamento explícito devolvem foco ao acionador conectado. Fechar/cancelar não confirma uma ação. |
| `AppShell` | Destinos Hoje, Medicamentos, Histórico e Perfil; `aria-current` indica o destino. Skip link chega ao conteúdo. Sair permanece uma ação explícita. |
| `RequestFeedback` | Loading, vazio inicial, ausência por filtro, erro, alerta e sucesso têm superfície comum. Erro/alerta usam `role=alert`; os demais, `role=status`. Recuperação oferece Tentar novamente da operação correta e respeita Retry-After. |
| `DoseCard` | Nome, quantidade/unidade, data/hora prevista e estado textual. Registrar dose só nas ocorrências elegíveis; Corrigir registro exige confirmação nominal. Dados incompletos não ganham horário ou ação inventados. |
| `MedicationStep`, `TreatmentStep`, `TreatmentReview`, `TreatmentWizard` | Etapas Medicamento → Tratamento → Revisão. Voltar conserva valores. Revisão apresenta fuso, contagem e todos os horários antes de Salvar tratamento. |
| Telas e adaptadores de rota | Reutilizam esses componentes e os hooks de domínio/identidade; não mantêm cópias divergentes das regras de agenda. |

### Vocabulário e verdade dos dados

| Texto | Significado no aplicativo |
| --- | --- |
| Programada | Não registrada e instante previsto maior que o relógio atual. |
| Pendente | Não registrada e instante previsto igual ao relógio atual. |
| Atrasada | Não registrada e instante previsto anterior ao relógio atual. |
| Registrada | `tomado:true`, independentemente do instante previsto. |
| Dados incompletos | Falta informação válida para apresentar uma ocorrência completa; não entra nos totais e filtros de doses válidas. |

Registro no aplicativo não comprova ingestão. Quantidade/unidade vem do transporte, sem conversão clínica. A fixture visual de mesmo ID usa literalmente “1,5 comprimidos” na lista e nas doses para manter a entidade coerente. Registros antigos mostram seus horários existentes; `quantidadeDiaria` legado não vira um intervalo inferido.

Editar medicamento abre `/meus-medicamentos/[id]/editar` com ID decimal positivo seguro e sessão validada. Apenas sete metadados alterados podem ir por PUT: `nome`, `classificacao`, `quantidadeCaixa`, `dataValidade`, `cor`, `motivo`, `observacao`. Primeira dose, intervalo, duração, unidade e quantidade por dose aparecem somente leitura, com “Esta edição não altera os horários das doses”. Dados não conhecidos dizem Não informado/Não informada; Ver horários leva à agenda do item. Não simular reagendamento.

O rascunho e a intenção de tratamento vivem somente em memória da aba, isolados pela identidade. Navegação interna conserva o preenchimento; logout, troca de identidade e reload o descartam. O aviso aparece antes do preenchimento. Resposta incerta conserva corpo/chave para tentativa manual da mesma intenção. Tratamento confirmado com refresh falho oferece repetir apenas a leitura. Não há nova persistência de dados de saúde em storage.

O relógio recalcula estados na aba visível e ao retornar ao primeiro plano. O alarme existente depende do aplicativo em primeiro plano. Este contrato não promete push, notificações garantidas em segundo plano, horário real de ingestão, sincronização transacional entre dispositivos, upload de perfil ou recuperação de senha sem sessão.

### Movimento

Tokens reais: `--duration-quick` 150ms; `--duration-fast` 250ms; `--ease-smooth-out` cubic-bezier(0.22,1,0.36,1); `--distance-base` 8px; `--scale-large` 0.96.

Entrada do diálogo usa 250ms e escala discreta; etapas usam 250ms e deslocamento de 8px; feedback usa 150ms. Conteúdo tem estado padrão visível, sem espera para interação ou anúncio. Botões animam apenas a borda; pares de texto/fundo mudam juntos. O fechamento nativo é síncrono, sem reter superfície fechada na árvore acessível. Os padrões das skills de transição foram adaptados a esse limite; não há exit timer segurando a ação.

`prefers-reduced-motion:reduce` elimina animações/transições e restaura scroll imediato. Etapas, feedback, conteúdo e controles permanecem disponíveis. Não adicionar delay ao registro, texto que depende de uma animação para aparecer, loops ou movimento por scroll.

### Equivalência futura com mobile

| Conceito web implementado | Equivalência futura a avaliar no mobile |
| --- | --- |
| Tokens de ação, superfície, texto e feedback | Mesmos papéis semânticos com contraste medido na plataforma. |
| Kantumruy e hierarquia de texto | Família/roles equivalentes, respeitando escala de fonte e métricas nativas. |
| Hoje, Medicamentos, Histórico, Perfil | Mesmos nomes e destinos conceituais, com navegação nativa apropriada. |
| DoseCard e cinco estados acima | Mesma informação e semântica de registro; apresentação compatível com recursos nativos. |
| Rótulo/erro/seleção/foco | Controles nativos nomeados e tecnologia assistiva da plataforma. |
| Wizard, revisão, confirmação e recuperação | Mesmo limite da API, preservação de intenção e clareza dos resultados. |
| Movimento reduzido | Respeitar a preferência nativa, sem ocultar conteúdo. |

Essa tabela é documentação de correspondência, não implementação ou validação do aplicativo mobile. Nenhum arquivo mobile ou backend foi alterado por T47. Novas capacidades nativas exigem escopo e contratos próprios.

## Do's and Don'ts

- Reutilizar tokens/componentes e texto de ação consistente; manter data/hora explicitamente prevista.
- Reservar rosa à marca e cor do medicamento à identificação. Estado e erro continuam textuais e semânticos.
- Preservar foco, alvos de 44px, teclado, reflow, texto ampliado e movimento reduzido em qualquer extensão.
- Não inventar capacidade, frequência, horário, prescrição ou garantia remota para preencher uma lacuna da API.
- Verificar o resultado renderizado com dados sintéticos; teste interceptado não comprova persistência real ou paridade do deploy.

As evidências locais e limitações de ferramentas estão em [b7-visual-review.md](.specs/features/web-ux-consistency/b7-visual-review.md). O status é implementação concluída com verificação final pendente: a migração de regressões autorizada, provas agregadas, percurso independente e Verifier continuam sob responsabilidade do orquestrador. Automação e inspeção visual não equivalem a certificação manual por leitor de tela.
