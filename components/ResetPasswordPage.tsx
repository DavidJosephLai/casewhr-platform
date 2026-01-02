import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export function ResetPasswordPage() {
  const { language } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isValidRecovery, setIsValidRecovery] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  // 調試信息
  useEffect(() => {
    console.log('🎯 [ResetPasswordPage] Component mounted!');
    console.log('🎯 [ResetPasswordPage] Current URL:', window.location.href);
    console.log('🎯 [ResetPasswordPage] Pathname:', window.location.pathname);
    console.log('🎯 [ResetPasswordPage] Hash:', window.location.hash);
  }, []);

  const t = {
    en: {
      title: 'Reset Your Password',
      subtitle: 'Enter your new password below',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      submit: 'Reset Password',
      submitting: 'Resetting...',
      success: 'Password reset successful!',
      successMessage: 'Your password has been updated. You can now login with your new password.',
      goToLogin: 'Go to Login',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 8 characters',
      invalidToken: 'Invalid or expired reset link',
      requirements: 'Password Requirements:',
      req1: 'At least 8 characters',
      req2: 'Include uppercase and lowercase letters',
      req3: 'Include numbers and special characters',
    },
    zh: {
      title: '重設您的密碼',
      subtitle: '請在下方輸入新密碼',
      newPassword: '新密碼',
      confirmPassword: '確認密碼',
      submit: '重設密碼',
      submitting: '重設中...',
      success: '密碼重設成功！',
      successMessage: '您的密碼已更新。現在可以使用新密碼登入。',
      goToLogin: '前往登入',
      passwordMismatch: '密碼不匹配',
      passwordTooShort: '密碼至少需要 8 個字符',
      invalidToken: '重設連結無效或已過期',
      requirements: '密碼要求：',
      req1: '至少 8 個字符',
      req2: '包含大小寫字母',
      req3: '包含數字和特殊符號',
    },
  };

  const content = language === 'en' ? t.en : t.zh;

  // 🔥 NEW: 監聽 Supabase Auth State Change（更可靠的方式）
  useEffect(() => {
    console.log('🔐 [Reset Password] Setting up auth state listener');
    console.log('🔐 [Reset Password] Full URL:', window.location.href);
    console.log('🔐 [Reset Password] Hash:', window.location.hash);
    console.log('🔐 [Reset Password] Search:', window.location.search);
    
    // 檢查是否有 hash 參數
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    console.log('🔐 [Reset Password] Hash check:', { 
      hasHash: !!window.location.hash,
      hasAccessToken: !!accessToken,
      type 
    });

    // 如果 hash 中有 token，使用舊的方式
    if (accessToken && type === 'recovery') {
      console.log('✅ [Reset Password] Found token in hash, using traditional flow');
      checkRecoveryTokenFromHash(accessToken);
      return;
    }

    // 🔥 否則，監聽 auth state change（處理 Supabase 沒有附加 hash 的情況）
    console.log('🔄 [Reset Password] No hash token, setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 [Reset Password] Auth state changed:', event);
      console.log('🔐 [Reset Password] Session user:', session?.user?.id);
      console.log('🔐 [Reset Password] Session details:', session);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ [Reset Password] PASSWORD_RECOVERY event detected!');
        setIsValidRecovery(true);
        setCheckingToken(false);
      } else if (session?.user && event === 'SIGNED_IN') {
        console.log('✅ [Reset Password] User signed in, checking if recovery mode');
        // 檢查 session 的 metadata
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('✅ [Reset Password] Valid session detected');
          setIsValidRecovery(true);
          setCheckingToken(false);
        }
      } else {
        console.log('⚠️ [Reset Password] Other auth event:', event);
      }
    });

    // 也檢查當前 session
    checkCurrentSession();

    // 🔥 延長超時時間到 5 秒，並持續檢查
    const timeoutId = setTimeout(() => {
      console.log('⏰ [Reset Password] Timeout reached, checking final state');
      console.log('⏰ [Reset Password] isValidRecovery:', isValidRecovery);
      if (!isValidRecovery) {
        console.error('❌ [Reset Password] No valid recovery session after timeout');
        setError(content.invalidToken);
        setCheckingToken(false);
      }
    }, 5000);

    return () => {
      console.log('🔄 [Reset Password] Cleaning up auth listener');
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // 檢查當前 session（萬一用戶已經在 recovery 模式下）
  const checkCurrentSession = async () => {
    try {
      console.log('🔍 [Reset Password] Checking current session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ [Reset Password] Found existing session:', session.user.id);
        setIsValidRecovery(true);
        setCheckingToken(false);
      } else {
        console.log('⚠️ [Reset Password] No existing session');
      }
    } catch (err) {
      console.error('❌ [Reset Password] Error checking session:', err);
    }
  };

  // 舊的 hash token 檢查方式（保留作為後備）
  const checkRecoveryTokenFromHash = async (accessToken: string) => {
    try {
      console.log('🔄 [Reset Password] Verifying token from hash...');
      const { data: { user }, error: verifyError } = await supabase.auth.getUser(accessToken);

      if (verifyError || !user) {
        console.error('❌ [Reset Password] Token verification failed:', verifyError);
        setError(content.invalidToken);
        setCheckingToken(false);
        return;
      }

      console.log('✅ [Reset Password] Token verified for user:', user.id);
      setIsValidRecovery(true);
      setCheckingToken(false);
    } catch (err) {
      console.error('❌ [Reset Password] Error checking token:', err);
      setError(content.invalidToken);
      setCheckingToken(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 [Reset Password] Starting password reset process');

    // 驗證
    if (newPassword !== confirmPassword) {
      toast.error(content.passwordMismatch);
      return;
    }

    if (newPassword.length < 8) {
      toast.error(content.passwordTooShort);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 [Reset Password] Updating password...');

      // 使用 Supabase 的 updateUser 來更新密碼
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('❌ [Reset Password] Update failed:', updateError);
        throw updateError;
      }

      console.log('✅ [Reset Password] Password updated successfully');
      setSuccess(true);
      toast.success(content.success);

      // 3 秒後跳轉到首頁並觸發登入對話框
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);

    } catch (err: any) {
      console.error('❌ [Reset Password] Error:', err);
      setError(err.message || 'Failed to reset password');
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NEW: 顯示載入狀態
  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h2 className="text-2xl mb-4 text-gray-900">
            {language === 'en' ? 'Verifying reset link...' : '驗證重設連結...'}
          </h2>
          <p className="text-gray-600">
            {language === 'en' ? 'Please wait a moment' : '請稍候'}
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          </div>
          <h2 className="text-2xl mb-4 text-gray-900">{content.success}</h2>
          <p className="text-gray-600 mb-6">{content.successMessage}</p>
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {content.goToLogin}
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <Lock className="w-16 h-16 text-red-500 mx-auto" />
          </div>
          <h2 className="text-2xl mb-4 text-gray-900">{content.invalidToken}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {content.goToLogin}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-blue-600 mb-2">🏢 Case Where 接得準</h1>
          <p className="text-gray-600 text-sm">
            {language === 'en' ? 'Connecting Professional Talents' : '連接專業服務人才的最佳平台'}
          </p>
        </div>

        {/* Title */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl text-gray-900 mb-2">{content.title}</h2>
          <p className="text-gray-600 text-sm">{content.subtitle}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="block text-sm mb-2 text-gray-700">
              {content.newPassword}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm mb-2 text-gray-700">
              {content.confirmPassword}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm mb-2 text-blue-900">{content.requirements}</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ {content.req1}</li>
              <li>✓ {content.req2}</li>
              <li>✓ {content.req3}</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? content.submitting : content.submit}
          </Button>
        </form>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {language === 'en' ? '← Back to Home' : '← 返回首頁'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;