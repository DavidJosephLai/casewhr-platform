/**
 * 🖥️ Server-Side Rendering (SSR) 配置
 * 为 Vercel 部署优化的 SSR 实现
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';

interface SSRContext {
  url: string;
  statusCode?: number;
  redirect?: string;
}

interface SSRResult {
  html: string;
  statusCode: number;
  redirect?: string;
  meta?: {
    title?: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
  };
}

/**
 * 渲染 React 应用为 HTML 字符串
 */
export async function renderToString(
  App: React.ComponentType,
  context: SSRContext
): Promise<SSRResult> {
  const { url } = context;

  try {
    // 创建路由上下文
    const routerContext: any = {};

    // 渲染应用
    const appHtml = ReactDOMServer.renderToString(
      React.createElement(
        StaticRouter,
        { location: url, context: routerContext },
        React.createElement(App)
      )
    );

    // 检查重定向
    if (routerContext.url) {
      return {
        html: '',
        statusCode: 302,
        redirect: routerContext.url,
      };
    }

    return {
      html: appHtml,
      statusCode: routerContext.statusCode || 200,
    };
  } catch (error) {
    console.error('❌ [SSR] Error rendering:', error);
    
    return {
      html: '<div>Error rendering page</div>',
      statusCode: 500,
    };
  }
}

/**
 * 生成完整的 HTML 文档
 */
export function generateHTMLDocument(
  appHtml: string,
  options: {
    title?: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
    lang?: string;
    scripts?: string[];
    styles?: string[];
    preloadLinks?: string[];
    initialState?: Record<string, any>;
  } = {}
): string {
  const {
    title = 'CaseWhr - Professional Global Freelancing Platform',
    description = '全球專業接案平台，支援三幣計價系統（TWD/USD/CNY）和完整的支付生態系統',
    ogImage = 'https://casewhr.com/og-image.jpg',
    canonical = 'https://casewhr.com',
    lang = 'zh-TW',
    scripts = [],
    styles = [],
    preloadLinks = [],
    initialState = {},
  } = options;

  // 生成预加载链接
  const preloadLinksHtml = preloadLinks
    .map(href => `<link rel="preload" href="${href}" as="script" crossorigin>`)
    .join('\n    ');

  // 生成样式链接
  const stylesHtml = styles
    .map(href => `<link rel="stylesheet" href="${href}">`)
    .join('\n    ');

  // 生成脚本标签
  const scriptsHtml = scripts
    .map(src => `<script type="module" src="${src}"></script>`)
    .join('\n    ');

  // 序列化初始状态
  const initialStateScript = Object.keys(initialState).length > 0
    ? `<script>window.__INITIAL_STATE__ = ${JSON.stringify(initialState).replace(/</g, '\\u003c')};</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    
    <!-- SEO Meta Tags -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="freelancing, 接案, 專案外包, remote work, TWD, USD, CNY" />
    <link rel="canonical" href="${canonical}" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="CaseWhr" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />
    
    <!-- Theme & Icons -->
    <meta name="theme-color" content="#17a2b8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Preload Links -->
    ${preloadLinksHtml}
    
    <!-- Styles -->
    ${stylesHtml}
    
    <!-- Initial State -->
    ${initialStateScript}
    
    <!-- DNS Prefetch -->
    <link rel="dns-prefetch" href="https://supabase.co" />
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "CaseWhr",
      "url": "${canonical}",
      "description": "${description}",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "${canonical}/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>
  </head>
  <body>
    <div id="root">${appHtml}</div>
    
    <!-- Scripts -->
    ${scriptsHtml}
  </body>
</html>`;
}

/**
 * 获取页面元数据
 */
export function getPageMetadata(path: string): {
  title: string;
  description: string;
  ogImage?: string;
} {
  const metadata: Record<string, any> = {
    '/': {
      title: 'CaseWhr - 接得準專業接案平台 | 全球自由職業者平台',
      description: '專業的全球接案平台，支援三幣計價系統（TWD/USD/CNY），提供安全的支付保障和完整的專案管理工具。',
    },
    '/browse': {
      title: '瀏覽專案 - CaseWhr',
      description: '瀏覽數千個優質專案，找到適合您技能的接案機會。支援多種分類和技能篩選。',
    },
    '/pricing': {
      title: '定價方案 - CaseWhr',
      description: '選擇適合您的訂閱方案，享受更多接案機會和專業服務。Free、Pro、Enterprise 三個級別。',
    },
    '/dashboard': {
      title: '控制台 - CaseWhr',
      description: '管理您的專案、提案和收入。追蹤進度，與客戶溝通，掌控您的自由職業生涯。',
    },
    '/about': {
      title: '關於我們 - CaseWhr',
      description: '了解 CaseWhr 的使命和願景，我們致力於為全球自由職業者提供最佳的接案平台。',
    },
    '/contact': {
      title: '聯絡我們 - CaseWhr',
      description: '有任何問題或建議？立即聯絡我們的客服團隊，我們隨時為您服務。',
    },
  };

  // 匹配最接近的路徑
  const exactMatch = metadata[path];
  if (exactMatch) return exactMatch;

  // 動態路由匹配
  if (path.startsWith('/project/')) {
    return {
      title: '專案詳情 - CaseWhr',
      description: '查看專案詳細資訊，提交您的提案，開始您的接案之旅。',
    };
  }

  if (path.startsWith('/user/')) {
    return {
      title: '用戶資料 - CaseWhr',
      description: '查看用戶的專業技能、作品集和評價。',
    };
  }

  // 默認元數據
  return {
    title: 'CaseWhr - Professional Global Freelancing Platform',
    description: '全球專業接案平台，支援三幣計價系統（TWD/USD/CNY）和完整的支付生態系統',
  };
}

/**
 * 提取關鍵 CSS（Critical CSS）
 */
export function extractCriticalCSS(html: string, css: string): string {
  // 簡化的 Critical CSS 提取
  // 在生產環境中，可以使用 critical 或 critters 等工具
  
  const usedSelectors = new Set<string>();
  
  // 提取 HTML 中使用的類名
  const classMatches = html.matchAll(/class="([^"]+)"/g);
  for (const match of classMatches) {
    const classes = match[1].split(' ');
    classes.forEach(cls => usedSelectors.add(`.${cls}`));
  }
  
  // 提取 HTML 中使用的 ID
  const idMatches = html.matchAll(/id="([^"]+)"/g);
  for (const match of idMatches) {
    usedSelectors.add(`#${match[1]}`);
  }
  
  // 過濾 CSS 規則
  const criticalRules: string[] = [];
  const cssRules = css.split('}');
  
  for (const rule of cssRules) {
    if (!rule.trim()) continue;
    
    const [selector, ...declarations] = rule.split('{');
    if (!selector || !declarations.length) continue;
    
    const selectorTrim = selector.trim();
    
    // 檢查是否使用
    for (const used of usedSelectors) {
      if (selectorTrim.includes(used)) {
        criticalRules.push(`${selector.trim()}{${declarations.join('{').trim()}}`);
        break;
      }
    }
  }
  
  return criticalRules.join('\n');
}

/**
 * 生成 Sitemap
 */
export function generateSitemap(urls: string[]): string {
  const now = new Date().toISOString();
  
  const urlEntries = urls.map(url => `
  <url>
    <loc>https://casewhr.com${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${url === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlEntries}
</urlset>`;
}

/**
 * 生成 robots.txt
 */
export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /

Sitemap: https://casewhr.com/sitemap.xml

# 不索引管理後台
Disallow: /admin/
Disallow: /dashboard/settings/

# 不索引 API
Disallow: /api/

# 爬蟲速率限制
Crawl-delay: 1`;
}

export default {
  renderToString,
  generateHTMLDocument,
  getPageMetadata,
  extractCriticalCSS,
  generateSitemap,
  generateRobotsTxt,
};
