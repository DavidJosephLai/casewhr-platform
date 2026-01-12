import React from 'react';

export function AdminAISEO() {
  console.log('✅ AdminAISEO 組件已載入');
  
  return (
    <div className="p-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-green-600">✅ AdminAISEO 載入成功！</h1>
      <p className="text-gray-600 mt-2">如果你看到這個訊息，表示基本組件沒問題</p>
      <p className="text-sm text-gray-500 mt-4">時間: {new Date().toLocaleString()}</p>
    </div>
  );
}
