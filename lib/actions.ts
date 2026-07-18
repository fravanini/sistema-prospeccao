"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { exigirUsuario } from "./auth";
import { nomeParaEmail, normalizarSite, rasparSite, ResultadoScrape } from "./scraper";
import {
  ATOR_HASHTAG,
  ATOR_PERFIL,
  MencaoRankeada,
  mapearPerfil,
  ranquearMencoes,
  rodarAtor,
} from "./apify";
import { enviarGmail, gmailConectado, threadTemResposta } from "./gmail";
import { enviosDeHoje } from "./fila";

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
  revalidatePath("/fila");
  revalidatePath("/marcas");
  revalidatePath("/mensagens");
}

async function marcaDoUsuario(id: number, usuarioId: number) {
  return prisma.marca.findFirst({ where: { id, usuarioId } });
}

// ---------- Marcas ----------

export async function criarMarca(fd: FormData) {
  const usuario = await exigirUsuario();
  const dados = dadosMarca(fd);
  if (!dados.nome) return;
  const marca = await prisma.marca.create({ data: { ...dados, usuarioId: usuario.id } });
  revalidarTudo();
  redirect(`/marcas/${marca.id}`);
}

export async function atualizarMarca(id: number, fd: FormData) {
  const usuario = await exigirUsuario();
  const dados = dadosMarca(fd);
  if (!dados.nome) return;
  await prisma.marca.updateMany({ where: { id, usuarioId: usuario.id }, data: dados });
  revalidarTudo();
  revalidatePath(`/marcas/${id}`);
}

export async function excluirMarca(id: number) {
  const usuario = await exigirUsuario();
  await prisma.marca.deleteMany({ where: { id, usuarioId: usuario.id } });
  revalidarTudo();
  redirect("/marcas");
}

export async function moverMarca(id: number, status: string) {
  const usuario = await exigirUsuario();
  await prisma.marca.updateMany({ where: { id, usuarioId: usuario.id }, data: { status } });
  revalidarTudo();
  revalidatePath(`/marcas/${id}`);
}

export async function alternarNaoContatar(id: number, valor: boolean) {
  const usuario = await exigirUsuario();
  await prisma.marca.updateMany({
    where: { id, usuarioId: usuario.id },
    data: { naoContatar: valor },
  });
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
  const usuario = await exigirUsuario();
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
        usuarioId: usuario.id,
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
  const usuario = await exigirUsuario();
  const marcaId = Number(fd.get("marcaId"));
  const nome = texto(fd, "nome");
  if (!marcaId || !nome) return;
  const marca = await marcaDoUsuario(marcaId, usuario.id);
  if (!marca) return;
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
  if (marca.status === "PESQUISADA") {
    await prisma.marca.update({ where: { id: marcaId }, data: { status: "CONTATO_ENCONTRADO" } });
  }
  revalidarTudo();
  revalidatePath(`/marcas/${marcaId}`);
}

export async function atualizarContato(id: number, fd: FormData) {
  const usuario = await exigirUsuario();
  const nome = texto(fd, "nome");
  if (!nome) return;
  const contato = await prisma.contato.findFirst({
    where: { id, marca: { usuarioId: usuario.id } },
  });
  if (!contato) return;
  await prisma.contato.update({
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
  const usuario = await exigirUsuario();
  const contato = await prisma.contato.findFirst({
    where: { id, marca: { usuarioId: usuario.id } },
  });
  if (!contato) return;
  await prisma.contato.delete({ where: { id } });
  revalidarTudo();
  revalidatePath(`/marcas/${contato.marcaId}`);
}

// ---------- Campanhas ----------

export async function criarCampanha(fd: FormData) {
  const usuario = await exigirUsuario();
  const nome = texto(fd, "nome");
  if (!nome) return;
  await prisma.campanha.create({
    data: {
      usuarioId: usuario.id,
      nome,
      pitchBase: opcional(fd, "pitchBase"),
      periodo: opcional(fd, "periodo"),
    },
  });
  revalidatePath("/campanhas");
  revalidatePath("/mensagens");
}

export async function alternarCampanha(id: number, ativa: boolean) {
  const usuario = await exigirUsuario();
  await prisma.campanha.updateMany({ where: { id, usuarioId: usuario.id }, data: { ativa } });
  revalidatePath("/campanhas");
  revalidatePath("/mensagens");
}

export async function excluirCampanha(id: number) {
  const usuario = await exigirUsuario();
  await prisma.campanha.deleteMany({ where: { id, usuarioId: usuario.id } });
  revalidatePath("/campanhas");
  revalidatePath("/mensagens");
}

// ---------- Templates ----------

export async function criarTemplate(fd: FormData) {
  const usuario = await exigirUsuario();
  const nome = texto(fd, "nome");
  const assunto = texto(fd, "assunto");
  const corpo = texto(fd, "corpo");
  if (!nome || !assunto || !corpo) return;
  await prisma.template.create({
    data: {
      usuarioId: usuario.id,
      nome,
      etapa: texto(fd, "etapa") || "INICIAL",
      assunto,
      corpo,
    },
  });
  revalidatePath("/templates");
  revalidatePath("/mensagens");
}

export async function atualizarTemplate(id: number, fd: FormData) {
  const usuario = await exigirUsuario();
  const nome = texto(fd, "nome");
  const assunto = texto(fd, "assunto");
  const corpo = texto(fd, "corpo");
  if (!nome || !assunto || !corpo) return;
  await prisma.template.updateMany({
    where: { id, usuarioId: usuario.id },
    data: { nome, etapa: texto(fd, "etapa") || "INICIAL", assunto, corpo },
  });
  revalidatePath("/templates");
  revalidatePath("/mensagens");
}

export async function excluirTemplate(id: number) {
  const usuario = await exigirUsuario();
  await prisma.template.deleteMany({ where: { id, usuarioId: usuario.id } });
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
  const usuario = await exigirUsuario();
  const marca = await marcaDoUsuario(dados.marcaId, usuario.id);
  if (!marca) return;
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

async function salvarDescoberta(
  usuarioId: number,
  res: ResultadoScrape,
  marcaIdExistente?: number
): Promise<ResumoDescoberta> {
  const hostname = new URL(res.site).hostname.replace(/^www\./, "");

  let marca =
    marcaIdExistente !== undefined
      ? await prisma.marca.findFirst({
          where: { id: marcaIdExistente, usuarioId },
          include: { contatos: true },
        })
      : await prisma.marca.findFirst({
          where: { usuarioId, site: { contains: hostname } },
          include: { contatos: true },
        });

  const nome = res.titulo ?? res.nomeFantasia ?? res.razaoSocial ?? hostname;

  if (!marca) {
    marca = await prisma.marca.create({
      data: {
        usuarioId,
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
  const usuario = await exigirUsuario();
  const linhas = texto(fd, "sites")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (linhas.length === 0) return [];

  const config = await lerConfigDe(usuario.id);
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
      resumos.push(await salvarDescoberta(usuario.id, res));
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
  const usuario = await exigirUsuario();
  const marca = await marcaDoUsuario(id, usuario.id);
  if (!marca?.site) return;
  const config = await lerConfigDe(usuario.id);
  const res = await rasparSite(marca.site, {
    hunterApiKey: config["hunter_api_key"]?.trim() || undefined,
  });
  if ("erro" in res) {
    await prisma.interacao.create({
      data: { marcaId: id, tipo: "NOTA", resultado: `Descoberta automática falhou: ${res.erro}.` },
    });
  } else {
    await salvarDescoberta(usuario.id, res, id);
  }
  revalidarTudo();
  revalidatePath(`/marcas/${id}`);
}

// ---------- Descoberta via Apify (Instagram sem tocar na sua conta) ----------

export interface ResultadoGarimpo {
  ok: boolean;
  erro?: string;
  posts: number;
  mencoes: MencaoRankeada[];
}

export async function garimparHashtags(
  _estadoAnterior: ResultadoGarimpo | null,
  fd: FormData
): Promise<ResultadoGarimpo> {
  const usuario = await exigirUsuario();
  const config = await lerConfigDe(usuario.id);
  const token = config["apify_api_token"]?.trim();
  if (!token) {
    return {
      ok: false,
      erro: "configure o token da API do Apify nas Configurações",
      posts: 0,
      mencoes: [],
    };
  }

  const hashtags = texto(fd, "hashtags")
    .split(/[\s,;]+/)
    .map((h) => h.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 3);
  if (hashtags.length === 0) {
    return { ok: false, erro: "informe ao menos uma hashtag", posts: 0, mencoes: [] };
  }

  const porHashtag = Math.max(10, Math.min(50, Number(fd.get("limite")) || 30));
  const res = await rodarAtor(ATOR_HASHTAG, { hashtags, resultsLimit: porHashtag }, token);
  if ("erro" in res) return { ok: false, erro: res.erro, posts: 0, mencoes: [] };

  return { ok: true, posts: res.itens.length, mencoes: ranquearMencoes(res.itens).slice(0, 40) };
}

export async function importarPerfisApify(
  _estadoAnterior: ResumoDescoberta[] | null,
  fd: FormData
): Promise<ResumoDescoberta[]> {
  const usuario = await exigirUsuario();
  const config = await lerConfigDe(usuario.id);
  const token = config["apify_api_token"]?.trim();
  if (!token) {
    return [
      {
        site: "—",
        ok: false,
        erro: "configure o token da API do Apify nas Configurações",
        novosContatos: 0,
        avisos: [],
      },
    ];
  }

  const usernames = texto(fd, "usernames")
    .split(/[\s,;]+/)
    .map((u) => u.replace(/^@/, "").trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20);
  if (usernames.length === 0) return [];

  const res = await rodarAtor(ATOR_PERFIL, { usernames }, token);
  if ("erro" in res) {
    return [{ site: "Apify", ok: false, erro: res.erro, novosContatos: 0, avisos: [] }];
  }

  const hunterApiKey = config["hunter_api_key"]?.trim() || undefined;
  const resumos: ResumoDescoberta[] = [];
  const encontrados = new Set<string>();

  for (const item of res.itens) {
    const perfil = mapearPerfil(item);
    if (!perfil) continue;
    encontrados.add(perfil.username);
    const handle = "@" + perfil.username;

    let marca = await prisma.marca.findFirst({
      where: { usuarioId: usuario.id, instagram: handle },
      include: { contatos: true },
    });
    if (!marca) {
      marca = await prisma.marca.create({
        data: {
          usuarioId: usuario.id,
          nome: perfil.nome ?? handle,
          instagram: handle,
          site: perfil.site ?? null,
          origem: "Descoberta via Apify (Instagram)",
          notas: perfil.bio ?? null,
        },
        include: { contatos: true },
      });
    } else if (!marca.site && perfil.site) {
      await prisma.marca.update({ where: { id: marca.id }, data: { site: perfil.site } });
    }

    let novosContatos = 0;
    const avisos: string[] = [];

    if (perfil.email && !marca.contatos.some((c) => c.email === perfil.email)) {
      const { nome, cargo } = nomeParaEmail({
        email: perfil.email,
        fonte: "Perfil do Instagram (público)",
      });
      await prisma.contato.create({
        data: {
          marcaId: marca.id,
          nome,
          cargo,
          email: perfil.email,
          fonteEmail: "Perfil do Instagram (público)",
        },
      });
      novosContatos++;
    }

    await prisma.interacao.create({
      data: {
        marcaId: marca.id,
        tipo: "NOTA",
        resultado: `Importado do Instagram via Apify: ${handle}${
          perfil.seguidores ? `, ${perfil.seguidores.toLocaleString("pt-BR")} seguidores` : ""
        }${perfil.site ? `, site na bio: ${perfil.site}` : ", sem site na bio"}.`,
      },
    });

    // Encadeia com o scraper de site usando o link da bio
    if (perfil.site) {
      const scrape = await rasparSite(perfil.site, { hunterApiKey });
      if ("erro" in scrape) {
        avisos.push(`site da bio inacessível: ${scrape.erro}`);
      } else {
        const resumoSite = await salvarDescoberta(usuario.id, scrape, marca.id);
        novosContatos += resumoSite.novosContatos;
        avisos.push(...resumoSite.avisos);
        resumos.push({ ...resumoSite, nome: marca.nome, novosContatos, avisos });
        continue;
      }
    }

    if (novosContatos > 0 && marca.status === "PESQUISADA") {
      await prisma.marca.update({
        where: { id: marca.id },
        data: { status: "CONTATO_ENCONTRADO" },
      });
    }
    resumos.push({
      site: perfil.site ?? handle,
      ok: true,
      marcaId: marca.id,
      nome: marca.nome,
      novosContatos,
      instagram: handle,
      avisos,
    });
  }

  for (const u of usernames) {
    if (!encontrados.has(u)) {
      resumos.push({
        site: "@" + u,
        ok: false,
        erro: "perfil não retornado pelo Apify (inexistente ou privado)",
        novosContatos: 0,
        avisos: [],
      });
    }
  }

  revalidarTudo();
  return resumos;
}

// ---------- Envio via Gmail e cadência ----------

export async function enviarEmailGmail(dados: {
  marcaId: number;
  contatoId: number | null;
  para: string;
  assunto: string;
  corpo: string;
  etapa: string;
}): Promise<{ ok: true } | { ok: false; erro: string }> {
  const usuario = await exigirUsuario();
  const { conectado } = await gmailConectado(usuario.id);
  if (!conectado) return { ok: false, erro: "Gmail não conectado — veja as Configurações" };

  const config = await lerConfigDe(usuario.id);
  const limite = Math.max(1, Number(config["limite_diario"]) || 15);
  const enviados = await enviosDeHoje(usuario.id);
  if (enviados >= limite) {
    return {
      ok: false,
      erro: `limite diário atingido (${enviados}/${limite}) — proteja a entregabilidade e continue amanhã`,
    };
  }

  const marca = await marcaDoUsuario(dados.marcaId, usuario.id);
  if (!marca) return { ok: false, erro: "marca não encontrada" };
  if (marca.naoContatar) return { ok: false, erro: "marca marcada como não contatar" };

  // Follow-ups seguem na mesma thread do primeiro envio
  const anterior = await prisma.interacao.findFirst({
    where: { marcaId: dados.marcaId, gmailThreadId: { not: null } },
    orderBy: { data: "desc" },
  });

  try {
    const envio = await enviarGmail(usuario.id, {
      para: dados.para,
      assunto: dados.assunto,
      corpo: dados.corpo,
      threadId: anterior?.gmailThreadId ?? undefined,
    });
    const tipo = dados.etapa === "INICIAL" ? "EMAIL_ENVIADO" : "FOLLOWUP_ENVIADO";
    await prisma.interacao.create({
      data: {
        marcaId: dados.marcaId,
        contatoId: dados.contatoId,
        tipo,
        assunto: dados.assunto,
        corpo: dados.corpo,
        gmailThreadId: envio.threadId || null,
      },
    });
    const novoStatus = STATUS_POR_TIPO[tipo];
    if (novoStatus) {
      await prisma.marca.update({ where: { id: dados.marcaId }, data: { status: novoStatus } });
    }
    revalidarTudo();
    revalidatePath(`/marcas/${dados.marcaId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "envio falhou" };
  }
}

export async function checarRespostas(): Promise<{
  ok: boolean;
  erro?: string;
  respostas: number;
  checadas: number;
}> {
  const usuario = await exigirUsuario();
  const { conectado, email } = await gmailConectado(usuario.id);
  if (!conectado || !email) {
    return { ok: false, erro: "Gmail não conectado", respostas: 0, checadas: 0 };
  }

  const marcas = await prisma.marca.findMany({
    where: { usuarioId: usuario.id, status: { in: ["EMAIL_ENVIADO", "FOLLOW_UP"] } },
    include: {
      interacoes: {
        where: { gmailThreadId: { not: null } },
        orderBy: { data: "desc" },
        take: 1,
      },
    },
    take: 25,
  });

  let respostas = 0;
  let checadas = 0;
  for (const marca of marcas) {
    const threadId = marca.interacoes[0]?.gmailThreadId;
    if (!threadId) continue;
    checadas++;
    try {
      if (await threadTemResposta(usuario.id, threadId, email)) {
        await prisma.interacao.create({
          data: {
            marcaId: marca.id,
            tipo: "RESPOSTA_RECEBIDA",
            resultado: "Resposta detectada automaticamente na thread do Gmail.",
            gmailThreadId: threadId,
          },
        });
        await prisma.marca.update({ where: { id: marca.id }, data: { status: "RESPONDEU" } });
        respostas++;
      }
    } catch {
      // thread inacessível — segue para a próxima
    }
  }

  revalidarTudo();
  return { ok: true, respostas, checadas };
}

export async function checarRespostasForm() {
  await checarRespostas();
}

export async function desconectarGmail() {
  const usuario = await exigirUsuario();
  await prisma.config.deleteMany({
    where: { usuarioId: usuario.id, chave: { in: ["gmail_refresh_token", "gmail_email"] } },
  });
  revalidatePath("/configuracoes");
  revalidatePath("/fila");
  revalidatePath("/mensagens");
}

// ---------- Configurações ----------

async function lerConfigDe(usuarioId: number): Promise<Record<string, string>> {
  const itens = await prisma.config.findMany({ where: { usuarioId } });
  return Object.fromEntries(itens.map((i) => [i.chave, i.valor]));
}

export async function salvarConfig(fd: FormData) {
  const usuario = await exigirUsuario();
  const entradas = Array.from(fd.entries()).filter(([chave]) => !chave.startsWith("$"));
  for (const [chave, valor] of entradas) {
    await prisma.config.upsert({
      where: { usuarioId_chave: { usuarioId: usuario.id, chave } },
      update: { valor: String(valor) },
      create: { usuarioId: usuario.id, chave, valor: String(valor) },
    });
  }
  revalidatePath("/configuracoes");
  revalidatePath("/guia");
  revalidatePath("/mensagens");
}

export async function lerConfig(): Promise<Record<string, string>> {
  const usuario = await exigirUsuario();
  return lerConfigDe(usuario.id);
}
