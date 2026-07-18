import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { perfilGmail, trocarCodigoPorTokens } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const usuario = await usuarioAtual();
  if (!usuario) return NextResponse.redirect(new URL("/login", req.url));

  const codigo = req.nextUrl.searchParams.get("code");
  if (!codigo) {
    return NextResponse.redirect(new URL("/configuracoes?gmail=erro", req.url));
  }
  try {
    const redirectUri = new URL("/api/gmail/callback", req.url).toString();
    const { refreshToken, accessToken } = await trocarCodigoPorTokens(
      usuario.id,
      codigo,
      redirectUri
    );
    const email = accessToken ? await perfilGmail(accessToken) : "";
    for (const [chave, valor] of [
      ["gmail_refresh_token", refreshToken],
      ["gmail_email", email],
    ] as const) {
      await prisma.config.upsert({
        where: { usuarioId_chave: { usuarioId: usuario.id, chave } },
        update: { valor },
        create: { usuarioId: usuario.id, chave, valor },
      });
    }
    return NextResponse.redirect(new URL("/configuracoes?gmail=ok", req.url));
  } catch (e) {
    console.error("callback gmail:", e);
    return NextResponse.redirect(new URL("/configuracoes?gmail=erro", req.url));
  }
}
