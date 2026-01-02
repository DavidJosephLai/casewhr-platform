import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Clock,
  ArrowUp,
  ArrowDown,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface AnalyticsData {
  revenue: {
    total: number;
    change: number;
    chartData: Array<{ month: string; value: number }>;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    change: number;
    statusData: Array<{ name: string; value: number }>;
  };
  clients: {
    total: number;
    new: number;
    change: number;
  };
  performance: {
    avgCompletionTime: number;
    successRate: number;
  };
}

interface AnalyticsProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function Analytics({ language = 'en' }: AnalyticsProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);

  const translations = {
    en: {
      title: 'Advanced Analytics',
      subtitle: 'Detailed insights into your business performance',
      totalRevenue: 'Total Revenue',
      totalProjects: 'Total Projects',
      totalClients: 'Total Clients',
      avgCompletionTime: 'Avg. Completion Time',
      revenueOverTime: 'Revenue Over Time',
      projectsByStatus: 'Projects by Status',
      clientGrowth: 'Client Growth',
      performance: 'Performance Metrics',
      export: 'Export Report',
      filter: 'Filter',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      lastYear: 'Last Year',
      allTime: 'All Time',
      active: 'Active',
      completed: 'Completed',
      pending: 'Pending',
      onHold: 'On Hold',
      successRate: 'Success Rate',
      days: 'days',
      increase: 'increase',
      decrease: 'decrease'
    },
    zh: {
      title: '高級分析',
      subtitle: '業務績效的詳細洞察',
      totalRevenue: '總收入',
      totalProjects: '總項目',
      totalClients: '總客戶',
      avgCompletionTime: '平均完成時間',
      revenueOverTime: '收入趨勢',
      projectsByStatus: '項目狀態分佈',
      clientGrowth: '客戶增長',
      performance: '績效指標',
      export: '導出報告',
      filter: '篩選',
      last7Days: '最近 7 天',
      last30Days: '最近 30 天',
      last90Days: '最近 90 天',
      lastYear: '最近一年',
      allTime: '全部時間',
      active: '進行中',
      completed: '已完成',
      pending: '待處理',
      onHold: '暫停',
      successRate: '成功率',
      days: '天',
      increase: '增長',
      decrease: '下降'
    },
    'zh-TW': {
      title: '高級分析',
      subtitle: '業務績效的詳細洞察',
      totalRevenue: '總收入',
      totalProjects: '總項目',
      totalClients: '總客戶',
      avgCompletionTime: '平均完成時間',
      revenueOverTime: '收入趨勢',
      projectsByStatus: '項目狀態分佈',
      clientGrowth: '客戶增長',
      performance: '績效指標',
      export: '導出報告',
      filter: '篩選',
      last7Days: '最近 7 天',
      last30Days: '最近 30 天',
      last90Days: '最近 90 天',
      lastYear: '最近一年',
      allTime: '全部時間',
      active: '進行中',
      completed: '已完成',
      pending: '待處理',
      onHold: '暫停',
      successRate: '成功率',
      days: '天',
      increase: '增長',
      decrease: '下降'
    },
    'zh-CN': {
      title: '高级分析',
      subtitle: '业务绩效的详细洞察',
      totalRevenue: '总收入',
      totalProjects: '总项目',
      totalClients: '总客户',
      avgCompletionTime: '平均完成时间',
      revenueOverTime: '收入趋势',
      projectsByStatus: '项目状态分布',
      clientGrowth: '客户增长',
      performance: '绩效指标',
      export: '导出报告',
      filter: '筛选',
      last7Days: '最近 7 天',
      last30Days: '最近 30 天',
      last90Days: '最近 90 天',
      lastYear: '最近一年',
      allTime: '全部时间',
      active: '进行中',
      completed: '已完成',
      pending: '待处理',
      onHold: '暂停',
      successRate: '成功率',
      days: '天',
      increase: '增长',
      decrease: '下降'
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 🎁 開發模式支援
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        const mockData: AnalyticsData = {
          revenue: {
            total: 156780,
            change: 12.5,
            chartData: [
              { month: 'Jan', value: 12000 },
              { month: 'Feb', value: 15000 },
              { month: 'Mar', value: 13500 },
              { month: 'Apr', value: 18000 },
              { month: 'May', value: 21000 },
              { month: 'Jun', value: 19500 },
              { month: 'Jul', value: 23000 },
              { month: 'Aug', value: 25000 },
              { month: 'Sep', value: 22500 },
              { month: 'Oct', value: 27000 },
              { month: 'Nov', value: 28500 },
              { month: 'Dec', value: 31280 }
            ]
          },
          projects: {
            total: 128,
            active: 45,
            completed: 72,
            change: 8.3,
            statusData: [
              { name: t.active, value: 45 },
              { name: t.completed, value: 72 },
              { name: t.pending, value: 8 },
              { name: t.onHold, value: 3 }
            ]
          },
          clients: {
            total: 87,
            new: 12,
            change: 15.2
          },
          performance: {
            avgCompletionTime: 18,
            successRate: 94.5
          }
        };
        setData(mockData);
        setLoading(false);
        return;
      }

      // 從後端獲取真實數據
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/analytics?range=${timeRange}`,
        { headers }
      );

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#7c3aed', '#ec4899', '#06b6d4', '#f59e0b'];

  if (loading || !data) {
    return (
      <div className="text-center py-12 text-gray-500">
        {language === 'en' ? 'Loading analytics...' : '載入分析數據...'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-purple-600" />
            {t.title}
          </h2>
          <p className="text-sm text-gray-600 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t.last7Days}</SelectItem>
              <SelectItem value="30d">{t.last30Days}</SelectItem>
              <SelectItem value="90d">{t.last90Days}</SelectItem>
              <SelectItem value="1y">{t.lastYear}</SelectItem>
              <SelectItem value="all">{t.allTime}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t.export}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.totalRevenue}</p>
                <h3 className="text-2xl font-bold mt-1">
                  ${data.revenue.total.toLocaleString()}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  {data.revenue.change >= 0 ? (
                    <>
                      <ArrowUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">+{data.revenue.change}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">{data.revenue.change}%</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.totalProjects}</p>
                <h3 className="text-2xl font-bold mt-1">{data.projects.total}</h3>
                <div className="flex items-center gap-1 mt-2">
                  {data.projects.change >= 0 ? (
                    <>
                      <ArrowUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">+{data.projects.change}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">{data.projects.change}%</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.totalClients}</p>
                <h3 className="text-2xl font-bold mt-1">{data.clients.total}</h3>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    +{data.clients.new} {language === 'en' ? 'new' : '新增'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-pink-100 rounded-lg">
                <Users className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.avgCompletionTime}</p>
                <h3 className="text-2xl font-bold mt-1">
                  {data.performance.avgCompletionTime} {t.days}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-sm text-gray-600">
                    {t.successRate}: {data.performance.successRate}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Clock className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t.revenueOverTime}</CardTitle>
            <CardDescription>
              {language === 'en' ? 'Monthly revenue trend' : '月度收入趨勢'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.revenue.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#7c3aed" 
                  fill="url(#colorRevenue)" 
                />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Projects by Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t.projectsByStatus}</CardTitle>
            <CardDescription>
              {language === 'en' ? 'Distribution of project statuses' : '項目狀態分佈'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.projects.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.projects.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>{t.performance}</CardTitle>
          <CardDescription>
            {language === 'en' ? 'Key performance indicators' : '關鍵績效指標'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{t.successRate}</span>
                <span className="text-sm font-bold text-purple-600">
                  {data.performance.successRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${data.performance.successRate}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{data.projects.active}</p>
                <p className="text-xs text-green-600 mt-1">{t.active}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{data.projects.completed}</p>
                <p className="text-xs text-blue-600 mt-1">{t.completed}</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-700">
                  {data.projects.statusData.find(s => s.name === t.pending)?.value || 0}
                </p>
                <p className="text-xs text-yellow-600 mt-1">{t.pending}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-700">
                  {data.projects.statusData.find(s => s.name === t.onHold)?.value || 0}
                </p>
                <p className="text-xs text-gray-600 mt-1">{t.onHold}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
