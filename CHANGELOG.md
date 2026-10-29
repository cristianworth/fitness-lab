# Changelog

Versões seguem SemVer. A primeira entrega 0.1.0 está autorizada e pode conter vários commits. Antes de uma versão futura, propor o número e confirmar atualização de changelog/manifests/interface conforme as instruções de colaboração.

## 0.3.0 — 2026-10-29

Versão, commits, push e publicação gratuita no GitHub Pages autorizados por Cristian para esta entrega.

### Added

- Entrada direta para demonstração, com dados fictícios carregados sem importação manual em banco separado dos registros pessoais.
- Identificação do modo, três sugestões de uso, persistência após recarga e restauração dos exemplos com confirmação.
- Dia demonstrativo identificado em 17/10/2026 e seleção inicial de evolução do supino, preservando o relógio real de novas sessões e do modo pessoal.
- Testes de isolamento, inicialização concorrente, corrupção, falhas de armazenamento/rede e jornada da demo em desktop/mobile.
- Publicação por GitHub Actions condicionada à CI e a testes do build no subdiretório `/fitness-lab/`.
- Guia de demonstração, publicação e resumo para apresentação do projeto no portfólio.

### Changed

- Comandos, importação/exportação e notificações entre abas respeitam o modo ativo; backup da demo recebe nome identificável.
- Marca e JSON usam a base do build para funcionar no GitHub Pages.
- Proteção de rascunhos também cobre a troca de modo e o acesso à restauração de exemplos.

## 0.2.0 — 2026-10-27

Versão autorizada por Cristian para a nova identidade visual e apresentação do projeto como portfólio. O esquema de backup e as regras de dados permanecem compatíveis.

### Added

- Monograma FL original em SVG, compartilhado entre favicon, barra lateral e cabeçalho móvel.
- Fontes locais Barlow e Barlow Condensed, com licenças OFL e registro de proveniência.
- Estudo visual, paleta, decisões, referências e capturas sintéticas no README e documentação.
- Verificações de assets, teclado, telas com demo e largura de 320 px em desktop/mobile.

### Changed

- Cinco telas com paleta cobalto, laranja e lavanda, tipografia compacta e navegação responsiva.
- Painel inicial mostra exercícios, séries e repetições da rotina/sessão em vez de ilustração decorativa.
- Textos de títulos, estados vazios e recuperação mais diretos; removidos avatar e elementos decorativos genéricos.
- Teste de reinicialização reabre a aplicação após encerrar o servidor, evitando disputa com a reconexão automática do Vite.

### Fixed

- Proteção de rascunhos aplicada ao novo link da marca móvel e foco do menu ativo distinguível do fundo laranja.

## 0.1.2 — 2026-10-22

Versão e adoção da licença MIT autorizadas por Cristian. Entrega de documentação e metadados, sem alteração dos fluxos ou do esquema de dados.

### Added

- Licença MIT para o código e a documentação originais, com créditos e distinção dos materiais de terceiros.
- Guias de contribuição e segurança/privacidade para participantes externos.
- Documentação da arquitetura, fluxo de dados, objetivo e processo de desenvolvimento com IA, decisões humanas, revisão e evidências das entregas.

### Changed

- README com motivação, clonagem independente de diretório local, orientação para contribuir, próximos passos e licença.
- Versão 0.1.2 consistente em manifests e interface; metadado de licença MIT nos manifests.

## 0.1.1 — 2026-10-17

Versão autorizada por Cristian para a entrega dos dados demonstrativos.

### Added

- Dataset fictício importável: 24 treinos em oito semanas, duas rotinas, dez exercícios, 12 alimentos TACO e 926 consumos em 55 dias.
- Progressão de carga com platôs, semana leve, séries planejadas/realizadas e histórico nutricional com unidades e valores desconhecidos preservados.
- Gerador reproduzível, arquivo JSON público e documentação das fontes ACSM/NHS/TACO, convenções e limites sobre composição corporal.
- Três testes do dataset e fluxo de importação, persistência, evolução e exportação em desktop/mobile.

## 0.1.0 — 2026-10-17

### Added

- Especificação inicial, plano e contratos para diário pessoal de treinos e alimentação.
- Regras de treino e alimentação com snapshots históricos, datas por fuso e cálculo de nutrientes conhecidos.
- Persistência IndexedDB transacional, validação de backup e proteção contra reenvio.
- Interface responsiva em português com painel do dia, exercícios, rotinas, sessão ativa, alimentação e evolução.
- Exportação/importação de backup, recuperação após falha de leitura e proteção de rascunhos em edição.
- Planejamento original separado da execução e limite de backup unificado em bytes UTF-8.
- 35 testes de domínio/persistência e 14 testes de navegador em desktop/mobile, incluindo reinicialização e checagens Axe.
- Workflow GitHub Actions, roteiro de execução/teste e registro de decisões/revisão.
