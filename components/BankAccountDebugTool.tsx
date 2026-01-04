import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { projectId } from '../utils/supabase/info';
import { Loader2, Bug, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function BankAccountDebugTool() {
  const { user, accessToken } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Test form data
  const [country, setCountry] = useState('TW');
  const [accountType, setAccountType] = useState<'local' | 'international'>('local');
  const [bankName, setBankName] = useState('台灣銀行');
  const [accountNumber, setAccountNumber] = useState('1234567890');
  const [iban, setIban] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('測試用戶');
  const [swiftCode, setSwiftCode] = useState('');
  const [currency, setCurrency] = useState('TWD');

  const content = {
    en: {
      title: '🐛 Bank Account Debug Tool',
      description: 'Test adding bank accounts and view detailed error messages',
      testData: 'Test Data',
      accountType: 'Account Type',
      local: 'Local',
      international: 'International',
      country: 'Country',
      bankName: 'Bank Name',
      accountNumber: 'Account Number',
      iban: 'IBAN',
      accountHolderName: 'Account Holder Name',
      swiftCode: 'SWIFT Code',
      currency: 'Currency',
      testSubmit: 'Test Submit',
      testing: 'Testing...',
      results: 'Test Results',
      noResults: 'No test results yet. Click "Test Submit" to run a test.',
    },
    'zh-TW': {
      title: '🐛 銀行帳戶除錯工具',
      description: '測試添加銀行帳戶並查看詳細錯誤訊息',
      testData: '測試資料',
      accountType: '帳戶類型',
      local: '本地',
      international: '國際',
      country: '國家',
      bankName: '銀行名稱',
      accountNumber: '帳號',
      iban: 'IBAN',
      accountHolderName: '帳戶持有人',
      swiftCode: 'SWIFT 代碼',
      currency: '幣別',
      testSubmit: '測試提交',
      testing: '測試中...',
      results: '測試結果',
      noResults: '尚無測試結果。點擊「測試提交」執行測試。',
    },
    'zh-CN': {
      title: '🐛 银行账户除错工具',
      description: '测试添加银行账户并查看详细错误讯息',
      testData: '测试资料',
      accountType: '账户类型',
      local: '本地',
      international: '国际',
      country: '国家',
      bankName: '银行名称',
      accountNumber: '账号',
      iban: 'IBAN',
      accountHolderName: '账户持有人',
      swiftCode: 'SWIFT 代码',
      currency: '币别',
      testSubmit: '测试提交',
      testing: '测试中...',
      results: '测试结果',
      noResults: '尚无测试结果。点击「测试提交」执行测试。',
    },
  };

  const t = content[language as keyof typeof content] || content['en'];

  const handleTest = async () => {
    if (!user || !accessToken) {
      setResult({
        success: false,
        error: 'Not logged in',
        details: 'User or access token is missing',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        country,
        account_type: accountType,
        bank_name: bankName,
        account_number: accountType === 'local' ? accountNumber : undefined,
        iban: accountType === 'international' ? iban : undefined,
        account_holder_name: accountHolderName,
        swift_code: swiftCode || undefined,
        currency,
      };

      console.log('🧪 Testing bank account submission:', payload);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/bank-accounts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      setResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        payload,
        response: data,
        timestamp: new Date().toISOString(),
      });

      console.log('🧪 Test result:', {
        success: response.ok,
        status: response.status,
        data,
      });
    } catch (error: any) {
      console.error('🧪 Test error:', error);
      setResult({
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Form */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold">{t.testData}</h3>

          {/* Account Type */}
          <div className="space-y-2">
            <Label>{t.accountType}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={accountType === 'local' ? 'default' : 'outline'}
                onClick={() => setAccountType('local')}
                className="flex-1"
              >
                {t.local}
              </Button>
              <Button
                type="button"
                variant={accountType === 'international' ? 'default' : 'outline'}
                onClick={() => setAccountType('international')}
                className="flex-1"
              >
                {t.international}
              </Button>
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label>{t.country}</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TW">Taiwan (TWD)</SelectItem>
                <SelectItem value="US">United States (USD)</SelectItem>
                <SelectItem value="GB">United Kingdom (GBP)</SelectItem>
                <SelectItem value="HK">Hong Kong (HKD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Name */}
          <div className="space-y-2">
            <Label>{t.bankName}</Label>
            <Input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Bank of Taiwan"
            />
          </div>

          {/* Account Number or IBAN */}
          {accountType === 'local' ? (
            <div className="space-y-2">
              <Label>{t.accountNumber}</Label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="1234567890"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t.iban}</Label>
              <Input
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase())}
                placeholder="GB29NWBK60161331926819"
              />
            </div>
          )}

          {/* Account Holder Name */}
          <div className="space-y-2">
            <Label>{t.accountHolderName}</Label>
            <Input
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          {/* SWIFT Code */}
          <div className="space-y-2">
            <Label>{t.swiftCode}</Label>
            <Input
              value={swiftCode}
              onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
              placeholder="HSBCHKHH"
            />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label>{t.currency}</Label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="TWD"
            />
          </div>

          {/* Test Button */}
          <Button
            onClick={handleTest}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? t.testing : t.testSubmit}
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h3 className="font-semibold">{t.results}</h3>

          {!result ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{t.noResults}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {/* Success/Failure Badge */}
              <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className="font-semibold">
                  {result.success ? '✅ Success' : '❌ Failed'}
                  {result.status && ` (HTTP ${result.status})`}
                </AlertDescription>
              </Alert>

              {/* Payload Sent */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-semibold mb-2">📤 Payload Sent:</p>
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(result.payload, null, 2)}
                </pre>
              </div>

              {/* Response Received */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-sm font-semibold mb-2">📥 Response Received:</p>
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(result.response || result.error, null, 2)}
                </pre>
              </div>

              {/* Error Details */}
              {!result.success && result.response?.error && (
                <Alert className="border-red-300 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="font-semibold text-red-900 mb-1">Error Message:</div>
                    <div className="text-red-700">{result.response.error}</div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Timestamp */}
              <p className="text-xs text-gray-500">
                🕐 {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
