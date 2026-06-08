-- ============================================================
-- Migration 01: Add Organization Scoping to Users (SAFE)
-- Date: 2026-06-09
-- ============================================================
-- Adds organization_id to users table (nullable — assignment later)
-- Drops ALL conflicting RLS policies, creates org-aware ones
--
-- PREREQUISITES:
--   - organizations table exists
--   - Backup taken
--
-- ROLLBACK: 20260609_rollback.sql
-- ============================================================

BEGIN;

-- ============================================================
-- SAFETY CHECK
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'organization_id'
  ) THEN
    RAISE EXCEPTION 'users.organization_id already exists. Migration already applied.';
  END IF;
  RAISE NOTICE 'Safety check passed';
END $$;

-- ============================================================
-- 1. ADD COLUMNS
-- ============================================================

ALTER TABLE users ADD COLUMN organization_id UUID
  REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE users ADD COLUMN approval_status TEXT DEFAULT 'approved'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_approval_status ON users(approval_status);

-- ============================================================
-- 3. RLS — Drop ALL existing conflicting policies on users
-- ============================================================

DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_org" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users view own profile or admins view all" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Only admins can view all users" ON users;
DROP POLICY IF EXISTS "Only admins can create users" ON users;
DROP POLICY IF EXISTS "Only super admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow postgres to insert users" ON users;
DROP POLICY IF EXISTS "System can insert users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

-- ============================================================
-- 4. RLS — Create new org-aware policies (backward compatible)
-- ============================================================

-- Users can read their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins can read users in their org
CREATE POLICY "users_select_org" ON users
  FOR SELECT USING (
    organization_id IS NOT NULL
    AND organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND user_has_role_level(80)
  );

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow new user registration (insert)
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Service role full access (backend API)
CREATE POLICY "users_service_role" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Super admins can delete users
CREATE POLICY "users_delete_superadmin" ON users
  FOR DELETE USING (user_has_role_level(100));

-- ============================================================
-- 5. COMMENTS
-- ============================================================

COMMENT ON COLUMN users.organization_id IS 'Organization (tenant) this user belongs to. NULL = not assigned yet.';
COMMENT ON COLUMN users.approval_status IS 'User approval status: pending, approved, rejected';

-- ============================================================
-- 6. VERIFICATION
-- ============================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies WHERE tablename = 'users';

  RAISE NOTICE 'Migration 01 complete:';
  RAISE NOTICE '  Users total: %', (SELECT COUNT(*) FROM users);
  RAISE NOTICE '  Users with org: %', (SELECT COUNT(*) FROM users WHERE organization_id IS NOT NULL);
  RAISE NOTICE '  Users without org: %', (SELECT COUNT(*) FROM users WHERE organization_id IS NULL);
  RAISE NOTICE '  RLS policies on users: %', policy_count;
  RAISE NOTICE 'Users NOT assigned to orgs yet. Run migration 02 next.';
END $$;

COMMIT;
