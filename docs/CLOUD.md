# Computação em Nuvem 2 — frontend

## Estado observado

Next.js com npm run build/start. URL da API fixa em src/app/utils/api.ts e em cadastro/histórico/configurações. Nenhum manifesto de infraestrutura ou workflow de deploy encontrado. Hospedagem, domínio, CDN e monitoramento NÃO VERIFICADOS.

## Configuração e documentação de infraestrutura

1. Executar FE-06 para centralizar URL. Variável proposta NEXT_PUBLIC_API_URL não é lida hoje; implementar antes de usá-la no pipeline. Variáveis NEXT_PUBLIC são públicas: nunca incluir secret Firebase Admin/JWT.
2. Escolher hospedagem compatível com o build real de Next; não assumir exportação estática disponível.
3. Instalar com npm ci; executar npm run build e npm run start no runtime suportado, com porta distinta da API no ambiente local.
4. Registrar provedor, região, domínio HTTPS, commit/artefato e URL API no relatório de deploy.
5. Configurar backend CORS para domínio web e validar login/lembretes.
6. Separar homologação e produção; rollback para artefato anterior; testar configuração efetiva, inclusive variáveis incorporadas ao build.
7. Testar CSV/arquivos públicos e rotas após deploy; documentar comportamento de cache.
8. Não criar recursos pagos ou alterar produção apenas para cumprir roteiro; operação real deve ser registrada pelo responsável no ambiente escolhido.

## Escalabilidade e monitoramento

Frontend pode usar cache/CDN para assets e réplicas quando o runtime permitir; isso não torna a API SQLite escalável. Medir tamanho do CSV, tempo de carregamento, latência das rotas e erros de requisição. Monitorar URL pública, falha de login e 5xx sem capturar token, senha, CPF ou dados de tratamento.

Entregas FE-06/07/10: configuração versionada sem segredos; instrução de build/deploy/rollback; evidência HTTPS/CORS; relatório básico de disponibilidade e desempenho. Metas iniciais: probe a cada minuto e alerta após três falhas consecutivas, calibrados na homologação. Estado atual: PLANEJADO, não executado.
