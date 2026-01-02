import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { useLanguage } from '../lib/LanguageContext';

export function SitemapURLChecker() {
  const { language } = useLanguage();
  const [sitemapStatus, setSitemapStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [robotsStatus, setRobotsStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [copied, setCopied] = useState<string | null>(null);

  const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5`;
  const sitemapUrl = `${apiUrl}/sitemap.xml`;
  const robotsUrl = `${apiUrl}/robots.txt`;
  
  // 新的前端代理 URL（這是你應該提交到 Google 的）
  const publicSitemapUrl = `https://casewhr.com/sitemap.xml`;
  const publicRobotsUrl = `https://casewhr.com/robots.txt`;

  const checkUrls = async () => {
    setSitemapStatus('loading');
    setRobotsStatus('loading');

    // 檢查 Sitemap
    try {
      const sitemapResponse = await fetch(sitemapUrl);
      setSitemapStatus(sitemapResponse.ok ? 'success' : 'error');
    } catch (error) {
      setSitemapStatus('error');
    }

    // 檢查 Robots.txt
    try {
      const robotsResponse = await fetch(robotsUrl);
      setRobotsStatus(robotsResponse.ok ? 'success' : 'error');
    } catch (error) {
      setRobotsStatus('error');
    }
  };

  useEffect(() => {
    checkUrls();
  }, []);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusIcon = (status: 'loading' | 'success' | 'error') => {
    if (status === 'loading') {
      return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />;
    }
    if (status === 'success') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getStatusText = (status: 'loading' | 'success' | 'error') => {
    const statusTexts = {
      en: {
        loading: 'Checking...',
        success: '✅ Accessible',
        error: '❌ Not Accessible'
      },
      'zh-TW': {
        loading: '檢查中...',
        success: '✅ 可訪問',
        error: '❌ 無法訪問'
      },
      'zh-CN': {
        loading: '检查中...',
        success: '✅ 可访问',
        error: '❌ 无法访问'
      },
      zh: {
        loading: '檢查中...',
        success: '✅ 可訪問',
        error: '❌ 無法訪問'
      }
    };
    
    const texts = statusTexts[language as keyof typeof statusTexts] || statusTexts['zh-TW'];
    return texts[status];
  };

  const t = {
    en: {
      title: '🔍 SEO Files URL Checker',
      description: 'Verify your sitemap and robots.txt URLs are working',
      sitemap: 'Sitemap.xml URL',
      robots: 'Robots.txt URL',
      copy: 'Copy',
      copied: 'Copied!',
      open: 'Open',
      recheck: 'Recheck',
      check: 'Check',
      instruction: {
        title: '📋 How to Submit to Google Search Console',
        step1: '1. Copy the Sitemap URL above',
        step2: '2. Go to Google Search Console → Sitemaps',
        step3: '3. Paste the URL in the input field',
        step4: '4. Click Submit',
        step5: '5. Wait for Google to process (may take a few minutes)',
      },
      warning: {
        title: '⚠️ Important',
        text: 'Make sure to use the FULL URL above (starting with https://). Do NOT use shortened URLs like "casewhr.com/sitemap.xml".'
      },
      success: {
        title: '✅ URLs are working!',
        text: 'Both files are accessible and ready to submit to Google.'
      },
      error: {
        title: '❌ Connection Error',
        text: 'Cannot access the URLs. Please check your Supabase Edge Function deployment.'
      },
      googleRejection: '⛔ Google Will Reject This URL!',
      googleRejectionDesc: 'Because your website is casewhr.com but the Sitemap is on *.supabase.co domain, Google Search Console will show "Invalid sitemap URL" error.',
      useMethodBelow: '👉 Please use Method 1 or Method 2 below!',
      method1Title: 'Method 1: Use robots.txt Auto-Discovery (Recommended) ✨',
      method1Desc: 'No manual submission needed, Google will auto-discover!',
      method1Step1: 'Step 1: Verify robots.txt',
      method1Step1Desc: 'Confirm it contains the full Sitemap URL',
      method1Step2: 'Step 2: Test robots.txt in Google Search Console',
      method1Step2Desc: 'Settings → Crawlers → robots.txt Tester',
      method1Step3: 'Step 3: Wait for Auto-Discovery (1-3 days)',
      method1Step3Desc: 'Google will automatically discover your sitemap from robots.txt, no manual submission needed!',
      method2Title: 'Method 2: Add URL Prefix Property (Alternative)',
      method2Desc: 'If you must manually submit',
      method2Step1: 'Step 1: Add New Property in Google Search Console',
      method2Step1Desc: 'Choose "URL Prefix", enter the full Supabase Function URL',
      method2Step2: 'Step 2: Verify Ownership',
      method2Step2Desc: 'Verify using HTML tag or file upload method',
      method2Step3: 'Step 3: Submit Relative Path',
      method2Step3Desc: 'In the new property, just submit: sitemap.xml',
      deprecatedMethod: '❌ The following method does NOT work (Deprecated)',
      googleWillReject: '→ Google will reject because of different domain!',
      openGoogleConsole: 'Open Google Search Console',
      correctSubmission: '📸 Correct Submission Method',
      wrong: '❌ Wrong (Do NOT use):',
      wrongDesc: '→ This causes "Cannot fetch" error',
      correct: '✅ Correct (Use this):',
      correctDesc: '→ Full API URL, Google can access'
    },
    'zh-TW': {
      title: '🔍 SEO 文件 URL 檢查器',
      description: '驗證你的 sitemap 和 robots.txt URL 是否正常工作',
      sitemap: 'Sitemap.xml URL',
      robots: 'Robots.txt URL',
      copy: '複製',
      copied: '已複製！',
      open: '打開',
      recheck: '重新檢查',
      check: '檢查',
      instruction: {
        title: '📋 如何提交到 Google Search Console',
        step1: '1. 複製上面的 Sitemap URL',
        step2: '2. 前往 Google Search Console → Sitemap',
        step3: '3. 在輸入框中貼上 URL',
        step4: '4. 點擊提交',
        step5: '5. 等待 Google 處理（可能需要幾分鐘）',
      },
      warning: {
        title: '⚠️ 重要提示',
        text: '務必使用上面的完整 URL（以 https:// 開頭）。不要使用簡短 URL 如 "casewhr.com/sitemap.xml"。'
      },
      success: {
        title: '✅ URL 正常工作！',
        text: '兩個文件都可以訪問，可以提交到 Google 了。'
      },
      error: {
        title: '❌ 連接錯誤',
        text: '無法訪問 URL。請檢查你的 Supabase Edge Function 部署狀態。'
      },
      googleRejection: '⛔ Google 會拒絕這個 URL！',
      googleRejectionDesc: '因為你的網站是 casewhr.com，而 Sitemap 在 *.supabase.co 域名下，Google Search Console 會顯示「Sitemap 位址無效」錯誤。',
      useMethodBelow: '👉 請改用下方的「方法一」或「方法二」！',
      method1Title: '方法一：使用 robots.txt 自動引用（推薦）✨',
      method1Desc: '不需要手動提交，Google 會自動發現！',
      method1Step1: '步驟 1：驗證 robots.txt',
      method1Step1Desc: '確認裡面有 Sitemap 的完整 URL',
      method1Step2: '步驟 2：在 Google Search Console 測試 robots.txt',
      method1Step2Desc: '設定 → 檢索工具 → robots.txt 測試工具',
      method1Step3: '步驟 3：等待自動發現（1-3天）',
      method1Step3Desc: 'Google 會自動從 robots.txt 中發現你的 sitemap，不需要手動提交！',
      method2Title: '方法二：添加 URL 前綴資源（備用方案）',
      method2Desc: '如果你必須手動提交',
      method2Step1: '步驟 1：在 Google Search Console 加新資源',
      method2Step1Desc: '選擇「URL 前綴」，輸入完整的 Supabase Function URL',
      method2Step2: '步驟 2：驗證擁有權',
      method2Step2Desc: '使用 HTML 標籤或檔案上傳方式驗證',
      method2Step3: '步驟 3：提交相對路徑',
      method2Step3Desc: '在新資源中，只需提交：sitemap.xml',
      deprecatedMethod: '❌ 以下方法不適用（已過時）',
      googleWillReject: '→ Google 會拒絕，因為域名不同！',
      openGoogleConsole: '打開 Google Search Console',
      correctSubmission: '📸 正確的提交方式',
      wrong: '❌ 錯誤（不要使用）：',
      wrongDesc: '→ 這會導致「無法擷取」錯誤',
      correct: '✅ 正確（使用這個）：',
      correctDesc: '→ 完整的 API URL，Google 可以正常訪問'
    },
    'zh-CN': {
      title: '🔍 SEO 文件 URL 检查器',
      description: '验证你的 sitemap 和 robots.txt URL 是否正常工作',
      sitemap: 'Sitemap.xml URL',
      robots: 'Robots.txt URL',
      copy: '复制',
      copied: '已复制！',
      open: '打开',
      recheck: '重新检查',
      check: '检查',
      instruction: {
        title: '📋 如何提交到 Google Search Console',
        step1: '1. 复制上面的 Sitemap URL',
        step2: '2. 前往 Google Search Console → Sitemap',
        step3: '3. 在输入框中贴上 URL',
        step4: '4. 点击提交',
        step5: '5. 等待 Google 处理（可能需要几分钟）',
      },
      warning: {
        title: '⚠️ 重要提示',
        text: '务必使用上面的完整 URL（以 https:// 开头）。不要使用简短 URL 如 "casewhr.com/sitemap.xml"。'
      },
      success: {
        title: '✅ URL 正常工作！',
        text: '两个文件都可以访问，可以提交到 Google 了。'
      },
      error: {
        title: '❌ 连接错误',
        text: '无法访问 URL。请检查你的 Supabase Edge Function 部署状态。'
      },
      googleRejection: '⛔ Google 会拒绝这个 URL！',
      googleRejectionDesc: '因为你的网站是 casewhr.com，而 Sitemap 在 *.supabase.co 域名下，Google Search Console 会显示「Sitemap 位址无效」错误。',
      useMethodBelow: '👉 请改用下方的「方法一」或「方法二」！',
      method1Title: '方法一：使用 robots.txt 自动引用（推荐）✨',
      method1Desc: '不需要手动提交，Google 会自动发现！',
      method1Step1: '步骤 1：验证 robots.txt',
      method1Step1Desc: '确认里面有 Sitemap 的完整 URL',
      method1Step2: '步骤 2：在 Google Search Console 测试 robots.txt',
      method1Step2Desc: '设定 → 检索工具 → robots.txt 测试工具',
      method1Step3: '步骤 3等待自动发现（1-3天）',
      method1Step3Desc: 'Google 会自动从 robots.txt 中发现你的 sitemap，不需要手动提交！',
      method2Title: '方法二：添加 URL 前缀资源（备用方案）',
      method2Desc: '如果你必须手动提交',
      method2Step1: '步骤 1：在 Google Search Console 添加新资源',
      method2Step1Desc: '选择「URL 前缀」，输入完整的 Supabase Function URL',
      method2Step2: '步骤 2：验证拥有权',
      method2Step2Desc: '使用 HTML 标签或档案上传方式验证',
      method2Step3: '步骤 3：提交相对路径',
      method2Step3Desc: '在新资源中，只需提交：sitemap.xml',
      deprecatedMethod: '❌ 以下方法不适用（已过时）',
      googleWillReject: '→ Google 会拒绝，因为域名不同！',
      openGoogleConsole: '打开 Google Search Console',
      correctSubmission: '📸 正确的提交方式',
      wrong: '❌ 错误（不要使用）：',
      wrongDesc: '→ 这会导致「无法撷取」错误',
      correct: '✅ 正确（使用这个）：',
      correctDesc: '→ 完整的 API URL，Google 可以正常访问'
    },
    // 向后兼容：支持旧的 'zh' 语言代码
    zh: {
      title: '🔍 SEO 文件 URL 檢查器',
      description: '驗證你的 sitemap 和 robots.txt URL 是否正常工作',
      sitemap: 'Sitemap.xml URL',
      robots: 'Robots.txt URL',
      copy: '複製',
      copied: '已複製！',
      open: '打開',
      recheck: '重新檢查',
      check: '檢查',
      instruction: {
        title: '📋 如何提交到 Google Search Console',
        step1: '1. 複製上面的 Sitemap URL',
        step2: '2. 前往 Google Search Console → Sitemap',
        step3: '3. 在輸入框中貼上 URL',
        step4: '4. 點擊提交',
        step5: '5. 等待 Google 處理（可能需要幾分鐘）',
      },
      warning: {
        title: '⚠️ 重要提示',
        text: '務必使用上面的完整 URL（以 https:// 開頭）。不要使用簡短 URL 如 "casewhr.com/sitemap.xml"。'
      },
      success: {
        title: '✅ URL 正常工作！',
        text: '兩個文件都可以訪問，可以提交到 Google 了。'
      },
      error: {
        title: '❌ 連接錯誤',
        text: '無法訪問 URL。請檢查你的 Supabase Edge Function 部署狀態。'
      },
      googleRejection: '⛔ Google 會拒絕這��� URL！',
      googleRejectionDesc: '因為你的網站是 casewhr.com，而 Sitemap 在 *.supabase.co 域名下，Google Search Console 會顯示「Sitemap 位址無效」錯誤。',
      useMethodBelow: '👉 請改用下方的「方法一」或「方法二」！',
      method1Title: '方法一：使用 robots.txt 自動引用（推薦）✨',
      method1Desc: '不需要手動提交，Google 會自動發現！',
      method1Step1: '步驟 1：驗證 robots.txt',
      method1Step1Desc: '確認裡面有 Sitemap 的完整 URL',
      method1Step2: '步驟 2：在 Google Search Console 測試 robots.txt',
      method1Step2Desc: '設定 → 檢索工具 → robots.txt 測試工具',
      method1Step3: '步驟 3：等待自動發現（1-3天）',
      method1Step3Desc: 'Google 會自動從 robots.txt 中發現你的 sitemap，不需要手動提交！',
      method2Title: '方法二：添加 URL 前綴資源（備用方案）',
      method2Desc: '如果你必須手動提交',
      method2Step1: '步驟 1：在 Google Search Console 添加新資源',
      method2Step1Desc: '選擇「URL 前綴」，輸入完整的 Supabase Function URL',
      method2Step2: '步驟 2：驗證擁有權',
      method2Step2Desc: '使用 HTML 標籤或檔案上傳方式驗證',
      method2Step3: '步驟 3：提交相對路徑',
      method2Step3Desc: '在新資源中，只需提交：sitemap.xml',
      deprecatedMethod: '❌ 以下方法不適用（已過時）',
      googleWillReject: '→ Google 會拒絕，因為域名不同！',
      openGoogleConsole: '打開 Google Search Console',
      correctSubmission: '📸 正確的提交方式',
      wrong: '❌ 錯誤（不要使用）：',
      wrongDesc: '→ 這會導致「無法擷取」錯誤',
      correct: '✅ 正確（使用這個）：',
      correctDesc: '→ 完整的 API URL，Google 可以正常訪問'
    }
  };

  const content = t[language as keyof typeof t] || t['zh-TW'];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="mb-2">{content.title}</h1>
        <p className="text-gray-600">{content.description}</p>
      </div>

      {/* Status Summary */}
      {sitemapStatus !== 'loading' && robotsStatus !== 'loading' && (
        <Card className={`p-4 ${sitemapStatus === 'success' && robotsStatus === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {sitemapStatus === 'success' && robotsStatus === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <div className={sitemapStatus === 'success' && robotsStatus === 'success' ? 'text-green-900' : 'text-red-900'}>
                {sitemapStatus === 'success' && robotsStatus === 'success' ? content.success.title : content.error.title}
              </div>
              <div className={`text-sm ${sitemapStatus === 'success' && robotsStatus === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {sitemapStatus === 'success' && robotsStatus === 'success' ? content.success.text : content.error.text}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Sitemap URL Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(sitemapStatus)}
            <div>
              <h3 className="text-lg">{content.sitemap}</h3>
              <p className="text-sm text-gray-600">{getStatusText(sitemapStatus)}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={checkUrls}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {content.recheck}
          </Button>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg mb-3">
          <code className="text-sm break-all">{sitemapUrl}</code>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => copyToClipboard(sitemapUrl, 'sitemap')}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {copied === 'sitemap' ? content.copied : content.copy}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(sitemapUrl, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            {content.open}
          </Button>
        </div>
      </Card>

      {/* Robots.txt URL Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(robotsStatus)}
            <div>
              <h3 className="text-lg">{content.robots}</h3>
              <p className="text-sm text-gray-600">{getStatusText(robotsStatus)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg mb-3">
          <code className="text-sm break-all">{robotsUrl}</code>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => copyToClipboard(robotsUrl, 'robots')}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {copied === 'robots' ? content.copied : content.copy}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(robotsUrl, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            {content.open}
          </Button>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6">
        <h2 className="mb-4">{content.instruction.title}</h2>
        
        <div className="space-y-4">
          {/* 新的警告區塊 */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl">⚠️</div>
              <div>
                <h3 className="text-yellow-900 mb-2">
                  {content.googleRejection}
                </h3>
                <p className="text-yellow-800 mb-3">
                  {content.googleRejectionDesc}
                </p>
                <p className="text-yellow-900">
                  {content.useMethodBelow}
                </p>
              </div>
            </div>
          </div>

          {/* 方法一：robots.txt 自動引用 */}
          <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-3xl">✅</div>
              <div>
                <h3 className="text-green-900">
                  {content.method1Title}
                </h3>
                <p className="text-green-700 text-sm mt-1">
                  {content.method1Desc}
                </p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-green-900 mb-1">
                  {content.method1Step1}
                </div>
                <div className="bg-white p-2 rounded border border-green-200">
                  <code className="text-xs">https://casewhr.com/robots.txt</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('https://casewhr.com/robots.txt', '_blank')}
                    className="ml-2 h-6 text-xs"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {content.check}
                  </Button>
                </div>
                <p className="text-green-700 text-xs mt-1">
                  {content.method1Step1Desc}
                </p>
              </div>

              <div>
                <div className="text-green-900 mb-1">
                  {content.method1Step2}
                </div>
                <p className="text-green-700 text-xs">
                  {content.method1Step2Desc}
                </p>
              </div>

              <div>
                <div className="text-green-900 mb-1">
                  {content.method1Step3}
                </div>
                <p className="text-green-700 text-xs">
                  {content.method1Step3Desc}
                </p>
              </div>
            </div>
          </div>

          {/* 方法二：URL 前綴驗證 */}
          <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-3xl">📌</div>
              <div>
                <h3 className="text-blue-900">
                  {content.method2Title}
                </h3>
                <p className="text-blue-700 text-sm mt-1">
                  {content.method2Desc}
                </p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-blue-900 mb-1">
                  {content.method2Step1}
                </div>
                <p className="text-blue-700 text-xs">
                  {content.method2Step1Desc}
                </p>
                <div className="bg-white p-2 rounded border border-blue-200 mt-1">
                  <code className="text-xs break-all">{apiUrl}/</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${apiUrl}/`, 'prefix-url')}
                    className="ml-2 h-6 text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {copied === 'prefix-url' ? content.copied : content.copy}
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-blue-900 mb-1">
                  {content.method2Step2}
                </div>
                <p className="text-blue-700 text-xs">
                  {content.method2Step2Desc}
                </p>
              </div>

              <div>
                <div className="text-blue-900 mb-1">
                  {content.method2Step3}
                </div>
                <p className="text-blue-700 text-xs">
                  {content.method2Step3Desc}
                </p>
              </div>
            </div>
          </div>

          {/* 舊的步驟（保留但標記為不推薦） */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 opacity-50">
            <div className="text-gray-500 mb-2">
              {content.deprecatedMethod}
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><s>{content.instruction.step1}</s></p>
              <p><s>{content.instruction.step2}</s></p>
              <p><s>{content.instruction.step3}</s></p>
              <p><s>{content.instruction.step4}</s></p>
              <p className="text-red-600">
                {content.googleWillReject}
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => window.open('https://search.google.com/search-console', '_blank')}
          className="w-full flex items-center justify-center gap-2 mt-4"
        >
          <ExternalLink className="w-4 h-4" />
          {content.openGoogleConsole}
        </Button>
      </Card>

      {/* Warning */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <div className="text-yellow-600 text-2xl">⚠️</div>
          <div>
            <div className="text-yellow-900 mb-1">{content.warning.title}</div>
            <p className="text-sm text-yellow-800">{content.warning.text}</p>
          </div>
        </div>
      </Card>

      {/* Visual Guide */}
      <Card className="p-6">
        <h2 className="mb-4">
          {content.correctSubmission}
        </h2>
        
        <div className="space-y-4">
          <div className="border-2 border-red-500 p-4 rounded-lg">
            <div className="text-red-700 mb-2">
              {content.wrong}
            </div>
            <code className="text-sm text-red-600">
              casewhr.com/sitemap.xml
            </code>
            <div className="text-sm text-red-600 mt-2">
              {content.wrongDesc}
            </div>
          </div>

          <div className="border-2 border-green-500 p-4 rounded-lg">
            <div className="text-green-700 mb-2">
              {content.correct}
            </div>
            <code className="text-sm text-green-600 break-all">
              {sitemapUrl}
            </code>
            <div className="text-sm text-green-600 mt-2">
              {content.correctDesc}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}