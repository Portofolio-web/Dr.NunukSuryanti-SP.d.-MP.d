-- ============================================================
--  SETUP SUPABASE DATABASE — Website Tri Dharma
--  Jalankan script ini di: Supabase Dashboard → SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
--  1. TABEL: kriteria_config
--     Menyimpan konfigurasi kategori (Pendidikan, Penelitian, dll.)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kriteria_config (
  id         TEXT PRIMARY KEY,          -- contoh: "edu", "res", "srv"
  label      TEXT NOT NULL,             -- contoh: "Pendidikan"
  icon       TEXT DEFAULT 'ri-folder-line',
  fields     JSONB DEFAULT '[]',        -- array field ids: ["photo","file","desc"]
  built_in   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
--  2. TABEL: kriteria_contents
--     Menyimpan setiap item konten (per kategori)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kriteria_contents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kriteria_id TEXT NOT NULL REFERENCES public.kriteria_config(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT '',
  "desc"      TEXT DEFAULT '',
  link        TEXT DEFAULT '',
  doi         TEXT DEFAULT '',
  year        TEXT DEFAULT '',
  mitra       TEXT DEFAULT '',
  course      TEXT DEFAULT '',
  teacher     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query cepat berdasarkan kriteria
CREATE INDEX IF NOT EXISTS idx_kriteria_contents_kriteria_id
  ON public.kriteria_contents(kriteria_id);

CREATE INDEX IF NOT EXISTS idx_kriteria_contents_created_at
  ON public.kriteria_contents(created_at DESC);

-- ────────────────────────────────────────────────────────────
--  3. TABEL: content_media
--     Menyimpan file/foto yang terhubung ke konten
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content_media (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.kriteria_contents(id) ON DELETE CASCADE,
  file_url   TEXT NOT NULL,
  file_type  TEXT NOT NULL CHECK (file_type IN ('image', 'document')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query media berdasarkan content
CREATE INDEX IF NOT EXISTS idx_content_media_content_id
  ON public.content_media(content_id);

-- ────────────────────────────────────────────────────────────
--  4. ROW LEVEL SECURITY (RLS)
--     Izinkan semua operasi (read & write) via anon key
--     karena dashboard menggunakan localStorage login, bukan Supabase Auth
-- ────────────────────────────────────────────────────────────

-- Aktifkan RLS
ALTER TABLE public.kriteria_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kriteria_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_media     ENABLE ROW LEVEL SECURITY;

-- Policy: izinkan semua untuk anon (public website)
CREATE POLICY "Allow all for anon - kriteria_config"
  ON public.kriteria_config
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for anon - kriteria_contents"
  ON public.kriteria_contents
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for anon - content_media"
  ON public.content_media
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
--  5. DATA AWAL: 3 Kriteria Default (Pendidikan, Penelitian, Pengabdian)
--     Hanya insert jika tabel masih kosong
-- ────────────────────────────────────────────────────────────
INSERT INTO public.kriteria_config (id, label, icon, fields, built_in)
SELECT * FROM (VALUES
  ('edu', 'Pendidikan', 'ri-book-open-line',    '["photo","file","course","teacher","desc"]'::jsonb,  true),
  ('res', 'Penelitian', 'ri-flask-line',         '["photo","link","doi","year","course","teacher","desc"]'::jsonb, true),
  ('srv', 'Pengabdian', 'ri-building-4-line',    '["photo","mitra","course","teacher","desc"]'::jsonb, true)
) AS t(id, label, icon, fields, built_in)
WHERE NOT EXISTS (SELECT 1 FROM public.kriteria_config LIMIT 1);

-- ────────────────────────────────────────────────────────────
--  6. STORAGE BUCKET: Sitedata
--     Buat bucket untuk upload foto & file
-- ────────────────────────────────────────────────────────────

-- Buat bucket (jalankan jika belum ada)
INSERT INTO storage.buckets (id, name, public)
VALUES ('Sitedata', 'Sitedata', true)
ON CONFLICT (id) DO NOTHING;

-- Policy storage: izinkan upload & read untuk semua
CREATE POLICY "Allow public read - Sitedata"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'Sitedata');

CREATE POLICY "Allow upload - Sitedata"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'Sitedata');

CREATE POLICY "Allow delete - Sitedata"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'Sitedata');

-- ────────────────────────────────────────────────────────────
--  SELESAI!
--  Verifikasi: Cek tabel di Supabase → Table Editor
--  dan Storage → Buckets (pastikan "Sitedata" muncul)
-- ────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────
--  7. TABEL: admin_profile
--     Menyimpan profil pemilik website untuk sinkronisasi publik
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_profile (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE, -- Menghubungkan ke auth.users
  name       TEXT DEFAULT 'Nama Pemilik Website',
  degree     TEXT DEFAULT 'Gelar Akademik / Jabatan',
  bio        TEXT DEFAULT '',
  email      TEXT DEFAULT '',
  wa         TEXT DEFAULT '',
  fb         TEXT DEFAULT '',
  avatar     TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.admin_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read - admin_profile"
  ON public.admin_profile
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all for authenticated - admin_profile"
  ON public.admin_profile
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

