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

interface MemberNotification {
  type: 'member_joined';
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isOwner: boolean; // true if current user is the household owner
  notification: MemberNotification | null;
  clearNotification: () => void;
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
  // Start loading=true only if a stored session exists — so unauthenticated users
  // see the auth screen immediately without waiting for getSession() to resolve.
  const [loading, setLoading] = useState(() => {
    return localStorage.getItem('sb-wwqvjiekakjetspucfxp-auth-token') !== null;
  });
  const [notification, setNotification] = useState<MemberNotification | null>(null);

  const isOwner = profile !== null && profile.id === profile.household_owner_id;

  const clearNotification = () => setNotification(null);

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
    if (import.meta.env.DEV) console.log('[AUTH] AuthContext useEffect: mounting — initial loading:', loading);

    // Safety net: if nothing resolves within 8s, unblock the UI
    const safetyTimer = setTimeout(() => {
      if (import.meta.env.DEV) console.warn('[AUTH] AuthContext: safety timer fired (8s) — forcing loading=false');
      setLoading(false);
    }, 8000);

    // Get initial session — await profile so we never flash the auth screen
    if (import.meta.env.DEV) console.log('[AUTH] AuthContext: calling getSession()...');
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (import.meta.env.DEV) console.log('[AUTH] AuthContext getSession: resolved — session present:', !!session, 'user:', session?.user?.email?.slice(0, 3) + '***');
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          if (import.meta.env.DEV) console.log('[AUTH] AuthContext getSession: fetching profile for user:', session.user.id);
          await fetchProfile(session.user.id);
          if (import.meta.env.DEV) console.log('[AUTH] AuthContext getSession: profile fetch complete');
        }
        clearTimeout(safetyTimer);
        if (import.meta.env.DEV) console.log('[AUTH] AuthContext getSession: setting loading=false');
        setLoading(false);
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error('[AUTH] AuthContext getSession: error —', err);
        clearTimeout(safetyTimer);
        setLoading(false);
      });

    // Listen for auth changes.
    // IMPORTANT: This callback must NOT be async at the top level.
    // Supabase JS v2 may hold an internal auth lock while the callback runs.
    // An async callback that awaits Supabase queries (fetchProfile) would block
    // the lock indefinitely, causing subsequent signInWithPassword calls to hang
    // with no network activity. Fix: make the callback synchronous; schedule all
    // async work via a detached promise (no await at the callback level).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (import.meta.env.DEV) console.log('[AUTH] onAuthStateChange fired — event:', event, 'session present:', !!session, 'user:', session?.user?.email?.slice(0, 3) + '***');

      // Synchronous state updates — safe to call immediately
      setSession(session);
      setUser(session?.user ?? null);

      // Release the safety timer — we have a definitive auth result
      clearTimeout(safetyTimer);

      if (!session?.user) {
        if (import.meta.env.DEV) console.log('[AUTH] onAuthStateChange: no user — clearing profile, loading=false');
        setProfile(null);
        setLoading(false);
        return;
      }

      // Detached async handler — runs OUTSIDE the onAuthStateChange lock.
      // This is the correct Supabase v2 pattern: the callback itself is sync;
      // all async work is scheduled but not awaited here.
      const handleAuthSession = async () => {
        if (import.meta.env.DEV) console.log('[AUTH] onAuthStateChange handleAuthSession: fetching profile for', session.user.id);
        try {
          await fetchProfile(session.user.id);
          if (import.meta.env.DEV) console.log('[AUTH] onAuthStateChange handleAuthSession: profile fetched OK');

          // Only process pending invite on a fresh sign-in — not on token refreshes
          // or initial session restores (avoids retry loop on every page load)
          if (event === 'SIGNED_IN') {
            if (import.meta.env.DEV) console.log('[AUTH] onAuthStateChange: SIGNED_IN event — checking for pending invite');
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
                if (import.meta.env.DEV) console.log('[AUTH] onAuthStateChange: invite join result — joined:', joined);
                if (joined) {
                  await fetchProfile(session.user.id);
                  localStorage.setItem('homehub-just-joined', 'true');
                }
              } catch (err) {
                console.error('[Auth] Failed to process pending invite:', err);
              }
            }
          }
        } catch (err) {
          if (import.meta.env.DEV) console.error('[AUTH] onAuthStateChange handleAuthSession: error —', err);
        } finally {
          if (import.meta.env.DEV) console.log('[AUTH] onAuthStateChange handleAuthSession: setting loading=false');
          setLoading(false);
        }
      };

      handleAuthSession();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime: watch for new members joining the household and emit a notification
  useEffect(() => {
    if (!profile?.household_id) return;

    const channel = supabase
      .channel(`household-members-${profile.household_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_profiles',
          filter: `household_id=eq.${profile.household_id}`,
        },
        (payload) => {
          const newMember = payload.new as { id: string; display_name: string | null };
          // Don't notify the joining user about themselves
          if (newMember.id !== profile.id) {
            setNotification({
              type: 'member_joined',
              displayName: newMember.display_name ?? 'Someone',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.household_id, profile?.id]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
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
    if (import.meta.env.DEV) console.log('[AUTH] signIn(): entry — email:', email.slice(0, 3) + '***');
    try {
      if (import.meta.env.DEV) console.log('[AUTH] signIn(): calling supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (import.meta.env.DEV) console.log('[AUTH] signIn(): supabase response — user:', data?.user?.id ?? 'none', 'error:', error ?? 'none');

      if (error) return { error };

      // Profile loading is handled by onAuthStateChange listener (SIGNED_IN event).
      // We intentionally do NOT await fetchProfile here to avoid hanging the
      // caller if the Supabase query is slow or stalls.

      return { error: null };
    } catch (error) {
      if (import.meta.env.DEV) console.error('[AUTH] signIn(): threw unexpectedly —', error);
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
    notification,
    clearNotification,
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
