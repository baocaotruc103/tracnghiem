-- Run this in your Supabase SQL Editor

-- 1. Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. Trigger for new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Create questions table (if not exists)
create table if not exists public.questions (
  id serial primary key,
  cau_hoi text not null,
  noi_dung text not null,
  "A" text,
  "B" text,
  "C" text,
  "D" text,
  dap_an text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.questions enable row level security;

create policy "Questions are viewable by everyone."
  on questions for select
  using ( true );

-- 4. Create test_attempts table
create table public.test_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  score integer not null,
  total_questions integer not null,
  answers_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.test_attempts enable row level security;

create policy "Test attempts viewable by everyone (for dashboard stats)."
  on test_attempts for select
  using ( true );

create policy "Users can insert their own attempts."
  on test_attempts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own attempts."
  on test_attempts for update
  using ( auth.uid() = user_id );
