import { Badge } from './ui/badge';
import { Crown, Zap, Gift } from 'lucide-react';

interface SubscriptionBadgeProps {
  plan: 'free' | 'pro' | 'enterprise';
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const planConfig = {
  free: {
    name: { en: 'Free', zh: '免費版', 'zh-TW': '免費版', 'zh-CN': '免费版' },
    color: 'bg-gray-500',
    textColor: 'text-white',
    icon: Gift,
  },
  pro: {
    name: { en: 'Professional', zh: '專業版', 'zh-TW': '專業版', 'zh-CN': '专业版' },
    color: 'bg-blue-600',
    textColor: 'text-white',
    icon: Zap,
  },
  enterprise: {
    name: { en: 'Enterprise', zh: '企業版', 'zh-TW': '企業版', 'zh-CN': '企业版' },
    color: 'bg-gradient-to-r from-amber-500 to-orange-600',
    textColor: 'text-white',
    icon: Crown,
  },
};

const sizeConfig = {
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    icon: 'size-3',
  },
  md: {
    badge: 'px-3 py-1 text-sm',
    icon: 'size-4',
  },
  lg: {
    badge: 'px-4 py-1.5 text-base',
    icon: 'size-5',
  },
};

export function SubscriptionBadge({
  plan,
  language = 'en',
  size = 'md',
  showIcon = true,
}: SubscriptionBadgeProps) {
  const config = planConfig[plan];
  const sizeStyle = sizeConfig[size];
  const Icon = config.icon;

  return (
    <Badge 
      className={`${config.color} ${config.textColor} ${sizeStyle.badge} font-semibold inline-flex items-center gap-1.5 shadow-sm`}
    >
      {showIcon && <Icon className={sizeStyle.icon} />}
      <span>{config.name[language] || config.name.en}</span>
    </Badge>
  );
}

// 用於 Toast 通知的圖標
export function getSubscriptionIcon(plan: 'free' | 'pro' | 'enterprise') {
  const config = planConfig[plan];
  return config.icon;
}

// 用於獲取方案名稱
export function getSubscriptionName(plan: 'free' | 'pro' | 'enterprise', language: 'en' | 'zh' | 'zh-TW' | 'zh-CN' = 'en') {
  return planConfig[plan].name[language] || planConfig[plan].name.en;
}