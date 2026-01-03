/**
 * ⭐ 全球統一匯率定義
 * 
 * 重要：此檔案定義的匯率必須與前端 /lib/exchangeRate.ts 的 FALLBACK_RATES 完全一致
 * 任何修改都必須同步更新前後端兩個檔案！
 */

export const EXCHANGE_RATES = {
  // 基準貨幣：USD
  USD: 1,
  
  // 1 USD = 31.5 TWD (台幣)
  TWD: 31.5,
  
  // 1 USD = 7.2 CNY (人民幣)
  CNY: 7.2,
} as const;

/**
 * 貨幣轉換函數
 * @param amount 原始金額
 * @param fromCurrency 來源貨幣
 * @param toCurrency 目標貨幣
 * @returns 轉換後的金額
 */
export function convertCurrency(
  amount: number,
  fromCurrency: keyof typeof EXCHANGE_RATES,
  toCurrency: keyof typeof EXCHANGE_RATES
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // 先轉換為 USD
  const usdAmount = amount / EXCHANGE_RATES[fromCurrency];
  
  // 再轉換為目標貨幣
  return usdAmount * EXCHANGE_RATES[toCurrency];
}

/**
 * 將任意貨幣轉換為 USD（資料庫存儲標準）
 */
export function toUSD(amount: number, fromCurrency: keyof typeof EXCHANGE_RATES): number {
  return amount / EXCHANGE_RATES[fromCurrency];
}

/**
 * 將 USD 轉換為任意貨幣（顯示用）
 */
export function fromUSD(usdAmount: number, toCurrency: keyof typeof EXCHANGE_RATES): number {
  return usdAmount * EXCHANGE_RATES[toCurrency];
}

console.log('✅ [Exchange Rates] Loaded:', EXCHANGE_RATES);
