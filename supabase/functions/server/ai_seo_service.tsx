/**
 * AI SEO Service - OpenAI Integration
 * 为 Casewhere 平台提供 AI 驱动的 SEO 功能
 * 
 * 功能：
 * - 生成 SEO 标题和描述
 * - 关键词研究和分析
 * - SEO 内容优化建议
 * - 支持三语言（zh-TW, en, zh-CN）
 */

import OpenAI from "npm:openai@4.20.1";

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

/**
 * 语言配置
 */
const LANGUAGE_CONFIGS = {
  "zh-TW": {
    name: "繁體中文",
    systemPrompt: "你是一位專業的 SEO 專家，專精於繁體中文市場的搜尋引擎優化。",
  },
  "en": {
    name: "English",
    systemPrompt: "You are a professional SEO expert specializing in English-language search engine optimization.",
  },
  "zh-CN": {
    name: "简体中文",
    systemPrompt: "你是一位专业的 SEO 专家，专精于简体中文市场的搜索引擎优化。",
  },
};

/**
 * SEO 生成接口
 */
export interface SEOGenerationInput {
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  language?: "zh-TW" | "en" | "zh-CN";
  targetAudience?: string;
  projectType?: string;
}

export interface SEOGenerationOutput {
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  suggestions: string[];
  score: number;
  language: string;
}

/**
 * 关键词研究接口
 */
export interface KeywordResearchInput {
  topic: string;
  industry?: string;
  language?: "zh-TW" | "en" | "zh-CN";
  count?: number;
}

export interface KeywordResearchOutput {
  keywords: Array<{
    keyword: string;
    relevance: number;
    difficulty: string;
    searchVolume: string;
  }>;
  suggestions: string[];
  language: string;
}

/**
 * 生成 SEO 元数据
 */
export async function generateSEO(
  input: SEOGenerationInput
): Promise<SEOGenerationOutput> {
  try {
    const language = input.language || "zh-TW";
    const langConfig = LANGUAGE_CONFIGS[language];

    // 构建提示词
    const userPrompt = buildSEOPrompt(input, language);

    // 调用 OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // 升級到最新 GPT-4o 模型（更快、更便宜、更強大）
      messages: [
        {
          role: "system",
          content: langConfig.systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    
    // 解析 AI 回應
    const result = parseAIResponse(responseText, language);

    return result;
  } catch (error) {
    throw new Error(`AI SEO generation failed: ${error.message}`);
  }
}

/**
 * 关键词研究
 */
export async function researchKeywords(
  input: KeywordResearchInput
): Promise<KeywordResearchOutput> {
  try {
    const language = input.language || "zh-TW";
    const count = input.count || 10;
    const langConfig = LANGUAGE_CONFIGS[language];

    // 构建提示词
    const userPrompt = buildKeywordPrompt(input, language, count);

    // 调用 OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // 升級到最新 GPT-4o 模型（更快、更便宜、更強大）
      messages: [
        {
          role: "system",
          content: langConfig.systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    
    // 解析关键词响应
    const result = parseKeywordResponse(responseText, language);

    return result;
  } catch (error) {
    throw new Error(`Keyword research failed: ${error.message}`);
  }
}

/**
 * 构建 SEO 生成提示词
 */
function buildSEOPrompt(input: SEOGenerationInput, language: string): string {
  const prompts = {
    "zh-TW": `
請為以下案件生成優化的 SEO 元數據：

原始標題：${input.title}
原始描述：${input.description}
${input.category ? `類別：${input.category}` : ""}
${input.tags?.length ? `標籤：${input.tags.join(", ")}` : ""}
${input.targetAudience ? `目標受眾：${input.targetAudience}` : ""}
${input.projectType ? `專案類型：${input.projectType}` : ""}

請以 JSON 格式回應，包含：
1. seoTitle：優化的 SEO 標題（50-60 字符，包含關鍵詞）
2. seoDescription：優化的 SEO 描述（150-160 字符，吸引點擊）
3. keywords：5-8 個相關關鍵詞
4. suggestions：3-5 條 SEO 優化建議
5. score：SEO 質量評分（0-100）

JSON 格式：
{
  "seoTitle": "...",
  "seoDescription": "...",
  "keywords": ["...", "..."],
  "suggestions": ["...", "..."],
  "score": 85
}
`,
    "en": `
Generate optimized SEO metadata for the following project:

Original Title: ${input.title}
Original Description: ${input.description}
${input.category ? `Category: ${input.category}` : ""}
${input.tags?.length ? `Tags: ${input.tags.join(", ")}` : ""}
${input.targetAudience ? `Target Audience: ${input.targetAudience}` : ""}
${input.projectType ? `Project Type: ${input.projectType}` : ""}

Please respond in JSON format with:
1. seoTitle: Optimized SEO title (50-60 characters, include keywords)
2. seoDescription: Optimized SEO description (150-160 characters, compelling)
3. keywords: 5-8 relevant keywords
4. suggestions: 3-5 SEO optimization tips
5. score: SEO quality score (0-100)

JSON format:
{
  "seoTitle": "...",
  "seoDescription": "...",
  "keywords": ["...", "..."],
  "suggestions": ["...", "..."],
  "score": 85
}
`,
    "zh-CN": `
请为以下案件生成优化的 SEO 元数据：

原始标题：${input.title}
原始描述：${input.description}
${input.category ? `类别：${input.category}` : ""}
${input.tags?.length ? `标签：${input.tags.join(", ")}` : ""}
${input.targetAudience ? `目标受众：${input.targetAudience}` : ""}
${input.projectType ? `项目类型：${input.projectType}` : ""}

请以 JSON 格式回应，包含：
1. seoTitle：优化的 SEO 标题（50-60 字符，包含关键词）
2. seoDescription：优化的 SEO 描述（150-160 字符，吸引点击）
3. keywords：5-8 个相关关键词
4. suggestions：3-5 条 SEO 优化建议
5. score：SEO 质量评分（0-100）

JSON 格式：
{
  "seoTitle": "...",
  "seoDescription": "...",
  "keywords": ["...", "..."],
  "suggestions": ["...", "..."],
  "score": 85
}
`,
  };

  return prompts[language];
}

/**
 * 构建关键词研究提示词
 */
function buildKeywordPrompt(
  input: KeywordResearchInput,
  language: string,
  count: number
): string {
  const prompts = {
    "zh-TW": `
請為以下主題進行關鍵詞研究：

主題：${input.topic}
${input.industry ? `產業：${input.industry}` : ""}
需要數量：${count} 個關鍵詞

請以 JSON 格式回應，包含：
1. keywords：關鍵詞列表，每個包含：
   - keyword：關鍵詞
   - relevance：相關性評分（0-100）
   - difficulty：難度（簡單/中等/困難）
   - searchVolume：搜索量（低/中/高）
2. suggestions：3-5 條關鍵詞策略建議

JSON 格式：
{
  "keywords": [
    {
      "keyword": "...",
      "relevance": 95,
      "difficulty": "中等",
      "searchVolume": "高"
    }
  ],
  "suggestions": ["...", "..."]
}
`,
    "en": `
Perform keyword research for the following topic:

Topic: ${input.topic}
${input.industry ? `Industry: ${input.industry}` : ""}
Number needed: ${count} keywords

Please respond in JSON format with:
1. keywords: List of keywords, each containing:
   - keyword: The keyword
   - relevance: Relevance score (0-100)
   - difficulty: Difficulty (Easy/Medium/Hard)
   - searchVolume: Search volume (Low/Medium/High)
2. suggestions: 3-5 keyword strategy tips

JSON format:
{
  "keywords": [
    {
      "keyword": "...",
      "relevance": 95,
      "difficulty": "Medium",
      "searchVolume": "High"
    }
  ],
  "suggestions": ["...", "..."]
}
`,
    "zh-CN": `
请为以下主题进行关键词研究：

主题：${input.topic}
${input.industry ? `产业：${input.industry}` : ""}
需要数量：${count} 个关键词

请以 JSON 格式回应，包含：
1. keywords：关键词列表，每个包含：
   - keyword：关键词
   - relevance：相关性评分（0-100）
   - difficulty：难度（简单/中等/困难）
   - searchVolume：搜索量（低/中/高）
2. suggestions：3-5 条关键词策略建议

JSON 格式：
{
  "keywords": [
    {
      "keyword": "...",
      "relevance": 95,
      "difficulty": "中等",
      "searchVolume": "高"
    }
  ],
  "suggestions": ["...", "..."]
}
`,
  };

  return prompts[language];
}

/**
 * 解析 AI SEO 响应
 */
function parseAIResponse(
  responseText: string,
  language: string
): SEOGenerationOutput {
  try {
    // 提取 JSON 内容
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      seoTitle: parsed.seoTitle || "",
      seoDescription: parsed.seoDescription || "",
      keywords: parsed.keywords || [],
      suggestions: parsed.suggestions || [],
      score: parsed.score || 0,
      language,
    };
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

/**
 * 解析关键词研究响应
 */
function parseKeywordResponse(
  responseText: string,
  language: string
): KeywordResearchOutput {
  try {
    // 提取 JSON 内容
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      keywords: parsed.keywords || [],
      suggestions: parsed.suggestions || [],
      language,
    };
  } catch (error) {
    throw new Error(`Failed to parse keyword response: ${error.message}`);
  }
}

/**
 * 健康检查 - 测试 OpenAI API 连接
 */
export async function healthCheck(): Promise<{
  status: string;
  apiKeyConfigured: boolean;
  message: string;
}> {
  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return {
        status: "error",
        apiKeyConfigured: false,
        message: "OPENAI_API_KEY not configured",
      };
    }

    // 简单测试 API 调用
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // 升級到最新 GPT-4o 模型（更快、更便宜、更強大）
      messages: [
        {
          role: "user",
          content: "Say 'OK' if you can hear me.",
        },
      ],
      max_tokens: 5,
    });

    const response = completion.choices[0]?.message?.content || "";

    return {
      status: "ok",
      apiKeyConfigured: true,
      message: `OpenAI API connected successfully. Response: ${response}`,
    };
  } catch (error) {
    return {
      status: "error",
      apiKeyConfigured: true,
      message: `OpenAI API error: ${error.message}`,
    };
  }
}