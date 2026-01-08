import { useLanguage } from "../lib/LanguageContext";
import { useView } from "../contexts/ViewContext";
import { FileText, Scale, Shield, AlertCircle } from "lucide-react";

export function TermsOfServicePage() {
  const { language } = useLanguage();
  const { setView } = useView();

  const translations = {
    en: {
      title: "Terms of Service",
      lastUpdated: "Last Updated: December 16, 2024",
      intro: "Welcome to Case Where (casewhr.com). These Terms of Service ('Terms') govern your use of our platform and services. By accessing or using Case Where, you agree to be bound by these Terms.",
      
      sections: [
        {
          title: "1. Service Description",
          icon: FileText,
          content: [
            "Case Where is a global freelancing platform that connects businesses with professional service providers.",
            "Our platform offers subscription-based services with three tiers: Basic (Free), Professional, and Enterprise.",
            "We provide tri-currency support (TWD/USD/CNY) with real-time exchange rate conversion.",
            "Payment processing is facilitated through PayPal and ECPay (Taiwan)."
          ]
        },
        {
          title: "2. Account Registration and Eligibility",
          icon: Shield,
          content: [
            "You must be at least 18 years old to use our services.",
            "You must provide accurate, current, and complete information during registration.",
            "You are responsible for maintaining the confidentiality of your account credentials.",
            "You agree to notify us immediately of any unauthorized access to your account.",
            "One person or entity may only maintain one active account."
          ]
        },
        {
          title: "3. Subscription Plans and Payment Terms",
          icon: Scale,
          content: [
            "<strong>Basic Plan (Free):</strong> Limited to 3 project posts per month with basic features.",
            "<strong>Professional Plan:</strong> Monthly or annual subscription with unlimited project posts and enhanced features.",
            "<strong>Enterprise Plan:</strong> Custom pricing with dedicated support and team collaboration features.",
            "All subscription fees are non-refundable unless otherwise stated.",
            "Prices are subject to change with 30 days' advance notice.",
            "Payment processing fees may apply depending on the payment method selected.",
            "Subscriptions automatically renew unless canceled before the renewal date."
          ]
        },
        {
          title: "4. User Responsibilities",
          icon: AlertCircle,
          content: [
            "You must comply with all applicable laws and regulations when using our platform.",
            "You are solely responsible for the content you post, including project descriptions and proposals.",
            "You must not post fraudulent, misleading, or illegal content.",
            "You must not harass, threaten, or abuse other users.",
            "You must not attempt to circumvent our payment system to avoid fees.",
            "You must not scrape, data mine, or use automated tools to access our platform without permission.",
            "Freelancers must deliver services as described and agreed upon with clients.",
            "Clients must provide clear project requirements and timely feedback."
          ]
        },
        {
          title: "5. Intellectual Property Rights",
          icon: FileText,
          content: [
            "Case Where retains all rights to our platform, including our logo, design, and software.",
            "Users retain ownership of their original content posted on the platform.",
            "By posting content, you grant Case Where a worldwide, non-exclusive license to display, distribute, and promote your content on our platform.",
            "Intellectual property rights for work delivered through projects are governed by agreements between clients and freelancers.",
            "You must not use our trademarks or branding without explicit written permission."
          ]
        },
        {
          title: "6. Privacy and Data Protection",
          icon: Shield,
          content: [
            "Your use of Case Where is also governed by our Privacy Policy.",
            "We collect and process personal data in accordance with applicable data protection laws.",
            "We implement industry-standard security measures to protect your data.",
            "We do not sell your personal information to third parties.",
            "You have the right to access, correct, or delete your personal data.",
            "For detailed information, please review our Privacy Policy."
          ]
        },
        {
          title: "7. Limitation of Liability",
          icon: AlertCircle,
          content: [
            "Case Where acts as an intermediary platform connecting clients and freelancers.",
            "We do not guarantee the quality, accuracy, or legality of user-generated content or services.",
            "We are not responsible for disputes between users.",
            "To the maximum extent permitted by law, Case Where shall not be liable for any indirect, incidental, special, or consequential damages.",
            "Our total liability shall not exceed the amount you paid to Case Where in the 12 months preceding the claim.",
            "We do not warrant that our platform will be uninterrupted, secure, or error-free."
          ]
        },
        {
          title: "8. Prohibited Activities",
          icon: AlertCircle,
          content: [
            "Posting false, misleading, or fraudulent information.",
            "Impersonating another person or entity.",
            "Engaging in money laundering or other illegal financial activities.",
            "Soliciting users to conduct transactions outside the platform.",
            "Posting content that infringes on intellectual property rights.",
            "Distributing malware, viruses, or harmful code.",
            "Attempting to gain unauthorized access to our systems.",
            "Using the platform for any unlawful purpose."
          ]
        },
        {
          title: "9. Account Suspension and Termination",
          icon: Shield,
          content: [
            "We reserve the right to suspend or terminate accounts that violate these Terms.",
            "You may terminate your account at any time through your account settings.",
            "Upon termination, you will lose access to your account and associated data.",
            "Outstanding payments must be settled before account closure.",
            "We may retain certain data as required by law or for legitimate business purposes.",
            "Termination does not relieve you of obligations incurred before termination."
          ]
        },
        {
          title: "10. Dispute Resolution",
          icon: Scale,
          content: [
            "Any disputes arising from these Terms shall first be resolved through good-faith negotiation.",
            "If negotiation fails, disputes shall be resolved through arbitration in accordance with the laws of the Republic of China (Taiwan).",
            "The arbitration shall be conducted in Taipei, Taiwan.",
            "The language of arbitration shall be English or Chinese as agreed by the parties.",
            "You agree to waive any right to a jury trial.",
            "These Terms shall be governed by and construed in accordance with the laws of Taiwan."
          ]
        },
        {
          title: "11. Modifications to Terms",
          icon: FileText,
          content: [
            "我們保留隨時修改這些條款的權利。",
            "重大變更將至少提前 30 天通過電子郵件或平台公告通知使用者。",
            "變更後繼續使用平台即表示接受修改後的條款。",
            "如果您不同意變更，您必須停止使用我們的服務並關閉您的帳戶。"
          ]
        },
        {
          title: "12. Third-Party Services",
          icon: AlertCircle,
          content: [
            "Our platform integrates third-party payment processors (PayPal, ECPay).",
            "Use of third-party services is subject to their respective terms and policies.",
            "We are not responsible for the actions or policies of third-party service providers.",
            "Exchange rate data is provided by third-party sources and may have delays or inaccuracies."
          ]
        },
        {
          title: "13. Force Majeure",
          icon: Shield,
          content: [
            "We shall not be liable for any failure to perform our obligations due to circumstances beyond our reasonable control.",
            "This includes natural disasters, war, terrorism, labor disputes, government actions, or technical failures.",
            "In such events, our obligations will be suspended for the duration of the force majeure event."
          ]
        },
        {
          title: "14. Severability",
          icon: Scale,
          content: [
            "If any provision of these Terms is found to be unenforceable or invalid, that provision shall be modified to reflect the parties' intention.",
            "All other provisions of these Terms shall remain in full force and effect."
          ]
        },
        {
          title: "15. Contact Information",
          icon: FileText,
          content: [
            "For questions about these Terms of Service, please contact us:",
            "<strong>Email:</strong> support@casewhr.com",
            "<strong>Response Time:</strong> We aim to respond to all inquiries within 2 business days."
          ]
        }
      ],
      
      acceptance: {
        title: "Acceptance of Terms",
        content: "By creating an account or using Case Where, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these Terms, you must not use our platform."
      }
    },
    'zh-TW': {
      title: "服務條款",
      lastUpdated: "最後更新：2024年12月16日",
      intro: "歡迎使用 Case Where（casewhr.com）。本服務條款（「條款」）規範您對我們平台和服務的使用。訪問或使用 Case Where 即表示您同意受這些條款的約束。",
      
      sections: [
        {
          title: "1. 服務說明",
          icon: FileText,
          content: [
            "Case Where 是一個全球接案平台，連接企業與專業服務提供者。",
            "我們的平台提供三種訂閱服務：基本版（免費）、專業版和企業版。",
            "我們提供三幣計價支援（TWD/USD/CNY）與即時匯率轉換。",
            "支付處理透過 PayPal、綠界科技（台灣）進行。"
          ]
        },
        {
          title: "2. 帳戶註冊與資格",
          icon: Shield,
          content: [
            "您必須年滿 18 歲才能使用我們的服務。",
            "您必須在註冊時提供準確、最新且完整的資訊。",
            "您有責任維護帳戶憑證的機密性。",
            "您同意在發現任何未經授權的帳戶訪問時立即通知我們。",
            "每個人或實體只能維持一個有效帳戶。"
          ]
        },
        {
          title: "3. 訂閱方案與付款條款",
          icon: Scale,
          content: [
            "<strong>基本版（免費）：</strong>每月限制發布 3 個專案，提供基本功能。",
            "<strong>專業版：</strong>月付或年付訂閱，無限專案發布與增強功能。",
            "<strong>企業版：</strong>客製化定價，提供專屬支援與團隊協作功能。",
            "所有訂閱費用除非另有說明，否則不予退款。",
            "價格可能變動，將提前 30 天通知。",
            "根據所選支付方式，可能會產生支付處理費用。",
            "訂閱將自動續約，除非在續約日期前取消。"
          ]
        },
        {
          title: "4. 使用者責任",
          icon: AlertCircle,
          content: [
            "您在使用我們的平台時必須遵守所有適用的法律法規。",
            "您對所發布的內容（包括專案描述和提案）完全負責。",
            "您不得發布詐騙性、誤導性或非法內容。",
            "您不得騷擾、威脅或辱罵其他使用者。",
            "您不得試圖規避我們的支付系統以避免費用。",
            "未經許可，您不得抓取、數據挖掘或使用自動化工具訪問我們的平台。",
            "接案者必須按照與客戶約定的描述交付服務。",
            "客戶必須提供清晰的專案需求和及時的反饋。"
          ]
        },
        {
          title: "5. 智慧財產權",
          icon: FileText,
          content: [
            "Case Where 保留我們平台的所有權利，包括我們的 Logo、設計和軟體。",
            "使用者保留其在平台上發布的原創內容的所有權。",
            "透過發布內容，您授予 Case Where 在我們平台上展示、分發和推廣您內容的全球非獨占許可。",
            "透過專案交付的作品的智慧財產權由客戶與接案者之間的協議規範。",
            "未經明確書面許可，您不得使用我們的商標或品牌。"
          ]
        },
        {
          title: "6. 隱私與數據保護",
          icon: Shield,
          content: [
            "您對 Case Where 的使用也受我們隱私政策的約束。",
            "我們根據適用的數據保護法收集和處理個人數據。",
            "我們實施業界標準的安全措施來保護您的數據。",
            "我們不會向第三方出售您的個人資訊。",
            "您有權訪問、更正或刪除您的個人數據。",
            "詳細資訊請參閱我們的隱私政策。"
          ]
        },
        {
          title: "7. 責任限制",
          icon: AlertCircle,
          content: [
            "Case Where 作為連接客戶和接案者的中介平台。",
            "我們不保證使用者生成內容或服務的質量、準確性或合法性。",
            "我們不对使用者之間的糾紛負責。",
            "在法律允許的最大範圍內，Case Where 不對任何間接、附帶、特殊或後果性損害負責。",
            "我們的總責任不超過您在提出索賠前 12 個月內向 Case Where 支付的金額。",
            "我們不保證我們的平台將不間斷、安全或無錯誤。"
          ]
        },
        {
          title: "8. 禁止活動",
          icon: AlertCircle,
          content: [
            "發布虛假、誤導性或詐騙性資訊。",
            "冒充他人或實體。",
            "從事洗錢或其他非法金融活動。",
            "招攬使用者在平台外進行交易。",
            "發布侵犯智慧財產權的內容。",
            "傳播惡意軟體、病毒或有害代碼。",
            "試圖未經授權訪問我們的系統。",
            "將平台用於任何非法目的。"
          ]
        },
        {
          title: "9. 帳戶暫停與終止",
          icon: Shield,
          content: [
            "我們保留暫停或終止違反這些條款的帳戶的權利。",
            "您可以隨時通過帳戶設定終止您的帳戶。",
            "終止後，您將失去對帳戶和相關數據的訪問權限。",
            "未結清的款項必須在帳戶關閉前結清。",
            "我們可能會根據法律要求或合法商業目的保留某些數據。",
            "終止不會免除您在終止前產生的義務。"
          ]
        },
        {
          title: "10. 爭議解決",
          icon: Scale,
          content: [
            "因這些條款產生的任何爭議應首先通過誠信協商解決。",
            "如果協商失敗，爭議應根據中華民國（台灣）法律通過仲裁解決。",
            "仲裁應在台灣台北進行。",
            "仲裁語言應為雙方同意的英文或中文。",
            "您同意放棄任何陪審團審判的權利。",
            "這些條款應受台灣法律管轄並依其解釋。"
          ]
        },
        {
          title: "11. 條款修改",
          icon: FileText,
          content: [
            "我們保留隨時修改這些條款的權利。",
            "重大變更將至少提前 30 天通過電子郵件或平台公告通知使用者。",
            "變更後繼續使用平台即表示接受修改後的條款。",
            "如果您不同意變更，您必須停止使用我們的服務並關閉您的帳戶。"
          ]
        },
        {
          title: "12. 第三方服務",
          icon: AlertCircle,
          content: [
            "我們的平台整合了第三方支付處理商（PayPal、綠界科技）。",
            "使用第三方服務受其各自條款和政策的約束。",
            "我們不對第三方服務提供商的行為或政策負責。",
            "匯率數據由第三方來源提供，可能存在延遲或不準確。"
          ]
        },
        {
          title: "13. 不可抗力",
          icon: Shield,
          content: [
            "對於因超出我們合理控制範圍的情況而未能履行義務，我們不承擔責任。",
            "這包括自然災害、戰爭、恐怖主義、勞資糾紛、政府行為或技術故障。",
            "在此類事件中，我們的義務將在不可抗力事件期間暫停。"
          ]
        },
        {
          title: "14. 可分割性",
          icon: Scale,
          content: [
            "如果這些條款的任何條款被認定為不可執行或無效，該條款將被修改以反映雙方的意圖。",
            "這些條款的所有其他條款將繼續完全有效。"
          ]
        },
        {
          title: "15. 聯絡資訊",
          icon: FileText,
          content: [
            "有關這些服務條款的問題，請聯絡我們：",
            "<strong>電子郵件：</strong>support@casewhr.com",
            "<strong>回應時間：</strong>我們致力於在 2 個工作日內回覆所有詢問。"
          ]
        }
      ],
      
      acceptance: {
        title: "條款接受",
        content: "透過創建帳戶或使用 Case Where，您確認已閱讀、理解並同意受本服務條款的約束。如果您不同意這些條款，您不得使用我們的平台。"
      }
    },
    'zh-CN': {
      title: "服务条款",
      lastUpdated: "最后更新：2024年12月16日",
      intro: "欢迎使用 Case Where（casewhr.com）。本服务条款（「条款」）规范您对我们平台和服务的使用。访问或使用 Case Where 即表示您同意受这些条款的约束。",
      
      sections: [
        {
          title: "1. 服务说明",
          icon: FileText,
          content: [
            "Case Where 是一个全球接案平台，连接企业与专业服务提供者。",
            "我们的平台提供三种订阅服务：基本版（免费）、专业版和企业版。",
            "我们提供三币计价支持（TWD/USD/CNY）与实时汇率转换。",
            "支付处理通过 PayPal、绿界科技（台湾）进行。"
          ]
        },
        {
          title: "2. 账户注册与资格",
          icon: Shield,
          content: [
            "您必须年满 18 岁才能使用我们的服务。",
            "您必须在注册时提供准确、最新且完整的信息。",
            "您有责任维护账户凭证的机密性。",
            "您同意在发现任何未经授权的账户访问时立即通知我们。",
            "每个人或实体只能维持一个有效账户。"
          ]
        },
        {
          title: "3. 订阅方案与付款条款",
          icon: Scale,
          content: [
            "<strong>基本版（免费）：</strong>每月限制发布 3 个项目，提供基本功能。",
            "<strong>专业版：</strong>月付或年付订阅，无限项目发布与增强功能。",
            "<strong>企业版：</strong>定制化定价，提供专属支持与团队协作功能。",
            "所有订阅费用除非另有说明，否则不予退款。",
            "价格可能变动，将提前 30 天通知。",
            "根据所选支付方式，可能会产生支付处理费用。",
            "订阅将自动续约，除非在续约日期前取消。"
          ]
        },
        {
          title: "4. 用户责任",
          icon: AlertCircle,
          content: [
            "您在使用我们的平台时必须遵守所有适用的法律法规。",
            "您对所发布的内容（包括项目描述和提案）完负责。",
            "您不得发布诈骗性、误导性或非法内容。",
            "您不得骚扰、威胁或辱骂其他用户。",
            "您不得试图规避我们的支付系统以避免费用。",
            "未经许可，您不得抓取、数据挖掘或使用自动化工具访问我们的平台。",
            "接案者必须按照与客户约定的描述交付服务。",
            "客户必须提供清晰的项目需求和及时的反馈。"
          ]
        },
        {
          title: "5. 知识产权",
          icon: FileText,
          content: [
            "Case Where 保留我们平台的所有权利，包括我们的 Logo、设计和软件。",
            "用户保留其在平台上发布的原创内容的所有权。",
            "通过发布内容，您授予 Case Where 在我们平台上展示、分发和推广您内容的全球非独占许可。",
            "通过项目交付的作品的知识产权由客户与接案者之间的协议规范。",
            "未经明确书面许可，您不得使用我们的商标或品牌。"
          ]
        },
        {
          title: "6. 隐私与数据保护",
          icon: Shield,
          content: [
            "您对 Case Where 的使用也受我们隐私政策的约束。",
            "我们根据适用的数据保护法收集和处理个人数据。",
            "我们实施业界标准的安全措施来保护您的数据。",
            "我们不会向第三方出售您的个人信息。",
            "您有权访问、更正或删除您的个人数据。",
            "详细信息请参阅我们的隐私政策。"
          ]
        },
        {
          title: "7. 责任限制",
          icon: AlertCircle,
          content: [
            "Case Where 作为连接客户和接案者的中介平台。",
            "我们不保证用户生成内容或服务的质量、准确性或合法性。",
            "我们不对用户之间的纠纷负责。",
            "在法律允许的最大范围内，Case Where 不对任何间接、附带、特殊或后果性损害负责。",
            "我们的总责任不超过您在提出索赔前 12 个月内向 Case Where 支付的金额。",
            "我们不保证我们的平台将不间断、安全或无错误。"
          ]
        },
        {
          title: "8. 禁止活动",
          icon: AlertCircle,
          content: [
            "发布虚假、误导性或诈骗性信息。",
            "冒充他人或实体。",
            "从事洗钱或其他非法金融活动。",
            "招揽用户在平台外进行交易。",
            "发布侵犯知识产权的内容。",
            "传播恶意软件、病毒或有害代码。",
            "试图未经授权访问我们的系统。",
            "将平台用于任何非法目的。"
          ]
        },
        {
          title: "9. 账户暂停与终止",
          icon: Shield,
          content: [
            "我们保留暂停或终止违反这些条款的账户的权利。",
            "您可以随时通过账户设置终止您的账户。",
            "终止后，您将失去对账户和相关数据的访问权限。",
            "未结清的款项必须在账户关闭前结清。",
            "我们可能会根据法律要求或合法商业目的保留某些数据。",
            "终止不会免除您在终止前产生的义务。"
          ]
        },
        {
          title: "10. 争议解决",
          icon: Scale,
          content: [
            "因这些条款产生的任何争议应首先通过诚信协商解决。",
            "如果协商失败，争议应根据中华民国（台湾）法律通过仲裁解决。",
            "仲裁应在台湾台北进行。",
            "仲裁语言应为双方同意的英文或中文。",
            "您同意放弃任何陪审团审判的权利。",
            "这些条款应受台湾法律管辖并依其解释。"
          ]
        },
        {
          title: "11. 条款修改",
          icon: FileText,
          content: [
            "我们保留随时修改这些条款的权利。",
            "重大变更将至少提前 30 天通过电子邮件或平台公告通知用户。",
            "变更后继续使用平台即表示接受修改后的条款。",
            "如果您不同意变更，您必须停止使用我们的服务并关闭您的账户。"
          ]
        },
        {
          title: "12. 第三方服务",
          icon: AlertCircle,
          content: [
            "我们的平台整合了第三方支付处理商（PayPal、绿界科技）。",
            "使用第三方服务受其各自条款和政策的约束。",
            "我们不对第三方服务提供商的行为或政策负责。",
            "汇率数据由第三方来源提供，可能存在延迟或不准确。"
          ]
        },
        {
          title: "13. 不可抗力",
          icon: Shield,
          content: [
            "对于因超出我们合理控制范围的情况而未能履行义务，我们不承担责任。",
            "这包括自然灾害、战争、恐怖主义、劳资纠纷、政府行为或技术故障。",
            "在此类事件中，我们的义务将在不可抗力事件期间暂停。"
          ]
        },
        {
          title: "14. 可分割性",
          icon: Scale,
          content: [
            "如果这些条款的任何条款被认定为不可执行或无效，该条款将被修改以反映双方的意图。",
            "这些条款的所有其他条款将继续完全有效。"
          ]
        },
        {
          title: "15. 联系信息",
          icon: FileText,
          content: [
            "有关这些服务条款的问题，请联系我们：",
            "<strong>电子邮件：</strong>support@casewhr.com",
            "<strong>回应时间：</strong>我们致力于在 2 个工作日内回复所有询问。"
          ]
        }
      ],
      
      acceptance: {
        title: "条款接受",
        content: "通过创建账户或使用 Case Where，您确认已阅读、理解并同意受本服务条款的约束。如果您不同意这些条款，您不得使用我们的平台。"
      }
    }
  };

  // ⭐ 支持三语系统（en, zh-TW, zh-CN），兼容舊的 'zh' 語言代碼
  const t = translations[language as keyof typeof translations] || translations['zh-TW'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="h-10 w-10" />
            <h1>{t.title}</h1>
          </div>
          <p className="text-slate-200">{t.lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-12 rounded-r-lg">
          <p className="text-gray-700 leading-relaxed">{t.intro}</p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {t.sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-start gap-3 mb-4">
                  <Icon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <h2 className="text-gray-900">{section.title}</h2>
                </div>
                <div className="space-y-3 pl-9">
                  {section.content.map((item, idx) => (
                    <p 
                      key={idx} 
                      className="text-gray-600 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: item }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Acceptance Notice */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-8">
          <h3 className="mb-4 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            {t.acceptance.title}
          </h3>
          <p className="text-blue-50 leading-relaxed">{t.acceptance.content}</p>
        </div>

        {/* Contact CTA */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setView('home');
              window.location.hash = '';
              window.scrollTo({ top: 0, behavior: 'auto' });
              
              // 使用更長的延遲並多次檢查確保滾動到正確位置
              const scrollToContact = () => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                  const yOffset = -100; // 導航欄高度補償
                  const y = contactSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                  
                  // 額外檢查，確保滾動完成後保持在正確位置
                  setTimeout(() => {
                    const currentY = contactSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    if (Math.abs(window.pageYOffset - currentY) > 50) {
                      window.scrollTo({ top: currentY, behavior: 'smooth' });
                    }
                  }, 1000);
                }
              };
              
              setTimeout(scrollToContact, 1000);
            }}
            className="text-blue-600 hover:text-blue-700 underline transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Have questions? Contact us' : '有疑問？聯絡我們'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsOfServicePage;