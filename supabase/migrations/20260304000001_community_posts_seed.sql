-- Optional seed: 2 sample posts for community feed (one with YouTube, one text-only).
-- Run only in dev or after ensuring public.users has at least one row.
-- author_id uses first existing user; adjust or remove if not needed.

insert into public.posts (
  author_id,
  category,
  content,
  title,
  visibility,
  tags,
  youtube_id,
  thumbnail_url,
  created_at,
  updated_at
)
select
  u.id,
  'PRAYER',
  '오늘 읽은 책 내용을 나눕니다. 위로와 도전이 되었어요.',
  '독서 후기',
  'MEMBERS',
  array['독서', '후기'],
  null,
  null,
  now() - interval '2 days',
  now() - interval '2 days'
from (select id from public.users limit 1) u
where not exists (select 1 from public.posts where title = '독서 후기' and youtube_id is null)
limit 1;

insert into public.posts (
  author_id,
  category,
  content,
  title,
  visibility,
  tags,
  youtube_id,
  thumbnail_url,
  created_at,
  updated_at
)
select
  u.id,
  'PRAYER',
  '함께 중보기도 부탁드립니다.',
  '중보기도 요청',
  'MEMBERS',
  array['중보기도'],
  'dQw4w9WgXcQ',
  null,
  now() - interval '1 day',
  now() - interval '1 day'
from (select id from public.users limit 1) u
where not exists (select 1 from public.posts where title = '중보기도 요청' and youtube_id = 'dQw4w9WgXcQ')
limit 1;
