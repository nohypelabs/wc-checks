-- ============================================================
-- Migration 05: Fix RLS Infinite Recursion
-- Date: 2026-06-09
-- ============================================================
-- Problem: RLS policies on locations/buildings/photos query
-- the users table to get organization_id. But the users table
-- also has RLS policies. This creates a circular dependency
-- that causes Supabase PostgREST to return 500 errors.
--
-- Solution: Create a SECURITY DEFINER function that bypasses
-- RLS to get the current user's organization_id.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Create helper function (SECURITY DEFINER = bypasses RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_org_id() TO authenticated;

-- ============================================================
-- 2. Fix locations RLS policies
-- ============================================================

DROP POLICY IF EXISTS "loc_select" ON locations;

CREATE POLICY "loc_select" ON locations
  FOR SELECT USING (
    -- User has org: see their org's locations
    (
      organization_id = get_user_org_id()
      AND (is_active = true OR user_has_role_level(80))
    )
    OR
    -- User has no org: see all active (backward compatible)
    (
      get_user_org_id() IS NULL
      AND is_active = true
    )
  );

-- ============================================================
-- 3. Fix buildings RLS policies
-- ============================================================

DROP POLICY IF EXISTS "bld_select" ON buildings;

CREATE POLICY "bld_select" ON buildings
  FOR SELECT USING (
    (
      organization_id = get_user_org_id()
      AND (is_active = true OR user_has_role_level(80))
    )
    OR (
      get_user_org_id() IS NULL
      AND is_active = true
    )
  );

-- Fix INSERT/UPDATE too
DROP POLICY IF EXISTS "loc_insert" ON locations;
CREATE POLICY "loc_insert" ON locations
  FOR INSERT WITH CHECK (
    user_has_role_level(80)
    AND (
      organization_id = get_user_org_id()
      OR get_user_org_id() IS NULL
    )
  );

DROP POLICY IF EXISTS "loc_update" ON locations;
CREATE POLICY "loc_update" ON locations
  FOR UPDATE USING (
    user_has_role_level(80)
    AND (
      organization_id = get_user_org_id()
      OR get_user_org_id() IS NULL
    )
  );

DROP POLICY IF EXISTS "loc_delete" ON locations;
CREATE POLICY "loc_delete" ON locations
  FOR DELETE USING (
    user_has_role_level(80)
    AND (
      organization_id = get_user_org_id()
      OR get_user_org_id() IS NULL
    )
  );

DROP POLICY IF EXISTS "bld_insert" ON buildings;
CREATE POLICY "bld_insert" ON buildings
  FOR INSERT WITH CHECK (
    user_has_role_level(80)
    AND (
      organization_id = get_user_org_id()
      OR get_user_org_id() IS NULL
    )
  );

DROP POLICY IF EXISTS "bld_update" ON buildings;
CREATE POLICY "bld_update" ON buildings
  FOR UPDATE USING (
    user_has_role_level(80)
    AND (
      organization_id = get_user_org_id()
      OR get_user_org_id() IS NULL
    )
  );

-- ============================================================
-- 4. Fix inspection_records RLS policies
-- ============================================================

DROP POLICY IF EXISTS "ir_select_org" ON inspection_records;
CREATE POLICY "ir_select_org" ON inspection_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM locations l
      WHERE l.id = inspection_records.location_id
        AND get_user_org_id() IS NOT NULL
        AND l.organization_id = get_user_org_id()
    )
  );

DROP POLICY IF EXISTS "ir_select_no_org" ON inspection_records;
CREATE POLICY "ir_select_no_org" ON inspection_records
  FOR SELECT USING (get_user_org_id() IS NULL);

DROP POLICY IF EXISTS "ir_insert" ON inspection_records;
CREATE POLICY "ir_insert" ON inspection_records
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
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

DROP POLICY IF EXISTS "ir_update" ON inspection_records;
CREATE POLICY "ir_update" ON inspection_records
  FOR UPDATE USING (
    (user_id = auth.uid() AND verified_at IS NULL)
    OR EXISTS (
      SELECT 1 FROM locations l
      WHERE l.id = inspection_records.location_id
        AND get_user_org_id() IS NOT NULL
        AND l.organization_id = get_user_org_id()
        AND user_has_role_level(80)
    )
    OR (get_user_org_id() IS NULL AND is_admin())
  );

DROP POLICY IF EXISTS "ir_delete" ON inspection_records;
CREATE POLICY "ir_delete" ON inspection_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM locations l
      WHERE l.id = inspection_records.location_id
        AND get_user_org_id() IS NOT NULL
        AND l.organization_id = get_user_org_id()
        AND user_has_role_level(80)
    )
    OR (get_user_org_id() IS NULL AND is_admin())
  );

-- ============================================================
-- 5. Fix photos RLS policies
-- ============================================================

DROP POLICY IF EXISTS "photo_select_org" ON photos;
CREATE POLICY "photo_select_org" ON photos
  FOR SELECT USING (
    inspection_id IN (
      SELECT ir.id FROM inspection_records ir
      JOIN locations l ON l.id = ir.location_id
      WHERE get_user_org_id() IS NOT NULL
        AND l.organization_id = get_user_org_id()
    )
    AND (is_deleted = false OR is_deleted IS NULL)
  );

DROP POLICY IF EXISTS "photo_select_no_org" ON photos;
CREATE POLICY "photo_select_no_org" ON photos
  FOR SELECT USING (
    get_user_org_id() IS NULL
    AND (is_deleted = false OR is_deleted IS NULL)
  );

DROP POLICY IF EXISTS "photo_delete" ON photos;
CREATE POLICY "photo_delete" ON photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM inspection_records ir
      JOIN locations l ON l.id = ir.location_id
      WHERE ir.id = photos.inspection_id
        AND get_user_org_id() IS NOT NULL
        AND l.organization_id = get_user_org_id()
        AND user_has_role_level(80)
    )
    OR (get_user_org_id() IS NULL AND is_admin())
  );

-- ============================================================
-- 6. Fix users RLS policy (uses get_user_org_id too)
-- ============================================================

DROP POLICY IF EXISTS "users_select_org" ON users;
CREATE POLICY "users_select_org" ON users
  FOR SELECT USING (
    organization_id IS NOT NULL
    AND organization_id = get_user_org_id()
    AND user_has_role_level(80)
  );

DO $$
BEGIN
  RAISE NOTICE '=== MIGRATION 05 COMPLETE ===';
  RAISE NOTICE 'Created get_user_org_id() SECURITY DEFINER function';
  RAISE NOTICE 'Fixed RLS policies to use function instead of subquery';
  RAISE NOTICE 'No more infinite recursion between tables';
END $$;

COMMIT;
