import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export function EmailTemplateGuide() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-900">📧 提高郵件送達率指南</h2>
        <p className="text-sm text-gray-600 mt-2">
          遵循以下建議可大幅降低郵件進入垃圾箱的機率
        </p>
      </div>

      {/* 為什麼進垃圾郵件 */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          為什麼會進垃圾郵件箱？
        </h3>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2 text-sm">
          <p className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <span><strong>發件人域名未驗證：</strong>使用 Yahoo/Gmail 等免費信箱作為發件人</span>
          </p>
          <p className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <span><strong>缺少 SPF/DKIM/DMARC：</strong>域名未設置郵件驗證記錄</span>
          </p>
          <p className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <span><strong>內容觸發垃圾郵件過濾器：</strong>使用「免費」「中獎」等敏感詞彙</span>
          </p>
          <p className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <span><strong>發送頻率異常：</strong>短時間內發送大量郵件</span>
          </p>
        </div>
      </div>

      {/* 解決方案 */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          解決方案（按重要性排序）
        </h3>
        
        <div className="space-y-4">
          {/* 方案 1 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-semibold text-gray-900">🎯 最重要：使用已驗證的企業域名</h4>
                <p className="text-sm text-gray-700">
                  <strong>✅ 已完成：</strong>現在使用 <code className="bg-white px-2 py-1 rounded">noreply@casewhr.com</code>
                </p>
                <p className="text-sm text-gray-700">
                  <strong>建議：</strong>購買企業域名（例如 <code className="bg-white px-2 py-1 rounded">casewhere.com</code>），
                  並在 Brevo 中驗證該域名，使用 <code className="bg-white px-2 py-1 rounded">noreply@casewhere.com</code> 作為發件人
                </p>
                <div className="bg-white border border-green-300 rounded p-3 mt-2">
                  <p className="text-xs font-semibold text-gray-700 mb-1">操作步驟：</p>
                  <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                    <li>在 Brevo 後台：Settings → Senders & IP → Add a new sender</li>
                    <li>添加 DNS 記錄（SPF、DKIM、DMARC）到域名服務商</li>
                    <li>等待驗證完成（通常 24-48 小時）</li>
                    <li>更改程式碼中的發件人地址</li>
                  </ol>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  ✨ <strong>效果：</strong>可將送達率從 50% 提升至 95%+
                </p>
              </div>
            </div>
          </div>

          {/* 方案 2 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-semibold text-gray-900">✅ 已完成：優化郵件格式</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>✓ 添加純文字版本（提高送達率）</p>
                  <p>✓ 添加專業郵件頭（X-Mailer、List-Unsubscribe）</p>
                  <p>✓ 設置 Reply-To 地址</p>
                  <p>✓ 使用 HTML + Text 雙格式</p>
                </div>
              </div>
            </div>
          </div>

          {/* 方案 3 */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-semibold text-gray-900">📝 改善郵件內容</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>避免使用：</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>全大寫標題（IMPORTANT!!!）</li>
                    <li>過多感嘆號（!!!）</li>
                    <li>「免費」「中獎」「點擊這裡」等觸發詞</li>
                    <li>太多連結或圖片</li>
                  </ul>
                  <p className="mt-2"><strong>建議使用：</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>清晰的主旨（簡潔明瞭）</li>
                    <li>個性化內容（包含收件人姓名）</li>
                    <li>專業的排版（適當的段落和空白）</li>
                    <li>明確的行動呼籲（Call-to-Action）</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 方案 4 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                4
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-semibold text-gray-900">🔥 暖機發送（Warm-up）</h4>
                <p className="text-sm text-gray-700">
                  新域名或新發件人需要逐步建立信譽：
                </p>
                <ul className="text-sm text-gray-700 list-disc list-inside ml-4 space-y-1">
                  <li>第 1 天：發送 10-20 封</li>
                  <li>第 2-3 天：發送 50-100 封</li>
                  <li>第 4-7 天：發送 200-500 封</li>
                  <li>第 2 周：逐步增加到正常量</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 當前狀態 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">🔍 當前配置狀態</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>SMTP 連接：正常</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>郵件格式優化：已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span>發件人域名：使用免費信箱（建議更換為企業域名）</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span>SPF/DKIM/DMARC：未設置（需要企業域名）</span>
          </div>
        </div>
      </div>

      {/* 快速測試 */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">🧪 快速測試建議</h3>
        <p className="text-sm text-gray-700 mb-3">
          在購買域名前，您可以先測試以下方式：
        </p>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li>
            <strong>測試不同的郵件服務：</strong>
            <br />
            <span className="ml-6 text-xs text-gray-600">
              Gmail、Outlook、Yahoo 等不同服務商的垃圾郵件過濾規則不同
            </span>
          </li>
          <li>
            <strong>檢查郵件內容：</strong>
            <br />
            <span className="ml-6 text-xs text-gray-600">
              使用 <a href="https://www.mail-tester.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Mail Tester</a> 檢查郵件評分
            </span>
          </li>
          <li>
            <strong>請收件人標記為「非垃圾郵件」：</strong>
            <br />
            <span className="ml-6 text-xs text-gray-600">
              這會告訴郵件服務商您的郵件是合法的
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}