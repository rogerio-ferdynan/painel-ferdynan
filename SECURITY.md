# Segurança — OMNI LEGACY

## Comunicação responsável
Não publique vulnerabilidades, credenciais, dados pessoais ou evidências sensíveis em issues ou pull requests públicos. Use o canal privado de comunicação com o mantenedor ou a opção de relato privado do GitHub, quando habilitada. Não envie segredos em texto aberto.

## Escopo
Frontend, Worker, D1, autenticação, integrações, cadeia de dependências e infraestrutura de hospedagem.

## Resposta a incidentes
Preservar evidências em ambiente privado; avaliar impacto; revogar e rotacionar credenciais comprometidas; corrigir em branch isolada; validar com dados fictícios; solicitar autorização antes de alterações em produção. A remoção de um segredo do código não o remove do histórico.

## Recuperação
Backups devem permanecer fora do repositório público. Validar restauração em banco isolado, conferir contagens e conteúdo, documentar RPO/RTO observados e preservar o estado anterior. Nunca testar restauração destrutiva em produção.

## Estado da homologação
CI aprovado não equivale a auditoria de segurança. A homologação exige evidências de testes, revisão de permissões, histórico de credenciais, recuperação e integridade. Nenhuma certificação é reivindicada.
