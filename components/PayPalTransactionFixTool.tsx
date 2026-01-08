import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function PayPalTransactionFixTool() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [fixResult, setFixResult] = useState<any>(null);

  // 只有平台擁有者可見
  const isPlatformOwner = user?.email === 'davidlai234@hotmail.com';

  if (!isPlatformOwner) {
    return null;
  }

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/verify-paypal-transactions`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVerifyResult(data);
        
        if (data.oldFormat === 0 && data.issues.length === 0) {
          toast.success(
            language === 'en'
              ? '✅ All PayPal transactions are in correct format!'
              : '✅ 所有 PayPal 交易記錄格式正確！'
          );
        } else {
          toast.warning(
            language === 'en'
              ? `⚠️ Found ${data.oldFormat} transactions in old format`
              : `⚠️ 發現 ${data.oldFormat} 筆舊格式交易記錄`
          );
        }
      } else {
        throw new Error('Failed to verify transactions');
      }
    } catch (error: any) {
      console.error('Error verifying transactions:', error);
      toast.error(
        language === 'en'
          ? 'Failed to verify transactions'
          : '驗證交易記錄失敗'
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleFix = async () => {
    if (!confirm(
      language === 'en'
        ? 'This will migrate all PayPal transactions to the new format. Continue?'
        : '這將遷移所有 PayPal 交易記錄到新格式。繼續？'
    )) {
      return;
    }

    setLoading(true);
    setFixResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/fix-paypal-transactions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFixResult(data);
        
        if (data.success) {
          toast.success(
            language === 'en'
              ? `✅ Successfully migrated ${data.migrated} transactions!`
              : `✅ 成功遷移 ${data.migrated} 筆交易記錄！`
          );
          
          // Re-verify after fix
          setTimeout(() => {
            handleVerify();
          }, 1000);
        } else {
          toast.error(
            language === 'en'
              ? 'Migration failed. Check console for details.'
              : '遷移失敗。請查看控制台詳情。'
          );
        }
      } else {
        throw new Error('Failed to fix transactions');
      }
    } catch (error: any) {
      console.error('Error fixing transactions:', error);
      toast.error(
        language === 'en'
          ? 'Failed to fix transactions'
          : '修復交易記錄失敗'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Info className="h-5 w-5" />
          {language === 'en' ? 'PayPal Transaction Format Tool' : 'PayPal 交易記錄格式工具'}
        </CardTitle>
        <CardDescription>
          {language === 'en'
            ? 'Verify and fix PayPal transaction key format (transaction: → transaction_)'
            : '驗證並修復 PayPal 交易記錄 key 格式（transaction: → transaction_）'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Box */}
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-sm">
          <p className="text-blue-900 font-semibold mb-1">
            {language === 'en' ? '🔧 What does this do?' : '🔧 這個工具的作用？'}
          </p>
          <ul className="text-blue-800 space-y-1 text-xs">
            <li>
              {language === 'en'
                ? '• Migrates old format: transaction:txn_xxx → transaction_txn_xxx'
                : '• 遷移舊格式：transaction:txn_xxx → transaction_txn_xxx'}
            </li>
            <li>
              {language === 'en'
                ? '• Normalizes field names: userId → user_id, createdAt → created_at'
                : '• 統一欄位名稱：userId → user_id, createdAt → created_at'}
            </li>
            <li>
              {language === 'en'
                ? '• Ensures PayPal transactions appear in transaction history'
                : '• 確保 PayPal 交易記錄正確顯示在交易歷史中'}
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleVerify}
            disabled={verifying}
            variant="outline"
            className="flex-1"
          >
            {verifying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Info className="h-4 w-4 mr-2" />
            )}
            {language === 'en' ? 'Verify Format' : '驗證格式'}
          </Button>

          <Button
            onClick={handleFix}
            disabled={loading || !verifyResult || verifyResult.oldFormat === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {language === 'en' ? 'Fix Transactions' : '修復交易'}
          </Button>
        </div>

        {/* Verify Result */}
        {verifyResult && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-xs text-gray-600 mb-1">
                  {language === 'en' ? 'Total' : '總數'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {verifyResult.totalTransactions}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs text-green-700 mb-1">
                  {language === 'en' ? 'Correct' : '正確'}
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {verifyResult.correctFormat}
                </p>
              </div>

              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="text-xs text-orange-700 mb-1">
                  {language === 'en' ? 'Old Format' : '舊格式'}
                </p>
                <p className="text-2xl font-bold text-orange-700">
                  {verifyResult.oldFormat}
                </p>
              </div>
            </div>

            {verifyResult.issues.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-yellow-900 mb-2">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  {language === 'en' ? 'Issues Found:' : '發現問題：'}
                </p>
                <ul className="text-xs text-yellow-800 space-y-1">
                  {verifyResult.issues.slice(0, 5).map((issue: string, i: number) => (
                    <li key={i}>• {issue}</li>
                  ))}
                  {verifyResult.issues.length > 5 && (
                    <li className="text-yellow-700">
                      ... {language === 'en' ? 'and' : '以及'} {verifyResult.issues.length - 5}{' '}
                      {language === 'en' ? 'more' : '個更多問題'}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Fix Result */}
        {fixResult && (
          <div
            className={`rounded-lg p-3 border ${
              fixResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <p
              className={`text-sm font-semibold mb-1 ${
                fixResult.success ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {fixResult.success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 inline mr-1" />
                  {language === 'en'
                    ? `Migration Complete: ${fixResult.migrated} transactions fixed`
                    : `遷移完成：已修復 ${fixResult.migrated} 筆交易`}
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  {language === 'en' ? 'Migration Failed' : '遷移失敗'}
                </>
              )}
            </p>

            {fixResult.errors && fixResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-red-800 mb-1">
                  {language === 'en' ? 'Errors:' : '錯誤：'}
                </p>
                <ul className="text-xs text-red-700 space-y-1">
                  {fixResult.errors.slice(0, 3).map((error: string, i: number) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-gray-600">
            {language === 'en' ? 'Status:' : '狀態：'}
          </span>
          <Badge
            variant={
              verifyResult?.oldFormat === 0 && verifyResult?.issues.length === 0
                ? 'default'
                : 'secondary'
            }
          >
            {verifyResult?.oldFormat === 0 && verifyResult?.issues.length === 0
              ? language === 'en'
                ? '✅ All Good'
                : '✅ 一切正常'
              : language === 'en'
              ? '⚠️ Needs Fix'
              : '⚠️ 需要修復'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
