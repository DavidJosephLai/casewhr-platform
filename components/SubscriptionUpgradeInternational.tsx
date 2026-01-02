import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { ECPayInternational } from './ECPayInternational';
import { ECPayPaymentSubmit } from './ECPayPaymentSubmit';

interface SubscriptionPlan {
  id: string;
  name: string;
  nameZh: string;
  price: number;
  priceYearly: number;
  priceTWD: number;
  priceTWDYearly: number;
  features: string[];
  featuresZh: string[];
  platformFee: number;
  popular?: boolean;
  icon: any;
}

const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    nameZh: '免費版',
    price: 0,
    priceYearly: 0,
    priceTWD: 0,
    priceTWDYearly: 0,
    platformFee: 20,
    icon: Building2,
    features: [
      'Basic project posting',
      'Standard messaging',
      'Community support',
      '20% platform fee',
    ],
    featuresZh: [
      '基本專案發佈',
      '標準消息功能',
      '社群支援',
      '20% 平台手續費',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    nameZh: '專業版',
    price: 9.9,
    priceYearly: 99,
    priceTWD: 300,
    priceTWDYearly: 3000,
    platformFee: 10,
    popular: true,
    icon: Sparkles,
    features: [
      'All Free features',
      'Priority support',
      'Advanced analytics',
      'Featured listings',
      '10% platform fee',
      'Cancel anytime',
    ],
    featuresZh: [
      '包含所有免費版功能',
      '優先客服支援',
      '進階數據分析',
      '專案置頂顯示',
      '10% 平台手續費',
      '隨時可取消',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    nameZh: '企業版',
    price: 29,
    priceYearly: 290,
    priceTWD: 900,
    priceTWDYearly: 9000,
    platformFee: 5,
    icon: Users,
    features: [
      'All Professional features',
      'Team management',
      'Dedicated account manager',
      'Custom contracts',
      'API access',
      '5% platform fee',
      'Priority matching',
    ],
    featuresZh: [
      '包含所有專業版功能',
      '團隊管理功能',
      '專屬客戶經理',
      '客製化合約',
      'API 存取權限',
      '5% 平台手續費',
      '優先媒合服務',
    ],
  },
];

export function SubscriptionUpgradeInternational() {
  const { language } = useLanguage();
  const { user, accessToken, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    if (profile?.subscription_tier) {
      setCurrentPlan(profile.subscription_tier);
    }
  }, [profile]);

  const content = {
    en: {
      title: 'Upgrade Your Plan',
      subtitle: 'Choose the perfect plan for your needs',
      currentPlan: 'Current Plan',
      monthly: 'Monthly',
      yearly: 'Yearly',
      yearlyDiscount: 'Save 17%',
      perMonth: '/month',
      perYear: '/year',
      upgradeNow: 'Upgrade Now',
      currentPlanLabel: 'Current',
      mostPopular: 'Most Popular',
      paymentMethods: 'Payment Methods',
      internationalPayment: 'International Payment',
      taiwanLocal: 'Taiwan Local',
      stripeGlobal: 'Global Card Payment',
      ecpayTaiwan: 'ECPay Taiwan',
      ecpayInternational: 'ECPay International',
    },
    zh: {
      title: '升級方案',
      subtitle: '選擇最適合您的方案',
      currentPlan: '目前方案',
      monthly: '月付',
      yearly: '年付',
      yearlyDiscount: '省 17%',
      perMonth: '/月',
      perYear: '/年',
      upgradeNow: '立即升級',
      currentPlanLabel: '目前方案',
      mostPopular: '最受歡迎',
      paymentMethods: '付款方式',
      internationalPayment: '國際付款',
      taiwanLocal: '台灣本地',
      stripeGlobal: '全球卡付',
      ecpayTaiwan: '綠界台灣',
      ecpayInternational: '綠界國際',
    },
  };

  const t = content[language];

  const getPrice = (plan: SubscriptionPlan) => {
    if (language === 'zh') {
      return billingCycle === 'monthly' ? plan.priceTWD : plan.priceTWDYearly;
    }
    return billingCycle === 'monthly' ? plan.price : plan.priceYearly;
  };

  const getCurrency = () => {
    return language === 'zh' ? 'NT$' : '$';
  };

  const handleStripeUpgrade = async (planId: string) => {
    setLoading(true);
    try {
      const plan = PLANS.find(p => p.id === planId);
      if (!plan) return;

      const price = billingCycle === 'monthly' ? plan.price : plan.priceYearly;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/stripe/create-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan: planId,
            billing_cycle: billingCycle,
            amount: price,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        toast.error(language === 'en' ? 'Failed to create subscription' : '訂閱建立失敗');
      }
    } catch (error) {
      console.error('Error upgrading:', error);
      toast.error(language === 'en' ? 'Failed to upgrade' : '升級失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleECPayInternational = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    // ECPayInternational component will handle the payment flow
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
        <p className="text-xl text-gray-600">{t.subtitle}</p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white shadow-sm font-medium'
                : 'text-gray-600'
            }`}
          >
            {t.monthly}
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-md transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white shadow-sm font-medium'
                : 'text-gray-600'
            }`}
          >
            {t.yearly}
            <Badge className="ml-2 bg-green-600">
              {t.yearlyDiscount}
            </Badge>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          const price = getPrice(plan);
          const features = language === 'zh' ? plan.featuresZh : plan.features;

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? 'border-2 border-blue-500 shadow-lg scale-105'
                  : 'border'
              } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    {t.mostPopular}
                  </Badge>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-4 right-4">
                  <Badge className="bg-green-600 text-white px-4 py-1">
                    {t.currentPlanLabel}
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-8 w-8 text-blue-600" />
                  <CardTitle className="text-2xl">
                    {language === 'zh' ? plan.nameZh : plan.name}
                  </CardTitle>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {getCurrency()}{price}
                  </span>
                  <span className="text-gray-600">
                    {billingCycle === 'monthly' ? t.perMonth : t.perYear}
                  </span>
                </div>
                {billingCycle === 'yearly' && price > 0 && (
                  <p className="text-sm text-gray-600">
                    {getCurrency()}{(price / 12).toFixed(1)} {t.perMonth}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Upgrade Buttons */}
                {!isCurrent && plan.id !== 'free' && (
                  <div className="space-y-3 pt-4">
                    <p className="text-sm font-medium text-gray-700">
                      {t.paymentMethods}
                    </p>

                    {/* International Users */}
                    {language === 'en' && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {t.internationalPayment}
                        </p>

                        {/* Stripe */}
                        <Button
                          onClick={() => handleStripeUpgrade(plan.id)}
                          disabled={loading}
                          className="w-full"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {t.stripeGlobal}
                        </Button>

                        {/* ECPay International */}
                        <ECPayInternational
                          type="subscription"
                          amount={price}
                          plan={language === 'zh' ? plan.nameZh : plan.name}
                          onSuccess={() => setShowSubmitDialog(true)}
                        />
                      </div>
                    )}

                    {/* Taiwan Users */}
                    {language === 'zh' && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {t.taiwanLocal}
                        </p>

                        {/* ECPay Taiwan */}
                        <ECPayInternational
                          type="subscription"
                          amount={price}
                          plan={language === 'zh' ? plan.nameZh : plan.name}
                          onSuccess={() => setShowSubmitDialog(true)}
                        />

                        {/* Stripe */}
                        <Button
                          onClick={() => handleStripeUpgrade(plan.id)}
                          disabled={loading}
                          variant="outline"
                          className="w-full"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {t.stripeGlobal}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {isCurrent && (
                  <div className="pt-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <Check className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-900">
                        {t.currentPlanLabel}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Platform Fee Comparison */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            {language === 'en' ? 'Platform Fee Comparison' : '平台手續費比較'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div key={plan.id} className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {plan.platformFee}%
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {language === 'zh' ? plan.nameZh : plan.name}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Submit Dialog */}
      {selectedPlan && (
        <ECPayPaymentSubmit
          isOpen={showSubmitDialog}
          onClose={() => {
            setShowSubmitDialog(false);
            setSelectedPlan(null);
          }}
          paymentType="subscription"
          amount={billingCycle === 'monthly' ? selectedPlan.price : selectedPlan.priceYearly}
          amountTWD={billingCycle === 'monthly' ? selectedPlan.priceTWD : selectedPlan.priceTWDYearly}
          plan={language === 'zh' ? selectedPlan.nameZh : selectedPlan.name}
          onSuccess={() => {
            refreshProfile?.();
          }}
        />
      )}
    </div>
  );
}