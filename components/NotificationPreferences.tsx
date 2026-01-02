import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Bell, Mail } from 'lucide-react';
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from '../lib/LanguageContext';
import { toast } from "sonner";

export function NotificationPreferences() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    subscription_updates: true,
    renewal_reminders: true,
    payment_confirmations: true,
    low_balance_alerts: true,
    marketing_emails: false,
  });

  const content = {
    en: {
      title: 'Email Notifications',
      description: 'Manage your email notification preferences',
      subscriptionUpdates: 'Subscription Updates',
      subscriptionUpdatesDesc: 'Get notified when your subscription changes',
      renewalReminders: 'Renewal Reminders',
      renewalRemindersDesc: 'Receive reminders 3 days before renewal',
      paymentConfirmations: 'Payment Confirmations',
      paymentConfirmationsDesc: 'Get notified of successful payments',
      lowBalanceAlerts: 'Low Balance Alerts',
      lowBalanceAlertsDesc: 'Alert me when wallet balance is low',
      marketingEmails: 'Marketing Emails',
      marketingEmailsDesc: 'Receive promotional offers and updates',
      saved: 'Preferences saved',
      error: 'Failed to save preferences',
    },
    'zh-TW': {
      title: '郵件通知',
      description: '管理您的郵件通知偏好設置',
      subscriptionUpdates: '訂閱更新',
      subscriptionUpdatesDesc: '訂閱變更時通知我',
      renewalReminders: '續費提醒',
      renewalRemindersDesc: '在續費前 3 天提醒我',
      paymentConfirmations: '付款確認',
      paymentConfirmationsDesc: '付款成功時通知我',
      lowBalanceAlerts: '餘額不足警告',
      lowBalanceAlertsDesc: '錢包餘額不足時警告我',
      marketingEmails: '行銷郵件',
      marketingEmailsDesc: '接收促銷優惠和更新資訊',
      saved: '偏好設置已儲存',
      error: '儲存偏好設置失敗',
    },
    'zh-CN': {
      title: '邮件通知',
      description: '管理您的邮件通知偏好设置',
      subscriptionUpdates: '订阅更新',
      subscriptionUpdatesDesc: '订阅变更时通知我',
      renewalReminders: '续费提醒',
      renewalRemindersDesc: '在续费前 3 天提醒我',
      paymentConfirmations: '付款确认',
      paymentConfirmationsDesc: '付款成功时通知我',
      lowBalanceAlerts: '余额不足警告',
      lowBalanceAlertsDesc: '钱包余额不足时警告我',
      marketingEmails: '营销邮件',
      marketingEmailsDesc: '接收促销优惠和更新资讯',
      saved: '偏好设置已储存',
      error: '储存偏好设置失败',
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  useEffect(() => {
    // Load preferences from localStorage
    if (user?.id) {
      const saved = localStorage.getItem(`notification_prefs_${user.id}`);
      if (saved) {
        try {
          setPreferences(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load preferences:', e);
        }
      }
    }
  }, [user?.id]);

  const handleToggle = async (key: keyof typeof preferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    
    setPreferences(newPreferences);
    
    // Save to localStorage
    if (user?.id) {
      try {
        localStorage.setItem(`notification_prefs_${user.id}`, JSON.stringify(newPreferences));
        toast.success(t.saved);
      } catch (e) {
        console.error('Failed to save preferences:', e);
        toast.error(t.error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="space-y-0.5">
              <Label htmlFor="subscription_updates" className="cursor-pointer">
                {t.subscriptionUpdates}
              </Label>
              <p className="text-sm text-gray-500">
                {t.subscriptionUpdatesDesc}
              </p>
            </div>
          </div>
          <Switch
            id="subscription_updates"
            checked={preferences.subscription_updates}
            onCheckedChange={() => handleToggle('subscription_updates')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="space-y-0.5">
              <Label htmlFor="renewal_reminders" className="cursor-pointer">
                {t.renewalReminders}
              </Label>
              <p className="text-sm text-gray-500">
                {t.renewalRemindersDesc}
              </p>
            </div>
          </div>
          <Switch
            id="renewal_reminders"
            checked={preferences.renewal_reminders}
            onCheckedChange={() => handleToggle('renewal_reminders')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="space-y-0.5">
              <Label htmlFor="payment_confirmations" className="cursor-pointer">
                {t.paymentConfirmations}
              </Label>
              <p className="text-sm text-gray-500">
                {t.paymentConfirmationsDesc}
              </p>
            </div>
          </div>
          <Switch
            id="payment_confirmations"
            checked={preferences.payment_confirmations}
            onCheckedChange={() => handleToggle('payment_confirmations')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="space-y-0.5">
              <Label htmlFor="low_balance_alerts" className="cursor-pointer">
                {t.lowBalanceAlerts}
              </Label>
              <p className="text-sm text-gray-500">
                {t.lowBalanceAlertsDesc}
              </p>
            </div>
          </div>
          <Switch
            id="low_balance_alerts"
            checked={preferences.low_balance_alerts}
            onCheckedChange={() => handleToggle('low_balance_alerts')}
          />
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
              <div className="space-y-0.5">
                <Label htmlFor="marketing_emails" className="cursor-pointer">
                  {t.marketingEmails}
                </Label>
                <p className="text-sm text-gray-500">
                  {t.marketingEmailsDesc}
                </p>
              </div>
            </div>
            <Switch
              id="marketing_emails"
              checked={preferences.marketing_emails}
              onCheckedChange={() => handleToggle('marketing_emails')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}