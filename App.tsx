import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          CaseWhr Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          專業的三語言全球接案平台
        </p>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">🚀 部署成功！</h2>
          <p className="text-gray-700">
            這是 CaseWhr 平台的基礎版本。
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">✅ 三語言支持</h3>
            <p className="text-sm text-blue-700">繁中/簡中/英文</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">💰 三幣種計價</h3>
            <p className="text-sm text-green-700">TWD/USD/CNY</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">🔒 企業級功能</h3>
            <p className="text-sm text-purple-700">完整訂閱系統</p>
          </div>
        </div>
      </div>
    </div>
  );
}
