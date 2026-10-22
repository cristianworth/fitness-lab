# Retomada — Fitness Lab

## Pedido e decisões

App pessoal de academia implementado majoritariamente por IA, em execução autônoma. Escolhas confirmadas: um dispositivo sem login, IndexedDB com backup, nutrição manual por 100 g/ml, prioridade registrar séries durante o treino. Interface pt-BR e fuso America/Sao_Paulo.

## Projeto

- Diretório: `D:\Repo\fitness-lab`.
- Git: `main`; remoto público autorizado `https://github.com/cristianworth/fitness-lab`.
- Versão atual: `0.1.2`, explicitamente autorizada. A versão exibida vem do package.json.
- Tecnologias: React/TypeScript/Vite, idb, Zod, Vitest/fake-indexeddb, Playwright/Axe. Lockfile fixa dependências.
- Comandos: `npm ci`, `npm run dev`, `npm run check`, `npm run test:e2e`.
- Origem estável: `http://127.0.0.1:5173`. Preview usa a mesma porta; encerrar dev antes.

## Estado

Versão 0.1.0 entregue. Implementados painel do dia, cadastro/edição de exercícios e rotinas, sessão ativa com gravação explícita de rascunhos, histórico/evolução, cadastro de alimentos, diário/correções e backup/restauração. Domínio e persistência têm 35 testes passando; 14 cenários de navegador, build, tipos e formatação passaram. CI Ubuntu aprovado no run 39053215273. Revisão independente encerrada com todos os achados corrigidos. Conferir relatório final em `validation.md`.

Dados reais/backs/tests brutos fora do Git. Nenhuma publicação da aplicação em servidor externo. Arquivos `.local/` são auxiliares ignorados e não são necessários para executar o projeto.

Entrega 0.1.1: dataset demonstrativo pesquisado em `public/demo/fitness-lab-demo.json`, gerador `scripts/generate-demo.mjs` e proveniência em `docs/demo-data.md`. 24 treinos, 314 séries feitas e 926 consumos entre 24/08 e 17/10/2026; supino 30→35 kg. Banco local do navegador integrado estava vazio (backup exportado e conferido antes da importação) e recebeu a demo. Nenhum dado corporal medido foi inventado. Testes totais: 38 unitários e 16 de navegador (14 existentes + 2 novos, estes reconferidos após corrigir o seletor do teste); build e formatação aprovados. Revisão independente sem achados. Dataset usa esquema 1 e não é carregado automaticamente em novos navegadores.

## Próximo passo

Em 22/10/2026, a entrega 0.1.2 documentou objetivo, construção com IA, arquitetura, contribuição e segurança. Cristian autorizou a licença MIT (`LICENSE`, autoria `cristianworth`) e o incremento para 0.1.2. Créditos externos estão em `NOTICE.md`; código de comportamento e esquema de dados permanecem iguais aos da 0.1.1.

Experimentar o roteiro do README com registros fictícios e avaliar a experiência durante um treino. Evoluções como PWA/offline, hospedagem HTTPS, cancelamento de sessão, exclusão de cadastros ou edição de histórico são propostas futuras, não decisões já autorizadas de produto. Antes de nova versão/commit, ler CHANGELOG.md e confirmar próximo incremento conforme as regras do usuário; não incrementar a cada commit da mesma entrega.
