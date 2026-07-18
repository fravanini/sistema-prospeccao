import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { sair } from "@/lib/auth-actions";

const LINKS = [
  { href: "/", label: "Pipeline", icone: "📊" },
  { href: "/fila", label: "Fila do dia", icone: "⏰" },
  { href: "/guia", label: "Guia do nicho", icone: "🧭" },
  { href: "/marcas", label: "Marcas", icone: "🏷️" },
  { href: "/descoberta", label: "Descoberta", icone: "🔎" },
  { href: "/mensagens", label: "Mensagens", icone: "✉️" },
  { href: "/templates", label: "Templates", icone: "📝" },
  { href: "/campanhas", label: "Campanhas", icone: "🎯" },
  { href: "/configuracoes", label: "Configurações", icone: "⚙️" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await exigirUsuario();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col bg-slate-900 text-slate-100">
        <div className="px-5 py-6">
          <p className="text-lg font-bold leading-tight">Prospecção</p>
          <p className="text-xs text-slate-400">parcerias com marcas</p>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-700/60"
            >
              <span aria-hidden>{l.icone}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 px-5 py-4">
          <p className="text-[11px] leading-relaxed text-slate-500">
            Envio manual e personalizado. Nada de automação de DM — sua conta vale mais.
          </p>
          <div className="flex items-center justify-between gap-2 border-t border-slate-700/60 pt-3">
            <p className="truncate text-xs text-slate-300" title={usuario.email}>
              {usuario.nome}
            </p>
            <form action={sair}>
              <button
                type="submit"
                className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-700/60 hover:text-slate-100"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
