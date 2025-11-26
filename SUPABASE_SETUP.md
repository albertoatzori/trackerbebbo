# Supabase Setup

## 1. Database Schema

Run the following SQL query in your Supabase SQL Editor to create the `cards` table:

```sql
create table public.cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  pokemon_id int not null,
  image_urls text[] default array[]::text[],
  cover_image_index int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, pokemon_id)
);

-- Enable Row Level Security
alter table public.cards enable row level security;

-- Create Policies
create policy "Users can view their own cards"
  on public.cards for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own cards"
  on public.cards for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own cards"
  on public.cards for update
  using ( auth.uid() = user_id );
```

## 2. Storage Setup

1.  Go to **Storage** in the Supabase Dashboard.
2.  Create a new bucket named `pokemon-cards`.
3.  Make sure the bucket is **Public**.
4.  Add the following policies to the `pokemon-cards` bucket:

**Policy 1: Allow Public Read**
- Allowed operations: `SELECT`
- Target roles: `anon`, `authenticated`
- Bucket name: `pokemon-cards`

**Policy 2: Allow Authenticated Uploads**
- Allowed operations: `INSERT`
- Target roles: `authenticated`
- Bucket name: `pokemon-cards`
- Folder path: `*` (or leave empty)

## 3. Environment Variables

Create a `.env` file in the root of your project with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
