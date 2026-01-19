import { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';

type ViewType = 'home' | 'dashboard' | 'pricing' | 'admin' | 'brevo-test' | 'email-test' | 'env-check' | 'email-management' | 'email-integration' | 'stripe-env-check' | 'accept-invitation' | 'auth-callback' | 'reset-password' | 'auth-verify' | 'privacy-policy' | 'cookies-policy' | 'disclaimer' | 'about' | 'cases' | 'terms-of-service' | 'google-dns-verifier' | 'sla-documentation' | 'api-documentation' | 'auth-diagnostic' | 'simple-login-test' | 'figma-env-diagnostic' | 'ecpay-diagnostic' | 'google-oauth-test' | 'ai-seo' | 'ai-seo-test' | 'public-seo-report' | 'ai-seo-diagnostic' | 'keyword-research-test' | 'keyword-deployment-check' | 'openai-key-guide' | 'data-sync-diagnostic' | 'deep-data-diagnostic' | 'transfer-debug' | 'seo-content' | 'wismachion';

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
    console.log('🔄 [ViewContext] Setting view to:', newView);
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
      
      console.log('🔗 [ViewContext] URL changed:');
      console.log('   - Pathname:', pathname);
      console.log('   - Hash:', hash);
      console.log('   - View param:', viewParam);
      
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
          'seo-content', 'wismachion'
        ];
        
        if (validViews.includes(viewParam as ViewType)) {
          console.log('✅ [ViewContext] Switching to view from query param:', viewParam);
          setView(viewParam as ViewType);
          setManualOverride(true);
          return;
        }
      }
      
      // 優先檢查 pathname（用於 /reset-password 這類頁面）
      if (pathname.includes('/reset-password')) {
        console.log('✅ [ViewContext] Reset password page detected, switching view');
        setView('reset-password');
        setManualOverride(true);
        return;
      }
      
      // 🆕 檢查 seo-content 動態路由 (必須在其他路由之前)
      if (pathname.startsWith('/seo-content/')) {
        console.log('✅ [ViewContext] SEO content page detected, switching view');
        setView('seo-content');
        setManualOverride(true);
        return;
      }
      
      // 🔥 NEW: 檢查 auth/verify 路由
      if (pathname.includes('/auth/verify')) {
        console.log('✅ [ViewContext] Auth verify page detected, switching view');
        setView('auth-verify');
        setManualOverride(true);
        return;
      }
      
      if (pathname.includes('/auth/callback')) {
        console.log('✅ [ViewContext] Auth callback detected, switching view');
        setView('auth-callback');
        setManualOverride(true);
        return;
      }
      
      if (pathname.includes('/team/accept-invitation')) {
        console.log('✅ [ViewContext] Accept invitation detected, switching view');
        setView('accept-invitation');
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
      };
      
      if (hash && hashToView[hash]) {
        console.log('✅ [ViewContext] Switching to view from hash:', hashToView[hash]);
        setView(hashToView[hash]);
        setManualOverride(true);
      } else if (hash === '' && pathname === '/' && !viewParam) {
        // ⚠️ FIX: 只有在非手動覆蓋模式下才切換到 home
        // 這樣可以防止儀表板被自動重定向
        console.log('🏠 [ViewContext] Empty hash on root path - checking manual override');
        // 不強制重定向，保持當前視圖
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