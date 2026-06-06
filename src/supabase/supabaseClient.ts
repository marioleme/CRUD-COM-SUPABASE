import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const chaveApi = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl?.trim() || !chaveApi?.trim()) {
  throw new Error(
    "Faltam VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY. " +
      "Crie ou edite .env.local na raiz do projeto com esses nomes (prefixo VITE_ é obrigatório no Vite) e reinicie o servidor de desenvolvimento.",
  );
}

export const supabase = createClient(supabaseUrl, chaveApi);