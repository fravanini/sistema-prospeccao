import Link from "next/link";
import { montarFila, enviosDeHoje } from "@/lib/fila";
import { lerConfig, checarRespostasForm, moverMarca } from "@/lib/actions";
import { gmailConectado } from "@/lib/gmail";

export const dynamic = "force-dynamic";

export default async function FilaPage() {
  const [{ hoje, aguardando }, enviados, config, gmail] = await Promise.all([
    montarFila(),
    enviosDeHoje(),
    lerConfig(),
    gmailConectado(),
  ]);
  const limite = Math.max(1, Number(config["limite_diario"]) || 15);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Fila do dia</h1>
          <p className="text-sm text-slate-500">
            O que fazer hoje pela cadência D0 / D+4 / D+10 / D+20 — sem deixar follow-up escapar.
          </p>
        </div>
        {gmail.conectado ? (
          <form action={checarRespostasForm}>
            <button type="submit" className="btn-secondary">
              📬 Checar respostas no Gmail
            </button>
          </form>
        ) : (
          <Link href="/configuracoes" className="btn-secondary">
            Conectar Gmail
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card !p-4">
          <p className="text-xs text-slate-500">Envios hoje</p>
          <p className={`text-2xl font-bold ${enviados >= limite ? "text-rose-600" : ""}`}>
            {enviados}/{limite}
          </p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-slate-500">Pendências hoje</p>
          <p className="text-2xl font-bold">{hoje.length}</p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-slate-500">Aguardando cadência</p>
          <p className="text-2xl font-bold">{aguardando.length}</p>
        </div>
      </div>

      {enviados >= limite && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Limite diário atingido — os envios voltam amanhã. Aproveite para pesquisar marcas novas
          na Descoberta.
        </p>
      )}

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Para fazer hoje</h2>
        {hoje.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nada pendente. Cadastre marcas novas ou aguarde a cadência dos próximos follow-ups.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {hoje.map((item) => (
              <div
                key={`${item.marcaId}-${item.etapa}`}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3"
              >
                <div className="min-w-0 flex-1">
                  <Link href={`/marcas/${item.marcaId}`} className="font-medium hover:underline">
                    {item.marcaNome}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {item.rotulo}
                    {item.diasAtraso > 0 && (
                      <span className="ml-1 font-medium text-amber-600">
                        · {item.diasAtraso} dia{item.diasAtraso === 1 ? "" : "s"} de atraso
                      </span>
                    )}
                    {!item.contatoEmail && !item.encerrar && (
                      <span className="ml-1 font-medium text-rose-600">· sem e-mail cadastrado</span>
                    )}
                  </p>
                </div>
                {item.encerrar ? (
                  <form action={moverMarca.bind(null, item.marcaId, "PERDIDA")}>
                    <button type="submit" className="btn-danger !px-3 !py-1.5 text-xs">
                      Marcar Perdida
                    </button>
                  </form>
                ) : item.contatoEmail ? (
                  <Link
                    href={`/mensagens?marca=${item.marcaId}&etapa=${item.etapa}`}
                    className="btn-primary !px-3 !py-1.5 text-xs"
                  >
                    ✉️ Preparar envio
                  </Link>
                ) : (
                  <Link
                    href={`/marcas/${item.marcaId}`}
                    className="btn-secondary !px-3 !py-1.5 text-xs"
                  >
                    Adicionar e-mail
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Aguardando cadência</h2>
        {aguardando.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma marca aguardando.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {aguardando.map((a, i) => (
              <li key={i} className="flex justify-between gap-3 text-slate-600">
                <span>
                  {a.marcaNome} — {a.rotulo}
                </span>
                <span className="text-slate-400">
                  em {a.emDias} dia{a.emDias === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
