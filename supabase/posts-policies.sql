-- Policies mínimas para esta aplicação, que atualmente não exige login.
-- Execute no SQL Editor do projeto Supabase usado em produção.
-- Se a aplicação passar a ter autenticação, substitua USING/WITH CHECK (true)
-- por regras baseadas em auth.uid() e em uma coluna author_id.

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_public_read" ON public.posts;
DROP POLICY IF EXISTS "posts_public_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_public_update" ON public.posts;
DROP POLICY IF EXISTS "posts_public_delete" ON public.posts;

CREATE POLICY "posts_public_read"
ON public.posts FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "posts_public_insert"
ON public.posts FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "posts_public_update"
ON public.posts FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "posts_public_delete"
ON public.posts FOR DELETE
TO anon, authenticated
USING (true);
