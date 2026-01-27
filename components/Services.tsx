import { Card } from "./ui/card";
import { Building2, Users, FileCheck, TrendingUp, Shield, Briefcase } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";

const icons = [Building2, Users, FileCheck, TrendingUp, Shield, Briefcase];

export function Services() {
  const { language } = useLanguage();
  const t = getTranslation(language as any).services;

  // Handle card clicks - scroll to relevant sections
  const handleCardClick = (index: number) => {
    switch (index) {
      case 0: // Verified Professionals（經過驗證的專業人士）
        // Scroll to talents section and trigger auto-expand
        window.dispatchEvent(new CustomEvent('expandTalentDirectory', { detail: { expand: true } }));
        setTimeout(() => {
          document.getElementById('talents')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        break;
      case 1: // Wide Range of Skills（廣泛的技能範圍）
        // Scroll to categories section - 查看所有技能分類
        document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
        window.dispatchEvent(new CustomEvent('highlightCategories'));
        break;
      case 2: // Secure Payments（安全支付）
        // Scroll to milestone feature section - 了解里程碑付款系統
        document.getElementById('milestone-feature')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 3: // Quality Guarantee（質量保證）
        // Scroll to cases section - 查看使用案例和質量保證
        document.getElementById('cases')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 4: // Fast Matching（快速匹配）
        // Scroll to projects section - 查看案件和快速匹配示例
        document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 5: // Transparent Pricing（透明定價）
        // Navigate to pricing page - 查看方案定價
        window.dispatchEvent(new Event('showPricing'));
        break;
      default:
        break;
    }
  };

  return (
    <section id="services" className="py-20 bg-gray-50 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="mb-4">{t.title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {t.items.map((service, index) => {
            const Icon = icons[index];
            return (
              <Card 
                key={index} 
                className="p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-105 hover:border-blue-500"
                onClick={() => handleCardClick(index)}
              >
                <Icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Services;