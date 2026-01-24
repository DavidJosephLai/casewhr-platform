/**
 * 🔧 影片診斷工具
 * 用於快速測試影片是否可以載入和播放
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function VideoDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<{
    url: string;
    status: 'loading' | 'success' | 'error';
    message: string;
  }[]>([]);

  const testVideos = [
    {
      name: 'Pexels 影片 1',
      url: 'https://videos.pexels.com/video-files/3191158/3191158-uhd_2560_1440_25fps.mp4'
    },
    {
      name: 'Pexels 影片 2',
      url: 'https://videos.pexels.com/video-files/4065891/4065891-uhd_2560_1440_25fps.mp4'
    },
    {
      name: 'Pixabay 影片 1',
      url: 'https://cdn.pixabay.com/video/2021/08/04/84516-583693651_large.mp4'
    },
    {
      name: 'Pixabay 影片 2',
      url: 'https://cdn.pixabay.com/video/2020/05/30/40747-424810828_large.mp4'
    }
  ];

  const testVideo = (url: string, name: string) => {
    console.log(`🧪 Testing: ${name}`);
    
    // 添加到測試結果
    setTestResults(prev => [...prev, {
      url: name,
      status: 'loading',
      message: '載入中...'
    }]);

    const video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    const timeout = setTimeout(() => {
      setTestResults(prev => prev.map(r => 
        r.url === name ? {
          ...r,
          status: 'error',
          message: '載入超時（網路太慢或影片不存在）'
        } : r
      ));
    }, 10000);

    video.addEventListener('loadeddata', () => {
      clearTimeout(timeout);
      console.log(`✅ ${name} loaded successfully`);
      setTestResults(prev => prev.map(r => 
        r.url === name ? {
          ...r,
          status: 'success',
          message: `✅ 可用！檔案大小約 ${(video.duration * 500).toFixed(1)} KB/s`
        } : r
      ));
    });

    video.addEventListener('error', (e) => {
      clearTimeout(timeout);
      const errorMsg = video.error?.message || '未知錯誤';
      console.error(`❌ ${name} failed:`, errorMsg);
      setTestResults(prev => prev.map(r => 
        r.url === name ? {
          ...r,
          status: 'error',
          message: `❌ 失敗：${errorMsg}`
        } : r
      ));
    });

    video.src = url;
    video.load();
  };

  const testAll = () => {
    setTestResults([]);
    testVideos.forEach(v => {
      setTimeout(() => testVideo(v.url, v.name), 100);
    });
  };

  const copyWorkingUrl = () => {
    const working = testResults.find(r => r.status === 'success');
    if (working) {
      const url = testVideos.find(v => v.name === working.url)?.url;
      if (url) {
        navigator.clipboard.writeText(url);
        alert('✅ 已複製可用影片 URL 到剪貼簿！');
      }
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 bg-red-600 hover:bg-red-700 text-white shadow-2xl"
        size="lg"
      >
        🔧 影片診斷
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">🔧 影片載入診斷工具</h2>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            測試不同影片源是否可以在您的網路環境中載入
          </p>

          <Button onClick={testAll} className="w-full">
            🧪 開始測試所有影片
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="font-bold">測試結果：</h3>
              {testResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded border flex items-center gap-2 ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-300'
                      : result.status === 'error'
                      ? 'bg-red-50 border-red-300'
                      : 'bg-yellow-50 border-yellow-300'
                  }`}
                >
                  {result.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                  {result.status === 'error' && (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  {result.status === 'loading' && (
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 animate-pulse" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{result.url}</div>
                    <div className="text-sm text-gray-600">{result.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {testResults.some(r => r.status === 'success') && (
            <Button onClick={copyWorkingUrl} className="w-full bg-green-600 hover:bg-green-700">
              📋 複製可用影片 URL
            </Button>
          )}

          {testResults.length > 0 && testResults.every(r => r.status === 'error') && (
            <div className="p-4 bg-red-50 border border-red-300 rounded">
              <p className="font-bold text-red-800 mb-2">❌ 所有影片都無法載入</p>
              <p className="text-sm text-red-700">
                可能原因：
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside mt-2">
                <li>網路連線問題</li>
                <li>防火牆或公司網路封鎖影片串流</li>
                <li>廣告攔截器攔截了影片</li>
                <li>瀏覽器不支援這些影片格式</li>
              </ul>
              <p className="text-sm text-red-700 mt-2 font-bold">
                建議：暫時停用背景影片，只使用靜態圖片
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-300 rounded">
            <h4 className="font-bold mb-2">📝 快速修復步驟：</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>點擊「開始測試所有影片」</li>
              <li>等待測試完成（約 10 秒）</li>
              <li>如果有綠色勾勾，點擊「複製可用影片 URL」</li>
              <li>打開 <code className="bg-gray-200 px-1 rounded">/components/Hero.tsx</code></li>
              <li>找到第一個 <code className="bg-gray-200 px-1 rounded">&lt;source&gt;</code> 標籤</li>
              <li>替換 <code className="bg-gray-200 px-1 rounded">src</code> 為複製的 URL</li>
              <li>儲存並刷新瀏覽器！</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
}
