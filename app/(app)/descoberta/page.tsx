import { nichoAtual } from "@/lib/nicho-atual";
import { exigirUsuario } from "@/lib/auth";
import DescobertaClient from "../components/DescobertaClient";

export const dynamic = "force-dynamic";

export default async function DescobertaPage({
  searchParams,
}: {
  searchParams: Promise<{ hashtags?: string }>;
}) {
  const usuario = await exigirUsuario();
  const [{ hashtags }, nicho] = await Promise.all([searchParams, nichoAtual(usuario.id)]);
  const hashtagsIniciais = hashtags ?? nicho.hashtags.slice(0, 3).join(", ");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Descoberta automática</h1>
        <p className="text-sm text-slate-500">
          Três ferramentas, do funil de cima para baixo: garimpe marcas nas publis do nicho{" "}
          <strong>{nicho.nome}</strong> (Apify), importe os perfis promissores e extraia contatos
          dos sites. Nada aqui usa a sua conta do Instagram — o Apify roda na infraestrutura
          deles.
        </p>
      </div>
      <DescobertaClient hashtagsIniciais={hashtagsIniciais} />
    </div>
  );
}
