import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useView } from '../contexts/ViewContext';
import { 
  Shield, 
  Clock, 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  ArrowLeft,
  FileText,
  Users,
  Target,
  Award,
  Calendar,
  BarChart3,
  Bell,
  HeartHandshake
} from 'lucide-react';

interface SLADocumentationProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function SLADocumentation({ language = 'en' }: SLADocumentationProps) {
  const { setView } = useView();
  const [selectedTab, setSelectedTab] = useState('overview');

  const translations = {
    en: {
      title: 'Service Level Agreement (SLA)',
      subtitle: 'Our commitment to reliable, high-quality service',
      backToDashboard: 'Back to Dashboard',
      overview: 'Overview',
      responseTime: 'Response Time',
      uptime: 'Uptime Guarantee',
      support: 'Support Levels',
      compensation: 'Compensation Policy',
      monitoring: 'Monitoring & Reporting',
      
      // Overview
      overviewTitle: 'SLA Overview',
      overviewIntro: 'Our Service Level Agreement defines the standards of service you can expect from Case Where. We are committed to maintaining the highest levels of availability, performance, and support.',
      ourCommitment: 'Our Commitment',
      commitmentItems: [
        '99.9% uptime guarantee for all paid plans',
        'Fast response times based on priority level',
        'Transparent incident reporting and communication',
        'Proactive monitoring and maintenance',
        'Fair compensation for service disruptions'
      ],
      
      // Response Time
      responseTimeTitle: 'Response Time Standards',
      responseTimeIntro: 'We guarantee the following maximum response times based on issue priority and your subscription plan:',
      priority: 'Priority',
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      criticalDesc: 'Platform down, major functionality broken, security breach',
      highDesc: 'Core features impaired, significant performance degradation',
      mediumDesc: 'Partial functionality affected, workaround available',
      lowDesc: 'Minor issues, cosmetic bugs, feature requests',
      
      // Plan levels
      free: 'Free',
      basic: 'Basic',
      professional: 'Professional',
      enterprise: 'Enterprise',
      
      // Uptime
      uptimeTitle: 'Uptime Guarantee',
      uptimeIntro: 'We commit to maintaining high availability across all our services:',
      monthlyUptime: 'Monthly Uptime Commitment',
      plannedMaintenance: 'Planned Maintenance',
      maintenanceDesc: 'Scheduled maintenance is announced 72 hours in advance and does not count against uptime SLA',
      excludedDowntime: 'Excluded Downtime',
      excludedItems: [
        'DDoS attacks and other malicious activities',
        'Third-party service failures (payment processors, OAuth providers)',
        'Force majeure events',
        'Client-side issues or misconfigurations',
        'Scheduled maintenance windows'
      ],
      
      // Support Levels
      supportTitle: 'Support Levels by Plan',
      supportIntro: 'Different subscription tiers receive different levels of support:',
      channels: 'Support Channels',
      features: 'Features',
      emailSupport: 'Email Support',
      chatSupport: 'Live Chat Support',
      phoneSupport: 'Phone Support',
      dedicatedManager: 'Dedicated Account Manager',
      prioritySupport: 'Priority Support Queue',
      customOnboarding: 'Custom Onboarding',
      slackChannel: 'Dedicated Slack Channel',
      
      businessHours: 'Business Hours',
      businessHoursTime: '9:00 AM - 6:00 PM (Taiwan Time, GMT+8)',
      weekdaysOnly: 'Weekdays Only',
      extendedHours: 'Extended Hours',
      extendedHoursTime: '7:00 AM - 10:00 PM (Taiwan Time)',
      fullTime: '24/7/365',
      fullTimeDesc: 'Around-the-clock support',
      
      // Compensation
      compensationTitle: 'Service Credit Policy',
      compensationIntro: 'If we fail to meet our uptime commitments, you are eligible for service credits:',
      uptimeLevel: 'Monthly Uptime',
      serviceCredit: 'Service Credit',
      howToClaim: 'How to Claim Credits',
      claimSteps: [
        'Submit a support ticket within 30 days of the incident',
        'Provide details of the service disruption',
        'Our team will verify the claim within 5 business days',
        'Credits are applied to your next billing cycle',
        'Maximum credit per month: 100% of monthly subscription fee'
      ],
      
      // Monitoring
      monitoringTitle: 'Monitoring & Transparency',
      monitoringIntro: 'We maintain comprehensive monitoring and reporting systems to ensure service quality:',
      realTimeMonitoring: 'Real-time Monitoring',
      monitoringItems: [
        'Server health and performance metrics',
        'API response times and error rates',
        'Database performance and query optimization',
        'Network latency and bandwidth usage',
        'Security threat detection'
      ],
      statusPage: 'Status Page',
      statusPageDesc: 'Check real-time system status at status.casewhr.com',
      incidentReports: 'Incident Reports',
      incidentReportDesc: 'Detailed post-mortem reports for all major incidents',
      monthlyReports: 'Monthly Performance Reports',
      monthlyReportDesc: 'Enterprise customers receive detailed monthly SLA compliance reports',
      
      // Contact
      needHelp: 'Need Help?',
      contactSupport: 'Contact our support team for any questions about our SLA',
      emailUs: 'Email us at',
      supportEmail: 'support@casewhr.com',
      
      // Table headers
      plan: 'Plan',
      included: 'Included',
      notIncluded: 'Not Included',
      yes: 'Yes',
      no: 'No',
    },
    zh: {
      title: '服務等級協議 (SLA)',
      subtitle: '我們對可靠、高品質服務的承諾',
      backToDashboard: '返回儀表板',
      overview: '概覽',
      responseTime: '響應時間',
      uptime: '正常運行保證',
      support: '支援等級',
      compensation: '補償政策',
      monitoring: '監控與報告',
      
      // Overview
      overviewTitle: 'SLA 概覽',
      overviewIntro: '我們的服務等級協議定義了您可以期待的 Case Where 服務標準。我們致力於維持最高水準的可用性、性能和支援。',
      ourCommitment: '我們的承諾',
      commitmentItems: [
        '所有付費方案保證 99.9% 正常運行時間',
        '基於優先級的快速響應時間',
        '透明的事件報告和溝通',
        '主動監控和維護',
        '服務中斷的公平補償'
      ],
      
      // Response Time
      responseTimeTitle: '響應時間標準',
      responseTimeIntro: '我們保證以下基於問題優先級和您的訂閱方案的最大響應時間：',
      priority: '優先級',
      critical: '緊急',
      high: '高',
      medium: '中',
      low: '低',
      criticalDesc: '平台停機、主要功能損壞、安全漏洞',
      highDesc: '核心功能受損、顯著性能下降',
      mediumDesc: '部分功能受影響、有替代方案',
      lowDesc: '小問題、外觀錯誤、功能請求',
      
      // Plan levels
      free: '免費版',
      basic: '基礎版',
      professional: '專業版',
      enterprise: '企業版',
      
      // Uptime
      uptimeTitle: '正常運行時間保證',
      uptimeIntro: '我們承諾在所有服務中維持高可用性：',
      monthlyUptime: '每月正常運行時間承諾',
      plannedMaintenance: '計劃維護',
      maintenanceDesc: '計劃維護會提前 72 小時通知，不計入正常運行時間 SLA',
      excludedDowntime: '排除的停機時間',
      excludedItems: [
        'DDoS 攻擊和其他惡意活動',
        '第三方服務故障（支付處理商、OAuth 提供商）',
        '不可抗力事件',
        '客戶端問題或配置錯誤',
        '計劃維護窗口'
      ],
      
      // Support Levels
      supportTitle: '各方案支援等級',
      supportIntro: '不同的訂閱級別獲得不同級別的支援：',
      channels: '支援管道',
      features: '功能',
      emailSupport: '電子郵件支援',
      chatSupport: '即時聊天支援',
      phoneSupport: '電話支援',
      dedicatedManager: '專屬客戶經理',
      prioritySupport: '優先支援隊列',
      customOnboarding: '客製化引導',
      slackChannel: '專屬 Slack 頻道',
      
      businessHours: '營業時間',
      businessHoursTime: '上午 9:00 - 下午 6:00（台灣時間，GMT+8）',
      weekdaysOnly: '僅工作日',
      extendedHours: '延長時間',
      extendedHoursTime: '上午 7:00 - 晚上 10:00（台灣時間）',
      fullTime: '全天候',
      fullTimeDesc: '24/7/365 支援',
      
      // Compensation
      compensationTitle: '服務抵免政策',
      compensationIntro: '如果我們未能達到正常運行時間承諾，您有資格獲得服務抵免：',
      uptimeLevel: '每月正常運行時間',
      serviceCredit: '服務抵免',
      howToClaim: '如何申請抵免',
      claimSteps: [
        '在事件發生後 30 天內提交支援工單',
        '提供服務中斷的詳細信息',
        '我們的團隊將在 5 個工作日內驗證申請',
        '抵免將應用於您的下一個計費週期',
        '每月最高抵免額：月訂閱費的 100%'
      ],
      
      // Monitoring
      monitoringTitle: '監控與透明度',
      monitoringIntro: '我們維護全面的監控和報告系統以確保服務品質：',
      realTimeMonitoring: '即時監控',
      monitoringItems: [
        '伺服器健康狀況和性能指標',
        'API 響應時間和錯誤率',
        '資料庫性能和查詢優化',
        '網路延遲和頻寬使用',
        '安全威脅檢測'
      ],
      statusPage: '狀態頁面',
      statusPageDesc: '在 status.casewhr.com 查看即時系統狀態',
      incidentReports: '事件報告',
      incidentReportDesc: '所有重大事件的詳細事後分析報告',
      monthlyReports: '月度性能報告',
      monthlyReportDesc: '企業客戶會收到詳細的月度 SLA 合規報告',
      
      // Contact
      needHelp: '需要幫助？',
      contactSupport: '聯繫我們的支援團隊以了解有關我們 SLA 的任何問題',
      emailUs: '發送郵件至',
      supportEmail: 'support@casewhr.com',
      
      // Table headers
      plan: '方案',
      included: '包含',
      notIncluded: '不包含',
      yes: '是',
      no: '否',
    },
    'zh-TW': {
      title: '服務等級協議 (SLA)',
      subtitle: '我們對可靠、高品質服務的承諾',
      backToDashboard: '返回儀表板',
      overview: '概覽',
      responseTime: '響應時間',
      uptime: '正常運行保證',
      support: '支援等級',
      compensation: '補償政策',
      monitoring: '監控與報告',
      
      overviewTitle: 'SLA 概覽',
      overviewIntro: '我們的服務等級協議定義了您可以期待的 Case Where 服務標準。我們致力於維持最高水準的可用性、性能和支援。',
      ourCommitment: '我們的承諾',
      commitmentItems: [
        '所有付費方案保證 99.9% 正常運行時間',
        '基於優先級的快速響應時間',
        '透明的事件報告和溝通',
        '主動監控和維護',
        '服務中斷的公平補償'
      ],
      
      responseTimeTitle: '響應時間標準',
      responseTimeIntro: '我們保證以下基於問題優先級和您的訂閱方案的最大響應時間：',
      priority: '優先級',
      critical: '緊急',
      high: '高',
      medium: '中',
      low: '低',
      criticalDesc: '平台停機、主要功能損壞、安全漏洞',
      highDesc: '核心功能受損、顯著性能下降',
      mediumDesc: '部分功能受影響、有替代方案',
      lowDesc: '小問題、外觀錯誤、功能請求',
      
      free: '免費版',
      basic: '基礎版',
      professional: '專業版',
      enterprise: '企業版',
      
      uptimeTitle: '正常運行時間保證',
      uptimeIntro: '我們承諾在所有服務中維持高可用性：',
      monthlyUptime: '每月正常運行時間承諾',
      plannedMaintenance: '計劃維護',
      maintenanceDesc: '計劃維護會提前 72 小時通知，不計入正常運行時間 SLA',
      excludedDowntime: '排除的停機時間',
      excludedItems: [
        'DDoS 攻擊和其他惡意活動',
        '第三方服務故障（支付處理商、OAuth 提供商）',
        '不可抗力事件',
        '客戶端問題或配置錯誤',
        '計劃維護窗口'
      ],
      
      supportTitle: '各方案支援等級',
      supportIntro: '不同的訂閱級別獲得不同級別的支援：',
      channels: '支援管道',
      features: '功能',
      emailSupport: '電子郵件支援',
      chatSupport: '即時聊天支援',
      phoneSupport: '電話支援',
      dedicatedManager: '專屬客戶經理',
      prioritySupport: '優先支援隊列',
      customOnboarding: '客製化引導',
      slackChannel: '專屬 Slack 頻道',
      
      businessHours: '營業時間',
      businessHoursTime: '上午 9:00 - 下午 6:00（台灣時間，GMT+8）',
      weekdaysOnly: '僅工作日',
      extendedHours: '延長時間',
      extendedHoursTime: '上午 7:00 - 晚上 10:00（台灣時間）',
      fullTime: '全天候',
      fullTimeDesc: '24/7/365 支援',
      
      compensationTitle: '服務抵免政策',
      compensationIntro: '如果我們未能達到正常運行時間承諾，您有資格獲得服務抵免：',
      uptimeLevel: '每月正常運行時間',
      serviceCredit: '服務抵免',
      howToClaim: '如何申請抵免',
      claimSteps: [
        '在事件發生後 30 天內提交支援工單',
        '提供服務中斷的詳細信息',
        '我們的團隊將在 5 個工作日內驗證申請',
        '抵免將應用於您的下一個計費週期',
        '每月最高抵免額：月訂閱費的 100%'
      ],
      
      monitoringTitle: '監控與透明度',
      monitoringIntro: '我們維護全面的監控和報告系統以確保服務品質：',
      realTimeMonitoring: '即時監控',
      monitoringItems: [
        '伺服器健康狀況和性能指標',
        'API 響應時間和錯誤率',
        '資料庫性能和查詢優化',
        '網路延遲和頻寬使用',
        '安全威脅檢測'
      ],
      statusPage: '狀態頁面',
      statusPageDesc: '在 status.casewhr.com 查看即時系統狀態',
      incidentReports: '事件報告',
      incidentReportDesc: '所有重大事件的詳細事後分析報告',
      monthlyReports: '月度性能報告',
      monthlyReportDesc: '企業客戶會收到詳細的月度 SLA 合規報告',
      
      needHelp: '需要幫助？',
      contactSupport: '聯繫我們的支援團隊以了解有關我們 SLA 的任何問題',
      emailUs: '發送郵件至',
      supportEmail: 'support@casewhr.com',
      
      plan: '方案',
      included: '包含',
      notIncluded: '不包含',
      yes: '是',
      no: '否',
    },
    'zh-CN': {
      title: '服务等级协议 (SLA)',
      subtitle: '我们对可靠、高品质服务的承诺',
      backToDashboard: '返回仪表板',
      overview: '概览',
      responseTime: '响应时间',
      uptime: '正常运行保证',
      support: '支持等级',
      compensation: '补偿政策',
      monitoring: '监控与报告',
      
      overviewTitle: 'SLA 概览',
      overviewIntro: '我们的服务等级协议定义了您可以期待的 Case Where 服务标准。我们致力于维持最高水准的可用性、性能和支持。',
      ourCommitment: '我们的承诺',
      commitmentItems: [
        '所有付费方案保证 99.9% 正常运行时间',
        '基于优先级的快速响应时间',
        '透明的事件报告和沟通',
        '主动监控和维护',
        '服务中断的公平补偿'
      ],
      
      responseTimeTitle: '响应时间标准',
      responseTimeIntro: '我们保证以下基于问题优先级和您的订阅方案的最大响应时间：',
      priority: '优先级',
      critical: '紧急',
      high: '高',
      medium: '中',
      low: '低',
      criticalDesc: '平台停机、主要功能损坏、安全漏洞',
      highDesc: '核心功能受损、显著性能下降',
      mediumDesc: '部分功能受影响、有替代方案',
      lowDesc: '小问题、外观错误、功能请求',
      
      free: '免费版',
      basic: '基础版',
      professional: '专业版',
      enterprise: '企业版',
      
      uptimeTitle: '正常运行时间保证',
      uptimeIntro: '我们承诺在所有服务中维持高可用性：',
      monthlyUptime: '每月正常运行时间承诺',
      plannedMaintenance: '计划维护',
      maintenanceDesc: '计划维护会提前 72 小时通知，不计入正常运行时间 SLA',
      excludedDowntime: '排除的停机时间',
      excludedItems: [
        'DDoS 攻击和其他恶意活动',
        '第三方服务故障（支付处理商、OAuth 提供商）',
        '不可抗力事件',
        '客户端问题或配置错误',
        '计划维护窗口'
      ],
      
      supportTitle: '各方案支持等级',
      supportIntro: '不同的订阅级别获得不同级别的支持：',
      channels: '支持渠道',
      features: '功能',
      emailSupport: '电子邮件支持',
      chatSupport: '即时聊天支持',
      phoneSupport: '电话支持',
      dedicatedManager: '专属客户经理',
      prioritySupport: '优先支持队列',
      customOnboarding: '定制化引导',
      slackChannel: '专属 Slack 频道',
      
      businessHours: '营业时间',
      businessHoursTime: '上午 9:00 - 下午 6:00（台湾时间，GMT+8）',
      weekdaysOnly: '仅工作日',
      extendedHours: '延长时间',
      extendedHoursTime: '上午 7:00 - 晚上 10:00（台湾时间）',
      fullTime: '全天候',
      fullTimeDesc: '24/7/365 支持',
      
      compensationTitle: '服务抵免政策',
      compensationIntro: '如果我们未能达到正常运行时间承诺，您有资格获得服务抵免：',
      uptimeLevel: '每月正常运行时间',
      serviceCredit: '服务抵免',
      howToClaim: '如何申请抵免',
      claimSteps: [
        '在事件发生后 30 天内提交支持工单',
        '提供服务中断的详细信息',
        '我们的团队将在 5 个工作日内验证申请',
        '抵免将应用于您的下一个计费周期',
        '每月最高抵免额：月订阅费的 100%'
      ],
      
      monitoringTitle: '监控与透明度',
      monitoringIntro: '我们维护全面的监控和报告系统以确保服务品质：',
      realTimeMonitoring: '实时监控',
      monitoringItems: [
        '服务器健康状况和性能指标',
        'API 响应时间和错误率',
        '数据库性能和查询优化',
        '网络延迟和带宽使用',
        '安全威胁检测'
      ],
      statusPage: '状态页面',
      statusPageDesc: '在 status.casewhr.com 查看实时系统状态',
      incidentReports: '事件报告',
      incidentReportDesc: '所有重大事件的详细事后分析报告',
      monthlyReports: '月度性能报告',
      monthlyReportDesc: '企业客户会收到详细的月度 SLA 合规报告',
      
      needHelp: '需要帮助？',
      contactSupport: '联系我们的支持团队以了解有关我们 SLA 的任何问题',
      emailUs: '发送邮件至',
      supportEmail: 'support@casewhr.com',
      
      plan: '方案',
      included: '包含',
      notIncluded: '不包含',
      yes: '是',
      no: '否',
    }
  };

  const t = translations[language] || translations.en;

  // Response Time Matrix
  const responseTimeMatrix = [
    {
      priority: t.critical,
      description: t.criticalDesc,
      free: 'N/A',
      basic: '4 hours',
      professional: '2 hours',
      enterprise: '30 min',
      icon: <AlertCircle className="size-5 text-red-600" />
    },
    {
      priority: t.high,
      description: t.highDesc,
      free: 'N/A',
      basic: '24 hours',
      professional: '8 hours',
      enterprise: '2 hours',
      icon: <Zap className="size-5 text-orange-600" />
    },
    {
      priority: t.medium,
      description: t.mediumDesc,
      free: 'N/A',
      basic: '48 hours',
      professional: '24 hours',
      enterprise: '8 hours',
      icon: <Clock className="size-5 text-yellow-600" />
    },
    {
      priority: t.low,
      description: t.lowDesc,
      free: 'Best effort',
      basic: '5 days',
      professional: '3 days',
      enterprise: '24 hours',
      icon: <Target className="size-5 text-blue-600" />
    }
  ];

  // Uptime Tiers
  const uptimeTiers = [
    { level: '≥ 99.9%', credit: '0%', color: 'text-green-600' },
    { level: '99.0% - 99.8%', credit: '10%', color: 'text-yellow-600' },
    { level: '95.0% - 98.9%', credit: '25%', color: 'text-orange-600' },
    { level: '< 95.0%', credit: '100%', color: 'text-red-600' }
  ];

  // Support Features Matrix
  const supportFeatures = [
    { feature: t.emailSupport, free: true, basic: true, professional: true, enterprise: true },
    { feature: t.chatSupport, free: false, basic: true, professional: true, enterprise: true },
    { feature: t.phoneSupport, free: false, basic: false, professional: true, enterprise: true },
    { feature: t.prioritySupport, free: false, basic: false, professional: true, enterprise: true },
    { feature: t.dedicatedManager, free: false, basic: false, professional: false, enterprise: true },
    { feature: t.customOnboarding, free: false, basic: false, professional: false, enterprise: true },
    { feature: t.slackChannel, free: false, basic: false, professional: false, enterprise: true }
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="outline" 
        onClick={() => setView('dashboard')}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="size-4" />
        {t.backToDashboard}
      </Button>

      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Shield className="size-8 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-3xl">{t.title}</CardTitle>
              <CardDescription className="mt-2 text-base">{t.subtitle}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{t.overview}</TabsTrigger>
          <TabsTrigger value="response">{t.responseTime}</TabsTrigger>
          <TabsTrigger value="uptime">{t.uptime}</TabsTrigger>
          <TabsTrigger value="support">{t.support}</TabsTrigger>
          <TabsTrigger value="compensation">{t.compensation}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-indigo-600" />
                {t.overviewTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{t.overviewIntro}</p>
              
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                  <HeartHandshake className="size-5" />
                  {t.ourCommitment}
                </h4>
                <ul className="space-y-2">
                  {t.commitmentItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="size-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <TrendingUp className="size-8 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-green-700">99.9%</div>
                    <div className="text-sm text-gray-600 mt-1">{t.uptime}</div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <Zap className="size-8 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-blue-700">30 min</div>
                    <div className="text-sm text-gray-600 mt-1">{t.responseTime}</div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-200 bg-purple-50">
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <Users className="size-8 text-purple-600" />
                    </div>
                    <div className="text-3xl font-bold text-purple-700">24/7</div>
                    <div className="text-sm text-gray-600 mt-1">{t.support}</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Monitoring Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5 text-blue-600" />
                {t.monitoringTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{t.monitoringIntro}</p>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Bell className="size-4" />
                    {t.realTimeMonitoring}
                  </h4>
                  <ul className="space-y-1 ml-6">
                    {t.monitoringItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-blue-600 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="font-semibold text-blue-900 text-sm mb-1">{t.statusPage}</div>
                    <div className="text-xs text-gray-600">{t.statusPageDesc}</div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="font-semibold text-purple-900 text-sm mb-1">{t.incidentReports}</div>
                    <div className="text-xs text-gray-600">{t.incidentReportDesc}</div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="font-semibold text-green-900 text-sm mb-1">{t.monthlyReports}</div>
                    <div className="text-xs text-gray-600">{t.monthlyReportDesc}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Response Time Tab */}
        <TabsContent value="response" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5 text-orange-600" />
                {t.responseTimeTitle}
              </CardTitle>
              <CardDescription>{t.responseTimeIntro}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left p-3 font-semibold">{t.priority}</th>
                      <th className="text-left p-3 font-semibold">{t.free}</th>
                      <th className="text-left p-3 font-semibold">{t.basic}</th>
                      <th className="text-left p-3 font-semibold">{t.professional}</th>
                      <th className="text-left p-3 font-semibold">{t.enterprise}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responseTimeMatrix.map((row, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-start gap-2">
                            {row.icon}
                            <div>
                              <div className="font-semibold">{row.priority}</div>
                              <div className="text-xs text-gray-600">{row.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">{row.free}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="bg-blue-50">{row.basic}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="bg-purple-50">{row.professional}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">{row.enterprise}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <strong>{t.businessHours}:</strong> {t.businessHoursTime}
                    <br />
                    {language === 'en' 
                      ? 'Response times are measured during business hours. Enterprise customers receive 24/7 support.' 
                      : '響應時間在營業時間內測量。企業客戶享有 24/7 支援。'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Uptime Tab */}
        <TabsContent value="uptime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-green-600" />
                {t.uptimeTitle}
              </CardTitle>
              <CardDescription>{t.uptimeIntro}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 text-center">
                <div className="text-6xl font-bold text-green-700 mb-2">99.9%</div>
                <div className="text-lg text-gray-700">{t.monthlyUptime}</div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="size-5 text-blue-600" />
                  {t.plannedMaintenance}
                </h4>
                <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-3">
                  {t.maintenanceDesc}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="size-5 text-orange-600" />
                  {t.excludedDowntime}
                </h4>
                <ul className="space-y-2">
                  {t.excludedItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-orange-600 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-purple-600" />
                {t.supportTitle}
              </CardTitle>
              <CardDescription>{t.supportIntro}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left p-3 font-semibold">{t.features}</th>
                      <th className="text-center p-3 font-semibold">{t.free}</th>
                      <th className="text-center p-3 font-semibold">{t.basic}</th>
                      <th className="text-center p-3 font-semibold">{t.professional}</th>
                      <th className="text-center p-3 font-semibold">{t.enterprise}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportFeatures.map((feature, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3 font-medium">{feature.feature}</td>
                        <td className="p-3 text-center">
                          {feature.free ? (
                            <CheckCircle2 className="size-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {feature.basic ? (
                            <CheckCircle2 className="size-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {feature.professional ? (
                            <CheckCircle2 className="size-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {feature.enterprise ? (
                            <CheckCircle2 className="size-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="font-semibold text-gray-900 mb-2">{t.free}/{t.basic}</div>
                  <div className="text-sm text-gray-600 mb-1">{t.businessHours}</div>
                  <div className="text-xs text-gray-500">{t.businessHoursTime}</div>
                  <Badge variant="outline" className="mt-2">{t.weekdaysOnly}</Badge>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="font-semibold text-purple-900 mb-2">{t.professional}</div>
                  <div className="text-sm text-gray-600 mb-1">{t.extendedHours}</div>
                  <div className="text-xs text-gray-500">{t.extendedHoursTime}</div>
                  <Badge className="mt-2 bg-purple-600">7 days/week</Badge>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg p-4">
                  <div className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                    <Award className="size-4" />
                    {t.enterprise}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{t.fullTime}</div>
                  <div className="text-xs text-gray-500">{t.fullTimeDesc}</div>
                  <Badge className="mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">24/7/365</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compensation Tab */}
        <TabsContent value="compensation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="size-5 text-yellow-600" />
                {t.compensationTitle}
              </CardTitle>
              <CardDescription>{t.compensationIntro}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left p-3 font-semibold">{t.uptimeLevel}</th>
                      <th className="text-left p-3 font-semibold">{t.serviceCredit}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uptimeTiers.map((tier, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3">
                          <Badge variant="outline" className={tier.color}>
                            {tier.level}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className={`font-semibold ${tier.color}`}>{tier.credit}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">{t.howToClaim}</h4>
                <ol className="space-y-2">
                  {t.claimSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                      <div className="flex-shrink-0 size-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="mt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    {language === 'en' 
                      ? 'Service credits are the sole remedy for SLA breaches. Credits cannot be refunded or exchanged for cash.'
                      : '服務抵免是 SLA 違約的唯一補償方式。抵免不能退款或兌換現金。'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contact Card */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{t.needHelp}</h3>
              <p className="text-sm text-gray-600">{t.contactSupport}</p>
            </div>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              {t.emailUs} {t.supportEmail}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
