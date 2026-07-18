"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { enviarEmailGmail, registrarInteracao } from "@/lib/actions";
import { renderTemplate } from "@/lib/render";
import { ETAPAS_TEMPLATE } from "@/lib/constants";

interface ContatoItem {
  id: number;
  nome: string;
  cargo: string | null;
  email: string | null;
}

interface MarcaItem {
  id: number;
  nome: string;
  notas: string | null;
  contatos: ContatoItem[];
}

interface TemplateItem {
  id: number;
  nome: string;
  etapa: string;
  assunto: string;
  corpo: string;
}

interface CampanhaItem {
  id: number;
  nome: string;
  pitchBase: string | null;
  periodo: string | null;
}

export default function GeradorMensagem({
  marcas,
  templates,
  campanhas,
  config,
  marcaInicial,
  templateInicial,
  gmail,
}: {
  marcas: MarcaItem[];
  templates: TemplateItem[];
  campanhas: CampanhaItem[];
  config: Record<string, string>;
  marcaInicial?: number;
  templateInicial?: number;
  gmail: { conectado: boolean; enviosHoje: number; limite: number };
}) {
  const [marcaId, setMarcaId] = useState<number>(
    marcaInicial && marcas.some((m) => m.id === marcaInicial) ? marcaInicial : (marcas[0]?.id ?? 0)
  );
  const [contatoEscolhido, setContatoEscolhido] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState<number>(
    templateInicial && templates.some((t) => t.id === templateInicial)
      ? templateInicial
      : (templates[0]?.id ?? 0)
  );
  const [campanhaId, setCampanhaId] = useState<number>(campanhas[0]?.id ?? 0);
  const [avisoCopiado, setAvisoCopiado] = useState<string | null>(null);
  const [registrado, setRegistrado] = useState(false);
  const [envio, setEnvio] = useState<{ estado: "idle" | "ok" | "erro"; mensagem?: string }>({
    estado: "idle",
  });
  const [enviosFeitos, setEnviosFeitos] = useState(0);
  const [pendente, startTransition] = useTransition();

  const marca = marcas.find((m) => m.id === marcaId);
  const contato =
    marca?.contatos.find((c) => c.id === contatoEscolhido) ?? marca?.contatos[0] ?? null;
  const template = templates.find((t) => t.id === templateId);
  const campanha = campanhas.find((c) => c.id === campanhaId);

  const vars = useMemo(
    () => ({
      contato: contato?.nome?.split(" ")[0] ?? "",
      marca: marca?.nome ?? "",
      gancho: marca?.notas ?? "",
      campanha: campanha?.nome ?? "",
      pitch: campanha?.pitchBase ?? "",
      periodo: campanha?.periodo ?? "",
      meu_nome: config["meu_nome"] ?? "",
      meu_perfil: config["meu_perfil"] ?? "",
      seguidores: config["seguidores"] ?? "",
      nicho: config["nicho"] ?? "",
      metricas: config["metricas"] ?? "",
      audiencia: config["audiencia"] ?? "",
      midia_kit: config["midia_kit"] ?? "",
      assinatura: config["assinatura"] ?? "",
    }),
    [contato, marca, campanha, config]
  );

  const assuntoGerado = template ? renderTemplate(template.assunto, vars) : "";
  const corpoGerado = template ? renderTemplate(template.corpo, vars) : "";

  // Regenera a mensagem quando a seleção muda, preservando edições manuais
  // enquanto a mesma combinação marca/contato/template/campanha estiver ativa.
  const assinaturaSelecao = `${marcaId}|${contato?.id ?? 0}|${templateId}|${campanhaId}`;
  const [selecaoAnterior, setSelecaoAnterior] = useState(assinaturaSelecao);
  const [assunto, setAssunto] = useState(assuntoGerado);
  const [corpo, setCorpo] = useState(corpoGerado);
  if (assinaturaSelecao !== selecaoAnterior) {
    setSelecaoAnterior(assinaturaSelecao);
    setAssunto(assuntoGerado);
    setCorpo(corpoGerado);
    setRegistrado(false);
    setEnvio({ estado: "idle" });
  }

  const pendencias = useMemo(() => {
    const encontradas = new Set<string>();
    for (const texto of [assunto, corpo]) {
      for (const m of texto.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)) {
        encontradas.add(m[1]);
      }
    }
    return Array.from(encontradas);
  }, [assunto, corpo]);

  async function copiar(texto: string, rotulo: string) {
    await navigator.clipboard.writeText(texto);
    setAvisoCopiado(rotulo);
    setTimeout(() => setAvisoCopiado(null), 2000);
  }

  function registrar() {
    if (!marca) return;
    const tipo = template?.etapa === "INICIAL" ? "EMAIL_ENVIADO" : "FOLLOWUP_ENVIADO";
    startTransition(async () => {
      await registrarInteracao({
        marcaId: marca.id,
        contatoId: contato?.id ?? null,
        tipo,
        assunto,
        corpo,
      });
      setRegistrado(true);
    });
  }

  function enviarPeloApp() {
    if (!marca || !contato?.email) return;
    startTransition(async () => {
      const resultado = await enviarEmailGmail({
        marcaId: marca.id,
        contatoId: contato.id,
        para: contato.email!,
        assunto,
        corpo,
        etapa: template?.etapa ?? "INICIAL",
      });
      if (resultado.ok) {
        setEnvio({ estado: "ok" });
        setEnviosFeitos((n) => n + 1);
      } else {
        setEnvio({ estado: "erro", mensagem: resultado.erro });
      }
    });
  }

  const limiteAtingido = gmail.enviosHoje + enviosFeitos >= gmail.limite;

  const linkGmail = contato?.email
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        contato.email
      )}&su=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`
    : null;

  if (marcas.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-slate-500">
          Nenhuma marca disponível para contato.{" "}
          <Link href="/marcas/nova" className="underline">
            Cadastre uma marca
          </Link>{" "}
          primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_1fr]">
      <div className="card flex h-fit flex-col gap-4">
        <div>
          <label htmlFor="g-marca">Marca</label>
          <select id="g-marca" value={marcaId} onChange={(e) => setMarcaId(Number(e.target.value))}>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="g-contato">Contato</label>
          {marca && marca.contatos.length > 0 ? (
            <select
              id="g-contato"
              value={contato?.id ?? 0}
              onChange={(e) => setContatoEscolhido(Number(e.target.value))}
            >
              {marca.contatos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                  {c.cargo ? ` — ${c.cargo}` : ""}
                  {c.email ? ` (${c.email})` : " (sem e-mail)"}
                </option>
              ))}
            </select>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Esta marca não tem contato cadastrado.{" "}
              {marca && (
                <Link href={`/marcas/${marca.id}`} className="underline">
                  Adicionar contato
                </Link>
              )}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="g-template">Template</label>
          <select
            id="g-template"
            value={templateId}
            onChange={(e) => setTemplateId(Number(e.target.value))}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} — {ETAPAS_TEMPLATE.find((e) => e.id === t.etapa)?.label ?? t.etapa}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="g-campanha">Campanha</label>
          {campanhas.length > 0 ? (
            <select
              id="g-campanha"
              value={campanhaId}
              onChange={(e) => setCampanhaId(Number(e.target.value))}
            >
              {campanhas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-slate-400">
              Sem campanhas ativas —{" "}
              <Link href="/campanhas" className="underline">
                criar campanha
              </Link>
            </p>
          )}
        </div>
        {marca && (
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <p className="mb-1 font-semibold text-slate-600">Gancho salvo da marca</p>
            <p>{marca.notas || "— sem notas de pesquisa; edite a marca e adicione um gancho."}</p>
          </div>
        )}
      </div>

      <div className="card flex flex-col gap-4">
        <div>
          <label htmlFor="g-assunto">Assunto</label>
          <input
            type="text"
            id="g-assunto"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="g-corpo">Mensagem</label>
          <textarea
            id="g-corpo"
            rows={16}
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            className="font-mono !text-[13px]"
          />
        </div>

        {pendencias.length > 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Variáveis sem valor: {pendencias.map((p) => `{{${p}}}`).join(", ")} — preencha nas
            Configurações, na campanha ou edite o texto acima.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {gmail.conectado && contato?.email && (
            <button
              type="button"
              onClick={enviarPeloApp}
              disabled={pendente || envio.estado === "ok" || limiteAtingido}
              className="btn-primary"
            >
              {envio.estado === "ok"
                ? "Enviado pelo Gmail ✓"
                : pendente
                  ? "Enviando..."
                  : limiteAtingido
                    ? `Limite diário atingido (${gmail.limite})`
                    : "🚀 Enviar pelo Gmail"}
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={() => copiar(assunto, "assunto")}>
            {avisoCopiado === "assunto" ? "Copiado ✓" : "Copiar assunto"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => copiar(corpo, "corpo")}>
            {avisoCopiado === "corpo" ? "Copiado ✓" : "Copiar mensagem"}
          </button>
          {linkGmail && (
            <a href={linkGmail} target="_blank" rel="noreferrer" className="btn-secondary">
              Abrir no Gmail
            </a>
          )}
          <button
            type="button"
            onClick={registrar}
            disabled={pendente || registrado || envio.estado === "ok" || !marca}
            className="btn-secondary"
          >
            {registrado ? "Envio registrado ✓" : pendente ? "Registrando..." : "Registrar envio manual"}
          </button>
        </div>
        {envio.estado === "erro" && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Envio falhou: {envio.mensagem}
          </p>
        )}
        <p className="text-[11px] text-slate-400">
          {gmail.conectado
            ? `Envios hoje: ${gmail.enviosHoje + enviosFeitos}/${gmail.limite}. O envio pelo app salva no histórico, move o card e mantém follow-ups na mesma thread.`
            : "Conecte o Gmail nas Configurações para enviar direto daqui. “Registrar envio manual” salva no histórico quando você envia pelo navegador."}
        </p>
      </div>
    </div>
  );
}
