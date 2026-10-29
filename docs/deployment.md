# Publicação no GitHub Pages

A demonstração pública usa hospedagem estática do GitHub Pages, disponível para repositórios públicos no GitHub Free. Está publicada em [cristianworth.github.io/fitness-lab](https://cristianworth.github.io/fitness-lab/), com HTTPS obrigatório e origem `workflow`, verificados em 29/10/2026. [Deploy aprovado](https://github.com/cristianworth/fitness-lab/actions/runs/40928913277) e [validação pública dos fluxos](validation.md). [Documentação do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Configuração inicial

Em [Settings → Pages](https://github.com/cristianworth/fitness-lab/settings/pages), selecionar **Build and deployment → Source → GitHub Actions**. Isso exige permissão administrativa, de manutenção ou permissão específica para gerenciar Pages. Conferir também se as regras do environment `github-pages` permitem publicação a partir de `main`. [Configuração da origem de publicação](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

A configuração inicial também pode ser feita pela API: criação com `POST /repos/cristianworth/fitness-lab/pages`, ou atualização com `PUT` no mesmo endpoint, usando `build_type: "workflow"`. Essa configuração não é feita pelo workflow. Não são necessários PAT nem segredo adicional para o deploy recorrente: ele usa `GITHUB_TOKEN` e OIDC. `configure-pages` mantém `enablement: false`; ativação automática exigiria um token adicional com permissões administrativas. [API do Pages](https://docs.github.com/en/rest/pages/pages), [inputs oficiais de configure-pages](https://github.com/actions/configure-pages/blob/v6/action.yml)

## Fluxo de validação e publicação

O workflow `.github/workflows/ci.yml` preserva as verificações existentes em Ubuntu com Node.js 24:

1. `npm ci` e `npm run format:check`.
2. `npm run check`: testes unitários, TypeScript e build.
3. Instalação do Chromium e `npm run test:e2e`.
4. Novo build com `npm run build -- --base=/fitness-lab/`.
5. `npm run test:pages`, que usa a prévia do build na porta 5184 e a URL `http://127.0.0.1:5184/fitness-lab/`.
6. Upload exclusivo de `dist` e deploy, somente após sucesso de todas as verificações e somente em push para `main` ou execução manual em `main`.

Pull requests validam também o subdiretório, sem publicar. Alterações apenas em `docs/**`, `README.md` ou `CHANGELOG.md` mantêm o filtro atual de push; uma execução manual pode publicar novamente a revisão de `main`. Execuções anteriores de pull requests podem ser canceladas. Em `main`, a concorrência por ref preserva uma publicação em andamento.

O job `check` possui apenas `contents: read`; o job `deploy` possui apenas `pages: write` e `id-token: write`, usa `needs: check` e o environment `github-pages`. O artefato padrão é `github-pages`. [Permissões e dependência entre jobs](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Contrato dos caminhos

O build publicado usa `base=/fitness-lab/`, mantendo o desenvolvimento local na raiz. Vite ajusta referências de assets importados, CSS `url()` e HTML durante o build. URLs montadas no JavaScript precisam usar `import.meta.env.BASE_URL`, por exemplo `${import.meta.env.BASE_URL}demo/fitness-lab-demo.json`; caminhos fixos como `/demo/...` apontam para a raiz do domínio e ignoram o subdiretório. [Base pública do Vite](https://vite.dev/guide/build.html#public-base-path)

Fontes locais e arquivos públicos devem carregar sob `/fitness-lab/`. Ao renomear o repositório ou usar domínio próprio, revisar o argumento `--base`, a configuração dos testes de Pages e a URL publicada. A saída estática continua sendo `dist`; `vite preview` é apenas uma ferramenta de validação local. [Guia do Vite para GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages)

## Actions verificadas

As referências abaixo foram verificadas nas tags oficiais em 2026-10-29 e fixadas por SHA no workflow. As versões atuais de configure-pages e deploy-pages usam o runtime Node.js 24 da própria action. Os exemplos gerais do GitHub Docs ainda podem mostrar majors anteriores; as tags e os manifests das actions foram conferidos diretamente.

| Action                                                                            | Major | SHA fixado                                 |
| --------------------------------------------------------------------------------- | ----- | ------------------------------------------ |
| [checkout](https://github.com/actions/checkout/tree/v7)                           | v7    | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| [setup-node](https://github.com/actions/setup-node/tree/v7)                       | v7    | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| [configure-pages](https://github.com/actions/configure-pages/tree/v6)             | v6    | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| [upload-pages-artifact](https://github.com/actions/upload-pages-artifact/tree/v5) | v5    | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| [deploy-pages](https://github.com/actions/deploy-pages/tree/v5)                   | v5    | `368f82528645a54fb793d4d04e342629a3f51346` |

## Conferência após publicação

Abrir a URL retornada pelo environment `github-pages`; conferir a demonstração, navegação, fontes e download do JSON. Recarregar a página na URL com `/fitness-lab/` e verificar se não há erros de assets ou requisições para caminhos indevidos na raiz. O workflow e os testes locais não confirmam, sozinhos, a ativação do site nem o sucesso de um deploy remoto.
