import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { EmailSetupWizard } from './EmailSetupWizard';
import { DnsConfigChecker } from './DnsConfigChecker';
import { EmailDeliveryHelp } from './EmailDeliveryHelp';
import { Settings, CheckCircle, HelpCircle, Zap } from 'lucide-react';

interface EmailConfigDashboardProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function EmailConfigDashboard({ language = 'zh' }: EmailConfigDashboardProps) {
  const [activeTab, setActiveTab] = useState('wizard');

  const content = {
    zh: {
      title: '📧 郵件系統配置中心',
      subtitle: '一站式管理所有郵件配置和診斷工具',
      tabs: {
        wizard: '配置嚮導',
        checker: 'DNS 檢查',
        help: '用戶幫助',
        quickStart: '快速開始',
      },
      quickStart: {
        title: '🚀 快速開始指南',
        intro: '選擇適合您的配置方式：',
        options: [
          {
            title: '方案 A：完整配置（推薦）',
            description: '配置 SPF、DKIM 和自定義域名，獲得最佳郵件送達率',
            benefits: [
              '✅ 郵件送達率提升至 90%+',
              '✅ 大幅減少進入垃圾郵件箱的機率',
              '✅ 提升品牌專業度',
              '✅ 支持所有郵件服務商',
            ],
            estimatedTime: '預計時間：30-60 分鐘',
            buttonText: '開始配置',
            action: 'wizard',
          },
          {
            title: '方案 B：用戶端解決（臨時方案）',
            description: '指導用戶檢查垃圾郵件文件夾，適合快速解決當前問題',
            benefits: [
              '⚡ 立即可用，無需配置',
              '✅ 幫助 Hotmail/Outlook 用戶接收郵件',
              '✅ 提供詳細的操作指南',
              '⚠️ 治標不治本，建議後續升級到方案 A',
            ],
            estimatedTime: '預計時間：5 分鐘',
            buttonText: '查看幫助組件',
            action: 'help',
          },
        ],
        currentStatus: {
          title: '📊 當前郵件系統狀態',
          items: [
            {
              label: '發件人地址',
              value: 'support@casewhr.com',
              status: 'success',
              note: '✅ 已使用企業域名',
            },
            {
              label: 'SPF 記錄',
              value: '未配置',
              status: 'error',
              note: '需要配置以提高送達率',
            },
            {
              label: 'DKIM 記錄',
              value: '未配置',
              status: 'error',
              note: '需要配置以防止郵件被標記為垃圾',
            },
            {
              label: 'DMARC 記錄',
              value: '未配置',
              status: 'warning',
              note: '可選但推薦配置',
            },
            {
              label: 'CNAME 衝突檢查',
              value: '未檢查',
              status: 'warning',
              note: '⚠️ 重要：根據 RFC 1912，CNAME 不能與 TXT 記錄共存',
            },
            {
              label: 'Outlook/Hotmail 送達率',
              value: '約 70%',
              status: 'warning',
              note: '配置後可提升至 90%+',
            },
          ],
        },
      },
    },
    en: {
      title: '📧 Email System Configuration Center',
      subtitle: 'One-stop management for all email configuration and diagnostic tools',
      tabs: {
        wizard: 'Setup Wizard',
        checker: 'DNS Checker',
        help: 'User Help',
        quickStart: 'Quick Start',
      },
      quickStart: {
        title: '🚀 Quick Start Guide',
        intro: 'Choose the configuration method that suits you:',
        options: [
          {
            title: 'Option A: Complete Setup (Recommended)',
            description: 'Configure SPF, DKIM, and custom domain for best email delivery',
            benefits: [
              '✅ Email delivery rate improved to 90%+',
              '✅ Significantly reduce spam folder placement',
              '✅ Enhance brand professionalism',
              '✅ Support all email providers',
            ],
            estimatedTime: 'Estimated Time: 30-60 minutes',
            buttonText: 'Start Setup',
            action: 'wizard',
          },
          {
            title: 'Option B: User-Side Solution (Temporary)',
            description: 'Guide users to check spam folder, quick fix for current issues',
            benefits: [
              '⚡ Available immediately, no configuration needed',
              '✅ Help Hotmail/Outlook users receive emails',
              '✅ Provide detailed instructions',
              '⚠️ Temporary solution, recommend upgrading to Option A later',
            ],
            estimatedTime: 'Estimated Time: 5 minutes',
            buttonText: 'View Help Component',
            action: 'help',
          },
        ],
        currentStatus: {
          title: '📊 Current Email System Status',
          items: [
            {
              label: 'Sender Address',
              value: 'support@casewhr.com',
              status: 'success',
              note: '✅ Using corporate domain',
            },
            {
              label: 'SPF Record',
              value: 'Not Configured',
              status: 'error',
              note: 'Required for better delivery rate',
            },
            {
              label: 'DKIM Record',
              value: 'Not Configured',
              status: 'error',
              note: 'Required to prevent spam marking',
            },
            {
              label: 'DMARC Record',
              value: 'Not Configured',
              status: 'warning',
              note: 'Optional but recommended',
            },
            {
              label: 'CNAME Conflict Check',
              value: 'Not Checked',
              status: 'warning',
              note: '⚠️ Important: According to RFC 1912, CNAME cannot coexist with TXT records',
            },
            {
              label: 'Outlook/Hotmail Delivery',
              value: 'Approx. 70%',
              status: 'warning',
              note: 'Can improve to 90%+ after configuration',
            },
          ],
        },
      },
    },
  };

  const t = content[language];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <HelpCircle className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <Settings className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-gray-900">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="quickStart" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {t.tabs.quickStart}
            </TabsTrigger>
            <TabsTrigger value="wizard" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t.tabs.wizard}
            </TabsTrigger>
            <TabsTrigger value="checker" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {t.tabs.checker}
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              {t.tabs.help}
            </TabsTrigger>
          </TabsList>

          {/* Quick Start Tab */}
          <TabsContent value="quickStart" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h2 className="text-gray-900 mb-6">{t.quickStart.title}</h2>
              <p className="text-gray-600 mb-6">{t.quickStart.intro}</p>

              {/* Options */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {t.quickStart.options.map((option, index) => (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-all cursor-pointer"
                    onClick={() => setActiveTab(option.action)}
                  >
                    <h3 className="text-gray-900 mb-3">{option.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                    <div className="space-y-2 mb-4">
                      {option.benefits.map((benefit, i) => (
                        <p key={i} className="text-sm text-gray-700">{benefit}</p>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mb-4">{option.estimatedTime}</p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      {option.buttonText}
                    </button>
                  </div>
                ))}
              </div>

              {/* Current Status */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-gray-900 mb-4">{t.quickStart.currentStatus.title}</h3>
                <div className="space-y-3">
                  {t.quickStart.currentStatus.items.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-4 border rounded-lg ${getStatusColor(item.status)}`}
                    >
                      {getStatusIcon(item.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{item.label}</span>
                          <span className="text-sm font-mono">{item.value}</span>
                        </div>
                        <p className="text-xs opacity-75">{item.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Setup Wizard Tab */}
          <TabsContent value="wizard">
            <EmailSetupWizard language={language} />
          </TabsContent>

          {/* DNS Checker Tab */}
          <TabsContent value="checker">
            <DnsConfigChecker domain="casewhr.com" language={language} />
          </TabsContent>

          {/* User Help Tab */}
          <TabsContent value="help" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h2 className="text-gray-900 mb-4">
                {language === 'zh' ? '用戶郵件幫助組件預覽' : 'User Email Help Component Preview'}
              </h2>
              <p className="text-gray-600 mb-6">
                {language === 'zh'
                  ? '此組件會在用戶提交提案後自動顯示（針對 Hotmail/Outlook 用戶）'
                  : 'This component will automatically display after users submit proposals (for Hotmail/Outlook users)'}
              </p>

              {/* Demo for Hotmail user */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-gray-800 mb-3">
                    {language === 'zh' ? '示例：Hotmail 用戶' : 'Example: Hotmail User'}
                  </h3>
                  <EmailDeliveryHelp userEmail="user@hotmail.com" language={language} />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <h4 className="text-blue-900 mb-2">
                    {language === 'zh' ? '💡 集成說明' : '💡 Integration Instructions'}
                  </h4>
                  <p className="text-sm text-blue-800">
                    {language === 'zh'
                      ? '此組件已集成到 ProposalDialog 中。當 Hotmail/Outlook 用戶提交提案後，會自動顯示提示，引導他們檢查垃圾郵件文件夾。'
                      : 'This component is integrated into ProposalDialog. When Hotmail/Outlook users submit proposals, it will automatically show a reminder to check their spam folder.'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}