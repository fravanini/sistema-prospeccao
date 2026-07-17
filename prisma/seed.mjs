import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEMPLATES = [
  {
    nome: "Apresentação + proposta",
    etapa: "INICIAL",
    assunto: "{{marca}} + {{meu_perfil}} — conteúdo de {{nicho}}",
    corpo: `Olá, {{contato}},

{{gancho}}

Sou criador de conteúdo de {{nicho}} — {{seguidores}} seguidores no {{meu_perfil}}, com {{metricas}} e audiência de {{audiencia}}.

{{pitch}}

Posso te mandar meu mídia kit com números e formatos?

{{assinatura}}`,
  },
  {
    nome: "Follow-up curto",
    etapa: "FOLLOWUP_1",
    assunto: "Re: {{marca}} + {{meu_perfil}}",
    corpo: `Olá, {{contato}}, tudo bem?

Subindo este e-mail na sua caixa — faz sentido para o planejamento de {{periodo}}?

Se outra pessoa cuidar de parcerias com criadores na {{marca}}, agradeço se puder me direcionar.

{{assinatura}}`,
  },
  {
    nome: "Follow-up com ideia concreta",
    etapa: "FOLLOWUP_2",
    assunto: "Uma ideia de conteúdo para a {{marca}}",
    corpo: `Olá, {{contato}},

Pensando na {{marca}}, uma ideia concreta: {{pitch}}

Consigo mostrar o produto em uso real, com entrega de reels + stories e os números de alcance no fechamento.

Vale uma conversa de 15 minutos?

{{assinatura}}`,
  },
  {
    nome: "Último toque",
    etapa: "ULTIMO_TOQUE",
    assunto: "Fecho por aqui — {{marca}} + {{meu_perfil}}",
    corpo: `Olá, {{contato}},

Para não insistir, fecho o assunto por aqui. Se em algum momento a {{marca}} quiser testar conteúdo com criadores de {{nicho}}, meu mídia kit fica à disposição: {{midia_kit}}

Sucesso com as campanhas!

{{assinatura}}`,
  },
];

async function main() {
  const totalTemplates = await prisma.template.count();
  if (totalTemplates === 0) {
    for (const t of TEMPLATES) {
      await prisma.template.create({ data: t });
    }
    console.log(`✔ ${TEMPLATES.length} templates da cadência criados`);
  } else {
    console.log("• Templates já existem, pulando");
  }

  const totalCampanhas = await prisma.campanha.count();
  if (totalCampanhas === 0) {
    await prisma.campanha.create({
      data: {
        nome: "Parcerias contínuas 2026",
        periodo: "próximo trimestre",
        pitchBase:
          "tenho viagens de aventura programadas para os próximos meses e vejo encaixe perfeito para mostrar os produtos da marca em uso real, em reels + stories",
      },
    });
    console.log("✔ Campanha de exemplo criada");
  } else {
    console.log("• Campanhas já existem, pulando");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
