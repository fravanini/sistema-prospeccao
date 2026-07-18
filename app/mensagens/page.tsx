import Link from "next/link";
import { prisma } from "@/lib/db";
import { lerConfig } from "@/lib/actions";
import { gmailConectado } from "@/lib/gmail";
import { enviosDeHoje } from "@/lib/fila";
import GeradorMensagem from "../components/GeradorMensagem";

export const dynamic = "force-dynamic";

export default async function MensagensPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string; etapa?: string }>;
}) {
  const { marca, etapa } = await searchParams;

  const [marcas, templates, campanhas, config, gmail, enviados] = await Promise.all([
    prisma.marca.findMany({
      where: { naoContatar: false },
      orderBy: { nome: "asc" },
      include: { contatos: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.template.findMany({ orderBy: { id: "asc" } }),
    prisma.campanha.findMany({ where: { ativa: true }, orderBy: { id: "desc" } }),
    lerConfig(),
    gmailConectado(),
    enviosDeHoje(),
  ]);

  if (templates.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card flex flex-col items-start gap-3">
          <p className="font-medium">Nenhum template cadastrado.</p>
          <p className="text-sm text-slate-500">
            Crie ao menos um template de e-mail (ou rode <code>npm run seed</code> para carregar os
            templates padrão da cadência D0 / D+4 / D+10 / D+20).
          </p>
          <Link href="/templates" className="btn-primary">
            Ir para Templates
          </Link>
        </div>
      </div>
    );
  }

  const templateInicial = etapa ? templates.find((t) => t.etapa === etapa)?.id : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Gerar mensagem</h1>
        <p className="text-sm text-slate-500">
          Escolha marca, contato e template — revise o gancho antes de enviar. Mensagem genérica
          não recebe resposta.
        </p>
      </div>
      <GeradorMensagem
        marcas={marcas.map((m) => ({
          id: m.id,
          nome: m.nome,
          notas: m.notas,
          contatos: m.contatos.map((c) => ({
            id: c.id,
            nome: c.nome,
            cargo: c.cargo,
            email: c.email,
          })),
        }))}
        templates={templates}
        campanhas={campanhas}
        config={config}
        marcaInicial={marca ? Number(marca) : undefined}
        templateInicial={templateInicial}
        gmail={{
          conectado: gmail.conectado,
          enviosHoje: enviados,
          limite: Math.max(1, Number(config["limite_diario"]) || 15),
        }}
      />
    </div>
  );
}
