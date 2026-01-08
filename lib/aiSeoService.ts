import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5`;

// 類型定義
export interface SEOGenerationRequest {
  pageType?: string;
  language: 'en' | 'zh-TW' | 'zh-CN';
  currentTitle?: string;
  currentDescription?: string;
  keywords?: string[];
  context?: string;
}

export interface SEOGenerationResponse {
  title: string;
  description: string;
  keywords: string[];
  suggestions?: string[];
  score?: number;
}

export interface SEOAnalysis {
  score: number;
  issues: string[];
  suggestions: string[];
  keywordDensity?: { [key: string]: number };
}

/**
 * 使用 AI 生成 SEO 內容
 */
export async function generateAISEOContent(
  request: SEOGenerationRequest
): Promise<SEOGenerationResponse> {
  try {
    console.log('🔵 [AI SEO Service] Calling:', `${API_BASE_URL}/ai-seo/generate`);
    console.log('🔵 [AI SEO Service] Request:', request);
    
    // 轉換前端參數格式為後端期望的格式
    const backendRequest = {
      title: request.currentTitle || '',
      description: request.currentDescription || '',
      category: request.pageType || '',
      tags: request.keywords || [],
      language: request.language || 'zh-TW',
      targetAudience: '',
      projectType: request.context || '',
    };
    
    console.log('🔵 [AI SEO Service] Backend Request:', backendRequest);
    
    const response = await fetch(`${API_BASE_URL}/ai-seo/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(backendRequest),
    });

    console.log('🔵 [AI SEO Service] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [AI SEO Service] Error response:', errorText);
      throw new Error(`AI SEO generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ [AI SEO Service] Success:', result);
    
    // 後端返回格式：{ success: true, data: { seoTitle, seoDescription, keywords, ... } }
    // 需要轉換為前端期望的格式
    if (result.success && result.data) {
      return {
        title: result.data.seoTitle || result.data.title || '',
        description: result.data.seoDescription || result.data.description || '',
        keywords: result.data.keywords || [],
        suggestions: result.data.suggestions || [],
        score: result.data.score || 0,
      };
    }
    
    // 如果已經是正確格式，直接返回
    return result;
  } catch (error) {
    console.error('❌ [AI SEO] Generation error:', error);
    throw error;
  }
}

/**
 * 生成關鍵字建議
 */
export async function generateKeywordSuggestions(
  topic: string,
  language: 'en' | 'zh-TW' | 'zh-CN'
): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-seo/keywords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ topic, language }),
    });

    if (!response.ok) {
      throw new Error(`Keyword suggestion failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ [AI SEO] Keywords result:', result);
    
    // 後端返回格式：{ success: true, data: { keywords: [...], suggestions: [...] } }
    if (result.success && result.data) {
      // 提取所有關鍵字的文本
      const keywordList = result.data.keywords.map((k: any) => 
        typeof k === 'string' ? k : k.keyword
      );
      return keywordList;
    }
    
    return result.keywords || [];
  } catch (error) {
    console.error('❌ [AI SEO] Keyword suggestion error:', error);
    // 返回本地備用關鍵字
    return getLocalKeywordSuggestions(topic, language);
  }
}

/**
 * 本地 SEO 分析（不需要 API）
 */
export function analyzeLocalSEO(
  title: string,
  description: string,
  keywords: string[]
): SEOAnalysis {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // 標題檢查
  if (!title) {
    issues.push('缺少標題');
    score -= 20;
  } else if (title.length < 30) {
    issues.push('標題太短（建議 30-60 字元）');
    suggestions.push('增加標題長度以提供更多資訊');
    score -= 10;
  } else if (title.length > 60) {
    issues.push('標題太長（建議 30-60 字元）');
    suggestions.push('縮短標題以在搜尋結果中完整顯示');
    score -= 10;
  }

  // 描述檢查
  if (!description) {
    issues.push('缺少描述');
    score -= 20;
  } else if (description.length < 120) {
    issues.push('描述太短（建議 120-160 字元）');
    suggestions.push('擴充描述以提供更多詳細資訊');
    score -= 10;
  } else if (description.length > 160) {
    issues.push('描述太長（建議 120-160 字元）');
    suggestions.push('精簡描述以在搜尋結果中完整顯示');
    score -= 10;
  }

  // 關鍵字檢查
  if (keywords.length === 0) {
    issues.push('缺少關鍵字');
    suggestions.push('添加 3-5 個相關關鍵字');
    score -= 15;
  } else if (keywords.length > 10) {
    issues.push('關鍵字過多（建議 3-5 個）');
    suggestions.push('減少關鍵字數量，專注於最重要的');
    score -= 5;
  }

  // 關鍵字密度分析
  const keywordDensity = calculateKeywordDensity(title + ' ' + description, keywords);
  
  keywords.forEach(keyword => {
    const density = keywordDensity[keyword] || 0;
    if (density === 0) {
      suggestions.push(`關鍵字「${keyword}」未出現在標題或描述中`);
      score -= 5;
    }
  });

  return {
    score: Math.max(0, score),
    issues,
    suggestions,
    keywordDensity,
  };
}

/**
 * 計算關鍵字密度
 */
export function calculateKeywordDensity(
  text: string,
  keywords: string[]
): { [key: string]: number } {
  const density: { [key: string]: number } = {};
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/).length;

  keywords.forEach(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    const matches = (lowerText.match(new RegExp(lowerKeyword, 'gi')) || []).length;
    density[keyword] = words > 0 ? (matches / words) * 100 : 0;
  });

  return density;
}

/**
 * 本地關鍵字建議（備用方案）
 */
function getLocalKeywordSuggestions(
  topic: string,
  language: 'en' | 'zh-TW' | 'zh-CN'
): string[] {
  const lowerTopic = topic.toLowerCase();
  
  // 基於主題的簡單關鍵字建議
  const baseKeywords: { [key: string]: string[] } = {
    'zh-TW': [
      '台灣', '服務', '專業', '推薦', '優質',
      '最佳', '評價', '線上', '快速', '安全'
    ],
    'zh-CN': [
      '中国', '服务', '专业', '推荐', '优质',
      '最佳', '评价', '在线', '快速', '安全'
    ],
    'en': [
      'professional', 'service', 'best', 'top', 'quality',
      'expert', 'recommended', 'online', 'fast', 'secure'
    ]
  };

  return baseKeywords[language] || baseKeywords['zh-TW'];
}

/**
 * 檢查 API 健康狀態
 */
export async function checkAPIHealth(): Promise<{ 
  status: 'healthy' | 'unhealthy'; 
  message: string;
  details?: any;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-seo/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      return {
        status: 'unhealthy',
        message: 'API 連接失敗',
      };
    }

    const result = await response.json();
    
    if (result.openai?.configured) {
      return {
        status: 'healthy',
        message: 'OpenAI API 已配置且正常運作',
        details: result,
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'OpenAI API 未配置',
        details: result,
      };
    }
  } catch (error) {
    console.error('❌ [AI SEO] Health check error:', error);
    return {
      status: 'unhealthy',
      message: '無法連接到 API',
    };
  }
}
