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

  function atualizarProjeto(projetoEnviado: ProjetoAntesDoSupabase) {
    if (!projeto) return;

    const idAlvo = projeto.id;

    if (projetoEnviado.imagem instanceof File) {
      enviarImagem(projetoEnviado.imagem).then((urlDaImagem) => {
        if (!urlDaImagem) {
          console.error("Erro ao atualizar a imagem da publicação");
          return;
        }

        const projetoAtualizado: Projeto = {
          ...projetoEnviado,
          id: idAlvo,
          imagem: urlDaImagem,
        };

        atualizarPostagem(idAlvo, projetoAtualizado);
      });
    } else {
      const projetoAtualizado: Projeto = {
        ...projetoEnviado,
        id: idAlvo,
        imagem: projeto.imagem,
      };

      atualizarPostagem(idAlvo, projetoAtualizado);
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
