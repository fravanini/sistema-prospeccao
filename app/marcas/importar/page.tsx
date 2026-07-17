"use client";

import Link from "next/link";
import { useActionState } from "react";
import { importarMarcasCSV } from "@/lib/actions";

const EXEMPLO = `nome,site,instagram,categoria,origem,notas,fazPubli,rodaAnuncios,temEcommerce,jaInteragiu
Trilhas & Cia,https://trilhasecia.com.br,@trilhasecia,Equipamento outdoor,publi do @aventureirox,lançou mochila 40L em maio,sim,sim,sim,nao
Café do Mato,,@cafedomato,Alimentos e bebidas,Biblioteca de Anúncios,café especial para camping,nao,sim,sim,nao`;

export default function ImportarPage() {
  const [resultado, acao, pendente] = useActionState(importarMarcasCSV, null);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Importar marcas (CSV)</h1>
        <p className="text-sm text-slate-500">
          Envie um arquivo ou cole o conteúdo. Separador vírgula ou ponto e vírgula; a primeira
          linha pode ser o cabeçalho.
        </p>
      </div>

      <div className="card text-sm">
        <p className="mb-2 font-medium">Colunas reconhecidas</p>
        <p className="text-slate-500">
          <code>nome</code> (obrigatória), <code>site</code>, <code>instagram</code>,{" "}
          <code>categoria</code>, <code>porte</code>, <code>origem</code>, <code>notas</code>,{" "}
          <code>fazPubli</code>, <code>rodaAnuncios</code>, <code>temEcommerce</code>,{" "}
          <code>jaInteragiu</code> (use <code>sim</code>/<code>nao</code>)
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
          {EXEMPLO}
        </pre>
      </div>

      <form action={acao} className="card flex flex-col gap-4">
        <div>
          <label htmlFor="arquivo">Arquivo .csv</label>
          <input
            type="file"
            id="arquivo"
            name="arquivo"
            accept=".csv,text/csv,text/plain"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          />
        </div>
        <div>
          <label htmlFor="conteudo">…ou cole o CSV aqui</label>
          <textarea id="conteudo" name="conteudo" rows={8} placeholder={EXEMPLO} />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pendente} className="btn-primary">
            {pendente ? "Importando..." : "Importar"}
          </button>
          <Link href="/marcas" className="btn-secondary">
            Voltar
          </Link>
        </div>
      </form>

      {resultado && (
        <div className="card">
          <p className="font-medium text-emerald-700">
            {resultado.ok} marca{resultado.ok === 1 ? "" : "s"} importada
            {resultado.ok === 1 ? "" : "s"}.
          </p>
          {resultado.erros.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-amber-700">
              {resultado.erros.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          {resultado.ok > 0 && (
            <Link href="/marcas" className="btn-secondary mt-3">
              Ver marcas importadas
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
