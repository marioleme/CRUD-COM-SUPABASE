import { Projeto } from "../tipagem/Projeto";
import { ProjetoAntesDoSupabase } from "../tipagem/ProjetoAntesDoSupabase";
import { supabase } from "./supabaseClient";

const TABLE_NAME = import.meta.env.VITE_SUPABASE_TABLE || "postagens";
const BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET || "imagens";

function alertaErroSupabase(
  contexto: string,
  error: { message?: string; hint?: string; details?: string },
) {
  const texto = [error.message, error.hint, error.details]
    .filter(Boolean)
    .join("\n\n");
  window.alert(`${contexto}\n\n${texto || "Erro desconhecido."}`);
}

type LinhaPostagemSupabase = {
  id?: number | string;
  nome?: string | null;
  descricao?: string | null;
  imagem?: string | null;
  tags?: unknown;
  title?: string | null;
  content?: string | null;
  image_url?: string | null;
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
        return tagsDaLinha(parsed);
      }
    } catch {
      /* texto simples separado por virgula */
    }

    return trimmed
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return [];
}

function linhaParaProjeto(linha: LinhaPostagemSupabase): Projeto {
  return {
    id: String(linha.id ?? ""),
    nome: String(linha.nome ?? linha.title ?? ""),
    descricao: String(linha.descricao ?? linha.content ?? ""),
    imagem: String(linha.imagem ?? linha.image_url ?? ""),
    tags: tagsDaLinha(linha.tags),
  };
}

function postagemParaColunas(
  postagem: ProjetoAntesDoSupabase,
  imagemUrl: string | null,
) {
  return {
    nome: postagem.nome,
    descricao: postagem.descricao,
    imagem: imagemUrl,
    tags: postagem.tags,
  };
}

export async function buscarPostagens(): Promise<Projeto[]> {
  const { data, error } = await supabase.from(TABLE_NAME).select("*");

  if (error) {
    console.error("Erro ao buscar postagens", error.message, error);
    return [];
  }

  console.log("Postagens recebidas do Supabase:", data);
  return ((data ?? []) as LinhaPostagemSupabase[]).map(linhaParaProjeto);
}

export async function criarPostagem(postagem: ProjetoAntesDoSupabase) {
  document.querySelector(".formulario-projeto")?.classList.add("enviando");

  try {
    const urlImagem = postagem.imagem ? await enviarImagem(postagem.imagem) : null;

    if (postagem.imagem && !urlImagem) {
      console.error("Não foi possível obter a URL da imagem!");
      return null;
    }

    const postagemParaSalvar = postagemParaColunas(postagem, urlImagem);
    console.log("Enviando postagem para o Supabase:", postagemParaSalvar);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([postagemParaSalvar])
      .select();

    if (error) {
      console.error("Erro ao criar uma nova postagem", error.message, error);
      alertaErroSupabase(
        `Não foi possível criar a postagem na tabela "${TABLE_NAME}". Verifique as policies de RLS no Supabase.`,
        error,
      );
      return null;
    }

    console.log("Postagem criada com sucesso:", data);
    window.location.href = "/";
    return data;
  } finally {
    document.querySelector(".formulario-projeto")?.classList.remove("enviando");
  }
}

export async function enviarImagem(arquivo: File): Promise<string | null> {
  const extFromName = arquivo.name.includes(".")
    ? arquivo.name.split(".").pop()
    : undefined;
  const extFromType = arquivo.type.includes("/")
    ? arquivo.type.split("/").pop()
    : undefined;
  const ext = (extFromName ?? extFromType ?? "bin").replace(/[^a-zA-Z0-9]/g, "");
  const nomeUnico = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext || "bin"}`;

  console.log("Enviando arquivo. nomeOriginal:", arquivo.name, "chaveUsada:", nomeUnico);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(nomeUnico, arquivo, {
      contentType: arquivo.type,
      upsert: false,
    });

  if (error || !data) {
    console.error("Erro ao enviar a imagem", error?.message, error);
    return null;
  }

  return supabase.storage.from(BUCKET_NAME).getPublicUrl(nomeUnico).data.publicUrl;
}

export async function buscarPostagemPorId(id: string): Promise<Projeto | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar o projeto", error.message, error);
    return null;
  }

  return linhaParaProjeto(data as LinhaPostagemSupabase);
}

export async function atualizarPostagem(id: string, novosDados: Projeto) {
  document.querySelector(".formulario-projeto")?.classList.add("enviando");

  const linha = {
    nome: novosDados.nome,
    descricao: novosDados.descricao,
    imagem: novosDados.imagem || null,
    tags: novosDados.tags,
  };

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(linha)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Não foi possível atualizar o projeto:", error.message, error);
      alertaErroSupabase(
        `Não foi possível atualizar a postagem na tabela "${TABLE_NAME}".`,
        error,
      );
      return null;
    }

    window.location.href = "/";
    return data;
  } finally {
    document.querySelector(".formulario-projeto")?.classList.remove("enviando");
  }
}

export async function deletarPostagem(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from(TABLE_NAME)
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar a postagem:", error.message, error);
    return false;
  }

  if ((count ?? 0) < 1) {
    console.error("Nenhuma postagem foi apagada. Verifique o id e as policies de DELETE no RLS.");
    return false;
  }

  return true;
}
