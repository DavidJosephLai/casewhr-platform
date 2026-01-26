import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { SubscriptionBadge, getSubscriptionName } from './SubscriptionBadge';
import { 
  AlertTriangle, 
  ArrowDown, 
  XCircle, 
  Check,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DowngradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: 'free' | 'pro' | 'enterprise';
  targetPlan: 'free' | 'pro' | 'enterprise';
  accessToken: string;
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
  onSuccess?: () => void;
}

const planNames = {
  en: {
    free: 'Free',
    pro: 'Professional',
    enterprise: 'Enterprise'
  },
  zh: {
    free: '免費版',
    pro: '專業版',
    enterprise: '企業版'
  }
};

const featureLimitations = {
  downgradeToFree: {
    en: [
      'Limited to 3 active projects',
      'Limited to 5 proposals per month',
      'Platform service fee increases to 20%',
      'No verification badge',
      'No priority listing',
      'No advanced analytics',
      'No team management'
    ],
    zh: [
      '僅限 3 個活項目',
      '月僅限 5 個提案',
      '平台服務費提高至 20%',
      '無認證徽章',
      '無優先展示',
      '無高級數據分析',
      '無團隊管理'
    ]
  },
  downgradeToPro: {
    en: [
      'Limited to 20 active projects (from unlimited)',
      'Limited to 30 proposals per month (from unlimited)',
      'Platform service fee increases to 10% (from 5%)',
      'No advanced analytics',
      'No team management'
    ],
    zh: [
      '僅限 20 個活躍項目（原無限制）',
      '每月僅限 30 個提案（原無限制）',
      '平台服務費提高至 10%（原 5%）',
      '無高級數據分析',
      '無團隊管理'
    ]
  }
};

export function DowngradeDialog({
  open,
  onOpenChange,
  currentPlan,
  targetPlan,
  accessToken,
  language = 'en',
  onSuccess
}: DowngradeDialogProps) {
  const [loading, setLoading] = useState(false);

  const translations = {
    en: {
      title: 'Confirm Downgrade',
      description: 'Are you sure you want to downgrade your subscription?',
      currentPlan: 'Current Plan',
      downgradeTo: 'Downgrade To',
      warning: 'Important: You will lose access to the following features',
      immediate: 'This change will take effect immediately',
      cancel: 'Cancel',
      confirm: 'Confirm Downgrade',
      processing: 'Processing...',
      success: 'Subscription downgraded successfully!',
      error: 'Failed to downgrade subscription',
      errorDesc: 'Please try again or contact support if the problem persists.'
    },
    zh: {
      title: '確認降級',
      description: '您確定要降級您的訂閱嗎？',
      currentPlan: '當前方案',
      downgradeTo: '降級至',
      warning: '重要提示：您將失去以下功能',
      immediate: '此變更將立即生效',
      cancel: '取消',
      confirm: '確認降級',
      processing: '處理中...',
      success: '訂閱降級成功！',
      error: '訂閱降級失敗',
      errorDesc: '請重試，如果問題持續存在，請聯繫客服。'
    }
  };

  // Get the correct language key (normalize zh-TW and zh-CN to zh)
  const langKey = language === 'en' ? 'en' : 'zh';
  const t = translations[langKey];

  const getLimitations = () => {
    if (targetPlan === 'free') {
      return featureLimitations.downgradeToFree[langKey];
    } else if (targetPlan === 'pro' && currentPlan === 'enterprise') {
      return featureLimitations.downgradeToPro[langKey];
    }
    return [];
  };

  const handleDowngrade = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/downgrade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            plan: targetPlan,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Downgrade failed');
      }

      const data = await response.json();
      console.log('✅ Downgrade successful:', data);

      toast.success(t.success, {
        description: language === 'en' 
          ? `Your plan has been changed to ${planNames.en[targetPlan]}`
          : `您的方案已更改為${planNames.zh[targetPlan]}`,
        duration: 5000,
      });

      // 🔧 先關閉對話框
      onOpenChange(false);
      
      // 🔧 延遲執行回調，避免 React DOM 渲染衝突
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 100);
    } catch (error) {
      console.error('❌ Downgrade error:', error);
      toast.error(t.error, {
        description: t.errorDesc,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limitations = getLimitations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-6 text-orange-600" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>

        {/* Plan Change Visual */}
        <div className="py-6">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <Badge className="mb-2 bg-blue-600 text-white">
                {t.currentPlan}
              </Badge>
              <div className="text-xl">
                {planNames[langKey][currentPlan]}
              </div>
            </div>
            <ArrowDown className="size-8 text-orange-600" />
            <div className="text-center">
              <Badge className="mb-2 bg-gray-600 text-white">
                {t.downgradeTo}
              </Badge>
              <div className="text-xl">
                {planNames[langKey][targetPlan]}
              </div>
            </div>
          </div>
        </div>

        {/* Warning Section */}
        {limitations.length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-orange-900 mb-3">
                  {t.warning}
                </h4>
                <ul className="space-y-2">
                  {limitations.map((limitation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-orange-800">
                      <XCircle className="size-4 flex-shrink-0 mt-0.5" />
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Immediate Effect Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="size-4 text-blue-600" />
          <p className="text-sm text-blue-900">{t.immediate}</p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDowngrade}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                {t.processing}
              </>
            ) : (
              <>
                <ArrowDown className="size-4 mr-2" />
                {t.confirm}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}