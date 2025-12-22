import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  company?: string;
  job_title?: string;
  bio?: string;
  account_type: 'client' | 'freelancer';
  skills?: string;
  website?: string;
  created_at: string;
  avatar_url?: string;
  is_client?: boolean;
  is_freelancer?: boolean;
  isAdmin?: boolean;
  adminLevel?: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  accessToken: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, accountType: 'client' | 'freelancer') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile/${userId}`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }, []);

  useEffect(() => {
    auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = async (email: string, password: string, fullName: string, accountType: 'client' | 'freelancer') => {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/signup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ email, password, fullName, accountType })
      }
    );
    if (!response.ok) throw new Error('Sign up failed');
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await auth.signOut();
  };

  const signInWithGoogle = async () => {
    await auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `https://casewhr.com/auth/callback` }
    });
  };

  const signInWithGithub = async () => {
    await auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `https://casewhr.com/auth/callback` }
    });
  };

  const signInWithFacebook = async () => {
    await auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `https://casewhr.com/auth/callback` }
    });
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, accessToken, loading,
      signUp, signIn, signOut,
      signInWithGoogle, signInWithGithub, signInWithFacebook,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
