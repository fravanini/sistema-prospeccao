import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { alternarCampanha, criarCampanha, excluirCampanha } from "@/lib/actions";
import ConfirmSubmit from "../components/ConfirmSubmit";

export const dynamic = "force-dynamic";

export default async function CampanhasPage() {
  const usuario = await exigirUsuario();
  const campanhas = await prisma.campanha.findMany({
    where: { usuarioId: usuario.id },
    orderBy: { id: "desc" },
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Campanhas</h1>
        <p className="text-sm text-slate-500">
          Uma campanha é o motivo concreto do contato — uma viagem, uma série de conteúdo, uma
          data. Proposta com contexto real converte muito mais que abordagem genérica.
        </p>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-slate-600">+ Nova campanha</h2>
        <form action={criarCampanha} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label>Nome *</label>
              <input
                type="text"
                name="nome"
                required
                placeholder="Ex.: Expedição Chapada dos Veadeiros"
              />
            </div>
            <div>
              <label>Período</label>
              <input type="text" name="periodo" placeholder="Ex.: setembro/2026" />
            </div>
          </div>
          <div>
            <label>Pitch base (vira a variável {"{{pitch}}"})</label>
            <textarea
              name="pitchBase"
              rows={3}
              placeholder="Ex.: vou passar 10 dias na Chapada produzindo reels de travessia — encaixe perfeito para mostrar equipamento em uso real"
            />
          </div>
          <div>
            <button type="submit" className="btn-primary">
              Criar campanha
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        {campanhas.map((c) => (
          <div key={c.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{c.nome}</p>
              {c.periodo && <span className="text-sm text-slate-500">· {c.periodo}</span>}
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  c.ativa ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {c.ativa ? "ativa" : "inativa"}
              </span>
              <div className="ml-auto flex gap-2">
                <form action={alternarCampanha.bind(null, c.id, !c.ativa)}>
                  <button type="submit" className="btn-secondary !px-3 !py-1.5 text-xs">
                    {c.ativa ? "Desativar" : "Ativar"}
                  </button>
                </form>
                <form action={excluirCampanha.bind(null, c.id)}>
                  <ConfirmSubmit
                    mensagem={`Excluir a campanha "${c.nome}"?`}
                    className="btn-danger !px-3 !py-1.5 text-xs"
                  >
                    Excluir
                  </ConfirmSubmit>
                </form>
              </div>
            </div>
            {c.pitchBase && <p className="mt-2 text-sm text-slate-600">{c.pitchBase}</p>}
          </div>
        ))}
        {campanhas.length === 0 && (
          <p className="text-sm text-slate-400">Nenhuma campanha ainda.</p>
        )}
      </div>
    </div>
  );
}
