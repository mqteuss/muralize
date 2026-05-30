-- Muralize - Supabase schema
-- Execute este SQL no Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 500),
  date timestamptz not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  is_public boolean not null default true
);

create index if not exists events_public_date_idx
  on public.events (is_public, date asc);

alter table public.events enable row level security;

drop policy if exists "Eventos públicos podem ser lidos" on public.events;
drop policy if exists "Admin pode criar eventos" on public.events;
drop policy if exists "Admin pode atualizar eventos" on public.events;
drop policy if exists "Admin pode excluir eventos" on public.events;

create policy "Eventos públicos podem ser lidos"
  on public.events
  for select
  using (is_public = true);

create policy "Admin pode criar eventos"
  on public.events
  for insert
  to authenticated
  with check (
    auth.jwt() ->> 'email' = 'mh.umateus@gmail.com'
    and author_id = auth.uid()
    and is_public = true
  );

create policy "Admin pode atualizar eventos"
  on public.events
  for update
  to authenticated
  using (auth.jwt() ->> 'email' = 'mh.umateus@gmail.com')
  with check (
    auth.jwt() ->> 'email' = 'mh.umateus@gmail.com'
    and author_id = auth.uid()
    and is_public = true
  );

create policy "Admin pode excluir eventos"
  on public.events
  for delete
  to authenticated
  using (auth.jwt() ->> 'email' = 'mh.umateus@gmail.com');

-- Realtime: no Supabase Dashboard, habilite Realtime para a tabela public.events
-- em Database > Replication, se quiser atualização instantânea entre abas/dispositivos.
