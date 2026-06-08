-- ============================================================
-- Migration 02: Convert Buildings to Organizations (SAFE)
-- Date: 2026-06-09
-- ============================================================
-- Each active building becomes its own organization.
-- Users are NOT assigned yet — that will be done separately.
--
-- PREREQUISITES:
--   - Migration 01 already applied
--   - Backup taken
--
-- ROLLBACK: 20260609_rollback.sql
-- ============================================================

BEGIN;

-- ============================================================
-- SAFETY CHECKS
-- ============================================================

DO $$
DECLARE
  building_count INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'organization_id'
  ) THEN
    RAISE EXCEPTION 'Migration 01 not applied yet. Run it first.';
  END IF;

  SELECT COUNT(*) INTO building_count
  FROM buildings
  WHERE organization_id = 'de48f433-de43-4ccf-95c3-df08d4c2d6b2'
    AND is_active = true;

  IF building_count = 0 THEN
    RAISE EXCEPTION 'No active buildings under Prenacons. Nothing to migrate.';
  END IF;

  RAISE NOTICE 'Pre-check: % active buildings to migrate', building_count;
END $$;

-- ============================================================
-- STEP 1: Create new organizations from active buildings
-- ============================================================

INSERT INTO organizations (id, name, short_code, is_active, created_at)
SELECT
  gen_random_uuid(),
  b.name,
  b.short_code,
  true,
  NOW()
FROM buildings b
WHERE b.organization_id = 'de48f433-de43-4ccf-95c3-df08d4c2d6b2'
  AND b.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.short_code = b.short_code
      AND o.id != 'de48f433-de43-4ccf-95c3-df08d4c2d6b2'
  );

-- ============================================================
-- STEP 2: Update buildings → point to new organizations
-- ============================================================

UPDATE buildings b
SET organization_id = o.id,
    updated_at = NOW()
FROM organizations o
WHERE o.short_code = b.short_code
  AND o.id != 'de48f433-de43-4ccf-95c3-df08d4c2d6b2'
  AND b.organization_id = 'de48f433-de43-4ccf-95c3-df08d4c2d6b2';

-- ============================================================
-- STEP 3: Update locations → follow building's new org
-- ============================================================

UPDATE locations l
SET organization_id = b.organization_id,
    updated_at = NOW()
FROM buildings b
WHERE l.building_id = b.id
  AND l.organization_id = 'de48f433-de43-4ccf-95c3-df08d4c2d6b2';

-- ============================================================
-- STEP 4: Verification — no orphan data
-- ============================================================

DO $$
DECLARE
  orphan_buildings INTEGER;
  orphan_locations INTEGER;
  new_org_count INTEGER;
  updated_buildings INTEGER;
  updated_locations INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_buildings
  FROM buildings b
  WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = b.organization_id);

  SELECT COUNT(*) INTO orphan_locations
  FROM locations l
  WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = l.organization_id);

  SELECT COUNT(*) INTO new_org_count
  FROM organizations
  WHERE id != 'de48f433-de43-4ccf-95c3-df08d4c2d6b2';

  SELECT COUNT(*) INTO updated_buildings
  FROM buildings
  WHERE organization_id != 'de48f433-de43-4ccf-95c3-df08d4c2d6b2';

  SELECT COUNT(*) INTO updated_locations
  FROM locations
  WHERE organization_id != 'de48f433-de43-4ccf-95c3-df08d4c2d6b2';

  RAISE NOTICE '=== MIGRATION 02 SUMMARY ===';
  RAISE NOTICE 'New organizations created: %', new_org_count;
  RAISE NOTICE 'Buildings updated: %', updated_buildings;
  RAISE NOTICE 'Locations updated: %', updated_locations;
  RAISE NOTICE 'Orphan buildings: %', orphan_buildings;
  RAISE NOTICE 'Orphan locations: %', orphan_locations;
  RAISE NOTICE 'Users NOT assigned (organization_id stays NULL)';
  RAISE NOTICE 'Total users: %', (SELECT COUNT(*) FROM users);

  IF orphan_buildings > 0 OR orphan_locations > 0 THEN
    RAISE EXCEPTION 'CRITICAL: Orphan data found! Rolling back.';
  END IF;

  RAISE NOTICE '=== ALL CHECKS PASSED ===';
END $$;

COMMIT;
