import { useEffect, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '../lib/supabase';

export function AuthVerifyPage() {
  const { language } = useLanguage();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    console.log('🔐 [AuthVerify] Component mounted');
    console.log('🔐 [AuthVerify] Full URL:', window.location.href);
    console.log('🔐 [AuthVerify] Pathname:', window.location.pathname);
    console.log('🔐 [AuthVerify] Search:', window.location.search);
    console.log('🔐 [AuthVerify] Hash:', window.location.hash);
    
    const verifyToken = async () => {
      try {
        // 🔍 STEP 1: 檢查 hash 中是否有 access_token
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashToken = hashParams.get('access_token');
        const hashType = hashParams.get('type');
        const refreshToken = hashParams.get('refresh_token');

        console.log('🔐 [AuthVerify] Hash params:', { 
          hasToken: !!hashToken, 
          type: hashType,
          hasRefreshToken: !!refreshToken,
          tokenPreview: hashToken?.substring(0, 20) + '...'
        });

        // 🔍 STEP 2: 如果 hash 中有 token，使用它建立 session
        if (hashToken && hashType === 'recovery') {
          console.log('🔐 [AuthVerify] Found token in hash, setting up session...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: hashToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('❌ [AuthVerify] Session setup failed:', error);
            setErrorMessage(error.message);
            setStatus('error');
            return;
          }

          console.log('✅ [AuthVerify] Recovery session established from hash!');
          console.log('✅ [AuthVerify] User:', data.user?.id);
          
          setStatus('success');
          setTimeout(() => {
            window.location.href = '/reset-password';
          }, 1000);
          return;
        }

        // 🔍 STEP 3: 如果 hash 中沒有 token，檢查 Supabase 是否已經自動建立了 session
        console.log('🔐 [AuthVerify] No token in hash, checking if Supabase auto-created session...');
        
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        console.log('🔐 [AuthVerify] Current session check:', {
          hasSession: !!sessionData.session,
          hasUser: !!sessionData.session?.user,
          userId: sessionData.session?.user?.id,
          error: sessionError
        });

        if (sessionData.session?.user) {
          console.log('✅ [AuthVerify] Found existing session! User:', sessionData.session.user.id);
          console.log('✅ [AuthVerify] Session was auto-created by Supabase');
          
          setStatus('success');
          setTimeout(() => {
            window.location.href = '/reset-password';
          }, 1000);
          return;
        }

        // 🔍 STEP 4: 都沒有的話，顯示錯誤
        console.error('❌ [AuthVerify] No access token in hash and no existing session');
        console.error('❌ [AuthVerify] This usually means:');
        console.error('   1. The email link has expired');
        console.error('   2. Supabase Email Flow Type is not configured correctly');
        console.error('   3. The token has already been used');
        
        setErrorMessage('No access token found. Please request a new password reset link.');
        setStatus('error');

      } catch (err: any) {
        console.error('❌ [AuthVerify] Error:', err);
        setErrorMessage(err.message || 'Verification failed');
        setStatus('error');
      }
    };

    verifyToken();
  }, []);

  const content = {
    en: {
      verifying: 'Verifying your request...',
      success: 'Verification successful!',
      redirecting: 'Redirecting to password reset...',
      error: 'Verification Failed',
      goHome: 'Go to Home',
    },
    zh: {
      verifying: '正在驗證您的請求...',
      success: '驗證成功！',
      redirecting: '正在跳轉到密碼重設頁面...',
      error: '驗證失敗',
      goHome: '返回首頁',
    },
  };

  const t = language === 'en' ? content.en : content.zh;

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h2 className="text-2xl mb-4 text-gray-900">{t.verifying}</h2>
          <p className="text-gray-600 text-sm">Please wait a moment...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl mb-4 text-gray-900">{t.success}</h2>
          <p className="text-gray-600 text-sm">{t.redirecting}</p>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl mb-4 text-gray-900">{t.error}</h2>
        <p className="text-gray-600 text-sm mb-6">{errorMessage}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t.goHome}
        </button>
      </div>
    </div>
  );
}

export default AuthVerifyPage;