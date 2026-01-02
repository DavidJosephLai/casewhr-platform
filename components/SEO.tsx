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
