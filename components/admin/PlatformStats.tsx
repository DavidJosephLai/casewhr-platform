import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, Briefcase, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { createAuthHeaders } from '../../lib/api'; // ✅ Import the helper function
import { fetchWithRetry, parseJsonResponse } from '../../lib/apiErrorHandler';

interface PlatformStatsData {
  overview: {
    totalUsers: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalRevenue: number;
    platformFees: number;
    platformServiceFees?: number;
    subscriptionRevenue?: number;
    totalUserWalletBalance?: number;
    activeSubscriptions: number;
    pendingWithdrawals: number;
    totalWithdrawalAmount: number;
  };
  growth: {
    projects: string;
    revenue: string;
  };
  recent: {
    projectsLast30Days: number;
    revenueLast30Days: number;
  };
}

export function PlatformStats() {
  const [stats, setStats] = useState<PlatformStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const t = {
    en: {
      title: 'Platform Statistics',
      description: 'Overview of your platform performance',
      users: 'Total Users',
      projects: 'Total Projects',
      activeProjects: 'Active Projects',
      completedProjects: 'Completed Projects',
      revenue: 'Platform Revenue',
      platformFees: 'Service Fees',
      subscriptionRevenue: 'Subscription Revenue',
      userWalletBalance: 'User Wallets (Total)',
      subscriptions: 'Active Subscriptions',
      pendingWithdrawals: 'Pending Withdrawals',
      withdrawalAmount: 'Withdrawal Amount',
      growth: 'Growth',
      last30Days: 'Last 30 Days',
      loading: 'Loading statistics...',
      error: 'Failed to load statistics',
    },
    'zh-TW': {
      title: '平台統計',
      description: '平台表現總覽',
      users: '總用戶數',
      projects: '總項目數',
      activeProjects: '進行中項目',
      completedProjects: '已完成項目',
      revenue: '平台總收入',
      platformFees: '服務手續費',
      subscriptionRevenue: '訂閱收入',
      userWalletBalance: '用戶錢包（總餘額）',
      subscriptions: '活躍訂閱',
      pendingWithdrawals: '待處理提現',
      withdrawalAmount: '提現金額',
      growth: '增長率',
      last30Days: '最近30天',
      loading: '載入統計中...',
      error: '載入統計失敗',
    },
    'zh-CN': {
      title: '平台统计',
      description: '平台表现总览',
      users: '总用户数',
      projects: '总项目数',
      activeProjects: '进行中项目',
      completedProjects: '已完成项目',
      revenue: '平台总收入',
      platformFees: '服务手续费',
      subscriptionRevenue: '订阅收入',
      userWalletBalance: '用户钱包（总余额）',
      subscriptions: '活跃订阅',
      pendingWithdrawals: '待处理提现',
      withdrawalAmount: '提现金额',
      growth: '增长率',
      last30Days: '最近30天',
      loading: '载入统计中...',
      error: '载入统计失败',
    }
  };

  const text = t['en'];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/stats`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (response.ok) {
        const data = await parseJsonResponse(response);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">{text.loading}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-500">{text.error}</p>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: text.users,
      value: stats.overview.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: text.projects,
      value: stats.overview.totalProjects,
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      growth: stats.growth.projects,
      recent: stats.recent.projectsLast30Days,
    },
    {
      title: text.activeProjects,
      value: stats.overview.activeProjects,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: text.completedProjects,
      value: stats.overview.completedProjects,
      icon: Briefcase,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: text.revenue,
      value: `$${stats.overview.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      growth: stats.growth.revenue,
      recent: `$${stats.recent.revenueLast30Days.toFixed(2)}`,
    },
    {
      title: text.platformFees,
      value: `$${stats.overview.platformFees.toFixed(2)}`,
      icon: CreditCard,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: text.subscriptions,
      value: stats.overview.activeSubscriptions,
      icon: CreditCard,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: text.pendingWithdrawals,
      value: stats.overview.pendingWithdrawals,
      icon: ArrowUpRight,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: text.withdrawalAmount,
      value: `$${stats.overview.totalWithdrawalAmount.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{text.title}</CardTitle>
          <CardDescription>{text.description}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const growthValue = stat.growth ? parseFloat(stat.growth) : null;
          const isPositiveGrowth = growthValue !== null && growthValue >= 0;

          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                
                {stat.growth && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`flex items-center text-sm ${
                      isPositiveGrowth ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositiveGrowth ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(growthValue!)}%
                    </div>
                    <span className="text-xs text-gray-500">{text.growth}</span>
                  </div>
                )}

                {stat.recent && (
                  <p className="text-xs text-gray-500 mt-1">
                    {text.last30Days}: {stat.recent}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}