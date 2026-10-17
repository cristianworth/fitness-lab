# Validação das entregas

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
