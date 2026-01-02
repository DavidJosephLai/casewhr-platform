import { useLanguage } from '../lib/LanguageContext';
import { useView } from '../contexts/ViewContext';
import { AlertTriangle, Scale, FileWarning, ShieldAlert, Info, ExternalLink } from 'lucide-react';

export function DisclaimerPage() {
  const { language } = useLanguage();
  const { setView } = useView();

  const content = {
    en: {
      title: 'Legal Disclaimer',
      lastUpdated: 'Last Updated: December 16, 2024',
      intro: 'This disclaimer governs your use of the Case Where platform. By accessing or using our services, you acknowledge that you have read, understood, and agree to be bound by this disclaimer.',
      
      section1Title: '1. General Information',
      section1Content: 'The information provided on the Case Where platform is for general informational purposes only. While we strive to keep the information up to date and accurate, we make no representations or warranties of any kind, express or implied, about:',
      section1Items: [
        'The completeness, accuracy, reliability, or suitability of the information',
        'The availability or continuity of our services',
        'The quality or capabilities of freelancers listed on our platform',
        'The outcomes of projects or engagements',
        'The accuracy of user-generated content'
      ],
      
      section2Title: '2. No Professional Advice',
      section2Subtitle: 'Not a Substitute for Professional Services',
      section2Content: 'Case Where is a platform connecting clients with freelancers. We do not provide:',
      section2Items: [
        'Legal advice or legal services',
        'Financial advice or investment recommendations',
        'Tax advice or accounting services',
        'Business consulting or strategic advice',
        'Technical or professional certifications'
      ],
      section2Note: 'You should seek appropriate professional advice before making any business, legal, or financial decisions.',
      
      section3Title: '3. User Responsibility',
      section3Content: 'Users are solely responsible for:',
      section3Items: [
        'Evaluating the qualifications and suitability of freelancers',
        'Verifying credentials and references',
        'Negotiating terms and agreements',
        'Ensuring compliance with applicable laws and regulations',
        'Conducting appropriate due diligence',
        'Managing project scope, budget, and timeline',
        'Resolving disputes with other users'
      ],
      
      section4Title: '4. Platform Role and Limitations',
      section4Subtitle: 'Case Where as an Intermediary',
      section4Content: 'Case Where acts solely as an intermediary platform. We:',
      section4Limitations: [
        'Do not employ freelancers or guarantee their work',
        'Are not party to contracts between clients and freelancers',
        'Do not verify the identity, credentials, or qualifications of all users',
        'Cannot guarantee the quality, safety, or legality of services provided',
        'Are not responsible for user conduct or interactions',
        'Do not control or supervise the work performed'
      ],
      
      section5Title: '5. Limitation of Liability',
      section5Content: 'To the maximum extent permitted by law, Case Where and its affiliates, officers, directors, employees, and agents shall not be liable for:',
      section5Items: [
        'Any direct, indirect, incidental, special, or consequential damages',
        'Loss of profits, revenue, data, or business opportunities',
        'Damages arising from use or inability to use the platform',
        'User errors, omissions, or misconduct',
        'Unauthorized access to or alteration of your data',
        'Statements or conduct of any third party on the platform',
        'Disputes between users',
        'Force majeure events or circumstances beyond our control'
      ],
      section5Note: 'Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability. In such cases, our liability shall be limited to the maximum extent permitted by law.',
      
      section6Title: '6. No Warranty',
      section6Content: 'Our platform is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to:',
      section6Items: [
        'Implied warranties of merchantability',
        'Fitness for a particular purpose',
        'Non-infringement',
        'Uninterrupted or error-free operation',
        'Freedom from viruses or harmful components',
        'Accuracy or completeness of content'
      ],
      
      section7Title: '7. Third-Party Links and Services',
      section7Content: 'Our platform may contain links to third-party websites or services. We:',
      section7Items: [
        'Do not control or endorse third-party content',
        'Are not responsible for the availability of external sites',
        'Do not warrant the accuracy of third-party information',
        'Are not liable for any harm or damages from third-party services',
        'Recommend reviewing third-party terms and privacy policies'
      ],
      
      section8Title: '8. Payment and Financial Transactions',
      section8Subtitle: 'Payment Processing Disclaimer',
      section8Content: 'Regarding payments on our platform:',
      section8Items: [
        'We use third-party payment processors (Stripe, PayPal, etc.)',
        'Payment processing is subject to processor terms and conditions',
        'We are not responsible for payment processor errors or delays',
        'Users are responsible for payment method security',
        'All fees and pricing are subject to change',
        'Refund policies are governed by our Terms of Service',
        'Currency conversions are approximate and subject to fluctuation'
      ],
      
      section9Title: '9. Intellectual Property',
      section9Content: 'Users are responsible for:',
      section9Items: [
        'Ensuring they have rights to content they upload',
        'Not infringing on others\' intellectual property rights',
        'Obtaining necessary licenses and permissions',
        'Complying with copyright and trademark laws',
        'Resolving intellectual property disputes independently'
      ],
      section9Note: 'Case Where is not responsible for user intellectual property disputes or infringements.',
      
      section10Title: '10. Regulatory Compliance',
      section10Content: 'Users must ensure compliance with:',
      section10Items: [
        'Local, national, and international laws',
        'Tax obligations and reporting requirements',
        'Employment and labor laws',
        'Data protection and privacy regulations',
        'Industry-specific regulations and licensing',
        'Export controls and trade restrictions'
      ],
      section10Note: 'Case Where does not provide legal or regulatory compliance advice.',
      
      section11Title: '11. Data Accuracy',
      section11Content: 'We strive to maintain accurate data, but:',
      section11Items: [
        'User-generated content may be inaccurate or outdated',
        'Project budgets and timelines are estimates',
        'Freelancer profiles are self-reported',
        'Reviews and ratings reflect individual opinions',
        'Historical data may not predict future results',
        'Exchange rates and pricing are approximate'
      ],
      
      section12Title: '12. Availability and Modifications',
      section12Content: 'We reserve the right to:',
      section12Items: [
        'Modify, suspend, or discontinue services at any time',
        'Change features, functionality, or pricing',
        'Update terms and policies without prior notice',
        'Remove or restrict user access',
        'Perform maintenance that may affect availability'
      ],
      section12Note: 'We are not liable for any modifications or interruptions to our services.',
      
      section13Title: '13. Dispute Resolution',
      section13Content: 'In the event of disputes:',
      section13Items: [
        'Users should attempt to resolve disputes amicably',
        'Case Where may provide dispute resolution assistance (optional)',
        'We are not obligated to mediate or resolve user disputes',
        'Legal disputes are subject to our Terms of Service',
        'Arbitration clauses may apply per jurisdiction'
      ],
      
      section14Title: '14. Indemnification',
      section14Content: 'You agree to indemnify and hold harmless Case Where and its affiliates from:',
      section14Items: [
        'Claims arising from your use of the platform',
        'Violations of these terms or applicable laws',
        'Infringement of third-party rights',
        'Your content or conduct on the platform',
        'Disputes with other users',
        'Any damage or harm caused by your actions'
      ],
      
      section15Title: '15. Governing Law and Jurisdiction',
      section15Content: 'This disclaimer is governed by the laws of Taiwan (Republic of China). Any disputes shall be subject to the exclusive jurisdiction of the courts in Taipei, Taiwan.',
      
      section16Title: '16. Contact Information',
      section16Content: 'If you have questions about this disclaimer, please contact us at:',
      contactEmail: 'Email: support@casewhr.com',
      contactAddress: 'Address: Case Where Co., Ltd., Taipei, Taiwan',
      
      importantNote: 'Important Note',
      importantNoteContent: 'This disclaimer does not limit rights that cannot be legally limited. If any provision is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect.',
      
      backToHome: 'Back to Home'
    },
    'zh-TW': {
      title: '免責聲明',
      lastUpdated: '最後更新：2024年12月16日',
      intro: '本免責聲明規範您對 Case Where 接得準平台的使用。訪問或使用我們的服務即表示您確認已閱讀、理解並同意受本免責聲明的約束。',
      
      section1Title: '1. 一般信息',
      section1Content: 'Case Where 接得準平台上提供的信息僅供一般參考之用。雖然我們努力保持信息的最新和準確，但我們對以下內容不作任何明示或暗示的陳述或保證：',
      section1Items: [
        '信息的完整性、準確性、可靠性或適用性',
        '我們服務的可用性或連續性',
        '平台上列出的自由工作者的質量或能力',
        '項目或合作的結果',
        '使用者生成內容的準確性'
      ],
      
      section2Title: '2. 非專業建議',
      section2Subtitle: '不替代專業服務',
      section2Content: 'Case Where 是一個連接客戶與自由工作者的平台。我們不提供：',
      section2Items: [
        '法律建議或法律服務',
        '財務建議或投資推薦',
        '稅務建議或會計服務',
        '商業諮詢或戰略建議',
        '技術或專業認證'
      ],
      section2Note: '在做出任何商業、法律或財務決策之前，您應該尋求適當的專業建議。',
      
      section3Title: '3. 使用者責任',
      section3Content: '使用者應對以下內容負全部責任：',
      section3Items: [
        '評估自由工作者的資格和適用性',
        '核實證書和推薦信',
        '協商條款和協議',
        '確保遵守適用的法律法規',
        '進行適當的盡職調查',
        '管理項目範圍、預算和時間表',
        '解決與其他使用者的爭議'
      ],
      
      section4Title: '4. 平台角色和限制',
      section4Subtitle: 'Case Where 作為中介平台',
      section4Content: 'Case Where 僅作為中介平台。我們：',
      section4Limitations: [
        '不雇用自由工作者或保證他們的工作',
        '不是客戶和自由工作者之間合同的一方',
        '不驗證所有使用者的身份、證書或資格',
        '不能保證所提供服務的質量、安全性或合法性',
        '不對使用者行為或互動負責',
        '不控制或監督所執行的工作'
      ],
      
      section5Title: '5. 責任限制',
      section5Content: '在法律允許的最大範圍內，Case Where 及其關聯公司、高級職員、董事、員工和代理人不對以下內容承擔責任：',
      section5Items: [
        '任何直接、間接、附帶、特殊或後果性損害',
        '利潤、收入、數據或商業機會的損失',
        '因使用或無法使用平台而產生的損害',
        '使用者錯誤、遺漏或不當行為',
        '未經授權訪問或更改您的數據',
        '平台上任何第三方的陳述或行為',
        '使用者之間的爭議',
        '不可抗力事件或我們無法控制的情況'
      ],
      section5Note: '某些司法管轄區不允許排除某些保證或限制責任。在這種情況下，我們的責任應限制在法律允許的最大範圍內。',
      
      section6Title: '6. 無擔保',
      section6Content: '我們的平台按「現狀」和「可用」提供，不提供任何明示或暗示的保證，包括但不限於：',
      section6Items: [
        '適銷性的暗示保證',
        '特定用途的適用性',
        '不侵權',
        '不間斷或無錯誤的操作',
        '無病毒或有害組件',
        '內容的準確性或完整性'
      ],
      
      section7Title: '7. 第三方連結和服務',
      section7Content: '我們的平台可能包含第三方網站或服務的連結。我們：',
      section7Items: [
        '不控制或認可第三方內容',
        '不對外部網站的可用性負責',
        '不保證第三方信息的準確性',
        '不對第三方服務造成的任何傷害或損害負責',
        '建議查看第三方條款和隱私政策'
      ],
      
      section8Title: '8. 支付和金融交易',
      section8Subtitle: '支付處理免責聲明',
      section8Content: '關於我們平台上的支付：',
      section8Items: [
        '我們使用第三方支付處理器（Stripe、PayPal 等）',
        '支付處理受處理器條款和條件的約束',
        '我們不對支付處理器錯誤或延遲負責',
        '使用者負責支付方式的安全',
        '所有費用和定價可能會更改',
        '退款政策由我們的服務條款管轄',
        '貨幣轉換是近似值，可能會波動'
      ],
      
      section9Title: '9. 知識產權',
      section9Content: '使用者負責：',
      section9Items: [
        '確保他們對上傳的內容擁有權利',
        '不侵犯他人的知識產權',
        '獲得必要的許可和授權',
        '遵守版權和商標法',
        '獨立解決知識產權爭議'
      ],
      section9Note: 'Case Where 不對使用者知識產權爭議或侵權行為負責。',
      
      section10Title: '10. 監管合規',
      section10Content: '使用者必須確保遵守：',
      section10Items: [
        '地方、國家和國際法律',
        '稅務義務和報告要求',
        '就業和勞動法',
        '數據保護和隱私法規',
        '行業特定法規和許可',
        '出口管制和貿易限制'
      ],
      section10Note: 'Case Where 不提供法律或監管合規建議。',
      
      section11Title: '11. 數據準確性',
      section11Content: '我們努力維護準確的數據，但：',
      section11Items: [
        '使用者生成的內容可能不準確或過時',
        '項目預算和時間表是估計值',
        '自由工作者的個人資料是自我報告的',
        '評論和評分反映個人意見',
        '歷史數據可能無法預測未來結果',
        '匯率和定價是近似值'
      ],
      
      section12Title: '12. 可用性和修改',
      section12Content: '我們保留以下權利：',
      section12Items: [
        '隨時修改、暫停或終止服務',
        '更改功能、功能或定價',
        '在不事先通知的情況下更新條款和政策',
        '刪除或限制使用者訪問',
        '執行可能影響可用性的維護'
      ],
      section12Note: '我們不對服務的任何修改或中斷承擔責任。',
      
      section13Title: '13. 爭議解決',
      section13Content: '如果發生爭議：',
      section13Items: [
        '使用者應嘗試友好解決爭議',
        'Case Where 可能提供爭議解決協助（可選）',
        '我們沒有義務調解或解決使用者爭議',
        '法律爭議受我們的服務條款約束',
        '根據司法管轄區可能適用仲裁條款'
      ],
      
      section14Title: '14. 賠償',
      section14Content: '您同意賠償並使 Case Where 及其關聯公司免受以下損害：',
      section14Items: [
        '因您使用平台而產生的索賠',
        '違反這些條款或適用法律',
        '侵犯第三方權利',
        '您在平台上的內容或行為',
        '與其他使用者的爭議',
        '您的行為造成的任何損害或傷害'
      ],
      
      section15Title: '15. 管轄法律和司法管轄權',
      section15Content: '本免責聲明受台灣（中華民國）法律管轄。任何爭議應受台灣台北法院的專屬管轄。',
      
      section16Title: '16. 聯繫信息',
      section16Content: '如果您對本免責聲明有任何疑問，請通過以下方式聯繫我們：',
      contactEmail: '電子郵件：support@casewhr.com',
      contactAddress: '地址：Case Where 接得準股份有限公司，台灣台北',
      
      importantNote: '重要提示',
      importantNoteContent: '本免責聲明不限制法律上不能限制的權利。如果任何條款被認定為無效或不可執行，其餘條款將繼續完全有效。',
      
      backToHome: '返回首頁'
    },
    'zh-CN': {
      title: '免责声明',
      lastUpdated: '最后更新：2024年12月16日',
      intro: '本免责声明规范您对 Case Where 接得准平台的使用。访问或使用我们的服务即表示您确认已阅读、理解并同意受本免责声明的约束。',
      
      section1Title: '1. 一般信息',
      section1Content: 'Case Where 接得准平台上提供的信息仅供一般参考之用。虽然我们努力保持信息的最新和准确，但我们对以下内容不作任何明示或暗示的陈述或保证：',
      section1Items: [
        '信息的完整性、准确性、可靠性或适用性',
        '我们服务的可用性或连续性',
        '平台上列出的自由工作者的质量或能力',
        '项目或合作的结果',
        '用户生成内容的准确性'
      ],
      
      section2Title: '2. 非专业建议',
      section2Subtitle: '不替代专服务',
      section2Content: 'Case Where 是一个连接客户与自由工作者的平台。我们不提供：',
      section2Items: [
        '法律建议或法律服务',
        '财务建议或投资推荐',
        '税务建议或会计服务',
        '商业咨询或战略建议',
        '技术或专业认证'
      ],
      section2Note: '在做出任何商业、法律或财务决策之前，您应该寻求适当的专业建议。',
      
      section3Title: '3. 用户责任',
      section3Content: '用户应对以下内容负全部责任：',
      section3Items: [
        '评估自由工作者的资格和适用性',
        '核实证书和推荐信',
        '协商条款和协议',
        '确保遵守适用的法律法规',
        '进行适当的尽职调查',
        '管理项目范围、预算和时间表',
        '解决与其他用户的争议'
      ],
      
      section4Title: '4. 平台角色和限制',
      section4Subtitle: 'Case Where 作为中介平台',
      section4Content: 'Case Where 仅作为中介平台。我们：',
      section4Limitations: [
        '不雇用自由工作者或保证他们的工作',
        '不是客户和自由工作者之间合同的一方',
        '不验证所有用户的身份、证书或资格',
        '不能保证所提供服务的质量、安全性或合法性',
        '不对用户行为或互动负责',
        '不控制或监督所执行的工作'
      ],
      
      section5Title: '5. 责任限制',
      section5Content: '在法律允许的最大范围内，Case Where 及其关联公司、高级职员、董事、员工和代理人不对以下内容承担责任：',
      section5Items: [
        '任何直接、间接、附带、特殊或后果性损害',
        '利润、收入、数据或商业机会的损失',
        '因使用或无法使用平台而产生的损害',
        '用户错误、遗漏或不当行为',
        '未经授权访问或更改您的数据',
        '平台上任何第三方的陈述或行为',
        '用户之间的争议',
        '不可抗力事件或我们无法控制的情况'
      ],
      section5Note: '某些司法管辖区不允许排除某些保证或限制责任。在这种情况下，我们的责任应限制在法律允许的最大范围内。',
      
      section6Title: '6. 无担保',
      section6Content: '我们的平台按「现状」和「可用」提供，不提供任何明示或暗示的保证，包括但不限于：',
      section6Items: [
        '适销性的暗示保证',
        '特定用途的适用性',
        '不侵权',
        '不间断或无错误的操作',
        '无病毒或有害组件',
        '内容的准确性或完整性'
      ],
      
      section7Title: '7. 第三方链接和服务',
      section7Content: '我们的平台可能包含第三方网站或服务的链接。我们：',
      section7Items: [
        '不控制或认可第三方内容',
        '不对外部网站的可用性负责',
        '不保证第三方信息的准确性',
        '不对第三方服务造成的任何伤害或损害负责',
        '建议查看第三方条款和隐私政策'
      ],
      
      section8Title: '8. 支付和金融交易',
      section8Subtitle: '支付处理免责声明',
      section8Content: '关于我们平台上的支付：',
      section8Items: [
        '我们使用第三方支付处理器（Stripe、PayPal 等）',
        '支付处理受处理器条款和条件的约束',
        '我们不对支付处理器错误或延迟负责',
        '用户负责支付方式的安全',
        '所有费用和定价可能会更改',
        '退款政策由我们的服务条款管辖',
        '货币转换是近似值，可能会波动'
      ],
      
      section9Title: '9. 知识产权',
      section9Content: '用户负责：',
      section9Items: [
        '确保他们对上传的内容拥有权利',
        '不侵犯他人的知识产权',
        '获得必要的许可和授权',
        '遵守版权和商标法',
        '独立解决知识产权争议'
      ],
      section9Note: 'Case Where 不对用户知识产权争议或侵权行为负责。',
      
      section10Title: '10. 监管合规',
      section10Content: '用户必须确保遵守：',
      section10Items: [
        '地方、国家和国际法律',
        '税务义务和报告要求',
        '就业和劳动法',
        '数据保护和隐私法规',
        '行业特定法规和许可',
        '出口管制和贸易限制'
      ],
      section10Note: 'Case Where 不提供法律或监管合规建议。',
      
      section11Title: '11. 数据准确性',
      section11Content: '我们努力维护准确的数据，但：',
      section11Items: [
        '用户生成的内容可能不准确或过时',
        '项目预算和时间表是估计值',
        '自由工作者的个人资料是自我报告的',
        '评论和评分反映个人意见',
        '历史数据可能无法预测未来结果',
        '汇率和定价是近似值'
      ],
      
      section12Title: '12. 可用性和修改',
      section12Content: '我们保留以下权利：',
      section12Items: [
        '随时修改、暂停或终止服务',
        '更改功能、功能或定价',
        '在不事先通知的情况下更新条款和政策',
        '删除或限制用户访问',
        '执行可能影响可用性的维护'
      ],
      section12Note: '我们不对服务的任何修改或中断承担责任。',
      
      section13Title: '13. 争议解决',
      section13Content: '如果发生争议：',
      section13Items: [
        '用户应尝试友好解决争议',
        'Case Where 可能提供争议解决协助（可选）',
        '我们没有义务调解或解决用户争议',
        '法律争议受我们的服务条款约束',
        '根据司法管辖区可能适用仲裁条款'
      ],
      
      section14Title: '14. 赔偿',
      section14Content: '您同意赔偿并使 Case Where 及其关联公司免受以下损害：',
      section14Items: [
        '因您使用平台而产生的索赔',
        '违反这些条款或适用法律',
        '侵犯第三方权利',
        '您在平台上的内容或行为',
        '与其他用户的争议',
        '您的行为造成的任何损害或伤害'
      ],
      
      section15Title: '15. 管辖法律和司法管辖权',
      section15Content: '本免责声明受台湾（中华民国）法律管辖。任何争议应受台湾台北法院的专属管辖。',
      
      section16Title: '16. 联系信息',
      section16Content: '如果您对本免责声明有任何疑问，请通过以下方式联系我们：',
      contactEmail: '电子邮件：support@casewhr.com',
      contactAddress: '地址：Case Where 接得准股份有限公，台湾台北',
      
      importantNote: '重要提示',
      importantNoteContent: '本免责声明不限制法律上不能限制的权利。如果任何条款被认定为无效或不可执行，其余条款将继续完全有效。',
      
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
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-12 h-12" />
            <h1 className="text-4xl">{t.title}</h1>
          </div>
          <p className="text-red-100 text-sm">{t.lastUpdated}</p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <p className="text-gray-700 leading-relaxed">{t.intro}</p>
        </div>

        {/* Section 1 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-3">{t.section1Title}</h2>
              <p className="text-gray-600 mb-4">{t.section1Content}</p>
              <ul className="space-y-2">
                {t.section1Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-red-600 mt-1">•</span>
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
            <FileWarning className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-2">{t.section2Title}</h2>
              <h3 className="text-lg text-gray-700 mb-3">{t.section2Subtitle}</h3>
              <p className="text-gray-600 mb-4">{t.section2Content}</p>
              <ul className="space-y-2 mb-4">
                {t.section2Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-red-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
                <p className="text-yellow-800">{t.section2Note}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-2xl text-gray-900 mb-3">{t.section3Title}</h2>
          <p className="text-gray-600 mb-4">{t.section3Content}</p>
          <ul className="space-y-2">
            {t.section3Items.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-red-600 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 4 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-2">{t.section4Title}</h2>
              <h3 className="text-lg text-gray-700 mb-3">{t.section4Subtitle}</h3>
              <p className="text-gray-600 mb-4">{t.section4Content}</p>
              <ul className="space-y-2">
                {t.section4Limitations.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-red-600 mt-1">✗</span>
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
            <Scale className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-3">{t.section5Title}</h2>
              <p className="text-gray-600 mb-4">{t.section5Content}</p>
              <ul className="space-y-2 mb-4">
                {t.section5Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-red-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                <p className="text-red-800 text-sm">{t.section5Note}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-2xl text-gray-900 mb-3">{t.section6Title}</h2>
          <p className="text-gray-600 mb-4">{t.section6Content}</p>
          <ul className="space-y-2">
            {t.section6Items.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-red-600 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 7 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <ExternalLink className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl text-gray-900 mb-3">{t.section7Title}</h2>
              <p className="text-gray-600 mb-4">{t.section7Content}</p>
              <ul className="space-y-2">
                {t.section7Items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-red-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sections 8-12 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-2xl text-gray-900 mb-2">{t.section8Title}</h2>
          <h3 className="text-lg text-gray-700 mb-3">{t.section8Subtitle}</h3>
          <p className="text-gray-600 mb-4">{t.section8Content}</p>
          <ul className="space-y-2 mb-6">
            {t.section8Items.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-red-600 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h2 className="text-2xl text-gray-900 mb-3 mt-8">{t.section9Title}</h2>
          <p className="text-gray-600 mb-4">{t.section9Content}</p>
          <ul className="space-y-2 mb-3">
            {t.section9Items.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-red-600 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
            <p className="text-gray-700 text-sm">{t.section9Note}</p>
          </div>

          <h2 className="text-2xl text-gray-900 mb-3 mt-8">{t.section10Title}</h2>
          <p className="text-gray-600 mb-4">{t.section10Content}</p>
          <ul className="space-y-2 mb-3">
            {t.section10Items.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-red-600 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
            <p className="text-gray-700 text-sm">{t.section10Note}</p>
          </div>

          <h2 className="text-2xl text-gray-900 mb-3 mt-8">{t.section11Title}</h2>
          <p className="text-gray-600 mb-4">{t.section11Content}</p>
          <ul className="space-y-2 mb-6">
            {t.section11Items.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-red-600 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h2 className="text-2xl text-gray-900 mb-3 mt-8">{t.section12Title}</h2>
          <p className="text-gray-600 mb-4">{t.section12Content}</p>
          <ul className="space-y-2 mb-3">
            {t.section12Items.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-red-600 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
            <p className="text-gray-700 text-sm">{t.section12Note}</p>
          </div>
        </div>

        {/* Sections 13-15 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-2xl text-gray-900 mb-3">{t.section13Title}</h2>
          <p className="text-gray-600 mb-4">{t.section13Content}</p>
          <ul className="space-y-2 mb-8">
            {t.section13Items.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-red-600 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h2 className="text-2xl text-gray-900 mb-3">{t.section14Title}</h2>
          <p className="text-gray-600 mb-4">{t.section14Content}</p>
          <ul className="space-y-2 mb-8">
            {t.section14Items.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-red-600 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h2 className="text-2xl text-gray-900 mb-3">{t.section15Title}</h2>
          <p className="text-gray-700">{t.section15Content}</p>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-8 mb-8">
          <h2 className="text-2xl text-gray-900 mb-3">{t.section16Title}</h2>
          <p className="text-gray-700 mb-4">{t.section16Content}</p>
          <div className="space-y-2">
            <p className="text-gray-700">{t.contactEmail}</p>
            <p className="text-gray-700">{t.contactAddress}</p>
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-yellow-100 border-2 border-yellow-500 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-700 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl text-yellow-900 mb-2">{t.importantNote}</h3>
              <p className="text-yellow-800 leading-relaxed">{t.importantNoteContent}</p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={handleBackToHome}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-3 rounded-lg hover:from-red-700 hover:to-orange-700 transition-all"
          >
            {t.backToHome}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DisclaimerPage;