-- Run this entire file in your Supabase SQL editor
-- supabase.com → your project → SQL Editor → New Query → paste → Run

-- ─── Projects ────────────────────────────────────────────────────────────────
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  description text,
  address text,
  status text default 'active' check (status in ('active', 'on_hold', 'completed')),
  owner_id uuid references auth.users(id) on delete cascade not null
);

alter table public.projects enable row level security;

create policy "Users manage own projects"
  on public.projects for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ─── Team Members ─────────────────────────────────────────────────────────────
create table public.team_members (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  email text,
  role text default 'viewer' check (role in ('owner', 'admin', 'viewer'))
);

alter table public.team_members enable row level security;

create policy "Project owners manage team"
  on public.team_members for all
  using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- ─── Drawings ────────────────────────────────────────────────────────────────
create table public.drawings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  drawing_number text,
  discipline text default 'Architectural',
  current_revision text default 'A',
  file_url text,
  uploaded_by uuid references auth.users(id)
);

alter table public.drawings enable row level security;

create policy "Project owners manage drawings"
  on public.drawings for all
  using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- ─── Drawing Revisions ────────────────────────────────────────────────────────
create table public.drawing_revisions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  drawing_id uuid references public.drawings(id) on delete cascade not null,
  revision text not null,
  file_url text,
  notes text,
  uploaded_by uuid references auth.users(id)
);

alter table public.drawing_revisions enable row level security;

create policy "Project owners manage revisions"
  on public.drawing_revisions for all
  using (
    exists (
      select 1 from public.drawings d
      join public.projects p on p.id = d.project_id
      where d.id = drawing_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.drawings d
      join public.projects p on p.id = d.project_id
      where d.id = drawing_id and p.owner_id = auth.uid()
    )
  );

-- ─── RFIs ────────────────────────────────────────────────────────────────────
create table public.rfis (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  rfi_number integer not null,
  subject text not null,
  description text,
  status text default 'open' check (status in ('open', 'answered', 'closed')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  assigned_to text,
  due_date date,
  answer text,
  answered_at timestamptz,
  created_by uuid references auth.users(id)
);

alter table public.rfis enable row level security;

create policy "Project owners manage RFIs"
  on public.rfis for all
  using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- ─── Daily Logs ───────────────────────────────────────────────────────────────
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  log_date date not null,
  weather text,
  workers_on_site integer default 0,
  work_completed text,
  issues text,
  materials_delivered text,
  created_by uuid references auth.users(id)
);

alter table public.daily_logs enable row level security;

create policy "Project owners manage logs"
  on public.daily_logs for all
  using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );
