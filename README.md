# Painel Ferdynan

[Acessar o painel com senha e banco central](https://painel-ferdynan-omni-231026.goldenwhale131.chatgpt.site/)

O painel funciona no Sites com servidor Cloudflare Worker e banco D1. GitHub Pages não executa o servidor, por isso o index.html encaminha ao endereço seguro.

No primeiro uso, entre no dispositivo que possui os dados antigos e clique em **Importar dados deste navegador**. Após o envio, o banco central estará disponível nos demais dispositivos com a mesma senha. Uma aba anônima perde a sessão ao fechar; os dados já salvos no banco permanecem.

A senha não está no repositório. Ela é validada no servidor, com limitação de tentativas e sessão protegida. Tarefas, indicadores, campos mensais e simulações são persistidos no banco com controle de revisão para evitar sobrescritas silenciosas.

Aguarde o indicador **Salvo na nuvem** antes de fechar a página. Backups JSON continuam disponíveis.
