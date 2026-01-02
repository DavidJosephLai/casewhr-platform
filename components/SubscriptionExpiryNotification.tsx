import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface SubscriptionStatus {
  tier: string;
  status: string;
  endDate: string;
  daysUntilExpiry: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  isInGracePeriod: boolean;
}

export function SubscriptionExpiryNotification() {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const content = {
    en: {
      // Expiring Soon (7+ days)
      expiringSoon: {
        title: 'Subscription Expiring Soon',
        message: 'Your {{tier}} subscription will expire in {{days}} days',
        action: 'Renew Now',
      },
      
      // Expiring Very Soon (3-6 days)
      expiringVerySoon: {
        title: 'Action Required: Subscription Expiring',
        message: 'Only {{days}} days left on your {{tier}} subscription',
        action: 'Renew Now',
      },
      
      // Expiring Tomorrow (1-2 days)
      expiringTomorrow: {
        title: 'Urgent: Subscription Expires Tomorrow',
        message: 'Your {{tier}} subscription expires in {{days}} day(s)!',
        action: 'Renew Immediately',
      },
      
      // Expires Today
      expiringToday: {
        title: '⚠️ Subscription Expires Today',
        message: 'Your {{tier}} subscription expires today! Renew now to avoid service interruption.',
        action: 'Renew Now',
      },
      
      // Expired (Grace Period)
      expired: {
        title: '⛔ Subscription Expired',
        message: 'Your {{tier}} subscription expired {{days}} day(s) ago. Some features are now limited.',
        action: 'Reactivate Now',
      },
      
      // Expired (After Grace Period)
      expiredFinal: {
        title: '⛔ Subscription Inactive',
        message: 'Your subscription has been downgraded to Free tier. Upgrade to restore premium features.',
        action: 'Upgrade Now',
      },
      
      benefits: {
        title: 'Keep your benefits:',
        professional: [
          'Priority support',
          'Advanced analytics',
          'Featured listings',
          '10% platform fee',
        ],
        enterprise: [
          'Team management',
          'Dedicated account manager',
          'Custom contracts',
          'API access',
          '5% platform fee',
        ],
      },
      
      expiryDate: 'Expires on',
      gracePeriod: 'Grace period ends',
      dismiss: 'Dismiss',
      remindLater: 'Remind me later',
      
      tiers: {
        professional: 'Professional',
        enterprise: 'Enterprise',
      },
    },
    zh: {
      // Expiring Soon (7+ days)
      expiringSoon: {
        title: '訂閱即將到期',
        message: '您的{{tier}}訂閱將在 {{days}} 天後到期',
        action: '立即續訂',
      },
      
      // Expiring Very Soon (3-6 days)
      expiringVerySoon: {
        title: '需要處理：訂閱即將到期',
        message: '您的{{tier}}訂閱僅剩 {{days}} 天',
        action: '立即續訂',
      },
      
      // Expiring Tomorrow (1-2 days)
      expiringTomorrow: {
        title: '緊急：訂閱明天到期',
        message: '您的{{tier}}訂閱將在 {{days}} 天後到期！',
        action: '馬上續訂',
      },
      
      // Expires Today
      expiringToday: {
        title: '⚠️ 訂閱今天到期',
        message: '您的{{tier}}訂閱今天到期！立即續訂以避免服務中斷。',
        action: '立即續訂',
      },
      
      // Expired (Grace Period)
      expired: {
        title: '⛔ 訂閱已過期',
        message: '您的{{tier}}訂閱已過期 {{days}} 天。部分功能現已受限。',
        action: '立即重新激活',
      },
      
      // Expired (Final)
      expiredFinal: {
        title: '⛔ 訂閱已停用',
        message: '您的訂閱已降級為免費版。升級以恢復高級功能。',
        action: '立即升級',
      },
      
      benefits: {
        title: '保留您的權益：',
        professional: [
          '優先客服支援',
          '進階數據分析',
          '專案置頂顯示',
          '10% 平台手續費',
        ],
        enterprise: [
          '團隊管理功能',
          '專屬客戶經理',
          '客製化合約',
          'API 存取權限',
          '5% 平台手續費',
        ],
      },
      
      expiryDate: '到期日',
      gracePeriod: '寬限期結束',
      dismiss: '關閉',
      remindLater: '稍後提醒',
      
      tiers: {
        professional: '專業版',
        enterprise: '企業版',
      },
    },
  };

  const t = content[language];

  useEffect(() => {
    if (profile?.subscription_end_date) {
      calculateStatus();
    }
    
    // Check every hour
    const interval = setInterval(calculateStatus, 3600000);
    return () => clearInterval(interval);
  }, [profile]);

  const calculateStatus = () => {
    if (!profile?.subscription_end_date) return;

    const endDate = new Date(profile.subscription_end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const tier = profile.membership_tier || 'free';
    
    // Skip if free tier
    if (tier === 'free') return;

    const gracePeriodDays = 7;
    const isExpired = diffDays < 0;
    const isInGracePeriod = isExpired && Math.abs(diffDays) <= gracePeriodDays;
    const isExpiringSoon = !isExpired && diffDays <= 7;

    setStatus({
      tier,
      status: profile.subscription_status || 'active',
      endDate: profile.subscription_end_date,
      daysUntilExpiry: diffDays,
      isExpiringSoon,
      isExpired,
      isInGracePeriod,
    });
  };

  const getNotificationContent = () => {
    if (!status) return null;

    const tierName = t.tiers[status.tier as keyof typeof t.tiers] || status.tier;
    const days = Math.abs(status.daysUntilExpiry);

    // Expired (after grace period)
    if (status.isExpired && !status.isInGracePeriod) {
      return {
        ...t.expiredFinal,
        variant: 'destructive' as const,
        icon: AlertTriangle,
        urgency: 'critical',
      };
    }

    // Expired (in grace period)
    if (status.isExpired && status.isInGracePeriod) {
      return {
        ...t.expired,
        message: t.expired.message.replace('{{tier}}', tierName).replace('{{days}}', days.toString()),
        variant: 'destructive' as const,
        icon: AlertTriangle,
        urgency: 'high',
      };
    }

    // Expires today
    if (status.daysUntilExpiry === 0) {
      return {
        ...t.expiringToday,
        message: t.expiringToday.message.replace('{{tier}}', tierName),
        variant: 'destructive' as const,
        icon: Clock,
        urgency: 'high',
      };
    }

    // Expires tomorrow or day after
    if (status.daysUntilExpiry <= 2) {
      return {
        ...t.expiringTomorrow,
        message: t.expiringTomorrow.message.replace('{{tier}}', tierName).replace('{{days}}', days.toString()),
        variant: 'destructive' as const,
        icon: Clock,
        urgency: 'high',
      };
    }

    // Expires in 3-6 days
    if (status.daysUntilExpiry <= 6) {
      return {
        ...t.expiringVerySoon,
        message: t.expiringVerySoon.message.replace('{{tier}}', tierName).replace('{{days}}', days.toString()),
        variant: 'default' as const,
        icon: Bell,
        urgency: 'medium',
      };
    }

    // Expires in 7+ days
    return {
      ...t.expiringSoon,
      message: t.expiringSoon.message.replace('{{tier}}', tierName).replace('{{days}}', days.toString()),
      variant: 'default' as const,
      icon: Bell,
      urgency: 'low',
    };
  };

  const handleRenew = () => {
    navigate('/subscription-upgrade');
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal in localStorage with expiry
    const dismissalKey = `subscription-notification-dismissed-${status?.endDate}`;
    localStorage.setItem(dismissalKey, new Date().toISOString());
    
    toast.success(
      language === 'en' 
        ? "We'll remind you again tomorrow" 
        : '我們會在明天再次提醒您',
      { duration: 3000 }
    );
  };

  // Check if previously dismissed
  useEffect(() => {
    if (status) {
      const dismissalKey = `subscription-notification-dismissed-${status.endDate}`;
      const dismissedAt = localStorage.getItem(dismissalKey);
      
      if (dismissedAt) {
        const dismissedDate = new Date(dismissedAt);
        const now = new Date();
        const hoursSinceDismissal = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
        
        // Show again after 24 hours
        if (hoursSinceDismissal < 24) {
          setDismissed(true);
        } else {
          localStorage.removeItem(dismissalKey);
        }
      }
    }
  }, [status]);

  if (!status || !status.isExpiringSoon && !status.isExpired || dismissed) {
    return null;
  }

  const notificationContent = getNotificationContent();
  if (!notificationContent) return null;

  const Icon = notificationContent.icon;
  const benefits = status.tier === 'enterprise' 
    ? t.benefits.enterprise 
    : t.benefits.professional;

  return (
    <Alert 
      variant={notificationContent.variant}
      className={`mb-6 ${
        notificationContent.urgency === 'critical' 
          ? 'border-red-600 bg-red-50 animate-pulse' 
          : notificationContent.urgency === 'high'
          ? 'border-orange-500 bg-orange-50'
          : 'border-blue-500 bg-blue-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Icon className={`h-6 w-6 ${
            notificationContent.urgency === 'critical' || notificationContent.urgency === 'high'
              ? 'text-red-600'
              : 'text-blue-600'
          }`} />
          
          <div className="flex-1">
            <AlertTitle className="text-lg font-bold mb-2">
              {notificationContent.title}
            </AlertTitle>
            
            <AlertDescription className="space-y-4">
              <p className="text-base">
                {notificationContent.message}
              </p>

              {/* Expiry Date */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  {status.isExpired ? t.gracePeriod : t.expiryDate}:
                </span>
                <span className="font-mono">
                  {new Date(status.endDate).toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US')}
                </span>
              </div>

              {/* Benefits List */}
              {!status.isExpired && (
                <div className="bg-white rounded-lg p-4 border">
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    {t.benefits.title}
                  </p>
                  <ul className="space-y-1.5 ml-6">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleRenew}
                  size="lg"
                  className={`${
                    notificationContent.urgency === 'critical' || notificationContent.urgency === 'high'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {notificationContent.action}
                </Button>
                
                {notificationContent.urgency !== 'critical' && (
                  <Button
                    onClick={handleDismiss}
                    variant="outline"
                    size="lg"
                  >
                    {t.remindLater}
                  </Button>
                )}
              </div>
            </AlertDescription>
          </div>
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}