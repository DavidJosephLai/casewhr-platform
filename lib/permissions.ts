// 會員方案定義
export type PlanType = 'free' | 'pro' | 'enterprise';

export interface PlanLimits {
  maxProjectsPerMonth: number | null; // null = unlimited
  maxProposalsPerMonth: number | null;
  platformFeePercentage: number;
  features: string[];
}

export const PLAN_CONFIGS: Record<PlanType, PlanLimits> = {
  free: {
    maxProjectsPerMonth: 3,
    maxProposalsPerMonth: 5,
    platformFeePercentage: 20,
    features: ['basic_support', 'standard_listing'],
  },
  pro: {
    maxProjectsPerMonth: null, // unlimited
    maxProposalsPerMonth: null,
    platformFeePercentage: 10,
    features: ['basic_support', 'priority_listing', 'advanced_analytics', 'verified_badge'],
  },
  enterprise: {
    maxProjectsPerMonth: null,
    maxProposalsPerMonth: null,
    platformFeePercentage: 5,
    features: ['priority_support', 'priority_listing', 'advanced_analytics', 'verified_badge', 'team_management', 'api_access', 'custom_branding'],
  },
};

export const PLAN_PRICES = {
  free: 0,
  pro: 9.9,
  enterprise: 29,
};

export interface Subscription {
  user_id: string;
  plan: PlanType;
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
}

// 檢查用戶是否可以執行某個操作
export function canPerformAction(
  subscription: Subscription | null,
  action: 'create_project' | 'submit_proposal',
  currentCount: number
): { allowed: boolean; reason?: string } {
  // 如果沒有訂閱，視為免費方案
  const plan = subscription?.plan || 'free';
  const limits = PLAN_CONFIGS[plan];

  if (action === 'create_project') {
    if (limits.maxProjectsPerMonth === null) {
      return { allowed: true };
    }
    if (currentCount >= limits.maxProjectsPerMonth) {
      return {
        allowed: false,
        reason: `You have reached the limit of ${limits.maxProjectsPerMonth} projects per month on the ${plan} plan.`,
      };
    }
  }

  if (action === 'submit_proposal') {
    if (limits.maxProposalsPerMonth === null) {
      return { allowed: true };
    }
    if (currentCount >= limits.maxProposalsPerMonth) {
      return {
        allowed: false,
        reason: `You have reached the limit of ${limits.maxProposalsPerMonth} proposals per month on the ${plan} plan.`,
      };
    }
  }

  return { allowed: true };
}

// 獲取平台服務費
export function getPlatformFee(subscription: Subscription | null, amount: number): number {
  const plan = subscription?.plan || 'free';
  const feePercentage = PLAN_CONFIGS[plan].platformFeePercentage;
  return (amount * feePercentage) / 100;
}

// 檢查用戶是否有某個功能
export function hasFeature(subscription: Subscription | null, feature: string): boolean {
  const plan = subscription?.plan || 'free';
  return PLAN_CONFIGS[plan].features.includes(feature);
}