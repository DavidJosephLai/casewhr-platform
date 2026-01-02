import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  Briefcase, 
  Users, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Crown,
  Loader2,
  Download,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { formatCurrencyAuto, type Currency } from '../lib/currency';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

interface AnalyticsData {
  totalProjects: number;
  totalEarnings: number;
  totalSpending: number;
  averageProjectValue: number;
  platformFeesSaved: number;
  activeProjects: number;
  completedProjects: number;
  monthlyTrend: Array<{
    month: string;
    earnings: number;
    spending: number;
    projects: number;
  }>;
  projectsByStatus: Array<{
    status: string;
    count: number;
    value: number;
  }>;
  topCategories: Array<{
    category: string;
    count: number;
    value: number;
  }>;
}

export function AdvancedAnalytics({ language = 'en' }: AnalyticsProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // ⭐ 數據庫預設儲存 TWD
  // 當切換到英文時，會自動按實時匯率轉換為 USD
  const storedCurrency: Currency = 'TWD';

  const translations = {
    en: {
      title: 'Advanced Analytics',
      enterpriseOnly: 'Enterprise Only',
      upgrade: 'Upgrade to Enterprise',
      overview: 'Overview',
      totalProjects: 'Total Projects',
      totalEarnings: 'Total Earnings',
      totalSpending: 'Total Spending',
      avgProjectValue: 'Avg Project Value',
      platformFeesSaved: 'Platform Fees Saved',
      activeProjects: 'Active Projects',
      completedProjects: 'Completed Projects',
      monthlyTrend: 'Monthly Trend',
      projectsByStatus: 'Projects by Status',
      topCategories: 'Top Categories',
      earnings: 'Earnings',
      spending: 'Spending',
      projects: 'Projects',
      noData: 'No data available yet. Start working on projects to see analytics!',
      vsLastMonth: 'vs last month',
      loading: 'Loading analytics...',
      download: 'Export Report',
      exportSuccess: 'Analytics report exported successfully!',
    },
    zh: {
      title: '高級數據分析',
      enterpriseOnly: '企業版專屬',
      upgrade: '升級至企業版',
      overview: '總覽',
      totalProjects: '總項目數',
      totalEarnings: '總收入',
      totalSpending: '總支出',
      avgProjectValue: '平均項目價值',
      platformFeesSaved: '節省的服務費',
      activeProjects: '進行中項目',
      completedProjects: '已完成項目',
      monthlyTrend: '月度趨勢',
      projectsByStatus: '項目狀態分佈',
      topCategories: '熱門類別',
      earnings: '收入',
      spending: '支出',
      projects: '項目',
      noData: '暫無數據。開始項目後即可查看分析！',
      vsLastMonth: '較上月',
      loading: '載入分析數據中...',
      download: '導出報告',
      exportSuccess: '分析報告導出成功！',
    },
    'zh-TW': {
      title: '高級數據分析',
      enterpriseOnly: '企業版專屬',
      upgrade: '升級至企業版',
      overview: '總覽',
      totalProjects: '總項目數',
      totalEarnings: '總收入',
      totalSpending: '總支出',
      avgProjectValue: '平均項目價值',
      platformFeesSaved: '節省的服務費',
      activeProjects: '進行中項目',
      completedProjects: '已完成項目',
      monthlyTrend: '月度趨勢',
      projectsByStatus: '項目狀態分佈',
      topCategories: '熱門類別',
      earnings: '收入',
      spending: '支出',
      projects: '項目',
      noData: '暫無數據。開始項目後即可查看分析！',
      vsLastMonth: '較上月',
      loading: '載入分析數據中...',
      download: '導出報告',
      exportSuccess: '分析報告導出成功！',
    },
    'zh-CN': {
      title: '高级数据分析',
      enterpriseOnly: '企业版专属',
      upgrade: '升级至企业版',
      overview: '总览',
      totalProjects: '总项目数',
      totalEarnings: '总收入',
      totalSpending: '总支出',
      avgProjectValue: '平均项目价值',
      platformFeesSaved: '节省的服务费',
      activeProjects: '进行中项目',
      completedProjects: '已完成项目',
      monthlyTrend: '月度趋势',
      projectsByStatus: '项目状态分布',
      topCategories: '热门类别',
      earnings: '收入',
      spending: '支出',
      projects: '项目',
      noData: '暂无数据。开始项目后即可查看分析！',
      vsLastMonth: '较上月',
      loading: '载入分析数据中...',
      download: '导出报告',
      exportSuccess: '分析报告导出成功！',
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    if (user) {
      fetchAnalytics();
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/analytics/advanced`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyAuto(amount, storedCurrency, language);
  };

  // Check if user has enterprise plan
  const isEnterprise = subscription?.plan === 'enterprise';

  if (!isEnterprise) {
    return (
      <Card className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Crown className="size-8 text-amber-600" />
            <h3 className="text-2xl text-amber-900">{t.title}</h3>
          </div>
          <Badge className="bg-amber-600 text-white">
            {t.enterpriseOnly}
          </Badge>
          <p className="text-amber-800 max-w-md mx-auto">
            {language === 'en' 
              ? 'Unlock powerful insights about your business with advanced analytics. Track trends, monitor performance, and make data-driven decisions.'
              : '解鎖強大的業務洞察，包括高級數據分析。追蹤趨勢、監控績效並做出數據驅動的決策。'
            }
          </p>
          <div className="flex items-center justify-center gap-2 pt-4">
            <Activity className="size-5 text-amber-600" />
            <BarChart3 className="size-5 text-amber-600" />
            <TrendingUp className="size-5 text-amber-600" />
            <PieChart className="size-5 text-amber-600" />
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-600">
          <Activity className="size-12 mx-auto mb-4 text-gray-400" />
          <p>{t.noData}</p>
        </div>
      </Card>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Export Analytics Report as PDF
  const handleExportReport = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(t.title, margin, yPos);
      yPos += 15;

      // Subtitle with Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString(
        language === 'en' ? 'en-US' : language === 'zh-CN' ? 'zh-CN' : 'zh-TW'
      );
      doc.text(
        language === 'en' 
          ? `Generated on: ${currentDate}` 
          : `生成日期：${currentDate}`,
        margin,
        yPos
      );
      yPos += 15;

      // Key Metrics Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'en' ? 'Key Metrics' : '關鍵指標', margin, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const metrics = [
        `${t.totalProjects}: ${analytics.totalProjects}`,
        `${t.activeProjects}: ${analytics.activeProjects}`,
        `${t.completedProjects}: ${analytics.completedProjects}`,
        `${t.totalEarnings}: ${formatCurrency(analytics.totalEarnings)}`,
        `${t.totalSpending}: ${formatCurrency(analytics.totalSpending)}`,
        `${t.avgProjectValue}: ${formatCurrency(analytics.averageProjectValue)}`,
        `${t.platformFeesSaved}: ${formatCurrency(analytics.platformFeesSaved)}`,
      ];

      metrics.forEach((metric) => {
        doc.text(metric, margin, yPos);
        yPos += 7;
      });

      yPos += 10;

      // Monthly Trend Section
      if (analytics.monthlyTrend && analytics.monthlyTrend.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(t.monthlyTrend, margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        analytics.monthlyTrend.forEach((item) => {
          if (yPos > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
          }
          doc.text(
            `${item.month}: ${t.earnings} ${formatCurrency(item.earnings)} | ${t.spending} ${formatCurrency(item.spending)} | ${t.projects} ${item.projects}`,
            margin,
            yPos
          );
          yPos += 7;
        });

        yPos += 10;
      }

      // Projects by Status Section
      if (analytics.projectsByStatus && analytics.projectsByStatus.length > 0) {
        if (yPos > pageHeight - margin - 50) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(t.projectsByStatus, margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        analytics.projectsByStatus.forEach((item) => {
          doc.text(
            `${item.status}: ${item.count} ${language === 'en' ? 'projects' : '個項目'} (${formatCurrency(item.value)})`,
            margin,
            yPos
          );
          yPos += 7;
        });

        yPos += 10;
      }

      // Top Categories Section
      if (analytics.topCategories && analytics.topCategories.length > 0) {
        if (yPos > pageHeight - margin - 50) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(t.topCategories, margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        analytics.topCategories.forEach((item) => {
          doc.text(
            `${item.category}: ${item.count} ${language === 'en' ? 'projects' : '個項目'} (${formatCurrency(item.value)})`,
            margin,
            yPos
          );
          yPos += 7;
        });
      }

      // Footer
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        language === 'en'
          ? 'CaseWHR - Professional Freelancing Platform'
          : 'CaseWHR - 專業接案平台',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );

      // Save PDF
      const fileName = `analytics_report_${new Date().getTime()}.pdf`;
      doc.save(fileName);
      
      toast.success(t.exportSuccess);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error(
        language === 'en'
          ? 'Failed to export report'
          : '導出報告失敗'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title */}
      <Card className="p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <BarChart3 className="size-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl text-amber-900">{t.title}</h2>
              <p className="text-sm text-amber-700">
                {language === 'en' 
                  ? 'Comprehensive insights and performance metrics' 
                  : '全面的業務洞察和績效指標'}
              </p>
            </div>
          </div>
          <Badge className="bg-amber-600 text-white px-3 py-1">
            <Crown className="size-3 mr-1 inline" />
            {t.enterpriseOnly}
          </Badge>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Briefcase className="size-5 text-blue-600" />
            <ArrowUpRight className="size-4 text-green-600" />
          </div>
          <p className="text-sm text-blue-900 mb-1">{t.totalProjects}</p>
          <p className="text-3xl text-blue-700">{analytics.totalProjects}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-blue-700">
              {analytics.activeProjects} {language === 'en' ? 'active' : '進行中'}
            </span>
          </div>
        </Card>

        {/* Total Earnings */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="size-5 text-green-600" />
            <TrendingUp className="size-4 text-green-600" />
          </div>
          <p className="text-sm text-green-900 mb-1">{t.totalEarnings}</p>
          <p className="text-3xl text-green-700">{formatCurrency(analytics.totalEarnings)}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-green-700">
              {formatCurrency(analytics.platformFeesSaved)} {language === 'en' ? 'saved' : '已節省'}
            </span>
          </div>
        </Card>

        {/* Average Project Value */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="size-5 text-purple-600" />
            <Activity className="size-4 text-purple-600" />
          </div>
          <p className="text-sm text-purple-900 mb-1">{t.avgProjectValue}</p>
          <p className="text-3xl text-purple-700">{formatCurrency(analytics.averageProjectValue)}</p>
        </Card>

        {/* Completed Projects */}
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="size-5 text-amber-600" />
            <Calendar className="size-4 text-amber-600" />
          </div>
          <p className="text-sm text-amber-900 mb-1">{t.completedProjects}</p>
          <p className="text-3xl text-amber-700">{analytics.completedProjects}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-amber-700">
              {analytics.totalProjects > 0 
                ? `${Math.round((analytics.completedProjects / analytics.totalProjects) * 100)}%`
                : '0%'
              } {language === 'en' ? 'completion rate' : '完成率'}
            </span>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2">
            <TrendingUp className="size-5 text-blue-600" />
            {t.monthlyTrend}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="earnings" 
                stroke="#10b981" 
                name={t.earnings}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="spending" 
                stroke="#ef4444" 
                name={t.spending}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Projects by Status */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2">
            <PieChart className="size-5 text-purple-600" />
            {t.projectsByStatus}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={analytics.projectsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.projectsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Categories */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2">
            <BarChart3 className="size-5 text-amber-600" />
            {t.topCategories}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topCategories}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name={t.projects} />
              <Bar dataKey="value" fill="#10b981" name={t.earnings} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Download Button */}
      <div className="flex justify-end mt-6">
        <Button
          className="bg-blue-500 text-white"
          onClick={handleExportReport}
        >
          <Download className="size-4 mr-2" />
          {t.download}
        </Button>
      </div>
    </div>
  );
}