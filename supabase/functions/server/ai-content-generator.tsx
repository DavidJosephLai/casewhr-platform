/**
 * AI Content Generator Service
 * 為 SEO 生成完整的文章內容、FAQ、HowTo 等
 */

interface ContentGenerationParams {
  url: string;
  title: string;
  description: string;
  keywords: string;
  language: 'en' | 'zh-TW' | 'zh-CN';
  contentType: 'article' | 'landing-page' | 'service-page' | 'product-page';
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly';
  wordCount?: number;
}

interface GeneratedContent {
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  sections: {
    h2: string;
    h3?: string[];
    content: string[];
    keyPoints?: string[];
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
  callToAction: string;
  internalLinks?: {
    text: string;
    url: string;
    context: string;
  }[];
  seoScore: number;
  improvements: string[];
}

export class AIContentGenerator {
  private apiKey: string;
  private model: string = 'gpt-4o';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 生成完整的 SEO 優化文章內容
   */
  async generateFullContent(params: ContentGenerationParams): Promise<GeneratedContent> {
    console.log('🤖 [AI Content] Generating full content for:', params.url);

    const prompt = this.buildContentPrompt(params);
    const response = await this.callOpenAI(prompt, params.language);

    return this.parseContentResponse(response, params);
  }

  /**
   * 生成 FAQ 內容（專門用於 AI 搜尋引擎）
   */
  async generateFAQ(params: {
    topic: string;
    keywords: string[];
    language: string;
    count?: number;
  }): Promise<Array<{ question: string; answer: string }>> {
    console.log('❓ [AI Content] Generating FAQ for:', params.topic);

    const prompt = `Generate ${params.count || 8} frequently asked questions and detailed answers about "${params.topic}".

Requirements:
- Questions should target common search queries
- Answers should be 2-3 sentences, informative and helpful
- Include keywords naturally: ${params.keywords.join(', ')}
- Language: ${params.language}
- Focus on user intent and provide actionable information

Format as JSON array:
[
  {
    "question": "Question here?",
    "answer": "Detailed answer here."
  }
]`;

    const response = await this.callOpenAI(prompt, params.language);
    return this.parseFAQResponse(response);
  }

  /**
   * 關鍵字研究和建議
   */
  async researchKeywords(params: {
    topic: string;
    industry: string;
    language: string;
    competitors?: string[];
  }): Promise<{
    primary: string[];
    secondary: string[];
    longTail: string[];
    questions: string[];
    trends: string[];
    searchIntent: {
      informational: string[];
      transactional: string[];
      navigational: string[];
    };
  }> {
    console.log('🔍 [AI Content] Researching keywords for:', params.topic);

    const prompt = `Perform comprehensive keyword research for: "${params.topic}" in ${params.industry} industry.

${params.competitors ? `Competitors: ${params.competitors.join(', ')}` : ''}

Provide:
1. Primary keywords (5-7 high-value terms)
2. Secondary keywords (10-15 supporting terms)
3. Long-tail keywords (15-20 specific phrases)
4. Question-based keywords (10-15 common questions)
5. Trending keywords (5-10 emerging terms)
6. Search intent categorization

Language: ${params.language}
Focus on CaseWHR freelancing platform context: Taiwan-based, global reach, multi-currency, professional services.

Return as JSON:
{
  "primary": ["keyword1", "keyword2"],
  "secondary": ["keyword3", "keyword4"],
  "longTail": ["specific phrase 1", "specific phrase 2"],
  "questions": ["how to...", "what is..."],
  "trends": ["trending term 1"],
  "searchIntent": {
    "informational": ["learning keywords"],
    "transactional": ["buying/action keywords"],
    "navigational": ["brand/location keywords"]
  }
}`;

    const response = await this.callOpenAI(prompt, params.language);
    return this.parseKeywordResponse(response);
  }

  /**
   * 競爭對手分析
   */
  async analyzeCompetitors(params: {
    competitors: string[];
    topic: string;
    language: string;
  }): Promise<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    contentGaps: string[];
    recommendations: string[];
  }> {
    console.log('🎯 [AI Content] Analyzing competitors:', params.competitors);

    const prompt = `Analyze these competitor platforms: ${params.competitors.join(', ')}

Topic/Industry: ${params.topic}
Your platform: CaseWHR (Taiwan-based global freelancing platform with multi-currency support)

Provide:
1. Competitor Strengths (what they do well)
2. Competitor Weaknesses (gaps and opportunities)
3. Market Opportunities (areas to focus)
4. Content Gaps (topics they don't cover well)
5. Actionable Recommendations (specific tactics)

Language: ${params.language}

Return as JSON:
{
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "opportunities": ["opportunity 1"],
  "contentGaps": ["gap 1", "gap 2"],
  "recommendations": ["recommendation 1"]
}`;

    const response = await this.callOpenAI(prompt, params.language);
    return this.parseCompetitorResponse(response);
  }

  /**
   * SEO 評分和改進建議
   */
  async scoreSEO(params: {
    url: string;
    title: string;
    description: string;
    content: string;
    keywords: string[];
    headings: { h1?: string; h2: string[]; h3: string[] };
    language: string;
  }): Promise<{
    overallScore: number;
    scores: {
      titleOptimization: number;
      descriptionOptimization: number;
      keywordUsage: number;
      contentQuality: number;
      headingStructure: number;
      readability: number;
      technicalSEO: number;
    };
    improvements: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      issue: string;
      recommendation: string;
      impact: string;
    }>;
    strengths: string[];
  }> {
    console.log('📊 [AI Content] Scoring SEO for:', params.url);

    const prompt = `Analyze this page for SEO quality and provide a detailed score.

URL: ${params.url}
Title: ${params.title}
Description: ${params.description}
Keywords: ${params.keywords.join(', ')}
H1: ${params.headings.h1 || 'None'}
H2 Count: ${params.headings.h2.length}
H3 Count: ${params.headings.h3.length}
Content Length: ${params.content.length} characters

Evaluate:
1. Title Optimization (0-100): Length, keyword placement, clarity
2. Description Optimization (0-100): Length, keyword usage, call-to-action
3. Keyword Usage (0-100): Natural integration, density, relevance
4. Content Quality (0-100): Value, depth, originality
5. Heading Structure (0-100): Hierarchy, keyword usage, clarity
6. Readability (0-100): Clarity, flow, formatting
7. Technical SEO (0-100): URL structure, meta tags, schema readiness

Provide:
- Overall Score (average of all categories)
- Individual category scores
- Prioritized improvements (high/medium/low priority)
- Current strengths

Language: ${params.language}

Return as JSON:
{
  "overallScore": 75,
  "scores": {
    "titleOptimization": 80,
    "descriptionOptimization": 75,
    "keywordUsage": 70,
    "contentQuality": 85,
    "headingStructure": 75,
    "readability": 80,
    "technicalSEO": 65
  },
  "improvements": [
    {
      "category": "Title Optimization",
      "priority": "high",
      "issue": "Issue description",
      "recommendation": "Specific action",
      "impact": "Expected impact"
    }
  ],
  "strengths": ["strength 1", "strength 2"]
}`;

    const response = await this.callOpenAI(prompt, params.language);
    return this.parseSEOScoreResponse(response);
  }

  /**
   * 生成內部連結建議
   */
  async suggestInternalLinks(params: {
    currentPage: string;
    content: string;
    allPages: Array<{ url: string; title: string; keywords: string[] }>;
    language: string;
  }): Promise<Array<{
    targetPage: string;
    anchorText: string;
    context: string;
    relevanceScore: number;
    position: 'intro' | 'body' | 'conclusion';
  }>> {
    console.log('🔗 [AI Content] Generating internal link suggestions');

    const prompt = `Suggest relevant internal links for this page.

Current Page: ${params.currentPage}
Content Preview: ${params.content.substring(0, 500)}...

Available Pages:
${params.allPages.map(p => `- ${p.url}: "${p.title}" (Keywords: ${p.keywords.join(', ')})`).join('\n')}

Provide 5-8 high-quality internal link suggestions:
- Natural anchor text
- Contextual relevance
- Strategic placement
- SEO value

Language: ${params.language}

Return as JSON array:
[
  {
    "targetPage": "/page-url",
    "anchorText": "natural anchor text",
    "context": "surrounding context for the link",
    "relevanceScore": 85,
    "position": "body"
  }
]`;

    const response = await this.callOpenAI(prompt, params.language);
    return this.parseInternalLinksResponse(response);
  }

  /**
   * 建立內容 Prompt
   */
  private buildContentPrompt(params: ContentGenerationParams): string {
    const { url, title, description, keywords, language, contentType, targetAudience, tone, wordCount } = params;

    return `Generate comprehensive, SEO-optimized content for a ${contentType}.

Page URL: ${url}
Target Title: ${title}
Meta Description: ${description}
Keywords: ${keywords}
Language: ${language}
Target Audience: ${targetAudience || 'Professional freelancers and clients'}
Tone: ${tone || 'professional'}
Target Word Count: ${wordCount || 1200}

Context: CaseWHR is a Taiwan-based global freelancing platform with:
- Multi-currency support (TWD, USD, CNY)
- Professional talent matching
- Integrated payment systems (ECPay, PayPal, Stripe)
- Contract and invoice management
- Enterprise branding capabilities

Requirements:
1. **H1 Heading**: Compelling, keyword-rich main heading
2. **Introduction** (150-200 words): Hook readers, include primary keyword
3. **Main Content Sections** (3-5 sections with H2 headings):
   - Each section 200-300 words
   - Include H3 subheadings where relevant
   - Natural keyword integration
   - Bullet points and lists for readability
   - Actionable information
4. **FAQ Section**: 6-8 questions optimized for AI search engines
5. **Call-to-Action**: Clear, compelling CTA
6. **Internal Link Opportunities**: Suggest 5-7 anchor texts for internal linking

Optimization for AI Search Engines:
- Answer common questions directly
- Use semantic keywords and related terms
- Include specific examples and use cases
- Structure content for featured snippets
- Focus on user intent and value

Return as JSON:
{
  "title": "Optimized page title",
  "description": "Optimized meta description",
  "keywords": ["keyword1", "keyword2"],
  "h1": "Main heading",
  "sections": [
    {
      "h2": "Section heading",
      "h3": ["Subheading 1", "Subheading 2"],
      "content": ["Paragraph 1", "Paragraph 2"],
      "keyPoints": ["Key point 1", "Key point 2"]
    }
  ],
  "faq": [
    {
      "question": "Question?",
      "answer": "Detailed answer."
    }
  ],
  "callToAction": "CTA text",
  "internalLinks": [
    {
      "text": "anchor text",
      "url": "/suggested-page",
      "context": "where to place it"
    }
  ],
  "seoScore": 85,
  "improvements": ["improvement 1", "improvement 2"]
}`;
  }

  /**
   * 調用 OpenAI API
   */
  private async callOpenAI(prompt: string, language: string): Promise<string> {
    const systemPrompt = `You are an expert SEO content strategist and writer specializing in ${language === 'en' ? 'English' : language === 'zh-CN' ? 'Simplified Chinese' : 'Traditional Chinese'} content.

Your expertise includes:
- Creating content optimized for AI search engines (ChatGPT, Perplexity, Google AI Overview)
- Semantic SEO and natural language processing
- User intent analysis
- Content structure for featured snippets
- International SEO best practices
- E-E-A-T principles (Experience, Expertise, Authoritativeness, Trustworthiness)

Always provide actionable, data-driven recommendations in JSON format.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ [AI Content] OpenAI API error:', error);
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * 解析內容生成回應
   */
  private parseContentResponse(response: string, params: ContentGenerationParams): GeneratedContent {
    try {
      const parsed = JSON.parse(response);
      return {
        title: parsed.title || params.title,
        description: parsed.description || params.description,
        keywords: parsed.keywords || params.keywords.split(',').map((k: string) => k.trim()),
        h1: parsed.h1 || parsed.title,
        sections: parsed.sections || [],
        faq: parsed.faq || [],
        callToAction: parsed.callToAction || '',
        internalLinks: parsed.internalLinks || [],
        seoScore: parsed.seoScore || 0,
        improvements: parsed.improvements || [],
      };
    } catch (error) {
      console.error('❌ [AI Content] Failed to parse content response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  /**
   * 解析 FAQ 回應
   */
  private parseFAQResponse(response: string): Array<{ question: string; answer: string }> {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : parsed.faq || [];
    } catch (error) {
      console.error('❌ [AI Content] Failed to parse FAQ response:', error);
      return [];
    }
  }

  /**
   * 解析關鍵字研究回應
   */
  private parseKeywordResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('❌ [AI Content] Failed to parse keyword response:', error);
      return {
        primary: [],
        secondary: [],
        longTail: [],
        questions: [],
        trends: [],
        searchIntent: { informational: [], transactional: [], navigational: [] },
      };
    }
  }

  /**
   * 解析競爭對手分析回應
   */
  private parseCompetitorResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('❌ [AI Content] Failed to parse competitor response:', error);
      return {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        contentGaps: [],
        recommendations: [],
      };
    }
  }

  /**
   * 解析 SEO 評分回應
   */
  private parseSEOScoreResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('❌ [AI Content] Failed to parse SEO score response:', error);
      return {
        overallScore: 0,
        scores: {
          titleOptimization: 0,
          descriptionOptimization: 0,
          keywordUsage: 0,
          contentQuality: 0,
          headingStructure: 0,
          readability: 0,
          technicalSEO: 0,
        },
        improvements: [],
        strengths: [],
      };
    }
  }

  /**
   * 解析內部連結建議回應
   */
  private parseInternalLinksResponse(response: string): any[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : parsed.links || [];
    } catch (error) {
      console.error('❌ [AI Content] Failed to parse internal links response:', error);
      return [];
    }
  }
}

export default AIContentGenerator;
