// AI Chatbot Service - Comprehensive AI Assistant for casewhr.com
// Supports: Customer Service, Project Advisory, Proposal Writing, Translation

import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const app = new Hono();

// System prompts for different assistant modes
const SYSTEM_PROMPTS = {
  en: `You are an intelligent AI assistant for casewhr.com, a professional global freelance marketplace platform.

Your capabilities include:
1. **Customer Service**: Answer questions about platform features, how to post projects, submit proposals, payments, etc.
2. **Project Advisory**: Help users write better project descriptions, recommend skill tags, estimate budgets, suggest deadlines
3. **Proposal Writing**: Help freelancers write professional cover letters and optimize proposal content
4. **Translation**: Translate between English and Chinese (Traditional/Simplified)

Platform Key Features:
- Dual currency support (TWD/USD/CNY)
- Escrow payment system for secure transactions
- Milestone-based project management
- Professional subscription plans (Basic/Pro/Enterprise)
- Multi-payment methods (PayPal, ECPay, LINE Pay)
- AI-powered SEO optimization for project listings
- Minimum deposit: NT$300

Guidelines:
- Be professional, helpful, and friendly
- Provide accurate information about the platform
- Use emojis appropriately to make responses engaging
- Keep responses concise but comprehensive
- Support multilingual users seamlessly`,

  'zh-TW': `你是 casewhr.com 的智能 AI 助手，這是一個專業的全球接案平台。

你的功能包括：
1. **智能客服**：回答有關平台功能、如何發布專案、提交提案、付款等問題
2. **專案顧問**：幫助用戶撰寫更好的專案描述、推薦技能標籤、估算預算、建議截止日期
3. **提案助手**：幫助自由職業者撰寫專業的求職信並優化提案內容
4. **翻譯服務**：提供中英文（繁體/簡體）即時翻譯

平台核心功能：
- 支援雙幣系統（新台幣/美金/人民幣）
- 託管付款系統確保交易安全
- 里程碑式專案管理
- 專業訂閱方案（基礎版/專業版/企業版）
- 多種支付方式（PayPal、綠界、LINE Pay）
- AI 驅動的 SEO 優化功能
- 最低儲值金額：NT$300

指導原則：
- 保持專業、友善且有幫助
- 提供準確的平台資訊
- 適當使用表情符號讓回應更生動
- 回應簡潔但全面
- 無縫支援多語言用戶`,

  'zh-CN': `你是 casewhr.com 的智能 AI 助手，这是一个专业的全球接案平台。

你的功能包括：
1. **智能客服**：回答有关平台功能、如何发布项目、提交提案、付款等问题
2. **项目顾问**：帮助用户撰写更好的项目描述、推荐技能标签、估算预算、建议截止日期
3. **提案助手**：帮助自由职业者撰写专业的求职信并优化提案内容
4. **翻译服务**：提供中英文（繁体/简体）即时翻译

平台核心功能：
- 支持双币系统（新台币/美金/人民币）
- 托管付款系统确保交易安全
- 里程碑式项目管理
- 专业订阅方案（基础版/专业版/企业版）
- 多种支付方式（PayPal、绿界、LINE Pay）
- AI 驅动的 SEO 优化功能
- 最低储值金额：NT$300

指导原则：
- 保持专业、友善且有帮助
- 提供准确的平台信息
- 适当使用表情符号让回应更生动
- 回应简洁但全面
- 无缝支持多语言用户`
};

// Chat endpoint
app.post('/chat', async (c) => {
  try {
    const { messages, language = 'zh-TW', userId } = await c.req.json();

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: 'Invalid messages format' }, 400);
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('❌ [AI Chatbot] OPENAI_API_KEY not configured');
      return c.json({ error: 'AI service not configured' }, 500);
    }

    // Select appropriate system prompt based on language
    const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS['zh-TW'];

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log('🤖 [AI Chatbot] Processing chat request:', {
      language,
      userId: userId || 'anonymous',
      messageCount: messages.length
    });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [AI Chatbot] OpenAI API error:', errorData);
      return c.json({ error: 'AI service error', details: errorData }, 500);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    console.log('✅ [AI Chatbot] Response generated successfully');

    // Optional: Log chat for analytics (if user is logged in)
    if (userId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabase.from('kv_store_215f78a5').insert({
          key: `chatbot_log_${userId}_${Date.now()}`,
          value: JSON.stringify({
            user_id: userId,
            language,
            message_count: messages.length,
            timestamp: new Date().toISOString()
          })
        });
      } catch (logError) {
        console.warn('⚠️ [AI Chatbot] Failed to log chat:', logError);
        // Don't fail the request if logging fails
      }
    }

    return c.json({
      message: assistantMessage,
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    console.error('❌ [AI Chatbot] Error:', error);
    return c.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, 500);
  }
});

// Quick suggestions endpoint
app.get('/suggestions', async (c) => {
  const language = c.req.query('language') || 'zh-TW';
  
  const suggestions = {
    'en': [
      // Platform basics
      '💼 How do I post a new project?',
      '👤 How do I create a freelancer profile?',
      '💰 What payment methods are available?',
      '🔒 How does escrow payment work?',
      
      // Project management
      '📝 Help me write a project description',
      '🎯 Recommend skill tags for my project',
      '💵 How to estimate project budget?',
      '⏰ What\'s a reasonable project deadline?',
      
      // Proposal & bidding
      '✍️ Help me write a winning proposal',
      '💡 Tips for standing out in proposals',
      '📊 How to price my services?',
      
      // Account & subscription
      '⭐ What are the subscription plan differences?',
      '💳 How to deposit funds to wallet?',
      '🎁 Are there any promotions?',
      
      // Translation
      '🔄 Translate this to Chinese',
      '🌐 Translate this to English',
      
      // SEO & visibility
      '🚀 How to improve project visibility?',
      '🔍 What is AI SEO optimization?'
    ],
    'zh-TW': [
      // 平台基礎
      '💼 如何發布新專案？',
      '👤 如何建立接案者個人檔案？',
      '💰 有哪些付款方式？',
      '🔒 託管付款如何運作？',
      
      // 專案管理
      '📝 幫我撰寫專案描述',
      '🎯 推薦適合我專案的技能標籤',
      '💵 如何估算專案預算？',
      '⏰ 合理的專案期限是多久？',
      
      // 提案與競標
      '✍️ 幫我撰寫成功的提案',
      '💡 提案脫穎而出的技巧',
      '📊 如何定價我的服務？',
      
      // 帳戶與訂閱
      '⭐ 訂閱方案有什麼差別？',
      '💳 如何儲值到錢包？',
      '🎁 目前有什麼優惠活動嗎？',
      
      // 翻譯
      '🔄 將此翻譯成英文',
      '🌐 將此翻譯成簡體中文',
      
      // SEO與能見度
      '🚀 如何提高專案曝光率？',
      '🔍 什麼是 AI SEO 優化？'
    ],
    'zh-CN': [
      // 平台基础
      '💼 如何发布新项目？',
      '👤 如何建立接案者个人档案？',
      '💰 有哪些付款方式？',
      '🔒 托管付款如何运作？',
      
      // 项目管理
      '📝 帮我撰写项目描述',
      '🎯 推荐适合我项目的技能标签',
      '💵 如何估算项目预算？',
      '⏰ 合理的项目期限是多久？',
      
      // 提案与竞标
      '✍️ 帮我撰写成功的提案',
      '💡 提案脱颖而出的技巧',
      '📊 如何定价我的服务？',
      
      // 账户与订阅
      '⭐ 订阅方案有什么差别？',
      '💳 如何储值到钱包？',
      '🎁 目前有什么优惠活动吗？',
      
      // 翻译
      '🔄 将此翻译成英文',
      '🌐 将此翻译成繁体中文',
      
      // SEO与能见度
      '🚀 如何提高项目曝光率？',
      '🔍 什么是 AI SEO 优化？'
    ]
  };

  return c.json({ suggestions: suggestions[language] || suggestions['zh-TW'] });
});

export default app;