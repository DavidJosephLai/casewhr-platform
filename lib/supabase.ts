import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// 構建 Supabase URL
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

// 檢查是否已配置 Supabase
const isSupabaseConfigured = Boolean(projectId && publicAnonKey);

// 創建單例 Supabase 客戶端
let supabaseInstance: SupabaseClient | null = null;

const getSupabaseInstance = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        }
      }
    );
  }
  return supabaseInstance;
};

// 導出單例實例
export const supabase = getSupabaseInstance();

// 認證相關函數
export const auth = {
  // 檢查是否已配置 Supabase
  isConfigured: () => isSupabaseConfigured,

  // 註冊新用戶
  async signUp(email: string, password: string, fullName: string, accountType: 'client' | 'freelancer', preferredLanguage?: 'en' | 'zh') {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please set up your Supabase credentials.');
    }
    
    try {
      // 使用後端 API 註冊，這樣可以自動確認郵箱
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-215f78a5/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            email,
            password,
            name: fullName,
            account_type: accountType,
            language: preferredLanguage || 'zh', // ✅ 傳遞語言偏好，默認中文
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        // Only log info for email_exists (not an error)
        if (data.code === 'email_exists') {
          console.log('ℹ️ [Signup] Email already registered:', email);
        } else {
          console.error('❌ [Signup] Registration failed:', {
            status: response.status,
            error: data.error,
            code: data.code
          });
        }
        
        // Create a custom error with code property for better error handling
        const error = new Error(data.error || 'Registration failed') as Error & { code?: string; status?: number };
        error.code = data.code;
        error.status = response.status;
        throw error;
      }
      
      // 等待 1.5 秒確保 Supabase 完全處理好新用戶
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 註冊成功後立即登入
      return this.signIn(email, password);
    } catch (error: any) {
      // 🧪 如果是网络错误且在开发环境，提示使用开发模式
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        console.error('❌ [Signup] Network error - Supabase unreachable');
        console.log('💡 [Signup] Tip: Use Dev Mode Login in Figma Make environment');
        const devError = new Error('Network error: Cannot reach Supabase. Try using Dev Mode Login (yellow card in bottom-right).');
        (devError as any).code = 'network_error';
        throw devError;
      }
      throw error;
    }
  },

  // Login
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please set up your Supabase credentials.');
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('✅ [SignIn] Login successful');
      return { user: data.user, access_token: data.session?.access_token || null };
    } catch (error: any) {
      // 🧪 在 Figma Make 環境中，Supabase 認證通常會失敗，這是正常的
      // 直接提示用戶使用開發模式，不顯示詳細錯誤
      const devError = new Error('請使用開發模式登入（右下角黃色卡片）');
      (devError as any).code = 'need_dev_mode';
      throw devError;
    }
  },

  // 登出
  async signOut() {
    console.log('🔓 [Auth] Starting sign out process...');
    
    try {
      // 即使 Supabase 未配置，也要清除本地數據
      if (!isSupabaseConfigured) {
        console.warn('⚠️ [Auth] Supabase not configured, clearing local data only');
        this.forceSignOut();
        return;
      }
      
      // 嘗試從 Supabase 登出
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ [Auth] Supabase signOut error:', error);
        // 即使 Supabase 登出失敗，也要清除本地數據
        this.forceSignOut();
        throw error;
      }
      
      console.log('✅ [Auth] Successfully signed out from Supabase');
      
      // 清除本地存儲
      this.forceSignOut();
      
      return;
    } catch (error) {
      console.error('❌ [Auth] Sign out failed:', error);
      // 確保即使出錯也清除本地數據
      this.forceSignOut();
      throw error;
    }
  },

  // 強制登出 - 清除所有本地數據
  forceSignOut() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // 清除所有 Supabase 相關的 keys
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('supabase') || key.startsWith('sb-'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('✅ [Auth] Cleared Supabase localStorage items:', keysToRemove.length);
        
        // 也清除 sessionStorage
        if (window.sessionStorage) {
          sessionStorage.clear();
          console.log('✅ [Auth] Cleared sessionStorage');
        }
      }
    } catch (storageError) {
      console.warn('⚠️ [Auth] Failed to clear storage:', storageError);
    }
  },

  // 使用 Google 登入
  async signInWithGoogle() {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please set up your Supabase credentials.');
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/?view=dashboard&auth=google`,
      },
    });
    
    if (error) throw error;
    return data;
  },

  // 使用 Facebook 登入
  async signInWithFacebook() {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please set up your Supabase credentials.');
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/?view=dashboard&auth=facebook`,
      },
    });
    
    if (error) throw error;
    return data;
  },

  // 使用 GitHub 登入
  async signInWithGithub() {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please set up your Supabase credentials.');
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `https://casewhr.com`,
      },
    });
    
    if (error) throw error;
    return data;
  },

  // 獲取當前用
  async getCurrentUser() {
    if (!isSupabaseConfigured) {
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // 獲取當前會話
  async getSession() {
    if (!isSupabaseConfigured) {
      console.warn('⚠️ [Auth] Supabase not configured, returning null session');
      return { data: { session: null }, error: null };
    }
    
    return await supabase.auth.getSession();
  },

  // 刷新會話
  async refreshSession() {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }
    
    console.log('🔄 [Auth] Refreshing session...');
    const result = await supabase.auth.refreshSession();
    
    if (result.error) {
      console.error('❌ [Auth] Session refresh failed:', result.error);
    } else {
      console.log('✅ [Auth] Session refreshed successfully');
    }
    
    return result;
  },

  // 監聽認證狀態變化
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};