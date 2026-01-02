import { useState } from 'react';
import { Cloud, Upload, Download, CheckCircle } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { JSONFileUploader } from './JSONFileUploader';
import { toast } from 'sonner@2.0.3';

export function AISEOTestPage() {
  const { language } = useLanguage();
  const { session, user } = useAuth();
  const [currentTitle, setCurrentTitle] = useState('Test SEO Report');
  const [currentDescription, setCurrentDescription] = useState('This is a test SEO report description');
  const [currentKeywords, setCurrentKeywords] = useState('test, seo, report');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl mb-4">🧪 AI SEO 功能測試頁面</h1>
          <p className="text-gray-600 mb-4">
            這個頁面用於測試「儲存到雲端」按鈕和「JSON 上傳器」功能
          </p>
          
          {/* 登入狀態 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">📊 當前狀態：</h3>
            <div className="space-y-1 text-sm">
              <p>
                <strong>登入狀態：</strong> 
                {session ? (
                  <span className="text-green-600 ml-2">✅ 已登入</span>
                ) : (
                  <span className="text-red-600 ml-2">❌ 未登入</span>
                )}
              </p>
              {session && (
                <>
                  <p><strong>用戶郵箱：</strong> {user?.email || 'N/A'}</p>
                  <p><strong>Access Token：</strong> {session.access_token ? '✅ 存在' : '❌ 不存在'}</p>
                </>
              )}
              <p>
                <strong>測試內容：</strong> 
                <span className="text-green-600 ml-2">✅ 已填寫</span>
              </p>
            </div>
          </div>
        </div>

        {/* 測試區域 1：儲存到雲端按鈕 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl mb-4">1️⃣ 測試「儲存到雲端」按鈕</h2>
          
          {/* 表單內容 */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm mb-2">標題</label>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-2">描述</label>
              <textarea
                value={currentDescription}
                onChange={(e) => setCurrentDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-2">關鍵字</label>
              <input
                type="text"
                value={currentKeywords}
                onChange={(e) => setCurrentKeywords(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* 按鈕顯示邏輯說明 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold mb-2">💡 按鈕顯示條件：</h4>
            <div className="space-y-1 text-sm">
              <p>
                ✓ 需要登入：
                {session ? (
                  <span className="text-green-600 ml-2">✅ 已滿足</span>
                ) : (
                  <span className="text-red-600 ml-2">❌ 未滿足（請先登入）</span>
                )}
              </p>
              <p>
                ✓ 需要有內容：
                {(currentTitle || currentDescription) ? (
                  <span className="text-green-600 ml-2">✅ 已滿足</span>
                ) : (
                  <span className="text-red-600 ml-2">❌ 未滿足（請填寫內容）</span>
                )}
              </p>
            </div>
          </div>

          {/* 實際的按鈕 */}
          <div className="flex gap-2 flex-wrap">
            {session && (currentTitle || currentDescription) ? (
              <button
                onClick={() => {
                  toast.success('✅ 這就是「儲存到雲端」按鈕！點擊後會保存到雲端。');
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Cloud className="w-4 h-4" />
                {language === 'en' ? 'Save to Cloud' : '儲存到雲端'}
              </button>
            ) : (
              <div className="text-gray-500 text-sm">
                ⚠️ 按鈕未顯示，因為：
                {!session && ' 您未登入'}
                {!currentTitle && !currentDescription && ' 您未填寫內容'}
              </div>
            )}
            
            <button
              onClick={() => {
                toast.info('📥 這是「匯出」按鈕');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {language === 'en' ? 'Export' : '匯出'}
            </button>
          </div>
        </div>

        {/* 測試區域 2：JSON 上傳器 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl mb-4">2️⃣ 測試「JSON 上傳器」</h2>
          
          {!session ? (
            <div className="text-center py-8 text-gray-500">
              <Cloud className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>❌ 請登入以使用 JSON 上傳功能</p>
            </div>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold mb-2">✅ 您已登入，可以使用上傳功能！</h4>
                <p className="text-sm text-gray-700">
                  下方是完整的 JSON 文件上傳器組件，您可以：
                </p>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li>• 拖放 JSON 文件到下方區域</li>
                  <li>• 或點擊「瀏覽文件」按鈕選擇文件</li>
                  <li>• 預覽文件內容</li>
                  <li>• 點擊「上傳到雲端」保存</li>
                </ul>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-base font-medium text-gray-900 mb-1">
                  {language === 'en' ? '📤 Upload JSON Report' : '📤 上傳 JSON 報告'}
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  {language === 'en' 
                    ? 'Upload existing SEO report JSON files to the cloud' 
                    : '將現有的 SEO 報告 JSON 文件上傳到雲端'}
                </p>
                
                <JSONFileUploader 
                  onUploadComplete={(reportId) => {
                    toast.success(`✅ 報告上傳成功！ID: ${reportId}`);
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* 測試文件示例 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl mb-4">3️⃣ 測試 JSON 文件示例</h2>
          <p className="text-sm text-gray-600 mb-4">
            複製下面的 JSON 內容，保存為 <code className="bg-gray-100 px-2 py-1 rounded">test-seo.json</code>，
            然後在上方上傳器中測試上傳：
          </p>
          
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm">{`{
  "title": "CaseWHR - 全球接案平台",
  "description": "領先的全球自由工作者接案平台，提供專業的項目匹配服務",
  "keywords": "接案, 自由工作, 外包, casewhr",
  "pageType": "home",
  "analysis": {
    "score": 85,
    "issues": [],
    "strengths": ["標題長度適中", "包含關鍵字"],
    "improvements": ["可以增加更多關鍵字"]
  },
  "generatedData": {
    "title": "CaseWHR - 全球領先的自由工作者接案平台",
    "description": "專業的接案平台，連接全球自由工作者與項目需求方，提供安全、高效的項目匹配服務",
    "keywords": ["接案", "自由工作", "外包", "遠程工作"],
    "suggestions": [
      "在標題中突出平台優勢",
      "描述中加入更多價值主張"
    ]
  }
}`}</pre>
          </div>
          
          <button
            onClick={() => {
              const jsonContent = `{
  "title": "CaseWHR - 全球接案平台",
  "description": "領先的全球自由工作者接案平台，提供專業的項目匹配服務",
  "keywords": "接案, 自由工作, 外包, casewhr",
  "pageType": "home",
  "analysis": {
    "score": 85,
    "issues": [],
    "strengths": ["標題長度適中", "包含關鍵字"],
    "improvements": ["可以增加更多關鍵字"]
  },
  "generatedData": {
    "title": "CaseWHR - 全球領先的自由工作者接案平台",
    "description": "專業的接案平台，連接全球自由工作者與項目需求方，提供安全、高效的項目匹配服務",
    "keywords": ["接案", "自由工作", "外包", "遠程工作"],
    "suggestions": [
      "在標題中突出平台優勢",
      "描述中加入更多價值主張"
    ]
  }
}`;
              
              const blob = new Blob([jsonContent], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'test-seo.json';
              a.click();
              URL.revokeObjectURL(url);
              
              toast.success('📥 測試文件已下載！現在可以在上方上傳器中測試上傳。');
            }}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            下載測試 JSON 文件
          </button>
        </div>

        {/* 說明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-xl mb-3">📝 使用說明</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <strong>1. 如何看到「儲存到雲端」按鈕：</strong>
              <ul className="ml-6 mt-1 space-y-1">
                <li>• 確保您已登入（右上角顯示用戶名）</li>
                <li>• 填寫標題、描述或關鍵字（至少一個）</li>
                <li>• 按鈕會自動出現在動作按鈕區域</li>
              </ul>
            </div>
            
            <div>
              <strong>2. 如何使用 JSON 上傳器：</strong>
              <ul className="ml-6 mt-1 space-y-1">
                <li>• 確保您已登入</li>
                <li>• 點擊上方「下載測試 JSON 文件」按鈕</li>
                <li>• 將下載的文件拖放到上傳器區域</li>
                <li>• 或點擊「瀏覽文件」選擇文件</li>
                <li>• 預覽內容後點擊「上傳到雲端」</li>
              </ul>
            </div>
            
            <div>
              <strong>3. 在實際 AI SEO Manager 中的位置：</strong>
              <ul className="ml-6 mt-1 space-y-1">
                <li>• 「儲存到雲端」按鈕：在每個標籤的底部動作按鈕區</li>
                <li>• JSON 上傳器：在「歷史」標籤的底部</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AISEOTestPage;
