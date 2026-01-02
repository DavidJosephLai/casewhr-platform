import { useSubscription } from "../hooks/useSubscription";
import { toast } from "sonner";
import { getDefaultCurrency, formatCurrency, type Currency } from "../lib/currency";
import { Check } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { UpgradeDialog } from "./UpgradeDialog";
import { DowngradeDialog } from "./DowngradeDialog";
import { SubscriptionBadge, getSubscriptionName } from "./SubscriptionBadge";
import { Wallet, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import { getDefaultCurrency, formatCurrency, type Currency } from "../lib/currency";
import { CurrencySelector } from "./CurrencySelector";

export function PricingPage() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const t = getTranslation(language).subscription;
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'enterprise' | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const { subscription, loading: subscriptionLoading, refreshLimits } = useSubscription();
  const [highlightedPlan, setHighlightedPlan] = useState<'free' | 'pro' | 'enterprise' | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlanIndex, setCurrentPlanIndex] = useState(1); // Start with Pro plan (index 1)
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(getDefaultCurrency(language));

  // Update currency when language changes
  useEffect(() => {
    setSelectedCurrency(getDefaultCurrency(language));
  }, [language]);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch wallet balance when user is logged in
  useEffect(() => {
    if (user && accessToken) {
      fetchWalletBalance();
    }
  }, [user, accessToken]);

  // 🎯 Listen for highlightPlan event
  useEffect(() => {
    const handleHighlightPlan = (event: Event) => {
      const customEvent = event as CustomEvent;
      const plan = customEvent.detail?.plan;
      
      if (plan) {
        console.log('🎯 Highlighting plan:', plan);
        setHighlightedPlan(plan);
        
        // 滾動到該方案卡片
        setTimeout(() => {
          const planElement = document.getElementById(`plan-${plan}`);
          if (planElement) {
            planElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        // 3秒後移除高亮
        setTimeout(() => {
          setHighlightedPlan(null);
        }, 3000);
      }
    };

    window.addEventListener('highlightPlan', handleHighlightPlan as EventListener);
    
    return () => {
      window.removeEventListener('highlightPlan', handleHighlightPlan as EventListener);
    };
  }, []);

  const fetchWalletBalance = async () => {
    // 🛡️ 安全檢查：確保用戶和 token 存在
    if (!user || !accessToken) {
      console.warn('⚠️ [PricingPage] Cannot fetch wallet: missing user or token');
      setFetchingBalance(false);
      return;
    }

    // 🧪 檢測開發模式：如果是開發模式登入，跳過錢包 API
    const isDevMode = localStorage.getItem('dev_mode_active') === 'true' || 
                      accessToken.includes('dev-user-') ||
                      accessToken.includes('||');
    
    if (isDevMode) {
      console.log('🧪 [PricingPage] Dev mode detected, skipping wallet API');
      setWalletBalance(0);
      setFetchingBalance(false);
      return;
    }

    setFetchingBalance(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.wallet?.available_balance || 0);
      } else {
        // 🛡️ 靜默處理錯誤，可能是新用戶
        console.warn('⚠️ [PricingPage] Failed to fetch wallet:', response.status);
        setWalletBalance(0);
      }
    } catch (error) {
      console.warn('⚠️ [PricingPage] Error fetching wallet:', error);
      // 🛡️ 發生錯誤時設置餘額為 0
      setWalletBalance(0);
    } finally {
      setFetchingBalance(false);
    }
  };

  //定義三幣價格（基準價格：USD）
  const PLAN_PRICES = {
    pro: {
      monthly: { USD: 9.9, TWD: 300, CNY: 70 },
      yearly: { USD: 95, TWD: 2880, CNY: 670 }
    },
    enterprise: {
      monthly: { USD: 29, TWD: 900, CNY: 205 },
      yearly: { USD: 278, TWD: 8640, CNY: 1970 }
    }
  };

  // Use useMemo to recalculate plans when language, billingCycle, or selectedCurrency changes
  const plans = useMemo(() => [
    {
      id: 'free' as const,
      name: t.plans.free.name,
      price: formatCurrency(0, selectedCurrency),
      period: billingCycle === 'monthly' 
        ? (language === 'en' ? '/month' : language === 'zh-CN' ? '/月' : '/月')
        : (language === 'en' ? '/year' : language === 'zh-CN' ? '/年' : '/年'),
      description: t.plans.free.description,
      features: t.plans.free.features,
      highlighted: false,
      monthlyPrice: 0,
      yearlyPrice: 0,
      tier: 0, // 等級：0 = 免費版
    },
    {
      id: 'pro' as const,
      name: t.plans.pro.name,
      price: formatCurrency(
        billingCycle === 'monthly' 
          ? PLAN_PRICES.pro.monthly[selectedCurrency]
          : PLAN_PRICES.pro.yearly[selectedCurrency],
        selectedCurrency
      ),
      period: billingCycle === 'monthly' 
        ? t.plans.pro.period
        : (language === 'en' ? '/year' : language === 'zh-CN' ? '/年' : '/年'),
      description: t.plans.pro.description,
      features: t.plans.pro.features,
      highlighted: true,
      monthlyPrice: PLAN_PRICES.pro.monthly[selectedCurrency],
      yearlyPrice: PLAN_PRICES.pro.yearly[selectedCurrency],
      tier: 1, // 等級：1 = 專業版
    },
    {
      id: 'enterprise' as const,
      name: t.plans.enterprise.name,
      price: formatCurrency(
        billingCycle === 'monthly' 
          ? PLAN_PRICES.enterprise.monthly[selectedCurrency]
          : PLAN_PRICES.enterprise.yearly[selectedCurrency],
        selectedCurrency
      ),
      period: billingCycle === 'monthly' 
        ? t.plans.enterprise.period
        : (language === 'en' ? '/year' : language === 'zh-CN' ? '/年' : '/年'),
      description: t.plans.enterprise.description,
      features: t.plans.enterprise.features,
      highlighted: false,
      monthlyPrice: PLAN_PRICES.enterprise.monthly[selectedCurrency],
      yearlyPrice: PLAN_PRICES.enterprise.yearly[selectedCurrency],
      tier: 2, // 等級：2 = 企業版
    },
  ], [language, billingCycle, selectedCurrency, t]);

  // 取得當前方案的等級
  const currentPlanTier = subscription?.plan 
    ? plans.find(p => p.id === subscription.plan)?.tier ?? -1
    : -1;

  const handleSelectPlan = (planId: 'free' | 'pro' | 'enterprise') => {
    console.log('🎯 handleSelectPlan called:', { planId, user: !!user, currentPlan: subscription?.plan });
    
    if (!user) {
      console.log('⚠️ No user, triggering login dialog');
      // 觸發登入對話框
      window.dispatchEvent(new CustomEvent('openAuthDialog', { detail: 'login' }));
      return;
    }
    
    // 如果是當前方案，不做任何操作
    if (subscription?.plan === planId) {
      console.log('⚠️ Already on this plan');
      return;
    }
    
    // 判斷是否為降級
    const targetPlanTier = plans.find(p => p.id === planId)?.tier ?? -1;
    const isDowngrade = currentPlanTier > targetPlanTier;
    
    if (isDowngrade) {
      console.log('⬇️ Downgrade detected, opening downgrade dialog');
      setSelectedPlan(planId);
      setShowDowngradeDialog(true);
      return;
    }
    
    // Free 方案不需要升級（用戶默認就是 Free）
    if (planId === 'free') {
      console.log('⚠️ Free plan selected, no action needed');
      toast.info(language === 'en' 
        ? 'ℹ️ You are already on the Free plan or can downgrade from your account settings.' 
        : 'ℹ️ 您已經在使用免費方案，或可從帳戶設定中降級。'
      );
      return;
    }
    
    // Enterprise 方案顯示升級對話框
    if (planId === 'enterprise') {
      console.log('✅ Enterprise plan selected, showing upgrade dialog');
      setSelectedPlan(planId);
      setShowUpgradeDialog(true);
      return;
    }
    
    console.log('✅ Opening upgrade dialog for Pro plan');
    setSelectedPlan(planId);
    setShowUpgradeDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t.subtitle}</p>
          
          {/* Currency Selector - NEW */}
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <span className="text-sm text-gray-600">
                {language === 'en' 
                  ? 'View prices in:' 
                  : language === 'zh-CN'
                  ? '查看价格：'
                  : '查看價格：'}
              </span>
              <CurrencySelector
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                className="w-32"
              />
            </div>
          </div>
          
          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-full transition-all font-medium ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'en' ? 'Monthly' : '月付'}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-full transition-all font-medium relative ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'en' ? 'Yearly' : '年付'}
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                {language === 'en' ? 'Save 20%' : '省 20%'}
              </span>
            </button>
          </div>
          
          {/* Wallet Balance Card - Only show for logged in users */}
          {user && (
            <div className="mt-6 inline-block">
              <div className="bg-white border border-gray-200 rounded-lg px-6 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">
                      {language === 'en' ? 'Your Wallet Balance' : '您的錢包餘額'}
                    </p>
                    {fetchingBalance ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">
                        ${walletBalance.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="relative max-w-6xl mx-auto">
          {/* Left Arrow - moved outside */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const newIndex = Math.max(0, currentPlanIndex - 1);
              console.log('⬅️ Left arrow clicked! Current:', currentPlanIndex, '→ New:', newIndex);
              setCurrentPlanIndex(newIndex);
            }}
            disabled={currentPlanIndex === 0}
            className="absolute -left-20 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white shadow-2xl transition-all hover:bg-blue-700 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Right Arrow - moved outside */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const newIndex = Math.min(plans.length - 1, currentPlanIndex + 1);
              console.log('➡️ Right arrow clicked! Current:', currentPlanIndex, '→ New:', newIndex);
              setCurrentPlanIndex(newIndex);
            }}
            disabled={currentPlanIndex === plans.length - 1}
            className="absolute -right-20 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white shadow-2xl transition-all hover:bg-blue-700 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Cards Container - Carousel on mobile, grid on desktop */}
          <div className="md:hidden overflow-hidden px-4">
            {/* Mobile: Show one card at a time */}
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentPlanIndex * 100}%)` }}
            >
              {plans.map((plan, index) => {
                // 根據方案類型決定徽章顏色 - 統一改為藍色
                const badgeColor = {
                  free: 'bg-gray-500',
                  pro: 'bg-blue-600',
                  enterprise: 'bg-blue-600'
                };
                
                // 判斷是否為低階方案（當前方案等級 > 此方案等級）
                const isLowerTierPlan = user && currentPlanTier > plan.tier;
                
                return (
                  <div key={plan.id} className="w-full flex-shrink-0 px-4">
                    <Card 
                      id={`plan-${plan.id}`}
                      className={`relative flex flex-col transition-all duration-500 ${
                        plan.highlighted 
                          ? 'border-2 border-blue-500 shadow-xl' 
                          : 'border border-gray-200'
                      } ${
                        highlightedPlan === plan.id
                          ? 'ring-4 ring-yellow-400 animate-pulse'
                          : ''
                      }`}
                    >
                      {plan.highlighted && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
                          {language === 'en' ? 'Most Popular' : '最受歡迎'}
                        </Badge>
                      )}
                      
                      {/* 當前方案徽章 - 根據���案類型使用不同顏色 */}
                      {user && subscription?.plan === plan.id && (
                        <Badge className={`absolute -top-3 right-4 ${badgeColor[plan.id]}`}>
                          {language === 'en' ? 'Current Plan' : '當前方案'}
                        </Badge>
                      )}
                      
                      <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <CardDescription className="text-base mt-2">
                          {plan.description}
                        </CardDescription>
                        <div className="mt-6">
                          <span className="text-5xl">{plan.price}</span>
                          <span className="text-gray-500 ml-1">{plan.period}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1">
                        <ul className="space-y-3">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-600">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>

                      <CardFooter>
                        <Button
                          className={`w-full transition-all duration-300 ${
                            user && subscription?.plan === plan.id
                              ? plan.id === 'free'
                                ? 'bg-gray-500 hover:bg-gray-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                              : isLowerTierPlan
                              ? 'bg-gray-400 hover:bg-gray-500 text-white'
                              : 'bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600'
                          }`}
                          variant={
                            user && subscription?.plan === plan.id
                              ? 'default'
                              : isLowerTierPlan
                              ? 'default'
                              : 'default'
                          }
                          size="lg"
                          onClick={(e) => {
                            console.log('🔘 Desktop Button clicked:', {
                              planId: plan.id,
                              planName: plan.name,
                              user: !!user,
                              userEmail: user?.email,
                              subscription: subscription,
                              subscriptionLoading,
                              isCurrentPlan: subscription?.plan === plan.id,
                              isLowerTierPlan,
                              isDisabled: subscriptionLoading || (user && subscription?.plan === plan.id)
                            });
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectPlan(plan.id);
                          }}
                          disabled={subscriptionLoading || (user && subscription?.plan === plan.id)}
                        >
                          {subscriptionLoading
                            ? (language === 'en' ? 'Loading...' : '載入中...')
                            : !user
                            ? (language === 'en' ? 'Sign In to Subscribe' : '登入以訂閱')
                            : subscription?.plan === plan.id
                            ? t.currentPlanLabel
                            : t.selectPlan
                          }
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop: Show all three cards side by side */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              // 計算當前方案的樣式類
              const isCurrentPlan = user && subscription?.plan === plan.id;
              
              // 判斷是否為低階方案（當前方案等級 > 此方案等級）
              const isLowerTierPlan = user && currentPlanTier > plan.tier;
              
              // 根據方案類型決定高亮顏色 - 統一改為藍色
              const currentPlanColors = {
                free: 'ring-4 ring-gray-500 shadow-xl scale-105',
                pro: 'ring-4 ring-blue-600 shadow-xl scale-105',
                enterprise: 'ring-4 ring-blue-600 shadow-xl scale-105'
              };
              
              const cardClassName = [
                'relative transition-all duration-300',
                // Hover 效果：浮現、放大、陰影
                'hover:scale-105 hover:-translate-y-2 hover:shadow-2xl cursor-pointer',
                // 當前方案的高亮效果（根據方案類型使用不同顏色）
                isCurrentPlan && currentPlanColors[plan.id],
                // 最受歡迎方案的高亮效果（只在不是當前方案時顯示）
                !isCurrentPlan && plan.highlighted && 'ring-2 ring-blue-500 shadow-lg scale-105'
              ].filter(Boolean).join(' ');
              
              // 根據方案類型決定徽章顏色 - 統一改為藍色
              const badgeColor = {
                free: 'bg-gray-500',
                pro: 'bg-blue-600',
                enterprise: 'bg-blue-600'
              };
              
              return (
                <Card 
                  key={plan.id}
                  id={`plan-${plan.id}`}
                  className={cardClassName}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
                      {language === 'en' ? 'Most Popular' : '最受歡迎'}
                    </Badge>
                  )}
                  
                  {/* 當前方案徽章 - 根據方案類型使用不同顏色 */}
                  {user && subscription?.plan === plan.id && (
                    <Badge className={`absolute -top-3 right-4 ${badgeColor[plan.id]}`}>
                      {language === 'en' ? 'Current Plan' : '當前方案'}
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-base mt-2">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-6">
                      <span className="text-5xl">{plan.price}</span>
                      <span className="text-gray-500 ml-1">{plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className={`w-full transition-all duration-300 ${
                        user && subscription?.plan === plan.id
                          ? plan.id === 'free'
                            ? 'bg-gray-500 hover:bg-gray-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                          : isLowerTierPlan
                          ? 'bg-gray-400 hover:bg-gray-500 text-white'
                          : 'bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600'
                      }`}
                      variant={
                        user && subscription?.plan === plan.id
                          ? 'default'
                          : isLowerTierPlan
                          ? 'default'
                          : 'default'
                      }
                      size="lg"
                      onClick={(e) => {
                        console.log('🔘 Desktop Button clicked:', {
                          planId: plan.id,
                          planName: plan.name,
                          user: !!user,
                          userEmail: user?.email,
                          subscription: subscription,
                          subscriptionLoading,
                          isCurrentPlan: subscription?.plan === plan.id,
                          isLowerTierPlan,
                          isDisabled: subscriptionLoading || (user && subscription?.plan === plan.id)
                        });
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectPlan(plan.id);
                      }}
                      disabled={subscriptionLoading || (user && subscription?.plan === plan.id)}
                    >
                      {subscriptionLoading
                        ? (language === 'en' ? 'Loading...' : '載入中...')
                        : !user
                        ? (language === 'en' ? 'Sign In to Subscribe' : '登入以訂閱')
                        : subscription?.plan === plan.id
                        ? t.currentPlanLabel
                        : t.selectPlan
                      }
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Carousel Indicators */}
          <div className="flex flex-col items-center gap-3 mt-8">
            {/* 標題文字 - 統一為藍色 */}
            <p className="text-sm font-medium transition-all duration-300 text-blue-600">
              {user && subscription?.plan 
                ? (language === 'en' ? 'Your Plan' : '您的方案')
                : (language === 'en' ? 'Choose Your Plan' : '選擇方案')
              }
            </p>
            
            {/* Dots 指示器 */}
            <div className="flex items-center gap-2">
              {plans.map((plan, index) => {
                const isCurrentPlan = user && subscription?.plan === plan.id;
                
                return (
                  <button
                    key={plan.id}
                    onClick={() => {
                      console.log('🔵 Dot clicked, index:', index);
                      setCurrentPlanIndex(index);
                    }}
                    className={`transition-all duration-300 rounded-full ${
                      isCurrentPlan
                        ? 'w-8 h-3 bg-blue-600 shadow-lg'
                        : index === currentPlanIndex
                        ? 'w-8 h-3 bg-blue-600'
                        : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`View ${plan.name} plan`}
                  />
                );
              })}
            </div>
          </div>
          
          {/* 移除之前新增的指示器 */}
          {/* 當前訂閱方案指示器 */}
          {false && user && subscription?.plan && (
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-8 bg-white border-2 border-gray-200 rounded-full px-8 py-4 shadow-lg">
                {plans.map((plan, index) => {
                  const isCurrentPlan = subscription?.plan === plan.id;
                  const indicatorColors = {
                    free: 'bg-gray-500 border-gray-500',
                    pro: 'bg-green-500 border-green-500',
                    enterprise: 'bg-cyan-500 border-cyan-500'
                  };
                  
                  return (
                    <div 
                      key={plan.id}
                      className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                        isCurrentPlan ? 'scale-110' : 'opacity-40'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all ${
                        isCurrentPlan 
                          ? `${indicatorColors[plan.id]} shadow-xl animate-pulse` 
                          : 'bg-gray-200 border-gray-300'
                      }`}>
                        {isCurrentPlan && (
                          <Check className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-medium transition-all ${
                          isCurrentPlan ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {plan.name}
                        </p>
                        {isCurrentPlan && (
                          <p className={`text-xs font-semibold mt-1 ${
                            plan.id === 'free' ? 'text-gray-600' :
                            plan.id === 'pro' ? 'text-green-600' :
                            'text-cyan-600'
                          }`}>
                            {language === 'en' ? 'Your Plan' : '您的方案'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-gray-700">
              {language === 'en' 
                ? '✨ All plans include secure escrow payments, milestone tracking, and basic platform features. Upgrade anytime to unlock more benefits!' 
                : '✨ 所有案均包含安全托管支付、里程碑追蹤和基本平台功能。隨時升級以解鎖更多優勢！'}
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Dialog */}
      {selectedPlan && (
        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          targetPlan={selectedPlan}
          billingCycle={billingCycle}
          onUpgradeSuccess={() => {
            console.log('✅ Upgrade successful! Refreshing subscription and wallet...');
            setShowUpgradeDialog(false);
            setSelectedPlan(null);
            // Refresh wallet balance and subscription after successful upgrade
            fetchWalletBalance();
            refreshLimits();
            // Trigger global subscription refresh event
            window.dispatchEvent(new Event('refreshSubscription'));
            // 顯示成功訊息
            toast.success(language === 'en' 
              ? `🎉 Successfully upgraded to ${selectedPlan === 'pro' ? 'Pro' : 'Enterprise'} plan!` 
              : `🎉 成功升級到${selectedPlan === 'pro' ? '專業版' : '企業版'}方案！`
            );
          }}
        />
      )}

      {/* Downgrade Dialog */}
      {showDowngradeDialog && selectedPlan && subscription?.plan && (
        <DowngradeDialog
          open={showDowngradeDialog}
          onOpenChange={setShowDowngradeDialog}
          currentPlan={subscription.plan}
          targetPlan={selectedPlan}
          accessToken={accessToken || ''}
          language={language}
          onSuccess={() => {
            console.log('✅ Downgrade successful! Refreshing subscription and wallet...');
            setShowDowngradeDialog(false);
            setSelectedPlan(null);
            // Refresh wallet balance and subscription after successful downgrade
            fetchWalletBalance();
            refreshLimits();
            // Trigger global subscription refresh event
            window.dispatchEvent(new Event('refreshSubscription'));
          }}
        />
      )}
    </div>
  );
}

export default PricingPage;