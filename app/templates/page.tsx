import { prisma } from "@/lib/db";
import { ETAPAS_TEMPLATE, VARIAVEIS_TEMPLATE } from "@/lib/constants";
import { atualizarTemplate, criarTemplate, excluirTemplate } from "@/lib/actions";
import ConfirmSubmit from "../components/ConfirmSubmit";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({ orderBy: { id: "asc" } });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Templates de mensagem</h1>
        <p className="text-sm text-slate-500">
          Um template por etapa da cadência: D0 (inicial), D+4, D+10 e D+20. Use as variáveis para
          personalizar automaticamente.
        </p>
      </div>

      <details className="card">
        <summary className="cursor-pointer text-sm font-semibold text-slate-600">
          Variáveis disponíveis ({VARIAVEIS_TEMPLATE.length})
        </summary>
        <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          {VARIAVEIS_TEMPLATE.map((v) => (
            <p key={v.chave}>
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{v.chave}</code>{" "}
              <span className="text-slate-500">{v.descricao}</span>
            </p>
          ))}
        </div>
      </details>

      {templates.map((t) => (
        <details key={t.id} className="card">
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2">
            <span className="font-semibold">{t.nome}</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {ETAPAS_TEMPLATE.find((e) => e.id === t.etapa)?.label ?? t.etapa}
            </span>
            <span className="ml-auto text-xs text-slate-400">editar ▾</span>
          </summary>
          <form action={atualizarTemplate.bind(null, t.id)} className="mt-4 flex flex-col gap-3">
            <CamposTemplate valores={t} />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                Salvar
              </button>
              <ConfirmSubmit
                mensagem={`Excluir o template "${t.nome}"?`}
                formAction={excluirTemplate.bind(null, t.id)}
              >
                Excluir
              </ConfirmSubmit>
            </div>
          </form>
        </details>
      ))}

      <details className="card border-dashed" open={templates.length === 0}>
        <summary className="cursor-pointer text-sm font-semibold text-slate-600">
          + Novo template
        </summary>
        <form action={criarTemplate} className="mt-4 flex flex-col gap-3">
          <CamposTemplate />
          <div>
            <button type="submit" className="btn-primary">
              Criar template
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}

function CamposTemplate({
  valores,
}: {
  valores?: { nome: string; etapa: string; assunto: string; corpo: string };
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label>Nome *</label>
          <input type="text" name="nome" required defaultValue={valores?.nome ?? ""} />
        </div>
        <div>
          <label>Etapa da cadência</label>
          <select name="etapa" defaultValue={valores?.etapa ?? "INICIAL"}>
            {ETAPAS_TEMPLATE.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label>Assunto *</label>
        <input type="text" name="assunto" required defaultValue={valores?.assunto ?? ""} />
      </div>
      <div>
        <label>Corpo *</label>
        <textarea
          name="corpo"
          rows={12}
          required
          defaultValue={valores?.corpo ?? ""}
          className="font-mono !text-[13px]"
        />
      </div>
    </>
  );
}
