# Uso local e dados do Fitness Lab

## Executar localmente

Requisitos: Node.js **24 LTS recomendado** (mínimo 22.12), npm e navegador moderno. O projeto não exige banco externo, login, chave de API ou arquivo `.env`.

```sh
git clone https://github.com/cristianworth/fitness-lab.git
cd fitness-lab
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

### Demonstração com histórico

Está disponível um [arquivo JSON demonstrativo](../public/demo/fitness-lab-demo.json) com 24 treinos, 2 rotinas, 10 exercícios, 12 alimentos da TACO e 55 dias de alimentação fictícia. Com o app rodando, [baixe o arquivo local](http://127.0.0.1:5173/demo/fitness-lab-demo.json) e importe em **Seus dados**. A importação substitui os registros: exporte seu backup antes. A demo não é carregada automaticamente.

Veja [fontes, unidades, datas e limites da simulação](demo-data.md). `npm run demo:generate` reproduz o arquivo. Em Evolução, o supino passa de 30 a 35 kg com platôs e uma semana mais leve. O app não mede composição ou definição corporal.

## Dados, unidades e limites

- Dados pertencem à **origem + perfil do navegador**. `localhost` e `127.0.0.1`, portas diferentes e outros navegadores possuem bancos distintos. A aplicação não sincroniza dispositivos.
- Limpar dados do site, encerrar navegação privada ou a política de armazenamento do navegador pode remover registros. **Exporte backups regularmente.** “Solicitar proteção dos dados” é uma tentativa sujeita à decisão do navegador, não uma garantia.
- Backup contém todos os registros em JSON, esquema `1`, máximo **20 MiB em UTF-8**. Importação valida estrutura, limites, datas, IDs e referências antes de substituir os dados. Mantenha esses arquivos privados e fora do repositório.
- Gravação é transacional. Alterações excedendo os limites ou falhando por falta de espaço não substituem o estado anterior. Há um limite conservador para manter o estado sempre exportável.
- Quilogramas representam **carga externa**. Exercício com peso corporal pode usar 0 kg; o peso corporal não é estimado. Volume = repetições × carga externa de séries feitas em sessões concluídas.
- Nutrientes: energia em kcal; proteína, carboidrato e gordura em g por 100 g/ml. Não existe conversão automática de g para ml. Zero é conhecido; campo vazio é desconhecido. Totais parciais são identificados.
- Fuso inicial: `America/Sao_Paulo`. Sessão pertence ao dia do início nesse fuso; datas do diário são datas civis, sem conversão acidental para UTC.
- Limites de entrada: 30 séries planejadas por exercício, 100 séries registradas por exercício/sessão, 1.000 repetições, 2.000 kg externos, 100.000 g/ml por consumo e 10.000 por valor nutricional. São limites técnicos, não recomendações de saúde.
