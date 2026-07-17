// Integração com a API do Apify (https://apify.com) para descoberta de marcas
// no Instagram SEM usar a conta do criador: os atores rodam na infraestrutura
// do Apify. Plano gratuito: US$ 5/mês em créditos.

const APIFY_API_URL = process.env.APIFY_API_URL ?? "https://api.apify.com";

export const ATOR_HASHTAG = "apify~instagram-hashtag-scraper";
export const ATOR_PERFIL = "apify~instagram-profile-scraper";

const TIMEOUT_MS = 240_000;

export async function rodarAtor(
  ator: string,
  input: unknown,
  token: string
): Promise<{ itens: Record<string, unknown>[] } | { erro: string }> {
  try {
    const url = `${APIFY_API_URL}/v2/acts/${ator}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 401 || res.status === 403) {
      return { erro: "token do Apify inválido ou sem permissão (confira nas Configurações)" };
    }
    if (!res.ok) {
      return { erro: `Apify retornou ${res.status} — verifique créditos e o nome do ator` };
    }
    const json = (await res.json()) as unknown;
    if (!Array.isArray(json)) return { erro: "resposta inesperada do Apify" };
    return { itens: json as Record<string, unknown>[] };
  } catch {
    return { erro: "chamada ao Apify falhou (tempo esgotado ou sem rede)" };
  }
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

// ---------- Garimpo por hashtag ----------

export interface MencaoRankeada {
  handle: string;
  ocorrencias: number;
}

const HANDLES_IGNORAR = new Set([
  "gmail",
  "hotmail",
  "outlook",
  "yahoo",
  "instagram",
  "meta",
]);

/**
 * Extrai os @handles mencionados nas legendas de posts de publi e ranqueia
 * por frequência — quem é muito mencionado em post de #publi é marca que
 * comprovadamente investe em criadores.
 */
export function ranquearMencoes(itens: Record<string, unknown>[]): MencaoRankeada[] {
  const contagem = new Map<string, number>();
  for (const item of itens) {
    const dono = (str(item["ownerUsername"]) ?? "").toLowerCase();
    const textos: string[] = [];
    const caption = str(item["caption"]);
    if (caption) textos.push(caption);
    if (Array.isArray(item["mentions"])) {
      for (const m of item["mentions"]) if (typeof m === "string") textos.push("@" + m);
    }
    const vistosNestePost = new Set<string>();
    for (const texto of textos) {
      for (const m of texto.matchAll(/@([A-Za-z0-9_.]{2,30})/g)) {
        const handle = m[1].toLowerCase().replace(/\.+$/, "");
        if (handle === dono || HANDLES_IGNORAR.has(handle) || vistosNestePost.has(handle)) continue;
        vistosNestePost.add(handle);
        contagem.set(handle, (contagem.get(handle) ?? 0) + 1);
      }
    }
  }
  return Array.from(contagem.entries())
    .map(([handle, ocorrencias]) => ({ handle, ocorrencias }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias);
}

// ---------- Perfis de marcas ----------

export interface PerfilInstagram {
  username: string;
  nome?: string;
  bio?: string;
  site?: string;
  email?: string;
  seguidores?: number;
  ehComercial?: boolean;
}

export function mapearPerfil(item: Record<string, unknown>): PerfilInstagram | null {
  const username = str(item["username"]) ?? str(item["ownerUsername"]);
  if (!username) return null;
  const seguidores = item["followersCount"] ?? item["followers"];
  return {
    username: username.replace(/^@/, "").toLowerCase(),
    nome: str(item["fullName"]) ?? str(item["full_name"]),
    bio: str(item["biography"]),
    site: str(item["externalUrl"]) ?? str(item["external_url"]),
    email: (str(item["publicEmail"]) ?? str(item["businessEmail"]))?.toLowerCase(),
    seguidores: typeof seguidores === "number" ? seguidores : undefined,
    ehComercial:
      typeof item["businessCategoryName"] === "string" || item["isBusinessAccount"] === true,
  };
}
