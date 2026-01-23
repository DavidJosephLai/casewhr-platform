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

  // 🔥 核心基礎關鍵字 - 高搜索量、高優先級
  const coreKeywords = {
    'zh-TW': [
      { keyword: '接案', volume: 12000, difficulty: 45, url: '/' },
      { keyword: '發案', volume: 8500, difficulty: 42, url: '/' },
      { keyword: '外包', volume: 15000, difficulty: 55, url: '/' },
      { keyword: '自由工作者', volume: 9500, difficulty: 48, url: '/' },
      { keyword: '接案平台', volume: 6800, difficulty: 50, url: '/' },
      { keyword: '外包平台', volume: 7200, difficulty: 52, url: '/' },
      { keyword: '遠端工作', volume: 11000, difficulty: 47, url: '/remote-work' },
      { keyword: '線上接案', volume: 5500, difficulty: 43, url: '/' },
      { keyword: '專案外包', volume: 4900, difficulty: 46, url: '/' },
      { keyword: '自由職業', volume: 8800, difficulty: 44, url: '/' },
    ],
    'zh-CN': [
      { keyword: '接案', volume: 10000, difficulty: 43, url: '/' },
      { keyword: '发案', volume: 7000, difficulty: 40, url: '/' },
      { keyword: '外包', volume: 18000, difficulty: 58, url: '/' },
      { keyword: '自由职业者', volume: 12000, difficulty: 50, url: '/' },
      { keyword: '接案平台', volume: 5500, difficulty: 48, url: '/' },
      { keyword: '外包平台', volume: 8000, difficulty: 54, url: '/' },
      { keyword: '远程工作', volume: 13000, difficulty: 49, url: '/remote-work' },
      { keyword: '在线接案', volume: 4800, difficulty: 42, url: '/' },
      { keyword: '项目外包', volume: 6200, difficulty: 47, url: '/' },
      { keyword: '自由职业', volume: 9500, difficulty: 45, url: '/' },
    ],
    'en': [
      { keyword: 'freelance', volume: 45000, difficulty: 65, url: '/' },
      { keyword: 'freelancer', volume: 38000, difficulty: 62, url: '/' },
      { keyword: 'outsource', volume: 28000, difficulty: 60, url: '/' },
      { keyword: 'freelance platform', volume: 15000, difficulty: 58, url: '/' },
      { keyword: 'outsourcing platform', volume: 12000, difficulty: 56, url: '/' },
      { keyword: 'remote work', volume: 52000, difficulty: 68, url: '/remote-work' },
      { keyword: 'gig economy', volume: 18000, difficulty: 55, url: '/' },
      { keyword: 'independent contractor', volume: 9500, difficulty: 53, url: '/' },
      { keyword: 'freelance marketplace', volume: 11000, difficulty: 57, url: '/' },
      { keyword: 'online freelance', volume: 8800, difficulty: 54, url: '/' },
    ]
  };

  // 添加核心關鍵字
  const currentCoreKeywords = coreKeywords[language as keyof typeof coreKeywords] || coreKeywords['en'];
  currentCoreKeywords.forEach(core => {
    keywords.push({
      keyword: core.keyword,
      searchVolume: core.volume,
      difficulty: core.difficulty,
      opportunity: 95, // 核心關鍵字優先級最高
      intent: 'transactional',
      relatedKeywords: [],
      targetUrl: core.url
    });
  });

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

  // 🔥 第一步：識別核心關鍵字（opportunity >= 95 的為核心關鍵字）
  const coreKeywords = keywords.filter(kw => kw.opportunity >= 95);
  const otherKeywords = keywords.filter(kw => kw.opportunity < 95);

  // 🔥 為核心關鍵字創建獨立集群（每個核心關鍵字一個集群）
  coreKeywords.forEach(kw => {
    const mainKeyword = kw.keyword;
    if (!clusters.has(mainKeyword)) {
      clusters.set(mainKeyword, []);
    }
    clusters.get(mainKeyword)!.push(kw);
  });

  // 為其他關鍵字按照前兩個詞分組
  otherKeywords.forEach(kw => {
    const words = kw.keyword.split(' ');
    const mainKeyword = words.length > 1 
      ? words[0] + ' ' + words[1]
      : words[0];
    
    if (!clusters.has(mainKeyword)) {
      clusters.set(mainKeyword, []);
    }
    clusters.get(mainKeyword)!.push(kw);
  });

  return Array.from(clusters.entries()).map(([mainKeyword, keywords]) => {
    const totalSearchVolume = keywords.reduce((sum, kw) => sum + kw.searchVolume, 0);
    const avgDifficulty = keywords.reduce((sum, kw) => sum + kw.difficulty, 0) / keywords.length;
    const avgOpportunity = keywords.reduce((sum, kw) => sum + kw.opportunity, 0) / keywords.length;
    
    // 🔥 核心關鍵字集群給予額外優先級加成
    const isCoreCluster = keywords.some(kw => kw.opportunity >= 95);
    const priority = calculatePriority(totalSearchVolume, avgDifficulty, avgOpportunity, isCoreCluster);

    return {
      mainKeyword,
      keywords,
      totalSearchVolume,
      avgDifficulty,
      priority
    };
  }).sort((a, b) => b.priority - a.priority); // 按優先級降序排列
}

/**
 * 計算關鍵字優先級
 */
function calculatePriority(
  searchVolume: number, 
  difficulty: number, 
  opportunity: number,
  isCoreCluster: boolean = false
): number {
  // 基礎分數：搜尋量分數
  const volumeScore = Math.min(searchVolume / 1000, 10);
  
  // 難度分數（難度越低越好）
  const difficultyScore = Math.max(10 - difficulty / 10, 1);
  
  // 機會分數
  const opportunityScore = opportunity / 10;
  
  // 綜合優先級 = (搜尋量分數 × 機會分數) / 難度分數
  let priority = (volumeScore * opportunityScore) / Math.max(difficultyScore, 0.5);
  
  // 🔥 核心關鍵字集群額外加成 +50
  if (isCoreCluster) {
    priority += 50;
  }
  
  return Math.round(priority * 10) / 10;
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