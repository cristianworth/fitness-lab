# Fitness Lab 0.1.0 — especificação

## Decisões confirmadas
- Uso pessoal em um dispositivo, sem login ou sincronização. Backup JSON exportável e restaurável.
- Alimentos cadastrados manualmente, com calorias (kcal), proteína/carboidrato/gordura (g) por 100 g ou 100 ml.
- Prioridade: registrar o treino durante a execução. Interface pt-BR responsiva.
- Fuso inicial America/Sao_Paulo. Agrupamento diário explícito, sem converter datas de diário em UTC.

## Critérios de aceitação
1. Criar e editar exercícios e rotinas; uma rotina contém exercícios, séries e repetições planejadas.
2. Iniciar uma única sessão ativa, copiando nomes e planejamento. Editar a rotina não modifica sessões já iniciadas.
3. Registrar repetições e carga em kg por série, inclusive peso corporal; desconhecido é null e zero é um valor conhecido. Salvar antes de informar sucesso e recuperar após recarga.
4. Concluir sessão com pelo menos uma série feita válida; mostrar histórico e evolução derivada apenas de séries concluídas. Volume é carga externa × repetições, não peso corporal estimado.
5. Cadastrar alimentos com nutrientes por 100 unidades; registrar quantidade em mesma unidade. Gramas e mililitros não são convertidos implicitamente.
6. Consultar, corrigir e remover consumo por dia. Snapshot nutricional preserva significado histórico quando alimento muda. Totais sinalizam informação incompleta.
7. Exportar backup versionado e validar integralmente antes de restaurar; confirmação explícita de substituição no produto. Falha não altera dados atuais.
8. Estados de carregamento, vazio, erro e sucesso; navegação por teclado, rótulos e layout móvel sem rolagem horizontal.
9. Dados reais ficam fora do Git. Sem dados de demonstração carregados silenciosamente.
10. Cliques repetidos não duplicam sessões nem consumo; transações e IDs estáveis protegem reenvios.

## Fora desta versão
Contas, sincronização, catálogo nutricional externo, prescrição de treinos/dietas, metas clínicas, publicação da aplicação na internet e funcionamento offline após fechar o servidor.
