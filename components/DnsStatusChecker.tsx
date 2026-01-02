import React, { useState } from 'react';
import { Button } from './ui/button';
import { CheckCircle, XCircle, AlertTriangle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';

export function DnsStatusChecker() {
  const [checking, setChecking] = useState(false);
  const domain = 'casewhr.com';

  const checkNow = () => {
    setChecking(true);
    // 打開多個檢查工具
    setTimeout(() => {
      window.open(`https://mxtoolbox.com/SuperTool.aspx?action=mx:${domain}`, '_blank');
      window.open(`https://mxtoolbox.com/spf.aspx`, '_blank');
      window.open(`https://mxtoolbox.com/dkim.aspx`, '_blank');
      window.open(`https://www.mail-tester.com`, '_blank');
      setChecking(false);
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-gray-900">🔍 DNS 配置狀態檢查</h1>
        <p className="text-gray-600">檢查 {domain} 的 SPF、DKIM、DMARC 配置</p>
      </div>

      {/* Quick Check Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-8">
        <h2 className="text-blue-900 mb-4">📋 快速檢查工具</h2>
        <p className="text-blue-700 mb-6">
          點擊下方按鈕，我會為您打開多個專業檢查工具，請逐一查看結果
        </p>
        <Button
          onClick={checkNow}
          disabled={checking}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
        >
          {checking ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              正在打開檢查工具...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              開始全面檢查
            </>
          )}
        </Button>
      </div>

      {/* Manual Check Instructions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <h2 className="text-gray-900">🔧 手動檢查步驟</h2>

        {/* Step 1: CNAME Check */}
        <div className="border-l-4 border-amber-500 pl-4 py-2 bg-amber-50">
          <h3 className="text-amber-900 mb-2">Step 1: 檢查 CNAME 衝突</h3>
          <p className="text-sm text-amber-700 mb-3">
            確認根域名沒有 CNAME 記錄（根據 RFC 1912 規定）
          </p>
          <div className="bg-white border border-amber-200 rounded p-3">
            <p className="text-xs text-gray-500 mb-2">在 Windows 命令提示符執行：</p>
            <code className="block bg-gray-900 text-green-400 p-2 rounded text-sm font-mono">
              nslookup -type=CNAME casewhr.com
            </code>
          </div>
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-green-700">✅ 正確結果：「找不到」或「Non-existent domain」</p>
            <p className="text-red-700">❌ 錯誤結果：顯示 CNAME 記錄</p>
          </div>
          <a
            href="https://mxtoolbox.com/SuperTool.aspx?action=cname%3acasewhr.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
            使用 MX Toolbox 在線檢查 CNAME
          </a>
        </div>

        {/* Step 2: SPF Check */}
        <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
          <h3 className="text-blue-900 mb-2">Step 2: 檢查 SPF 記錄</h3>
          <p className="text-sm text-blue-700 mb-3">
            驗證 SPF 記錄是否正確配置
          </p>
          <div className="bg-white border border-blue-200 rounded p-3">
            <p className="text-xs text-gray-500 mb-2">在命令提示符執行：</p>
            <code className="block bg-gray-900 text-green-400 p-2 rounded text-sm font-mono">
              nslookup -type=TXT casewhr.com
            </code>
          </div>
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-gray-700 mb-2">期望結果：</p>
            <code className="block bg-gray-100 p-2 rounded text-xs">
              v=spf1 include:spf.brevo.com ~all
            </code>
          </div>
          <a
            href="https://mxtoolbox.com/spf.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
            使用 MX Toolbox 檢查 SPF（輸入 casewhr.com）
          </a>
        </div>

        {/* Step 3: DKIM Check */}
        <div className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50">
          <h3 className="text-purple-900 mb-2">Step 3: 檢查 DKIM 記錄</h3>
          <p className="text-sm text-purple-700 mb-3">
            驗證 DKIM 記錄是否正確配置
          </p>
          <div className="bg-white border border-purple-200 rounded p-3">
            <p className="text-xs text-gray-500 mb-2">在命令提示符執行：</p>
            <code className="block bg-gray-900 text-green-400 p-2 rounded text-sm font-mono">
              nslookup -type=TXT mail._domainkey.casewhr.com
            </code>
          </div>
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-gray-700 mb-2">期望結果：</p>
            <code className="block bg-gray-100 p-2 rounded text-xs break-all">
              v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...（很長的字符串）
            </code>
          </div>
          <a
            href="https://mxtoolbox.com/dkim.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-sm text-purple-600 hover:text-purple-700"
          >
            <ExternalLink className="w-4 h-4" />
            使用 MX Toolbox 檢查 DKIM（Selector: mail, Domain: casewhr.com）
          </a>
        </div>

        {/* Step 4: DMARC Check */}
        <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50">
          <h3 className="text-green-900 mb-2">Step 4: 檢查 DMARC 記錄（可選）</h3>
          <p className="text-sm text-green-700 mb-3">
            驗證 DMARC 記錄是否配置
          </p>
          <div className="bg-white border border-green-200 rounded p-3">
            <p className="text-xs text-gray-500 mb-2">在命令提示符執行：</p>
            <code className="block bg-gray-900 text-green-400 p-2 rounded text-sm font-mono">
              nslookup -type=TXT _dmarc.casewhr.com
            </code>
          </div>
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-gray-700 mb-2">期望結果：</p>
            <code className="block bg-gray-100 p-2 rounded text-xs">
              v=DMARC1; p=none; rua=mailto:dmarc@casewhr.com
            </code>
          </div>
          <a
            href="https://mxtoolbox.com/dmarc.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-sm text-green-600 hover:text-green-700"
          >
            <ExternalLink className="w-4 h-4" />
            使用 MX Toolbox 檢查 DMARC（輸入 casewhr.com）
          </a>
        </div>
      </div>

      {/* Brevo Dashboard Check */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-purple-900 mb-4">🔑 Brevo Dashboard 檢查</h2>
        <p className="text-purple-700 mb-4">
          請登錄 Brevo 確認以下狀態：
        </p>
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 bg-white border border-purple-200 rounded p-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-6 h-6 border-2 border-purple-400 rounded"></div>
            </div>
            <div>
              <p className="text-sm text-gray-900">Domain Status: <span className="text-green-600">✅ Verified</span></p>
              <p className="text-xs text-gray-600">域名應該顯示為已驗證</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white border border-purple-200 rounded p-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-6 h-6 border-2 border-purple-400 rounded"></div>
            </div>
            <div>
              <p className="text-sm text-gray-900">SPF Status: <span className="text-green-600">✅ Valid</span></p>
              <p className="text-xs text-gray-600">SPF 記錄應該顯示為有效</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white border border-purple-200 rounded p-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-6 h-6 border-2 border-purple-400 rounded"></div>
            </div>
            <div>
              <p className="text-sm text-gray-900">DKIM Status: <span className="text-green-600">✅ Valid</span></p>
              <p className="text-xs text-gray-600">DKIM 記錄應該顯示為有效</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white border border-purple-200 rounded p-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-6 h-6 border-2 border-purple-400 rounded"></div>
            </div>
            <div>
              <p className="text-sm text-gray-900">Sender: <span className="text-gray-700">noreply@casewhr.com</span></p>
              <p className="text-xs text-gray-600">發件人應該已驗證</p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
          onClick={() => window.open('https://app.brevo.com/settings/sender', '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          打開 Brevo Dashboard
        </Button>
      </div>

      {/* Mail Tester */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
        <h2 className="text-orange-900 mb-4">🧪 Mail Tester 完整測試</h2>
        <p className="text-orange-700 mb-4">
          使用 Mail Tester 進行完整的郵件評分測試（目標：8/10 或更高）
        </p>
        <ol className="space-y-2 text-sm text-orange-800 mb-6">
          <li>1. 點擊下方按鈕打開 Mail Tester</li>
          <li>2. 複製測試郵件地址（例如：test-abc123@mail-tester.com）</li>
          <li>3. 從您的系統發送測試郵件到該地址</li>
          <li>4. 返回 Mail Tester，點擊「Then check your score」</li>
          <li>5. 查看評分和詳細建議</li>
        </ol>
        <Button
          variant="outline"
          className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
          onClick={() => window.open('https://www.mail-tester.com', '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          打開 Mail Tester
        </Button>
      </div>

      {/* Results Interpretation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-gray-900 mb-4">📊 結果判讀</h2>
        
        <div className="space-y-4">
          <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50">
            <h3 className="text-green-900 flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              ✅ 配置成功的標誌
            </h3>
            <ul className="space-y-1 text-sm text-green-700">
              <li>• CNAME 查詢結果：找不到（沒有衝突）</li>
              <li>• SPF 記錄：顯示 v=spf1 include:spf.brevo.com ~all</li>
              <li>• DKIM 記錄：顯示 v=DKIM1; k=rsa; p=...</li>
              <li>• Brevo 所有狀態都是 ✅ Verified/Valid</li>
              <li>• Mail Tester 評分：8/10 或更高</li>
            </ul>
          </div>

          <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50">
            <h3 className="text-red-900 flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5" />
              ❌ 需要修正的問題
            </h3>
            <ul className="space-y-1 text-sm text-red-700">
              <li>• CNAME 查詢顯示有記錄 → 有衝突，需要解決</li>
              <li>• SPF/DKIM 查詢找不到記錄 → DNS 未配置或未生效</li>
              <li>• Brevo 顯示 Not Found/Invalid → 需要重新驗證</li>
              <li>• Mail Tester 評分低於 8 → 檢查詳細建議</li>
            </ul>
          </div>

          <div className="border-l-4 border-amber-500 pl-4 py-2 bg-amber-50">
            <h3 className="text-amber-900 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              ⏰ DNS 傳播時間
            </h3>
            <p className="text-sm text-amber-700">
              如果剛配置完成，DNS 記錄可能需要 10-30 分鐘（最多 48 小時）才能全球生效。
              請稍後再檢查。
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-blue-900 mb-4">🎯 檢查完成後</h2>
        <p className="text-blue-700 mb-4">
          請將檢查結果告訴我，包括：
        </p>
        <ul className="space-y-2 text-sm text-blue-800 mb-6">
          <li>✅ 是否找到 CNAME 記錄？</li>
          <li>✅ SPF 記錄是否顯示正確？</li>
          <li>✅ DKIM 記錄是否顯示正確？</li>
          <li>✅ Brevo Dashboard 狀態如何？</li>
          <li>✅ Mail Tester 評分是多少？</li>
        </ul>
        <p className="text-blue-700">
          如果所有檢查都通過，我會立即幫您更新系統代碼，將發件人改為 noreply@casewhr.com！
        </p>
      </div>
    </div>
  );
}
