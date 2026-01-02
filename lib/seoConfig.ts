import { Language } from './LanguageContext';

export interface PageSEO {
  title: string;
  description: string;
  keywords: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
}

// 首頁 SEO
const homeSEO: Record<Language, PageSEO> = {
  en: {
    title: 'CaseWHR - Global Professional Freelancing Platform | Taiwan Best Talent Marketplace',
    description: 'Leading global freelancing platform from Taiwan. Professional talent matching service with multi-currency support (TWD, USD, CNY). Integrated with ECPay and PayPal. Complete contract management, invoice system, and enterprise branding. Over 10,000 professional freelancers worldwide.',
    keywords: 'freelancing platform, remote work, freelancer, outsourcing, global freelancing, contract management, invoice system, Taiwan freelance, ECPay, PayPal, professional services, remote jobs, freelance marketplace, talent platform, gig economy',
    type: 'website',
  },
  'zh-TW': {
    title: 'CaseWHR 接得準 - 全球專業接案平台 | 台灣最佳自由工作者媒合平台',
    description: '台灣領先的全球接案平台，提供專業的自由工作者媒合服務。支援新台幣、美金、人民幣三幣計價，整合 ECPay 綠界金流與 PayPal 國際支付。包含合約管理、發票系統、企業品牌客製化等完整功能。超過 10,000 位專業人才，服務遍及全球。',
    keywords: '接案平台, 自由工作者, 台灣接案, 遠距工作, 外包平台, 接案網站, 斜槓工作, 兼職平台, 專案外包, 在家工作, 接案媒合, 人才平台, 台灣外包, 綠界金流, ECPay, 合約管理, 發票系統, 企業品牌, 專業接案, 線上外包, 零工經濟',
    type: 'website',
  },
  'zh-CN': {
    title: 'CaseWHR 接得准 - 全球专业接案平台 | 台湾最佳自由工作者媒合平台',
    description: '台湾领先的全球接案平台，提供专业的自由工作者媒合服务。支持新台币、美金、人民币三币计价，整合 ECPay 绿界金流与 PayPal 国际支付。包含合约管理、发票系统、企业品牌定制等完整功能。超过 10,000 位专业人才，服务遍及全球。',
    keywords: '接案平台, 自由工作者, 台湾接案, 远程工作, 外包平台, 接案网站, 斜杠工作, 兼职平台, 项目外包, 在家工作, 接案媒合, 人才平台, 台湾外包, 绿界金流, ECPay, 合约管理, 发票系统, 企业品牌, 专业接案, 线上外包, 零工经济',
    type: 'website',
  },
  zh: {
    title: 'CaseWHR 接得準 - 全球專業接案平台',
    description: '台灣領先的全球接案平台，提供專業的自由工作者媒合服務。',
    keywords: '接案平台, 自由工作者, 台灣接案',
    type: 'website',
  },
};

// 關於我們 SEO
const aboutSEO: Record<Language, PageSEO> = {
  en: {
    title: 'About CaseWHR - Professional Freelancing Platform from Taiwan',
    description: 'Learn about CaseWHR, Taiwan\'s leading global freelancing platform. Our mission is to connect talented freelancers with clients worldwide through secure, efficient, and transparent project collaboration.',
    keywords: 'about casewhr, taiwan freelance platform, our story, company mission, professional services, global talent network',
    type: 'website',
  },
  'zh-TW': {
    title: '關於我們 - CaseWHR 接得準專業接案平台',
    description: '了解 CaseWHR 接得準，台灣領先的全球接案平台。我們的使命是透過安全、高效、透明的專案協作，連接全球優秀的自由工作者與客戶。',
    keywords: '關於 CaseWHR, 台灣接案平台, 公司故事, 企業使命, 專業服務, 全球人才網絡',
    type: 'website',
  },
  'zh-CN': {
    title: '关于我们 - CaseWHR 接得准专业接案平台',
    description: '了解 CaseWHR 接得准，台湾领先的全球接案平台。我们的使命是通过安全、高效、透明的项目协作，连接全球优秀的自由工作者与客户。',
    keywords: '关于 CaseWHR, 台湾接案平台, 公司故事, 企业使命, 专业服务, 全球人才网络',
    type: 'website',
  },
  zh: {
    title: '關於我們 - CaseWHR 接得準',
    description: '了解 CaseWHR 接得準，台灣領先的全球接案平台。',
    keywords: '關於我們, 接案平台',
    type: 'website',
  },
};

// 定價頁面 SEO
const pricingSEO: Record<Language, PageSEO> = {
  en: {
    title: 'Pricing & Plans - CaseWHR Professional Membership',
    description: 'Flexible membership plans for freelancers and clients. Free Basic plan, Professional plan with advanced features, and Enterprise plan for custom solutions. Multi-currency support with TWD, USD, and CNY pricing.',
    keywords: 'pricing, membership plans, freelance pricing, professional plan, enterprise plan, subscription, multi-currency, payment plans',
    type: 'website',
  },
  'zh-TW': {
    title: '定價方案 - CaseWHR 專業會員方案',
    description: '靈活的會員方案，適合自由工作者與客戶。免費基礎方案、專業進階功能方案，以及企業客製化方案。支援新台幣、美金、人民幣多幣別計價。',
    keywords: '定價, 會員方案, 接案定價, 專業方案, 企業方案, 訂閱, 多幣別, 付費方案',
    type: 'website',
  },
  'zh-CN': {
    title: '定价方案 - CaseWHR 专业会员方案',
    description: '灵活的会员方案，适合自由工作者与客户。免费基础方案、专业进阶功能方案，以及企业定制方案。支持新台币、美金、人民币多币别计价。',
    keywords: '定价, 会员方案, 接案定价, 专业方案, 企业方案, 订阅, 多币别, 付费方案',
    type: 'website',
  },
  zh: {
    title: '定價方案 - CaseWHR',
    description: '靈活的會員方案，適合自由工作者與客戶。',
    keywords: '定價, 會員方案',
    type: 'website',
  },
};

// 專案頁面 SEO
const projectsSEO: Record<Language, PageSEO> = {
  en: {
    title: 'Browse Projects - Find Freelance Work on CaseWHR',
    description: 'Discover thousands of freelance projects across web development, mobile apps, design, writing, marketing, and more. Multi-currency payments with secure escrow protection.',
    keywords: 'freelance projects, remote jobs, web development jobs, design projects, writing jobs, marketing projects, freelance work, project marketplace',
    type: 'website',
  },
  'zh-TW': {
    title: '瀏覽專案 - 在 CaseWHR 尋找接案工作',
    description: '探索數千個跨網站開發、行動應用程式、設計、寫作、行銷等領域的自由接案專案。支援多幣別付款與安全的第三方擔保保護。',
    keywords: '接案專案, 遠距工作, 網站開發工作, 設計專案, 寫作工作, 行銷專案, 自由工作, 專案市場',
    type: 'website',
  },
  'zh-CN': {
    title: '浏览项目 - 在 CaseWHR 寻找接案工作',
    description: '探索数千个跨网站开发、移动应用程序、设计、写作、营销等领域的自由接案项目。支持多币别付款与安全的第三方担保保护。',
    keywords: '接案项目, 远程工作, 网站开发工作, 设计项目, 写作工作, 营销项目, 自由工作, 项目市场',
    type: 'website',
  },
  zh: {
    title: '瀏覽專案 - CaseWHR',
    description: '探索數千個接案專案。',
    keywords: '接案專案, 遠距工作',
    type: 'website',
  },
};

// Dashboard SEO
const dashboardSEO: Record<Language, PageSEO> = {
  en: {
    title: 'Dashboard - Manage Your CaseWHR Account',
    description: 'Access your CaseWHR dashboard to manage projects, proposals, contracts, invoices, and wallet. Track your freelance work and earnings.',
    keywords: 'dashboard, account management, project management, freelance dashboard, wallet, invoices',
    type: 'website',
    noindex: true, // 需要登入的頁面不索引
  },
  'zh-TW': {
    title: '控制台 - 管理您的 CaseWHR 帳戶',
    description: '訪問您的 CaseWHR 控制台，管理專案、提案、合約、發票和錢包。追蹤您的接案工作與收入。',
    keywords: '控制台, 帳戶管理, 專案管理, 接案控制台, 錢包, 發票',
    type: 'website',
    noindex: true,
  },
  'zh-CN': {
    title: '控制台 - 管理您的 CaseWHR 账户',
    description: '访问您的 CaseWHR 控制台，管理项目、提案、合约、发票和钱包。追踪您的接案工作与收入。',
    keywords: '控制台, 账户管理, 项目管理, 接案控制台, 钱包, 发票',
    type: 'website',
    noindex: true,
  },
  zh: {
    title: '控制台 - CaseWHR',
    description: '管理您的帳戶。',
    keywords: '控制台',
    type: 'website',
    noindex: true,
  },
};

// 服務條款 SEO
const termsSEO: Record<Language, PageSEO> = {
  en: {
    title: 'Terms of Service - CaseWHR Legal Agreement',
    description: 'Read CaseWHR\'s Terms of Service. Understand the rules, regulations, and legal agreements for using our freelancing platform.',
    keywords: 'terms of service, legal agreement, user agreement, platform rules, terms and conditions',
    type: 'website',
  },
  'zh-TW': {
    title: '服務條款 - CaseWHR 法律協議',
    description: '閱讀 CaseWHR 的服務條款。了解使用我們接案平台的規則、規範和法律協議。',
    keywords: '服務條款, 法律協議, 用戶協議, 平台規則, 使用條款',
    type: 'website',
  },
  'zh-CN': {
    title: '服务条款 - CaseWHR 法律协议',
    description: '阅读 CaseWHR 的服务条款。了解使用我们接案平台的规则、规范和法律协议。',
    keywords: '服务条款, 法律协议, 用户协议, 平台规则, 使用条款',
    type: 'website',
  },
  zh: {
    title: '服務條款 - CaseWHR',
    description: '閱讀我們的服務條款。',
    keywords: '服務條款',
    type: 'website',
  },
};

// 隱私政策 SEO
const privacySEO: Record<Language, PageSEO> = {
  en: {
    title: 'Privacy Policy - CaseWHR Data Protection',
    description: 'Learn how CaseWHR protects your personal data and privacy. Read our comprehensive privacy policy and data handling practices.',
    keywords: 'privacy policy, data protection, personal data, GDPR, data security, privacy rights',
    type: 'website',
  },
  'zh-TW': {
    title: '隱私政策 - CaseWHR 資料保護',
    description: '了解 CaseWHR 如何保護您的個人資料與隱私。閱讀我們完整的隱私政策與資料處理方式。',
    keywords: '隱私政策, 資料保護, 個人資料, GDPR, 資料安全, 隱私權',
    type: 'website',
  },
  'zh-CN': {
    title: '隐私政策 - CaseWHR 数据保护',
    description: '了解 CaseWHR 如何保护您的个人数据与隐私。阅读我们完整的隐私政策与数据处理方式。',
    keywords: '隐私政策, 数据保护, 个人数据, GDPR, 数据安全, 隐私权',
    type: 'website',
  },
  zh: {
    title: '隱私政策 - CaseWHR',
    description: '了解我們的隱私政策。',
    keywords: '隱私政策',
    type: 'website',
  },
};

// 管理後台 SEO
const adminSEO: Record<Language, PageSEO> = {
  en: {
    title: 'Admin Dashboard - CaseWHR Management',
    description: 'CaseWHR admin dashboard for platform management and monitoring.',
    keywords: 'admin, dashboard, management, platform admin',
    type: 'website',
    noindex: true, // 管理員頁面不索引
  },
  'zh-TW': {
    title: '管理後台 - CaseWHR 平台管理',
    description: 'CaseWHR 管理後台，用於平台管理與監控。',
    keywords: '管理後台, 控制台, 平台管理',
    type: 'website',
    noindex: true,
  },
  'zh-CN': {
    title: '管理后台 - CaseWHR 平台管理',
    description: 'CaseWHR 管理后台，用于平台管理与监控。',
    keywords: '管理后台, 控制台, 平台管理',
    type: 'website',
    noindex: true,
  },
  zh: {
    title: '管理後台 - CaseWHR',
    description: 'CaseWHR 平台管理。',
    keywords: '管理後台',
    type: 'website',
    noindex: true,
  },
};

// AI SEO 管理器 SEO
const aiSeoSEO: Record<Language, PageSEO> = {
  en: {
    title: 'AI SEO Manager - CaseWHR Content Optimization',
    description: 'AI-powered SEO management tool for CaseWHR platform. Analyze, optimize, and improve your content with intelligent SEO recommendations.',
    keywords: 'AI SEO, SEO optimization, content optimization, SEO analysis, AI tools, SEO manager',
    type: 'website',
    noindex: true, // AI SEO 工具頁面不索引
  },
  'zh-TW': {
    title: 'AI SEO 管理器 - CaseWHR 內容優化工具',
    description: 'CaseWHR 平台的 AI 驅動 SEO 管理工具。使用智能 SEO 建議來分析、優化和改善您的內容。',
    keywords: 'AI SEO, SEO 優化, 內容優化, SEO 分析, AI 工具, SEO 管理器',
    type: 'website',
    noindex: true,
  },
  'zh-CN': {
    title: 'AI SEO 管理器 - CaseWHR 内容优化工具',
    description: 'CaseWHR 平台的 AI 驱动 SEO 管理工具。使用智能 SEO 建议来分析、优化和改善您的内容。',
    keywords: 'AI SEO, SEO 优化, 内容优化, SEO 分析, AI 工具, SEO 管理器',
    type: 'website',
    noindex: true,
  },
  zh: {
    title: 'AI SEO 管理器 - CaseWHR',
    description: 'AI SEO 內容優化工具。',
    keywords: 'AI SEO',
    type: 'website',
    noindex: true,
  },
};

// 頁面 SEO 映射
const pageSEOMap: Record<string, Record<Language, PageSEO>> = {
  home: homeSEO,
  about: aboutSEO,
  pricing: pricingSEO,
  projects: projectsSEO,
  dashboard: dashboardSEO,
  'terms-of-service': termsSEO,
  'privacy-policy': privacySEO,
  admin: adminSEO,
  'ai-seo': aiSeoSEO,
};

/**
 * 獲取特定頁面的 SEO 配置
 */
export function getPageSEO(page: string, language: Language): PageSEO {
  const pageSEO = pageSEOMap[page];
  
  if (!pageSEO) {
    console.warn(`No SEO config found for page: ${page}`);
    return homeSEO[language] || homeSEO['zh-TW'];
  }
  
  return pageSEO[language] || pageSEO['zh-TW'];
}

/**
 * 生成動態專案 SEO
 */
export function getProjectSEO(
  projectTitle: string,
  projectDescription: string,
  language: Language
): PageSEO {
  return {
    title: `${projectTitle} - CaseWHR 專案`,
    description: projectDescription.substring(0, 160),
    keywords: '接案專案, 自由工作, 專案外包',
    type: 'article',
  };
}

/**
 * 生成動態人才 SEO
 */
export function getFreelancerSEO(
  freelancerName: string,
  freelancerSkills: string,
  language: Language
): PageSEO {
  return {
    title: `${freelancerName} - 專業自由工作者 | CaseWHR`,
    description: `查看 ${freelancerName} 的專業技能：${freelancerSkills}`,
    keywords: `${freelancerSkills}, 自由工作者, 專業人才`,
    type: 'profile',
  };
}