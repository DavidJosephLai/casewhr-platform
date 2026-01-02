/**
 * 支付配置文件
 * Payment Configuration
 */

// 綠界 ECPay 收款連結
export const ecpayConfig = {
  // 收款連結
  paymentLink: 'https://p.ecpay.com.tw/26DEFF6',
  
  // 支付方式說明
  description: {
    zh: '支援信用卡、ATM轉帳、超商代碼繳費',
    en: 'Supports credit card, ATM transfer, convenience store payment'
  },
  
  // 適用場景
  useCases: [
    'subscription', // 訂閱付費
    'deposit',      // 錢包儲值
    'project',      // 項目付款
  ],
  
  // 顯示名稱
  displayName: {
    zh: '綠界金流',
    en: 'ECPay'
  },
  
  // 是否啟用
  enabled: true,
};

// Stripe 配置（現有）
export const stripeConfig = {
  enabled: true,
  description: {
    zh: '國際信用卡支付',
    en: 'International credit card payment'
  },
};

// 支付方式優先順序（台灣地區優先顯示綠界）
export const paymentPriority = {
  TW: ['ecpay', 'stripe'],  // 台灣地區
  default: ['stripe', 'ecpay'], // 其他地區
};

export default {
  ecpay: ecpayConfig,
  stripe: stripeConfig,
  priority: paymentPriority,
};
