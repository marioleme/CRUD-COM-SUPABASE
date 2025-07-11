import { Projeto } from "../tipagem/Projeto";
import { ProjetoAntesDoSupabase } from "../tipagem/ProjetoAntesDoSupabase";
import { supabase } from "./supabaseClient";

export function buscarPostagens() {
  return supabase
    .from("Publicação")
    .select("*")
    .then(({ data, error }) => {
      if (error) {
        console.error("Erro ao buscar postagens", error.message);
        return [];
      }

      return data;
    });
}

export function criarPostagem(postagem: ProjetoAntesDoSupabase) {
  document.querySelector(".formulario-projeto")?.classList.add("enviando");
  if (postagem.imagem) {
    return enviarImagem(postagem.imagem).then((urlImagem) => {
      if (!urlImagem) {
        console.error("Não foi possível obter a URL da imagem!");
        return null;
      }

      const postagemComImagem = {
        ...postagem,
        imagem: urlImagem,
      };
      console.log("imagem", urlImagem);

      return supabase
        .from("Publicação")
        .insert([postagemComImagem])
        .then(({ data, error }) => {
          if (error) {
            console.error("Erro ao criar uma nova postagem", error.message);
            return null;
          }
          if (urlImagem !== null || urlImagem !== "") {
            console.log("Postagem criada com sucesso:", data);
            document
              .querySelector(".formulario-projeto")
              ?.classList.remove("enviando");
            alert("Imagem enviada e postagem criada com sucesso!");
            window.location.href = "/";
            return data;
          }
        });
    });
  }
}

export function enviarImagem(arquivo: File) {
  const nomeUnico = `${Date.now()}-${arquivo.name}`;
  return supabase.storage
    .from("imagens")
    .upload(nomeUnico, arquivo)
    .then(({ data, error }) => {
      if (error || !data) {
        console.error("Erro ao enviar a imagem");
        return null;
      }

      const { publicUrl } = supabase.storage
        .from("imagens")
        .getPublicUrl(nomeUnico).data;

      return publicUrl;
    });
}

export function buscarPostagemPorId(id: string) {
  return supabase
    .from("Publicação")
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
    .from("Publicação")
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
    .from("Publicação")
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
