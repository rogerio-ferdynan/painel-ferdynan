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

O padrão verificável de interface e as limitações da avaliação estão em [UX_QUALITY.md](UX_QUALITY.md). A navegação por abas aceita teclado, conserva a seção no fragmento da URL e permite voltar/avançar. O painel privado orienta buscadores a não indexá-lo; esse cabeçalho não substitui a senha. O Spotify só carrega quando Shows & resultados é aberto.

Node.js 24 ou superior:

```sh
node scripts/build-cloud.mjs
node scripts/test-cloud.mjs
node scripts/build-netlify.mjs
```

Os testes usam SQLite em memória e credenciais fictícias. A publicação do servidor usa `.openai/hosting.json`; mudar apenas o GitHub não publica automaticamente um novo Worker no Sites.

## Agenda própria — sem configuração

## Central de operações e divulgação

## Estrutura do computador e favoritos

A aba **Estrutura & favoritos** consulta um índice privado de pastas, nomes de arquivos e links por núcleo. Usa paginação, busca por nome, caminhos para copiar e associações dos favoritos. Não abre nem transfere o conteúdo dos arquivos e não fornece acesso remoto ao disco. O mapa é uma fotografia da última varredura, sem sincronização automática com o PC.

O inventário e os links privados ficam nas tabelas `panel_catalog_*` do D1, protegidos pela sessão do painel, fora do código, dos arquivos públicos e do GitHub. Importações entram como uma nova versão e só substituem o índice ativo depois de todos os lotes e contagens serem validados; as versões anteriores são preservadas. Essa base é independente de tarefas, agenda e indicadores.

`scripts/scan-workspace.mjs --root <pasta> --bookmarks <HTML original> --output <pasta privada>` gera o JSON de importação, relatório e uma cópia dos favoritos que preserva o HTML original e acrescenta apenas endereços ausentes, agrupados por núcleo. Endereços repetidos têm uma só entrada no painel, preservando títulos alternativos e associações. Nenhum link privado é consultado na internet durante a classificação. Atalhos são indexados sem seguir seus destinos, para evitar ciclos.

O envio é feito por `scripts/import-catalog.mjs` com configuração e senha via stdin oculto, nunca em argumentos ou arquivos de credenciais. Não adicione o JSON ou os relatórios reais ao repositório. Teste: `node scripts/test-catalog.mjs`.

## Central de operações e divulgação

A visão geral reúne próximo compromisso, contagem regressiva, tarefas pendentes e saldo a receber da agenda. As áreas Tarefas, Shows, Agenda e Divulgação evitam misturar todos os controles na mesma tela. No celular, os núcleos ficam em um menu recolhível. Indicadores existentes continuam editáveis e não são substituídos pelos totais da agenda.

Em Divulgação, há cópia do link e de um texto para redes, atalho para o Manager e widget oficial do artista `id_15376245`. O widget carrega somente ao abrir Divulgação, em iframe isolado sem acesso ao estado privado do painel. A lista depende do serviço externo; um link para o perfil permanece disponível se o widget não carregar. O arquivo de suporte `bandsintown.html` exige autenticação como os outros recursos do painel.

O Link inteligente exclusivo não foi fornecido/confirmado. O endereço inicial é o perfil público do artista, identificado como tal. Um link HTTPS de `bnds.us` ou `bandsintown.com` pode ser salvo opcionalmente em `state.marketing.smartLink`, no banco central e backup. Não há postagem automática nas redes, integração com lista de fãs nem transferência dos valores privados para o Bandsintown.

O botão Ficha do próximo compromisso exporta um `.txt` interno com os dados do compromisso e checklist de conferência. Não envia o arquivo à equipe automaticamente. Testes: `node scripts/test-tour.mjs` e `node scripts/test-cloud.mjs`.

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
