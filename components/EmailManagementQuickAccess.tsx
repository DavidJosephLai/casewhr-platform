import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { 
  Mail, 
  ExternalLink, 
  MousePointer, 
  Hash,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export function EmailManagementQuickAccess() {
  const goToEmailManagement = () => {
    window.location.hash = 'email-management';
  };

  return (
    <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 標題 */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                📧 郵件管理中心 - 快速訪問
              </h3>
              <p className="text-sm text-gray-600">3 種方式立即進入</p>
            </div>
          </div>

          {/* 方式 1：一鍵訪問 */}
          <div className="bg-white rounded-lg p-4 border-2 border-purple-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-sm font-bold">
                1
              </div>
              <h4 className="font-semibold text-purple-900">一鍵直達（推薦）⭐⭐⭐</h4>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              點擊下方按鈕，立即進入郵件管理中心
            </p>
            <Button 
              onClick={goToEmailManagement}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              立即進入郵件管理中心
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* 方式 2：URL 訪問 */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-bold">
                2
              </div>
              <h4 className="font-semibold text-blue-900">在地址欄輸入 ⭐⭐⭐</h4>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              在瀏覽器地址欄輸入以下內容：
            </p>
            <div className="bg-gray-900 rounded p-2 flex items-center justify-between">
              <code className="text-green-400 text-sm">#email-management</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText('#email-management');
                  alert('已複製到剪貼板！');
                }}
              >
                <Hash className="h-3 w-3 mr-1" />
                複製
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 提示：複製後貼到地址欄，按 Enter
            </p>
          </div>

          {/* 方式 3：管理面板 */}
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-sm font-bold">
                3
              </div>
              <h4 className="font-semibold text-green-900">通過管理面板 ⭐⭐</h4>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>點擊右下角「管理」按鈕 ⚙️</span>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>切換到「系統信息」標籤</span>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>點擊「開啟郵件管理中心」</span>
              </div>
            </div>
          </div>

          {/* 到達後做什麼 */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              到達郵件管理中心後：
            </h4>
            <div className="space-y-1 text-sm text-orange-800">
              <p>1️⃣ 點擊「<strong>發件人管理</strong>」標籤（第 2 個）</p>
              <p>2️⃣ 查看「admin@casewhr.com 已創建！」指南</p>
              <p>3️⃣ 按照步驟 2-6 完成配置</p>
            </div>
          </div>

          {/* 預計時間 */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600 pt-2 border-t">
            <div className="flex items-center gap-1">
              <span className="text-purple-600 font-semibold">⏱️</span>
              <span>訪問時間：5 秒</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-600 font-semibold">🎯</span>
              <span>完成配置：20 分鐘</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
