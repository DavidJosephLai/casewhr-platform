/**
 * 支付配置文件
 * Payment Configuration
 */

// 綠界 ECPay 收款連結（台灣地區）
export const ecpayConfig = {
  // 收款連結
  paymentLink: 'https://p.ecpay.com.tw/26DEFF6',
  
  // 支付方式說明
  description: {
    'zh-TW': '支援信用卡、ATM轉帳、超商代碼繳費',
    en: 'Supports credit card, ATM transfer, convenience store payment',
    'zh-CN': '支持信用卡、ATM转账、便利店缴费'
  },
  
  // 適用場景
  useCases: [
    'subscription', // 訂閱付費
    'deposit',      // 錢包儲值
    'project',      // 項目付款
  ],
  
  // 顯示名稱
  displayName: {
    'zh-TW': '綠界金流',
    en: 'ECPay',
    'zh-CN': '绿界支付'
  },
  
  // 是否啟用
  enabled: true,
};

// PayPal 配置（國際支付）
export const paypalConfig = {
  enabled: true,
  
  // 支付方式說明
  description: {
    'zh-TW': 'PayPal 國際支付、信用卡',
    en: 'PayPal, Credit card, International payment',
    'zh-CN': 'PayPal 国际支付、信用卡'
  },
  
  // 適用場景
  useCases: [
    'subscription', // 訂閱付費
    'deposit',      // 錢包儲值
    'project',      // 項目付款
  ],
  
  // 顯示名稱
  displayName: {
    'zh-TW': 'PayPal',
    en: 'PayPal',
    'zh-CN': 'PayPal'
  },
};

// 支付方式優先順序（台灣地區優先顯示綠界，其他地區優先顯示 PayPal）
export const paymentPriority = {
  TW: ['ecpay', 'paypal'],  // 台灣地區
  CN: ['paypal', 'ecpay'],  // 中國地區
  default: ['paypal', 'ecpay'], // 其他地區
};

export default {
  ecpay: ecpayConfig,
  paypal: paypalConfig,
  priority: paymentPriority,
};