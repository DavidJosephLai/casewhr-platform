import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Settings } from 'lucide-react';

interface ConfigCheckResult {
  configured: boolean;
  mode: string;
  merchantId: string;
  hashKey: string;
  hashIV: string;
  apiUrl: string;
  callbackUrl: string;
}

export function ECPayConfigChecker() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ConfigCheckResult | null>(null);

  const checkConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay/config-check`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        
        if (data.configured) {
          toast.success(
            language === 'en' 
              ? '✅ ECPay is configured correctly!' 
              : '✅ ECPay 配置正確！'
          );
        } else {
          toast.warning(
            language === 'en' 
              ? '⚠️ Some ECPay settings are missing' 
              : '⚠️ 部分 ECPay 設定缺失'
          );
        }
      } else {
        toast.error('Failed to check configuration');
      }
    } catch (error: any) {
      console.error('Config check error:', error);
      toast.error('配置檢查失敗');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === '✅ Set') {
      return <Badge className="bg-green-50 text-green-700 border-green-300">✅ 已設定</Badge>;
    } else {
      return <Badge className="bg-red-50 text-red-700 border-red-300">❌ 缺失</Badge>;
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Settings className="h-5 w-5" />
          {language === 'en' ? 'ECPay Configuration Checker' : 'ECPay 配置檢查'}
        </CardTitle>
        <CardDescription>
          {language === 'en'
            ? 'Check if all required ECPay environment variables are set'
            : '檢查是否已設定所有必要的 ECPay 環境變數'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={checkConfiguration}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {language === 'en' ? 'Checking...' : '檢查中...'}
            </>
          ) : (
            <>
              <Settings className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Check Configuration' : '檢查配置'}
            </>
          )}
        </Button>

        {config && (
          <div className="space-y-3 mt-4">
            {/* Overall Status */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2">
              <span className="font-semibold text-gray-900">
                {language === 'en' ? 'Overall Status' : '整體狀態'}
              </span>
              {config.configured ? (
                <Badge className="bg-green-50 text-green-700 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {language === 'en' ? 'Configured' : '已配置'}
                </Badge>
              ) : (
                <Badge className="bg-red-50 text-red-700 border-red-300">
                  <XCircle className="h-3 w-3 mr-1" />
                  {language === 'en' ? 'Incomplete' : '不完整'}
                </Badge>
              )}
            </div>

            {/* Environment Mode */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <span className="text-sm text-gray-700">
                {language === 'en' ? 'Environment Mode' : '環境模式'}
              </span>
              <Badge 
                className={
                  config.mode === 'production' 
                    ? "bg-green-50 text-green-700 border-green-300" 
                    : "bg-yellow-50 text-yellow-700 border-yellow-300"
                }
              >
                {config.mode === 'production' ? '🚀 生產環境' : '🧪 測試環境'}
              </Badge>
            </div>

            {/* Merchant ID */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <span className="text-sm text-gray-700">ECPAY_MERCHANT_ID</span>
              {getStatusBadge(config.merchantId)}
            </div>

            {/* Hash Key */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <span className="text-sm text-gray-700">ECPAY_HASH_KEY</span>
              {getStatusBadge(config.hashKey)}
            </div>

            {/* Hash IV */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <span className="text-sm text-gray-700">ECPAY_HASH_IV</span>
              {getStatusBadge(config.hashIV)}
            </div>

            {/* API URL */}
            <div className="p-3 bg-white rounded-lg border space-y-2">
              <span className="text-sm font-semibold text-gray-700">
                {language === 'en' ? 'Payment API URL' : '付款 API URL'}
              </span>
              <code className="block text-xs bg-gray-100 p-2 rounded break-all">
                {config.apiUrl}
              </code>
            </div>

            {/* Callback URL */}
            <div className="p-3 bg-white rounded-lg border space-y-2">
              <span className="text-sm font-semibold text-gray-700">
                {language === 'en' ? 'Callback URL (ReturnURL)' : '回調 URL (ReturnURL)'}
              </span>
              <code className="block text-xs bg-gray-100 p-2 rounded break-all">
                {config.callbackUrl}
              </code>
              <p className="text-xs text-gray-600">
                💡 {language === 'en' 
                  ? 'This URL is automatically sent to ECPay with each payment request'
                  : '此 URL 會在每次付款請求時自動傳送給 ECPay'}
              </p>
            </div>
          </div>
        )}

        {/* Configuration Guide */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-900">
            📚 {language === 'en' ? 'Required Environment Variables:' : '必要的環境變數：'}
          </p>
          <div className="space-y-2 text-xs text-amber-800">
            <div className="flex items-start gap-2">
              <span className="font-mono bg-amber-100 px-2 py-1 rounded">ECPAY_MERCHANT_ID</span>
              <span>- 商店代號（從 ECPay 後台「廠商資訊」取得）</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-amber-100 px-2 py-1 rounded">ECPAY_HASH_KEY</span>
              <span>- HashKey（從 ECPay 後台「系統介接設定」取得）</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-amber-100 px-2 py-1 rounded">ECPAY_HASH_IV</span>
              <span>- HashIV（從 ECPay 後台「系統介接設定」取得）</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-amber-100 px-2 py-1 rounded">ECPAY_MODE</span>
              <span>- 環境模式（'sandbox' 或 'production'）</span>
            </div>
          </div>
        </div>

        {/* ECPay Backend Access Guide */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-900">
            🔑 {language === 'en' ? 'How to get Hash Key & Hash IV:' : '如何取得 Hash Key & Hash IV：'}
          </p>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>登入 <a href="https://vendor-stage.ecpay.com.tw/" target="_blank" rel="noopener noreferrer" className="underline">ECPay 測試環境後台</a> 或 <a href="https://www.ecpay.com.tw/" target="_blank" rel="noopener noreferrer" className="underline">正式環境後台</a></li>
            <li>點擊左側選單「系統設定」</li>
            <li>查看「廠商資訊」區域</li>
            <li>找到「HashKey」和「HashIV」</li>
            <li>如果沒有看到，點擊「產生 Hash Key」或聯繫客服</li>
          </ol>
        </div>

        {/* Warning for Test Environment */}
        {config && config.mode === 'sandbox' && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-900">
                  ⚠️ {language === 'en' ? 'Test Environment Notice' : '測試環境注意事項'}
                </p>
                <p className="text-xs text-yellow-800 mt-1">
                  {language === 'en' 
                    ? 'You are using ECPay test environment. Automatic callback (ReturnURL) may not work reliably. Please use the manual confirmation tool after payment.'
                    : '您正在使用 ECPay 測試環境。自動回調 (ReturnURL) 可能無法可靠運作。請在付款後使用手動確認工具。'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
