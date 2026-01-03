/**
 * Performance Monitor Utility
 * 
 * ⚡ 性能監控工具
 * 
 * 功能：
 * - ✅ First Contentful Paint (FCP) 監測
 * - ✅ Largest Contentful Paint (LCP) 監測
 * - ✅ Cumulative Layout Shift (CLS) 監測
 * - ✅ First Input Delay (FID) 監測
 * - ✅ Time to Interactive (TTI) 監測
 * 
 * @version 1.0.0
 * @date 2025-01-01
 */

// 性能指標類型
export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  tti?: number; // Time to Interactive
  ttfb?: number; // Time to First Byte
}

// 性能評級
export type PerformanceRating = 'good' | 'needs-improvement' | 'poor';

// 性能閾值（根據 Google Web Vitals）
export const PERFORMANCE_THRESHOLDS = {
  fcp: { good: 1800, poor: 3000 }, // FCP: <1.8s 好, >3s 差
  lcp: { good: 2500, poor: 4000 }, // LCP: <2.5s 好, >4s 差
  cls: { good: 0.1, poor: 0.25 },  // CLS: <0.1 好, >0.25 差
  fid: { good: 100, poor: 300 },   // FID: <100ms 好, >300ms 差
  ttfb: { good: 800, poor: 1800 }, // TTFB: <0.8s 好, >1.8s 差
};

/**
 * 獲取性能評級
 */
export function getPerformanceRating(
  metric: keyof typeof PERFORMANCE_THRESHOLDS,
  value: number
): PerformanceRating {
  const threshold = PERFORMANCE_THRESHOLDS[metric];
  if (value <= threshold.good) return 'good';
  if (value >= threshold.poor) return 'poor';
  return 'needs-improvement';
}

/**
 * 監聽性能指標
 */
export function observePerformance(
  callback: (metrics: PerformanceMetrics) => void
): void {
  const metrics: PerformanceMetrics = {};

  // 1. 監聽 FCP (First Contentful Paint)
  if ('PerformanceObserver' in window) {
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = entry.startTime;
            console.log('⚡ FCP:', metrics.fcp.toFixed(2), 'ms');
            callback({ ...metrics });
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // 2. 監聽 LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        console.log('⚡ LCP:', metrics.lcp.toFixed(2), 'ms');
        callback({ ...metrics });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // 3. 監聽 CLS (Cumulative Layout Shift)
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        });
        metrics.cls = clsScore;
        console.log('⚡ CLS:', metrics.cls.toFixed(4));
        callback({ ...metrics });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // 4. 監聽 FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          metrics.fid = entry.processingStart - entry.startTime;
          console.log('⚡ FID:', metrics.fid.toFixed(2), 'ms');
          callback({ ...metrics });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.error('Performance Observer error:', error);
    }
  }

  // 5. 獲取 TTFB (Time to First Byte)
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    metrics.ttfb = timing.responseStart - timing.requestStart;
    console.log('⚡ TTFB:', metrics.ttfb.toFixed(2), 'ms');
    callback({ ...metrics });
  }

  // 6. 使用 Navigation Timing API 獲取詳細指標
  if ('performance' in window && 'getEntriesByType' in window.performance) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          console.log('📊 Navigation Timing:');
          console.log('  DNS 查詢:', (navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2), 'ms');
          console.log('  TCP 連接:', (navigation.connectEnd - navigation.connectStart).toFixed(2), 'ms');
          console.log('  請求時間:', (navigation.responseStart - navigation.requestStart).toFixed(2), 'ms');
          console.log('  響應時間:', (navigation.responseEnd - navigation.responseStart).toFixed(2), 'ms');
          console.log('  DOM 解析:', (navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart).toFixed(2), 'ms');
          console.log('  資源載入:', (navigation.loadEventEnd - navigation.loadEventStart).toFixed(2), 'ms');
        }
      }, 0);
    });
  }
}

/**
 * 獲取性能摘要
 */
export function getPerformanceSummary(metrics: PerformanceMetrics): string {
  const ratings: string[] = [];

  if (metrics.fcp) {
    const rating = getPerformanceRating('fcp', metrics.fcp);
    ratings.push(`FCP: ${metrics.fcp.toFixed(0)}ms (${rating})`);
  }

  if (metrics.lcp) {
    const rating = getPerformanceRating('lcp', metrics.lcp);
    ratings.push(`LCP: ${metrics.lcp.toFixed(0)}ms (${rating})`);
  }

  if (metrics.cls !== undefined) {
    const rating = getPerformanceRating('cls', metrics.cls);
    ratings.push(`CLS: ${metrics.cls.toFixed(4)} (${rating})`);
  }

  if (metrics.fid) {
    const rating = getPerformanceRating('fid', metrics.fid);
    ratings.push(`FID: ${metrics.fid.toFixed(0)}ms (${rating})`);
  }

  return ratings.join(' | ');
}

/**
 * 計算總體性能評分（0-100）
 */
export function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  let totalScore = 0;
  let count = 0;

  // FCP 評分 (0-25)
  if (metrics.fcp) {
    const fcpScore = Math.max(0, 25 - (metrics.fcp / 1800) * 25);
    totalScore += fcpScore;
    count++;
  }

  // LCP 評分 (0-25)
  if (metrics.lcp) {
    const lcpScore = Math.max(0, 25 - (metrics.lcp / 2500) * 25);
    totalScore += lcpScore;
    count++;
  }

  // CLS 評分 (0-25)
  if (metrics.cls !== undefined) {
    const clsScore = Math.max(0, 25 - (metrics.cls / 0.1) * 25);
    totalScore += clsScore;
    count++;
  }

  // FID 評分 (0-25)
  if (metrics.fid) {
    const fidScore = Math.max(0, 25 - (metrics.fid / 100) * 25);
    totalScore += fidScore;
    count++;
  }

  return count > 0 ? Math.round((totalScore / count) * 4) : 0; // 轉換為 0-100
}

/**
 * 性能報告生成器
 */
export function generatePerformanceReport(metrics: PerformanceMetrics): void {
  console.log('\n📊 ========== 性能報告 ==========');
  console.log('🕐 時間:', new Date().toLocaleString('zh-TW'));
  console.log('\n📈 核心 Web Vitals:');
  
  if (metrics.fcp) {
    const rating = getPerformanceRating('fcp', metrics.fcp);
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`  ${emoji} FCP: ${metrics.fcp.toFixed(2)} ms (${rating})`);
  }
  
  if (metrics.lcp) {
    const rating = getPerformanceRating('lcp', metrics.lcp);
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`  ${emoji} LCP: ${metrics.lcp.toFixed(2)} ms (${rating})`);
  }
  
  if (metrics.cls !== undefined) {
    const rating = getPerformanceRating('cls', metrics.cls);
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`  ${emoji} CLS: ${metrics.cls.toFixed(4)} (${rating})`);
  }
  
  if (metrics.fid) {
    const rating = getPerformanceRating('fid', metrics.fid);
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`  ${emoji} FID: ${metrics.fid.toFixed(2)} ms (${rating})`);
  }

  if (metrics.ttfb) {
    const rating = getPerformanceRating('ttfb', metrics.ttfb);
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`  ${emoji} TTFB: ${metrics.ttfb.toFixed(2)} ms (${rating})`);
  }

  const score = calculatePerformanceScore(metrics);
  console.log(`\n⭐ 總體評分: ${score}/100`);
  
  let stars = '';
  if (score >= 90) stars = '⭐⭐⭐⭐⭐ (優秀)';
  else if (score >= 75) stars = '⭐⭐⭐⭐ (良好)';
  else if (score >= 50) stars = '⭐⭐⭐ (尚可)';
  else if (score >= 25) stars = '⭐⭐ (需改進)';
  else stars = '⭐ (較差)';
  
  console.log(`   ${stars}`);
  console.log('=====================================\n');
}

/**
 * 自動啟動性能監控
 */
export function startPerformanceMonitoring(): void {
  console.log('🚀 啟動性能監控...');
  
  const metricsCache: PerformanceMetrics = {};
  
  observePerformance((metrics) => {
    Object.assign(metricsCache, metrics);
  });

  // 頁面載入完成後生成報告
  window.addEventListener('load', () => {
    setTimeout(() => {
      generatePerformanceReport(metricsCache);
    }, 2000); // 等待 2 秒以收集所有指標
  });
}
