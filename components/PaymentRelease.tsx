import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DollarSign, Lock, CheckCircle2, AlertCircle, Loader2, BadgePercent } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { formatCurrencyAuto, type Currency } from '../lib/currency';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface PaymentReleaseProps {
  projectId: string;
  projectStatus: string;
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
  onPaymentReleased?: () => void;
}

interface Escrow {
  id: string;
  project_id: string;
  client_id: string;
  freelancer_id: string;
  amount: number;
  status: 'locked' | 'released' | 'refunded';
  description: string;
  created_at: string;
  updated_at: string;
  released_at?: string;
}

export function PaymentRelease({ 
  projectId: projectIdProp, 
  projectStatus,
  language = 'en',
  onPaymentReleased 
}: PaymentReleaseProps) {
  const { user, accessToken } = useAuth();
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // ⭐ Escrow 金額統一以 TWD 儲存
  const storedCurrency: Currency = 'TWD';

  const translations = {
    en: {
      title: 'Payment Release',
      pendingPayment: 'Waiting for Payment Release',
      escrowLocked: 'Funds are locked in escrow',
      escrowReleased: 'Payment Released',
      amount: 'Amount',
      releasePayment: '✅ Confirm & Release Payment',
      releasing: 'Releasing Payment...',
      confirmTitle: '⚠️ Confirm Payment Release',
      confirmDesc: 'Please review the amount and confirm you want to release payment to the freelancer. Once confirmed, this action cannot be undone and the funds will be transferred immediately.',
      confirmButton: 'Confirm & Release',
      cancel: 'Cancel',
      successTitle: 'Payment Released!',
      successDesc: 'The payment has been successfully released to the freelancer.',
      errorTitle: 'Error',
      errorDesc: 'Failed to release payment. Please try again.',
      notReady: 'Deliverables must be approved before releasing payment.',
      alreadyReleased: 'Payment has already been released.',
      info: {
        pending: 'Review and approve all deliverables before releasing payment.',
        ready: '✅ All deliverables approved! Click the button below to confirm and release payment to the freelancer.',
        released: 'Payment has been released to the freelancer.',
      },
    },
    zh: {
      title: '撥款確認',
      pendingPayment: '等待撥款確認',
      escrowLocked: '資金托管中',
      escrowReleased: '已撥款',
      amount: '金額',
      releasePayment: '✅ 確認並撥款',
      releasing: '撥款處理中...',
      confirmTitle: '⚠️ 確認撥款',
      confirmDesc: '請仔細檢查金額，確認要將款項撥給接案者。一旦確認，此操作無法撤銷，款項將立即轉帳。',
      confirmButton: '確認並撥款',
      cancel: '取消',
      successTitle: '撥款成功！',
      successDesc: '款項已成功撥給接案者。',
      errorTitle: '錯誤',
      errorDesc: '撥款失敗，請重試。',
      notReady: '必須先批准所有交付物才能撥款。',
      alreadyReleased: '款項已經撥出。',
      info: {
        pending: '請先審核並批准所有交付物，然後再撥款。',
        ready: '✅ 所有交付物已批准！請點擊下方按鈕確認並撥款給接案者。',
        released: '款項已撥給接案者。',
      },
    },
  };

  const t = translations[language];

  useEffect(() => {
    fetchEscrow();
  }, [projectIdProp]);

  const fetchEscrow = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment/escrow/project/${projectIdProp}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch escrow');
      }

      const data = await response.json();
      setEscrow(data.escrow);
    } catch (error) {
      console.error('Error fetching escrow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    setReleasing(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment/escrow/release`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            project_id: projectIdProp,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to release payment');
      }

      toast.success(t.successTitle, {
        description: t.successDesc,
      });

      // Refresh escrow status
      await fetchEscrow();

      // Callback to refresh parent component
      if (onPaymentReleased) {
        onPaymentReleased();
      }
    } catch (error: any) {
      console.error('Release payment error:', error);
      toast.error(t.errorTitle, {
        description: error.message || t.errorDesc,
      });
    } finally {
      setReleasing(false);
      setShowConfirmDialog(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  // No escrow found
  if (!escrow) {
    return null;
  }

  // Already released
  if (escrow.status === 'released') {
    return (
      <Card className="p-6 border-2 border-green-200 bg-green-50">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-6 text-green-600" />
              <div>
                <h3 className="text-sm">{t.title}</h3>
                <Badge className="mt-1 bg-green-600">{t.escrowReleased}</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-900">{t.amount}</p>
              <p className="text-2xl text-green-600">{formatCurrencyAuto(escrow.amount, storedCurrency, language)}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-green-300 bg-white/50">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 mt-0.5 text-green-600" />
              <p className="text-sm text-green-900">{t.info.released}</p>
            </div>
          </div>

          {escrow.released_at && (
            <p className="text-xs text-green-700">
              {language === 'en' ? 'Released at:' : '撥款時間：'} 
              {new Date(escrow.released_at).toLocaleString(language === 'en' ? 'en-US' : 'zh-TW')}
            </p>
          )}
        </div>
      </Card>
    );
  }

  // Pending payment - show release button
  const canRelease = projectStatus === 'pending_payment';

  return (
    <>
      <Card className={`p-6 border-2 ${canRelease ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className={`size-6 ${canRelease ? 'text-blue-600' : 'text-orange-600'}`} />
              <div>
                <h3 className="text-sm">{t.title}</h3>
                <Badge className={canRelease ? 'bg-blue-600' : 'bg-orange-600'}>
                  {canRelease ? t.pendingPayment : t.escrowLocked}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm ${canRelease ? 'text-blue-900' : 'text-orange-900'}`}>{t.amount}</p>
              <p className={`text-2xl ${canRelease ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrencyAuto(escrow.amount, storedCurrency, language)}
              </p>
            </div>
          </div>

          {/* Info Alert */}
          <div className={`p-3 rounded-lg border ${canRelease ? 'border-blue-300 bg-white/50' : 'border-orange-300 bg-white/50'}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`size-4 mt-0.5 ${canRelease ? 'text-blue-600' : 'text-orange-600'}`} />
              <p className={`text-sm ${canRelease ? 'text-blue-900' : 'text-orange-900'}`}>
                {canRelease ? t.info.ready : t.info.pending}
              </p>
            </div>
          </div>

          {/* Release Button */}
          {canRelease && (
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={releasing}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              size="lg"
            >
              {releasing ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t.releasing}
                </>
              ) : (
                <>
                  <DollarSign className="size-4 mr-2" />
                  {t.releasePayment}
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <DollarSign className="size-5 text-blue-600" />
              {t.confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm">
              <strong>{t.amount}:</strong> {formatCurrencyAuto(escrow.amount, storedCurrency, language)}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={releasing}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReleasePayment}
              disabled={releasing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {releasing ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t.releasing}
                </>
              ) : (
                t.confirmButton
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}