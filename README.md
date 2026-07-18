# Sistema de Prospecção de Marcas

CRM de prospecção ativa de marcas por e-mail para **criadores de conteúdo de qualquer
nicho** que querem fechar parcerias pagas de forma organizada. **Multiusuário**: cada
criador tem sua conta, com dados totalmente isolados. Selecione o nicho no **Guia** e o
app inteiro se adapta: categorias de marca, hashtags do garimpo, fontes de pesquisa e
dicas de gancho.

O método completo (onde achar marcas, como achar o contato certo, cadência de follow-up,
metas) está em **[PLANO.md](./PLANO.md)**.

## Funcionalidades

- **Contas e login** — cadastro com e-mail e senha (bcrypt + sessão em cookie httpOnly);
  toda consulta é filtrada por usuário no servidor, incluindo tokens do Gmail/Apify/Hunter.
  Cada conta nova já nasce com os templates da cadência e uma campanha de exemplo
- **Guia do nicho** — catálogo de nichos prontos (Viagem & Outdoor, Fitness, Moda & Beleza,
  Gastronomia, Tech & Games, Finanças, Maternidade, Pets, Casa & Decor, Educação, ou
  Geral/Personalizado). Cada nicho traz: quem prospectar, onde pesquisar, hashtags de
  garimpo com um clique e o que observar para o gancho — o playbook vira produto

- **Pipeline Kanban** — arraste marcas entre as etapas: Pesquisada → Contato encontrado →
  E-mail enviado → Follow-up → Respondeu → Negociando → Fechada / Perdida
- **Cadastro de marcas** com sinais de compra (já faz publi? roda anúncios?) que geram um
  **score de prioridade (0–8)** — prospecte primeiro quem já compra
- **Importação em massa por CSV**
- **Descoberta automática de contatos**, em três ferramentas encadeadas:
  1. **Garimpo por hashtag (Apify)** — busca posts de `#publi` do nicho e ranqueia as marcas
     mais mencionadas: quem aparece muito em post de publi comprovadamente paga criadores
  2. **Importação de perfis do Instagram (Apify)** — puxa nome, bio, seguidores, e-mail
     público e o site da bio de cada perfil, e já manda o site para a ferramenta 3
  3. **Extração de contatos de sites (grátis)** — visita as páginas de contato/parcerias,
     extrai e-mails, @ do Instagram, WhatsApp e CNPJ, consulta os dados públicos da Receita
     Federal (BrasilAPI: e-mail cadastral e sócios) e, com a chave gratuita do Hunter.io,
     busca e-mails nominais do domínio

  Marcas e contatos são criados sozinhos, sem duplicar. *Nada disso usa a sua conta do
  Instagram: os scrapers do Apify rodam na infraestrutura deles (plano gratuito: US$ 5/mês
  em créditos), e coleta logada na plataforma violaria os termos da Meta.*
- **Contatos por marca** com fonte e verificação do e-mail
- **Gerador de mensagens** com templates e variáveis ({{contato}}, {{marca}}, {{gancho}},
  {{metricas}}...), preview editável, botão "Abrir no Gmail" já preenchido e registro do
  envio no histórico
- **Cadência pronta** — templates de D0, D+4, D+10 e D+20 carregados pelo seed
- **Envio pelo app via Gmail API** — conecte sua conta Google (OAuth) nas Configurações e
  envie direto da tela de Mensagens; follow-ups saem na mesma thread do primeiro e-mail
- **Fila do dia** — a tela de trabalho diária: primeiros contatos pendentes + follow-ups
  vencidos pela cadência, contador de envios do dia e sugestão de encerramento após a
  cadência completa sem resposta
- **Limite diário de envio** (padrão 15/dia, configurável) aplicado no servidor — proteção
  de entregabilidade que o app impõe, não só recomenda
- **Detecção de respostas** — o botão "Checar respostas no Gmail" varre as threads dos
  envios e move os cards para "Respondeu" automaticamente
- **Campanhas** — o motivo concreto do contato (uma expedição, uma série de conteúdo)
- **Proteções** — flag "não contatar" por marca e lembrete de limite diário de envio

## Como rodar

Pré-requisito: Node.js 20+.

```bash
cp .env.example .env     # configura o caminho do banco SQLite
npm install
npm run setup            # cria o banco e gera o client
npm run dev
```

Abra http://localhost:3000, **crie sua conta** em /registro (os templates da cadência já
vêm com ela), selecione seu nicho no **Guia**, preencha **Configurações** (nome, @,
métricas, mídia kit) e comece a cadastrar marcas.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build e servidor de produção |
| `npm run setup` | migra o banco + gera o client Prisma |
| `npm run e2e` | teste de ponta a ponta no navegador (requer banco recém-criado e `npm start` rodando) |
| `npm run e2e:descoberta` | teste do módulo de descoberta com APIs simuladas (ver cabeçalho do script) |
| `npm run e2e:apify` | teste do fluxo Apify (garimpo + perfis) com APIs simuladas (ver cabeçalho do script) |
| `npm run e2e:gmail` | teste do envio Gmail + fila do dia com OAuth/Gmail simulados (ver cabeçalho do script) |

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS 4 · Prisma + SQLite (banco em arquivo
local, `prisma/dev.db` — fora do git).

## Fluxo de trabalho sugerido

1. **Pesquisar** marcas que já fazem publi no nicho (ver fontes no PLANO.md) e cadastrar
   com notas de pesquisa — o gancho personalizado.
2. **Achar o contato** de marketing (site, LinkedIn, Hunter/Snov free) e cadastrar na marca.
3. **Gerar a mensagem** em Mensagens, revisar o gancho, abrir no Gmail, enviar e clicar em
   "Registrar envio".
4. **Follow-ups** em D+4, D+10 e D+20 com os templates prontos; mover o card conforme a
   conversa evolui.
5. Máximo ~15 e-mails novos por dia para proteger a entregabilidade do Gmail.

## Conexão com o Gmail (Fase 2)

1. Em [console.cloud.google.com](https://console.cloud.google.com), crie um projeto e ative a
   **Gmail API**
2. Tela de permissão OAuth: tipo Externo; adicione seu e-mail como usuário de teste
3. Credenciais → ID do cliente OAuth → tipo **Aplicativo da Web**, com URI de
   redirecionamento `http://localhost:3000/api/gmail/callback`
4. Cole o Client ID e o Secret nas Configurações do app, salve e clique em **Conectar Gmail**

## Próximas fases (ver PLANO.md)

- **Fase 3:** geração de gancho com IA, métricas avançadas
- **Fase 4:** deploy gratuito (Vercel + Supabase) e integração com Snov via API
  (Hunter.io e Apify já estão na Descoberta)
- **Produto:** multiusuário ✓ (feito). Próximos passos rumo ao app vendável: deploy em
  nuvem (Postgres + Vercel), nichos editáveis pelo usuário, onboarding guiado, cobrança
  (Stripe) e termos de uso/política de privacidade (LGPD)
