/**
 * 🔄 訂閱制定期扣款管理組件
 * Recurring Subscription Manager Component
 * 
 * 支援 PayPal 和 ECPay 的定期扣款訂閱
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  DollarSign,
  Repeat
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface RecurringSubscriptionManagerProps {
  userId: string;
  accessToken: string;
  language?: 'en' | 'zh' | 'zh-CN';
}

export function RecurringSubscriptionManager({
  userId,
  accessToken,
  language = 'en'
}: RecurringSubscriptionManagerProps) {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  // 🔧 FIX: 正規化語言代碼，確保匹配翻譯對象
  const normalizedLanguage = language === 'zh' || language === 'zh-CN' ? language : 'en';

  // 文案
  const translations = {
    en: {
      title: 'Recurring Subscription',
      subtitle: 'Manage your automatic subscription payments',
      currentPlan: 'Current Plan',
      free: 'Free',
      pro: 'Pro',
      enterprise: 'Enterprise',
      status: 'Status',
      active: 'Active',
      cancelled: 'Cancelled',
      suspended: 'Suspended',
      paymentMethod: 'Payment Method',
      billingCycle: 'Billing Cycle',
      monthly: 'Monthly',
      nextBillingDate: 'Next Billing Date',
      autoRenew: 'Auto Renew',
      enabled: 'Enabled',
      disabled: 'Disabled',
      upgradeWithPayPal: 'Subscribe with PayPal (Auto-Renewal)',
      upgradeWithECPay: 'Subscribe with ECPay (Taiwan Only)',
      cancelSubscription: 'Cancel Subscription',
      confirmCancel: 'Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.',
      cancelling: 'Cancelling...',
      upgrading: 'Processing...',
      noPlan: 'You don\'t have an active subscription plan.',
      choosePlan: 'Choose a plan to get started:',
      proMonthly: 'Pro - $29/month',
      enterpriseMonthly: 'Enterprise - $99/month',
      proFeatures: 'Unlimited projects, Priority support, Advanced features',
      enterpriseFeatures: 'Everything in Pro + Custom branding, Dedicated account manager, API access',
    },
    zh: {
      title: '訂閱制自動扣款',
      subtitle: '管理您的自動訂閱付款',
      currentPlan: '當前方案',
      free: '免費版',
      pro: '專業版',
      enterprise: '企業版',
      status: '狀態',
      active: '啟用中',
      cancelled: '已取消',
      suspended: '已暫停',
      paymentMethod: '付款方式',
      billingCycle: '計費週期',
      monthly: '每月',
      nextBillingDate: '下次扣款日期',
      autoRenew: '自動續訂',
      enabled: '已啟用',
      disabled: '已停用',
      upgradeWithPayPal: '使用 PayPal 訂閱（自動續訂）',
      upgradeWithECPay: '使用綠界科技訂閱（台灣專用）',
      cancelSubscription: '取消訂閱',
      confirmCancel: '確定要取消訂閱嗎？您將繼續享有服務直到當前計費週期結束。',
      cancelling: '取消中...',
      upgrading: '處理中...',
      noPlan: '您目前沒有啟用的訂閱方案。',
      choosePlan: '選擇方案開始使用：',
      proMonthly: '專業版 - NT$990/月',
      enterpriseMonthly: '企業版 - NT$3,299/月',
      proFeatures: '無限專案、優先支援、進階功能',
      enterpriseFeatures: '專業版所有功能 + 客製化品牌、專屬客戶經理、API 存取',
    },
    'zh-CN': {
      title: '订阅制自动扣款',
      subtitle: '管理您的自动订阅付款',
      currentPlan: '当前方案',
      free: '免费版',
      pro: '专业版',
      enterprise: '企业版',
      status: '状态',
      active: '启用中',
      cancelled: '已取消',
      suspended: '已暂停',
      paymentMethod: '付款方式',
      billingCycle: '计费周期',
      monthly: '每月',
      nextBillingDate: '下次扣款日期',
      autoRenew: '自动续订',
      enabled: '已启用',
      disabled: '已停用',
      upgradeWithPayPal: '使用 PayPal 订阅（自动续订）',
      upgradeWithECPay: '使用绿界科技订阅（台湾专用）',
      cancelSubscription: '取消订阅',
      confirmCancel: '确定要取消订阅吗？您将继续享有服务直到当前计费周期结束。',
      cancelling: '取消中...',
      upgrading: '处理中...',
      noPlan: '您目前没有启用的订阅方案。',
      choosePlan: '选择方案开始使用：',
      proMonthly: '专业版 - $29/月',
      enterpriseMonthly: '企业版 - $99/月',
      proFeatures: '无限项目、优先支持、进阶功能',
      enterpriseFeatures: '专业版所有功能 + 客制化品牌、专属客户经理、API 访问',
    },
  };

  // 載入訂閱信息
  useEffect(() => {
    loadSubscription();
  }, [userId]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/${userId}`,
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
      console.error('Error loading subscription:', error);
      toast.error(language === 'en' ? 'Failed to load subscription' : '載入訂閱信息失敗');
    } finally {
      setLoading(false);
    }
  };

  // 使用 PayPal 訂閱
  const subscribeWithPayPal = async (planType: 'pro' | 'enterprise') => {
    try {
      setProcessing(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/paypal/create-recurring`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ planType }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create PayPal subscription');
      }

      const data = await response.json();
      
      // 跳轉到 PayPal 批准頁面
      window.location.href = data.approvalUrl;
    } catch (error: any) {
      console.error('Error creating PayPal subscription:', error);
      toast.error(language === 'en' ? 'Failed to create subscription' : '創建訂閱失敗');
    } finally {
      setProcessing(false);
    }
  };

  // 使用 ECPay 訂閱
  const subscribeWithECPay = async (planType: 'pro' | 'enterprise') => {
    try {
      setProcessing(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/ecpay/create-recurring`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ planType }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create ECPay subscription');
      }

      // ECPay 返回 HTML form，直接渲染並提交
      const html = await response.text();
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);
    } catch (error: any) {
      console.error('Error creating ECPay subscription:', error);
      toast.error(language === 'en' ? 'Failed to create subscription' : '創建訂閱失敗');
      setProcessing(false);
    }
  };

  // 取消訂閱
  const cancelSubscription = async () => {
    if (!confirm(translations[normalizedLanguage].confirmCancel)) {
      return;
    }

    try {
      setProcessing(true);
      
      const endpoint = subscription.payment_method === 'paypal'
        ? '/subscription/paypal/cancel-recurring'
        : '/subscription/ecpay/cancel-recurring';

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ reason: 'User requested cancellation' }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      toast.success(language === 'en' ? 'Subscription cancelled successfully' : '訂閱已成功取消');
      await loadSubscription();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(language === 'en' ? 'Failed to cancel subscription' : '取消訂閱失敗');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  const hasActiveSubscription = subscription?.status === 'active' && 
                                 (subscription?.plan === 'pro' || subscription?.plan === 'enterprise');

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{translations[normalizedLanguage].title}</h2>
        <p className="text-gray-600 mt-1">{translations[normalizedLanguage].subtitle}</p>
      </div>

      {hasActiveSubscription ? (
        /* 現有訂閱信息 */
        <Card className="p-6">
          <div className="space-y-4">
            {/* 方案信息 */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <div className="text-sm text-gray-600">{translations[normalizedLanguage].currentPlan}</div>
                <div className="text-2xl font-bold text-blue-600">
                  {subscription.plan === 'pro' ? translations[normalizedLanguage].pro : translations[normalizedLanguage].enterprise}
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                subscription.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : subscription.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {subscription.status === 'active' ? translations[normalizedLanguage].active :
                 subscription.status === 'cancelled' ? translations[normalizedLanguage].cancelled : translations[normalizedLanguage].suspended}
              </div>
            </div>

            {/* 訂閱詳情 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">{translations[normalizedLanguage].paymentMethod}</div>
                  <div className="font-semibold">
                    {subscription.payment_method === 'paypal' ? 'PayPal' : 
                     subscription.payment_method === 'ecpay' ? 'ECPay' : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Repeat className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">{translations[normalizedLanguage].billingCycle}</div>
                  <div className="font-semibold">{translations[normalizedLanguage].monthly}</div>
                </div>
              </div>

              {subscription.next_billing_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">{translations[normalizedLanguage].nextBillingDate}</div>
                    <div className="font-semibold">
                      {new Date(subscription.next_billing_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                {subscription.auto_renew ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className="text-sm text-gray-600">{translations[normalizedLanguage].autoRenew}</div>
                  <div className="font-semibold">
                    {subscription.auto_renew ? translations[normalizedLanguage].enabled : translations[normalizedLanguage].disabled}
                  </div>
                </div>
              </div>
            </div>

            {/* 取消訂閱按鈕 */}
            {subscription.status === 'active' && (
              <div className="pt-4 border-t">
                <Button
                  onClick={cancelSubscription}
                  disabled={processing}
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {translations[normalizedLanguage].cancelling}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      {translations[normalizedLanguage].cancelSubscription}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        /* 訂閱選項 */
        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              {translations[normalizedLanguage].noPlan}
            </AlertDescription>
          </Alert>

          <div className="text-lg font-semibold text-gray-900">
            {translations[normalizedLanguage].choosePlan}
          </div>

          {/* Pro 方案 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{translations[normalizedLanguage].pro}</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {language === 'zh' ? 'NT$480/月' : '$15/month'}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-blue-600" />
              </div>
              <p className="text-gray-600">{translations[normalizedLanguage].proFeatures}</p>
              <div className="flex gap-3">
                <Button
                  onClick={() => subscribeWithPayPal('pro')}
                  disabled={processing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    translations[normalizedLanguage].upgradeWithPayPal
                  )}
                </Button>
                {/* ✅ ECPay 按鈕：繁體中文 OR 簡體中文時顯示 */}
                {(language === 'zh' || language === 'zh-CN') && (
                  <Button
                    onClick={() => subscribeWithECPay('pro')}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      translations[normalizedLanguage].upgradeWithECPay
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Enterprise 方案 */}
          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-purple-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{translations[normalizedLanguage].enterprise}</h3>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {language === 'zh' ? 'NT$1,400/月' : '$45/month'}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-purple-600" />
              </div>
              <p className="text-gray-600">{translations[normalizedLanguage].enterpriseFeatures}</p>
              <div className="flex gap-3">
                <Button
                  onClick={() => subscribeWithPayPal('enterprise')}
                  disabled={processing}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    translations[normalizedLanguage].upgradeWithPayPal
                  )}
                </Button>
                {/* ✅ ECPay 按鈕：繁體中文 OR 簡體中文時顯示 */}
                {(language === 'zh' || language === 'zh-CN') && (
                  <Button
                    onClick={() => subscribeWithECPay('enterprise')}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      translations[normalizedLanguage].upgradeWithECPay
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default RecurringSubscriptionManager;