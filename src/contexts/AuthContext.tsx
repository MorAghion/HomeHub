import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

// Rate-limit constants for join-household attempts (client-side, sessionStorage)
const JOIN_ATTEMPTS_KEY = 'homehub-join-attempts';
const JOIN_LOCK_KEY = 'homehub-join-lock-until';
const MAX_JOIN_ATTEMPTS = 5;
const JOIN_LOCK_MS = 15 * 60 * 1000; // 15 minutes

interface UserProfile {
  id: string;
  household_id: string;
  display_name: string | null;
  household_owner_id: string | null; // owner_id from the households table
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isOwner: boolean; // true if current user is the household owner
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createInvite: () => Promise<{ code: string | null; error: any }>;
  joinHousehold: (inviteCode: string) => Promise<{ error: any }>;
  removeMember: (memberId: string) => Promise<{ error: any }>;
  deleteHousehold: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwner = profile !== null && profile.id === profile.household_owner_id;

  // Fetch user profile + household owner_id in one round-trip
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Also fetch the household to get owner_id
      const { data: householdData } = await supabase
        .from('households')
        .select('owner_id')
        .eq('id', profileData.household_id)
        .single();

      setProfile({
        id: profileData.id,
        household_id: profileData.household_id,
        display_name: profileData.display_name,
        household_owner_id: householdData?.owner_id ?? null,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Safety net: if nothing resolves within 8s, unblock the UI
    const safetyTimer = setTimeout(() => setLoading(false), 8000);

    // Get initial session — await profile so we never flash the auth screen
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
        clearTimeout(safetyTimer);
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(safetyTimer);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
        // Only process pending invite on a fresh sign-in, not on token
        // refreshes or initial session restores (which would cause a retry
        // loop on every page load if a stale key is in localStorage)
        if (event === 'SIGNED_IN') {
          const pendingCode = localStorage.getItem('homehub-pending-invite');
          if (pendingCode) {
            localStorage.removeItem('homehub-pending-invite');
            try {
              let joined = false;
              for (let attempt = 0; attempt < 5; attempt++) {
                if (attempt > 0) {
                  await new Promise((r) => setTimeout(r, 500 * attempt));
                }
                const { error } = await supabase.rpc('join_household_via_invite', {
                  invite_code_param: pendingCode,
                });
                if (!error) { joined = true; break; }
              }
              if (joined) await fetchProfile(session.user.id);
            } catch (err) {
              console.error('[Auth] Failed to process pending invite:', err);
            }
          }
        }
      } else {
        setProfile(null);
      }
      clearTimeout(safetyTimer);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) return { error };

      // Profile will be auto-created by database trigger.
      // Profile loading is handled by onAuthStateChange listener.

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      // Profile loading is handled by onAuthStateChange listener (SIGNED_IN event).
      // We intentionally do NOT await fetchProfile here to avoid hanging the
      // caller if the Supabase query is slow or stalls.

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const createInvite = async () => {
    try {
      const { data, error } = await supabase.rpc('create_household_invite', {
        days_valid: 1, // 24-hour invite codes
      });

      if (error) throw error;

      return { code: data, error: null };
    } catch (error) {
      console.error('Error creating invite:', error);
      return { code: null, error };
    }
  };

  const joinHousehold = async (inviteCode: string) => {
    // ── Rate-limit check ────────────────────────────────────────────────────
    const lockUntilStr = sessionStorage.getItem(JOIN_LOCK_KEY);
    if (lockUntilStr) {
      const lockUntil = parseInt(lockUntilStr, 10);
      if (Date.now() < lockUntil) {
        const remaining = Math.ceil((lockUntil - Date.now()) / 60_000);
        return {
          error: {
            message: `Too many failed attempts. Try again in ${remaining} minute${remaining !== 1 ? 's' : ''}.`,
          },
        };
      }
      // Lock expired — reset counters
      sessionStorage.removeItem(JOIN_LOCK_KEY);
      sessionStorage.removeItem(JOIN_ATTEMPTS_KEY);
    }
    // ── End rate-limit check ────────────────────────────────────────────────

    try {
      const { error } = await supabase.rpc('join_household_via_invite', {
        invite_code_param: inviteCode,
      });

      if (error) throw error;

      // Success — clear rate-limit state and refresh profile
      sessionStorage.removeItem(JOIN_ATTEMPTS_KEY);
      sessionStorage.removeItem(JOIN_LOCK_KEY);

      if (user) {
        await fetchProfile(user.id);
      }

      return { error: null };
    } catch (error) {
      // Track the failed attempt
      const attempts = parseInt(sessionStorage.getItem(JOIN_ATTEMPTS_KEY) || '0', 10) + 1;
      if (attempts >= MAX_JOIN_ATTEMPTS) {
        sessionStorage.setItem(JOIN_LOCK_KEY, String(Date.now() + JOIN_LOCK_MS));
        sessionStorage.removeItem(JOIN_ATTEMPTS_KEY);
      } else {
        sessionStorage.setItem(JOIN_ATTEMPTS_KEY, String(attempts));
      }
      console.error('Error joining household:', error);
      return { error };
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase.rpc('remove_household_member', {
        member_id: memberId,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error removing member:', error);
      return { error };
    }
  };

  const deleteHousehold = async () => {
    try {
      const { error } = await supabase.rpc('delete_household');

      if (error) throw error;

      // Profile is now cascade-deleted; sign out to reach a clean state
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);

      return { error: null };
    } catch (error) {
      console.error('Error deleting household:', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isOwner,
    signUp,
    signIn,
    signOut,
    createInvite,
    joinHousehold,
    removeMember,
    deleteHousehold,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
