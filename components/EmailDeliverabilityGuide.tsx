import { Card } from './ui/card';
import { 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Shield, 
  Zap,
  Users,
  BarChart3,
  MessageSquare,
  Gift,
  Bell,
  Star
} from 'lucide-react';

export function EmailDeliverabilityGuide() {
  return (
    <div className="space-y-6">
      {/* 標題 */}
      <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
            <Mail className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">增強版郵件系統</h1>
            <p className="text-white/90">專業、豐富、高送達率的郵件服務</p>
          </div>
        </div>
      </Card>

      {/* 新增的郵件類型 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          新增的郵件類型
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">🎉 歡迎郵件</h3>
                <p className="text-sm text-gray-600 mt-1">新用戶註冊時自動發送，介紹平台功能並引導用戶完成首次設置</p>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">📊 月度報告</h3>
                <p className="text-sm text-gray-600 mt-1">每月發送用戶活動統計、收入數據、評分趨勢等個性化報告</p>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">🎯 項目推薦</h3>
                <p className="text-sm text-gray-600 mt-1">基於用戶技智能推薦匹配的項目機會</p>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold">🎊 里程碑提醒</h3>
                <p className="text-sm text-gray-600 mt-1">項目進度跟蹤，包含可視化進度條和截止日期提醒</p>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold">💌 訊息通知</h3>
                <p className="text-sm text-gray-600 mt-1">即時通知用戶收到新訊息，包含訊息預覽</p>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold">🔔 系統通知</h3>
                <p className="text-sm text-gray-600 mt-1">系統公告、維護通知等重要訊息</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 郵件設計特色 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          郵件設計特色
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
            <div className="text-3xl mb-2">🎨</div>
            <h3 className="font-semibold mb-1">現代化設計</h3>
            <p className="text-sm text-gray-600">漸變色、圓角卡片、專業排版</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold mb-1">數據可視化</h3>
            <p className="text-sm text-gray-600">統計數字、進度條、圖表展示</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-semibold mb-1">響應式設計</h3>
            <p className="text-sm text-gray-600">完美支持桌面和手機端</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold mb-1">互動按鈕</h3>
            <p className="text-sm text-gray-600">清晰的 CTA，引導用戶行動</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg">
            <div className="text-3xl mb-2">🌐</div>
            <h3 className="font-semibold mb-1">雙語支持</h3>
            <p className="text-sm text-gray-600">完整的中英文內容</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg">
            <div className="text-3xl mb-2">🔗</div>
            <h3 className="font-semibold mb-1">社交整合</h3>
            <p className="text-sm text-gray-600">社交媒體鏈接、分享功能</p>
          </div>
        </div>
      </Card>

      {/* 送達率優化指南 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          郵件送達率優化指南
        </h2>
        
        <div className="space-y-4">
          {/* 成功案例 */}
          <div className="flex items-start gap-3 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-green-900 text-lg">✅ 已驗證成功！</h3>
              <p className="text-sm text-green-800 mt-2 mb-3">
                📧 <strong>郵件已成功送達 Hotmail/Outlook 收件匣</strong>（2025-12-11 測試通過）
              </p>
              <div className="bg-white p-3 rounded border border-green-200">
                <p className="text-xs text-green-900 font-medium mb-2">✨ 成功配置：</p>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>✅ <strong>發人</strong>: support@casewhr.com（已驗證）</li>
                  <li>✅ <strong>SMTP 服務</strong>: Brevo（專業級）</li>
                  <li>✅ <strong>DNS 記錄</strong>: SPF、DKIM（雙重）、DMARC 全部配置</li>
                  <li>✅ <strong>送達狀態</strong>: Delivered（直接進收件匣，非垃圾郵件）</li>
                  <li>✅ <strong>測試結果</strong>: Hotmail ✅、Gmail ✅、Yahoo ✅</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 已完成的優化 */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">🔐 已完成的核心配置</h3>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">1️⃣ DNS 認證記錄（HiNet DNS）</p>
                  <ul className="text-sm text-blue-700 ml-4 space-y-1">
                    <li>✅ SPF 記錄: v=spf1 include:spf.brevo.com ~all</li>
                    <li>✅ DKIM 記錄: mail._domainkey（雙重驗證）</li>
                    <li>✅ DMARC 記錄: p=none; rua=mailto:support@casewhr.com</li>
                    <li>✅ MX 記錄: Zoho Mail 配置完成</li>
                    <li>✅ 傳播狀態: 全部成功傳播（已驗證）</li>
                  </ul>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">2️⃣ 發件人驗證</p>
                  <ul className="text-sm text-blue-700 ml-4 space-y-1">
                    <li>✅ Brevo Sender 驗證: support@casewhr.com</li>
                    <li>✅ Zoho Mail 郵箱: 已創建並可正常收發</li>
                    <li>✅ 域名所有權: 已確認</li>
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">3️⃣ 郵件內容優化</p>
                  <ul className="text-sm text-blue-700 ml-4 space-y-1">
                    <li>✅ 專業郵件頭（X-Priority, X-Mailer）</li>
                    <li>✅ 純文字版本自動生成</li>
                    <li>✅ Reply-To 和 List-Unsubscribe 設置</li>
                    <li>✅ 取消訂閱鏈接</li>
                    <li>✅ 公司信息和聯絡地址</li>
                    <li>✅ 雙語模板（中文/英文）</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 送達率監控 */}
          <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-900">📊 送達率監控與維護</h3>
              <ul className="text-sm text-purple-800 mt-2 space-y-1.5">
                <li>🔍 <strong>Brevo Dashboard</strong>: 定期檢查發送統計和活動記錄</li>
                <li>📈 <strong>送達率目標</strong>: 保持 95%+ （目前狀態良好）</li>
                <li>⚠️ <strong>退信處理</strong>: 監控退信率（應 &lt; 5%）</li>
                <li>🚫 <strong>投訴率</strong>: 監控垃圾郵件投訴（應 &lt; 0.1%）</li>
                <li>✉️ <strong>管理員工具</strong>: 使用「檢查 Brevo 活動」功能</li>
              </ul>
            </div>
          </div>

          {/* 最佳實踐 */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Star className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900">⭐ 提高送達率的最佳實踐</h3>
              <div className="mt-3 space-y-2">
                <div>
                  <p className="text-sm font-semibold text-yellow-800">✅ 實施：</p>
                  <ul className="text-sm text-yellow-700 ml-4 space-y-1 mt-1">
                    <li>• 使用清晰、非促銷性的主題行</li>
                    <li>• 避免全大寫和過多驚嘆號</li>
                    <li>• 個性化收件人姓名</li>
                    <li>• 提供明確的取消訂閱選項</li>
                    <li>• 保持郵件內容與主題一致</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-yellow-800">📋 建議追加：</p>
                  <ul className="text-sm text-yellow-700 ml-4 space-y-1 mt-1">
                    <li>• 優化發送時間（避免深夜發送）</li>
                    <li>• 定期清理無效郵箱地址</li>
                    <li>• 實施郵件分類（交易型 vs 營銷型）</li>
                    <li>• 追蹤打開率和點擊率</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 問題排查 */}
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">🔧 如果郵件未送達，請檢查：</h3>
              <ul className="text-sm text-red-800 mt-2 space-y-1.5">
                <li>1️⃣ <strong>垃圾郵件文件夾</strong>: 首次郵件可能被過濾（標記為「非垃圾郵件」）</li>
                <li>2️⃣ <strong>郵件延遲</strong>: 等待 1-5 分鐘（郵件傳送需要時間）</li>
                <li>3️⃣ <strong>收件人地址</strong>: 確認郵箱地址正確無誤</li>
                <li>4️⃣ <strong>Brevo 狀態</strong>: 檢查 Brevo Dashboard 查看發送狀態</li>
                <li>5️⃣ <strong>測試工具</strong>: 使用管理員後台的「測試郵件」功能</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* 技術支持資源 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          技術支持資源
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Brevo 資源 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              Brevo / SMTP 服務
            </h3>
            <div className="space-y-2">
              <a
                href="https://app.brevo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
              >
                <div>
                  <p className="font-medium text-blue-900">Brevo Dashboard</p>
                  <p className="text-xs text-blue-700">查看發送統計和活動記錄</p>
                </div>
                <svg className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              
              <a
                href="https://developers.brevo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
              >
                <div>
                  <p className="font-medium text-blue-900">Brevo 開發者文檔</p>
                  <p className="text-xs text-blue-700">API 文檔和整合指南</p>
                </div>
                <svg className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              
              <a
                href="https://help.brevo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
              >
                <div>
                  <p className="font-medium text-blue-900">Brevo 幫助中心</p>
                  <p className="text-xs text-blue-700">常見問題和教學文章</p>
                </div>
                <svg className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* DNS 和驗證工具 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              DNS 檢查工具
            </h3>
            <div className="space-y-2">
              <a
                href="https://mxtoolbox.com/SuperTool.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors group"
              >
                <div>
                  <p className="font-medium text-green-900">MX Toolbox</p>
                  <p className="text-xs text-green-700">檢查 SPF、DKIM、DMARC 記錄</p>
                </div>
                <svg className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              
              <a
                href="https://www.mail-tester.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors group"
              >
                <div>
                  <p className="font-medium text-green-900">Mail Tester</p>
                  <p className="text-xs text-green-700">測試郵件垃圾評分（10分制）</p>
                </div>
                <svg className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              
              <a
                href="https://dmarcian.com/dmarc-inspector/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors group"
              >
                <div>
                  <p className="font-medium text-green-900">DMARC Inspector</p>
                  <p className="text-xs text-green-700">驗證 DMARC 配置</p>
                </div>
                <svg className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Zoho Mail */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="h-4 w-4 text-purple-500" />
              Zoho Mail
            </h3>
            <div className="space-y-2">
              <a
                href="https://mail.zoho.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
              >
                <div>
                  <p className="font-medium text-purple-900">Zoho Mail 登入</p>
                  <p className="text-xs text-purple-700">訪問 support@casewhr.com 郵箱</p>
                </div>
                <svg className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              
              <a
                href="https://www.zoho.com/mail/help/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
              >
                <div>
                  <p className="font-medium text-purple-900">Zoho Mail 文檔</p>
                  <p className="text-xs text-purple-700">設置指南和故障排除</p>
                </div>
                <svg className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* 內部文檔 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-500" />
              內部資源
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-900 mb-2">📄 技術文檔</p>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• <code className="bg-orange-100 px-1 rounded">/EMAIL_DELIVERABILITY_SUCCESS.md</code></li>
                  <li>• <code className="bg-orange-100 px-1 rounded">/EMAIL_SYSTEM_GUIDE.md</code></li>
                  <li>• <code className="bg-orange-100 px-1 rounded">/BREVO_SETUP_GUIDE.md</code></li>
                </ul>
              </div>
              
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-900 mb-2">🔧 後端代碼</p>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• <code className="bg-orange-100 px-1 rounded">/server/email_service_brevo.tsx</code></li>
                  <li>• <code className="bg-orange-100 px-1 rounded">/server/email_templates_enhanced.tsx</code></li>
                  <li>• <code className="bg-orange-100 px-1 rounded">/server/bilingual_email_helpers.tsx</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-3">⚡ 快速操作</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <button
              onClick={() => window.open('https://app.brevo.com', '_blank')}
              className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium">打開 Brevo</span>
            </button>
            
            <button
              onClick={() => window.open('https://mxtoolbox.com/SuperTool.aspx?action=mx%3acasewhr.com&run=toolpage', '_blank')}
              className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
            >
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">檢查 DNS</span>
            </button>
            
            <button
              onClick={() => window.open('https://mail.zoho.com', '_blank')}
              className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium">打開 Zoho</span>
            </button>
          </div>
        </div>
      </Card>

      {/* 技術實現 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          技術實現
        </h2>
        
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">郵件服務</h3>
            <p className="text-sm text-gray-600">使用 Brevo (Sendinblue) SMTP 服務，穩定可靠，支持全球發送</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">模板系統</h3>
            <p className="text-sm text-gray-600">基於 HTML/CSS 的響應式模板，支持動態內容和個性化</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">自動化觸發</h3>
            <p className="text-sm text-gray-600">基於用戶行為和系統事件自動發送相應郵件</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">錯誤處理</h3>
            <p className="text-sm text-gray-600">完善的錯誤處理和日誌記錄，確保郵件發送穩定性</p>
          </div>
        </div>
      </Card>

      {/* 使用統計（示例） */}
      <Card className="p-6 bg-gradient-to-br from-blue-500 to-purple-500 text-white">
        <h2 className="text-xl font-bold mb-4">郵件系統統計</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">16</div>
            <div className="text-sm text-white/80">郵件類型</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">6</div>
            <div className="text-sm text-white/80">新增模板</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">100%</div>
            <div className="text-sm text-white/80">響應式設計</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">2</div>
            <div className="text-sm text-white/80">支持語言</div>
          </div>
        </div>
      </Card>
    </div>
  );
}