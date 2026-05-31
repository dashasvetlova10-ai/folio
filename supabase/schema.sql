-- Run this in your Supabase SQL editor

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  content text not null default '',
  mood text,
  date date not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- One entry per user per day
create unique index entries_user_date_idx on public.entries(user_id, date);

-- Row Level Security: users can only access their own entries
alter table public.entries enable row level security;

create policy "Users can manage their own entries"
  on public.entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
