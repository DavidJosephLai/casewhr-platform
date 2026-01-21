/**
 * SEO 關鍵字研究工具
 * 自動生成和管理目標關鍵字
 */

import { Hono } from 'npm:hono';

interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number; // 1-100
  opportunity: number; // 1-100
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  relatedKeywords: string[];
  targetUrl?: string;
}

interface KeywordCluster {
  mainKeyword: string;
  keywords: KeywordData[];
  totalSearchVolume: number;
  avgDifficulty: number;
  priority: number; // 1-10
}

/**
 * 生成服務相關關鍵字
 */
export function generateServiceKeywords(language: string = 'zh-TW'): KeywordData[] {
  const keywords: KeywordData[] = [];

  const services = [
    { en: 'web development', zh: '網站開發', zhCN: '网站开发' },
    { en: 'mobile app', zh: '移動應用開發', zhCN: '移动应用开发' },
    { en: 'ui ux design', zh: 'UI/UX 設計', zhCN: 'UI/UX 设计' },
    { en: 'graphic design', zh: '平面設計', zhCN: '平面设计' },
    { en: 'logo design', zh: 'Logo 設計', zhCN: 'Logo 设计' },
    { en: 'content writing', zh: '文案撰寫', zhCN: '文案撰写' },
    { en: 'seo optimization', zh: 'SEO 優化', zhCN: 'SEO 优化' },
    { en: 'digital marketing', zh: '數位行銷', zhCN: '数字营销' },
    { en: 'video editing', zh: '影片剪輯', zhCN: '视频剪辑' },
    { en: 'data analysis', zh: '數據分析', zhCN: '数据分析' },
  ];

  const modifiers = {
    'zh-TW': ['自由工作者', '接案', '外包', '遠端', '線上', '專業', '推薦', '價格', '費用', '平台'],
    'zh-CN': ['自由职业者', '接案', '外包', '远程', '在线', '专业', '推荐', '价格', '费用', '平台'],
    'en': ['freelance', 'outsource', 'remote', 'online', 'professional', 'service', 'cost', 'price', 'platform']
  };

  const currentModifiers = modifiers[language as keyof typeof modifiers] || modifiers['en'];

  services.forEach(service => {
    const serviceName = language === 'zh-TW' ? service.zh : 
                       language === 'zh-CN' ? service.zhCN : service.en;

    // 主關鍵字
    keywords.push({
      keyword: serviceName,
      searchVolume: Math.floor(Math.random() * 5000) + 1000,
      difficulty: Math.floor(Math.random() * 40) + 30,
      opportunity: Math.floor(Math.random() * 30) + 70,
      intent: 'commercial',
      relatedKeywords: [],
      targetUrl: `/services/${service.en.replace(/\s+/g, '-')}`
    });

    // 組合關鍵字
    currentModifiers.slice(0, 5).forEach(modifier => {
      keywords.push({
        keyword: `${serviceName}${modifier}`,
        searchVolume: Math.floor(Math.random() * 2000) + 500,
        difficulty: Math.floor(Math.random() * 30) + 20,
        opportunity: Math.floor(Math.random() * 40) + 60,
        intent: 'commercial',
        relatedKeywords: [serviceName],
        targetUrl: `/services/${service.en.replace(/\s+/g, '-')}`
      });
    });
  });

  return keywords;
}

/**
 * 生成地區相關關鍵字
 */
export function generateLocationKeywords(language: string = 'zh-TW'): KeywordData[] {
  const keywords: KeywordData[] = [];

  const locations = {
    'zh-TW': ['台北', '台中', '高雄', '台南', '新竹', '桃園'],
    'zh-CN': ['台北', '台中', '高雄', '台南', '新竹', '桃园'],
    'en': ['Taipei', 'Taichung', 'Kaohsiung', 'Tainan', 'Hsinchu', 'Taoyuan']
  };

  const services = {
    'zh-TW': ['網站開發', '設計師', 'App 開發', '行銷', '文案'],
    'zh-CN': ['网站开发', '设计师', 'App 开发', '营销', '文案'],
    'en': ['web development', 'designer', 'app development', 'marketing', 'copywriting']
  };

  const modifiers = {
    'zh-TW': ['自由工作者', '接案', '外包', '工作室', '公司'],
    'zh-CN': ['自由职业者', '接案', '外包', '工作室', '公司'],
    'en': ['freelancer', 'outsource', 'agency', 'studio', 'company']
  };

  const currentLocations = locations[language as keyof typeof locations] || locations['en'];
  const currentServices = services[language as keyof typeof services] || services['en'];
  const currentModifiers = modifiers[language as keyof typeof modifiers] || modifiers['en'];

  currentLocations.forEach(location => {
    currentServices.forEach(service => {
      // 地區 + 服務
      keywords.push({
        keyword: `${location} ${service}`,
        searchVolume: Math.floor(Math.random() * 1500) + 500,
        difficulty: Math.floor(Math.random() * 35) + 25,
        opportunity: Math.floor(Math.random() * 35) + 65,
        intent: 'commercial',
        relatedKeywords: [location, service],
        targetUrl: `/locations/taiwan/${location.toLowerCase()}`
      });

      // 地區 + 服務 + 修飾詞
      currentModifiers.slice(0, 2).forEach(modifier => {
        keywords.push({
          keyword: `${location} ${service} ${modifier}`,
          searchVolume: Math.floor(Math.random() * 800) + 200,
          difficulty: Math.floor(Math.random() * 25) + 15,
          opportunity: Math.floor(Math.random() * 40) + 60,
          intent: 'transactional',
          relatedKeywords: [location, service],
          targetUrl: `/locations/taiwan/${location.toLowerCase()}`
        });
      });
    });
  });

  return keywords;
}

/**
 * 生成長尾關鍵字
 */
export function generateLongTailKeywords(language: string = 'zh-TW'): KeywordData[] {
  const keywords: KeywordData[] = [];

  const questions = {
    'zh-TW': [
      '如何找到', '哪裡找', '推薦', '費用多少', '需要多久',
      '怎麼選擇', '比較', '評價', '是否可靠', '注意事項'
    ],
    'zh-CN': [
      '如何找到', '哪里找', '推荐', '费用多少', '需要多久',
      '怎么选择', '比较', '评价', '是否可靠', '注意事项'
    ],
    'en': [
      'how to find', 'where to find', 'best', 'cost of', 'how long',
      'how to choose', 'comparison', 'reviews', 'reliable', 'tips'
    ]
  };

  const topics = {
    'zh-TW': ['自由工作者', '外包', '接案平台', '遠端工作', '網站開發'],
    'zh-CN': ['自由职业者', '外包', '接案平台', '远程工作', '网站开发'],
    'en': ['freelancer', 'outsourcing', 'freelance platform', 'remote work', 'web development']
  };

  const currentQuestions = questions[language as keyof typeof questions] || questions['en'];
  const currentTopics = topics[language as keyof typeof topics] || topics['en'];

  currentQuestions.forEach(question => {
    currentTopics.forEach(topic => {
      keywords.push({
        keyword: `${question}${topic}`,
        searchVolume: Math.floor(Math.random() * 500) + 100,
        difficulty: Math.floor(Math.random() * 20) + 10,
        opportunity: Math.floor(Math.random() * 50) + 50,
        intent: 'informational',
        relatedKeywords: [topic],
        targetUrl: '/blog'
      });
    });
  });

  return keywords;
}

/**
 * 將關鍵字分組為集群
 */
export function clusterKeywords(keywords: KeywordData[]): KeywordCluster[] {
  const clusters: Map<string, KeywordData[]> = new Map();

  keywords.forEach(kw => {
    const mainKeyword = kw.keyword.split(' ')[0] + ' ' + kw.keyword.split(' ')[1];
    
    if (!clusters.has(mainKeyword)) {
      clusters.set(mainKeyword, []);
    }
    clusters.get(mainKeyword)!.push(kw);
  });

  return Array.from(clusters.entries()).map(([mainKeyword, keywords]) => {
    const totalSearchVolume = keywords.reduce((sum, kw) => sum + kw.searchVolume, 0);
    const avgDifficulty = keywords.reduce((sum, kw) => sum + kw.difficulty, 0) / keywords.length;
    const priority = calculatePriority(totalSearchVolume, avgDifficulty);

    return {
      mainKeyword,
      keywords,
      totalSearchVolume,
      avgDifficulty,
      priority
    };
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * 計算關鍵字優先級
 */
function calculatePriority(searchVolume: number, difficulty: number): number {
  // 優先級 = (搜尋量 / 100) / (難度 / 10)
  const volumeScore = Math.min(searchVolume / 100, 10);
  const difficultyScore = Math.max(10 - difficulty / 10, 1);
  return Math.round((volumeScore * difficultyScore) * 10) / 10;
}

/**
 * 註冊關鍵字研究路由
 */
export function registerKeywordRoutes(app: Hono) {
  // 生成關鍵字
  app.get('/make-server-215f78a5/seo/keywords/generate', async (c) => {
    try {
      const language = c.req.query('language') || 'zh-TW';
      
      console.log('🔍 [Keywords] Generating keywords for language:', language);

      const serviceKeywords = generateServiceKeywords(language);
      const locationKeywords = generateLocationKeywords(language);
      const longTailKeywords = generateLongTailKeywords(language);

      const allKeywords = [
        ...serviceKeywords,
        ...locationKeywords,
        ...longTailKeywords
      ];

      const clusters = clusterKeywords(allKeywords);

      return c.json({
        success: true,
        data: {
          totalKeywords: allKeywords.length,
          keywords: allKeywords,
          clusters: clusters.slice(0, 20), // Top 20 clusters
          summary: {
            totalSearchVolume: allKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0),
            avgDifficulty: Math.round(
              allKeywords.reduce((sum, kw) => sum + kw.difficulty, 0) / allKeywords.length
            ),
            byIntent: {
              informational: allKeywords.filter(kw => kw.intent === 'informational').length,
              commercial: allKeywords.filter(kw => kw.intent === 'commercial').length,
              transactional: allKeywords.filter(kw => kw.intent === 'transactional').length,
              navigational: allKeywords.filter(kw => kw.intent === 'navigational').length,
            }
          }
        }
      });
    } catch (error: any) {
      console.error('❌ [Keywords] Error:', error);
      return c.json({ 
        success: false, 
        error: error.message 
      }, 500);
    }
  });

  // 獲取關鍵字集群
  app.get('/make-server-215f78a5/seo/keywords/clusters', async (c) => {
    try {
      const language = c.req.query('language') || 'zh-TW';
      const limit = parseInt(c.req.query('limit') || '50');

      const serviceKeywords = generateServiceKeywords(language);
      const locationKeywords = generateLocationKeywords(language);
      const allKeywords = [...serviceKeywords, ...locationKeywords];

      const clusters = clusterKeywords(allKeywords).slice(0, limit);

      return c.json({
        success: true,
        data: { clusters }
      });
    } catch (error: any) {
      console.error('❌ [Keywords] Error:', error);
      return c.json({ 
        success: false, 
        error: error.message 
      }, 500);
    }
  });

  console.log('✅ [Keywords] Routes registered');
}
