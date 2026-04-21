-- =============================================================================
-- MIGRATION: Extended Admin Hierarchy
-- Roles: super_admin > co_admin > poster > member > pending > rejected
--
-- super_admin (Shan): full control, only one who can grant/revoke super_admin
-- co_admin (Anita, Dennis): approve/revise/delete content; manage all roles
--                            except super_admin; cannot affect Shan's role
-- poster: can create posts/content; requires admin approval before public
-- member: can view member-only content; cannot create posts
-- pending: registered, awaiting approval
-- rejected: registration denied
-- =============================================================================


-- ============================================================================
-- 1. UPDATE ROLE CONSTRAINT
-- ============================================================================

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('super_admin', 'co_admin', 'poster', 'member', 'pending', 'rejected'));


-- ============================================================================
-- 2. HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_admin: super_admin OR co_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'co_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_poster_or_above: can create/submit content
CREATE OR REPLACE FUNCTION is_poster_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'co_admin', 'poster')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_member_or_above: logged-in approved membersN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'co_admin', 'poster', 'member')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 3. TRIGGER: PROTECT SUPER_ADMIN ROLE
-- Only a super_admin can elevate someone to super_admin,
-- or demote an existing super_admin.
-- ============================================================================

CREATE OR REPLACE FUNCTION protect_super_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing a super_admin's role (unless caller is also super_admin)
  IF OLD.role = 'super_admin' AND NEW.role != 'super_admin' THEN
    IF NOT is_super_admin() THEN
      RAISE EXCEPTION 'Only a super_admin can change another super_admin''s role.';
    END IF;
  END IF;
  -- Prevent granting super_admin role (unless caller is super_admin)
  IF NEW.role = 'super_admin' AND OLD.role != 'super_admin' THEN
    IF NOT is_super_admin() THEN
      RAISE EXCEPTION 'Only a super_admin can grant the super_admin role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_super_admin_role_trigger ON user_profiles;
CREATE TRIGGER protect_super_admin_role_trigger
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION protect_super_admin_role();


-- ============================================================================
-- 4. UPDATE USER_PROFILES RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "user_profiles_admin_all" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_super_admin_all" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_co_admin_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_co_admin_update" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_update_roles" ON user_profiles;

-- super_admin can do everything
CREATE POLICY "user_profiles_super_admin_all" ON user_profiles
USING (is_super_admin());

-- co_admin can select all profiles
CREATE POLICY "user_profiles_co_admin_select" ON user_profiles
FOR SELECT USING (is_admin());

-- co_admin can update any profile EXCEPT super_admin profiles
CREATE POLICY "user_profiles_co_admin_update" ON user_profiles
FOR UPDATE USING (
  is_admin()
  AND (SELECT role FROM user_profiles WHERE id = user_profiles.id) != 'super_admin'
);


-- ============================================================================
-- 5. UPDATE CONTENT TABLE RLS POLICIES FOR POSTER ROLE
-- ============================================================================

-- Noticeboard: poster and above can submit (pending approval)
DROP POLICY IF EXISTS "noticeboard_items_insert_members" ON noticeboard_items;
CREATE POLICY "noticeboard_items_insert_posters" ON noticeboard_items
FOR INSERT WITH CHECK (is_poster_or_above());

-- When a non-admin inserts, approved defaults to FALSE (requires admin approval)
-- (Enforced via DEFAULT FALSE on the column — already set in schema)

-- Member Highlights: poster and above can submit
DROP POLICY IF EXISTS "member_highlights_insert_members" ON member_highlights;
CREATE POLICY "member_highlights_insert_posters" ON member_highlights
FOR INSERT WITH CHECK (is_poster_or_above() AND auth.uid() = user_id);


-- ============================================================================
-- 6. MIGRATE EXISTING ROLES
-- Run these UPDATE statements carefully:
-- 1. First set Shan's account to super_admin (use Shan's user UUID from auth.users)
-- 2. Then set Anita and Dennis to co_admin
-- 3. Existing 'admin' role holders → update to co_admin unless already handled
-- ============================================================================

-- Step 1: Upgrade existing 'admin' accounts to 'co_admin' temporarily
--         (Run BEFORE granting super_admin, since constraint now allows both)
UPDATE user_profiles SET role = 'co_admin' WHERE role = 'admin';

-- Step 2: Grant super_admin to Shan (replace with actual UUID from auth.users)
-- UPDATE user_profiles SET role = 'super_admin' WHERE id = '<SHAN_USER_UUID>';
-- NOTE: Run this manually in the dashboard after looking up Shan's UUID.

-- Step 3: Ensure noticeboard_items pending approval set correctly
-- Posts submitted by non-admins should default to approved=FALSE already.
UPDATE noticeboard_items SET approved = FALSE
WHERE posted_by IN (
  SELECT id FROM user_profiles WHERE role IN ('poster', 'member')
) AND approved = TRUE;
-- (This is conservative — re-approve any that should be public.)
