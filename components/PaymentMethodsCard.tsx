import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CreditCard, Trash2, Plus, Check, Loader2 } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { AddPaymentMethodDialog } from "./AddPaymentMethodDialog";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'credit_card' | 'paypal' | 'line_pay';
  is_default: boolean;
  created_at: string;
  updated_at: string;
  
  // Credit card fields
  brand?: string;
  last_four?: string;
  expiry_month?: string;
  expiry_year?: string;
  cardholder_name?: string;
  
  // PayPal fields
  paypal_email?: string;
  masked_email?: string;
  
  // LINE Pay fields
  line_pay_id?: string;
  masked_line_pay_id?: string;
}

export function PaymentMethodsCard() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (user && accessToken) {
      fetchPaymentMethods();
    } else {
      console.log('⚠️ [PaymentMethodsCard] Waiting for auth...', { hasUser: !!user, hasToken: !!accessToken });
      setLoading(false);
    }
  }, [user, accessToken]);

  const fetchPaymentMethods = async () => {
    if (!user || !accessToken) {
      console.log('ℹ️ [PaymentMethodsCard] No user or access token - user not logged in');
      setLoading(false);
      return;
    }
    
    console.log('🔍 [PaymentMethodsCard] Fetching payment methods for user:', user.id);
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment-methods/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [PaymentMethodsCard] Payment methods loaded:', data.payment_methods?.length || 0);
        setPaymentMethods(data.payment_methods || []);
      } else {
        // 401 錯誤時靜默處理，不顯示警告
        if (response.status !== 401) {
          console.warn('⚠️ [PaymentMethodsCard] Failed to fetch payment methods: ' + response.status);
        }
        // 設置為空數組
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('❌ [PaymentMethodsCard] Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    if (!user || !accessToken) return;
    
    setActionLoading(methodId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment-methods/${methodId}/set-default`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        await fetchPaymentMethods();
        toast.success(
          language === 'en' 
            ? 'Default payment method updated' 
            : '已更新默認支付方式'
        );
      } else {
        throw new Error('Failed to set default');
      }
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to update default payment method' 
          : '更新默認支付方式失敗'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (methodId: string, isDefault: boolean) => {
    if (!user || !accessToken) return;
    
    if (!confirm(
      language === 'en' 
        ? 'Are you sure you want to delete this payment method?' 
        : '確定要刪除此支付方式嗎？'
    )) {
      return;
    }

    setActionLoading(methodId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment-methods/${methodId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        await fetchPaymentMethods();
        toast.success(
          language === 'en' 
            ? 'Payment method deleted' 
            : '支付方式已刪除'
        );
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to delete payment method' 
          : '刪除支付方式失敗'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    // In a real app, you would use brand-specific icons
    return <CreditCard className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {language === 'en' ? 'Payment Methods' : '支付方式'}
              </CardTitle>
              <CardDescription className="mt-1">
                {language === 'en' 
                  ? 'Manage your payment methods for subscriptions' 
                  : '管理您的訂閱支付方式'}
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Add' : '添加'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                {language === 'en' 
                  ? 'No payment methods added yet' 
                  : '尚未添加支付方式'}
              </p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Add Payment Method' : '添加支付方式'}
              </Button>
            </div>
          ) : (
            paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`border rounded-lg p-4 ${
                  method.is_default ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {method.type === 'credit_card' ? (
                        getCardBrandIcon(method.brand || 'Unknown')
                      ) : method.type === 'paypal' ? (
                        <div className="h-5 w-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                          P
                        </div>
                      ) : (
                        <div className="h-5 w-5 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
                          L
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {method.type === 'credit_card' ? (
                          <>
                            <span className="font-medium">
                              {method.brand} •••• {method.last_four}
                            </span>
                            {method.is_default && (
                              <Badge variant="default" className="text-xs">
                                {language === 'en' ? 'Default' : '默認'}
                              </Badge>
                            )}
                          </>
                        ) : method.type === 'paypal' ? (
                          <>
                            <span className="font-medium">PayPal</span>
                            {method.is_default && (
                              <Badge variant="default" className="text-xs">
                                {language === 'en' ? 'Default' : '默認'}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="font-medium">LINE Pay</span>
                            {method.is_default && (
                              <Badge variant="default" className="text-xs">
                                {language === 'en' ? 'Default' : '默認'}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      
                      {method.type === 'credit_card' ? (
                        <p className="text-sm text-gray-600 mt-1">
                          {method.cardholder_name}
                          {' • '}
                          {language === 'en' ? 'Expires' : '到期'} {method.expiry_month}/{method.expiry_year}
                        </p>
                      ) : method.type === 'paypal' ? (
                        <p className="text-sm text-gray-600 mt-1">
                          {method.masked_email}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600 mt-1">
                          ID: {method.masked_line_pay_id || '•••••'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        disabled={actionLoading === method.id}
                      >
                        {actionLoading === method.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            {language === 'en' ? 'Set Default' : '設為默認'}
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(method.id, method.is_default)}
                      disabled={actionLoading === method.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {actionLoading === method.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AddPaymentMethodDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false);
          fetchPaymentMethods();
        }}
      />
    </>
  );
}