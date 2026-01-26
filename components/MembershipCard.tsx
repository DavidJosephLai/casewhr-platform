import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { SubscriptionBadge } from "./SubscriptionBadge";
import { Crown, TrendingUp, Loader2, Calendar, AlertCircle } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { useState, useEffect, useCallback, memo } from "react"; // ✅ Added useCallback, memo
import { useAuth } from "../contexts/AuthContext";
import { projectId } from "../utils/supabase/info";
import { UpgradeDialog } from "./UpgradeDialog";
import { Switch } from "./ui/switch";
import { toast } from "sonner";

interface Subscription {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  next_billing_date?: string;
  cancelled_at?: string;
}

export const MembershipCard = memo(function MembershipCard() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const t = getTranslation(language).subscription;
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly'); // ✅ 添加計費週期 state

  // ✅ Stabilize fetchSubscription with useCallback
  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    try {
      // 🔥 優先檢查開發模式的訂閱信息
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        const devSubscription = localStorage.getItem('dev_mode_subscription');
        if (devSubscription) {
          try {
            const subscription = JSON.parse(devSubscription);
            console.log('🎁 [MembershipCard] Using dev mode subscription:', subscription);
            
            setSubscription({
              plan: subscription.plan,
              status: subscription.status || 'active',
              start_date: new Date().toISOString(),
              end_date: subscription.current_period_end || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              auto_renew: true,
            });
            setLoading(false);
            return;
          } catch (err) {
            console.error('Failed to parse dev mode subscription:', err);
          }
        }
      }

      console.log('📋 [MembershipCard] Fetching subscription for user:', user.id);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      console.log('📋 [MembershipCard] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 [MembershipCard] Subscription data received:', data);
        console.log('📋 [MembershipCard] Plan:', data.subscription?.plan);
        setSubscription(data.subscription);
        
        // 🔥 顯示訂閱狀態更新提示
        if (data.subscription?.plan === 'enterprise') {
          console.log('🏢 [MembershipCard] Enterprise subscription detected!');
        }
      } else {
        console.log('⚠️ [MembershipCard] No subscription found, using free plan');
        // 如果沒有訂閱，設置為免費方案
        setSubscription({
          plan: 'free',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          auto_renew: false,
        });
      }
    } catch (error) {
      console.error('❌ [MembershipCard] Failed to fetch subscription:', error);
      // 默認免費方案
      setSubscription({
        plan: 'free',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        auto_renew: false,
      });
    } finally {
      setLoading(false);
    }
  }, [user, accessToken]);

  useEffect(() => {
    if (user && accessToken) {
      fetchSubscription();
    }
  }, [fetchSubscription]); // ✅ Use fetchSubscription in dependencies

  // Listen for subscription refresh events
  useEffect(() => {
    const handleRefreshSubscription = () => {
      console.log('🔄 [MembershipCard] Refreshing subscription...');
      fetchSubscription();
    };

    window.addEventListener('refreshSubscription', handleRefreshSubscription);
    
    return () => {
      window.removeEventListener('refreshSubscription', handleRefreshSubscription);
    };
  }, [fetchSubscription]); // ✅ Use fetchSubscription in dependencies

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro':
      case 'enterprise':
        return <Crown className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const handleAutoRenewToggle = async (enabled: boolean) => {
    if (!user || !accessToken) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/auto-renew`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ enabled }),
        }
      );

      if (response.ok) {
        setSubscription(prev => prev ? { ...prev, auto_renew: enabled } : null);
        toast.success(
          enabled 
            ? (language === 'en' ? 'Auto-renewal enabled' : '已開啟自動續訂')
            : (language === 'en' ? 'Auto-renewal disabled' : '已關閉自動續訂')
        );
      } else {
        throw new Error('Failed to update auto-renewal');
      }
    } catch (error) {
      console.error('Error toggling auto-renewal:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to update auto-renewal setting' 
          : '更新自動續訂設置失敗'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !accessToken) return;
    
    if (!confirm(
      language === 'en' 
        ? 'Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.' 
        : '確定要取消訂閱嗎？您將保留使用權限直到計費週期結束。'
    )) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        await fetchSubscription(); // 刷新訂閱狀態
        toast.success(
          language === 'en' 
            ? 'Subscription cancelled. Access remains until end date.' 
            : '訂閱已取消。您可以繼續使用至到期日。'
        );
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to cancel subscription' 
          : '取消訂閱失敗'
      );
    } finally {
      setActionLoading(false);
    }
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

  if (!subscription) {
    return null;
  }

  const planDetails = t.plans[subscription.plan];
  const nextTierPlan = subscription.plan === 'free' ? 'pro' : subscription.plan === 'pro' ? 'enterprise' : null;

  // 🔍 調試日誌：檢查整個 subscription 和 t 對象
  console.log('🔍 [MembershipCard] Full debug:', {
    subscriptionPlan: subscription.plan,
    tPlans: t.plans,
    tPlansKeys: Object.keys(t.plans || {}),
    planDetailsRaw: t.plans?.[subscription.plan],
    planDetails: planDetails,
  });

  // ✅ 安全檢查：確保 planDetails 和 features 存在
  if (!planDetails) {
    console.error('❌ [MembershipCard] Plan details not found for plan:', subscription.plan);
    console.error('❌ [MembershipCard] Available plans:', Object.keys(t.plans || {}));
    return null;
  }

  // 🔍 調試日誌：檢查 features 數組
  console.log('🔍 [MembershipCard] Plan details:', {
    plan: subscription.plan,
    hasPlanDetails: !!planDetails,
    hasFeatures: !!planDetails.features,
    isArray: Array.isArray(planDetails.features),
    featuresLength: planDetails.features?.length,
    features: planDetails.features
  });

  return (
    <>
      <Card className="overflow-hidden">
        <div className={`h-2 ${subscription.plan === 'enterprise' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : subscription.plan === 'pro' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-300'}`} />
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getPlanIcon(subscription.plan)}
                {t.currentPlan}
              </CardTitle>
              <CardDescription className="mt-1">
                {language === 'en' ? 'Your membership status' : '您的會員狀態'}
              </CardDescription>
            </div>
            <SubscriptionBadge 
              plan={subscription.plan} 
              language={language}
              size="lg"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Plan Info */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl">{planDetails.price}</span>
            <span className="text-gray-500">{planDetails.period}</span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{language === 'en' ? 'Status:' : '狀態：'}</span>
            <Badge variant="outline" className="text-xs">
              {t.status[subscription.status]}
            </Badge>
          </div>

          {/* Features Preview - Show top 3 */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">
              {language === 'en' ? 'Key Features:' : '主要功能：'}
            </p>
            <ul className="space-y-1">
              {planDetails.features && Array.isArray(planDetails.features) && planDetails.features.length > 0 ? (
                planDetails.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    • {feature}
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500">
                  {language === 'en' ? 'No features available' : '暫無功能列表'}
                </li>
              )}
            </ul>
          </div>

          {/* Auto-Renew Toggle (for paid plans) */}
          {subscription.plan !== 'free' && subscription.status === 'active' && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {language === 'en' ? 'Auto-Renewal' : '自動續訂'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {language === 'en' 
                      ? 'Automatically renew at the end of your billing period' 
                      : '在計費週期結束時自動續訂'}
                  </p>
                </div>
                <Switch 
                  checked={subscription.auto_renew} 
                  onCheckedChange={handleAutoRenewToggle}
                  disabled={actionLoading}
                />
              </div>
              {subscription.next_billing_date && subscription.auto_renew && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                  <Calendar className="h-3 w-3" />
                  {language === 'en' ? 'Next billing:' : '下次扣款：'}
                  {' '}
                  {new Date(subscription.next_billing_date).toLocaleDateString(
                    language === 'en' ? 'en-US' : 'zh-TW'
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cancelled Status Warning */}
          {subscription.status === 'cancelled' && (
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">
                    {language === 'en' ? 'Subscription Cancelled' : '訂閱已取消'}
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    {language === 'en' 
                      ? `Access remains until ${new Date(subscription.end_date).toLocaleDateString('en-US')}` 
                      : `可以使用至 ${new Date(subscription.end_date).toLocaleDateString('zh-TW')}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Expired Status Warning */}
          {subscription.status === 'expired' && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    {language === 'en' ? 'Subscription Expired' : '訂閱已過期'}
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    {language === 'en' 
                      ? `Your subscription expired on ${new Date(subscription.end_date).toLocaleDateString('en-US')}. Please upgrade to continue using premium features.` 
                      : `您的訂閱已於 ${new Date(subscription.end_date).toLocaleDateString('zh-TW')} 過期。請升級以繼續使用進階功能。`}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            {/* Billing Cycle Toggle (只在有升級選項時顯示) */}
            {nextTierPlan && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">
                  {language === 'en' ? 'Choose billing cycle:' : '選擇計費週期：'}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={billingCycle === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setBillingCycle('monthly')}
                  >
                    {language === 'en' ? 'Monthly' : '月付'}
                  </Button>
                  <Button
                    variant={billingCycle === 'yearly' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setBillingCycle('yearly')}
                  >
                    {language === 'en' ? 'Yearly (Save 20%)' : '年付 (省 20%)'}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              {nextTierPlan && (
                <Button
                  className="flex-1"
                  onClick={() => setShowUpgradeDialog(true)}
                  disabled={actionLoading}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {t.actions.upgrade}
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  console.log('💳 [MembershipCard] View Plans button clicked');
                  window.dispatchEvent(new CustomEvent('showPricing', { detail: {} }));
                }}
              >
                {language === 'en' ? 'View Plans' : '查看方案'}
              </Button>
            </div>
            
            {/* Cancel Subscription Button (for paid active plans) */}
            {subscription.plan !== 'free' && subscription.status === 'active' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleCancelSubscription}
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                {language === 'en' ? 'Cancel Subscription' : '取消訂閱'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      {nextTierPlan && (
        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          targetPlan={nextTierPlan as 'pro' | 'enterprise'}
          billingCycle={billingCycle}
          onUpgradeSuccess={() => {
            setShowUpgradeDialog(false);
            fetchSubscription(); // 刷新訂閱狀態
          }}
        />
      )}
    </>
  );
});