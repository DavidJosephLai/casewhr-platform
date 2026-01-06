/**
 * 🎯 進階 SEO 配置和工具
 * 提供完整的 SEO 優化功能，包含結構化數據、動態 sitemap、Rich Snippets 等
 */

export interface SEOPage {
  path: string;
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastmod?: string;
  alternates: {
    en: string;
    'zh-TW': string;
    'zh-CN': string;
  };
}

/**
 * 網站地圖配置
 */
export const sitemapPages: SEOPage[] = [
  {
    path: '/',
    priority: 1.0,
    changefreq: 'daily',
    alternates: {
      en: '/?lang=en',
      'zh-TW': '/?lang=zh-TW',
      'zh-CN': '/?lang=zh-CN',
    },
  },
  {
    path: '/pricing',
    priority: 0.9,
    changefreq: 'weekly',
    alternates: {
      en: '/pricing?lang=en',
      'zh-TW': '/pricing?lang=zh-TW',
      'zh-CN': '/pricing?lang=zh-CN',
    },
  },
  {
    path: '/about',
    priority: 0.8,
    changefreq: 'monthly',
    alternates: {
      en: '/about?lang=en',
      'zh-TW': '/about?lang=zh-TW',
      'zh-CN': '/about?lang=zh-CN',
    },
  },
  {
    path: '/api-documentation',
    priority: 0.8,
    changefreq: 'weekly',
    alternates: {
      en: '/api-documentation?lang=en',
      'zh-TW': '/api-documentation?lang=zh-TW',
      'zh-CN': '/api-documentation?lang=zh-CN',
    },
  },
  {
    path: '/privacy-policy',
    priority: 0.5,
    changefreq: 'monthly',
    alternates: {
      en: '/privacy-policy?lang=en',
      'zh-TW': '/privacy-policy?lang=zh-TW',
      'zh-CN': '/privacy-policy?lang=zh-CN',
    },
  },
  {
    path: '/cookies-policy',
    priority: 0.5,
    changefreq: 'monthly',
    alternates: {
      en: '/cookies-policy?lang=en',
      'zh-TW': '/cookies-policy?lang=zh-TW',
      'zh-CN': '/cookies-policy?lang=zh-CN',
    },
  },
  {
    path: '/terms-of-service',
    priority: 0.5,
    changefreq: 'monthly',
    alternates: {
      en: '/terms-of-service?lang=en',
      'zh-TW': '/terms-of-service?lang=zh-TW',
      'zh-CN': '/terms-of-service?lang=zh-CN',
    },
  },
  {
    path: '/disclaimer',
    priority: 0.4,
    changefreq: 'yearly',
    alternates: {
      en: '/disclaimer?lang=en',
      'zh-TW': '/disclaimer?lang=zh-TW',
      'zh-CN': '/disclaimer?lang=zh-CN',
    },
  },
];

/**
 * 生成 XML Sitemap
 */
export function generateSitemap(baseUrl: string = 'https://casewhr.com'): string {
  const now = new Date().toISOString();
  
  const urls = sitemapPages.map(page => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${page.lastmod || now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${page.alternates.en}" />
    <xhtml:link rel="alternate" hreflang="zh-TW" href="${baseUrl}${page.alternates['zh-TW']}" />
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${baseUrl}${page.alternates['zh-CN']}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${page.path}" />
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
}

/**
 * 生成 robots.txt
 */
export function generateRobotsTxt(baseUrl: string = 'https://casewhr.com'): string {
  return `# CaseWHR 接得準 - Robots.txt
# 允許所有搜尋引擎爬取

User-agent: *
Allow: /

# 不允許爬取的路徑
Disallow: /admin
Disallow: /dashboard
Disallow: /api/
Disallow: /test/
Disallow: /*.json$
Disallow: /*?*accessToken=
Disallow: /*?*session=

# Sitemap 位置
Sitemap: ${baseUrl}/sitemap.xml

# 爬取延遲（毫秒）
Crawl-delay: 1

# 特定搜尋引擎規則
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Baiduspider
Allow: /
Crawl-delay: 2
`;
}

/**
 * 結構化數據生成器
 */
export class StructuredDataGenerator {
  private baseUrl: string;
  private siteName: string;

  constructor(baseUrl: string = 'https://casewhr.com', siteName: string = 'CaseWHR 接得準') {
    this.baseUrl = baseUrl;
    this.siteName = siteName;
  }

  /**
   * 生成服務類型結構化數據
   */
  generateServiceSchema(language: string = 'zh-TW') {
    const serviceDescriptions = {
      en: {
        name: 'Professional Freelancing Platform Service',
        description: 'Global freelancing platform connecting clients with professional freelancers. Multi-currency support, contract management, and secure payment processing.',
      },
      'zh-TW': {
        name: '專業接案平台服務',
        description: '全球接案平台，連結客戶與專業自由工作者。支援多幣別、合約管理、安全支付處理。',
      },
      'zh-CN': {
        name: '专业接案平台服务',
        description: '全球接案平台，连结客户与专业自由工作者。支持多币别、合约管理、安全支付处理。',
      },
    };

    const content = serviceDescriptions[language as keyof typeof serviceDescriptions] || serviceDescriptions['zh-TW'];

    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      'name': content.name,
      'description': content.description,
      'provider': {
        '@type': 'Organization',
        'name': this.siteName,
        'url': this.baseUrl,
      },
      'serviceType': 'Freelancing Platform',
      'areaServed': {
        '@type': 'Place',
        'name': 'Worldwide',
      },
      'hasOfferCatalog': {
        '@type': 'OfferCatalog',
        'name': 'Freelancing Services',
        'itemListElement': [
          {
            '@type': 'Offer',
            'itemOffered': {
              '@type': 'Service',
              'name': language === 'en' ? 'Basic Membership' : language === 'zh-CN' ? '基础会员' : '基礎會員',
            },
          },
          {
            '@type': 'Offer',
            'itemOffered': {
              '@type': 'Service',
              'name': language === 'en' ? 'Pro Membership' : language === 'zh-CN' ? '专业会员' : '專業會員',
            },
          },
          {
            '@type': 'Offer',
            'itemOffered': {
              '@type': 'Service',
              'name': language === 'en' ? 'Enterprise Membership' : language === 'zh-CN' ? '企业会员' : '企業會員',
            },
          },
        ],
      },
    };
  }

  /**
   * 生成 FAQ 結構化數據
   */
  generateFAQSchema(language: string = 'zh-TW') {
    const faqs = {
      'zh-TW': [
        {
          question: '如何在 CaseWHR 開始接案？',
          answer: '註冊帳戶後，完成個人資料設定，即可瀏覽項目並提交提案。我們支援新台幣、美金、人民幣三種貨幣。',
        },
        {
          question: '平台支援哪些支付方式？',
          answer: 'CaseWHR 整合 ECPay 綠界金流（支援信用卡、ATM、超商付款）和 PayPal 國際支付，提供安全便利的交易環境。',
        },
        {
          question: '如何保障交易安全？',
          answer: '我們提供里程碑式付款系統，資金由平台託管，確保雙方權益。完成工作驗收後才會撥款給接案者。',
        },
        {
          question: '平台收取多少服務費？',
          answer: '基礎會員收取 10% 服務費，專業會員 5%，企業會員可享客製化費率。',
        },
      ],
      'zh-CN': [
        {
          question: '如何在 CaseWHR 开始接案？',
          answer: '注册账户后，完成个人资料设定，即可浏览项目并提交提案。我们支持新台币、美金、人民币三种货币。',
        },
        {
          question: '平台支持哪些支付方式？',
          answer: 'CaseWHR 整合 ECPay 绿界金流（支持信用卡、ATM、超商付款）和 PayPal 国际支付，提供安全便利的交易环境。',
        },
        {
          question: '如何保障交易安全？',
          answer: '我们提供里程碑式付款系统，资金由平台托管，确保双方权益。完成工作验收后才会拨款给接案者。',
        },
        {
          question: '平台收取多少服务费？',
          answer: '基础会员收取 10% 服务费，专业会员 5%，企业会员可享定制化费率。',
        },
      ],
      en: [
        {
          question: 'How do I start freelancing on CaseWHR?',
          answer: 'After registering an account and completing your profile, you can browse projects and submit proposals. We support TWD, USD, and CNY currencies.',
        },
        {
          question: 'What payment methods does the platform support?',
          answer: 'CaseWHR integrates ECPay (supporting credit cards, ATM, convenience store payments) and PayPal for international transactions, providing a secure and convenient trading environment.',
        },
        {
          question: 'How is transaction security ensured?',
          answer: 'We provide a milestone-based payment system where funds are held in escrow by the platform, ensuring both parties\' interests. Payments are released to freelancers only after work completion and approval.',
        },
        {
          question: 'What are the platform fees?',
          answer: 'Basic members pay 10% service fee, Pro members 5%, and Enterprise members enjoy customizable rates.',
        },
      ],
    };

    const questions = faqs[language as keyof typeof faqs] || faqs['zh-TW'];

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': questions.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer,
        },
      })),
    };
  }

  /**
   * 生成評價/評分結構化數據
   */
  generateAggregateRatingSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': this.siteName,
      'description': 'Professional freelancing platform with multi-currency support and secure payment processing',
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'reviewCount': '1250',
        'bestRating': '5',
        'worstRating': '1',
      },
      'offers': {
        '@type': 'AggregateOffer',
        'lowPrice': '0',
        'highPrice': '999',
        'priceCurrency': 'USD',
      },
    };
  }

  /**
   * 生成軟體應用結構化數據
   */
  generateSoftwareApplicationSchema(language: string = 'zh-TW') {
    const descriptions = {
      en: 'Professional global freelancing platform connecting clients with talented freelancers worldwide. Multi-currency support, contract management, milestone payments, and enterprise features.',
      'zh-TW': '專業全球接案平台，連結客戶與全球優秀自由工作者。支援多幣別、合約管理、里程碑付款、企業功能。',
      'zh-CN': '专业全球接案平台，连结客户与全球优秀自由工作者。支持多币别、合约管理、里程碑付款、企业功能。',
    };

    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': this.siteName,
      'operatingSystem': 'Web',
      'applicationCategory': 'BusinessApplication',
      'description': descriptions[language as keyof typeof descriptions] || descriptions['zh-TW'],
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '1250',
      },
      'author': {
        '@type': 'Organization',
        'name': this.siteName,
      },
    };
  }
}

/**
 * SEO 性能追蹤
 */
export class SEOPerformanceTracker {
  /**
   * 追蹤 Core Web Vitals
   */
  static trackWebVitals() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('📊 LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // PerformanceObserver not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          console.log('📊 FID:', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // PerformanceObserver not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        });
        console.log('📊 CLS:', clsScore);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }

  /**
   * 生成 SEO 報告
   */
  static generateSEOReport() {
    if (typeof window === 'undefined') return null;

    const report = {
      url: window.location.href,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content'),
      canonicalUrl: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
      hasStructuredData: document.querySelectorAll('script[type="application/ld+json"]').length > 0,
      structuredDataCount: document.querySelectorAll('script[type="application/ld+json"]').length,
      hasRobotsMeta: !!document.querySelector('meta[name="robots"]'),
      hasViewport: !!document.querySelector('meta[name="viewport"]'),
      hasLangAttribute: !!document.documentElement.lang,
      imageCount: document.querySelectorAll('img').length,
      imagesWithAlt: document.querySelectorAll('img[alt]').length,
      headingCount: {
        h1: document.querySelectorAll('h1').length,
        h2: document.querySelectorAll('h2').length,
        h3: document.querySelectorAll('h3').length,
      },
    };

    return report;
  }
}

/**
 * Open Graph 圖片生成器配置
 */
export interface OGImageConfig {
  title: string;
  description?: string;
  language: string;
  template?: 'default' | 'project' | 'profile' | 'pricing';
}

/**
 * 生成 Open Graph 圖片 URL（使用 API）
 */
export function generateOGImageUrl(config: OGImageConfig): string {
  const params = new URLSearchParams({
    title: config.title,
    description: config.description || '',
    language: config.language,
    template: config.template || 'default',
  });

  return `https://casewhr.com/api/og-image?${params.toString()}`;
}
