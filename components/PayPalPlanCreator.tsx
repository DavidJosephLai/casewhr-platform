import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, CheckCircle, XCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

function PayPalPlanCreator() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const createYearlyPlans = async () => {
    setLoading(true);
    setResults(null);

    try {
      // Pro Yearly Plan
      console.log('🔵 Creating Pro Yearly Plan...');
      const proResponse = await fetch('/api/paypal/create-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'CaseWHR Pro - Yearly',
          description: 'Professional plan with 10% platform fee - Annual billing',
          price: '150',
          currency: 'USD',
          interval: 'YEAR',
          frequency: 1,
        }),
      });

      const proData = await proResponse.json();

      // Enterprise Yearly Plan
      console.log('🔵 Creating Enterprise Yearly Plan...');
      const enterpriseResponse = await fetch('/api/paypal/create-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'CaseWHR Enterprise - Yearly',
          description: 'Enterprise plan with 5% platform fee - Annual billing',
          price: '450',
          currency: 'USD',
          interval: 'YEAR',
          frequency: 1,
        }),
      });

      const enterpriseData = await enterpriseResponse.json();

      setResults({
        pro: proData,
        enterprise: enterpriseData,
      });

      toast.success('✅ Yearly plans created successfully!');
    } catch (error: any) {
      console.error('❌ Error creating plans:', error);
      toast.error(`Failed to create plans: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('✅ Copied to clipboard!');
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔵 PayPal 年付方案創建工具</CardTitle>
          <CardDescription>
            自動創建 Pro 和 Enterprise 的年付訂閱方案
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 使用說明</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>確保 PayPal API 憑證已在 Supabase 設置</li>
              <li>點擊下方按鈕創建年付方案</li>
              <li>複製生成的 Plan ID</li>
              <li>在 Supabase 設置環境變數</li>
            </ol>
          </div>

          {/* Manual Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">🛠️ 手動創建步驟</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-medium mb-2">1️⃣ 登入 PayPal Business Account</p>
                <a 
                  href="https://www.paypal.com/businessprofile/settings" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://www.paypal.com/businessprofile/settings
                </a>
              </div>

              <div>
                <p className="font-medium mb-2">2️⃣ 前往訂閱管理</p>
                <p>點擊：Products & Services → Subscriptions → Create Plan</p>
              </div>

              <div>
                <p className="font-medium mb-2">3️⃣ 創建 Pro 年付方案</p>
                <div className="bg-white border rounded p-3 space-y-1 font-mono text-xs">
                  <p><strong>Plan Name:</strong> CaseWHR Pro - Yearly</p>
                  <p><strong>Description:</strong> Professional plan - Annual billing</p>
                  <p><strong>Price:</strong> $150 USD</p>
                  <p><strong>Billing Cycle:</strong> Every 1 Year</p>
                  <p><strong>Product Type:</strong> Digital Goods</p>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2">4️⃣ 創建 Enterprise 年付方案</p>
                <div className="bg-white border rounded p-3 space-y-1 font-mono text-xs">
                  <p><strong>Plan Name:</strong> CaseWHR Enterprise - Yearly</p>
                  <p><strong>Description:</strong> Enterprise plan - Annual billing</p>
                  <p><strong>Price:</strong> $450 USD</p>
                  <p><strong>Billing Cycle:</strong> Every 1 Year</p>
                  <p><strong>Product Type:</strong> Digital Goods</p>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2">5️⃣ 複製 Plan ID</p>
                <p>創建成功後，PayPal 會顯示 Plan ID（格式：P-XXXXXXXXXXXXXXXXX）</p>
              </div>

              <div>
                <p className="font-medium mb-2">6️⃣ 在 Supabase 設置環境變數</p>
                <div className="bg-white border rounded p-3 space-y-1 font-mono text-xs">
                  <p>PAYPAL_PRO_YEARLY_PLAN_ID=P-XXXXXXXXXXXXXXXXX</p>
                  <p>PAYPAL_ENTERPRISE_YEARLY_PLAN_ID=P-XXXXXXXXXXXXXXXXX</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Plan IDs */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">📌 目前的 Plan ID</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between bg-white p-2 rounded">
                <span className="text-gray-700">Pro 月付：</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    P-24193930M7354211WNF33BOA
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('P-24193930M7354211WNF33BOA')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white p-2 rounded">
                <span className="text-gray-700">Enterprise 月付：</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    P-6R584025SB253261BNF33PDI
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('P-6R584025SB253261BNF33PDI')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                <span className="text-green-700 font-semibold">✅ Pro 年付：</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-green-100 px-2 py-1 rounded font-semibold">
                    P-8R6038908D0666614NF364XA
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('P-8R6038908D0666614NF364XA')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                <span className="text-green-700 font-semibold">✅ Enterprise 年付：</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-green-100 px-2 py-1 rounded font-semibold">
                    P-5PG7025386205482MNF367HI
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('P-5PG7025386205482MNF367HI')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          {results && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                ✅ 創建成功！
              </h3>
              <div className="space-y-3">
                {results.pro?.id && (
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-1">Pro 年付 Plan ID：</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded font-mono">
                        {results.pro.id}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(results.pro.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {results.enterprise?.id && (
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-1">Enterprise 年付 Plan ID：</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded font-mono">
                        {results.enterprise.id}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(results.enterprise.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                  <p className="text-xs text-blue-800 font-medium mb-2">
                    📋 下一步：在 Supabase 設置這些環境變數
                  </p>
                  <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`PAYPAL_PRO_YEARLY_PLAN_ID=${results.pro?.id || 'PLAN_ID_HERE'}
PAYPAL_ENTERPRISE_YEARLY_PLAN_ID=${results.enterprise?.id || 'PLAN_ID_HERE'}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">🔗 快速連結</h3>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://www.paypal.com/billing/plans"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                📊 PayPal Subscriptions Dashboard →
              </a>
              <a
                href="https://developer.paypal.com/dashboard/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                🔧 PayPal Developer Dashboard →
              </a>
              <a
                href="https://www.paypal.com/businessprofile/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                ⚙️ PayPal Business Settings →
              </a>
              <a
                href="https://supabase.com/dashboard/project/bihplitfentxioxyjalb/settings/functions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                🔐 Supabase Edge Functions Secrets →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Reference */}
      <Card>
        <CardHeader>
          <CardTitle>💰 定價參考</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-blue-600 mb-2">Pro 方案</h4>
              <div className="space-y-1 text-sm">
                <p>月付：$15 USD</p>
                <p className="font-semibold text-green-600">年付：$150 USD (省 20%)</p>
                <p className="text-xs text-gray-500">平均每月：$12.5 USD</p>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-purple-600 mb-2">Enterprise 方案</h4>
              <div className="space-y-1 text-sm">
                <p>月付：$45 USD</p>
                <p className="font-semibold text-green-600">年付：$450 USD (省 20%)</p>
                <p className="text-xs text-gray-500">平均每月：$37.5 USD</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PayPalPlanCreator;