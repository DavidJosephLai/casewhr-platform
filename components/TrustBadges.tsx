import { useLanguage } from "../lib/LanguageContext";
import { Shield, Award, Lock, CheckCircle, Zap, Users } from "lucide-react";

export function TrustBadges() {
  const { language } = useLanguage();

  const badges = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: {
        en: "Verified Platform",
        'zh-TW': "認證平台",
        'zh-CN': "认证平台"
      },
      subtitle: {
        en: "SSL Encrypted",
        'zh-TW': "SSL 加密",
        'zh-CN': "SSL 加密"
      },
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: {
        en: "Award Winning",
        'zh-TW': "屢獲殊榮",
        'zh-CN': "屡获殊荣"
      },
      subtitle: {
        en: "Best Platform 2024",
        'zh-TW': "2024 最佳平台",
        'zh-CN': "2024 最佳平台"
      },
      color: "from-yellow-500 to-yellow-600"
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: {
        en: "Secure Payments",
        'zh-TW': "安全支付",
        'zh-CN': "安全支付"
      },
      subtitle: {
        en: "Escrow Protected",
        'zh-TW': "託管保護",
        'zh-CN': "托管保护"
      },
      color: "from-green-500 to-green-600"
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: {
        en: "Quality Assured",
        'zh-TW': "品質保證",
        'zh-CN': "质量保证"
      },
      subtitle: {
        en: "100% Verified",
        'zh-TW': "100% 驗證",
        'zh-CN': "100% 验证"
      },
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: {
        en: "Fast Matching",
        'zh-TW': "快速配對",
        'zh-CN': "快速配对"
      },
      subtitle: {
        en: "< 24 Hours",
        'zh-TW': "< 24 小時",
        'zh-CN': "< 24 小时"
      },
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: {
        en: "24/7 Support",
        'zh-TW': "24/7 支援",
        'zh-CN': "24/7 支持"
      },
      subtitle: {
        en: "Always Here",
        'zh-TW': "隨時待命",
        'zh-CN': "随时待命"
      },
      color: "from-red-500 to-red-600"
    }
  ];

  const mediaLogos = [
    {
      name: "TechCrunch",
      logo: "https://images.unsplash.com/photo-1611162617474-5b629b6e115f?w=200&h=80&fit=crop",
      quote: {
        en: "Revolutionary platform",
        'zh-TW': "革命性平台",
        'zh-CN': "革命性平台"
      }
    },
    {
      name: "Forbes",
      logo: "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=200&h=80&fit=crop",
      quote: {
        en: "Future of freelancing",
        'zh-TW': "接案的未來",
        'zh-CN': "接案的未来"
      }
    },
    {
      name: "Wired",
      logo: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&h=80&fit=crop",
      quote: {
        en: "Game changer",
        'zh-TW': "遊戲規則改變者",
        'zh-CN': "游戏规则改变者"
      }
    },
    {
      name: "Bloomberg",
      logo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=80&fit=crop",
      quote: {
        en: "Trusted by thousands",
        'zh-TW': "受數千人信賴",
        'zh-CN': "受数千人信赖"
      }
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className={`p-4 rounded-full bg-gradient-to-br ${badge.color} text-white mb-3 group-hover:shadow-lg transition-shadow`}>
                {badge.icon}
              </div>
              <div className="font-bold text-gray-900 text-sm mb-1">
                {badge.title[language as keyof typeof badge.title]}
              </div>
              <div className="text-xs text-gray-500">
                {badge.subtitle[language as keyof typeof badge.subtitle]}
              </div>
            </div>
          ))}
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200 mb-12"></div>

        {/* Featured In Section */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {language === 'en'
              ? '📰 As Featured In'
              : language === 'zh-CN'
              ? '📰 媒体报导'
              : '📰 媒體報導'}
          </h3>
          <p className="text-gray-600">
            {language === 'en'
              ? 'Trusted by leading media and industry experts'
              : language === 'zh-CN'
              ? '受领先媒体和行业专家信赖'
              : '受領先媒體和行業專家信賴'}
          </p>
        </div>

        {/* Media Logos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          {mediaLogos.map((media, index) => (
            <div
              key={index}
              className="group text-center"
            >
              <div className="bg-gray-50 rounded-lg p-6 mb-3 hover:bg-gray-100 transition-colors">
                <div className="text-2xl font-bold text-gray-800 mb-2">
                  {media.name}
                </div>
                <div className="text-sm text-gray-500 italic">
                  "{media.quote[language as keyof typeof media.quote]}"
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Partnership Badges */}
        <div className="mt-12 pt-12 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-gray-700">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-medium">
                {language === 'en' ? 'PCI DSS Compliant' : language === 'zh-CN' ? 'PCI DSS 合规' : 'PCI DSS 合規'}
              </span>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="flex items-center gap-2 text-gray-700">
              <Lock className="h-6 w-6 text-green-600" />
              <span className="font-medium">
                {language === 'en' ? 'GDPR Protected' : language === 'zh-CN' ? 'GDPR 保护' : 'GDPR 保護'}
              </span>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="flex items-center gap-2 text-gray-700">
              <CheckCircle className="h-6 w-6 text-purple-600" />
              <span className="font-medium">
                {language === 'en' ? 'ISO 27001 Certified' : language === 'zh-CN' ? 'ISO 27001 认证' : 'ISO 27001 認證'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrustBadges;
