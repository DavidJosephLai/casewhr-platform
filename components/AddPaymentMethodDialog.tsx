import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CreditCard, Loader2 } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddPaymentMethodDialog({ open, onOpenChange, onSuccess }: AddPaymentMethodDialogProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<'credit_card' | 'paypal' | 'line_pay'>('credit_card');
  
  // Credit card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  
  // PayPal fields
  const [paypalEmail, setPaypalEmail] = useState('');
  
  // LINE Pay fields
  const [linePayId, setLinePayId] = useState('');

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (/^\d*$/.test(value) && value.length <= 19) {
      setCardNumber(formatCardNumber(value));
    }
  };

  const handleExpiryMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 2) {
      const num = parseInt(value);
      if (value === '' || (num >= 1 && num <= 12)) {
        setExpiryMonth(value);
      }
    }
  };

  const handleExpiryYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setExpiryYear(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setCvv(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !accessToken) return;

    setLoading(true);
    try {
      const body: any = { type: paymentType };
      
      if (paymentType === 'credit_card') {
        if (!cardNumber || !cardholderName || !expiryMonth || !expiryYear || !cvv) {
          toast.error(
            language === 'en' 
              ? 'Please fill in all card details' 
              : '請填寫所有卡片資訊'
          );
          setLoading(false);
          return;
        }
        
        body.card_number = cardNumber.replace(/\s/g, '');
        body.cardholder_name = cardholderName;
        body.expiry_month = expiryMonth.padStart(2, '0');
        body.expiry_year = expiryYear;
        body.cvv = cvv;
      } else if (paymentType === 'paypal') {
        if (!paypalEmail) {
          toast.error(
            language === 'en' 
              ? 'Please enter your PayPal email' 
              : '請輸入您的 PayPal 郵箱'
          );
          setLoading(false);
          return;
        }
        
        body.paypal_email = paypalEmail;
      } else if (paymentType === 'line_pay') {
        if (!linePayId) {
          toast.error(
            language === 'en' 
              ? 'Please enter your LINE Pay ID' 
              : '請輸入您的 LINE Pay ID'
          );
          setLoading(false);
          return;
        }
        
        body.line_pay_id = linePayId;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment-methods`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        toast.success(
          language === 'en' 
            ? 'Payment method added successfully' 
            : '支付方式添加成功'
        );
        
        // Reset form
        setCardNumber('');
        setCardholderName('');
        setExpiryMonth('');
        setExpiryYear('');
        setCvv('');
        setPaypalEmail('');
        setLinePayId('');
        
        onSuccess();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add payment method');
      }
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast.error(error.message || (
        language === 'en' 
          ? 'Failed to add payment method' 
          : '添加支付方式失敗'
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {language === 'en' ? 'Add Payment Method' : '添加支付方式'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en' 
              ? 'Add a new payment method for your subscription' 
              : '為您的訂閱添加新的支付方式'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="credit_card">
              {language === 'en' ? 'Card' : '信用卡'}
            </TabsTrigger>
            <TabsTrigger value="paypal">PayPal</TabsTrigger>
            <TabsTrigger value="line_pay">LINE Pay</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="credit_card" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="card-number">
                  {language === 'en' ? 'Card Number' : '卡號'}
                </Label>
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardholder-name">
                  {language === 'en' ? 'Cardholder Name' : '持卡人姓名'}
                </Label>
                <Input
                  id="cardholder-name"
                  placeholder="John Doe"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expiry-month">
                    {language === 'en' ? 'Month' : '月'}
                  </Label>
                  <Input
                    id="expiry-month"
                    placeholder="MM"
                    value={expiryMonth}
                    onChange={handleExpiryMonthChange}
                    maxLength={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry-year">
                    {language === 'en' ? 'Year' : '年'}
                  </Label>
                  <Input
                    id="expiry-year"
                    placeholder="YYYY"
                    value={expiryYear}
                    onChange={handleExpiryYearChange}
                    maxLength={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={handleCvvChange}
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                {language === 'en' 
                  ? '⚠️ Demo mode: Your card details are stored for testing only.' 
                  : '⚠️ 演示模式：您的卡片資訊僅用於測試。'}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {language === 'en' ? 'Add Card' : '添加卡片'}
              </Button>
            </TabsContent>

            <TabsContent value="paypal" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="paypal-email">
                  {language === 'en' ? 'PayPal Email' : 'PayPal 郵箱'}
                </Label>
                <Input
                  id="paypal-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                {language === 'en' 
                  ? 'You will be redirected to PayPal to authorize this payment method.' 
                  : '您將被重定向到 PayPal 以授權此支付方式。'}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {language === 'en' ? 'Connect PayPal' : '連接 PayPal'}
              </Button>
            </TabsContent>

            <TabsContent value="line_pay" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="line-pay-id">
                  {language === 'en' ? 'LINE Pay ID' : 'LINE Pay ID'}
                </Label>
                <Input
                  id="line-pay-id"
                  placeholder="1234567890"
                  value={linePayId}
                  onChange={(e) => setLinePayId(e.target.value)}
                  required
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                {language === 'en' 
                  ? 'You will be redirected to LINE Pay to authorize this payment method.' 
                  : '您將被重定向到 LINE Pay 以授權此支付方式。'}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {language === 'en' ? 'Connect LINE Pay' : '連接 LINE Pay'}
              </Button>
            </TabsContent>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}