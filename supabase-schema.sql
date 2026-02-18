-- ============================================================
-- ITProManager — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────────────────────────
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null unique,
  full_name   text,
  role        text default 'IT Project Manager',
  country     text default 'Other',
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Admin can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── PROJECTS ──────────────────────────────────────────────
create table public.projects (
  id          uuid default uuid_generate_v4() primary key,
  owner_id    uuid references public.profiles(id) on delete cascade not null,
  name        text not null,
  description text,
  status      text default 'active' check (status in ('active','completed','on_hold','cancelled')),
  progress    integer default 0 check (progress >= 0 and progress <= 100),
  start_date  date,
  end_date    date,
  color       text default '#00d4ff',
  created_at  timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Users can manage own projects"
  on public.projects for all using (auth.uid() = owner_id);

-- ── TASKS ─────────────────────────────────────────────────
create table public.tasks (
  id           uuid default uuid_generate_v4() primary key,
  project_id   uuid references public.projects(id) on delete cascade not null,
  title        text not null,
  description  text,
  status       text default 'backlog' check (status in ('backlog','in_progress','review','blocked','done')),
  priority     text default 'medium' check (priority in ('low','medium','high','critical')),
  assignee_id  uuid references public.profiles(id) on delete set null,
  assignee_name text,
  tags         text[] default '{}',
  due_date     date,
  position     integer default 0,
  created_at   timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Users can manage tasks in own projects"
  on public.tasks for all using (
    exists (select 1 from public.projects where id = tasks.project_id and owner_id = auth.uid())
  );

-- ── KNOWLEDGE BASE ────────────────────────────────────────
create table public.kb_articles (
  id         uuid default uuid_generate_v4() primary key,
  author_id  uuid references public.profiles(id) on delete cascade not null,
  title      text not null,
  content    text,
  category   text default 'General',
  tags       text[] default '{}',
  views      integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.kb_articles enable row level security;

create policy "All authenticated users can view KB"
  on public.kb_articles for select using (auth.role() = 'authenticated');

create policy "Users can manage own KB articles"
  on public.kb_articles for all using (auth.uid() = author_id);

-- ── SEED: Sample project for new users ───────────────────
-- (Optional) Insert a demo project after first login via app logic
