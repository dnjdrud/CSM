-- (B) Daily Prayer thread idempotency: one per day, unique index, app uses is_daily_prayer + daily_prayer_date.

alter table public.posts
  add column if not exists is_daily_prayer boolean not null default false,
  add column if not exists daily_prayer_date date null;

create unique index if not exists idx_posts_daily_prayer_date_unique
  on public.posts (daily_prayer_date)
  where is_daily_prayer = true;

comment on column public.posts.is_daily_prayer is 'True for the single Daily Prayer thread created by admin for that day.';
comment on column public.posts.daily_prayer_date is 'Date (UTC date) for which this post is the Daily Prayer thread; set when is_daily_prayer = true.';
