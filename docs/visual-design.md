# Identidade visual — Fitness Lab

## Problema e objetivo

Em outubro de 2026, Cristian pediu uma revisão da interface: excesso de cinza e branco, aparência genérica e um ícone que não identificava o projeto. O objetivo foi tornar o diário reconhecível e apresentável como portfólio sem mudar seus contratos de dados ou dificultar o registro durante o treino.

O público e a tarefa principal continuam os mesmos: uma pessoa registrando séries, repetições, carga e alimentação em um dispositivo. A metáfora escolhida foi o caderno de treino. A primeira tela oferece uma ação clara e mostra uma ficha com conteúdo real da rotina cadastrada.

## Sistema visual

| Papel      | Valor     | Uso                                             |
| ---------- | --------- | ----------------------------------------------- |
| Cobalto    | `#2836BC` | Marca, navegação, botões principais e gráficos. |
| Laranja    | `#FFB15C` | Bloco de treino e item ativo da navegação.      |
| Lavanda    | `#E8E8FA` | Fundo da aplicação.                             |
| Painel     | `#F7F5FF` | Superfícies de formulários e listas.            |
| Tinta      | `#22234B` | Texto principal.                                |
| Secundário | `#5D5D7C` | Orientações, unidades e metadados.              |

Os tokens estão em `:root` de [styles.css](../src/styles.css). Cores adicionais distinguem bordas, erros e estados de execução. O laranja concentra o destaque no treino; as demais telas usam listas, espaçamento e hierarquia tipográfica para organizar o conteúdo. Não há gradientes, órbitas decorativas nem animação de entrada de cartões.

**Barlow Condensed 700** dá proporção compacta aos títulos e números; **Barlow 400/600** atende leitura, rótulos e controles. A associação da forma condensada com fichas e sinalização esportiva é uma escolha de direção visual do projeto. As três fontes são locais, sem chamada a serviço externo durante o uso, com `font-display: swap` e fallback do sistema. O custo é cerca de 315 KiB adicionais de binários TrueType na primeira carga; foram mantidos os arquivos oficiais completos para evitar uma etapa própria de conversão ou recorte.

## Marca e ícone da aba

O [símbolo FL](../public/brand/fitness-lab-symbol.svg) combina as duas iniciais em uma grade de 64 × 64, com traços de oito unidades e fundo cobalto. As letras são caminhos vetoriais, sem dependência de tipografia instalada. O desenho reduz detalhes para funcionar em tamanhos pequenos e mantém a mesma geometria no favicon, no desktop e no mobile.

O monograma substitui o símbolo de atividade cardíaca usado como marca. Os ícones Lucide permanecem nas funções onde ajudam a reconhecer treino, alimentação, dados e navegação. O desenho original não foi copiado de uma marca esportiva ou fornecido por uma biblioteca de logos.

## Composição e conteúdo

- **Hoje:** ação de iniciar/continuar e ficha dos quatro primeiros exercícios. Uma sessão ativa usa seus snapshots; sem sessão, aparece a primeira rotina. A prévia informa séries e repetições planejadas, sem recomendar um treino automaticamente.
- **Treinos:** títulos mais diretos, formulários legíveis e campos de execução preservados. A numeração dos exercícios representa sua ordem real na sessão.
- **Alimentação:** resumo nutricional, diário e cadastro com hierarquia de leitura consistente. Valores desconhecidos continuam indicados como totais parciais.
- **Evolução:** mesma seleção de exercício e métrica, com cores e tipografia integradas ao sistema. Nenhuma curva ou medida corporal foi inventada pelo redesign.
- **Navegação:** barra lateral no desktop; marca no início do conteúdo e cinco destinos na base da janela móvel. O link da marca respeita o bloqueio de saída quando há séries não salvas.

Foram removidos o avatar fictício, o slogan de barra superior, os números decorativos em rotinas e a ilustração abstrata do painel. Estados vazios e erros passaram a dizer o que fazer ou o que falhou. A marca móvel foi acrescentada depois da inspeção da primeira captura, pois a identidade desaparecia quando a barra lateral era ocultada.

## Implementação e validação

A mudança ficou em [App.tsx](../src/App.tsx), nas [páginas](../src/pages/), no CSS e nos assets públicos. Não houve mudança em domínio, persistência ou esquema de backup. Novas dependências JavaScript não foram necessárias.

O cenário [design.spec.ts](../e2e/design.spec.ts) importa a demo em um perfil isolado, visita as cinco telas, confere assets locais, navegação por teclado, transbordamento horizontal e problemas detectáveis pelo Axe. Produz capturas de desktop e mobile e verifica também largura de 320 px. Os testes de fluxos protegem o registro de treino, snapshots nutricionais, backup e rascunhos ao navegar pelo logo. O resultado da execução está em [validation.md](validation.md).

Foco visível, controles principais com pelo menos 44 px de altura e redução de movimento orientam o CSS. A referência WCAG 2.5.8 define 24 × 24 px ou condições de espaçamento/exceção; 44 px é uma decisão de conforto deste projeto, não uma afirmação de que todos os links atendem ao critério aprimorado. A verificação automática não certifica acessibilidade completa: faltam avaliação com leitor de tela e uso em celular físico.

## Capturas para portfólio

![Painel desktop com dados sintéticos](images/dashboard-desktop.png)

[Ver captura móvel completa](images/dashboard-mobile.png). Capturas feitas em navegador com o JSON público da demo, relógio fixado em 17/10/2026 e viewports de 1280 × 720 e 390 × 844. As páginas completas têm altura maior que a janela. No mobile, a barra fixa aparece na posição correspondente à janela inicial. Não são fotografias de pessoas, dados reais ou mockups de funcionalidades futuras.

## Fontes e autoria

Consultadas em 27/10/2026:

- [Barlow — Jeremy Tribby](https://tribby.com/fonts/barlow/): autoria e famílias tipográficas.
- [Google Fonts: Barlow](https://github.com/google/fonts/tree/main/ofl/barlow) e [Barlow Condensed](https://github.com/google/fonts/tree/main/ofl/barlowcondensed): distribuição dos arquivos e licenças. [Registro local](../public/fonts/FONT-SOURCES.md) com URLs exatas e SHA-256.
- [W3C: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): referência de contraste para texto, incluindo limites de 4,5:1 e 3:1 para texto grande.
- [W3C: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): referência para dimensões e espaçamento de alvos.

Cristian definiu o problema e a direção de revisão. Agentes de IA elaboraram a proposta, implementaram o SVG, reorganizaram o CSS e verificaram o resultado, com revisão independente. Paleta e composição são decisões deste trabalho; as referências acima fundamentam tipografia e critérios técnicos, não constituem um template ou endosso ao projeto. Créditos e licenças estão em [NOTICE.md](../NOTICE.md).
