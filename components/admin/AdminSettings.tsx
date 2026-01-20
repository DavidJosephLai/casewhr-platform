import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Settings, Mail, ExternalLink, Loader2, AlertCircle, CheckCircle, RefreshCw, Wallet, DollarSign } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useView } from '../../contexts/ViewContext';
import { AdminLevel } from '../../config/admin';
import { DatabaseDebugger } from './DatabaseDebugger';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner';

interface AdminSettingsProps {
  adminLevel: AdminLevel | null;
}

export function AdminSettings({ adminLevel }: AdminSettingsProps) {
  const { language } = useLanguage();
  const { setView, setManualOverride } = useView();
  const { accessToken } = useAuth();
  const [rebuildingIndex, setRebuildingIndex] = useState(false);
  const [rebuildResult, setRebuildResult] = useState<any>(null);
  const [rebuildError, setRebuildError] = useState<string | null>(null);
  
  const handleOpenBrevoTest = () => {
    setView('brevo-test');
    setManualOverride(true);
  };
  
  const rebuildIndex = async () => {
    if (!accessToken) return;

    setRebuildingIndex(true);
    setRebuildError(null);
    setRebuildResult(null);

    try {
      console.log('🔄 Rebuilding project index...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/rebuild-project-index`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response data:', data);

      if (response.ok) {
        setRebuildResult(data);
        console.log('✅ Project index rebuilt successfully:', data);
        toast.success(
          language === 'en'
            ? `✅ Project index rebuilt! ${data.totalProjects || 0} projects indexed.`
            : `✅ 項目索引重建成功！已索引 ${data.totalProjects || 0} 個項目。`,
          { duration: 5000 }
        );
      } else {
        const errorMsg = data.error || 'Failed to rebuild project index';
        setRebuildError(errorMsg);
        console.error('❌ Error from server:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('❌ Exception rebuilding project index:', err);
      setRebuildError(err.message || 'Failed to rebuild project index');
      toast.error(err.message || 'Failed to rebuild project index');
    } finally {
      setRebuildingIndex(false);
    }
  };
  
  const t = {
    en: {
      title: 'System Settings',
      description: 'Configure system-wide settings and test email services',
      emailTestTitle: 'Email System Test',
      emailTestDesc: 'Test the Brevo SMTP email service to ensure notifications are working correctly.',
      sendTest: 'Send test emails',
      checkConfig: 'Check SMTP configuration',
      viewStatus: 'View detailed status',
      testButton: 'Test Email',
      rebuildIndexTitle: 'Rebuild Project Index',
      rebuildIndexDesc: 'Scan all projects in the database and rebuild the project index (projects:all) to ensure all projects are properly listed.',
      rebuildBtn: 'Rebuild Index',
      rebuilding: 'Rebuilding...',
      rebuildSuccess: 'Index rebuilt successfully!',
    },
    'zh-TW': {
      title: '系統設置',
      description: '配置系統設置和測試郵件服務',
      emailTestTitle: '郵件系統測試',
      emailTestDesc: '測試 Brevo SMTP 郵件服務，確保通知功能正常運作。',
      sendTest: '發送測試郵件',
      checkConfig: '檢查 SMTP 配置',
      viewStatus: '查看詳細狀態',
      testButton: '測試郵件',
      rebuildIndexTitle: '重建項目索引',
      rebuildIndexDesc: '掃描資料庫中的所有項目並重建項目索引（projects:all），確保所有項目都能正確列出。',
      rebuildBtn: '重建索引',
      rebuilding: '重建中...',
      rebuildSuccess: '索引重建成功！',
    },
    'zh-CN': {
      title: '系统设置',
      description: '配置系统设置和测试邮件服务',
      emailTestTitle: '邮件系统测试',
      emailTestDesc: '测试 Brevo SMTP 邮件服务，确保通知功能正常运作。',
      sendTest: '发送测试邮件',
      checkConfig: '检查 SMTP 配置',
      viewStatus: '查看详细状态',
      testButton: '测试邮件',
      rebuildIndexTitle: '重建项目索引',
      rebuildIndexDesc: '扫描数据库中的所有项目并重建项目索引（projects:all），确保所有项目都能正确列出。',
      rebuildBtn: '重建索引',
      rebuilding: '重建中...',
      rebuildSuccess: '索引重建成功！',
    }
  };

  const text = t[language as keyof typeof t] || t['zh-TW'];
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            {text.title}
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">{text.description}</p>
        </CardHeader>
      </Card>

      {/* 郵件系統測試 */}
      <Card>
        <CardContent className="pt-6">
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {text.emailTestTitle}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {text.emailTestDesc}
                  </p>
                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{text.sendTest}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{text.checkConfig}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{text.viewStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleOpenBrevoTest}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
              >
                <Mail className="h-4 w-4" />
                {text.testButton}
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 重建索引 */}
      <Card>
        <CardContent className="pt-6">
          <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {text.rebuildIndexTitle}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {text.rebuildIndexDesc}
                  </p>
                  
                  {/* 成功消息 */}
                  {rebuildResult && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-medium text-green-800">{text.rebuildSuccess}</p>
                      </div>
                      <div className="mt-2 text-xs text-green-700">
                        <div>Total Projects: {rebuildResult.totalProjects || 0}</div>
                        <div>Users with Projects: {rebuildResult.usersWithProjects || 0}</div>
                        <div>User Indexes Updated: {rebuildResult.userIndexesUpdated || 0}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* 錯誤消息 */}
                  {rebuildError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm text-red-800">{rebuildError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={rebuildIndex}
                disabled={rebuildingIndex}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 whitespace-nowrap"
              >
                {rebuildingIndex ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {rebuildingIndex ? text.rebuilding : text.rebuildBtn}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 數據庫調試器 */}
      <DatabaseDebugger />
    </div>
  );
}