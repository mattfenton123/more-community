"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const safetyTimeout = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 2000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      clearTimeout(safetyTimeout);
      setSession(session);
      setAuthUser(session?.user ?? null);
      setIsLoading(false);
    }).catch(err => {
      if (!mounted) return;
      clearTimeout(safetyTimeout);
      console.warn('Error fetching auth session:', err);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      clearTimeout(safetyTimeout);
      setSession(session);
      setAuthUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUpWithEmail = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    });
    return { data, error };
  };

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      }
    });
    return { error };
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      }
    });
    return { error };
  };

  const signInWithFacebook = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      }
    });
    return { error };
  };

  const resetPassword = async (email) => {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/app/update-password` : undefined;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return { data, error };
  };

  const resendConfirmationEmail = async (email) => {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      authUser,
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithApple,
      signInWithFacebook,
      resetPassword,
      resendConfirmationEmail,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

