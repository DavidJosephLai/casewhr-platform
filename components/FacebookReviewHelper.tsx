import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';

export function FacebookReviewHelper() {
  return (
    <div className="space-y-6">
      {/* 標題 */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">
            📋 Facebook App Review 快速指南
          </CardTitle>
          <CardDescription className="text-blue-700">
            關於「審核人員操作檢查」的完整說明
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 重要說明 */}
      <Alert className="border-yellow-300 bg-yellow-50">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <p className="font-semibold mb-2">⚠️ 關於「審核人員操作檢查」</p>
          <p className="text-sm mb-2">
            這表示 Facebook 需要您提供審核資料（測試帳號、螢幕錄影、測試說明）才能開始審核您的應用。
          </p>
          <p className="text-sm">
            <strong>這不是錯誤</strong>，是正常的 App Review 流程。
          </p>
        </AlertDescription>
      </Alert>

      {/* 兩種模式 */}
      <Card>
        <CardHeader>
          <CardTitle>Facebook App 的兩種模式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* 開發模式 */}
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              <Badge variant="outline" className="mb-2">開發模式</Badge>
              <ul className="space-y-2 text-sm mt-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>立即可用，適合測試</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <span>只有管理員和測試用戶可登入</span>
                </li>
              </ul>
            </div>

            {/* 上線模式 */}
            <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
              <Badge className="bg-blue-600 mb-2">上線模式</Badge>
              <ul className="space-y-2 text-sm mt-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span>所有 Facebook 用戶都可登入</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <span>需要通過 App Review 審核</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 需要提供的資料 */}
      <Card className="border-purple-300 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-900">
            📝 需要提供給 Facebook 的審核資料
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-white rounded p-3 space-y-2 text-sm">
            <p className="font-semibold">1. 測試帳號和密碼</p>
            <p className="text-gray-600 ml-4">
              讓 Facebook 審核人員可以測試登入功能
            </p>
          </div>

          <div className="bg-white rounded p-3 space-y-2 text-sm">
            <p className="font-semibold">2. 螢幕錄影示範（2-3 分鐘）</p>
            <p className="text-gray-600 ml-4">
              展示從打開網站 → 點擊 Facebook 登入 → 成功登入的完整流程
            </p>
          </div>

          <div className="bg-white rounded p-3 space-y-2 text-sm">
            <p className="font-semibold">3. 詳細測試說明</p>
            <p className="text-gray-600 ml-4">
              逐步操作指引，讓審核人員知道如何測試
            </p>
          </div>

          <div className="bg-white rounded p-3 space-y-2 text-sm">
            <p className="font-semibold">4. 權限用途說明</p>
            <p className="text-gray-600 ml-4">
              說明為什麼需要 email 和 public_profile 權限
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 提交步驟 */}
      <Card className="border-green-300 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900">
            🚀 提交 App Review 的步驟
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">前往 App Review</p>
                <p className="text-sm text-gray-600">左側選單 → App Review → Permissions and Features</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">請求權限</p>
                <p className="text-sm text-gray-600">找到 email 和 public_profile，點擊「Request」</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">填寫審核資料</p>
                <p className="text-sm text-gray-600">上傳影片、提供測試帳號、填寫說明</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">提交審核</p>
                <p className="text-sm text-gray-600">檢查所有資料後，點擊「Submit for Review」</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                5
              </div>
              <div>
                <p className="font-medium">等待審核</p>
                <p className="text-sm text-gray-600">通常需要 1-7 個工作天</p>
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 mt-4"
            onClick={() => window.open('https://developers.facebook.com/apps/1192407946431251/app-review/permissions-and-features/', '_blank')}
          >
            前往 Facebook App Review 頁面
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* 替代方案 */}
      <Card>
        <CardHeader>
          <CardTitle>💡 不想提交審核？替代方案</CardTitle>
          <CardDescription>
            如果您的應用還在測試階段，可以暫時保持開發模式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-gray-50 border rounded p-4 space-y-2 text-sm">
            <p className="font-semibold">✅ 保持開發模式</p>
            <p className="text-gray-600">不要切換到上線模式，繼續使用開發模式</p>
            
            <p className="font-semibold mt-3">✅ 添加測試用戶</p>
            <p className="text-gray-600">前往「角色 → 測試使用者」添加需要測試的用戶</p>
            
            <p className="font-semibold mt-3">✅ 添加應用角色</p>
            <p className="text-gray-600">前往「角色 → 角色」添加管理員或開發人員</p>
          </div>
        </CardContent>
      </Card>

      {/* 詳細文檔 */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-800">
          <p className="font-semibold mb-2">📚 完整指南</p>
          <p className="text-sm">
            查看 <code className="bg-blue-100 px-2 py-1 rounded">/FACEBOOK_APP_REVIEW_COMPLETE_GUIDE.md</code> 獲取更詳細的步驟說明、
            範例文字和常見問題解答。
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
