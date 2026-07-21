# Deploy na Vercel (passo a passo)

Guia para colocar o app no ar com uma URL pública, sem terminal. Todo o código
já está preparado: banco Postgres, build automático e migrações no deploy.

Tempo estimado: ~20 minutos. Você vai precisar de: uma conta no GitHub (já tem),
criar uma conta gratuita na Vercel e uma no Neon (banco de dados).

---

## 1. Criar o banco de dados (Neon — grátis)

1. Acesse **neon.tech** e crie conta (pode entrar com o GitHub).
2. Clique em **Create project**. Dê um nome (ex.: `prospeccao`), região
   **AWS - São Paulo** (ou a mais próxima). Crie.
3. Na tela do projeto, procure **Connection string** (ou "Connect"). Copie a
   string que começa com `postgresql://...` — ela contém usuário, senha e host.
   **Guarde essa string**, você vai colar na Vercel no passo 3.
   - Se aparecer a opção "Pooled connection", pode usar a pooled — funciona.

---

## 2. Importar o projeto na Vercel

1. Acesse **vercel.com** e crie conta **entrando com o GitHub** (importante:
   use o GitHub para a Vercel enxergar seus repositórios).
2. No painel, clique em **Add New… → Project**.
3. Encontre o repositório **sistema-prospeccao** na lista e clique em **Import**.
   - Se não aparecer, clique em "Adjust GitHub App Permissions" e autorize o
     acesso ao repositório.
4. Na tela de configuração do projeto, **antes de fazer o deploy**:
   - **Framework Preset**: já deve detectar "Next.js". Deixe como está.
   - **Branch**: se puder escolher a branch, selecione
     `claude/instagram-brand-prospecting-o4y7vr`. (Se não houver a opção aqui,
     resolvemos depois — veja a seção "Branch" no final.)

---

## 3. Configurar a variável do banco

Ainda na tela de configuração, abra **Environment Variables** e adicione:

| Name | Value |
|---|---|
| `DATABASE_URL` | *(cole a connection string do Neon do passo 1)* |

Clique em **Add**. (Não precisa de mais nenhuma variável para o app subir — as
chaves de Gmail, Apify e Hunter cada usuário configura dentro do app, nas
Configurações.)

---

## 4. Deploy

Clique em **Deploy**. A Vercel vai instalar, rodar as migrações no banco Neon e
publicar. Em 1–3 minutos aparece "Congratulations" com um link tipo
`https://sistema-prospeccao-xxxx.vercel.app`.

Abra o link → **Criar conta grátis** → pronto, o app está no ar e acessível de
qualquer dispositivo. 🎉

---

## 5. (Opcional) Ligar o envio pelo Gmail em produção

O envio pelo app e a detecção de respostas usam a Gmail API. Para funcionar na
URL pública, o endereço de redirecionamento do Google precisa apontar para ela:

1. Em **console.cloud.google.com** → seu projeto OAuth → **Credenciais** → seu
   "ID do cliente OAuth".
2. Em **URIs de redirecionamento autorizados**, adicione:
   `https://SEU-DOMINIO.vercel.app/api/gmail/callback`
   (troque `SEU-DOMINIO` pelo domínio que a Vercel te deu).
3. Salve. Depois, dentro do app, em **Configurações**, cole o Client ID/Secret e
   clique em **Conectar Gmail**.

Sem isso, todo o resto do app funciona normalmente — só o botão "Enviar pelo
Gmail" fica indisponível (você ainda pode usar "Abrir no Gmail").

---

## Atualizações futuras

A cada `git push` na branch conectada, a Vercel republica sozinha. Como as
mudanças vêm por aqui (eu faço push), suas atualizações vão ao ar automaticamente
— sem terminal, sem `npm`, sem nada na sua máquina.

## Branch

O deploy inicial pode ter usado a branch `main`. Depois que essa branch de
trabalho virar a principal (fazemos um "merge" — me peça quando quiser), a Vercel
passa a publicar a partir da `main` a cada push. Enquanto isso, dá para apontar a
Vercel para a branch de trabalho em **Project → Settings → Git → Production
Branch**.

## Custo

Neon (free): 1 projeto, meio GB — sobra para centenas de usuários no início.
Vercel (Hobby): grátis para uso pessoal/validação. Quando o produto crescer e
tiver receita, os planos pagos começam em ~US$ 20/mês cada.
