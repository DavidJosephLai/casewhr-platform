import './utils/globalFetchInterceptor';

import { lazy, Suspense, useEffect, useState } from 'react';
import { LanguageProvider, useLanguage } from './lib/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ViewProvider, useView } from './contexts/ViewContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { DevModeLogin } from './components/DevModeLogin';
import { NetworkErrorNotice } from './components/NetworkErrorNotice';
import { SEO, getPageSEO } from './components/SEO';
import { SEOHead } from './components/SEOHead';
import { Toaster, toast } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { EmailRequiredModal } from './components/EmailRequiredModal';

// 🔥 Version marker to force cache invalidation - v2.0.95
// 🎯 Feature: Global fetch interceptor installed at module level
console.log('🚀 [App v2.0.95] Feature: Global fetch interceptor installed at import time');

// ⚡ 首頁組件 - 直接導入（不使用 lazy）以提升首屏性能
import { CoreValues } from './components/CoreValues';
import { Services } from './components/Services';
import { MilestoneFeature } from './components/MilestoneFeature';
import { Process } from './components/Process';
import { DevelopmentCategories } from './components/DevelopmentCategories';
import { TalentDirectory } from './components/TalentDirectory';
import { WhoCanTakeOver } from './components/WhoCanTakeOver';
import { Categories } from './components/Categories';
import { BrowseProjects } from './components/BrowseProjects';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { PopularServices } from './components/PopularServices';
import { Testimonials } from './components/Testimonials';
import { TrustBadges } from './components/TrustBadges';
import { LatestSEOReports } from './components/LatestSEOReports';
import { PlatformComparison } from './components/PlatformComparison';
import { WhitepaperDownload } from './components/WhitepaperDownload';

// ✅ 只對大型頁面使用 Lazy Load（真正需要代碼分割的）
const Dashboard = lazy(() => import('./components/Dashboard'));
const PricingPage = lazy(() => import('./components/PricingPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DynamicSEOPage = lazy(() => import('./components/DynamicSEOPage').then(module => ({ default: module.DynamicSEOPage })));

// 🎯 全局組件 - 使用 lazy 但保持輕量級（這些組件需要 default export）
const AdminFloatingButton = lazy(() => import('./components/AdminFloatingButton'));
const QuickAdminPanel = lazy(() => import('./components/QuickAdminPanel').then(module => ({ default: module.QuickAdminPanel })));
const AISEOFloatingButton = lazy(() => import('./components/AISEOFloatingButton').then(module => ({ default: module.AISEOFloatingButton })));
const AIChatbot = lazy(() => import('./components/AIChatbot'));
const AISEOManager = lazy(() => import('./components/AISEOManager').then(module => ({ default: module.AISEOManager })));

// 🔧 測試和診斷頁面 - Lazy Load（不常用）
const AISEOTestPage = lazy(() => import('./components/AISEOTestPage'));
const BrevoTestPage = lazy(() => import('./components/BrevoTestPage'));
const EmailTestPage = lazy(() => import('./components/EmailTestPage'));
const GoogleOAuthTester = lazy(() => import('./components/GoogleOAuthTester'));
const GoogleSearchConsoleVerifier = lazy(() => import('./components/GoogleSearchConsoleVerifier'));
const EnvironmentCheck = lazy(() => import('./components/EnvironmentCheck'));
const TransferDebug = lazy(() => import('./components/TransferDebug'));
const AuthDiagnostic = lazy(() => import('./components/AuthDiagnostic'));
const SimpleLoginTest = lazy(() => import('./components/SimpleLoginTest'));
const FigmaEnvDiagnostic = lazy(() => import('./components/FigmaEnvDiagnostic'));
const ECPayDiagnostic = lazy(() => import('./components/ECPayDiagnostic'));
const EmailManagementPage = lazy(() => import('./components/EmailManagementPage'));
const EmailIntegrationPanel = lazy(() => import('./components/EmailIntegrationPanel'));
const StripeEnvCheck = lazy(() => import('./components/StripeEnvCheck'));
const AcceptInvitationPage = lazy(() => import('./components/AcceptInvitationPage'));
const AuthCallback = lazy(() => import('./components/AuthCallback'));
const ResetPasswordPage = lazy(() => import('./components/ResetPasswordPage'));
const AuthVerifyPage = lazy(() => import('./components/AuthVerifyPage'));
const AISEODiagnostic = lazy(() => import('./components/AISEODiagnostic'));
const KeywordResearchTest = lazy(() => import('./components/KeywordResearchTest'));
const KeywordDeploymentCheck = lazy(() => import('./components/KeywordDeploymentCheck'));
const OpenAIKeyGuide = lazy(() => import('./components/OpenAIKeyGuide'));
const DataSyncDiagnostic = lazy(() => import('./components/DataSyncDiagnostic'));
const DeepDataDiagnostic = lazy(() => import('./components/DeepDataDiagnostic'));
// const FetchInterceptorTest = lazy(() => import('./components/FetchInterceptorTest')); // ❌ Removed - component doesn't exist

// 📄 內容頁面 - Lazy Load（SEO 相關頁面）
const PrivacyPolicyPage = lazy(() => import('./components/PrivacyPolicyPage'));
const CookiesPolicyPage = lazy(() => import('./components/CookiesPolicyPage'));
const DisclaimerPage = lazy(() => import('./components/DisclaimerPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const CaseStudies = lazy(() => import('./components/CaseStudies'));
const TermsOfServicePage = lazy(() => import('./components/TermsOfServicePage'));
const ApiDocumentation = lazy(() => import('./components/ApiDocumentation').then(module => ({ default: module.ApiDocumentation })));

// 📝 Blog 頁面 - 🔥 臨時改為直接導入以調試問題
import BlogListPage from './components/BlogListPage';
// 🔥 臨時改為直接導入以調試問題
import { BlogPostPage } from './components/BlogPostPage';
// 🔥 臨時改為直接導入以調試問題
import BlogManagementPage from './components/BlogManagementPage';

// 🌍 公開 SEO 報告頁面
const PublicSEOReport = lazy(() => import('./components/PublicSEOReport').then(module => ({ default: module.PublicSEOReport })));

// 🎯 SEO 管理中心
const SEOManagementCenter = lazy(() => import('./components/seo/SEOManagementCenter'));

// 💼 Wismachion - License Management Platform - ⚡ 直接導入以加快載入速度
import WismachionApp from './wismachion/WismachionApp';

// Loading fallback components - 🚀 優化：移除刺眼的藍色載入器
function LoadingFallback() {
  return null; // 靜默載入不顯示任何內容
}

function PageLoadingFallback() {
  return null; // 靜默載入，不顯示任何內容
}

function AppContent() {
  const { language } = useLanguage();
  const { view, setView } = useView();
  const { user, accessToken, signOut } = useAuth();
  const [dashboardTab, setDashboardTab] = useState<string | undefined>(undefined);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isTeamInvitation, setIsTeamInvitation] = useState(false);
  
  // 🔍 調試：監控 view 狀態
  console.log('🔍 [App] Current view:', view);
  
  // 🟢 LINE OAuth Email 狀態
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  
  // 🔍 診斷遮罩層問題
  console.log('🚨 [App] EmailRequiredModal 狀態:', { showEmailModal, lineUserId });
  
  // 將語言轉換為 AIChatbot 支持的格式
  const chatbotLanguage = language === 'zh' ? 'zh-TW' : language as 'en' | 'zh-TW' | 'zh-CN';
  
  // 🔧 註冊 Service Worker (性能優化)
  useEffect(() => {
    // autoRegisterServiceWorker();
    
    // ⚡ 啟動性能監
    // startPerformanceMonitoring();
    
    // 監聽 Service Worker 更新
    window.addEventListener('swUpdateAvailable', (event: any) => {
      console.log('🆕 [App] Service Worker update available');
      toast.info(
        language === 'en'
          ? '🆕 New version available! Refresh to update.'
          : '🆕 發現新版本！請刷新頁面更新。',
        { 
          duration: 10000,
          action: {
            label: language === 'en' ? 'Refresh' : '刷新',
            onClick: () => window.location.reload()
          }
        }
      );
    });
  }, [language]);
  
  // 🔥 監聽用戶登入狀態變化，並為特殊用戶自動刷新訂閱
  useEffect(() => {
    if (!user) return;
    
    // 🔥 檢查是否為特殊用戶，如果是則自動刷新訂閱
    if (user?.email) {
      const specialEmails = ['davidlai234@hotmail.com'];
      const isSpecialUser = specialEmails.includes(user.email);
      
      if (isSpecialUser) {
        console.log('🎁 [App] Special user detected:', user.email);
        // 延遲觸發刷新事件，確保所有組件已載入
        setTimeout(() => {
          try {
            console.log('🔄 [App] Triggering refreshSubscription event for special user');
            window.dispatchEvent(new Event('refreshSubscription'));
          } catch (error) {
            console.error('❌ [App] Error triggering refreshSubscription event:', error);
          }
        }, 1000);
      }
    }
  }, [user]);
  
  // 🔥 NEW: 監聽自定義航事件（例如從錢包餘額不足對話框觸發）
  useEffect(() => {
    const handleNavigate = (event: any) => {
      const targetView = event.detail?.view;
      console.log('🧭 [App] Navigation event received:', targetView);
      
      if (targetView === 'wallet') {
        // 切換到儀表板錢包標籤
        setView('dashboard');
        setDashboardTab('wallet');
        console.log('✅ [App] Navigated to wallet tab');
      }
    };
    
    window.addEventListener('navigate', handleNavigate);
    
    return () => {
      window.removeEventListener('navigate', handleNavigate);
    };
  }, [setView]);
  
  // 🔑 顯示測試帳號密碼提示 (僅在開發環境)
  useEffect(() => {
    console.log('%c🔑 測試帳號登入資訊', 'color: #10b981; font-size: 16px; font-weight: bold;');
    console.log('%c📧 Email: davidlai234@hotmail.com', 'color: #3b82f6; font-size: 14px;');
    console.log('%c🔐 密碼: CaseWHR2025! (固定密碼)', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
    console.log('%c💡 提示: 點擊右下角藍色盾牌 → 設置特殊用戶', 'color: #6b7280; font-size: 12px;');
  }, []); // 只應用啟動時顯示一次
  
  // 初始化匯率系
  // Note: useExchangeRate hook 已在各組件按需使用
  
  // 檢測團隊邀請 URL
  useEffect(() => {
    const urlPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    console.log('🚀 [App] Initial route check');
    console.log('🚀 [App] Pathname:', urlPath);
    console.log('🚀 [App] Search:', window.location.search);
    console.log('🚀 [App] Hash:', window.location.hash);
    
    // 檢查是否是 robots.txt 或 sitemap.xml
    if (urlPath === '/robots.txt' || urlPath === '/sitemap.xml') {
      console.log(`🤖 [App] SEO file requested: ${urlPath}`);
      // 重定向到後端 API 端
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5${urlPath}`;
      window.location.replace(apiUrl);
      return;
    }
    
    // 檢查是否是 Google 驗證文件（支持任意驗證碼）
    if (urlPath.startsWith('/google') && urlPath.endsWith('.html')) {
      console.log('🔍 [App] Google verification file requested:', urlPath);
      const fileName = urlPath.substring(1); // 移除開頭的 /
      // 直接顯示驗證內容
      document.body.innerHTML = `google-site-verification: ${fileName}`;
      document.title = 'Google Site Verification';
      return;
    }
    
    // 檢查隱私政策和服務條款頁面（支持多種 URL 格式）
    if (urlPath === '/privacy' || urlPath === '/privacy-policy') {
      console.log('📄 [App] Privacy policy page detected');
      setView('privacy-policy');
      return;
    }
    
    if (urlPath === '/terms' || urlPath === '/terms-of-service') {
      console.log(' [App] Terms of service page detected');
      setView('terms-of-service');
      return;
    }
    
    // 檢查是否密碼重設頁面
    if (urlPath.includes('/reset-password')) {
      console.log('🔐 [App] Reset password page detected');
      setView('reset-password');
      return;
    }
    
    // 🌍 檢查是否是公開 SEO 報告頁面
    if (urlPath.startsWith('/seo-report/')) {
      console.log('🌍 [App] Public SEO report page detected');
      setView('public-seo-report');
      return;
    }
    
    // 檢查是否是 OAuth 回調
    if (urlPath.includes('/auth/callback')) {
      console.log('🔗 [App] OAuth callback detected');
      setView('auth-callback');
      return;
    }
    
    // 📝 檢查是否是 Blog 頁面
    if (urlPath === '/blog') {
      console.log('📝 [App] Blog list page detected');
      console.log('🔥🔥🔥 [App] Setting view to blog - NO REDIRECT TO POST PAGE!');
      console.log('🔥🔥🔥 [App] Current view before setView:', view);
      setView('blog');
      console.log('🔥🔥🔥 [App] setView(blog) called!');
      return;
    }
    
    // 📝 檢查是否是 Blog 後台��理頁面
    if (urlPath === '/blog/admin') {
      console.log('🔧 [App] Blog admin page detected');
      
      // 🔐 暫時移除登入檢查，讓 BlogManagementPage 自己處理
      // 因為登入後狀態更新需要時間
      
      setView('blog-admin');
      return;
    }
    
    // 📝 檢查是否是 Blog 文章詳情頁
    if (urlPath.startsWith('/blog/')) {
      console.log('📝 [App] Blog post page detected');
      console.log('🔥 [App] URL:', urlPath);
      setView('blog-post');
      return;
    }
    
    // 查是否是團隊邀連結
    if (urlPath.includes('/team/accept-invitation') || urlParams.get('id')) {
      console.log('📧 [App] Team invitation link detected');
      setView('accept-invitation');
      setIsTeamInvitation(true);
    }
  }, [setView]);

  // 監聽 session 過期事件
  useEffect(() => {
    const handleSessionExpired = async () => {
      console.log('🔒 [App] Session expired event received, signing out...');
      
      toast.error(
        language === 'en'
          ? '🔒 Your session has expired. Please sign in again.'
          : '🔒 您的登入已過期，請重新登入。',
        { duration: 5000 }
      );
      
      // 延遲登出，讓用戶看到提示
      setTimeout(async () => {
        try {
          await signOut();
          setView('home');
        } catch (error) {
          console.error('Error signing out:', error);
          // 即使出錯也要清除並返回首頁
          window.location.href = '/';
        }
      }, 2000);
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [language, signOut, setView]);

  // 處理 LINE OAuth 回調
  useEffect(() => {
    // 檢查是否為 LINE 回調 URL
    if (window.location.pathname === '/line-callback') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      console.log('🟢 [LINE Callback] Detected LINE callback');
      console.log('🟢 [LINE Callback] Parameters:', { code: !!code, state: !!state, error });
      
      if (error) {
        console.error('��� [LINE Callback] Authorization failed:', error);
        toast.error(
          language === 'en'
            ? `LINE authorization failed: ${errorDescription || error}`
            : `LINE 授權失敗：${errorDescription || error}`,
          { duration: 5000 }
        );
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }
      
      if (!code || !state) {
        console.error('❌ [LINE Callback] Missing code or state');
        toast.error(
          language === 'en'
            ? 'LINE login failed: Missing parameters'
            : 'LINE 登入失敗：缺少參數',
          { duration: 5000 }
        );
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }
      
      // 調用後端交換 token
      const exchangeToken = async () => {
        try {
          console.log('🟢 [LINE Callback] Exchanging code for token...');
          
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/auth/line/exchange-token`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({ code, state }),
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to exchange token');
          }
          
          const data = await response.json();
          console.log('✅ [LINE Callback] Token exchange successful:', data);
          
          // 檢查是否需要提示用戶新 email
          if (data.needsEmailUpdate) {
            console.log('⚠️ [LINE Callback] User needs to update email');
            // 設定 LINE User ID 並顯示 Email Modal
            setLineUserId(data.user.id);
            setShowEmailModal(true);
            // 不繼續後續的自動登入流程，等待用戶輸入 email
            return;
          }
          
          // 使用 magic link 自動登入
          if (data.magic_link) {
            console.log('🔗 [LINE Callback] Using magic link to establish session');
            window.location.href = data.magic_link;
            return;
          }
          
          // 顯示成功提示
          toast.success(
            language === 'en'
              ? '🟢 LINE login successful! Redirecting to dashboard...'
              : '🟢 LINE 登入成功！正在跳轉到儀表板...',
            { duration: 3000 }
          );
          
          // 重定向到儀表板
          setTimeout(() => {
            window.location.href = '/?view=dashboard';
          }, 1000);
        } catch (error: any) {
          console.error('❌ [LINE Callback] Error:', error);
          toast.error(
            language === 'en'
              ? `❌ LINE login failed: ${error.message}`
              : `❌ LINE 登入失敗：${error.message}`,
            { duration: 5000 }
          );
          
          // 重定向回首頁
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
      };
      
      exchangeToken();
      return;
    }
  }, [language, projectId, publicAnonKey]);
  
  // 處理付款回調（Stripe 和 PayPal）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 原有的付款回調處理
    const paymentStatus = urlParams.get('payment');
    const provider = urlParams.get('provider'); // 'paypal' or 'stripe'
    const token = urlParams.get('token'); // PayPal order ID
    const sessionId = urlParams.get('session_id'); // Stripe session ID

    console.log('💳 [Payment Callback] URL params:', {
      paymentStatus,
      provider,
      token,
      sessionId,
      fullURL: window.location.href,
    });

    if (paymentStatus === 'success' && !processingPayment) {
      // 處理 PayPal 支付
      if (provider === 'paypal' && token) {
        setProcessingPayment(true);
        console.log('🅿️ [PayPal] Processing payment callback...', { token });
        
        // 調用後端 capture API
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/paypal/capture-payment`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId: token }),
          }
        )
          .then(async (response) => {
            console.log('🅿️ [PayPal] Capture response status:', response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log('✅ [PayPal] Payment captured:', data);
              
              toast.success(
                language === 'en'
                  ? `🎉 Payment successful! $${data.amount?.toLocaleString() || '?'} added to your wallet.\n\n📄 E-invoice will be issued within 24 hours.\n🔍 Check at: Ministry of Finance E-Invoice Platform\nhttps://www.einvoice.nat.gov.tw/`
                  : `🎉 付款成功！已將 $${data.amount?.toLocaleString() || '?'} 加入您的錢包。\n\n📄 電子發票將於 24 小時內開立\n🔍 查詢請至：財政部電發票整合服務平台\nhttps://www.einvoice.nat.gov.tw/`,
                { duration: 8000 }
              );
              
              // 清除 URL 參數
              window.history.replaceState({}, '', window.location.pathname);
              
              // 導航到錢包頁面
              setView('dashboard');
              setDashboardTab('wallet');
            } else {
              const errorData = await response.json();
              console.error('❌ [PayPal] Capture failed:', errorData);
              
              toast.error(
                language === 'en'
                  ? `Payment failed: ${errorData.error || 'Unknown error'}`
                  : `付款失敗：${errorData.error || '未知錯誤'}`,
                { duration: 8000 }
              );
              
              // 清除 URL 參數
              window.history.replaceState({}, '', window.location.pathname);
            }
          })
          .catch((error) => {
            console.error('❌ [PayPal] Capture error:', error);
            toast.error(
              language === 'en'
                ? `Payment processing error: ${error.message}`
                : `付款處理錯：${error.message}`,
              { duration: 8000 }
            );
            
            // 清除 URL 參數
            window.history.replaceState({}, '', window.location.pathname);
          })
          .finally(() => {
            setProcessingPayment(false);
          });
      }
      // 處理 Stripe 支付（保留原有邏輯）
      else {
        toast.success(
          language === 'en'
            ? '🎉 Payment successful! Your wallet has been updated.'
            : '🎉 款成功！您的錢包已更新。',
          { duration: 5000 }
        );
        // 清除 URL 參數
        window.history.replaceState({}, '', window.location.pathname);
        // 導航到錢包頁面
        setView('dashboard');
        setDashboardTab('wallet');
      }
    } else if (paymentStatus === 'cancel') {
      console.log('❌ [Payment] Payment cancelled');
      toast.error(
        language === 'en'
          ? '❌ Payment cancelled. No charges were made.'
          : '❌ 付款已取消未產生任何費用。',
        { duration: 5000 }
      );
      // 除 URL 參數
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [language, setView, accessToken, processingPayment]);

  // 監聽導航事件
  useEffect(() => {
    const handleShowDashboard = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('📱 [App] showDashboard event received:', customEvent.detail);
      
      // 🔥 FIX: 如果當前在 Blog 文章頁面，不要跳轉到 dashboard
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/blog/') && currentPath !== '/blog/admin') {
        console.log('🚫 [App] Ignoring showDashboard - user is reading a blog post');
        return;
      }
      
      setView('dashboard');
      if (customEvent.detail?.tab) {
        setDashboardTab(customEvent.detail.tab);
      }
    };

    const handleShowPricing = () => {
      console.log('💰 [App] showPricing event received');
      setView('pricing');
    };

    window.addEventListener('showDashboard', handleShowDashboard as EventListener);
    window.addEventListener('showPricing', handleShowPricing);

    return () => {
      window.removeEventListener('showDashboard', handleShowDashboard as EventListener);
      window.removeEventListener('showPricing', handleShowPricing);
    };
  }, [setView]);

  return (
    <div className="min-h-screen bg-white">
      {/* ✅ 全局 SEO 組件 */}
      <SEO 
        {...getPageSEO(view === 'home' ? 'home' : view, language)}
      />
      {/* 🌐 多域名 SEO 優化 */}
      <SEOHead />
      
      <Header />
      {view === 'dashboard' ? (
        <div className="pt-32">
          <SEO {...getPageSEO('dashboard', language)} noindex />
          <ErrorBoundary>
            <Suspense fallback={<PageLoadingFallback />}>
              <Dashboard initialTab={dashboardTab} onTabChange={() => setDashboardTab(undefined)} />
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : view === 'pricing' ? (
        <div className="pt-24">
          <SEO {...getPageSEO('pricing', language)} />
          <Suspense fallback={<PageLoadingFallback />}>
            <PricingPage />
          </Suspense>
        </div>
      ) : view === 'admin' ? (
        <div className="pt-20">
          <SEO 
            title={language === 'en' ? 'Admin Panel | Case Where' : '管員後台 | Case Where'} 
            description="" 
            keywords=""
            noindex 
          />
          <Suspense fallback={<PageLoadingFallback />}>
            <AdminPage />
          </Suspense>
          <Suspense fallback={<LoadingFallback />}>
            <AdminFloatingButton />
          </Suspense>
        </div>
      ) : view === 'brevo-test' ? (
        <div className="pt-20">
          <SEO title="Email Test" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <BrevoTestPage language={language} />
          </Suspense>
        </div>
      ) : view === 'email-test' ? (
        <div className="pt-20">
          <SEO title="Email Test" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <EmailTestPage />
          </Suspense>
        </div>
      ) : view === 'google-oauth-test' ? (
        <div className="pt-20">
          <SEO title="Google OAuth Tester" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <GoogleOAuthTester />
          </Suspense>
        </div>
      ) : view === 'google-dns-verifier' ? (
        <div className="pt-20">
          <SEO title="Google Search Console DNS Verification" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <GoogleSearchConsoleVerifier />
          </Suspense>
        </div>
      ) : view === 'env-check' ? (
        <div className="pt-20">
          <SEO title="Environment Check" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <EnvironmentCheck />
          </Suspense>
        </div>
      ) : view === 'transfer-debug' ? (
        <div className="pt-20">
          <SEO title="Transfer Debug" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <TransferDebug />
          </Suspense>
        </div>
      ) : view === 'seo-content' ? (
        <>
          {/* Dynamic SEO Content Page - 完全由 DynamicSEOPage 組件控制 SEO */}
          <Suspense fallback={<PageLoadingFallback />}>
            <DynamicSEOPage 
              contentId={window.location.pathname.split('/seo-content/')[1] || ''}
            />
          </Suspense>
        </>
      ) : view === 'auth-diagnostic' ? (
        <div className="pt-20">
          <SEO title="Auth Diagnostic" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <AuthDiagnostic />
          </Suspense>
        </div>
      ) : view === 'simple-login-test' ? (
        <div className="pt-20">
          <SEO title="Simple Login Test" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <SimpleLoginTest />
          </Suspense>
        </div>
      ) : view === 'figma-env-diagnostic' ? (
        <div className="pt-20">
          <SEO title="Figma Env Diagnostic" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <FigmaEnvDiagnostic />
          </Suspense>
        </div>
      ) : view === 'ecpay-diagnostic' ? (
        <div className="pt-20">
          <SEO title="ECPay Diagnostic" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <ECPayDiagnostic />
          </Suspense>
        </div>
      ) : view === 'email-management' ? (
        <div className="pt-20">
          <SEO title="Email Management" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <EmailManagementPage />
          </Suspense>
        </div>
      ) : view === 'email-integration' ? (
        <div className="pt-20">
          <SEO title="Email Integration" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <EmailIntegrationPanel language={language} />
          </Suspense>
        </div>
      ) : view === 'stripe-env-check' ? (
        <div className="pt-20">
          <SEO title="Stripe Check" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <StripeEnvCheck />
          </Suspense>
        </div>
      ) : view === 'accept-invitation' ? (
        <div className="pt-20">
          <SEO title="Accept Team Invitation" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <AcceptInvitationPage language={language} />
          </Suspense>
        </div>
      ) : view === 'auth-callback' ? (
        <Suspense fallback={<PageLoadingFallback />}>
          <AuthCallback />
        </Suspense>
      ) : view === 'reset-password' ? (
        <>
          <SEO title="Reset Password" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <ResetPasswordPage />
          </Suspense>
        </>
      ) : view === 'auth-verify' ? (
        <>
          <SEO title="Verify Email" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <AuthVerifyPage />
          </Suspense>
        </>
      ) : view === 'privacy-policy' ? (
        <div className="pt-20">
          <SEO {...getPageSEO('privacy-policy', language)} />
          <Suspense fallback={<PageLoadingFallback />}>
            <PrivacyPolicyPage />
          </Suspense>
        </div>
      ) : view === 'cookies-policy' ? (
        <div className="pt-20">
          <SEO {...getPageSEO('cookies-policy', language)} />
          <Suspense fallback={<PageLoadingFallback />}>
            <CookiesPolicyPage />
          </Suspense>
        </div>
      ) : view === 'disclaimer' ? (
        <div className="pt-20">
          <SEO {...getPageSEO('disclaimer', language)} />
          <Suspense fallback={<PageLoadingFallback />}>
            <DisclaimerPage />
          </Suspense>
        </div>
      ) : view === 'about' ? (
        <div className="pt-20">
          <SEO {...getPageSEO('about', language)} />
          <Suspense fallback={<PageLoadingFallback />}>
            <AboutPage />
          </Suspense>
        </div>
      ) : view === 'cases' ? (
        <div className="pt-20">
          <SEO 
            title={language === 'en' ? 'Success Stories | Case Where' : '成功案例 | Case Where 接得準'}
            description={language === 'en' ? 'View success stories and client testimonials on Case Where platform.' : '查看 Case Where 平台的成功案例和戶故事。'}
            keywords={language === 'en' ? 'success stories, testimonials, case studies' : '成功案例, 客戶見證, 案例研究'}
          />
          <Suspense fallback={<PageLoadingFallback />}>
            <CaseStudies />
          </Suspense>
        </div>
      ) : view === 'terms-of-service' ? (
        <div className="pt-20">
          <SEO {...getPageSEO('terms-of-service', language)} />
          <Suspense fallback={<PageLoadingFallback />}>
            <TermsOfServicePage />
          </Suspense>
        </div>
      ) : view === 'api-documentation' ? (
        <div className="pt-20">
          <SEO {...getPageSEO('api-documentation', language)} />
          <Suspense fallback={<PageLoadingFallback />}>
            <ApiDocumentation />
          </Suspense>
        </div>
      ) : view === 'public-seo-report' ? (
        <div className="pt-20">
          <SEO title="Public SEO Report" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <PublicSEOReport />
          </Suspense>
        </div>
      ) : view === 'ai-seo' ? (
        <div className="pt-32">
          <SEO title="AI SEO Manager" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <AISEOManager />
          </Suspense>
        </div>
      ) : view === 'seo-management' ? (
        <div className="pt-20">
          <SEO title="SEO Management Center" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <SEOManagementCenter />
          </Suspense>
        </div>
      ) : view === 'ai-seo-test' ? (
        <div className="pt-20">
          <SEO title="AI SEO Test Page" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <AISEOTestPage />
          </Suspense>
        </div>
      ) : view === 'ai-seo-diagnostic' ? (
        <div className="pt-20">
          <SEO title="AI SEO Diagnostic" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <AISEODiagnostic />
          </Suspense>
        </div>
      ) : view === 'keyword-research-test' ? (
        <div className="pt-20">
          <SEO title="Keyword Research Test" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <KeywordResearchTest />
          </Suspense>
        </div>
      ) : view === 'keyword-deployment-check' ? (
        <div className="pt-20">
          <SEO title="Keyword Deployment Check" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <KeywordDeploymentCheck />
          </Suspense>
        </div>
      ) : view === 'openai-key-guide' ? (
        <div className="pt-20">
          <SEO title="OpenAI Key Guide" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <OpenAIKeyGuide />
          </Suspense>
        </div>
      ) : view === 'data-sync-diagnostic' ? (
        <div className="pt-20">
          <SEO title="Data Sync Diagnostic" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <DataSyncDiagnostic />
          </Suspense>
        </div>
      ) : view === 'deep-data-diagnostic' ? (
        <div className="pt-20">
          <SEO title="Deep Data Diagnostic" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <DeepDataDiagnostic />
          </Suspense>
        </div>
      ) : view === 'wismachion' ? (
        <div className="pt-0">
          <SEO 
            title="PerfectComm - RS-232 Communication Software | Wismachion" 
            description="Professional RS-232 serial communication software for Windows. Perfect for communication protocol development and testing."
            keywords="RS-232, serial communication, VB.NET, Windows software, license management"
          />
          <Suspense fallback={<PageLoadingFallback />}>
            <WismachionApp />
          </Suspense>
        </div>
      ) : view === 'blog' ? (
        <>
          {console.log('🔥🔥🔥 [App.tsx] Rendering BlogListPage! view =', view)}
          <div className="pt-20">
            <SEO title="Blog List" description="" keywords="" noindex />
            <Suspense fallback={<PageLoadingFallback />}>
              <BlogListPage />
            </Suspense>
          </div>
        </>
      ) : view === 'blog-post' ? (
        <div className="pt-20">
          <SEO title="Blog Post" description="" keywords="" noindex />
          <ErrorBoundary>
            <Suspense fallback={<PageLoadingFallback />}>
              <BlogPostPage />
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : view === 'blog-admin' ? (
        <div className="pt-20">
          <SEO title="Blog Admin" description="" keywords="" noindex />
          <ErrorBoundary>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading Blog Management...</p>
                </div>
              </div>
            }>
              <BlogManagementPage />
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : (
        <>
          <SEO {...getPageSEO('home', language)} />
          <Hero />
          {/* ⚡ 首頁組件 - 移除 Suspense 以提升性能 */}
          <TrustBadges />
          <PopularServices />
          <CoreValues />
          <Services />
          <MilestoneFeature />
          <Process />
          <Testimonials />
          <TalentDirectory />
          <DevelopmentCategories />
          <WhoCanTakeOver />
          <Categories />
          <BrowseProjects />
          <Contact />
          <PlatformComparison />
          <WhitepaperDownload />
          <LatestSEOReports />
        </>
      )}
      <Footer />
      {/* 🌐 网络错误提示 - 检测到 Supabase 错误时显示 */}
      <NetworkErrorNotice />
      {/* ✅ 全局功能 - 使用 Suspense 但 fallback=null 避免閃爍 */}
      <Suspense fallback={null}>
        <AdminFloatingButton />
      </Suspense>
      <Suspense fallback={null}>
        <QuickAdminPanel />
      </Suspense>
      <Suspense fallback={null}>
        <AISEOFloatingButton />
      </Suspense>
      <Suspense fallback={null}>
        <AIChatbot language={chatbotLanguage} />
      </Suspense>
      {/* 🧪 開發模式登錄 - 僅在開發環境顯示 */}
      <DevModeLogin />
      <Toaster />
      {/* 🟢 LINE OAuth Email Modal */}
      <EmailRequiredModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        userId={lineUserId}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <ViewProvider>
            <AppContent />
          </ViewProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}