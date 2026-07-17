"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { moverMarca } from "@/lib/actions";

export interface MarcaCard {
  id: number;
  nome: string;
  categoria: string;
  status: string;
  score: number;
  contatos: number;
  naoContatar: boolean;
}

interface Coluna {
  id: string;
  label: string;
  cor: string;
}

export default function KanbanBoard({ colunas, cards }: { colunas: Coluna[]; cards: MarcaCard[] }) {
  const [, startTransition] = useTransition();
  const [otimista, moverOtimista] = useOptimistic(
    cards,
    (estado, { id, status }: { id: number; status: string }) =>
      estado.map((c) => (c.id === id ? { ...c, status } : c))
  );
  const [alvo, setAlvo] = useState<string | null>(null);

  function soltar(e: React.DragEvent, status: string) {
    e.preventDefault();
    setAlvo(null);
    const id = Number(e.dataTransfer.getData("text/plain"));
    if (!id) return;
    startTransition(async () => {
      moverOtimista({ id, status });
      await moverMarca(id, status);
    });
  }

  return (
    <div className="flex flex-1 gap-3 overflow-x-auto pb-4">
      {colunas.map((col) => {
        const doStatus = otimista
          .filter((c) => c.status === col.id)
          .sort((a, b) => b.score - a.score);
        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              setAlvo(col.id);
            }}
            onDragLeave={() => setAlvo((a) => (a === col.id ? null : a))}
            onDrop={(e) => soltar(e, col.id)}
            className={`flex w-64 shrink-0 flex-col rounded-xl border bg-slate-50 transition ${
              alvo === col.id ? "border-slate-500 bg-slate-200/70" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className={`h-2.5 w-2.5 rounded-full ${col.cor}`} />
              <p className="text-sm font-semibold">{col.label}</p>
              <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                {doStatus.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
              {doStatus.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", String(card.id))}
                  className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/marcas/${card.id}`}
                      className="text-sm font-medium leading-snug hover:underline"
                    >
                      {card.nome}
                    </Link>
                    <ScoreBadge score={card.score} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{card.categoria}</p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>
                      {card.contatos} contato{card.contatos === 1 ? "" : "s"}
                    </span>
                    {card.naoContatar && (
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 font-medium text-rose-600">
                        não contatar
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const cor =
    score >= 5
      ? "bg-emerald-100 text-emerald-700"
      : score >= 3
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-500";
  return (
    <span
      title="Score de prioridade (0–8): sinais de que a marca já investe em criadores"
      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${cor}`}
    >
      {score}
    </span>
  );
}
