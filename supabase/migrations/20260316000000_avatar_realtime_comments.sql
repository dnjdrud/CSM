-- Add avatar_url to users
alter table public.users add column if not exists avatar_url text;

-- Enable Realtime for comments table
alter publication supabase_realtime add table public.comments;

-- Storage bucket for avatars (public read, authenticated write)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy if not exists "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy if not exists "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy if not exists "avatars_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');
