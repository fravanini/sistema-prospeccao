"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registrar } from "@/lib/auth-actions";

export default function RegistroPage() {
  const [estado, acao, pendente] = useActionState(registrar, null);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Criar conta</h1>
        <p className="text-sm text-slate-500">
          Sua conta já nasce com os templates da cadência D0 / D+4 / D+10 / D+20.
        </p>
      </div>
      <div>
        <label htmlFor="nome">Seu nome</label>
        <input type="text" id="nome" name="nome" required autoComplete="name" />
      </div>
      <div>
        <label htmlFor="email">E-mail</label>
        <input type="email" id="email" name="email" required autoComplete="email" />
      </div>
      <div>
        <label htmlFor="senha">Senha (mín. 8 caracteres)</label>
        <input
          type="password"
          id="senha"
          name="senha"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </div>
      {estado?.erro && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {estado.erro}
        </p>
      )}
      <button type="submit" disabled={pendente} className="btn-primary">
        {pendente ? "Criando conta..." : "Criar conta"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
