import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, Shield, Zap, Clock, CreditCard, AlertCircle } from 'lucide-react';

export function SubscriptionGuarantee() {
  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-600" />
            訂閱權益保障說明
          </CardTitle>
          <CardDescription>
            完整的訂閱流程和權益保障機制
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 訂閱流程 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              🎯 訂閱流程說明
            </h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">步驟 1：選擇方案</h4>
                <p className="text-sm text-gray-700">
                  在定價頁面選擇 Pro 或 Enterprise 方案，並選擇計費週期（月付/年付）
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">步驟 2：自動選擇付款方式</h4>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li><strong>月付</strong> → 自動切換到 <strong>ECPay（綠界）</strong> - 台灣本地信用卡</li>
                  <li><strong>年付</strong> → 自動切換到 <strong>PayPal</strong> - 國際訂閱服務</li>
                  <li>您也可以選擇使用 <strong>錢包餘額</strong> 直接付款（如果餘額足夠）</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">步驟 3：完成付款</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>ECPay 付款：</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    <li>跳轉到綠界安全付款頁面</li>
                    <li>輸入信用卡資訊完成首次扣款</li>
                    <li>系統自動儲存信用卡資訊用於自動續訂</li>
                  </ul>
                  
                  <p className="mt-3"><strong>PayPal 付款：</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    <li>跳轉到 PayPal 授權頁面</li>
                    <li>登入 PayPal 帳號並授權訂閱</li>
                    <li>PayPal 會自動處理未來的續訂扣款</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  步驟 4：✅ 立即生效
                </h4>
                <p className="text-sm text-green-800 font-semibold">
                  付款成功後，您的訂閱權益<strong>立即生效</strong>，無需等待！
                </p>
              </div>
            </div>
          </div>

          {/* 權益保障 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              🛡️ 權益保障機制
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-white p-3 rounded">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">即時激活</p>
                  <p className="text-sm text-gray-600">
                    付款完成後，系統會立即創建您的訂閱記錄並激活方案權益
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-white p-3 rounded">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">手續費優惠立即生效</p>
                  <p className="text-sm text-gray-600">
                    Pro 方案 10% 手續費、Enterprise 方案 5% 手續費，從訂閱生效時刻起計算
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-white p-3 rounded">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">功能權限即時開通</p>
                  <p className="text-sm text-gray-600">
                    Enterprise 方案的團隊管理、自訂 Logo 等進階功能立即可用
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-white p-3 rounded">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">自動續訂保護</p>
                  <p className="text-sm text-gray-600">
                    系統會在到期前自動續訂，確保您的服務不中斷
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 技術實現 */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              ⚙️ 技術保障細節
            </h3>
            <div className="space-y-4 text-sm">
              <div className="bg-white p-4 rounded">
                <h4 className="font-medium text-purple-800 mb-2">1️⃣ 付款確認機制</h4>
                <ul className="space-y-1 text-gray-700 list-disc list-inside">
                  <li><strong>ECPay：</strong>使用 CheckMacValue 驗證確保付款真實有效</li>
                  <li><strong>PayPal：</strong>通過 PayPal API 驗證訂閱狀態為 ACTIVE</li>
                  <li>只有在付款完全確認後才會激活訂閱</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded">
                <h4 className="font-medium text-purple-800 mb-2">2️⃣ 訂閱記錄創建流程</h4>
                <div className="space-y-2 text-gray-700">
                  <p><strong>系統會記錄：</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    <li>用戶 ID 和訂閱方案（Pro/Enterprise）</li>
                    <li>付款方式（ECPay/PayPal/錢包）</li>
                    <li>計費週期（月付/年付）</li>
                    <li>訂閱金額和貨幣</li>
                    <li>開始日期和下次扣款日期</li>
                    <li>自動續訂狀態</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded">
                <h4 className="font-medium text-purple-800 mb-2">3️⃣ 年付特殊處理</h4>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded mt-2">
                  <p className="text-gray-700">
                    <strong>✅ 已修復：</strong>系統會根據 PayPal Plan ID 自動識別計費週期
                  </p>
                  <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600 text-xs">
                    <li>Pro 年付 (P-8R6038908D0666614NF364XA) → 下次扣款：1年後</li>
                    <li>Enterprise 年付 (P-5PG7025386205482MNF367HI) → 下次扣款：1年後</li>
                    <li>系統會正確設置 billing_cycle = 'yearly' 和對應金額</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded">
                <h4 className="font-medium text-purple-800 mb-2">4️⃣ Webhook 即時同步</h4>
                <p className="text-gray-700">
                  PayPal 會在訂閱狀態變更時發送 Webhook 通知，系統會：
                </p>
                <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
                  <li>BILLING.SUBSCRIPTION.ACTIVATED → 激活訂閱權益</li>
                  <li>PAYMENT.SALE.COMPLETED → 記錄續訂付款</li>
                  <li>BILLING.SUBSCRIPTION.CANCELLED → 更新訂閱狀態</li>
                  <li>所有事件都會儲存在系統中供查詢</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 年付優勢 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              💰 年付方案優勢
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded">
                <h4 className="font-semibold text-blue-600 mb-2">Pro 方案</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>月付：$15 USD/月</p>
                  <p className="font-semibold text-green-600">年付：$150 USD/年</p>
                  <p className="text-xs text-gray-500">→ 平均每月 $12.5（省 20%）</p>
                  <p className="text-xs text-green-600 mt-2">💰 一年省下 $30 USD</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded">
                <h4 className="font-semibold text-purple-600 mb-2">Enterprise 方案</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>月付：$45 USD/月</p>
                  <p className="font-semibold text-green-600">年付：$450 USD/年</p>
                  <p className="text-xs text-gray-500">→ 平均每月 $37.5（省 20%）</p>
                  <p className="text-xs text-green-600 mt-2">💰 一年省下 $90 USD</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 bg-green-100 border border-green-300 rounded p-3">
              <p className="text-sm text-green-800 font-medium">
                ✅ 年付用戶額外享有：
              </p>
              <ul className="mt-2 text-xs text-green-700 space-y-1 list-disc list-inside">
                <li>一次付款，全年無憂</li>
                <li>不用擔心每月扣款</li>
                <li>更優惠的價格（相當於打 8 折）</li>
                <li>透過 PayPal 國際平台，安全有保障</li>
              </ul>
            </div>
          </div>

          {/* 常見問題 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              ❓ 常見問題
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Q: 付款後多久生效？</h4>
                <p className="text-sm text-gray-600">
                  A: <strong>立即生效</strong>。付款成功後，系統會在 1-3 秒內激活您的訂閱權益。
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Q: 年付如何計算下次扣款日期？</h4>
                <p className="text-sm text-gray-600">
                  A: 系統會自動設置為 <strong>1 年後</strong>。例如：2026/1/26 訂閱 → 2027/1/26 續訂。
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Q: 可以隨時取消嗎？</h4>
                <p className="text-sm text-gray-600">
                  A: <strong>可以</strong>。您可以在 Dashboard → 訂閱管理 中隨時取消自動續訂。已付費用不退款，但服務會持續到到期日。
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Q: 年付中途可以升級嗎？</h4>
                <p className="text-sm text-gray-600">
                  A: <strong>可以</strong>。從 Pro 升級到 Enterprise 時，系統會計算剩餘價值並抵扣升級費用。
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Q: 如果付款失敗怎麼辦？</h4>
                <p className="text-sm text-gray-600">
                  A: 系統會發送郵件通知您，並在 3 天後自動重試。連續失敗 3 次後會暫停服務。
                </p>
              </div>
            </div>
          </div>

          {/* 技術支援 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💬 需要幫助？</h4>
            <p className="text-sm text-blue-800">
              如果您在訂閱過程中遇到任何問題，請聯繫我們的技術支援：
            </p>
            <p className="text-sm text-blue-600 mt-2">
              📧 Email: support@casewhr.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SubscriptionGuarantee;
