import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

export function AuthCallback() {
  const { language } = useLanguage();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');

  useEffect(() => {
    console.log('🔄 [AuthCallback] Processing OAuth callback...');
    
    let timeoutId: NodeJS.Timeout;
    let mounted = true;

    const handleCallback = async () => {
      try {
        // 設置 5 秒超時
        timeoutId = setTimeout(() => {
          if (mounted && status === 'checking') {
            console.error('❌ [AuthCallback] Timeout waiting for session');
            setStatus('error');
            window.location.href = `/?auth_error=${encodeURIComponent('認證逾時，請重試')}`;
          }
        }, 5000);

        // 監聽 Supabase 認證狀態變化
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔐 [AuthCallback] Auth state changed:', { event, email: session?.user?.email });

          if (event === 'SIGNED_IN' && session) {
            console.log('✅ [AuthCallback] User signed in successfully:', session.user?.email);
            
            if (mounted) {
              setStatus('success');
              clearTimeout(timeoutId);
              
              // 延遲一下讓用戶看到成功訊息
              setTimeout(() => {
                window.location.href = '/?view=dashboard&auth=success';
              }, 1000);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('⚠️ [AuthCallback] User signed out during callback');
          }
        });

        // 立即檢查是否已有 session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔍 [AuthCallback] Initial session check:', { 
          hasSession: !!session, 
          email: session?.user?.email,
          error 
        });

        if (error) {
          console.error('❌ [AuthCallback] Session error:', error);
          clearTimeout(timeoutId);
          setStatus('error');
          window.location.href = `/?auth_error=${encodeURIComponent(error.message)}`;
          return;
        }

        if (session) {
          console.log('✅ [AuthCallback] Session already exists:', session.user?.email);
          clearTimeout(timeoutId);
          setStatus('success');
          
          setTimeout(() => {
            window.location.href = '/?view=dashboard&auth=success';
          }, 1000);
        }

        // 清理函數
        return () => {
          mounted = false;
          clearTimeout(timeoutId);
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('❌ [AuthCallback] Unexpected error:', err);
        clearTimeout(timeoutId);
        setStatus('error');
        window.location.href = `/?auth_error=${encodeURIComponent('認證失敗')}`;
      }
    };

    handleCallback();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        {status === 'checking' && (
          <>
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {language === 'en' ? 'Completing sign in...' : '正在完成登入...'}
            </h2>
            <p className="text-gray-600">
              {language === 'en' ? 'Please wait a moment' : '請稍候片刻'}
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="inline-block rounded-full h-16 w-16 bg-green-100 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {language === 'en' ? 'Sign in successful!' : '登入成功！'}
            </h2>
            <p className="text-gray-600">
              {language === 'en' ? 'Redirecting to dashboard...' : '正在前往控制台...'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;