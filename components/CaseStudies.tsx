import { useLanguage } from "../lib/LanguageContext";
import { Card } from "./ui/card";
import { CheckCircle, TrendingUp, Users, Award } from "lucide-react";

export function CaseStudies() {
  const { language } = useLanguage();

  const translations = {
    en: {
      title: "Success Stories",
      subtitle: "Real results from businesses and professionals using Case Where",
      cases: [
        {
          title: "Tech Startup Finds Perfect Developer",
          category: "Software Development",
          challenge: "A growing fintech startup needed a senior full-stack developer with blockchain experience for a 6-month project. Traditional hiring was too slow and expensive.",
          solution: "Through Case Where's platform, they found an experienced developer from Taiwan with the exact skill set needed. The dual-currency system made international payment seamless.",
          results: [
            "Project completed 2 weeks ahead of schedule",
            "Saved 40% compared to traditional recruitment",
            "Established long-term partnership with the developer"
          ],
          metrics: {
            timeline: "Found in 3 days",
            savings: "40% cost reduction",
            outcome: "Ongoing partnership"
          }
        },
        {
          title: "Marketing Agency Scales Operations",
          category: "Digital Marketing",
          challenge: "A boutique marketing agency needed to quickly scale their team to handle seasonal demand without the overhead of full-time hires.",
          solution: "Used Case Where's Premium subscription to access a pool of verified marketing professionals. The team subscription feature allowed seamless collaboration.",
          results: [
            "Onboarded 5 specialists within 2 weeks",
            "Handled 300% increase in client projects",
            "Maintained quality while scaling rapidly"
          ],
          metrics: {
            timeline: "2 weeks to scale",
            growth: "300% capacity increase",
            outcome: "Zero quality compromise"
          }
        },
        {
          title: "Freelance Designer's Career Breakthrough",
          category: "Design & Creative",
          challenge: "An experienced UI/UX designer was struggling to find consistent, high-quality projects that matched their expertise and rate expectations.",
          solution: "Joined Case Where with a Professional subscription, showcasing their portfolio. The platform's smart matching connected them with premium clients.",
          results: [
            "Increased monthly income by 250%",
            "Secured 3 long-term retainer clients",
            "Expanded international client base"
          ],
          metrics: {
            timeline: "First client in 5 days",
            income: "250% increase",
            outcome: "3 retainer clients"
          }
        },
        {
          title: "Enterprise Digital Transformation",
          category: "Consulting",
          challenge: "A traditional manufacturing company needed expert consultants to guide their digital transformation but lacked internal expertise.",
          solution: "Case Where's Enterprise subscription connected them with specialized consultants in IoT, cloud infrastructure, and change management.",
          results: [
            "Successfully migrated to cloud infrastructure",
            "Reduced operational costs by 35%",
            "Completed transformation in 8 months"
          ],
          metrics: {
            timeline: "8-month project",
            savings: "35% cost reduction",
            outcome: "Full digital transformation"
          }
        }
      ],
      ctaTitle: "Ready to Write Your Success Story?",
      ctaDescription: "Join thousands of businesses and professionals who have found success on Case Where",
      ctaButton: "Get Started Today",
      challenge: "Challenge",
      solution: "Solution",
      results: "Results",
      keyMetrics: "Key Metrics"
    },
    'zh-TW': {
      title: "成功案例",
      subtitle: "真實成果：企業與專業人士在 Case Where 平台上的成功故事",
      cases: [
        {
          title: "科技新創找到完美開發者",
          category: "軟體開發",
          challenge: "一家成長中的金融科技新創公司需要一位具有區塊鏈經驗的資深全端工程師進行為期 6 個月的專案。傳統招聘方式既慢又貴。",
          solution: "透過 Case Where 平台，他們找到了一位來自台灣、技能完全符合需求的資深工程師。雙幣計價系統讓國際支付變得無比順暢。",
          results: [
            "專案提前 2 週完成",
            "相比傳統招聘節省 40% 成本",
            "與開發者建立長期合作關係"
          ],
          metrics: {
            timeline: "3 天內找到人選",
            savings: "節省 40% 成本",
            outcome: "持續合作中"
          }
        },
        {
          title: "行銷公司成功擴張營運",
          category: "數位行銷",
          challenge: "一家精品行銷公司需要快速擴充團隊以應對季節性需求高峰，但不想承擔全職員工的開銷。",
          solution: "使用 Case Where 的專業版訂閱，獲得經過驗證的行銷專家資源池。團隊訂閱功能讓協作變得無縫順暢。",
          results: [
            "2 週內招募 5 位專家",
            "處理能力增加 300%",
            "快速擴張同時維持品質"
          ],
          metrics: {
            timeline: "2 週完成擴張",
            growth: "產能增加 300%",
            outcome: "品質零妥協"
          }
        },
        {
          title: "自由設計師的職涯突破",
          category: "設計與創意",
          challenge: "一位經驗豐富的 UI/UX 設計師一直難以找到符合專業水準和薪資期望的穩定優質專案。",
          solution: "加入 Case Where 專業版會員，展示作品集。平台的智慧配對系統將他們與優質客戶連接起來。",
          results: [
            "月收入增加 250%",
            "獲得 3 個長期合作客戶",
            "拓展國際客戶群"
          ],
          metrics: {
            timeline: "5 天獲得首位客戶",
            income: "收入增加 250%",
            outcome: "3 個長期客戶"
          }
        },
        {
          title: "企業數位轉型成功",
          category: "顧問諮詢",
          challenge: "一家傳統製造公司需要專家顧問指導數位轉型，但缺乏內部專業知識。",
          solution: "Case Where 企業版訂閱為他們連接了 IoT、雲端架構和變革管理的專業顧問。",
          results: [
            "成功遷移至雲端基礎設施",
            "營運成本降低 35%",
            "8 個月內完成轉型"
          ],
          metrics: {
            timeline: "8 個月專案",
            savings: "成本降低 35%",
            outcome: "全面數位轉型"
          }
        }
      ],
      ctaTitle: "準備好寫下您的成功故事了嗎？",
      ctaDescription: "加入數千位在 Case Where 找到成功的企業與專業人士",
      ctaButton: "立即開始",
      challenge: "挑戰",
      solution: "解決方案",
      results: "成果",
      keyMetrics: "關鍵指標"
    },
    'zh-CN': {
      title: "成功案例",
      subtitle: "真实成果：企业与专业人士在 Case Where 平台上的成功故事",
      cases: [
        {
          title: "科技创业公司找到完美开发者",
          category: "软件开发",
          challenge: "一家成长中的金融科技创业公司需要一位具有区块链经验的资深全栈工程师进行为期 6 个月的项目。传统招聘方式既慢又贵。",
          solution: "通过 Case Where 平台，他们找到了一位来自台湾、技能完全符合需求的资深工程师。三币计价系统让国际支付变得无比顺畅。",
          results: [
            "项目提前 2 周完成",
            "相比传统招聘节省 40% 成本",
            "与开发者建立长期合作关系"
          ],
          metrics: {
            timeline: "3 天内找到人选",
            savings: "节省 40% 成本",
            outcome: "持续合作中"
          }
        },
        {
          title: "营销公司成功扩张运营",
          category: "数字营销",
          challenge: "一家精品营销公司需要快速扩充团队以应对季节性需求高峰，但不想承担全职员工的开销。",
          solution: "使用 Case Where 的专业版订阅，获得经过验证的营销专家资源池。团队订阅功能让协作变得无缝顺畅。",
          results: [
            "2 周内招募 5 位专家",
            "处理能力增加 300%",
            "快速扩张同时维持品质"
          ],
          metrics: {
            timeline: "2 周完成扩张",
            growth: "产能增加 300%",
            outcome: "品质零妥协"
          }
        },
        {
          title: "自由设计师的职业突破",
          category: "设计与创意",
          challenge: "一位经验丰富的 UI/UX 设计师一直难以找到符合专业水准和薪资期望的稳定优质项目。",
          solution: "加入 Case Where 专业版会员，展示作品集。平台的智能匹配系统将他们与优质客户连接起来。",
          results: [
            "月收入增加 250%",
            "获得 3 个长期合作客户",
            "拓展国际客户群"
          ],
          metrics: {
            timeline: "5 天获得首位客户",
            income: "收入增加 250%",
            outcome: "3 个长期客户"
          }
        },
        {
          title: "企业数字转型���功",
          category: "顾问咨询",
          challenge: "一家传统制造公司需要专家顾问指导数字转型，但缺乏内部专业知识。",
          solution: "Case Where 企业版订阅为他们连接了 IoT、云端架构和变革管理的专业顾问。",
          results: [
            "成功迁移至云端基础设施",
            "运营成本降低 35%",
            "8 个月内完成转型"
          ],
          metrics: {
            timeline: "8 个月项目",
            savings: "成本降低 35%",
            outcome: "全面数字转型"
          }
        }
      ],
      ctaTitle: "准备好写下您的成功故事了吗？",
      ctaDescription: "加入数千位在 Case Where 找到成功的企业与专业人士",
      ctaButton: "立即开始",
      challenge: "挑战",
      solution: "解决方案",
      results: "成果",
      keyMetrics: "关键指标"
    }
  };

  const t = translations[language as keyof typeof translations] || translations['zh-TW'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mb-4">{t.title}</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Case Studies */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-12">
          {t.cases.map((caseStudy, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="p-8">
                {/* Header */}
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm mb-3">
                    {caseStudy.category}
                  </span>
                  <h2 className="mb-2">{caseStudy.title}</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Challenge */}
                  <div>
                    <h3 className="flex items-center gap-2 text-red-600 mb-3">
                      <Award className="h-5 w-5" />
                      {t.challenge}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {caseStudy.challenge}
                    </p>
                  </div>

                  {/* Solution */}
                  <div>
                    <h3 className="flex items-center gap-2 text-blue-600 mb-3">
                      <TrendingUp className="h-5 w-5" />
                      {t.solution}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {caseStudy.solution}
                    </p>
                  </div>
                </div>

                {/* Results */}
                <div className="mb-8">
                  <h3 className="flex items-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="h-5 w-5" />
                    {t.results}
                  </h3>
                  <ul className="space-y-2">
                    {caseStudy.results.map((result, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Metrics */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                  <h4 className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-blue-600" />
                    {t.keyMetrics}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl text-blue-600 mb-1">
                        {caseStudy.metrics.timeline}
                      </div>
                      <div className="text-sm text-gray-600">Timeline</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl text-green-600 mb-1">
                        {caseStudy.metrics.savings || caseStudy.metrics.income || caseStudy.metrics.growth}
                      </div>
                      <div className="text-sm text-gray-600">Impact</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-indigo-600 mb-1">
                        {caseStudy.metrics.outcome}
                      </div>
                      <div className="text-sm text-gray-600">Outcome</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-12 text-center text-white">
          <h2 className="mb-4">{t.ctaTitle}</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {t.ctaDescription}
          </p>
          <button
            onClick={() => {
              window.location.hash = 'pricing';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors text-lg"
          >
            {t.ctaButton}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CaseStudies;