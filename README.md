# Painel Ferdynan

Endereço de produção: **https://painel.rogerioferdynan.com/**

Código completo: interface em `web/`, servidor em `worker/index.mjs`, banco em `drizzle/` e construção/testes em `scripts/`.

## Domínio próprio

O domínio já aponta para a Netlify. O `netlify.toml` configura uma reescrita interna HTTP 200: o navegador permanece no domínio próprio durante login, navegação, salvamento e logout. Não há redirecionamento HTML, JavaScript ou iframe para outro endereço.

O `index.html` da raiz contém a tela de entrada real. A Netlify executa `node scripts/build-netlify.mjs` e publica `netlify-public/`. A regra forçada mantém páginas e APIs sob a autenticação do servidor.

O servidor e o banco D1 rodam na infraestrutura Sites/Cloudflare. GitHub guarda o código e a Netlify mantém o domínio. O banco existente é preservado.

Referência: https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/

## Senha e dados centrais

A senha é validada no servidor, com limite de tentativas e sessão HttpOnly/Secure. Credenciais e registros do banco não são publicados. Secrets do Sites: `PANEL_PASSWORD_HASH` e `PANEL_PASSWORD_SALT`. O binding D1 é `DB`.

As alterações são salvas automaticamente com controle de revisão. Aguarde **Salvo na nuvem** antes de fechar. Fechar uma janela anônima encerra a sessão, mas os dados enviados ao banco permanecem.

Para os dados antigos, use **Importar dados deste navegador**. Se estiverem em arquivo local ou em outro endereço, exporte **Backup completo** e use **Restaurar** no domínio de produção. O armazenamento local é separado por endereço.

## Construção e testes

Node.js 24 ou superior:

```sh
node scripts/build-cloud.mjs
node scripts/test-cloud.mjs
node scripts/build-netlify.mjs
```

Os testes usam SQLite em memória e credenciais fictícias. A publicação do servidor usa `.openai/hosting.json`; mudar apenas o GitHub não publica automaticamente um novo Worker no Sites.
