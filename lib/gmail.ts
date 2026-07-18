// Cliente mínimo da Gmail API via REST (sem SDK): envio de e-mails pela conta
// do criador (OAuth) e leitura de threads para detectar respostas.
// URLs sobrescrevíveis por env para permitir testes com servidores locais.

import { prisma } from "./db";

export const GOOGLE_AUTH_URL =
  process.env.GOOGLE_AUTH_URL ?? "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = process.env.GOOGLE_TOKEN_URL ?? "https://oauth2.googleapis.com/token";
const GMAIL_API_URL = process.env.GMAIL_API_URL ?? "https://gmail.googleapis.com/gmail/v1";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

const TIMEOUT_MS = 20_000;

async function config(chave: string): Promise<string | undefined> {
  const item = await prisma.config.findUnique({ where: { chave } });
  return item?.valor?.trim() || undefined;
}

export async function gmailConectado(): Promise<{ conectado: boolean; email?: string }> {
  const [token, email] = await Promise.all([config("gmail_refresh_token"), config("gmail_email")]);
  return { conectado: !!token, email };
}

// ---------- OAuth ----------

export async function trocarCodigoPorTokens(codigo: string, redirectUri: string) {
  const [clientId, clientSecret] = await Promise.all([
    config("gmail_client_id"),
    config("gmail_client_secret"),
  ]);
  if (!clientId || !clientSecret) throw new Error("client_id/client_secret não configurados");

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: codigo,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`troca de código falhou (${res.status})`);
  const json = (await res.json()) as { refresh_token?: string; access_token?: string };
  if (!json.refresh_token) {
    throw new Error("Google não retornou refresh_token — refaça o fluxo com prompt=consent");
  }
  return { refreshToken: json.refresh_token, accessToken: json.access_token };
}

let cacheToken: { token: string; expiraEm: number } | null = null;

async function accessToken(): Promise<string> {
  if (cacheToken && Date.now() < cacheToken.expiraEm) return cacheToken.token;
  const [clientId, clientSecret, refreshToken] = await Promise.all([
    config("gmail_client_id"),
    config("gmail_client_secret"),
    config("gmail_refresh_token"),
  ]);
  if (!clientId || !clientSecret || !refreshToken) throw new Error("Gmail não conectado");

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`refresh do token falhou (${res.status}) — reconecte o Gmail`);
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("resposta sem access_token");
  cacheToken = {
    token: json.access_token,
    expiraEm: Date.now() + ((json.expires_in ?? 3600) - 60) * 1000,
  };
  return cacheToken.token;
}

async function gmailGet<T>(caminho: string): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${GMAIL_API_URL}${caminho}`, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Gmail API ${caminho} retornou ${res.status}`);
  return (await res.json()) as T;
}

export async function perfilGmail(accessTokenDireto?: string): Promise<string> {
  if (accessTokenDireto) {
    const res = await fetch(`${GMAIL_API_URL}/users/me/profile`, {
      headers: { authorization: `Bearer ${accessTokenDireto}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`perfil retornou ${res.status}`);
    return ((await res.json()) as { emailAddress?: string }).emailAddress ?? "";
  }
  return (await gmailGet<{ emailAddress?: string }>("/users/me/profile")).emailAddress ?? "";
}

// ---------- Envio ----------

function base64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function cabecalhoUTF8(texto: string): string {
  return /[^\x20-\x7e]/.test(texto)
    ? `=?UTF-8?B?${Buffer.from(texto, "utf8").toString("base64")}?=`
    : texto;
}

export async function enviarGmail(dados: {
  para: string;
  assunto: string;
  corpo: string;
  threadId?: string;
}): Promise<{ id: string; threadId: string }> {
  const mensagem = [
    `To: ${dados.para}`,
    `Subject: ${cabecalhoUTF8(dados.assunto)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(dados.corpo, "utf8").toString("base64"),
  ].join("\r\n");

  const token = await accessToken();
  const res = await fetch(`${GMAIL_API_URL}/users/me/messages/send`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      raw: base64Url(Buffer.from(mensagem, "utf8")),
      ...(dados.threadId ? { threadId: dados.threadId } : {}),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`envio falhou (${res.status})`);
  const json = (await res.json()) as { id?: string; threadId?: string };
  return { id: json.id ?? "", threadId: json.threadId ?? "" };
}

// ---------- Detecção de respostas ----------

interface ThreadGmail {
  messages?: { payload?: { headers?: { name?: string; value?: string }[] } }[];
}

/**
 * Retorna true se a thread contém alguma mensagem cujo remetente não é a
 * conta conectada — ou seja, o contato respondeu.
 */
export async function threadTemResposta(threadId: string, meuEmail: string): Promise<boolean> {
  const thread = await gmailGet<ThreadGmail>(
    `/users/me/threads/${threadId}?format=metadata&metadataHeaders=From`
  );
  for (const msg of thread.messages ?? []) {
    const from = msg.payload?.headers?.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";
    if (from && !from.toLowerCase().includes(meuEmail.toLowerCase())) return true;
  }
  return false;
}
