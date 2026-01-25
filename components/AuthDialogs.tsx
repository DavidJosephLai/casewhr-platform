import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { Mail, Lock, User, Github, Facebook, Globe } from "lucide-react"; // ✅ 新增 Globe 圖標
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { OAuthNotice } from "./OAuthNotice";
import { oauthConfig } from "../config/oauth";
import { supabase } from "../lib/supabase";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { detectBrowserLanguage, getLanguageOptions } from "../lib/languageDetection"; // ✅ 導入語言檢測

interface AuthDialogsProps {
  loginOpen: boolean;
  signupOpen: boolean;
  onLoginOpenChange: (open: boolean) => void;
  onSignupOpenChange: (open: boolean) => void;
  onSwitchToSignup: () => void;
  onSwitchToLogin: () => void;
}

export function AuthDialogs({
  loginOpen,
  signupOpen,
  onLoginOpenChange,
  onSignupOpenChange,
  onSwitchToSignup,
  onSwitchToLogin,
}: AuthDialogsProps) {
  const { language } = useLanguage();
  const t = getTranslation(language as any).auth;
  const { signIn, signUp, signInWithGoogle, signInWithGithub, signInWithFacebook, signInWithLine } = useAuth();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "client" as "client" | "freelancer",
    agreeToTerms: false,
    preferredLanguage: detectBrowserLanguage(), // ✅ 自動檢測語言
  });

  // Forgot Password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  // 監聽自定義事件來打開對話框
  useEffect(() => {
    const handleOpenAuthDialog = (e: CustomEvent) => {
      if (e.detail === 'login') {
        onLoginOpenChange(true);
      } else if (e.detail === 'signup') {
        onSignupOpenChange(true);
      }
    };

    window.addEventListener('openAuthDialog', handleOpenAuthDialog as EventListener);

    return () => {
      window.removeEventListener('openAuthDialog', handleOpenAuthDialog as EventListener);
    };
  }, []); // Remove dependencies - setState functions are stable

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await signIn(loginData.email, loginData.password);
      toast.success(language === 'en' ? 'Login successful!' : '登入成功！');
      onLoginOpenChange(false);
      setLoginData({ email: "", password: "", rememberMe: false });
      
      // 🔥 檢查是否有登錄後需要執行的動作
      const postLoginAction = sessionStorage.getItem('postLoginAction');
      const pendingAction = sessionStorage.getItem('pendingAction');
      console.log('🔥 [AuthDialogs] Post-login action:', postLoginAction);
      console.log('🔥 [AuthDialogs] Pending action:', pendingAction);
      
      // 🎯 如果有 pendingAction（例如發布 Blog），不要跳轉到 Dashboard
      if (pendingAction) {
        console.log('✅ [AuthDialogs] Pending action detected, skipping dashboard redirect');
        // AuthContext 會處理跳轉，這裡什麼都不做
        return;
      }
      
      if (postLoginAction === 'openPostProject') {
        // 清除動作標記
        sessionStorage.removeItem('postLoginAction');
        
        // 延遲觸發發布項目對話框，確保用戶數據已加載
        setTimeout(() => {
          console.log('🔥 [AuthDialogs] Triggering post project dialog after login');
          // 觸發一個自定義事件來打開發布項目對話框
          window.dispatchEvent(new Event('openPostProjectAfterLogin'));
        }, 800);
      } else {
        // 登入成功後自動跳轉到 Dashboard - 增加延遲確保狀態更新
        setTimeout(() => {
          console.log('Triggering showDashboard event after login');
          window.dispatchEvent(new Event('showDashboard'));
        }, 500);
      }
    } catch (error: any) {
      // 🧪 如果是需要開發模式的錯誤，顯示友好提示
      if (error.code === 'need_dev_mode') {
        toast.error(
          language === 'en' 
            ? 'Please use Dev Mode Login' 
            : '請使用開發模式登入',
          {
            duration: 6000,
            description: language === 'en' 
              ? 'Look for the yellow card in the bottom-right corner 👉' 
              : '請查看右下角的黃色卡片 👉',
            action: {
              label: '👀',
              onClick: () => {
                // 滾動到右下角
                window.scrollTo({ 
                  top: document.body.scrollHeight, 
                  left: document.body.scrollWidth,
                  behavior: 'smooth' 
                });
              }
            }
          }
        );
      } else {
        toast.error(
          language === 'en' 
            ? `Login failed: ${error.message}` 
            : `登入失敗：${error.message}`
        );
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast.error(language === 'en' ? 'Passwords do not match' : '密碼不一致');
      return;
    }
    
    if (!signupData.agreeToTerms) {
      toast.error(language === 'en' ? 'Please agree to the terms' : '請同意服務條款');
      return;
    }

    try {
      await signUp(
        signupData.email,
        signupData.password,
        signupData.name,
        signupData.accountType,
        signupData.preferredLanguage // ✅ 傳遞語言偏好
      );
      toast.success(
        language === 'en' 
          ? 'Account created successfully! Welcome!' 
          : '帳號創建成功！歡迎！'
      );
      onSignupOpenChange(false);
      setSignupData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        accountType: "client",
        agreeToTerms: false,
        preferredLanguage: detectBrowserLanguage(), // ✅ 重置為檢測值
      });
      
      // 註冊成功後自動跳轉到 Dashboard
      setTimeout(() => {
        window.dispatchEvent(new Event('showDashboard'));
      }, 300);
    } catch (error: any) {
      // Check if email already exists - this is not a real error, just info
      if (error.code === 'email_exists' || 
          error.message?.includes('already registered') || 
          error.message?.includes('already exists') ||
          error.message?.includes('email address has already been registered')) {
        
        console.log('ℹ️ [Signup] Email already registered, guiding user to login:', signupData.email);
        
        // Show friendly error message with option to switch to login
        toast.error(
          language === 'en' 
            ? 'This email is already registered. Try logging in instead!' 
            : '此郵箱已被註冊。請嘗試登入！',
          {
            duration: 5000,
            action: {
              label: language === 'en' ? 'Login' : '登入',
              onClick: () => {
                onSignupOpenChange(false);
                setTimeout(() => {
                  onLoginOpenChange(true);
                }, 200);
              }
            }
          }
        );
      } else {
        // This is a real error, log it
        console.error('❌ [Signup] Registration failed:', error);
        
        // Show generic error
        toast.error(
          language === 'en' 
            ? `Signup failed: ${error.message}` 
            : `註冊失敗：${error.message}`
        );
      }
    }
  };

  const handleSocialAuth = async (provider: string) => {
    console.log('🔵 [AuthDialogs] handleSocialAuth called with provider:', provider);
    console.log('🔵 [AuthDialogs] oauthConfig:', oauthConfig);
    
    try {
      if (provider === 'Google') {
        console.log('🔵 [AuthDialogs] Calling signInWithGoogle...');
        await signInWithGoogle();
        // OAuth 會重定向，不需要顯示成功訊息
      } else if (provider === 'GitHub') {
        console.log('🔵 [AuthDialogs] Calling signInWithGithub...');
        await signInWithGithub();
        // OAuth 會重定向，不需要顯示成功訊息
      } else if (provider === 'Facebook') {
        console.log('🔵 [AuthDialogs] Calling signInWithFacebook...');
        await signInWithFacebook();
        // OAuth 會重定向，不需要顯示成功訊息
      } else if (provider === 'LINE') {
        console.log('🔵 [AuthDialogs] Calling signInWithLine...');
        await signInWithLine();
        console.log('🔵 [AuthDialogs] signInWithLine completed (should redirect)');
        // OAuth 會重定向，不需要顯示成功訊息
      } else {
        toast.info(language === 'en' ? `${provider} authentication coming soon` : `${provider} 登入即將推出`);
      }
    } catch (error: any) {
      console.error('❌ [AuthDialogs] Social auth error:', error);
      toast.error(
        language === 'en' 
          ? `${provider} login failed: ${error.message}` 
          : `${provider} 登入失敗：${error.message}`
      );
    }
  };

  // Memoize grid class calculation
  const gridClass = useMemo(() => {
    const enabledCount = [
      oauthConfig.enableGoogleAuth,
      oauthConfig.enableGithubAuth,
      oauthConfig.enableFacebookAuth,
      oauthConfig.enableLineAuth, // ✅ 添加 LINE
    ].filter(Boolean).length;

    if (enabledCount === 1) return 'grid grid-cols-1 gap-3';
    if (enabledCount === 2) return 'grid grid-cols-2 gap-3';
    if (enabledCount === 3) return 'grid grid-cols-3 gap-3';
    return 'grid grid-cols-2 gap-3'; // 4個按鈕用 2x2 網格
  }, []);

  // Memoize whether social login is enabled
  const socialLoginEnabled = useMemo(() => {
    return oauthConfig.enableGoogleAuth || 
           oauthConfig.enableGithubAuth || 
           oauthConfig.enableFacebookAuth ||
           oauthConfig.enableLineAuth;
  }, []);

  // Handle forgot password - Send OTP
  const handleForgotPassword = async () => {
    console.log('🔐 [忘記密碼-OTP] 開始處理發送 OTP 請求');
    console.log('📧 [忘記密碼-OTP] 郵箱:', forgotPasswordEmail);

    if (!forgotPasswordEmail) {
      toast.error(language === 'en' ? 'Please enter your email address' : '請輸入您的郵箱地址');
      console.warn('⚠️ [忘記密碼-OTP] 箱為空');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) {
      toast.error(language === 'en' ? 'Please enter a valid email address' : '請輸入有效的郵箱地址');
      console.warn('️ [忘記密碼-OTP] 郵箱格式無效');
      return;
    }

    setForgotPasswordLoading(true);
    console.log('🔄 [忘記密碼-OTP] 開始發送 OTP...');

    try {
      // 🔐 使用新的 Brevo OTP API
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/password-reset/send-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: forgotPasswordEmail,
            language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('❌ [忘記密碼-OTP] API 發送失敗:', data);
        throw new Error(data.error || 'Failed to send OTP');
      }

      console.log('✅ [忘記密碼-OTP] OTP 發送成功');
      toast.success(
        language === 'en' 
          ? 'Verification code sent! Please check your email.' 
          : '驗證碼已發送！請檢查您的郵箱。'
      );
      
      setOtpSent(true);
    } catch (err: any) {
      console.error('❌ [忘記密碼-OTP] 異常:', err);
      toast.error(
        err.message || (language === 'en' 
          ? 'Failed to send verification code. Please try again.' 
          : '發送驗證碼失敗。請重試。')
      );
    } finally {
      setForgotPasswordLoading(false);
      console.log('🏁 [忘記密碼-OTP] 處理完成');
    }
  };

  // Handle OTP verification and password reset
  const handleVerifyOtpAndResetPassword = async () => {
    console.log('🔐 [驗證-OTP] 開始處理 OTP 驗證和密碼重設');
    console.log('📧 [驗證-OTP] 郵箱:', forgotPasswordEmail);
    console.log('🔢 [驗證-OTP] 驗證碼:', otpCode);
    
    if (!otpCode || otpCode.length < 6) {
      toast.error(language === 'en' ? 'Please enter the verification code' : '請輸入驗證碼');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error(language === 'en' ? 'Password must be at least 6 characters' : '密碼至少需要 6 個字符');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(language === 'en' ? 'Passwords do not match' : '密碼不一致');
      return;
    }

    setResettingPassword(true);
    console.log('🔄 [驗證-OTP] 驗證 OTP 並重設密碼...');

    try {
      // 🔐 使用新的 Brevo OTP 驗證 API
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/password-reset/verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: forgotPasswordEmail,
            otp: otpCode,
            newPassword,
            language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('❌ [驗證-OTP] API 驗證失敗:', data);
        throw new Error(data.error || 'Invalid verification code');
      }

      console.log('✅ [驗證-OTP] 密碼重設成功！');
      toast.success(
        language === 'en' 
          ? 'Password reset successful! Please login with your new password.' 
          : '密碼重設成功！請使用新密碼登入。'
      );
      
      // Reset state and close dialog
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
      setOtpSent(false);
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Show login dialog
      setTimeout(() => {
        onLoginOpenChange(true);
      }, 500);
    } catch (err: any) {
      console.error('❌ [驗證-OTP] 異常:', err);
      toast.error(
        err.message || (language === 'en' 
          ? 'Password reset failed. Please try again.' 
          : '密碼重設失敗。請重試。')
      );
    } finally {
      setResettingPassword(false);
      console.log('🏁 [驗證-OTP] 處理完成');
    }
  };

  // Reset forgot password state when dialog closes
  const handleForgotPasswordDialogChange = (open: boolean) => {
    setShowForgotPassword(open);
    if (!open) {
      setForgotPasswordEmail('');
      setOtpSent(false);
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <>
      {/* Login Dialog */}
      <Dialog open={loginOpen} onOpenChange={onLoginOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{t.login.title}</DialogTitle>
            <DialogDescription className="text-center">
              {t.login.subtitle}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-4 mt-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="login-email">{t.login.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t.login.emailPlaceholder}
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">{t.login.password}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder={t.login.passwordPlaceholder}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={loginData.rememberMe}
                  onCheckedChange={(checked) =>
                    setLoginData({ ...loginData, rememberMe: checked as boolean })
                  }
                />
                <label
                  htmlFor="remember"
                  className="text-sm cursor-pointer"
                >
                  {t.login.rememberMe}
                </label>
              </div>
              <Button variant="link" className="px-0 text-sm" onClick={() => setShowForgotPassword(true)}>
                {t.login.forgotPassword}
              </Button>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              {t.login.submit}
            </Button>

            {/* Social login section - only show if enabled */}
            {socialLoginEnabled && (
              <>
                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
                    {t.login.or}
                  </span>
                </div>

                <div className={gridClass}>
                  {oauthConfig.enableGoogleAuth && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth('Google')}
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                  )}
                  {oauthConfig.enableGithubAuth && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth('GitHub')}
                    >
                      <Github className="h-4 w-4 mr-2" />
                      GitHub
                    </Button>
                  )}
                  {oauthConfig.enableFacebookAuth && (
                    <Button
                      type="button"
                      onClick={() => handleSocialAuth('Facebook')}
                      className="bg-[#1877F2] hover:bg-[#166FE5] text-white border-0"
                    >
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </Button>
                  )}
                  {oauthConfig.enableLineAuth && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth('LINE')}
                      className="bg-[#00B900] text-white hover:bg-[#00A000] border-[#00B900]"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                      </svg>
                      LINE
                    </Button>
                  )}
                </div>
              </>
            )}

            <p className="text-center text-sm text-gray-600">
              {t.login.noAccount}{" "}
              <Button
                type="button"
                variant="link"
                className="px-1"
                onClick={onSwitchToSignup}
              >
                {t.login.signupLink}
              </Button>
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={signupOpen} onOpenChange={onSignupOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">{t.signup.title}</DialogTitle>
            <DialogDescription className="text-center">
              {t.signup.subtitle}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSignup} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">{t.signup.name}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="signup-name"
                  type="text"
                  placeholder={t.signup.namePlaceholder}
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">{t.signup.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder={t.signup.emailPlaceholder}
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">{t.signup.password}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder={t.signup.passwordPlaceholder}
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">{t.signup.confirmPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="signup-confirm-password"
                  type="password"
                  placeholder={t.signup.confirmPasswordPlaceholder}
                  value={signupData.confirmPassword}
                  onChange={(e) =>
                    setSignupData({ ...signupData, confirmPassword: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.signup.accountType}</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={signupData.accountType === "client" ? "default" : "outline"}
                  onClick={() => setSignupData({ ...signupData, accountType: "client" })}
                  className={signupData.accountType === "client" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {t.signup.accountTypeClient}
                </Button>
                <Button
                  type="button"
                  variant={signupData.accountType === "freelancer" ? "default" : "outline"}
                  onClick={() => setSignupData({ ...signupData, accountType: "freelancer" })}
                  className={signupData.accountType === "freelancer" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {t.signup.accountTypeFreelancer}
                </Button>
              </div>
            </div>

            {/* ✅ 語言偏好選擇 */}
            <div className="space-y-2">
              <Label>
                <Globe className="inline h-4 w-4 mr-2" />
                {language === 'en' ? 'Preferred Language' : '語言偏好'}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={signupData.preferredLanguage === "zh" ? "default" : "outline"}
                  onClick={() => setSignupData({ ...signupData, preferredLanguage: "zh" })}
                  className={signupData.preferredLanguage === "zh" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  🇹🇼 中文
                </Button>
                <Button
                  type="button"
                  variant={signupData.preferredLanguage === "en" ? "default" : "outline"}
                  onClick={() => setSignupData({ ...signupData, preferredLanguage: "en" })}
                  className={signupData.preferredLanguage === "en" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  🇺🇸 English
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                {language === 'en' 
                  ? 'This will be used for emails and notifications' 
                  : '此設定將用於郵件和通知'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={signupData.agreeToTerms}
                onCheckedChange={(checked) =>
                  setSignupData({ ...signupData, agreeToTerms: checked as boolean })
                }
              />
              <label htmlFor="terms" className="text-sm cursor-pointer">
                {t.signup.terms}{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  {t.signup.termsLink}
                </a>{" "}
                {t.signup.and}{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  {t.signup.privacyLink}
                </a>
              </label>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              {t.signup.submit}
            </Button>

            {/* Social login section - only show if enabled */}
            {socialLoginEnabled && (
              <>
                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
                    {t.signup.or}
                  </span>
                </div>

                <div className={gridClass}>
                  {oauthConfig.enableGoogleAuth && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth('Google')}
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                  )}
                  {oauthConfig.enableGithubAuth && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth('GitHub')}
                    >
                      <Github className="h-4 w-4 mr-2" />
                      GitHub
                    </Button>
                  )}
                  {oauthConfig.enableFacebookAuth && (
                    <Button
                      type="button"
                      onClick={() => handleSocialAuth('Facebook')}
                      className="bg-[#1877F2] hover:bg-[#166FE5] text-white border-0"
                    >
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </Button>
                  )}
                  {oauthConfig.enableLineAuth && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth('LINE')}
                      className="bg-[#00B900] text-white hover:bg-[#00A000] border-[#00B900]"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                      </svg>
                      LINE
                    </Button>
                  )}
                </div>
              </>
            )}

            <p className="text-center text-sm text-gray-600">
              {t.signup.hasAccount}{" "}
              <Button
                type="button"
                variant="link"
                className="px-1"
                onClick={onSwitchToLogin}
              >
                {t.signup.loginLink}
              </Button>
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={handleForgotPasswordDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {language === 'en' ? 'Reset Password' : '重設密碼'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {!otpSent ? (
                language === 'en' 
                  ? 'Enter your email address and we\'ll send you a verification code.' 
                  : '輸入您的郵箱地址，我們將向您發送驗證碼。'
              ) : (
                language === 'en'
                  ? 'Enter the verification code from your email and set a new password.'
                  : '輸入郵件中的驗證碼並設置新密碼。'
              )}
            </DialogDescription>
          </DialogHeader>

          {!otpSent ? (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">
                  {language === 'en' ? 'Email Address' : '郵箱地址'}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="john@example.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={forgotPasswordLoading}
                  className="flex-1"
                >
                  {language === 'en' ? 'Cancel' : '取消'}
                </Button>
                <Button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading || !forgotPasswordEmail}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {forgotPasswordLoading ? (
                    <>
                      <Mail className="h-4 w-4 mr-2 animate-pulse" />
                      {language === 'en' ? 'Sending...' : '送中...'}
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      {language === 'en' ? 'Send Code' : '發送驗證碼'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="otp-code">
                  {language === 'en' ? 'Verification Code' : '驗證碼'}
                </Label>
                <Input
                  id="otp-code"
                  type="text"
                  placeholder="12345678"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  maxLength={8}
                  className="text-center text-lg tracking-widest"
                  required
                />
                <p className="text-sm text-gray-500">
                  {language === 'en' 
                    ? 'Enter the 8-digit code sent to your email' 
                    : '輸入發送到您郵箱的 8 位數驗證碼'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">
                  {language === 'en' ? 'New Password' : '新密碼'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  {language === 'en' ? 'Confirm Password' : '確認密碼'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="•••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={resettingPassword}
                  className="flex-1"
                >
                  {language === 'en' ? 'Back' : '返回'}
                </Button>
                <Button
                  type="button"
                  onClick={handleVerifyOtpAndResetPassword}
                  disabled={resettingPassword || !otpCode || !newPassword || !confirmPassword}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {resettingPassword ? (
                    <>
                      <Lock className="h-4 w-4 mr-2 animate-pulse" />
                      {language === 'en' ? 'Resetting...' : '重設中...'}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      {language === 'en' ? 'Reset Password' : '重設密碼'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}