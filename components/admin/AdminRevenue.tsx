import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { TrendingUp, DollarSign, Users, Calendar, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
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
  ResponsiveContainer,
} from 'recharts';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  currency: string;
  display_currency?: string;
  display_amount?: number;
  description: string;
  from_user_id?: string;
  from_user_email?: string;
  created_at: string;
  status?: string;
}

interface RevenueStats {
  totalRevenue: number;
  subscriptionRevenue: number;
  serviceFeeRevenue: number;
  totalTransactions: number;
  uniqueCustomers: number;
  averageTransactionValue: number;
  revenueByMonth: Array<{
    month: string;
    subscription: number;
    serviceFee: number;
    total: number;
  }>;
  revenueByPlan: Array<{
    name: string;
    value: number;
    count: number;
  }>;
  recentTransactions: Transaction[];
}

export function AdminRevenue() {
  const { accessToken, user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const t = {
    en: {
      title: 'Platform Revenue Management',
      description: 'Comprehensive revenue analytics and transaction history',
      totalRevenue: 'Total Revenue',
      subscriptionRevenue: 'Subscription Revenue',
      serviceFeeRevenue: 'Service Fee Revenue',
      totalTransactions: 'Total Transactions',
      uniqueCustomers: 'Unique Customers',
      avgTransaction: 'Avg Transaction',
      revenueOverTime: 'Revenue Over Time',
      revenueByPlan: 'Revenue by Plan',
      recentTransactions: 'Recent Transactions',
      timeRange: 'Time Range',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      allTime: 'All Time',
      refresh: 'Refresh',
      export: 'Export',
      loading: 'Loading revenue data...',
      noData: 'No revenue data available',
      date: 'Date',
      customer: 'Customer',
      amount: 'Amount',
      type: 'Type',
      description: 'Description',
      subscription: 'Subscription',
      serviceFee: 'Service Fee',
      total: 'Total',
      transactions: 'transactions',
    },
    'zh-TW': {
      title: '平台收入管理',
      description: '完整的收入分析與交易歷史記錄',
      totalRevenue: '總收入',
      subscriptionRevenue: '訂閱收入',
      serviceFeeRevenue: '服務費收入',
      totalTransactions: '交易總數',
      uniqueCustomers: '獨立客戶',
      avgTransaction: '平均交易額',
      revenueOverTime: '收入趨勢',
      revenueByPlan: '各方案收入佔比',
      recentTransactions: '最近交易記錄',
      timeRange: '時間範圍',
      last7Days: '最近 7 天',
      last30Days: '最近 30 天',
      last90Days: '最近 90 天',
      allTime: '全部時間',
      refresh: '刷新',
      export: '匯出',
      loading: '載入收入數據中...',
      noData: '暫無收入數據',
      date: '日期',
      customer: '客戶',
      amount: '金額',
      type: '類型',
      description: '描述',
      subscription: '訂閱',
      serviceFee: '服務費',
      total: '總計',
      transactions: '筆交易',
    },
    'zh-CN': {
      title: '平台收入管理',
      description: '完整的收入分析与交易历史记录',
      totalRevenue: '总收入',
      subscriptionRevenue: '订阅收入',
      serviceFeeRevenue: '服务费收入',
      totalTransactions: '交易总数',
      uniqueCustomers: '独立客户',
      avgTransaction: '平均交易额',
      revenueOverTime: '收入趋势',
      revenueByPlan: '各方案收入占比',
      recentTransactions: '最近交易记录',
      timeRange: '时间范围',
      last7Days: '最近 7 天',
      last30Days: '最近 30 天',
      last90Days: '最近 90 天',
      allTime: '全部时间',
      refresh: '刷新',
      export: '导出',
      loading: '载入收入数据中...',
      noData: '暂无收入数据',
      date: '日期',
      customer: '客户',
      amount: '金额',
      type: '类型',
      description: '描述',
      subscription: '订阅',
      serviceFee: '服务费',
      total: '总计',
      transactions: '笔交易',
    },
  };

  const text = t[language as keyof typeof t] || t['zh-TW'];

  useEffect(() => {
    loadRevenueData();
  }, [timeRange, accessToken]);

  const loadRevenueData = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      // 獲取平台擁有者的所有交易記錄
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/transactions`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load transactions');
      }

      const data = await response.json();
      const allTransactions: Transaction[] = data.transactions || [];

      // 篩選平台收入交易
      const revenueTransactions = allTransactions.filter(
        (t) => t.type === 'subscription_revenue' || t.type === 'service_fee'
      );

      // 根據時間範圍過濾
      const now = new Date();
      const filteredTransactions = revenueTransactions.filter((t) => {
        const transactionDate = new Date(t.created_at);
        const daysDiff = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (timeRange === '7d') return daysDiff <= 7;
        if (timeRange === '30d') return daysDiff <= 30;
        if (timeRange === '90d') return daysDiff <= 90;
        return true; // 'all'
      });

      // 計算統計數據
      const subscriptionRevenue = filteredTransactions
        .filter((t) => t.type === 'subscription_revenue')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const serviceFeeRevenue = filteredTransactions
        .filter((t) => t.type === 'service_fee')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalRevenue = subscriptionRevenue + serviceFeeRevenue;

      const uniqueCustomers = new Set(
        filteredTransactions.map((t) => t.from_user_id).filter(Boolean)
      ).size;

      const avgTransaction = filteredTransactions.length > 0
        ? totalRevenue / filteredTransactions.length
        : 0;

      // 按月份統計收入
      const revenueByMonth = calculateMonthlyRevenue(filteredTransactions);

      // 按方案統計收入
      const revenueByPlan = calculateRevenueByPlan(filteredTransactions);

      // 最近 10 筆交易
      const recentTransactions = filteredTransactions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setStats({
        totalRevenue,
        subscriptionRevenue,
        serviceFeeRevenue,
        totalTransactions: filteredTransactions.length,
        uniqueCustomers,
        averageTransactionValue: avgTransaction,
        revenueByMonth,
        revenueByPlan,
        recentTransactions,
      });
    } catch (error) {
      console.error('Error loading revenue data:', error);
      toast.error(language === 'en' ? 'Failed to load revenue data' : '載入收入數據失敗');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyRevenue = (transactions: Transaction[]) => {
    const monthlyData: { [key: string]: { subscription: number; serviceFee: number } } = {};

    transactions.forEach((t) => {
      const month = new Date(t.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
        year: 'numeric',
        month: 'short',
      });

      if (!monthlyData[month]) {
        monthlyData[month] = { subscription: 0, serviceFee: 0 };
      }

      if (t.type === 'subscription_revenue') {
        monthlyData[month].subscription += t.amount || 0;
      } else if (t.type === 'service_fee') {
        monthlyData[month].serviceFee += t.amount || 0;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        subscription: data.subscription,
        serviceFee: data.serviceFee,
        total: data.subscription + data.serviceFee,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

  const calculateRevenueByPlan = (transactions: Transaction[]) => {
    const planData: { [key: string]: { revenue: number; count: number } } = {
      Pro: { revenue: 0, count: 0 },
      Enterprise: { revenue: 0, count: 0 },
      'Service Fee': { revenue: 0, count: 0 },
    };

    transactions.forEach((t) => {
      if (t.type === 'subscription_revenue') {
        const isPro = t.description?.toLowerCase().includes('pro');
        const isEnterprise = t.description?.toLowerCase().includes('enterprise');

        if (isEnterprise) {
          planData['Enterprise'].revenue += t.amount || 0;
          planData['Enterprise'].count += 1;
        } else if (isPro) {
          planData['Pro'].revenue += t.amount || 0;
          planData['Pro'].count += 1;
        }
      } else if (t.type === 'service_fee') {
        planData['Service Fee'].revenue += t.amount || 0;
        planData['Service Fee'].count += 1;
      }
    });

    return Object.entries(planData)
      .filter(([_, data]) => data.revenue > 0)
      .map(([name, data]) => ({
        name,
        value: data.revenue,
        count: data.count,
      }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'zh-TW', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const exportData = () => {
    if (!stats) return;

    const csvContent = [
      ['Date', 'Customer', 'Type', 'Amount', 'Description'].join(','),
      ...stats.recentTransactions.map((t) =>
        [
          new Date(t.created_at).toLocaleDateString(),
          t.from_user_email || 'N/A',
          t.type,
          t.amount,
          `"${t.description?.replace(/"/g, '""') || ''}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `platform_revenue_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(language === 'en' ? 'Data exported successfully' : '數據匯出成功');
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">{text.loading}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{text.noData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{text.title}</h2>
          <p className="text-gray-600 mt-1">{text.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">{text.last7Days}</option>
              <option value="30d">{text.last30Days}</option>
              <option value="90d">{text.last90Days}</option>
              <option value="all">{text.allTime}</option>
            </select>
          </div>
          <Button onClick={loadRevenueData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {text.refresh}
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {text.export}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">{text.totalRevenue}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.totalTransactions} {text.transactions}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">{text.subscriptionRevenue}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(stats.subscriptionRevenue)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {((stats.subscriptionRevenue / stats.totalRevenue) * 100).toFixed(1)}% {text.total}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">{text.uniqueCustomers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-600">{stats.uniqueCustomers}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {text.avgTransaction}: {formatCurrency(stats.averageTransactionValue)}
                </p>
              </div>
              <Users className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>{text.revenueOverTime}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.revenueByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="subscription" fill="#8b5cf6" name={text.subscription} />
                  <Bar dataKey="serviceFee" fill="#3b82f6" name={text.serviceFee} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">{text.noData}</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>{text.revenueByPlan}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.revenueByPlan.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.revenueByPlan}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.revenueByPlan.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">{text.noData}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>{text.recentTransactions}</CardTitle>
          <CardDescription>
            {text.totalTransactions}: {stats.totalTransactions}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">{text.date}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">{text.customer}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">{text.type}</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">{text.amount}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">{text.description}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {transaction.from_user_email || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'subscription_revenue'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {transaction.type === 'subscription_revenue' ? text.subscription : text.serviceFee}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-green-600">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-md truncate">
                      {transaction.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
