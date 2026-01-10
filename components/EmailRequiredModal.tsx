import React, { useState } from 'react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from '../lib/LanguageContext';

interface EmailRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export function EmailRequiredModal({ isOpen, onClose, userId }: EmailRequiredModalProps) {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !userId) return null;

  const t = {
    en: {
      title: '📧 Email Required',
      description: 'LINE did not provide your email address. Please enter your email to complete registration.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'your-email@example.com',
      submitButton: 'Continue',
      submitting: 'Updating...',
      invalidEmail: 'Please enter a valid email address',
      networkError: 'Failed to update email. Please try again.',
      success: 'Email updated successfully! Redirecting...',
    },
    'zh-TW': {
      title: '📧 需要電子郵件',
      description: 'LINE 未提供您的電子郵件地址。請輸入您的電子郵件以完成註冊。',
      emailLabel: '電子郵件地址',
      emailPlaceholder: 'your-email@example.com',
      submitButton: '繼續',
      submitting: '更新中...',
      invalidEmail: '請輸入有效的電子郵件地址',
      networkError: '更新電子郵件失敗，請重試。',
      success: '電子郵件更新成功！正在重定向...',
    },
    'zh-CN': {
      title: '📧 需要电子邮件',
      description: 'LINE 未提供您的电子邮件地址。请输入您的电子邮件以完成注册。',
      emailLabel: '电子邮件地址',
      emailPlaceholder: 'your-email@example.com',
      submitButton: '继续',
      submitting: '更新中...',
      invalidEmail: '请输入有效的电子邮件地址',
      networkError: '更新电子邮件失败，请重试。',
      success: '电子邮件更新成功！正在重定向...',
    },
  };

  const text = t[language as keyof typeof t] || t.en;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(text.invalidEmail);
      return;
    }

    if (!validateEmail(email)) {
      setError(text.invalidEmail);
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🟢 [EmailRequiredModal] Updating email for user:', userId);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/auth/line/update-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            user_id: userId,
            email: email.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update email');
      }

      const data = await response.json();
      console.log('✅ [EmailRequiredModal] Email updated successfully:', data);

      toast.success(text.success, { duration: 3000 });

      // 關閉 Modal
      onClose();

      // 使用 magic link 自動登入
      if (data.magic_link) {
        console.log('🔗 [EmailRequiredModal] Using magic link to establish session');
        window.location.href = data.magic_link;
        return;
      }

      // 備用：直接跳轉到 dashboard（應該不會執行到這裡）
      setTimeout(() => {
        window.location.href = '/?view=dashboard';
      }, 1000);
    } catch (err: any) {
      console.error('❌ [EmailRequiredModal] Submit error:', err);
      
      // 根據錯誤類型顯示不同的訊息
      let errorMessage = err.message || text.networkError;
      
      if (err.message?.includes('already registered with another account')) {
        // 提取登入方式（如果有）
        const providerMatch = err.message.match(/via (\w+)/);
        const provider = providerMatch ? providerMatch[1] : 'another method';
        
        errorMessage = language === 'en'
          ? `This email is already registered via ${provider}. Please use a different email or sign in with your existing ${provider} account.`
          : language === 'zh-CN'
          ? `此电子邮件已通过 ${provider} 注册。请使用其他邮箱或用现有的 ${provider} 账户登录。`
          : `此電子郵件已透過 ${provider} 註冊。請使用其他信箱或用現有的 ${provider} 帳戶登入。`;
      } else if (err.message?.includes('Email already in use')) {
        errorMessage = language === 'en'
          ? 'This email is already registered. Please use a different email address.'
          : language === 'zh-CN'
          ? '此电子邮件已被注册，请使用其他邮箱地址。'
          : '此電子郵件已被註冊，請使用其他信箱地址。';
      } else if (err.message?.includes('Invalid email format')) {
        errorMessage = text.invalidEmail;
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // 防止點擊背景關閉 Modal
        e.stopPropagation();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{text.title}</h2>
          <p className="text-gray-600 text-sm">{text.description}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {text.emailLabel}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={text.emailPlaceholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              disabled={isSubmitting}
              autoFocus
              required
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? text.submitting : text.submitButton}
          </button>
        </form>

        {/* Info */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          {language === 'en'
            ? 'Your email will be used for notifications and account recovery.'
            : language === 'zh-CN'
            ? '您的电子邮件将用于通知和账户恢复。'
            : '您的電子郵件將用於通知和帳戶恢復。'}
        </p>
      </div>
    </div>
  );
}