# Changelog

Versões seguem SemVer. A primeira entrega 0.1.0 está autorizada e pode conter vários commits. Antes de uma versão futura, propor o número e confirmar atualização de changelog/manifests/interface conforme as instruções de colaboração.

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
