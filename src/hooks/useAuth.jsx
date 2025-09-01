import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import supabaseAuth from '@/api/supabaseAuth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        await supabaseAuth.waitForAuth();
        
        if (mounted) {
          setUser(supabaseAuth.getUser());
          setSession(supabaseAuth.getSession());
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    const result = await supabaseAuth.signOut();
    setLoading(false);
    return result;
  };

  const isAuthenticated = () => {
    return !!user && !!session;
  };

  return {
    user,
    session,
    loading,
    isAuthenticated: isAuthenticated(),
    signOut,
    // Convenience methods
    userId: user?.id,
    userEmail: user?.email,
    userMetadata: user?.user_metadata || {}
  };
}

export default useAuth;