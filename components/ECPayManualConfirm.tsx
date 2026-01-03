import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle2, XCircle, RefreshCw, DollarSign } from 'lucide-react';

interface ECPayPayment {
  id: string;
  user_email: string;
  payment_type: string;
  amount_twd: number;
  amount_usd: number;
  status: string;
  ecpay_transaction_id: string;
  notes: string;
  created_at: string;
}

export function ECPayManualConfirm() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [payments, setPayments] = useState<ECPayPayment[]>([]);
  const [showPayments, setShowPayments] = useState(false);

  const getHeaders = () => {
    const isDevMode = accessToken?.startsWith('dev-user-');
    return isDevMode
      ? { 
          'X-Dev-Token': accessToken,
          'Authorization': `Bearer ${publicAnonKey}`
        }
      : { 'Authorization': `Bearer ${accessToken}` };
  };

  // 獲取我的待確認付款
  const loadMyPendingPayments = async () => {
    if (!user?.id || !accessToken) {
      toast.error('請先登入');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay-payments?status=pending&userEmail=${user.email}`,
        {
          headers: getHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setShowPayments(true);
        
        if (data.payments?.length === 0) {
          toast.info(
            language === 'en' 
              ? 'No pending payments found' 
              : '沒有找到待確認的付款記錄'
          );
        }
      } else {
        const error = await response.json();
        toast.error(error.error || '載入失敗');
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('載入付款記錄失敗');
    } finally {
      setLoading(false);
    }
  };

  // 手動確認付款
  const handleConfirmPayment = async (paymentId: string) => {
    if (!accessToken) {
      toast.error('請先登入');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay-payments/${paymentId}/confirm`,
        {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notes: 'Manual confirmation by user',
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(
          language === 'en'
            ? `✅ Payment confirmed! $${data.payment?.amount_usd} added to wallet`
            : `✅ 付款已確認！已將 $${data.payment?.amount_usd} USD 加入錢包`
        );
        
        // 刷新付款列表
        await loadMyPendingPayments();
        
        // 觸發錢包刷新
        window.dispatchEvent(new CustomEvent('refreshWallet'));
      } else {
        const error = await response.json();
        toast.error(error.error || '確認失敗');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('確認付款失敗');
    } finally {
      setLoading(false);
    }
  };

  // 根據訂單號查詢
  const handleQueryByOrderId = async () => {
    if (!orderId.trim()) {
      toast.error(
        language === 'en'
          ? 'Please enter order ID'
          : '請輸入訂單編號'
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay-payments/by-order/${orderId}`,
        {
          headers: getHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.payment) {
          setPayments([data.payment]);
          setShowPayments(true);
        } else {
          toast.error('未找到訂單');
        }
      } else {
        const error = await response.json();
        toast.error(error.error || '查詢失敗');
      }
    } catch (error) {
      console.error('Error querying payment:', error);
      toast.error('查詢訂單失敗');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">⏳ 待確認</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">✅ 已確認</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">❌ 已拒絕</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <DollarSign className="h-5 w-5" />
          💰 {language === 'en' ? 'Manual Payment Confirmation' : '手動確認付款'}
        </CardTitle>
        <CardDescription>
          {language === 'en'
            ? 'If your wallet balance was not updated after payment, manually confirm it here'
            : '如果付款後錢包餘額未更新，請在此手動確認'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 方案 1: 查看我的待確認付款 */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-purple-900">
            🔍 {language === 'en' ? 'Option 1: View My Pending Payments' : '方案 1：查看我的待確認付款'}
          </Label>
          <Button
            onClick={loadMyPendingPayments}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {language === 'en' ? 'Load My Payments' : '載入我的付款記錄'}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gradient-to-r from-purple-50 to-blue-50 px-2 text-gray-500">
              {language === 'en' ? 'OR' : '或'}
            </span>
          </div>
        </div>

        {/* 方案 2: 輸入訂單編號查詢 */}
        <div className="space-y-2">
          <Label htmlFor="orderId" className="text-sm font-semibold text-purple-900">
            🎫 {language === 'en' ? 'Option 2: Search by Order ID' : '方案 2：根據訂單編號查詢'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="orderId"
              placeholder={language === 'en' ? 'Enter ECPay order ID (e.g., CW1234567890ABC)' : '輸入綠界訂單編號（例如：CW1234567890ABC）'}
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleQueryByOrderId}
              disabled={loading || !orderId.trim()}
              variant="outline"
              className="border-purple-300"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>{language === 'en' ? 'Query' : '查詢'}</>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-600">
            💡 {language === 'en' 
              ? 'You can find the order ID in the URL after payment (orderId=...)'
              : '訂單編號可以在付款後的網址中找到（orderId=...）'}
          </p>
        </div>

        {/* 付款列表 */}
        {showPayments && (
          <div className="mt-6 space-y-3">
            <Label className="text-sm font-semibold text-purple-900">
              📋 {language === 'en' ? 'Payment Records' : '付款記錄'}
            </Label>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <XCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>{language === 'en' ? 'No payment records found' : '未找到付款記錄'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <Card key={payment.id} className="border-2">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {payment.ecpay_transaction_id}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(payment.created_at).toLocaleString()}
                          </p>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                      
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="text-2xl font-bold text-purple-700">
                            NT${payment.amount_twd.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            ≈ ${payment.amount_usd.toFixed(2)} USD
                          </p>
                        </div>
                        
                        {payment.status === 'pending' && (
                          <Button
                            onClick={() => handleConfirmPayment(payment.id)}
                            disabled={loading}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                            )}
                            {language === 'en' ? 'Confirm' : '確認入帳'}
                          </Button>
                        )}
                        
                        {payment.status === 'confirmed' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {language === 'en' ? 'Completed' : '已完成'}
                          </Badge>
                        )}
                      </div>
                      
                      {payment.notes && (
                        <p className="text-xs text-gray-500 border-t pt-2">
                          📝 {payment.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 說明 */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-900">
            ℹ️ {language === 'en' ? 'How it works:' : '使用說明：'}
          </p>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>{language === 'en' ? 'Complete payment via ECPay' : '透過綠界完成付款'}</li>
            <li>{language === 'en' ? 'Click "Load My Payments" to view pending payments' : '點擊「載入我的付款記錄」查看待確認付款'}</li>
            <li>{language === 'en' ? 'Click "Confirm" to update your wallet balance' : '點擊「確認入帳」手動更新錢包餘額'}</li>
            <li>{language === 'en' ? 'Balance will be updated immediately' : '餘額將立即更新'}</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
