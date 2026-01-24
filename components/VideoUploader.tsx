/**
 * 🎬 影片上傳工具
 * 用於將背景影片上傳到 Supabase Storage
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, Upload, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function VideoUploader() {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 免費合法影片下載連結
  const freeVideoSources = [
    {
      name: 'Pexels - 商務團隊合作',
      downloadUrl: 'https://www.pexels.com/video/3191158/download/',
      description: '現代辦公室，團隊合作場景',
      license: 'Pexels License (完全免費，可商用，無需署名)',
      size: '約 8MB'
    },
    {
      name: 'Pexels - 辦公室工作',
      downloadUrl: 'https://www.pexels.com/video/4065891/download/',
      description: '專業辦公環境，忙碌工作氛圍',
      license: 'Pexels License (完全免費，可商用，無需署名)',
      size: '約 6MB'
    },
    {
      name: 'Mixkit - 商業會議',
      downloadUrl: 'https://mixkit.co/free-stock-video/business-meeting-in-modern-office-4063/',
      description: '現代會議室，商務討論',
      license: 'Mixkit License (完全免費，可商用)',
      size: '約 5MB'
    },
    {
      name: 'Coverr - 團隊協作',
      downloadUrl: 'https://coverr.co/videos/business-team-meeting--ZPmOGlVWt8',
      description: '開放式辦公室，團隊協作',
      license: 'Coverr License (完全免費，可商用)',
      size: '約 7MB'
    },
    {
      name: 'Pixabay - 科技辦公',
      downloadUrl: 'https://pixabay.com/videos/office-business-colleagues-work-6183/',
      description: '科技公司辦公環境',
      license: 'Pixabay License (完全免費，可商用)',
      size: '約 4MB'
    }
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 驗證文件類型
    if (!file.type.startsWith('video/')) {
      setError('請選擇影片檔案（MP4, WebM, MOV 等）');
      return;
    }

    // 驗證文件大小（限制 50MB）
    if (file.size > 50 * 1024 * 1024) {
      setError('影片檔案太大！請選擇小於 50MB 的影片');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // 創建 FormData
      const formData = new FormData();
      formData.append('video', file);

      // 上傳到後端
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/upload-hero-video`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上傳失敗');
      }

      const data = await response.json();
      console.log('✅ 影片上傳成功:', data);

      setUploadedUrl(data.url);
      setUploadProgress(100);
      
      // 提示用戶
      alert(`✅ 影片上傳成功！\n\n影片 URL：\n${data.url}\n\n這個 URL 已經複製到剪貼簿，可以直接用在 Hero.tsx 中！`);
      
      // 複製到剪貼簿
      navigator.clipboard.writeText(data.url);

    } catch (err: any) {
      console.error('❌ 影片上傳失敗:', err);
      setError(err.message || '上傳失敗，請重試');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-36 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white shadow-2xl"
        size="lg"
      >
        🎬 上傳影片
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-4xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🎬 背景影片上傳工具</h2>
          <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 步驟說明 */}
        <div className="bg-blue-50 border border-blue-300 rounded p-4 mb-6">
          <h3 className="font-bold mb-2">📋 使用步驟：</h3>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>從下方推薦網站下載免費合法影片（或使用自己的影片）</li>
            <li>點擊「選擇影片檔案」上傳到 Supabase Storage</li>
            <li>上傳完成後，影片 URL 會自動複製到剪貼簿</li>
            <li>將 URL 貼到 <code className="bg-gray-200 px-1 rounded">/components/Hero.tsx</code> 的 video src 中</li>
            <li>刷新瀏覽器，享受自己託管的背景影片！🎉</li>
          </ol>
        </div>

        {/* 免費影片資源 */}
        <div className="mb-6">
          <h3 className="font-bold mb-3">🎥 推薦免費合法影片下載來源：</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {freeVideoSources.map((source, idx) => (
              <div key={idx} className="border rounded p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-blue-600">{source.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{source.description}</div>
                    <div className="text-xs text-green-600 mt-1">
                      ✅ {source.license}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      檔案大小：{source.size}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => window.open(source.downloadUrl, '_blank')}
                    className="flex-shrink-0"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    下載
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 上傳區域 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          
          {!uploading && !uploadedUrl && (
            <>
              <h3 className="font-bold mb-2">上傳影片到 Supabase Storage</h3>
              <p className="text-sm text-gray-600 mb-4">
                支援 MP4, WebM, MOV 格式，檔案大小限制 50MB
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button type="button" size="lg">
                  選擇影片檔案
                </Button>
              </label>
            </>
          )}

          {uploading && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 animate-pulse" />
                <span className="font-medium">上傳中...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                這可能需要幾秒鐘，請勿關閉視窗
              </p>
            </div>
          )}

          {uploadedUrl && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                <span className="font-bold text-lg">上傳成功！</span>
              </div>
              <div className="bg-green-50 border border-green-300 rounded p-4">
                <p className="text-sm font-medium mb-2">影片 URL（已複製到剪貼簿）：</p>
                <code className="text-xs bg-white p-2 rounded block overflow-x-auto">
                  {uploadedUrl}
                </code>
              </div>
              <Button
                onClick={() => {
                  setUploadedUrl(null);
                  setUploadProgress(0);
                }}
                variant="outline"
              >
                上傳另一個影片
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded">
              <p className="text-red-700 font-medium">❌ {error}</p>
            </div>
          )}
        </div>

        {/* 使用說明 */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded">
          <h4 className="font-bold mb-2">📝 如何使用上傳的影片：</h4>
          <div className="text-sm space-y-2">
            <p>1. 上傳完成後，影片 URL 會自動複製</p>
            <p>2. 打開 <code className="bg-gray-200 px-1 rounded">/components/Hero.tsx</code></p>
            <p>3. 找到 <code className="bg-gray-200 px-1 rounded">&lt;source src="..."&gt;</code> 標籤</p>
            <p>4. 替換成您上傳的影片 URL：</p>
            <pre className="bg-gray-800 text-white p-3 rounded mt-2 overflow-x-auto text-xs">
{`<source 
  src="您上傳的影片URL" 
  type="video/mp4" 
/>`}
            </pre>
            <p className="mt-2">5. 儲存檔案並刷新瀏覽器！</p>
          </div>
        </div>

        {/* 其他免費資源 */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded">
          <h4 className="font-bold mb-2">🌟 更多免費影片資源：</h4>
          <ul className="text-sm space-y-1">
            <li>• <a href="https://www.pexels.com/videos/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Pexels Videos</a> - 高品質免費影片</li>
            <li>• <a href="https://pixabay.com/videos/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Pixabay Videos</a> - 完全免費，無需署名</li>
            <li>• <a href="https://mixkit.co/free-stock-video/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mixkit</a> - 商業友好授權</li>
            <li>• <a href="https://coverr.co/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Coverr</a> - 精選背景影片</li>
            <li>• <a href="https://www.videvo.net/free-video/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Videvo</a> - 部分免費影片</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
