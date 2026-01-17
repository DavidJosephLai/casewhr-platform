import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle2, AlertCircle, ExternalLink, FileText, Video, Image as ImageIcon, CheckSquare } from 'lucide-react';

export function FacebookAppReviewGuide() {
  const [checklist, setChecklist] = useState({
    privacyPolicy: false,
    termsOfService: false,
    appDomains: false,
    oauthRedirect: false,
    testUser: false,
    appIcon: false,
    appPurpose: false,
    screenRecording: false,
    testInstructions: false,
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedItems = Object.values(checklist).filter(Boolean).length;
  const totalItems = Object.keys(checklist).length;
  const progress = (completedItems / totalItems) * 100;

  return (
    <div className="space-y-6">
      {/* 標題和進度 */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">
            📋 Facebook App Review 審核檢查清單
          </CardTitle>
          <CardDescription className="text-blue-700">
            完成以下項目以提交 Facebook 應用審核
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-blue-900">完成進度</span>
              <span className="text-blue-700">{completedItems} / {totalItems}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 重要提醒 */}
      <Alert className="border-yellow-300 bg-yellow-50">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <p className="font-semibold mb-2">⚠️ 關於「審核人員操作檢查」</p>
          <p className="text-sm mb-2">
            這表示 Facebook 需要您提供一些資料才能審核您的應用程式。
            通常需要提供：測試帳號、使用說明、螢幕錄影等。
          </p>
          <p className="text-sm">
            <strong>目前狀態</strong>：您的應用需要完成審核才能讓所有用戶使用 Facebook 登入功能。
          </p>
        </AlertDescription>
      </Alert>

      {/* 開發模式 vs 上線模式 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">重要概念</Badge>
            Facebook App 的兩種模式
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* 開發模式 */}
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">開發模式</Badge>
                <span className="text-sm text-gray-600">Development</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>可以立即使用</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>適合開發和測試</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span><strong>限制</strong>：只有管理員、開發人員和測試用戶可以登入</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>一般用戶無法使用</span>
                </li>
              </ul>
            </div>

            {/* 上線模式 */}
            <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-blue-600">上線模式</Badge>
                <span className="text-sm text-blue-700">Live</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>所有用戶</strong>都可以登入</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>適合正式上線</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span><strong>要求</strong>：需要通過 App Review</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>需要完成審核提交</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            <p className="text-blue-900">
              💡 <strong>提示</strong>：如果您的應用只供測試或小範圍使用，可以保持開發模式並添加測試用戶。
              如果需要公開給所有用戶，則必須通過 App Review。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 必要準備項目 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="destructive">必須完成</Badge>
            提交審核前的必要準備
          </CardTitle>
          <CardDescription>
            以下項目必須完成才能提交審核
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 1. 隱私權政策 */}
          <div className="border rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.privacyPolicy}
                onChange={() => toggleCheck('privacyPolicy')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold">隱私權政策 URL</h4>
                  <Badge variant="destructive" className="text-xs">必填</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  必須提供一個公開可訪問的隱私權政策頁面
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p><strong>您的 URL</strong>：</p>
                  <code className="text-blue-600">https://casewhr.com/privacy</code>
                  <p className="text-xs text-gray-500 mt-2">
                    確保這個頁面已經上線且內容完整
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* 2. 服務條款 */}
          <div className="border rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.termsOfService}
                onChange={() => toggleCheck('termsOfService')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold">服務條款 URL</h4>
                  <Badge variant="destructive" className="text-xs">必填</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  必須提供服務條款頁面
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p><strong>您的 URL</strong>：</p>
                  <code className="text-blue-600">https://casewhr.com/terms</code>
                </div>
              </div>
            </label>
          </div>

          {/* 3. 應用程式網域 */}
          <div className="border rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.appDomains}
                onChange={() => toggleCheck('appDomains')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold">應用程式網域</h4>
                  <Badge variant="destructive" className="text-xs">必填</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  在「設定 → 基本」中設置
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p><strong>需要添加</strong>：</p>
                  <code className="block">casewhr.com</code>
                  <code className="block">supabase.co</code>
                </div>
              </div>
            </label>
          </div>

          {/* 4. OAuth 重定向 URI */}
          <div className="border rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.oauthRedirect}
                onChange={() => toggleCheck('oauthRedirect')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold">有效的 OAuth 重新導向 URI</h4>
                  <Badge variant="destructive" className="text-xs">必填</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  在「產品 → Facebook 登入 → 設定」中設置
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p><strong>您的回調 URL</strong>：</p>
                  <code className="text-blue-600 break-all">
                    https://bihplitfentxioxyjalb.supabase.co/auth/v1/callback
                  </code>
                </div>
              </div>
            </label>
          </div>

          {/* 5. 應用程式圖示 */}
          <div className="border rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.appIcon}
                onChange={() => toggleCheck('appIcon')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold">應用程式圖示</h4>
                  <Badge className="bg-yellow-600 text-xs">建議</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  在「設定 → 基本」中上傳 1024x1024 的圖示
                </p>
                <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs text-yellow-800">
                  雖然不是必須，但有助於審核通過
                </div>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 審核提交準備 */}
      <Card className="border-purple-300 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-900">
            📝 提交審核時需要提供的資料
          </CardTitle>
          <CardDescription className="text-purple-700">
            Facebook 審核人員需要這些資料來測試您的應用
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 6. 測試用戶 */}
          <div className="border rounded-lg p-4 bg-white">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.testUser}
                onChange={() => toggleCheck('testUser')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="h-4 w-4 text-purple-600" />
                  <h4 className="font-semibold">測試帳號憑證</h4>
                  <Badge variant="destructive" className="text-xs">審核必需</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  提供一個測試帳號讓 Facebook 審核人員測試登入功能
                </p>
                <div className="bg-purple-50 border border-purple-200 rounded p-3 space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">選項 1：創建測試用戶（推薦）</p>
                    <ol className="text-sm space-y-1 ml-4 list-decimal text-gray-700">
                      <li>前往「角色 → 測試使用者」</li>
                      <li>點擊「新增」創建測試用戶</li>
                      <li>設置密碼</li>
                      <li>在審核提交時提供帳號和密碼</li>
                    </ol>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">選項 2：提供 Demo 帳號</p>
                    <div className="bg-white p-2 rounded text-xs space-y-1">
                      <p>帳號：<code>demo@casewhr.com</code></p>
                      <p>密碼：<code>[您的 demo 密碼]</code></p>
                    </div>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* 7. 螢幕錄影 */}
          <div className="border rounded-lg p-4 bg-white">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.screenRecording}
                onChange={() => toggleCheck('screenRecording')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="h-4 w-4 text-purple-600" />
                  <h4 className="font-semibold">螢幕錄影示範</h4>
                  <Badge variant="destructive" className="text-xs">審核必需</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  錄製一段影片展示 Facebook 登入的完整流程
                </p>
                <div className="bg-purple-50 border border-purple-200 rounded p-3 space-y-2 text-sm">
                  <p className="font-medium">錄影內容應包含：</p>
                  <ol className="ml-4 list-decimal space-y-1 text-gray-700">
                    <li>打開您的網站首頁</li>
                    <li>點擊「使用 Facebook 登入」按鈕</li>
                    <li>完成 Facebook 授權流程</li>
                    <li>成功登入後的畫面</li>
                    <li>展示用戶資料（姓名、email）</li>
                  </ol>
                  <div className="mt-2 p-2 bg-white rounded text-xs">
                    <p className="font-medium mb-1">錄影工具推薦：</p>
                    <p>• Windows：Xbox Game Bar（Win + G）</p>
                    <p>• Mac：QuickTime Player</p>
                    <p>• Chrome：Loom 擴充功能</p>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* 8. 測試說明 */}
          <div className="border rounded-lg p-4 bg-white">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.testInstructions}
                onChange={() => toggleCheck('testInstructions')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <h4 className="font-semibold">詳細的測試說明</h4>
                  <Badge variant="destructive" className="text-xs">審核必需</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  提供清楚的步驟說明，讓審核人員知道如何測試
                </p>
                <div className="bg-purple-50 border border-purple-200 rounded p-3">
                  <p className="text-sm font-medium mb-2">範例說明文字：</p>
                  <div className="bg-white p-3 rounded text-xs space-y-2 text-gray-700">
                    <p><strong>測試步驟：</strong></p>
                    <ol className="ml-4 list-decimal space-y-1">
                      <li>前往 https://casewhr.com</li>
                      <li>點擊右上角的「登入」按鈕</li>
                      <li>選擇「使用 Facebook 登入」</li>
                      <li>使用提供的測試帳號登入</li>
                      <li>授權應用存取基本資料</li>
                      <li>登入成功後將返回首頁，右上角顯示用戶名稱</li>
                    </ol>
                    <p className="mt-2"><strong>權限說明：</strong></p>
                    <p>我們只請求 email 和 public_profile 權限，用於創建用戶帳號。</p>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* 9. 應用用途說明 */}
          <div className="border rounded-lg p-4 bg-white">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.appPurpose}
                onChange={() => toggleCheck('appPurpose')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <h4 className="font-semibold">應用用途說明</h4>
                  <Badge variant="destructive" className="text-xs">審核必需</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  說明為什麼需要 Facebook 登入功能
                </p>
                <div className="bg-purple-50 border border-purple-200 rounded p-3">
                  <p className="text-sm font-medium mb-2">範例說明：</p>
                  <div className="bg-white p-3 rounded text-xs text-gray-700">
                    <p>
                      CaseWHR 是一個全球接案平台，連接客戶與自由工作者。
                      我們使用 Facebook Login 讓用戶能夠快速註冊和登入，
                      無需記住額外的密碼。我們只請求基本的個人資料（姓名和 email），
                      用於創建用戶帳號和平台內的溝通。
                    </p>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 提交審核步驟 */}
      <Card className="border-green-300 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900">
            🚀 提交 App Review 的步驟
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium">前往 App Review</p>
                <p className="text-sm text-gray-600">左側選單 → App Review → Permissions and Features</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">請求權限</p>
                <p className="text-sm text-gray-600">找到 <code>email</code> 和 <code>public_profile</code>，點擊「Request」</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">填寫審核資料</p>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>• 上傳螢幕錄影</p>
                  <p>• 提供測試帳號和密碼</p>
                  <p>• 填寫測試說明</p>
                  <p>• 說明權限用途</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div className="flex-1">
                <p className="font-medium">提交審核</p>
                <p className="text-sm text-gray-600">檢查所有資料後，點擊「Submit for Review」</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                5
              </div>
              <div className="flex-1">
                <p className="font-medium">等待審核</p>
                <p className="text-sm text-gray-600">通常需要 1-7 個工作天</p>
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => window.open('https://developers.facebook.com/apps/1192407946431251/app-review/submissions/', '_blank')}
          >
            前往 App Review 頁面
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* 替代方案 */}
      <Card className="border-gray-300">
        <CardHeader>
          <CardTitle className="text-lg">💡 如果不想提交審核？</CardTitle>
          <CardDescription>
            您可以暫時使用開發模式 + 測試用戶
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">
            如果您的應用還在測試階段，或只供內部使用，可以：
          </p>
          
          <div className="bg-gray-50 border rounded p-4 space-y-2 text-sm">
            <p className="font-semibold">✅ 保持開發模式</p>
            <p className="text-gray-600">在「設定 → 基本」中，不要切換到上線模式</p>
            
            <p className="font-semibold mt-3">✅ 添加測試用戶</p>
            <p className="text-gray-600">前往「角色 → 測試使用者」添加需要登入的用戶</p>
            
            <p className="font-semibold mt-3">✅ 添加應用管理員/開發人員</p>
            <p className="text-gray-600">前往「角色 → 角色」添加需要訪問的 Facebook 帳號</p>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800 text-sm">
              💡 <strong>提示</strong>：開發模式下，只有被添加為角色的 Facebook 帳號才能登入。
              這適合團隊內部測試或 Beta 測試。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 完成檢查 */}
      {progress === 100 && (
        <Alert className="border-green-300 bg-green-50">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800">
            <p className="font-semibold mb-2">🎉 準備就緒！</p>
            <p className="text-sm">
              您已完成所有檢查項目，現在可以提交 Facebook App Review 了。
              記得準備好螢幕錄影和測試帳號！
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
