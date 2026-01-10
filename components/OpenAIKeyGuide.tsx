/**
 * OpenAI API Key 設置指南組件
 * 幫助用戶快速設置 OpenAI API Key
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Key, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Server,
  Zap
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { toast } from 'sonner';

export default function OpenAIKeyGuide() {
  const { language } = useLanguage();
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const isZh = language === 'zh' || language === 'zh-CN';

  const steps = [
    {
      number: 1,
      title: isZh ? '前往 OpenAI Platform' : 'Go to OpenAI Platform',
      description: isZh 
        ? '打開 OpenAI Platform 並登入您的帳號'
        : 'Open OpenAI Platform and sign in to your account',
      action: isZh ? '前往 OpenAI' : 'Go to OpenAI',
      url: 'https://platform.openai.com/api-keys',
      icon: <ExternalLink className="h-5 w-5" />,
      details: [
        isZh ? '1. 訪問 https://platform.openai.com/api-keys' : '1. Visit https://platform.openai.com/api-keys',
        isZh ? '2. 使用您的 OpenAI 帳號登入' : '2. Sign in with your OpenAI account',
        isZh ? '3. 如果沒有帳號，點擊 "Sign up" 註冊' : '3. If no account, click "Sign up" to register',
      ]
    },
    {
      number: 2,
      title: isZh ? '創建新的 API Key' : 'Create New API Key',
      description: isZh 
        ? '在左側選單點擊「API keys」，然後點擊「Create new secret key」'
        : 'Click "API keys" in left menu, then click "Create new secret key"',
      icon: <Key className="h-5 w-5" />,
      details: [
        isZh ? '1. 左側選單 → API keys' : '1. Left menu → API keys',
        isZh ? '2. 點擊「+ Create new secret key」按鈕' : '2. Click "+ Create new secret key" button',
        isZh ? '3. 輸入名稱（例如：CaseWHR-Production）' : '3. Enter name (e.g., CaseWHR-Production)',
        isZh ? '4. 點擊「Create secret key」' : '4. Click "Create secret key"',
      ]
    },
    {
      number: 3,
      title: isZh ? '複製 API Key' : 'Copy API Key',
      description: isZh 
        ? '⚠️ 重要：API Key 只會顯示一次！立即複製並妥善保存'
        : '⚠️ Important: API Key shown only once! Copy and save it now',
      icon: <Copy className="h-5 w-5" />,
      details: [
        isZh ? '1. API Key 格式：sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' : '1. API Key format: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        isZh ? '2. 點擊複製圖標複製完整的 Key' : '2. Click copy icon to copy the full Key',
        isZh ? '3. 貼到下方輸入框測試格式' : '3. Paste in the input below to test format',
        isZh ? '4. ⚠️ 不要關閉視窗直到確認已複製' : '4. ⚠️ Do not close window until confirmed copied',
      ]
    },
    {
      number: 4,
      title: isZh ? '配置到 Supabase' : 'Configure in Supabase',
      description: isZh 
        ? '將 API Key 添加到 Supabase Edge Functions 環境變數'
        : 'Add API Key to Supabase Edge Functions environment variables',
      icon: <Server className="h-5 w-5" />,
      details: [
        isZh ? '1. 前往 Supabase Dashboard' : '1. Go to Supabase Dashboard',
        isZh ? '2. Settings → Edge Functions' : '2. Settings → Edge Functions',
        isZh ? '3. 點擊「Add new secret」' : '3. Click "Add new secret"',
        isZh ? '4. Name: OPENAI_API_KEY' : '4. Name: OPENAI_API_KEY',
        isZh ? '5. Value: 貼上您的 API Key' : '5. Value: Paste your API Key',
      ]
    },
    {
      number: 5,
      title: isZh ? '重新部署並測試' : 'Redeploy and Test',
      description: isZh 
        ? '重新部署 Edge Function 並驗證功能'
        : 'Redeploy Edge Function and verify functionality',
      icon: <Zap className="h-5 w-5" />,
      details: [
        isZh ? '1. 執行：supabase functions deploy make-server-215f78a5' : '1. Run: supabase functions deploy make-server-215f78a5',
        isZh ? '2. 訪問診斷頁面：?view=keyword-deployment-check' : '2. Visit diagnostic page: ?view=keyword-deployment-check',
        isZh ? '3. 確認「OpenAI API Key」檢查通過' : '3. Confirm "OpenAI API Key" check passes',
        isZh ? '4. 測試關鍵字搜尋功能' : '4. Test keyword search function',
      ]
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(isZh ? '已複製！' : 'Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const validateApiKey = (key: string) => {
    // OpenAI API Key 格式驗證
    const isValid = key.startsWith('sk-') && key.length > 20;
    return isValid;
  };

  const handleApiKeyInput = (value: string) => {
    setApiKey(value);
    if (validateApiKey(value)) {
      toast.success(isZh ? '✅ API Key 格式正確！' : '✅ API Key format valid!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 標題 */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Key className="h-10 w-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {isZh ? 'OpenAI API Key 設置指南' : 'OpenAI API Key Setup Guide'}
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            {isZh 
              ? '5 個步驟讓關鍵字搜尋功能生效'
              : '5 steps to activate keyword search feature'}
          </p>
        </div>

        {/* 重要提示 */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{isZh ? '⚠️ 重要提醒：' : '⚠️ Important:'}</strong>
            {isZh 
              ? ' OpenAI API Key 只會在創建時顯示一次！請務必立即複製並妥善保存。'
              : ' OpenAI API Key is shown only once upon creation! Make sure to copy and save it immediately.'}
          </AlertDescription>
        </Alert>

        {/* 步驟卡片 */}
        <div className="space-y-4">
          {steps.map((step) => (
            <Card 
              key={step.number}
              className={`border-2 transition-all ${
                currentStep === step.number 
                  ? 'border-purple-500 shadow-lg' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      currentStep > step.number 
                        ? 'bg-green-500' 
                        : currentStep === step.number 
                        ? 'bg-purple-500' 
                        : 'bg-gray-300'
                    }`}>
                      {currentStep > step.number ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        {step.icon}
                        {step.title}
                        {currentStep === step.number && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                            {isZh ? '當前步驟' : 'Current Step'}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {step.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 詳細步驟 */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {step.details.map((detail, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>

                {/* 特殊操作 */}
                {step.number === 1 && (
                  <Button
                    onClick={() => {
                      window.open(step.url, '_blank');
                      setCurrentStep(2);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {isZh ? '前往 OpenAI Platform' : 'Go to OpenAI Platform'}
                  </Button>
                )}

                {step.number === 3 && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {isZh ? '在此測試您的 API Key 格式：' : 'Test your API Key format here:'}
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value={apiKey}
                          onChange={(e) => handleApiKeyInput(e.target.value)}
                          placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="font-mono text-sm"
                        />
                        <Button
                          onClick={() => copyToClipboard(apiKey)}
                          disabled={!apiKey}
                          variant="outline"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {apiKey && (
                        <div className="text-sm">
                          {validateApiKey(apiKey) ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              {isZh ? '✅ 格式正確' : '✅ Format valid'}
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {isZh ? '❌ 格式錯誤（應以 sk- 開頭）' : '❌ Invalid format (should start with sk-)'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {validateApiKey(apiKey) && (
                      <Button
                        onClick={() => setCurrentStep(4)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        {isZh ? '下一步：配置到 Supabase' : 'Next: Configure in Supabase'}
                      </Button>
                    )}
                  </div>
                )}

                {step.number === 4 && (
                  <div className="space-y-3">
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription className="text-blue-800 text-sm">
                        <strong>{isZh ? '📋 快速複製指令：' : '📋 Quick copy commands:'}</strong>
                        <div className="mt-2 space-y-2">
                          <div 
                            className="bg-white p-2 rounded border border-blue-200 cursor-pointer hover:bg-blue-100 flex items-center justify-between"
                            onClick={() => copyToClipboard('OPENAI_API_KEY')}
                          >
                            <code className="text-xs">OPENAI_API_KEY</code>
                            <Copy className="h-3 w-3" />
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={() => {
                        window.open('https://app.supabase.com', '_blank');
                        setCurrentStep(5);
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {isZh ? '前往 Supabase Dashboard' : 'Go to Supabase Dashboard'}
                    </Button>
                  </div>
                )}

                {step.number === 5 && (
                  <div className="space-y-3">
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800 text-sm">
                        <strong>{isZh ? '📋 部署指令：' : '📋 Deploy command:'}</strong>
                        <div 
                          className="mt-2 bg-white p-2 rounded border border-green-200 cursor-pointer hover:bg-green-100 flex items-center justify-between"
                          onClick={() => copyToClipboard('supabase functions deploy make-server-215f78a5')}
                        >
                          <code className="text-xs">supabase functions deploy make-server-215f78a5</code>
                          <Copy className="h-3 w-3" />
                        </div>
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={() => {
                        window.location.href = '/?view=keyword-deployment-check';
                      }}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {isZh ? '前往診斷頁面驗證' : 'Go to Diagnostic Page'}
                    </Button>
                  </div>
                )}

                {/* 下一步按鈕 */}
                {step.number !== 1 && step.number !== 3 && step.number !== 4 && step.number !== 5 && (
                  <Button
                    onClick={() => setCurrentStep(step.number + 1)}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {isZh ? '下一步' : 'Next Step'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 快速鏈接 */}
        <Card className="border-2 border-dashed border-purple-300 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800">
              {isZh ? '🔗 快速鏈接' : '🔗 Quick Links'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              OpenAI API Keys
            </a>
            <a
              href="https://platform.openai.com/usage"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              OpenAI Usage Dashboard
            </a>
            <a
              href="https://app.supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Supabase Dashboard
            </a>
            <a
              href="/?view=keyword-deployment-check"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
            >
              <Zap className="h-4 w-4" />
              {isZh ? '關鍵字搜尋診斷工具' : 'Keyword Search Diagnostic'}
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
