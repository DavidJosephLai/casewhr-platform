import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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
  admin_role?: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  accessToken: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, accountType: 'client' | 'freelancer', preferredLanguage?: 'en' | 'zh') => Promise<void>; // ✅ 新增語言參數
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithLine: () => Promise<void>; // 🟢 新增 LINE 登入
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<string | null>; // 🔧 新增刷新 session
  isSpecialUser: boolean; // 🔧 新增：判斷是否為特殊用戶
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // ✅ 改為 false，不阻擋主頁渲染

  // Load user profile
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // ⏱️ 添加超时保护 - 如果 10 秒内没有完成初始化，强制设置 loading 为 false
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ [AuthContext] Session check timeout after 10s, forcing loading=false');
        setLoading(false);
      }
    }, 10000);

    // Check initial session
    auth.getSession().then(async (result) => {
      if (!mounted) return;
      
      // 清除超时定时器
      clearTimeout(timeoutId);
      
      // 處理返回結構: { data: { session }, error }
      const session = result?.data?.session || null;
      
      console.log('🔍 [AuthContext] Initial session check:', {
        hasResult: !!result,
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        userId: session?.user?.id
      });
      
      // 🧪 Check for dev mode first
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        console.log('🧪 [AuthContext] Dev mode detected, loading mock user...');
        try {
          const devUser = JSON.parse(localStorage.getItem('dev_mode_user') || '{}');
          const devProfile = JSON.parse(localStorage.getItem('dev_mode_profile') || '{}');
          const devTokenStr = localStorage.getItem('supabase.auth.token');
          
          console.log('🧪 [AuthContext] Dev mode data:', {
            hasDevUser: !!devUser.id,
            hasDevProfile: !!devProfile.id,
            devUserEmail: devUser.email,
            devProfileName: devProfile.full_name,
            hasDevToken: !!devTokenStr
          });
          
          if (devUser.id && devProfile.id && devTokenStr) {
            const devTokenData = JSON.parse(devTokenStr);
            const devToken = devTokenData.currentSession.access_token;
            
            setUser(devUser as User);
            setProfile(devProfile);
            setAccessToken(devToken);
            
            console.log('✅ [AuthContext] Dev mode user loaded:', devUser.email);
            console.log('✅ [AuthContext] Dev mode token:', devToken);
            setLoading(false);
            return;
          } else {
            // 🔥 開發模式數據不完整，自動清除開發模式
            console.warn('⚠️ [AuthContext] Dev mode data incomplete, clearing dev mode...');
            localStorage.removeItem('dev_mode_active');
            localStorage.removeItem('dev_mode_user');
            localStorage.removeItem('dev_mode_profile');
            console.log('✅ [AuthContext] Dev mode cleared, continuing with normal auth');
          }
        } catch (error) {
          console.error('❌ [AuthContext] Failed to load dev mode user:', error);
          // 🔥 發生錯誤時也清除開發模式
          localStorage.removeItem('dev_mode_active');
          localStorage.removeItem('dev_mode_user');
          localStorage.removeItem('dev_mode_profile');
          console.log('✅ [AuthContext] Dev mode cleared due to error');
        }
      }
      
      // Simply set the session data, don't try to refresh automatically
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      
      if (session?.access_token) {
        console.log('✅ [AuthContext] Access token loaded:', session.access_token.substring(0, 20) + '...');
      } else {
        console.log('⚠️ [AuthContext] No access token found');
      }
      
      if (session?.user) {
        console.log('👤 [AuthContext] User loaded:', { 
          email: session.user.email, 
          id: session.user.id 
        });
        loadProfile(session.user.id);
      } else {
        console.log('⚠️ [AuthContext] No user found in session');
      }
      setLoading(false);
    }).catch((error) => {
      console.error('❌ [AuthContext] Error getting session:', error);
      setUser(null);
      setAccessToken(null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      console.log('🔄 [AuthContext] Auth state changed:', _event, session ? 'Session exists' : 'No session');
      
      // 🧪 如果在开发模式下，忽略 Supabase 的 auth state changes
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        console.log('🧪 [AuthContext] Dev mode active, ignoring Supabase auth state change');
        return;
      }
      
      // Handle TOKEN_REFRESHED event
      if (_event === 'TOKEN_REFRESHED') {
        console.log('✅ [AuthContext] Token refreshed automatically by Supabase');
      }
      
      // Handle SIGNED_OUT event
      if (_event === 'SIGNED_OUT') {
        console.log('🔓 [AuthContext] User signed out');
        setUser(null);
        setAccessToken(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      
      if (session?.access_token) {
        console.log('✅ [AuthContext] Access token updated:', session.access_token.substring(0, 20) + '...');
      } else {
        console.log('⚠️ [AuthContext] Access token cleared');
      }
      
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // 🧪 Listen for dev mode login event
    const handleDevModeLogin = (event: CustomEvent) => {
      console.log('🧪 [AuthContext] Dev mode login event received:', event.detail);
      
      // 重新检查 localStorage
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (!devModeActive) {
        console.warn('⚠️ [AuthContext] Dev mode login event received but dev_mode_active is false');
        return;
      }
      
      try {
        const devUser = JSON.parse(localStorage.getItem('dev_mode_user') || '{}');
        const devProfile = JSON.parse(localStorage.getItem('dev_mode_profile') || '{}');
        const devToken = localStorage.getItem('supabase.auth.token');
        
        console.log('🧪 [AuthContext] Loading dev mode data from event:', {
          hasDevUser: !!devUser.id,
          hasDevProfile: !!devProfile.id,
          devUserEmail: devUser.email
        });
        
        if (devUser.id && devProfile.id) {
          setUser(devUser as User);
          setProfile(devProfile);
          setAccessToken(devToken ? JSON.parse(devToken).currentSession.access_token : 'dev-token');
          setLoading(false);
          console.log('✅ [AuthContext] Dev mode login applied:', devUser.email);
        } else {
          console.error('❌ [AuthContext] Dev mode data incomplete in event handler');
        }
      } catch (error) {
        console.error('❌ [AuthContext] Failed to parse dev mode data:', error);
      }
    };

    window.addEventListener('dev-mode-login', handleDevModeLogin as EventListener);
    
    // 🧪 也监听 storage 事件（跨标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dev_mode_active' && e.newValue === 'true') {
        console.log('🧪 [AuthContext] Dev mode activated via storage event');
        // 触发重新加载
        window.location.reload();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mounted = false;
      clearTimeout(timeoutId); // 清除超时定时器
      subscription.unsubscribe();
      window.removeEventListener('dev-mode-login', handleDevModeLogin as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Remove loadProfile dependency - it's stable with useCallback

  const handleSignUp = useCallback(async (email: string, password: string, fullName: string, accountType: 'client' | 'freelancer', preferredLanguage?: 'en' | 'zh') => {
    const { user: newUser, access_token } = await auth.signUp(email, password, fullName, accountType, preferredLanguage);
    setUser(newUser);
    setAccessToken(access_token);
    if (newUser) {
      loadProfile(newUser.id);
    }
  }, [loadProfile]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const { user: signedInUser, access_token } = await auth.signIn(email, password);
    setUser(signedInUser);
    setAccessToken(access_token);
    if (signedInUser) {
      loadProfile(signedInUser.id);
      
      // 🔥 檢查是否有待處理的動作
      const pendingAction = sessionStorage.getItem('pendingAction');
      if (pendingAction) {
        console.log('✅ [AuthContext] Login successful, executing pending action:', pendingAction);
        sessionStorage.removeItem('pendingAction');
        
        // 延遲執行，確保登入狀態已完全更新
        setTimeout(() => {
          if (pendingAction === 'createBlogPost') {
            console.log('🚀 [AuthContext] Redirecting to blog editor...');
            window.location.href = '/blog/admin?action=new';
          }
        }, 500);
      }
    }
  }, [loadProfile]);

  const handleSignOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    setProfile(null);
    setAccessToken(null);
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    await auth.signInWithGoogle();
  }, []);

  const handleSignInWithGithub = useCallback(async () => {
    await auth.signInWithGithub();
  }, []);

  const handleSignInWithFacebook = useCallback(async () => {
    await auth.signInWithFacebook();
  }, []);

  const handleSignInWithLine = useCallback(async () => {
    console.log('🔵 [AuthContext] handleSignInWithLine called');
    try {
      await auth.signInWithLine();
      console.log('🔵 [AuthContext] signInWithLine completed');
    } catch (error) {
      console.error('❌ [AuthContext] signInWithLine error:', error);
      throw error;
    }
  }, []);

  const handleRefreshProfile = useCallback(async () => {
    if (user) {
      loadProfile(user.id);
    }
  }, [user, loadProfile]);

  // 🔧 新增：刷新 session
  const handleRefreshSession = useCallback(async () => {
    console.log('🔄 [AuthContext] handleRefreshSession called');
    
    // 🧪 Check if in dev mode
    const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
    if (devModeActive) {
      console.log('🧪 [AuthContext] Dev mode active, cannot refresh Supabase session');
      console.log('⚠️ [AuthContext] Dev mode users should re-login if token expired');
      return null;
    }
    
    try {
      const { data: { session }, error } = await auth.refreshSession();
      
      console.log('🔄 [AuthContext] Refresh session result:', {
        hasSession: !!session,
        hasError: !!error,
        errorMessage: error?.message,
        newAccessToken: session?.access_token ? session.access_token.substring(0, 20) + '...' : 'N/A'
      });
      
      if (error) {
        console.error('❌ [AuthContext] Failed to refresh session:', error);
        console.error('❌ [AuthContext] User needs to re-login');
        return null;
      }
      
      if (session) {
        setUser(session.user);
        setAccessToken(session.access_token);
        if (session.user) {
          loadProfile(session.user.id);
        }
        console.log('✅ [AuthContext] Session refreshed successfully');
        console.log('✅ [AuthContext] New access token:', session.access_token.substring(0, 20) + '...');
        return session.access_token;
      }
      
      console.warn('⚠️ [AuthContext] No session returned from refresh');
      return null;
    } catch (error) {
      console.error('❌ [AuthContext] Exception during session refresh:', error);
      return null;
    }
  }, [loadProfile]);

  // 🔧 計算是否為特殊用戶（開發者帳號）
  const isSpecialUser = useMemo(() => {
    const SPECIAL_USER_EMAILS = [
      'davidlai117@yahoo.com.tw',
      'davidlai234@hotmail.com'
    ];
    const userEmail = user?.email || profile?.email;
    return !!userEmail && SPECIAL_USER_EMAILS.includes(userEmail.toLowerCase());
  }, [user?.email, profile?.email]);

  const value = useMemo(() => ({
    user,
    profile,
    accessToken,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithGithub: handleSignInWithGithub,
    signInWithFacebook: handleSignInWithFacebook,
    signInWithLine: handleSignInWithLine, // 🟢 新增 LINE 登入
    refreshProfile: handleRefreshProfile,
    refreshSession: handleRefreshSession, // 🔧 新增：刷新 session
    isSpecialUser, // 🔧 新增：判斷是否為特殊用戶
  }), [user, profile, accessToken, loading, handleSignUp, handleSignIn, handleSignOut, handleSignInWithGoogle, handleSignInWithGithub, handleSignInWithFacebook, handleSignInWithLine, handleRefreshProfile, handleRefreshSession, isSpecialUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}