/**
 * ⚡ 性能優化配置
 * 為 casewhr.com 平台提供代碼分割和預加載策略
 */

// 預加載策略：根據用戶行為預測並預加載可能訪問的頁面
export const preloadStrategies = {
  // 首頁訪問者最可能訪問的頁面
  home: ['pricing', 'dashboard', 'about'],
  
  // Dashboard 用戶最可能訪問的頁面
  dashboard: ['pricing', 'admin'],
  
  // 定價頁面訪問者最可能訪問的頁面
  pricing: ['dashboard'],
  
  // 管理員最可能訪問的頁面
  admin: ['dashboard'],
};

// 路由優先級配置（數字越小優先級越高）
export const routePriority = {
  home: 1,        // 最高優先級
  pricing: 2,     // 高優先級（轉化關鍵頁面）
  dashboard: 2,   // 高優先級（核心功能）
  about: 3,       // 中優先級
  admin: 4,       // 低優先級（僅管理員）
  'auth-callback': 5,  // 最低優先級（一次性訪問）
};

// Bundle 大小閾值（KB）
export const bundleSizeThresholds = {
  warning: 244,   // 244KB - Vite 默認警告閾值
  error: 500,     // 500KB - 需要優化
  critical: 1000, // 1MB - 嚴重問題
};

// 懶加載延遲配置（毫秒）
export const lazyLoadDelays = {
  immediate: 0,      // 立即加載
  fast: 100,         // 快速加載（100ms）
  normal: 300,       // 正常加載（300ms）
  slow: 1000,        // 慢速加載（1s）
};

// 預加載工具函數
export const preloadRoute = (routeName: string) => {
  console.log(`⚡ [Performance] Preloading route: ${routeName}`);
  
  // 根據路由名稱動態導入
  const routeModules: Record<string, () => Promise<any>> = {
    dashboard: () => import('../components/Dashboard'),
    pricing: () => import('../components/PricingPage'),
    admin: () => import('../pages/AdminPage'),
    about: () => import('../components/AboutPage'),
  };
  
  const loader = routeModules[routeName];
  if (loader) {
    loader().catch((error) => {
      console.warn(`⚠️ [Performance] Failed to preload ${routeName}:`, error);
    });
  }
};

// 基於用戶行為的智能預加載
export const smartPreload = (currentRoute: string, userType: 'guest' | 'user' | 'admin' = 'guest') => {
  const routes = preloadStrategies[currentRoute as keyof typeof preloadStrategies] || [];
  
  // 根據用戶類型調整預加載策略
  const adjustedRoutes = routes.filter(route => {
    if (userType === 'guest' && route === 'admin') return false;
    if (userType === 'user' && route === 'admin') return false;
    return true;
  });
  
  // 延遲預加載，避免影響當前頁面性能
  setTimeout(() => {
    adjustedRoutes.forEach(route => preloadRoute(route));
  }, lazyLoadDelays.normal);
};

// 性能監控工具
export const performanceMonitor = {
  // 測量組件加載時間
  measureComponentLoad: (componentName: string, startTime: number) => {
    const loadTime = performance.now() - startTime;
    console.log(`📊 [Performance] ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    
    if (loadTime > 1000) {
      console.warn(`⚠️ [Performance] ${componentName} loading is slow (${loadTime.toFixed(2)}ms)`);
    }
    
    return loadTime;
  },
  
  // 測量頁面切換時間
  measureRouteChange: (fromRoute: string, toRoute: string, startTime: number) => {
    const changeTime = performance.now() - startTime;
    console.log(`🔀 [Performance] Route change ${fromRoute} → ${toRoute} took ${changeTime.toFixed(2)}ms`);
    
    return changeTime;
  },
  
  // 獲取當前性能指標
  getMetrics: () => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        // 頁面加載時間
        pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
        // DOM 內容加載時間
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        // 首次渲染時間
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        // 首次內容渲染時間
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    }
    
    return null;
  },
  
  // 打印性能報告
  printReport: () => {
    const metrics = performanceMonitor.getMetrics();
    
    if (metrics) {
      console.group('📊 Performance Report');
      console.log('Page Load Time:', `${metrics.pageLoadTime.toFixed(2)}ms`);
      console.log('DOM Content Loaded:', `${metrics.domContentLoaded.toFixed(2)}ms`);
      console.log('First Paint:', `${metrics.firstPaint.toFixed(2)}ms`);
      console.log('First Contentful Paint:', `${metrics.firstContentfulPaint.toFixed(2)}ms`);
      console.groupEnd();
    }
  },
};

// 圖片懶加載配置
export const imageLazyLoadConfig = {
  // Intersection Observer 選項
  observerOptions: {
    root: null,
    rootMargin: '50px', // 提前 50px 開始加載
    threshold: 0.01,
  },
  
  // 圖片佔位符
  placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3C/svg%3E',
};

// Vite 構建優化建議
export const viteBuildOptimizations = {
  // 分包策略
  manualChunks: {
    // React 核心庫
    'react-vendor': ['react', 'react-dom'],
    
    // UI 組件庫
    'ui-components': [
      './components/ui/button',
      './components/ui/card',
      './components/ui/dialog',
      './components/ui/input',
      './components/ui/select',
      './components/ui/table',
    ],
    
    // 業務組件
    'business-components': [
      './components/Dashboard',
      './components/PricingPage',
      './components/AdminPanel',
    ],
    
    // 工具庫
    'utils': [
      './lib/translations',
      './lib/currency',
      './lib/exchangeRate',
    ],
  },
  
  // 壓縮選項
  minify: 'terser' as const,
  terserOptions: {
    compress: {
      drop_console: false, // 保留 console（開發階段）
      drop_debugger: true, // 移除 debugger
    },
  },
};

// 緩存策略
export const cacheStrategies = {
  // 靜態資源緩存（1年）
  staticAssets: {
    maxAge: 31536000,
    types: ['js', 'css', 'woff', 'woff2', 'ttf', 'eot'],
  },
  
  // 圖片緩存（30天）
  images: {
    maxAge: 2592000,
    types: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  },
  
  // API 緩存（5分鐘）
  api: {
    maxAge: 300,
    staleWhileRevalidate: 600,
  },
};

export default {
  preloadStrategies,
  routePriority,
  bundleSizeThresholds,
  lazyLoadDelays,
  preloadRoute,
  smartPreload,
  performanceMonitor,
  imageLazyLoadConfig,
  viteBuildOptimizations,
  cacheStrategies,
};
