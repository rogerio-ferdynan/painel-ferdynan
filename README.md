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

## Agenda própria — sem configuração

A aba **Agenda** permite cadastrar, editar e cancelar shows, ensaios e compromissos, com cliente, local, horários de Brasília, cachê, custo e valor recebido. Usa `state.agenda` no mesmo banco central e no backup completo; nenhuma credencial externa é necessária. Registros antigos sem agenda continuam válidos.

A tela mostra próximos compromissos, saldo a receber e lucro previsto dos eventos confirmados. Esses valores são independentes dos indicadores e tabelas anteriores, para preservar os lançamentos existentes. Há busca, filtros, alerta de conflito de horário, preenchimento opcional com a tabela 2026 e exportação `.ics` para importação manual em outros calendários. A exportação não sincroniza alterações futuras.

Testes: `node scripts/test-agenda.mjs` e `node scripts/test-cloud.mjs` (inclui agenda compartilhada entre sessões e rejeição de revisão antiga). Prévia isolada: construa o Worker e execute `node scripts/preview.mjs`; usa banco temporário e senha de teste `preview-only`, sem dados de produção.

## Google Agenda (opcional)

A opção recolhida **Google Agenda · conexão opcional**, dentro da aba Agenda, usa autorização própria da Google Calendar API para a agenda `contato@rogerioferdynan.com`. A agenda própria funciona sem ela. Os registros próprios e os eventos Google são independentes; conectar não transfere nem sincroniza automaticamente os dois conjuntos. A integração instalada no chat não é reutilizada como credencial do site.

### Configuração única

1. Habilite a Google Calendar API no Google Cloud.
2. Configure a tela de consentimento; em modo de teste, adicione a conta da agenda como usuário de teste.
3. Crie um cliente OAuth do tipo Aplicativo da Web.
4. Cadastre exatamente esta URI de retorno: `https://painel.rogerioferdynan.com/api/calendar/oauth/callback`.
5. Entre no painel, abra Google Agenda e preencha o ID e o segredo no formulário de configuração protegida. Depois clique em Conectar Google Agenda e autorize na conta correta.

O segredo do cliente e os tokens são cifrados com AES-GCM no banco. A chave `GCAL_TOKEN_KEY` fica somente nos secrets do servidor. Também é possível fornecer `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` por secrets, sem usar o formulário.

O fluxo OAuth usa state, PKCE e validação da sessão. A agenda permite consultar períodos de até 93 dias, criar e editar eventos, verificar horários sobrepostos e evitar envios duplicados. Não envia convites a terceiros. O Google pode exigir reconexão conforme as regras do aplicativo OAuth, inclusive quando configurado em teste.

Testes adicionais: `node scripts/test-calendar.mjs`. São testes com respostas simuladas: não acessam nem modificam eventos reais. Publicação e testes locais não significam que uma conta Google foi autorizada; a interface informa claramente quando a configuração ou autorização estiver pendente.

Referências oficiais: https://developers.google.com/identity/protocols/oauth2/web-server e https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
