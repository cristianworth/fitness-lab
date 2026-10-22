# Objetivo e processo de desenvolvimento

## Motivação

O projeto foi proposto por Cristian como um experimento pessoal desenvolvido majoritariamente por IA, para estudo, prática e possível portfólio. O resultado desejado era uma aplicação funcional de registro de treinos e alimentação. O experimento também explora delegação entre agentes, verificação de requisitos e continuidade do trabalho em um repositório versionado.

Cristian trouxe experiência em C#, SQL Server e JavaScript e interesse em React/TypeScript. Essa preferência ajudou a orientar a stack, junto ao requisito de uma interface confortável para registrar séries durante o treino. O foco permaneceu no registro e na consulta; prescrição automática não fez parte do escopo aprovado.

## Decisões de produto que determinaram a solução

| Escolha confirmada                             | Consequência na implementação                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| Uso pessoal em um dispositivo, sem login       | Persistência no navegador, sem autenticação ou backend remoto.                   |
| Backup exportável                              | Estado validado, JSON com versão de esquema e restauração atômica.               |
| Alimentos cadastrados manualmente por 100 g/ml | Cálculo proporcional de calorias/macros, sem dependência de API nutricional.     |
| Prioridade para registrar o treino em execução | Sessão ativa, rascunhos por série, feedback de gravação e retomada após recarga. |

## Como o trabalho foi organizado

1. **Alinhamento:** uma rodada de perguntas definiu as escolhas acima antes de implementar comportamentos dependentes delas.
2. **Pesquisa e especificação:** documentação oficial apoiou as decisões técnicas. Requisitos e critérios verificáveis foram escritos em [spec.md](spec.md), com plano e decisões separados.
3. **Contratos e delegação:** o agente principal coordenou tipos compartilhados, integração e Git. Subagentes trabalharam em domínio/persistência, interface e pesquisa/revisão, com responsabilidades delimitadas.
4. **Implementação:** entregas introduziram regras, persistência, páginas e backup. O projeto escolheu SDD manual em Markdown, sem Spec Kit, para manter o planejamento proporcional ao tamanho da aplicação.
5. **Verificação e revisão:** testes automatizados e conferência pela interface acompanharam o trabalho. Outro agente revisou o código; problemas encontrados foram corrigidos antes de fechar a entrega.
6. **Versionamento:** commits coesos, tags e GitHub Actions registraram a evolução. Releases foram autorizadas pelo mantenedor; a versão exibida é derivada do package.json.

O uso de IA abrangeu planejamento técnico, pesquisa, escrita de código, documentação e testes. A aprovação de produto e releases permaneceu com Cristian. “Revisão independente” neste histórico significa revisão por outro agente, não auditoria externa, certificação de segurança ou avaliação clínica. O repositório registra artefatos e evidências; não pretende fornecer uma transcrição integral dos prompts nem uma medida de produtividade comparativa com desenvolvimento humano.

## Entregas e evidências

| Entrega           | Resultado                                                                             | Referência no histórico                                                |
| ----------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 0.1.0, 17/10/2026 | Diário de treinos/alimentação, persistência, backup, evolução e interface responsiva. | [Tag v0.1.0](https://github.com/cristianworth/fitness-lab/tree/v0.1.0) |
| 0.1.1, 17/10/2026 | Histórico fictício reproduzível com fontes de treino e composição nutricional.        | [Tag v0.1.1](https://github.com/cristianworth/fitness-lab/tree/v0.1.1) |

Na validação da 0.1.1, passaram 38 testes unitários/dataset, 16 cenários de navegador em desktop e viewport móvel, checagem de tipos e build. O [CI dessa entrega](https://github.com/cristianworth/fitness-lab/actions/runs/39057504885) passou. Isso é uma evidência vinculada à versão, não a promessa de que qualquer ambiente ou mudança futura funcionará sem nova verificação.

## O que a revisão mudou de fato

Algumas correções ajudam a entender o processo além da escolha de ferramentas:

- A restauração precisava continuar acessível mesmo quando o estado local estava corrompido; o fluxo foi disponibilizado na tela de erro.
- O limite do backup precisava considerar bytes UTF-8, não apenas quantidade de caracteres; a regra foi centralizada e aplicada antes da gravação.
- Planejado e realizado precisavam de campos próprios para que o histórico não confundisse metas com execução.
- Duas abas podiam ter rascunhos diferentes; foi necessário sincronizar dados persistidos e tratar conflito de edição.
- A checagem de acessibilidade detectou contraste insuficiente; cores e tamanhos foram ajustados.

As evidências e limites estão em [validation.md](validation.md). Testes em viewport móvel não equivalem a testes em celular físico, e Axe não substitui avaliação com tecnologias assistivas.

## Dados demonstrativos e próximos aprendizados

O dataset de demonstração veio de uma solicitação posterior: popular o produto com um histórico plausível. Princípios gerais de treino foram consultados em ACSM/NHS e composição alimentar na TACO/Unicamp. Cargas, porções e sequência temporal são fictícias, identificadas como DEMO. As fontes não descrevem uma pessoa real nem sustentam uma transformação corporal específica. Veja [proveniência e convenções](demo-data.md).

Evoluções como funcionamento offline, edição de histórico ou medidas corporais permanecem propostas. Cada uma deve partir de um problema concreto, definir critérios de aceitação e preservar os dados existentes. A intenção é manter o projeto compreensível para estudo e contribuição, sem transformar todas as possibilidades em escopo obrigatório.
