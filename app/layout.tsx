import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prospecção de Marcas",
  description: "CRM de prospecção ativa de marcas para parcerias no Instagram",
};

const LINKS = [
  { href: "/", label: "Pipeline", icone: "📊" },
  { href: "/marcas", label: "Marcas", icone: "🏷️" },
  { href: "/descoberta", label: "Descoberta", icone: "🔎" },
  { href: "/mensagens", label: "Mensagens", icone: "✉️" },
  { href: "/templates", label: "Templates", icone: "📝" },
  { href: "/campanhas", label: "Campanhas", icone: "🎯" },
  { href: "/configuracoes", label: "Configurações", icone: "⚙️" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
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
            <div className="mt-auto px-5 py-4 text-[11px] leading-relaxed text-slate-500">
              Envio manual e personalizado. Nada de automação de DM — sua conta vale mais.
            </div>
          </aside>
          <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
