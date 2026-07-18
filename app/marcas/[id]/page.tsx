import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  STATUS_PIPELINE,
  TIPOS_INTERACAO,
  scoreMarca,
  statusLabel,
} from "@/lib/constants";
import {
  alternarNaoContatar,
  atualizarContato,
  atualizarMarca,
  criarContato,
  enriquecerMarca,
  excluirContato,
  excluirMarca,
  moverMarca,
  registrarInteracaoForm,
} from "@/lib/actions";
import MarcaForm from "../../components/MarcaForm";
import ConfirmSubmit from "../../components/ConfirmSubmit";
import { ScoreBadge } from "../../components/KanbanBoard";
import { nichoAtual } from "@/lib/nicho-atual";

export const dynamic = "force-dynamic";

export default async function FichaMarcaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const marcaId = Number(id);
  if (!Number.isInteger(marcaId)) notFound();

  const [marca, nicho] = await Promise.all([
    prisma.marca.findUnique({
      where: { id: marcaId },
      include: {
        contatos: { orderBy: { createdAt: "asc" } },
        interacoes: { orderBy: { data: "desc" }, include: { contato: true } },
      },
    }),
    nichoAtual(),
  ]);
  if (!marca) notFound();

  const moverAction = async (fd: FormData) => {
    "use server";
    await moverMarca(marcaId, String(fd.get("status")));
  };
  const naoContatarAction = alternarNaoContatar.bind(null, marcaId, !marca.naoContatar);
  const excluirAction = excluirMarca.bind(null, marcaId);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{marca.nome}</h1>
            <ScoreBadge score={scoreMarca(marca)} />
            {marca.naoContatar && (
              <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600">
                não contatar
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {marca.categoria}
            {marca.instagram ? ` · ${marca.instagram}` : ""}
            {marca.site ? (
              <>
                {" · "}
                <a
                  href={marca.site.startsWith("http") ? marca.site : `https://${marca.site}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  site
                </a>
              </>
            ) : (
              ""
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/mensagens?marca=${marca.id}`} className="btn-primary">
            ✉️ Gerar mensagem
          </Link>
          <form action={naoContatarAction}>
            <button type="submit" className="btn-secondary">
              {marca.naoContatar ? "Permitir contato" : "Marcar não contatar"}
            </button>
          </form>
          <form action={excluirAction}>
            <ConfirmSubmit mensagem={`Excluir a marca "${marca.nome}" e todo o histórico?`}>
              Excluir
            </ConfirmSubmit>
          </form>
        </div>
      </div>

      <form action={moverAction} className="card flex flex-wrap items-end gap-3 !py-4">
        <div className="w-56">
          <label htmlFor="status">Etapa no pipeline</label>
          <select id="status" name="status" defaultValue={marca.status}>
            {STATUS_PIPELINE.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-secondary">
          Mover
        </button>
        <p className="text-xs text-slate-400">
          Atual: <strong>{statusLabel(marca.status)}</strong>
        </p>
      </form>

      <section className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Contatos</h2>
          {marca.site ? (
            <form action={enriquecerMarca.bind(null, marca.id)}>
              <button
                type="submit"
                className="btn-secondary !px-3 !py-1.5 text-xs"
                title="Visita o site da marca, extrai e-mails/Instagram/CNPJ e consulta os dados públicos da Receita"
              >
                🔎 Buscar contatos do site
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-400">
              Cadastre o site da marca para usar a busca automática de contatos.
            </p>
          )}
        </div>
        {marca.contatos.length === 0 && (
          <p className="mb-3 text-sm text-slate-400">
            Nenhum contato ainda. Procure no site da marca (página de parcerias/embaixadores) e no
            LinkedIn (cargos de marketing).
          </p>
        )}
        <div className="flex flex-col gap-2">
          {marca.contatos.map((c) => (
            <details key={c.id} className="rounded-lg border border-slate-200 p-3">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{c.nome}</span>
                {c.cargo && <span className="text-slate-500">· {c.cargo}</span>}
                {c.email && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{c.email}</span>
                )}
                {c.verificado && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                    verificado
                  </span>
                )}
                <span className="ml-auto text-xs text-slate-400">editar ▾</span>
              </summary>
              <form action={atualizarContato.bind(null, c.id)} className="mt-3 grid gap-3 sm:grid-cols-2">
                <CamposContato
                  valores={{
                    nome: c.nome,
                    cargo: c.cargo,
                    email: c.email,
                    fonteEmail: c.fonteEmail,
                    linkedin: c.linkedin,
                    verificado: c.verificado,
                  }}
                />
                <div className="flex gap-2 sm:col-span-2">
                  <button type="submit" className="btn-secondary">
                    Salvar
                  </button>
                  <button type="submit" formAction={excluirContato.bind(null, c.id)} className="btn-danger">
                    Excluir contato
                  </button>
                </div>
              </form>
            </details>
          ))}
        </div>
        <details className="mt-3 rounded-lg border border-dashed border-slate-300 p-3">
          <summary className="cursor-pointer list-none text-sm font-medium text-slate-600">
            + Adicionar contato
          </summary>
          <form action={criarContato} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="marcaId" value={marca.id} />
            <CamposContato />
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary">
                Adicionar
              </button>
            </div>
          </form>
        </details>
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Histórico de interações</h2>
        <form action={registrarInteracaoForm} className="mb-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="marcaId" value={marca.id} />
          <div className="w-56">
            <label htmlFor="tipo">Registrar</label>
            <select id="tipo" name="tipo">
              {TIPOS_INTERACAO.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-64 flex-1">
            <label htmlFor="resultado">Observação</label>
            <input
              type="text"
              id="resultado"
              name="resultado"
              placeholder="Ex.: respondeu pedindo mídia kit"
            />
          </div>
          <button type="submit" className="btn-secondary">
            Registrar
          </button>
        </form>
        {marca.interacoes.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma interação registrada.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {marca.interacoes.map((i) => (
              <li key={i.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {TIPOS_INTERACAO.find((t) => t.id === i.tipo)?.label ?? i.tipo}
                  </span>
                  {i.contato && <span className="text-slate-500">para {i.contato.nome}</span>}
                  <span className="ml-auto text-xs text-slate-400">
                    {i.data.toLocaleDateString("pt-BR")}{" "}
                    {i.data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {i.assunto && <p className="mt-1 text-slate-600">Assunto: {i.assunto}</p>}
                {i.resultado && <p className="mt-1 text-slate-600">{i.resultado}</p>}
                {i.corpo && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-slate-400">
                      ver mensagem enviada
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap rounded bg-white p-3 text-xs text-slate-600">
                      {i.corpo}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Editar dados da marca</h2>
        <MarcaForm
          action={atualizarMarca.bind(null, marca.id)}
          valores={marca}
          textoBotao="Salvar alterações"
          categorias={nicho.categorias}
        />
      </section>
    </div>
  );
}

function CamposContato({
  valores = {},
}: {
  valores?: {
    nome?: string;
    cargo?: string | null;
    email?: string | null;
    fonteEmail?: string | null;
    linkedin?: string | null;
    verificado?: boolean;
  };
}) {
  return (
    <>
      <div>
        <label>Nome *</label>
        <input type="text" name="nome" required defaultValue={valores.nome ?? ""} />
      </div>
      <div>
        <label>Cargo</label>
        <input
          type="text"
          name="cargo"
          placeholder="Ex.: Coord. de Marketing"
          defaultValue={valores.cargo ?? ""}
        />
      </div>
      <div>
        <label>E-mail</label>
        <input type="email" name="email" defaultValue={valores.email ?? ""} />
      </div>
      <div>
        <label>Fonte do e-mail</label>
        <input
          type="text"
          name="fonteEmail"
          placeholder="Ex.: Hunter.io, site, LinkedIn"
          defaultValue={valores.fonteEmail ?? ""}
        />
      </div>
      <div>
        <label>LinkedIn</label>
        <input type="text" name="linkedin" defaultValue={valores.linkedin ?? ""} />
      </div>
      <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm font-normal text-slate-700">
        <input
          type="checkbox"
          name="verificado"
          defaultChecked={valores.verificado ?? false}
          className="h-4 w-4"
        />
        E-mail verificado
      </label>
    </>
  );
}
