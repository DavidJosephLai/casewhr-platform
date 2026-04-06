import React, { useState, useEffect } from 'react';
import { AdminManagement } from '../components/admin/AdminManagement';
import { AdminManagementUnified } from '../components/admin/AdminManagementUnified';
import { ECPayPaymentManager } from '../components/admin/ECPayPaymentManager';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminUsers } from '../components/admin/AdminUsers';
import { AdminProjects } from '../components/admin/AdminProjects';
import { AdminWithdrawals } from '../components/admin/AdminWithdrawals';
import { AdminKYCVerification } from '../components/admin/AdminKYCVerification';
import { AdminTransactions } from '../components/admin/AdminTransactions';
import { AdminBankAccounts } from '../components/admin/AdminBankAccounts';
import { AdminEmailSender } from '../components/admin/AdminEmailSender';
import { AdminSettings } from '../components/admin/AdminSettings';
import { AdminMessages } from '../components/admin/AdminMessages';
import { AdminInvoicePrefixManager } from '../components/admin/AdminInvoicePrefixManager';
import { AdminRevenue } from '../components/admin/AdminRevenue';
import { InvoiceManager } from '../components/InvoiceManager';
import { TestClientCleaner } from '../components/TestClientCleaner';
// ❌ 已移除 QuickDepositHelper - 不再為 davidjosephilai1@outlook.com 提供值功能
// ❌ 已移除 UserCreationHelper - 不再需要用戶檢查工具
// ❌ 已移除 EnterpriseTestHelper - 不再需要 Enterprise 升級測試工具
import { SitemapGenerator } from '../components/SitemapGenerator';
import { SitemapURLChecker } from '../components/SitemapURLChecker';
import { SitemapManager } from '../components/admin/SitemapManager';
import { SitemapUpdater } from '../components/admin/SitemapUpdater';
import { GoogleSearchConsoleGuide } from '../components/admin/GoogleSearchConsoleGuide';
import { SEODiagnostic } from '../components/SEODiagnostic';
import { AdminAISEO } from '../components/admin/AdminAISEO';
import AdminAISEOReports from '../components/admin/AdminAISEOReports';
import { AdvancedAISEOConsole } from '../components/admin/AdvancedAISEOConsole';
import { AISEOContentList } from '../components/admin/AISEOContentList';
import { SEOKeywordTools } from '../components/admin/SEOKeywordTools';
import { AISEODiagnostic } from '../components/admin/AISEODiagnostic';
import { SEOIndexChecker } from '../components/admin/SEOIndexChecker';
import { SEOActionPlan } from '../components/admin/SEOActionPlan';
import { RobotsTxtFixer } from '../components/admin/RobotsTxtFixer';
import KVStoreDiagnostic from '../components/admin/KVStoreDiagnostic';
import { WithdrawalAdminPanel } from '../components/WithdrawalAdminPanel';
import DataSyncDiagnostic from '../components/DataSyncDiagnostic';
import { WismachionAdminPanel } from '../wismachion/admin/WismachionAdminPanel';
import { SEOManagementCenter } from '../components/seo/SEOManagementCenter';
import BlogManagementPage from '../components/BlogManagementPage';
import { HeroVideoManager } from '../components/HeroVideoManager';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Shield, Crown, UserCog, Eye, LogOut, Loader2 } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useView } from '../contexts/ViewContext';
import { AdminLevel, isAnyAdmin, getAdminLevel } from '../config/admin';
import { toast } from 'sonner';

export default function AdminPage() {
  const { language } = useLanguage();
  const { user, profile, signOut, accessToken } = useAuth();
  const { setView, setManualOverride } = useView();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLevel, setAdminLevel] = useState<AdminLevel | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const content = {
    en: {
      title: 'Admin Panel',
      logout: 'Logout',
      unauthorized: 'Unauthorized access',
      checking: 'Verifying permissions...',
      adminLevel: 'Admin Level',
      levels: {
        SUPER_ADMIN: 'Super Admin',
        ADMIN: 'Admin',
        MODERATOR: 'Moderator',
      },
      tabs: {
        dashboard: 'Dashboard',
        users: 'User Management',
        projects: 'Project Management',
        withdrawals: 'Withdrawal Management',
        kyc: 'KYC Verification',
        transactions: 'Transaction History',
        revenue: 'Platform Revenue',
        memberships: 'Membership Management',
        bankAccounts: 'Bank Accounts',
        ecpayPayments: 'ECPay Payments',
        invoices: 'E-Invoices',
        emailSender: '💌 EMAIL 💌',
        settings: 'System Settings',
        messages: 'Message Monitoring',
        administrators: 'Administrators',
        paymentManager: 'Payment Manager',
        seoTools: 'AI SEO',
        sitemap: 'Sitemap Generator',
        dataSync: 'Data Sync',
        wismachion: 'Wismachion Licenses',
        blog: 'Blog Management',
        heroVideo: '🎬 Hero Video',
      },
    },
    'zh-TW': {
      title: '管理員後台',
      logout: '登出',
      unauthorized: '未經授權的訪問',
      checking: '驗證權限中...',
      adminLevel: '管理員級別',
      levels: {
        SUPER_ADMIN: '超級管理員',
        ADMIN: '普通管理員',
        MODERATOR: '審核員',
      },
      tabs: {
        dashboard: '儀表板',
        users: '用戶管理',
        projects: '項目管理',
        withdrawals: '提現管理',
        kyc: 'KYC 身份驗證',
        transactions: '交易記錄',
        revenue: '平台收入',
        memberships: '會員管理',
        bankAccounts: '銀行帳戶',
        ecpayPayments: '綠界付款',
        invoices: '電子發票',
        emailSender: '💌 EMAIL 💌',
        settings: '系統設置',
        messages: '消息監控',
        administrators: '管理員',
        paymentManager: '付款管理',
        seoTools: 'AI SEO',
        sitemap: 'Sitemap 生成',
        dataSync: '數據同步',
        wismachion: 'Wismachion 授權',
        blog: 'Blog 管理',
        heroVideo: '🎬 Hero Video',
      },
    },
    'zh-CN': {
      title: '管理员后台',
      logout: '登出',
      unauthorized: '未经授权的访问',
      checking: '证权中...',
      adminLevel: '理员级别',
      levels: {
        SUPER_ADMIN: '超级管理员',
        ADMIN: '普通管理员',
        MODERATOR: '审核员',
      },
      tabs: {
        dashboard: '仪表板',
        users: '用户管理',
        projects: '项目管理',
        withdrawals: '提现管理',
        kyc: 'KYC 身份验证',
        transactions: '交易记录',
        revenue: '平台收入',
        memberships: '会员管理',
        bankAccounts: '银行账户',
        ecpayPayments: '绿界付款',
        invoices: '电子发票',
        emailSender: '💌 EMAIL 💌',
        settings: '系统设置',
        messages: '消息监控',
        administrators: '管理员',
        paymentManager: '付款管理',
        seoTools: 'AI SEO',
        sitemap: 'Sitemap 生成',
        dataSync: '数据同步',
        wismachion: 'Wismachion 授权',
        blog: 'Blog 管理',
        heroVideo: '🎬 Hero Video',
      },
    }
  };

  // ✅ 使用語言代碼直接訪問，帶有後備機制
  const t = content[language as keyof typeof content] || content['zh-TW'];

  useEffect(() => {
    checkAdminPermission();
  }, [user, profile]);

  const checkAdminPermission = async () => {
    if (!user) {
      toast.error('未經授權的訪問');
      setView('home');
      setManualOverride(true);
      return;
    }

    const userIsAdmin = isAnyAdmin(user.email || '', profile);

    if (!userIsAdmin) {
      toast.error('未經授權的訪問');
      setView('home');
      setManualOverride(true);
      return;
    }

    const level = getAdminLevel(user.email || '', profile);
    setAdminLevel(level);
    setIsAdmin(true);
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = window.location.origin;
    } catch (error) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = window.location.origin;
      } catch (e) {
        window.location.reload();
      }
    }
  };

  // Get admin level badge
  const getAdminBadge = () => {
    if (!adminLevel) return null;
    
    const badges = {
      SUPER_ADMIN: {
        icon: Crown,
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        label: '超級管理員',
      },
      SUPERADMIN: {  // 添加沒有下劃線的版本以支持舊數據
        icon: Crown,
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        label: '超級管理員',
      },
      ADMIN: {
        icon: UserCog,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        label: '普通管理員',
      },
      MODERATOR: {
        icon: Eye,
        color: 'text-green-600 bg-green-50 border-green-200',
        label: '審核員',
      },
      STAFF: {  // 添加 STAFF 級別支持
        icon: UserCog,
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        label: '工作人員',
      },
    };

    const badge = badges[adminLevel];
    
    // 如果找不到對應的 badge，回默認的 Admin badge
    if (!badge) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-gray-600 bg-gray-50 border-gray-200">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">{adminLevel}</span>
        </div>
      );
    }
    
    const Icon = badge.icon;

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${badge.color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{badge.label}</span>
      </div>
    );
  };

  // Check if tab should be visible based on admin level
  const canViewTab = (tabName: string): boolean => {
    if (!adminLevel) return false;

    // SUPER_ADMIN 和 SUPERADMIN (舊版) 可以查看所有標籤
    if (adminLevel === AdminLevel.SUPER_ADMIN || adminLevel === 'SUPERADMIN') return true;

    // ADMIN can view all tabs except bankAccounts, administrators, and walletReset
    if (adminLevel === AdminLevel.ADMIN) {
      return !['bankAccounts', 'administrators', 'walletReset', 'revenueReset'].includes(tabName);
    }

    // MODERATOR can view: dashboard, users, projects, messages, transactions, emailSender, settings, paymentManager, seoTools, sitemap
    if (adminLevel === AdminLevel.MODERATOR) {
      return ['dashboard', 'users', 'projects', 'messages', 'transactions', 'emailSender', 'settings', 'paymentManager', 'seoTools', 'sitemap', 'withdrawals', 'dataSync'].includes(tabName);
    }

    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t.checking}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Admin Header - Positioned below main Header */}
      <div className="bg-white border-b sticky top-[100px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold">{t.title}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {getAdminBadge()}
              <div className="text-sm text-gray-600 hidden sm:block">
                {user?.email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t.logout}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[50px]">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-2 h-auto p-2 bg-white">
            {canViewTab('dashboard') && (
              <TabsTrigger key="dashboard" value="dashboard" className="text-xs sm:text-sm">
                {t.tabs.dashboard}
              </TabsTrigger>
            )}
            {canViewTab('users') && (
              <TabsTrigger key="users" value="users" className="text-xs sm:text-sm">
                {t.tabs.users}
              </TabsTrigger>
            )}
            {canViewTab('administrators') && (
              <TabsTrigger key="administrators" value="administrators" className="text-xs sm:text-sm">
                {t.tabs.administrators}
              </TabsTrigger>
            )}
            {canViewTab('projects') && (
              <TabsTrigger key="projects" value="projects" className="text-xs sm:text-sm">
                {t.tabs.projects}
              </TabsTrigger>
            )}
            {canViewTab('emailSender') && (
              <TabsTrigger key="emailSender" value="emailSender" className="text-xs sm:text-sm">
                {t.tabs.emailSender}
              </TabsTrigger>
            )}
            {canViewTab('messages') && (
              <TabsTrigger key="messages" value="messages" className="text-xs sm:text-sm">
                {t.tabs.messages}
              </TabsTrigger>
            )}
            {canViewTab('withdrawals') && (
              <TabsTrigger key="withdrawals" value="withdrawals" className="text-xs sm:text-sm">
                {t.tabs.withdrawals}
              </TabsTrigger>
            )}
            {canViewTab('kyc') && (
              <TabsTrigger key="kyc" value="kyc" className="text-xs sm:text-sm">
                {t.tabs.kyc}
              </TabsTrigger>
            )}
            {canViewTab('transactions') && (
              <TabsTrigger key="transactions" value="transactions" className="text-xs sm:text-sm">
                {t.tabs.transactions}
              </TabsTrigger>
            )}
            {canViewTab('revenue') && (
              <TabsTrigger key="revenue" value="revenue" className="text-xs sm:text-sm">
                {t.tabs.revenue}
              </TabsTrigger>
            )}
            {canViewTab('bankAccounts') && (
              <TabsTrigger key="bankAccounts" value="bankAccounts" className="text-xs sm:text-sm">
                {t.tabs.bankAccounts}
              </TabsTrigger>
            )}
            {canViewTab('invoices') && (
              <TabsTrigger key="invoices" value="invoices" className="text-xs sm:text-sm">
                {t.tabs.invoices}
              </TabsTrigger>
            )}
            {canViewTab('settings') && (
              <TabsTrigger key="settings" value="settings" className="text-xs sm:text-sm">
                {t.tabs.settings}
              </TabsTrigger>
            )}
            {canViewTab('paymentManager') && (
              <TabsTrigger key="paymentManager" value="paymentManager" className="text-xs sm:text-sm">
                {t.tabs.paymentManager}
              </TabsTrigger>
            )}
            {canViewTab('seoTools') && (
              <TabsTrigger key="seoTools" value="seoTools" className="text-xs sm:text-sm">
                {t.tabs.seoTools}
              </TabsTrigger>
            )}
            {canViewTab('sitemap') && (
              <TabsTrigger key="sitemap" value="sitemap" className="text-xs sm:text-sm">
                {t.tabs.sitemap}
              </TabsTrigger>
            )}
            {canViewTab('dataSync') && (
              <TabsTrigger key="dataSync" value="dataSync" className="text-xs sm:text-sm">
                {t.tabs.dataSync}
              </TabsTrigger>
            )}
            {canViewTab('wismachion') && (
              <TabsTrigger key="wismachion" value="wismachion" className="text-xs sm:text-sm">
                {t.tabs.wismachion}
              </TabsTrigger>
            )}
            {canViewTab('blog') && (
              <TabsTrigger key="blog" value="blog" className="text-xs sm:text-sm">
                {t.tabs.blog}
              </TabsTrigger>
            )}
            {canViewTab('heroVideo') && (
              <TabsTrigger key="heroVideo" value="heroVideo" className="text-xs sm:text-sm">
                {t.tabs.heroVideo}
              </TabsTrigger>
            )}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="dashboard" className="mt-0">
              <AdminDashboard adminLevel={adminLevel} />
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              <div className="space-y-6">
                {/* ❌ 已移除 QuickDepositHelper - 不再為 davidjosephilai1@outlook.com 提供值功能 */}
                {/* ❌ 已移除 UserCreationHelper - 不再需要用戶檢查工具 */}
                {/* ❌ 已移除 EnterpriseTestHelper - 不再需要 Enterprise 升級測試工具 */}
                <AdminUsers adminLevel={adminLevel} />
              </div>
            </TabsContent>

            <TabsContent value="projects" className="mt-0">
              <AdminProjects adminLevel={adminLevel} />
            </TabsContent>

            <TabsContent value="messages" className="mt-0">
              <AdminMessages adminLevel={adminLevel} />
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-0">
              <div className="space-y-6">
                {/* ✅ 新的提款系統（已修復 Tabs 嵌套問題） */}
                <WithdrawalAdminPanel />
                
                {/* 🔧 舊的提款系統（備用） */}
                {/* <AdminWithdrawals adminLevel={adminLevel} /> */}
              </div>
            </TabsContent>

            <TabsContent value="kyc" className="mt-0">
              <AdminKYCVerification />
            </TabsContent>

            <TabsContent value="transactions" className="mt-0">
              <AdminTransactions adminLevel={adminLevel} />
            </TabsContent>

            <TabsContent value="revenue" className="mt-0">
              <AdminRevenue />
            </TabsContent>

            <TabsContent value="bankAccounts" className="mt-0">
              <AdminBankAccounts adminLevel={adminLevel} />
            </TabsContent>

            <TabsContent value="invoices" className="mt-0">
              <div className="space-y-6">
                <AdminInvoicePrefixManager accessToken={accessToken} />
                <InvoiceManager accessToken={accessToken || ''} isAdmin={true} />
              </div>
            </TabsContent>

            <TabsContent value="emailSender" className="mt-0">
              <AdminEmailSender />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <AdminSettings adminLevel={adminLevel} />
            </TabsContent>

            <TabsContent value="administrators" className="mt-0">
              <AdminManagementUnified />
            </TabsContent>

            <TabsContent value="paymentManager" className="mt-0">
              <ECPayPaymentManager accessToken={accessToken || ''} />
            </TabsContent>

            <TabsContent value="seoTools" className="mt-0">
              <div className="space-y-6">
                {/* 🔥🔥🔥 VERSION CHECK BANNER v3.1 - FORCE UPDATE - 2026-01-21 17:45:00 */}
                <div className="p-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 border-8 border-yellow-400 rounded-3xl shadow-2xl">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-6">
                    <h1 className="text-white font-black text-6xl text-center drop-shadow-2xl mb-4 animate-pulse">
                      🎊🎊🎊 ADMIN PAGE v3.1 🎊🎊🎊
                    </h1>
                    <p className="text-yellow-200 text-center text-3xl font-bold mb-2">
                      強制更新ID: {Math.random().toString(36).substring(2, 11).toUpperCase()}
                    </p>
                    <p className="text-white text-center text-2xl font-semibold">
                      時間戳記: {Date.now()}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6">
                    <p className="text-center text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse">
                      ✨ 如果您看到這個橫幅，代表 AdminPage.tsx 已成功更新到 v3.1！✨
                    </p>
                    <p className="text-center text-gray-600 mt-3 text-lg">
                      下方應該會看到「SEO 管理中心」的紫色版本橫幅 + 粉紅色閃爍橫幅
                    </p>
                  </div>
                </div>

                {/* 🎯 新的 SEO 管理中心 - 包含關鍵字地圖 */}
                <SEOManagementCenter />
                
                {/* 📊 舊的 SEO 工具（保留向後兼容） */}
                <AdminAISEO />
                <AdminAISEOReports />
                <AdvancedAISEOConsole />
                <AISEOContentList />
                <SEOKeywordTools />
                <AISEODiagnostic />
                <SEOIndexChecker />
                <SEOActionPlan />
                <RobotsTxtFixer />
              </div>
            </TabsContent>

            <TabsContent value="sitemap" className="mt-0">
              <div className="space-y-6">
                {/* 🔄 一鍵更新靜態 Sitemap 工具（最重要！） */}
                <SitemapUpdater />
                
                {/* 🗺️ 新的動態 Sitemap 管理器 */}
                <SitemapManager />
                
                {/* 📚 Google Search Console 設置指南 */}
                <GoogleSearchConsoleGuide />
                
                {/* 舊的 Sitemap 檢查工具 */}
                <SitemapURLChecker />
              </div>
            </TabsContent>

            <TabsContent value="dataSync" className="mt-0">
              <DataSyncDiagnostic />
            </TabsContent>

            <TabsContent value="wismachion" className="mt-0">
              <WismachionAdminPanel />
            </TabsContent>

            <TabsContent value="blog" className="mt-0">
              <BlogManagementPage />
            </TabsContent>

            <TabsContent value="heroVideo" className="mt-0">
              <HeroVideoManager />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}