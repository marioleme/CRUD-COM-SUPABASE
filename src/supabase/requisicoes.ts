import { Projeto } from "../tipagem/Projeto";
import { ProjetoAntesDoSupabase } from "../tipagem/ProjetoAntesDoSupabase";
import { supabase } from "./supabaseClient";

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

      return data;
    });
}

export function atualizarPostagem(id: string, novosDados: Projeto) {
  document.querySelector(".formulario-projeto")?.classList.add("enviando");
  return supabase
    .from("postagens")
    .update(novosDados)
    .eq("id", id)
    .then(({ data, error }) => {
      if (error) {
        console.error("Não foi possível atualizar o projeto");
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

      return data;
    });
}
