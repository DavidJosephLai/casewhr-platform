import { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "./ui/button";

export function Testimonials() {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: {
        en: "Startup Founder",
        'zh-TW': "新創公司創辦人",
        'zh-CN': "创业公司创始人"
      },
      company: "TechVision Inc.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      rating: 5,
      review: {
        en: "CaseWHR helped us find an amazing React developer who delivered our MVP in just 6 weeks. The milestone payment system gave us peace of mind!",
        'zh-TW': "CaseWHR 幫我們找到一位出色的 React 開發者，僅用 6 週就交付了 MVP。里程碑付款系統讓我們非常安心！",
        'zh-CN': "CaseWHR 帮我们找到一位出色的 React 开发者，仅用 6 周就交付了 MVP。里程碑付款系统让我们非常放心！"
      },
      project: {
        en: "E-commerce Platform",
        'zh-TW': "電商平台",
        'zh-CN': "电商平台"
      },
      budget: "$15,000"
    },
    {
      name: "Michael Wong",
      role: {
        en: "Marketing Director",
        'zh-TW': "行銷總監",
        'zh-CN': "营销总监"
      },
      company: "BrandCo Asia",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      rating: 5,
      review: {
        en: "Found a talented UI/UX designer who understood our brand perfectly. Communication was smooth and the results exceeded expectations!",
        'zh-TW': "找到一位才華洋溢的 UI/UX 設計師，完美理解我們的品牌。溝通順暢，成果超出預期！",
        'zh-CN': "找到一位才华横溢的 UI/UX 设计师，完美理解我们的品牌。沟通顺畅，成果超出预期！"
      },
      project: {
        en: "Brand Identity Design",
        'zh-TW': "品牌識別設計",
        'zh-CN': "品牌识别设计"
      },
      budget: "$8,000"
    },
    {
      name: "Linda Zhang",
      role: {
        en: "Product Manager",
        'zh-TW': "產品經理",
        'zh-CN': "产品经理"
      },
      company: "FinTech Solutions",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
      rating: 5,
      review: {
        en: "The platform made it easy to hire a full-stack developer for our mobile app. The escrow system protected our investment throughout the project.",
        'zh-TW': "平台讓我們輕鬆聘請到全端開發者開發手機應用。託管系統在整個專案期間保護了我們的投資。",
        'zh-CN': "平台让我们轻松聘请到全栈开发者开发手机应用。托管系统在整个项目期间保护了我们的投资。"
      },
      project: {
        en: "Mobile Banking App",
        'zh-TW': "行動銀行 APP",
        'zh-CN': "移动银行 APP"
      },
      budget: "$22,000"
    },
    {
      name: "David Liu",
      role: {
        en: "CEO",
        'zh-TW': "執行長",
        'zh-CN': "首席执行官"
      },
      company: "EduTech Global",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
      rating: 5,
      review: {
        en: "We've completed 5 projects through CaseWHR. The quality of talent and the platform's security features are unmatched!",
        'zh-TW': "我們已通過 CaseWHR 完成 5 個專案。人才品質和平台的安全功能無可匹敵！",
        'zh-CN': "我们已通过 CaseWHR 完成 5 个项目。人才质量和平台的安全功能无可匹敌！"
      },
      project: {
        en: "Online Learning Platform",
        'zh-TW': "線上學習平台",
        'zh-CN': "在线学习平台"
      },
      budget: "$35,000"
    },
    {
      name: "Emily Tan",
      role: {
        en: "Creative Director",
        'zh-TW': "創意總監",
        'zh-CN': "创意总监"
      },
      company: "MediaWorks Studio",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop",
      rating: 5,
      review: {
        en: "Amazing video editors and motion designers! Our ad campaign was delivered on time and the client loved it. Will definitely use again!",
        'zh-TW': "出色的影片剪輯師和動態設計師！我們的廣告活動準時交付，客戶非常喜歡。絕對會再次使用！",
        'zh-CN': "出色的视频剪辑师和动态设计师！我们的广告活动准时交付，客户非常喜欢。绝对会再次使用！"
      },
      project: {
        en: "Video Ad Campaign",
        'zh-TW': "影片廣告活動",
        'zh-CN': "视频广告活动"
      },
      budget: "$12,000"
    }
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(timer);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            {language === 'en'
              ? '⭐ What Our Clients Say'
              : language === 'zh-CN'
              ? '⭐ 客户评价'
              : '⭐ 客戶評價'}
          </h2>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            {language === 'en'
              ? 'Join thousands of satisfied clients who found their perfect match'
              : language === 'zh-CN'
              ? '加入数千名找到完美匹配的满意客户'
              : '加入數千名找到完美匹配的滿意客戶'}
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="relative max-w-4xl mx-auto">
          {/* Quote Icon */}
          <div className="absolute -top-6 -left-6 text-yellow-400 opacity-20">
            <Quote className="h-24 w-24" />
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-2xl border border-white/20">
            {/* Star Rating */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[...Array(currentTestimonial.rating)].map((_, i) => (
                <Star key={i} className="h-8 w-8 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            {/* Review Text */}
            <p className="text-2xl text-center mb-8 leading-relaxed italic">
              "{currentTestimonial.review[language as keyof typeof currentTestimonial.review]}"
            </p>

            {/* Project Info */}
            <div className="flex items-center justify-center gap-6 mb-6 pb-6 border-b border-white/20">
              <div className="text-center">
                <div className="text-sm text-blue-200">
                  {language === 'en' ? 'Project' : language === 'zh-CN' ? '项目' : '專案'}
                </div>
                <div className="font-bold text-lg">
                  {currentTestimonial.project[language as keyof typeof currentTestimonial.project]}
                </div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-sm text-blue-200">
                  {language === 'en' ? 'Budget' : language === 'zh-CN' ? '预算' : '預算'}
                </div>
                <div className="font-bold text-lg text-green-400">
                  {currentTestimonial.budget}
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="flex items-center justify-center gap-4">
              <img
                src={currentTestimonial.avatar}
                alt={currentTestimonial.name}
                className="w-16 h-16 rounded-full border-4 border-white/20"
              />
              <div>
                <div className="font-bold text-xl">{currentTestimonial.name}</div>
                <div className="text-blue-200">
                  {currentTestimonial.role[language as keyof typeof currentTestimonial.role]}
                </div>
                <div className="text-sm text-blue-300">{currentTestimonial.company}</div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={prevTestimonial}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            {/* Dots Indicator */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-yellow-400 w-8'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={nextTestimonial}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="text-5xl font-bold text-yellow-400 mb-2">4.9/5.0</div>
            <div className="text-blue-200">
              {language === 'en' ? 'Average Rating' : language === 'zh-CN' ? '平均评分' : '平均評分'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-yellow-400 mb-2">98%</div>
            <div className="text-blue-200">
              {language === 'en' ? 'Client Satisfaction' : language === 'zh-CN' ? '客户满意度' : '客戶滿意度'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-yellow-400 mb-2">12,483</div>
            <div className="text-blue-200">
              {language === 'en' ? '5-Star Reviews' : language === 'zh-CN' ? '五星评价' : '五星評價'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
