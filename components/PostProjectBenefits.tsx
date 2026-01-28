import { useLanguage } from '../lib/LanguageContext';
import { Users, Shield, Sparkles } from 'lucide-react';

const content = {
  en: {
    title: 'Post Your Project, Enjoy Three Key Benefits',
    subtitle: 'Rich Talent Pool, Fast Matching, Flexible Customization',
    benefits: [
      {
        icon: Users,
        title: 'Find Experts',
        description: 'Connect with verified professionals',
        detail: 'Access thousands of skilled freelancers'
      },
      {
        icon: Shield,
        title: 'Secure Service',
        description: 'Professional and reliable payment protection',
        detail: 'Safe transactions with escrow service'
      },
      {
        icon: Sparkles,
        title: 'Quality Design',
        description: 'Discover top design talent',
        detail: 'Premium projects from experienced designers'
      }
    ],
    cta: '🚀 Post Your Project Now'
  },
  'zh-TW': {
    title: '刊登外包，享三大優勢',
    subtitle: '豐富人力資源庫、快速精準配對、彈性客製化需求',
    benefits: [
      {
        icon: Users,
        title: '找專家',
        description: '接觸多人與對話',
        detail: '數千位經驗證的專業人才'
      },
      {
        icon: Shield,
        title: '找服務',
        description: '專業可靠付款保障',
        detail: '安全交易與第三方支付保護'
      },
      {
        icon: Sparkles,
        title: '找設計',
        description: '發掘設計好案源',
        detail: '來自資深設計師的優質專案'
      }
    ],
    cta: '🚀 立即刊登外包'
  },
  'zh-CN': {
    title: '刊登外包，享三大优势',
    subtitle: '丰富人力资源库、快速精准配对、弹性客制化需求',
    benefits: [
      {
        icon: Users,
        title: '找专家',
        description: '接触多人与对话',
        detail: '数千位经验证的专业人才'
      },
      {
        icon: Shield,
        title: '找服务',
        description: '专业可靠付款保障',
        detail: '安全交易与第三方支付保护'
      },
      {
        icon: Sparkles,
        title: '找设计',
        description: '发掘设计好案源',
        detail: '来自资深设计师的优质项目'
      }
    ],
    cta: '🚀 立即刊登外包'
  }
};

export function PostProjectBenefits() {
  const { language } = useLanguage();
  const t = content[language as keyof typeof content] || content.en;

  return (
    <section className="py-12 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題區 - 縮小 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t.title}
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            {t.subtitle}
          </p>
        </div>

        {/* 三大優勢卡片 - 縮小 */}
        <div className="grid md:grid-cols-3 gap-6">
          {t.benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* 背景裝飾 */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* 內容 */}
                <div className="relative">
                  {/* 圖標 - 縮小 */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* 標題 - 縮小 */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>

                  {/* 描述 - 縮小 */}
                  <p className="text-sm text-gray-600 mb-2">
                    {benefit.description}
                  </p>

                  {/* 詳細說明 - 縮小 */}
                  <p className="text-xs text-gray-500">
                    {benefit.detail}
                  </p>

                  {/* 裝飾線條 */}
                  <div className="mt-4 h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full group-hover:w-full transition-all duration-500" />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA 按鈕 - 縮小 */}
        <div className="text-center mt-8">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('showDashboard', { detail: { tab: 'projects' } }));
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm md:text-base"
          >
            {t.cta}
          </button>
        </div>
      </div>
    </section>
  );
}