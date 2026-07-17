// Teste de ponta a ponta do fluxo Apify (garimpo por hashtag + importação de
// perfis) encadeado com o scraper de sites, usando servidores locais falsos.
// Uso: BRASILAPI_URL=http://localhost:4101 HUNTER_API_URL=http://localhost:4102 \
//      APIFY_API_URL=http://localhost:4103 npm start
//      node scripts/e2e-apify.mjs
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
    res.end(`<html><body>contato@aventuragear.com.br</body></html>`);
  } else {
    res.end(`<html><head><title>Aventura Gear</title></head><body>
      <a href="/contato">Contato</a>
      <footer>CNPJ 12.345.678/0001-90</footer>
    </body></html>`);
  }
});

// --- BrasilAPI falsa (porta 4101) ---
const brasilApi = http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  res.end(
    JSON.stringify({
      razao_social: "AVENTURA GEAR COMERCIO LTDA",
      email: "fiscal@aventuragear.com.br",
      qsa: [{ nome_socio: "Carlos Pereira", qualificacao_socio: "Sócio-Administrador" }],
    })
  );
});

// --- Apify falso (porta 4103) ---
const apify = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  res.setHeader("content-type", "application/json");
  if (url.searchParams.get("token") !== "token-teste") {
    res.statusCode = 401;
    res.end("{}");
    return;
  }
  if (req.url.includes("instagram-hashtag-scraper")) {
    res.end(
      JSON.stringify([
        {
          caption: "Look da trilha com @aventuragear e @outramarca! #publi",
          ownerUsername: "criadorx",
        },
        { caption: "Mochila nova da @aventuragear chegou #publi", ownerUsername: "criadory" },
        { caption: "Bora acampar #publi", ownerUsername: "criadorz", mentions: ["aventuragear"] },
      ])
    );
  } else if (req.url.includes("instagram-profile-scraper")) {
    res.end(
      JSON.stringify([
        {
          username: "aventuragear",
          fullName: "Aventura Gear",
          biography: "Equipamentos para trilha e camping",
          externalUrl: "http://localhost:4100",
          followersCount: 15300,
          publicEmail: "parcerias@aventuragear.com.br",
          isBusinessAccount: true,
        },
      ])
    );
  } else {
    res.statusCode = 404;
    res.end("{}");
  }
});

await new Promise((r) => siteMarca.listen(4100, r));
await new Promise((r) => brasilApi.listen(4101, r));
await new Promise((r) => apify.listen(4103, r));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
page.on("pageerror", (e) => falha("erro JS na página", e.message));
const base = "http://localhost:3000";

// Configura o token do Apify
await page.goto(base + "/configuracoes");
await page.fill("#cfg-apify_api_token", "token-teste");
await page.click("button:has-text('Salvar configurações')");
await page.waitForTimeout(1000);
ok("token do Apify configurado");

// 1. Garimpo por hashtag
await page.goto(base + "/descoberta");
await page.fill("#hashtags", "publi");
await page.click("button:has-text('Garimpar publis')");
await page.waitForSelector("text=posts analisados", { timeout: 30000 });
const garimpo = await page.locator("form", { hasText: "posts analisados" }).innerText();
if (garimpo.includes("3 posts analisados")) ok("garimpo analisou os posts");
else falha("garimpo analisou os posts", garimpo.slice(0, 150));
if (garimpo.includes("@aventuragear") && garimpo.includes("×3"))
  ok("ranking de menções (@aventuragear ×3)");
else falha("ranking de menções", garimpo.slice(0, 300));

// 2. Importar perfil e encadear com o scraper de site
await page.fill("#usernames", "@aventuragear");
await page.click("button:has-text('Importar e extrair contatos')");
await page.waitForSelector("text=contatos novos", { timeout: 60000 });
ok("importação de perfil concluída");

// 3. Ficha final: contatos do IG + site + Receita
await page.click("a:has-text('Aventura Gear')");
await page.waitForURL(/\/marcas\/\d+/);
const ficha = await page.locator("body").innerText();
for (const [nome, esperado] of [
  ["e-mail público do perfil IG", "parcerias@aventuragear.com.br"],
  ["e-mail do site da bio", "contato@aventuragear.com.br"],
  ["e-mail cadastral RFB", "fiscal@aventuragear.com.br"],
  ["sócio da Receita", "Carlos Pereira"],
  ["nota da importação", "Importado do Instagram via Apify"],
  ["instagram na ficha", "@aventuragear"],
]) {
  if (ficha.includes(esperado)) ok(nome);
  else falha(nome);
}
const notas = await page.inputValue("#notas");
if (notas.includes("Equipamentos para trilha e camping")) ok("bio salva como notas/gancho");
else falha("bio salva como notas/gancho", notas.slice(0, 100));
if (ficha.includes("Atual: Contato encontrado")) ok("status moveu para Contato encontrado");
else falha("status moveu para Contato encontrado");

await browser.close();
siteMarca.close();
brasilApi.close();
apify.close();
console.log(falhas.length === 0 ? "\nTODOS OS TESTES PASSARAM" : `\n${falhas.length} FALHAS`);
process.exit(falhas.length === 0 ? 0 : 1);
