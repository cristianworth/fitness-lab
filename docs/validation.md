# Validação das entregas

## 0.2.0 — Redesign visual — 2026-10-27

Em Windows 10/Edge, `npm run check` passou: **38 testes Vitest**, TypeScript e build. `npm run format:check` passou. A execução final de Playwright teve **18 testes aprovados**, incluindo as cinco telas preenchidas com a demo, favicon e fontes locais, navegação por teclado e ausência de transbordamento horizontal em 320 px. Axe não detectou violações WCAG A/AA nos estados verificados. Os links relativos da documentação foram conferidos.

As capturas de [desktop](images/dashboard-desktop.png) e [mobile](images/dashboard-mobile.png) foram inspecionadas e mostram somente dados sintéticos. Prévia e testes principais usaram temporariamente a porta 5183: a 5173 estava ocupada por outro projeto e 5181/5182 pertencem ao teste de reinicialização. A configuração temporária em `.local/` não faz parte da distribuição; a configuração padrão continua em 5173.

A revisão independente encontrou e reconferiu duas correções: o novo logo móvel passou a respeitar o bloqueio de saída com séries não salvas, com regressão coberta no teste de treino; o item ativo da navegação móvel recebeu contorno de foco escuro, distinguível do fundo laranja. O revisor conferiu as cinco telas entre 320 e 1440 px sem transbordamento horizontal e encerrou os achados sem pendências.

Na validação, expectativas de títulos antigos foram atualizadas para os novos textos. O teste de reinicialização passou a sair para `about:blank` antes de desligar o servidor e a abrir novamente a origem depois: isso preserva o teste de persistência sem disputar navegação com a reconexão automática do cliente Vite. A suíte completa passou após esses ajustes.

Limites: simulação móvel em navegador desktop, sem celular físico, Safari ou leitor de tela. Axe e inspeção de capturas não certificam conformidade completa nem substituem avaliação de uso durante um treino.

## 0.1.1 — Dados demonstrativos

Em 17/10/2026: 38 testes Vitest passaram (35 existentes e três do dataset); TypeScript/build passaram. Os 14 cenários existentes de navegador passaram. Os dois novos cenários desktop/mobile passaram após corrigir um seletor do próprio teste (`getByLabel` → `getByRole` no combobox); validam importação da demo, persistência após recarga, carga 30→35 kg, volume inicial 540 kg × repetições e igualdade integral do backup exportado. Formatação passou.

Revisão independente conferiu schema, roundtrip, calendário, fuso, contagens e valores ausentes diretamente na TACO original, sem achados acionáveis. Conferência no navegador integrado: backup inicial vazio exportado, demo importada, 24 treinos/314 séries na Evolução e oito consumos em 17/10. Dados são sintéticos e identificados; medidas corporais não fazem parte do esquema.

## 0.1.0 — Aplicação inicial

Data: 2026-10-17. Ambiente observado: Windows 10, Node 24.20.0, npm 11.19.0, Microsoft Edge headless. Configuração dos subagentes: GPT-6.1 Sol com raciocínio alto.

## Verificações locais

- `npm run check`: **35 testes Vitest passaram**, TypeScript e build Vite passaram.
- Domínio: snapshots de alimentos e treino, planejamento distinto da execução, null/zero, unidades, datas e reenvios.
- IndexedDB simulado: reabertura, 30 escritas concorrentes sem perdas, sessão ativa única, restauração inválida, corrupção, limite exato de 20 MiB em UTF-8, excedente de um byte e rollback.
- Quota: `QuotaExceededError` injetada no `put`; a operação falha sem alterar dados e a gravação seguinte funciona.
- Primeira rodada de navegador: 8 cenários passaram em desktop e viewport móvel, cobrindo treino, alimentação, backup e layout.
- Rodada final: **14 testes Playwright passaram** (sete cenários em desktop e viewport móvel). Inclui reinicialização real do servidor com dados preservados, conflito entre abas, finalização remota com rascunho local e Axe WCAG A/AA sem violações detectadas nas telas verificadas.
- Inspeção visual humana assistida: painel inicial no navegador da aplicação, hierarquia, navegação e composição.

Os testes usam dados explicitamente fictícios e contextos de navegador isolados. Falha de quota é simulada, não enchimento real do disco. IndexedDB também é exercido pelos fluxos em navegador real, além dos testes unitários.

## Revisão independente

Achados detectados e resolvidos:

1. Recuperação por backup inacessível quando carregar estado falhava: importação agora aparece na tela de erro.
2. Divergência entre tamanho em caracteres e bytes no backup: limite UTF-8 centralizado e formato compacto.
3. Estado gravável mas não exportável: tamanho validado antes de confirmar a transação.
4. Campos de séries desatualizados após alteração em outra aba: sincronização quando limpos, aviso e resolução explícita quando há rascunho local.
5. Finalização externa com rascunho local prendia navegação: bloqueio reconciliado com aviso e fluxo liberado.
6. Planejamento original perdia distinção da execução: campos próprios preservam séries/repetições previstas.

Revisor reconferiu correções e encerrou sem achados remanescentes no escopo. A checagem Axe identificou contraste insuficiente; tons e tamanhos de texto foram corrigidos sem desativar regras.

## Limites da evidência

- Viewport móvel em navegador desktop; não houve teste em aparelho físico, Safari ou leitor de tela.
- Axe detecta parte dos problemas de acessibilidade, não certifica conformidade completa.
- Playwright atual não documenta suporte a Windows 10; execução local com Edge observada. CI em Ubuntu configura ambiente oficialmente suportado.
- Sem integrações nutricionais externas ou backend; não há contratos externos a simular.
- A política de retenção do navegador continua externa ao app; backup exportável é necessário.

## CI e versão

Workflow `.github/workflows/ci.yml`: npm ci, formatação, testes, TypeScript/build e Playwright Chromium em Ubuntu. **CI remoto aprovado** no [run 39053215273](https://github.com/cristianworth/fitness-lab/actions/runs/39053215273), commit de código `ce55d4b`.

O CI também verificou as correções de contraste durante a troca de navegação e a prontidão HTTP do teste de reinicialização. A atualização final de documentação não altera o código validado.
