# Decisões técnicas

- React + TypeScript + Vite: SPA local com formulários e estado, alinhada ao interesse de estudo. Sem servidor de dados para a escolha de um dispositivo sem contas.
- IndexedDB: gravações transacionais no navegador. Solicitar armazenamento persistente quando suportado não substitui backup. Limpar dados do navegador remove os registros; origem e perfil do navegador identificam o banco.
- Estado versionado, snapshots de exercícios/rotinas/alimentos nos registros. Transações leem o último estado antes de aplicar comandos; IDs evitam reenvios duplicados.
- Datas de diário são YYYY-MM-DD; instantes são ISO UTC; sessão recebe dia de início no fuso configurado.
- Versão da aplicação vem do package.json; versão do esquema de backup é independente.
- SDD em Markdown por proporcionalidade. Spec Kit acrescentaria configuração sem benefício necessário para esta primeira entrega pequena.
- GitHub público autorizado para código. Hospedagem da aplicação exige decisão posterior.

## Fontes oficiais consultadas
- https://react.dev/learn/build-a-react-app-from-scratch
- https://vite.dev/guide/
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist

## Ambiente observado
Windows 10, Node.js 24.20.0, npm 11.19.0 e Git disponíveis. GitHub CLI não encontrada no PATH. Playwright atual documenta Windows 11+; validação local precisa registrar essa limitação de suporte.
