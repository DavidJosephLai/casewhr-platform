import { useEffect, useState } from 'react';
import { fetchExchangeRate, getExchangeRates, getCacheInfo } from '../lib/exchangeRate';

/**
 * 匯率管理 Hook
 * 自動獲取和更新匯率
 * 支援 TWD/USD/CNY 三幣種
 */
export function useExchangeRate() {
  const initialRates = getExchangeRates();
  const [rate, setRate] = useState<number>(initialRates.usdToTwd);
  const [cnyRate, setCnyRate] = useState<number>(initialRates.usdToCny);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // 初始化時獲取匯率
  useEffect(() => {
    loadExchangeRate();
  }, []);

  const loadExchangeRate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const rateData = await fetchExchangeRate();
      setRate(rateData.usdToTwd);
      setCnyRate(rateData.usdToCny);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange rate');
      console.error('Error loading exchange rate:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadExchangeRate();
  };

  const cacheInfo = getCacheInfo();

  return {
    rate,
    cnyRate,
    loading,
    error,
    lastUpdated,
    refresh,
    cacheInfo,
  };
}