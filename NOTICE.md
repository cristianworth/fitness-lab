# Créditos e materiais de terceiros

## Código e documentação

Fitness Lab é um projeto de [cristianworth](https://github.com/cristianworth), desenvolvido com assistência de IA conforme o [relato do processo](docs/development.md). A [licença MIT](LICENSE) cobre o código e a documentação originais do projeto. Ela não altera licenças, titularidade ou condições de materiais de terceiros.

## Dependências

A aplicação usa React, TypeScript, Vite, idb, Zod e ícones Lucide. Vitest, fake-indexeddb, Playwright, Axe e Prettier apoiam a validação e manutenção. A lista de dependências diretas está no [package.json](package.json); versões resolvidas e dependências transitivas estão no [package-lock.json](package-lock.json).

Cada pacote mantém sua própria licença e seus avisos. Consulte os arquivos de licença distribuídos com cada dependência ao redistribuir componentes ou bundles; este documento não é um inventário exaustivo de licenças transitivas.

## Tipografia e identidade visual

Barlow Regular/SemiBold e Barlow Condensed Bold são de Jeremy Tribby / The Barlow Project Authors, copyright 2017, distribuídas sob **SIL Open Font License 1.1**. Os binários originais são servidos localmente e mantêm seus avisos: [Barlow](public/fonts/OFL-Barlow.txt), [Barlow Condensed](public/fonts/OFL-BarlowCondensed.txt). Consulte a [proveniência e os hashes](public/fonts/FONT-SOURCES.md). A licença MIT do projeto não substitui essas licenças.

O monograma FL em [SVG](public/brand/fitness-lab-symbol.svg) foi criado para este projeto e está coberto pela licença MIT. Os ícones funcionais continuam sendo Lucide, sujeitos à licença da dependência. As capturas de portfólio em `docs/images/` mostram exclusivamente o dataset sintético distribuído com a aplicação.

## Dados e referências de demonstração

- **Composição alimentar:** NEPA/Unicamp, _Tabela Brasileira de Composição de Alimentos — TACO_, 4ª edição, 2011. Foram transcritos valores selecionados por 100 g, com número do alimento, preparo e páginas documentados em [demo-data.md](docs/demo-data.md). [PDF original](https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf).
- **Princípios gerais de treino:** fontes da ACSM e NHS, vinculadas em [demo-data.md](docs/demo-data.md). As rotinas A/B, cargas, porções e trajetória temporal foram sintetizadas para demonstração; não são protocolos oficiais dessas instituições.
- **Histórico:** todas as sessões e consumos fornecidos no arquivo demonstrativo são fictícios. Não representam registros de saúde de Cristian ou de outra pessoa real.

A atribuição identifica a origem dos valores e conceitos; não concede licença sobre as publicações originais nem implica endosso de seus autores. O projeto não distribui cópias integrais dessas publicações. Ao reutilizar referências ou ampliar o catálogo, confira os termos da fonte e mantenha a proveniência dos dados.
