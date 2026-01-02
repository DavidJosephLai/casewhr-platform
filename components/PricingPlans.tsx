import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Check, Zap, Crown, Sparkles } from "lucide-react";
import { translations } from "../lib/translations";
import { PLAN_CONFIGS, PLAN_PRICES, type PlanType } from "../lib/permissions";

interface PricingPlansProps {
  language: "en" | "zh-TW" | "zh-CN";
  currentPlan?: PlanType;
  onSelectPlan: (plan: PlanType) => void;
  loading?: boolean;
}

export function PricingPlans({ language, currentPlan = "free", onSelectPlan, loading }: PricingPlansProps) {
  const t = language === "en" ? {
    title: "Choose Your Plan",
    subtitle: "Upgrade to unlock more features and grow your business",
    monthly: "/month",
    current: "Current Plan",
    upgrade: "Upgrade",
    downgrade: "Downgrade",
    free: {
      name: "Free",
      description: "Perfect for getting started",
      features: [
        "3 projects per month",
        "5 proposals per month",
        "20% platform fee",
        "Basic support",
        "Standard listing"
      ]
    },
    pro: {
      name: "Professional",
      description: "For active freelancers and clients",
      popular: "Most Popular",
      features: [
        "Unlimited projects",
        "Unlimited proposals",
        "10% platform fee",
        "Priority listing",
        "Verified badge",
        "Advanced analytics",
        "Basic support"
      ]
    },
    enterprise: {
      name: "Enterprise",
      description: "For teams and agencies",
      features: [
        "All Pro features",
        "5% platform fee",
        "Priority support 24/7",
        "Team management",
        "API access",
        "Custom branding",
        "Dedicated account manager"
      ]
    }
  } : language === "zh-TW" ? {
    title: "選擇您的方案",
    subtitle: "升級以解鎖更多功能並拓展您的業務",
    monthly: "/月",
    current: "當前方案",
    upgrade: "升級",
    downgrade: "降級",
    free: {
      name: "免費方案",
      description: "適合新手入門",
      features: [
        "每月最多 3 個專案",
        "每月最多 5 個提案",
        "20% 平台服務費",
        "基本客服",
        "標準展示"
      ]
    },
    pro: {
      name: "專業方案",
      description: "適合活躍的接案者和案主",
      popular: "最受歡迎",
      features: [
        "無限專案",
        "無限提案",
        "10% 平台服務費",
        "優先展示",
        "認證徽章",
        "進階分析",
        "基本客服"
      ]
    },
    enterprise: {
      name: "企業方案",
      description: "適合團隊和代理商",
      features: [
        "包含所有專業功能",
        "5% 平台服務費",
        "24/7 優先客服",
        "團隊管理",
        "API 訪問",
        "自訂品牌",
        "專屬客戶經理"
      ]
    }
  } : {
    title: "选择您的方案",
    subtitle: "升级以解锁更多功能并拓展您的业务",
    monthly: "/月",
    current: "当前方案",
    upgrade: "升级",
    downgrade: "降级",
    free: {
      name: "免费方案",
      description: "适合新手入门",
      features: [
        "每月最多 3 个项目",
        "每月最多 5 个提案",
        "20% 平台服务费",
        "基本客服",
        "标准展示"
      ]
    },
    pro: {
      name: "专业方案",
      description: "适合活跃的接案者和案主",
      popular: "最受欢迎",
      features: [
        "无限项目",
        "无限提案",
        "10% 平台服务费",
        "优先展示",
        "认证徽章",
        "高级分析",
        "基本客服"
      ]
    },
    enterprise: {
      name: "企业方案",
      description: "适合团队和代理商",
      features: [
        "包含所有专业功能",
        "5% 平台服务费",
        "24/7 优��客服",
        "团队管理",
        "API 访问",
        "自定义品牌",
        "专属客户经理"
      ]
    }
  };

  const plans = [
    {
      id: "free" as PlanType,
      icon: Sparkles,
      name: t.free.name,
      price: 0,
      description: t.free.description,
      features: t.free.features,
      color: "from-gray-50 to-gray-100",
      borderColor: "border-gray-200",
    },
    {
      id: "pro" as PlanType,
      icon: Zap,
      name: t.pro.name,
      price: language === 'en' ? 9.9 : 300,
      description: t.pro.description,
      features: t.pro.features,
      popular: true,
      color: "from-blue-50 to-blue-100",
      borderColor: "border-blue-300",
    },
    {
      id: "enterprise" as PlanType,
      icon: Crown,
      name: t.enterprise.name,
      price: language === 'en' ? 29 : 900,
      description: t.enterprise.description,
      features: t.enterprise.features,
      color: "from-purple-50 to-purple-100",
      borderColor: "border-purple-300",
    },
  ];

  const getPlanIndex = (plan: PlanType) => {
    return plans.findIndex(p => p.id === plan);
  };

  const isUpgrade = (plan: PlanType) => {
    return getPlanIndex(plan) > getPlanIndex(currentPlan);
  };

  const isDowngrade = (plan: PlanType) => {
    return getPlanIndex(plan) < getPlanIndex(currentPlan);
  };

  const isCurrent = (plan: PlanType) => {
    return plan === currentPlan;
  };

  return (
    <div className="w-full py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl mb-4">{t.title}</h2>
          <p className="text-xl text-gray-600">{t.subtitle}</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  plan.popular ? 'border-2 ' + plan.borderColor : 'border ' + plan.borderColor
                } ${
                  isCurrent(plan.id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="bg-blue-600 text-white rounded-bl-lg rounded-tr-lg border-0 py-1 px-3">
                      {t.pro.popular}
                    </Badge>
                  </div>
                )}

                {/* Current Badge */}
                {isCurrent(plan.id) && (
                  <div className="absolute top-0 left-0">
                    <Badge className="bg-green-600 text-white rounded-br-lg rounded-tl-lg border-0 py-1 px-3">
                      {t.current}
                    </Badge>
                  </div>
                )}

                <div className={`bg-gradient-to-br ${plan.color} p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Icon className="size-6 text-blue-600" />
                    </div>
                    <h3 className="text-2xl">{plan.name}</h3>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      {language === 'en' ? (
                        <span className="text-4xl">${plan.price}</span>
                      ) : (
                        <span className="text-4xl">NT${plan.price}</span>
                      )}
                      <span className="text-gray-600">{t.monthly}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrent(plan.id) ? "outline" : plan.popular ? "default" : "outline"}
                    disabled={isCurrent(plan.id) || loading}
                    onClick={() => onSelectPlan(plan.id)}
                  >
                    {isCurrent(plan.id)
                      ? t.current
                      : isUpgrade(plan.id)
                      ? t.upgrade
                      : t.downgrade}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}