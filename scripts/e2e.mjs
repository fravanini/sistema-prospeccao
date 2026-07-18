import { chromium } from "playwright";

const base = "http://localhost:3000";
const falhas = [];
const ok = (nome) => console.log(`✔ ${nome}`);
const falha = (nome, extra) => {
  falhas.push(nome);
  console.log(`✘ ${nome}${extra ? " — " + extra : ""}`);
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
page.on("pageerror", (e) => falha("erro JS na página", e.message));

// 1. Pipeline vazio
await page.goto(base + "/");
if (await page.getByText("Nenhuma marca cadastrada ainda").isVisible()) ok("pipeline vazio");
else falha("pipeline vazio");

// 2. Configurações
await page.goto(base + "/configuracoes");
await page.fill("#cfg-meu_nome", "Felipe");
await page.fill("#cfg-meu_perfil", "@felipe.aventura");
await page.fill("#cfg-metricas", "alcance médio de 120 mil/mês e 6% de engajamento");
await page.fill("#cfg-audiencia", "60% mulheres, 25-40 anos");
await page.fill("#cfg-assinatura", "Felipe · @felipe.aventura");
await page.click("button:has-text('Salvar configurações')");
await page.waitForTimeout(1000);
ok("configurações salvas");

// 2b. Seleciona o nicho no Guia — o app inteiro se adapta a ele
await page.goto(base + "/guia");
await page.selectOption("#nicho_id", "viagem-outdoor");
await page.click("button:has-text('Aplicar nicho')");
await page.waitForTimeout(1000);
const guia = await page.locator("body").innerText();
if (guia.includes("Equipamento outdoor") && guia.includes("trekkingbrasil"))
  ok("guia do nicho aplicado (categorias e hashtags)");
else falha("guia do nicho aplicado", guia.slice(0, 200));

// 3. Nova marca
await page.goto(base + "/marcas/nova");
await page.fill("#nome", "Trilhas & Cia");
await page.fill("#instagram", "@trilhasecia");
await page.selectOption("#categoria", "Equipamento outdoor");
await page.fill("#notas", "vi a linha nova de mochilas 40L e a publi com @aventureirox");
await page.check("input[name='fazPubli']");
await page.check("input[name='rodaAnuncios']");
await page.click("button:has-text('Cadastrar marca')");
await page.waitForURL(/\/marcas\/\d+/, { timeout: 15000 });
ok("marca criada e redirecionou para a ficha");
const urlFicha = page.url();

// Score deve ser 5 (3+2)
if (await page.getByText("5", { exact: true }).first().isVisible()) ok("score 5 exibido");
else falha("score 5 exibido");

// 4. Adicionar contato
await page.click("summary:has-text('Adicionar contato')");
await page.fill("details[open] input[name='nome']", "Marina Souza");
await page.fill("details[open] input[name='cargo']", "Coord. de Marketing");
await page.fill("details[open] input[name='email']", "marina@trilhasecia.com.br");
await page.click("details[open] button:has-text('Adicionar')");
await page.waitForTimeout(1500);
if (await page.getByText("Marina Souza").first().isVisible()) ok("contato criado");
else falha("contato criado");

// Status deve ter movido para CONTATO_ENCONTRADO
if (await page.getByText("Atual: Contato encontrado").isVisible())
  ok("status moveu para Contato encontrado");
else falha("status moveu para Contato encontrado");

// 5. Gerar mensagem
await page.click("a:has-text('Gerar mensagem')");
await page.waitForURL(/\/mensagens/);
await page.waitForTimeout(800);
const corpo = await page.inputValue("#g-corpo");
if (corpo.includes("Marina") && corpo.includes("mochilas 40L") && corpo.includes("@felipe.aventura"))
  ok("mensagem renderizada com contato, gancho e config");
else falha("mensagem renderizada", JSON.stringify(corpo.slice(0, 200)));
const assunto = await page.inputValue("#g-assunto");
if (assunto.includes("Trilhas & Cia")) ok("assunto com nome da marca");
else falha("assunto com nome da marca", assunto);

// Link Gmail presente
if (await page.locator("a:has-text('Abrir no Gmail')").isVisible()) ok("link Abrir no Gmail");
else falha("link Abrir no Gmail");

// 6. Registrar envio
await page.click("button:has-text('Registrar envio')");
await page.waitForSelector("button:has-text('Envio registrado ✓')", { timeout: 10000 });
ok("envio registrado");

// 7. Pipeline: card na coluna E-mail enviado
await page.goto(base + "/");
await page.waitForTimeout(500);
const coluna = page
  .locator("div", { has: page.locator("p:has-text('E-mail enviado')") })
  .locator("a:has-text('Trilhas & Cia')");
if ((await coluna.count()) > 0) ok("card na coluna E-mail enviado");
else falha("card na coluna E-mail enviado");

// 8. Histórico na ficha
await page.goto(urlFicha);
if (await page.locator("ol li").getByText("E-mail inicial enviado").first().isVisible()) ok("interação no histórico");
else falha("interação no histórico");

// 9. Importar CSV (colando conteúdo)
await page.goto(base + "/marcas/importar");
await page.fill(
  "#conteudo",
  "nome,categoria,origem,fazPubli\nCafé do Mato,Alimentos e bebidas,Biblioteca de Anúncios,sim\nEco Hostel,Hospedagem,indicação,nao"
);
await page.click("button:has-text('Importar')");
await page.waitForSelector("text=2 marcas importadas", { timeout: 10000 });
ok("importação CSV (2 marcas)");

// 10. Templates e campanhas seedados
await page.goto(base + "/templates");
if (await page.locator("summary").getByText("Último toque").first().isVisible()) ok("templates do seed listados");
else falha("templates do seed listados");

await browser.close();
console.log(falhas.length === 0 ? "\nTODOS OS TESTES PASSARAM" : `\n${falhas.length} FALHAS`);
process.exit(falhas.length === 0 ? 0 : 1);
