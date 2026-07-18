export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <p className="text-2xl font-bold">Prospecção de Marcas</p>
        <p className="text-sm text-slate-500">
          O CRM do criador de conteúdo para fechar parcerias pagas
        </p>
      </div>
      <div className="card w-full max-w-sm">{children}</div>
    </div>
  );
}
