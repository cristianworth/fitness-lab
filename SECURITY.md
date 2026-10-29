# Segurança e privacidade

## Escopo atual

O Fitness Lab é um aplicativo experimental para uso pessoal. Não oferece garantia de adequação para dados clínicos ou ambientes regulados. Não há uma política de suporte prolongado a versões antigas; relatos devem indicar a versão afetada e, quando possível, se o problema ocorre na versão mais recente.

Os registros ficam no IndexedDB, vinculados à origem e ao perfil do navegador. O app não implementa criptografia adicional dos registros nem do backup JSON. Quem tiver acesso ao perfil/dispositivo ou ao arquivo exportado poderá acessar essas informações. Não há conta, sincronização remota ou envio de registros a um servidor na implementação atual.

Limpar dados do site, usar navegação privada ou sofrer remoção de armazenamento pode apagar o histórico. Guarde backups em um local apropriado e privado. O backup de demonstração do repositório é fictício; ele não deve ser substituído por registros reais em um commit ou pull request.

## Demonstração pública

A demonstração pública distribui arquivos estáticos por HTTPS e carrega um dataset fictício público. As alterações feitas no produto ficam no navegador; não são publicadas no repositório ou enviadas como registros a um backend. O modo demo tem banco separado do pessoal, mas ambos pertencem à mesma origem: não se trata de isolamento de segurança contra código dessa origem. Use dados fictícios para avaliar a demo e mantenha backups pessoais privados.

## Relatar uma vulnerabilidade

Não publique dados pessoais, credenciais, backups reais ou detalhes de exploração em uma issue pública. Se a aba **Security** do GitHub oferecer **Report a vulnerability**, use esse canal privado. A disponibilidade desse recurso depende da configuração do repositório; este documento não afirma que ele está habilitado.

Se o canal privado não estiver disponível, abra uma issue apenas solicitando ao mantenedor um meio privado de contato, sem incluir o conteúdo sensível ou instruções de exploração. Aguarde a definição do canal antes de enviar esses detalhes. Não há endereço de e-mail de segurança ou prazo de resposta declarado pelo projeto.

Em um canal privado acordado, envie versão/commit, ambiente, passos com dados sintéticos, impacto e eventual proposta de correção. Faça testes apenas em instâncias e perfis sob seu controle. A reprodução não deve exigir acesso a dados de terceiros.

## Para quem contribui

Trate backups importados como entrada não confiável. Preserve validação, limites de tamanho e atomicidade da restauração; erros não devem substituir dados válidos. Evite conteúdo executável proveniente de campos de usuário, novas transmissões de dados sem revisão de escopo e dependências sem necessidade demonstrada.

Antes de propor hospedagem pública, autenticação, sincronização ou integrações externas, reavalie os riscos e o fluxo de dados. O servidor de desenvolvimento está configurado para o loopback local; ele não constitui uma configuração de produção para publicação na internet.
