# Fitness Lab

Aplicativo pessoal de treinos e alimentação, em português do Brasil. React + TypeScript + Vite, com persistência IndexedDB no navegador. **Versão 0.1.0.**

Experimento de desenvolvimento majoritariamente por IA, com especificação, delegação, implementação e revisão independente. O código está em [cristianworth/fitness-lab](https://github.com/cristianworth/fitness-lab).

## Executar localmente

Requisitos: Node.js **24 LTS recomendado** (mínimo 22.12), npm e navegador moderno. O projeto não exige banco externo, login, chave de API ou arquivo `.env`.

```powershell
cd D:\Repo\fitness-lab
npm ci
npm run dev
```

Abra **http://127.0.0.1:5173**. Mantenha o terminal aberto; `Ctrl+C` encerra o servidor. Para iniciar novamente, use `npm run dev` no mesmo diretório.

Para conferir a versão de produção:

```powershell
npm run build
npm run preview
```

Encerre o servidor de desenvolvimento antes de abrir o preview, que usa o mesmo endereço e porta para preservar a origem dos dados. A porta é fixa: se estiver ocupada, encerre o outro servidor, em vez de trocar o endereço sem exportar um backup.

## O que está incluído

- Painel de hoje, treinos concluídos, energia e proteína registradas.
- Cadastro/edição de exercícios e rotinas com séries e repetições planejadas.
- Uma sessão ativa por vez, rascunhos por série, conclusão e retomada após recarga.
- Histórico com nomes, planejamento e execução preservados. Evolução por maior carga e volume de carga externa.
- Cadastro de alimentos por 100 g ou 100 ml; diário com quantidade, refeição e data; correção e remoção de consumo.
- Backup JSON validado, exportação, restauração atômica e recuperação mesmo após falha de leitura do banco.
- Layout responsivo, navegação por teclado, estados vazios e feedback de gravação.

## Experimentar os fluxos

1. **Treinos → Exercícios → Novo exercício:** crie “Agachamento de exemplo”, grupo “Pernas”. São dados fictícios para experimentar, não uma prescrição.
2. **Rotinas → Nova rotina:** crie “Rotina de exemplo”, adicione o exercício e defina duas séries de dez repetições.
3. **Iniciar treino:** informe repetições e carga em kg. **Concluir** salva e marca a série como feita; o botão com ícone de disquete salva somente o rascunho. Alterações ainda não salvas bloqueiam a saída e a finalização até você salvar.
4. Recarregue depois de salvar: a sessão deve continuar disponível. Conclua uma série e **Finalize o treino**. Em **Evolução**, abra os detalhes e alterne entre maior carga e volume.
5. **Alimentação → Meus alimentos:** cadastre um alimento fictício com 120 kcal e 10 g de proteína por 100 g. Deixe um nutriente em branco para observar a indicação de total parcial.
6. **Diário alimentar:** registre 150 g; o resultado esperado é 180 kcal e 15 g de proteína. Edite a quantidade para 200 g: 240 kcal e 20 g de proteína. Troque a data para consultar outro dia.
7. Edite os nutrientes do alimento no cadastro. O consumo anterior mantém os valores originais; novos consumos usam o cadastro atualizado.
8. **Seus dados → Exportar backup:** guarde o JSON. Importe-o, confira o resumo e confirme a substituição somente se quiser restaurar esse arquivo. Arquivos inválidos não alteram os registros.

O app começa vazio. Os exemplos acima e os dados dos testes são fictícios. Testes automatizados usam perfis isolados e não alteram seus registros pessoais.

## Dados, unidades e limites

- Dados pertencem à **origem + perfil do navegador**. `localhost` e `127.0.0.1`, portas diferentes e outros navegadores possuem bancos distintos. A aplicação não sincroniza dispositivos.
- Limpar dados do site, encerrar navegação privada ou a política de armazenamento do navegador pode remover registros. **Exporte backups regularmente.** “Solicitar proteção dos dados” é uma tentativa sujeita à decisão do navegador, não uma garantia.
- Backup contém todos os registros em JSON, esquema `1`, máximo **20 MiB em UTF-8**. Importação valida estrutura, limites, datas, IDs e referências antes de substituir os dados. Mantenha esses arquivos privados e fora do repositório.
- Gravação é transacional. Alterações excedendo os limites ou falhando por falta de espaço não substituem o estado anterior. Há um limite conservador para manter o estado sempre exportável.
- Quilogramas representam **carga externa**. Exercício com peso corporal pode usar 0 kg; o peso corporal não é estimado. Volume = repetições × carga externa de séries feitas em sessões concluídas.
- Nutrientes: energia em kcal; proteína, carboidrato e gordura em g por 100 g/ml. Não existe conversão automática de g para ml. Zero é conhecido; campo vazio é desconhecido. Totais parciais são identificados.
- Fuso inicial: `America/Sao_Paulo`. Sessão pertence ao dia do início nesse fuso; datas do diário são datas civis, sem conversão acidental para UTC.
- Limites de entrada: 30 séries planejadas por exercício, 100 séries registradas por exercício/sessão, 1.000 repetições, 2.000 kg externos, 100.000 g/ml por consumo e 10.000 por valor nutricional. São limites técnicos, não recomendações de saúde.

## Verificar o projeto

```powershell
npm run check
npm run test:e2e
```

`check` executa Vitest, TypeScript e build Vite. Testes de navegador usam Microsoft Edge instalado no Windows e Chromium no Linux. Para instalar o navegador no Linux/macOS: `npx playwright install chromium` (em Linux CI: `npx playwright install --with-deps chromium`).

O ambiente inicial usa Windows 10 e Node 24.20.0. Playwright atual documenta suporte a Windows 11+; a execução local com Edge é evidência observada, não garantia de suporte oficial ao Windows 10. O workflow GitHub Actions executa os mesmos checks em Ubuntu.

Testes cobrem snapshots, cálculos, datas, reenvios, concorrência, limites/rollback e os fluxos pelo navegador em desktop e viewport móvel. Axe verifica problemas de acessibilidade detectáveis automaticamente; isso não substitui avaliação humana com tecnologias assistivas. Relatórios e capturas ficam ignorados em `test-results/` e `playwright-report/`.

## Organização e decisões

`src/domain.ts` contém regras puras e validações. `src/repository.ts` implementa IndexedDB. `src/App.tsx` integra navegação, visão do dia e backups. `src/pages/` contém treinos, alimentação e evolução. Contratos estão em `src/types.ts`.

SDD proporcional em Markdown: [requisitos](docs/spec.md), [plano](docs/plan.md), [decisões e fontes](docs/decisions.md), [validação](docs/validation.md), [retomada](docs/handoff.md) e [changelog](CHANGELOG.md).

## Limitações desta versão

Sem contas, sincronização, catálogo nutricional externo, prescrição de dieta/treino, exclusão de cadastros ou edição de treinos finalizados. Correções de alimentação estão disponíveis. Rascunhos de séries usam gravação explícita; não feche o navegador antes de salvar.

Não há service worker ou instalação PWA: o servidor precisa estar disponível para abrir o app. A interface foi projetada para celular e testada com viewport móvel; uso em celular físico exige servir a aplicação em contexto seguro (HTTPS). Hospedagem pública da aplicação não foi realizada. O repositório GitHub público contém apenas o código e documentação.
