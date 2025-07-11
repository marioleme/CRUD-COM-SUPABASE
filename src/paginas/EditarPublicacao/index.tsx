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
    if (id) {
      buscarPostagemPorId(id).then((projetoBuscado) => {
        setProjeto(projetoBuscado);
      });
    }
  }, [id]);

  function atualizarProjeto(projetoEnviado: ProjetoAntesDoSupabase) {
    if (!id || !projeto) return;

    if (projetoEnviado.imagem instanceof File) {
      enviarImagem(projetoEnviado.imagem).then((urlDaImagem) => {
        if (!urlDaImagem) {
          console.error("Erro ao atualizar a imagem da publicação");
          return;
        }

        const projetoAtualizado = {
          ...projetoEnviado,
          id,
          imagem: urlDaImagem,
        };

        atualizarPostagem(id, projetoAtualizado);
      });
    } else {
      const projetoAtualizado = {
        ...projetoEnviado,
        id,
        imagem: projeto.imagem,
      };

      atualizarPostagem(id, projetoAtualizado);
    }
  }

  return (
    <div>
      {projeto ? (
        <FormularioProjeto projetoInicial={projeto} onSubmit={atualizarProjeto} />
      ) : (
        <p>Carregando projeto...</p>
      )}
    </div>
  );
}
