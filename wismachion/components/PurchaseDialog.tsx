import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { DollarSign, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface PurchaseDialogProps {
  open: boolean;
  onClose: () => void;
  plan: 'standard' | 'enterprise' | null;
}

export function PurchaseDialog({ open, onClose, plan }: PurchaseDialogProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [processing, setProcessing] = useState(false);

  const planDetails = {
    standard: {
      name: 'Standard Edition',
      priceUSD: 100,
      priceTWD: 3000
    },
    enterprise: {
      name: 'Enterprise Edition',
      priceUSD: 200,
      priceTWD: 6000
    }
  };

  const currentPlan = plan ? planDetails[plan] : null;

  const handlePayment = async (method: 'paypal' | 'ecpay') => {
    if (!email || !name) {
      toast.error('請填寫所有必填欄位 / Please fill in all required fields');
      return;
    }

    if (!plan) return;

    setProcessing(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/create-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            plan,
            email,
            name,
            company,
            paymentMethod: method
          })
        }
      );

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        // Redirect to payment page
        toast.success('跳轉到付款頁面... / Redirecting to payment...');
        window.location.href = data.paymentUrl;
      } else if (data.error) {
        toast.error(data.error);
      } else {
        toast.error('無法創建付款會話 / Failed to create payment session');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('購買失敗，請重試 / Purchase failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!currentPlan) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Purchase {currentPlan.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              客戶資訊 / Customer Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">姓名 / Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="王小明 / John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">電子郵件 / Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="company">公司名稱 / Company (Optional)</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corporation"
                />
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              選擇付款方式 / Select Payment Method
            </h3>
            <Tabs defaultValue="ecpay" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ecpay">
                  <Wallet className="w-4 h-4 mr-2" />
                  ECPay 綠界（台灣）
                </TabsTrigger>
                <TabsTrigger value="paypal">
                  <DollarSign className="w-4 h-4 mr-2" />
                  PayPal（國際）
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ecpay" className="space-y-4 mt-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                      <Wallet className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      🇹🇼 台灣本地支付
                    </h4>
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      NT${currentPlan.priceTWD.toLocaleString()} TWD
                    </div>
                    <p className="text-gray-600 mb-4">
                      支援：信用卡、ATM 轉帳、超商代碼、超商條碼
                    </p>
                  </div>
                  
                  <div className="space-y-3 mb-6 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>💳 支援所有台灣信用卡</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>🏪 7-11、全家、萊爾富超商付款</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>🏦 ATM 虛擬帳號轉帳</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>✅ 安全、快速、方便</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePayment('ecpay')}
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    {processing ? '處理中... / Processing...' : '使用 ECPay 付款'}
                  </Button>
                  
                  <div className="mt-4 text-center text-xs text-gray-500">
                    powered by 綠界科技 ECPay
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="paypal" className="space-y-4 mt-4">
                <div className="bg-gradient-to-br from-blue-50 to-yellow-50 rounded-lg p-6 border-2 border-blue-200">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                      <DollarSign className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      🌐 國際支付
                    </h4>
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      ${currentPlan.priceUSD} USD
                    </div>
                    <p className="text-gray-600 mb-4">
                      International payment via PayPal
                    </p>
                  </div>

                  <div className="space-y-3 mb-6 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>💳 Credit & Debit Cards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>🌍 Available Worldwide</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>🔒 Secure Payment Protection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>⚡ Instant Activation</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePayment('paypal')}
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    {processing ? 'Processing...' : 'Pay with PayPal'}
                  </Button>
                  
                  <div className="mt-4 text-center text-xs text-gray-500">
                    powered by PayPal
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Terms */}
          <div className="text-sm text-gray-500 text-center border-t pt-4">
            <p className="mb-2">
              完成購買即表示您同意我們的服務條款和隱私政策
            </p>
            <p>
              By completing this purchase, you agree to our Terms of Service and Privacy Policy.
            </p>
            <p className="mt-2 text-xs">
              授權碼將在 5 分鐘內發送至您的電子郵件 / License key will be sent to your email within 5 minutes.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
