import { useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  article?: boolean;
  noindex?: boolean;
  canonical?: string;
  type?: 'website' | 'article' | 'profile';
}

export function SEO({
  title,
  description,
  keywords,
  image,
  article = false,
  noindex = false,
  canonical,
  type = 'website',
}: SEOProps) {
  const { language } = useLanguage();

  // 基礎資訊
  const siteUrl = 'https://casewhr.com';
  const siteName = 'CaseWHR 接得準';
  
  // 使用 window.location 替代 useLocation()
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
  const currentUrl = `${siteUrl}${currentPath}${currentSearch}`;
  const canonicalUrl = canonical || currentUrl;

  // 多語言內容
  const seoContent = {
    en: {
      defaultTitle: 'CaseWHR - Global Professional Freelancing Platform',
      defaultDescription: 'Leading global freelancing platform from Taiwan. Professional talent matching service with multi-currency support (TWD, USD, CNY). Integrated with ECPay and PayPal. Complete contract management, invoice system, and enterprise branding. Over 10,000 professional freelancers worldwide.',
      defaultKeywords: 'freelancing platform, remote work, freelancer, outsourcing, global freelancing, contract management, invoice system, Taiwan freelance, ECPay, PayPal, professional services, remote jobs, freelance marketplace',
      siteName: 'CaseWHR - Professional Freelancing Platform',
    },
    'zh-TW': {
      defaultTitle: 'CaseWHR 接得準 - 全球專業接案平台 | 台灣最佳自由工作者媒合平台',
      defaultDescription: '台灣領先的全球接案平台，提供專業的自由工作者媒合服務。支援新台幣、美金、人民幣三幣計價，整合 ECPay 綠界金流與 PayPal 國際支付。包含合約管理、發票系統、企業品牌客製化等完整功能。超過 10,000 位專業人才，服務遍及全球。',
      defaultKeywords: '接案平台, 自由工作者, 台灣接案, 遠距工作, 外包平台, 接案網站, 斜槓工作, 兼職平台, 專案外包, 在家工作, 接案媒合, 人才平台, 台灣外包, 綠界金流, ECPay, 合約管理, 發票系統, 企業品牌, 專業接案, 線上外包',
      siteName: 'CaseWHR 接得準 - 專業接案平台',
    },
    'zh-CN': {
      defaultTitle: 'CaseWHR 接得准 - 全球专业接案平台 | 台湾最佳自由工作者媒合平台',
      defaultDescription: '台湾领先的全球接案平台，提供专业的自由工作者媒合服务。支持新台币、美金、人民币三币计价，整合 ECPay 绿界金流与 PayPal 国际支付。包含合约管理、发票系统、企业品牌定制等完整功能。超过 10,000 位专业人才，服务遍及全球。',
      defaultKeywords: '接案平台, 自由工作者, 台湾接案, 远程工作, 外包平台, 接案网站, 斜杠工作, 兼职平台, 项目外包, 在家工作, 接案媒合, 人才平台, 台湾外包, 绿界金流, ECPay, 合约管理, 发票系统, 企业品牌, 专业接案, 线上外包',
      siteName: 'CaseWHR 接得准 - 专业接案平台',
    },
  };

  const content = seoContent[language as keyof typeof seoContent] || seoContent['zh-TW'];

  const finalTitle = title ? `${title} | ${siteName}` : content.defaultTitle;
  const finalDescription = description || content.defaultDescription;
  const finalKeywords = keywords || content.defaultKeywords;
  const finalImage = image || `${siteUrl}/og-image.png`;

  // 語言代碼映射
  const langCode = language === 'en' ? 'en' : language === 'zh-CN' ? 'zh-CN' : 'zh-TW';
  const ogLocale = language === 'en' ? 'en_US' : language === 'zh-CN' ? 'zh_CN' : 'zh_TW';

  // 使用 useEffect 更新 meta 標籤
  useEffect(() => {
    // 更新 title
    document.title = finalTitle;

    // 更新 html lang 属性
    document.documentElement.lang = langCode;

    // 輔助函數：設置或更新 meta 標籤
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // 輔助函數：設置或更新 link 標籤
    const setLink = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang 
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]`;
      
      let element = document.querySelector(selector) as HTMLLinkElement;
      
      if (!element) {
        element = document.createElement('link');
        element.rel = rel;
        if (hreflang) element.hreflang = hreflang;
        document.head.appendChild(element);
      }
      
      element.href = href;
    };

    // 基本 Meta 標籤
    setMeta('description', finalDescription);
    setMeta('keywords', finalKeywords);

    // Robots
    if (noindex) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      setMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
      setMeta('googlebot', 'index, follow');
      setMeta('bingbot', 'index, follow');
    }

    // Canonical URL
    setLink('canonical', canonicalUrl);

    // Open Graph / Facebook
    setMeta('og:type', type, true);
    setMeta('og:url', currentUrl, true);
    setMeta('og:title', finalTitle, true);
    setMeta('og:description', finalDescription, true);
    setMeta('og:image', finalImage, true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    setMeta('og:image:alt', finalTitle, true);
    setMeta('og:site_name', siteName, true);
    setMeta('og:locale', ogLocale, true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:url', currentUrl);
    setMeta('twitter:title', finalTitle);
    setMeta('twitter:description', finalDescription);
    setMeta('twitter:image', finalImage);
    setMeta('twitter:image:alt', finalTitle);
    setMeta('twitter:site', '@CaseWHR');
    setMeta('twitter:creator', '@CaseWHR');

    // 多語言替代版本
    setLink('alternate', `${siteUrl}${currentPath}?lang=en`, 'en');
    setLink('alternate', `${siteUrl}${currentPath}?lang=zh-TW`, 'zh-TW');
    setLink('alternate', `${siteUrl}${currentPath}?lang=zh-CN`, 'zh-CN');
    setLink('alternate', `${siteUrl}${currentPath}`, 'x-default');

    // 地理和語言
    setMeta('language', langCode);
    setMeta('geo.region', 'TW');
    setMeta('geo.placename', 'Taiwan');

    // Theme Color
    setMeta('theme-color', '#17a2b8');
    setMeta('msapplication-TileColor', '#17a2b8');

    // 結構化數據
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName,
      alternateName: language === 'en' ? 'CaseWHR' : 'CaseWHR 接得準',
      url: siteUrl,
      logo: `${siteUrl}/logo-512.png`,
      description: finalDescription,
      sameAs: [
        'https://www.facebook.com/casewhr',
        'https://twitter.com/casewhr',
        'https://www.linkedin.com/company/casewhr',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        availableLanguage: ['English', 'Traditional Chinese', 'Simplified Chinese'],
        areaServed: 'Worldwide',
      },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'TW',
        addressRegion: 'Taiwan',
      },
    };

    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: siteUrl,
      description: finalDescription,
      inLanguage: langCode,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: language === 'en' ? 'Home' : language === 'zh-CN' ? '首页' : '首頁',
          item: siteUrl,
        },
      ],
    };

    // 插入或更新結構化數據
    const insertSchema = (id: string, schema: object) => {
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    };

    insertSchema('schema-organization', organizationSchema);
    insertSchema('schema-website', websiteSchema);
    insertSchema('schema-breadcrumb', breadcrumbSchema);

  }, [
    finalTitle, 
    finalDescription, 
    finalKeywords, 
    finalImage, 
    langCode, 
    ogLocale, 
    canonicalUrl, 
    currentUrl, 
    type, 
    noindex, 
    language, 
    currentPath, 
    siteUrl, 
    siteName
  ]);

  // 這個組件不渲染任何 DOM，只是副作用
  return null;
}

// 🎯 getPageSEO - 為不同頁面提供預設 SEO 配置
export function getPageSEO(page: string, language: string): SEOProps {
  const seoMap: Record<string, Record<string, Omit<SEOProps, 'noindex'>>> = {
    home: {
      en: {
        title: 'CaseWHR - Global Professional Freelancing Platform',
        description: 'Leading global freelancing platform from Taiwan. Professional talent matching service with multi-currency support (TWD, USD, CNY). Integrated with ECPay and PayPal.',
        keywords: 'freelancing platform, remote work, freelancer, outsourcing, global freelancing',
      },
      'zh-TW': {
        title: 'CaseWHR 接得準 - 全球專業接案平台',
        description: '台灣領先的全球接案平台，提供專業的自由工作者媒合服務。支援新台幣、美金、人民幣三幣計價。',
        keywords: '接案平台, 自由工作者, 台灣接案, 遠距工作, 外包平台',
      },
      'zh-CN': {
        title: 'CaseWHR 接得准 - 全球专业接案平台',
        description: '台湾领先的全球接案平台，提供专业的自由工作者媒合服务。支持新台币、美金、人民币三币计价。',
        keywords: '接案平台, 自由工作者, 台湾接案, 远程工作, 外包平台',
      },
    },
    dashboard: {
      en: {
        title: 'Dashboard',
        description: 'Manage your projects, proposals, and account',
        keywords: 'dashboard, account, projects',
      },
      'zh-TW': {
        title: '儀表板',
        description: '管理您的項目、提案和帳戶',
        keywords: '儀表板, 帳戶, 項目',
      },
      'zh-CN': {
        title: '仪表板',
        description: '管理您的项目、提案和账户',
        keywords: '仪表板, 账户, 项目',
      },
    },
    pricing: {
      en: {
        title: 'Pricing Plans',
        description: 'Choose the perfect plan for your needs',
        keywords: 'pricing, subscription, plans, membership',
      },
      'zh-TW': {
        title: '會員方案',
        description: '選擇最適合您的方案',
        keywords: '定價, 訂閱, 方案, 會員',
      },
      'zh-CN': {
        title: '会员方案',
        description: '选择最适合您的方案',
        keywords: '定价, 订阅, 方案, 会员',
      },
    },
    'privacy-policy': {
      en: {
        title: 'Privacy Policy',
        description: 'How we collect, use, and protect your data',
        keywords: 'privacy, policy, data protection, GDPR',
      },
      'zh-TW': {
        title: '隱私權政策',
        description: '我們如何收集、使用和保護您的數據',
        keywords: '隱私, 政策, 數據保護',
      },
      'zh-CN': {
        title: '隐私权政策',
        description: '我们如何收集、使用和保护您的数据',
        keywords: '隐私, 政策, 数据保护',
      },
    },
    'cookies-policy': {
      en: {
        title: 'Cookies Policy',
        description: 'How we use cookies on our website',
        keywords: 'cookies, policy, tracking',
      },
      'zh-TW': {
        title: 'Cookies 政策',
        description: '我們如何在網站上使用 Cookies',
        keywords: 'cookies, 政策, 追蹤',
      },
      'zh-CN': {
        title: 'Cookies 政策',
        description: '我们如何在网站上使用 Cookies',
        keywords: 'cookies, 政策, 追踪',
      },
    },
    disclaimer: {
      en: {
        title: 'Disclaimer',
        description: 'Important disclaimers and limitations',
        keywords: 'disclaimer, terms, limitations',
      },
      'zh-TW': {
        title: '免責聲明',
        description: '重要的免責聲明和限制',
        keywords: '免責聲明, 條款, 限制',
      },
      'zh-CN': {
        title: '免责声明',
        description: '重要的免责声明和限制',
        keywords: '免责声明, 条款, 限制',
      },
    },
    about: {
      en: {
        title: 'About Us',
        description: 'Learn more about CaseWHR and our mission',
        keywords: 'about, company, mission, team',
      },
      'zh-TW': {
        title: '關於我們',
        description: '了解更多關於 CaseWHR 和我們的使命',
        keywords: '關於, 公司, 使命, 團隊',
      },
      'zh-CN': {
        title: '关于我们',
        description: '了解更多关于 CaseWHR 和我们的使命',
        keywords: '关于, 公司, 使命, 团队',
      },
    },
    'terms-of-service': {
      en: {
        title: 'Terms of Service',
        description: 'Terms and conditions for using CaseWHR',
        keywords: 'terms, service, conditions, agreement',
      },
      'zh-TW': {
        title: '服務條款',
        description: '使用 CaseWHR 的條款和條件',
        keywords: '條款, 服務, 條件, 協議',
      },
      'zh-CN': {
        title: '服务条款',
        description: '使用 CaseWHR 的条款和条件',
        keywords: '条款, 服务, 条件, 协议',
      },
    },
    'api-documentation': {
      en: {
        title: 'API Documentation',
        description: 'Complete API reference for CaseWHR Platform. RESTful API for projects, proposals, payments, invoices, and more. Multi-currency support with ECPay and PayPal integration.',
        keywords: 'API documentation, REST API, API reference, developer docs, API integration, CaseWHR API, freelancing API, payment API, invoice API',
      },
      'zh-TW': {
        title: 'API 說明文檔',
        description: 'CaseWHR 平台完整 API 參考文檔。提供專案、提案、付款、發票等 RESTful API。支援多幣別計價，整合 ECPay 和 PayPal。',
        keywords: 'API 文檔, REST API, API 參考, 開發者文檔, API 整合, CaseWHR API, 接案 API, 付款 API, 發票 API',
      },
      'zh-CN': {
        title: 'API 说明文档',
        description: 'CaseWHR 平台完整 API 参考文档。提供项目、提案、付款、发票等 RESTful API。支持多币别计价，整合 ECPay 和 PayPal。',
        keywords: 'API 文档, REST API, API 参考, 开发者文档, API 整合, CaseWHR API, 接案 API, 付款 API, 发票 API',
      },
    },
  };

  const lang = language === 'zh' ? 'zh-TW' : language;
  const pageSEO = seoMap[page]?.[lang] || seoMap[page]?.['zh-TW'] || seoMap['home'][lang];

  return pageSEO;
}