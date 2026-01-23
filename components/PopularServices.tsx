import { useLanguage } from "../lib/LanguageContext";
import { Code, Palette, Video, Megaphone, BarChart3, Globe, Smartphone, Database } from "lucide-react";
import { Button } from "./ui/button";

export function PopularServices() {
  const { language } = useLanguage();

  const services = [
    {
      icon: <Code className="h-12 w-12" />,
      name: {
        en: "Web Development",
        'zh-TW': "網站開發",
        'zh-CN': "网站开发"
      },
      startingPrice: {
        en: "From $800",
        'zh-TW': "NT$25,000 起",
        'zh-CN': "¥5,500 起"
      },
      projects: 3241,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      icon: <Palette className="h-12 w-12" />,
      name: {
        en: "UI/UX Design",
        'zh-TW': "UI/UX 設計",
        'zh-CN': "UI/UX 设计"
      },
      startingPrice: {
        en: "From $500",
        'zh-TW': "NT$15,000 起",
        'zh-CN': "¥3,500 起"
      },
      projects: 2873,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      icon: <Video className="h-12 w-12" />,
      name: {
        en: "Video Editing",
        'zh-TW': "影片剪輯",
        'zh-CN': "视频剪辑"
      },
      startingPrice: {
        en: "From $350",
        'zh-TW': "NT$10,000 起",
        'zh-CN': "¥2,300 起"
      },
      projects: 1956,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-600"
    },
    {
      icon: <Megaphone className="h-12 w-12" />,
      name: {
        en: "Digital Marketing",
        'zh-TW': "數位行銷",
        'zh-CN': "数字营销"
      },
      startingPrice: {
        en: "From $650",
        'zh-TW': "NT$20,000 起",
        'zh-CN': "¥4,600 起"
      },
      projects: 2134,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      icon: <BarChart3 className="h-12 w-12" />,
      name: {
        en: "Data Analysis",
        'zh-TW': "數據分析",
        'zh-CN': "数据分析"
      },
      startingPrice: {
        en: "From $1,000",
        'zh-TW': "NT$30,000 起",
        'zh-CN': "¥7,000 起"
      },
      projects: 1423,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    },
    {
      icon: <Globe className="h-12 w-12" />,
      name: {
        en: "SEO Services",
        'zh-TW': "SEO 優化",
        'zh-CN': "SEO 优化"
      },
      startingPrice: {
        en: "From $600",
        'zh-TW': "NT$18,000 起",
        'zh-CN': "¥4,200 起"
      },
      projects: 1789,
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50",
      textColor: "text-teal-600"
    },
    {
      icon: <Smartphone className="h-12 w-12" />,
      name: {
        en: "App Development",
        'zh-TW': "APP 開發",
        'zh-CN': "APP 开发"
      },
      startingPrice: {
        en: "From $1,300",
        'zh-TW': "NT$40,000 起",
        'zh-CN': "¥9,300 起"
      },
      projects: 2456,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600"
    },
    {
      icon: <Database className="h-12 w-12" />,
      name: {
        en: "Backend API",
        'zh-TW': "後端 API",
        'zh-CN': "后端 API"
      },
      startingPrice: {
        en: "From $1,150",
        'zh-TW': "NT$35,000 起",
        'zh-CN': "¥8,000 起"
      },
      projects: 1634,
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      textColor: "text-pink-600"
    }
  ];

  const handleServiceClick = (serviceName: string) => {
    // Scroll to projects section and filter by category
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {language === 'en' 
              ? '🔥 Popular Services' 
              : language === 'zh-CN'
              ? '🔥 热门服务'
              : '🔥 熱門服務'}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {language === 'en'
              ? 'Explore our most requested professional services'
              : language === 'zh-CN'
              ? '探索最受欢迎的专业服务'
              : '探索最受歡迎的專業服務'}
          </p>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service, index) => (
            <div
              key={index}
              className={`${service.bgColor} rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group border-2 border-transparent hover:border-${service.textColor.replace('text-', '')}`}
              onClick={() => handleServiceClick(service.name.en)}
            >
              {/* Icon */}
              <div className={`inline-flex p-4 rounded-lg bg-gradient-to-br ${service.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {service.icon}
              </div>

              {/* Service Name */}
              <h3 className={`text-xl font-bold ${service.textColor} mb-2`}>
                {service.name[language as keyof typeof service.name]}
              </h3>

              {/* Starting Price */}
              <div className="text-2xl font-bold text-gray-900 mb-3">
                {service.startingPrice[language as keyof typeof service.startingPrice]}
              </div>

              {/* Project Count */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>
                  {service.projects.toLocaleString()}{' '}
                  {language === 'en' ? 'projects' : language === 'zh-CN' ? '个项目' : '個專案'}
                </span>
              </div>

              {/* Hover Indicator */}
              <div className={`mt-4 pt-4 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity ${service.textColor} text-sm font-medium`}>
                {language === 'en' ? 'View all →' : language === 'zh-CN' ? '查看全部 →' : '查看全部 →'}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg"
          >
            {language === 'en'
              ? '🎯 Explore All Categories'
              : language === 'zh-CN'
              ? '🎯 探索所有類別'
              : '🎯 探索所有類別'}
          </Button>
        </div>
      </div>
    </section>
  );
}

export default PopularServices;