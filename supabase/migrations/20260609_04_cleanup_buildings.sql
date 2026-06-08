-- ============================================================
-- Migration 04: Cleanup Buildings (Remove Company Entries)
-- Date: 2026-06-09
-- ============================================================
-- After migration 02, buildings table has company entries
-- that are now organizations. Remove them so buildings table
-- is clean for actual buildings (gedung).
--
-- Changes:
--   1. Make locations.building_id nullable
--   2. Set building_id = NULL for locations linked to company buildings
--   3. Delete company buildings from buildings table
--   4. buildings table is now empty, ready for real buildings
--
-- PREREQUISITES:
--   - Migrations 01, 02, 03 already applied
--   - All locations have organization_id set
--
-- ROLLBACK: Restore buildings from backup
-- ============================================================

BEGIN;

-- ============================================================
-- SAFETY CHECK
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'organization_id'
  ) THEN
    RAISE EXCEPTION 'Migration 01-03 not applied yet.';
  END IF;

  -- Verify all locations have organization_id
  IF EXISTS (
    SELECT 1 FROM locations WHERE organization_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Some locations have no organization_id. Run migration 02 first.';
  END IF;

  RAISE NOTICE 'Safety checks passed';
END $$;

-- ============================================================
-- STEP 1: Make locations.building_id nullable
-- ============================================================

ALTER TABLE locations ALTER COLUMN building_id DROP NOT NULL;

-- ============================================================
-- STEP 2: Set building_id = NULL for company buildings
-- ============================================================
-- These locations already have organization_id pointing to the
-- correct org. building_id is no longer needed for company entries.

UPDATE locations
SET building_id = NULL, updated_at = NOW()
WHERE building_id IN (
  SELECT id FROM buildings
  WHERE organization_id != 'de48f433-de43-4ccf-95c3-df08d4c2d6b2'
     OR organization_id IS NULL
);

-- ============================================================
-- STEP 3: Delete company buildings
-- ============================================================
-- These are companies, not physical buildings.
-- They now exist as organizations.

DELETE FROM buildings
WHERE organization_id != 'de48f433-de43-4ccf-95c3-df08d4c2d6b2'
   OR organization_id IS NULL;

-- ============================================================
-- STEP 4: Comment
-- ============================================================

COMMENT ON TABLE buildings IS 'Physical buildings (gedung). Companies are in the organizations table.';

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
DECLARE
  building_count INTEGER;
  locations_null_building INTEGER;
  locations_with_building INTEGER;
BEGIN
  SELECT COUNT(*) INTO building_count FROM buildings;
  SELECT COUNT(*) INTO locations_null_building FROM locations WHERE building_id IS NULL;
  SELECT COUNT(*) INTO locations_with_building FROM locations WHERE building_id IS NOT NULL;

  RAISE NOTICE '=== MIGRATION 04 SUMMARY ===';
  RAISE NOTICE 'Buildings remaining: %', building_count;
  RAISE NOTICE 'Locations with building_id NULL: %', locations_null_building;
  RAISE NOTICE 'Locations with building_id set: %', locations_with_building;
  RAISE NOTICE '';
  RAISE NOTICE 'Buildings table is now clean.';
  RAISE NOTICE 'Companies are in organizations table.';
  RAISE NOTICE 'Add real buildings (gedung) via the app when ready.';
END $$;

COMMIT;
