create extension if not exists pgcrypto;
create table if not exists public.recipes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null,
 description text,
 image_url text,
 ingredients jsonb not null default '[]'::jsonb,
 steps jsonb not null default '[]'::jsonb,
 tags jsonb not null default '[]'::jsonb,
 minutes integer default 30,
 servings integer default 2,
 created_at timestamptz not null default now()
);
alter table public.recipes enable row level security;
create policy "Users can read own recipes" on public.recipes for select using (auth.uid() = user_id);
create policy "Users can insert own recipes" on public.recipes for insert with check (auth.uid() = user_id);
create policy "Users can update own recipes" on public.recipes for update using (auth.uid() = user_id);
create policy "Users can delete own recipes" on public.recipes for delete using (auth.uid() = user_id);
create index if not exists recipes_user_id_idx on public.recipes(user_id);
create index if not exists recipes_created_at_idx on public.recipes(created_at desc);
-- Storage bucket for screenshots. Create a public bucket named recipe-images in Supabase Storage UI,
-- or make it private and replace the public image URLs with signed URLs in the app.
