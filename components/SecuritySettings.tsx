import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Shield, 
  Lock, 
  Mail, 
  Smartphone,
  Clock,
  MapPin,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { PasswordManagement } from './PasswordManagement';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SecurityActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  ip_address?: string;
  location?: string;
  device?: string;
}

export function SecuritySettings() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [activities, setActivities] = useState<SecurityActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const content = {
    en: {
      title: 'Security Settings',
      description: 'Manage your account security and privacy',
      
      passwordSection: 'Password',
      passwordDesc: 'Change your password regularly to keep your account secure',
      
      emailSection: 'Email Address',
      emailDesc: 'Your email is used for login and important notifications',
      emailVerified: 'Verified',
      emailNotVerified: 'Not Verified',
      verifyEmail: 'Verify Email',
      
      twoFactorSection: 'Two-Factor Authentication',
      twoFactorDesc: 'Add an extra layer of security to your account',
      twoFactorEnabled: 'Enabled',
      twoFactorDisabled: 'Disabled',
      enable2FA: 'Enable 2FA',
      disable2FA: 'Disable 2FA',
      comingSoon: 'Coming Soon',
      
      activitySection: 'Recent Activity',
      activityDesc: 'Monitor your account activity and login history',
      noActivity: 'No recent activity',
      
      sessionSection: 'Active Sessions',
      sessionDesc: 'Devices currently logged into your account',
      currentDevice: 'Current Device',
      lastActive: 'Last active',
      
      securityTips: 'Security Recommendations',
      tips: [
        'Use a strong, unique password',
        'Enable two-factor authentication',
        'Keep your email address up to date',
        'Review account activity regularly',
        'Never share your password',
      ],
      
      activities: {
        password_changed: 'Password changed',
        login: 'Logged in',
        logout: 'Logged out',
        email_verified: 'Email verified',
        profile_updated: 'Profile updated',
        subscription_changed: 'Subscription changed',
      },
    },
    zh: {
      title: '安全設置',
      description: '管理您的帳戶安全和隱私',
      
      passwordSection: '密碼',
      passwordDesc: '定期更改密碼以保持帳戶安全',
      
      emailSection: '電子郵件地址',
      emailDesc: '您的電子郵件用於登入和重要通知',
      emailVerified: '已驗證',
      emailNotVerified: '未驗證',
      verifyEmail: '驗證郵箱',
      
      twoFactorSection: '雙因素驗證',
      twoFactorDesc: '為您的帳戶添加額外的安全層',
      twoFactorEnabled: '已啟用',
      twoFactorDisabled: '未啟用',
      enable2FA: '啟用 2FA',
      disable2FA: '停用 2FA',
      comingSoon: '即將推出',
      
      activitySection: '最近活動',
      activityDesc: '監控您的帳戶活動和登入歷史',
      noActivity: '沒有最近的活動',
      
      sessionSection: '活動會話',
      sessionDesc: '目前登入您帳戶的設備',
      currentDevice: '目前設備',
      lastActive: '最後活動',
      
      securityTips: '安全建議',
      tips: [
        '使用強而獨特的密碼',
        '啟用雙因素驗證',
        '保持您的電子郵件地址最新',
        '定期檢查帳戶活動',
        '切勿分享您的密碼',
      ],
      
      activities: {
        password_changed: '密碼已更改',
        login: '已登入',
        logout: '已登出',
        email_verified: '郵箱已驗證',
        profile_updated: '個人資料已更新',
        subscription_changed: '訂閱已變更',
      },
    },
  };

  const t = content[language];

  useEffect(() => {
    loadSecurityActivities();
  }, []);

  const loadSecurityActivities = async () => {
    try {
      // Mock data for now - in production, fetch from backend
      const mockActivities: SecurityActivity[] = [
        {
          id: '1',
          type: 'login',
          description: t.activities.login,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.1',
          location: 'Taipei, Taiwan',
          device: 'Chrome on Windows',
        },
        {
          id: '2',
          type: 'profile_updated',
          description: t.activities.profile_updated,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.1',
          location: 'Taipei, Taiwan',
        },
        {
          id: '3',
          type: 'login',
          description: t.activities.login,
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.2',
          location: 'Taipei, Taiwan',
          device: 'Safari on iPhone',
        },
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Error loading security activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return language === 'en' 
        ? `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
        : `${diffMins} 分鐘前`;
    } else if (diffHours < 24) {
      return language === 'en'
        ? `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
        : `${diffHours} 小時前`;
    } else if (diffDays < 7) {
      return language === 'en'
        ? `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
        : `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8" />
          {t.title}
        </h1>
        <p className="text-gray-600 mt-2">{t.description}</p>
      </div>

      {/* Security Tips Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">{t.securityTips}</p>
          <ul className="space-y-1 ml-4">
            {t.tips.map((tip, index) => (
              <li key={index} className="text-sm text-gray-600">• {tip}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      {/* Password Management */}
      <PasswordManagement />

      {/* Email Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t.emailSection}
          </CardTitle>
          <CardDescription>{t.emailDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">{user?.email}</p>
              <div className="flex items-center gap-2">
                {user?.email_confirmed_at ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {t.emailVerified}
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {t.emailNotVerified}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            {!user?.email_confirmed_at && (
              <Button variant="outline">
                {t.verifyEmail}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {t.twoFactorSection}
          </CardTitle>
          <CardDescription>{t.twoFactorDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  {t.twoFactorDisabled}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {t.comingSoon}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {language === 'en' 
                  ? 'Add an extra layer of security with 2FA'
                  : '使用雙因素驗證添加額外的安全層'}
              </p>
            </div>
            <Button variant="outline" disabled>
              {t.enable2FA}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t.activitySection}
          </CardTitle>
          <CardDescription>{t.activityDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              {language === 'en' ? 'Loading...' : '載入中...'}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t.noActivity}
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{activity.description}</p>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {activity.ip_address && (
                        <div className="flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          {activity.ip_address}
                        </div>
                      )}
                      {activity.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activity.location}
                        </div>
                      )}
                      {activity.device && (
                        <div className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          {activity.device}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t.sessionSection}
          </CardTitle>
          <CardDescription>{t.sessionDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Chrome on Windows</p>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 mt-1">
                      {t.currentDevice}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Taipei, Taiwan
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t.lastActive}: {formatTimestamp(new Date().toISOString())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
