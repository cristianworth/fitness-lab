# Dados demonstrativos pesquisados

Este conjunto é **inteiramente fictício**. Exercícios e alimentos existem; datas, execução, cargas, porções e resultados são uma simulação criada para explorar o produto, sem representar Cristian ou uma pessoa real. Não constitui uma prescrição individual de treino ou dieta.

## Usar e exportar

- Arquivo: [fitness-lab-demo.json](../public/demo/fitness-lab-demo.json), compatível com o esquema 1 de importação.
- Com o servidor local aberto, baixe em [localhost de desenvolvimento](http://127.0.0.1:5173/demo/fitness-lab-demo.json).
- Em **Seus dados**, exporte seus registros antes de experimentar. Importe o arquivo demonstrativo, confira o resumo e confirme a restauração. **A importação substitui o banco atual; não mescla os registros.**
- Em **Evolução**, selecione “Supino reto com barra” e alterne carga/volume. Em **Alimentação**, consulte, por exemplo, `2026-10-16` para um dia completo ou `2026-10-17` para café da manhã e almoço.
- Use **Exportar backup** para salvar o conjunto carregado, inclusive alterações feitas durante a experiência. Backups pessoais ficam fora do Git.
- `npm run demo:generate` recria o arquivo público com datas fixas. O gerador não acessa nem modifica o banco do navegador. Não é executado automaticamente na inicialização.

São **10 exercícios, 2 rotinas, 24 sessões, 12 alimentos e 926 registros de consumo em 55 dias**, de 24/08 a 17/10/2026, no fuso `America/Sao_Paulo`. As rotinas e sessões usam o prefixo `DEMO`; as refeições usam o sufixo `DEMO`; todos os IDs começam por `demo-`. Os alimentos exibem o número TACO para rastreabilidade. A demo não acompanha a data atual automaticamente.

## Treinos: evidência e escolhas da simulação

A [diretriz ACSM de 2026](https://acsm.org/resistance-training-guidelines-update-2026/) prioriza consistência, treinamento dos grandes grupos musculares pelo menos duas vezes por semana e progressão individualizada. O [NHS](https://www.nhs.uk/live-well/exercise/how-to-improve-strength-flexibility/) descreve 8–12 repetições, pelo menos duas séries e progressão gradual; a [ficha ACSM Resistance Training for Health](https://www.acsm.org/docs/default-source/files-for-resource-library/resistance-training-for-health.pdf) apresenta 2–3 sessões semanais e 2–3 séries de 8–12 repetições.

O conjunto A/B abaixo é uma composição demonstrativa baseada nesses princípios, não uma rotina oficial copiada das fontes. Descansos de 90–120 segundos são contexto fictício; não são registrados pelo app.

| Rotina | Exercícios                                                                                        | Planejamento atual |
| ------ | ------------------------------------------------------------------------------------------------- | ------------------ |
| A      | Agachamento goblet, supino reto com barra, remada sentada, levantamento romeno, abdominal no solo | 3 × 10             |
| B      | Leg press, supino com halteres, puxada frontal, elevação pélvica, panturrilha em pé               | 3 × 10             |

Alternância segunda/quarta/sexta, A/B/A e B/A/B. As primeiras duas semanas usam duas séries; as seguintes usam três, exceto a quinta semana, mais leve e com duas séries. O planejamento de cada sessão é preservado independentemente da rotina atual. Uma última série de abdominal em 16/09 ficou sem executar, demonstrando a diferença entre planejado e feito.

Exemplos sintéticos: supino com barra 30 → 35 kg; goblet 16 → 20 kg; leg press 60 → 70 kg. Há repetições variáveis, cargas estáveis entre sessões e uma redução intermediária. A semana leve é uma escolha narrativa, sem alegar vantagem universal: um [ensaio de 2024](https://pubmed.ncbi.nlm.nih.gov/38274324/) sobre uma semana sem treino não encontrou benefício adicional de hipertrofia. Esse estudo de cessação não equivale a todas as formas de redução de volume/carga.

**Convenções:** barra inclui o peso da barra; goblet é um único halter; supino com halteres usa a soma dos dois; máquinas representam o indicador da mesma máquina, sem comparação entre equipamentos. Abdominal e panturrilha sem carga usam 0 kg externos; volume zero nesses exercícios não significa ausência de esforço.

## Alimentação: TACO 4ª edição

Fonte primária: [Tabela Brasileira de Composição de Alimentos, NEPA/Unicamp, 2011](https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf). Valores por **100 g da parte comestível**, no preparo indicado. Não há conversão para ml, nem equivalência entre alimento cru e cozido.

| Nº  | Alimento                         | kcal         | Proteína (g) | Carboidrato (g) | Gordura (g)  | Página impressa / PDF¹ |
| --- | -------------------------------- | ------------ | ------------ | --------------- | ------------ | ---------------------- |
| 3   | Arroz tipo 1, cozido             | 128          | 2,5          | 28,1            | 0,2          | 26 / 29                |
| 561 | Feijão carioca, cozido           | 76           | 4,8          | 13,6            | 0,5          | 62 / 65                |
| 410 | Frango, peito sem pele, grelhado | 159          | 32,0         | 0,0             | 2,5          | 52 / 55                |
| 488 | Ovo inteiro, cozido 10 minutos   | 146          | 13,3         | 0,6             | 9,5          | 56 / 59                |
| 7   | Aveia em flocos, crua            | 394          | 13,9         | 66,6            | 8,5          | 26 / 29                |
| 182 | Banana prata, crua               | 98           | 1,3          | 26,0            | 0,1          | 36 / 39                |
| 448 | Iogurte natural                  | 51           | 4,1          | 1,9             | 3,0          | 54 / 57                |
| 458 | Leite de vaca integral           | desconhecido | desconhecido | desconhecido    | desconhecido | 54 / 57                |
| 88  | Batata-doce, cozida              | 77           | 0,6          | 18,4            | 0,1          | 30 / 33                |
| 100 | Brócolis, cozido                 | 25           | 2,1          | 4,4             | 0,5          | 32 / 35                |
| 260 | Azeite de oliva extravirgem      | 884          | desconhecido | desconhecido    | 100,0        | 42 / 45                |
| 225 | Mamão Formosa, cru               | 45           | 0,8          | 11,6            | 0,1          | 40 / 43                |

¹ Página PDF contada a partir de 1. Legenda: página impressa 65 / PDF 68. Os asteriscos do leite indicam análises em reavaliação. Proteína e carboidrato do azeite estão como `NA`. Esses campos ficam `null`, nunca zero. O leite está no catálogo, mas não integra o cardápio simulado. O azeite faz os totais de proteína/carboidrato serem parciais, como sinalizado pelo app; calorias e gordura continuam conhecidas.

Porções e combinações são inventadas: café com iogurte, aveia e banana; almoço com arroz, feijão, frango, brócolis e azeite; lanche com mamão, iogurte e aveia; jantar alternando arroz/batata-doce, feijão, ovos e brócolis; banana na ceia. Há pequenas variações ao longo da semana. É um conjunto deliberadamente pequeno para testar o cadastro e os cálculos, não um cardápio personalizado ou afirmação de adequação nutricional. A TACO fornece composição; não fornece essas porções ou esta sequência de refeições.

## Definição corporal: limite do que os dados mostram

O contexto fictício é de alguém que busca mais constância, força e definição ao longo de oito semanas. As fontes sobre [atividade física](https://www.nhs.uk/live-well/exercise/walking-for-health/) e [alimentação](https://www.nhs.uk/better-health/lose-weight/healthy-eating-when-trying-to-lose-weight/) sustentam hábitos gerais, não garantem uma transformação corporal específica.

**O gráfico mostra progressão de desempenho; não mede definição corporal.** Não existe registro de peso, cintura, composição corporal ou fotos neste esquema. Não atribuímos percentual de gordura, perda de peso ou melhora visual a esses números. Os consumos fictícios tampouco comprovam déficit energético sem necessidades individuais verificadas. Exibir uma evolução corporal mensurada exigiria uma funcionalidade própria e medidas independentes; esse possível próximo passo está separado da demonstração atual.

Fontes consultadas em 17/10/2026. Os números nutricionais vêm da TACO; cargas, datas, porções e trajetória são autoria sintética deste projeto.
