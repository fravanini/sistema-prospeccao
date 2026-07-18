import { prisma } from "./db";

export const TIPOS_ENVIO = ["EMAIL_ENVIADO", "FOLLOWUP_ENVIADO"];

// Cadência do playbook, em dias corridos a partir do primeiro envio (D0).
export const CADENCIA = [
  { aposDias: 0, etapa: "INICIAL", rotulo: "Primeiro contato" },
  { aposDias: 4, etapa: "FOLLOWUP_1", rotulo: "Follow-up 1 (D+4)" },
  { aposDias: 10, etapa: "FOLLOWUP_2", rotulo: "Follow-up 2 (D+10)" },
  { aposDias: 20, etapa: "ULTIMO_TOQUE", rotulo: "Último toque (D+20)" },
] as const;

export interface ItemFila {
  marcaId: number;
  marcaNome: string;
  etapa: string;
  rotulo: string;
  diasAtraso: number;
  contatoEmail: string | null;
  encerrar?: boolean;
}

const DIA_MS = 24 * 60 * 60 * 1000;

export async function montarFila(): Promise<{
  hoje: ItemFila[];
  aguardando: { marcaNome: string; rotulo: string; emDias: number }[];
}> {
  const marcas = await prisma.marca.findMany({
    where: {
      naoContatar: false,
      status: { in: ["CONTATO_ENCONTRADO", "EMAIL_ENVIADO", "FOLLOW_UP"] },
    },
    include: {
      contatos: { orderBy: { createdAt: "asc" } },
      interacoes: {
        where: { tipo: { in: TIPOS_ENVIO } },
        orderBy: { data: "asc" },
      },
    },
  });

  const agora = Date.now();
  const hoje: ItemFila[] = [];
  const aguardando: { marcaNome: string; rotulo: string; emDias: number }[] = [];

  for (const marca of marcas) {
    const contatoComEmail = marca.contatos.find((c) => c.email);
    const envios = marca.interacoes;

    if (envios.length === 0) {
      if (contatoComEmail) {
        hoje.push({
          marcaId: marca.id,
          marcaNome: marca.nome,
          etapa: "INICIAL",
          rotulo: "Primeiro contato",
          diasAtraso: 0,
          contatoEmail: contatoComEmail.email,
        });
      }
      continue;
    }

    if (envios.length >= CADENCIA.length) {
      const diasDesdeUltimo = Math.floor((agora - envios[envios.length - 1].data.getTime()) / DIA_MS);
      if (diasDesdeUltimo >= 7) {
        hoje.push({
          marcaId: marca.id,
          marcaNome: marca.nome,
          etapa: "ENCERRAR",
          rotulo: "Cadência completa sem resposta — marcar como Perdida",
          diasAtraso: diasDesdeUltimo - 7,
          contatoEmail: contatoComEmail?.email ?? null,
          encerrar: true,
        });
      }
      continue;
    }

    const proxima = CADENCIA[envios.length];
    const d0 = envios[0].data.getTime();
    const vencimento = d0 + proxima.aposDias * DIA_MS;
    if (agora >= vencimento) {
      hoje.push({
        marcaId: marca.id,
        marcaNome: marca.nome,
        etapa: proxima.etapa,
        rotulo: proxima.rotulo,
        diasAtraso: Math.floor((agora - vencimento) / DIA_MS),
        contatoEmail: contatoComEmail?.email ?? null,
      });
    } else {
      aguardando.push({
        marcaNome: marca.nome,
        rotulo: proxima.rotulo,
        emDias: Math.ceil((vencimento - agora) / DIA_MS),
      });
    }
  }

  hoje.sort((a, b) => b.diasAtraso - a.diasAtraso);
  aguardando.sort((a, b) => a.emDias - b.emDias);
  return { hoje, aguardando };
}

export async function enviosDeHoje(): Promise<number> {
  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);
  return prisma.interacao.count({
    where: { tipo: { in: TIPOS_ENVIO }, data: { gte: inicioDoDia } },
  });
}
