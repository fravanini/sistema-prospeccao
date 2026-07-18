// Teste de ponta a ponta da Fase 2 (Gmail + fila do dia) com Google OAuth e
// Gmail API simulados localmente.
// Uso: GOOGLE_AUTH_URL=http://localhost:4104/auth GOOGLE_TOKEN_URL=http://localhost:4104/token \
//      GMAIL_API_URL=http://localhost:4105 npm start
//      node scripts/e2e-gmail.mjs   (com banco recém-criado)
import http from "node:http";
import { chromium } from "playwright";

const falhas = [];
const ok = (n) => console.log(`✔ ${n}`);
const falha = (n, e) => {
  falhas.push(n);
  console.log(`✘ ${n}${e ? " — " + e : ""}`);
};

// --- Google OAuth falso (porta 4104) ---
const google = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/auth") {
    const destino = new URL(url.searchParams.get("redirect_uri"));
    destino.searchParams.set("code", "codigo-teste");
    res.statusCode = 302;
    res.setHeader("location", destino.toString());
    res.end();
  } else if (url.pathname === "/token") {
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({ refresh_token: "rt-teste", access_token: "at-teste", expires_in: 3600 })
    );
  } else {
    res.statusCode = 404;
    res.end();
  }
});

// --- Gmail API falsa (porta 4105) ---
const enviadas = [];
let temResposta = false;
const gmailApi = http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.url.includes("/users/me/profile")) {
    res.end(JSON.stringify({ emailAddress: "felipe@teste.com" }));
  } else if (req.url.includes("/users/me/messages/send")) {
    let corpo = "";
    req.on("data", (c) => (corpo += c));
    req.on("end", () => {
      enviadas.push(JSON.parse(corpo));
      res.end(JSON.stringify({ id: `msg-${enviadas.length}`, threadId: "th-1" }));
    });
  } else if (req.url.includes("/users/me/threads/")) {
    const mensagens = [
      { payload: { headers: [{ name: "From", value: "felipe@teste.com" }] } },
    ];
    if (temResposta) {
      mensagens.push({
        payload: { headers: [{ name: "From", value: "Marina <marina@aventuragear.com.br>" }] },
      });
    }
    res.end(JSON.stringify({ messages: mensagens }));
  } else {
    res.statusCode = 404;
    res.end("{}");
  }
});

await new Promise((r) => google.listen(4104, r));
await new Promise((r) => gmailApi.listen(4105, r));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
page.on("pageerror", (e) => falha("erro JS na página", e.message));
const base = "http://localhost:3000";


// Cria uma conta nova para esta rodada de teste
const emailTeste = `t${Date.now()}@teste.com`;
await page.goto(base + "/registro");
await page.fill("#nome", "Felipe Teste");
await page.fill("#email", emailTeste);
await page.fill("#senha", "senha12345");
await page.click("button:has-text('Criar conta')");
await page.waitForURL(base + "/", { timeout: 15000 });
ok("conta criada e logada");

// 1. Marca + contato
await page.goto(base + "/marcas/nova");
await page.fill("#nome", "Aventura Gear");
await page.fill("#notas", "linha nova de mochilas 40L");
await page.click("button:has-text('Cadastrar marca')");
await page.waitForURL(/\/marcas\/\d+/);
await page.click("summary:has-text('Adicionar contato')");
await page.fill("details[open] input[name='nome']", "Marina Lopes");
await page.fill("details[open] input[name='email']", "marina@aventuragear.com.br");
await page.click("details[open] button:has-text('Adicionar')");
await page.waitForTimeout(1200);
const urlFicha = page.url();
ok("marca e contato criados");

// 2. Configurações: credenciais + limite 1 + conectar
await page.goto(base + "/configuracoes");
await page.fill("#cfg-gmail_client_id", "cid-teste");
await page.fill("#cfg-gmail_client_secret", "secret-teste");
await page.fill("#cfg-limite_diario", "1");
await page.click("button:has-text('Salvar configurações')");
await page.waitForTimeout(1000);
await page.click("a:has-text('Conectar Gmail')");
await page.waitForURL(/gmail=ok/, { timeout: 15000 });
if (await page.getByText("Conectado como felipe@teste.com").isVisible())
  ok("OAuth concluído e e-mail detectado");
else falha("OAuth concluído e e-mail detectado");

// 3. Fila do dia mostra o primeiro contato
await page.goto(base + "/fila");
const fila = await page.locator("body").innerText();
if (fila.includes("Aventura Gear") && fila.includes("Primeiro contato"))
  ok("fila lista o primeiro contato");
else falha("fila lista o primeiro contato");

// 4. Preparar envio -> enviar pelo Gmail
await page.click("a:has-text('Preparar envio')");
await page.waitForURL(/\/mensagens/);
await page.waitForTimeout(600);
await page.click("button:has-text('Enviar pelo Gmail')");
await page.waitForSelector("text=Enviado pelo Gmail ✓", { timeout: 15000 });
if (enviadas.length === 1 && enviadas[0].raw) ok("Gmail API recebeu a mensagem");
else falha("Gmail API recebeu a mensagem", `enviadas=${enviadas.length}`);
const rfc822 = Buffer.from(enviadas[0].raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
if (rfc822.includes("To: marina@aventuragear.com.br")) ok("destinatário correto no RFC822");
else falha("destinatário correto no RFC822");

// 5. Limite diário bloqueia o segundo envio
await page.goto(base + "/mensagens");
await page.waitForTimeout(600);
if (await page.locator("button:has-text('Limite diário atingido')").isVisible())
  ok("limite diário bloqueia novo envio");
else falha("limite diário bloqueia novo envio");

// 6. Pipeline moveu para E-mail enviado; fila aguardando follow-up
await page.goto(base + "/fila");
const fila2 = await page.locator("body").innerText();
if (fila2.includes("Follow-up 1 (D+4)") && fila2.includes("em 4 dias"))
  ok("cadência agendou o follow-up 1 para D+4");
else falha("cadência agendou o follow-up 1 para D+4");

// 7. Checar respostas: antes (nada) e depois (detecta e move)
await page.click("button:has-text('Checar respostas no Gmail')");
await page.waitForTimeout(1500);
await page.goto(urlFicha);
if ((await page.locator("body").innerText()).includes("Atual: E-mail enviado"))
  ok("sem resposta, status permanece E-mail enviado");
else falha("sem resposta, status permanece E-mail enviado");

temResposta = true;
await page.goto(base + "/fila");
await page.click("button:has-text('Checar respostas no Gmail')");
await page.waitForTimeout(1500);
await page.goto(urlFicha);
const ficha = await page.locator("body").innerText();
if (ficha.includes("Atual: Respondeu")) ok("resposta detectada moveu para Respondeu");
else falha("resposta detectada moveu para Respondeu");
if (ficha.includes("Resposta detectada automaticamente")) ok("interação de resposta registrada");
else falha("interação de resposta registrada");

await browser.close();
google.close();
gmailApi.close();
console.log(falhas.length === 0 ? "\nTODOS OS TESTES PASSARAM" : `\n${falhas.length} FALHAS`);
process.exit(falhas.length === 0 ? 0 : 1);
