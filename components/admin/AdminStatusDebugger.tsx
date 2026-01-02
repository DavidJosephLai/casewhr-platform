/**
 * 管理員狀態調試工具
 * Admin Status Debugger
 * 
 * 用於檢查和診斷管理員權限問題
 */

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle2, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { isAnyAdmin, isSuperAdmin, getAdminLevel } from '../../config/admin';

export function AdminStatusDebugger() {
  const { user, accessToken, profile } = useAuth();
  const { language } = useLanguage();
  const [checking, setChecking] = useState(false);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const content = {
    en: {
      title: 'Admin Status Debugger',
      description: 'Check your admin permissions and profile status',
      refresh: 'Refresh Status',
      checking: 'Checking...',
      currentUser: 'Current User',
      email: 'Email',
      userId: 'User ID',
      frontendCheck: 'Frontend Check',
      profileData: 'Profile Data',
      adminList: 'Admin List',
      isSuperAdmin: 'Is Super Admin',
      isAnyAdmin: 'Is Any Admin',
      adminLevel: 'Admin Level',
      profileIsAdmin: 'Profile isAdmin',
      profileAdminLevel: 'Profile adminLevel',
      inAdminList: 'In Admin List',
      yes: 'Yes',
      no: 'No',
      notFound: 'Not Found',
      loading: 'Loading...',
      error: 'Error',
      recommendation: 'Recommendation',
      needsUpdate: 'Your profile needs to be updated. Click "Fix Profile" below.',
      fixProfile: 'Fix Profile',
      allGood: 'All checks passed! You are properly configured as an admin.',
      fixing: 'Fixing...',
      fixed: 'Profile fixed successfully! Please refresh the page.',
    },
    'zh-TW': {
      title: '管理員狀態調試工具',
      description: '檢查您的管理員權限和個人資料狀態',
      refresh: '刷新狀態',
      checking: '檢查中...',
      currentUser: '當前用戶',
      email: '郵箱',
      userId: '用戶 ID',
      frontendCheck: '前端檢查',
      profileData: '個人資料數據',
      adminList: '管理員列表',
      isSuperAdmin: '是否為超級管理員',
      isAnyAdmin: '是否為任何級別管理員',
      adminLevel: '管理員級別',
      profileIsAdmin: 'Profile isAdmin',
      profileAdminLevel: 'Profile adminLevel',
      inAdminList: '在管理員列表中',
      yes: '是',
      no: '否',
      notFound: '未找到',
      loading: '載入中...',
      error: '錯誤',
      recommendation: '建議',
      needsUpdate: '您的個人資料需要更新。請點擊下方的\"修復個人資料\"按鈕。',
      fixProfile: '修復個人資料',
      allGood: '所有檢查通過！您已正確配置為管理員。',
      fixing: '修復中...',
      fixed: '個人資料修復成功！請刷新頁面。',
    },
    'zh-CN': {
      title: '管理员状态调试工具',
      description: '检查您的管理员权限和个人资料状态',
      refresh: '刷新状态',
      checking: '检查中...',
      currentUser: '当前用户',
      email: '邮箱',
      userId: '用户 ID',
      frontendCheck: '前端检查',
      profileData: '个人资料数据',
      adminList: '管理员列表',
      isSuperAdmin: '是否为超级管理员',
      isAnyAdmin: '是否为任何级别管理员',
      adminLevel: '管理员级别',
      profileIsAdmin: 'Profile isAdmin',
      profileAdminLevel: 'Profile adminLevel',
      inAdminList: '在管理员列表中',
      yes: '是',
      no: '否',
      notFound: '未找到',
      loading: '载入中...',
      error: '错误',
      recommendation: '建议',
      needsUpdate: '您的个人资料需要更新。请点击下方的"修复个人资料"按钮。',
      fixProfile: '修复个人资料',
      allGood: '所有检查通过！您已正确配置为管理员。',
      fixing: '修复中...',
      fixed: '个人资料修复成功！请刷新页面。',
    }
  }[language as keyof typeof content] || content['zh-TW'];

  const checkStatus = async () => {
    if (!user || !accessToken) return;

    setChecking(true);
    setError(null);

    try {
      // Fetch fresh profile data
      const profileResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setProfileData(data.profile);
      }

      // Fetch admin list (only works if you're already an admin)
      try {
        const adminResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/admins`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (adminResponse.ok) {
          const data = await adminResponse.json();
          setAdminList(data.admins || []);
        }
      } catch (err) {
        // It's okay if this fails - user might not be admin yet
        console.log('Could not fetch admin list (this is normal if not admin)');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setChecking(false);
    }
  };

  const fixProfile = async () => {
    if (!user || !accessToken) return;

    setChecking(true);
    setError(null);

    try {
      // Call the profile endpoint which will auto-migrate
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        alert(content.fixed);
        window.location.reload();
      } else {
        throw new Error('Failed to fix profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setChecking(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{content.title}</CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{content.loading}</p>
        </CardContent>
      </Card>
    );
  }

  const frontendIsSuperAdmin = isSuperAdmin(user.email);
  const frontendIsAnyAdmin = isAnyAdmin(user.email, profile);
  const frontendAdminLevel = getAdminLevel(user.email, profile);
  const inAdminList = adminList.some(admin => admin.email === user.email);

  const hasIssue = !frontendIsAnyAdmin || !profile?.isAdmin;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {content.title}
          <Button
            size="sm"
            variant="outline"
            onClick={checkStatus}
            disabled={checking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            {checking ? content.checking : content.refresh}
          </Button>
        </CardTitle>
        <CardDescription>{content.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{content.error}: {error}</span>
            </div>
          </div>
        )}

        {/* Current User */}
        <div className="space-y-2">
          <h3 className="font-semibold">{content.currentUser}</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{content.email}:</span>
              <span className="font-mono">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{content.userId}:</span>
              <span className="font-mono text-sm">{user.id}</span>
            </div>
          </div>
        </div>

        {/* Frontend Check */}
        <div className="space-y-2">
          <h3 className="font-semibold">{content.frontendCheck}</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <CheckRow
              label={content.isSuperAdmin}
              value={frontendIsSuperAdmin}
              language={language}
            />
            <CheckRow
              label={content.isAnyAdmin}
              value={frontendIsAnyAdmin}
              language={language}
            />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{content.adminLevel}:</span>
              <Badge variant={frontendAdminLevel ? 'default' : 'secondary'}>
                {frontendAdminLevel || content.notFound}
              </Badge>
            </div>
          </div>
        </div>

        {/* Profile Data */}
        {profileData && (
          <div className="space-y-2">
            <h3 className="font-semibold">{content.profileData}</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <CheckRow
                label={content.profileIsAdmin}
                value={profileData.isAdmin === true}
                language={language}
              />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{content.profileAdminLevel}:</span>
                <Badge variant={profileData.adminLevel ? 'default' : 'secondary'}>
                  {profileData.adminLevel || content.notFound}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Admin List */}
        {adminList.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">{content.adminList}</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <CheckRow
                label={content.inAdminList}
                value={inAdminList}
                language={language}
              />
              <div className="text-sm text-muted-foreground">
                {content.adminList}: {adminList.length} {language === 'en' ? 'admins' : '位管理員'}
              </div>
            </div>
          </div>
        )}

        {/* Recommendation */}
        {hasIssue && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900">{content.recommendation}</h4>
                  <p className="text-yellow-800 mt-1">{content.needsUpdate}</p>
                </div>
              </div>
              <Button
                onClick={fixProfile}
                disabled={checking}
                className="w-full"
              >
                {checking ? content.fixing : content.fixProfile}
              </Button>
            </div>
          </div>
        )}

        {!hasIssue && frontendIsAnyAdmin && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <span>{content.allGood}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CheckRow({ label, value, language }: { label: string; value: boolean; language: string }) {
  const textMap = { 
    en: { yes: 'Yes', no: 'No' }, 
    'zh-TW': { yes: '是', no: '否' },
    'zh-CN': { yes: '是', no: '否' }
  };
  const text = textMap[language as keyof typeof textMap] || textMap['zh-TW'];
  
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-2">
        {value ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-green-600">{text.yes}</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-600">{text.no}</span>
          </>
        )}
      </div>
    </div>
  );
}