// Teste de ponta a ponta do módulo de Descoberta, usando servidores locais
// que simulam o site de uma marca, a BrasilAPI e o Hunter.io.
// Uso: BRASILAPI_URL=http://localhost:4101 HUNTER_API_URL=http://localhost:4102 npm start
//      node scripts/e2e-descoberta.mjs
import http from "node:http";
import { chromium } from "playwright";

const falhas = [];
const ok = (n) => console.log(`✔ ${n}`);
const falha = (n, e) => {
  falhas.push(n);
  console.log(`✘ ${n}${e ? " — " + e : ""}`);
};

// --- Site falso da marca (porta 4100) ---
const siteMarca = http.createServer((req, res) => {
  res.setHeader("content-type", "text/html; charset=utf-8");
  if (req.url.startsWith("/contato")) {
    res.end(`<html><title>Contato</title><body>
      Fale com a gente: contato@aventuragear.com.br
      <a href="https://wa.me/5511999998888">WhatsApp</a>
    </body></html>`);
  } else {
    res.end(`<html><head><title>Aventura Gear — equipamentos outdoor</title></head><body>
      <a href="/contato">Contato</a>
      <a href="https://instagram.com/aventuragear">Instagram</a>
      <footer>Aventura Gear LTDA — CNPJ 12.345.678/0001-90</footer>
    </body></html>`);
  }
});

// --- BrasilAPI falsa (porta 4101) ---
const brasilApi = http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.url.includes("12345678000190")) {
    res.end(
      JSON.stringify({
        razao_social: "AVENTURA GEAR COMERCIO LTDA",
        nome_fantasia: "Aventura Gear",
        email: "fiscal@aventuragear.com.br",
        ddd_telefone_1: "11999998888",
        qsa: [{ nome_socio: "Carlos Pereira", qualificacao_socio: "Sócio-Administrador" }],
      })
    );
  } else {
    res.statusCode = 404;
    res.end("{}");
  }
});

// --- Hunter.io falso (porta 4102) ---
const hunter = http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  const url = new URL(req.url, "http://x");
  if (url.searchParams.get("api_key") !== "chave-teste") {
    res.statusCode = 401;
    res.end("{}");
    return;
  }
  res.end(
    JSON.stringify({
      data: {
        emails: [
          {
            value: "marina@aventuragear.com.br",
            first_name: "Marina",
            last_name: "Lopes",
            position: "Marketing Manager",
            confidence: 94,
          },
        ],
      },
    })
  );
});

await new Promise((r) => siteMarca.listen(4100, r));
await new Promise((r) => brasilApi.listen(4101, r));
await new Promise((r) => hunter.listen(4102, r));

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

// Configura a chave do Hunter
await page.goto(base + "/configuracoes");
await page.fill("#cfg-hunter_api_key", "chave-teste");
await page.click("button:has-text('Salvar configurações')");
await page.waitForTimeout(1000);
ok("chave do Hunter configurada");

// Roda a descoberta
await page.goto(base + "/descoberta");
await page.fill("#sites", "http://localhost:4100");
await page.click("button:has-text('Descobrir contatos')");
await page.waitForSelector("text=contatos novos", { timeout: 30000 });

const cardResultado = await page.locator(".card", { hasText: "Aventura Gear" }).first().innerText();
if (cardResultado.includes("ok")) ok("descoberta concluída");
else falha("descoberta concluída", cardResultado.slice(0, 120));
if (cardResultado.includes("@aventuragear")) ok("instagram extraído");
else falha("instagram extraído");
if (cardResultado.includes("AVENTURA GEAR COMERCIO LTDA")) ok("dados da Receita (BrasilAPI)");
else falha("dados da Receita (BrasilAPI)");

// Abre a ficha criada
await page.click("a:has-text('Aventura Gear')");
await page.waitForURL(/\/marcas\/\d+/);
const ficha = await page.locator("body").innerText();
for (const [nome, esperado] of [
  ["e-mail do site", "contato@aventuragear.com.br"],
  ["e-mail cadastral RFB", "fiscal@aventuragear.com.br"],
  ["contato nominal do Hunter", "Marina Lopes"],
  ["sócio da Receita", "Carlos Pereira"],
  ["nota da descoberta no histórico", "Descoberta automática em"],
]) {
  if (ficha.includes(esperado)) ok(nome);
  else falha(nome);
}
if (ficha.includes("Atual: Contato encontrado")) ok("status moveu para Contato encontrado");
else falha("status moveu para Contato encontrado");

// Rodada repetida não duplica contatos
await page.goto(base + "/descoberta");
await page.fill("#sites", "http://localhost:4100");
await page.click("button:has-text('Descobrir contatos')");
await page.waitForSelector("text=0 contatos novos", { timeout: 30000 }).then(
  () => ok("repetição não duplica contatos"),
  () => falha("repetição não duplica contatos")
);

await browser.close();
siteMarca.close();
brasilApi.close();
hunter.close();
console.log(falhas.length === 0 ? "\nTODOS OS TESTES PASSARAM" : `\n${falhas.length} FALHAS`);
process.exit(falhas.length === 0 ? 0 : 1);
