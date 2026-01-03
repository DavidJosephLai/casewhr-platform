import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { EnterpriseChat } from './EnterpriseChat';
import { TeamManagement } from './TeamManagement';
import { ContractManager } from './ContractManager';
import { ApiAccess } from './ApiAccess';
import { Branding } from './Branding';
import { Analytics } from './Analytics';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useView } from '../contexts/ViewContext';
import { 
  Crown, 
  MessageSquare, 
  Users, 
  FileText, 
  Key, 
  Palette, 
  TrendingUp,
  Loader2,
  Shield
} from 'lucide-react';

interface EnterpriseFeaturesPanelProps {
  language: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function EnterpriseFeaturesPanel({ language }: EnterpriseFeaturesPanelProps) {
  const { user, accessToken } = useAuth();
  const { setView } = useView();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showContractsDialog, setShowContractsDialog] = useState(false);
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [showBrandingDialog, setShowBrandingDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);

  useEffect(() => {
    if (user && accessToken) {
      fetchSubscription();
    }
  }, [user, accessToken]);

  // 🎁 監聽特殊用戶的訂閱刷新事件
  useEffect(() => {
    const handleRefreshSubscription = () => {
      console.log('🔄 [EnterpriseFeaturesPanel] Refreshing subscription...');
      if (user && accessToken) {
        fetchSubscription();
      }
    };

    window.addEventListener('refreshSubscription', handleRefreshSubscription);
    return () => {
      window.removeEventListener('refreshSubscription', handleRefreshSubscription);
    };
  }, [user, accessToken]);

  const fetchSubscription = async () => {
    try {
      console.log('🔄 [EnterpriseFeaturesPanel] Fetching subscription for user:', user?.id);
      
      // 🎁 優先檢查開發模式的訂閱信息
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      let subData: any = null;
      
      if (devModeActive) {
        const devSubscription = localStorage.getItem('dev_mode_subscription');
        if (devSubscription) {
          try {
            const subscription = JSON.parse(devSubscription);
            console.log('🎁 [EnterpriseFeaturesPanel] Using dev mode subscription:', subscription);
            setSubscription(subscription);
            setLoading(false);
            return; // 直接返回，不需要從後端獲取
          } catch (err) {
            console.error('❌ [EnterpriseFeaturesPanel] Failed to parse dev mode subscription:', err);
          }
        }
        
        // 🔥 如果沒有開發模式訂閱，設置默認的 free 訂閱
        console.log('🧪 [EnterpriseFeaturesPanel] Dev mode detected, using default free subscription');
        setSubscription({
          plan: 'free',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: null
        });
        setLoading(false);
        return;
      }
      
      // 如果不是開發模式，則從後端獲取
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        console.log('✅ [EnterpriseFeaturesPanel] Subscription loaded:', data.subscription?.plan);
      } else {
        console.error('❌ [EnterpriseFeaturesPanel] Failed to fetch subscription:', response.status);
      }
    } catch (error) {
      console.error('❌ [EnterpriseFeaturesPanel] Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const isEnterprise = subscription?.plan === 'enterprise';
  
  // 🔍 添加調試日誌
  console.log('🔍 [EnterpriseFeaturesPanel] Current state:', {
    user: user?.email,
    subscription: subscription,
    plan: subscription?.plan,
    isEnterprise: isEnterprise,
    loading: loading
  });

  const t = {
    en: {
      title: 'Enterprise Features',
      subtitle: 'Exclusive features for Enterprise members',
      upgradeRequired: 'Enterprise Only',
      upgrade: 'Upgrade to Enterprise',
      features: {
        chat: {
          title: 'Enterprise Chat',
          description: 'Chat with your account manager and team members'
        },
        team: {
          title: 'Team Management',
          description: 'Add team members and manage permissions'
        },
        contracts: {
          title: 'Contract Manager',
          description: 'Create and manage custom contracts'
        },
        api: {
          title: 'API Access',
          description: 'Integrate with your existing systems'
        },
        branding: {
          title: 'Custom Branding',
          description: 'Personalize your workspace appearance'
        },
        analytics: {
          title: 'Advanced Analytics',
          description: 'Detailed insights and reports'
        }
      }
    },
    zh: {
      title: '企業版功能',
      subtitle: '企業版會員專屬功能',
      upgradeRequired: '企業版專屬',
      upgrade: '升級至企業版',
      features: {
        chat: {
          title: '企業即時聊天',
          description: '與客戶經理和團隊成員即時溝通'
        },
        team: {
          title: '團隊管理',
          description: '添加團隊成員並管理權限'
        },
        contracts: {
          title: '合約管理',
          description: '創建和管理客製化合約'
        },
        api: {
          title: 'API 訪問',
          description: '與現有系統整合'
        },
        branding: {
          title: '自訂品牌',
          description: '個人化工作空間外觀'
        },
        analytics: {
          title: '高級分析',
          description: '詳細的洞察和報告'
        }
      }
    },
    'zh-TW': {
      title: '企業版功能',
      subtitle: '企業版會員專屬功能',
      upgradeRequired: '企業版專屬',
      upgrade: '升級至企業版',
      features: {
        chat: {
          title: '企業即時聊天',
          description: '與客戶經理和團隊成員即時溝通'
        },
        team: {
          title: '團隊管理',
          description: '添加團隊成員並管理權限'
        },
        contracts: {
          title: '合約管理',
          description: '創建和管理客製化合約'
        },
        api: {
          title: 'API 訪問',
          description: '與現有系統整合'
        },
        branding: {
          title: '自訂品牌',
          description: '個人化工作空間外觀'
        },
        analytics: {
          title: '高級分析',
          description: '詳細的洞察和報告'
        }
      }
    },
    'zh-CN': {
      title: '企业版功能',
      subtitle: '企业版会员专属功能',
      upgradeRequired: '企业版专属',
      upgrade: '升级至企业版',
      features: {
        chat: {
          title: '企业即时聊天',
          description: '与客户经理和团队成员即时沟通'
        },
        team: {
          title: '团队管理',
          description: '添加团队成员并管理权限'
        },
        contracts: {
          title: '合约管理',
          description: '创建和管理定制合约'
        },
        api: {
          title: 'API 访问',
          description: '与现有系统集成'
        },
        branding: {
          title: '自定义品牌',
          description: '个性化工作空间外观'
        },
        analytics: {
          title: '高级分析',
          description: '详细的洞察和报告'
        }
      }
    }
  };

  const content = t[language] || t.en;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const features = [
    { icon: MessageSquare, key: 'chat', action: () => setShowChatDialog(true) },
    { icon: Users, key: 'team', action: () => setShowTeamDialog(true) },
    { icon: FileText, key: 'contracts', action: () => setShowContractsDialog(true) },
    { icon: Key, key: 'api', action: () => setShowApiDialog(true) },
    { icon: Palette, key: 'branding', action: () => setShowBrandingDialog(true) },
    { icon: TrendingUp, key: 'analytics', action: () => setShowAnalyticsDialog(true) },
  ];

  // 🔍 調試日誌：檢查 content 和 features 結構
  console.log('🔍 [EnterpriseFeaturesPanel] Content check:', {
    language,
    hasContent: !!content,
    hasFeatures: !!content?.features,
    featuresKeys: content?.features ? Object.keys(content.features) : [],
    content: content
  });

  // ✅ 安全檢查：確保 content.features 存在
  if (!content || !content.features) {
    console.error('❌ [EnterpriseFeaturesPanel] content.features is undefined!', { language, content });
    return null;
  }

  return (
    <>
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-purple-600" />
                {content.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {content.subtitle}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEnterprise && (
                <Badge className="bg-purple-600 text-white">
                  {content.upgradeRequired}
                </Badge>
              )}
              {/* 🔧 調試按鈕：手動刷新訂閱狀態 */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  console.log('🔄 [DEBUG] Manual refresh subscription...');
                  fetchSubscription();
                }}
                className="text-xs"
              >
                🔄
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              const featureContent = content.features[feature.key as keyof typeof content.features];
              
              return (
                <Button
                  key={feature.key}
                  variant="outline"
                  className={`h-auto py-4 px-4 flex flex-col items-start gap-2 hover:bg-white hover:shadow-md transition-all ${
                    !isEnterprise ? 'opacity-60' : ''
                  }`}
                  onClick={isEnterprise ? feature.action : () => {
                    window.dispatchEvent(new CustomEvent('showPricing', { detail: {} }));
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className={`h-5 w-5 ${isEnterprise ? 'text-purple-600' : 'text-gray-400'}`} />
                    <span className="font-medium text-sm">{featureContent.title}</span>
                  </div>
                  <p className="text-xs text-gray-600 text-left">
                    {featureContent.description}
                  </p>
                  {!isEnterprise && (
                    <Badge variant="outline" className="text-xs mt-auto">
                      {content.upgradeRequired}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {!isEnterprise && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {language === 'en' ? 'Unlock all enterprise features' : '解鎖所有企業功能'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {language === 'en' 
                      ? 'Get premium support, team collaboration, and advanced tools' 
                      : '獲得優質支援、團隊協作和高級工具'}
                  </p>
                </div>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('showPricing', { detail: {} }));
                  }}
                >
                  {content.upgrade}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enterprise Chat Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">
            {language === 'en' ? 'Enterprise Chat' : '企業即時聊天'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {language === 'en' 
              ? 'Real-time communication with your account manager and team members' 
              : '與您的客戶經理和團隊成員即時溝通'}
          </DialogDescription>
          <EnterpriseChat language={language} />
        </DialogContent>
      </Dialog>

      {/* Team Management Dialog */}
      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            {language === 'en' ? 'Team Management' : '團隊管理'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en' 
              ? 'Add team members and manage permissions' 
              : '添加團隊成員並管理權限'}
          </DialogDescription>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
            <TeamManagement language={language} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Manager Dialog */}
      <Dialog open={showContractsDialog} onOpenChange={setShowContractsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            {language === 'en' ? 'Contract Manager' : '合約管理'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en' 
              ? 'Create and manage custom contracts' 
              : '創建和管理客製化合約'}
          </DialogDescription>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
            <ContractManager language={language} />
          </div>
        </DialogContent>
      </Dialog>

      {/* API Access Dialog */}
      <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            {language === 'en' ? 'API Access' : 'API 訪問'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en' 
              ? 'Integrate with your existing systems' 
              : '與現有系統整合'}
          </DialogDescription>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
            <ApiAccess language={language} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Branding Dialog */}
      <Dialog open={showBrandingDialog} onOpenChange={setShowBrandingDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            {language === 'en' ? 'Custom Branding' : '自訂品牌'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en' 
              ? 'Personalize your workspace appearance' 
              : '個人化工作空間外觀'}
          </DialogDescription>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
            <Branding language={language} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Analytics Dialog */}
      <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogTitle>
            {language === 'en' ? 'Advanced Analytics' : '高級分析'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en' 
              ? 'Detailed insights and reports' 
              : '詳細的洞察和報告'}
          </DialogDescription>
          <Analytics language={language} />
        </DialogContent>
      </Dialog>
    </>
  );
}