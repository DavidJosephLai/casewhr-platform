import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, AlertCircle, Key, User as UserIcon, Shield } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export function AuthDiagnostics() {
  const { user, profile, accessToken, loading } = useAuth();
  const { language } = useLanguage();

  const checks = [
    {
      name: language === 'en' ? 'User Loaded' : '用戶已加載',
      status: user ? 'success' : 'error',
      message: user ? `User ID: ${user.id.substring(0, 8)}...` : 'No user found',
      icon: UserIcon,
    },
    {
      name: language === 'en' ? 'Access Token' : '訪問令牌',
      status: accessToken ? 'success' : 'error',
      message: accessToken 
        ? `Token: ${accessToken.substring(0, 15)}...` 
        : 'No access token - Please sign in',
      icon: Key,
    },
    {
      name: language === 'en' ? 'Profile Loaded' : '個人資料已加載',
      status: profile ? 'success' : (user ? 'warning' : 'error'),
      message: profile 
        ? `${profile.full_name} (${profile.account_type})` 
        : (user ? 'User found but profile not loaded' : 'No profile'),
      icon: Shield,
    },
  ];

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          {language === 'en' ? 'Authentication Status' : '認證狀態'}
        </CardTitle>
        <CardDescription>
          {language === 'en' 
            ? 'Current authentication and session information'
            : '當前認證和會話信息'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4 text-gray-500">
            ⏳ {language === 'en' ? 'Loading authentication...' : '加載認證中...'}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {checks.map((check, index) => {
                const Icon = check.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    <div className="mt-0.5">
                      {check.status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {check.status === 'warning' && (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      {check.status === 'error' && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">{check.name}</span>
                        <Badge 
                          variant={
                            check.status === 'success' ? 'default' : 
                            check.status === 'warning' ? 'secondary' : 
                            'destructive'
                          }
                        >
                          {check.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {check.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {!accessToken && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-sm text-red-800 mb-2">
                  <strong>🚨 {language === 'en' ? 'Authentication Required' : '需要身份驗證'}</strong>
                </p>
                <p className="text-sm text-red-700">
                  {language === 'en' 
                    ? 'You are not signed in. Please sign in to access wallet features, transactions, and invoices.'
                    : '您尚未登入。請登入以訪問錢包功能、交易記錄和發票。'}
                </p>
              </div>
            )}

            {accessToken && (
              <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ {language === 'en' 
                    ? 'You are authenticated. All API endpoints should work.'
                    : '您已通過身份驗證。所有 API 端點都應該正常工作。'}
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1 border-t pt-3">
              <p><strong>{language === 'en' ? 'Debug Info:' : '調試信息：'}</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Loading: {loading ? 'true' : 'false'}</li>
                <li>User ID: {user?.id || 'null'}</li>
                <li>Token Length: {accessToken?.length || 0} chars</li>
                <li>Profile Email: {profile?.email || 'null'}</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
