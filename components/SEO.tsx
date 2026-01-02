import { Helmet } from 'react-helmet-async';
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

  // 結構化數據 - Organization
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

  // 結構化數據 - WebSite
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description: finalDescription,
    inLanguage: language === 'en' ? 'en' : language === 'zh-CN' ? 'zh-CN' : 'zh-TW',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // 結構化數據 - BreadcrumbList
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

  // 語言代碼映射
  const langCode = language === 'en' ? 'en' : language === 'zh-CN' ? 'zh-CN' : 'zh-TW';
  const ogLocale = language === 'en' ? 'en_US' : language === 'zh-CN' ? 'zh_CN' : 'zh_TW';

  return (
    <Helmet>
      {/* 基本 Meta 標籤 */}
      <html lang={langCode} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <>
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          <meta name="googlebot" content="index, follow" />
          <meta name="bingbot" content="index, follow" />
        </>
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={finalTitle} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content="en_US" />
      <meta property="og:locale:alternate" content="zh_TW" />
      <meta property="og:locale:alternate" content="zh_CN" />

      {/* Article Meta (if applicable) */}
      {article && (
        <>
          <meta property="article:publisher" content={siteUrl} />
          <meta property="article:author" content={siteName} />
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:image:alt" content={finalTitle} />
      <meta name="twitter:site" content="@CaseWHR" />
      <meta name="twitter:creator" content="@CaseWHR" />

      {/* 多語言替代版本 */}
      <link rel="alternate" hreflang="en" href={`${siteUrl}${currentPath}?lang=en`} />
      <link rel="alternate" hreflang="zh-TW" href={`${siteUrl}${currentPath}?lang=zh-TW`} />
      <link rel="alternate" hreflang="zh-CN" href={`${siteUrl}${currentPath}?lang=zh-CN`} />
      <link rel="alternate" hreflang="x-default" href={`${siteUrl}${currentPath}`} />

      {/* 地理和語言 */}
      <meta name="language" content={langCode} />
      <meta name="geo.region" content="TW" />
      <meta name="geo.placename" content="Taiwan" />

      {/* 結構化數據 */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>

      {/* PWA & Mobile */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="CaseWHR" />
      <meta name="application-name" content="CaseWHR" />

      {/* Theme Color */}
      <meta name="theme-color" content="#17a2b8" />
      <meta name="msapplication-TileColor" content="#17a2b8" />
    </Helmet>
  );
}