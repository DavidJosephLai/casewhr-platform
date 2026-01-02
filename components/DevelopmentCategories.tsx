import { Code, Smartphone, Database, Globe, Shield, Cog } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { isChinese } from "../lib/translations";

const categories = {
  en: {
    title: "Development & IT Services",
    subtitle: "Explore our comprehensive range of development and IT expertise",
    items: [
      {
        icon: Code,
        title: "Web Development",
        description: "Full-stack development, frontend frameworks, backend systems, and web applications.",
        skills: ["React", "Vue.js", "Node.js", "Python", "PHP"],
        count: "150+ Experts"
      },
      {
        icon: Smartphone,
        title: "Mobile Development",
        description: "Native and cross-platform mobile apps for iOS and Android.",
        skills: ["React Native", "Flutter", "Swift", "Kotlin"],
        count: "80+ Experts"
      },
      {
        icon: Database,
        title: "Database & Backend",
        description: "Database design, API development, microservices, and cloud infrastructure.",
        skills: ["PostgreSQL", "MongoDB", "AWS", "Docker"],
        count: "120+ Experts"
      },
      {
        icon: Globe,
        title: "DevOps & Cloud",
        description: "CI/CD pipelines, cloud deployment, infrastructure automation, and monitoring.",
        skills: ["Kubernetes", "Jenkins", "Terraform", "Azure"],
        count: "90+ Experts"
      },
      {
        icon: Shield,
        title: "Cybersecurity",
        description: "Security audits, penetration testing, compliance, and data protection.",
        skills: ["Security Audit", "GDPR", "Encryption", "Firewall"],
        count: "60+ Experts"
      },
      {
        icon: Cog,
        title: "System Architecture",
        description: "Enterprise architecture, system design, scalability planning, and technical consulting.",
        skills: ["Microservices", "System Design", "Performance", "Scalability"],
        count: "100+ Experts"
      }
    ]
  },
  'zh-TW': {
    title: "開發與IT服務",
    subtitle: "探索我們全面的開發和IT專業領域",
    items: [
      {
        icon: Code,
        title: "網頁開發",
        description: "全端開發、前端框架、後端系統和網頁應用程式。",
        skills: ["React", "Vue.js", "Node.js", "Python", "PHP"],
        count: "150+ 專家"
      },
      {
        icon: Smartphone,
        title: "移動應用開發",
        description: "iOS和Android的原生和跨平台移動應用程式。",
        skills: ["React Native", "Flutter", "Swift", "Kotlin"],
        count: "80+ 專家"
      },
      {
        icon: Database,
        title: "數據庫與後端",
        description: "數據庫設計、API開發、微服務和雲端基礎設施。",
        skills: ["PostgreSQL", "MongoDB", "AWS", "Docker"],
        count: "120+ 專家"
      },
      {
        icon: Globe,
        title: "DevOps與雲端",
        description: "CI/CD管道、雲端部署、基礎設施自動化和監控。",
        skills: ["Kubernetes", "Jenkins", "Terraform", "Azure"],
        count: "90+ 專家"
      },
      {
        icon: Shield,
        title: "網絡安全",
        description: "安全審計、滲透測試、合規性和數據保護。",
        skills: ["安全審計", "GDPR", "加密", "防火牆"],
        count: "60+ 專家"
      },
      {
        icon: Cog,
        title: "系統架構",
        description: "企業架構、系統設計、可擴展性規劃和技術諮詢。",
        skills: ["微服務", "系統設計", "性能優化", "可擴展性"],
        count: "100+ 專家"
      }
    ]
  },
  'zh-CN': {
    title: "开发与IT服务",
    subtitle: "探索我们全面的开发和IT专业领域",
    items: [
      {
        icon: Code,
        title: "网页开发",
        description: "全栈开发、前端框架、后端系统和网页应用程序。",
        skills: ["React", "Vue.js", "Node.js", "Python", "PHP"],
        count: "150+ 专家"
      },
      {
        icon: Smartphone,
        title: "移动应用开发",
        description: "iOS和Android的原生和跨平台移动应用程序。",
        skills: ["React Native", "Flutter", "Swift", "Kotlin"],
        count: "80+ 专家"
      },
      {
        icon: Database,
        title: "数据库与后端",
        description: "数据库设计、API开发、微服务和云端基础设施。",
        skills: ["PostgreSQL", "MongoDB", "AWS", "Docker"],
        count: "120+ 专家"
      },
      {
        icon: Globe,
        title: "DevOps与云端",
        description: "CI/CD管道、云端部署、基础设施自动化和监控。",
        skills: ["Kubernetes", "Jenkins", "Terraform", "Azure"],
        count: "90+ 专家"
      },
      {
        icon: Shield,
        title: "网络安全",
        description: "安全审计、渗透测试、合规性和数据保护。",
        skills: ["安全审计", "GDPR", "加密", "防火墙"],
        count: "60+ 专家"
      },
      {
        icon: Cog,
        title: "系统架构",
        description: "企业架构、系统设计、可扩展性规划和技术咨询。",
        skills: ["微服务", "系统设计", "性能优化", "可扩展性"],
        count: "100+ 专家"
      }
    ]
  }
};

export function DevelopmentCategories() {
  const { language } = useLanguage();
  const content = categories[language as keyof typeof categories] || categories['zh-TW'];
  
  console.log('🔥🔥🔥 DevelopmentCategories 組件已渲染！🔥🔥🔥');

  const handleClick = (categoryTitle: string, skills: string[], event: React.MouseEvent) => {
    console.log('🎯 [DevelopmentCategories] 點擊卡片:', categoryTitle, skills);
    
    // 阻止事件冒泡，防止誤觸發其他組件的事件
    event.preventDefault();
    event.stopPropagation();
    
    // 觸發人才分類篩選事件
    window.dispatchEvent(new CustomEvent('filterTalentsByCategory', {
      detail: {
        category: 'Development & IT', // 主分類
        subcategory: categoryTitle,   // 子分類
        skills: skills                 // 相關技能
      }
    }));
    
    console.log('✅ [DevelopmentCategories] 已觸發 filterTalentsByCategory 事件');
    console.log('🔄 [DevelopmentCategories] TalentDirectory 將自動處理滾動和篩選');
  };

  return (
    <section id="dev-categories" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="mb-4">{content.title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {content.subtitle}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.items.map((category, index) => {
            const Icon = category.icon;
            return (
              <button
                key={index}
                onClick={(event) => handleClick(category.title, category.skills, event)}
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-500 text-left w-full"
              >
                {/* Icon & Title */}
                <div className="flex items-center gap-4 mb-4" style={{ pointerEvents: 'none' }}>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="mb-1">{category.title}</h3>
                    <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                      {category.count}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4" style={{ pointerEvents: 'none' }}>
                  {category.description}
                </p>

                {/* Skills */}
                <div className="space-y-2" style={{ pointerEvents: 'none' }}>
                  <p className="text-xs text-gray-500">
                    {isChinese(language) ? '熱門技能：' : 'Popular Skills:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.skills.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            {language === 'en' 
              ? "Can't find what you're looking for?" 
              : language === 'zh-CN'
              ? "找不到您需要的服务？"
              : "找不到您需要的服務？"}
          </p>
          <button 
            onClick={() => {
              const talentsSection = document.getElementById('talents');
              if (talentsSection) {
                talentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {language === 'en' ? 'View All Services' : language === 'zh-CN' ? '查看所有服务' : '查看所有服務'}
          </button>
        </div>
      </div>
    </section>
  );
}

export default DevelopmentCategories;