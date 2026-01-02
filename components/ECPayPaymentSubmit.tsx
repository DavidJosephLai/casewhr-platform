import { AlertCircle, CheckCircle, Upload, X, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '../utils/supabase/info';

interface ECPayPaymentSubmitProps {
  isOpen: boolean;
  onClose: () => void;
  paymentType: 'subscription' | 'deposit';
  amount?: number; // USD amount
  amountTWD?: number; // TWD amount
  plan?: string; // For subscription
  onSuccess?: () => void;
}

export function ECPayPaymentSubmit({ 
  isOpen, 
  onClose, 
  paymentType, 
  amount, 
  amountTWD,
  plan,
  onSuccess 
}: ECPayPaymentSubmitProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    transactionId: '',
    paymentDate: '',
    paymentTime: '',
    notes: '',
    screenshotUrl: '',
  });

  const content = {
    en: {
      title: 'Submit ECPay Payment',
      subtitle: 'Submit your payment information for verification',
      transactionId: 'Transaction ID',
      transactionIdPlaceholder: 'ECPay transaction number (optional)',
      paymentDateTime: 'Payment Date & Time',
      datePlaceholder: 'YYYY-MM-DD',
      timePlaceholder: 'HH:MM',
      notes: 'Notes',
      notesPlaceholder: 'Any additional information...',
      screenshot: 'Payment Screenshot',
      screenshotPlaceholder: 'Screenshot URL (optional)',
      uploadTip: 'You can paste the screenshot URL or upload it via file upload service',
      paymentDetails: 'Payment Details',
      type: 'Type',
      amount: 'Amount',
      status: 'Status',
      types: {
        subscription: 'Subscription',
        deposit: 'Wallet Deposit',
      },
      statusPending: 'Pending Confirmation',
      submit: 'Submit for Review',
      submitting: 'Submitting...',
      cancel: 'Cancel',
      success: 'Payment Submitted Successfully!',
      successMessage: 'Your payment has been submitted for review. Our admin team will verify and process it within 1-4 hours during business hours.',
      close: 'Close',
      error: 'Failed to submit payment',
      requiredField: 'This field is required',
      info: 'Important Information',
      infoItems: [
        'Make sure you have completed the payment on ECPay',
        'Provide accurate transaction details',
        'Admin will verify the payment in ECPay backend',
        'You will be notified once confirmed',
      ],
    },
    zh: {
      title: '提交綠界付款',
      subtitle: '提交您的付款資訊以供驗證',
      transactionId: '交易編號',
      transactionIdPlaceholder: '綠界交易編號（選填）',
      paymentDateTime: '付款日期時間',
      datePlaceholder: '年-月-日',
      timePlaceholder: '時:分',
      notes: '備註',
      notesPlaceholder: '任何其他資訊...',
      screenshot: '付款截圖',
      screenshotPlaceholder: '截圖 URL（選填）',
      uploadTip: '您可以貼上截圖 URL 或通過文件上傳服務上傳',
      paymentDetails: '付款詳情',
      type: '類型',
      amount: '金額',
      status: '狀態',
      types: {
        subscription: '訂閱',
        deposit: '錢包儲值',
      },
      statusPending: '待確認',
      submit: '提交審核',
      submitting: '提交中...',
      cancel: '取消',
      success: '付款提交成功！',
      successMessage: '您的付款已提交審核。我們的管理團隊將在工作時間內 1-4 小時內驗證並處理。',
      close: '關閉',
      error: '提交付款失敗',
      requiredField: '此欄位為必填',
      info: '重要提示',
      infoItems: [
        '請確保您已在綠界完成付款',
        '提供準確的交易詳情',
        '管理員將在綠界後台驗證付款',
        '確認後您將收到通知',
      ],
    },
  };

  const t = content[language];

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.paymentDate) {
      toast.error(t.requiredField + ': ' + t.paymentDateTime);
      return;
    }

    setSubmitting(true);

    try {
      // Prepare payload
      const payload = {
        user_email: user?.email,
        payment_type: paymentType,
        amount_twd: amountTWD || 0,
        amount_usd: amount || 0,
        ecpay_transaction_id: formData.transactionId || undefined,
        notes: `${formData.notes}\n付款時間: ${formData.paymentDate} ${formData.paymentTime || ''}`.trim(),
        screenshot_url: formData.screenshotUrl || undefined,
        plan: plan || undefined,
      };

      // Submit to backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay-payments/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        setSubmitted(true);
        toast.success(t.success);
        
        // Reset form
        setFormData({
          transactionId: '',
          paymentDate: '',
          paymentTime: '',
          notes: '',
          screenshotUrl: '',
        });

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || t.error);
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error(t.error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitted) {
      setSubmitted(false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>{t.title}</DialogTitle>
              <DialogDescription>{t.subtitle}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Payment Details Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {t.paymentDetails}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t.type}</span>
                    <Badge variant="outline" className="bg-white">
                      {t.types[paymentType]}
                    </Badge>
                  </div>
                  {plan && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">方案</span>
                      <Badge variant="outline" className="bg-white">
                        {plan}
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t.amount}</span>
                    <div className="text-right">
                      {amountTWD && (
                        <div className="font-semibold">NT${amountTWD.toLocaleString()}</div>
                      )}
                      {amount && (
                        <div className="text-sm text-gray-600">${amount}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t.status}</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                      <Clock className="h-3 w-3 mr-1" />
                      {t.statusPending}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Transaction ID */}
                <div className="space-y-2">
                  <Label>{t.transactionId}</Label>
                  <Input
                    placeholder={t.transactionIdPlaceholder}
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    在綠界付款成功頁面可以找到交易編號
                  </p>
                </div>

                {/* Payment Date & Time */}
                <div className="space-y-2">
                  <Label>{t.paymentDateTime} *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      placeholder={t.datePlaceholder}
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      required
                    />
                    <Input
                      type="time"
                      placeholder={t.timePlaceholder}
                      value={formData.paymentTime}
                      onChange={(e) => setFormData({ ...formData, paymentTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Screenshot URL */}
                <div className="space-y-2">
                  <Label>{t.screenshot}</Label>
                  <Input
                    placeholder={t.screenshotPlaceholder}
                    value={formData.screenshotUrl}
                    onChange={(e) => setFormData({ ...formData, screenshotUrl: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    {t.uploadTip}
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>{t.notes}</Label>
                  <Textarea
                    placeholder={t.notesPlaceholder}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              {/* Important Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 mb-2">{t.info}</p>
                    <ul className="list-disc ml-4 space-y-1 text-sm text-blue-800">
                      {t.infoItems.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={submitting}>
                {t.cancel}
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? t.submitting : t.submit}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                {t.success}
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <p className="text-gray-700 mb-4">{t.successMessage}</p>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.type}</span>
                      <span className="font-medium">{t.types[paymentType]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.amount}</span>
                      <div className="text-right">
                        {amountTWD && <div className="font-medium">NT${amountTWD.toLocaleString()}</div>}
                        {amount && <div className="text-gray-600">${amount}</div>}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.status}</span>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        {t.statusPending}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                {t.close}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}