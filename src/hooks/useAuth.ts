// src/hooks/useAuth.ts - EMERGENCY FIX: Remove infinite loop
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { authStorage } from '../lib/authStorage';
import type { Database } from '../types/database.types';

// Define the profile type based on your database schema
export type UserProfile = Omit<Database['public']['Tables']['users']['Row'], 'password_hash'>;

export interface AppUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  profile?: UserProfile | null;
}

interface UseAuthReturn {
  user: AppUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearSessionExpired: () => void;
}

// ⚡ PERFORMANCE: Cache profile in memory (profile rarely changes)
let cachedProfile: UserProfile | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes - profile rarely changes

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const initRef = useRef(false); // ✅ Prevent double init
  const retryCountRef = useRef(0); // ✅ Track retry attempts
  const maxRetries = 3; // ✅ Maximum retry attempts

  // ⚡ Fast profile fetch with cache (profile data rarely changes)
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      // Check cache first - PERFORMANCE BOOST
      const now = Date.now();
      if (cachedProfile && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('⚡ Using cached profile (fast!)');
        return cachedProfile;
      }

      console.log('🔄 Fetching fresh profile...');

      const { data, error: profileError } = await supabase
        .from('users')
        .select('id, email, full_name, is_active, can_submit, occupation_id')
        .eq('id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        return null;
      }

      if (!data) {
        console.warn('⚠️ No profile found');
        return null;
      }

      // Update cache - next load will be instant
      cachedProfile = data;
      cacheTimestamp = now;

      console.log('✅ Profile loaded & cached');
      return data;
    } catch (err) {
      console.error('❌ Profile fetch failed:', err);
      return null;
    }
  };

  // ✅ ONLY update last login on actual sign in
  const updateLastLogin = async (userId: string): Promise<void> => {
    try {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
      console.log('✅ Last login updated');
    } catch (err) {
      console.error('❌ Last login update failed:', err);
    }
  };

  // Refresh profile
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    const profileData = await fetchUserProfile(user.id);
    setProfile(profileData);
  }, [user?.id]);

  // ✅ Retry logic for failed auth attempts
  const retryAuth = useCallback(async (): Promise<boolean> => {
    if (retryCountRef.current >= maxRetries) {
      console.error('❌ Max retry attempts reached');
      return false;
    }

    retryCountRef.current++;
    console.log(`🔄 Retrying auth attempt ${retryCountRef.current}/${maxRetries}`);

    // Wait before retry (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000);
    await new Promise(resolve => setTimeout(resolve, delay));

    return true;
  }, []);

  // ✅ Initialize ONCE with timeout protection
  useEffect(() => {
    if (initRef.current) {
      console.log('🔍 Init already ran, skipping');
      return;
    }
    initRef.current = true;

    const initAuth = async () => {
      console.log('🔐 Initializing auth...');

      // ✅ TIMEOUT protection: Force complete after 10 seconds (increased from 5)
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Auth timeout - session may have expired');
        setLoading(false);
        // If we timed out and have no user, likely session expired
        if (!user) {
          setSessionExpired(true);
        }
      }, 10000); // Increased to 10 seconds

      try {
        console.log('[useAuth] Calling supabase.auth.getSession()...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[useAuth] getSession() returned:', JSON.stringify({ hasSession: !!session, hasError: !!sessionError }));

        clearTimeout(timeoutId);

        if (sessionError || !session?.user) {
          console.log('[useAuth] No session');
          authStorage.clear();
          setUser(null);
          setProfile(null);
          setLoading(false);
          
          // ✅ If there's an error, try to retry
          if (sessionError) {
            const shouldRetry = await retryAuth();
            if (shouldRetry) {
              // Retry auth initialization
              initAuth();
              return;
            }
          }
          return;
        }

        console.log('[useAuth] Session found');
        authStorage.save(session);

        const appUser: AppUser = {
          id: session.user.id,
          email: session.user.email!,
          user_metadata: session.user.user_metadata,
          app_metadata: session.user.app_metadata,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at,
        };

        // ✅ FIX: Set user state immediately, React handles unmounted components safely
        setUser(appUser);
        setLoading(false);

        // Fetch profile in background (non-blocking)
        fetchUserProfile(session.user.id).then(profileData => {
          setProfile(profileData);
        });
      } catch (err) {
        console.error('❌ Auth init error:', err);
        clearTimeout(timeoutId);
        setUser(null);
        setProfile(null);
        setLoading(false);
        
        // ✅ Retry on catch
        const shouldRetry = await retryAuth();
        if (shouldRetry) {
          initAuth();
        }
      }
    };

    initAuth();

    // ✅ FIX: Don't reset initRef in cleanup to prevent infinite loop
    // React Strict Mode will remount, but we want to keep initRef.current = true
  }, []); // ✅ Empty deps - run ONCE only

  // ✅ Handle auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth event: ${event}`);

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            authStorage.save(session);

            const appUser: AppUser = {
              id: session.user.id,
              email: session.user.email!,
              user_metadata: session.user.user_metadata,
              app_metadata: session.user.app_metadata,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at,
            };

            setUser(appUser);

            // Fetch profile and update last login
            const profileData = await fetchUserProfile(session.user.id);
            setProfile(profileData);

            // ✅ ONLY update on sign in
            await updateLastLogin(session.user.id);
          }
          break;

        case 'TOKEN_REFRESHED':
          // ✅ DO NOTHING - don't refetch or update
          console.log('✅ Token refreshed silently');
          break;

        case 'SIGNED_OUT':
          authStorage.clear();
          cachedProfile = null; // Clear cache
          cacheTimestamp = 0;
          // Only show session expired if user was previously authenticated (not manual sign out)
          if (user) {
            setSessionExpired(true);
          }
          setUser(null);
          setProfile(null);
          console.log('🗑️ Signed out');
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // ✅ Empty deps - setup ONCE

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      authStorage.clear();
      cachedProfile = null; // Clear cache
      cacheTimestamp = 0;
      setUser(null);
      setProfile(null);
      console.log('✅ Signed out');
    } catch (err) {
      console.error('❌ Sign out error:', err);
    }
  }, []);

  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    sessionExpired,
    signOut,
    refreshProfile,
    clearSessionExpired,
  };
}

export function useUserProfile() {
  const { profile } = useAuth();

  return {
    fullName: profile?.full_name || 'User',
    email: profile?.email || '',
    occupationId: profile?.occupation_id,
    isActive: profile?.is_active ?? false,
  };
}