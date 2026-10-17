# Changelog

Versões seguem SemVer. A primeira entrega 0.1.0 está autorizada e pode conter vários commits. Antes de uma versão futura, propor o número e confirmar atualização de changelog/manifests/interface conforme as instruções de colaboração.

## 0.1.0 — em desenvolvimento

### Added
- Especificação inicial, plano e contratos para diário pessoal de treinos e alimentação.
- Regras de treino e alimentação com snapshots históricos, datas por fuso e cálculo de nutrientes conhecidos.
- Persistência IndexedDB transacional, validação de backup e proteção contra reenvio, cobertas por 32 testes.
- Interface responsiva em português com painel do dia, exercícios, rotinas, sessão ativa, alimentação e evolução.
- Exportação/importação de backup, recuperação após falha de leitura e proteção de rascunhos em edição.
- Planejamento original separado da execução e limite de backup unificado em bytes UTF-8, cobertos por 34 testes de domínio/persistência.
