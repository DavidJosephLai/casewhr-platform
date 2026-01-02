import { RefreshCw, TrendingUp, Info } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { useExchangeRate } from "../hooks/useExchangeRate";
import { isChinese } from "../lib/translations";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

/**
 * 匯率指示器組件
 * 顯示當前匯率並允許手動刷新
 * 支援 TWD/USD/CNY 三幣種
 */
export function ExchangeRateIndicator() {
  const { language } = useLanguage();
  const { rate, cnyRate, loading, refresh, cacheInfo } = useExchangeRate();

  const content = {
    en: {
      title: 'Exchange Rate',
      rate: `1 USD ≈ ${rate.toFixed(2)} TWD | 1 USD ≈ ${cnyRate.toFixed(2)} CNY`,
      refresh: 'Refresh Rate',
      refreshing: 'Updating...',
      lastUpdated: 'Last updated',
      cached: 'Cached',
      live: 'Live',
      tooltip: 'Exchange rates are updated automatically every hour. Click to refresh manually.',
      source: 'Source',
    },
    'zh-TW': {
      title: '匯率',
      rate: `1 美元 ≈ ${rate.toFixed(2)} 台幣 | 1 美元 ≈ ${cnyRate.toFixed(2)} 人民幣`,
      refresh: '更新匯率',
      refreshing: '更新中...',
      lastUpdated: '最後更新',
      cached: '已緩存',
      live: '即時',
      tooltip: '匯率每小時自動更新。點擊可手動刷新。',
      source: '來源',
    },
    'zh-CN': {
      title: '汇率',
      rate: `1 美元 ≈ ${cnyRate.toFixed(2)} 人民币 | 1 美元 ≈ ${rate.toFixed(2)} 台币`,
      refresh: '更新汇率',
      refreshing: '更新中...',
      lastUpdated: '最后更新',
      cached: '已缓存',
      live: '实时',
      tooltip: '汇率每小时自动更新。点击可手动刷新。',
      source: '来源',
    },
  };

  // Handle legacy 'zh' language code
  const currentLanguage = language === 'zh' ? 'zh-TW' : language;
  const t = content[currentLanguage as keyof typeof content] || content['zh-TW'];

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) {
      return isChinese(language) ? '刚刚' : 'Just now';
    } else if (minutes < 60) {
      return isChinese(language) ? `${minutes}分钟前` : `${minutes}m ago`;
    } else if (hours < 24) {
      return isChinese(language) ? `${hours}小时前` : `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return isChinese(language) ? `${days}天前` : `${days}d ago`;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              {t.rate}
            </span>
            {cacheInfo.hasCache && (
              <Badge variant="outline" className="text-xs">
                {cacheInfo.isExpired ? t.refresh : t.cached}
              </Badge>
            )}
          </div>
          {cacheInfo.hasCache && cacheInfo.age !== undefined && (
            <p className="text-xs text-gray-500 mt-0.5">
              {t.lastUpdated}: {formatTimestamp(Date.now() - cacheInfo.age)}
              {cacheInfo.source && ` • ${t.source}: ${cacheInfo.source}`}
            </p>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{t.tooltip}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-gray-400 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">
              {language === 'en'
                ? 'All amounts are automatically converted between TWD, USD, and CNY based on current exchange rates. Rates are sourced from reliable financial APIs.'
                : language === 'zh-CN'
                ? '所有金额都会根据当前汇率自动在台币、美元和人民币之间转换。汇率来自可靠的金融 API。'
                : '所有金額都會根據當前匯率自動在台幣、美元和人民幣之間轉換。匯率來自可靠的金融 API。'}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}