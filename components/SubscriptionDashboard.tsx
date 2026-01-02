import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  plan_type: string;
  billing_cycle: string;
  status: string;
  start_date: string;
  end_date: string;
  amount: number;
  payment_method: string;
  auto_renew: boolean;
}

interface SubscriptionDashboardProps {
  language: 'en' | 'zh';
}

const dashboardTranslations = {
  en: {
    title: 'Subscription Management',
    subtitle: 'Manage your plan and billing',
    currentPlan: 'Current Plan',
    freePlan: 'Free Plan',
    professionalPlan: 'Professional Plan',
    status: 'Status',
    active: 'Active',
    expired: 'Expired',
    cancelled: 'Cancelled',
    billingCycle: 'Billing Cycle',
    monthly: 'Monthly',
    yearly: 'Yearly',
    nextBilling: 'Next Billing Date',
    amount: 'Amount',
    paymentMethod: 'Payment Method',
    wallet: 'Wallet',
    autoRenew: 'Auto Renewal',
    enabled: 'Enabled',
    disabled: 'Disabled',
    loading: 'Loading subscription...',
    upgrade: 'Upgrade to Professional',
    cancelSubscription: 'Cancel Subscription',
    cancelTitle: 'Cancel Subscription',
    cancelDescription: 'Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.',
    confirmCancel: 'Yes, Cancel',
    cancelButton: 'Cancel',
    cancelled_success: 'Subscription cancelled successfully.',
    cancelled_error: 'Failed to cancel subscription.',
    noSubscription: 'You are currently on the free plan.',
    features: {
      free: [
        'Post up to 3 projects per month',
        'Submit up to 5 proposals per month',
        '20% platform service fee'
      ],
      pro: [
        'Unlimited projects and proposals',
        '10% platform service fee',
        'Priority support'
      ]
    }
  },
  zh: {
    title: '訂閱管理',
    subtitle: '管理您的方案與帳單',
    currentPlan: '目前方案',
    freePlan: '免費方案',
    professionalPlan: '專業方案',
    status: '狀態',
    active: '使用中',
    expired: '已過期',
    cancelled: '已取消',
    billingCycle: '計費週期',
    monthly: '月付',
    yearly: '年付',
    nextBilling: '下次扣款日期',
    amount: '金額',
    paymentMethod: '付款方式',
    wallet: '錢包',
    autoRenew: '自動續約',
    enabled: '已啟用',
    disabled: '已停用',
    loading: '載入訂閱中...',
    upgrade: '升級至專業方案',
    cancelSubscription: '取消訂閱',
    cancelTitle: '取消訂閱',
    cancelDescription: '確定要取消訂閱嗎？您仍可使用至本期結束。',
    confirmCancel: '確認取消',
    cancelButton: '返回',
    cancelled_success: '訂閱已成功取消。',
    cancelled_error: '取消訂閱失敗。',
    noSubscription: '您目前使用免費方案。',
    features: {
      free: [
        '每月最多發布 3 個專案',
        '每月最多提交 5 個提案',
        '20% 平台服務費'
      ],
      pro: [
        '無限專案與提案',
        '10% 平台服務費',
        '優先客服支援'
      ]
    }
  }
};

export function SubscriptionDashboard({ language }: SubscriptionDashboardProps) {
  const { accessToken } = useAuth();
  const t = dashboardTranslations[language];
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (accessToken) {
      fetchSubscription();
    }
  }, [accessToken]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/current`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success(t.cancelled_success);
        setShowCancelDialog(false);
        fetchSubscription();
      } else {
        toast.error(t.cancelled_error);
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast.error(t.cancelled_error);
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">{t.loading}</span>
      </div>
    );
  }

  const isProfessional = subscription && subscription.status === 'active';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2>{t.title}</h2>
        <p className="text-gray-600 mt-1">{t.subtitle}</p>
      </div>

      {/* Current Plan Card */}
      <Card className={isProfessional ? 'border-2 border-blue-500' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isProfessional ? (
                <Crown className="size-8 text-blue-600" />
              ) : (
                <Zap className="size-8 text-gray-600" />
              )}
              <div>
                <CardTitle>
                  {isProfessional ? t.professionalPlan : t.freePlan}
                </CardTitle>
                <CardDescription>{t.currentPlan}</CardDescription>
              </div>
            </div>
            {isProfessional && (
              <Badge className="bg-green-500 text-white">
                {t.active}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isProfessional && subscription ? (
            <>
              {/* Subscription Details */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-500">{t.billingCycle}</p>
                  <p className="font-medium">
                    {subscription.billing_cycle === 'monthly' ? t.monthly : t.yearly}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.amount}</p>
                  <p className="font-medium">NT$ {subscription.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.nextBilling}</p>
                  <p className="font-medium">{formatDate(subscription.end_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.paymentMethod}</p>
                  <p className="font-medium capitalize">{subscription.payment_method}</p>
                </div>
              </div>

              {/* Auto Renewal Status */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {subscription.auto_renew ? (
                    <CheckCircle2 className="size-5 text-green-600" />
                  ) : (
                    <AlertCircle className="size-5 text-orange-600" />
                  )}
                  <span className="font-medium">{t.autoRenew}</span>
                </div>
                <Badge variant={subscription.auto_renew ? 'default' : 'outline'}>
                  {subscription.auto_renew ? t.enabled : t.disabled}
                </Badge>
              </div>

              {/* Features */}
              <div>
                <p className="text-sm font-medium mb-2">
                  {language === 'en' ? 'Plan Features:' : '方案功能：'}
                </p>
                <ul className="space-y-2">
                  {t.features.pro.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="size-4 text-blue-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Free Plan Info */}
              <p className="text-gray-600">{t.noSubscription}</p>
              <ul className="space-y-2">
                {t.features.free.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="size-4 text-gray-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          {!isProfessional ? (
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => {
                // 导航到定价页面
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              {t.upgrade}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setShowCancelDialog(true)}
            >
              {t.cancelSubscription}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.cancelTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.cancelDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancelButton}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Cancelling...' : '取消中...'}
                </>
              ) : (
                t.confirmCancel
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}