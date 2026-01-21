/**
 * SEO 關鍵字地圖服務
 * 管理關鍵字與頁面的映射關係
 */

import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

interface KeywordMapping {
  keyword: string;
  targetUrl: string;
  pageType: 'service' | 'location' | 'blog' | 'landing' | 'home';
  primaryKeyword: boolean; // 是否為主要關鍵字
  searchVolume: number;
  difficulty: number;
  currentRanking?: number; // 當前排名
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'inactive' | 'monitoring';
  createdAt: string;
  updatedAt: string;
  metadata?: {
    relatedKeywords?: string[];
    contentGenerated?: boolean;
    lastOptimized?: string;
    conversionRate?: number;
  };
}

interface KeywordMap {
  id: string;
  name: string;
  description: string;
  mappings: KeywordMapping[];
  totalKeywords: number;
  totalPages: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 生成完整的關鍵字地圖
 */
export async function generateKeywordMap(language: string = 'zh-TW'): Promise<KeywordMap> {
  const mappings: KeywordMapping[] = [];
  const now = new Date().toISOString();

  // === 1. 首頁核心關鍵字 ===
  const homeKeywords = {
    'zh-TW': [
      { keyword: '接案平台', volume: 8900, difficulty: 45 },
      { keyword: '自由工作者平台', volume: 5400, difficulty: 42 },
      { keyword: '外包平台', volume: 6700, difficulty: 48 },
      { keyword: '接案網站', volume: 4300, difficulty: 40 },
      { keyword: '遠端工作平台', volume: 3800, difficulty: 38 }
    ],
    'zh-CN': [
      { keyword: '接案平台', volume: 12000, difficulty: 50 },
      { keyword: '自由职业者平台', volume: 8500, difficulty: 48 },
      { keyword: '外包平台', volume: 9200, difficulty: 52 }
    ],
    'en': [
      { keyword: 'freelance platform', volume: 27100, difficulty: 65 },
      { keyword: 'freelancer marketplace', volume: 18900, difficulty: 62 },
      { keyword: 'outsourcing platform', volume: 14500, difficulty: 58 }
    ]
  };

  (homeKeywords[language as keyof typeof homeKeywords] || homeKeywords['en']).forEach(kw => {
    mappings.push({
      keyword: kw.keyword,
      targetUrl: '/',
      pageType: 'home',
      primaryKeyword: true,
      searchVolume: kw.volume,
      difficulty: kw.difficulty,
      priority: 'high',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      metadata: {
        contentGenerated: true,
        relatedKeywords: []
      }
    });
  });

  // === 2. 服務類別關鍵字 ===
  const serviceCategories = [
    {
      category: 'web-development',
      name: { 'zh-TW': '網站開發', 'zh-CN': '网站开发', 'en': 'Web Development' },
      keywords: {
        'zh-TW': [
          { kw: '網站開發', volume: 6200, difficulty: 48, primary: true },
          { kw: 'React 開發', volume: 3400, difficulty: 42 },
          { kw: 'Vue 開發', volume: 2800, difficulty: 40 },
          { kw: 'WordPress 開發', volume: 4100, difficulty: 45 },
          { kw: '響應式網站設計', volume: 3200, difficulty: 43 },
          { kw: '電商網站開發', volume: 2900, difficulty: 46 }
        ],
        'en': [
          { kw: 'web development', volume: 49500, difficulty: 68, primary: true },
          { kw: 'react development', volume: 12100, difficulty: 58 },
          { kw: 'vue development', volume: 8900, difficulty: 55 }
        ]
      }
    },
    {
      category: 'mobile-development',
      name: { 'zh-TW': '移動應用開發', 'zh-CN': '移动应用开发', 'en': 'Mobile Development' },
      keywords: {
        'zh-TW': [
          { kw: 'App 開發', volume: 5800, difficulty: 50, primary: true },
          { kw: 'iOS 開發', volume: 3600, difficulty: 48 },
          { kw: 'Android 開發', volume: 4200, difficulty: 49 },
          { kw: 'React Native 開發', volume: 2400, difficulty: 45 },
          { kw: 'Flutter 開發', volume: 2800, difficulty: 46 }
        ],
        'en': [
          { kw: 'mobile app development', volume: 33100, difficulty: 65, primary: true },
          { kw: 'ios development', volume: 18200, difficulty: 60 },
          { kw: 'android development', volume: 22500, difficulty: 62 }
        ]
      }
    },
    {
      category: 'design',
      name: { 'zh-TW': '設計服務', 'zh-CN': '设计服务', 'en': 'Design Services' },
      keywords: {
        'zh-TW': [
          { kw: 'UI/UX 設計', volume: 4900, difficulty: 52, primary: true },
          { kw: '平面設計', volume: 6400, difficulty: 48 },
          { kw: 'Logo 設計', volume: 5200, difficulty: 46 },
          { kw: '品牌設計', volume: 3800, difficulty: 50 },
          { kw: '插畫設計', volume: 2600, difficulty: 42 }
        ],
        'en': [
          { kw: 'ui ux design', volume: 27100, difficulty: 64, primary: true },
          { kw: 'graphic design', volume: 40500, difficulty: 70 },
          { kw: 'logo design', volume: 33100, difficulty: 68 }
        ]
      }
    },
    {
      category: 'marketing',
      name: { 'zh-TW': '數位行銷', 'zh-CN': '数字营销', 'en': 'Digital Marketing' },
      keywords: {
        'zh-TW': [
          { kw: 'SEO 優化', volume: 5600, difficulty: 55, primary: true },
          { kw: '社群行銷', volume: 4800, difficulty: 48 },
          { kw: '內容行銷', volume: 3400, difficulty: 46 },
          { kw: 'Email 行銷', volume: 2800, difficulty: 44 },
          { kw: 'Google 廣告', volume: 4200, difficulty: 52 }
        ],
        'en': [
          { kw: 'seo services', volume: 49500, difficulty: 72, primary: true },
          { kw: 'social media marketing', volume: 33100, difficulty: 68 },
          { kw: 'content marketing', volume: 27100, difficulty: 65 }
        ]
      }
    },
    {
      category: 'writing',
      name: { 'zh-TW': '內容創作', 'zh-CN': '内容创作', 'en': 'Content Writing' },
      keywords: {
        'zh-TW': [
          { kw: '文案撰寫', volume: 3800, difficulty: 42, primary: true },
          { kw: '技術文件撰寫', volume: 1800, difficulty: 38 },
          { kw: '部落格寫作', volume: 2400, difficulty: 40 },
          { kw: '翻譯服務', volume: 4200, difficulty: 45 },
          { kw: '校對服務', volume: 1600, difficulty: 35 }
        ],
        'en': [
          { kw: 'copywriting services', volume: 18100, difficulty: 60, primary: true },
          { kw: 'technical writing', volume: 14800, difficulty: 55 },
          { kw: 'blog writing', volume: 12100, difficulty: 52 }
        ]
      }
    },
    {
      category: 'data-analysis',
      name: { 'zh-TW': '數據分析', 'zh-CN': '数据分析', 'en': 'Data Analysis' },
      keywords: {
        'zh-TW': [
          { kw: '數據分析', volume: 4600, difficulty: 50, primary: true },
          { kw: '大數據分析', volume: 2800, difficulty: 52 },
          { kw: '商業智能', volume: 2200, difficulty: 48 },
          { kw: 'Excel 資料處理', volume: 3400, difficulty: 42 }
        ],
        'en': [
          { kw: 'data analysis', volume: 60500, difficulty: 68, primary: true },
          { kw: 'big data analytics', volume: 22200, difficulty: 65 },
          { kw: 'business intelligence', volume: 27100, difficulty: 66 }
        ]
      }
    }
  ];

  serviceCategories.forEach(category => {
    const categoryName = category.name[language as keyof typeof category.name] || category.name['en'];
    const keywords = category.keywords[language as keyof typeof category.keywords] || category.keywords['en'];

    keywords.forEach(kw => {
      mappings.push({
        keyword: kw.kw,
        targetUrl: `/services/${category.category}`,
        pageType: 'service',
        primaryKeyword: kw.primary || false,
        searchVolume: kw.volume,
        difficulty: kw.difficulty,
        priority: kw.primary ? 'high' : 'medium',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        metadata: {
          relatedKeywords: keywords.filter(k => k.kw !== kw.kw).map(k => k.kw).slice(0, 3),
          contentGenerated: false
        }
      });
    });
  });

  // === 3. 地區關鍵字 ===
  const locations = [
    {
      country: 'taiwan',
      cities: [
        { slug: 'taipei', name: { 'zh-TW': '台北', 'zh-CN': '台北', 'en': 'Taipei' }, volume: 8900 },
        { slug: 'taichung', name: { 'zh-TW': '台中', 'zh-CN': '台中', 'en': 'Taichung' }, volume: 5600 },
        { slug: 'kaohsiung', name: { 'zh-TW': '高雄', 'zh-CN': '高雄', 'en': 'Kaohsiung' }, volume: 4800 },
        { slug: 'tainan', name: { 'zh-TW': '台南', 'zh-CN': '台南', 'en': 'Tainan' }, volume: 3200 },
        { slug: 'hsinchu', name: { 'zh-TW': '新竹', 'zh-CN': '新竹', 'en': 'Hsinchu' }, volume: 2800 }
      ]
    }
  ];

  const locationModifiers = {
    'zh-TW': ['自由工作者', '接案', '外包', '工作室'],
    'zh-CN': ['自由职业者', '接案', '外包', '工作室'],
    'en': ['freelancer', 'freelance', 'outsourcing', 'agency']
  };

  locations.forEach(location => {
    location.cities.forEach(city => {
      const cityName = city.name[language as keyof typeof city.name] || city.name['en'];
      const modifiers = locationModifiers[language as keyof typeof locationModifiers] || locationModifiers['en'];

      // 城市主關鍵字
      modifiers.forEach((modifier, index) => {
        mappings.push({
          keyword: `${cityName}${modifier}`,
          targetUrl: `/locations/${location.country}/${city.slug}`,
          pageType: 'location',
          primaryKeyword: index === 0,
          searchVolume: Math.round(city.volume * (1 - index * 0.2)),
          difficulty: 35 + index * 2,
          priority: index === 0 ? 'high' : 'medium',
          status: 'active',
          createdAt: now,
          updatedAt: now,
          metadata: {
            relatedKeywords: modifiers.filter(m => m !== modifier)
          }
        });
      });
    });
  });

  // === 4. 長尾關鍵字（問題型） ===
  const longTailQuestions = {
    'zh-TW': [
      { q: '如何找到自由工作者', volume: 1200, difficulty: 25 },
      { q: '接案平台推薦', volume: 2800, difficulty: 32 },
      { q: '自由工作者接案技巧', volume: 980, difficulty: 28 },
      { q: '外包平台比較', volume: 1600, difficulty: 30 },
      { q: '遠端工作如何開始', volume: 1400, difficulty: 26 },
      { q: '自由工作者報稅', volume: 880, difficulty: 24 },
      { q: '接案合約範本', volume: 720, difficulty: 22 },
      { q: '如何成為自由工作者', volume: 2100, difficulty: 30 },
      { q: '接案定價策略', volume: 650, difficulty: 20 },
      { q: '自由工作者保險', volume: 540, difficulty: 18 }
    ],
    'en': [
      { q: 'how to find freelancers', volume: 8100, difficulty: 35 },
      { q: 'best freelance platforms', volume: 9900, difficulty: 42 },
      { q: 'freelance tips for beginners', volume: 5400, difficulty: 32 },
      { q: 'how to become a freelancer', volume: 12100, difficulty: 38 },
      { q: 'freelance pricing guide', volume: 3600, difficulty: 28 }
    ]
  };

  (longTailQuestions[language as keyof typeof longTailQuestions] || longTailQuestions['en']).forEach(item => {
    mappings.push({
      keyword: item.q,
      targetUrl: '/blog',
      pageType: 'blog',
      primaryKeyword: false,
      searchVolume: item.volume,
      difficulty: item.difficulty,
      priority: 'low',
      status: 'monitoring',
      createdAt: now,
      updatedAt: now,
      metadata: {
        relatedKeywords: [],
        contentGenerated: false
      }
    });
  });

  // === 5. 組合關鍵字（地區 + 服務） ===
  const topCities = locations[0].cities.slice(0, 3);
  const topServices = serviceCategories.slice(0, 3);

  topCities.forEach(city => {
    const cityName = city.name[language as keyof typeof city.name] || city.name['en'];
    
    topServices.forEach(service => {
      const serviceName = service.name[language as keyof typeof service.name] || service.name['en'];
      
      mappings.push({
        keyword: `${cityName} ${serviceName}`,
        targetUrl: `/locations/taiwan/${city.slug}/services/${service.category}`,
        pageType: 'location',
        primaryKeyword: false,
        searchVolume: Math.round(city.volume * 0.3),
        difficulty: 38,
        priority: 'medium',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        metadata: {
          relatedKeywords: [cityName, serviceName]
        }
      });
    });
  });

  // 計算統計
  const uniqueUrls = new Set(mappings.map(m => m.targetUrl));

  return {
    id: `keyword-map-${language}-${Date.now()}`,
    name: `CaseWHR 關鍵字地圖 (${language})`,
    description: `完整的 SEO 關鍵字映射策略，涵蓋服務、地區、長尾關鍵字`,
    mappings,
    totalKeywords: mappings.length,
    totalPages: uniqueUrls.size,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * 獲取關鍵字地圖統計
 */
export function getKeywordMapStats(map: KeywordMap) {
  const stats = {
    totalKeywords: map.totalKeywords,
    totalPages: map.totalPages,
    byPriority: {
      high: map.mappings.filter(m => m.priority === 'high').length,
      medium: map.mappings.filter(m => m.priority === 'medium').length,
      low: map.mappings.filter(m => m.priority === 'low').length
    },
    byPageType: {
      home: map.mappings.filter(m => m.pageType === 'home').length,
      service: map.mappings.filter(m => m.pageType === 'service').length,
      location: map.mappings.filter(m => m.pageType === 'location').length,
      blog: map.mappings.filter(m => m.pageType === 'blog').length,
      landing: map.mappings.filter(m => m.pageType === 'landing').length
    },
    byStatus: {
      active: map.mappings.filter(m => m.status === 'active').length,
      inactive: map.mappings.filter(m => m.status === 'inactive').length,
      monitoring: map.mappings.filter(m => m.status === 'monitoring').length
    },
    totalSearchVolume: map.mappings.reduce((sum, m) => sum + m.searchVolume, 0),
    avgDifficulty: Math.round(
      map.mappings.reduce((sum, m) => sum + m.difficulty, 0) / map.mappings.length
    ),
    primaryKeywords: map.mappings.filter(m => m.primaryKeyword).length,
    contentGenerated: map.mappings.filter(m => m.metadata?.contentGenerated).length
  };

  return stats;
}

/**
 * 獲取頁面的關鍵字映射
 */
export function getKeywordsByUrl(map: KeywordMap, url: string): KeywordMapping[] {
  return map.mappings.filter(m => m.targetUrl === url);
}

/**
 * 獲取優先級最高的關鍵字
 */
export function getTopPriorityKeywords(map: KeywordMap, limit: number = 50): KeywordMapping[] {
  return map.mappings
    .filter(m => m.status === 'active')
    .sort((a, b) => {
      // 優先級權重
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityScore = priorityWeight[b.priority] - priorityWeight[a.priority];
      
      if (priorityScore !== 0) return priorityScore;
      
      // 搜尋量權重
      return b.searchVolume - a.searchVolume;
    })
    .slice(0, limit);
}

/**
 * 註冊關鍵字地圖路由
 */
export function registerKeywordMapRoutes(app: Hono) {
  // 生成關鍵字地圖
  app.get('/make-server-215f78a5/seo/keyword-map/generate', async (c) => {
    try {
      const language = c.req.query('language') || 'zh-TW';
      
      console.log('🗺️ [Keyword Map] Generating keyword map for:', language);
      
      const keywordMap = await generateKeywordMap(language);
      const stats = getKeywordMapStats(keywordMap);
      
      // 保存到 KV Store
      await kv.set(`keyword_map_${language}`, keywordMap);
      
      console.log('✅ [Keyword Map] Generated:', stats);
      
      return c.json({
        success: true,
        data: {
          map: keywordMap,
          stats
        }
      });
    } catch (error: any) {
      console.error('❌ [Keyword Map] Error:', error);
      return c.json({ 
        success: false, 
        error: error.message 
      }, 500);
    }
  });

  // 獲取關鍵字地圖
  app.get('/make-server-215f78a5/seo/keyword-map', async (c) => {
    try {
      const language = c.req.query('language') || 'zh-TW';
      
      // 從 KV Store 獲取
      const keywordMap = await kv.get(`keyword_map_${language}`);
      
      if (!keywordMap) {
        // 如果不存在，生成新的
        const newMap = await generateKeywordMap(language);
        await kv.set(`keyword_map_${language}`, newMap);
        
        return c.json({
          success: true,
          data: {
            map: newMap,
            stats: getKeywordMapStats(newMap)
          }
        });
      }
      
      return c.json({
        success: true,
        data: {
          map: keywordMap,
          stats: getKeywordMapStats(keywordMap)
        }
      });
    } catch (error: any) {
      console.error('❌ [Keyword Map] Error:', error);
      return c.json({ 
        success: false, 
        error: error.message 
      }, 500);
    }
  });

  // 獲取特定頁面的關鍵字
  app.get('/make-server-215f78a5/seo/keyword-map/by-url', async (c) => {
    try {
      const language = c.req.query('language') || 'zh-TW';
      const url = c.req.query('url') || '/';
      
      const keywordMap = await kv.get(`keyword_map_${language}`);
      
      if (!keywordMap) {
        return c.json({
          success: false,
          error: 'Keyword map not found'
        }, 404);
      }
      
      const keywords = getKeywordsByUrl(keywordMap, url);
      
      return c.json({
        success: true,
        data: { keywords }
      });
    } catch (error: any) {
      console.error('❌ [Keyword Map] Error:', error);
      return c.json({ 
        success: false, 
        error: error.message 
      }, 500);
    }
  });

  // 獲取優先級最高的關鍵字
  app.get('/make-server-215f78a5/seo/keyword-map/top-priority', async (c) => {
    try {
      const language = c.req.query('language') || 'zh-TW';
      const limit = parseInt(c.req.query('limit') || '50');
      
      const keywordMap = await kv.get(`keyword_map_${language}`);
      
      if (!keywordMap) {
        return c.json({
          success: false,
          error: 'Keyword map not found'
        }, 404);
      }
      
      const topKeywords = getTopPriorityKeywords(keywordMap, limit);
      
      return c.json({
        success: true,
        data: { keywords: topKeywords }
      });
    } catch (error: any) {
      console.error('❌ [Keyword Map] Error:', error);
      return c.json({ 
        success: false, 
        error: error.message 
      }, 500);
    }
  });

  console.log('✅ [Keyword Map] Routes registered');
}
