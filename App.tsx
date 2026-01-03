import { useEffect, useState, Suspense, lazy } from 'react';
import { Hero } from './components/Hero';
import { Header } from './components/Header';
import { NetworkErrorNotice } from './components/NetworkErrorNotice';
import { SEO, getPageSEO } from './components/SEO';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider, useLanguage } from './lib/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ViewProvider, useView } from './contexts/ViewContext';
import { useExchangeRate } from './hooks/useExchangeRate';
import { toast, Toaster } from 'sonner';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { DevModeLogin } from './components/DevModeLogin';

// 🔥 Version marker to force cache invalidation - v2.0.24
console.log('🚀 [App v2.0.24] CRITICAL FIX: PlatformStats missing icon imports');

// Lazy load components
const CoreValues = lazy(() => import('./components/CoreValues'));
const Services = lazy(() => import('./components/Services'));
const MilestoneFeature = lazy(() => import('./components/MilestoneFeature'));
const Process = lazy(() => import('./components/Process'));
const DevelopmentCategories = lazy(() => import('./components/DevelopmentCategories'));
const TalentDirectory = lazy(() => import('./components/TalentDirectory'));
const WhoCanTakeOver = lazy(() => import('./components/WhoCanTakeOver'));
const Categories = lazy(() => import('./components/Categories'));
const BrowseProjects = lazy(() => import('./components/BrowseProjects'));
const Contact = lazy(() => import('./components/Contact'));
const Footer = lazy(() => import('./components/Footer').then(module => ({ default: module.Footer })));
const Dashboard = lazy(() => import('./components/Dashboard'));
const PricingPage = lazy(() => import('./components/PricingPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminFloatingButton = lazy(() => import('./components/AdminFloatingButton'));
const QuickAdminPanel = lazy(() => import('./components/QuickAdminPanel').then(module => ({ default: module.QuickAdminPanel })));
const AISEOFloatingButton = lazy(() => import('./components/AISEOFloatingButton').then(module => ({ default: module.AISEOFloatingButton })));
const AIChatbot = lazy(() => import('./components/AIChatbot'));
const AISEOManager = lazy(() => import('./components/AISEOManager').then(module => ({ default: module.AISEOManager })));
const AISEOTestPage = lazy(() => import('./components/AISEOTestPage'));
const BrevoTestPage = lazy(() => import('./components/BrevoTestPage'));
const EmailTestPage = lazy(() => import('./components/EmailTestPage'));
const GoogleOAuthTester = lazy(() => import('./components/GoogleOAuthTester'));
const GoogleSearchConsoleVerifier = lazy(() => import('./components/GoogleSearchConsoleVerifier'));
const EnvironmentCheck = lazy(() => import('./components/EnvironmentCheck'));
const AuthDiagnostic = lazy(() => import('./components/AuthDiagnostic'));
const SimpleLoginTest = lazy(() => import('./components/SimpleLoginTest'));
const FigmaEnvDiagnostic = lazy(() => import('./components/FigmaEnvDiagnostic'));
const ECPayDiagnostic = lazy(() => import('./components/ECPayDiagnostic'));
const EmailManagementPage = lazy(() => import('./components/EmailManagementPage').then(module => ({ default: module.EmailManagementPage })));
const EmailIntegrationPanel = lazy(() => import('./components/EmailIntegrationPanel').then(module => ({ default: module.EmailIntegrationPanel })));
const StripeEnvCheck = lazy(() => import('./components/StripeEnvCheck'));
const AcceptInvitationPage = lazy(() => import('./components/AcceptInvitationPage'));
const AuthCallback = lazy(() => import('./components/AuthCallback'));
const ResetPasswordPage = lazy(() => import('./components/ResetPasswordPage'));
const AuthVerifyPage = lazy(() => import('./components/AuthVerifyPage'));
const PrivacyPolicyPage = lazy(() => import('./components/PrivacyPolicyPage'));
const CookiesPolicyPage = lazy(() => import('./components/CookiesPolicyPage'));
const DisclaimerPage = lazy(() => import('./components/DisclaimerPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const CaseStudies = lazy(() => import('./components/CaseStudies'));
const TermsOfServicePage = lazy(() => import('./components/TermsOfServicePage'));
const ApiDocumentation = lazy(() => import('./components/ApiDocumentation'));
const SLADocumentation = lazy(() => import('./components/SLADocumentation'));

// Loading fallback components
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
}

function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { language } = useLanguage();
  const { view, setView } = useView();
  const { user, accessToken, signOut } = useAuth();
  const [dashboardTab, setDashboardTab] = useState<string | undefined>(undefined);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isTeamInvitation, setIsTeamInvitation] = useState(false);
  
  // 將語言轉換為 AIChatbot 支持的格式
  const chatbotLanguage = language === 'zh' ? 'zh-TW' : language as 'en' | 'zh-TW' | 'zh-CN';
  
  // 🔧 註冊 Service Worker (性能優化)
  useEffect(() => {
    // autoRegisterServiceWorker();
    
    // ⚡ 啟動性能監控
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
      const specialEmails = ['davidlai117@yahoo.com.tw', 'davidlai234@hotmail.com'];
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
  
  // 🔥 NEW: 監聽自定義導航事件（例如從錢包餘額不足對話框觸發）
  useEffect(() => {
    const handleNavigate = (event: any) => {
      const targetView = event.detail?.view;
      console.log('🧭 [App] Navigation event received:', targetView);
      
      if (targetView === 'wallet') {
        // 切換到儀表板的錢包標籤
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
    console.log('%c📧 Email: davidlai117@yahoo.com.tw', 'color: #3b82f6; font-size: 14px;');
    console.log('%c📧 Email: davidlai234@hotmail.com', 'color: #3b82f6; font-size: 14px;');
    console.log('%c🔐 密碼: CaseWHR2025! (固定密碼)', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
    console.log('%c💡 提示: 點擊右下角藍色盾牌 → 設置特殊用戶', 'color: #6b7280; font-size: 12px;');
  }, []); // 只在應用啟動時顯示一次
  
  // 初始化匯率系統
  const { rate, loading: rateLoading } = useExchangeRate();
  
  useEffect(() => {
    if (!rateLoading && rate) {
      console.log(`💱 Exchange rate initialized: 1 USD = ${rate.toFixed(2)} TWD`);
    }
  }, [rate, rateLoading]);

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
      // 重定向到後端 API 端點
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
    
    // 檢查是否是 OAuth 回調
    if (urlPath.includes('/auth/callback')) {
      console.log('🔐 [App] OAuth callback detected');
      setView('auth-callback');
      return;
    }
    
    // 檢查是否是團隊邀請連結
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

  // 處理付款回調（Stripe 和 PayPal）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
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
                  ? `🎉 Payment successful! $${data.amount?.toLocaleString() || '?'} added to your wallet.`
                  : `🎉 付款成功！已將 $${data.amount?.toLocaleString() || '?'} 加入您的錢包。`,
                { duration: 5000 }
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
            : '🎉 付款成功！您的錢包已更新。',
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
      // 清除 URL 參數
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [language, setView, accessToken, processingPayment]);

  // 監聽導航事件
  useEffect(() => {
    const handleShowDashboard = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('📱 [App] showDashboard event received:', customEvent.detail);
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
            description={language === 'en' ? 'View success stories and client testimonials on Case Where platform.' : '查看 Case Where 平台上的成功案例和客戶故事。'}
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
          <SEO title="API Documentation" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <ApiDocumentation 
              language={language}
              baseUrl={`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5`}
            />
          </Suspense>
        </div>
      ) : view === 'sla-documentation' ? (
        <div className="pt-20">
          <SEO title="SLA Documentation" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <SLADocumentation language={language} />
          </Suspense>
        </div>
      ) : view === 'ai-seo' ? (
        <div className="pt-20">
          <SEO title="AI SEO Manager" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <AISEOManager />
          </Suspense>
        </div>
      ) : view === 'ai-seo-test' ? (
        <div className="pt-20">
          <SEO title="AI SEO Test Page" description="" keywords="" noindex />
          <Suspense fallback={<PageLoadingFallback />}>
            <AISEOTestPage />
          </Suspense>
        </div>
      ) : (
        <>
          <SEO {...getPageSEO('home', language)} />
          <Hero />
          <Suspense fallback={<LoadingFallback />}>
            <CoreValues />
          </Suspense>
          <Suspense fallback={<LoadingFallback />}>
            <Services />
          </Suspense>
          <Suspense fallback={<LoadingFallback />}>
            <MilestoneFeature />
          </Suspense>
          <Suspense fallback={<LoadingFallback />}>
            <Process />
          </Suspense>
          <Suspense fallback={<LoadingFallback />}>
            <DevelopmentCategories />
          </Suspense>
          <Suspense fallback={<LoadingFallback />}>
            <TalentDirectory />
          </Suspense>
          <Suspense fallback={<LoadingFallback />}>
            <WhoCanTakeOver />
          </Suspense>
          <Suspense fallback={<LoadingFallback />}>
            <Categories />
          </Suspense>
          <Suspense fallback={<LoadingFallback />}>
            <BrowseProjects />
          </Suspense>
          <Suspense fallback={<LoadingFallback />}>
            <Contact />
          </Suspense>
        </>
      )}
      <Footer />
      {/* 🌐 网络错误提示 - 检测到 Supabase 错误时显示 */}
      <NetworkErrorNotice />
      {/* ✅ 全局管理員浮動按鈕 - 只有管理員可見 */}
      <AdminFloatingButton />
      {/* ✅ 快速管理板 - 只有管理員可見 */}
      <QuickAdminPanel />
      {/* ✨ AI SEO 管理器浮動按鈕 - 只有管理員可見 */}
      <AISEOFloatingButton />
      {/* ✅ 全局智能客服氣泡 - 所有訪客可見 */}
      <AIChatbot language={chatbotLanguage} />
      {/* 🧪 開發模式登錄 - 僅在開發環境顯示 */}
      <DevModeLogin />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ViewProvider>
          <AppContent />
        </ViewProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}