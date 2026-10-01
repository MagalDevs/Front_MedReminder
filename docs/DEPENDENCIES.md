# Atualizações de dependências

A configuração está em [`.github/dependabot.yml`](../.github/dependabot.yml). O Dependabot monitora `package.json` e `package-lock.json` na raiz usando o ecossistema npm.

## Política

- Verificação de versões toda segunda-feira às 09:00 no fuso `America/Sao_Paulo`.
- Espera de sete dias após a publicação de uma versão antes de propor atualizações de rotina. Essa espera não se aplica às atualizações de segurança.
- Até cinco PRs de atualização de versão abertos simultaneamente. O GitHub mantém um limite separado para PRs de segurança.
- Next.js e sua configuração de ESLint são atualizados no mesmo grupo; React, React DOM e suas tipagens em outro; Tailwind e seus plugins em outro.
- Os grupos de Next.js, React e Tailwind incluem versões major, que precisam de revisão das notas de migração.
- As outras dependências de produção e desenvolvimento são agrupadas por tipo para atualizações minor e patch. Suas atualizações major ficam em PRs individuais.
- Correções de segurança têm um grupo próprio, sem restrição de tipo de versão.
- Os PRs usam mensagens `chore(deps)` ou `chore(deps-dev)`. A configuração não habilita merge automático.

## Configurações de segurança do GitHub

A presença do YAML habilita atualizações de versão. Para receber PRs que corrigem vulnerabilidades, confirme nas [configurações de segurança do repositório](https://github.com/MagalDevs/Front_MedReminder/settings/security_analysis) que o grafo de dependências, **Dependabot alerts** e **Dependabot security updates** estão habilitados. Essas opções são configurações do GitHub e não são ativadas pelo YAML.

Consulte os resultados em **Insights → Dependency graph → Dependabot**, os alertas na aba **Security** e as execuções do bot na aba **Actions**.

## Revisão dos PRs

Confira o changelog e eventuais instruções de migração, especialmente em versões major. Verifique também os arquivos de manifesto e lockfile alterados.

Na branch do PR, execute:

```bash
npm ci
npx tsc --noEmit
npm run build
```

Verifique os fluxos de login, cadastro, busca de medicamentos e confirmação de doses antes de integrar mudanças nos pacotes centrais.

O repositório ainda não possui um workflow de CI para executar essas verificações automaticamente nos PRs. A execução do Dependabot verifica a atualização das dependências; ela não substitui a validação da aplicação.

Referência: [opções oficiais do Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference).
