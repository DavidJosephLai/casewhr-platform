import React from 'react';
import { Card } from './ui/card';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

export function DiagnosticQuickGuide() {
  return (
    <Card className="p-6 bg-blue-50 border-2 border-blue-200">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-blue-600" />
        💡 如何使用診斷工具
      </h3>
      
      <div className="space-y-4">
        {/* 步驟 1 */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <p className="font-semibold">找到診斷工具</p>
            <p className="text-sm text-gray-700">就在錢包頁面最上方（紅色邊框卡片）</p>
          </div>
        </div>

        {/* 步驟 2 */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <p className="font-semibold">點擊「開始診斷」按鈕</p>
            <p className="text-sm text-gray-700">等待 2-3 秒自動檢查</p>
          </div>
        </div>

        {/* 步驟 3 */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            3
          </div>
          <div>
            <p className="font-semibold">查看診斷結果</p>
            <p className="text-sm text-gray-700">會顯示您的付款狀態和建議</p>
          </div>
        </div>

        {/* 狀態說明 */}
        <div className="mt-6 pt-4 border-t border-blue-200">
          <p className="font-semibold mb-2">付款狀態說明：</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-mono bg-green-100 px-2 py-0.5 rounded">confirmed</span>
              <span className="text-gray-700">= 已確認，錢已到賬 ✅</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="font-mono bg-yellow-100 px-2 py-0.5 rounded">pending</span>
              <span className="text-gray-700">= 等待中，需等 5-10 分鐘 ⏳</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="font-mono bg-red-100 px-2 py-0.5 rounded">rejected</span>
              <span className="text-gray-700">= 付款失敗，需重新充值 ❌</span>
            </div>
          </div>
        </div>

        {/* 常見問題 */}
        <div className="mt-6 pt-4 border-t border-blue-200">
          <p className="font-semibold mb-2">💡 常見情況：</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>看到 pending？</strong> → 等待 5-10 分鐘後重新診斷</li>
            <li>• <strong>confirmed 但沒錢？</strong> → 這是錯誤！聯繫管理員</li>
            <li>• <strong>找不到付款記錄？</strong> → 檢查是否完成付款流程</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
