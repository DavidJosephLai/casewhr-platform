import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { CreditCard, DollarSign, Wallet } from 'lucide-react';
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

  const handlePayment = async (method: 'stripe' | 'paypal' | 'ecpay') => {
    if (!email || !name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!plan) return;

    setProcessing(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/purchase`,
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

      if (data.paymentUrl) {
        // Redirect to payment page
        window.location.href = data.paymentUrl;
      } else if (data.licenseKey) {
        // Payment completed
        toast.success('Purchase successful! License key sent to your email.');
        onClose();
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed. Please try again.');
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
            <h3 className="font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
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
                <Label htmlFor="company">Company (Optional)</Label>
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
            <h3 className="font-semibold text-gray-900 mb-4">Select Payment Method</h3>
            <Tabs defaultValue="stripe" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="stripe">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="paypal">
                  <DollarSign className="w-4 h-4 mr-2" />
                  PayPal
                </TabsTrigger>
                <TabsTrigger value="ecpay">
                  <Wallet className="w-4 h-4 mr-2" />
                  ECPay (台灣)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stripe" className="space-y-4 mt-4">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    ${currentPlan.priceUSD} USD
                  </div>
                  <p className="text-gray-600 mb-4">One-time payment via Stripe</p>
                  <Button
                    onClick={() => handlePayment('stripe')}
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {processing ? 'Processing...' : 'Pay with Card'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="paypal" className="space-y-4 mt-4">
                <div className="bg-gradient-to-br from-blue-50 to-yellow-50 rounded-lg p-6 text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    ${currentPlan.priceUSD} USD
                  </div>
                  <p className="text-gray-600 mb-4">One-time payment via PayPal</p>
                  <Button
                    onClick={() => handlePayment('paypal')}
                    disabled={processing}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                    size="lg"
                  >
                    {processing ? 'Processing...' : 'Pay with PayPal'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ecpay" className="space-y-4 mt-4">
                <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6 text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    NT${currentPlan.priceTWD.toLocaleString()} TWD
                  </div>
                  <p className="text-gray-600 mb-4">台灣綠界科技 ECPay</p>
                  <Button
                    onClick={() => handlePayment('ecpay')}
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {processing ? '處理中...' : '使用 ECPay 付款'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Terms */}
          <div className="text-sm text-gray-500 text-center">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
            License key will be sent to your email address within 5 minutes.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
