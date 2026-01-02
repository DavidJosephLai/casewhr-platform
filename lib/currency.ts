/**
 * Currency Utility Library - 貨幣工具庫
 * 支援 TWD/USD/CNY 三幣種系統
 */

import { getExchangeRates } from './exchangeRate';
import type { Language } from './LanguageContext';

// 支援的貨幣類型
export type Currency = 'TWD' | 'USD' | 'CNY';

// 貨幣列表
export const CURRENCIES: Currency[] = ['TWD', 'USD', 'CNY'];

// 貨幣資訊介面
export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  nameCN: string;
  nameTW: string;
}

// 貨幣資訊映射
export const CURRENCY_INFO: Record<Currency, CurrencyInfo> = {
  TWD: {
    code: 'TWD',
    symbol: 'NT$',
    name: 'TWD',
    nameCN: '台币',
    nameTW: '台幣',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'USD',
    nameCN: '美元',
    nameTW: '美元',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'CNY',
    nameCN: '人民币',
    nameTW: '人民幣',
  },
};

/**
 * 獲取貨幣資訊
 */
export function getCurrencyInfo(currency: Currency): CurrencyInfo {
  return CURRENCY_INFO[currency];
}

/**
 * 根據語言獲取預設貨幣
 */
export function getDefaultCurrency(language: Language | 'en' | 'zh'): Currency {
  // 簡體中文 → CNY
  if (language === 'zh-CN') return 'CNY';
  // 繁體中文 → TWD
  if (language === 'zh-TW' || language === 'zh') return 'TWD';
  // 英文 → USD
  return 'USD';
}

/**
 * 獲取當前匯率
 */
export function getExchangeRate(): { 
  usdToTwd: number; 
  twdToUsd: number;
  usdToCny: number;
  cnyToUsd: number;
  twdToCny: number;
  cnyToTwd: number;
} {
  const rates = getExchangeRates();
  const usdToTwd = rates.usdToTwd || 31.5; // Fallback
  const usdToCny = rates.usdToCny || 7.2;  // Fallback
  
  return {
    usdToTwd,
    twdToUsd: 1 / usdToTwd,
    usdToCny,
    cnyToUsd: 1 / usdToCny,
    twdToCny: usdToCny / usdToTwd,
    cnyToTwd: usdToTwd / usdToCny,
  };
}

/**
 * 貨幣轉換
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) return amount;

  const rates = getExchangeRate();

  // TWD ↔ USD
  if (fromCurrency === 'TWD' && toCurrency === 'USD') {
    return amount * rates.twdToUsd;
  }
  if (fromCurrency === 'USD' && toCurrency === 'TWD') {
    return amount * rates.usdToTwd;
  }

  // USD ↔ CNY
  if (fromCurrency === 'USD' && toCurrency === 'CNY') {
    return amount * rates.usdToCny;
  }
  if (fromCurrency === 'CNY' && toCurrency === 'USD') {
    return amount * rates.cnyToUsd;
  }

  // TWD ↔ CNY
  if (fromCurrency === 'TWD' && toCurrency === 'CNY') {
    return amount * rates.twdToCny;
  }
  if (fromCurrency === 'CNY' && toCurrency === 'TWD') {
    return amount * rates.cnyToTwd;
  }

  return amount;
}

/**
 * 格式化貨幣顯示
 */
export function formatCurrency(amount: number, currency: Currency = 'USD'): string {
  // 添加安全檢查
  if (!currency || !CURRENCY_INFO[currency]) {
    console.warn(`Invalid currency: ${currency}, defaulting to USD`);
    currency = 'USD';
  }
  
  const info = getCurrencyInfo(currency);
  
  // 根據幣種決定小數位數
  const decimals = currency === 'TWD' || currency === 'CNY' ? 0 : 2;
  
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${info.symbol}${formatted}`;
}

/**
 * 格式化貨幣範圍
 */
export function formatCurrencyRange(
  min: number,
  max: number,
  currency: Currency
): string {
  return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
}

/**
 * 自動格式化貨幣（根據語言自動轉換和顯示）
 */
export function formatCurrencyAuto(
  amount: number,
  storedCurrency: Currency,
  language: Language | 'en' | 'zh'
): string {
  const displayCurrency = getDefaultCurrency(language);
  const convertedAmount = convertCurrency(amount, storedCurrency, displayCurrency);
  return formatCurrency(convertedAmount, displayCurrency);
}

/**
 * 獲取匯率信息文本
 */
export function getExchangeRateText(language: Language | 'en' | 'zh'): string {
  const rates = getExchangeRate();
  
  // Safety checks - ensure rates exist
  const twdRate = (rates.usdToTwd || 31.5).toFixed(2);
  const cnyRate = (rates.usdToCny || 7.2).toFixed(2);
  
  if (language === 'en') {
    return `Exchange Rate: 1 USD ≈ ${twdRate} TWD | 1 USD ≈ ${cnyRate} CNY`;
  }
  
  if (language === 'zh-CN') {
    return `汇率：1 美元 ≈ ${cnyRate} 人民币 | 1 美元 ≈ ${twdRate} 台币`;
  }
  
  // zh-TW or legacy 'zh'
  return `匯率：1 美元 ≈ ${twdRate} 台幣 | 1 美元 ≈ ${cnyRate} 人民幣`;
}

/**
 * 驗證金額是否有效
 */
export function isValidAmount(amount: number, currency: Currency): boolean {
  if (amount < 0) return false;
  
  // TWD 最小金額 100
  if (currency === 'TWD' && amount > 0 && amount < 100) return false;
  
  // USD 最小金額 1
  if (currency === 'USD' && amount > 0 && amount < 1) return false;
  
  // CNY 最小金額 10
  if (currency === 'CNY' && amount > 0 && amount < 10) return false;
  
  return true;
}

/**
 * 獲取最小金額限制
 */
export function getMinAmount(currency: Currency): number {
  switch (currency) {
    case 'TWD':
      return 100;
    case 'USD':
      return 1;
    case 'CNY':
      return 10;
    default:
      return 0;
  }
}

/**
 * 獲取幣種的名稱（根據語言）
 */
export function getCurrencyName(currency: Currency, language: Language | 'en' | 'zh'): string {
  const info = getCurrencyInfo(currency);
  
  if (language === 'zh-CN') {
    return info.nameCN;
  }
  
  if (language === 'zh-TW' || language === 'zh') {
    return info.nameTW;
  }
  
  return info.name;
}