import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { CheckCircle2, ExternalLink, AlertCircle, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';

export function FacebookOAuthGuide() {
  const [copiedUrl, setCopiedUrl] = React.useState(false);
  const callbackUrl = 'https://bihplitfentxioxyjalb.supabase.co/auth/v1/callback';

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 回調網址卡片 */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">🎯 您的 Facebook OAuth 授權回調網址</CardTitle>
          <CardDescription className="text-blue-700">
            請將此網址添加到 Facebook App 的 OAuth 設定中
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
            <code className="text-sm font-mono break-all">{callbackUrl}</code>
          </div>
          <Button
            onClick={copyCallbackUrl}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {copiedUrl ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                已複製！
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                複製回調網址
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 重要提醒 */}
      <Alert className="border-yellow-300 bg-yellow-50">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <p className="font-semibold mb-2">⚠️ 常見錯誤：設置位置錯誤</p>
          <p className="mb-2">❌ <strong>不要</strong>在「設定 → 高級」中設置（無法保存！）</p>
          <p>✅ <strong>正確位置</strong>：「產品 → Facebook 登入 → 設定」</p>
        </AlertDescription>
      </Alert>

      {/* 步驟 1: 基本設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="destructive">必須先做</Badge>
            步驟 1: 完成 Facebook App 基本設定
          </CardTitle>
          <CardDescription>
            如果不先完成這步，OAuth 回調網址將無法保存
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">前往 Facebook App 設定</p>
                <p className="text-sm text-gray-600">左側選單 → 「設定」→ 「基本」</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">填寫必要資訊</p>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">隱私權政策網址：</p>
                    <code className="text-blue-600">https://casewhr.com/privacy</code>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">服務條款網址：</p>
                    <code className="text-blue-600">https://casewhr.com/terms</code>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">應用程式網域（每行一個）：</p>
                    <code className="text-blue-600">casewhr.com</code><br />
                    <code className="text-blue-600">supabase.co</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">保存變更</p>
                <p className="text-sm text-gray-600">向下滾動，點擊「儲存變更」按鈕</p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open('https://developers.facebook.com/apps', '_blank')}
          >
            前往 Facebook Developers
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* 步驟 2: OAuth 設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className="bg-blue-600">關鍵步驟</Badge>
            步驟 2: 設置 OAuth 回調網址
          </CardTitle>
          <CardDescription>
            在正確的位置設置回調網址
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium">確保已添加 Facebook 登入產品</p>
                <p className="text-sm text-gray-600">左側選單 → 「產品」→ 找到「Facebook 登入」</p>
                <p className="text-sm text-gray-600">如果沒有，點擊「新增產品」添加</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">進入正確的設定頁面</p>
                <div className="mt-2 bg-blue-50 border-2 border-blue-300 p-3 rounded">
                  <p className="text-sm font-semibold text-blue-900">✅ 正確位置：</p>
                  <p className="text-sm text-blue-800">左側選單 → 「產品」→ 「Facebook 登入」→ 「設定」</p>
                </div>
                <div className="mt-2 bg-red-50 border-2 border-red-300 p-3 rounded">
                  <p className="text-sm font-semibold text-red-900">❌ 錯誤位置（不要去）：</p>
                  <p className="text-sm text-red-800">設定 → 高級</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">找到「有效的 OAuth 重新導向 URI」欄位</p>
                <p className="text-sm text-gray-600">向下滾動到「用戶端 OAuth 設定」區塊</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div className="flex-1">
                <p className="font-medium">貼上回調網址</p>
                <div className="mt-2 bg-white p-3 rounded border-2 border-blue-200">
                  <code className="text-sm font-mono break-all">{callbackUrl}</code>
                </div>
                <Button
                  onClick={copyCallbackUrl}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="mr-2 h-3 w-3" />
                      已複製
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-3 w-3" />
                      複製
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                5
              </div>
              <div className="flex-1">
                <p className="font-medium">保存變更</p>
                <p className="text-sm text-gray-600">向下滾動，點擊「儲存變更」</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                ✓
              </div>
              <div className="flex-1">
                <p className="font-medium">驗證保存成功</p>
                <p className="text-sm text-gray-600">重新整理頁面，確認網址仍然存在</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 步驟 3: 獲取憑證 */}
      <Card>
        <CardHeader>
          <CardTitle>步驟 3: 獲取 App ID 和 App Secret</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">前往基本設定</p>
              <p className="text-sm text-gray-600">左側選單 → 「設定」→ 「基本」</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">複製應用程式編號（App ID）</p>
              <p className="text-sm text-gray-600">第一個欄位的數字</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">複製應用程式密鑰（App Secret）</p>
              <p className="text-sm text-gray-600">點擊「顯示」按鈕，輸入密碼後複製</p>
              <Alert className="mt-2 border-red-300 bg-red-50">
                <AlertDescription className="text-red-800 text-sm">
                  🔒 App Secret 是機密資訊，絕對不要公開或提交到 Git！
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 步驟 4: Supabase 配置 */}
      <Card>
        <CardHeader>
          <CardTitle>步驟 4: 在 Supabase 配置 Facebook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">前往 Supabase Authentication Providers</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open('https://supabase.com/dashboard/project/bihplitfentxioxyjalb/auth/providers', '_blank')}
                >
                  直接前往
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">找到並展開 Facebook</p>
                <p className="text-sm text-gray-600">點擊 Facebook 那一行展開詳細設定</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">啟用並輸入憑證</p>
                <div className="mt-2 space-y-2 text-sm">
                  <p>• 切換「Facebook enabled」為 ON</p>
                  <p>• Facebook Client ID：貼上您的 App ID</p>
                  <p>• Facebook Client Secret：貼上您的 App Secret</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">保存設定</p>
                <p className="text-sm text-gray-600">向下滾動，點擊「Save」</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 常見問題 */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-900">🐛 常見問題快速修復</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-yellow-900">❌ "URL Blocked: This redirect failed"</p>
            <p className="text-yellow-800">→ 確認回調網址已正確添加到 Facebook App</p>
            <p className="text-yellow-800">→ 等待 5-10 分鐘讓配置生效</p>
          </div>

          <div>
            <p className="font-semibold text-yellow-900">❌ "App Not Set Up"</p>
            <p className="text-yellow-800">→ 將應用切換為「上線」模式</p>
            <p className="text-yellow-800">→ 或添加測試用戶（角色 → 測試使用者）</p>
          </div>

          <div>
            <p className="font-semibold text-yellow-900">❌ 無法保存 OAuth 回調</p>
            <p className="text-yellow-800">→ 確保已先完成步驟 1 的基本設定</p>
            <p className="text-yellow-800">→ 確認在正確位置設置（產品 → Facebook 登入 → 設定）</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
