import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🚀 CaseWhr Platform
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Professional Global Freelancing Platform
        </p>
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <p className="text-lg text-gray-700 mb-4">
            ✅ Vercel 部署成功！
          </p>
          <p className="text-sm text-gray-600">
            完整的平台功能即将上线！
          </p>
        </div>
        <button
          onClick={() => setCount(count + 1)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          点击测试: {count}
        </button>
        <div className="mt-8 text-sm text-gray-500">
          <p>🌍 三语言支持 | 💰 三货币系统 | 💳 多支付集成</p>
        </div>
      </div>
    </div>
  );
}
