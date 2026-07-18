"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/auth-actions";

export default function LoginPage() {
  const [estado, acao, pendente] = useActionState(login, null);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Entrar</h1>
      <div>
        <label htmlFor="email">E-mail</label>
        <input type="email" id="email" name="email" required autoComplete="email" />
      </div>
      <div>
        <label htmlFor="senha">Senha</label>
        <input
          type="password"
          id="senha"
          name="senha"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </div>
      {estado?.erro && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {estado.erro}
        </p>
      )}
      <button type="submit" disabled={pendente} className="btn-primary">
        {pendente ? "Entrando..." : "Entrar"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Ainda não tem conta?{" "}
        <Link href="/registro" className="font-medium underline">
          Criar conta grátis
        </Link>
      </p>
    </form>
  );
}
