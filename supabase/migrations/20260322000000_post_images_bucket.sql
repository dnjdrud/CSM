-- Storage bucket for post images (public read, authenticated write).
-- Mirrors the avatars bucket pattern.
-- Uses DO blocks for policy creation to support PostgreSQL < 16.

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Authenticated users can upload to their own folder: posts/{userId}/...
do $$ begin
  if not exists (
    select from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'post_images_insert_own'
  ) then
    create policy "post_images_insert_own"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'post-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;

-- Authenticated users can delete their own uploads
do $$ begin
  if not exists (
    select from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'post_images_delete_own'
  ) then
    create policy "post_images_delete_own"
      on storage.objects for delete
      to authenticated
      using (
        bucket_id = 'post-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;

-- Public read access (images in posts are public)
do $$ begin
  if not exists (
    select from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'post_images_select_public'
  ) then
    create policy "post_images_select_public"
      on storage.objects for select
      to public
      using (bucket_id = 'post-images');
  end if;
end $$;
