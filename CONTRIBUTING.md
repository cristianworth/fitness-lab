# Contribuindo com o Fitness Lab

Obrigado por considerar uma contribuição. Este é um projeto pessoal e experimental, mantido por [cristianworth](https://github.com/cristianworth). Correções, documentação, acessibilidade e testes são boas formas de começar. Não há prazo garantido de resposta ou revisão.

## Antes de implementar

Consulte o [README](README.md), a [arquitetura](docs/architecture.md) e as [decisões](docs/decisions.md). Para uma alteração ampla, abra uma [issue](https://github.com/cristianworth/fitness-lab/issues) descrevendo o problema e a proposta antes de investir na implementação. Novos serviços, contas, sincronização ou prescrição de treinos/dietas mudam o escopo e precisam de discussão.

Para relatar um defeito, informe versão/commit, navegador/sistema, passos mínimos, comportamento esperado e observado. Use dados fictícios. Não publique backups pessoais, informações de saúde, tokens ou arquivos de perfil do navegador. Suspeitas de vulnerabilidade seguem [SECURITY.md](SECURITY.md).

## Preparar o ambiente

Faça um fork, clone seu fork e instale as dependências com `npm ci`. Use Node 24 para reproduzir a versão principal usada no CI. Execute `npm run dev` e abra `http://127.0.0.1:5173`. O [README](README.md) detalha a porta fixa, o navegador usado nos testes e os dados de demonstração.

Você pode trabalhar em uma branch no seu fork e abrir um pull request para `main`. Mudanças de documentação não exigem executar o app; mudanças no comportamento devem incluir uma conferência prática do fluxo afetado.

## Convenções de implementação

- Identificadores, nomes de arquivos, comentários técnicos e mensagens de commit novos usam inglês; textos do produto e documentação principal usam português do Brasil.
- Preserve os contratos públicos de domínio e persistência. Componentes não devem escrever diretamente no IndexedDB.
- Mantenha snapshots históricos, a distinção entre zero e desconhecido, unidades explícitas e regras de fuso/data.
- Use IDs estáveis em operações reenviáveis e confira a confirmação da gravação antes de apresentar sucesso.
- Prefira alterações focadas. Explique a necessidade antes de introduzir dependência, framework ou reorganização ampla.
- Em mudanças de UI, confira teclado, rótulos, estados de erro/vazio e viewport móvel.
- Nunca adicione registros pessoais reais ao repositório. A demo é sintética e sua fonte é `scripts/generate-demo.mjs`; regenere com `npm run demo:generate`, em vez de editar apenas o JSON gerado.

## Verificar e abrir um pull request

```sh
npm run format:check
npm run check
npm run test:e2e
```

Use `npm run format` para aplicar o padrão do projeto. Para documentação, formatação e conferência de links relativos normalmente bastam. Para lógica e interface, execute as verificações relevantes acima e descreva o resultado. Os testes de navegador usam perfis isolados; não apontam para um perfil pessoal existente.

No pull request, informe o problema, o comportamento após a mudança, como testar e as verificações executadas. Inclua capturas quando ajudarem a avaliar a UI, usando dados fictícios. Se uma verificação não pôde ser feita, diga qual e por quê. Contribuições auxiliadas por IA são aceitas: descreva seu uso e revise o resultado; geração de código não é evidência de funcionamento.

O CI executa formatação, testes, tipos, build e navegador. A aprovação final cabe ao mantenedor. Discuta o código com respeito, use exemplos reproduzíveis e evite ataques pessoais ou divulgação de informações privadas.

## Versões e licença

Leia [CHANGELOG.md](CHANGELOG.md) antes de preparar commits ou merges. Neste projeto, atualizações de versão/changelog são coordenadas com Cristian; não incremente a versão automaticamente em cada commit. Uma entrega pode incluir vários commits. A versão do package.json, lockfile e interface deve permanecer consistente; o esquema de backup tem versão própria.

As contribuições originais devem poder ser distribuídas sob a [MIT](LICENSE). Não copie materiais de terceiros sem conferir seus termos e manter os avisos exigidos. Referências do dataset e das dependências estão em [NOTICE.md](NOTICE.md).
