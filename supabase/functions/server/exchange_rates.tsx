/**
 * ⭐ 全球統一匯率服務 - 支援即時匯率和備用匯率
 * 
 * 重要：此服務會從 API 獲取即時匯率，並在 API 失敗時使用備用匯率
 * 備用匯率必須與前端 /lib/exchangeRate.ts 的 FALLBACK_RATES 完全一致
 */

// 備用匯率（當 API 失敗時使用）
const FALLBACK_RATES = {
  USD: 1,
  TWD: 31.5,
  CNY: 7.2,
} as const;

// 匯率緩存
let cachedRates: typeof FALLBACK_RATES | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1小時

/**
 * 從 API 獲取即時匯率
 */
async function fetchLiveExchangeRates(): Promise<typeof FALLBACK_RATES> {
  try {
    // 方法 1: ExchangeRate-API (免費，無需註冊)
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    
    if (response.ok) {
      const data = await response.json();
      if (data.rates?.TWD && data.rates?.CNY) {
        const rates = {
          USD: 1,
          TWD: data.rates.TWD,
          CNY: data.rates.CNY,
        };
        console.log('✅ [Exchange Rates] Fetched from API:', rates);
        return rates;
      }
    }
  } catch (error) {
    console.error('⚠️ [Exchange Rates] API fetch failed:', error);
  }

  try {
    // 方法 2: Backup API - frankfurter.app
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=TWD,CNY');
    
    if (response.ok) {
      const data = await response.json();
      if (data.rates?.TWD && data.rates?.CNY) {
        const rates = {
          USD: 1,
          TWD: data.rates.TWD,
          CNY: data.rates.CNY,
        };
        console.log('✅ [Exchange Rates] Fetched from backup API:', rates);
        return rates;
      }
    }
  } catch (error) {
    console.error('⚠️ [Exchange Rates] Backup API fetch failed:', error);
  }

  // 如果所有 API 都失敗，使用備用匯率
  console.warn('⚠️ [Exchange Rates] Using fallback rates:', FALLBACK_RATES);
  return FALLBACK_RATES;
}

/**
 * 獲取當前匯率（帶緩存）
 */
export async function getExchangeRates(): Promise<typeof FALLBACK_RATES> {
  const now = Date.now();
  
  // 如果緩存有效，直接返回
  if (cachedRates && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('💾 [Exchange Rates] Using cached rates:', cachedRates);
    return cachedRates;
  }

  // 獲取新匯率
  const rates = await fetchLiveExchangeRates();
  
  // 更新緩存
  cachedRates = rates;
  cacheTimestamp = now;
  
  return rates;
}

/**
 * 同步獲取匯率（使用緩存或備用值）
 */
export function getExchangeRatesSync(): typeof FALLBACK_RATES {
  if (cachedRates) {
    return cachedRates;
  }
  return FALLBACK_RATES;
}

// 向後兼容：直接導出 EXCHANGE_RATES（使用備用值）
export const EXCHANGE_RATES = FALLBACK_RATES;

/**
 * 貨幣轉換函數（使用緩存匯率）
 */
export function convertCurrency(
  amount: number,
  fromCurrency: keyof typeof FALLBACK_RATES,
  toCurrency: keyof typeof FALLBACK_RATES
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  const rates = getExchangeRatesSync();
  
  // 先轉換為 USD
  const usdAmount = amount / rates[fromCurrency];
  
  // 再轉換為目標貨幣
  return usdAmount * rates[toCurrency];
}

/**
 * 將任意貨幣轉換為 USD（使用緩存匯率）
 */
export function toUSD(amount: number, fromCurrency: keyof typeof FALLBACK_RATES): number {
  const rates = getExchangeRatesSync();
  return amount / rates[fromCurrency];
}

/**
 * 將 USD 轉換為任意貨幣（使用緩存匯率）
 */
export function fromUSD(usdAmount: number, toCurrency: keyof typeof FALLBACK_RATES): number {
  const rates = getExchangeRatesSync();
  return usdAmount * rates[toCurrency];
}

// 啟動時預先獲取匯率
console.log('🌍 [Exchange Rates] Initializing exchange rate service...');
getExchangeRates().then(rates => {
  console.log('✅ [Exchange Rates] Initial rates loaded:', rates);
}).catch(error => {
  console.error('❌ [Exchange Rates] Failed to load initial rates:', error);
});