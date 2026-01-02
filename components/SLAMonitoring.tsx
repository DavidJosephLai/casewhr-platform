import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Target,
  Zap,
  Crown,
  Activity,
  BarChart3,
  Bell,
  Info,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface SLAMetric {
  id: string;
  ticket_id: string;
  ticket_title: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  created_at: string;
  first_response_at?: string;
  resolved_at?: string;
  sla_target_response: number; // hours
  sla_target_resolution: number; // hours
  response_time?: number; // hours
  resolution_time?: number; // hours
  response_status: 'met' | 'breached' | 'pending';
  resolution_status: 'met' | 'breached' | 'pending';
}

interface SLAStats {
  total_tickets: number;
  response_sla_met: number;
  response_sla_breached: number;
  resolution_sla_met: number;
  resolution_sla_breached: number;
  avg_response_time: number;
  avg_resolution_time: number;
  response_sla_percentage: number;
  resolution_sla_percentage: number;
}

interface SLAMonitoringProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function SLAMonitoring({ language = 'en' }: SLAMonitoringProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [metrics, setMetrics] = useState<SLAMetric[]>([]);
  const [stats, setStats] = useState<SLAStats | null>(null);
  const [activeTickets, setActiveTickets] = useState<SLAMetric[]>([]);

  const translations = {
    en: {
      title: 'SLA Monitoring',
      subtitle: 'Real-time Service Level Agreement tracking with automatic alerts',
      description: 'Automatically track and monitor response times for all support tickets. Get instant alerts when SLA targets are at risk.',
      howItWorks: 'How SLA Monitoring Works',
      howItWorksDesc: 'Our system automatically tracks every support ticket from creation to resolution, measuring response and resolution times against guaranteed SLA targets based on priority level.',
      enterpriseOnly: 'Enterprise Only Feature',
      upgrade: 'Upgrade to Enterprise',
      upgradeDesc: 'Get guaranteed response times with automatic SLA tracking and breach alerts!',
      overview: 'SLA Performance Overview',
      responseTime: 'Response Time SLA',
      responseTimeDesc: 'Time until first response to ticket',
      resolutionTime: 'Resolution Time SLA',
      resolutionTimeDesc: 'Time until ticket is fully resolved',
      activeTickets: 'Active Tickets Requiring Attention',
      activeTicketsDesc: 'Tickets currently being monitored with real-time SLA countdown',
      recentTickets: 'Recent SLA Performance Metrics',
      recentTicketsDesc: 'Historical performance data for completed tickets',
      stats: 'Performance Statistics',
      avgResponse: 'Avg Response Time',
      avgResponseDesc: 'Average time to first response across all tickets',
      avgResolution: 'Avg Resolution Time',
      avgResolutionDesc: 'Average time to complete resolution across all tickets',
      slaTarget: 'SLA Target',
      met: 'Met',
      breached: 'Breached',
      pending: 'Pending',
      timeRemaining: 'Time Remaining',
      overdue: 'Overdue',
      urgent: 'Urgent',
      high: 'High',
      normal: 'Normal',
      low: 'Low',
      hours: 'h',
      minutes: 'min',
      compliance: 'SLA Compliance Rate',
      performance: 'Performance Level',
      excellent: 'Excellent (95%+)',
      good: 'Good (85-94%)',
      needsImprovement: 'Needs Improvement (70-84%)',
      critical: 'Critical (<70%)',
      autoAlert: 'Automatic Alerts',
      autoAlertDesc: 'Receive instant notifications when SLA targets are approaching or breached',
      slaTargets: {
        title: 'Enterprise SLA Guarantee Targets',
        description: 'Guaranteed maximum response and resolution times based on ticket priority',
        urgent: {
          response: '1 hour',
          resolution: '4 hours',
          desc: 'Critical issues affecting business operations'
        },
        high: {
          response: '4 hours',
          resolution: '8 hours',
          desc: 'Important issues requiring quick resolution'
        },
        normal: {
          response: '8 hours',
          resolution: '24 hours',
          desc: 'Standard support requests'
        },
        low: {
          response: '24 hours',
          resolution: '48 hours',
          desc: 'General inquiries and non-urgent requests'
        }
      },
      benefits: {
        title: 'Why SLA Monitoring Matters:',
        items: [
          '✅ Guaranteed response times based on priority',
          '🔔 Automatic breach alerts prevent SLA violations',
          '⏱️ Real-time tracking with countdown timers',
          '📊 Performance analytics and compliance reports',
          '🎯 Priority-based SLA targets for optimal service',
          '📈 Detailed compliance reports for stakeholders'
        ]
      },
      colorGuide: {
        title: 'Status Color Guide:',
        green: 'Green: SLA on track, plenty of time remaining',
        yellow: 'Yellow: SLA at risk, less than 50% time remaining',
        red: 'Red: SLA critical, less than 25% time remaining or breached'
      }
    },
    zh: {
      title: 'SLA 監控',
      subtitle: '即時服務等級協議追蹤並自動警報',
      description: '自動追蹤並監控所有支援票據的響應時間。當 SLA 目標有風險時，立即收到警報。',
      howItWorks: 'SLA 監控如何運作',
      howItWorksDesc: '我們的系統自動追蹤每個支援票據從創建到解決的過程，測量響應和解決時間是否符合基於優先級的保證 SLA 目標。',
      enterpriseOnly: '企業版專屬功能',
      upgrade: '升級至企業版',
      upgradeDesc: '獲得保證回應時間及自動 SLA 追蹤和違約警報！',
      overview: 'SLA 效能概覽',
      responseTime: '回應時間 SLA',
      responseTimeDesc: '從創建到首次回應的時間',
      resolutionTime: '解決時間 SLA',
      resolutionTimeDesc: '從創建到完全解決的時間',
      activeTickets: '需要關注的活躍工單',
      activeTicketsDesc: '當前正在監控的工單，附帶即時 SLA 倒數計時',
      recentTickets: '最近 SLA 效能指標',
      recentTicketsDesc: '已完成工單的歷史效能數據',
      stats: '效能統計',
      avgResponse: '平均回應時間',
      avgResponseDesc: '所有工單的平均首次回應時間',
      avgResolution: '平均��決時間',
      avgResolutionDesc: '所有工單的平均解決時間',
      slaTarget: 'SLA 目標',
      met: '達成',
      breached: '違約',
      pending: '待處理',
      timeRemaining: '剩餘時間',
      overdue: '超時',
      urgent: '緊急',
      high: '高',
      normal: '正常',
      low: '低',
      hours: '小時',
      minutes: '分鐘',
      compliance: 'SLA 合規率',
      performance: '表現等級',
      excellent: '優秀 (95%+)',
      good: '良好 (85-94%)',
      needsImprovement: '需改進 (70-84%)',
      critical: '嚴重 (<70%)',
      autoAlert: '自動警報',
      autoAlertDesc: '當 SLA 目標接近或違約時，立即收到通知',
      slaTargets: {
        title: '企業版 SLA 保證目標',
        description: '基於票據優先級的保證最大響應和解決時間',
        urgent: {
          response: '1 小時',
          resolution: '4 小時',
          desc: '影響業務運營的關鍵問題'
        },
        high: {
          response: '4 小時',
          resolution: '8 小時',
          desc: '需要快速解決的重要問題'
        },
        normal: {
          response: '8 小時',
          resolution: '24 小時',
          desc: '標準支援請求'
        },
        low: {
          response: '24 小時',
          resolution: '48 小時',
          desc: '一般查詢和非緊急請求'
        }
      },
      benefits: {
        title: '為何 SLA 監控重要：',
        items: [
          '✅ 基於優先級的保證回應時間',
          '🔔 自動違約警報防止 SLA 違規',
          '⏱️ 即時追蹤並附帶倒數計時器',
          '📊 效能分析和合規報告',
          '🎯 基於優先級的 SLA 目標以實現最佳服務',
          '📈 詳細合規報告供相關方參考'
        ]
      },
      colorGuide: {
        title: '狀態顏色指南：',
        green: '綠色：SLA 在軌道上，剩餘時間充足',
        yellow: '黃色：SLA 有風險，剩餘時間少於 50%',
        red: '紅色：SLA 危急，剩餘時間少於 25% 或已違約'
      }
    },
    'zh-TW': {
      title: 'SLA 監控',
      subtitle: '即時服務等級協議追蹤並自動警報',
      description: '自動追蹤並監控所有支援票據的響應時間。當 SLA 目標有風險時，立即收到警報。',
      howItWorks: 'SLA 監控如何運作',
      howItWorksDesc: '我們的系統自動追蹤每個支援票據從創建到解決的過程，測量響應和解決時間是否符合基於優先級的保證 SLA 目標。',
      enterpriseOnly: '企業版專屬功能',
      upgrade: '升級至企業版',
      upgradeDesc: '獲得保證回應時間及自動 SLA 追蹤和違約警報！',
      overview: 'SLA 效能概覽',
      responseTime: '回應時間 SLA',
      responseTimeDesc: '從創建到首次回應的時間',
      resolutionTime: '解決時間 SLA',
      resolutionTimeDesc: '從創建到完全解決的時間',
      activeTickets: '需要關注的活躍工單',
      activeTicketsDesc: '當前正在監控的工單，附帶即時 SLA 倒數計時',
      recentTickets: '最近 SLA 效能指標',
      recentTicketsDesc: '已完成工單的歷史效能數據',
      stats: '效能統計',
      avgResponse: '平均回應時間',
      avgResponseDesc: '所有工單的平均首次回應時間',
      avgResolution: '平均解決時間',
      avgResolutionDesc: '所有工單的平均解決時間',
      slaTarget: 'SLA 目標',
      met: '達成',
      breached: '違約',
      pending: '待處理',
      timeRemaining: '剩餘時間',
      overdue: '超時',
      urgent: '緊急',
      high: '高',
      normal: '正常',
      low: '低',
      hours: '小時',
      minutes: '分鐘',
      compliance: 'SLA 合規率',
      performance: '表現等級',
      excellent: '優秀 (95%+)',
      good: '良好 (85-94%)',
      needsImprovement: '需改進 (70-84%)',
      critical: '嚴重 (<70%)',
      autoAlert: '自動警報',
      autoAlertDesc: '當 SLA 目標接近或違約時，立即收到通知',
      slaTargets: {
        title: '企業版 SLA 保證目標',
        description: '基於票據優先級的保證最大響應和解決時間',
        urgent: {
          response: '1 小時',
          resolution: '4 小時',
          desc: '影響業務運營的關鍵問題'
        },
        high: {
          response: '4 小時',
          resolution: '8 小時',
          desc: '需要快速解決的重要問題'
        },
        normal: {
          response: '8 小時',
          resolution: '24 小時',
          desc: '標準支援請求'
        },
        low: {
          response: '24 小時',
          resolution: '48 小時',
          desc: '一般查詢和非緊急請求'
        }
      },
      benefits: {
        title: '為何 SLA 監控重要：',
        items: [
          '✅ 基於優先級的保證回應時間',
          '🔔 自動違約警報防止 SLA 違規',
          '⏱️ 即時追蹤並附帶倒數計時器',
          '📊 效能分析和合規報告',
          '🎯 基於優先級的 SLA 目標以實現最佳服務',
          '📈 詳細合規報告供相關方參考'
        ]
      },
      colorGuide: {
        title: '狀態顏色指南：',
        green: '綠色：SLA 在軌道上，剩餘時間充足',
        yellow: '黃色：SLA 有風險，剩餘時間少於 50%',
        red: '紅色：SLA 危急，剩餘時間少於 25% 或已違約'
      }
    },
    'zh-CN': {
      title: 'SLA 监控',
      subtitle: '实时服务级别协议跟踪并自动警报',
      description: '自动跟踪并监控所有支持票务的响应时间。当 SLA 目标有风险时，立即收到警报。',
      howItWorks: 'SLA 监控如何运作',
      howItWorksDesc: '我们的系统自动跟踪每个支持票务从创建到解决的过程，测量响应和解决时间是否符合基于优先级的保证 SLA 目标。',
      enterpriseOnly: '企业版专属功能',
      upgrade: '升级至企业版',
      upgradeDesc: '获得保证响应时间及自动 SLA 跟踪和违约警报！',
      overview: 'SLA 性能概览',
      responseTime: '响应时间 SLA',
      responseTimeDesc: '从创建到首次响应的时间',
      resolutionTime: '解决时间 SLA',
      resolutionTimeDesc: '从创建到完全解决的时间',
      activeTickets: '需要关注的活跃工单',
      activeTicketsDesc: '当前正在监控的工单，附带实时 SLA 倒计时',
      recentTickets: '最近 SLA 性能标',
      recentTicketsDesc: '已完成工单的历史性能数据',
      stats: '性能统计',
      avgResponse: '平均响应时间',
      avgResponseDesc: '所有工单的平均首次响应时间',
      avgResolution: '平均解决时间',
      avgResolutionDesc: '所有工单的平均解决时间',
      slaTarget: 'SLA 目标',
      met: '达成',
      breached: '违约',
      pending: '待处理',
      timeRemaining: '剩余时间',
      overdue: '超时',
      urgent: '紧急',
      high: '高',
      normal: '正常',
      low: '低',
      hours: '小时',
      minutes: '分钟',
      compliance: 'SLA 合规率',
      performance: '表现等级',
      excellent: '优秀 (95%+)',
      good: '良好 (85-94%)',
      needsImprovement: '需改进 (70-84%)',
      critical: '严重 (<70%)',
      autoAlert: '自动警报',
      autoAlertDesc: '当 SLA 目标接近或违约时，立即收到通知',
      slaTargets: {
        title: '企业版 SLA 保证目标',
        description: '基于票务优先级的保证最大响应和解决时间',
        urgent: {
          response: '1 小时',
          resolution: '4 小时',
          desc: '影响业务运营的关键问题'
        },
        high: {
          response: '4 小时',
          resolution: '8 小时',
          desc: '需要快速解决的重要问题'
        },
        normal: {
          response: '8 小时',
          resolution: '24 小时',
          desc: '标准支持请求'
        },
        low: {
          response: '24 小时',
          resolution: '48 小时',
          desc: '一般查询和非紧急请求'
        }
      },
      benefits: {
        title: '为什么 SLA 监控重要：',
        items: [
          '✅ 基于优先级的保证响应时间',
          '🔔 自动违约警报防止 SLA 违规',
          '⏱️ 实时跟踪并附带倒计时计时器',
          '📊 性能分析和合规报告',
          '🎯 基于优先级的 SLA 目标以实现最佳服务',
          '📈 详细合规报告供相关方参考'
        ]
      },
      colorGuide: {
        title: '状态颜色指南：',
        green: '绿色：SLA 在轨道上，剩余时间充足',
        yellow: '黄色：SLA 有风险，剩余时间少于 50%',
        red: '红色：SLA 危急，剩余时间少于 25% 或已违约'
      }
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!accessToken) return;
    
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

      // Fetch subscription
      const subResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscriptions/user/${user?.id}`,
        { headers }
      );

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.subscription);
      }

      // Fetch SLA metrics if enterprise
      const metricsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/sla/metrics`,
        { headers }
      );

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.metrics || []);
        setStats(metricsData.stats);
        setActiveTickets(metricsData.active || []);
      } else if (metricsResponse.status === 404 || metricsResponse.status === 401) {
        // Silently handle missing endpoint or auth errors
        console.log('⚠️ [SLAMonitoring] SLA metrics endpoint not available');
      }
    } catch (error) {
      // Silently handle fetch errors - SLA is optional
      console.log('⚠️ [SLAMonitoring] Error fetching SLA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (createdAt: string, targetHours: number): { hours: number; status: 'ok' | 'warning' | 'critical' } => {
    const created = new Date(createdAt);
    const now = new Date();
    const elapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    const remaining = targetHours - elapsed;
    
    let status: 'ok' | 'warning' | 'critical' = 'ok';
    if (remaining < 0) status = 'critical';
    else if (remaining < targetHours * 0.25) status = 'critical';
    else if (remaining < targetHours * 0.5) status = 'warning';
    
    return { hours: Math.max(0, remaining), status };
  };

  const formatTime = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}${t.minutes}`;
    }
    return `${Math.round(hours * 10) / 10}${t.hours}`;
  };

  const getPerformanceLevel = (percentage: number): { label: string; color: string } => {
    if (percentage >= 95) return { label: t.excellent, color: 'text-green-600' };
    if (percentage >= 85) return { label: t.good, color: 'text-blue-600' };
    if (percentage >= 70) return { label: t.needsImprovement, color: 'text-yellow-600' };
    return { label: t.critical, color: 'text-red-600' };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'met': return 'bg-green-100 text-green-800';
      case 'breached': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isEnterprise = subscription?.plan === 'enterprise';

  if (!isEnterprise) {
    return (
      <Card className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Crown className="size-8 text-indigo-600" />
            <h3 className="text-2xl text-indigo-900">{t.title}</h3>
          </div>
          <Badge className="bg-indigo-600 text-white">
            {t.enterpriseOnly}
          </Badge>
          <p className="text-indigo-800 max-w-md mx-auto">
            {t.upgradeDesc}
          </p>
          
          <div className="bg-white/50 rounded-lg p-6 mt-6">
            <h4 className="font-semibold text-indigo-900 mb-4">{t.slaTargets.title}</h4>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              {(['urgent', 'high', 'normal', 'low'] as const).map((priority) => (
                <Card key={priority} className="bg-white/70">
                  <CardContent className="p-3">
                    <Badge className={getPriorityColor(priority)}>
                      {t[priority]}
                    </Badge>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t.responseTime}:</span>
                        <span className="font-semibold">{t.slaTargets[priority].response}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t.resolutionTime}:</span>
                        <span className="font-semibold">{t.slaTargets[priority].resolution}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-white/50 rounded-lg p-6 mt-4">
            <h4 className="font-semibold text-indigo-900 mb-4">{t.benefits.title}</h4>
            <ul className="text-left space-y-2 max-w-md mx-auto">
              {t.benefits.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-indigo-800">
                  <CheckCircle2 className="size-5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            {language === 'en' ? 'Loading...' : '載入中...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const responsePerf = stats ? getPerformanceLevel(stats.response_sla_percentage) : { label: '', color: '' };
  const resolutionPerf = stats ? getPerformanceLevel(stats.resolution_sla_percentage) : { label: '', color: '' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Clock className="size-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{t.title}</CardTitle>
                <CardDescription className="mt-1">{t.subtitle}</CardDescription>
              </div>
            </div>
            <Badge className="bg-indigo-600">{t.enterpriseOnly}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-700">{t.responseTime}</span>
                <CheckCircle2 className="size-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-900">
                {stats.response_sla_percentage.toFixed(1)}%
              </div>
              <div className={`text-xs mt-1 ${responsePerf.color}`}>
                {responsePerf.label}
              </div>
              <Progress value={stats.response_sla_percentage} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-700">{t.resolutionTime}</span>
                <Target className="size-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {stats.resolution_sla_percentage.toFixed(1)}%
              </div>
              <div className={`text-xs mt-1 ${resolutionPerf.color}`}>
                {resolutionPerf.label}
              </div>
              <Progress value={stats.resolution_sla_percentage} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-700">{t.avgResponse}</span>
                <Zap className="size-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {formatTime(stats.avg_response_time)}
              </div>
              <div className="text-xs text-purple-600 mt-1">
                {stats.response_sla_met} {t.met} / {stats.response_sla_breached} {t.breached}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-orange-700">{t.avgResolution}</span>
                <Activity className="size-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {formatTime(stats.avg_resolution_time)}
              </div>
              <div className="text-xs text-orange-600 mt-1">
                {stats.resolution_sla_met} {t.met} / {stats.resolution_sla_breached} {t.breached}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5" />
              {t.activeTickets}
            </CardTitle>
            <Badge variant="outline">
              {activeTickets.length} {language === 'en' ? 'active' : '活躍'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {activeTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {language === 'en' ? 'No active tickets' : '無活躍工單'}
            </div>
          ) : (
            <div className="space-y-3">
              {activeTickets.map((ticket) => {
                const responseRemaining = calculateTimeRemaining(
                  ticket.created_at,
                  ticket.sla_target_response
                );
                
                return (
                  <Card key={ticket.id} className={`border-2 ${
                    responseRemaining.status === 'critical' ? 'border-red-300 bg-red-50' :
                    responseRemaining.status === 'warning' ? 'border-yellow-300 bg-yellow-50' :
                    'border-green-300 bg-green-50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {t[ticket.priority]}
                            </Badge>
                            <span className="font-semibold text-sm">{ticket.ticket_title}</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {language === 'en' ? 'Created' : '創建於'}: {new Date(ticket.created_at).toLocaleString()}
                          </div>
                        </div>
                        {responseRemaining.status === 'critical' && (
                          <AlertTriangle className="size-5 text-red-600" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">{t.responseTime}</div>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold ${
                              responseRemaining.status === 'critical' ? 'text-red-600' :
                              responseRemaining.status === 'warning' ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {responseRemaining.hours < 0 
                                ? `${t.overdue} ${formatTime(Math.abs(responseRemaining.hours))}`
                                : formatTime(responseRemaining.hours)
                              }
                            </span>
                            <span className="text-xs text-gray-500">
                              / {formatTime(ticket.sla_target_response)}
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(100, (responseRemaining.hours / ticket.sla_target_response) * 100)} 
                            className="mt-1 h-1"
                          />
                        </div>

                        <div>
                          <div className="text-xs text-gray-600 mb-1">{t.resolutionTime}</div>
                          <div className="flex items-center justify-between">
                            <Badge className={getStatusColor(ticket.resolution_status)}>
                              {t[ticket.resolution_status]}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatTime(ticket.sla_target_resolution)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            {t.recentTickets}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {language === 'en' ? 'No metrics yet' : '尚無指標'}
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.slice(0, 10).map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getPriorityColor(metric.priority)}>
                        {t[metric.priority]}
                      </Badge>
                      <span className="text-sm font-medium">{metric.ticket_title}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(metric.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-600">{t.responseTime}</div>
                      <Badge className={getStatusColor(metric.response_status)}>
                        {metric.response_time !== undefined 
                          ? formatTime(metric.response_time)
                          : t.pending
                        }
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600">{t.resolutionTime}</div>
                      <Badge className={getStatusColor(metric.resolution_status)}>
                        {metric.resolution_time !== undefined 
                          ? formatTime(metric.resolution_time)
                          : t.pending
                        }
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}