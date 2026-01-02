import { useLanguage } from '../lib/LanguageContext';
import { useView } from '../contexts/ViewContext';
import { Cookie, Settings, Eye, Shield, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export function CookiesPolicyPage() {
  const { language } = useLanguage();
  const { setView } = useView();

  const content = {
    en: {
      title: 'Cookies Policy',
      lastUpdated: 'Last Updated: December 16, 2024',
      intro: 'This Cookies Policy explains how Case Where uses cookies and similar technologies to recognize you when you visit our platform. It explains what these technologies are and why we use them, as well as your rights to control our use of them.',
      
      section1Title: '1. What Are Cookies?',
      section1Content: 'Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work, or to work more efficiently, as well as to provide reporting information.',
      section1Items: [
        'Session Cookies: Temporary cookies that expire when you close your browser',
        'Persistent Cookies: Remain on your device for a set period or until you delete them',
        'First-Party Cookies: Set by the website you\'re visiting',
        'Third-Party Cookies: Set by a domain other than the one you\'re visiting'
      ],
      
      section2Title: '2. Why We Use Cookies',
      section2Content: 'We use cookies for several reasons:',
      section2Items: [
        'To enable essential features and functionality',
        'To remember your preferences and settings',
        'To understand how you use our platform',
        'To improve our services and user experience',
        'To provide personalized content and recommendations',
        'To analyze traffic and measure advertising effectiveness'
      ],
      
      section3Title: '3. Types of Cookies We Use',
      
      essentialTitle: 'Essential Cookies',
      essentialDesc: 'These cookies are necessary for the website to function and cannot be switched off in our systems.',
      essentialItems: [
        'Authentication: Keep you logged in',
        'Security: Protect against fraudulent activity',
        'Load Balancing: Distribute traffic across servers',
        'Session Management: Maintain your session state'
      ],
      
      functionalTitle: 'Functional Cookies',
      functionalDesc: 'These cookies enable enhanced functionality and personalization.',
      functionalItems: [
        'Language Preferences: Remember your language choice',
        'Currency Selection: Remember your preferred currency',
        'Theme Settings: Dark/light mode preferences',
        'Layout Customization: Remember your layout preferences'
      ],
      
      analyticsTitle: 'Analytics Cookies',
      analyticsDesc: 'These cookies help us understand how visitors interact with our website.',
      analyticsItems: [
        'Page Views: Track which pages are visited',
        'User Behavior: Understand navigation patterns',
        'Performance: Monitor loading times and errors',
        'Conversion Tracking: Measure goal completions'
      ],
      
      marketingTitle: 'Marketing Cookies',
      marketingDesc: 'These cookies track your activity to provide relevant advertisements.',
      marketingItems: [
        'Ad Targeting: Show relevant advertisements',
        'Campaign Tracking: Measure marketing effectiveness',
        'Retargeting: Show ads based on your interests',
        'Social Media: Enable social sharing features'
      ],
      
      section4Title: '4. Third-Party Cookies',
      section4Content: 'We work with third-party service providers who may set cookies on your device:',
      section4Items: [
        'Google Analytics: For website analytics',
        'Stripe: For payment processing',
        'PayPal: For payment processing',
        'Social Media Platforms: For sharing and authentication',
        'Content Delivery Networks: For faster content delivery'
      ],
      
      section5Title: '5. Your Cookie Choices',
      section5Content: 'You have several options for managing cookies:',
      
      browserTitle: 'Browser Settings',
      browserDesc: 'Most browsers allow you to control cookies through their settings:',
      browserItems: [
        'Block all cookies',
        'Block third-party cookies only',
        'Delete cookies when you close your browser',
        'Make exceptions for specific websites'
      ],
      
      optOutTitle: 'Opt-Out Options',
      optOutDesc: 'For specific cookie types, you can opt out through:',
      optOutItems: [
        'Cookie preference center (available on our website)',
        'Third-party opt-out tools',
        'Industry opt-out platforms',
        'Do Not Track browser settings'
      ],
      
      section6Title: '6. Impact of Disabling Cookies',
      section6Content: 'If you choose to disable cookies, please note that:',
      section6Items: [
        'Some features may not work properly',
        'You may need to log in repeatedly',
        'Your preferences may not be saved',
        'The website experience may be degraded',
        'Essential functionality will still work'
      ],
      
      section7Title: '7. Cookie Table',
      
      tableHeaders: {
        name: 'Cookie Name',
        purpose: 'Purpose',
        type: 'Type',
        duration: 'Duration'
      },
      
      cookies: [
        {
          name: 'session_token',
          purpose: 'User authentication',
          type: 'Essential',
          duration: '1 hour'
        },
        {
          name: 'user_preferences',
          purpose: 'Store language and currency settings',
          type: 'Functional',
          duration: '1 year'
        },
        {
          name: '_ga',
          purpose: 'Google Analytics tracking',
          type: 'Analytics',
          duration: '2 years'
        },
        {
          name: 'ad_tracking',
          purpose: 'Marketing and advertising',
          type: 'Marketing',
          duration: '90 days'
        }
      ],
      
      section8Title: '8. Updates to This Policy',
      section8Content: 'We may update this Cookies Policy from time to time to reflect changes in technology, legislation, or our business practices. We will notify you of any significant changes by posting the new policy on this page.',
      
      section9Title: '9. 聯繫我們',
      section9Content: '如果您對我們使用 cookies 有任何疑問，請通過以下方式聯繫我們：',
      contactEmail: '電子郵件：support@casewhr.com',
      contactAddress: '地址：Case Where 接得準股份有限公司，台灣台北',
      
      backToHome: 'Back to Home'
    },
    'zh-TW': {
      title: 'Cookies 政策',
      lastUpdated: '最後更新：2024年12月16日',
      intro: '本 Cookies 政策說明 Case Where 接得準如何使用 cookies 和類似技術來識別您訪問我們平台時的身份。它解釋了這些技術是什麼、我們為什麼使用它們，以及您控制我們使用它們的權利。',
      
      section1Title: '1. 什麼是 Cookies？',
      section1Content: 'Cookies 是當您訪問網站時放置在您的電腦或行動裝置上的小型數據文件。網站所有者廣泛使用 cookies 來使其網站運作或更有效地運作，以及提供報告信息。',
      section1Items: [
        '會話 Cookies：臨時 cookies，當您關閉瀏覽器時過期',
        '持久 Cookies：在您的裝置上保留一段時間或直到您刪除它們',
        '第一方 Cookies：由您正在訪問的網站設置',
        '第三方 Cookies：由您正在訪問的網域以外的網域設置'
      ],
      
      section2Title: '2. 我們為什麼使用 Cookies',
      section2Content: '我們使用 cookies 有幾個原因：',
      section2Items: [
        '啟用基本功能和特性',
        '記住您的偏好和設置',
        '了解您如何使用我們的平台',
        '改進我們的服務和用戶體驗',
        '提供個性化內容和推薦',
        '分析流量並衡量廣告效果'
      ],
      
      section3Title: '3. 我們使用的 Cookies 類型',
      
      essentialTitle: '必要 Cookies',
      essentialDesc: '這些 cookies 是網站運作所必需的，無法在我們的系統中關閉。',
      essentialItems: [
        '身份驗證：保持您的登入狀態',
        '安全性：防止欺詐活動',
        '負載平衡：在伺服器之間分配流量',
        '會話管理：維護您的會話狀態'
      ],
      
      functionalTitle: '功能性 Cookies',
      functionalDesc: '這些 cookies 啟用增強的功能和個性化。',
      functionalItems: [
        '語言偏好：記住您的語言選擇',
        '貨幣選擇：記住您偏好的貨幣',
        '主題設置：深色/淺色模式偏好',
        '佈局自定義：記住您的佈局偏好'
      ],
      
      analyticsTitle: '分析 Cookies',
      analyticsDesc: '這些 cookies 幫助我們了解訪問者如何與我們的網站互動。',
      analyticsItems: [
        '頁面瀏覽：追蹤訪問了哪些頁面',
        '用戶行為：了解導航模式',
        '性能：監控載入時間和錯誤',
        '轉換追蹤：衡量目標完成情況'
      ],
      
      marketingTitle: '營銷 Cookies',
      marketingDesc: '這些 cookies 追蹤您的活動以提供相關廣告。',
      marketingItems: [
        '廣告定位：顯示相關廣告',
        '活動追蹤：衡量營銷效果',
        '重新定位：根據您的興趣顯示廣告',
        '社交媒體：啟用社交分享功能'
      ],
      
      section4Title: '4. 第三方 Cookies',
      section4Content: '我們與可能在您的裝置上設置 cookies 的第三方服務提供商合作：',
      section4Items: [
        'Google Analytics：用於網站分析',
        'Stripe：用於支付處理',
        'PayPal：用於支付處理',
        '社交媒體平台：用於分享和身份驗證',
        '內容傳遞網路：用於更快的內容傳遞'
      ],
      
      section5Title: '5. 您的 Cookie 選擇',
      section5Content: '您有多種管理 cookies 的選項：',
      
      browserTitle: '瀏覽器設置',
      browserDesc: '大多數瀏覽器允許您通過其設置控制 cookies：',
      browserItems: [
        '阻止所有 cookies',
        '僅阻止第三方 cookies',
        '關閉瀏覽器時刪除 cookies',
        '為特定網站設置例外'
      ],
      
      optOutTitle: '退出選項',
      optOutDesc: '對於特定的 cookie 類型，您可以通過以下方式退出：',
      optOutItems: [
        'Cookie 偏好中心（在我們的網站上可用）',
        '第三方退出工具',
        '行業退出平台',
        '請勿追蹤瀏覽器設置'
      ],
      
      section6Title: '6. 禁用 Cookies 的影響',
      section6Content: '如果您選擇禁用 cookies，請注意：',
      section6Items: [
        '某些功能可能無法正常工作',
        '您可能需要重複登入',
        '您的偏好可能不會被保存',
        '網站體驗可能會降低',
        '基本功能仍將正常工作'
      ],
      
      section7Title: '7. Cookie 表格',
      
      tableHeaders: {
        name: 'Cookie 名稱',
        purpose: '用途',
        type: '類型',
        duration: '持續時間'
      },
      
      cookies: [
        {
          name: 'session_token',
          purpose: '用戶身份驗證',
          type: '必要',
          duration: '1 小時'
        },
        {
          name: 'user_preferences',
          purpose: '儲存語言和貨幣設置',
          type: '功能性',
          duration: '1 年'
        },
        {
          name: '_ga',
          purpose: 'Google Analytics 追蹤',
          type: '分析',
          duration: '2 年'
        },
        {
          name: 'ad_tracking',
          purpose: '營銷和廣告',
          type: '營銷',
          duration: '90 天'
        }
      ],
      
      section8Title: '8. 本政策的更新',
      section8Content: '我們可能會不時更新本 Cookies 政策以反映技術、立法或我們業務實踐的變化。我們將通過在本頁面上發布新政策來通知您任何重大變更。',
      
      section9Title: '9. 聯繫我們',
      section9Content: '如果您對我們使用 cookies 有任何疑問，請通過以下方式聯繫我們：',
      contactEmail: '電子郵件：support@casewhr.com',
      contactAddress: '地址：Case Where 接得準股份有限公司，台灣台北',
      
      backToHome: '返回首頁'
    },
    'zh-CN': {
      title: 'Cookies 政策',
      lastUpdated: '最后更新：2024年12月16日',
      intro: '本 Cookies 政策说明 Case Where 接得准如何使用 cookies 和类似技术来识别您访问我们平台时的身份。它解释了这些技术是什么、我们为什么使用它们，以及您控制我们使用它们的权利。',
      
      section1Title: '1. 什么是 Cookies？',
      section1Content: 'Cookies 是当您访问网站时放置在您的计算机或移动设备上的小型数据文件。网站所有者广泛使用 cookies 来使其网站运作或更有效地运作，以及提供报告信息。',
      section1Items: [
        '会话 Cookies：临时 cookies，当您关闭浏览器时过期',
        '持久 Cookies：在您的设备上保留一段���间或直到您删除它们',
        '第一方 Cookies：由您正在访问的网站设置',
        '第三方 Cookies：由您正在访问的域以外的域设置'
      ],
      
      section2Title: '2. 我们为什么使用 Cookies',
      section2Content: '我们使用 cookies 有几个原因：',
      section2Items: [
        '启用基本功能和特性',
        '记住您的偏好和设置',
        '了解您如何使用我们的平台',
        '改进我们的服务和用户体验',
        '提供个性化内容和推荐',
        '分析流量并衡量广告效果'
      ],
      
      section3Title: '3. 我们使用的 Cookies 类型',
      
      essentialTitle: '必要 Cookies',
      essentialDesc: '这些 cookies 是网站运作所必需的，无法在我们的系统中关闭。',
      essentialItems: [
        '身份验证：保持您的登录状态',
        '安全性：防止欺诈活动',
        '负载平衡：在服务器之间分配流量',
        '会话管理：维护您的会话状态'
      ],
      
      functionalTitle: '功能性 Cookies',
      functionalDesc: '这些 cookies 启用增强的功能和个性化。',
      functionalItems: [
        '语言偏好：记住您的语言选择',
        '货币选择：记住您偏好的货币',
        '主题设置：深色/浅色模式偏好',
        '布局自定义：记住您的布局偏好'
      ],
      
      analyticsTitle: '分析 Cookies',
      analyticsDesc: '这些 cookies 帮助我们了解访问者如何与我们的网站互动。',
      analyticsItems: [
        '页面浏览：追踪访问了哪些页面',
        '用户行为：了解导航模式',
        '性能：监控加载时间和错误',
        '转换追踪：衡量目标完成情况'
      ],
      
      marketingTitle: '营销 Cookies',
      marketingDesc: '这些 cookies 追踪您的活动以提供相关广告。',
      marketingItems: [
        '广告定位：显示相关广告',
        '活动追踪：衡量营销效果',
        '重新定位：根据您的兴趣显示广告',
        '社交媒体：启用社交分享功能'
      ],
      
      section4Title: '4. 第三方 Cookies',
      section4Content: '我们与可能在您的设备上设置 cookies 的第三方服务提供商合作：',
      section4Items: [
        'Google Analytics：用于网站分析',
        'Stripe：用于支付处理',
        'PayPal：用于支付处理',
        '社交媒体平台：用于分享和身份验证',
        '内容传递网络：用于更快的内容传递'
      ],
      
      section5Title: '5. 您的 Cookie 选择',
      section5Content: '您有多种管理 cookies 的选项：',
      
      browserTitle: '浏览器设置',
      browserDesc: '大多数浏览器允许您通过其设置控制 cookies：',
      browserItems: [
        '阻止所有 cookies',
        '仅阻止第三方 cookies',
        '关闭浏览器时删除 cookies',
        '为特定网站设置例外'
      ],
      
      optOutTitle: '退出选项',
      optOutDesc: '对于特定的 cookie 类型，您可以通过以下方式退出：',
      optOutItems: [
        'Cookie 偏好中心（在我们的网站上可用）',
        '第三方退出工具',
        '行业退出平台',
        '请勿追踪浏览器设置'
      ],
      
      section6Title: '6. 禁用 Cookies 的影响',
      section6Content: '如果您选择禁用 cookies，请注意：',
      section6Items: [
        '某些功能可能无法正常工作',
        '您可能需要重复登录',
        '您的偏好可能不会被保存',
        '网站体验可能会降低',
        '基本功能仍将正常工作'
      ],
      
      section7Title: '7. Cookie 表格',
      
      tableHeaders: {
        name: 'Cookie 名称',
        purpose: '用途',
        type: '类型',
        duration: '持续时间'
      },
      
      cookies: [
        {
          name: 'session_token',
          purpose: '用户身份验证',
          type: '必要',
          duration: '1 小时'
        },
        {
          name: 'user_preferences',
          purpose: '存储语言和货币设置',
          type: '功能性',
          duration: '1 年'
        },
        {
          name: '_ga',
          purpose: 'Google Analytics 追踪',
          type: '分析',
          duration: '2 年'
        },
        {
          name: 'ad_tracking',
          purpose: '营销和广告',
          type: '营销',
          duration: '90 天'
        }
      ],
      
      section8Title: '8. 本政策的更新',
      section8Content: '我们可能会不时更新本 Cookies 政策以反映技术、立法或我们业务实践的变化。我们将通过在本页面上发布新政策来通知您任何重大变更。',
      
      section9Title: '9. 联系我们',
      section9Content: '如果您对我们使用 cookies 有任何疑问，请通过以下方式联系我们：',
      contactEmail: '电子邮件：support@casewhr.com',
      contactAddress: '地址：Case Where 接得准股份有限公司，台湾台北',
      
      backToHome: '返回首页'
    }
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  const handleBackToHome = () => {
    setView('home');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'auto' });
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="w-12 h-12" />
            <h1 className="text-4xl">{t.title}</h1>
          </div>
          <p className="text-orange-100 text-sm">{t.lastUpdated}</p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <p className="text-gray-700 leading-relaxed">{t.intro}</p>
        </div>

        {/* Section 1 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-3">{t.section1Title}</h2>
              <p className="text-gray-600 mb-4">{t.section1Content}</p>
              <ul className="space-y-2">
                {t.section1Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Eye className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-3">{t.section2Title}</h2>
              <p className="text-gray-600 mb-4">{t.section2Content}</p>
              <ul className="space-y-2">
                {t.section2Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 3 - Cookie Types */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-2xl text-gray-900 mb-6">{t.section3Title}</h2>
          
          {/* Essential Cookies */}
          <div className="mb-6 border-l-4 border-green-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-xl text-gray-900">{t.essentialTitle}</h3>
            </div>
            <p className="text-gray-600 mb-3">{t.essentialDesc}</p>
            <ul className="space-y-1">
              {t.essentialItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Functional Cookies */}
          <div className="mb-6 border-l-4 border-blue-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl text-gray-900">{t.functionalTitle}</h3>
            </div>
            <p className="text-gray-600 mb-3">{t.functionalDesc}</p>
            <ul className="space-y-1">
              {t.functionalItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Analytics Cookies */}
          <div className="mb-6 border-l-4 border-purple-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-purple-600" />
              <h3 className="text-xl text-gray-900">{t.analyticsTitle}</h3>
            </div>
            <p className="text-gray-600 mb-3">{t.analyticsDesc}</p>
            <ul className="space-y-1">
              {t.analyticsItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketing Cookies */}
          <div className="border-l-4 border-orange-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl text-gray-900">{t.marketingTitle}</h3>
            </div>
            <p className="text-gray-600 mb-3">{t.marketingDesc}</p>
            <ul className="space-y-1">
              {t.marketingItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="text-orange-600 mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-2xl text-gray-900 mb-3">{t.section4Title}</h2>
          <p className="text-gray-600 mb-4">{t.section4Content}</p>
          <ul className="space-y-2">
            {t.section4Items.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-orange-600 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 5 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-2xl text-gray-900 mb-4">{t.section5Title}</h2>
          <p className="text-gray-600 mb-6">{t.section5Content}</p>
          
          <div className="mb-6">
            <h3 className="text-xl text-gray-900 mb-2">{t.browserTitle}</h3>
            <p className="text-gray-600 mb-3">{t.browserDesc}</p>
            <ul className="space-y-2">
              {t.browserItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl text-gray-900 mb-2">{t.optOutTitle}</h3>
            <p className="text-gray-600 mb-3">{t.optOutDesc}</p>
            <ul className="space-y-2">
              {t.optOutItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 6 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-3">{t.section6Title}</h2>
              <p className="text-gray-600 mb-4">{t.section6Content}</p>
              <ul className="space-y-2">
                {t.section6Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 7 - Cookie Table */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6 overflow-x-auto">
          <h2 className="text-2xl text-gray-900 mb-4">{t.section7Title}</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-gray-900">{t.tableHeaders.name}</th>
                <th className="text-left py-3 px-4 text-gray-900">{t.tableHeaders.purpose}</th>
                <th className="text-left py-3 px-4 text-gray-900">{t.tableHeaders.type}</th>
                <th className="text-left py-3 px-4 text-gray-900">{t.tableHeaders.duration}</th>
              </tr>
            </thead>
            <tbody>
              {t.cookies.map((cookie, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-800">{cookie.name}</td>
                  <td className="py-3 px-4 text-gray-600">{cookie.purpose}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      cookie.type === t.essentialTitle || cookie.type === '必要' 
                        ? 'bg-green-100 text-green-800' 
                        : cookie.type === t.functionalTitle || cookie.type === '功能性'
                        ? 'bg-blue-100 text-blue-800'
                        : cookie.type === t.analyticsTitle || cookie.type === '分析'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {cookie.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{cookie.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sections 8-9 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-2xl text-gray-900 mb-4">{t.section8Title}</h2>
          <p className="text-gray-700 mb-6">{t.section8Content}</p>
          
          <h2 className="text-2xl text-gray-900 mb-4">{t.section9Title}</h2>
          <p className="text-gray-700 mb-4">{t.section9Content}</p>
          <div className="space-y-2">
            <p className="text-gray-700">{t.contactEmail}</p>
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

export default CookiesPolicyPage;