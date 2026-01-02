import { useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
}

export function SEOHead({
  title,
  description,
  keywords,
  image = 'https://casewhr.com/og-image.png',
  url = 'https://casewhr.com',
  type = 'website'
}: SEOHeadProps) {
  const { language } = useLanguage();

  // SEO Content by Language
  const seoContent = {
    en: {
      title: 'CaseWHR - Global Freelance Platform | Connect with Top Talent Worldwide',
      description: 'Professional global freelancing platform connecting businesses with skilled freelancers. Support for TWD/USD/CNY, secure payments, contract management, and enterprise features. Join 10,000+ professionals worldwide.',
      keywords: 'freelance platform, global freelancing, hire freelancers, remote work, gig economy, freelance jobs, digital marketplace, contract work, freelance marketplace, remote jobs, online freelancing, freelancer hiring, project outsourcing, independent contractors, work from home, freelance services, talent marketplace, virtual jobs, freelance network, international freelancing, cross-border payments, multi-currency platform, TWD USD CNY payments, PayPal ECPay, secure freelancing, professional services marketplace, enterprise freelancing',
      siteName: 'CaseWHR',
      tagline: 'Professional Global Freelancing Platform'
    },
    'zh-TW': {
      title: 'CaseWHR 接得準 - 全球專業接案平台 | 台灣最佳自由工作者媒合平台',
      description: '台灣領先的全球接案平台，提供專業的自由工作者媒合服務。支援新台幣、美金、人民幣三幣計價，整合 ECPay 綠界金流與 PayPal 國際支付。包含合約管理、發票系統、企業品牌客製化等完整功能。超過 10,000 位專業人才，服務遍及全球。',
      keywords: '接案平台, 自由工作者, 台灣接案, 遠距工作, 外包平台, 接案網站, 斜槓工作, 兼職平台, 專案外包, 在家工作, 接案媒合, 人才平台, 台灣外包, 接案社群, 遠端工作, SOHO 族, 自由職業者, 專業服務, 接案市集, 台灣人才, 綠界金流, ECPay, 新台幣支付, 合約管理, 發票系統, 企業接案, 專業接案, 國際接案, 跨境支付, 多幣別平台, 台灣freelance, 接案工作, 自由接案, 案件媒合, 外包工作, 遠距接案, 線上接案, 專案合作, 人才媒合, 技能接案, 設計接案, 程式接案, 文案接案, 翻譯接案, 行銷接案, 影片剪輯接案, 網頁設計接案, APP 開發接案, UI UX 設計接案',
      siteName: 'CaseWHR 接得準',
      tagline: '全球專業接案平台'
    },
    'zh-CN': {
      title: 'CaseWHR - 全球专业外包平台 | 连接优秀自由职业者与企业',
      description: '专业的全球自由职业者平台，连接企业与技能人才。支持人民币、美元、新台币三币计价，安全支付保障。包含合同管理、发票系统、企业定制等完整功能。超过 10,000 位专业人才，服务遍及全球。',
      keywords: '外包平台, 自由职业者, 远程工作, 兼职平台, 项目外包, 在家工作, 人才平台, 威客平台, 远程办公, SOHO, 自由职业, 专业服务, 技能市场, 国际外包, 跨境支付, 多币种平台, 人民币支付, 美元支付, PayPal, 合同管理, 发票系统, 企业外包, 专业外包, 国际freelance, 外包工作, 自由接案, 项目合作, 人才匹配, 技能外包, 设计外包, 程序外包, 文案外包, 翻译外包, 营销外包, 视频剪辑外包, 网页设计外包, APP 开发外包, UI UX 设计外包, 在线接单, 威客网站, 远程招聘, 灵活用工',
      siteName: 'CaseWHR',
      tagline: '全球专业外包平台'
    }
  };

  const content = seoContent[language as keyof typeof seoContent] || seoContent.en;
  const finalTitle = title || content.title;
  const finalDescription = description || content.description;
  const finalKeywords = keywords || content.keywords;

  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Standard Meta Tags
    updateMetaTag('description', finalDescription);
    updateMetaTag('keywords', finalKeywords);
    updateMetaTag('author', 'CaseWHR Team');
    updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateMetaTag('language', language);
    
    // Geographic Targeting
    if (language === 'zh-TW') {
      updateMetaTag('geo.region', 'TW');
      updateMetaTag('geo.placename', 'Taiwan');
      updateMetaTag('geo.position', '25.0330;121.5654'); // Taipei coordinates
      updateMetaTag('ICBM', '25.0330, 121.5654');
    }

    // Open Graph (Facebook, LinkedIn)
    updateMetaTag('og:title', finalTitle, true);
    updateMetaTag('og:description', finalDescription, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:site_name', content.siteName, true);
    updateMetaTag('og:locale', language === 'en' ? 'en_US' : language === 'zh-CN' ? 'zh_CN' : 'zh_TW', true);
    
    // Alternate locales
    if (language === 'zh-TW') {
      updateMetaTag('og:locale:alternate', 'en_US', true);
      updateMetaTag('og:locale:alternate', 'zh_CN', true);
    }

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', finalTitle);
    updateMetaTag('twitter:description', finalDescription);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:site', '@CaseWHR');
    updateMetaTag('twitter:creator', '@CaseWHR');

    // Additional SEO Meta Tags
    updateMetaTag('application-name', 'CaseWHR');
    updateMetaTag('apple-mobile-web-app-title', 'CaseWHR');
    updateMetaTag('format-detection', 'telephone=no');
    
    // Business Information
    updateMetaTag('classification', 'Business, Technology, Services');
    updateMetaTag('coverage', 'Worldwide');
    updateMetaTag('distribution', 'Global');
    updateMetaTag('rating', 'General');
    updateMetaTag('target', 'all');

    // Mobile App Links (Deep Linking)
    updateMetaTag('al:web:url', url, true);

  }, [finalTitle, finalDescription, finalKeywords, language, url, image, type, content.siteName]);

  // Add JSON-LD Structured Data for better SEO
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        // Organization Schema
        {
          '@type': 'Organization',
          '@id': 'https://casewhr.com/#organization',
          name: 'CaseWHR',
          alternateName: language === 'zh-TW' ? '接得準' : 'CaseWHR',
          url: 'https://casewhr.com',
          logo: {
            '@type': 'ImageObject',
            url: 'https://casewhr.com/logo.png',
            width: 512,
            height: 512
          },
          description: finalDescription,
          sameAs: [
            'https://www.facebook.com/casewhr',
            'https://twitter.com/casewhr',
            'https://www.linkedin.com/company/casewhr',
            'https://www.instagram.com/casewhr'
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            availableLanguage: ['English', 'Traditional Chinese', 'Simplified Chinese'],
            email: 'support@casewhr.com'
          }
        },
        // Website Schema
        {
          '@type': 'WebSite',
          '@id': 'https://casewhr.com/#website',
          url: 'https://casewhr.com',
          name: content.siteName,
          description: finalDescription,
          publisher: {
            '@id': 'https://casewhr.com/#organization'
          },
          inLanguage: language === 'en' ? 'en-US' : language === 'zh-CN' ? 'zh-CN' : 'zh-TW',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://casewhr.com/search?q={search_term_string}'
            },
            'query-input': 'required name=search_term_string'
          }
        },
        // Service Schema
        {
          '@type': 'Service',
          '@id': 'https://casewhr.com/#service',
          serviceType: 'Freelance Marketplace Platform',
          provider: {
            '@id': 'https://casewhr.com/#organization'
          },
          areaServed: {
            '@type': 'Place',
            name: 'Worldwide'
          },
          availableChannel: {
            '@type': 'ServiceChannel',
            serviceUrl: 'https://casewhr.com',
            availableLanguage: ['en', 'zh-TW', 'zh-CN']
          },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free to join and browse projects'
          }
        },
        // BreadcrumbList Schema
        {
          '@type': 'BreadcrumbList',
          '@id': 'https://casewhr.com/#breadcrumb',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://casewhr.com'
            }
          ]
        },
        // Local Business (Taiwan focus)
        ...(language === 'zh-TW' ? [{
          '@type': 'LocalBusiness',
          '@id': 'https://casewhr.com/#localbusiness',
          name: 'CaseWHR 接得準',
          image: 'https://casewhr.com/logo.png',
          '@id': 'https://casewhr.com',
          url: 'https://casewhr.com',
          telephone: '+886-2-xxxx-xxxx',
          priceRange: '$$',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Taipei',
            addressRegion: 'TW',
            addressCountry: 'TW'
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 25.0330,
            longitude: 121.5654
          },
          openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday'
            ],
            opens: '00:00',
            closes: '23:59'
          },
          sameAs: [
            'https://www.facebook.com/casewhr',
            'https://twitter.com/casewhr',
            'https://www.linkedin.com/company/casewhr'
          ]
        }] : [])
      ]
    };

    // Remove existing script if any
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [language, finalDescription, content.siteName]);

  // Add hreflang tags for international SEO
  useEffect(() => {
    const hreflangs = [
      { lang: 'en', url: 'https://casewhr.com?lang=en' },
      { lang: 'zh-TW', url: 'https://casewhr.com?lang=zh-TW' },
      { lang: 'zh-CN', url: 'https://casewhr.com?lang=zh-CN' },
      { lang: 'x-default', url: 'https://casewhr.com' }
    ];

    // Remove existing hreflang tags
    document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());

    // Add new hreflang tags
    hreflangs.forEach(({ lang, url }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = url;
      document.head.appendChild(link);
    });
  }, []);

  // Add canonical URL
  useEffect(() => {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    
    canonical.href = url;
  }, [url]);

  return null; // This is a headless component
}
