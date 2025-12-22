import { useState, useEffect } from 'react';

export function useExchangeRate() {
  const [rate, setRate] = useState<number>(31.5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        setLoading(true);
        // 使用台湾银行汇率 API
        const response = await fetch('https://tw.rter.info/capi.php');
        const data = await response.json();
        const usdToTwd = data.USDTWD?.Exrate || 31.5;
        setRate(usdToTwd);
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        setRate(31.5); // 默认汇率
      } finally {
        setLoading(false);
      }
    };

    fetchRate();
    const interval = setInterval(fetchRate, 3600000); // 每小时更新
    return () => clearInterval(interval);
  }, []);

  return { rate, loading };
}
