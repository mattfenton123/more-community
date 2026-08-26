"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
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

  const signInWithDemo = async () => {
    // Generate a random demo email so it works multiple times
    const randomNum = Math.floor(Math.random() * 10000);
    const demoEmail = `demo${randomNum}@morecommunity.app`;
    const password = 'DemoPassword123!';
    
    let { error } = await supabase.auth.signUp({
      email: demoEmail,
      password,
    });
    
    // Explicitly sign in just in case signUp didn't auto-login
    if (!error) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password,
      });
      error = signInErr;
    }

    return { error, demoEmail };
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
      signInWithDemo,
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
