-- Support / fintech tables

-- ministries (move from hardcoded mock to DB)
create table if not exists public.ministries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  location text,
  support_account text,       -- optional bank transfer info
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.ministries enable row level security;

drop policy if exists "Anyone authenticated can view active ministries" on public.ministries;
create policy "Anyone authenticated can view active ministries"
  on public.ministries for select
  to authenticated
  using (active = true);

-- Seed: Nairobi Community Initiative
insert into public.ministries (id, name, description, location, support_account)
values (
  '00000000-0000-0000-0000-000000000001',
  'Nairobi Community Initiative',
  'Local leadership development and community health.',
  'Nairobi, Kenya',
  null
)
on conflict (id) do nothing;


-- support_intents
create table if not exists public.support_intents (
  id uuid primary key default gen_random_uuid(),
  ministry_id uuid not null references public.ministries(id) on delete cascade,
  donor_id uuid references public.users(id) on delete set null, -- nullable: anonymous OK
  purpose text not null check (purpose in ('ONGOING','PROJECT','URGENT')),
  amount_krw int not null check (amount_krw >= 1000),
  status text not null default 'PENDING'
    check (status in ('PENDING','COMPLETED','FAILED','CANCELLED')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_intents enable row level security;

-- Donor can view own intents; admins can view all (handled via admin client in API)
drop policy if exists "Donor can view own intent" on public.support_intents;
create policy "Donor can view own intent"
  on public.support_intents for select
  to authenticated
  using (donor_id = auth.uid());

drop policy if exists "Authenticated can insert intent" on public.support_intents;
create policy "Authenticated can insert intent"
  on public.support_intents for insert
  to authenticated
  with check (donor_id = auth.uid() or donor_id is null);


-- support_transactions
create table if not exists public.support_transactions (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid not null references public.support_intents(id) on delete cascade,
  provider text not null default 'TOSS',
  provider_payment_id text,          -- paymentKey from Toss
  provider_order_id text,            -- orderId (= intent.id)
  amount_krw int not null,
  status text not null,              -- DONE | CANCELLED | PARTIAL_CANCELLED
  raw_response jsonb,
  created_at timestamptz not null default now()
);

alter table public.support_transactions enable row level security;

drop policy if exists "Donor can view own transaction" on public.support_transactions;
create policy "Donor can view own transaction"
  on public.support_transactions for select
  to authenticated
  using (
    exists (
      select 1 from public.support_intents i
      where i.id = support_transactions.intent_id and i.donor_id = auth.uid()
    )
  );

-- updated_at trigger for support_intents
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_support_intents_updated_at on public.support_intents;
create trigger set_support_intents_updated_at
  before update on public.support_intents
  for each row execute function public.set_updated_at();
