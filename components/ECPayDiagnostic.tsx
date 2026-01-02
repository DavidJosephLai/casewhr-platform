import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';

export function ECPayDiagnostic() {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostic = async () => {
    if (!user || !accessToken) {
      setResults({ error: 'Please log in first' });
      return;
    }

    setLoading(true);
    try {
      // 1. Check wallet
      const walletRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      const walletData = await walletRes.json();

      // 2. Check ECPay payments
      const paymentsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay-payments/my-payments`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      const paymentsData = await paymentsRes.json();

      // 3. Check transactions
      const transactionsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/transactions`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      const transactionsData = await transactionsRes.json();

      setResults({
        wallet: walletData,
        payments: paymentsData,
        transactions: transactionsData,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (error: any) {
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle>🔍 ECPay 診斷工具</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostic} disabled={loading}>
          {loading ? '診斷中...' : '開始診斷'}
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">用戶信息：</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(results.user, null, 2)}
              </pre>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">錢包數據：</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(results.wallet, null, 2)}
              </pre>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">ECPay 付款記錄：</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(results.payments, null, 2)}
              </pre>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">交易記錄：</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(results.transactions, null, 2)}
              </pre>
            </div>

            {results.error && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-red-700">錯誤：</h3>
                <p className="text-sm text-red-600">{results.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
