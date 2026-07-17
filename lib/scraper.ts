// Descoberta automática de contatos a partir de fontes públicas:
// 1. o site da própria marca (e-mails, Instagram, WhatsApp, CNPJ no rodapé);
// 2. dados cadastrais públicos do CNPJ na Receita Federal (via BrasilAPI);
// 3. opcionalmente a API do Hunter.io (créditos do plano gratuito).
// Nada aqui toca o Instagram — raspar a plataforma viola os termos da Meta.

const BRASILAPI_URL = process.env.BRASILAPI_URL ?? "https://brasilapi.com.br/api/cnpj/v1";
const HUNTER_API_URL = process.env.HUNTER_API_URL ?? "https://api.hunter.io/v2/domain-search";

const TIMEOUT_MS = 12_000;
const MAX_PAGINAS_EXTRA = 4;
const PAUSA_ENTRE_PAGINAS_MS = 400;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export interface EmailEncontrado {
  email: string;
  fonte: string;
  nome?: string;
  cargo?: string;
}

export interface SocioRFB {
  nome: string;
  qualificacao: string;
}

export interface ResultadoScrape {
  site: string;
  titulo?: string;
  emails: EmailEncontrado[];
  instagram?: string;
  whatsapp?: string;
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  telefoneRFB?: string;
  socios: SocioRFB[];
  paginasVisitadas: string[];
  avisos: string[];
}

function pausa(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function baixar(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const tipo = res.headers.get("content-type") ?? "";
    if (!tipo.includes("html") && !tipo.includes("text")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function normalizarSite(entrada: string): string | null {
  let s = entrada.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    return u.origin;
  } catch {
    return null;
  }
}

const REGEX_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const EMAILS_IGNORAR =
  /noreply|no-reply|nao-?responda|@(sentry|wixpress|example|sentry-next|schema|w3|google|gstatic|cloudflare)\./i;
const EXTENSOES_FALSAS = /\.(png|jpe?g|gif|svg|webp|css|js|woff2?)$/i;

function extrairEmails(html: string, fonte: string): EmailEncontrado[] {
  const achados = new Map<string, EmailEncontrado>();
  for (const m of html.matchAll(REGEX_EMAIL)) {
    const email = m[0].toLowerCase();
    if (EMAILS_IGNORAR.test(email) || EXTENSOES_FALSAS.test(email)) continue;
    if (!achados.has(email)) achados.set(email, { email, fonte });
  }
  return Array.from(achados.values());
}

const IG_IGNORAR = new Set(["p", "reel", "reels", "explore", "share", "stories", "accounts", "tv"]);

function extrairInstagram(html: string): string | undefined {
  for (const m of html.matchAll(/instagram\.com\/([A-Za-z0-9_.]{2,30})/g)) {
    const handle = m[1].replace(/\.$/, "");
    if (!IG_IGNORAR.has(handle.toLowerCase())) return "@" + handle;
  }
  return undefined;
}

function extrairWhatsapp(html: string): string | undefined {
  const wa =
    html.match(/wa\.me\/(\d{10,15})/) ?? html.match(/api\.whatsapp\.com\/send\?phone=(\d{10,15})/);
  return wa ? wa[1] : undefined;
}

function extrairCNPJ(html: string): string | undefined {
  const m = html.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
  if (!m) return undefined;
  const digitos = m[0].replace(/\D/g, "");
  return digitos.length === 14 ? digitos : undefined;
}

function extrairTitulo(html: string): string | undefined {
  const og = html.match(/property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
  if (og) return og[1].trim();
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!t) return undefined;
  return t[1].split(/[|–—-]/)[0].trim() || undefined;
}

const PALAVRAS_PAGINAS =
  /contato|contact|fale|atendimento|parceria|partner|imprensa|press|sobre|about|embaixador|quem-somos/i;

function acharPaginasInternas(html: string, base: string): string[] {
  const urls = new Set<string>();
  for (const m of html.matchAll(/href=["']([^"'#]+)["']/g)) {
    const href = m[1];
    if (!PALAVRAS_PAGINAS.test(href)) continue;
    try {
      const abs = new URL(href, base);
      if (abs.origin !== new URL(base).origin) continue;
      urls.add(abs.href);
    } catch {
      // href inválido, ignora
    }
    if (urls.size >= MAX_PAGINAS_EXTRA) break;
  }
  return Array.from(urls);
}

async function consultarCNPJ(cnpj: string, resultado: ResultadoScrape) {
  try {
    const res = await fetch(`${BRASILAPI_URL}/${cnpj}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      resultado.avisos.push(`Consulta do CNPJ retornou ${res.status}.`);
      return;
    }
    const dados = (await res.json()) as {
      razao_social?: string;
      nome_fantasia?: string;
      email?: string | null;
      ddd_telefone_1?: string | null;
      qsa?: { nome_socio?: string; qualificacao_socio?: string }[];
    };
    resultado.razaoSocial = dados.razao_social ?? undefined;
    resultado.nomeFantasia = dados.nome_fantasia || undefined;
    resultado.telefoneRFB = dados.ddd_telefone_1 || undefined;
    if (dados.email) {
      const email = dados.email.toLowerCase();
      if (!resultado.emails.some((e) => e.email === email)) {
        resultado.emails.push({ email, fonte: "Cadastro RFB (BrasilAPI)" });
      }
    }
    for (const socio of dados.qsa ?? []) {
      if (socio.nome_socio) {
        resultado.socios.push({
          nome: socio.nome_socio,
          qualificacao: socio.qualificacao_socio ?? "Sócio",
        });
      }
    }
  } catch {
    resultado.avisos.push("Consulta do CNPJ na BrasilAPI falhou (sem rede ou fora do ar).");
  }
}

async function consultarHunter(dominio: string, apiKey: string, resultado: ResultadoScrape) {
  try {
    const url = `${HUNTER_API_URL}?domain=${encodeURIComponent(dominio)}&api_key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      resultado.avisos.push(`Hunter.io retornou ${res.status} (verifique a chave/créditos).`);
      return;
    }
    const json = (await res.json()) as {
      data?: {
        emails?: {
          value?: string;
          first_name?: string | null;
          last_name?: string | null;
          position?: string | null;
          confidence?: number;
        }[];
      };
    };
    for (const e of json.data?.emails ?? []) {
      if (!e.value) continue;
      const email = e.value.toLowerCase();
      const nome = [e.first_name, e.last_name].filter(Boolean).join(" ") || undefined;
      const existente = resultado.emails.find((x) => x.email === email);
      const fonte = `Hunter.io (confiança ${e.confidence ?? "?"}%)`;
      if (existente) {
        existente.nome = existente.nome ?? nome;
        existente.cargo = existente.cargo ?? e.position ?? undefined;
        existente.fonte = fonte;
      } else {
        resultado.emails.push({ email, fonte, nome, cargo: e.position ?? undefined });
      }
    }
  } catch {
    resultado.avisos.push("Consulta ao Hunter.io falhou.");
  }
}

export async function rasparSite(
  siteEntrada: string,
  opcoes: { hunterApiKey?: string } = {}
): Promise<ResultadoScrape | { erro: string; site: string }> {
  const site = normalizarSite(siteEntrada);
  if (!site) return { erro: "URL inválida", site: siteEntrada };

  const resultado: ResultadoScrape = {
    site,
    emails: [],
    socios: [],
    paginasVisitadas: [],
    avisos: [],
  };

  const htmlInicial = await baixar(site);
  if (htmlInicial === null) {
    return { erro: "não consegui acessar o site (fora do ar, bloqueio ou sem rede)", site };
  }
  resultado.paginasVisitadas.push(site);
  resultado.titulo = extrairTitulo(htmlInicial);

  const paginas = [htmlInicial];
  for (const url of acharPaginasInternas(htmlInicial, site)) {
    await pausa(PAUSA_ENTRE_PAGINAS_MS);
    const html = await baixar(url);
    if (html !== null) {
      paginas.push(html);
      resultado.paginasVisitadas.push(url);
    }
  }

  for (let i = 0; i < paginas.length; i++) {
    const fonte = resultado.paginasVisitadas[i];
    for (const e of extrairEmails(paginas[i], fonte)) {
      if (!resultado.emails.some((x) => x.email === e.email)) resultado.emails.push(e);
    }
    resultado.instagram = resultado.instagram ?? extrairInstagram(paginas[i]);
    resultado.whatsapp = resultado.whatsapp ?? extrairWhatsapp(paginas[i]);
    resultado.cnpj = resultado.cnpj ?? extrairCNPJ(paginas[i]);
  }

  if (resultado.cnpj) await consultarCNPJ(resultado.cnpj, resultado);
  if (opcoes.hunterApiKey) {
    await consultarHunter(new URL(site).hostname.replace(/^www\./, ""), opcoes.hunterApiKey, resultado);
  }

  return resultado;
}

export const EMAILS_GENERICOS =
  /^(contato|contact|sac|vendas|comercial|marketing|imprensa|atendimento|hello|hi|oi|ola|info|suporte|parcerias?|faleconosco|adm|administrativo|financeiro)@/i;

export function nomeParaEmail(e: EmailEncontrado): { nome: string; cargo: string | null } {
  if (e.nome) return { nome: e.nome, cargo: e.cargo ?? null };
  const local = e.email.split("@")[0];
  if (EMAILS_GENERICOS.test(e.email)) {
    return { nome: `E-mail geral (${local}@)`, cargo: null };
  }
  const nome = local
    .split(/[._-]+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return { nome, cargo: e.cargo ?? null };
}
