-- ============================================================
-- Rollback: Undo ALL Organization Scoping Migrations
-- Date: 2026-06-09
-- ============================================================
-- Reverts migrations 01, 02, and 03
-- WARNING: Restores permissive RLS policies (pre-migration state)
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION A: Rollback Migration 03 (org-scoped RLS)
-- ============================================================

DROP POLICY IF EXISTS "ir_select_own" ON inspection_records;
DROP POLICY IF EXISTS "ir_select_org" ON inspection_records;
DROP POLICY IF EXISTS "ir_select_no_org" ON inspection_records;
DROP POLICY IF EXISTS "ir_insert" ON inspection_records;
DROP POLICY IF EXISTS "ir_update" ON inspection_records;
DROP POLICY IF EXISTS "ir_delete" ON inspection_records;
DROP POLICY IF EXISTS "ir_service_role" ON inspection_records;

DROP POLICY IF EXISTS "loc_select" ON locations;
DROP POLICY IF EXISTS "loc_insert" ON locations;
DROP POLICY IF EXISTS "loc_update" ON locations;
DROP POLICY IF EXISTS "loc_delete" ON locations;
DROP POLICY IF EXISTS "loc_service_role" ON locations;

DROP POLICY IF EXISTS "bld_select" ON buildings;
DROP POLICY IF EXISTS "bld_insert" ON buildings;
DROP POLICY IF EXISTS "bld_update" ON buildings;
DROP POLICY IF EXISTS "bld_delete" ON buildings;
DROP POLICY IF EXISTS "bld_service_role" ON buildings;

DROP POLICY IF EXISTS "photo_select_own" ON photos;
DROP POLICY IF EXISTS "photo_select_org" ON photos;
DROP POLICY IF EXISTS "photo_select_no_org" ON photos;
DROP POLICY IF EXISTS "photo_insert" ON photos;
DROP POLICY IF EXISTS "photo_update" ON photos;
DROP POLICY IF EXISTS "photo_delete" ON photos;
DROP POLICY IF EXISTS "photo_service_role" ON photos;

-- Restore original permissive policies
CREATE POLICY "Users can view their own inspections" ON inspection_records
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Anyone can create inspections" ON inspection_records
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own unverified inspections" ON inspection_records
  FOR UPDATE TO authenticated
  USING ((user_id = auth.uid() AND verified_at IS NULL) OR is_admin())
  WITH CHECK ((user_id = auth.uid() AND verified_at IS NULL) OR is_admin());
CREATE POLICY "Only admins can delete inspections" ON inspection_records
  FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "Anyone can view active locations" ON locations
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Only admins can create locations" ON locations
  FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Only admins can update locations" ON locations
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Only admins can delete locations" ON locations
  FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "Anyone can view active buildings" ON buildings
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Only admins can create buildings" ON buildings
  FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Only admins can update buildings" ON buildings
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Only super admins can delete buildings" ON buildings
  FOR DELETE TO authenticated USING (is_super_admin());

CREATE POLICY "Users can view photos from their inspections" ON photos
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR is_admin() OR
    EXISTS (SELECT 1 FROM inspection_records ir
            WHERE ir.id = photos.inspection_id AND ir.user_id = auth.uid()));
CREATE POLICY "Users can upload photos to their inspections" ON photos
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM inspection_records ir
            WHERE ir.id = inspection_id AND ir.user_id = auth.uid()));
CREATE POLICY "Users can update their own photos" ON photos
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR is_admin())
  WITH CHECK (created_by = auth.uid() OR is_admin());
CREATE POLICY "Only admins can hard delete photos" ON photos
  FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- SECTION B: Rollback Migration 02 (buildings → orgs)
-- ============================================================

UPDATE buildings
SET organization_id = 'de48f433-de43-4ccf-95c3-df08d4c2d6b2',
    updated_at = NOW()
WHERE organization_id != 'de48f433-de43-4ccf-95c3-df08d4c2d6b2';

UPDATE locations
SET organization_id = 'de48f433-de43-4ccf-95c3-df08d4c2d6b2',
    updated_at = NOW()
WHERE organization_id != 'de48f433-de43-4ccf-95c3-df08d4c2d6b2';

DELETE FROM organizations
WHERE id != 'de48f433-de43-4ccf-95c3-df08d4c2d6b2'
  AND created_at >= '2026-06-09';

-- ============================================================
-- SECTION C: Rollback Migration 01 (users org columns)
-- ============================================================

DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_org" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_service_role" ON users;
DROP POLICY IF EXISTS "users_delete_superadmin" ON users;

DROP INDEX IF EXISTS idx_users_organization_id;
DROP INDEX IF EXISTS idx_users_approval_status;

ALTER TABLE users DROP COLUMN IF EXISTS organization_id;
ALTER TABLE users DROP COLUMN IF EXISTS approval_status;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Only admins can view all users" ON users
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
                  WHERE ur.user_id = auth.uid() AND r.level >= 80));
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Only super admins can delete users" ON users
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
                  WHERE ur.user_id = auth.uid() AND r.level >= 100));
CREATE POLICY "Service role can manage users" ON users
  FOR ALL TO authenticated USING (auth.role() = 'service_role');

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
DECLARE
  org_count INTEGER;
  user_org_col INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations;
  SELECT COUNT(*) INTO user_org_col
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'organization_id';

  RAISE NOTICE '=== ROLLBACK VERIFICATION ===';
  RAISE NOTICE 'Organizations: %', org_count;
  RAISE NOTICE 'Users has organization_id: %',
    CASE WHEN user_org_col > 0 THEN 'YES (ERROR!)' ELSE 'NO (OK)' END;

  IF user_org_col > 0 THEN
    RAISE EXCEPTION 'organization_id column still exists on users!';
  END IF;

  RAISE NOTICE '=== ROLLBACK COMPLETE ===';
END $$;

COMMIT;
