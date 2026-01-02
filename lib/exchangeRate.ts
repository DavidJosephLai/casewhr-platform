/**
 * Exchange Rate Service - 匯率服務
 * 提供實時匯率查詢和緩存功能
 * 支援 USD/TWD/CNY 三幣種轉換
 */

export interface ExchangeRateData {
  usdToTwd: number;
  usdToCny: number;
  timestamp: number;
  source: string;
}

const CACHE_KEY = 'exchange_rate_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1小時緩存

// 備用匯率（當 API 失敗時使用）
const FALLBACK_RATES = {
  usdToTwd: 31.5,
  usdToCny: 7.2,
};

/**
 * 從緩存中獲取匯率
 */
function getCachedRate(): ExchangeRateData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: ExchangeRateData = JSON.parse(cached);
    const now = Date.now();

    // 檢查是否過期
    if (now - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Validate that both rates exist (handle old cache format)
    if (!data.usdToTwd || !data.usdToCny) {
      console.warn('Invalid cache data detected, clearing...');
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading exchange rate cache:', error);
    // Clear corrupted cache
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (e) {
      // Ignore
    }
    return null;
  }
}

/**
 * 保存匯率到緩存
 */
function setCachedRate(usdToTwd: number, usdToCny: number, source: string): void {
  try {
    const data: ExchangeRateData = {
      usdToTwd,
      usdToCny,
      timestamp: Date.now(),
      source,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving exchange rate cache:', error);
  }
}

/**
 * 從多個來源獲取實時匯率
 * 優先順序：
 * 1. ExchangeRate-API (免費，無需 API key)
 * 2. 緩存數據
 * 3. 備用匯率
 */
export async function fetchExchangeRate(): Promise<ExchangeRateData> {
  // 先檢查緩存
  const cached = getCachedRate();
  if (cached) {
    console.log(`Using cached exchange rates: USD/TWD=${cached.usdToTwd}, USD/CNY=${cached.usdToCny} (${cached.source})`);
    return cached;
  }

  try {
    // 方法 1: ExchangeRate-API (免費，無需註冊)
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    
    if (response.ok) {
      const data = await response.json();
      if (data.rates && data.rates.TWD && data.rates.CNY) {
        const usdToTwd = data.rates.TWD;
        const usdToCny = data.rates.CNY;
        setCachedRate(usdToTwd, usdToCny, 'ExchangeRate-API');
        console.log(`Fetched exchange rates from API: USD/TWD=${usdToTwd}, USD/CNY=${usdToCny}`);
        return { usdToTwd, usdToCny, timestamp: Date.now(), source: 'ExchangeRate-API' };
      }
    }
  } catch (error) {
    console.error('Error fetching exchange rate from API:', error);
  }

  try {
    // 方法 2: Backup API - frankfurter.app
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=TWD,CNY');
    
    if (response.ok) {
      const data = await response.json();
      if (data.rates && data.rates.TWD && data.rates.CNY) {
        const usdToTwd = data.rates.TWD;
        const usdToCny = data.rates.CNY;
        setCachedRate(usdToTwd, usdToCny, 'Frankfurter');
        console.log(`Fetched exchange rates from backup API: USD/TWD=${usdToTwd}, USD/CNY=${usdToCny}`);
        return { usdToTwd, usdToCny, timestamp: Date.now(), source: 'Frankfurter' };
      }
    }
  } catch (error) {
    console.error('Error fetching exchange rate from backup API:', error);
  }

  // 如果所有 API 都失敗，使用備用匯率
  console.warn(`Using fallback exchange rates: USD/TWD=${FALLBACK_RATES.usdToTwd}, USD/CNY=${FALLBACK_RATES.usdToCny}`);
  setCachedRate(FALLBACK_RATES.usdToTwd, FALLBACK_RATES.usdToCny, 'Fallback');
  return { 
    usdToTwd: FALLBACK_RATES.usdToTwd, 
    usdToCny: FALLBACK_RATES.usdToCny, 
    timestamp: Date.now(), 
    source: 'Fallback' 
  };
}

/**
 * 同步獲取匯率（優先使用緩存，否則返回備用值）
 * @deprecated Use getExchangeRates() instead for multi-currency support
 */
export function getExchangeRateSync(): number {
  const cached = getCachedRate();
  return cached ? cached.usdToTwd : FALLBACK_RATES.usdToTwd;
}

/**
 * 同步獲取所有匯率（優先使用緩存，否則返回備用值）
 */
export function getExchangeRates(): { usdToTwd: number; usdToCny: number } {
  const cached = getCachedRate();
  if (cached && cached.usdToTwd && cached.usdToCny) {
    return { 
      usdToTwd: cached.usdToTwd, 
      usdToCny: cached.usdToCny 
    };
  }
  // Return fallback rates if cache is missing or incomplete
  return { 
    usdToTwd: FALLBACK_RATES.usdToTwd, 
    usdToCny: FALLBACK_RATES.usdToCny 
  };
}

/**
 * 清除匯率緩存
 */
export function clearExchangeRateCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('Exchange rate cache cleared');
  } catch (error) {
    console.error('Error clearing exchange rate cache:', error);
  }
}

/**
 * 獲取緩存信息（用於顯示）
 */
export function getCacheInfo(): {
  hasCache: boolean;
  usdToTwd?: number;
  usdToCny?: number;
  source?: string;
  age?: number;
  isExpired?: boolean;
} {
  const cached = getCachedRate();
  
  if (!cached) {
    return { hasCache: false };
  }

  const age = Date.now() - cached.timestamp;
  const isExpired = age > CACHE_DURATION;

  return {
    hasCache: true,
    usdToTwd: cached.usdToTwd,
    usdToCny: cached.usdToCny,
    source: cached.source,
    age,
    isExpired,
  };
}