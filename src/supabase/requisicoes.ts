import { Projeto } from "../tipagem/Projeto";
import { ProjetoAntesDoSupabase } from "../tipagem/ProjetoAntesDoSupabase";
import { supabase } from "./supabaseClient";

const TABLE_NAME = import.meta.env.VITE_SUPABASE_TABLE || "posts";
const BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET || "post-images";

function alertaErroSupabase(contexto: string, error: { message?: string; hint?: string; details?: string }) {
  const texto = [error.message, error.hint, error.details].filter(Boolean).join("\n\n");
  window.alert(`${contexto}\n\n${texto || "Erro desconhecido."}`);
}

/** Colunas da tabela `posts` no Supabase (schema típico do README + coluna `descricao`). */
type LinhaPostsSupabase = {
  id?: number | string;
  created_at?: string;
  title?: string | null;
  content?: string | null;
  image_url?: string | null;
  author_id?: string | null;
  descricao?: string | null;
  tags?: unknown;
};

function tagsDaLinha(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean);
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

/** Converte uma linha da BD para o modelo usado na UI (`Projeto`). */
function linhaParaProjeto(linha: LinhaPostsSupabase): Projeto {
  return {
    id: String(linha.id ?? ""),
    nome: String(linha.title ?? ""),
    descricao: String(linha.descricao ?? linha.content ?? ""),
    imagem: String(linha.image_url ?? ""),
    tags: tagsDaLinha(linha.tags),
  };
}

/** Campos da UI → colunas SQL (sem `id`; `author_id` é acrescentado no insert quando há sessão). */
function camposProjetoParaColunas(
  nome: string,
  descricao: string,
  imagemUrl: string,
  tags: string[],
): Record<string, unknown> {
  return {
    title: nome,
    descricao,
    content: descricao,
    image_url: imagemUrl.trim() === "" ? null : imagemUrl,
    tags,
  };
}

export function buscarPostagens() {
  return supabase
    .from("postagens")
    .select("*")
    .then(({ data, error }) => {
      if (error) {
        console.error("Erro ao buscar postagens", error.message);
        return [];
      }
      console.log("Postagens recebidas do Supabase:", data);
      return data;
    });
}

export async function criarPostagem(postagem: ProjetoAntesDoSupabase) {
  document.querySelector(".formulario-projeto")?.classList.add("enviando");

  try {
    // If there's an image, upload it first
    let urlImagem: string | null = null;
    if (postagem.imagem) {
      urlImagem = await enviarImagem(postagem.imagem);
      if (!urlImagem) {
        console.error("Não foi possível obter a URL da imagem!");
        document.querySelector(".formulario-projeto")?.classList.remove("enviando");
        return null;
      }
    }

    const postagemParaSalvar = {
      ...postagem,
      imagem: urlImagem ?? postagem.imagem ?? null,
    };

    console.log("Enviando postagem para o Supabase:", postagemParaSalvar);

    const { data, error } = await supabase.from("postagens").insert([postagemParaSalvar]);
    if (error) {
      console.error("Erro ao criar uma nova postagem", error.message ?? error);
      document.querySelector(".formulario-projeto")?.classList.remove("enviando");
      return null;
    }

    console.log("Postagem criada com sucesso:", data);
    document.querySelector(".formulario-projeto")?.classList.remove("enviando");
    alert("Postagem criada com sucesso!");
    window.location.href = "/";
    return data;
  } catch (e) {
    console.error("Erro ao criar postagem:", e);
    document.querySelector(".formulario-projeto")?.classList.remove("enviando");
    return null;
  }

  return enviarImagem(postagem.imagem).then((urlImagem) => {
    if (!urlImagem) {
      document
        .querySelector(".formulario-projeto")
        ?.classList.remove("enviando");
      console.error("Nao foi possivel obter a URL da imagem!");
      return null;
    }

    return inserirPostagem({
      nome: postagem.nome,
      descricao: postagem.descricao,
      imagem: urlImagem,
      tags: postagem.tags,
    });
  });
}

export async function enviarImagem(arquivo: File) {
  // Create a safe filename for the storage key to avoid "Invalid key" errors
  const extFromName = arquivo.name && arquivo.name.includes('.') ? arquivo.name.split('.').pop() : undefined;
  const extFromType = arquivo.type && arquivo.type.includes('/') ? arquivo.type.split('/').pop() : undefined;
  const ext = (extFromName ?? extFromType ?? 'bin').replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  const safeBase = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const nomeUnico = `${safeBase}.${ext}`;
  console.log('Enviando arquivo. nomeOriginal:', arquivo.name, 'chaveUsada:', nomeUnico);
  try {
    const { data, error } = await supabase.storage
      .from("imagens")
      .upload(nomeUnico, arquivo, { upsert: false, contentType: arquivo.type });

    if (error) {
      console.error("Erro ao enviar a imagem (upload):", error.message ?? error);
      return null;
    }
    if (!data) {
      console.error("Upload retornou sem dados:", data);
      return null;
    }

    const getPublic = supabase.storage.from("imagens").getPublicUrl(nomeUnico);
    // Different SDK versions return different shapes, so be defensive
    const publicData = getPublic.data as { publicUrl?: string; publicURL?: string } | undefined;
    const publicUrl = publicData?.publicUrl ?? publicData?.publicURL ?? null;
    if (!publicUrl) {
      console.error("Não foi possível obter a URL pública da imagem:", getPublic);
      return null;
    }

    return publicUrl;
  } catch (err) {
    console.error("Exceção ao enviar a imagem:", err);
    return null;
  }
}

export function buscarPostagemPorId(id: string) {
  return supabase
    .from("postagens")
    .select("*")
    .eq("id", id)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error("Erro ao buscar o projeto", error.message);
        return null;
      }

      return linhaParaProjeto(data as LinhaPostsSupabase);
    });
}

export function atualizarPostagem(id: string, novosDados: Projeto) {
  document.querySelector(".formulario-projeto")?.classList.add("enviando");
  const { id: _idLinha, ...campos } = novosDados;
  const linha = camposProjetoParaColunas(
    campos.nome,
    campos.descricao,
    campos.imagem,
    campos.tags,
  );

  return supabase
    .from("postagens")
    .update(novosDados)
    .eq("id", id)
    .then(({ data, error }) => {
      if (error) {
        console.error(
          "Não foi possível atualizar o projeto:",
          error.message,
          error,
        );
        alertaErroSupabase(
          "Não foi possível atualizar o post. Se faltar a coluna `tags`, executa `supabase/posts-tags.sql` no SQL Editor.",
          error,
        );
        document
          .querySelector(".formulario-projeto")
          ?.classList.remove("enviando");
        return null;
      }
      document
        .querySelector(".formulario-projeto")
        ?.classList.remove("enviando");
      window.location.href = "/";
      return data;
    });
}

export function deletarPostagem(id: string) {
  return supabase
    .from("postagens")
    .delete()
    .eq("id", id)
    .then(({ data, error }) => {
      if (error) {
        console.error("Erro ao deletar a postagem");
        return null;
      }

  if (error) {
    console.error("Erro ao deletar a postagem:", error.message, error);
    return false;
  }

  const apagadas = count ?? 0;
  if (apagadas < 1) {
    console.error(
      "Nenhuma linha foi apagada (RLS a bloquear DELETE ou id inexistente). " +
        "No Supabase, em SQL Editor, para testes podes usar por exemplo:\n" +
        `CREATE POLICY "posts_delete_anon" ON ${TABLE_NAME} FOR DELETE TO anon USING (true);`,
    );
    return false;
  }

  return true;
}
