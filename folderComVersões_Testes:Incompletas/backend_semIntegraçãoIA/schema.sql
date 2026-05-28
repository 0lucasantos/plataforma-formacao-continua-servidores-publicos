-- =============================================================
-- Plataforma de Formação Contínua — Supabase Schema
-- Rodar no SQL Editor do painel do Supabase
-- =============================================================

-- Tabela de usuários (estende auth.users do Supabase)
create table public.users (
  id         uuid references auth.users(id) on delete cascade primary key,
  email      text not null,
  secretaria text not null default '',
  role       text not null default 'servidor' check (role in ('servidor', 'admin')),
  created_at timestamp with time zone default now()
);

-- Tabela de cursos
create table public.courses (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  published   boolean not null default false,
  created_at  timestamp with time zone default now()
);

-- Tabela de módulos (perguntas embutidas em JSON)
create table public.modules (
  id        uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title     text not null,
  "order"   integer not null default 0,
  content   text not null default '',
  questions jsonb not null default '[]',
  created_at timestamp with time zone default now()
);

-- Tabela de progresso
create table public.progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users(id) on delete cascade not null,
  module_id    uuid references public.modules(id) on delete cascade not null,
  quiz_score   integer,
  completed_at timestamp with time zone default now(),
  unique(user_id, module_id)
);

-- =============================================================
-- Row Level Security (RLS)
-- =============================================================

alter table public.users    enable row level security;
alter table public.courses  enable row level security;
alter table public.modules  enable row level security;
alter table public.progress enable row level security;

-- Users
create policy "usuario ve proprio perfil" on public.users
  for select using (auth.uid() = id);

create policy "usuario atualiza proprio perfil" on public.users
  for update using (auth.uid() = id);

create policy "admin ve todos usuarios" on public.users
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Courses
create policy "autenticado ve cursos publicados" on public.courses
  for select using (auth.role() = 'authenticated' and published = true);

create policy "admin gerencia cursos" on public.courses
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Modules
create policy "autenticado ve modulos de cursos publicados" on public.modules
  for select using (
    auth.role() = 'authenticated' and
    exists (select 1 from public.courses where id = course_id and published = true)
  );

create policy "admin gerencia modulos" on public.modules
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Progress
create policy "usuario ve proprio progresso" on public.progress
  for select using (auth.uid() = user_id);

create policy "usuario insere proprio progresso" on public.progress
  for insert with check (auth.uid() = user_id);

create policy "usuario atualiza proprio progresso" on public.progress
  for update using (auth.uid() = user_id);

create policy "admin ve todo progresso" on public.progress
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- =============================================================
-- Trigger: cria perfil automaticamente ao cadastrar usuário
-- =============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================
-- Para promover um usuário a admin (rodar manualmente)
-- update public.users set role = 'admin' where email = 'seu@email.com';
-- =============================================================
