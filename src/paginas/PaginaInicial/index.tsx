import { useEffect, useState } from "react";
import Card from "../../componentes/Card";
import "./styles.css";
import { buscarPostagens, deletarPostagem } from "../../supabase/requisicoes";
import { Projeto } from "../../tipagem/Projeto";

export default function PaginaInicial() {
  const [postagens, setPostagens] = useState<Projeto[]>([]);
  useEffect(() => {
    buscarPostagens().then((dados) => {
      setPostagens(dados);
    });
  }, []);

  function deletar(id: string) {
    deletarPostagem(id).then(() => {
      setPostagens((postagensAnteriores) =>
        postagensAnteriores.filter((postagem) => postagem.id !== id)
      );
    });
  }

  return (
    <div>
      <ul className="lista-cards">
        {postagens.map((postagem) => (
          <li key={postagem.id}>
            <Card
              id={postagem.id}
              imagemUrl={postagem.imagem}
              titulo={postagem.nome}
              resumo={postagem.descricao}
              deletar={deletar}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
