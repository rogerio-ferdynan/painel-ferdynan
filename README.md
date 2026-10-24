# Painel Ferdynan

Painel com tabela 2026, tarefas, controle de shows, clima e chat Tawk.to.

## Publicação com senha e dados centrais

A versão completa roda no Sites como um Cloudflare Worker, com banco D1 no binding `DB`. O GitHub contém apenas código. GitHub Pages não executa esse servidor nem protege os dados com senha.

Os arquivos editáveis da interface estão em `web/`; o servidor está em `worker/index.mjs`. Para construir: `node scripts/build-cloud.mjs`. `dist/` é gerado e não deve ser editado manualmente.

Secrets obrigatórios no Sites: `PANEL_PASSWORD_HASH` e `PANEL_PASSWORD_SALT`. Eles nunca devem ser gravados no repositório. O hash usa PBKDF2-SHA256, 100.000 iterações, 32 bytes, com salt textual UTF-8.

Todas as páginas, assets e operações de dados exigem uma sessão no servidor. Há limite de tentativas e expiração de sessão. O banco salva um documento compartilhado com revisão para detectar edições concorrentes. Dados de outros dispositivos são carregados ao entrar e consultados a cada 15 segundos enquanto não há edição local pendente.

Ao abrir pela primeira vez, use “Importar dados deste navegador” no dispositivo que possui os dados existentes. Backups JSON antigos podem ser restaurados pela interface e enviados ao banco. Os dados locais nunca são sobrescritos automaticamente quando o banco está vazio.

## Acesso ao painel

[Entrar no painel protegido](https://painel-ferdynan-omni-231026.goldenwhale131.chatgpt.site/)

O index.html da raiz encaminha ao servidor protegido. GitHub Pages não executa o banco D1. A senha e os registros reais do banco não são publicados no GitHub.

## Verificação

Use Node.js 24 ou superior: `node scripts/build-cloud.mjs` e `node scripts/test-cloud.mjs`. Os testes usam SQLite em memória e credenciais fictícias.

Alterações são enviadas automaticamente desde a primeira edição. Aguarde **Salvo na nuvem** antes de fechar. Fechar uma janela anônima encerra a sessão, mas preserva os registros já enviados ao banco.
