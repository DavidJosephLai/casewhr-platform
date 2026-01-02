import { useLanguage } from "../lib/LanguageContext";
import { isChinese } from "../lib/translations";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  Target, 
  Shield, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  TrendingUp,
  Lock,
  Users,
  FileCheck
} from "lucide-react";

export function MilestoneFeature() {
  const { language } = useLanguage();

  const content = {
    en: {
      badge: "NEW FEATURE",
      title: "Milestone Payment System",
      subtitle: "Break down large projects into manageable phases with secure payments",
      description: "Our innovative milestone-based payment system protects both clients and freelancers by splitting projects into structured phases. Pay only for completed work, reduce risk, and maintain full control over your project budget.",
      features: [
        {
          icon: Target,
          title: "Structured Milestones",
          description: "Define clear deliverables, timelines, and payment amounts for each project phase",
          color: "text-blue-600",
          bgColor: "bg-blue-50"
        },
        {
          icon: Shield,
          title: "Protected Payments",
          description: "Each milestone payment is securely held in escrow until work is approved",
          color: "text-green-600",
          bgColor: "bg-green-50"
        },
        {
          icon: Clock,
          title: "Progress Tracking",
          description: "Real-time visibility into project progress with visual milestone completion",
          color: "text-purple-600",
          bgColor: "bg-purple-50"
        },
        {
          icon: DollarSign,
          title: "Flexible Payment",
          description: "Release funds incrementally as each milestone is delivered and approved",
          color: "text-orange-600",
          bgColor: "bg-orange-50"
        },
        {
          icon: CheckCircle2,
          title: "Quality Assurance",
          description: "Review and request changes before approving each milestone payment",
          color: "text-teal-600",
          bgColor: "bg-teal-50"
        },
        {
          icon: TrendingUp,
          title: "Reduced Risk",
          description: "Minimize financial risk by paying only for completed and approved work",
          color: "text-indigo-600",
          bgColor: "bg-indigo-50"
        }
      ],
      benefits: {
        title: "How It Works",
        steps: [
          {
            icon: FileCheck,
            title: "Define Milestones",
            description: "Freelancer proposes project milestones with deliverables and timelines"
          },
          {
            icon: Lock,
            title: "Secure Funds",
            description: "Client approves proposal and funds are locked in escrow"
          },
          {
            icon: Users,
            title: "Work & Review",
            description: "Freelancer completes each milestone, client reviews and approves"
          },
          {
            icon: DollarSign,
            title: "Auto-Release",
            description: "Approved milestone payments are automatically released to freelancer"
          }
        ]
      },
      cta: "Start a Project with Milestones"
    },
    'zh-TW': {
      badge: "新功能",
      title: "里程碑付款系統",
      subtitle: "將大型項目分解為可管理的階段，並提供安全的付款保障",
      description: "我們創新的里程碑付款系統通過將項目拆分為結構化階段來保護案主和接案者雙方。僅為已完成的工作付款，降低風險，並完全掌控您的項目預算。",
      features: [
        {
          icon: Target,
          title: "結構化里程碑",
          description: "為每個項目階段定義清晰的交付物、時間表和付款金額",
          color: "text-blue-600",
          bgColor: "bg-blue-50"
        },
        {
          icon: Shield,
          title: "受保護的付款",
          description: "每個里程碑付款都安全地保存在托管中，直到工作獲得批准",
          color: "text-green-600",
          bgColor: "bg-green-50"
        },
        {
          icon: Clock,
          title: "進度追蹤",
          description: "通過視覺化里程碑完成狀態實時查看項目進度",
          color: "text-purple-600",
          bgColor: "bg-purple-50"
        },
        {
          icon: DollarSign,
          title: "靈活付款",
          description: "隨著每個里程碑的交付和批准，逐步釋放資金",
          color: "text-orange-600",
          bgColor: "bg-orange-50"
        },
        {
          icon: CheckCircle2,
          title: "質量保證",
          description: "在批准每個里程碑付款前審查並要求修改",
          color: "text-teal-600",
          bgColor: "bg-teal-50"
        },
        {
          icon: TrendingUp,
          title: "降低風險",
          description: "僅為已完成和批准的工作付款，最大限度降低財務風險",
          color: "text-indigo-600",
          bgColor: "bg-indigo-50"
        }
      ],
      benefits: {
        title: "運作方式",
        steps: [
          {
            icon: FileCheck,
            title: "定義里程碑",
            description: "接案者提出包含交付物和時間表的項目里程碑"
          },
          {
            icon: Lock,
            title: "資金托管",
            description: "案主批准提案後，資金鎖定在托管賬戶中"
          },
          {
            icon: Users,
            title: "工作與審核",
            description: "接案者完成每個里程碑，案主審核並批准"
          },
          {
            icon: DollarSign,
            title: "自動釋放",
            description: "批准的里程碑付款自動釋放給接案者"
          }
        ]
      },
      cta: "開始帶里程碑的項目"
    },
    'zh-CN': {
      badge: "新功能",
      title: "里程碑付款系统",
      subtitle: "将大型项目分解为可管理的阶段，并提供安全的付款保障",
      description: "我们创新的里程碑付款系统通过将项目拆分为结构化阶段来保护客户和接案者双方。仅为已完成的工作付款，降低风险，并完全掌控您的项目预算。",
      features: [
        {
          icon: Target,
          title: "结构化里程碑",
          description: "为每个项目阶段定义清晰的交付物、时间表和付款金额",
          color: "text-blue-600",
          bgColor: "bg-blue-50"
        },
        {
          icon: Shield,
          title: "受保护的付款",
          description: "每个里程碑付款都安全地保存在托管中，直到工作获得批准",
          color: "text-green-600",
          bgColor: "bg-green-50"
        },
        {
          icon: Clock,
          title: "进度追踪",
          description: "通过可视化里程碑完成状态实时查看项目进度",
          color: "text-purple-600",
          bgColor: "bg-purple-50"
        },
        {
          icon: DollarSign,
          title: "灵活付款",
          description: "随着每个里程碑的交付和批准，逐步释放资金",
          color: "text-orange-600",
          bgColor: "bg-orange-50"
        },
        {
          icon: CheckCircle2,
          title: "质量保证",
          description: "在批准每个里程碑付款前审查并要求修改",
          color: "text-teal-600",
          bgColor: "bg-teal-50"
        },
        {
          icon: TrendingUp,
          title: "降低风险",
          description: "仅为已完成和批准的工作付款，最大限度降低财务风险",
          color: "text-indigo-600",
          bgColor: "bg-indigo-50"
        }
      ],
      benefits: {
        title: "运作方式",
        steps: [
          {
            icon: FileCheck,
            title: "定义里程碑",
            description: "接案者提出包含交付物和时间表的项目里程碑"
          },
          {
            icon: Lock,
            title: "资金托管",
            description: "客户批准提案后，资金锁定在托管账户中"
          },
          {
            icon: Users,
            title: "工作与审核",
            description: "接案者完成每个里程碑，客户审核并批准"
          },
          {
            icon: DollarSign,
            title: "自动释放",
            description: "批准的里程碑付款自动释放给接案者"
          }
        ]
      },
      cta: "开始带里程碑的项目"
    }
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  return (
    <section id="milestone-feature" className="py-20 bg-gradient-to-b from-white via-blue-50 to-white scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-2 animate-pulse">
            ⚡ {t.badge}
          </Badge>
          <h2 className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            {t.subtitle}
          </p>
          <p className="text-gray-600 max-w-4xl mx-auto leading-relaxed">
            {t.description}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {t.features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-blue-500 group"
              >
                <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <h3 className="mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white">
          <h3 className="text-center mb-12 text-white">
            {t.benefits.title}
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {t.benefits.steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-2 w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold shadow-lg">
                    {index + 1}
                  </div>
                  
                  {/* Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 h-full border-2 border-white/20 hover:bg-white/20 transition-all duration-300">
                    <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="mb-2 text-white">
                      {step.title}
                    </h4>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow (hidden on last item) */}
                  {index < t.benefits.steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <svg className="w-8 h-8 text-white/40" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <button
              onClick={() => {
                document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {t.cta} →
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { 
              label: language === 'en' ? 'Average Risk Reduction' : language === 'zh-CN' ? '平均风险降低' : '平均風險降低', 
              value: '70%', 
              icon: Shield 
            },
            { 
              label: language === 'en' ? 'Projects Using Milestones' : language === 'zh-CN' ? '使用里程碑的项目' : '使用里程碑的項目', 
              value: '85%', 
              icon: Target 
            },
            { 
              label: language === 'en' ? 'Client Satisfaction' : language === 'zh-CN' ? '客户满意度' : '案主滿意度', 
              value: '4.9/5', 
              icon: CheckCircle2 
            },
            { 
              label: language === 'en' ? 'Avg. Milestones per Project' : language === 'zh-CN' ? '每项目平均里程碑数' : '每項目平均里程碑數', 
              value: '3.5', 
              icon: TrendingUp 
            }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <Icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default MilestoneFeature;