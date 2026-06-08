-- ============================================================
-- Migration 06: New Users Default to Pending
-- Date: 2026-06-09
-- ============================================================
-- New registrations default to 'pending' status
-- Pending users can only see their own profile
-- Existing approved users are NOT affected
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Change default from 'approved' to 'pending'
-- ============================================================

ALTER TABLE users ALTER COLUMN approval_status SET DEFAULT 'pending';

-- ============================================================
-- 2. Update RLS: pending users can only see own profile
-- ============================================================

-- Drop policies that give unrestricted access to unapproved users
DROP POLICY IF EXISTS "ir_select_no_org" ON inspection_records;
DROP POLICY IF EXISTS "ir_insert" ON inspection_records;
DROP POLICY IF EXISTS "loc_select" ON locations;
DROP POLICY IF EXISTS "bld_select" ON buildings;
DROP POLICY IF EXISTS "photo_select_no_org" ON photos;

-- inspection_records: approved users without org see all (backward compat)
CREATE POLICY "ir_select_no_org" ON inspection_records
  FOR SELECT USING (
    get_user_org_id() IS NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND approval_status = 'approved'
    )
  );

-- inspection_records: approved users without org can insert
CREATE POLICY "ir_insert" ON inspection_records
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND approval_status = 'approved'
    )
    AND (
      EXISTS (
        SELECT 1 FROM locations l
        WHERE l.id = inspection_records.location_id
          AND get_user_org_id() IS NOT NULL
          AND l.organization_id = get_user_org_id()
      )
      OR get_user_org_id() IS NULL
    )
  );

-- locations: approved users without org see all active
CREATE POLICY "loc_select" ON locations
  FOR SELECT USING (
    (
      organization_id = get_user_org_id()
      AND (is_active = true OR user_has_role_level(80))
    )
    OR (
      get_user_org_id() IS NULL
      AND is_active = true
      AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND approval_status = 'approved'
      )
    )
  );

-- buildings: approved users without org see all active
CREATE POLICY "bld_select" ON buildings
  FOR SELECT USING (
    (
      organization_id = get_user_org_id()
      AND (is_active = true OR user_has_role_level(80))
    )
    OR (
      get_user_org_id() IS NULL
      AND is_active = true
      AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND approval_status = 'approved'
      )
    )
  );

-- photos: approved users without org see all
CREATE POLICY "photo_select_no_org" ON photos
  FOR SELECT USING (
    get_user_org_id() IS NULL
    AND (is_deleted = false OR is_deleted IS NULL)
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND approval_status = 'approved'
    )
  );

DO $$
BEGIN
  RAISE NOTICE '=== MIGRATION 06 COMPLETE ===';
  RAISE NOTICE 'New registrations: default pending';
  RAISE NOTICE 'Existing approved users: unaffected';
  RAISE NOTICE 'Pending users: can only see own profile';
  RAISE NOTICE 'Superadmin: can change approval + assign org from UserManagement';
END $$;

COMMIT;
