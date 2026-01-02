import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Server,
  Database,
  Wifi,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface PerformanceMetrics {
  api_response_time: number;
  database_query_time: number;
  cache_hit_rate: number;
  active_connections: number;
  requests_per_minute: number;
  error_rate: number;
  uptime_percentage: number;
}

interface PerformanceMonitorProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function PerformanceMonitor({ language = 'en' }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    api_response_time: 0,
    database_query_time: 0,
    cache_hit_rate: 0,
    active_connections: 0,
    requests_per_minute: 0,
    error_rate: 0,
    uptime_percentage: 99.9,
  });

  const translations = {
    en: {
      title: 'Performance Monitor',
      subtitle: 'Real-time system performance metrics',
      apiResponse: 'API Response Time',
      databaseQuery: 'Database Query Time',
      cacheHit: 'Cache Hit Rate',
      activeConnections: 'Active Connections',
      requestsPerMin: 'Requests/Min',
      errorRate: 'Error Rate',
      uptime: 'Uptime',
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor',
      ms: 'ms',
      status: 'Status',
      healthy: 'Healthy',
      warning: 'Warning',
      critical: 'Critical',
      optimizations: 'Active Optimizations',
      optimizationsList: [
        'Response caching enabled',
        'Database query optimization',
        'Connection pooling active',
        'Gzip compression enabled',
        'CDN distribution active',
        'Rate limiting protection'
      ]
    },
    zh: {
      title: '效能監控',
      subtitle: '即時系統效能指標',
      apiResponse: 'API 回應時間',
      databaseQuery: '資料庫查詢時間',
      cacheHit: '快取命中率',
      activeConnections: '活躍連線',
      requestsPerMin: '每分鐘請求',
      errorRate: '錯誤率',
      uptime: '運作時間',
      excellent: '優秀',
      good: '良好',
      fair: '尚可',
      poor: '不佳',
      ms: '毫秒',
      status: '狀態',
      healthy: '健康',
      warning: '警告',
      critical: '嚴重',
      optimizations: '已啟用優化',
      optimizationsList: [
        '回應快取已啟用',
        '資料庫查詢優化',
        '連線池已啟用',
        'Gzip 壓縮已啟用',
        'CDN 分發已啟用',
        '速率限制保護'
      ]
    },
    'zh-TW': {
      title: '效能監控',
      subtitle: '即時系統效能指標',
      apiResponse: 'API 回應時間',
      databaseQuery: '資料庫查詢時間',
      cacheHit: '快取命中率',
      activeConnections: '活躍連線',
      requestsPerMin: '每分鐘請求',
      errorRate: '錯誤率',
      uptime: '運作時間',
      excellent: '優秀',
      good: '良好',
      fair: '尚可',
      poor: '不佳',
      ms: '毫秒',
      status: '狀態',
      healthy: '健康',
      warning: '警告',
      critical: '嚴重',
      optimizations: '已啟用優化',
      optimizationsList: [
        '回應快取已啟用',
        '資料庫查詢優化',
        '連線池已啟用',
        'Gzip 壓縮已啟用',
        'CDN 分發已啟用',
        '速率限制保護'
      ]
    },
    'zh-CN': {
      title: '性能监控',
      subtitle: '实时系统性能指标',
      apiResponse: 'API响应时间',
      databaseQuery: '数据库查询时间',
      cacheHit: '缓存命中率',
      activeConnections: '活跃连接',
      requestsPerMin: '每分钟请求',
      errorRate: '错误率',
      uptime: '运行时间',
      excellent: '优秀',
      good: '良好',
      fair: '尚可',
      poor: '不佳',
      ms: '毫秒',
      status: '状态',
      healthy: '健康',
      warning: '警告',
      critical: '严重',
      optimizations: '已启用优化',
      optimizationsList: [
        '响应缓存已启用',
        '数据库查询优化',
        '连接池已启用',
        'Gzip压缩已启用',
        'CDN分发已启用',
        '速率限制保护'
      ]
    }
  };

  const t = translations[language];

  useEffect(() => {
    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      setMetrics({
        api_response_time: Math.random() * 100 + 50, // 50-150ms
        database_query_time: Math.random() * 50 + 10, // 10-60ms
        cache_hit_rate: Math.random() * 10 + 85, // 85-95%
        active_connections: Math.floor(Math.random() * 50 + 20), // 20-70
        requests_per_minute: Math.floor(Math.random() * 30 + 40), // 40-70
        error_rate: Math.random() * 2, // 0-2%
        uptime_percentage: 99.5 + Math.random() * 0.5, // 99.5-100%
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getPerformanceLevel = (value: number, thresholds: { excellent: number; good: number; fair: number }) => {
    if (value <= thresholds.excellent) return { label: t.excellent, color: 'text-green-600', bg: 'bg-green-100' };
    if (value <= thresholds.good) return { label: t.good, color: 'text-blue-600', bg: 'bg-blue-100' };
    if (value <= thresholds.fair) return { label: t.fair, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: t.poor, color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getCachePerformance = (rate: number) => {
    if (rate >= 90) return { label: t.excellent, color: 'text-green-600', bg: 'bg-green-100' };
    if (rate >= 80) return { label: t.good, color: 'text-blue-600', bg: 'bg-blue-100' };
    if (rate >= 70) return { label: t.fair, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: t.poor, color: 'text-red-600', bg: 'bg-red-100' };
  };

  const apiPerf = getPerformanceLevel(metrics.api_response_time, { excellent: 100, good: 200, fair: 500 });
  const dbPerf = getPerformanceLevel(metrics.database_query_time, { excellent: 20, good: 50, fair: 100 });
  const cachePerf = getCachePerformance(metrics.cache_hit_rate);

  const systemStatus = metrics.error_rate < 1 && metrics.api_response_time < 200 ? 'healthy' :
                       metrics.error_rate < 3 && metrics.api_response_time < 500 ? 'warning' : 'critical';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border-2 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="size-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{t.title}</CardTitle>
                <CardDescription className="mt-1">{t.subtitle}</CardDescription>
              </div>
            </div>
            <Badge className={
              systemStatus === 'healthy' ? 'bg-green-600' :
              systemStatus === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
            }>
              {systemStatus === 'healthy' ? (
                <>
                  <CheckCircle2 className="size-3 mr-1" />
                  {t.healthy}
                </>
              ) : (
                <>
                  <AlertCircle className="size-3 mr-1" />
                  {systemStatus === 'warning' ? t.warning : t.critical}
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-2 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-green-600" />
                <span className="text-sm font-medium">{t.apiResponse}</span>
              </div>
              <Badge className={`${apiPerf.bg} ${apiPerf.color}`}>
                {apiPerf.label}
              </Badge>
            </div>
            <div className="text-3xl font-bold text-green-900">
              {Math.round(metrics.api_response_time)}{t.ms}
            </div>
            <Progress value={Math.min(100, (500 - metrics.api_response_time) / 5)} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="size-5 text-blue-600" />
                <span className="text-sm font-medium">{t.databaseQuery}</span>
              </div>
              <Badge className={`${dbPerf.bg} ${dbPerf.color}`}>
                {dbPerf.label}
              </Badge>
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {Math.round(metrics.database_query_time)}{t.ms}
            </div>
            <Progress value={Math.min(100, (100 - metrics.database_query_time) / 1)} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className="size-5 text-purple-600" />
                <span className="text-sm font-medium">{t.cacheHit}</span>
              </div>
              <Badge className={`${cachePerf.bg} ${cachePerf.color}`}>
                {cachePerf.label}
              </Badge>
            </div>
            <div className="text-3xl font-bold text-purple-900">
              {metrics.cache_hit_rate.toFixed(1)}%
            </div>
            <Progress value={metrics.cache_hit_rate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="size-4 text-gray-600" />
              <span className="text-sm text-gray-600">{t.activeConnections}</span>
            </div>
            <div className="text-2xl font-bold">{metrics.active_connections}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-4 text-gray-600" />
              <span className="text-sm text-gray-600">{t.requestsPerMin}</span>
            </div>
            <div className="text-2xl font-bold">{metrics.requests_per_minute}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="size-4 text-gray-600" />
              <span className="text-sm text-gray-600">{t.errorRate}</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{metrics.error_rate.toFixed(2)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-4 text-gray-600" />
              <span className="text-sm text-gray-600">{t.uptime}</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{metrics.uptime_percentage.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Optimizations */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-5 text-blue-600" />
            {t.optimizations}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {t.optimizationsList.map((opt, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-white/50 rounded">
                <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                <span className="text-sm">{opt}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}