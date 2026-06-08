-- ============================================================
-- Migration 03: Org-Scoped RLS Policies (BACKWARD COMPATIBLE)
-- Date: 2026-06-09
-- ============================================================
-- Replaces permissive RLS with org-aware policies.
--
-- STRATEGY (backward compatible):
--   - Users WITH org: see data in their org only
--   - Users WITHOUT org: see data as before (no restriction yet)
--   - Service role: full access (backend API)
--
-- PREREQUISITES:
--   - Migration 01 and 02 already applied
--
-- ROLLBACK: 20260609_rollback.sql
-- ============================================================

BEGIN;

-- ============================================================
-- INSPECTION_RECORDS — Drop ALL conflicting policies
-- ============================================================

DROP POLICY IF EXISTS "Allow select inspections" ON inspection_records;
DROP POLICY IF EXISTS "Allow insert inspections" ON inspection_records;
DROP POLICY IF EXISTS "inspections_read_own" ON inspection_records;
DROP POLICY IF EXISTS "inspections_select_own" ON inspection_records;
DROP POLICY IF EXISTS "inspections_insert_own" ON inspection_records;
DROP POLICY IF EXISTS "inspections_update_own" ON inspection_records;
DROP POLICY IF EXISTS "inspections_write_own" ON inspection_records;
DROP POLICY IF EXISTS "Users can view own inspections" ON inspection_records;
DROP POLICY IF EXISTS "Users can view their own inspections" ON inspection_records;
DROP POLICY IF EXISTS "Users can create inspections" ON inspection_records;
DROP POLICY IF EXISTS "Anyone can create inspections" ON inspection_records;
DROP POLICY IF EXISTS "Users can update own unverified inspections" ON inspection_records;
DROP POLICY IF EXISTS "Admin can view all inspections" ON inspection_records;
DROP POLICY IF EXISTS "Admin can verify inspections" ON inspection_records;
DROP POLICY IF EXISTS "Only admins can delete inspections" ON inspection_records;

-- INSPECTION_RECORDS — New policies

CREATE POLICY "ir_select_own" ON inspection_records
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ir_select_org" ON inspection_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM locations l
      JOIN users u ON u.id = auth.uid()
      WHERE l.id = inspection_records.location_id
        AND u.organization_id IS NOT NULL
        AND l.organization_id = u.organization_id
    )
  );

CREATE POLICY "ir_select_no_org" ON inspection_records
  FOR SELECT USING (
    NOT EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

CREATE POLICY "ir_insert" ON inspection_records
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM locations l
        JOIN users u ON u.id = auth.uid()
        WHERE l.id = inspection_records.location_id
          AND u.organization_id IS NOT NULL
          AND l.organization_id = u.organization_id
      )
      OR NOT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
      )
    )
  );

CREATE POLICY "ir_update" ON inspection_records
  FOR UPDATE USING (
    (user_id = auth.uid() AND verified_at IS NULL)
    OR EXISTS (
      SELECT 1 FROM locations l
      JOIN users u ON u.id = auth.uid()
      WHERE l.id = inspection_records.location_id
        AND u.organization_id IS NOT NULL
        AND l.organization_id = u.organization_id
        AND user_has_role_level(80)
    )
    OR (
      NOT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
      )
      AND is_admin()
    )
  );

CREATE POLICY "ir_delete" ON inspection_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM locations l
      JOIN users u ON u.id = auth.uid()
      WHERE l.id = inspection_records.location_id
        AND u.organization_id IS NOT NULL
        AND l.organization_id = u.organization_id
        AND user_has_role_level(80)
    )
    OR (
      NOT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
      )
      AND is_admin()
    )
  );

CREATE POLICY "ir_service_role" ON inspection_records
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- LOCATIONS — Drop ALL conflicting policies
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view active locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can view locations" ON locations;
DROP POLICY IF EXISTS "Public can read active locations" ON locations;
DROP POLICY IF EXISTS "locations_public_read" ON locations;
DROP POLICY IF EXISTS "Authenticated users can create locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can update locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can delete locations" ON locations;
DROP POLICY IF EXISTS "Only admins can create locations" ON locations;
DROP POLICY IF EXISTS "Only admins can update locations" ON locations;
DROP POLICY IF EXISTS "Only admins can delete locations" ON locations;
DROP POLICY IF EXISTS "Admin can manage locations" ON locations;

-- LOCATIONS — New policies

CREATE POLICY "loc_select" ON locations
  FOR SELECT USING (
    (
      organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
      AND (is_active = true OR user_has_role_level(80))
    )
    OR (
      NOT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
      )
      AND is_active = true
    )
  );

CREATE POLICY "loc_insert" ON locations
  FOR INSERT WITH CHECK (
    user_has_role_level(80)
    AND (
      organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
      OR NOT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
      )
    )
  );

CREATE POLICY "loc_update" ON locations
  FOR UPDATE USING (
    user_has_role_level(80)
    AND (
      organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
      OR NOT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
      )
    )
  );

CREATE POLICY "loc_delete" ON locations
  FOR DELETE USING (
    user_has_role_level(80)
    AND (
      organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
      OR NOT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
      )
    )
  );

CREATE POLICY "loc_service_role" ON locations
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- BUILDINGS — Drop conflicting policies
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view active buildings" ON buildings;
DROP POLICY IF EXISTS "Only admins can create buildings" ON buildings;
DROP POLICY IF EXISTS "Only admins can update buildings" ON buildings;
DROP POLICY IF EXISTS "Only super admins can delete buildings" ON buildings;

-- BUILDINGS — New policies

CREATE POLICY "bld_select" ON buildings
  FOR SELECT USING (
    (
      organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
      AND (is_active = true OR user_has_role_level(80))
    )
    OR (
      NOT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
      )
      AND is_active = true
    )
  );

CREATE POLICY "bld_insert" ON buildings
  FOR INSERT WITH CHECK (
    user_has_role_level(80)
    AND (
      organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
      OR NOT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
      )
    )
  );

CREATE POLICY "bld_update" ON buildings
  FOR UPDATE USING (
    user_has_role_level(80)
    AND (
      organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
      OR NOT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
      )
    )
  );

CREATE POLICY "bld_delete" ON buildings
  FOR DELETE USING (user_has_role_level(100));

CREATE POLICY "bld_service_role" ON buildings
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- PHOTOS — Drop conflicting policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view photos from their inspections" ON photos;
DROP POLICY IF EXISTS "Users can upload photos to their inspections" ON photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON photos;
DROP POLICY IF EXISTS "Only admins can hard delete photos" ON photos;
DROP POLICY IF EXISTS "admins_all_operations" ON photos;
DROP POLICY IF EXISTS "admins_select_all_photos" ON photos;
DROP POLICY IF EXISTS "photos_insert_own" ON photos;
DROP POLICY IF EXISTS "photos_select_own" ON photos;
DROP POLICY IF EXISTS "service_role_full_access" ON photos;
DROP POLICY IF EXISTS "users_insert_photos" ON photos;
DROP POLICY IF EXISTS "users_select_inspection_photos" ON photos;
DROP POLICY IF EXISTS "users_select_location_photos" ON photos;
DROP POLICY IF EXISTS "users_select_own_photos" ON photos;
DROP POLICY IF EXISTS "users_soft_delete_own_photos" ON photos;
DROP POLICY IF EXISTS "users_update_own_photos" ON photos;

-- PHOTOS — New policies

CREATE POLICY "photo_select_own" ON photos
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "photo_select_org" ON photos
  FOR SELECT USING (
    inspection_id IN (
      SELECT ir.id FROM inspection_records ir
      JOIN locations l ON l.id = ir.location_id
      JOIN users u ON u.id = auth.uid()
      WHERE u.organization_id IS NOT NULL
        AND l.organization_id = u.organization_id
    )
    AND (is_deleted = false OR is_deleted IS NULL)
  );

CREATE POLICY "photo_select_no_org" ON photos
  FOR SELECT USING (
    NOT EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
    AND (is_deleted = false OR is_deleted IS NULL)
  );

CREATE POLICY "photo_insert" ON photos
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM inspection_records ir
      WHERE ir.id = inspection_id AND ir.user_id = auth.uid()
    )
  );

CREATE POLICY "photo_update" ON photos
  FOR UPDATE USING (
    created_by = auth.uid()
    AND (is_deleted = false OR is_deleted IS NULL)
  );

CREATE POLICY "photo_delete" ON photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM inspection_records ir
      JOIN locations l ON l.id = ir.location_id
      JOIN users u ON u.id = auth.uid()
      WHERE ir.id = photos.inspection_id
        AND u.organization_id IS NOT NULL
        AND l.organization_id = u.organization_id
        AND user_has_role_level(80)
    )
    OR (
      NOT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND organization_id IS NOT NULL
      )
      AND is_admin()
    )
  );

CREATE POLICY "photo_service_role" ON photos
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- FINAL VERIFICATION
-- ============================================================

DO $$
DECLARE
  r RECORD;
  total_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('users', 'inspection_records', 'locations', 'buildings', 'photos');

  RAISE NOTICE '=== MIGRATION 03 COMPLETE ===';
  RAISE NOTICE 'Total org-scoped policies: %', total_policies;

  FOR r IN
    SELECT tablename, COUNT(*) as cnt
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('users', 'inspection_records', 'locations', 'buildings', 'photos')
    GROUP BY tablename
    ORDER BY tablename
  LOOP
    RAISE NOTICE '  %: % policies', r.tablename, r.cnt;
  END LOOP;

  RAISE NOTICE 'RLS BACKWARD COMPATIBLE: users WITH org = scoped, users WITHOUT org = full access';
END $$;

COMMIT;
