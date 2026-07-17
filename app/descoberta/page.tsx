"use client";

import Link from "next/link";
import { useActionState } from "react";
import { descobrirMarcas } from "@/lib/actions";

export default function DescobertaPage() {
  const [resultados, acao, pendente] = useActionState(descobrirMarcas, null);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Descoberta automática</h1>
        <p className="text-sm text-slate-500">
          Cole os sites das marcas (um por linha, até 10 por rodada). O sistema visita o site e as
          páginas de contato/parcerias, extrai e-mails, Instagram, WhatsApp e CNPJ, consulta os
          dados públicos da Receita Federal e — se você configurou a chave do Hunter.io — busca
          e-mails nominais do domínio. Marcas e contatos são criados sozinhos.
        </p>
      </div>

      <div className="card text-sm text-slate-600">
        <p className="mb-1 font-semibold">O que este módulo NÃO faz (de propósito)</p>
        <p>
          Ele não raspa o Instagram: coleta automatizada na plataforma viola os termos da Meta e
          coloca sua conta de 50 mil seguidores em risco de bloqueio. Descubra as marcas manualmente
          (publis de criadores do nicho, Biblioteca de Anúncios) e deixe a parte chata — achar
          e-mail e contato — para cá.
        </p>
      </div>

      <form action={acao} className="card flex flex-col gap-4">
        <div>
          <label htmlFor="sites">Sites das marcas (um por linha)</label>
          <textarea
            id="sites"
            name="sites"
            rows={8}
            required
            placeholder={"trilhasecia.com.br\nhttps://cafedomato.com.br\nlojaoutdoorx.com.br"}
            className="font-mono !text-[13px]"
          />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pendente} className="btn-primary">
            {pendente ? "Vasculhando sites..." : "Descobrir contatos"}
          </button>
          <p className="text-xs text-slate-400">Pode levar ~10s por site.</p>
        </div>
      </form>

      {resultados && (
        <div className="flex flex-col gap-3">
          {resultados.map((r, i) => (
            <div key={i} className="card">
              {r.ok ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      ok
                    </span>
                    <Link href={`/marcas/${r.marcaId}`} className="font-semibold hover:underline">
                      {r.nome}
                    </Link>
                    <span className="text-xs text-slate-400">{r.site}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {r.novosContatos} contato{r.novosContatos === 1 ? "" : "s"} novo
                    {r.novosContatos === 1 ? "" : "s"}
                    {r.instagram ? ` · Instagram: ${r.instagram}` : ""}
                    {r.razaoSocial ? ` · ${r.razaoSocial}` : ""}
                    {r.cnpj ? ` · CNPJ ${r.cnpj}` : ""}
                  </p>
                  {r.avisos.length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-xs text-amber-700">
                      {r.avisos.map((a, j) => (
                        <li key={j}>{a}</li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600">
                    falhou
                  </span>
                  <span className="font-medium">{r.site}</span>
                  <span className="text-sm text-slate-500">— {r.erro}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
