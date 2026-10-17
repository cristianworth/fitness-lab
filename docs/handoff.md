# Retomada — Fitness Lab

## Pedido e decisões

App pessoal de academia implementado majoritariamente por IA, em execução autônoma. Escolhas confirmadas: um dispositivo sem login, IndexedDB com backup, nutrição manual por 100 g/ml, prioridade registrar séries durante o treino. Interface pt-BR e fuso America/Sao_Paulo.

## Projeto

- Diretório: `D:\Repo\fitness-lab`.
- Git: `main`; remoto público autorizado `https://github.com/cristianworth/fitness-lab`.
- Versão desta entrega: `0.1.0`, explicitamente autorizada. A versão exibida vem do package.json.
- Tecnologias: React/TypeScript/Vite, idb, Zod, Vitest/fake-indexeddb, Playwright/Axe. Lockfile fixa dependências.
- Comandos: `npm ci`, `npm run dev`, `npm run check`, `npm run test:e2e`.
- Origem estável: `http://127.0.0.1:5173`. Preview usa a mesma porta; encerrar dev antes.

## Estado

Implementados painel do dia, cadastro/edição de exercícios e rotinas, sessão ativa com gravação explícita de rascunhos, histórico/evolução, cadastro de alimentos, diário/correções e backup/restauração. Domínio e persistência têm 35 testes passando; build e tipos passaram. Revisão independente encerrada com todos os achados corrigidos. Conferir relatório final em `validation.md`.

Dados reais/backs/tests brutos fora do Git. Nenhuma publicação da aplicação em servidor externo. Arquivos `.local/` são auxiliares ignorados e não são necessários para executar o projeto.

## Próximo passo

Experimentar o roteiro do README com registros fictícios e avaliar a experiência durante um treino. Evoluções como PWA/offline, hospedagem HTTPS, cancelamento de sessão, exclusão de cadastros ou edição de histórico são propostas futuras, não decisões já autorizadas de produto. Antes de nova versão/commit, ler CHANGELOG.md e confirmar próximo incremento conforme as regras do usuário; não incrementar a cada commit da mesma entrega.
