/**
 * AI SEO 服務
 * 使用 OpenAI API 生成和優化 SEO 內容
 */

import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SEOGenerationRequest {
  pageType: string;
  language: 'en' | 'zh-TW' | 'zh-CN';
  keywords?: string[];
  currentTitle?: string;
  currentDescription?: string;
  context?: string;
}

interface SEOGenerationResponse {
  title: string;
  description: string;
  keywords: string[];
  suggestions: string[];
  score: number;
}

interface SEOAnalysisResult {
  score: number;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    suggestion: string;
  }>;
  strengths: string[];
  improvements: string[];
}

// 使用正确的 Supabase 项目配置
const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5`;

/**
 * 使用 AI 生成 SEO 內容
 */
export async function generateAISEOContent(
  request: SEOGenerationRequest
): Promise<SEOGenerationResponse> {
  try {
    console.log('🔵 [AI SEO Service] Calling:', `${API_BASE_URL}/ai/generate-seo`);
    console.log('🔵 [AI SEO Service] Request:', request);
    
    const response = await fetch(`${API_BASE_URL}/ai/generate-seo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(request),
    });

    console.log('🔵 [AI SEO Service] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [AI SEO Service] Error response:', errorText);
      throw new Error(`AI SEO generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ [AI SEO Service] Success:', result);
    return result;
  } catch (error) {
    console.error('❌ [AI SEO] Generation error:', error);
    throw error;
  }
}

/**
 * 分析當前頁面的 SEO
 */
export async function analyzePageSEO(
  title: string,
  description: string,
  keywords: string,
  content: string,
  language: 'en' | 'zh-TW' | 'zh-CN'
): Promise<SEOAnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/analyze-seo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        title,
        description,
        keywords,
        content,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`SEO analysis failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ [AI SEO] Analysis error:', error);
    throw error;
  }
}

/**
 * 本地 SEO 分析（不需要 API）
 */
export function analyzeLocalSEO(
  title: string,
  description: string,
  keywords: string
): SEOAnalysisResult {
  const issues: SEOAnalysisResult['issues'] = [];
  const strengths: string[] = [];
  const improvements: string[] = [];
  let score = 100;

  // 標題檢查
  if (!title) {
    issues.push({
      type: 'error',
      message: '缺少頁面標題',
      suggestion: '添加一個簡潔、描述性的標題（50-60 字元）',
    });
    score -= 20;
  } else {
    if (title.length < 30) {
      issues.push({
        type: 'warning',
        message: '標題過短',
        suggestion: `當前 ${title.length} 字元，建議 50-60 字元`,
      });
      score -= 10;
    } else if (title.length > 60) {
      issues.push({
        type: 'warning',
        message: '標題過長',
        suggestion: `當前 ${title.length} 字元，建議 50-60 字元`,
      });
      score -= 5;
    } else {
      strengths.push('✅ 標題長度適中');
    }
  }

  // 描述檢查
  if (!description) {
    issues.push({
      type: 'error',
      message: '缺少 meta description',
      suggestion: '添加一個吸引人的描述（150-160 字元）',
    });
    score -= 20;
  } else {
    if (description.length < 120) {
      issues.push({
        type: 'warning',
        message: '描述過短',
        suggestion: `當前 ${description.length} 字元，建議 150-160 字元`,
      });
      score -= 10;
    } else if (description.length > 160) {
      issues.push({
        type: 'warning',
        message: '描述過長',
        suggestion: `當前 ${description.length} 字元，建議 150-160 字元`,
      });
      score -= 5;
    } else {
      strengths.push('✅ 描述長度適中');
    }
  }

  // 關鍵字檢查
  if (!keywords) {
    issues.push({
      type: 'warning',
      message: '缺少關鍵字',
      suggestion: '添加 5-10 個相關關鍵字',
    });
    score -= 10;
  } else {
    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
    if (keywordArray.length < 3) {
      issues.push({
        type: 'info',
        message: '關鍵字較少',
        suggestion: `當前 ${keywordArray.length} 個，建議 5-10 個`,
      });
      score -= 5;
    } else if (keywordArray.length > 15) {
      issues.push({
        type: 'info',
        message: '關鍵字過多',
        suggestion: `當前 ${keywordArray.length} 個，建議 5-10 個`,
      });
      score -= 5;
    } else {
      strengths.push('✅ 關鍵字數量適中');
    }
  }

  // 生成改進建議
  if (score < 60) {
    improvements.push('🔴 需要立即優化 SEO 設置');
  } else if (score < 80) {
    improvements.push('🟡 SEO 設置良好，但還有改進空間');
  } else {
    improvements.push('🟢 SEO 設置優秀！');
  }

  if (title && description) {
    const titleWords = title.toLowerCase().split(/\s+/);
    const descWords = description.toLowerCase().split(/\s+/);
    const commonWords = titleWords.filter(word => descWords.includes(word));
    
    if (commonWords.length > 0) {
      strengths.push(`✅ 標題和描述有 ${commonWords.length} 個共同關鍵詞`);
    } else {
      improvements.push('💡 建議在描述中包含標題的關鍵詞');
    }
  }

  return {
    score: Math.max(0, score),
    issues,
    strengths,
    improvements,
  };
}

/**
 * 生成關鍵字建議
 */
export async function generateKeywordSuggestions(
  topic: string,
  language: 'en' | 'zh-TW' | 'zh-CN'
): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/suggest-keywords`, {
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

    const data = await response.json();
    return data.keywords || [];
  } catch (error) {
    console.error('❌ [AI SEO] Keyword suggestion error:', error);
    // 返回本地備用關鍵字
    return getLocalKeywordSuggestions(topic, language);
  }
}

/**
 * 本地關鍵字建議（備用）
 */
function getLocalKeywordSuggestions(
  topic: string,
  language: 'en' | 'zh-TW' | 'zh-CN'
): string[] {
  const baseKeywords = {
    en: [
      'freelancing',
      'remote work',
      'outsourcing',
      'professional services',
      'project management',
      'talent matching',
      'global platform',
      'contract work',
    ],
    'zh-TW': [
      '接案平台',
      '自由工作者',
      '遠距工作',
      '外包服務',
      '專案管理',
      '人才媒合',
      '台灣接案',
      '合約管理',
    ],
    'zh-CN': [
      '接案平台',
      '自由工作者',
      '远程工作',
      '外包服务',
      '项目管理',
      '人才匹配',
      '全球平台',
      '合约管理',
    ],
  };

  return baseKeywords[language] || baseKeywords['zh-TW'];
}

/**
 * 優化 SEO 內容
 */
export async function optimizeSEOContent(
  content: string,
  targetKeywords: string[],
  language: 'en' | 'zh-TW' | 'zh-CN'
): Promise<{
  optimizedContent: string;
  suggestions: string[];
  keywordDensity: Record<string, number>;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/optimize-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        content,
        targetKeywords,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`Content optimization failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ [AI SEO] Content optimization error:', error);
    throw error;
  }
}

/**
 * 計算關鍵字密度
 */
export function calculateKeywordDensity(
  content: string,
  keywords: string[]
): Record<string, number> {
  const text = content.toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;

  const density: Record<string, number> = {};

  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    const count = (text.match(new RegExp(keywordLower, 'g')) || []).length;
    density[keyword] = totalWords > 0 ? (count / totalWords) * 100 : 0;
  });

  return density;
}
