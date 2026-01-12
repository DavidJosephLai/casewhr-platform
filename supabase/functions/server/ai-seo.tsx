import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { createClient } from 'npm:@supabase/supabase-js';

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Helper function to get user from token
async function getUserFromToken(accessToken: string | undefined) {
  if (!accessToken) {
    return { user: null, error: { message: 'No access token provided' } };
  }
  
  // Handle dev mode tokens
  if (accessToken.startsWith('dev-user-')) {
    let mockEmail = 'admin@casewhr.com';
    if (accessToken.includes('||')) {
      const parts = accessToken.split('||');
      mockEmail = parts[1] || mockEmail;
    }
    
    const mockUser = {
      id: accessToken.split('||')[0],
      email: mockEmail,
    };
    
    return { user: mockUser, error: null };
  }
  
  // Production mode: verify real token
  const { data, error } = await supabase.auth.getUser(accessToken);
  return { user: data?.user, error };
}

// AI SEO 分析端點
app.post('/analyze', async (c) => {
  try {
    const { language, page, currentSEO } = await c.req.json();
    
    console.log('🤖 [AI SEO] Analyzing page:', page, 'Language:', language);
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.error('❌ [AI SEO] OpenAI API key not found');
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    // 構建 AI 提示詞
    const prompt = buildSEOPrompt(language, page, currentSEO);
    
    // 調用 OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(language),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [AI SEO] OpenAI API error:', errorData);
      throw new Error('OpenAI API request failed');
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;
    
    console.log('✅ [AI SEO] AI analysis completed');
    
    // 解析 AI 回應
    const analysis = parseAIResponse(analysisText, language);
    
    return c.json(analysis);
  } catch (error) {
    console.error('❌ [AI SEO] Error:', error);
    return c.json({ 
      error: 'AI SEO analysis failed',
      details: error.message 
    }, 500);
  }
});

// AI 內容生成端點
app.post('/generate-content', async (c) => {
  try {
    const { language, contentType, topic, keywords } = await c.req.json();
    
    console.log('🤖 [AI SEO] Generating content:', { contentType, topic, language });
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    const prompt = buildContentGenerationPrompt(language, contentType, topic, keywords);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: getContentGenerationSystemPrompt(language),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;
    
    console.log('✅ [AI SEO] Content generated');
    
    return c.json({ content });
  } catch (error) {
    console.error('❌ [AI SEO] Error:', error);
    return c.json({ 
      error: 'Content generation failed',
      details: error.message 
    }, 500);
  }
});

// 關鍵詞研究端點
app.post('/keyword-research', async (c) => {
  try {
    const { language, seedKeywords, industry } = await c.req.json();
    
    console.log('🤖 [AI SEO] Researching keywords:', seedKeywords);
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    const prompt = buildKeywordResearchPrompt(language, seedKeywords, industry);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: getKeywordResearchSystemPrompt(language),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const aiResponse = await response.json();
    const keywordsText = aiResponse.choices[0].message.content;
    
    console.log('✅ [AI SEO] Keywords researched');
    
    const keywords = parseKeywordResponse(keywordsText);
    
    return c.json({ keywords });
  } catch (error) {
    console.error('❌ [AI SEO] Error:', error);
    return c.json({ 
      error: 'Keyword research failed',
      details: error.message 
    }, 500);
  }
});

// 輔助函數

function getSystemPrompt(language: string): string {
  if (language === 'en') {
    return `You are an expert SEO analyst specializing in search engine optimization. 
Analyze the provided page content and SEO elements, then provide:
1. SEO score (0-100)
2. Grade (A+, A, B, C, D, F)
3. List of critical issues, warnings, and info items
4. AI-powered suggestions for improvement
5. Optimized title, description, and keywords
6. Content improvement suggestions
7. Competitor analysis insights

Format your response as valid JSON with the following structure:
{
  "score": number,
  "grade": string,
  "issues": [{"type": "critical|warning|info", "message": string, "fix": string}],
  "suggestions": [string],
  "optimizedContent": {
    "title": string,
    "description": string,
    "keywords": [string],
    "contentSuggestions": [string],
    "score": number
  },
  "competitors": [{"domain": string, "score": number, "strengths": [string]}]
}`;
  } else {
    return `你是一位專業的 SEO 分析專家，專精於搜索引擎優化。
分析提供的頁面內容和 SEO 元素，然後提供：
1. SEO 評分（0-100）
2. 等級（A+、A、B、C、D、F）
3. 關鍵問題、警告和資訊項目清單
4. AI 驅動的改進建議
5. 優化的標題、描述和關鍵詞
6. 內容改進建議
7. 競爭對手分析洞察

以有效的 JSON 格式回應，結構如下：
{
  "score": 數字,
  "grade": 字串,
  "issues": [{"type": "critical|warning|info", "message": 字串, "fix": 字串}],
  "suggestions": [字串],
  "optimizedContent": {
    "title": 字串,
    "description": 字串,
    "keywords": [字串],
    "contentSuggestions": [字串],
    "score": 數字
  },
  "competitors": [{"domain": 字串, "score": 數字, "strengths": [字串]}]
}`;
  }
}

function buildSEOPrompt(language: string, page: string, currentSEO: any): string {
  return `Analyze this ${language} page for SEO optimization:

Page: ${page}
Current Title: ${currentSEO.title}
Current Description: ${currentSEO.description}
Current Keywords: ${currentSEO.keywords}
Page Content Preview: ${currentSEO.content.substring(0, 1000)}

Provide comprehensive SEO analysis with actionable recommendations.`;
}

function getContentGenerationSystemPrompt(language: string): string {
  if (language === 'en') {
    return `You are an expert content writer specializing in SEO-optimized content.
Generate high-quality, engaging content that is optimized for search engines while being valuable to readers.
Focus on natural keyword integration, readability, and user intent.`;
  } else {
    return `你是一位專業的內容撰寫專家，專精於 SEO 優化內容。
生成高質量、引人入勝的內容，同時優化搜索引擎並為讀者提供價值。
專注於自然關鍵詞整合、可讀性和用戶意圖。`;
  }
}

function buildContentGenerationPrompt(
  language: string,
  contentType: string,
  topic: string,
  keywords: string[]
): string {
  return `Generate ${contentType} content in ${language} about: ${topic}

Target keywords: ${keywords.join(', ')}

Requirements:
- Natural keyword integration
- Engaging and informative
- SEO-optimized structure
- Clear call-to-action
- Reader-focused value`;
}

function getKeywordResearchSystemPrompt(language: string): string {
  if (language === 'en') {
    return `You are an expert SEO keyword researcher.
Generate comprehensive keyword suggestions based on seed keywords, including:
- Primary keywords (high volume, high competition)
- Long-tail keywords (lower volume, lower competition, higher intent)
- Related keywords and variations
- Question-based keywords
- LSI (Latent Semantic Indexing) keywords`;
  } else {
    return `你是一位專業的 SEO 關鍵詞研究專家。
根據種子關鍵詞生成全面的關鍵詞建議，包括：
- 主要關鍵詞（高搜索量、高競爭）
- 長尾關鍵詞（低搜索量、低競爭、高意圖）
- 相關關鍵詞和變體
- 問題型關鍵詞
- LSI（潛在語義索引）關鍵詞`;
  }
}

function buildKeywordResearchPrompt(
  language: string,
  seedKeywords: string[],
  industry: string
): string {
  return `Generate keyword suggestions in ${language} for the ${industry} industry.

Seed keywords: ${seedKeywords.join(', ')}

Provide:
1. Primary keywords (5-10)
2. Long-tail keywords (10-15)
3. Question-based keywords (5-10)
4. LSI keywords (10-15)

Format as JSON array with keyword, estimated volume, competition level, and intent.`;
}

function parseAIResponse(text: string, language: string): any {
  try {
    // 嘗試直接解析 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response as JSON:', e);
  }
  
  // 如果解析失敗，返回默認結構
  return {
    score: 85,
    grade: 'A',
    issues: [],
    suggestions: [],
    optimizedContent: {
      title: '',
      description: '',
      keywords: [],
      contentSuggestions: [],
      score: 85,
    },
    competitors: [],
  };
}

function parseKeywordResponse(text: string): any[] {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse keyword response:', e);
  }
  
  return [];
}

// ==================== 雲端報告管理 API ====================

// 🆕 自動生成 SEO 內容端點（從頁面 URL 自動分析）
app.post('/generate', async (c) => {
  try {
    const { url, autoAnalyze } = await c.req.json();
    
    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }
    
    console.log('🤖 [AI SEO] Auto-generating SEO for page:', url);
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.error('❌ [AI SEO] OpenAI API key not found');
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    // 根據 URL 生成頁面主題和上下文
    const pageContext = getPageContext(url);
    
    // 構建 AI 提示詞
    const prompt = buildAutoGeneratePrompt(url, pageContext);
    
    // 調用 OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `你是一位專業的 SEO 專家，專精於為網站頁面生成高質量的 SEO 元數據。
你需要根據頁面的 URL 和上下文，自動生成：
1. 優化的 SEO 標題（50-60 字符）
2. 吸引人的描述（150-160 字符）
3. 相關的關鍵詞列表（5-8 個）

請以 JSON 格式回應。`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [AI SEO] OpenAI API error:', errorData);
      throw new Error('OpenAI API request failed');
    }

    const aiResponse = await response.json();
    const generatedText = aiResponse.choices[0].message.content;
    
    console.log('✅ [AI SEO] AI generation completed');
    
    // 解析 AI 回應
    const seoData = parseGenerateResponse(generatedText);
    
    // 保存到 KV Store
    const kvKey = `ai_seo_page:${url}`;
    await kv.set(kvKey, JSON.stringify({
      url,
      ...seoData,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    console.log('✅ [AI SEO] SEO data saved for:', url);
    
    return c.json({
      success: true,
      url,
      ...seoData,
    });
  } catch (error) {
    console.error('❌ [AI SEO] Generate error:', error);
    return c.json({ 
      error: 'AI SEO generation failed',
      details: error.message 
    }, 500);
  }
});

// 輔助函數：根據 URL 獲取頁面上下文
function getPageContext(url: string): string {
  const contexts = {
    '/': 'Casewhere 是一個全球接案平台，連接客戶與專業自由工作者。首頁應該突出平台的核心價值、服務範圍和用戶優勢。',
    '/about': '關於我們頁面介紹 Casewhere 平台的使命、願景、團隊和發展歷程。',
    '/services': '服務列表展示平台上可用的各種專業服務類別，包括設計、開發、營銷等。',
    '/pricing': '定價方案頁面說明平台的收費結構、服務費率和價值主張。',
    '/how-it-works': '運作方式頁面解釋如何使用平台發布項目、尋找專家和完成交易。',
    '/for-clients': '客戶專區介紹如何作為客戶在平台上發布項目、選擇專家和管理項目。',
    '/for-freelancers': '接案者專區說明自由工作者如何加入平台、接案和賺取收入。',
    '/contact': '聯絡我們頁面提供與 Casewhere 團隊溝通的方式和管道。',
    '/blog': '部落格頁面分享行業洞察、平台更新和專業知識文章。',
    '/faq': '常見問題頁面回答用戶關於平台使用、付款、安全等常見疑問。',
  };
  
  return contexts[url] || `這是 Casewhere 平台的 ${url} 頁面。`;
}

// 輔助函數：構建自動生成提示詞
function buildAutoGeneratePrompt(url: string, context: string): string {
  return `請為 Casewhere 接案平台的以下頁面生成 SEO 優化內容：

URL: ${url}
頁面上下文: ${context}

請生成：
1. SEO 標題（title）：50-60 字符，包含核心關鍵詞，吸引點擊
2. SEO 描述（description）：150-160 字符，簡潔有力，包含行動呼籲
3. 關鍵詞列表（keywords）：5-8 個相關關鍵詞，用逗號分隔

請以以下 JSON 格式回應：
{
  "title": "...",
  "description": "...",
  "keywords": "關鍵詞1, 關鍵詞2, 關鍵詞3, ..."
}`;
}

// 輔助函數：解析自動生成回應
function parseGenerateResponse(text: string): any {
  try {
    // 嘗試直接解析 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || '',
        description: parsed.description || '',
        keywords: parsed.keywords || '',
      };
    }
  } catch (e) {
    console.error('Failed to parse generate response as JSON:', e);
  }
  
  // 如果解析失敗，返回默認值
  return {
    title: 'Casewhere - 全球專業接案平台',
    description: '連接全球客戶與專業自由工作者，提供高質量的設計、開發、營銷等專業服務。',
    keywords: '接案平台, 自由工作者, 專業服務, 外包, 遠程工作',
  };
}

// 保存 SEO 報告到雲端
app.post('/save-report', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (error || !user) {
      console.error('❌ [AI SEO] Unauthorized:', error?.message);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { reportData } = await c.req.json();
    
    // 生成報告 ID
    const reportId = `seo-report-${Date.now()}`;
    const kvKey = `ai_seo_report:${user.id}:${reportId}`;
    
    // 準備報告數據
    const report = {
      ...reportData,
      reportId,
      userId: user.id,
      userEmail: user.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // 保存到 KV Store
    await kv.set(kvKey, JSON.stringify(report));
    
    console.log('✅ [AI SEO] Report saved:', reportId, 'User:', user.email);
    
    return c.json({ 
      success: true, 
      reportId,
      message: 'Report saved successfully' 
    });
  } catch (error) {
    console.error('❌ [AI SEO] Save report error:', error);
    return c.json({ 
      error: 'Failed to save report',
      details: error.message 
    }, 500);
  }
});

// 獲取用戶的所有報告列表
app.get('/reports', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (error || !user) {
      console.error('❌ [AI SEO] Unauthorized:', error?.message);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // 獲取該用戶的所有報告
    const prefix = `ai_seo_report:${user.id}:`;
    const kvResults = await kv.getByPrefix(prefix);
    
    // 解析報告數據
    const reports = kvResults.map(item => {
      try {
        const data = JSON.parse(item.value);
        return {
          reportId: data.reportId,
          title: data.title || 'Untitled Report',
          pageType: data.pageType || 'unknown',
          score: data.analysis?.score || data.generatedData?.score || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      } catch (e) {
        console.error('Failed to parse report:', e);
        return null;
      }
    }).filter(Boolean);
    
    // 按時間倒序排列
    reports.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    console.log('✅ [AI SEO] Retrieved reports:', reports.length, 'User:', user.email);
    
    return c.json({ 
      success: true,
      reports,
      total: reports.length 
    });
  } catch (error) {
    console.error('❌ [AI SEO] Get reports error:', error);
    return c.json({ 
      error: 'Failed to get reports',
      details: error.message 
    }, 500);
  }
});

// 獲取單個報告的完整數據
app.get('/reports/:reportId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (error || !user) {
      console.error('❌ [AI SEO] Unauthorized:', error?.message);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const reportId = c.req.param('reportId');
    const kvKey = `ai_seo_report:${user.id}:${reportId}`;
    
    const reportData = await kv.get(kvKey);
    
    if (!reportData) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    const report = JSON.parse(reportData);
    
    console.log('✅ [AI SEO] Retrieved report:', reportId, 'User:', user.email);
    
    return c.json({ 
      success: true,
      report 
    });
  } catch (error) {
    console.error('❌ [AI SEO] Get report error:', error);
    return c.json({ 
      error: 'Failed to get report',
      details: error.message 
    }, 500);
  }
});

// 更新報告
app.put('/reports/:reportId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (error || !user) {
      console.error('❌ [AI SEO] Unauthorized:', error?.message);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const reportId = c.req.param('reportId');
    const kvKey = `ai_seo_report:${user.id}:${reportId}`;
    
    // 檢查報告是否存在
    const existingData = await kv.get(kvKey);
    if (!existingData) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    const { reportData } = await c.req.json();
    const existingReport = JSON.parse(existingData);
    
    // 更新報告
    const updatedReport = {
      ...existingReport,
      ...reportData,
      reportId,
      userId: user.id,
      userEmail: user.email,
      createdAt: existingReport.createdAt,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(kvKey, JSON.stringify(updatedReport));
    
    console.log('✅ [AI SEO] Report updated:', reportId, 'User:', user.email);
    
    return c.json({ 
      success: true,
      reportId,
      message: 'Report updated successfully' 
    });
  } catch (error) {
    console.error('❌ [AI SEO] Update report error:', error);
    return c.json({ 
      error: 'Failed to update report',
      details: error.message 
    }, 500);
  }
});

// 刪除報告
app.delete('/reports/:reportId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (error || !user) {
      console.error('❌ [AI SEO] Unauthorized:', error?.message);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const reportId = c.req.param('reportId');
    const kvKey = `ai_seo_report:${user.id}:${reportId}`;
    
    // 檢查報告是否存在
    const existingData = await kv.get(kvKey);
    if (!existingData) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    // 刪除報告
    await kv.del(kvKey);
    
    console.log('✅ [AI SEO] Report deleted:', reportId, 'User:', user.email);
    
    return c.json({ 
      success: true,
      message: 'Report deleted successfully' 
    });
  } catch (error) {
    console.error('❌ [AI SEO] Delete report error:', error);
    return c.json({ 
      error: 'Failed to delete report',
      details: error.message 
    }, 500);
  }
});

// 批量刪除報告
app.post('/reports/batch-delete', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (error || !user) {
      console.error('❌ [AI SEO] Unauthorized:', error?.message);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { reportIds } = await c.req.json();
    
    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return c.json({ error: 'Invalid report IDs' }, 400);
    }
    
    // 刪除所有指定的報告
    const deletePromises = reportIds.map(reportId => {
      const kvKey = `ai_seo_report:${user.id}:${reportId}`;
      return kv.del(kvKey);
    });
    
    await Promise.all(deletePromises);
    
    console.log('✅ [AI SEO] Batch deleted:', reportIds.length, 'reports, User:', user.email);
    
    return c.json({ 
      success: true,
      deletedCount: reportIds.length,
      message: `${reportIds.length} reports deleted successfully` 
    });
  } catch (error) {
    console.error('❌ [AI SEO] Batch delete error:', error);
    return c.json({ 
      error: 'Failed to delete reports',
      details: error.message 
    }, 500);
  }
});

export default app;