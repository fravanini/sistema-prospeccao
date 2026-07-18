import { prisma } from "./db";
import { Nicho, nichoPorId } from "./nichos";

export async function nichoAtual(usuarioId: number): Promise<Nicho> {
  const item = await prisma.config.findUnique({
    where: { usuarioId_chave: { usuarioId, chave: "nicho_id" } },
  });
  return nichoPorId(item?.valor);
}

/** Categorias do nicho + categorias já usadas no banco (para não órfãs filtros). */
export async function categoriasDisponiveis(usuarioId: number, nicho: Nicho): Promise<string[]> {
  const usadas = await prisma.marca.findMany({
    where: { usuarioId },
    select: { categoria: true },
    distinct: ["categoria"],
  });
  const todas = new Set<string>(nicho.categorias);
  for (const u of usadas) todas.add(u.categoria);
  todas.add("Outra");
  return Array.from(todas);
}
