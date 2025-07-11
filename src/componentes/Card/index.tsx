import { Link } from "react-router-dom";
import "./styles.css";

type CardProps = {
  id: string;
  imagemUrl: string;
  titulo: string;
  resumo: string;
  deletar: (id: string) => void;
};

export default function Card({ id, imagemUrl, titulo, resumo, deletar }: CardProps) {
  return (
    <article className="card" id={id}>
      <div className="card__imagem">
        <img src={imagemUrl} alt="imagem do post" />
      </div>
      <div className="card__conteudo">
        <div className="conteudo__texto">
          <h3>{titulo}</h3>
          <p>{resumo}</p>
        </div>

        <div className="conteudo__botoes">
          <Link to={`/editar-publicacao/${id}`} className="botao__editar">
            Editar
          </Link>
          <button className="botao__deletar" onClick={() => deletar(id)}>
            Apagar
          </button>
        </div>
      </div>
    </article>
  );
}
