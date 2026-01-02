import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { useView } from '../contexts/ViewContext';
import { useAuth } from '../contexts/AuthContext';
import { copyToClipboard } from '../utils/clipboard';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Crown,
  CheckCircle2,
  AlertCircle,
  Code,
  BookOpen
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at?: string;
  requests_count: number;
  status: 'active' | 'revoked';
}

interface ApiKeyManagementProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function ApiKeyManagement({ language = 'en' }: ApiKeyManagementProps) {
  const { user, accessToken } = useAuth();
  const { setView } = useView();
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const translations = {
    en: {
      title: 'API Access',
      enterpriseOnly: 'Enterprise Only',
      upgrade: 'Upgrade to Enterprise',
      upgradeDesc: 'Get API access to integrate Case Where with your own systems! Available exclusively for Enterprise plan.',
      createKey: 'Create API Key',
      keyName: 'Key Name',
      keyNamePlaceholder: 'e.g., Production Server',
      create: 'Create',
      creating: 'Creating...',
      cancel: 'Cancel',
      revoke: 'Revoke',
      copy: 'Copy',
      copied: 'Copied!',
      show: 'Show',
      hide: 'Hide',
      active: 'Active',
      revoked: 'Revoked',
      createdAt: 'Created',
      lastUsed: 'Last Used',
      requests: 'Requests',
      never: 'Never',
      noKeys: 'No API keys yet. Create one to get started!',
      keyCreated: 'API key created successfully',
      keyRevoked: 'API key revoked',
      confirmRevoke: 'Are you sure you want to revoke this API key? This action cannot be undone.',
      documentation: 'API Documentation',
      viewDocs: 'View Documentation',
      securityWarning: '⚠️ Keep your API keys secure! Never share them publicly or commit them to version control.',
      newKeyWarning: '🔑 Save this key now! For security reasons, it will only be shown once.',
      benefits: {
        title: 'What You Can Do With API Access:',
        items: [
          'Automate project creation and management',
          'Integrate with your existing systems',
          'Build custom dashboards and tools',
          'Sync data with external platforms',
          'Create automated workflows',
          'Access real-time data programmatically'
        ]
      }
    },
    zh: {
      title: 'API 訪問',
      enterpriseOnly: '企業版專屬',
      upgrade: '升級至企業版',
      upgradeDesc: '獲得 API 訪問權限，將 Case Where 整合到您的系統中！僅限企業版方案。',
      createKey: '創建 API 金鑰',
      keyName: '金鑰名稱',
      keyNamePlaceholder: '例如：生產環境伺服器',
      create: '創建',
      creating: '創建中...',
      cancel: '取消',
      revoke: '撤銷',
      copy: '複製',
      copied: '已複製！',
      show: '顯示',
      hide: '隱藏',
      active: '啟用',
      revoked: '已撤銷',
      createdAt: '創建時間',
      lastUsed: '最後使用',
      requests: '請求數',
      never: '從未使用',
      noKeys: '尚無 API 金鑰。立即創建一個開始使用！',
      keyCreated: 'API 金鑰創建成功',
      keyRevoked: 'API 金鑰已撤銷',
      confirmRevoke: '確定要撤銷此 API 金鑰嗎？此操作無法復原。',
      documentation: 'API 文檔',
      viewDocs: '查看文檔',
      securityWarning: '⚠️ 請妥善保管您的 API 金鑰！不要公開分享或提交到版本控制系統。',
      newKeyWarning: '🔑 請立即保存此金鑰！基於安全考慮，它只會顯示一次。',
      benefits: {
        title: 'API 訪問可以做什麼：',
        items: [
          '自動化項目創建和管理',
          '與現有系統整合',
          '構建自訂儀表板和工具',
          '與外部平台同步數據',
          '創建自動化工作流程',
          '以程式方式訪問即時數據'
        ]
      }
    },
    'zh-TW': {
      title: 'API 訪問',
      enterpriseOnly: '企業版專屬',
      upgrade: '升級至企業版',
      upgradeDesc: '獲得 API 訪問權限，將 Case Where 整合到您的系統中！僅限企業版方案。',
      createKey: '創建 API 金鑰',
      keyName: '金鑰名稱',
      keyNamePlaceholder: '例如：生產環境伺服器',
      create: '創建',
      creating: '創建中...',
      cancel: '取消',
      revoke: '撤銷',
      copy: '複製',
      copied: '已複製！',
      show: '顯示',
      hide: '隱藏',
      active: '啟用',
      revoked: '已撤銷',
      createdAt: '創建時間',
      lastUsed: '最後使用',
      requests: '請求數',
      never: '從未使用',
      noKeys: '尚無 API 金鑰。立即創建一個開始使用！',
      keyCreated: 'API 金鑰創建成功',
      keyRevoked: 'API 金鑰已撤銷',
      confirmRevoke: '確定要撤銷此 API 金鑰嗎？此操作無法復原。',
      documentation: 'API 文檔',
      viewDocs: '查看文檔',
      securityWarning: '⚠️ 請妥善保管您的 API 金鑰！不要公開分享或提交到版本控制系統。',
      newKeyWarning: '🔑 請立即保存此金鑰！基於安全考慮，它只會顯示一次。',
      benefits: {
        title: 'API 訪問可以做什麼：',
        items: [
          '自動化項目創建和管理',
          '與現有系統整合',
          '構建自訂儀表板和工具',
          '與外部平台同步數據',
          '創建自動化工作流程',
          '以程式方式訪問即時數據'
        ]
      }
    },
    'zh-CN': {
      title: 'API 访问',
      enterpriseOnly: '企业版专属',
      upgrade: '升级至企业版',
      upgradeDesc: '获得 API 访问权限，将 Case Where 集成到您的系统中！仅限企业版方案。',
      createKey: '创建 API 密钥',
      keyName: '密钥名称',
      keyNamePlaceholder: '例如：生产环境服务器',
      create: '创建',
      creating: '创建中...',
      cancel: '取消',
      revoke: '撤销',
      copy: '复制',
      copied: '已复制！',
      show: '显示',
      hide: '隐藏',
      active: '启用',
      revoked: '已撤销',
      createdAt: '创建时间',
      lastUsed: '最后使用',
      requests: '请求数',
      never: '从未使用',
      noKeys: '尚无 API 密钥。立即创建一个开始使用！',
      keyCreated: 'API 密钥创建成功',
      keyRevoked: 'API 密钥已撤销',
      confirmRevoke: '确定要撤销此 API 密钥吗？此操作无法复原。',
      documentation: 'API 文档',
      viewDocs: '查看文档',
      securityWarning: '⚠️ 请妥善保管您的 API 密钥！不要公开分享或提交到版本控制系统。',
      newKeyWarning: '🔑 请立即保存此密钥！基于安全考虑，它只会显示一次。',
      benefits: {
        title: 'API 访问可以做什么：',
        items: [
          '自动化项目创建和管理',
          '与现有系统集成',
          '构建自定义仪表板和工具',
          '与外部平台同步数据',
          '创建自动化工作流程',
          '以编程方式访问实时数据'
        ]
      }
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch subscription
      const subResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscriptions/user/${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.subscription);
      }

      // Fetch API keys if enterprise
      const keysResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/api-keys`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setApiKeys(keysData.keys || []);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!keyName.trim()) {
      toast.error(language === 'en' ? 'Please enter a key name' : '請輸入金鑰名稱');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/api-keys`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ name: keyName }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create API key');
      }

      const data = await response.json();
      toast.success(t.keyCreated);
      setNewlyCreatedKey(data.key.key);
      setKeyName('');
      fetchData();
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error(language === 'en' ? 'Failed to create API key' : '創建 API 金鑰失敗');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm(t.confirmRevoke)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/api-keys/${keyId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }

      toast.success(t.keyRevoked);
      fetchData();
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error(language === 'en' ? 'Failed to revoke API key' : '撤銷 API 金鑰失敗');
    }
  };

  const handleCopyKey = (key: string) => {
    copyToClipboard(key);
    toast.success(t.copied);
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const maskKey = (key: string) => {
    return key.substring(0, 8) + '...' + key.substring(key.length - 8);
  };

  const isEnterprise = subscription?.plan === 'enterprise';

  if (!isEnterprise) {
    return (
      <Card className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Crown className="size-8 text-purple-600" />
            <h3 className="text-2xl text-purple-900">{t.title}</h3>
          </div>
          <Badge className="bg-purple-600 text-white">
            {t.enterpriseOnly}
          </Badge>
          <p className="text-purple-800 max-w-md mx-auto">
            {t.upgradeDesc}
          </p>
          
          <div className="bg-white/50 rounded-lg p-6 mt-6">
            <h4 className="font-semibold text-purple-900 mb-4">{t.benefits.title}</h4>
            <ul className="text-left space-y-2 max-w-md mx-auto">
              {t.benefits.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-purple-800">
                  <Code className="size-5 text-purple-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            {language === 'en' ? 'Loading...' : '載入中...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Key className="size-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{t.title}</CardTitle>
                <CardDescription className="mt-1">
                  {language === 'en' 
                    ? 'Manage your API keys for programmatic access'
                    : '管理您的 API 金鑰以進行程式化訪問'}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-purple-600">{t.enterpriseOnly}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Security Warning */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-orange-600 shrink-0 mt-0.5" />
            <p className="text-sm text-orange-800">{t.securityWarning}</p>
          </div>
        </CardContent>
      </Card>

      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 font-semibold">{t.newKeyWarning}</p>
            </div>
            <div className="flex items-center gap-2 bg-white p-3 rounded border border-green-200">
              <code className="flex-1 text-sm font-mono break-all">{newlyCreatedKey}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyKey(newlyCreatedKey)}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setNewlyCreatedKey(null)}
              className="w-full"
            >
              {language === 'en' ? 'I have saved the key' : '我已保存金鑰'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="size-4 mr-2" />
              {t.createKey}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.createKey}</DialogTitle>
              <DialogDescription>
                {language === 'en'
                  ? 'Create a new API key to access the Case Where API programmatically.'
                  : '創建新的 API 金鑰以程式方式訪問 Case Where API。'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">{t.keyName}</Label>
                <Input
                  id="keyName"
                  placeholder={t.keyNamePlaceholder}
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setCreateDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  {t.cancel}
                </Button>
                <Button
                  onClick={handleCreateKey}
                  disabled={creating || !keyName.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {creating ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {t.creating}
                    </>
                  ) : (
                    <>
                      <Plus className="size-4 mr-2" />
                      {t.create}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={() => setView('api-documentation')}>
          <BookOpen className="size-4 mr-2" />
          {t.viewDocs}
        </Button>
      </div>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'en' ? 'Your API Keys' : '您的 API 金鑰'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t.noKeys}
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{key.name}</h4>
                        <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                          {key.status === 'active' ? t.active : t.revoked}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                          {visibleKeys.has(key.id) ? key.key : maskKey(key.key)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyKey(key.key)}
                        >
                          <Copy className="size-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {t.createdAt}: {new Date(key.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW')}
                        </span>
                        <span>
                          {t.lastUsed}: {key.last_used_at 
                            ? new Date(key.last_used_at).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW')
                            : t.never}
                        </span>
                        <span>
                          {t.requests}: {key.requests_count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {key.status === 'active' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeKey(key.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="size-4 mr-1" />
                        {t.revoke}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}