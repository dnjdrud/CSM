-- 사용자 후원 링크 컬럼 추가
alter table public.users
  add column if not exists support_url text;
