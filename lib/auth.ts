import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { prisma } from "./db";

const COOKIE_SESSAO = "sessao";
const DURACAO_SESSAO_DIAS = 30;

export interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
}

export async function usuarioAtual(): Promise<UsuarioLogado | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  const sessao = await prisma.sessao.findUnique({
    where: { token },
    include: { usuario: { select: { id: true, nome: true, email: true } } },
  });
  if (!sessao) return null;
  if (sessao.expiraEm.getTime() < Date.now()) {
    await prisma.sessao.delete({ where: { token } }).catch(() => {});
    return null;
  }
  return sessao.usuario;
}

export async function exigirUsuario(): Promise<UsuarioLogado> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  return usuario;
}

export async function criarSessao(usuarioId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + DURACAO_SESSAO_DIAS * 24 * 60 * 60 * 1000);
  await prisma.sessao.create({ data: { token, usuarioId, expiraEm } });
  const jar = await cookies();
  jar.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_INSECURE !== "1",
    path: "/",
    expires: expiraEm,
  });
}

export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (token) await prisma.sessao.deleteMany({ where: { token } });
  jar.delete(COOKIE_SESSAO);
}
