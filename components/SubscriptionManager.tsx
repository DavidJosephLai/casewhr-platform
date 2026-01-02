import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { RefreshCcw, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner";

export function SubscriptionManager() {
  const { language } = useLanguage();
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    renewed: number;
    downgraded: number;
    failed: number;
    emails_sent: number;
  } | null>(null);

  const processRenewals = async () => {
    setProcessing(true);
    try {
      console.log('🔄 Processing subscription renewals...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/process-renewals`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to process renewals');
      }

      const result = await response.json();
      console.log('✅ Renewal processing result:', result);
      
      setLastResult(result);
      
      toast.success(
        language === 'en' 
          ? `Processing complete: ${result.renewed} renewed, ${result.downgraded} downgraded`
          : `處理完成：${result.renewed} 個續費，${result.downgraded} 個降級`,
        { duration: 5000 }
      );
      
    } catch (error) {
      console.error('❌ Error processing renewals:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to process subscription renewals'
          : '處理訂閱續費失敗'
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCcw className="h-5 w-5 text-blue-600" />
          {language === 'en' ? 'Subscription Renewal Manager' : '訂閱續費管理'}
        </CardTitle>
        <CardDescription>
          {language === 'en' 
            ? 'Manually trigger subscription renewal processing and automatic downgrades'
            : '手動觸發訂閱續費處理和自動降級'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            {language === 'en' ? 'How it works:' : '工作原理：'}
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              {language === 'en' 
                ? '1. Checks all active subscriptions with auto-renew enabled'
                : '1. 檢查所有啟用自動續訂的活躍訂閱'}
            </li>
            <li>
              {language === 'en' 
                ? '2. Attempts to charge wallet for expired subscriptions'
                : '2. 嘗試從錢包扣款以續訂到期的訂閱'}
            </li>
            <li>
              {language === 'en' 
                ? '3. Sends payment failure warning if balance is insufficient (7-day grace period)'
                : '3. 如果餘額不足，發送付款失敗警告（7天寬限期）'}
            </li>
            <li>
              {language === 'en' 
                ? '4. Automatically downgrades to Free plan after grace period expires'
                : '4. 寬限期結束後自動降級為免費方案'}
            </li>
            <li>
              {language === 'en' 
                ? '5. Sends email notifications for all actions'
                : '5. 為所有操作發送郵件通知'}
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <Button 
          onClick={processRenewals} 
          disabled={processing}
          className="w-full"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {language === 'en' ? 'Processing...' : '處理中...'}
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Process Renewals Now' : '立即處理續費'}
            </>
          )}
        </Button>

        {/* Last Result */}
        {lastResult && (
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium">
              {language === 'en' ? 'Last Processing Result:' : '上次處理結果：'}
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Renewed' : '已續費'}
                  </p>
                  <p className="text-xl font-bold text-green-600">{lastResult.renewed}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Downgraded' : '已降級'}
                  </p>
                  <p className="text-xl font-bold text-orange-600">{lastResult.downgraded}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Failed' : '失敗'}
                  </p>
                  <p className="text-xl font-bold text-red-600">{lastResult.failed}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Badge className="bg-blue-600">📧</Badge>
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Emails Sent' : '已發送郵件'}
                  </p>
                  <p className="text-xl font-bold text-blue-600">{lastResult.emails_sent}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scheduling Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>{language === 'en' ? '⏰ Automation Note:' : '⏰ 自動化說明：'}</strong>
            {' '}
            {language === 'en' 
              ? 'In production, this should be triggered automatically via a cron job (e.g., daily at midnight). For now, use this manual trigger for testing.'
              : '在生產環境中，這應該通過 cron job 自動觸發（例如，每天午夜）。目前請使用此手動觸發器進行測試。'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
