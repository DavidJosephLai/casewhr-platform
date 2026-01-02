import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { 
  Webhook, 
  Plus, 
  Trash2,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Crown,
  Zap,
  Globe,
  Lock,
  Activity
} from 'lucide-react';

interface WebhookConfig {
  id: string;
  user_id: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'inactive';
  created_at: string;
  last_triggered_at?: string;
  success_count: number;
  failure_count: number;
}

interface WebhookManagementProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function WebhookManagement({ language = 'en' }: WebhookManagementProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[]
  });

  const translations = {
    en: {
      title: 'Webhook Management',
      enterpriseOnly: 'Enterprise Only',
      upgrade: 'Upgrade to Enterprise',
      upgradeDesc: 'Automate workflows with real-time webhooks! Available exclusively for Enterprise plan.',
      createWebhook: 'Create Webhook',
      webhookUrl: 'Webhook URL',
      webhookUrlPlaceholder: 'https://your-domain.com/webhook',
      events: 'Events to Subscribe',
      selectEvents: 'Select events',
      secret: 'Webhook Secret',
      secretGenerated: 'Auto-generated on creation',
      create: 'Create Webhook',
      creating: 'Creating...',
      cancel: 'Cancel',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      url: 'URL',
      subscribedEvents: 'Subscribed Events',
      statistics: 'Statistics',
      success: 'Success',
      failures: 'Failures',
      lastTriggered: 'Last Triggered',
      never: 'Never',
      actions: 'Actions',
      test: 'Test',
      testing: 'Testing...',
      delete: 'Delete',
      noWebhooks: 'No webhooks configured. Create one to start receiving real-time events!',
      webhookCreated: 'Webhook created successfully',
      webhookDeleted: 'Webhook deleted successfully',
      testSent: 'Test webhook sent',
      availableEvents: {
        'project.created': 'Project Created',
        'project.updated': 'Project Updated',
        'proposal.created': 'Proposal Created',
        'proposal.accepted': 'Proposal Accepted',
        'proposal.rejected': 'Proposal Rejected',
        'payment.completed': 'Payment Completed',
        'team.member_added': 'Team Member Added',
        'support.ticket_created': 'Support Ticket Created'
      },
      benefits: {
        title: 'Enterprise Webhook Benefits:',
        items: [
          'Real-time event notifications',
          'Automate workflows and integrations',
          'Secure signature verification',
          'Automatic retry on failure',
          'Comprehensive event types',
          'Detailed delivery logs'
        ]
      },
      security: {
        title: 'Security',
        description: 'Each webhook includes a secret key for signature verification. Verify the signature in your endpoint to ensure requests are from Case Where.'
      },
      howItWorks: {
        title: 'How It Works',
        steps: [
          '1. Create a webhook with your endpoint URL',
          '2. Select events you want to receive',
          '3. We\'ll send POST requests when events occur',
          '4. Verify the signature using your secret key'
        ]
      }
    },
    zh: {
      title: 'Webhook 管理',
      enterpriseOnly: '企業版專屬',
      upgrade: '升級至企業版',
      upgradeDesc: '使用即時 Webhook 自動化工作流程！僅限企業版方案。',
      createWebhook: '創建 Webhook',
      webhookUrl: 'Webhook URL',
      webhookUrlPlaceholder: 'https://your-domain.com/webhook',
      events: '訂閱事件',
      selectEvents: '選擇事件',
      secret: 'Webhook 密鑰',
      secretGenerated: '創建時自動生成',
      create: '創建 Webhook',
      creating: '創建中...',
      cancel: '取消',
      status: '狀態',
      active: '啟用',
      inactive: '停用',
      url: 'URL',
      subscribedEvents: '已訂閱事件',
      statistics: '統計',
      success: '成功',
      failures: '失敗',
      lastTriggered: '最後觸發',
      never: '從未',
      actions: '操作',
      test: '測試',
      testing: '測試中...',
      delete: '刪除',
      noWebhooks: '尚未配置 Webhook。創建一個開始接收即時事件！',
      webhookCreated: 'Webhook 創建成功',
      webhookDeleted: 'Webhook 刪除成功',
      testSent: '測試 Webhook 已發送',
      availableEvents: {
        'project.created': '項目已創建',
        'project.updated': '項目已更新',
        'proposal.created': '提案已創建',
        'proposal.accepted': '提案已接受',
        'proposal.rejected': '提案已拒絕',
        'payment.completed': '付款已完成',
        'team.member_added': '團隊成員已添加',
        'support.ticket_created': '支援工單已創建'
      },
      benefits: {
        title: '企業版 Webhook 優勢：',
        items: [
          '即時事件通知',
          '自動化工作流程和整合',
          '安全簽名驗證',
          '失敗時自動重試',
          '完整的事件類型',
          '詳細的傳遞日誌'
        ]
      },
      security: {
        title: '安全性',
        description: '每個 Webhook 都包含一個用於簽名驗證的密鑰。在您的端點中驗證簽名以確保請求來自 Case Where。'
      },
      howItWorks: {
        title: '運作方式',
        steps: [
          '1. 使用您的端點 URL 創建 Webhook',
          '2. 選擇您想接收的事件',
          '3. 事件發生時我們將發送 POST 請求',
          '4. 使用您的密鑰驗證簽名'
        ]
      }
    },
    'zh-TW': {
      title: 'Webhook 管理',
      enterpriseOnly: '企業版專屬',
      upgrade: '升級至企業版',
      upgradeDesc: '使用即時 Webhook 自動化工作流程！僅限企業版方案。',
      createWebhook: '創建 Webhook',
      webhookUrl: 'Webhook URL',
      webhookUrlPlaceholder: 'https://your-domain.com/webhook',
      events: '訂閱事件',
      selectEvents: '選擇事件',
      secret: 'Webhook 密鑰',
      secretGenerated: '創建時自動生成',
      create: '創建 Webhook',
      creating: '創建中...',
      cancel: '取消',
      status: '狀態',
      active: '啟用',
      inactive: '停用',
      url: 'URL',
      subscribedEvents: '已訂閱事件',
      statistics: '統計',
      success: '成功',
      failures: '失敗',
      lastTriggered: '最後觸發',
      never: '從未',
      actions: '操作',
      test: '測試',
      testing: '測試中...',
      delete: '刪除',
      noWebhooks: '尚未配置 Webhook。創建一個開始接收即時事件！',
      webhookCreated: 'Webhook 創建成功',
      webhookDeleted: 'Webhook 刪除成功',
      testSent: '測試 Webhook 已發送',
      availableEvents: {
        'project.created': '項目已創建',
        'project.updated': '項目已更新',
        'proposal.created': '提案已創建',
        'proposal.accepted': '提案已接受',
        'proposal.rejected': '提案已拒絕',
        'payment.completed': '付款已完成',
        'team.member_added': '團隊成員已添加',
        'support.ticket_created': '支援工單已建'
      },
      benefits: {
        title: '企業版 Webhook 優勢：',
        items: [
          '即時事件通知',
          '自動化工作流程和整合',
          '安全簽名驗證',
          '失敗時自動重試',
          '完整的事件類型',
          '詳細的傳遞日誌'
        ]
      },
      security: {
        title: '安全性',
        description: '每個 Webhook 都包含一個用於簽名驗證的密鑰。在您的端點中驗證簽名以確保請求來自 Case Where。'
      },
      howItWorks: {
        title: '運作方式',
        steps: [
          '1. 使用您的端點 URL 創建 Webhook',
          '2. 選擇您想接收的事件',
          '3. 事件發生時我們將發送 POST 請求',
          '4. 使用您的密鑰驗證簽名'
        ]
      }
    },
    'zh-CN': {
      title: 'Webhook 管理',
      enterpriseOnly: '企业版专属',
      upgrade: '升级至企业版',
      upgradeDesc: '使用实时 Webhook 自动化工作流程！仅限企业版方案。',
      createWebhook: '创建 Webhook',
      webhookUrl: 'Webhook URL',
      webhookUrlPlaceholder: 'https://your-domain.com/webhook',
      events: '订阅事件',
      selectEvents: '选择事件',
      secret: 'Webhook 密钥',
      secretGenerated: '创建时自动生成',
      create: '创建 Webhook',
      creating: '创建中...',
      cancel: '取消',
      status: '状态',
      active: '启用',
      inactive: '停用',
      url: 'URL',
      subscribedEvents: '已订阅事件',
      statistics: '统计',
      success: '成功',
      failures: '失败',
      lastTriggered: '最后触发',
      never: '从未',
      actions: '操作',
      test: '测试',
      testing: '测试中...',
      delete: '删除',
      noWebhooks: '尚未配置 Webhook。创建一个开始接收实时事件！',
      webhookCreated: 'Webhook 创建成功',
      webhookDeleted: 'Webhook 删除成功',
      testSent: '测试 Webhook 已发送',
      availableEvents: {
        'project.created': '项目已创建',
        'project.updated': '项目已更新',
        'proposal.created': '提案已创建',
        'proposal.accepted': '提案已接受',
        'proposal.rejected': '提案已拒绝',
        'payment.completed': '付款已完成',
        'team.member_added': '团队成员已添加',
        'support.ticket_created': '支持工单已创建'
      },
      benefits: {
        title: '企业版 Webhook 优势：',
        items: [
          '实时事件通知',
          '自动化工作流程和整合',
          '安全签名验证',
          '失败时自动重试',
          '完整的事件类型',
          '详细的传递日志'
        ]
      },
      security: {
        title: '安全性',
        description: '每个 Webhook 都包含一个用于签名验证的密钥。在您的端点中验证签名以确保请求来自 Case Where。'
      },
      howItWorks: {
        title: '运作方式',
        steps: [
          '1. 使用您的端点 URL 创建 Webhook',
          '2. 选择您想接收的事件',
          '3. 事件发生时我们将发送 POST 请求',
          '4. 使用您的密钥验证签名'
        ]
      }
    }
  };

  const t = translations[language];

  const eventOptions = Object.keys(t.availableEvents);

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

      // Fetch webhooks if enterprise
      const webhooksResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/webhooks`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (webhooksResponse.ok) {
        const webhooksData = await webhooksResponse.json();
        setWebhooks(webhooksData.webhooks || []);
      }
    } catch (error) {
      console.error('Error fetching webhook data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!formData.url.trim() || formData.events.length === 0) {
      toast.error(language === 'en' ? 'Please fill in all fields' : '請填寫所有欄位');
      return;
    }

    // Validate URL
    try {
      new URL(formData.url);
    } catch {
      toast.error(language === 'en' ? 'Invalid URL format' : 'URL 格式無效');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/webhooks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create webhook');
      }

      toast.success(t.webhookCreated);
      setFormData({ url: '', events: [] });
      setCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error(language === 'en' ? 'Failed to create webhook' : '創建 Webhook 失敗');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm(language === 'en' ? 'Are you sure?' : '確定要刪除嗎？')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/webhooks/${webhookId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete webhook');
      }

      toast.success(t.webhookDeleted);
      fetchData();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error(language === 'en' ? 'Failed to delete webhook' : '刪除 Webhook 失敗');
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    setTesting(webhookId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/webhooks/${webhookId}/test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to test webhook');
      }

      toast.success(t.testSent);
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error(language === 'en' ? 'Failed to test webhook' : '測試 Webhook 失敗');
    } finally {
      setTesting(null);
    }
  };

  const toggleEventSelection = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
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
                  <Zap className="size-5 text-purple-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* How It Works */}
          <div className="bg-white/50 rounded-lg p-6 mt-4">
            <h4 className="font-semibold text-purple-900 mb-4">{t.howItWorks.title}</h4>
            <ol className="text-left space-y-2 max-w-md mx-auto">
              {t.howItWorks.steps.map((step, index) => (
                <li key={index} className="text-purple-800">
                  {step}
                </li>
              ))}
            </ol>
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
                <Webhook className="size-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{t.title}</CardTitle>
                <CardDescription className="mt-1">
                  {language === 'en' 
                    ? 'Automate workflows with real-time event notifications'
                    : '使用即時事件通知自動化工作流程'}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-purple-600">{t.enterpriseOnly}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lock className="size-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-900 mb-1">{t.security.title}</h4>
                <p className="text-sm text-purple-800">{t.security.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Activity className="size-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-indigo-900 mb-1">
                  {language === 'en' ? 'Event Types' : '事件類型'}
                </h4>
                <p className="text-sm text-indigo-800">
                  {language === 'en' 
                    ? `${eventOptions.length} event types available for subscription`
                    : `${eventOptions.length} 種事件類型可供訂閱`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Webhook Button */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="size-4 mr-2" />
            {t.createWebhook}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.createWebhook}</DialogTitle>
            <DialogDescription>
              {language === 'en'
                ? 'Configure a webhook to receive real-time event notifications.'
                : '配置 Webhook 以接收即時事件通知。'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">{t.webhookUrl}</Label>
              <Input
                id="url"
                type="url"
                placeholder={t.webhookUrlPlaceholder}
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.events}</Label>
              <div className="border rounded p-3 max-h-60 overflow-y-auto space-y-2">
                {eventOptions.map(event => (
                  <label
                    key={event}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event)}
                      onChange={() => toggleEventSelection(event)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {t.availableEvents[event as keyof typeof t.availableEvents]}
                    </span>
                    <code className="text-xs text-gray-500 ml-auto">{event}</code>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {formData.events.length} {language === 'en' ? 'events selected' : '個事件已選擇'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t.secret}</Label>
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
                {t.secretGenerated}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setCreateDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                {t.cancel}
              </Button>
              <Button
                onClick={handleCreateWebhook}
                disabled={creating}
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

      {/* Webhooks List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'en' ? 'Your Webhooks' : '您的 Webhooks'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Webhook className="size-12 mx-auto mb-4 text-gray-400" />
              <p>{t.noWebhooks}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Globe className="size-4 text-gray-600" />
                            <span className="font-mono text-sm">{webhook.url}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={webhook.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                            }>
                              {webhook.status === 'active' ? (
                                <>
                                  <CheckCircle2 className="size-3 mr-1" />
                                  {t.active}
                                </>
                              ) : (
                                <>
                                  <XCircle className="size-3 mr-1" />
                                  {t.inactive}
                                </>
                              )}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {webhook.events.length} {language === 'en' ? 'events' : '事件'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Events */}
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">{t.subscribedEvents}</h5>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map(event => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {t.availableEvents[event as keyof typeof t.availableEvents] || event}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Statistics */}
                      <div className="flex items-center gap-6 text-sm border-t pt-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-green-600" />
                          <span className="text-gray-600">{t.success}:</span>
                          <span className="font-semibold">{webhook.success_count}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="size-4 text-red-600" />
                          <span className="text-gray-600">{t.failures}:</span>
                          <span className="font-semibold">{webhook.failure_count}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-xs text-gray-500">{t.lastTriggered}:</span>
                          <span className="text-xs">
                            {webhook.last_triggered_at 
                              ? new Date(webhook.last_triggered_at).toLocaleString()
                              : t.never}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 border-t pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestWebhook(webhook.id)}
                          disabled={testing === webhook.id}
                        >
                          {testing === webhook.id ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span>
                              {t.testing}
                            </>
                          ) : (
                            <>
                              <Play className="size-3 mr-2" />
                              {t.test}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                        >
                          <Trash2 className="size-3 mr-2" />
                          {t.delete}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}