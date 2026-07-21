import Link from "next/link";
import { prisma } from "@/lib/db";
import { STATUS_PIPELINE, scoreMarca, statusLabel } from "@/lib/constants";
import { categoriasDisponiveis, nichoAtual } from "@/lib/nicho-atual";
import { exigirUsuario } from "@/lib/auth";
import { ScoreBadge } from "../components/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function MarcasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; status?: string }>;
}) {
  const usuario = await exigirUsuario();
  const { q, categoria, status } = await searchParams;
  const categorias = await categoriasDisponiveis(usuario.id, await nichoAtual(usuario.id));

  const marcas = await prisma.marca.findMany({
    where: {
      usuarioId: usuario.id,
      ...(q ? { nome: { contains: q, mode: "insensitive" as const } } : {}),
      ...(categoria ? { categoria } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { contatos: { select: { id: true } } },
  });

  const ordenadas = [...marcas].sort((a, b) => scoreMarca(b) - scoreMarca(a));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Marcas</h1>
          <p className="text-sm text-slate-500">
            {marcas.length} marca{marcas.length === 1 ? "" : "s"} — ordenadas por score de prioridade
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

      <form className="card grid gap-3 sm:grid-cols-4" method="get">
        <div className="sm:col-span-2">
          <label htmlFor="q">Buscar por nome</label>
          <input type="text" id="q" name="q" defaultValue={q ?? ""} placeholder="Nome da marca" />
        </div>
        <div>
          <label htmlFor="categoria">Categoria</label>
          <select id="categoria" name="categoria" defaultValue={categoria ?? ""}>
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status">Etapa</label>
          <select id="status" name="status" defaultValue={status ?? ""}>
            <option value="">Todas</option>
            {STATUS_PIPELINE.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end sm:col-span-4">
          <button type="submit" className="btn-secondary">
            Filtrar
          </button>
        </div>
      </form>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Etapa</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Contatos</th>
              <th className="px-4 py-3">Instagram</th>
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((m) => (
              <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/marcas/${m.id}`} className="font-medium hover:underline">
                    {m.nome}
                  </Link>
                  {m.naoContatar && (
                    <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-medium text-rose-600">
                      não contatar
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{m.categoria}</td>
                <td className="px-4 py-3 text-slate-500">{statusLabel(m.status)}</td>
                <td className="px-4 py-3">
                  <ScoreBadge score={scoreMarca(m)} />
                </td>
                <td className="px-4 py-3 text-slate-500">{m.contatos.length}</td>
                <td className="px-4 py-3 text-slate-500">{m.instagram ?? "—"}</td>
              </tr>
            ))}
            {ordenadas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma marca encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
