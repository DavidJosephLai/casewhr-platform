/**
 * Enterprise Chat Bot Service
 * 自動回覆企業聊天訊息
 */

interface BotResponse {
  message: string;
  delay?: number; // 延遲回覆（毫秒）
}

/**
 * 客戶經理機器人回覆
 */
export function getAccountManagerResponse(userMessage: string, language: 'en' | 'zh' = 'en'): BotResponse {
  const lowerMessage = userMessage.toLowerCase();
  
  // 問候語
  if (lowerMessage.match(/^(hi|hello|hey|你好|您好|嗨)/)) {
    return {
      message: language === 'en' 
        ? "Hello! I'm your dedicated account manager. How can I assist you today? 😊"
        : "您好！我是您的專屬客戶經理。今天有什麼可以幫助您的嗎？😊",
      delay: 1000
    };
  }
  
  // 詢問訂閱/方案
  if (lowerMessage.match(/(subscription|plan|pricing|upgrade|訂閱|方案|價格|升級)/)) {
    return {
      message: language === 'en'
        ? "Great question! We offer three plans:\n\n💎 Enterprise ($99/mo) - Full features + priority support\n🚀 Professional ($49/mo) - Advanced tools\n🆓 Free - Basic features\n\nWould you like me to help you upgrade?"
        : "好問題！我們提供三種方案：\n\n💎 企業版 ($99/月) - 完整功能 + 優先支援\n🚀 專業版 ($49/月) - 進階工具\n🆓 免費版 - 基礎功能\n\n需要我協助您升級嗎？",
      delay: 1500
    };
  }
  
  // 詢問功能
  if (lowerMessage.match(/(feature|function|capability|what can|功能|能做什麼|可以做)/)) {
    return {
      message: language === 'en'
        ? "Our platform offers:\n\n✨ Project management\n💰 Secure payments (ECPay, PayPal)\n👥 Team collaboration\n📊 Analytics & reporting\n💬 Enterprise chat (current!)\n🔐 SSO login (Google, GitHub, FB)\n\nWhat would you like to know more about?"
        : "我們的平台提供：\n\n✨ 專案管理\n💰 安全支付 (ECPay, PayPal)\n👥 團隊協作\n📊 分析與報告\n💬 企業即時聊天（就是這個！）\n🔐 單點登錄 (Google, GitHub, FB)\n\n您想了解哪個功能的詳細資訊？",
      delay: 1500
    };
  }
  
  // 詢問支付
  if (lowerMessage.match(/(payment|pay|deposit|charge|支付|付款|儲值|充值)/)) {
    return {
      message: language === 'en'
        ? "We support multiple payment methods:\n\n💳 ECPay (綠界) - Credit card, ATM, CVS\n💙 PayPal - International payments\n\nAll transactions are secure and encrypted. Your funds are safe! 🔒"
        : "我們支援多種支付方式：\n\n💳 ECPay (綠界) - 信用卡、ATM、超商\n💙 PayPal - 國際支付\n\n所有交易都經過加密保護，您的資金很安全！🔒",
      delay: 1200
    };
  }
  
  // 詢問團隊
  if (lowerMessage.match(/(team|member|collaborate|invite|團隊|成員|協作|邀請)/)) {
    return {
      message: language === 'en'
        ? "Team management is an Enterprise feature! 👥\n\nWith Enterprise plan you can:\n• Invite unlimited team members\n• Assign roles (Admin/Member)\n• Share projects\n• Track team activity\n\nWant to upgrade to collaborate with your team?"
        : "團隊管理是企業版功能！👥\n\n企業版可以：\n• 邀請無限團隊成員\n• 分配角色（管理員/成員）\n• 共享專案\n• 追蹤團隊活動\n\n想要升級以便與團隊協作嗎？",
      delay: 1500
    };
  }
  
  // 詢問幫助
  if (lowerMessage.match(/(help|support|問題|幫助|支援|客服)/)) {
    return {
      message: language === 'en'
        ? "I'm here to help! 🤝\n\nYou can:\n• Ask me about features\n• Get help with payments\n• Learn about plans\n• Report issues\n\nOr chat with our Support Team for technical help.\n\nWhat do you need assistance with?"
        : "我在這裡幫助您！🤝\n\n您可以：\n• 詢問功能相關問題\n• 獲得支付協助\n• 了解方案詳情\n• 回報問題\n\n或與我們的技術支援團隊聊天。\n\n您需要什麼協助呢？",
      delay: 1500
    };
  }
  
  // 感謝
  if (lowerMessage.match(/(thank|thanks|thx|謝謝|感謝)/)) {
    return {
      message: language === 'en'
        ? "You're very welcome! 😊 Feel free to reach out anytime. I'm always here to help!"
        : "不客氣！😊 隨時都可以聯繫我，我隨時在這裡協助您！",
      delay: 800
    };
  }
  
  // 再見
  if (lowerMessage.match(/(bye|goodbye|see you|再見|掰掰)/)) {
    return {
      message: language === 'en'
        ? "Goodbye! Have a great day! 👋 Don't hesitate to message me if you need anything."
        : "再見！祝您有美好的一天！👋 如果需要任何協助，隨時找我。",
      delay: 800
    };
  }
  
  // 預設回覆
  return {
    message: language === 'en'
      ? "Thank you for your message! I'll look into this and get back to you shortly. In the meantime, feel free to ask me about our features, pricing, or any other questions you may have! 😊"
      : "感謝您的留言！我會仔細查看並盡快回覆您。同時，歡迎詢問我們的功能、價格或任何其他問題！😊",
    delay: 1200
  };
}

/**
 * 技術支援機器人回覆
 */
export function getSupportTeamResponse(userMessage: string, language: 'en' | 'zh' = 'en'): BotResponse {
  const lowerMessage = userMessage.toLowerCase();
  
  // 問候語
  if (lowerMessage.match(/^(hi|hello|hey|你好|您好|嗨)/)) {
    return {
      message: language === 'en'
        ? "Hi there! 👋 I'm from the Support Team. How can I help you today?"
        : "您好！👋 我是技術支援團隊。今天有什麼可以幫助您的嗎？",
      delay: 1000
    };
  }
  
  // 技術問題
  if (lowerMessage.match(/(error|bug|not working|broken|issue|problem|錯誤|問題|壞了|無法|不能)/)) {
    return {
      message: language === 'en'
        ? "I understand you're experiencing an issue. Let me help! 🔧\n\nCan you provide:\n1. What were you trying to do?\n2. What error message did you see?\n3. Which browser are you using?\n\nThis will help me diagnose the problem faster!"
        : "我了解您遇到了問題。讓我來協助您！🔧\n\n請提供：\n1. 您當時想做什麼？\n2. 您看到什麼錯誤訊息？\n3. 您使用的是哪個瀏覽器？\n\n這將幫助我更快診斷問題！",
      delay: 1500
    };
  }
  
  // 登入問題
  if (lowerMessage.match(/(login|sign in|password|account|登入|登錄|密碼|帳號|帳戶)/)) {
    return {
      message: language === 'en'
        ? "Having trouble logging in? Here are some quick solutions:\n\n🔐 Forgot password → Click 'Forgot Password' on login page\n🔑 SSO Login → Try Google/GitHub/Facebook login\n📧 Email issues → Check spam folder\n\nIf none of these work, let me know and I'll escalate to our senior team!"
        : "登入遇到問題？以下是快速解決方案：\n\n🔐 忘記密碼 → 點擊登入頁面的「忘記密碼」\n🔑 SSO 登入 → 嘗試 Google/GitHub/Facebook 登入\n📧 郵件問題 → 檢查垃圾郵件資料夾\n\n如果都不行，請告訴我，我會轉給資深團隊處理！",
      delay: 1500
    };
  }
  
  // 支付問題
  if (lowerMessage.match(/(payment failed|charge|refund|支付失敗|退款|扣款)/)) {
    return {
      message: language === 'en'
        ? "I see this is about payments. Let me check our diagnostics tool... 🔍\n\nFor payment issues:\n1. Check your ECPay/PayPal transaction history\n2. Verify your card details are correct\n3. Ensure sufficient balance\n\nIf you were charged but didn't receive credits, I can help investigate. Please provide your transaction ID if you have it!"
        : "我看到這是關於支付的問題。讓我檢查診斷工具... 🔍\n\n關於支付問題：\n1. 檢查您的 ECPay/PayPal 交易紀錄\n2. 確認卡片資訊正確\n3. 確保餘額充足\n\n如果您已扣款但未收到點數，我可以協助調查。如果有交易編號請提供給我！",
      delay: 1800
    };
  }
  
  // 瀏覽器/技術問題
  if (lowerMessage.match(/(browser|chrome|safari|firefox|edge|slow|lag|瀏覽器|慢|卡)/)) {
    return {
      message: language === 'en'
        ? "Browser issues can be frustrating! Try these steps:\n\n1. Clear browser cache and cookies\n2. Try incognito/private mode\n3. Update to latest browser version\n4. Disable extensions temporarily\n\nRecommended browsers: Chrome, Edge, Safari (latest versions)\n\nDid this help?"
        : "瀏覽器問題確實令人困擾！試試這些步驟：\n\n1. 清除瀏覽器快取和 Cookie\n2. 嘗試無痕/私密模式\n3. 更新到最新瀏覽器版本\n4. 暫時停用擴充功能\n\n建議使用：Chrome、Edge、Safari（最新版本）\n\n這樣有幫助嗎？",
      delay: 1500
    };
  }
  
  // API/整合問題
  if (lowerMessage.match(/(api|integration|webhook|connect|整合|連接|介接)/)) {
    return {
      message: language === 'en'
        ? "Need help with API integration? 🔌\n\nOur API documentation covers:\n• Authentication (Bearer tokens)\n• Webhooks setup\n• Rate limits\n• Sample code (JavaScript, Python)\n\nEnterprise users get priority API support. What specifically do you need help with?"
        : "需要 API 整合協助？🔌\n\n我們的 API 文件包含：\n• 認證方式（Bearer tokens）\n• Webhooks 設定\n• 請求限制\n• 範例程式碼（JavaScript、Python）\n\n企業版用戶享有優先 API 支援。您需要哪方面的協助？",
      delay: 1500
    };
  }
  
  // 感謝
  if (lowerMessage.match(/(thank|thanks|thx|solved|fixed|謝謝|感謝|解決了|好了)/)) {
    return {
      message: language === 'en'
        ? "Glad I could help! 🎉 If you encounter any other issues, don't hesitate to reach out. We're here 24/7!"
        : "很高興能幫到您！🎉 如果遇到其他問題，請隨時聯繫我們。我們全天候待命！",
      delay: 800
    };
  }
  
  // 預設回覆
  return {
    message: language === 'en'
      ? "Thanks for contacting support! I'm analyzing your request... 🔍\n\nA specialist from our team will review this and respond within 1-2 hours. For urgent issues, Enterprise users can request priority escalation.\n\nIs there anything else I can help clarify in the meantime?"
      : "感謝聯繫技術支援！我正在分析您的請求... 🔍\n\n我們的專員會在 1-2 小時內審查並回覆。緊急問題的話，企業版用戶可以要求優先處理。\n\n在此期間，還有什麼我可以協助的嗎？",
    delay: 1500
  };
}

/**
 * 檢測訊息語言
 */
export function detectLanguage(message: string): 'en' | 'zh' {
  // 檢查是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(message);
  return hasChinese ? 'zh' : 'en';
}
