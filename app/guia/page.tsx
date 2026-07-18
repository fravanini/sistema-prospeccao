import Link from "next/link";
import { NICHOS } from "@/lib/nichos";
import { nichoAtual } from "@/lib/nicho-atual";
import { salvarConfig } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function GuiaPage() {
  const nicho = await nichoAtual();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Guia do nicho</h1>
        <p className="text-sm text-slate-500">
          Selecione o seu nicho e o app inteiro se adapta: categorias de marca, hashtags do
          garimpo e o playbook de pesquisa abaixo.
        </p>
      </div>

      <form action={salvarConfig} className="card flex flex-wrap items-end gap-3">
        <div className="w-72">
          <label htmlFor="nicho_id">Seu nicho</label>
          <select id="nicho_id" name="nicho_id" defaultValue={nicho.id}>
            {NICHOS.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nome}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Aplicar nicho
        </button>
        <p className="w-full text-xs text-slate-400">{nicho.descricao}</p>
      </form>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">Quem prospectar (tipos de marca)</h2>
        <ul className="list-inside list-disc text-sm leading-relaxed text-slate-600">
          {nicho.tiposDeMarca.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          Categorias ativas no cadastro de marcas:{" "}
          {nicho.categorias.filter((c) => c !== "Outra").join(" · ")}
        </p>
      </section>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">Onde pesquisar</h2>
        <ul className="list-inside list-disc text-sm leading-relaxed text-slate-600">
          {nicho.ondePesquisar.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Hashtags para o garimpo:</span>
          {nicho.hashtags.map((h) => (
            <span key={h} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium">
              #{h}
            </span>
          ))}
          <Link
            href={`/descoberta?hashtags=${encodeURIComponent(nicho.hashtags.slice(0, 3).join(", "))}`}
            className="btn-primary !px-3 !py-1.5 text-xs"
          >
            🔎 Garimpar com essas hashtags
          </Link>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">O que observar para o gancho</h2>
        <p className="mb-2 text-sm text-slate-500">
          O gancho personalizado (notas da marca) é o que separa e-mail respondido de e-mail
          ignorado. No seu nicho, procure por:
        </p>
        <ul className="list-inside list-disc text-sm leading-relaxed text-slate-600">
          {nicho.ganchoDicas.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">Ritmo e metas</h2>
        <ul className="list-inside list-disc text-sm leading-relaxed text-slate-600">
          <li>15–25 marcas novas pesquisadas por semana</li>
          <li>Até ~15 e-mails/dia (limite configurável) para proteger a entregabilidade</li>
          <li>Follow-ups em D+4, D+10 e D+20 — a Fila do dia cuida das datas</li>
          <li>Taxa de resposta alvo: 8–15%. Abaixo disso, melhore o gancho antes de aumentar volume</li>
          <li>1–3 parcerias fechadas/mês; permuta vale no início para gerar cases</li>
        </ul>
      </section>
    </div>
  );
}
