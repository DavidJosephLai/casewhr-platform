import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Loader2, RefreshCw, Wallet, Lock, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface WalletDiagnosticsProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function WalletDiagnostics({ language = 'en' }: WalletDiagnosticsProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);

  const fetchWalletDetails = async () => {
    if (!user || !accessToken) return;

    setLoading(true);
    try {
      // Get wallet
      const walletResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment/wallet`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        
        // Get transactions
        const txResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment/transactions`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          }
        );

        let transactions = [];
        if (txResponse.ok) {
          const txData = await txResponse.json();
          transactions = txData.transactions || [];
        }

        setWalletData({
          wallet: walletData.wallet,
          transactions: transactions.slice(0, 10), // Last 10 transactions
        });
      }
    } catch (error) {
      console.error('Error fetching wallet details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, [user, accessToken]);

  if (!user) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-green-900">
            💰 Wallet Diagnostics
          </h3>
          <Button
            onClick={fetchWalletDetails}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        </div>

        {walletData ? (
          <div className="space-y-4">
            {/* Wallet Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="size-5 text-green-600" />
                  <span className="text-sm font-medium">Available Balance</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(walletData.wallet?.balance || 0)}
                </p>
              </div>

              <div className="p-4 bg-white border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="size-5 text-orange-600" />
                  <span className="text-sm font-medium">Locked (Escrow)</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(walletData.wallet?.locked || 0)}
                </p>
              </div>

              <div className="p-4 bg-white border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="size-5 text-blue-600" />
                  <span className="text-sm font-medium">Total Earned</span>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(walletData.wallet?.total_earned || 0)}
                </p>
              </div>

              <div className="p-4 bg-white border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="size-5 text-purple-600" />
                  <span className="text-sm font-medium">Total Spent</span>
                </div>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(walletData.wallet?.total_spent || 0)}
                </p>
              </div>
            </div>

            {/* Total Balance */}
            <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">Total Balance (Available + Locked)</p>
                  <p className="text-3xl font-bold text-green-900">
                    {formatCurrency((walletData.wallet?.balance || 0) + (walletData.wallet?.locked || 0))}
                  </p>
                </div>
                <Badge className="bg-green-600 text-lg px-3 py-1">
                  {walletData.wallet?.balance || 0} + {walletData.wallet?.locked || 0}
                </Badge>
              </div>
            </div>

            {/* Recent Transactions */}
            {walletData.transactions && walletData.transactions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-green-900">Recent Transactions:</h4>
                <div className="space-y-2">
                  {walletData.transactions.map((tx: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        tx.amount > 0
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {tx.type}
                            </Badge>
                            <span className="text-sm">{tx.description}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(tx.created_at).toLocaleString()}
                          </p>
                        </div>
                        <p
                          className={`text-lg font-bold ${
                            tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 How the wallet works:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li><strong>Available Balance</strong>: Money you can use or withdraw</li>
                <li><strong>Locked (Escrow)</strong>: Money held for active projects</li>
                <li><strong>When you post a project and accept a proposal</strong>: Money moves from Available → Locked</li>
                <li><strong>When you release payment</strong>: Money moves from Locked → Freelancer's Available</li>
                <li><strong>Total Balance</strong> = Available + Locked (your total funds)</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-green-600" />
          </div>
        )}
      </div>
    </Card>
  );
}