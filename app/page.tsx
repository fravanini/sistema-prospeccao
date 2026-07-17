import Link from "next/link";
import { prisma } from "@/lib/db";
import { STATUS_PIPELINE, scoreMarca } from "@/lib/constants";
import KanbanBoard, { MarcaCard } from "./components/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const marcas = await prisma.marca.findMany({
    orderBy: { updatedAt: "desc" },
    include: { contatos: { select: { id: true } } },
  });

  const cards: MarcaCard[] = marcas.map((m) => ({
    id: m.id,
    nome: m.nome,
    categoria: m.categoria,
    status: m.status,
    score: scoreMarca(m),
    contatos: m.contatos.length,
    naoContatar: m.naoContatar,
  }));

  const enviados = marcas.filter((m) =>
    ["EMAIL_ENVIADO", "FOLLOW_UP", "RESPONDEU", "NEGOCIANDO", "FECHADA", "PERDIDA"].includes(m.status)
  ).length;
  const responderam = marcas.filter((m) =>
    ["RESPONDEU", "NEGOCIANDO", "FECHADA"].includes(m.status)
  ).length;
  const fechadas = marcas.filter((m) => m.status === "FECHADA").length;
  const taxa = enviados > 0 ? Math.round((responderam / enviados) * 100) : 0;

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-sm text-slate-500">
            Arraste os cards entre as colunas conforme a prospecção avança.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/marcas/importar" className="btn-secondary">
            Importar CSV
          </Link>
          <Link href="/marcas/nova" className="btn-primary">
            + Nova marca
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat titulo="Marcas no pipeline" valor={marcas.length} />
        <Stat titulo="Já contatadas" valor={enviados} />
        <Stat titulo="Taxa de resposta" valor={`${taxa}%`} />
        <Stat titulo="Parcerias fechadas" valor={fechadas} />
      </div>

      {marcas.length === 0 ? (
        <div className="card flex flex-col items-start gap-3">
          <p className="font-medium">Nenhuma marca cadastrada ainda.</p>
          <p className="text-sm text-slate-500">
            Comece cadastrando marcas que já fazem publi com criadores do seu nicho — é a fonte
            com maior taxa de resposta. Você também pode importar uma lista em CSV.
          </p>
          <Link href="/marcas/nova" className="btn-primary">
            Cadastrar primeira marca
          </Link>
        </div>
      ) : (
        <KanbanBoard colunas={STATUS_PIPELINE.map((s) => ({ ...s }))} cards={cards} />
      )}
    </div>
  );
}

function Stat({ titulo, valor }: { titulo: string; valor: number | string }) {
  return (
    <div className="card !p-4">
      <p className="text-xs text-slate-500">{titulo}</p>
      <p className="text-2xl font-bold">{valor}</p>
    </div>
  );
}
