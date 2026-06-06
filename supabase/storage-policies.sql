-- =============================================================================
-- Storage: corrigir RLS no upload (erro "new row violates row-level security")
-- Supabase → SQL Editor. O bucket_id nas policies é o UUID em storage.buckets.id
-- =============================================================================

-- 1) Diagnóstico: copia o "id" (UUID) da linha do bucket que usas na app (ex.: post-images)
select id, name, public
from storage.buckets
order by name;

-- 2) Policies atuais em storage.objects
select policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

-- 3) Remove policies com estes nomes (ajusta os nomes se já tiveres outras)
drop policy if exists "post_images_public_read" on storage.objects;
drop policy if exists "post_images_public_insert" on storage.objects;
drop policy if exists "post_images_anon_read" on storage.objects;
drop policy if exists "post_images_anon_insert" on storage.objects;
drop policy if exists "post_images_read" on storage.objects;
drop policy if exists "post_images_insert" on storage.objects;

-- 4) Cria policies (sem "TO ..." = aplica-se a todos os roles, incl. anon)
--    Troca 'post-images' pelo name exato do bucket se for diferente.

create policy "post_images_read"
on storage.objects
for select
using (
  bucket_id = (select id from storage.buckets where name = 'post-images' limit 1)
);

create policy "post_images_insert"
on storage.objects
for insert
with check (
  bucket_id = (select id from storage.buckets where name = 'post-images' limit 1)
);

-- 5) Se o passo 4 ainda falhar: substitui o UUID abaixo pelo "id" do passo 1
--    e descomenta estas duas policies (e comenta ou apaga as do passo 4).

-- drop policy if exists "post_images_read" on storage.objects;
-- drop policy if exists "post_images_insert" on storage.objects;
-- create policy "post_images_read_by_id" on storage.objects for select
--   using (bucket_id = 'COLE-AQUI-O-UUID-DO-BUCKET');
-- create policy "post_images_insert_by_id" on storage.objects for insert
--   with check (bucket_id = 'COLE-AQUI-O-UUID-DO-BUCKET');

-- 6) Teste extremo (só para ver se o bloqueio é mesmo o storage.objects):
--    executa, testa upload, depois APAGA esta policy.
-- create policy "post_images_dev_insert_any" on storage.objects for insert with check (true);
