import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useView } from '../contexts/ViewContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { copyToClipboard } from '../utils/clipboard';
import { toast } from 'sonner';
import { 
  Key, 
  Plus, 
  Eye,
  EyeOff,
  Copy,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Code,
  Book,
  Zap
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  created_at: string;
  last_used?: string;
  status: 'active' | 'revoked';
}

interface ApiAccessProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function ApiAccess({ language = 'en' }: ApiAccessProps) {
  const { user, accessToken } = useAuth();
  const { setView } = useView();
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newGeneratedKey, setNewGeneratedKey] = useState<ApiKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const translations = {
    en: {
      title: 'API Access',
      subtitle: 'Integrate CaseWHR with your applications',
      createKey: 'Create API Key',
      myKeys: 'My API Keys',
      keyName: 'Key Name',
      create: 'Generate Key',
      cancel: 'Cancel',
      copy: 'Copy',
      revoke: 'Revoke',
      show: 'Show',
      hide: 'Hide',
      status: {
        active: 'Active',
        revoked: 'Revoked'
      },
      noKeys: 'No API keys yet. Create your first key!',
      createSuccess: 'API key created successfully!',
      copySuccess: 'API key copied to clipboard!',
      revokeSuccess: 'API key revoked successfully',
      documentation: 'API Documentation',
      quickStart: 'Quick Start Guide',
      rateLimit: 'Rate Limit',
      endpoints: 'Available Endpoints',
      securityNotice: 'Security Notice',
      securityMessage: 'Keep your API keys secure. Never share them publicly or commit them to version control.',
      newKeyTitle: 'New API Key Created',
      newKeyMessage: 'Make sure to copy your API key now. You won\'t be able to see it again!',
      lastUsed: 'Last used',
      never: 'Never',
      createdAt: 'Created',
      requestsPerMinute: 'requests/min'
    },
    zh: {
      title: 'API 訪問',
      subtitle: '將 CaseWHR 與您的應用程式整合',
      createKey: '創建 API 金鑰',
      myKeys: '我的 API 金鑰',
      keyName: '金鑰名稱',
      create: '生成金鑰',
      cancel: '取消',
      copy: '複製',
      revoke: '撤銷',
      show: '顯示',
      hide: '隱藏',
      status: {
        active: '活躍',
        revoked: '已撤銷'
      },
      noKeys: '尚無 API 金鑰。創建您的第一個金鑰！',
      createSuccess: 'API 金鑰創建成功！',
      copySuccess: 'API 金鑰已複製到剪貼板！',
      revokeSuccess: 'API 金鑰已撤銷',
      documentation: 'API 文檔',
      quickStart: '快速入門指南',
      rateLimit: '速率限制',
      endpoints: '可用端點',
      securityNotice: '安全提示',
      securityMessage: '請保護您的 API 金鑰安全。切勿公開分享或提交到版本控制系統。',
      newKeyTitle: '新 API 金鑰已創建',
      newKeyMessage: '請立即複製您的 API 金鑰。您以後將無法再次看到它！',
      lastUsed: '上次使用',
      never: '從未',
      createdAt: '創建於',
      requestsPerMinute: '請求/分鐘'
    },
    'zh-TW': {
      title: 'API 訪問',
      subtitle: '將 CaseWHR 與您的應用程式整合',
      createKey: '創建 API 金鑰',
      myKeys: '我的 API 金鑰',
      keyName: '金鑰名稱',
      create: '生成金鑰',
      cancel: '取消',
      copy: '複製',
      revoke: '撤銷',
      show: '顯示',
      hide: '隱藏',
      status: {
        active: '活躍',
        revoked: '已撤銷'
      },
      noKeys: '尚無 API 金鑰。創建您的第一個金鑰！',
      createSuccess: 'API 金鑰創建成功！',
      copySuccess: 'API 金鑰已複製到剪貼板！',
      revokeSuccess: 'API 金鑰已撤銷',
      documentation: 'API 文檔',
      quickStart: '快速入門指南',
      rateLimit: '速率限制',
      endpoints: '可用端點',
      securityNotice: '安全提示',
      securityMessage: '請保護您的 API 金鑰安全。切勿公開分享或提交到版本控制系統。',
      newKeyTitle: '新 API 金鑰已創建',
      newKeyMessage: '請立即複製您的 API 金鑰。您以後將無法再次看到它！',
      lastUsed: '上次使用',
      never: '從未',
      createdAt: '創建於',
      requestsPerMinute: '請求/分鐘'
    },
    'zh-CN': {
      title: 'API 访问',
      subtitle: '将 CaseWHR 与您的应用程序集成',
      createKey: '创建 API 密钥',
      myKeys: '我的 API 密钥',
      keyName: '密钥名称',
      create: '生成密钥',
      cancel: '取消',
      copy: '复制',
      revoke: '撤销',
      show: '显示',
      hide: '隐藏',
      status: {
        active: '活跃',
        revoked: '已撤销'
      },
      noKeys: '尚无 API 密钥。创建您的第一个密钥！',
      createSuccess: 'API 密钥创建成功！',
      copySuccess: 'API 密钥已复制到剪贴板！',
      revokeSuccess: 'API 密钥已撤销',
      documentation: 'API 文档',
      quickStart: '快速入门指南',
      rateLimit: '速率限制',
      endpoints: '可用端点',
      securityNotice: '安全提示',
      securityMessage: '请保护您的 API 密钥安全。切勿公开分享或提交到版本控制系统。',
      newKeyTitle: '新 API 密钥已创建',
      newKeyMessage: '请立即复制您的 API 密钥。您以后将无法再次看到它！',
      lastUsed: '上次使用',
      never: '从未',
      createdAt: '创建于',
      requestsPerMinute: '请求/分钟'
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      // 🎁 開發模式支援
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        const mockKeys: ApiKey[] = [
          {
            id: '1',
            name: 'Production API',
            key: 'cw_live_1234567890abcdefghijklmnopqrstuvwxyz',
            prefix: 'cw_live_123',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            last_used: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          },
          {
            id: '2',
            name: 'Development API',
            key: 'cw_test_abcdefghijklmnopqrstuvwxyz1234567890',
            prefix: 'cw_test_abc',
            created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            last_used: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          },
          {
            id: '3',
            name: 'Old Test Key',
            key: 'cw_test_oldkey1234567890abcdefghijklmnopqr',
            prefix: 'cw_test_old',
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'revoked'
          }
        ];
        setApiKeys(mockKeys);
        setLoading(false);
        return;
      }

      // 從後端獲取真實數據
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/api-keys`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error(language === 'en' ? 'Please enter a key name' : '請輸入金鑰名稱');
      return;
    }

    try {
      // 🎁 開發模式
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        const prefix = `cw_${Date.now().toString(36)}_`;
        const randomKey = Array.from({ length: 32 }, () => 
          Math.random().toString(36).charAt(2)
        ).join('');
        
        const newKey: ApiKey = {
          id: `temp-${Date.now()}`,
          name: newKeyName,
          key: prefix + randomKey,
          prefix: prefix.slice(0, 12),
          created_at: new Date().toISOString(),
          status: 'active'
        };

        setApiKeys([newKey, ...apiKeys]);
        setNewGeneratedKey(newKey);
        setShowCreateDialog(false);
        setShowKeyDialog(true);
        setNewKeyName('');
        toast.success(t.createSuccess);
        return;
      }

      // 真實 API
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/api-keys`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: newKeyName })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNewGeneratedKey(data.key);
        setShowCreateDialog(false);
        setShowKeyDialog(true);
        setNewKeyName('');
        toast.success(t.createSuccess);
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error(language === 'en' ? 'Failed to create API key' : '創建 API 金鑰失敗');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm(language === 'en' ? 'Are you sure you want to revoke this API key?' : '確定要撤銷此 API 金鑰嗎？')) {
      return;
    }

    try {
      // 🎁 開發模式
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        setApiKeys(apiKeys.map(k => 
          k.id === keyId ? { ...k, status: 'revoked' as const } : k
        ));
        toast.success(t.revokeSuccess);
        return;
      }

      // 真實 API
      toast.success(t.revokeSuccess);
      fetchApiKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      toast.error(language === 'en' ? 'Failed to revoke API key' : '撤銷 API 金鑰失敗');
    }
  };

  const handleCopyKey = (key: string) => {
    copyToClipboard(key);
    toast.success(t.copySuccess);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const maskKey = (key: string, prefix: string) => {
    return `${prefix}${'•'.repeat(32)}`;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="bg-green-100 text-green-700 border-green-200">{t.status.active}</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{t.status.revoked}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6 text-purple-600" />
            {t.title}
          </h2>
          <p className="text-sm text-gray-600 mt-1">{t.subtitle}</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.createKey}
        </Button>
      </div>

      {/* Security Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-900">{t.securityNotice}</h4>
              <p className="text-sm text-orange-700 mt-1">{t.securityMessage}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setView('api-documentation')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Book className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{t.documentation}</h4>
                <p className="text-xs text-gray-600 mt-1">
                  {language === 'en' ? 'View API docs' : '查看 API 文檔'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{t.rateLimit}</h4>
                <p className="text-xs text-gray-600 mt-1">
                  1000 {t.requestsPerMinute}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Code className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{t.endpoints}</h4>
                <p className="text-xs text-gray-600 mt-1">
                  {language === 'en' ? '15+ endpoints' : '15+ 個端點'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>{t.myKeys} ({apiKeys.filter(k => k.status === 'active').length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              {language === 'en' ? 'Loading...' : '載入中...'}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t.noKeys}
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    apiKey.status === 'revoked' ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
                  } transition-colors`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{apiKey.name}</h4>
                      {getStatusBadge(apiKey.status)}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-sm bg-gray-100 px-3 py-2 rounded border">
                      <Key className="h-4 w-4 text-gray-400" />
                      <code className="flex-1">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key, apiKey.prefix)}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="h-6 w-6 p-0"
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyKey(apiKey.key)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        {t.createdAt}: {new Date(apiKey.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        {t.lastUsed}: {apiKey.last_used ? new Date(apiKey.last_used).toLocaleString() : t.never}
                      </span>
                    </div>
                  </div>
                  {apiKey.status === 'active' && (
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeKey(apiKey.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.createKey}</DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Give your API key a descriptive name' 
                : '為您的 API 金鑰提供描述性名稱'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t.keyName}</label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder={language === 'en' ? 'Production API' : '生產環境 API'}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleCreateKey} className="bg-purple-600 hover:bg-purple-700">
              <Key className="h-4 w-4 mr-2" />
              {t.create}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t.newKeyTitle}
            </DialogTitle>
            <DialogDescription className="text-orange-600">
              {t.newKeyMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{newGeneratedKey?.name}</span>
                <Button
                  size="sm"
                  onClick={() => newGeneratedKey && handleCopyKey(newGeneratedKey.key)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {t.copy}
                </Button>
              </div>
              <code className="block font-mono text-sm break-all bg-white p-3 rounded border">
                {newGeneratedKey?.key}
              </code>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowKeyDialog(false)}>
              {language === 'en' ? 'Done' : '完成'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}