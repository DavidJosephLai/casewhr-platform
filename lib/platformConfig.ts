/**
 * 平台收款帳號配置
 * Platform Payment Account Configuration
 */

export const platformBankAccount = {
  bankName: {
    zh: '國泰世華銀行',
    en: 'Cathay United Bank'
  },
  bankCode: '013',
  accountNumber: '013505146411',
  accountName: {
    zh: 'Case Where 接得準公司',
    en: 'Case Where Co., Ltd.'
  }
};

/**
 * 格式化銀行帳號資訊
 * @param language - 語言 ('zh' | 'en')
 * @returns 格式化的銀行帳號字串
 */
export function formatBankAccount(language: 'zh' | 'en'): string {
  const { bankName, bankCode, accountNumber, accountName } = platformBankAccount;
  
  if (language === 'zh') {
    return `${bankName.zh}（${bankCode}）\n帳號：${accountNumber}\n戶名：${accountName.zh}`;
  } else {
    return `${bankName.en} (${bankCode})\nAccount: ${accountNumber}\nAccount Name: ${accountName.en}`;
  }
}

/**
 * 獲取銀行轉帳說明
 * @param language - 語言 ('zh' | 'en')
 * @param amount - 金額
 * @returns 轉帳說明文字
 */
export function getBankTransferInstructions(language: 'zh' | 'en', amount?: number): string {
  const accountInfo = formatBankAccount(language);
  
  if (language === 'zh') {
    return `請匯款至以下帳戶：\n\n${accountInfo}\n${amount ? `\n匯款金額：NT$ ${amount.toLocaleString()}` : ''}\n\n匯款後請保留匯款證明，並聯絡客服確認付款。`;
  } else {
    return `Please transfer to the following account:\n\n${accountInfo}\n${amount ? `\nAmount: NT$ ${amount.toLocaleString()}` : ''}\n\nPlease keep your transfer receipt and contact customer service to confirm payment.`;
  }
}