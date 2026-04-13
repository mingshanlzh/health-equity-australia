-- Health Equity Australia Website - Supabase Schema
-- Created for multi-role user system with RLS policies

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_member_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'member')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- TABLES
-- ============================================================================

-- User Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT DEFAULT 'pending' CHECK (role IN ('admin', 'member', 'pending', 'rejected')),
  affiliation TEXT,
  position TEXT,
  bio TEXT,
  research_interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  website TEXT,
  show_in_directory BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_show_in_directory ON user_profiles(show_in_directory);


-- Seminars
CREATE TABLE IF NOT EXISTS seminars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  speaker TEXT,
  speaker_affiliation TEXT,
  abstract TEXT,
  date TIMESTAMPTZ,
  location TEXT,
  link TEXT,
  type TEXT DEFAULT 'upcoming' CHECK (type IN ('upcoming', 'past')),
  recording_url TEXT,
  slides_url TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seminars_type ON seminars(type);
CREATE INDEX IF NOT EXISTS idx_seminars_date ON seminars(date);
CREATE INDEX IF NOT EXISTS idx_seminars_created_by ON seminars(created_by);


-- Seminar Registrations
CREATE TABLE IF NOT EXISTS seminar_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seminar_id UUID NOT NULL REFERENCES seminars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  affiliation TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(seminar_id, email)
);

CREATE INDEX IF NOT EXISTS idx_seminar_registrations_seminar_id ON seminar_registrations(seminar_id);
CREATE INDEX IF NOT EXISTS idx_seminar_registrations_user_id ON seminar_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_seminar_registrations_email ON seminar_registrations(email);


-- Member Highlights
CREATE TABLE IF NOT EXISTS member_highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'paper' CHECK (type IN ('paper', 'policy', 'media', 'award', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  date DATE,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_member_highlights_user_id ON member_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_member_highlights_approved ON member_highlights(approved);
CREATE INDEX IF NOT EXISTS idx_member_highlights_type ON member_highlights(type);


-- Noticeboard Items
CREATE TABLE IF NOT EXISTS noticeboard_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'opportunity' CHECK (category IN ('funding', 'job', 'event', 'opportunity')),
  description TEXT,
  link TEXT,
  deadline DATE,
  posted_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_noticeboard_items_category ON noticeboard_items(category);
CREATE INDEX IF NOT EXISTS idx_noticeboard_items_approved ON noticeboard_items(approved);
CREATE INDEX IF NOT EXISTS idx_noticeboard_items_posted_by ON noticeboard_items(posted_by);
CREATE INDEX IF NOT EXISTS idx_noticeboard_items_deadline ON noticeboard_items(deadline);


-- Resources
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'data' CHECK (category IN ('data', 'code', 'tool', 'guide', 'other')),
  file_url TEXT,
  github_url TEXT,
  link TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_created_by ON resources(created_by);


-- Feedback Messages
CREATE TABLE IF NOT EXISTS feedback_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT,
  category TEXT DEFAULT 'suggestion' CHECK (category IN ('suggestion', 'bug', 'content', 'other')),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_messages_category ON feedback_messages(category);
CREATE INDEX IF NOT EXISTS idx_feedback_messages_read ON feedback_messages(read);


-- Committee Members
CREATE TABLE IF NOT EXISTS committee_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT,
  affiliation TEXT,
  bio TEXT,
  photo_url TEXT,
  email TEXT,
  website TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_committee_members_sort_order ON committee_members(sort_order);


-- Site Settings
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminars ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminar_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE noticeboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- USER_PROFILES RLS POLICIES
-- ============================================================================

-- Users can read their own profile, or any profile marked show_in_directory
CREATE POLICY "user_profiles_select" ON user_profiles
FOR SELECT USING (
  auth.uid() = id
  OR show_in_directory = TRUE
);

-- Users can update their own profile
CREATE POLICY "user_profiles_update_self" ON user_profiles
FOR UPDATE USING (auth.uid() = id);

-- Admins can do everything
CREATE POLICY "user_profiles_admin_all" ON user_profiles
USING (is_admin());


-- ============================================================================
-- SEMINARS RLS POLICIES
-- ============================================================================

-- Public read access
CREATE POLICY "seminars_select_public" ON seminars
FOR SELECT USING (TRUE);

-- Admins can insert, update, delete
CREATE POLICY "seminars_admin_insert" ON seminars
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "seminars_admin_update" ON seminars
FOR UPDATE USING (is_admin());

CREATE POLICY "seminars_admin_delete" ON seminars
FOR DELETE USING (is_admin());


-- ============================================================================
-- SEMINAR_REGISTRATIONS RLS POLICIES
-- ============================================================================

-- Anyone can register (insert)
CREATE POLICY "seminar_registrations_insert_public" ON seminar_registrations
FOR INSERT WITH CHECK (TRUE);

-- Users can read their own registrations
CREATE POLICY "seminar_registrations_select_own" ON seminar_registrations
FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all registrations
CREATE POLICY "seminar_registrations_select_admin" ON seminar_registrations
FOR SELECT USING (is_admin());

-- Admins can update/delete
CREATE POLICY "seminar_registrations_admin_update" ON seminar_registrations
FOR UPDATE USING (is_admin());

CREATE POLICY "seminar_registrations_admin_delete" ON seminar_registrations
FOR DELETE USING (is_admin());


-- ============================================================================
-- MEMBER_HIGHLIGHTS RLS POLICIES
-- ============================================================================

-- Public read approved highlights
CREATE POLICY "member_highlights_select_public" ON member_highlights
FOR SELECT USING (approved = TRUE);

-- Members can read their own (approved or not)
CREATE POLICY "member_highlights_select_own" ON member_highlights
FOR SELECT USING (auth.uid() = user_id);

-- Members can insert
CREATE POLICY "member_highlights_insert_members" ON member_highlights
FOR INSERT WITH CHECK (is_member_or_admin() AND auth.uid() = user_id);

-- Members can update their own
CREATE POLICY "member_highlights_update_own" ON member_highlights
FOR UPDATE USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "member_highlights_admin_select" ON member_highlights
FOR SELECT USING (is_admin());

CREATE POLICY "member_highlights_admin_update" ON member_highlights
FOR UPDATE USING (is_admin());

CREATE POLICY "member_highlights_admin_delete" ON member_highlights
FOR DELETE USING (is_admin());


-- ============================================================================
-- NOTICEBOARD_ITEMS RLS POLICIES
-- ============================================================================

-- Public read approved items
CREATE POLICY "noticeboard_items_select_public" ON noticeboard_items
FOR SELECT USING (approved = TRUE);

-- Admins can read all
CREATE POLICY "noticeboard_items_select_admin" ON noticeboard_items
FOR SELECT USING (is_admin());

-- Members can insert
CREATE POLICY "noticeboard_items_insert_members" ON noticeboard_items
FOR INSERT WITH CHECK (is_member_or_admin());

-- Admins can update/delete
CREATE POLICY "noticeboard_items_admin_update" ON noticeboard_items
FOR UPDATE USING (is_admin());

CREATE POLICY "noticeboard_items_admin_delete" ON noticeboard_items
FOR DELETE USING (is_admin());


-- ============================================================================
-- RESOURCES RLS POLICIES
-- ============================================================================

-- Public read
CREATE POLICY "resources_select_public" ON resources
FOR SELECT USING (TRUE);

-- Admins can insert, update, delete
CREATE POLICY "resources_admin_insert" ON resources
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "resources_admin_update" ON resources
FOR UPDATE USING (is_admin());

CREATE POLICY "resources_admin_delete" ON resources
FOR DELETE USING (is_admin());


-- ============================================================================
-- FEEDBACK_MESSAGES RLS POLICIES
-- ============================================================================

-- Anyone can insert feedback
CREATE POLICY "feedback_messages_insert_public" ON feedback_messages
FOR INSERT WITH CHECK (TRUE);

-- Admins can read and update
CREATE POLICY "feedback_messages_select_admin" ON feedback_messages
FOR SELECT USING (is_admin());

CREATE POLICY "feedback_messages_update_admin" ON feedback_messages
FOR UPDATE USING (is_admin());

CREATE POLICY "feedback_messages_delete_admin" ON feedback_messages
FOR DELETE USING (is_admin());


-- ============================================================================
-- COMMITTEE_MEMBERS RLS POLICIES
-- ============================================================================

-- Public read
CREATE POLICY "committee_members_select_public" ON committee_members
FOR SELECT USING (TRUE);

-- Admins can insert, update, delete
CREATE POLICY "committee_members_admin_insert" ON committee_members
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "committee_members_admin_update" ON committee_members
FOR UPDATE USING (is_admin());

CREATE POLICY "committee_members_admin_delete" ON committee_members
FOR DELETE USING (is_admin());


-- ============================================================================
-- SITE_SETTINGS RLS POLICIES
-- ============================================================================

-- Public read
CREATE POLICY "site_settings_select_public" ON site_settings
FOR SELECT USING (TRUE);

-- Admins can insert, update, delete
CREATE POLICY "site_settings_admin_insert" ON site_settings
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "site_settings_admin_update" ON site_settings
FOR UPDATE USING (is_admin());

CREATE POLICY "site_settings_admin_delete" ON site_settings
FOR DELETE USING (is_admin());
