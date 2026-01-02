/**
 * 🔍 SEO Hook
 * 動態更新頁面的 SEO 元數據
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOOptions {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

/**
 * SEO Hook
 * 
 * @example
 * ```tsx
 * function ProjectPage({ project }) {
 *   useSEO({
 *     title: `${project.title} - CaseWhr`,
 *     description: project.description,
 *     ogImage: project.imageUrl,
 *     ogType: 'article',
 *   });
 * 
 *   return <div>...</div>;
 * }
 * ```
 */
export function useSEO(options: SEOOptions = {}) {
  const location = useLocation();
  
  const {
    title,
    description,
    keywords,
    ogImage,
    ogType = 'website',
    canonical,
    noindex = false,
    nofollow = false,
  } = options;

  useEffect(() => {
    // 更新 title
    if (title) {
      document.title = title;
    }

    // 更新或創建 meta 標籤
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // 更新 description
    if (description) {
      updateMetaTag('description', description);
      updateMetaTag('og:description', description, true);
      updateMetaTag('twitter:description', description);
    }

    // 更新 keywords
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // 更新 Open Graph
    if (title) {
      updateMetaTag('og:title', title, true);
      updateMetaTag('twitter:title', title);
    }

    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
      updateMetaTag('twitter:image', ogImage);
    }

    updateMetaTag('og:type', ogType, true);

    // 更新 URL
    const url = `https://casewhr.com${location.pathname}`;
    updateMetaTag('og:url', url, true);

    // 更新 canonical
    const canonicalUrl = canonical || url;
    let linkElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.setAttribute('rel', 'canonical');
      document.head.appendChild(linkElement);
    }
    
    linkElement.setAttribute('href', canonicalUrl);

    // 更新 robots
    const robotsContent = [];
    if (noindex) robotsContent.push('noindex');
    if (nofollow) robotsContent.push('nofollow');
    
    if (robotsContent.length > 0) {
      updateMetaTag('robots', robotsContent.join(', '));
    } else {
      // 移除 robots meta（使用默認）
      const robotsElement = document.querySelector('meta[name="robots"]');
      if (robotsElement) {
        robotsElement.remove();
      }
    }

    console.log('🔍 [SEO] Updated meta tags:', {
      title,
      description: description?.substring(0, 50),
      canonical: canonicalUrl,
    });
  }, [title, description, keywords, ogImage, ogType, canonical, noindex, nofollow, location]);
}

/**
 * 結構化數據 Hook
 * 添加 JSON-LD 結構化數據以提升 SEO
 * 
 * @example
 * ```tsx
 * useStructuredData({
 *   '@type': 'Article',
 *   headline: project.title,
 *   description: project.description,
 *   image: project.imageUrl,
 *   datePublished: project.createdAt,
 *   author: {
 *     '@type': 'Person',
 *     name: project.client.name,
 *   },
 * });
 * ```
 */
export function useStructuredData(data: Record<string, any>) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      ...data,
    };

    let script = document.querySelector('script[type="application/ld+json"]#structured-data');
    
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'structured-data');
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify(structuredData);

    console.log('📊 [StructuredData] Updated:', data['@type']);

    return () => {
      // 組件卸載時移除
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [data]);
}

/**
 * 預設 SEO 配置
 */
export const DEFAULT_SEO: Record<string, SEOOptions> = {
  '/': {
    title: 'CaseWhr - 接得準專業接案平台 | 全球自由職業者平台',
    description: '專業的全球接案平台，支援三幣計價系統（TWD/USD/CNY），提供安全的支付保障和完整的專案管理工具。',
    keywords: 'freelancing, 接案平台, 專案外包, remote work, 自由職業, TWD, USD, CNY',
    ogImage: 'https://casewhr.com/og-home.jpg',
  },
  '/browse': {
    title: '瀏覽專案 - 找到適合您的接案機會 | CaseWhr',
    description: '瀏覽數千個優質專案，涵蓋程式開發、設計、寫作、行銷等多個領域。',
    keywords: '找案子, 接案機會, 專案搜尋',
    ogImage: 'https://casewhr.com/og-browse.jpg',
  },
  '/pricing': {
    title: '定價方案 - 選擇適合您的訂閱級別 | CaseWhr',
    description: '提供 Free、Pro、Enterprise 三個級別的訂閱方案，滿足不同規模的需求。',
    keywords: '定價, 訂閱方案, 會員等級',
    ogImage: 'https://casewhr.com/og-pricing.jpg',
  },
  '/dashboard': {
    title: '控制台 - CaseWhr',
    description: '管理您的專案、提案和收入。追蹤進度，與客戶溝通。',
    noindex: true, // 私密頁面不索引
  },
};

/**
 * 獲取當前路徑的 SEO 配置
 */
export function getSEOConfig(pathname: string): SEOOptions {
  return DEFAULT_SEO[pathname] || DEFAULT_SEO['/'];
}

/**
 * 生成麵包屑結構化數據
 */
export function generateBreadcrumbData(items: Array<{ name: string; url: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://casewhr.com${item.url}`,
    })),
  };
}

/**
 * 生成文章結構化數據
 */
export function generateArticleData(article: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
}) {
  return {
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CaseWhr',
      logo: {
        '@type': 'ImageObject',
        url: 'https://casewhr.com/logo.png',
      },
    },
  };
}

/**
 * 生成產品結構化數據
 */
export function generateProductData(product: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  availability?: 'InStock' | 'OutOfStock';
}) {
  return {
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: `https://schema.org/${product.availability || 'InStock'}`,
    },
  };
}

/**
 * 生成組織結構化數據
 */
export function generateOrganizationData() {
  return {
    '@type': 'Organization',
    name: 'CaseWhr',
    url: 'https://casewhr.com',
    logo: 'https://casewhr.com/logo.png',
    sameAs: [
      // 社交媒體鏈接
      'https://www.facebook.com/casewhr',
      'https://twitter.com/casewhr',
      'https://www.linkedin.com/company/casewhr',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+886-2-1234-5678',
      contactType: 'Customer Service',
      availableLanguage: ['zh-TW', 'en', 'zh-CN'],
    },
  };
}

export default useSEO;
