-- =============================================================================
-- 🚨 EMERGENCY FIX: Assign Roles to Users
-- =============================================================================
-- Problem: All users showing as "pengguna biasa" (no role assigned)
-- Solution: Assign proper roles to existing users
-- =============================================================================

-- STEP 1: Check current state (should show NO roles assigned)
-- =============================================================================
SELECT
  '🔍 CHECK 1: Users without roles' as check_name,
  COUNT(*) as count
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.is_active = true AND ur.id IS NULL;

-- =============================================================================
-- STEP 2: Assign SYSTEM ADMIN role to agdscid@gmail.com
-- =============================================================================
DO $$
DECLARE
  admin_user_id UUID;
  system_admin_role_id TEXT := 'b0862158-6676-4140-b81a-4daf78021f17'; -- From your logs
BEGIN
  -- Get user ID for agdscid@gmail.com
  SELECT id INTO admin_user_id
  FROM users
  WHERE email = 'agdscid@gmail.com'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Assign system_admin role (level 100)
    INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
    VALUES (admin_user_id, system_admin_role_id, NOW(), admin_user_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    RAISE NOTICE '✅ System Admin role assigned to agdscid@gmail.com';
  ELSE
    RAISE WARNING '⚠️ User agdscid@gmail.com not found!';
  END IF;
END $$;

-- =============================================================================
-- STEP 3: Assign ADMIN role (level 80) to other admin emails
-- =============================================================================
-- 🚨 CUSTOMIZE THIS: Add your other admin emails here
DO $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    -- 'admin2@example.com',  -- Uncomment and add more emails
    -- 'admin3@example.com'
  ];
  admin_email TEXT;
  admin_user_id UUID;
  admin_role_id TEXT;
BEGIN
  -- Get admin role ID (level 80)
  SELECT id INTO admin_role_id
  FROM roles
  WHERE level = 80
  LIMIT 1;

  IF admin_role_id IS NULL THEN
    RAISE WARNING '⚠️ Admin role (level 80) not found in roles table!';
    RETURN;
  END IF;

  -- Assign admin role to each email
  FOREACH admin_email IN ARRAY admin_emails
  LOOP
    SELECT id INTO admin_user_id
    FROM users
    WHERE email = admin_email
    LIMIT 1;

    IF admin_user_id IS NOT NULL THEN
      INSERT INTO user_roles (user_id, role_id, assigned_at)
      VALUES (admin_user_id, admin_role_id, NOW())
      ON CONFLICT (user_id, role_id) DO NOTHING;

      RAISE NOTICE '✅ Admin role assigned to: %', admin_email;
    ELSE
      RAISE WARNING '⚠️ User not found: %', admin_email;
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- STEP 4: Assign DEFAULT USER role to all other users
-- =============================================================================
-- This ensures everyone can login and use the system
DO $$
DECLARE
  default_role_id TEXT;
  assigned_count INTEGER := 0;
BEGIN
  -- Get inspector role (level 10) or lowest role available
  SELECT id INTO default_role_id
  FROM roles
  WHERE is_active = true
  ORDER BY level ASC
  LIMIT 1;

  IF default_role_id IS NULL THEN
    RAISE WARNING '⚠️ No default role found in roles table!';
    RETURN;
  END IF;

  -- Assign role to users who don't have one yet
  WITH inserted AS (
    INSERT INTO user_roles (user_id, role_id, assigned_at)
    SELECT
      u.id,
      default_role_id,
      NOW()
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    WHERE u.is_active = true
      AND ur.id IS NULL
    ON CONFLICT (user_id, role_id) DO NOTHING
    RETURNING user_id
  )
  SELECT COUNT(*) INTO assigned_count FROM inserted;

  RAISE NOTICE '✅ Default role assigned to % users', assigned_count;
END $$;

-- =============================================================================
-- STEP 5: VERIFICATION - Check role assignments
-- =============================================================================

-- Show all users with their roles
SELECT
  u.email,
  u.full_name,
  r.name as role_name,
  r.level as role_level,
  CASE
    WHEN r.level >= 100 THEN '👑 System Admin'
    WHEN r.level >= 90 THEN '⭐ Super Admin'
    WHEN r.level >= 80 THEN '🔧 Admin'
    WHEN r.level >= 50 THEN '👥 Manager'
    ELSE '👤 Inspector/User'
  END as access_level,
  ur.assigned_at
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
WHERE u.is_active = true
ORDER BY r.level DESC, u.email;

-- Check if there are still users without roles
SELECT
  COUNT(*) as users_without_roles,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ ALL USERS HAVE ROLES'
    ELSE '❌ SOME USERS STILL MISSING ROLES'
  END as status
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.is_active = true
  AND ur.id IS NULL;

-- Show admin count
SELECT
  COUNT(*) as admin_count,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ AT LEAST ONE ADMIN EXISTS'
    ELSE '❌ NO ADMIN - CRITICAL!'
  END as status
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE r.level >= 80;

-- =============================================================================
-- NOTES:
-- =============================================================================
/*
After running this script:

1. agdscid@gmail.com should have system_admin role (level 100)
2. Other specified emails should have admin role (level 80)
3. All other users should have default inspector/user role

To verify:
- Logout and login again
- Check that you can access /user-management
- Check that admin users can see all reports

If you need to assign more admins later, use the UserManagement page
or run this query:

  INSERT INTO user_roles (user_id, role_id, assigned_at)
  VALUES (
    (SELECT id FROM users WHERE email = 'email@example.com'),
    (SELECT id FROM roles WHERE level = 80),  -- Admin role
    NOW()
  )
  ON CONFLICT (user_id, role_id) DO NOTHING;
*/

-- =============================================================================
-- 🎯 FINAL STATUS CHECK
-- =============================================================================
SELECT
  '🎯 EMERGENCY FIX STATUS' as title,
  (SELECT COUNT(*) FROM user_roles) as total_role_assignments,
  (SELECT COUNT(*) FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id WHERE u.is_active = true AND ur.id IS NULL) as users_without_roles,
  (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.level >= 80) as admin_count,
  CASE
    WHEN (SELECT COUNT(*) FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id WHERE u.is_active = true AND ur.id IS NULL) = 0
      AND (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.level >= 80) > 0
    THEN '✅✅✅ FIX SUCCESSFUL ✅✅✅'
    ELSE '❌ FIX INCOMPLETE - CHECK ERRORS ABOVE'
  END as overall_status;
