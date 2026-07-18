import { CONFIG_PADRAO } from "@/lib/constants";
import { desconectarGmail, lerConfig, salvarConfig } from "@/lib/actions";
import { gmailConectado } from "@/lib/gmail";
import { exigirUsuario } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string }>;
}) {
  const usuario = await exigirUsuario();
  const [{ gmail }, config, statusGmail] = await Promise.all([
    searchParams,
    lerConfig(),
    gmailConectado(usuario.id),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-slate-500">
          Estes dados preenchem as variáveis dos templates ({"{{meu_nome}}"}, {"{{metricas}}"},
          etc.). Mantenha as métricas atualizadas — números concretos vendem.
        </p>
      </div>

      <section className="card">
        <h2 className="mb-1 text-lg font-semibold">Conexão com o Gmail</h2>
        <p className="mb-3 text-sm text-slate-500">
          Com o Gmail conectado, o app envia os e-mails direto da tela de Mensagens (respeitando o
          limite diário) e detecta respostas para mover os cards sozinho.
        </p>
        {gmail === "ok" && (
          <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Gmail conectado com sucesso!
          </p>
        )}
        {gmail === "erro" && (
          <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            A conexão falhou — confira o Client ID/Secret e tente de novo.
          </p>
        )}
        {gmail === "sem_client_id" && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Preencha e salve o Client ID e o Client Secret abaixo antes de conectar.
          </p>
        )}
        {statusGmail.conectado ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded bg-emerald-100 px-2 py-1 text-sm font-medium text-emerald-700">
              ✓ Conectado{statusGmail.email ? ` como ${statusGmail.email}` : ""}
            </span>
            <form action={desconectarGmail}>
              <button type="submit" className="btn-secondary">
                Desconectar
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <a href="/api/gmail/auth" className="btn-primary w-fit">
              Conectar Gmail
            </a>
            <ol className="list-inside list-decimal text-xs leading-relaxed text-slate-500">
              <li>
                Acesse console.cloud.google.com → crie um projeto → ative a <strong>Gmail API</strong>
              </li>
              <li>
                Tela de permissão OAuth: tipo Externo, adicione seu e-mail como usuário de teste
              </li>
              <li>
                Credenciais → Criar credencial → ID do cliente OAuth → tipo{" "}
                <strong>Aplicativo da Web</strong>, com URI de redirecionamento{" "}
                <code className="rounded bg-slate-100 px-1">
                  http://localhost:3000/api/gmail/callback
                </code>
              </li>
              <li>Cole o Client ID e o Secret abaixo, salve e clique em Conectar</li>
            </ol>
          </div>
        )}
      </section>

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
            {def.ajuda && <p className="mt-1 text-[11px] text-slate-400">{def.ajuda}</p>}
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
