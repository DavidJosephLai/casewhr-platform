import { Card } from "./ui/card";
import { Code, Palette, PenTool, TrendingUp, Video, Smartphone, BarChart, Headphones, Calculator, Scale, Users, Building2, ArrowRight } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { useState, useEffect } from "react";

const icons = [Code, Palette, PenTool, TrendingUp, Video, Smartphone, BarChart, Headphones, Calculator, Scale, Users, Building2];

export function Categories() {
  const { language } = useLanguage();
  const t = getTranslation(language as any).categories;
  const [highlightAll, setHighlightAll] = useState(false);

  // Handle category click navigation
  const handleCategoryClick = (categoryValue: string, index: number) => {
    console.log('🔍 [Categories - 人才分類] Category clicked:', categoryValue);
    console.log('✅ [Categories - 人才分類] 這是人才分類卡片，導航到人才目錄！');
    
    // Navigate to talent directory section with category filter
    window.dispatchEvent(new CustomEvent('navigateToTalents', { 
      detail: { category: categoryValue } 
    }));
  };

  // Handle skill click navigation
  const handleSkillClick = (e: React.MouseEvent, skill: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔍 [Categories - 人才分類] Skill clicked:', skill);
    
    // Navigate to talent directory section with skill filter
    window.dispatchEvent(new CustomEvent('navigateToTalents', { 
      detail: { skill } 
    }));
  };

  return (
    <section id="categories" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl mb-4">{t.title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {t.items.map((category, index) => {
            const Icon = icons[index];
            return (
              <Card 
                key={index} 
                className={`p-6 transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                  highlightAll 
                    ? 'shadow-2xl -translate-y-2 border-blue-500 scale-105' 
                    : 'hover:shadow-xl hover:-translate-y-2 hover:border-blue-500'
                }`}
                onClick={() => handleCategoryClick(category.value, index)}
              >
                <div className="relative z-10">
                  <Icon className={`h-12 w-12 text-blue-600 mb-4 transition-transform duration-300 ${
                    highlightAll ? 'scale-110' : 'group-hover:scale-110'
                  }`} />
                  <h3 className={`mb-2 transition-colors ${
                    highlightAll ? 'text-blue-600' : 'group-hover:text-blue-600'
                  }`}>{category.title}</h3>
                  <p className="text-gray-600 mb-3">{category.description}</p>
                  
                  {/* ✅ 技能標籤 */}
                  {category.skills && category.skills.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2">
                        {language === 'en' ? 'Popular Skills:' : '熱門技能：'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {category.skills.map((skill, skillIndex) => (
                          <button
                            key={`${skill}-${skillIndex}-${index}`}
                            onClick={(e) => handleSkillClick(e, skill)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-400 rounded text-xs text-blue-700 hover:text-blue-900 transition-colors"
                            title={`點擊搜尋: ${skill}`}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-600 font-medium">{category.count}</p>
                    <div className={`flex items-center text-blue-600 text-sm font-medium transition-opacity ${
                      highlightAll ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <span className="mr-1">{language === 'en' ? 'View Projects' : '查看項目'}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
                {/* Hover background effect */}
                <div className={`absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent transition-opacity duration-300 ${
                  highlightAll ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`} />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Categories;