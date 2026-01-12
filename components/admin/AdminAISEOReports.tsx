/**
 * AI SEO 報告雲端檢查器 - 簡化測試版本
 */

import React from 'react';

export default function AdminAISEOReports() {
  console.log('🚀 AdminAISEOReports 開始執行');
  
  return (
    <div className="p-8 bg-purple-100 border-4 border-purple-500 rounded-lg">
      <h1 className="text-3xl font-bold text-purple-900">🎉 AdminAISEOReports 正常顯示！</h1>
      <p className="text-purple-700 mt-2">如果你看到這個，表示組件沒有問題</p>
      <p className="text-sm text-purple-600 mt-4">時間: {new Date().toLocaleString()}</p>
    </div>
  );
}
