import { useLanguage } from '../lib/LanguageContext';
import { useView } from '../contexts/ViewContext';
import { Shield, Lock, Eye, Database, Mail, UserCheck, FileText, AlertCircle } from 'lucide-react';

export function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const { setView } = useView();

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: December 16, 2024',
      intro: 'At Case Where, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.',
      
      section1Title: '1. Information We Collect',
      section1Subtitle: 'Personal Information',
      section1Content: 'We collect information that you provide directly to us, including:',
      section1Items: [
        'Name, email address, and contact information',
        'Professional profile information and skills',
        'Payment and billing information',
        'Communications with other users and support',
        'Portfolio and work samples you upload'
      ],
      
      section2Title: '2. How We Use Your Information',
      section2Content: 'We use the information we collect to:',
      section2Items: [
        'Provide, maintain, and improve our services',
        'Process transactions and send related information',
        'Send administrative information and updates',
        'Respond to your comments and questions',
        'Detect, prevent, and address fraud and security issues',
        'Personalize your experience on our platform'
      ],
      
      section3Title: '3. Information Sharing',
      section3Content: 'We may share your information in the following circumstances:',
      section3Items: [
        'With your consent or at your direction',
        'With service providers who perform services on our behalf',
        'To comply with legal obligations',
        'To protect our rights and prevent fraud',
        'In connection with a business transfer or acquisition'
      ],
      
      section4Title: '4. Data Security',
      section4Content: 'We implement appropriate technical and organizational measures to protect your personal information, including:',
      section4Items: [
        'Encryption of data in transit and at rest',
        'Regular security audits and assessments',
        'Access controls and authentication',
        'Secure payment processing through trusted providers',
        'Regular backups and disaster recovery procedures'
      ],
      
      section5Title: '5. Your Rights',
      section5Content: 'You have the right to:',
      section5Items: [
        'Access and receive a copy of your personal data',
        'Correct inaccurate or incomplete data',
        'Request deletion of your data',
        'Object to or restrict processing of your data',
        'Data portability',
        'Withdraw consent at any time'
      ],
      
      section6Title: '6. Cookies and Tracking',
      section6Content: 'We use cookies and similar tracking technologies to:',
      section6Items: [
        'Remember your preferences and settings',
        'Understand how you use our platform',
        'Improve our services and user experience',
        'Provide targeted marketing (with your consent)'
      ],
      
      section7Title: '7. International Data Transfers',
      section7Content: 'Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data.',
      
      section8Title: '8. Children\'s Privacy',
      section8Content: 'Our platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children.',
      
      section9Title: '9. Changes to This Policy',
      section9Content: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.',
      
      section10Title: '10. 聯繫我們',
      section10Content: '如果您對本隱私政策有任何疑問，請通過以下方式��繫我：',
      contactEmail: '電子郵件：support@casewhr.com',
      contactAddress: '地址：Case Where 接得準股份有限公司，台灣台北',
      
      backToHome: 'Back to Home'
    },
    'zh-TW': {
      title: '隱私政策',
      lastUpdated: '最後更新：2024年12月16日',
      intro: '在 Case Where 接得準，我們非常重視您的隱私。本隱私政策說明我們如何收集、使用、披露和保護您在使用我們平台時的信息。',
      
      section1Title: '1. 我們收集的信息',
      section1Subtitle: '個人信息',
      section1Content: '我們收集您直接提供給我們的信息，包括：',
      section1Items: [
        '姓名、電子郵件地址和聯繫信息',
        '專業個人資料信息和技能',
        '支付和帳單信息',
        '與其他用戶和客服的通信',
        '您上傳的作品集和工作樣本'
      ],
      
      section2Title: '2. 我們如何使用您的信息',
      section2Content: '我們使用收集的信息來：',
      section2Items: [
        '提供、維護和改進我們的服務',
        '處理交易並發送相關信息',
        '發送管理信息和更新',
        '回應您的評論和問題',
        '檢測、預防和處理欺詐和安全問題',
        '個性化您在我們平台上的體驗'
      ],
      
      section3Title: '3. 信息共享',
      section3Content: '我們可能在以下情況下共享您的信息：',
      section3Items: [
        '經您同意或按您的指示',
        '與代表我們提供服務的服務提供商',
        '遵守法律義務',
        '保護我們的權利並防止欺詐',
        '與業務轉讓或收購相關'
      ],
      
      section4Title: '4. 數據安全',
      section4Content: '我們實施適當的技術和組織措施來保護您的個人信息，包括：',
      section4Items: [
        '傳輸和靜態數據的加密',
        '定期安全審計和評估',
        '訪問控制和身份驗證',
        '通過可信提供商進行安全支付處理',
        '定期備份和災難恢復程序'
      ],
      
      section5Title: '5. 您的權利',
      section5Content: '您有權：',
      section5Items: [
        '訪問並接收您的個人數據副本',
        '更正不準確或不完整的數據',
        '請求刪除您的數據',
        '反對或限制處理您的數據',
        '數據可攜性',
        '隨時撤回同意'
      ],
      
      section6Title: '6. Cookies 和追蹤',
      section6Content: '我們使用 cookies 和類似的追蹤技術來：',
      section6Items: [
        '記住您的偏好和設置',
        '了解您如何使用我們的平台',
        '改進我們的服務和用戶體驗',
        '提供定向營銷（經您同意）'
      ],
      
      section7Title: '7. 國際數據傳輸',
      section7Content: '您的信息可能會被傳輸到您所在國家以外的國家並在那裡處理。我們確保採取適當的保障措施來保護您的數據。',
      
      section8Title: '8. 兒童隱私',
      section8Content: '我們的平台不適用於18歲以下的用戶。我們不會故意收集兒童的個人信息。',
      
      section9Title: '9. 本政策的變更',
      section9Content: '我們可能會不時更新本隱私政策。我們將通過在本頁面上發布新政策並更新「最後更新」日期來通知您任何變更。',
      
      section10Title: '10. 聯繫我們',
      section10Content: '如果您對本隱私政策有任何疑問，請通過以下方式聯繫我們：',
      contactEmail: '電子郵件：support@casewhr.com',
      contactAddress: '地址：Case Where 接得準股份有限公司，台灣台北',
      
      backToHome: '返回首頁'
    },
    'zh-CN': {
      title: '隐私政策',
      lastUpdated: '最后更新：2024年12月16日',
      intro: '在 Case Where 接得准，我们非常重视您的隐私。本隐私政策说明我们如何收集、使用、披露和保护您在使用我们平台时的信息。',
      
      section1Title: '1. 我们收集的信息',
      section1Subtitle: '个人信息',
      section1Content: '我们收集您直接提供给我们的信息，包括：',
      section1Items: [
        '姓名、电子邮件地址和联系信息',
        '专业个人资料信息和技能',
        '支付和账单信息',
        '与其他用户和客服的通信',
        '您上传的作品集和工作样本'
      ],
      
      section2Title: '2. 我们如何使用您的信息',
      section2Content: '我们使用收集的信息来：',
      section2Items: [
        '提供、维护和改进我们的服务',
        '处理交易并发送相关信息',
        '发送管理信息和更新',
        '回应您的评论和问题',
        '检测、预防和处理欺诈和安全问题',
        '个性化您在我们平台上的体验'
      ],
      
      section3Title: '3. 信息共享',
      section3Content: '我们可能在以下情况下共享您的信息：',
      section3Items: [
        '经您同意或按您的指示',
        '与代表我们提供服务的服务提供商',
        '遵守法律义务',
        '保护我们的权利并防止欺诈',
        '与业务转让或收购相关'
      ],
      
      section4Title: '4. 数据安全',
      section4Content: '我们实施适当的技术和组织措施来保护您的个人信息，包括：',
      section4Items: [
        '传输和静态数据的加密',
        '定期安全审计和评估',
        '访问控制和身份验证',
        '通过可信提供商进行安全支付处理',
        '定期备份和灾难恢复程序'
      ],
      
      section5Title: '5. 您的权利',
      section5Content: '您有权：',
      section5Items: [
        '访问并接收您的个人数据副本',
        '更正不准确或不完整的数据',
        '请求删除您的数据',
        '反对或限制处理您的数据',
        '数据可携性',
        '随时撤回同意'
      ],
      
      section6Title: '6. Cookies 和追踪',
      section6Content: '我们使用 cookies 和类似的追踪技术来：',
      section6Items: [
        '记住您的偏好和设置',
        '了解您如何使用我们的平台',
        '改进我们的服务和用户体验',
        '提供定向营销（经您同意）'
      ],
      
      section7Title: '7. 国际数据传输',
      section7Content: '您的信息可能会被传输到您所在国家以外的国家并在那里处理。我们确保采取适当的保障措施来保护您的数据。',
      
      section8Title: '8. 儿童隐私',
      section8Content: '我们的平台不适用于18岁以下的用户。我们不会故意收集儿童的个人信息。',
      
      section9Title: '9. 本政策的变更',
      section9Content: '我们可能会不时更新本隐私政策。我们将通过在本页面上发布新政策并更新「最后更新」日期来通知您任何变更。',
      
      section10Title: '10. 联系我们',
      section10Content: '如果您对本隐私政策有任何疑问，请通过以下方式联系我们：',
      contactEmail: '电子邮件：support@casewhr.com',
      contactAddress: '地址：Case Where 接得准股份有限公司，台湾台北',
      
      backToHome: '返回首页'
    }
  };

  // ⭐ 兼容舊的 'zh' 語言代碼（映射到繁體中文）
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-12 h-12" />
            <h1 className="text-4xl">{t.title}</h1>
          </div>
          <p className="text-blue-100 text-sm">{t.lastUpdated}</p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <p className="text-gray-700 leading-relaxed">{t.intro}</p>
        </div>

        {/* Section 1 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Database className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-2">{t.section1Title}</h2>
              <h3 className="text-lg text-gray-700 mb-3">{t.section1Subtitle}</h3>
              <p className="text-gray-600 mb-4">{t.section1Content}</p>
              <ul className="space-y-2">
                {t.section1Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-1">•</span>
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
            <Eye className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-2">{t.section2Title}</h2>
              <p className="text-gray-600 mb-4">{t.section2Content}</p>
              <ul className="space-y-2">
                {t.section2Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <UserCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-2">{t.section3Title}</h2>
              <p className="text-gray-600 mb-4">{t.section3Content}</p>
              <ul className="space-y-2">
                {t.section3Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-2">{t.section4Title}</h2>
              <p className="text-gray-600 mb-4">{t.section4Content}</p>
              <ul className="space-y-2">
                {t.section4Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 5 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-2">{t.section5Title}</h2>
              <p className="text-gray-600 mb-4">{t.section5Content}</p>
              <ul className="space-y-2">
                {t.section5Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 6 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-2">{t.section6Title}</h2>
              <p className="text-gray-600 mb-4">{t.section6Content}</p>
              <ul className="space-y-2">
                {t.section6Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sections 7-9 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-2xl text-gray-900 mb-4">{t.section7Title}</h2>
          <p className="text-gray-700 mb-6">{t.section7Content}</p>
          
          <h2 className="text-2xl text-gray-900 mb-4">{t.section8Title}</h2>
          <p className="text-gray-700 mb-6">{t.section8Content}</p>
          
          <h2 className="text-2xl text-gray-900 mb-4">{t.section9Title}</h2>
          <p className="text-gray-700">{t.section9Content}</p>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-3">{t.section10Title}</h2>
              <p className="text-gray-700 mb-4">{t.section10Content}</p>
              <div className="space-y-2">
                <p className="text-gray-700">{t.contactEmail}</p>
                <p className="text-gray-700">{t.contactAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={handleBackToHome}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            {t.backToHome}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;