import React, { createContext, useEffect, useMemo, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'agency' | 'client' | null;

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  userClientId: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const [userClientId, setUserClientId] = useState<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      // Fetch role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
        setRole('agency'); // fallback
      } else {
        setRole((roleData?.role as UserRole) || 'agency');
      }

      // Fetch client_id from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setUserClientId(null);
      } else {
        setUserClientId(profileData?.client_id || null);
      }
    } catch (err) {
      console.error('Unexpected error fetching role:', err);
      setRole('agency');
      setUserClientId(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setRole(null);
        setUserClientId(null);
        setLoading(false);
      } else if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer to avoid Supabase auth deadlock
          setTimeout(() => {
            if (mounted) {
              fetchUserRole(session.user.id).finally(() => {
                if (mounted) setLoading(false);
              });
            }
          }, 0);
        } else {
          setLoading(false);
        }
      }
    });

    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session initialization error:', error);
          setSession(null);
          setUser(null);
        } else if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserRole(session.user.id);
          }
        }
      } catch (error) {
        console.error('Unexpected session error:', error);
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    return { error } as { error: Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error } as { error: Error | null };
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('sb-qfbhcixkxzivpmxlciot-auth-token');
      await supabase.auth.signOut({ scope: 'global' }).catch(() => {});
      setSession(null);
      setUser(null);
      setRole(null);
      setUserClientId(null);
      return { error: null };
    } catch (err) {
      console.error('Unexpected sign out error:', err);
      setSession(null);
      setUser(null);
      setRole(null);
      setUserClientId(null);
      return { error: null };
    }
  };

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    loading,
    role,
    userClientId,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, role, userClientId]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
