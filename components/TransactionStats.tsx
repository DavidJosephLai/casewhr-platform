import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { formatCurrencyAuto, getExchangeRateText, type Currency } from '../lib/currency';
import { useLanguage } from '../lib/LanguageContext';

interface TransactionStatsData {
  this_month_income: number;
  this_month_expenses: number;
  this_month_net: number;
  this_year_income: number;
  this_year_expenses: number;
  this_year_net: number;
  all_time_income: number;
  all_time_expenses: number;
  all_time_net: number;
}

export function TransactionStats() {
  const { user, accessToken } = useAuth();
  const { language } = useLanguage();
  const [stats, setStats] = useState<TransactionStatsData>({
    this_month_income: 0,
    this_month_expenses: 0,
    this_month_net: 0,
    this_year_income: 0,
    this_year_expenses: 0,
    this_year_net: 0,
    all_time_income: 0,
    all_time_expenses: 0,
    all_time_net: 0,
  });
  const [loading, setLoading] = useState(true);

  // ⭐ 數據庫預設儲存 TWD
  // 當切換到英文時，會自動按實時匯率轉換為 USD
  const storedCurrency: Currency = 'TWD';

  // 格式化金額的輔助函數（帶自動匯率轉換）
  const formatAmount = (amount: number): string => {
    return formatCurrencyAuto(amount, storedCurrency, language);
  };

  useEffect(() => {
    if (user?.id && accessToken) {
      loadStats();
    }
  }, [user?.id, accessToken]);

  const loadStats = async () => {
    if (!user?.id || !accessToken) return;

    setLoading(true);
    try {
      // 🔧 开发模式支持
      const isDevMode = accessToken.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? { 
            'X-Dev-Token': accessToken,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        : { 'Authorization': `Bearer ${accessToken}` };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/transactions/stats/summary`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else if (response.status === 404 || response.status === 401) {
        // Silently handle missing endpoint or auth errors
        console.log('⚠️ [TransactionStats] Stats endpoint not available');
      }
    } catch (error) {
      // Silently handle fetch errors - stats are optional
      console.log('⚠️ [TransactionStats] Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return null;
  }

  const content = {
    en: {
      thisMonth: 'This Month',
      thisYear: 'This Year',
      allTime: 'All Time',
      income: 'Income',
      expenses: 'Expenses',
      netBalance: 'Net Balance',
      transactions: 'Transactions',
    },
    zh: {
      thisMonth: '本月',
      thisYear: '今年',
      allTime: '全部時間',
      income: '收入',
      expenses: '支出',
      netBalance: '淨餘額',
      transactions: '交易',
    },
    'zh-TW': {
      thisMonth: '本月',
      thisYear: '今年',
      allTime: '全部時間',
      income: '收入',
      expenses: '支出',
      netBalance: '淨餘額',
      transactions: '交易',
    },
    'zh-CN': {
      thisMonth: '本月',
      thisYear: '今年',
      allTime: '全部时间',
      income: '收入',
      expenses: '支出',
      netBalance: '净余额',
      transactions: '交易',
    }
  };

  const t = content[language] || content.en;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* This Month */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            {t.thisMonth}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              {t.income}
            </span>
            <span className="font-medium text-green-600">
              {formatAmount(stats.this_month_income)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              {t.expenses}
            </span>
            <span className="font-medium text-red-600">
              {formatAmount(stats.this_month_expenses)}
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.netBalance}</span>
              <span className={`font-semibold ${
                stats.this_month_net >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatAmount(Math.abs(stats.this_month_net))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* This Year */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            {t.thisYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              {t.income}
            </span>
            <span className="font-medium text-green-600">
              {formatAmount(stats.this_year_income)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              {t.expenses}
            </span>
            <span className="font-medium text-red-600">
              {formatAmount(stats.this_year_expenses)}
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.netBalance}</span>
              <span className={`font-semibold ${
                stats.this_year_net >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatAmount(Math.abs(stats.this_year_net))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Time */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            {t.allTime}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              {t.income}
            </span>
            <span className="font-medium text-green-600">
              {formatAmount(stats.all_time_income)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              {t.expenses}
            </span>
            <span className="font-medium text-red-600">
              {formatAmount(stats.all_time_expenses)}
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.netBalance}</span>
              <span className={`font-semibold ${
                stats.all_time_net >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatAmount(Math.abs(stats.all_time_net))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}