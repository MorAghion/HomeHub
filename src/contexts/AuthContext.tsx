import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface UserProfile {
  id: string;
  household_id: string;
  display_name: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createInvite: () => Promise<{ code: string | null; error: any }>;
  joinHousehold: (inviteCode: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Safety net: if nothing resolves within 8s, unblock the UI
    const safetyTimer = setTimeout(() => setLoading(false), 8000);

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
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

      // Profile will be auto-created by database trigger
      if (data.user) {
        await fetchProfile(data.user.id);
      }

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

      if (data.user) {
        await fetchProfile(data.user.id);
      }

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
        days_valid: 7,
      });

      if (error) throw error;

      return { code: data, error: null };
    } catch (error) {
      console.error('Error creating invite:', error);
      return { code: null, error };
    }
  };

  const joinHousehold = async (inviteCode: string) => {
    try {
      const { error } = await supabase.rpc('join_household_via_invite', {
        invite_code_param: inviteCode,
      });

      if (error) throw error;

      // Refresh profile after joining
      if (user) {
        await fetchProfile(user.id);
      }

      return { error: null };
    } catch (error) {
      console.error('Error joining household:', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    createInvite,
    joinHousehold,
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
