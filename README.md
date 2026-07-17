# Sistema de Prospecção de Marcas

CRM pessoal para prospecção ativa de marcas por e-mail — feito para criadores de conteúdo
(nicho: viagem de aventura, vida outdoor e nomadismo digital) que querem fechar parcerias
pagas de forma organizada.

O método completo (onde achar marcas, como achar o contato certo, cadência de follow-up,
metas) está em **[PLANO.md](./PLANO.md)**. Este app é a Fase 1 do plano: o MVP do CRM.

## Funcionalidades

- **Pipeline Kanban** — arraste marcas entre as etapas: Pesquisada → Contato encontrado →
  E-mail enviado → Follow-up → Respondeu → Negociando → Fechada / Perdida
- **Cadastro de marcas** com sinais de compra (já faz publi? roda anúncios?) que geram um
  **score de prioridade (0–8)** — prospecte primeiro quem já compra
- **Importação em massa por CSV**
- **Descoberta automática de contatos** — cole os sites das marcas e o app visita as páginas
  de contato/parcerias, extrai e-mails, @ do Instagram, WhatsApp e CNPJ, consulta os dados
  públicos da Receita Federal (BrasilAPI: e-mail cadastral e sócios) e, com a chave gratuita
  do Hunter.io configurada, busca e-mails nominais do domínio. Marcas e contatos são criados
  sozinhos, sem duplicar. *O módulo não raspa o Instagram — isso viola os termos da Meta e
  arriscaria a conta.*
- **Contatos por marca** com fonte e verificação do e-mail
- **Gerador de mensagens** com templates e variáveis ({{contato}}, {{marca}}, {{gancho}},
  {{metricas}}...), preview editável, botão "Abrir no Gmail" já preenchido e registro do
  envio no histórico
- **Cadência pronta** — templates de D0, D+4, D+10 e D+20 carregados pelo seed
- **Campanhas** — o motivo concreto do contato (uma expedição, uma série de conteúdo)
- **Proteções** — flag "não contatar" por marca e lembrete de limite diário de envio

## Como rodar

Pré-requisito: Node.js 20+.

```bash
cp .env.example .env     # configura o caminho do banco SQLite
npm install
npm run setup            # cria o banco, gera o client e carrega os templates padrão
npm run dev
```

Abra http://localhost:3000, preencha **Configurações** (seu nome, @, métricas, mídia kit)
e comece a cadastrar marcas.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build e servidor de produção |
| `npm run seed` | carrega templates da cadência e campanha de exemplo (idempotente) |
| `npm run setup` | migra o banco + gera o client Prisma + seed |
| `npm run e2e` | teste de ponta a ponta no navegador (requer banco recém-criado e `npm start` rodando) |
| `npm run e2e:descoberta` | teste do módulo de descoberta com APIs simuladas (ver cabeçalho do script) |

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

## Próximas fases (ver PLANO.md)

- **Fase 2:** envio pelo app via Gmail API, fila do dia com follow-ups automáticos
- **Fase 3:** geração de gancho com IA, métricas avançadas
- **Fase 4:** deploy gratuito (Vercel + Supabase) e integração com Snov via API
  (a integração com Hunter.io já está na Descoberta)
