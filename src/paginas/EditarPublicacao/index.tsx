import { useEffect, useState } from "react";
import FormularioProjeto from "../../componentes/FormularioProjeto";
import { Projeto } from "../../tipagem/Projeto";
import { useParams } from "react-router-dom";
import { atualizarPostagem, buscarPostagemPorId, enviarImagem } from "../../supabase/requisicoes";
import { ProjetoAntesDoSupabase } from "../../tipagem/ProjetoAntesDoSupabase";

export default function EditarPublicacao() {
  const [projeto, setProjeto] = useState<Projeto>();
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;
    setProjeto(undefined);
    buscarPostagemPorId(id).then((projetoBuscado) => {
      setProjeto(projetoBuscado ?? undefined);
    });
  }, [id]);

  async function atualizarProjeto(projetoEnviado: ProjetoAntesDoSupabase) {
    if (!id || !projeto) return;

    let imagemUrl = projeto.imagem;

    if (projetoEnviado.imagem instanceof File) {
      const urlDaImagem = await enviarImagem(projetoEnviado.imagem);
      if (!urlDaImagem) {
        window.alert("Não foi possível atualizar a imagem da publicação.");
        return;
      }
      imagemUrl = urlDaImagem;
    }

    const projetoAtualizado: Projeto = {
      ...projetoEnviado,
      id,
      imagem: imagemUrl,
    };

    await atualizarPostagem(id, projetoAtualizado);
  }

  return (
    <div>
      {projeto ? (
        <FormularioProjeto projetoInicial={projeto} onSubmit={atualizarProjeto} />
      ) : (
        <p>Carregando postagem...</p>
      )}
    </div>
  );
}
