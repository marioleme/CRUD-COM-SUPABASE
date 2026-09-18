import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import "./styles.css";
import { Projeto } from "../../tipagem/Projeto";
import { ProjetoAntesDoSupabase } from "../../tipagem/ProjetoAntesDoSupabase";
import { Link } from "react-router-dom";

type FormularioProjetoProps = {
  projetoInicial?: Projeto;
  onSubmit: (projeto: ProjetoAntesDoSupabase) => void;
};

/** O PostgREST pode devolver tags como array, string JSON ou texto separado por vírgulas. */
function normalizarTags(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor.filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean);
  }
  if (typeof valor === "string") {
    const trimmed = valor.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    } catch {
      /* não é JSON */
    }
    return trimmed
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export default function FormularioProjeto({ projetoInicial, onSubmit }: FormularioProjetoProps) {
  const [nome, setNome] = useState(projetoInicial?.nome || "");
  const [descricao, setDescricao] = useState(projetoInicial?.descricao || "");
  const [imagem, setImagem] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>(() => normalizarTags(projetoInicial?.tags));

  const projetoInicialId = projetoInicial?.id;
  const nomeInicial = projetoInicial?.nome || "";
  const descricaoInicial = projetoInicial?.descricao || "";
  const tagsIniciais = projetoInicial?.tags;

  useEffect(() => {
    if (!projetoInicialId) return;
    setNome(nomeInicial);
    setDescricao(descricaoInicial);
    setTags(normalizarTags(tagsIniciais));
    setImagem(null);
  }, [projetoInicialId, nomeInicial, descricaoInicial, tagsIniciais]);
  const [novaTag, setNovaTag] = useState("");
  const imagemProjetoInicial = projetoInicial?.imagem || null;

  function separarTags(valor: string): string[] {
    return valor
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function handleImagemChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setImagem(e.target.files[0]);
    }
  }

  function handleAdicionarTag() {
    const tagsDigitadas = separarTags(novaTag);

    if (tagsDigitadas.length === 0) return;

    setTags((tagsAtuais) => {
      const tagsAdicionadas = tagsDigitadas.filter((tag) => !tagsAtuais.includes(tag));
      return [...tagsAtuais, ...new Set(tagsAdicionadas)];
    });
    setNovaTag("");
  }

  function handleRemoverTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const tagsFinais = [
      ...tags,
      ...separarTags(novaTag).filter((tag) => !tags.includes(tag)),
    ];
    onSubmit({ nome, descricao, imagem, tags: [...new Set(tagsFinais)] });
  }

  return (
    <form onSubmit={handleSubmit} className="formulario-projeto">
      <div className="titulo">
        <h2>{projetoInicial ? "Editar Postagem" : "Nova Postagem"}</h2>
   
      <div>
        <div>
          {imagemProjetoInicial ? (
            <img src={imagemProjetoInicial} alt="Preview" className="form-imagem" />
          ) : projetoInicial ? (
            <span className="form-sem-imagem">Sem imagem nesta postagem</span>
          ) : (
            <span className="form-sem-imagem">
              Escolhe uma imagem para ver a pré-visualização
            </span>
          )}
        </div>

        <label className="upload-label">
          Carregar imagem
          <input type="file" accept="image/*" onChange={handleImagemChange} hidden />
        </label>
      </div>
      <div>
        <label>
          Nome da Postagem
          <input
            type="text"
            placeholder="Nome da Postagem"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>

        <label>
          Descrição da Postagem
          <textarea
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </label>

        <label>
          Tags
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Adicionar tags (separe com vírgula)"
              value={novaTag}
              onChange={(e) => setNovaTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdicionarTag())}
            />
            <button type="button" onClick={handleAdicionarTag} className="botao-adicionar-tag" style={{ padding: "0 16px", borderRadius: "4px", backgroundColor: "var(--verde-destaque)", color: "var(--cinza-escuro)", border: "none", cursor: "pointer", fontWeight: "bold" }}>
              +
            </button>
          </div>
        </label>

        <div className="tags">
          {tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}{" "}
              <button type="button" onClick={() => handleRemoverTag(tag)}>
                x
              </button>
            </span>
          ))}
        </div>

        <div className="botoes">
          <Link to="/">
            <button type="button" className="botao-descartar">
              Descartar
            </button>
          </Link>

          <button type="submit" className="botao-publicar">
            {projetoInicial ? "Salvar" : "Publicar"}
          </button>
        </div>
      </div>
      </div>
    </form>
  );
}
