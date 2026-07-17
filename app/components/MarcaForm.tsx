import { CATEGORIAS, PORTES } from "@/lib/constants";

interface Valores {
  nome?: string;
  site?: string | null;
  instagram?: string | null;
  categoria?: string;
  porte?: string | null;
  origem?: string | null;
  notas?: string | null;
  fazPubli?: boolean;
  rodaAnuncios?: boolean;
  temEcommerce?: boolean;
  jaInteragiu?: boolean;
}

export default function MarcaForm({
  action,
  valores = {},
  textoBotao,
}: {
  action: (fd: FormData) => Promise<void>;
  valores?: Valores;
  textoBotao: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nome">Nome da marca *</label>
          <input type="text" id="nome" name="nome" required defaultValue={valores.nome ?? ""} />
        </div>
        <div>
          <label htmlFor="site">Site</label>
          <input
            type="text"
            id="site"
            name="site"
            placeholder="https://..."
            defaultValue={valores.site ?? ""}
          />
        </div>
        <div>
          <label htmlFor="instagram">Instagram</label>
          <input
            type="text"
            id="instagram"
            name="instagram"
            placeholder="@marca"
            defaultValue={valores.instagram ?? ""}
          />
        </div>
        <div>
          <label htmlFor="categoria">Categoria</label>
          <select id="categoria" name="categoria" defaultValue={valores.categoria ?? "Outra"}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="porte">Porte</label>
          <select id="porte" name="porte" defaultValue={valores.porte ?? ""}>
            <option value="">—</option>
            {PORTES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="origem">Origem (como você descobriu a marca)</label>
          <input
            type="text"
            id="origem"
            name="origem"
            placeholder="Ex.: publi do @criadorx, Biblioteca de Anúncios, me segue"
            defaultValue={valores.origem ?? ""}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="notas">Notas de pesquisa / gancho personalizado</label>
          <textarea
            id="notas"
            name="notas"
            rows={3}
            placeholder="Ex.: lançou a linha de mochilas UL em junho; fez publi com @fulano em maio; forte em trekking"
            defaultValue={valores.notas ?? ""}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Este texto vira a variável {"{{gancho}}"} na geração da mensagem — capriche aqui.
          </p>
        </div>
      </div>

      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-xs font-semibold text-slate-600">
          Sinais de compra (definem o score de prioridade)
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <Checkbox nome="fazPubli" marcado={valores.fazPubli} rotulo="Já fez publi com criadores (+3)" />
          <Checkbox nome="rodaAnuncios" marcado={valores.rodaAnuncios} rotulo="Roda anúncios (Meta Ads) (+2)" />
          <Checkbox nome="jaInteragiu" marcado={valores.jaInteragiu} rotulo="Já interagiu com meu perfil (+2)" />
          <Checkbox nome="temEcommerce" marcado={valores.temEcommerce} rotulo="Tem e-commerce (+1)" />
        </div>
      </fieldset>

      <div>
        <button type="submit" className="btn-primary">
          {textoBotao}
        </button>
      </div>
    </form>
  );
}

function Checkbox({ nome, marcado, rotulo }: { nome: string; marcado?: boolean; rotulo: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-normal text-slate-700">
      <input
        type="checkbox"
        name={nome}
        defaultChecked={marcado ?? false}
        className="h-4 w-4 rounded border-slate-300"
      />
      {rotulo}
    </label>
  );
}
