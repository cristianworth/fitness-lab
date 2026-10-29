# Demonstração de portfólio

A versão 0.3.0 permite experimentar o Fitness Lab com exemplos, sem conta, instalação ou importação manual. O site entrega arquivos estáticos; treinos e alimentação são fictícios, mas as ações de salvar, calcular, exportar e recuperar dados são implementadas e persistem no navegador.

## Roteiro de revisão — até cinco minutos

1. **Entrada (30 s):** abra o site e escolha **Experimentar demonstração**. Confira a identificação de dados fictícios e o painel com alimentação em 17/10/2026. As três sugestões são atalhos opcionais.
2. **Treino (90 s):** escolha **Experimentar um treino**, consulte uma rotina e clique em **Iniciar treino**. Informe repetições/carga de uma série e salve o rascunho. Recarregue, volte a **Treinos**, confira os valores, conclua a série e finalize o treino. Séries restantes podem ficar não feitas; histórico distingue planejamento e execução.
3. **Evolução (45 s):** abra **Evolução**, consulte o treino recém-finalizado e selecione **Supino reto com barra**. Explore carga e volume do histórico fictício, incluindo platôs. O gráfico representa desempenho registrado, sem estimar composição corporal.
4. **Alimentação (60 s):** abra o diário em 17/10/2026, adicione um alimento e uma quantidade, confira os totais e edite o consumo. Nutrientes desconhecidos continuam identificados; zero e desconhecido não são equivalentes.
5. **Dados (60 s):** exporte o backup em **Seus dados**. Abra **Restaurar exemplos**, cancele para preservar alterações e depois confirme se quiser voltar ao conjunto inicial. Use **Voltar ao modo pessoal** para conferir que seus registros pessoais continuam disponíveis.

## Datas e persistência

O conjunto original abrange 24/08–17/10/2026. O painel demonstrativo e o diário abrem no último dia preenchido; essa data está indicada na faixa. Novas sessões usam o horário real e podem ficar fora do período do painel. Consulte-as em Treinos/Evolução. O modo pessoal nunca recebe um relógio simulado.

A URL `?mode=demo` mantém o modo após recarga e permite um link direto. Alterações da experiência ficam no banco `fitness-lab-demo`. O modo pessoal usa o banco anterior `fitness-lab`; não há migração ou troca silenciosa dos registros. Restaurar exemplos substitui exclusivamente a demo, após confirmação.

Exportações têm o mesmo esquema JSON 1 usado pelo aplicativo. O nome do arquivo da demo inclui `demo-backup`, mas isso não é uma trava de segurança: importar qualquer backup substitui os dados do modo ativo após confirmação. Arquivos baixados não são enviados automaticamente a ninguém.

Origem e perfil do navegador determinam onde os dados ficam. O site público, localhost, outro navegador e outras portas não compartilham o mesmo armazenamento. Limpar os dados do site ou políticas do navegador podem remover ambos os bancos. Não há conta, sincronização, PWA/offline garantido ou backend. Falhas de leitura, rede ou escrita exibem erro e permitem tentar novamente; dados inválidos não provocam restauração automática.

## Fontes e apresentação

O dataset foi reaproveitado sem alteração de unidades, snapshots e cálculos. [Fontes nutricionais e de treino](demo-data.md), [identidade visual](visual-design.md), [arquitetura](architecture.md) e [publicação](deployment.md) detalham as decisões. Capturas de portfólio usam somente esse conjunto fictício; não representam usuários reais nem resultados físicos medidos.

## Resumo para o chat do site

- **Proposta:** diário pessoal de academia que registra séries, repetições, carga e alimentação, com histórico preservado e uso local no navegador.
- **Código:** [cristianworth/fitness-lab](https://github.com/cristianworth/fitness-lab).
- **Fluxos demonstráveis:** iniciar/salvar/retomar/finalizar treino; explorar carga/volume; adicionar/editar consumo; exportar e restaurar exemplos.
- **Decisões:** React/TypeScript, IndexedDB transacional, snapshots, banco demo separado, dataset existente e hospedagem estática GitHub Pages. Sem backend ou conta.
- **Limites:** armazenamento por origem/perfil, exemplos fictícios e datas identificadas; sem sincronização, prescrição ou composição corporal. Implementado com assistência de IA, direção e revisão de Cristian; verificações específicas não equivalem a certificação.

A URL e as evidências da publicação serão registradas após a verificação do deploy. Este resumo é um arquivo para consulta; não envia mensagens a outros chats.
