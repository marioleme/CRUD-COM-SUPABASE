-- Coluna para as tags do formulário (array de strings em JSON).
-- Executa no SQL Editor do Supabase. Se a tabela não se chamar `posts`, altera o nome.

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.posts.tags IS 'Lista de tags; o cliente envia array JSON, ex.: ["react","vite"].';
