// Conteúdo inicial de toda conta nova: os 4 templates da cadência
// D0 / D+4 / D+10 / D+20 e uma campanha de exemplo.

import { prisma } from "./db";

export const TEMPLATES_PADRAO = [
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

export async function aplicarSeedUsuario(usuarioId: number): Promise<void> {
  for (const t of TEMPLATES_PADRAO) {
    await prisma.template.create({ data: { ...t, usuarioId } });
  }
  await prisma.campanha.create({
    data: {
      usuarioId,
      nome: "Parcerias contínuas",
      periodo: "próximo trimestre",
      pitchBase:
        "tenho conteúdos programados para os próximos meses e vejo encaixe perfeito para mostrar os produtos da marca em uso real, em reels + stories",
    },
  });
}
