"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { nomeParaEmail, normalizarSite, rasparSite, ResultadoScrape } from "./scraper";

function texto(fd: FormData, campo: string): string {
  return String(fd.get(campo) ?? "").trim();
}

function opcional(fd: FormData, campo: string): string | null {
  const v = texto(fd, campo);
  return v === "" ? null : v;
}

function marcado(fd: FormData, campo: string): boolean {
  return fd.get(campo) === "on" || fd.get(campo) === "true";
}

function dadosMarca(fd: FormData) {
  return {
    nome: texto(fd, "nome"),
    site: opcional(fd, "site"),
    instagram: opcional(fd, "instagram"),
    categoria: texto(fd, "categoria") || "Outra",
    porte: opcional(fd, "porte"),
    origem: opcional(fd, "origem"),
    notas: opcional(fd, "notas"),
    fazPubli: marcado(fd, "fazPubli"),
    rodaAnuncios: marcado(fd, "rodaAnuncios"),
    temEcommerce: marcado(fd, "temEcommerce"),
    jaInteragiu: marcado(fd, "jaInteragiu"),
  };
}

function revalidarTudo() {
  revalidatePath("/");
  revalidatePath("/marcas");
  revalidatePath("/mensagens");
}

// ---------- Marcas ----------

export async function criarMarca(fd: FormData) {
  const dados = dadosMarca(fd);
  if (!dados.nome) return;
  const marca = await prisma.marca.create({ data: dados });
  revalidarTudo();
  redirect(`/marcas/${marca.id}`);
}

export async function atualizarMarca(id: number, fd: FormData) {
  const dados = dadosMarca(fd);
  if (!dados.nome) return;
  await prisma.marca.update({ where: { id }, data: dados });
  revalidarTudo();
  revalidatePath(`/marcas/${id}`);
}

export async function excluirMarca(id: number) {
  await prisma.marca.delete({ where: { id } });
  revalidarTudo();
  redirect("/marcas");
}

export async function moverMarca(id: number, status: string) {
  await prisma.marca.update({ where: { id }, data: { status } });
  revalidarTudo();
  revalidatePath(`/marcas/${id}`);
}

export async function alternarNaoContatar(id: number, valor: boolean) {
  await prisma.marca.update({ where: { id }, data: { naoContatar: valor } });
  revalidarTudo();
  revalidatePath(`/marcas/${id}`);
}

// ---------- Importação CSV ----------

function parseCSV(textoCSV: string): string[][] {
  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = "";
  let entreAspas = false;
  const src = textoCSV.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (entreAspas) {
      if (c === '"' && src[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') {
        entreAspas = false;
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreAspas = true;
    } else if (c === "," || c === ";") {
      linha.push(campo);
      campo = "";
    } else if (c === "\n") {
      linha.push(campo);
      campo = "";
      linhas.push(linha);
      linha = [];
    } else {
      campo += c;
    }
  }
  if (campo !== "" || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas.filter((l) => l.some((c) => c.trim() !== ""));
}

const SIM = new Set(["sim", "s", "true", "1", "x", "yes"]);

export async function importarMarcasCSV(
  _estadoAnterior: { ok: number; erros: string[] } | null,
  fd: FormData
): Promise<{ ok: number; erros: string[] }> {
  let conteudo = texto(fd, "conteudo");
  const arquivo = fd.get("arquivo");
  if (arquivo instanceof File && arquivo.size > 0) {
    conteudo = await arquivo.text();
  }
  if (!conteudo.trim()) return { ok: 0, erros: ["Nenhum conteúdo enviado."] };

  const linhas = parseCSV(conteudo);
  if (linhas.length === 0) return { ok: 0, erros: ["CSV vazio."] };

  const cabecalho = linhas[0].map((c) => c.trim().toLowerCase());
  const temCabecalho = cabecalho.includes("nome");
  const colunas = temCabecalho
    ? cabecalho
    : ["nome", "site", "instagram", "categoria", "origem", "notas"];
  const dadosLinhas = temCabecalho ? linhas.slice(1) : linhas;

  const erros: string[] = [];
  let ok = 0;
  for (let i = 0; i < dadosLinhas.length; i++) {
    const valores = dadosLinhas[i];
    const registro: Record<string, string> = {};
    colunas.forEach((col, j) => (registro[col] = (valores[j] ?? "").trim()));
    if (!registro["nome"]) {
      erros.push(`Linha ${i + (temCabecalho ? 2 : 1)}: sem nome, ignorada.`);
      continue;
    }
    await prisma.marca.create({
      data: {
        nome: registro["nome"],
        site: registro["site"] || null,
        instagram: registro["instagram"] || null,
        categoria: registro["categoria"] || "Outra",
        porte: registro["porte"] || null,
        origem: registro["origem"] || "Importação CSV",
        notas: registro["notas"] || null,
        fazPubli: SIM.has((registro["fazpubli"] ?? "").toLowerCase()),
        rodaAnuncios: SIM.has((registro["rodaanuncios"] ?? "").toLowerCase()),
        temEcommerce: SIM.has((registro["temecommerce"] ?? "").toLowerCase()),
        jaInteragiu: SIM.has((registro["jainteragiu"] ?? "").toLowerCase()),
      },
    });
    ok++;
  }
  revalidarTudo();
  return { ok, erros };
}

// ---------- Contatos ----------

export async function criarContato(fd: FormData) {
  const marcaId = Number(fd.get("marcaId"));
  const nome = texto(fd, "nome");
  if (!marcaId || !nome) return;
  await prisma.contato.create({
    data: {
      marcaId,
      nome,
      cargo: opcional(fd, "cargo"),
      email: opcional(fd, "email"),
      fonteEmail: opcional(fd, "fonteEmail"),
      linkedin: opcional(fd, "linkedin"),
      verificado: marcado(fd, "verificado"),
    },
  });
  const marca = await prisma.marca.findUnique({ where: { id: marcaId } });
  if (marca?.status === "PESQUISADA") {
    await prisma.marca.update({ where: { id: marcaId }, data: { status: "CONTATO_ENCONTRADO" } });
  }
  revalidarTudo();
  revalidatePath(`/marcas/${marcaId}`);
}

export async function atualizarContato(id: number, fd: FormData) {
  const nome = texto(fd, "nome");
  if (!nome) return;
  const contato = await prisma.contato.update({
    where: { id },
    data: {
      nome,
      cargo: opcional(fd, "cargo"),
      email: opcional(fd, "email"),
      fonteEmail: opcional(fd, "fonteEmail"),
      linkedin: opcional(fd, "linkedin"),
      verificado: marcado(fd, "verificado"),
    },
  });
  revalidarTudo();
  revalidatePath(`/marcas/${contato.marcaId}`);
}

export async function excluirContato(id: number) {
  const contato = await prisma.contato.delete({ where: { id } });
  revalidarTudo();
  revalidatePath(`/marcas/${contato.marcaId}`);
}

// ---------- Campanhas ----------

export async function criarCampanha(fd: FormData) {
  const nome = texto(fd, "nome");
  if (!nome) return;
  await prisma.campanha.create({
    data: { nome, pitchBase: opcional(fd, "pitchBase"), periodo: opcional(fd, "periodo") },
  });
  revalidatePath("/campanhas");
  revalidatePath("/mensagens");
}

export async function alternarCampanha(id: number, ativa: boolean) {
  await prisma.campanha.update({ where: { id }, data: { ativa } });
  revalidatePath("/campanhas");
  revalidatePath("/mensagens");
}

export async function excluirCampanha(id: number) {
  await prisma.campanha.delete({ where: { id } });
  revalidatePath("/campanhas");
  revalidatePath("/mensagens");
}

// ---------- Templates ----------

export async function criarTemplate(fd: FormData) {
  const nome = texto(fd, "nome");
  const assunto = texto(fd, "assunto");
  const corpo = texto(fd, "corpo");
  if (!nome || !assunto || !corpo) return;
  await prisma.template.create({
    data: { nome, etapa: texto(fd, "etapa") || "INICIAL", assunto, corpo },
  });
  revalidatePath("/templates");
  revalidatePath("/mensagens");
}

export async function atualizarTemplate(id: number, fd: FormData) {
  const nome = texto(fd, "nome");
  const assunto = texto(fd, "assunto");
  const corpo = texto(fd, "corpo");
  if (!nome || !assunto || !corpo) return;
  await prisma.template.update({
    where: { id },
    data: { nome, etapa: texto(fd, "etapa") || "INICIAL", assunto, corpo },
  });
  revalidatePath("/templates");
  revalidatePath("/mensagens");
}

export async function excluirTemplate(id: number) {
  await prisma.template.delete({ where: { id } });
  revalidatePath("/templates");
  revalidatePath("/mensagens");
}

// ---------- Interações ----------

const STATUS_POR_TIPO: Record<string, string> = {
  EMAIL_ENVIADO: "EMAIL_ENVIADO",
  FOLLOWUP_ENVIADO: "FOLLOW_UP",
  RESPOSTA_RECEBIDA: "RESPONDEU",
};

export async function registrarInteracao(dados: {
  marcaId: number;
  contatoId?: number | null;
  tipo: string;
  assunto?: string | null;
  corpo?: string | null;
  resultado?: string | null;
}) {
  await prisma.interacao.create({
    data: {
      marcaId: dados.marcaId,
      contatoId: dados.contatoId ?? null,
      tipo: dados.tipo,
      assunto: dados.assunto ?? null,
      corpo: dados.corpo ?? null,
      resultado: dados.resultado ?? null,
    },
  });
  const novoStatus = STATUS_POR_TIPO[dados.tipo];
  if (novoStatus) {
    await prisma.marca.update({ where: { id: dados.marcaId }, data: { status: novoStatus } });
  }
  revalidarTudo();
  revalidatePath(`/marcas/${dados.marcaId}`);
}

export async function registrarInteracaoForm(fd: FormData) {
  const marcaId = Number(fd.get("marcaId"));
  if (!marcaId) return;
  await registrarInteracao({
    marcaId,
    contatoId: fd.get("contatoId") ? Number(fd.get("contatoId")) : null,
    tipo: texto(fd, "tipo") || "NOTA",
    resultado: opcional(fd, "resultado"),
  });
}

// ---------- Descoberta automática (scraping de fontes públicas) ----------

export interface ResumoDescoberta {
  site: string;
  ok: boolean;
  erro?: string;
  marcaId?: number;
  nome?: string;
  novosContatos: number;
  instagram?: string;
  cnpj?: string;
  razaoSocial?: string;
  avisos: string[];
}

const MAX_SITES_POR_RODADA = 10;

async function salvarDescoberta(res: ResultadoScrape, marcaIdExistente?: number): Promise<ResumoDescoberta> {
  const hostname = new URL(res.site).hostname.replace(/^www\./, "");

  let marca =
    marcaIdExistente !== undefined
      ? await prisma.marca.findUnique({ where: { id: marcaIdExistente }, include: { contatos: true } })
      : await prisma.marca.findFirst({
          where: { site: { contains: hostname } },
          include: { contatos: true },
        });

  const nome = res.titulo ?? res.nomeFantasia ?? res.razaoSocial ?? hostname;

  if (!marca) {
    marca = await prisma.marca.create({
      data: {
        nome,
        site: res.site,
        instagram: res.instagram ?? null,
        origem: "Descoberta automática (site)",
      },
      include: { contatos: true },
    });
  } else {
    await prisma.marca.update({
      where: { id: marca.id },
      data: {
        site: marca.site ?? res.site,
        instagram: marca.instagram ?? res.instagram ?? null,
      },
    });
  }

  let novosContatos = 0;
  for (const e of res.emails) {
    if (marca.contatos.some((c) => c.email === e.email)) continue;
    const { nome: nomeContato, cargo } = nomeParaEmail(e);
    await prisma.contato.create({
      data: { marcaId: marca.id, nome: nomeContato, cargo, email: e.email, fonteEmail: e.fonte },
    });
    novosContatos++;
  }
  for (const socio of res.socios.slice(0, 3)) {
    if (marca.contatos.some((c) => c.nome.toLowerCase() === socio.nome.toLowerCase())) continue;
    await prisma.contato.create({
      data: {
        marcaId: marca.id,
        nome: socio.nome,
        cargo: `${socio.qualificacao} (Receita Federal)`,
        fonteEmail: "Quadro societário (BrasilAPI)",
      },
    });
    novosContatos++;
  }

  const partes = [
    `Descoberta automática em ${res.site}: ${res.emails.length} e-mail(s), ${res.socios.length} sócio(s).`,
  ];
  if (res.razaoSocial) partes.push(`Razão social: ${res.razaoSocial}.`);
  if (res.cnpj) partes.push(`CNPJ: ${res.cnpj}.`);
  if (res.whatsapp) partes.push(`WhatsApp: ${res.whatsapp}.`);
  if (res.telefoneRFB) partes.push(`Telefone (RFB): ${res.telefoneRFB}.`);
  partes.push(`Páginas: ${res.paginasVisitadas.join(", ")}`);
  await prisma.interacao.create({
    data: { marcaId: marca.id, tipo: "NOTA", resultado: partes.join(" ") },
  });

  if (novosContatos > 0 && marca.status === "PESQUISADA") {
    await prisma.marca.update({ where: { id: marca.id }, data: { status: "CONTATO_ENCONTRADO" } });
  }

  return {
    site: res.site,
    ok: true,
    marcaId: marca.id,
    nome: marca.nome,
    novosContatos,
    instagram: res.instagram,
    cnpj: res.cnpj,
    razaoSocial: res.razaoSocial,
    avisos: res.avisos,
  };
}

export async function descobrirMarcas(
  _estadoAnterior: ResumoDescoberta[] | null,
  fd: FormData
): Promise<ResumoDescoberta[]> {
  const linhas = texto(fd, "sites")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (linhas.length === 0) return [];

  const config = await lerConfig();
  const hunterApiKey = config["hunter_api_key"]?.trim() || undefined;

  const resumos: ResumoDescoberta[] = [];
  for (const linha of linhas.slice(0, MAX_SITES_POR_RODADA)) {
    if (!normalizarSite(linha)) {
      resumos.push({ site: linha, ok: false, erro: "URL inválida", novosContatos: 0, avisos: [] });
      continue;
    }
    const res = await rasparSite(linha, { hunterApiKey });
    if ("erro" in res) {
      resumos.push({ site: res.site, ok: false, erro: res.erro, novosContatos: 0, avisos: [] });
    } else {
      resumos.push(await salvarDescoberta(res));
    }
  }
  for (const linha of linhas.slice(MAX_SITES_POR_RODADA)) {
    resumos.push({
      site: linha,
      ok: false,
      erro: `limite de ${MAX_SITES_POR_RODADA} sites por rodada — rode de novo com o restante`,
      novosContatos: 0,
      avisos: [],
    });
  }

  revalidarTudo();
  return resumos;
}

export async function enriquecerMarca(id: number) {
  const marca = await prisma.marca.findUnique({ where: { id } });
  if (!marca?.site) return;
  const config = await lerConfig();
  const res = await rasparSite(marca.site, {
    hunterApiKey: config["hunter_api_key"]?.trim() || undefined,
  });
  if ("erro" in res) {
    await prisma.interacao.create({
      data: { marcaId: id, tipo: "NOTA", resultado: `Descoberta automática falhou: ${res.erro}.` },
    });
  } else {
    await salvarDescoberta(res, id);
  }
  revalidarTudo();
  revalidatePath(`/marcas/${id}`);
}

// ---------- Configurações ----------

export async function salvarConfig(fd: FormData) {
  const entradas = Array.from(fd.entries()).filter(([chave]) => !chave.startsWith("$"));
  for (const [chave, valor] of entradas) {
    await prisma.config.upsert({
      where: { chave },
      update: { valor: String(valor) },
      create: { chave, valor: String(valor) },
    });
  }
  revalidatePath("/configuracoes");
  revalidatePath("/mensagens");
}

export async function lerConfig(): Promise<Record<string, string>> {
  const itens = await prisma.config.findMany();
  return Object.fromEntries(itens.map((i) => [i.chave, i.valor]));
}
