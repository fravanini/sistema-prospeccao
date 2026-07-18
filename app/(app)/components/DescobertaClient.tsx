"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  descobrirMarcas,
  garimparHashtags,
  importarPerfisApify,
  ResumoDescoberta,
} from "@/lib/actions";

export default function DescobertaClient({ hashtagsIniciais }: { hashtagsIniciais: string }) {
  const [resultados, acaoSites, pendenteSites] = useActionState(descobrirMarcas, null);
  const [garimpo, acaoGarimpo, pendenteGarimpo] = useActionState(garimparHashtags, null);
  const [perfis, acaoPerfis, pendentePerfis] = useActionState(importarPerfisApify, null);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">

      {/* ---------- 1. Garimpo por hashtag (Apify) ---------- */}
      <form action={acaoGarimpo} className="card flex flex-col gap-4">
        <div>
          <h2 className="font-semibold">1 · Garimpar marcas em posts de publi (Apify)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Busca posts recentes por hashtag (ex.: <code>publi</code>,{" "}
            <code>publitrekking</code>) e ranqueia os @perfis mais mencionados — quem aparece
            muito em post de publi é marca que comprovadamente paga criadores. Requer o token do
            Apify nas{" "}
            <Link href="/configuracoes" className="underline">
              Configurações
            </Link>
            .
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <div>
            <label htmlFor="hashtags">Hashtags (até 3, sem #)</label>
            <input
              type="text"
              id="hashtags"
              name="hashtags"
              defaultValue={hashtagsIniciais}
              placeholder="publi, parceria"
              required
            />
          </div>
          <div>
            <label htmlFor="limite">Posts por hashtag</label>
            <input type="text" id="limite" name="limite" defaultValue="30" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pendenteGarimpo} className="btn-primary">
            {pendenteGarimpo ? "Garimpando (até 2 min)..." : "Garimpar publis"}
          </button>
          <p className="text-xs text-slate-400">Consome créditos do seu plano Apify (~US$ 2,30/1.000 posts).</p>
        </div>
        {garimpo && !garimpo.ok && <Erro texto={garimpo.erro ?? "falhou"} />}
        {garimpo?.ok && (
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="mb-2 text-sm font-medium">
              {garimpo.posts} posts analisados · {garimpo.mencoes.length} perfis mencionados —
              copie os promissores para o passo 2:
            </p>
            {garimpo.mencoes.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma menção encontrada.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {garimpo.mencoes.map((m) => (
                  <span
                    key={m.handle}
                    className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs"
                  >
                    @{m.handle}
                    <span className="ml-1 font-semibold text-slate-400">×{m.ocorrencias}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </form>

      {/* ---------- 2. Importar perfis (Apify) ---------- */}
      <form action={acaoPerfis} className="card flex flex-col gap-4">
        <div>
          <h2 className="font-semibold">2 · Importar perfis de marcas do Instagram (Apify)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Puxa nome, bio, seguidores, e-mail público e o site da bio de cada perfil — e já
            manda o site para o extrator de contatos abaixo, tudo numa tacada.
          </p>
        </div>
        <div>
          <label htmlFor="usernames">@ dos perfis (até 20, separados por espaço ou vírgula)</label>
          <textarea
            id="usernames"
            name="usernames"
            rows={3}
            required
            placeholder="@aventuragear @cafedomato @ecohostel"
            className="font-mono !text-[13px]"
          />
        </div>
        <div>
          <button type="submit" disabled={pendentePerfis} className="btn-primary">
            {pendentePerfis ? "Importando perfis..." : "Importar e extrair contatos"}
          </button>
        </div>
        {perfis && <ListaResumos resumos={perfis} />}
      </form>

      {/* ---------- 3. Sites diretos ---------- */}
      <form action={acaoSites} className="card flex flex-col gap-4">
        <div>
          <h2 className="font-semibold">3 · Extrair contatos de sites (grátis, sem Apify)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cole sites de marcas (um por linha, até 10 por rodada). O sistema visita as páginas
            de contato/parcerias, extrai e-mails, Instagram, WhatsApp e CNPJ, consulta os dados
            públicos da Receita Federal e, com a chave do Hunter.io, busca e-mails nominais.
          </p>
        </div>
        <div>
          <label htmlFor="sites">Sites das marcas (um por linha)</label>
          <textarea
            id="sites"
            name="sites"
            rows={6}
            required
            placeholder={"trilhasecia.com.br\nhttps://cafedomato.com.br"}
            className="font-mono !text-[13px]"
          />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pendenteSites} className="btn-primary">
            {pendenteSites ? "Vasculhando sites..." : "Descobrir contatos"}
          </button>
          <p className="text-xs text-slate-400">Pode levar ~10s por site.</p>
        </div>
        {resultados && <ListaResumos resumos={resultados} />}
      </form>

      <div className="card text-sm text-slate-600">
        <p className="mb-1 font-semibold">Por que nada aqui usa a sua conta do Instagram</p>
        <p>
          Coleta automatizada logada na plataforma viola os termos da Meta e arriscaria sua conta
          de 50 mil seguidores. O garimpo via Apify roda nos servidores e proxies deles, sobre
          dados públicos — sua conta fica de fora.
        </p>
      </div>
    </div>
  );
}

function Erro({ texto }: { texto: string }) {
  return (
    <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
      {texto}
    </p>
  );
}

function ListaResumos({ resumos }: { resumos: ResumoDescoberta[] }) {
  if (resumos.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {resumos.map((r, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
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
              <p className="mt-1.5 text-sm text-slate-600">
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
  );
}
