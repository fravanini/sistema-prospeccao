import { criarMarca } from "@/lib/actions";
import MarcaForm from "../../components/MarcaForm";

export default function NovaMarcaPage() {
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
        <MarcaForm action={criarMarca} textoBotao="Cadastrar marca" />
      </div>
    </div>
  );
}
