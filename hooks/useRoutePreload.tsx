/**
 * ⚡ 路由預加載 Hook
 * 智能預加載用戶可能訪問的頁面，提升導航體驗
 */

import { useEffect, useCallback, useRef } from 'react';
import { smartPreload, preloadRoute, performanceMonitor } from '../lib/performanceConfig';

interface UseRoutePreloadOptions {
  currentRoute: string;
  userType?: 'guest' | 'user' | 'admin';
  enabled?: boolean;
  delay?: number;
}

/**
 * 路由預加載 Hook
 * 
 * @example
 * ```tsx
 * // 在 App.tsx 或主要路由組件中使用
 * useRoutePreload({ 
 *   currentRoute: view, 
 *   userType: user ? 'user' : 'guest',
 *   enabled: true 
 * });
 * ```
 */
export function useRoutePreload({
  currentRoute,
  userType = 'guest',
  enabled = true,
  delay = 300,
}: UseRoutePreloadOptions) {
  const preloadedRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout>();

  // 手動預加載特定路由
  const preloadSpecificRoute = useCallback((routeName: string) => {
    if (preloadedRef.current.has(routeName)) {
      console.log(`⚡ [RoutePreload] Route ${routeName} already preloaded, skipping`);
      return;
    }

    const startTime = performance.now();
    console.log(`⚡ [RoutePreload] Starting preload for: ${routeName}`);

    preloadRoute(routeName);
    preloadedRef.current.add(routeName);

    // 測量預加載時間
    setTimeout(() => {
      performanceMonitor.measureComponentLoad(`Preload:${routeName}`, startTime);
    }, 100);
  }, []);

  // 自動預加載（基於當前路由）
  useEffect(() => {
    if (!enabled) return;

    // 清除之前的定時器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 延遲預加載，避免影響當前頁面性能
    timeoutRef.current = setTimeout(() => {
      console.log(`⚡ [RoutePreload] Auto-preloading for route: ${currentRoute}, userType: ${userType}`);
      smartPreload(currentRoute, userType);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentRoute, userType, enabled, delay]);

  // 滑鼠懸停預加載
  const onLinkHover = useCallback((routeName: string) => {
    if (!enabled) return;
    
    console.log(`🖱️ [RoutePreload] Link hover detected for: ${routeName}`);
    preloadSpecificRoute(routeName);
  }, [enabled, preloadSpecificRoute]);

  return {
    preloadRoute: preloadSpecificRoute,
    onLinkHover,
    preloadedRoutes: Array.from(preloadedRef.current),
  };
}

/**
 * 鏈接預加載 Hook
 * 用於為導航鏈接添加滑鼠懸停預加載功能
 * 
 * @example
 * ```tsx
 * const { getLinkProps } = useLinkPreload();
 * 
 * <a 
 *   href="/pricing" 
 *   {...getLinkProps('pricing')}
 * >
 *   Pricing
 * </a>
 * ```
 */
export function useLinkPreload() {
  const preloadedRef = useRef<Set<string>>(new Set());
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  const handleLinkHover = useCallback((routeName: string) => {
    if (preloadedRef.current.has(routeName)) {
      return;
    }

    // 延遲預加載，避免用戶只是快速掃過鏈接
    hoverTimeoutRef.current = setTimeout(() => {
      console.log(`🖱️ [LinkPreload] Preloading on hover: ${routeName}`);
      preloadRoute(routeName);
      preloadedRef.current.add(routeName);
    }, 100); // 100ms 延遲
  }, []);

  const handleLinkLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  }, []);

  const getLinkProps = useCallback((routeName: string) => {
    return {
      onMouseEnter: () => handleLinkHover(routeName),
      onMouseLeave: handleLinkLeave,
      // 也支持觸摸設備
      onTouchStart: () => handleLinkHover(routeName),
    };
  }, [handleLinkHover, handleLinkLeave]);

  return {
    getLinkProps,
    preloadedLinks: Array.from(preloadedRef.current),
  };
}

/**
 * 可見性預加載 Hook
 * 當組件進入視口時自動預加載相關路由
 * 
 * @example
 * ```tsx
 * const ref = useVisibilityPreload('pricing');
 * 
 * <div ref={ref}>
 *   查看定價方案
 * </div>
 * ```
 */
export function useVisibilityPreload(routeName: string, options = { threshold: 0.5 }) {
  const elementRef = useRef<HTMLElement>(null);
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasPreloadedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPreloadedRef.current) {
            console.log(`👁️ [VisibilityPreload] Element visible, preloading: ${routeName}`);
            preloadRoute(routeName);
            hasPreloadedRef.current = true;
          }
        });
      },
      {
        threshold: options.threshold,
        rootMargin: '100px', // 提前 100px 開始預加載
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [routeName, options.threshold]);

  return elementRef;
}

/**
 * 空閒時間預加載 Hook
 * 利用瀏覽器空閒時間預加載資源
 * 
 * @example
 * ```tsx
 * useIdlePreload(['pricing', 'dashboard', 'about']);
 * ```
 */
export function useIdlePreload(routes: string[], enabled = true) {
  const preloadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const handleIdle = (deadline: IdleDeadline) => {
      // 當有剩餘時間且時間充足時預加載
      while (deadline.timeRemaining() > 0 && routes.length > 0) {
        const route = routes.find(r => !preloadedRef.current.has(r));
        
        if (!route) break;

        console.log(`⏰ [IdlePreload] Preloading during idle time: ${route}`);
        preloadRoute(route);
        preloadedRef.current.add(route);
      }
    };

    // 使用 requestIdleCallback（如果支持）
    if ('requestIdleCallback' in window) {
      const idleCallbackId = requestIdleCallback(handleIdle, { timeout: 2000 });

      return () => {
        cancelIdleCallback(idleCallbackId);
      };
    } else {
      // 降級方案：使用 setTimeout
      const timeoutId = setTimeout(() => {
        routes.forEach(route => {
          if (!preloadedRef.current.has(route)) {
            console.log(`⏰ [IdlePreload] Preloading (fallback): ${route}`);
            preloadRoute(route);
            preloadedRef.current.add(route);
          }
        });
      }, 2000);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [routes, enabled]);

  return {
    preloadedRoutes: Array.from(preloadedRef.current),
  };
}

export default useRoutePreload;
