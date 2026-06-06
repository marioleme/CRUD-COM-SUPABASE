import { Link } from "react-router-dom";
import "./styles.css";

type CardProps = {
  id: string;
  imagemUrl: string;
  titulo: string;
  resumo: string;
  tags?: string[];
  deletar: (id: string) => void;
};

export default function Card({ id, imagemUrl, titulo, resumo, tags, deletar }: CardProps) {
  return (
    <article className="card" id={id}>
      <div className="card__imagem">
        <img src={imagemUrl} alt="imagem do post" />
      </div>
      <div className="card__conteudo">
        <div className="conteudo__texto">
          <h3>{titulo}</h3>
          <p>{resumo}</p>
          {tags && tags.length > 0 ? (
            <ul className="card__tags" aria-label="Tags">
              {tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : null}
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
