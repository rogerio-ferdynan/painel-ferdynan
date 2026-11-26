# OMNI LEGACY — instruções de engenharia

## Missão
Reduzir esforço humano e preservar dados. Evoluir incrementalmente, sem reconstruir funcionalidades existentes sem evidência de necessidade.

## Limites
- Trabalhar em branches de desenvolvimento e Pull Requests; não publicar, fazer merge em produção ou executar migrações reais sem autorização explícita.
- Nunca incluir credenciais, dados privados, backups reais ou inventários no repositório público, logs ou PRs.
- Não enviar mensagens reais, comprar, contratar ou movimentar dinheiro.
- Preservar dados originais, exigir revisão para alterações críticas e manter recuperação testável. Não confundir automação com autorização.

## Processo
1. Inspecionar código, documentação, histórico e testes relevantes antes de alterar.
2. Priorizar segurança, integridade, segregação de dados e reversibilidade desde a fundação.
3. Implementar a menor mudança que resolve o problema; evitar dependências desnecessárias.
4. Executar testes pertinentes em ambiente isolado com dados fictícios. Nunca apontar testes para produção.
5. Registrar evidências, comandos, resultados, limitações e estratégia de reversão no PR. Não declarar sucesso sem testes.
6. Continuar tarefas independentes quando uma integração estiver bloqueada; não inventar resultados.

## Arquitetura existente
Consultar README.md e UX_QUALITY.md. Preservar frontend web/, Worker, D1 e fluxo Netlify. Confirmar os comandos e arquivos no checkout antes de executar. Node.js 24 é o requisito documentado.

## Roadmap
P0 auditoria; P1 dados, segurança e governança; P2 padronização; P3 integrações; P4 automação; P5 inteligência preventiva; P6 UX; P7 segurança e recuperação; P8 escala. Governança e testes são transversais, não adiados para o fim.

## Critério de conclusão
Código revisável, testes executados ou explicitamente bloqueados, documentação atualizada, nenhuma perda silenciosa, nenhuma ação de produção não autorizada. Manter interface orientada a decisões e métricas com origem verificável.
