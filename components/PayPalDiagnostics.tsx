import { useEffect, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

export function PayPalDiagnostics() {
  const { language } = useLanguage();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPayPalConfig();
  }, []);

  const checkPayPalConfig = async () => {
    try {
      console.log('🔍 [PayPal 診斷] 檢查 PayPal 配置...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/paypal/config`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      console.log('📊 [PayPal 診斷] 配置資訊:', data);
      setConfig(data);
    } catch (error) {
      console.error('❌ [PayPal 診斷] 檢查失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-blue-900">
            {language === 'en' ? 'Checking PayPal configuration...' : '正在檢查 PayPal 配置...'}
          </span>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-2">
              {language === 'en' ? 'Configuration Check Failed' : '配置檢查失敗'}
            </h3>
            <p className="text-red-700">
              {language === 'en' 
                ? 'Unable to retrieve PayPal configuration. Please check your backend connection.' 
                : '無法獲取 PayPal 配置。請檢查後端連接。'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { configured, mode, clientIdSet, clientSecretSet } = config;

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className={`border rounded-lg p-6 ${configured ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-start gap-3">
          {configured ? (
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className={`font-semibold mb-2 ${configured ? 'text-green-900' : 'text-yellow-900'}`}>
              {language === 'en' ? 'PayPal Configuration Status' : 'PayPal 配置狀態'}
            </h3>
            <p className={configured ? 'text-green-700' : 'text-yellow-700'}>
              {configured
                ? (language === 'en' ? 'PayPal is configured and ready!' : 'PayPal 已配置完成！')
                : (language === 'en' ? 'PayPal is not fully configured.' : 'PayPal 尚未完全配置。')
              }
            </p>
          </div>
        </div>
      </div>

      {/* Mode Information */}
      <div className={`border rounded-lg p-6 ${mode === 'sandbox' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
        <div className="flex items-start gap-3">
          <Info className={`h-6 w-6 flex-shrink-0 mt-0.5 ${mode === 'sandbox' ? 'text-blue-600' : 'text-purple-600'}`} />
          <div className="flex-1">
            <h3 className={`font-semibold mb-2 ${mode === 'sandbox' ? 'text-blue-900' : 'text-purple-900'}`}>
              {language === 'en' ? 'Current Mode' : '當前模式'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  mode === 'sandbox' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {mode === 'sandbox' 
                    ? (language === 'en' ? '🧪 Sandbox (Test)' : '🧪 測試環境') 
                    : (language === 'en' ? '🚀 Live (Production)' : '🚀 正式環境')
                  }
                </span>
              </div>

              {mode === 'sandbox' ? (
                <div className="bg-blue-100 border border-blue-300 rounded p-4 space-y-2">
                  <p className="text-sm text-blue-900 font-medium">
                    ⚠️ {language === 'en' ? 'Important: Sandbox Mode Requirements' : '重要：測試環境要求'}
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>{language === 'en' ? 'You CANNOT use your real PayPal account' : '您不能使用真實的 PayPal 帳號'}</li>
                    <li>{language === 'en' ? 'You MUST create PayPal Sandbox test accounts' : '您必須創建 PayPal Sandbox 測試帳號'}</li>
                    <li>{language === 'en' ? 'Visit: developer.paypal.com → Sandbox → Accounts' : '訪問：developer.paypal.com → Sandbox → Accounts'}</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <p className="text-sm text-blue-900 font-medium mb-2">
                      📝 {language === 'en' ? 'How to create Sandbox accounts:' : '如何創建測試帳號：'}
                    </p>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>{language === 'en' ? 'Go to developer.paypal.com' : '前往 developer.paypal.com'}</li>
                      <li>{language === 'en' ? 'Click "Sandbox" → "Accounts"' : '點擊「Sandbox」→「Accounts」'}</li>
                      <li>{language === 'en' ? 'Create a "Personal" test account' : '創建「Personal」測試帳號'}</li>
                      <li>{language === 'en' ? 'Use those credentials to login' : '使用測試帳號憑證登入'}</li>
                    </ol>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <a
                      href="https://developer.paypal.com/dashboard/accounts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      🔗 {language === 'en' ? 'Open PayPal Developer Dashboard' : '打開 PayPal 開發者儀表板'}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-purple-100 border border-purple-300 rounded p-4 space-y-2">
                  <p className="text-sm text-purple-900 font-medium">
                    ✅ {language === 'en' ? 'Live Mode: Use Real PayPal Account' : '正式環境：使用真實 PayPal 帳號'}
                  </p>
                  <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                    <li>{language === 'en' ? 'You can use your real PayPal personal account' : '您可以使用真實的 PayPal 個人帳號'}</li>
                    <li>{language === 'en' ? 'Real money will be charged' : '將會扣除真實金額'}</li>
                    <li>{language === 'en' ? 'Make sure your API credentials are for Live mode' : '確保您的 API 憑證是正式環境的'}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Credentials Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`border rounded-lg p-4 ${clientIdSet ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {clientIdSet ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={`font-medium ${clientIdSet ? 'text-green-900' : 'text-red-900'}`}>
              Client ID
            </span>
          </div>
          <p className={`text-sm mt-1 ${clientIdSet ? 'text-green-700' : 'text-red-700'}`}>
            {clientIdSet 
              ? (language === 'en' ? 'Configured' : '已配置') 
              : (language === 'en' ? 'Not set' : '未設置')
            }
          </p>
        </div>

        <div className={`border rounded-lg p-4 ${clientSecretSet ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {clientSecretSet ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={`font-medium ${clientSecretSet ? 'text-green-900' : 'text-red-900'}`}>
              Client Secret
            </span>
          </div>
          <p className={`text-sm mt-1 ${clientSecretSet ? 'text-green-700' : 'text-red-700'}`}>
            {clientSecretSet 
              ? (language === 'en' ? 'Configured' : '已配置') 
              : (language === 'en' ? 'Not set' : '未設置')
            }
          </p>
        </div>
      </div>
    </div>
  );
}
