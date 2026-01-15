/**
 * SEO Head Component
 * 品牌域名關聯組件
 * 主域名：casewhr.com
 * 重定向域名：casewhere.com.tw → casewhr.com
 */

import { useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';

export function SEOHead() {
  const { language } = useLanguage();

  useEffect(() => {
    // 更新語言特定的 meta tags
    updateLanguageMeta();

    // 添加結構化數據（JSON-LD）- 包含品牌關聯
    addStructuredData();

  }, [language]);

  const updateLanguageMeta = () => {
    // 更新 title
    document.title = getTitle();

    // 更新 description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', getDescription());
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      metaDesc.setAttribute('content', getDescription());
      document.head.appendChild(metaDesc);
    }

    // 更新 keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', getKeywords());
    }
  };

  const getTitle = () => {
    const titles = {
      'en': 'CaseWhr - Global Freelance Platform | Professional Talent Marketplace',
      'zh-TW': 'CaseWhr 接得準 - 全球專業接案平台 | 台灣最佳自由工作者媒合平台',
      'zh-CN': 'CaseWhr 接得准 - 全球专业接案平台 | 自由职业者人才市场',
    };
    return titles[language as keyof typeof titles] || titles['zh-TW'];
  };

  const getDescription = () => {
    const descriptions = {
      'en': 'Leading global freelance platform connecting businesses with professional talent. Multi-currency support (USD/TWD/CNY), integrated payments, contract management, and enterprise solutions. Join 10,000+ professionals worldwide.',
      'zh-TW': '台灣領先的全球接案平台，提供專業的自由工作者媒合服務。支援新台幣、美金、人民幣三幣計價，整合 ECPay 綠界金流與 PayPal 國際支付。包含合約管理、發票系統、企業品牌客製化等完整功能。超過 10,000 位專業人才，服務遍及全球。',
      'zh-CN': '领先的全球接案平台，连接企业与专业人才。支持多币种计价（USD/TWD/CNY），整合支付、合约管理、企业解决方案。超过 10,000 位专业人才。',
    };
    return descriptions[language as keyof typeof descriptions] || descriptions['zh-TW'];
  };

  const getKeywords = () => {
    const keywords = {
      'en': 'freelance platform, remote work, global freelancing, talent marketplace, project outsourcing, freelancer, casewhr, casewhere',
      'zh-TW': '接案平台, 自由工��者, 台灣接案, 遠距工作, 外包平台, 接案網站, 斜槓工作, 兼職平台, 專案外包, 在家工作, 接案媒合, 人才平台, 台灣外包, 綠界金流, ECPay, freelance, remote work, global freelancing, 合約管理, 發票系統, casewhr, casewhere, 接得準',
      'zh-CN': '接案平台, 自由职业者, 远程工作, 外包平台, 项目外包, 人才市场, freelance, remote work, casewhr',
    };
    return keywords[language as keyof typeof keywords] || keywords['zh-TW'];
  };

  const addStructuredData = () => {
    // 移除舊的結構化數據
    const oldScript = document.querySelector('script[type="application/ld+json"]#brand-schema');
    if (oldScript) {
      oldScript.remove();
    }

    // 創建新的結構化數據 - 包含品牌關聯
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'CaseWhr 接得準',
      'alternateName': ['CaseWhere', '接得準', '接案平台'],
      'url': 'https://casewhr.com',
      'description': getDescription(),
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': 'https://casewhr.com/search?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      },
      // 品牌關聯：說明 casewhere.com.tw 重定向到 casewhr.com
      'sameAs': [
        'https://casewhr.com',
        'https://www.casewhere.com.tw'
      ],
      'inLanguage': ['en', 'zh-TW', 'zh-CN'],
      'publisher': {
        '@type': 'Organization',
        'name': 'CaseWhr',
        'url': 'https://casewhr.com',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://casewhr.com/logo.png'
        },
        'contactPoint': {
          '@type': 'ContactPoint',
          'email': 'support@casewhr.com',
          'contactType': 'Customer Support',
          'areaServed': 'Worldwide',
          'availableLanguage': ['English', 'Traditional Chinese', 'Simplified Chinese']
        }
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'brand-schema';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  };

  return null; // 此組件不渲染任何內容
}