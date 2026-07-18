import { criarMarca } from "@/lib/actions";
import { nichoAtual } from "@/lib/nicho-atual";
import { exigirUsuario } from "@/lib/auth";
import MarcaForm from "../../components/MarcaForm";

export const dynamic = "force-dynamic";

export default async function NovaMarcaPage() {
  const usuario = await exigirUsuario();
  const nicho = await nichoAtual(usuario.id);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Nova marca</h1>
        <p className="text-sm text-slate-500">
          Cadastre a marca com o máximo de sinais de pesquisa — o gancho personalizado é o que faz
          o e-mail ser respondido.
        </p>
      </div>
      <div className="card">
        <MarcaForm action={criarMarca} textoBotao="Cadastrar marca" categorias={nicho.categorias} />
      </div>
    </div>
  );
}
