"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { criarSessao, encerrarSessao } from "./auth";
import { aplicarSeedUsuario } from "./seed-usuario";

export interface EstadoAuth {
  erro: string;
}

export async function registrar(_anterior: EstadoAuth | null, fd: FormData): Promise<EstadoAuth> {
  const nome = String(fd.get("nome") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const senha = String(fd.get("senha") ?? "");

  if (!nome || !email || !senha) return { erro: "Preencha todos os campos." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: "E-mail inválido." };
  if (senha.length < 8) return { erro: "A senha precisa ter ao menos 8 caracteres." };

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) return { erro: "Já existe uma conta com este e-mail — faça login." };

  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash: await bcrypt.hash(senha, 10) },
  });
  await aplicarSeedUsuario(usuario.id);
  await criarSessao(usuario.id);
  redirect("/");
}

export async function login(_anterior: EstadoAuth | null, fd: FormData): Promise<EstadoAuth> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const senha = String(fd.get("senha") ?? "");
  if (!email || !senha) return { erro: "Informe e-mail e senha." };

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    return { erro: "E-mail ou senha incorretos." };
  }
  await criarSessao(usuario.id);
  redirect("/");
}

export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/login");
}
