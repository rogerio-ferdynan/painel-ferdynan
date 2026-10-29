# Padrão de qualidade do Painel Ferdynan

Base: guia de UX/UI fornecido pelo proprietário em 29/10/2026. Aplicado a um painel pessoal protegido, com foco em tarefas, agenda, finanças e índice do computador. Não se trata de certificação, pesquisa com usuários ou auditoria completa de segurança.

## Requisitos verificáveis

| Área | Critério | Verificação |
|---|---|---|
| Navegação | Seis seções identificadas; endereço conserva a seção; voltar/avançar funciona | Browser: abrir Agenda, atualizar e voltar à visão geral |
| Teclado | Link para pular navegação, foco visível, setas/Home/End nas abas | Browser: usar Tab e setas; apenas aba selecionada entra na sequência de Tab |
| Formulários | Rótulos, validação nativa e indicação de campo inválido | Browser: enviar formulário incompleto e corrigir |
| Celular | Controles principais com alvo de 44px; campos de 16px; colunas simplificadas em telas estreitas | Inspecionar 360px, 390px, 768px e zoom de 200%; tabelas podem rolar internamente |
| Movimento | Respeitar preferência por movimento reduzido | Emular preferência e navegar |
| Desempenho | Spotify só requisitado na seção Shows; Bandsintown só em Divulgação; índice paginado | Inspecionar rede; nunca carregar o inventário completo na abertura |
| Privacidade | Conteúdo protegido sem cache público e com orientação de não indexação | Testes HTTP de sessão, no-store e X-Robots-Tag |
| Recuperação | Página 404 com caminho para voltar ao painel; erro de API permanece JSON | Testes de resposta HTML/JSON |
| Dados | Preservar revisões de escrita, catálogo privado e dados existentes | Suítes de estado, agenda, catálogo, OAuth e divulgação |

## Sistema visual

`web/quality.css` documenta tokens semânticos de superfícies, texto, foco, espaçamentos, raios e duração. Preto/grafite e dourado preservam a identidade existente. Botão primário indica ação principal; secundários apoiam navegação e exportação; mensagens usam texto além da cor. Campos têm estados normal, foco, inválido e desabilitado.

## Limites e próximos testes

Não foram medidos Core Web Vitals de campo (LCP/INP/CLS no percentil 75), nem realizadas entrevistas, testes com leitores de tela, avaliação de contraste de todos os componentes ou testes em aparelhos físicos. Esses itens não devem ser declarados aprovados sem evidência. Não atribuir pontuação premium ou conformidade WCAG integral por inspeção de código.

SEO público, sitemap de conteúdo privado, rastreamento de comportamento e nova coleta de dados não são objetivos deste painel. A orientação de não indexação complementa a autenticação, sem substituí-la. Cache privado permanece desativado para evitar exposição de dados.

## Rotina de aprovação

Após mudanças de comportamento, executar as suítes pertinentes e construir o Worker. Verificar navegador quando disponível, incluindo retorno a uma seção, teclado e tarefa principal. Registrar honestamente indisponibilidade da automação. Preservar banco, domínio e público da hospedagem. Guardar inventários reais somente no banco privado.

## Evidências desta rodada — 29/10/2026

Na prévia com banco isolado: Agenda permaneceu selecionada após recarregar; ArrowLeft ativou Shows mantendo o foco na aba; Voltar retornou à Agenda. O iframe do Spotify não tinha `src` antes de entrar em Shows e recebeu o endereço depois da seleção. Não houve erro registrado no console consultado. As suítes de dados/autenticação, catálogo, agenda própria, divulgação e Google simulado passaram. A resposta 404 HTML, o erro de API JSON e o cabeçalho de não indexação têm verificações automatizadas. Não foram realizados nesta rodada testes em aparelhos físicos nem medição de Core Web Vitals.
