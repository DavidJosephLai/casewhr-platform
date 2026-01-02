import { Card } from "./ui/card";
import { Users, Building, TrendingUp, Wallet, User, Award } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

const icons = [Users, Building, TrendingUp, Wallet, User, Award];

export function WhoCanTakeOver() {
  const { language } = useLanguage();
  const t = getTranslation(language as any).cases;
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const handleCardClick = (index: number) => {
    console.log(`🎯 Who Uses Card ${index} clicked`);
    
    switch (index) {
      case 0: // Startups - 跳轉到方案頁面（強調 Pro 方案）
        console.log('→ Navigating to pricing page (Pro plan focus)');
        window.dispatchEvent(new CustomEvent('showPricing', { detail: { highlightPlan: 'pro' } }));
        break;
      case 1: // SMBs - 滾動到專業服務分類
        console.log('→ Scrolling to categories');
        document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 2: // Enterprises - 跳轉到方案頁面（強調 Enterprise 方案）
        console.log('→ Navigating to pricing page (Enterprise plan focus)');
        window.dispatchEvent(new CustomEvent('showPricing', { detail: { highlightPlan: 'enterprise' } }));
        break;
      case 3: // Agencies - 滾動到人才目錄
        console.log('→ Scrolling to talent directory');
        const talentSection = document.getElementById('talents');
        if (talentSection) {
          talentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // 展開人才目錄
          setTimeout(() => {
            window.dispatchEvent(new Event('expandTalentDirectory'));
          }, 500);
        }
        break;
      case 4: // Nonprofits - 跳轉到聯絡我們
        console.log('→ Scrolling to contact form');
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 5: // Individuals - 滾動到發布項目區域
        console.log('→ Scrolling to browse projects');
        document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      default:
        break;
    }
  };

  return (
    <section id="cases" className="py-20 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="mb-4">{t.title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {t.items.map((item, index) => {
            const Icon = icons[index];
            return (
              <Card 
                key={index} 
                className={`p-6 transition-all duration-300 cursor-pointer ${
                  hoveredCard === index 
                    ? 'shadow-2xl scale-105 border-blue-500 border-2' 
                    : 'hover:shadow-xl border-transparent border-2'
                }`}
                onClick={() => handleCardClick(index)}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`transition-transform duration-300 ${
                  hoveredCard === index ? 'scale-110' : ''
                }`}>
                  <Icon className="h-12 w-12 text-blue-600 mb-4" />
                </div>
                <h3 className="mb-3">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                
                <div className="space-y-2">
                  {item.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className={`h-5 w-5 flex-shrink-0 mt-0.5 transition-colors duration-300 ${
                        hoveredCard === index ? 'text-blue-600' : 'text-green-600'
                      }`} />
                      <p className="text-sm text-gray-700">{benefit}</p>
                    </div>
                  ))}
                </div>

                {/* 添加 CTA 提示 */}
                <div className={`mt-4 pt-4 border-t border-gray-200 transition-all duration-300 ${
                  hoveredCard === index ? 'opacity-100' : 'opacity-0'
                }`}>
                  <p className="text-sm text-blue-600 font-medium text-center">
                    {language === 'en' ? 'Click to explore →' : '點擊了解更多 →'}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhoCanTakeOver;