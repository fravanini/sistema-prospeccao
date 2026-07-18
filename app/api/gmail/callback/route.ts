import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { perfilGmail, trocarCodigoPorTokens } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get("code");
  if (!codigo) {
    return NextResponse.redirect(new URL("/configuracoes?gmail=erro", req.url));
  }
  try {
    const redirectUri = new URL("/api/gmail/callback", req.url).toString();
    const { refreshToken, accessToken } = await trocarCodigoPorTokens(codigo, redirectUri);
    const email = accessToken ? await perfilGmail(accessToken) : "";
    await prisma.config.upsert({
      where: { chave: "gmail_refresh_token" },
      update: { valor: refreshToken },
      create: { chave: "gmail_refresh_token", valor: refreshToken },
    });
    await prisma.config.upsert({
      where: { chave: "gmail_email" },
      update: { valor: email },
      create: { chave: "gmail_email", valor: email },
    });
    return NextResponse.redirect(new URL("/configuracoes?gmail=ok", req.url));
  } catch (e) {
    console.error("callback gmail:", e);
    return NextResponse.redirect(new URL("/configuracoes?gmail=erro", req.url));
  }
}
