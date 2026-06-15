-- =============================================
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Albums table
create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_image_url text,
  created_at timestamptz default now()
);

-- 2. Photos table
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references albums(id) on delete cascade,
  url text not null,
  caption text,
  order_index int default 0,
  created_at timestamptz default now()
);

-- 3. Enable Row Level Security
alter table albums enable row level security;
alter table photos enable row level security;

-- 4. Public read access (anyone can view)
create policy "Public read albums" on albums
  for select using (true);

create policy "Public read photos" on photos
  for select using (true);

-- 5. Admin write access (only authenticated users)
create policy "Auth insert albums" on albums
  for insert with check (auth.role() = 'authenticated');

create policy "Auth update albums" on albums
  for update using (auth.role() = 'authenticated');

create policy "Auth delete albums" on albums
  for delete using (auth.role() = 'authenticated');

create policy "Auth insert photos" on photos
  for insert with check (auth.role() = 'authenticated');

create policy "Auth update photos" on photos
  for update using (auth.role() = 'authenticated');

create policy "Auth delete photos" on photos
  for delete using (auth.role() = 'authenticated');

-- =============================================
-- Storage setup (run after creating bucket)
-- =============================================

-- Create bucket via Supabase Dashboard:
-- Storage → New bucket → name: "photos" → Public: ON

-- Then run these policies:
create policy "Public read photos storage" on storage.objects
  for select using (bucket_id = 'photos');

create policy "Auth upload photos storage" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "Auth delete photos storage" on storage.objects
  for delete using (bucket_id = 'photos' and auth.role() = 'authenticated');


-- =============================================
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Albums table
create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_image_url text,
  created_at timestamptz default now()
);

-- 2. Photos table
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references albums(id) on delete cascade,
  url text not null,
  caption text,
  order_index int default 0,
  created_at timestamptz default now()
);

-- 3. Enable Row Level Security
alter table albums enable row level security;
alter table photos enable row level security;

-- 4. Public read access (anyone can view)
create policy "Public read albums" on albums
  for select using (true);

create policy "Public read photos" on photos
  for select using (true);

-- 5. Admin write access (only authenticated users)
create policy "Auth insert albums" on albums
  for insert with check (auth.role() = 'authenticated');

create policy "Auth update albums" on albums
  for update using (auth.role() = 'authenticated');

create policy "Auth delete albums" on albums
  for delete using (auth.role() = 'authenticated');

create policy "Auth insert photos" on photos
  for insert with check (auth.role() = 'authenticated');

create policy "Auth update photos" on photos
  for update using (auth.role() = 'authenticated');

create policy "Auth delete photos" on photos
  for delete using (auth.role() = 'authenticated');

-- =============================================
-- Storage setup (run after creating bucket)
-- =============================================

-- Create bucket via Supabase Dashboard:
-- Storage → New bucket → name: "photos" → Public: ON

-- Then run these policies:
create policy "Public read photos storage" on storage.objects
  for select using (bucket_id = 'photos');

create policy "Auth upload photos storage" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "Auth delete photos storage" on storage.objects
  for delete using (bucket_id = 'photos' and auth.role() = 'authenticated');


alter table photos add column x float default 0;
alter table photos add column y float default 0;
alter table photos add column width float default 300;
alter table photos add column height float default 200;