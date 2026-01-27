import { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';

type ViewType = 'home' | 'dashboard' | 'pricing' | 'admin' | 'brevo-test' | 'email-test' | 'env-check' | 'email-management' | 'email-integration' | 'stripe-env-check' | 'accept-invitation' | 'auth-callback' | 'reset-password' | 'auth-verify' | 'privacy-policy' | 'cookies-policy' | 'disclaimer' | 'about' | 'cases' | 'terms-of-service' | 'google-dns-verifier' | 'sla-documentation' | 'api-documentation' | 'auth-diagnostic' | 'simple-login-test' | 'figma-env-diagnostic' | 'ecpay-diagnostic' | 'google-oauth-test' | 'ai-seo' | 'ai-seo-test' | 'public-seo-report' | 'ai-seo-diagnostic' | 'keyword-research-test' | 'keyword-deployment-check' | 'openai-key-guide' | 'data-sync-diagnostic' | 'deep-data-diagnostic' | 'transfer-debug' | 'seo-content' | 'wismachion' | 'blog' | 'blog-post' | 'blog-admin';

interface ViewContextType {
  view: ViewType;
  setView: (view: ViewType) => void;
  manualOverride: boolean;
  setManualOverride: (override: boolean) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<ViewType>('home');
  const [manualOverride, setManualOverrideState] = useState(false);

  // Stable setView function
  const setView = useCallback((newView: ViewType) => {
    setViewState(newView);
  }, []);

  // Stable setManualOverride function
  const setManualOverride = useCallback((override: boolean) => {
    setManualOverrideState(override);
  }, []);

  // 監聽 URL 變化（包括 query parameters）
  useEffect(() => {
    const handleURLChange = () => {
      const hash = window.location.hash.slice(1); // 移除 # 符號
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get('view');
      const hostname = window.location.hostname;
      
      // 🔥 檢查是否是 Wismachion 子域名
      if (hostname === 'wismachion.com' || hostname === 'www.wismachion.com') {
        setView('wismachion');
        setManualOverride(true);
        return;
      }
      
      // 🔥 檢查是否是 Wismachion pathname
      if (pathname === '/wismachion' || pathname.startsWith('/wismachion/')) {
        setView('wismachion');
        setManualOverride(true);
        return;
      }
      
      // 🔥 優先檢查 query parameter ?view=xxx
      if (viewParam) {
        const validViews: ViewType[] = [
          'home', 'dashboard', 'pricing', 'admin', 'brevo-test', 'email-test', 
          'env-check', 'email-management', 'email-integration', 'stripe-env-check',
          'accept-invitation', 'auth-callback', 'reset-password', 'auth-verify',
          'privacy-policy', 'cookies-policy', 'disclaimer', 'about', 'cases',
          'terms-of-service', 'google-dns-verifier', 'sla-documentation',
          'api-documentation', 'auth-diagnostic', 'simple-login-test',
          'figma-env-diagnostic', 'ecpay-diagnostic', 'google-oauth-test',
          'ai-seo', 'ai-seo-test', 'public-seo-report', 'ai-seo-diagnostic',
          'keyword-research-test', 'keyword-deployment-check', 'openai-key-guide',
          'data-sync-diagnostic', 'deep-data-diagnostic', 'transfer-debug',
          'seo-content', 'wismachion', 'blog', 'blog-post', 'blog-admin'
        ];
        
        if (validViews.includes(viewParam as ViewType)) {
          setView(viewParam as ViewType);
          setManualOverride(true);
          return;
        }
      }
      
      // 優先檢查 pathname（用於 /reset-password 這類頁面）
      if (pathname.includes('/reset-password')) {
        setView('reset-password');
        setManualOverride(true);
        return;
      }
      
      // 🆕 檢查 seo-content 動態路由 (必須在其他路由之前)
      if (pathname.startsWith('/seo-content/')) {
        setView('seo-content');
        setManualOverride(true);
        return;
      }
      
      // 🔥 NEW: 檢查 auth/verify 路由
      if (pathname.includes('/auth/verify')) {
        setView('auth-verify');
        setManualOverride(true);
        return;
      }
      
      if (pathname.includes('/auth/callback')) {
        setView('auth-callback');
        setManualOverride(true);
        return;
      }
      
      if (pathname.includes('/team/accept-invitation')) {
        setView('accept-invitation');
        setManualOverride(true);
        return;
      }
      
      // 📝 檢查 Blog 路由
      if (pathname === '/blog') {
        setView('blog');
        setManualOverride(true);
        return;
      }
      
      if (pathname.startsWith('/blog/') && pathname !== '/blog/admin') {
        setView('blog-post');
        setManualOverride(true);
        return;
      }
      
      if (pathname === '/blog/admin') {
        setView('blog-admin');
        setManualOverride(true);
        return;
      }
      
      // 根據 hash 設置對應的 view
      const hashToView: Record<string, ViewType> = {
        'email-management': 'email-management',
        'admin': 'admin',
        'dashboard': 'dashboard',
        'pricing': 'pricing',
        'brevo-test': 'brevo-test',
        'email-test': 'email-test',
        'env-check': 'env-check',
        'email-integration': 'email-integration',
        'stripe-env-check': 'stripe-env-check',
        'accept-invitation': 'accept-invitation',
        'auth-callback': 'auth-callback',
        'reset-password': 'reset-password',
        'privacy-policy': 'privacy-policy',
        'cookies-policy': 'cookies-policy',
        'disclaimer': 'disclaimer',
        'about': 'about',
        'cases': 'cases',
        'terms-of-service': 'terms-of-service',
        'google-dns-verifier': 'google-dns-verifier',
        'sla-documentation': 'sla-documentation',
        'api-documentation': 'api-documentation',
        'auth-diagnostic': 'auth-diagnostic',
        'simple-login-test': 'simple-login-test',
        'figma-env-diagnostic': 'figma-env-diagnostic',
        'ecpay-diagnostic': 'ecpay-diagnostic',
        'google-oauth-test': 'google-oauth-test',
        'ai-seo': 'ai-seo',
        'ai-seo-test': 'ai-seo-test',
        'public-seo-report': 'public-seo-report',
        'ai-seo-diagnostic': 'ai-seo-diagnostic',
        'keyword-research-test': 'keyword-research-test',
        'keyword-deployment-check': 'keyword-deployment-check',
        'openai-key-guide': 'openai-key-guide',
        'data-sync-diagnostic': 'data-sync-diagnostic',
        'deep-data-diagnostic': 'deep-data-diagnostic',
        'transfer-debug': 'transfer-debug',
        'wismachion': 'wismachion',
        'blog': 'blog',
        'blog-post': 'blog-post',
        'blog-admin': 'blog-admin',
      };
      
      if (hash && hashToView[hash]) {
        setView(hashToView[hash]);
        setManualOverride(true);
      }
    };
    
    // 初始檢查
    handleURLChange();
    
    // 監聽各種 URL 變化
    window.addEventListener('hashchange', handleURLChange);
    window.addEventListener('popstate', handleURLChange);
    
    // 🔥 監聽 pushState 和 replaceState（處理 query parameters 變化）
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleURLChange();
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      handleURLChange();
    };
    
    return () => {
      window.removeEventListener('hashchange', handleURLChange);
      window.removeEventListener('popstate', handleURLChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [setView, setManualOverride]);

  const value = useMemo(() => ({
    view,
    setView,
    manualOverride,
    setManualOverride
  }), [view, setView, manualOverride, setManualOverride]);

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
}