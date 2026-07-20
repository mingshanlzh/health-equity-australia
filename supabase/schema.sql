-- ============================================================================
-- Health Equity Australasia — Supabase schema (v2, full rebuild)
-- Run this whole script in the Supabase SQL editor. It TEARS DOWN the old
-- v1 schema and creates the new one. Idempotent: safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. TEARDOWN of v1 objects
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public_profiles;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS research_items CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS seminar_registrations CASCADE;
DROP TABLE IF EXISTS member_highlights CASCADE;
DROP TABLE IF EXISTS noticeboard_items CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS feedback_messages CASCADE;
DROP TABLE IF EXISTS committee_members CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS seminars CASCADE;
DROP TABLE IF EXISTS guest_accounts CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_member_or_admin() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'pending'
    CHECK (role IN ('admin', 'member', 'pending', 'rejected')),
  affiliation TEXT,
  position TEXT,
  country TEXT,
  bio TEXT,
  research_interests TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  website TEXT,
  orcid TEXT,
  twitter TEXT,
  linkedin TEXT,
  avatar_url TEXT,
  show_in_directory BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Helper functions (SECURITY DEFINER bypasses RLS -> no policy recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_member_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','member')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Create a profile automatically on signup; auto-promote known admin emails.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN lower(NEW.email) IN ('shan.jiang@mq.edu.au', 'mingshan1018@gmail.com')
        THEN 'admin'
      ELSE 'pending'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Non-admins must never change their own role.
CREATE OR REPLACE FUNCTION enforce_role_protection()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can change roles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_role_protection ON profiles;
CREATE TRIGGER trg_role_protection
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_role_protection();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
CREATE POLICY "profiles_select_self" ON profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid() AND role = 'pending');

DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- Public, safe-column view of approved members (owner view bypasses RLS by
-- design: it exposes ONLY non-sensitive columns of opted-in members).
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
  SELECT id, display_name, affiliation, position, country, bio,
         research_interests, website, orcid, twitter, linkedin,
         avatar_url, created_at
  FROM profiles
  WHERE role IN ('admin', 'member') AND show_in_directory;
GRANT SELECT ON public_profiles TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. SEMINARS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seminars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  speaker TEXT,
  speaker_affiliation TEXT,
  abstract TEXT,
  starts_at TIMESTAMPTZ,
  location TEXT,
  join_url TEXT,
  recording_url TEXT,
  slides_url TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_seminars_starts_at ON seminars(starts_at);

ALTER TABLE seminars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seminars_select_public" ON seminars;
CREATE POLICY "seminars_select_public" ON seminars FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "seminars_admin_write" ON seminars;
CREATE POLICY "seminars_admin_write" ON seminars
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 3. POSTS (blog + noticeboard) and COMMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT,
  kind TEXT NOT NULL DEFAULT 'blog' CHECK (kind IN ('blog', 'notice')),
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  published BOOLEAN NOT NULL DEFAULT TRUE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_posts_kind ON posts(kind, published, created_at DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_published" ON posts;
CREATE POLICY "posts_select_published" ON posts
  FOR SELECT USING (published OR author_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "posts_insert_members" ON posts;
CREATE POLICY "posts_insert_members" ON posts
  FOR INSERT WITH CHECK (author_id = auth.uid() AND is_member_or_admin());

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE USING (author_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own" ON posts
  FOR DELETE USING (author_id = auth.uid() OR is_admin());

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_public" ON comments;
CREATE POLICY "comments_select_public" ON comments FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "comments_insert_members" ON comments;
CREATE POLICY "comments_insert_members" ON comments
  FOR INSERT WITH CHECK (author_id = auth.uid() AND is_member_or_admin());

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own" ON comments
  FOR DELETE USING (author_id = auth.uid() OR is_admin());

-- ---------------------------------------------------------------------------
-- 4. RESEARCH ITEMS (member-shared publications / projects)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS research_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  authors TEXT,
  venue TEXT,
  year INTEGER,
  link TEXT,
  doi TEXT,
  summary TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_research_year ON research_items(year DESC, created_at DESC);

ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "research_select_public" ON research_items;
CREATE POLICY "research_select_public" ON research_items FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "research_insert_members" ON research_items;
CREATE POLICY "research_insert_members" ON research_items
  FOR INSERT WITH CHECK (author_id = auth.uid() AND is_member_or_admin());

DROP POLICY IF EXISTS "research_update_own" ON research_items;
CREATE POLICY "research_update_own" ON research_items
  FOR UPDATE USING (author_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "research_delete_own" ON research_items;
CREATE POLICY "research_delete_own" ON research_items
  FOR DELETE USING (author_id = auth.uid() OR is_admin());

-- ---------------------------------------------------------------------------
-- 5. CONTACT MESSAGES (public contact form)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_insert_public" ON contact_messages;
CREATE POLICY "contact_insert_public" ON contact_messages
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "contact_select_admin" ON contact_messages;
CREATE POLICY "contact_select_admin" ON contact_messages
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "contact_delete_admin" ON contact_messages;
CREATE POLICY "contact_delete_admin" ON contact_messages
  FOR DELETE USING (is_admin());

-- ---------------------------------------------------------------------------
-- 6. AVATAR STORAGE
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Done.
