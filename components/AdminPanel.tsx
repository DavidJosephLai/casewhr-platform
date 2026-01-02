import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, Database, Users, Settings } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { DiagnosticPanel } from './DiagnosticPanel';
import { AdminUserManagement } from './AdminUserManagement';
import { isAdmin as checkIsAdmin } from '../lib/adminConfig';

export function AdminPanel() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const content = {
    en: {
      title: 'Admin Panel',
      description: 'System administration and management',
      notAdmin: 'You do not have administrator privileges',
      database: 'Database',
      diagnostics: 'Diagnostics',
      users: 'Users',
      settings: 'Settings',
      adminBadge: 'Administrator',
    },
    'zh-TW': {
      title: '管理員面板',
      description: '系統管理與設定',
      notAdmin: '您沒有管理員權限',
      database: '資料庫',
      diagnostics: '診斷',
      users: '用戶',
      settings: '設定',
      adminBadge: '管理員',
    },
    'zh-CN': {
      title: '管理员面板',
      description: '系统管理与设定',
      notAdmin: '您没有管理员权限',
      database: '数据库',
      diagnostics: '诊断',
      users: '用户',
      settings: '设定',
      adminBadge: '管理员',
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  useEffect(() => {
    setIsAdmin(checkIsAdmin(user?.email));
    setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">
            {language === 'en' ? 'Loading...' : '載入中...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-admin-panel>
      {/* Header */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-blue-900">{t.title}</CardTitle>
                <CardDescription className="text-blue-700">
                  {t.description}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-blue-600 text-white">
              {t.adminBadge}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Admin Tabs */}
      <Tabs defaultValue="database" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="database" className="gap-2">
            <Database className="h-4 w-4" />
            {t.database}
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="gap-2">
            <Settings className="h-4 w-4" />
            {t.diagnostics}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            {t.users}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2" disabled>
            <Settings className="h-4 w-4" />
            {t.settings}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardContent className="py-8 text-center">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">
                {language === 'en' ? 'Database management coming soon...' : '資料庫管理即將推出...'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6">
          <DiagnosticPanel />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardContent className="py-8 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">
                {language === 'en' ? 'System settings coming soon...' : '系統設定即將推出...'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}