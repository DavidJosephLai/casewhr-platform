/**
 * AI SEO API 端點
 * 使用 OpenAI API 生成和優化 SEO 內容
 */

import { Hono } from 'npm:hono';

const app = new Hono();

// OpenAI API 配置
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * 調用 OpenAI API
 */
async function callOpenAI(messages: any[], temperature = 0.7) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ [OpenAI] API error:', error);
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * 生成 SEO 內容
 * POST /ai/generate-seo
 */
app.post('/generate-seo', async (c) => {
  try {
    const body = await c.req.json();
    const { pageType, language, currentTitle, currentDescription, context } = body;

    console.log('🤖 [AI SEO] Generate request:', { pageType, language });

    // 構建提示
    const languageMap: Record<string, string> = {
      'en': 'English',
      'zh-TW': 'Traditional Chinese (Taiwan)',
      'zh-CN': 'Simplified Chinese',
    };

    const prompt = `You are an expert SEO specialist. Generate optimized SEO content for a ${pageType} page of CaseWHR, a professional freelancing platform from Taiwan.

Platform Context:
- CaseWHR is a leading global freelancing platform from Taiwan
- Supports multi-currency (TWD, USD, CNY)
- Integrated with ECPay and PayPal
- Over 10,000 professional freelancers worldwide
- Complete contract management and invoice system

Current Content:
${currentTitle ? `Title: ${currentTitle}` : ''}
${currentDescription ? `Description: ${currentDescription}` : ''}
${context ? `Additional Context: ${context}` : ''}

Please generate in ${languageMap[language] || 'Traditional Chinese'}:

1. **Optimized Title** (50-60 characters)
   - Include primary keywords
   - Compelling and click-worthy
   - Brand name included

2. **Meta Description** (150-160 characters)
   - Engaging and informative
   - Include call-to-action
   - Primary keywords naturally integrated

3. **Keywords** (5-10 keywords)
   - Mix of primary and long-tail keywords
   - Relevant to the page type
   - Include industry-specific terms

4. **SEO Suggestions** (3-5 actionable tips)
   - Content optimization tips
   - Technical SEO recommendations
   - User engagement strategies

Respond in JSON format:
{
  "title": "optimized title here",
  "description": "optimized description here",
  "keywords": ["keyword1", "keyword2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "score": 85
}`;

    const content = await callOpenAI([
      {
        role: 'system',
        content: 'You are an expert SEO specialist. Always respond with valid JSON only, no additional text.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // 解析 JSON 響應
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      // 如果直接解析失敗，嘗試提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('✅ [AI SEO] Generated successfully');
    return c.json(result);

  } catch (error) {
    console.error('❌ [AI SEO] Generate error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to generate SEO content' },
      500
    );
  }
});

/**
 * 分析 SEO
 * POST /ai/analyze-seo
 */
app.post('/analyze-seo', async (c) => {
  try {
    const body = await c.req.json();
    const { title, description, keywords, content, language } = body;

    console.log('🤖 [AI SEO] Analyze request');

    const prompt = `Analyze the following SEO elements and provide detailed feedback:

Title: ${title || 'Not provided'}
Description: ${description || 'Not provided'}
Keywords: ${keywords || 'Not provided'}
Content Preview: ${content?.substring(0, 500) || 'Not provided'}

Provide analysis in JSON format:
{
  "score": 75,
  "issues": [
    {
      "type": "error|warning|info",
      "message": "issue description",
      "suggestion": "how to fix"
    }
  ],
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}

Focus on:
- Title length and keyword placement
- Description length and call-to-action
- Keyword relevance and density
- Content structure and readability
- Mobile optimization
- User intent matching`;

    const aiContent = await callOpenAI([
      {
        role: 'system',
        content: 'You are an SEO analyst. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let result;
    try {
      result = JSON.parse(aiContent);
    } catch (e) {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('✅ [AI SEO] Analyzed successfully');
    return c.json(result);

  } catch (error) {
    console.error('❌ [AI SEO] Analyze error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze SEO' },
      500
    );
  }
});

/**
 * 建議關鍵字
 * POST /ai/suggest-keywords
 */
app.post('/suggest-keywords', async (c) => {
  try {
    const body = await c.req.json();
    const { topic, language } = body;

    console.log('🤖 [AI SEO] Keyword suggestion request:', topic);

    const languageMap: Record<string, string> = {
      'en': 'English',
      'zh-TW': 'Traditional Chinese (Taiwan)',
      'zh-CN': 'Simplified Chinese',
    };

    const prompt = `Generate SEO keywords for the following topic related to CaseWHR freelancing platform:

Topic: ${topic}
Language: ${languageMap[language] || 'Traditional Chinese'}

Generate 10-15 relevant keywords including:
- Primary keywords (high volume, competitive)
- Long-tail keywords (specific, lower competition)
- Related industry terms
- Local keywords (for Taiwan market if applicable)

Consider:
- Freelancing and remote work industry
- Professional services marketplace
- Project management and contracts
- International payment systems (ECPay, PayPal)

Respond with JSON only:
{
  "keywords": ["keyword1", "keyword2", ...]
}`;

    const content = await callOpenAI([
      {
        role: 'system',
        content: 'You are an SEO keyword research specialist. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], 0.8); // Higher temperature for creativity

    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('✅ [AI SEO] Keywords suggested:', result.keywords?.length);
    return c.json(result);

  } catch (error) {
    console.error('❌ [AI SEO] Keyword suggestion error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to suggest keywords' },
      500
    );
  }
});

/**
 * 優化內容
 * POST /ai/optimize-content
 */
app.post('/optimize-content', async (c) => {
  try {
    const body = await c.req.json();
    const { content, targetKeywords, language } = body;

    console.log('🤖 [AI SEO] Content optimization request');

    const prompt = `Optimize the following content for SEO while maintaining natural readability:

Original Content:
${content}

Target Keywords: ${targetKeywords.join(', ')}

Requirements:
1. Naturally integrate target keywords
2. Improve readability and flow
3. Add relevant semantic keywords
4. Maintain the original message and tone
5. Optimize for featured snippets
6. Keep it engaging and user-friendly

Respond with JSON:
{
  "optimizedContent": "improved content here",
  "suggestions": ["suggestion1", "suggestion2"],
  "keywordDensity": {
    "keyword1": 2.5,
    "keyword2": 1.8
  }
}`;

    const aiContent = await callOpenAI([
      {
        role: 'system',
        content: 'You are an SEO content optimizer. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let result;
    try {
      result = JSON.parse(aiContent);
    } catch (e) {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('✅ [AI SEO] Content optimized');
    return c.json(result);

  } catch (error) {
    console.error('❌ [AI SEO] Content optimization error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to optimize content' },
      500
    );
  }
});

export default app;
