-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Allow all authenticated users to read profiles
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

-- Allow users to insert their own profile (usually handled by trigger, but good to have)
create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

-- Allow users to update own profile
create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Create a trigger to automatically create a profile entry when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill existing users into profiles (Run this manually if needed, or include here)
-- Note: This requires privileges to read auth.users which standard SQL editor might not have directly 
-- without specific setup, but usually works in Supabase SQL editor.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- Update cards RLS to allow viewing other users' cards
-- First, drop the old policy
drop policy if exists "Users can view their own cards" on public.cards;

-- Create new policy allowing anyone to view cards (or just authenticated)
create policy "Cards are viewable by everyone"
  on public.cards for select
  using ( true );
