import { InvitationNotifications } from './InvitationNotifications';
import { SentInvitations } from './SentInvitations';
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  Briefcase, 
  PlusCircle, 
  UserCircle, 
  WalletIcon, 
  MessageSquare,
  Crown,
  AlertCircle,
  Loader2,
  Shield,
  FileText,
  Info,
  Heart,
  Bell
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useView } from '../contexts/ViewContext';
import { translations, getTranslation } from '../lib/translations';
import { fetchWithRetry, parseJsonResponse } from '../lib/apiErrorHandler';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Dashboard components
import { BrandPreview } from './BrandPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MembershipCard } from './MembershipCard';
import { TeamInvitations } from './TeamInvitations';
import { TeamManagement } from './TeamManagement';
import { TransactionStats } from './TransactionStats';
import { DiagnosticPanel } from './DiagnosticPanel';
import { ProjectList } from './ProjectList';
import { ProjectDialog } from './ProjectDialog'; // 🎯 添加 ProjectDialog 導入
import { Wallet } from './Wallet';
import { WithdrawalRequest } from './WithdrawalRequest';
import { WithdrawalHistory } from './WithdrawalHistory';
import { InvoiceList } from './InvoiceList';
import { InvoiceManager } from './InvoiceManager';
import { TransactionHistory } from './TransactionHistory';
import { BankAccountManager } from './BankAccountManager';
import { KYCVerification } from './KYCVerification';
import { MessageList } from './MessageList';
import { PasswordManagement } from './PasswordManagement';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationPreferences } from './NotificationPreferences';
import { PaymentMethodsCard } from './PaymentMethodsCard';
import { UsageLimitsCard } from './UsageLimitsCard';
import { MyProposals } from './MyProposals';
import { UserProfile } from './UserProfile';
import { BrandingSettings } from './BrandingSettings';
import { PostProjectDialog } from './PostProjectDialog';
import { FavoritesList } from './FavoritesList';
import { InternalTransfer } from './InternalTransfer';
import { TransferHistory } from './TransferHistory';
import { EnterpriseFeaturesPanel } from './EnterpriseFeaturesPanel';
import { SLAMonitoring } from './SLAMonitoring';
import { EnterpriseChat } from './EnterpriseChat';
import { ExchangeRateIndicator } from './ExchangeRateIndicator';
import { QuickSubscriptionCheck } from './QuickSubscriptionCheck';
import { RecurringSubscriptionManager } from './RecurringSubscriptionManager';
import { UnifiedInvoiceManager } from './UnifiedInvoiceManager';
import { isAdmin } from '../lib/adminConfig';

interface DashboardProps {
  initialTab?: string;
  onTabChange?: () => void;
}

export const Dashboard = memo(function Dashboard({ initialTab, onTabChange }: DashboardProps) {
  const { user, accessToken, profile } = useAuth();
  const { language } = useLanguage();
  const { setView, setManualOverride } = useView();
  const t = getTranslation(language).dashboard; // ✅ 使用 getTranslation 而非直接訪問
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isEnterpriseUser, setIsEnterpriseUser] = useState(false);
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    pendingProposals: 0,
    totalMilestones: 0,
    totalProposals: 0,  // ✅ Add missing property
    acceptedProposals: 0,  // ✅ Add missing property
  });
  const [loading, setLoading] = useState(true);
  
  // 🎯 專案詳情對話框狀態
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  // ✅ Memoize role checks
  const isClient = useMemo(() => {
    const result = profile?.is_client || 
      (Array.isArray(profile?.account_type) 
        ? profile.account_type.includes('client') 
        : profile?.account_type === 'client');
    console.log('🔍 [Dashboard] isClient calculation:', {
      profile_is_client: profile?.is_client,
      account_type: profile?.account_type,
      result,
      email: user?.email
    });
    return result;
  }, [profile?.is_client, profile?.account_type, user?.email]);
  
  const isFreelancer = useMemo(() => {
    const result = profile?.is_freelancer || 
      (Array.isArray(profile?.account_type) 
        ? profile.account_type.includes('freelancer') 
        : profile?.account_type === 'freelancer');
    console.log('🔍 [Dashboard] isFreelancer calculation:', {
      profile_is_freelancer: profile?.is_freelancer,
      account_type: profile?.account_type,
      result,
      email: user?.email
    });
    return result;
  }, [profile?.is_freelancer, profile?.account_type, user?.email]);
  
  const isBoth = useMemo(() => isClient && isFreelancer, [isClient, isFreelancer]);

  useEffect(() => {
    const handleOpenPostProject = (e: CustomEvent) => {
      setShowPostDialog(true);
    };

    const handleShowDashboard = (e: CustomEvent) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };

    // 🎯 監聽打開專案詳情事件
    const handleOpenProjectDetail = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const targetProjectId = customEvent.detail?.projectId;
      
      console.log('🎯 [Dashboard] Received openProjectDetail event for projectId:', targetProjectId);
      
      if (!targetProjectId) {
        console.warn('⚠️ [Dashboard] No projectId in event detail');
        return;
      }

      // 從 API 獲取專案詳情
      try {
        console.log('🔍 [Dashboard] Fetching project from API...');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/projects/${targetProjectId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken || publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const projectData = await response.json();
          console.log('✅ [Dashboard] Fetched project from API:', projectData);
          // 🔥 FIX: API 返回 { project: {...} }，需要提取 project 屬性
          const project = projectData.project || projectData;
          setSelectedProject(project);
          setProjectDialogOpen(true);
        } else {
          const errorText = await response.text();
          console.error('❌ [Dashboard] Failed to fetch project from API:', response.status, errorText);
          // ❌ 顯示錯誤提示
          import('sonner').then(({ toast }) => {
            toast.error(
              language === 'en' 
                ? `Failed to load project (${response.status})` 
                : `載入專案失敗 (${response.status})`
            );
          });
        }
      } catch (error) {
        console.error('❌ [Dashboard] Error fetching project:', error);
        // ❌ 顯示錯誤提示
        import('sonner').then(({ toast }) => {
          toast.error(
            language === 'en' 
              ? 'Network error while loading project' 
              : '載入專案時發生網路錯誤'
          );
        });
      }
    };

    window.addEventListener('openPostProject', handleOpenPostProject as EventListener);
    window.addEventListener('showDashboard', handleShowDashboard as EventListener);
    window.addEventListener('openProjectDetail', handleOpenProjectDetail as EventListener);

    return () => {
      window.removeEventListener('openPostProject', handleOpenPostProject as EventListener);
      window.removeEventListener('showDashboard', handleShowDashboard as EventListener);
      window.removeEventListener('openProjectDetail', handleOpenProjectDetail as EventListener);
    };
  }, [accessToken]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const fetchStats = useCallback(async () => {
    if (!user || !accessToken) {
      setLoading(false);
      return;
    }

    try {
      console.log('[Dashboard] Fetching stats for user:', user.id);
      
      // 🔧 FIX: Handle dev mode properly - calculate stats from localStorage data
      const isDevMode = localStorage.getItem('dev_mode_active') === 'true';
      
      if (isDevMode) {
        console.log('🧪 [Dashboard] Dev mode detected, calculating stats from localStorage');
        
        try {
          // 從 localStorage 獲取項目數據
          const allProjectsData = localStorage.getItem('dev_mode_projects'); // ✅ 修正 key 名稱
          let totalProjects = 0;
          let activeProjects = 0;
          let completedProjects = 0;
          
          if (allProjectsData) {
            const allProjects = JSON.parse(allProjectsData);
            // 過濾出當前用戶的項目
            const userProjects = allProjects.filter((p: any) => p.user_id === user.id);
            totalProjects = userProjects.length;
            
            // 計算進行中的項目（包含 open, in_progress, pending_review, pending_payment）
            activeProjects = userProjects.filter((p: any) => 
              ['open', 'in_progress', 'pending_review', 'pending_payment'].includes(p.status)
            ).length;
            
            // 計算已完成的項目
            completedProjects = userProjects.filter((p: any) => p.status === 'completed').length;
            
            console.log('🧪 [Dashboard] Dev mode stats calculated:', {
              totalProjects,
              activeProjects,
              completedProjects,
              userProjects: userProjects.map((p: any) => ({ id: p.id, title: p.title, status: p.status }))
            });
          }
          
          // 獲取 dev mode subscription
          const devSubscriptionData = localStorage.getItem('dev_subscription');
          const subscription = devSubscriptionData 
            ? JSON.parse(devSubscriptionData) 
            : { tier: 'free', status: 'active' };
          
          setStats({
            totalProjects,
            activeProjects,
            completedProjects,
            balance: 0,
            unreadMessages: 0,
            totalProposals: 0,  // ✅ Add missing property
            acceptedProposals: 0,  // ✅ Add missing property
            subscription: { tier: subscription.plan || 'free', status: subscription.status || 'active' }
          });
        } catch (error: any) {
          console.error('🧪 [Dashboard] Error calculating dev mode stats:', error);
          setStats({
            totalProjects: 0,
            activeProjects: 0,
            completedProjects: 0,
            balance: 0,
            unreadMessages: 0,
            totalProposals: 0,  // ✅ Add missing property
            acceptedProposals: 0,  // ✅ Add missing property
            subscription: { tier: 'free', status: 'active' }
          });
        }
        
        setLoading(false);
        return;
      }
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
      };
      
      const response = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/dashboard/stats/${user.id}`,
        { headers },
        2, // maxRetries
        20000 // timeout - increased to 20 seconds
      );

      if (response && response.ok) {
        const data = await parseJsonResponse(response);
        console.log('[Dashboard] Stats loaded successfully:', data);
        setStats(data);
        
        // If there was an error but we got partial data, show a warning
        if ((data as any).error) {
          console.warn('[Dashboard] Partial data loaded:', (data as any).error);
        }
      } else if (response) {
        const errorData = await parseJsonResponse(response).catch(() => ({ error: 'Unknown error' }));
        console.error('[Dashboard] Error response:', response.status, errorData);
        
        // If it's a 401 Unauthorized, trigger session expired event
        if (response.status === 401) {
          console.log('[Dashboard] 401 Unauthorized - Session expired, triggering event');
          window.dispatchEvent(new CustomEvent('session-expired'));
          return; // Don't set default stats, user will be logged out
        }
        
        // Set default stats on error
        setStats({
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          balance: 0,
          unreadMessages: 0,
          totalProposals: 0,  // ✅ Add missing property
          acceptedProposals: 0,  // ✅ Add missing property
          subscription: { tier: 'free', status: 'inactive' }
        });
      }
    } catch (error: any) {
      // 🔧 FIX: Silently handle AbortError (component unmount or user navigation)
      if (error.name === 'AbortError') {
        console.log('[Dashboard] Request aborted (component unmounted or navigation)');
        return;
      }
      
      console.error('[Dashboard] Error fetching stats:', error.message);
      
      // Set default stats on error
      setStats({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        balance: 0,
        unreadMessages: 0,
        totalProposals: 0,  // ✅ Add missing property
        acceptedProposals: 0,  // ✅ Add missing property
        subscription: { tier: 'free', status: 'inactive' }
      });
    } finally {
      setLoading(false);
    }
  }, [user, accessToken]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 🌟 檢查企業版訂閱
  useEffect(() => {
    const checkEnterpriseStatus = async () => {
      if (!user?.id || !accessToken) return;
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/status?userId=${user.id}`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        
        if (response.ok) {
          const data = await response.json();
          const isEnterprise = data?.plan?.toLowerCase?.() === 'enterprise' ||
                              data?.hasEnterprise === true ||
                              data?.isEnterprise === true;
          setIsEnterpriseUser(isEnterprise);
        }
      } catch (error) {
        console.error('Failed to check enterprise status:', error);
      }
    };
    
    checkEnterpriseStatus();
  }, [user, accessToken]);

  const handleProjectSubmitted = () => {
    setShowPostDialog(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (onTabChange) {
      onTabChange();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">
            {language === 'en' ? 'Loading dashboard...' : language === 'zh-CN' ? '载入仪表板中...' : '載入儀表板中...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-gray-900 mb-2">
              {language === 'en' ? 'Dashboard' : language === 'zh-CN' ? '仪表板' : '儀表板'}
            </h1>
            {profile && (
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {language === 'en' ? 'Client' : '客戶'}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {language === 'en' ? 'Freelancer' : '自由工作者'}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => {
                setView('pricing');
                setManualOverride(true);
              }}
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-medium"
            >
              <Crown className="h-4 w-4 mr-2" />
              {language === 'en' ? 'View Plans' : '查方案'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔧 [Dashboard] Edit Profile button clicked');
                console.log('🔧 [Dashboard] Current showProfileDialog:', showProfileDialog);
                console.log('🔧 [Dashboard] Setting showProfileDialog to true');
                setShowProfileDialog(true);
                setTimeout(() => {
                  console.log('🔧 [Dashboard] After timeout, showProfileDialog should be:', true);
                }, 100);
              }}
            >
              <UserCircle className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Edit Profile' : '編輯個人資料'}
            </Button>
            
            {/* 🔥 發布項目按鈕 - 移除 isClient 限制，所有用戶都可發布項目 */}
            <Button 
              onClick={() => setShowPostDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {getTranslation(language).projects.postProject}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {!isClient && !isFreelancer && (
          <Card className="col-span-full bg-yellow-50 border-2 border-yellow-300">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-800 mb-2">
                    {language === 'en' 
                      ? 'Please complete your profile to get started!' 
                      : '請完成的個人資料以開始使用！'}
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      console.log('🔧 [Dashboard] Complete Profile button clicked');
                      console.log('🔧 [Dashboard] Setting showProfileDialog to true');
                      setShowProfileDialog(true);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    {language === 'en' ? 'Complete Profile' : '完成個資料'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isClient && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">
                  {language === 'en' ? 'Active Projects' : '進行中的項目'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {language === 'en' 
                    ? 'Open, in progress, pending review, or pending payment' 
                    : language === 'zh-CN' 
                    ? '等待接案、执行、待审核或待拨款' 
                    : '等待接案、執行、待審核或待撥款'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.activeProjects}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">
                  {language === 'en' ? 'Completed Projects' : '完成的項目'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.completedProjects}</div>
              </CardContent>
            </Card>
          </>
        )}

        {isFreelancer && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">
                  {language === 'en' ? 'Total Proposals' : '總提案數'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalProposals}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">
                  {language === 'en' ? 'Accepted Proposals' : '已接受的提案'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.acceptedProposals}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className={`grid w-full ${isFreelancer ? 'grid-cols-2 lg:grid-cols-8' : 'grid-cols-2 lg:grid-cols-7'} bg-blue-50 p-1`}>
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:hover:bg-blue-100"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            {t?.tabs?.overview || 'Overview & Team'}
          </TabsTrigger>
          <TabsTrigger 
            value="projects"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:hover:bg-blue-100"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            {t?.tabs?.projects || 'Posted Projects'}
          </TabsTrigger>
          
          {/* 🔥 創作者專屬：我的提案 Tab */}
          {isFreelancer && (
            <TabsTrigger 
              value="proposals"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:hover:bg-blue-100"
            >
              <FileText className="h-4 w-4 mr-2" />
              {language === 'en' ? 'My Proposals' : language === 'zh-CN' ? '我的提案' : '我的提案'}
            </TabsTrigger>
          )}
          
          <TabsTrigger 
            value="favorites"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:hover:bg-blue-100"
          >
            <Heart className="h-4 w-4 mr-2" />
            {language === 'en' ? 'My Favorites' : language === 'zh-CN' ? '我的收藏' : '我的收藏'}
          </TabsTrigger>
          
          <TabsTrigger 
            value="wallet"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:hover:bg-blue-100"
          >
            <WalletIcon className="h-4 w-4 mr-2" />
            {t?.tabs?.wallet || 'Wallet'}
          </TabsTrigger>
          <TabsTrigger 
            value="invoices"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:hover:bg-blue-100"
          >
            {t?.tabs?.invoices || '發票'}
          </TabsTrigger>
          <TabsTrigger 
            value="messages"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:hover:bg-blue-100"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {t?.tabs?.messages || 'Messages'}
          </TabsTrigger>
          <TabsTrigger 
            value="profile"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:hover:bg-blue-100"
          >
            <UserCircle className="h-4 w-4 mr-2" />
            {t?.tabs?.profile || 'Profile & Brand'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* ✅ 已移除手動 LOGO 同步工具 - 現已全自動化 (v2.1.62) */}
          
          {/* 🔔 邀請通知區塊 - 僅對接案者顯示 */}
          {isFreelancer && (
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-purple-600" />
                  {language === 'en' ? 'Project Invitations' : language === 'zh-CN' ? '项目邀请' : '專案邀請'}
                </CardTitle>
                <CardDescription>
                  {language === 'en' 
                    ? 'You have been invited to submit proposals for these projects' 
                    : language === 'zh-CN'
                    ? '您收到了这些项目的投标邀请'
                    : '您收到了這些專案的投標邀請'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvitationNotifications />
              </CardContent>
            </Card>
          )}
          
          {/* 📤 我發送的邀請 - 對所有用戶顯示（如果有發送邀請的話） */}
          <SentInvitations />
          
          <MembershipCard />
          
          <EnterpriseFeaturesPanel language={language} />
          
          {/* SLA Documentation Card */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    {language === 'en' ? 'Service Level Agreement (SLA)' : language === 'zh-CN' ? '服务等级协议 (SLA)' : '服務等級協議 (SLA)'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {language === 'en' 
                      ? 'View our commitment to reliable, high-quality service' 
                      : language === 'zh-CN'
                      ? '查看我们对可靠、高品质服务的承诺'
                      : '查看我們對可靠、高品質服務的承諾'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {language === 'en' ? 'Enterprise Only' : language === 'zh-CN' ? '企业版专属' : '企業版專屬'}
                  </span>
                  <Button
                    onClick={() => {
                      setView('sla-documentation');
                      setManualOverride(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {language === 'en' ? 'View SLA' : language === 'zh-CN' ? '查看 SLA' : '查看 SLA'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">99.9%</div>
                  <div className="text-sm text-gray-600">
                    {language === 'en' ? 'Uptime Guarantee' : language === 'zh-CN' ? '常运行时间保' : '正運行時間保證'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">30 min</div>
                  <div className="text-sm text-gray-600">
                    {language === 'en' ? 'Critical Response Time' : language === 'zh-CN' ? '紧急响应时' : '緊急響應時間'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">24/7</div>
                  <div className="text-sm text-gray-600">
                    {language === 'en' ? 'Enterprise Support' : language === 'zh-CN' ? '企业支持' : '企業支援'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <TeamInvitations language={language} />
          <SLAMonitoring language={language} />
          <TeamManagement language={language} />
          <TransactionStats />
          <DiagnosticPanel />
          {/*  移除：管理員面板改為全局浮動按鈕 */}
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium">
                {language === 'en' ? 'My Projects' : language === 'zh-CN' ? '我的项目' : '我的專案'}
              </h3>
              <p className="text-sm text-gray-500">
                {language === 'en' ? 'Manage all your posted projects' : language === 'zh-CN' ? '管理您发布的所有项目' : '管理您發布的所有專案'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔄 [Dashboard] Manual refresh triggered');
                setRefreshKey(prev => prev + 1);
              }}
            >
              {language === 'en' ? '🔄 Refresh' : '🔄 重新整理'}
            </Button>
          </div>
          {/* 🔥 移除 disableDevMode，允許開發模式顯示 localStorage 項目 */}
          <ProjectList key={refreshKey} clientId={user?.id} />
        </TabsContent>

        {/* 🔥 創作者專屬：我的提案 Tab Content */}
        {isFreelancer && (
          <TabsContent value="proposals" className="space-y-6">
            <MyProposals />
          </TabsContent>
        )}

        <TabsContent value="favorites" className="space-y-6">
          <FavoritesList />
        </TabsContent>

        <TabsContent value="wallet" className="space-y-6">
          <ExchangeRateIndicator />
          <QuickSubscriptionCheck />
          <RecurringSubscriptionManager 
            userId={user?.id || ''}
            accessToken={accessToken || ''}
            language={language}
          />
          <Wallet />
          <KYCVerification />
          <WithdrawalRequest />
          <WithdrawalHistory />
          <InternalTransfer />
          <TransferHistory />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <UnifiedInvoiceManager />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <MessageList />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          {console.log('📝 [Dashboard] Rendering Profile tab', { language, user: user?.id })}
          
          {/* Password Management */}
          <PasswordManagement />
          
          {/* Brand Settings (Enterprise) */}
          {console.log('🎨 [Dashboard] About to render BrandingSettings')}
          <BrandingSettings language={language} />
          {console.log('✅ [Dashboard] BrandingSettings rendered')}
          
          {/* Brand Preview */}
          <BrandPreview language={language} />
          
          {/* Other Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'en' ? 'Profile Settings' : language === 'zh-CN' ? '个人资料设定' : '個人資料設定'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 🎨 作品集管理按鈕 */}
              <div className="flex items-center justify-between p-4 border border-purple-200 rounded-lg bg-purple-50">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {language === 'en' ? 'Portfolio' : language === 'zh-CN' ? '作品集' : '作品集'}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {language === 'en' 
                      ? 'Showcase your best work to attract clients' 
                      : language === 'zh-CN' 
                      ? '展示您的最佳作品以吸引客户' 
                      : '展示您的最佳作品以吸引客戶'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (user?.id) {
                        sessionStorage.setItem('current_freelancer_id', user.id);
                        sessionStorage.setItem('freelancer_initial_tab', 'portfolio');
                        setView('freelancer-profile');
                      }
                    }}
                    className="border-purple-300 text-purple-700 hover:bg-purple-100"
                  >
                    {language === 'en' ? 'View Portfolio' : language === 'zh-CN' ? '查看作品集' : '查看作品集'}
                  </Button>
                  <Button
                    onClick={() => setView('portfolio-manager')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Manage Portfolio' : language === 'zh-CN' ? '管理作品集' : '管理作品集'}
                  </Button>
                </div>
              </div>
              
              <RoleSwitcher />
              <NotificationPreferences />
              <PaymentMethodsCard />
              <UsageLimitsCard />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 🔥 Enterprise Chat Tab */}
        <TabsContent value="enterprise-chat" className="space-y-6">
          <EnterpriseChat language={language as 'en' | 'zh' | 'zh-TW' | 'zh-CN'} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <UserProfile 
        open={showProfileDialog} 
        onOpenChange={setShowProfileDialog}
      />
      
      {/* 🔥 發布項目對話框 - 移除 isClient 限制，所有登入用戶都可發布項目 */}
      <PostProjectDialog
        open={showPostDialog}
        onOpenChange={setShowPostDialog}
        onSuccess={handleProjectSubmitted}
      />
      
      {/* 🔥 專案詳情對話框 */}
      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={selectedProject}
      />
    </div>
  );
});

export default Dashboard;