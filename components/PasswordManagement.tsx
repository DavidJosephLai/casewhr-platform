import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  Shield, 
  Key, 
  Mail, 
  RefreshCw,
  AlertTriangle 
} from 'lucide-react';

export function PasswordManagement() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState(user?.email || '');
  const [resetLoading, setResetLoading] = useState(false);

  // Update resetEmail when user loads
  useEffect(() => {
    if (user?.email && !resetEmail) {
      setResetEmail(user.email);
    }
  }, [user, resetEmail]);

  const content = {
    en: {
      title: 'Change Password',
      description: 'Update your password to keep your account secure',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      changePasswordBtn: 'Change Password',
      forgotPassword: 'Forgot your password?',
      sendResetLink: 'Send Reset Link',
      
      resetDialogTitle: 'Reset Password',
      resetDialogDescription: 'Enter your email address and we\'ll send you a link to reset your password.',
      emailLabel: 'Email Address',
      sendResetBtn: 'Send Reset Link',
      cancel: 'Cancel',
      
      passwordRequirements: 'Password Requirements:',
      requirements: {
        minLength: 'At least 8 characters',
        uppercase: 'At least one uppercase letter',
        lowercase: 'At least one lowercase letter',
        number: 'At least one number',
        special: 'At least one special character',
      },
      
      strengthLabel: 'Password Strength:',
      strength: {
        weak: 'Weak',
        fair: 'Fair',
        good: 'Good',
        strong: 'Strong',
      },
      
      errors: {
        currentPasswordRequired: 'Current password is required',
        newPasswordRequired: 'New password is required',
        confirmPasswordRequired: 'Please confirm your new password',
        passwordMismatch: 'Passwords do not match',
        passwordTooShort: 'Password must be at least 8 characters',
        weakPassword: 'Password does not meet requirements',
        wrongPassword: 'Current password is incorrect',
        samePassword: 'New password must be different from current password',
        emailRequired: 'Email address is required',
        invalidEmail: 'Invalid email address',
      },
      
      success: {
        passwordChanged: 'Password changed successfully!',
        resetEmailSent: 'Password reset link sent to your email',
      },
      
      // Additional messages
      userEmailNotFound: 'User email not found',
      failedToChangePassword: 'Failed to change password',
      failedToSendResetEmail: 'Failed to send reset email',
      passwordsMatch: 'Passwords match',
      changing: 'Changing...',
      sending: 'Sending...',
      resetEmailInfo: 'You will receive an email with instructions to reset your password.',
      
      securityTips: 'Security Tips:',
      tips: [
        'Use a unique password for this account',
        'Don\'t share your password with anyone',
        'Change your password regularly',
        'Use a password manager for strong passwords',
      ],
    },
    'zh-TW': {
      title: '變更密碼',
      description: '更新您的密碼以保持帳戶安全',
      currentPassword: '目前密碼',
      newPassword: '新密碼',
      confirmPassword: '確認新密碼',
      changePasswordBtn: '變更密碼',
      forgotPassword: '忘記密碼？',
      sendResetLink: '發送重設連結',
      
      resetDialogTitle: '重設密碼',
      resetDialogDescription: '輸入您的電子郵件地址，我們將向您發送重設密碼的連結。',
      emailLabel: '電子郵件地址',
      sendResetBtn: '發送重設連結',
      cancel: '取消',
      
      passwordRequirements: '密碼要求：',
      requirements: {
        minLength: '至少 8 個字元',
        uppercase: '至少一個大寫字母',
        lowercase: '至少一個小寫字母',
        number: '至少一個數字',
        special: '至少一個特殊字元',
      },
      
      strengthLabel: '密碼強度：',
      strength: {
        weak: '弱',
        fair: '普通',
        good: '良好',
        strong: '強',
      },
      
      errors: {
        currentPasswordRequired: '請輸入目前密碼',
        newPasswordRequired: '請輸入新密碼',
        confirmPasswordRequired: '請確認新密碼',
        passwordMismatch: '密碼不匹配',
        passwordTooShort: '密碼至少需要 8 個字元',
        weakPassword: '密碼不符合要求',
        wrongPassword: '目前密碼不正確',
        samePassword: '新密碼必須與目前密碼不同',
        emailRequired: '請輸入電子郵件地址',
        invalidEmail: '無效的電子郵件地址',
      },
      
      success: {
        passwordChanged: '密碼變更成功！',
        resetEmailSent: '密碼重設連結已發送到您的郵箱',
      },
      
      // Additional messages
      userEmailNotFound: '找不到用戶郵箱',
      failedToChangePassword: '密碼變更失敗',
      failedToSendResetEmail: '發送重設郵件失敗',
      passwordsMatch: '密碼匹配',
      changing: '變更中...',
      sending: '發送中...',
      resetEmailInfo: '您將收到一封包含重設密碼說明的電子郵件。',
      
      securityTips: '安全提醒：',
      tips: [
        '為此帳戶使用唯一密碼',
        '不要與任何人分享您的密碼',
        '定期更換密碼',
        '使用密碼管理器生成強密碼',
      ],
    },
    'zh-CN': {
      title: '变更密码',
      description: '更新您的密码以保持账户安全',
      currentPassword: '当前密码',
      newPassword: '新密码',
      confirmPassword: '确认新密码',
      changePasswordBtn: '变更密码',
      forgotPassword: '忘记密码？',
      sendResetLink: '发送重设链接',
      
      resetDialogTitle: '重设密码',
      resetDialogDescription: '输入您的电子邮件地址，我们将向您发送重设密码的链接。',
      emailLabel: '电子邮件地址',
      sendResetBtn: '发送重设链接',
      cancel: '取消',
      
      passwordRequirements: '密码要求：',
      requirements: {
        minLength: '至少 8 个字符',
        uppercase: '至少一个大写字母',
        lowercase: '至少一个小写字母',
        number: '至少一个数字',
        special: '至少一个特殊字符',
      },
      
      strengthLabel: '密码强度：',
      strength: {
        weak: '弱',
        fair: '普通',
        good: '良好',
        strong: '强',
      },
      
      errors: {
        currentPasswordRequired: '请输入当前密码',
        newPasswordRequired: '请输入新密码',
        confirmPasswordRequired: '请确认新密码',
        passwordMismatch: '密码不匹配',
        passwordTooShort: '密码至少需要 8 个字符',
        weakPassword: '密码不符合要求',
        wrongPassword: '当前密码不正确',
        samePassword: '新密码必须与当前密码不同',
        emailRequired: '请输入电子邮件地址',
        invalidEmail: '无效的电子邮件址',
      },
      
      success: {
        passwordChanged: '密码变更成功！',
        resetEmailSent: '密码重设链接已发送到您的邮箱',
      },
      
      // Additional messages
      userEmailNotFound: '找不到用戶郵箱',
      failedToChangePassword: '密码变更失败',
      failedToSendResetEmail: '发送重设邮件失败',
      passwordsMatch: '密码匹配',
      changing: '变更中...',
      sending: '发送中...',
      resetEmailInfo: '您将收到一封包含重设密码说明的电子邮件。',
      
      securityTips: '安全提醒：',
      tips: [
        '为此账户使用唯一密码',
        '不要与任何人分享您的密码',
        '定期更换密码',
        '使用密码管理器生成强密码',
      ],
    },
  };

  const t = content[language as keyof typeof content] || content.en;

  // Password validation
  const validatePassword = (password: string) => {
    return {
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    const validation = validatePassword(password);
    const score = Object.values(validation).filter(Boolean).length;
    
    if (score <= 2) return { level: 'weak', color: 'red', percentage: 25 };
    if (score === 3) return { level: 'fair', color: 'orange', percentage: 50 };
    if (score === 4) return { level: 'good', color: 'yellow', percentage: 75 };
    return { level: 'strong', color: 'green', percentage: 100 };
  };

  const passwordValidation = validatePassword(newPassword);
  const passwordStrength = newPassword ? calculatePasswordStrength(newPassword) : null;
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  // Handle password change
  const handleChangePassword = async () => {
    console.log('🔐 [Password Change] Starting password change process...');
    
    // Validation
    if (!currentPassword) {
      console.warn('⚠️ [Password Change] Current password is empty');
      toast.error(t.errors.currentPasswordRequired);
      return;
    }

    if (!newPassword) {
      console.warn('⚠️ [Password Change] New password is empty');
      toast.error(t.errors.newPasswordRequired);
      return;
    }

    if (!confirmPassword) {
      console.warn('⚠️ [Password Change] Confirm password is empty');
      toast.error(t.errors.confirmPasswordRequired);
      return;
    }

    if (newPassword !== confirmPassword) {
      console.warn('⚠️ [Password Change] Passwords do not match');
      toast.error(t.errors.passwordMismatch);
      return;
    }

    if (newPassword.length < 8) {
      console.warn('⚠️ [Password Change] Password too short');
      toast.error(t.errors.passwordTooShort);
      return;
    }

    if (!isPasswordValid) {
      console.warn('⚠️ [Password Change] Password does not meet requirements');
      toast.error(t.errors.weakPassword);
      return;
    }

    if (currentPassword === newPassword) {
      console.warn('⚠️ [Password Change] New password same as current');
      toast.error(t.errors.samePassword);
      return;
    }

    console.log('✅ [Password Change] All validations passed');
    setLoading(true);

    try {
      // Step 1: Verify current password by attempting to re-authenticate
      if (!user?.email) {
        console.error('❌ [Password Change] User email not found');
        toast.error(t.userEmailNotFound);
        setLoading(false);
        return;
      }

      console.log('🔍 [Password Change] Verifying current password for user:', user.email);

      // Try to sign in with current password to verify it's correct
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        console.error('❌ [Password Change] Current password verification failed:', {
          message: signInError.message,
          status: signInError.status,
          code: signInError.code,
        });
        toast.error(t.errors.wrongPassword);
        setLoading(false);
        return;
      }

      console.log('✅ [Password Change] Current password verified successfully');

      // Step 2: Current password is correct, now update to new password
      console.log('🔄 [Password Change] Updating to new password...');
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('❌ [Password Change] Password update failed:', {
          message: updateError.message,
          status: updateError.status,
          code: updateError.code,
        });
        toast.error(updateError.message);
        setLoading(false);
        return;
      }

      console.log('✅ [Password Change] Password updated successfully!');

      // Success
      toast.success(t.success.passwordChanged);
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      console.log('🎉 [Password Change] Password change completed successfully');
      
    } catch (error) {
      console.error('❌ [Password Change] Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ [Password Change] Error details:', errorMessage);
      toast.error(t.failedToChangePassword);
    } finally {
      setLoading(false);
      console.log('🏁 [Password Change] Process finished');
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error(t.errors.emailRequired);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      toast.error(t.errors.invalidEmail);
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `https://casewhr.com/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        setResetLoading(false);
        return;
      }

      toast.success(t.success.resetEmailSent);
      setShowResetDialog(false);
      setResetEmail(user?.email || '');
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error(t.failedToSendResetEmail);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t.currentPassword}</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="•••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t.newPassword}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && passwordStrength && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t.strengthLabel}</span>
                  <span className={`font-medium text-${passwordStrength.color}-600`}>
                    {t.strength[passwordStrength.level as keyof typeof t.strength]}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${passwordStrength.color}-600 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${passwordStrength.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Password Requirements */}
            {newPassword && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">{t.passwordRequirements}</p>
                <div className="space-y-1">
                  {Object.entries(passwordValidation).map(([key, valid]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {valid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={valid ? 'text-green-700' : 'text-gray-600'}>
                        {t.requirements[key as keyof typeof t.requirements]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className="flex items-center gap-2 text-sm">
                {newPassword === confirmPassword ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-700">
                      {t.passwordsMatch}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-700">{t.errors.passwordMismatch}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Security Tips */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">{t.securityTips}</p>
              <ul className="space-y-1 ml-4">
                {t.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-gray-600">• {tip}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleChangePassword}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t.changing}
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  {t.changePasswordBtn}
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                console.log('🔘 [按鈕點擊] 忘記密碼按鈕被點擊！');
                console.log('🔘 [按鈕狀態] resetLoading:', resetLoading);
                console.log('🔘 [按鈕狀態] showResetDialog:', showResetDialog);
                setShowResetDialog(true);
                console.log('🔘 [按鈕狀態] Dialog 已設置為 true');
              }}
              className="w-full"
              type="button"
            >
              <Mail className="h-4 w-4 mr-2" />
              {t.forgotPassword}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t.resetDialogTitle}
            </DialogTitle>
            <DialogDescription>{t.resetDialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">{t.emailLabel}</Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {t.resetEmailInfo}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)} disabled={resetLoading}>
              {t.cancel}
            </Button>
            <Button onClick={handlePasswordReset} disabled={resetLoading || !resetEmail}>
              {resetLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t.sending}
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  {t.sendResetBtn}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}