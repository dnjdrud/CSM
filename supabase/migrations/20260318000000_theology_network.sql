-- =============================================================
-- Theology Q&A
-- =============================================================
create table if not exists public.theology_questions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  title      text not null,
  content    text not null,
  category   text not null default 'GENERAL',
  created_at timestamptz not null default now()
);

create table if not exists public.theology_answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.theology_questions(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  content     text not null,
  is_accepted boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.theology_answer_votes (
  id         uuid primary key default gen_random_uuid(),
  answer_id  uuid not null references public.theology_answers(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (answer_id, user_id)
);

-- =============================================================
-- RLS
-- =============================================================
alter table public.theology_questions    enable row level security;
alter table public.theology_answers      enable row level security;
alter table public.theology_answer_votes enable row level security;

-- theology_questions
drop policy if exists "tq_select" on public.theology_questions;
create policy "tq_select"
  on public.theology_questions for select to authenticated using (true);

drop policy if exists "tq_insert" on public.theology_questions;
create policy "tq_insert"
  on public.theology_questions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "tq_update" on public.theology_questions;
create policy "tq_update"
  on public.theology_questions for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "tq_delete" on public.theology_questions;
create policy "tq_delete"
  on public.theology_questions for delete to authenticated
  using (user_id = auth.uid());

-- theology_answers
drop policy if exists "ta_select" on public.theology_answers;
create policy "ta_select"
  on public.theology_answers for select to authenticated using (true);

drop policy if exists "ta_insert" on public.theology_answers;
create policy "ta_insert"
  on public.theology_answers for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "ta_update" on public.theology_answers;
create policy "ta_update"
  on public.theology_answers for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "ta_delete" on public.theology_answers;
create policy "ta_delete"
  on public.theology_answers for delete to authenticated
  using (user_id = auth.uid());

-- theology_answer_votes
drop policy if exists "tav_select" on public.theology_answer_votes;
create policy "tav_select"
  on public.theology_answer_votes for select to authenticated using (true);

drop policy if exists "tav_insert" on public.theology_answer_votes;
create policy "tav_insert"
  on public.theology_answer_votes for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "tav_delete" on public.theology_answer_votes;
create policy "tav_delete"
  on public.theology_answer_votes for delete to authenticated
  using (user_id = auth.uid());
