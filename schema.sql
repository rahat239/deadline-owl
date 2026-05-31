-- Run this in Supabase SQL Editor

-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  company_name text,
  industry text,
  country text,
  plan text default 'free' check (plan in ('free','pro','enterprise')),
  email_alerts boolean default true,
  created_at timestamptz default now()
);

-- Deadlines table (user-added custom deadlines)
create table if not exists deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  due_date date not null,
  category text default 'other',
  jurisdiction text,
  status text default 'upcoming' check (status in ('upcoming','completed','missed')),
  alert_30d boolean default true,
  alert_14d boolean default true,
  alert_7d boolean default true,
  alert_1d boolean default true,
  created_at timestamptz default now()
);

-- Alert log (track which alerts have been sent)
create table if not exists alert_logs (
  id uuid primary key default gen_random_uuid(),
  deadline_id uuid references deadlines(id) on delete cascade,
  days_before integer not null,
  sent_at timestamptz default now()
);

-- Indexes
create index if not exists deadlines_user_id_idx on deadlines(user_id);
create index if not exists deadlines_due_date_idx on deadlines(due_date);
create index if not exists alert_logs_deadline_id_idx on alert_logs(deadline_id);

-- Row Level Security
alter table users enable row level security;
alter table deadlines enable row level security;
alter table alert_logs enable row level security;

create policy "users manage own deadlines" on deadlines for all using (user_id = (select id from users where id::text = auth.uid()::text));
