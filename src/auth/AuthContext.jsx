// src/auth/AuthContext.js
import { createContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../api/supabase';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const fetchProfile = useCallback(async (userId) => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();  // ← Change this from .single() to .maybeSingle()

    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
    
    return data;  // Will be null if no profile exists
  } catch (error) {
    console.error('Profile fetch error:', error);
    return null;
  }
}, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
        }
        
        if (mounted && session?.user) {
          setUser(session.user);
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            setProfile(profile);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) setIsInitialLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
          setAuthError(null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'USER_UPDATED') {
          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            setProfile(profile);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // FIXED: Email/Password Login with better error handling
  const loginWithEmail = useCallback(async (email, password) => {
    setIsOperationLoading(true);
    setAuthError(null);
    
    try {
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (error) {
        console.error('Login error:', error);
        
        // Enhanced error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address. Check your inbox for the confirmation link.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
        }
        
        setAuthError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      if (!data?.user) {
        setAuthError('Login failed. No user data returned.');
        return { success: false, error: 'Login failed. Please try again.' };
      }
      
      console.log('Login successful:', data.user.email);
      setAuthError(null);
      return { success: true, data };
      
    } catch (error) {
      console.error('Login exception:', error);
      const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsOperationLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsOperationLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setAuthError(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsOperationLoading(false);
    }
  }, []);

  const hasRole = useCallback((role) => {
    return profile?.role === role;
  }, [profile]);

  const value = {
    user,
    profile,
    isInitialLoading,
    isOperationLoading,
    authError,
    loginWithEmail,
    logout,
    hasRole,
    isAuthenticated: !!user && !!profile,
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f9]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}