import { CONFIG_PADRAO } from "@/lib/constants";
import { lerConfig, salvarConfig } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const config = await lerConfig();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-slate-500">
          Estes dados preenchem as variáveis dos templates ({"{{meu_nome}}"}, {"{{metricas}}"},
          etc.). Mantenha as métricas atualizadas — números concretos vendem.
        </p>
      </div>
      <form action={salvarConfig} className="card flex flex-col gap-4">
        {Object.entries(CONFIG_PADRAO).map(([chave, def]) => (
          <div key={chave}>
            <label htmlFor={`cfg-${chave}`}>{def.label}</label>
            {chave === "assinatura" ? (
              <textarea
                id={`cfg-${chave}`}
                name={chave}
                rows={4}
                defaultValue={config[chave] ?? def.valor}
                placeholder={def.ajuda}
              />
            ) : (
              <input
                type="text"
                id={`cfg-${chave}`}
                name={chave}
                defaultValue={config[chave] ?? def.valor}
                placeholder={def.ajuda}
              />
            )}
          </div>
        ))}
        <div>
          <button type="submit" className="btn-primary">
            Salvar configurações
          </button>
        </div>
      </form>
    </div>
  );
}
