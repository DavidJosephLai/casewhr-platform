/**
 * SEO 動態路由配置
 * 定義所有 SEO 優化的頁面路由
 */

export interface SEORoute {
  path: string;
  type: 'service' | 'location' | 'talent' | 'blog';
  params: Record<string, string>;
  priority: number; // Sitemap priority 0-1
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

/**
 * 服務類別配置
 */
export const SERVICE_CATEGORIES = {
  'web-development': {
    name: '網站開發',
    services: [
      'react-development',
      'vue-development',
      'wordpress-development',
      'e-commerce-development',
      'landing-page-design'
    ]
  },
  'mobile-development': {
    name: '移動應用開發',
    services: [
      'ios-development',
      'android-development',
      'react-native-development',
      'flutter-development'
    ]
  },
  'design': {
    name: '設計服務',
    services: [
      'ui-ux-design',
      'graphic-design',
      'logo-design',
      'brand-identity',
      'illustration'
    ]
  },
  'marketing': {
    name: '數位行銷',
    services: [
      'seo-optimization',
      'social-media-marketing',
      'content-marketing',
      'email-marketing',
      'ppc-advertising'
    ]
  },
  'writing': {
    name: '內容創作',
    services: [
      'copywriting',
      'technical-writing',
      'blog-writing',
      'translation',
      'proofreading'
    ]
  }
};

/**
 * 地區配置
 */
export const LOCATIONS = {
  'taiwan': {
    name: '台灣',
    cities: ['taipei', 'taichung', 'kaohsiung', 'tainan', 'hsinchu']
  },
  'hongkong': {
    name: '香港',
    cities: ['central', 'kowloon', 'new-territories']
  },
  'singapore': {
    name: '新加坡',
    cities: ['downtown', 'orchard', 'marina-bay']
  }
};

/**
 * 生成所有服務頁面路由
 */
export function generateServiceRoutes(): SEORoute[] {
  const routes: SEORoute[] = [];

  Object.entries(SERVICE_CATEGORIES).forEach(([categorySlug, category]) => {
    // 類別頁面
    routes.push({
      path: `/services/${categorySlug}`,
      type: 'service',
      params: { category: categorySlug },
      priority: 0.8,
      changefreq: 'weekly'
    });

    // 服務頁面
    category.services.forEach(serviceSlug => {
      routes.push({
        path: `/services/${categorySlug}/${serviceSlug}`,
        type: 'service',
        params: { 
          category: categorySlug, 
          service: serviceSlug 
        },
        priority: 0.7,
        changefreq: 'weekly'
      });
    });
  });

  return routes;
}

/**
 * 生成所有地區頁面路由
 */
export function generateLocationRoutes(): SEORoute[] {
  const routes: SEORoute[] = [];

  Object.entries(LOCATIONS).forEach(([countrySlug, country]) => {
    // 國家頁面
    routes.push({
      path: `/locations/${countrySlug}`,
      type: 'location',
      params: { country: countrySlug },
      priority: 0.7,
      changefreq: 'weekly'
    });

    // 城市頁面
    country.cities.forEach(citySlug => {
      routes.push({
        path: `/locations/${countrySlug}/${citySlug}`,
        type: 'location',
        params: { 
          country: countrySlug, 
          city: citySlug 
        },
        priority: 0.6,
        changefreq: 'weekly'
      });
    });
  });

  return routes;
}

/**
 * 生成組合頁面路由（地區+服務）
 */
export function generateCombinedRoutes(): SEORoute[] {
  const routes: SEORoute[] = [];

  // 地區+服務組合
  Object.entries(LOCATIONS).forEach(([countrySlug, country]) => {
    country.cities.forEach(citySlug => {
      Object.entries(SERVICE_CATEGORIES).forEach(([categorySlug]) => {
        routes.push({
          path: `/locations/${countrySlug}/${citySlug}/services/${categorySlug}`,
          type: 'service',
          params: {
            country: countrySlug,
            city: citySlug,
            category: categorySlug
          },
          priority: 0.5,
          changefreq: 'monthly'
        });
      });
    });
  });

  return routes;
}

/**
 * 獲取所有 SEO 路由
 */
export function getAllSEORoutes(): SEORoute[] {
  return [
    ...generateServiceRoutes(),
    ...generateLocationRoutes(),
    ...generateCombinedRoutes()
  ];
}

/**
 * 根據路徑查找路由
 */
export function findRouteByPath(path: string): SEORoute | null {
  const allRoutes = getAllSEORoutes();
  return allRoutes.find(route => route.path === path) || null;
}

/**
 * 生成 Sitemap XML
 */
export function generateSitemapXML(): string {
  const routes = getAllSEORoutes();
  const baseUrl = 'https://casewhr.com';
  
  const urls = routes.map(route => `
  <url>
    <loc>${baseUrl}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>${urls}
</urlset>`;
}

/**
 * 獲取服務類別名稱
 */
export function getServiceCategoryName(slug: string): string {
  return SERVICE_CATEGORIES[slug as keyof typeof SERVICE_CATEGORIES]?.name || slug;
}

/**
 * 獲取地區名稱
 */
export function getLocationName(countrySlug: string, citySlug?: string): string {
  const country = LOCATIONS[countrySlug as keyof typeof LOCATIONS];
  if (!country) return countrySlug;
  
  if (citySlug) {
    const cityNames: Record<string, string> = {
      'taipei': '台北',
      'taichung': '台中',
      'kaohsiung': '高雄',
      'tainan': '台南',
      'hsinchu': '新竹',
      'central': '中環',
      'kowloon': '九龍',
      'new-territories': '新界',
      'downtown': '市中心',
      'orchard': '烏節路',
      'marina-bay': '濱海灣'
    };
    return cityNames[citySlug] || citySlug;
  }
  
  return country.name;
}
