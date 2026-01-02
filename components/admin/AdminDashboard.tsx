// ⚡ AdminDashboard Component - Full Featured with Hardcoded Traditional Chinese
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Users, Briefcase, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Star, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Badge } from '../ui/badge';
import { EmailQuickLinks } from './EmailQuickLinks';
import { fetchWithRetry, parseJsonResponse } from '../../lib/apiErrorHandler';
import { AdminLevel } from '../../config/admin';

interface Stats {
  totalUsers: number;
  activeProjects: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  newUsersThisMonth: number;
  completedProjectsThisMonth: number;
  withdrawalRequests: {
    pending: number;
    approved: number;
    rejected: number;
  };
  totalProjects?: number;
  totalMessages?: number;
  avgProjectValue?: number;
  activeUsersToday?: number;
  totalMilestones?: number;
  completedMilestones?: number;
  totalReviews?: number;
  avgRating?: number;
  membershipStats?: {
    free: number;
    basic: number;
    premium: number;
  };
}

interface AdminDashboardProps {
  adminLevel?: AdminLevel | null;
}

export function AdminDashboard({ adminLevel }: AdminDashboardProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    console.log('[AdminDashboard] Component mounted, accessToken:', accessToken ? `${accessToken.substring(0, 30)}...` : 'NULL');
    if (accessToken) {
      fetchStats();
    } else {
      console.warn('[AdminDashboard] No access token available, cannot fetch stats');
    }
  }, [accessToken]);

  const fetchStats = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      console.log('[AdminDashboard] Fetching stats...');
      console.log('[AdminDashboard] Access Token type:', accessToken.startsWith('dev-user-') ? 'DEV MODE' : 'NORMAL');
      
      // 🧪 In dev mode, use publicAnonKey for auth but send dev token in custom header
      const isDevMode = accessToken.startsWith('dev-user-');
      const authToken = isDevMode ? publicAnonKey : accessToken;
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${authToken}`,
      };
      
      // Add dev mode token in custom header
      if (isDevMode) {
        headers['X-Dev-Token'] = accessToken;
        console.log('[AdminDashboard] Dev mode: Using publicAnonKey for auth, dev token in X-Dev-Token header');
      }
      
      const response = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/stats`,
        { headers },
        2,
        25000
      );

      console.log('[AdminDashboard] Response status:', response.status);
      
      if (response.ok) {
        const data = await parseJsonResponse(response);
        console.log('📊 [AdminDashboard] Stats loaded:', (data as any).stats);
        setStats((data as any).stats);
      } else {
        const errorText = await response.text();
        console.error('❌ [AdminDashboard] API error:', response.status, errorText);
        setStats({
          totalUsers: 0,
          activeProjects: 0,
          totalRevenue: 0,
          pendingWithdrawals: 0,
          newUsersThisMonth: 0,
          completedProjectsThisMonth: 0,
          withdrawalRequests: { pending: 0, approved: 0, rejected: 0 }
        });
      }
    } catch (error: any) {
      console.error('[AdminDashboard] Error:', error.message);
      setStats({
        totalUsers: 0,
        activeProjects: 0,
        totalRevenue: 0,
        pendingWithdrawals: 0,
        newUsersThisMonth: 0,
        completedProjectsThisMonth: 0,
        withdrawalRequests: { pending: 0, approved: 0, rejected: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">載入統計數據中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">儀表板總覽</h2>
        <p className="text-gray-600 mt-1">平台統計與洞察</p>
      </div>

      {/* Email Quick Links */}
      <EmailQuickLinks />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">總用戶數</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {stats?.totalUsers?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">活躍項目</CardTitle>
            <Briefcase className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {stats?.activeProjects?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">總收入</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              ${stats?.totalRevenue?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        {/* Pending Withdrawals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">待處理提現</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {stats?.pendingWithdrawals?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              本月活動
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">新增用戶</span>
              <span className="text-2xl font-semibold text-blue-600">
                {stats?.newUsersThisMonth || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">完成項目</span>
              <span className="text-2xl font-semibold text-green-600">
                {stats?.completedProjectsThisMonth || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              提現狀態
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-gray-600">待審核</span>
              </div>
              <span className="text-xl font-semibold text-orange-600">
                {stats?.withdrawalRequests?.pending || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">已批准</span>
              </div>
              <span className="text-xl font-semibold text-green-600">
                {stats?.withdrawalRequests?.approved || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-gray-600">已拒絕</span>
              </div>
              <span className="text-xl font-semibold text-red-600">
                {stats?.withdrawalRequests?.rejected || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Project Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              項目統計
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">總項目數</span>
              <span className="text-xl font-semibold text-indigo-600">
                {stats?.totalProjects?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">平均項目價值</span>
              <span className="text-xl font-semibold text-purple-600">
                ${stats?.avgProjectValue?.toLocaleString() || 0}
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">已完成</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {stats?.completedProjectsThisMonth || 0} 本月
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-600" />
              用戶活動
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">今日活躍</span>
              <span className="text-xl font-semibold text-cyan-600">
                {stats?.activeUsersToday?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">總消息數</span>
              <span className="text-xl font-semibold text-blue-600">
                {stats?.totalMessages?.toLocaleString() || 0}
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">新增用戶</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  +{stats?.newUsersThisMonth || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              平台健康
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">里程碑</span>
              <div className="text-right">
                <div className="text-xl font-semibold text-yellow-600">
                  {stats?.completedMilestones || 0}/{stats?.totalMilestones || 0}
                </div>
                <div className="text-xs text-gray-500">
                  {stats?.totalMilestones ? 
                    `${Math.round((stats?.completedMilestones || 0) / stats.totalMilestones * 100)}%` 
                    : '0%'} 已完成
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">平均評分</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-semibold text-yellow-600">
                  {stats?.avgRating?.toFixed(1) || '0.0'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">總評價數</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  {stats?.totalReviews?.toLocaleString() || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Membership Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            會員分佈
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">免費</div>
              <div className="text-2xl font-semibold text-gray-700">
                {stats?.membershipStats?.free?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats?.totalUsers ? 
                  `${Math.round((stats?.membershipStats?.free || 0) / stats.totalUsers * 100)}%` 
                  : '0%'}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="text-sm text-blue-600 mb-2">基礎</div>
              <div className="text-2xl font-semibold text-blue-700">
                {stats?.membershipStats?.basic?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {stats?.totalUsers ? 
                  `${Math.round((stats?.membershipStats?.basic || 0) / stats.totalUsers * 100)}%` 
                  : '0%'}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <div className="text-sm text-purple-600 mb-2">高級</div>
              <div className="text-2xl font-semibold text-purple-700">
                {stats?.membershipStats?.premium?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-purple-600 mt-1">
                {stats?.totalUsers ? 
                  `${Math.round((stats?.membershipStats?.premium || 0) / stats.totalUsers * 100)}%` 
                  : '0%'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}