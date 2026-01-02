import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { EnhancedEmailTester } from './EnhancedEmailTester';
import { EmailDeliverabilityGuide } from './EmailDeliverabilityGuide';
import { DmarcConfigHelper } from './DmarcConfigHelper';
import { HinetDmarcGuide } from './HinetDmarcGuide';
import { BrevoHinetDmarcGuide } from './BrevoHinetDmarcGuide';
import { HinetDnsChecker } from './HinetDnsChecker';
import { CloudflareEmailDnsGuide } from './CloudflareEmailDnsGuide';
import { EmailSenderConfig } from './EmailSenderConfig';
import { ZohoMailSetupGuide } from './ZohoMailSetupGuide';
import { AdminEmailNextSteps } from './AdminEmailNextSteps';
import { Card } from './ui/card';
import { Mail, BookOpen, TestTube, Settings, Workflow, Shield, Search, Cloud, Users, Inbox } from 'lucide-react';

export function EmailManagementPage() {
  const [activeTab, setActiveTab] = useState('guide');

  // 監聽標籤切換事件
  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };
    window.addEventListener('switchEmailTab', handleSwitchTab as EventListener);
    return () => {
      window.removeEventListener('switchEmailTab', handleSwitchTab as EventListener);
    };
  }, []);

  const navigateToIntegration = () => {
    window.location.hash = 'email-integration';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  郵件管理中心
                </h1>
                <p className="text-gray-600">管理和測試 Case Where 的郵件服務</p>
              </div>
            </div>
            
            {/* 郵件整合按鈕 */}
            <button
              onClick={navigateToIntegration}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md"
            >
              <Workflow size={18} />
              <span>郵件整合與自動化</span>
            </button>
          </div>
        </div>

        {/* 標籤頁 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 h-auto p-1 bg-white shadow-md">
            <TabsTrigger 
              value="guide" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white py-3"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">功能介紹</span>
            </TabsTrigger>
            <TabsTrigger 
              value="senders" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white py-3"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">發件人管理</span>
            </TabsTrigger>
            <TabsTrigger 
              value="dns-check" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white py-3"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">DNS 檢查</span>
            </TabsTrigger>
            <TabsTrigger 
              value="dmarc" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white py-3"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">DMARC 配置</span>
            </TabsTrigger>
            <TabsTrigger 
              value="test" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white py-3"
            >
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">測試郵件</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white py-3"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">郵件設置</span>
            </TabsTrigger>
          </TabsList>

          {/* 功能介紹 */}
          <TabsContent value="guide" className="space-y-6">
            <EmailDeliverabilityGuide />
          </TabsContent>

          {/* 發件人管理 */}
          <TabsContent value="senders" className="space-y-6">
            {/* admin@casewhr.com 下一步指南 */}
            <AdminEmailNextSteps />
            
            {/* 原有的發件人配置 */}
            <EmailSenderConfig />
          </TabsContent>

          {/* DNS 檢查 */}
          <TabsContent value="dns-check" className="space-y-6">
            <HinetDnsChecker />
            <CloudflareEmailDnsGuide />
          </TabsContent>

          {/* DMARC 配置 */}
          <TabsContent value="dmarc" className="space-y-6">
            <BrevoHinetDmarcGuide />
          </TabsContent>

          {/* 測試郵件 */}
          <TabsContent value="test" className="space-y-6">
            <EnhancedEmailTester />
            
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">郵件預覽</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-dashed rounded-lg text-center text-gray-500">
                  <p className="mb-2">選擇郵件類型並發送測試郵件</p>
                  <p className="text-sm">郵件將顯示在您的收件箱中</p>
                </div>
                <div className="p-4 border-2 border-dashed rounded-lg text-center text-gray-500">
                  <p className="mb-2">查看郵件設計和內容</p>
                  <p className="text-sm">確保所有元素正確顯示</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 郵件設置 */}
          <TabsContent value="settings" className="space-y-6">
            {/* Zoho Mail 設定指南 */}
            <ZohoMailSetupGuide />
            
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">郵件服務配置</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900">Brevo SMTP 服務</h3>
                      <p className="text-sm text-green-800 mt-1">已配置並正常運行</p>
                      <div className="mt-2 text-xs text-green-700 space-y-1">
                        <p>• 主：smtp-relay.brevo.com</p>
                        <p>• 端口：587 (STARTTLS)</p>
                        <p>• 發件人：support@casewhr.com</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">郵件發送策略</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span>歡迎郵件</span>
                      <span className="text-green-600 font-semibold">自動發送</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span>項目通知</span>
                      <span className="text-green-600 font-semibold">自動發送</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span>月度報告</span>
                      <span className="text-yellow-600 font-semibold">定時任務</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span>項目推薦</span>
                      <span className="text-yellow-600 font-semibold">智能推送</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">郵件模板配置</h3>
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-purple-800">
                    <div className="p-2 bg-white rounded">✅ 響應式設計</div>
                    <div className="p-2 bg-white rounded">✅ 雙語支持</div>
                    <div className="p-2 bg-white rounded">✅ 品牌色彩</div>
                    <div className="p-2 bg-white rounded">✅ 互動按鈕</div>
                    <div className="p-2 bg-white rounded">✅ 社交鏈接</div>
                    <div className="p-2 bg-white rounded">✅ 取消訂閱</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">送達率優化建議</h2>
              
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50">
                  <h3 className="font-semibold text-yellow-900">🔸 短期化</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    使用企業域名可以顯著提升郵件送達率和品牌信任度。建議購買並配置 casewhere.com 域名。
                  </p>
                </div>

                <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                  <h3 className="font-semibold text-blue-900">🔸 中期優化</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    設置 SPF、DKIM 和 DMARC 記錄，確保郵件驗證通過，減少被標記為垃圾郵件的機率。
                  </p>
                </div>

                <div className="p-3 border-l-4 border-green-500 bg-green-50">
                  <h3 className="font-semibold text-green-900">🔸 長期優化</h3>
                  <p className="text-sm text-green-800 mt-1">
                    監控郵件打開率、點擊率和退訂率，持續優化郵件內容和發送策略。
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default EmailManagementPage;