import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { GMAIL_SCOPES, GOOGLE_AUTH_URL } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const usuario = await usuarioAtual();
  if (!usuario) return NextResponse.redirect(new URL("/login", req.url));

  const clientId = (
    await prisma.config.findUnique({
      where: { usuarioId_chave: { usuarioId: usuario.id, chave: "gmail_client_id" } },
    })
  )?.valor;
  if (!clientId) {
    return NextResponse.redirect(new URL("/configuracoes?gmail=sem_client_id", req.url));
  }
  const redirectUri = new URL("/api/gmail/callback", req.url).toString();
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_SCOPES);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return NextResponse.redirect(url);
}
