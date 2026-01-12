/**
 * AI SEO 報告管理器 - 簡化版本，直接顯示
 */

import React from 'react';

export default function AdminAISEOReports() {
  return (
    <div className="p-8 bg-purple-50 border-4 border-purple-600 rounded-lg">
      <h1 className="text-4xl font-bold text-purple-900 mb-4">
        🎯 AdminAISEOReports 組件載入成功！
      </h1>
      <p className="text-xl text-purple-700">
        如果你看到這個紫色框，表示組件沒有任何問題。
      </p>
      <div className="mt-4 text-sm text-purple-600">
        時間: {new Date().toLocaleString('zh-TW')}
      </div>
    </div>
  );
}
