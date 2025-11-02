/**
 * Admin Access Debugger
 *
 * Instructions:
 * 1. Login as superadmin
 * 2. Open browser console (F12)
 * 3. Copy-paste this entire file into console
 * 4. Press Enter
 * 5. Share the output with developer
 */

(async function debugAdminAccess() {
  console.log('🔍 Starting Admin Access Debug...\n');

  const results = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: [],
  };

  // Check 1: Supabase Client
  try {
    console.log('1️⃣ Checking Supabase Client...');

    if (typeof supabase === 'undefined') {
      throw new Error('Supabase client not found. Make sure you are on the app page.');
    }

    results.checks.supabaseClient = '✅ Found';
    console.log('✅ Supabase client found\n');
  } catch (error) {
    results.checks.supabaseClient = '❌ ' + error.message;
    results.errors.push(error.message);
    console.error('❌', error.message, '\n');
  }

  // Check 2: Current Session
  try {
    console.log('2️⃣ Checking Authentication Session...');

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;
    if (!session) throw new Error('No active session found. Please login first.');

    results.checks.session = {
      status: '✅ Active',
      userId: session.user.id,
      email: session.user.email,
      tokenLength: session.access_token.length,
      expiresAt: new Date(session.expires_at * 1000).toISOString(),
    };

    console.log('✅ Session active');
    console.log('   User ID:', session.user.id);
    console.log('   Email:', session.user.email);
    console.log('   Token expires:', new Date(session.expires_at * 1000).toLocaleString());
    console.log('\n');

    // Store token for later tests
    window.DEBUG_TOKEN = session.access_token;

  } catch (error) {
    results.checks.session = '❌ ' + error.message;
    results.errors.push(error.message);
    console.error('❌', error.message, '\n');
    return results;
  }

  // Check 3: User Role in Database (Direct Query)
  try {
    console.log('3️⃣ Checking User Role in Database...');

    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles!user_roles_role_id_fkey (
          id,
          name,
          level,
          description
        )
      `)
      .eq('user_id', results.checks.session.userId)
      .maybeSingle();

    if (error) throw error;

    if (!userRole) {
      results.checks.databaseRole = '❌ No role assigned in database';
      console.warn('⚠️ User has no role assigned in user_roles table!');
      console.log('   This user needs a role to access admin pages.\n');
    } else {
      const role = userRole.roles;
      results.checks.databaseRole = {
        status: '✅ Found',
        name: role.name,
        level: role.level,
        isAdmin: role.level >= 80,
        isSuperAdmin: role.level >= 100,
      };

      console.log('✅ Role found in database');
      console.log('   Role:', role.name);
      console.log('   Level:', role.level);
      console.log('   Is Admin (≥80):', role.level >= 80);
      console.log('   Is SuperAdmin (≥100):', role.level >= 100);
      console.log('\n');
    }

  } catch (error) {
    results.checks.databaseRole = '❌ ' + error.message;
    results.errors.push('Database query error: ' + error.message);
    console.error('❌', error.message, '\n');
  }

  // Check 4: API Health Endpoint
  try {
    console.log('4️⃣ Testing Backend API Health...');

    const healthResponse = await fetch('/api/health');
    const healthData = await healthResponse.json();

    results.checks.apiHealth = {
      status: healthResponse.ok ? '✅ Working' : '❌ Failed',
      statusCode: healthResponse.status,
      data: healthData,
    };

    if (healthResponse.ok) {
      console.log('✅ Backend API is working');
      console.log('   Has Supabase URL:', healthData.environment?.hasSupabaseUrl);
      console.log('   Has Service Key:', healthData.environment?.hasServiceKey);

      if (!healthData.environment?.hasSupabaseUrl || !healthData.environment?.hasServiceKey) {
        console.error('⚠️ WARNING: Backend missing environment variables!');
        results.errors.push('Backend missing env vars');
      }
    } else {
      console.error('❌ Backend API health check failed');
    }
    console.log('\n');

  } catch (error) {
    results.checks.apiHealth = '❌ ' + error.message;
    results.errors.push('API health check error: ' + error.message);
    console.error('❌ API health error:', error.message, '\n');
  }

  // Check 5: Verify Role API Endpoint
  try {
    console.log('5️⃣ Testing Backend Role Verification API...');

    const verifyResponse = await fetch('/api/auth/verify-role', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${window.DEBUG_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const verifyData = await verifyResponse.json();

    results.checks.apiVerifyRole = {
      status: verifyResponse.ok ? '✅ Working' : '❌ Failed',
      statusCode: verifyResponse.status,
      data: verifyData,
    };

    if (verifyResponse.ok) {
      console.log('✅ Backend role verification working');
      console.log('   User ID:', verifyData.data?.userId);
      console.log('   Role:', verifyData.data?.role?.name, '(Level:', verifyData.data?.role?.level + ')');
      console.log('   Is Admin:', verifyData.data?.isAdmin);
      console.log('   Is SuperAdmin:', verifyData.data?.isSuperAdmin);
    } else {
      console.error('❌ Backend role verification failed');
      console.error('   Status:', verifyResponse.status);
      console.error('   Error:', verifyData.error || verifyData.message);

      if (verifyResponse.status === 500) {
        console.error('   → Check Vercel function logs for details');
        results.errors.push('API returned 500 - backend error');
      }
      if (verifyResponse.status === 401) {
        console.error('   → Token might be expired or invalid');
        results.errors.push('API returned 401 - unauthorized');
      }
    }
    console.log('\n');

  } catch (error) {
    results.checks.apiVerifyRole = '❌ ' + error.message;
    results.errors.push('Verify role API error: ' + error.message);
    console.error('❌ Verify role error:', error.message, '\n');
  }

  // Check 6: React Query Cache (Frontend State)
  try {
    console.log('6️⃣ Checking Frontend State (React Query)...');

    // Try to access React Query cache if available
    const queryClient = window.queryClient;

    if (queryClient) {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();

      const verifyRoleQuery = queries.find(q => q.queryKey[0] === 'verify-role');

      if (verifyRoleQuery) {
        results.checks.frontendState = {
          status: '✅ Found',
          data: verifyRoleQuery.state.data,
          error: verifyRoleQuery.state.error,
          status: verifyRoleQuery.state.status,
        };

        console.log('✅ Frontend state found');
        console.log('   Query status:', verifyRoleQuery.state.status);
        console.log('   Is Admin:', verifyRoleQuery.state.data?.isAdmin);
        console.log('   Is SuperAdmin:', verifyRoleQuery.state.data?.isSuperAdmin);
      } else {
        console.log('⚠️ No verify-role query in cache yet');
        results.checks.frontendState = '⚠️ Query not in cache';
      }
    } else {
      console.log('⚠️ React Query client not accessible from console');
      results.checks.frontendState = '⚠️ Not accessible';
    }
    console.log('\n');

  } catch (error) {
    results.checks.frontendState = '⚠️ ' + error.message;
    console.log('⚠️', error.message, '\n');
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const totalChecks = Object.keys(results.checks).length;
  const passedChecks = Object.values(results.checks).filter(c =>
    typeof c === 'object' ? c.status?.includes('✅') : c.includes('✅')
  ).length;

  console.log(`Checks passed: ${passedChecks}/${totalChecks}`);

  if (results.errors.length > 0) {
    console.log('\n🚨 ERRORS FOUND:');
    results.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
  } else {
    console.log('\n✅ No critical errors found!');
  }

  console.log('\n📋 Full Results:');
  console.log(results);

  console.log('\n💡 Next Steps:');
  if (results.errors.length > 0) {
    console.log('   1. Copy the output above');
    console.log('   2. Share with developer');
    console.log('   3. Check Vercel deployment logs if API errors');
  } else {
    console.log('   Everything looks good! If admin page still blocked,');
    console.log('   clear browser cache and hard refresh (Ctrl+Shift+R)');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Store results globally for easy access
  window.DEBUG_RESULTS = results;
  console.log('💾 Results saved to window.DEBUG_RESULTS');

  return results;
})();
