import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { buscarPostagemPorId } from "../../supabase/requisicoes";
import { Projeto } from "../../tipagem/Projeto";
import "./styles.css";

export default function VisualizarPublicacao() {
  const { id } = useParams();
  const [postagem, setPostagem] = useState<Projeto | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id) {
      setCarregando(false);
      return;
    }

    buscarPostagemPorId(id).then((resultado) => {
      setPostagem(resultado);
      setCarregando(false);
    });
  }, [id]);

  if (carregando) return <p>Carregando postagem...</p>;

  if (!postagem) {
    return (
      <section className="pagina-postagem">
        <h2>Postagem não encontrada</h2>
        <Link to="/" className="botao-voltar">Voltar para o início</Link>
      </section>
    );
  }

  return (
    <article className="pagina-postagem">
      <Link to="/" className="botao-voltar">← Voltar</Link>
      <h2>{postagem.nome}</h2>
      {postagem.imagem && (
        <img src={postagem.imagem} alt="" className="postagem-imagem" />
      )}
      <p className="postagem-descricao">{postagem.descricao}</p>
      {postagem.tags.length > 0 && (
        <div className="postagem-tags" aria-label="Tags da postagem">
          {postagem.tags.map((tag) => (
            <span key={tag} className="tag-badge">{tag}</span>
          ))}
        </div>
      )}
      <div className="postagem-acoes">
        <Link to={`/editar-publicacao/${postagem.id}`} className="botao__editar">
          Editar postagem
        </Link>
      </div>
    </article>
  );
}
