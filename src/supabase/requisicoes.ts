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
    .from(TABLE_NAME)
    .select("*")
    .then(({ data, error }) => {
      if (error) {
        console.error("Erro ao buscar postagens", error.message);
        return [];
      }

      const linhas = (data ?? []) as LinhaPostsSupabase[];
      return linhas.map(linhaParaProjeto);
    });
}

type DadosParaInsert = {
  nome: string;
  descricao: string;
  imagem: string;
  tags: string[];
};

export function criarPostagem(postagem: ProjetoAntesDoSupabase) {
  document.querySelector(".formulario-projeto")?.classList.add("enviando");

  const inserirPostagem = (dados: DadosParaInsert) => {
    return supabase.auth.getSession().then(({ data: { session } }) => {
      const linha: Record<string, unknown> = {
        ...camposProjetoParaColunas(
          dados.nome,
          dados.descricao,
          dados.imagem,
          dados.tags,
        ),
      };
      if (session?.user?.id) {
        linha.author_id = session.user.id;
      }

      return supabase
        .from(TABLE_NAME)
        .insert([linha])
        .then(({ data, error }) => {
          if (error) {
            console.error(
              "Erro ao criar uma nova postagem",
              error.message,
              error,
            );
            alertaErroSupabase(
              "Não foi possível criar o post. Se a mensagem falar da coluna `tags`, executa o SQL `supabase/posts-tags.sql` no Supabase.",
              error,
            );
            document
              .querySelector(".formulario-projeto")
              ?.classList.remove("enviando");
            return null;
          }

          console.log("Postagem criada com sucesso:", data);
          document
            .querySelector(".formulario-projeto")
            ?.classList.remove("enviando");
          window.location.href = "/";
          return data;
        });
    });
  };

  if (!postagem.imagem) {
    return inserirPostagem({
      nome: postagem.nome,
      descricao: postagem.descricao,
      imagem: "",
      tags: postagem.tags,
    });
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

export function enviarImagem(arquivo: File) {
  const nomeUnico = `${Date.now()}-${arquivo.name}`;
  return supabase.storage
    .from(BUCKET_NAME)
    .upload(nomeUnico, arquivo)
    .then(({ data, error }) => {
      if (error || !data) {
        console.error("Erro ao enviar a imagem", error?.message);
        console.error("Detalhes completos (Storage):", error);
        if (error?.message?.toLowerCase().includes("bucket not found")) {
          console.error(
            `Bucket '${BUCKET_NAME}' nao encontrado. Crie esse bucket no Supabase Storage ou ajuste VITE_SUPABASE_BUCKET no .env.local.`,
          );
        }
        if (
          error?.message?.toLowerCase().includes("row-level security") ||
          error?.message?.toLowerCase().includes("rls")
        ) {
          console.error(
            `Storage RLS: o bucket '${BUCKET_NAME}' precisa de policies em storage.objects (INSERT para quem faz upload; SELECT se for URL publica). No Supabase: SQL Editor e crie policies para este bucket, ou use o assistente de policies em Storage.`,
          );
        }
        return null;
      }

      const { publicUrl } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(nomeUnico).data;

      return publicUrl;
    });
}

export function buscarPostagemPorId(id: string) {
  return supabase
    .from(TABLE_NAME)
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
    .from(TABLE_NAME)
    .update(linha)
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

/**
 * Usa `count: 'exact'` para saber quantas linhas foram apagadas.
 * Só com `.select()` após DELETE, o PostgREST ainda responde 200 com `[]` se o RLS
 * não apagar nada — e o URL parece um GET na lista da Rede (mas o método é DELETE).
 */
export async function deletarPostagem(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from(TABLE_NAME)
    .delete({ count: "exact" })
    .eq("id", id);

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
