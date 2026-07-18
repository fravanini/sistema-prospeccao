export const STATUS_PIPELINE = [
  { id: "PESQUISADA", label: "Pesquisada", cor: "bg-slate-400" },
  { id: "CONTATO_ENCONTRADO", label: "Contato encontrado", cor: "bg-sky-500" },
  { id: "EMAIL_ENVIADO", label: "E-mail enviado", cor: "bg-blue-600" },
  { id: "FOLLOW_UP", label: "Follow-up", cor: "bg-amber-500" },
  { id: "RESPONDEU", label: "Respondeu", cor: "bg-violet-500" },
  { id: "NEGOCIANDO", label: "Negociando", cor: "bg-fuchsia-600" },
  { id: "FECHADA", label: "Fechada", cor: "bg-emerald-600" },
  { id: "PERDIDA", label: "Perdida", cor: "bg-rose-500" },
] as const;

export type StatusId = (typeof STATUS_PIPELINE)[number]["id"];

export function statusLabel(id: string): string {
  return STATUS_PIPELINE.find((s) => s.id === id)?.label ?? id;
}

export const PORTES = ["Pequena", "Média", "Grande"] as const;

export const ETAPAS_TEMPLATE = [
  { id: "INICIAL", label: "E-mail inicial (D0)" },
  { id: "FOLLOWUP_1", label: "Follow-up 1 (D+4)" },
  { id: "FOLLOWUP_2", label: "Follow-up 2 (D+10)" },
  { id: "ULTIMO_TOQUE", label: "Último toque (D+20)" },
] as const;

export const TIPOS_INTERACAO = [
  { id: "EMAIL_ENVIADO", label: "E-mail inicial enviado" },
  { id: "FOLLOWUP_ENVIADO", label: "Follow-up enviado" },
  { id: "RESPOSTA_RECEBIDA", label: "Resposta recebida" },
  { id: "DM_MANUAL", label: "DM manual no Instagram" },
  { id: "NOTA", label: "Nota" },
] as const;

export interface SinaisMarca {
  fazPubli: boolean;
  rodaAnuncios: boolean;
  temEcommerce: boolean;
  jaInteragiu: boolean;
}

/**
 * Score de prioridade (0–8): quanto maior, mais sinais de que a marca
 * já compra publicidade com criadores e vale prospectar primeiro.
 */
export function scoreMarca(m: SinaisMarca): number {
  return (
    (m.fazPubli ? 3 : 0) +
    (m.rodaAnuncios ? 2 : 0) +
    (m.jaInteragiu ? 2 : 0) +
    (m.temEcommerce ? 1 : 0)
  );
}

export const CONFIG_PADRAO: Record<string, { label: string; valor: string; ajuda?: string }> = {
  meu_nome: { label: "Seu nome", valor: "" },
  meu_perfil: { label: "@ do seu perfil", valor: "" },
  seguidores: { label: "Seguidores", valor: "50 mil" },
  nicho: {
    label: "Seu nicho (texto para os e-mails)",
    valor: "",
    ajuda: "Como {{nicho}} aparece nas mensagens; vazio = usa o nicho selecionado no Guia",
  },
  metricas: {
    label: "Métricas resumidas",
    valor: "",
    ajuda: "Ex.: alcance médio de 120 mil/mês e 6% de engajamento",
  },
  audiencia: {
    label: "Perfil da audiência",
    valor: "",
    ajuda: "Ex.: 60% mulheres, 25-40 anos, capitais do Sudeste",
  },
  midia_kit: { label: "Link do mídia kit", valor: "", ajuda: "URL pública do PDF" },
  assinatura: {
    label: "Assinatura do e-mail",
    valor: "",
    ajuda: "Nome, @perfil, link do mídia kit",
  },
  hunter_api_key: {
    label: "Chave da API do Hunter.io (opcional)",
    valor: "",
    ajuda: "Plano gratuito: 25 buscas/mês — usada na Descoberta para achar e-mails nominais",
  },
  apify_api_token: {
    label: "Token da API do Apify (opcional)",
    valor: "",
    ajuda: "Plano gratuito: US$ 5/mês em créditos — usado no garimpo de publis e importação de perfis do Instagram",
  },
  limite_diario: {
    label: "Limite de envios por dia",
    valor: "15",
    ajuda: "Proteja a entregabilidade: comece com 15/dia e suba aos poucos até ~30",
  },
  gmail_client_id: {
    label: "Google OAuth Client ID",
    valor: "",
    ajuda: "Crie em console.cloud.google.com → APIs → Credenciais (tipo Web, redirect http://localhost:3000/api/gmail/callback)",
  },
  gmail_client_secret: {
    label: "Google OAuth Client Secret",
    valor: "",
    ajuda: "Do mesmo credencial OAuth do Google Cloud",
  },
};

export const VARIAVEIS_TEMPLATE: { chave: string; descricao: string }[] = [
  { chave: "{{contato}}", descricao: "Nome do contato na marca" },
  { chave: "{{marca}}", descricao: "Nome da marca" },
  { chave: "{{gancho}}", descricao: "Gancho personalizado (notas de pesquisa da marca)" },
  { chave: "{{campanha}}", descricao: "Nome da campanha" },
  { chave: "{{pitch}}", descricao: "Pitch base da campanha" },
  { chave: "{{periodo}}", descricao: "Período da campanha" },
  { chave: "{{meu_nome}}", descricao: "Seu nome (Configurações)" },
  { chave: "{{meu_perfil}}", descricao: "@ do seu perfil (Configurações)" },
  { chave: "{{seguidores}}", descricao: "Seguidores (Configurações)" },
  { chave: "{{nicho}}", descricao: "Seu nicho (Configurações)" },
  { chave: "{{metricas}}", descricao: "Métricas resumidas (Configurações)" },
  { chave: "{{audiencia}}", descricao: "Perfil da audiência (Configurações)" },
  { chave: "{{midia_kit}}", descricao: "Link do mídia kit (Configurações)" },
  { chave: "{{assinatura}}", descricao: "Assinatura do e-mail (Configurações)" },
];
