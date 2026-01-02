import { useLanguage } from '../lib/LanguageContext';
import { useView } from '../contexts/ViewContext';
import { Building2, Target, Heart, Users, Award, TrendingUp, Globe, CheckCircle, Lightbulb, Shield, Zap, Clock } from 'lucide-react';

export function AboutPage() {
  const { language } = useLanguage();
  const { setView } = useView();

  const content = {
    en: {
      title: 'About Case Where',
      subtitle: 'Building Bridges Between Talent and Opportunity',
      
      heroDescription: 'Case Where is a global freelancing platform that connects businesses with top-tier professionals across industries. We believe in empowering talent and enabling businesses to achieve their goals through seamless collaboration.',
      
      missionTitle: 'Our Mission',
      missionText: 'To create a transparent, efficient, and inclusive marketplace where talent meets opportunity, fostering innovation and growth for businesses and professionals worldwide.',
      
      visionTitle: 'Our Vision',
      visionText: 'To become the world\'s most trusted platform for professional services, where every project finds its perfect match and every professional can thrive.',
      
      valuesTitle: 'Our Core Values',
      values: [
        {
          icon: Shield,
          title: 'Trust & Transparency',
          description: 'We build trust through transparent processes, fair pricing, and honest communication.'
        },
        {
          icon: Heart,
          title: 'Quality First',
          description: 'We are committed to maintaining the highest standards in service delivery and user experience.'
        },
        {
          icon: Globe,
          title: 'Global Collaboration',
          description: 'We connect talent across borders, cultures, and time zones to create limitless possibilities.'
        },
        {
          icon: Lightbulb,
          title: 'Innovation',
          description: 'We constantly evolve our platform with cutting-edge technology and user-centered design.'
        },
        {
          icon: Users,
          title: 'Community',
          description: 'We foster a supportive community where professionals and businesses grow together.'
        },
        {
          icon: Zap,
          title: 'Efficiency',
          description: 'We streamline workflows to help you focus on what matters most - great work.'
        }
      ],
      
      storyTitle: 'Our Story',
      storyContent: 'Founded in 2024 in Taipei, Taiwan, Case Where was born from a simple observation: the traditional hiring process is broken. Businesses struggle to find qualified professionals, while talented individuals struggle to find meaningful work. We set out to change that.',
      storyContent2: 'Today, Case Where serves thousands of clients and freelancers across the globe, facilitating projects in technology, design, marketing, business consulting, and more. Our platform combines advanced matching algorithms, secure payment systems, and comprehensive project management tools to create a seamless experience for all users.',
      
      whatWeOfferTitle: 'What We Offer',
      offers: [
        {
          icon: Users,
          title: 'Diverse Talent Pool',
          description: 'Access to thousands of verified professionals across 50+ categories'
        },
        {
          icon: Shield,
          title: 'Secure Payments',
          description: 'Tri-currency support (TWD/USD/CNY) with secure escrow and milestone-based payments'
        },
        {
          icon: Clock,
          title: '24/7 Support',
          description: 'Round-the-clock customer support in multiple languages'
        },
        {
          icon: Award,
          title: 'Quality Guarantee',
          description: 'Rigorous vetting process and performance-based ratings'
        },
        {
          icon: TrendingUp,
          title: 'Smart Matching',
          description: 'AI-powered matching to connect you with the perfect professional'
        },
        {
          icon: Globe,
          title: 'Global Reach',
          description: 'Operate seamlessly across borders with tri-currency pricing (TWD/USD/CNY)'
        }
      ],
      
      statsTitle: 'Our Impact',
      stats: [
        { number: '10,000+', label: 'Active Users' },
        { number: '5,000+', label: 'Projects Completed' },
        { number: '50+', label: 'Countries Served' },
        { number: '98%', label: 'Satisfaction Rate' }
      ],
      
      whyChooseTitle: 'Why Choose Case Where?',
      reasons: [
        {
          title: 'Verified Professionals',
          description: 'All freelancers undergo a comprehensive vetting process including portfolio review, skill assessment, and reference verification.'
        },
        {
          title: 'Fair & Transparent Pricing',
          description: 'No hidden fees. Our tri-currency system (TWD/USD/CNY) ensures fair pricing for both local and international users.'
        },
        {
          title: 'Secure Escrow System',
          description: 'Your payments are protected. Funds are held securely until project milestones are completed to your satisfaction.'
        },
        {
          title: 'Comprehensive Tools',
          description: 'From project proposals to invoicing, we provide all the tools you need to manage projects efficiently.'
        },
        {
          title: 'Three-Tier Subscription',
          description: 'Choose the plan that fits your needs - from individual freelancers to enterprise teams.'
        },
        {
          title: 'Local & Global Support',
          description: 'Based in Taiwan with a global perspective. We support both local businesses and international collaboration.'
        }
      ],
      
      teamTitle: 'Our Leadership',
      teamIntro: 'Case Where is led by a team of experienced entrepreneurs, technologists, and industry experts passionate about transforming the future of work.',
      
      joinTitle: 'Join Our Journey',
      joinText: 'Whether you\'re a business looking for talent or a professional seeking opportunities, Case Where is your platform for success. Join thousands of satisfied users who have found their perfect match on our platform.',
      
      ctaTitle: 'Ready to Get Started?',
      ctaSubtitle: 'Join Case Where today and experience the future of freelancing',
      ctaButtonClient: 'Find Talent',
      ctaButtonFreelancer: 'Find Work',
      
      contactTitle: 'Get in Touch',
      contactText: 'Have questions? We\'d love to hear from you.',
      contactEmail: 'support@casewhr.com',
      contactPhone: 'Phone: +886-2-XXXX-XXXX',
      contactAddress: 'Address: Taipei, Taiwan',
      
      backToHome: 'Back to Home'
    },
    'zh-TW': {
      title: '關於接得準',
      subtitle: '連接人才與機會的橋樑',
      
      heroDescription: 'Case Where 接得準是一個全球自由接案平台，連接企業與各行業頂尖專業人士。我們相信通過無縫協作賦能人才，幫助企業實現目標。',
      
      missionTitle: '我們的使命',
      missionText: '創建一個透明、高效且包容的市場，讓人才與機會相遇，促進全球企業和專業人士的創新與成長。',
      
      visionTitle: '我們的願景',
      visionText: '成為全球最值得信賴的專業服務平台，讓每個項目都能找到完美匹配，讓每位專業人士都能蓬勃發展。',
      
      valuesTitle: '我們的核心價值觀',
      values: [
        {
          icon: Shield,
          title: '信任與透明',
          description: '我們通過透明的流程、公平的定價和誠實的溝通建立信任。'
        },
        {
          icon: Heart,
          title: '質量至上',
          description: '我們致力於在服務交付和用戶體驗方面保持最高標準。'
        },
        {
          icon: Globe,
          title: '全球協作',
          description: '我們跨越國界、文化和時區連接人才，創造無限可能。'
        },
        {
          icon: Lightbulb,
          title: '創新',
          description: '我們不斷以尖端技術和以用戶為中心的設計演進平台。'
        },
        {
          icon: Users,
          title: '社群',
          description: '我們培育一個支持性社群，讓專業人士和企業共同成長。'
        },
        {
          icon: Zap,
          title: '效率',
          description: '我們簡化工作流程，幫助您專注於最重要的事情 - 出色的工作。'
        }
      ],
      
      storyTitle: '我們的故事',
      storyContent: '接得準成立於 2024 年，位於台灣台北，源於一個簡單的觀察：傳統招聘流程已經過時。企業難以找到合格的專業人士，而有才華的個人也難以找到有意義的工作。我們決心改變這一現狀。',
      storyContent2: '如今，Case Where 為全球數千名客戶和自由工作者提供服務，促成技術、設計、營銷、商業諮詢等領域的項目。我們的平台結合了先進的匹配算法、安全的支付系統和全面的項目管理工具，為所有用戶創造無縫體驗。',
      
      whatWeOfferTitle: '我們提供什麼',
      offers: [
        {
          icon: Users,
          title: '多元人才庫',
          description: '訪問 50 多個類別中數千名經過驗證的專業人士'
        },
        {
          icon: Shield,
          title: '安全支付',
          description: '支持三幣計價（TWD/USD/CNY），提供安全託管和基於里程碑的支付'
        },
        {
          icon: Clock,
          title: '24/7 支援',
          description: '全天候��語言客戶支援'
        },
        {
          icon: Award,
          title: '品質保證',
          description: '嚴格的審查流程和基於表現的評級'
        },
        {
          icon: TrendingUp,
          title: '智能匹配',
          description: 'AI 驅動的匹配系統，連接您與完美的專業人士'
        },
        {
          icon: Globe,
          title: '全球觸及',
          description: '通過三幣計價系統（TWD/USD/CNY）無縫跨境運營'
        }
      ],
      
      statsTitle: '我們的影響力',
      stats: [
        { number: '10,000+', label: '活躍用戶' },
        { number: '5,000+', label: '完成項目' },
        { number: '50+', label: '服務國家' },
        { number: '98%', label: '滿意度' }
      ],
      
      whyChooseTitle: '為什麼選擇接得準？',
      reasons: [
        {
          title: '經過驗證的專業人士',
          description: '所有自由工作者都經過全面審查，包括作品集審核、技能評估和推薦信驗證。'
        },
        {
          title: '公平透明的定價',
          description: '沒有隱藏費用。我們的三幣系統（TWD/USD/CNY）確保本地和國際用戶都能獲得公平定價。'
        },
        {
          title: '安全的託管系統',
          description: '您的付款受到保護。資金被安全��管，直到項目里程碑達到您的滿意為止。'
        },
        {
          title: '全面的工具',
          description: '從項目提案到發票開立，我們提供高效管理項目所需的所有工具。'
        },
        {
          title: '三層訂閱體系',
          description: '選擇適您需求的計劃 - 從個人自由工作者到企業團隊。'
        },
        {
          title: '本地與全球支援',
          description: '立足台灣，放眼全球。我們支持本地企業和國際協作。'
        }
      ],
      
      teamTitle: '我們的領導團隊',
      teamIntro: 'Case Where 由一支經驗豐富的企業家、技術專家和行業專家團隊領導，他們熱衷於改變工作的未來。',
      
      joinTitle: '加入我們的旅程',
      joinText: '無論您是尋找人才的企業還是尋求機會的專業人士，Case Where 都是您成功的平台。加入數千名在我們平台上找到完美匹配的滿意用戶。',
      
      ctaTitle: '準備開始了嗎？',
      ctaSubtitle: '立即加入接得準，體驗自由接案的未來',
      ctaButtonClient: '尋找人才',
      ctaButtonFreelancer: '尋找工作',
      
      contactTitle: '聯繫我們',
      contactText: '有問題嗎？我們很樂意聽取您的意見。',
      contactEmail: '電子郵件：support@casewhr.com',
      contactPhone: '電話+886-2-XXXX-XXXX',
      contactAddress: '地址：台灣台北',
      
      backToHome: '返回首頁'
    },
    'zh-CN': {
      title: '关于接得准',
      subtitle: '连接人才与机会的桥梁',
      
      heroDescription: 'Case Where 接得准是一个全球自由接案平台，连接企业与各行业顶尖专业人士。我们相信通过无缝协作赋能人才，帮助企业实现目标。',
      
      missionTitle: '我们的使命',
      missionText: '创建一个透明、高效且包容的市场，让人才与机会相遇，促进全球企业和专业人士的创新与成长。',
      
      visionTitle: '我们的愿景',
      visionText: '成为全球最值得信赖的专业服务平台，让每个项目都能找到完美匹配，让每位专业人士都能蓬勃发展。',
      
      valuesTitle: '我们的核心价值观',
      values: [
        {
          icon: Shield,
          title: '信任与透明',
          description: '我们通过透明的流程、公平的定价和诚实的沟通建立信任。'
        },
        {
          icon: Heart,
          title: '质量至上',
          description: '我们致力于在服务交付和用户体验方面保持最高标准。'
        },
        {
          icon: Globe,
          title: '全球协作',
          description: '我们跨越国界、文化和时区连接人才，创造无限可能。'
        },
        {
          icon: Lightbulb,
          title: '创新',
          description: '我们不断以尖端技术和以用户为中心的设计演进平台。'
        },
        {
          icon: Users,
          title: '社群',
          description: '我们培育一个支持性社群，让专业人士和企业共同成长。'
        },
        {
          icon: Zap,
          title: '效率',
          description: '我们简化工作流程，帮助您专注于最重要的事情 - 出色的工作。'
        }
      ],
      
      storyTitle: '我们的故事',
      storyContent: '接得准成立于 2024 年，位于台湾台北，源于一个简单的观察：传统招聘流程已经过时。企业难以找到合格的专业人士，而有才华的个人也难以找到有意义的工作。我们决心改变这一现状。',
      storyContent2: '如今，Case Where 为全球数千名客户和自由工作者提供服务，促成技术、设计、营销、商业咨询等领域的项目。我们的平台结合了先进的匹配算法、安全的支付系统和全面的项目管理工具，为所有用户创造无缝体验。',
      
      whatWeOfferTitle: '我们提供什么',
      offers: [
        {
          icon: Users,
          title: '多元人才库',
          description: '访问 50 多个类别中数千名经过验证的专业人士'
        },
        {
          icon: Shield,
          title: '安全支付',
          description: '支持三币计价（TWD/USD/CNY），提供安全托管和基于里程碑的支付'
        },
        {
          icon: Clock,
          title: '24/7 支持',
          description: '全天候多语言客户支持'
        },
        {
          icon: Award,
          title: '品质保证',
          description: '严格的审查流程和基于表现的评级'
        },
        {
          icon: TrendingUp,
          title: '智能匹配',
          description: 'AI 驱动的匹配系统，连接您与完美的专业人士'
        },
        {
          icon: Globe,
          title: '全球触及',
          description: '通过三币计价系统（TWD/USD/CNY）无缝跨境运营'
        }
      ],
      
      statsTitle: '我们的影响力',
      stats: [
        { number: '10,000+', label: '活跃用户' },
        { number: '5,000+', label: '完成项目' },
        { number: '50+', label: '服务国家' },
        { number: '98%', label: '满意度' }
      ],
      
      whyChooseTitle: '为什么选择接得准？',
      reasons: [
        {
          title: '经过验证的专业人士',
          description: '所有自由工作者都经过全面审查，包括作品集审核、技能评估和推荐信验证。'
        },
        {
          title: '公平透明的定价',
          description: '没有隐藏费用。我们的三币系统（TWD/USD/CNY）确保本地和国际用户都能获得公平定价。'
        },
        {
          title: '安全的托管系统',
          description: '您的付款受到保护。资金被安全托管，直到项目里程碑达到您的满意为止。'
        },
        {
          title: '全面的工具',
          description: '从项目提案到发票开立，我们提供高效管理项目所需的所有工具。'
        },
        {
          title: '三层订阅体系',
          description: '选择适合您需求的计划 - 从个人自由工作者到企业团队。'
        },
        {
          title: '本地与全球支持',
          description: '立足台湾，放眼全球。我们支持本地企业和国际协作。'
        }
      ],
      
      teamTitle: '我们的领导团队',
      teamIntro: 'Case Where 由一支经验丰富的企业家、技术专家和行业专家团队领导，他们热衷于改变工作的未来。',
      
      joinTitle: '加入我们的旅程',
      joinText: '无论您是寻找人才的企业还是寻求机会的专业人士，Case Where 都是您成功的平台。加入数千名在我们平台上找到完美匹配的满意用户。',
      
      ctaTitle: '准备开始了吗？',
      ctaSubtitle: '立即加入接得准，体验自由接案的未来',
      ctaButtonClient: '寻找人才',
      ctaButtonFreelancer: '寻找工作',
      
      contactTitle: '联系我们',
      contactText: '有问题吗？我们很乐意听取您的意见。',
      contactEmail: '电子邮件：support@casewhr.com',
      contactPhone: '电话：+886-2-XXXX-XXXX',
      contactAddress: '地址：台湾台北',
      
      backToHome: '返回首页'
    }
  };

  // ⭐ 支持三语系统（en, zh-TW, zh-CN），兼容舊的 'zh' 語言代碼
  const t = content[language as keyof typeof content] || content['zh-TW'];

  const handleBackToHome = () => {
    setView('home');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'auto' });
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleFindTalent = () => {
    setView('home');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'auto' });
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
    // TODO: 未來可以添加直接跳轉到瀏覽人才頁面或打開註冊對話框
  };

  const handleFindWork = () => {
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // TODO: 未來可以添加直接跳轉到瀏覽項目頁面或打開註冊對話框
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Building2 className="w-20 h-20" />
            </div>
            <h1 className="text-5xl mb-4">{t.title}</h1>
            <p className="text-2xl text-orange-100 mb-6">{t.subtitle}</p>
            <p className="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
              {t.heroDescription}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-orange-600" />
              <h2 className="text-3xl text-gray-900">{t.missionTitle}</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{t.missionText}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <h2 className="text-3xl text-gray-900">{t.visionTitle}</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{t.visionText}</p>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h2 className="text-4xl text-center text-gray-900 mb-12">{t.valuesTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t.values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-100 to-red-100 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                  <h3 className="text-xl text-gray-900 text-center mb-3">{value.title}</h3>
                  <p className="text-gray-600 text-center leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-10 mb-16">
          <h2 className="text-4xl text-gray-900 mb-6 text-center">{t.storyTitle}</h2>
          <div className="space-y-4 max-w-4xl mx-auto">
            <p className="text-gray-700 leading-relaxed text-lg">{t.storyContent}</p>
            <p className="text-gray-700 leading-relaxed text-lg">{t.storyContent2}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-16">
          <h2 className="text-4xl text-center text-gray-900 mb-12">{t.statsTitle}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {t.stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-8 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl text-orange-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* What We Offer */}
        <div className="mb-16">
          <h2 className="text-4xl text-center text-gray-900 mb-12">{t.whatWeOfferTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t.offers.map((offer, index) => {
              const Icon = offer.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
                  <Icon className="w-10 h-10 text-orange-600 mb-4" />
                  <h3 className="text-xl text-gray-900 mb-3">{offer.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{offer.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-white rounded-2xl shadow-sm p-10 mb-16">
          <h2 className="text-4xl text-gray-900 mb-8 text-center">{t.whyChooseTitle}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {t.reasons.map((reason, index) => (
              <div key={index} className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg text-gray-900 mb-2">{reason.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{reason.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-10 text-white mb-16">
          <h2 className="text-4xl mb-4 text-center">{t.teamTitle}</h2>
          <p className="text-lg text-center text-white/90 max-w-3xl mx-auto">{t.teamIntro}</p>
        </div>

        {/* Join Us */}
        <div className="bg-white rounded-2xl shadow-sm p-10 mb-16">
          <h2 className="text-4xl text-gray-900 mb-4 text-center">{t.joinTitle}</h2>
          <p className="text-lg text-gray-700 text-center leading-relaxed max-w-3xl mx-auto">
            {t.joinText}
          </p>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 rounded-2xl p-12 text-white text-center mb-16">
          <h2 className="text-4xl mb-3">{t.ctaTitle}</h2>
          <p className="text-xl text-white/90 mb-8">{t.ctaSubtitle}</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={handleFindTalent}
              className="bg-white text-orange-600 px-8 py-3 rounded-lg hover:bg-orange-50 transition-colors"
            >
              {t.ctaButtonClient}
            </button>
            <button
              onClick={handleFindWork}
              className="bg-orange-700 text-white px-8 py-3 rounded-lg hover:bg-orange-800 transition-colors border-2 border-white"
            >
              {t.ctaButtonFreelancer}
            </button>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-sm p-10 mb-8">
          <h2 className="text-3xl text-gray-900 mb-4 text-center">{t.contactTitle}</h2>
          <p className="text-gray-700 text-center mb-6">{t.contactText}</p>
          <div className="space-y-2 text-center">
            <p className="text-gray-700">
              {language === 'en' ? 'Email: ' : language === 'zh-CN' ? '电子邮件：' : '電子郵件：'}
              <a 
                href="mailto:support@casewhr.com" 
                className="text-orange-600 hover:text-orange-700 underline"
              >
                support@casewhr.com
              </a>
            </p>
            <p className="text-gray-700">{t.contactPhone}</p>
            <p className="text-gray-700">{t.contactAddress}</p>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={handleBackToHome}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all"
          >
            {t.backToHome}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;