export function renderTemplate(texto: string, vars: Record<string, string>): string {
  return texto.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (bloco, chave: string) => {
    const valor = vars[chave.toLowerCase()];
    return valor !== undefined && valor !== "" ? valor : bloco;
  });
}
