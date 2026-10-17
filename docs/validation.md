# Validação da versão 0.1.0

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

Workflow `.github/workflows/ci.yml`: npm ci, testes, TypeScript/build e Playwright Chromium em Ubuntu. Resultado remoto será registrado ao concluir a execução.
