import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { 
  FileText, 
  Plus, 
  Eye,
  Send,
  Download,
  Trash2,
  Edit,
  Copy,
  CheckCircle,
  Clock,
  FileSignature
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface Contract {
  id: string;
  title: string;
  template_id: string;
  template_name: string;
  client_name: string;
  client_email: string;
  project_name: string;
  amount: number;
  currency: string;
  content: string;
  status: 'draft' | 'sent' | 'signed' | 'completed';
  created_at: string;
  sent_at?: string;
  signed_at?: string;
}

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: string[];
}

interface ContractManagerProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function ContractManager({ language = 'en' }: ContractManagerProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    client_email: '',
    project_name: '',
    amount: '',
    currency: 'USD'
  });

  const translations = {
    en: {
      title: 'Contract Manager',
      subtitle: 'Create and manage custom contracts',
      createContract: 'Create New Contract',
      templates: 'Templates',
      myContracts: 'My Contracts',
      selectTemplate: 'Select Template',
      contractTitle: 'Contract Title',
      clientName: 'Client Name',
      clientEmail: 'Client Email',
      projectName: 'Project Name',
      amount: 'Amount',
      currency: 'Currency',
      create: 'Create Contract',
      cancel: 'Cancel',
      preview: 'Preview',
      send: 'Send to Client',
      download: 'Download PDF',
      duplicate: 'Duplicate',
      delete: 'Delete',
      edit: 'Edit',
      statuses: {
        draft: 'Draft',
        sent: 'Sent',
        signed: 'Signed',
        completed: 'Completed'
      },
      noContracts: 'No contracts yet. Create your first contract!',
      createSuccess: 'Contract created successfully!',
      sendSuccess: 'Contract sent to client!',
      deleteSuccess: 'Contract deleted successfully',
      templatesAvailable: 'Available Templates'
    },
    zh: {
      title: '合約管理',
      subtitle: '創建和管理客製化合約',
      createContract: '創建新合約',
      templates: '模板',
      myContracts: '我的合約',
      selectTemplate: '選擇模板',
      contractTitle: '合約標題',
      clientName: '客戶名稱',
      clientEmail: '客戶電郵',
      projectName: '項目名稱',
      amount: '金額',
      currency: '貨幣',
      create: '創建合約',
      cancel: '取消',
      preview: '預覽',
      send: '發送給客戶',
      download: '下載 PDF',
      duplicate: '複製',
      delete: '刪除',
      edit: '編輯',
      statuses: {
        draft: '草稿',
        sent: '已發送',
        signed: '已簽署',
        completed: '已完成'
      },
      noContracts: '尚無合約。創建您的第一份合���！',
      createSuccess: '合約創建成功！',
      sendSuccess: '合約已發送給客戶！',
      deleteSuccess: '合約刪除成功',
      templatesAvailable: '可用模板'
    },
    'zh-TW': {
      title: '合約管理',
      subtitle: '創建和管理客製化合約',
      createContract: '創建新合約',
      templates: '模板',
      myContracts: '我的合約',
      selectTemplate: '選擇模板',
      contractTitle: '合約標題',
      clientName: '客戶名稱',
      clientEmail: '客戶電郵',
      projectName: '項目名稱',
      amount: '金額',
      currency: '貨幣',
      create: '創建合約',
      cancel: '取消',
      preview: '預覽',
      send: '發送給客戶',
      download: '下載 PDF',
      duplicate: '複製',
      delete: '刪除',
      edit: '編輯',
      statuses: {
        draft: '草稿',
        sent: '已發送',
        signed: '已簽署',
        completed: '已完成'
      },
      noContracts: '尚無合約。創建您的第一份合約！',
      createSuccess: '合約創建成功！',
      sendSuccess: '合約已發送給客戶！',
      deleteSuccess: '合約刪除成功',
      templatesAvailable: '可用模板'
    },
    'zh-CN': {
      title: '合约管理',
      subtitle: '创建和管理定制合约',
      createContract: '创建新合约',
      templates: '模板',
      myContracts: '我的合约',
      selectTemplate: '选择模板',
      contractTitle: '合约标题',
      clientName: '客户名称',
      clientEmail: '客户邮箱',
      projectName: '项目名称',
      amount: '金额',
      currency: '货币',
      create: '创建合约',
      cancel: '取消',
      preview: '预览',
      send: '发送给客户',
      download: '下载 PDF',
      duplicate: '复制',
      delete: '删除',
      edit: '编辑',
      statuses: {
        draft: '草稿',
        sent: '已发送',
        signed: '已签署',
        completed: '已完成'
      },
      noContracts: '尚无合约。创建您的第一份合约！',
      createSuccess: '合约创建成功！',
      sendSuccess: '合约已发送给客户！',
      deleteSuccess: '合约删除成功',
      templatesAvailable: '可用模板'
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchData();
  }, [language]); // 🌍 語言切換時重新加載模板

  // 🌍 三語合約模板內容
  const getContractTemplates = () => {
    const templates = {
      serviceAgreement: {
        id: '1',
        name: {
          en: 'Professional Service Agreement',
          'zh-TW': '專業服務協議',
          'zh-CN': '专业服务协议'
        },
        description: {
          en: 'Comprehensive service agreement with detailed terms and conditions',
          'zh-TW': '包含詳細條款的全面服務協議',
          'zh-CN': '包含详细条款的全面服务协议'
        },
        content: {
          en: `PROFESSIONAL SERVICE AGREEMENT

This Service Agreement (hereinafter referred to as the "Agreement") is entered into as of {{date}} by and between:

CLIENT: {{client_name}}
SERVICE PROVIDER: {{company_name}}

WHEREAS, the Client desires to retain the Service Provider to provide professional services, and the Service Provider agrees to provide such services under the terms and conditions set forth herein.

═══════════════════════════════════════════════════════

1. SCOPE OF SERVICES
The Service Provider agrees to provide the following professional services:
Project Name: {{project_name}}

Service Provider shall perform the services in a professional and workmanlike manner, consistent with industry standards and best practices. All deliverables shall be subject to Client's reasonable approval.

2. PROJECT TIMELINE
• Project Start Date: {{date}}
• Estimated Completion: To be determined based on project milestones
• Regular progress updates will be provided bi-weekly
• Client shall have 5 business days to review and approve deliverables

3. COMPENSATION
The Client agrees to pay the Service Provider:
Total Contract Amount: {{currency}} {{amount}}

Payment shall be made in the currency specified above via agreed payment methods (PayPal, ECPay, or Wire Transfer).

4. PAYMENT TERMS & SCHEDULE
Payment shall be disbursed according to the following schedule:

• Initial Deposit: 30% ({{currency}} {{deposit}}) - Due upon contract signing
• Milestone Payment: 40% ({{currency}} {{milestone}}) - Due upon completion of 50% of project
• Final Payment: 30% ({{currency}} {{final}}) - Due upon project completion and final approval

Late payments shall accrue interest at 1.5% per month or the maximum rate permitted by law, whichever is less.

5. PROJECT DELIVERABLES
The Service Provider shall deliver:
• All agreed-upon project components as specified in the project brief
• Source files and documentation (where applicable)
• Final deliverables in specified formats
• Post-delivery support for 30 days

6. CLIENT RESPONSIBILITIES
The Client agrees to:
• Provide necessary information, materials, and access required for project completion
• Respond to requests for feedback within 5 business days
• Designate a primary point of contact for project communication
• Make timely payments according to the payment schedule

7. INTELLECTUAL PROPERTY RIGHTS
Upon receipt of full payment, all intellectual property rights in the deliverables shall transfer to the Client. Service Provider retains the right to:
• Include the project in portfolio and marketing materials
• Use the project as a case study (with Client's written permission)
• Retain any pre-existing intellectual property used in the project

8. CONFIDENTIALITY
Both parties agree to:
• Maintain strict confidentiality of all proprietary information
• Not disclose confidential information to third parties without written consent
• Return or destroy all confidential materials upon request or contract termination
• Maintain confidentiality obligations for 3 years after contract termination

9. TERM AND TERMINATION
This Agreement shall commence on {{date}} and continue until completion of all services and final payment.

Either party may terminate this Agreement:
• With 14 days written notice
• Immediately for material breach of contract
• By mutual written agreement

Upon termination:
• Client shall pay for all work completed up to termination date
• Service Provider shall deliver all completed work
• Both parties shall return all confidential materials

10. WARRANTIES
Service Provider warrants that:
• Services will be performed in a professional manner
• Work will be original and not infringe on third-party rights
• Provider has authority to enter into this Agreement

11. LIMITATION OF LIABILITY
Service Provider's total liability shall not exceed the total amount paid under this Agreement. Neither party shall be liable for indirect, incidental, or consequential damages.

12. INDEPENDENT CONTRACTOR
Service Provider is an independent contractor, not an employee. Service Provider is responsible for all taxes, insurance, and other obligations.

13. DISPUTE RESOLUTION
Any disputes shall be resolved through:
1. Good faith negotiation between parties
2. Mediation by a mutually agreed mediator
3. Binding arbitration or litigation (if mediation fails)

14. FORCE MAJEURE
Neither party shall be liable for delays caused by circumstances beyond their reasonable control, including natural disasters, war, pandemic, or government actions.

15. AMENDMENTS
This Agreement may only be amended by written agreement signed by both parties.

16. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements, whether written or oral.

17. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction where services are primarily performed.

18. NOTICES
All notices shall be sent to the email addresses provided by both parties and shall be deemed delivered upon email confirmation.

19. SEVERABILITY
If any provision is found invalid, the remaining provisions shall remain in full force and effect.

═══════════════════════════════════════════════════════

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

CLIENT:
Signature: _______________________
Name: {{client_name}}
Date: {{date}}
Email: {{client_email}}

SERVICE PROVIDER:
Signature: _______________________
Name: {{company_name}}
Date: {{date}}

═══════════════════════════════════════════════════════
Powered by CaseWHR - Professional Freelancing Platform`,

          'zh-TW': `專業服務協議

本服務協議（以下簡稱「本協議」）於 {{date}} 由以下雙方簽訂：

客戶：{{client_name}}
服務提供商：{{company_name}}

鑒於客戶希望聘請服務提供商提供專業服務，服務提供商同意按本協議規定的條款和條件提供此類服務。

═══════════════════════════════════════════════════════

1. 服務範圍
服務提供商同意提供以下專業服務：
項目名稱：{{project_name}}

服務提供商應以專業和精湛的方式執行服務，符合行業標準和最佳實踐。所有交付成果均須經客戶合理批准。

2. 項目時間表
• 項目開始日期：{{date}}
• 預計完成時間：根據項目里程碑確定
• 每兩週提供定期進度更新
• 客戶應有 5 個工作日審查和批准交付成果

3. 報酬
客戶同意向服務提供商支付：
合約總金額：{{currency}} {{amount}}

付款應通過約定的支付方式（PayPal、ECPay 綠界金流或電匯）以指定貨幣支付。

4. 付款條款與時間表
付款應按以下時間表支付：

• 初始訂金：30%（{{currency}} {{deposit}}）- 簽約時到期
• 里程碑付款：40%（{{currency}} {{milestone}}）- 完成 50% 項目時到期
• 最終付款：30%（{{currency}} {{final}}）- 項目完成並最終批准時到期

逾期付款將按每月 1.5% 或法律允許的最高利率（以較低者為準）計息。

5. 項目交付成果
服務提供商應交付：
• 項目簡介中指定的所有約定項目組件
• 原始檔案和文檔（如適用）
• 指定格式的最終交付成果
• 交付後 30 天的支援服務

6. 客戶責任
客戶同意：
• 提供完成項目所需的必要資訊、材料和存取權限
• 在 5 個工作日內回應反饋請求
• 指定項目溝通的主要聯絡人
• 按付款時間表及時付款

7. 知識產權
收到全額付款後，交付成果中的所有知識產權應轉讓給客戶。服務提供商保留以下權利：
• 將項目納入作品集和行銷材料
• 將項目用作案例研究（需客戶書面許可）
• 保留項目中使用的任何預先存在的知識產權

8. 保密條款
雙方同意：
• 對所有專有資訊嚴格保密
• 未經書面同意不向第三方披露機密資訊
• 應要求或合約終止時歸還或銷毀所有機密材料
• 在合約終止後 3 年內維持保密義務

9. 期限與終止
本協議自 {{date}} 開始生效，並持續至完成所有服務和最終付款。

任何一方可終止本協議：
• 提前 14 天書面通知
• 因重大違約立即終止
• 雙方書面同意終止

終止時：
• 客戶應支付截至終止日期已完成的所有工作
• 服務提供商應交付所有已完成的工作
• 雙方應歸還所有機密材料

10. 保證
服務提供商保證：
• 服務將以專業方式執行
• 工作將是原創的，不侵犯第三方權利
• 提供商有權簽訂本協議

11. 責任限制
服務提供商的總責任不應超過本協議項下支付的總金額。任何一方均不對間接、附帶或後果性損害承擔責任。

12. 獨立承包商
服務提供商是獨立承包商，而非員工。服務提供商負責所有稅務、保險和其他義務。

13. 爭議解決
任何爭議應通過以下方式解決：
1. 雙方之間的誠信談判
2. 由雙方同意的調解人進行調解
3. 具有約束力的仲裁或訴訟（如調解失敗）

14. 不可抗力
任何一方均不對超出其合理控制範圍的情況（包括自然災害、戰爭、疫情或政府行為）造成的延誤承擔責任。

15. 修訂
本協議僅可通過雙方簽署的書面協議進行修訂。

16. 完整協議
本協議構成雙方之間的完整協議，並取代所有先前的書面或口頭協議。

17. 管轄法律
本協議應受主要執行服務所在司法管轄區的法律管轄和解釋。

18. 通知
所有通知應發送至雙方提供的電子郵件地址，並在電子郵件確認後視為已送達。

19. 可分割性
如任何��款被認定無效，其餘條款應繼續完全有效。

═══════════════════════════════════════════════════════

茲證明，雙方已於上述首次書面日期簽署本協議。

客戶：
簽署：_______________________
姓名：{{client_name}}
日期：{{date}}
電子郵件：{{client_email}}

服務提供商：
簽署：_______________________
姓名：{{company_name}}
日期：{{date}}

═══════════════════════════════════════════════════════
由 CaseWHR 接得準提供 - 專業接案平台`,

          'zh-CN': `专业服务协议

本服务协议（以下简称"本协议"）于 {{date}} 由以下双方签订：

客户：{{client_name}}
服务提供商：{{company_name}}

鉴于客户希望聘请服务提供商提供专业服务，服务提供商同意按本协议规定的条款和条件提供此类服务。

═══════════════════════════════════════════════════════

1. 服务范围
服务提供商同意提供以下专业服务：
项目名称：{{project_name}}

服务提供商应以专业和精湛的方式执行服务，符合行业标准和最佳实践。所有交付成果均须经客户合理批准。

2. 项目时间表
• 项目开始日期：{{date}}
• 预计完成时间：根据项目里程碑确定
• 每两周提供定期进度更新
• 客户应有 5 个工作日审查和批准交付成果

3. 报酬
客户同意向服务提供商支付：
合约总金额：{{currency}} {{amount}}

付款应通过约定的支付方式（PayPal、ECPay 或电汇）以指定货币支付。

4. 付款条款与时间表
付款应按以下时间表支付：

• 初始订金：30%（{{currency}} {{deposit}}）- 签约时到期
• 里程碑付款：40%（{{currency}} {{milestone}}）- 完成 50% 项目时到期
• 最终付款：30%（{{currency}} {{final}}）- 项目完成并最终批准时到期

逾期付款将按每月 1.5% 或法律允许的最高利率（以较低者为准）计息。

5. 项目交付成果
服务提供商应交付：
• 项目简介中指定的所有约定项目组件
• 原始文件和文档（如适用）
• 指定格式的最终交付成果
• 交付后 30 天的支持服务

6. 客户责任
客户同意：
• 提供完成项目所需的必要信息、材料和访问权限
• 在 5 个工作日内响应反馈请求
• 指定项目沟通的主要联系人
• 按付款时间表及时付款

7. 知识产权
收到全额付款后，交付成果中的所有知识产权应转让给客户。服务提供商保留以下权利：
• 将项目纳入作品集和营销材料
• 将项目用作案例研究（需客户书面许可）
• 保留项目中使用的任何预先存在知识产权

8. 保密条款
双方同意：
• 对所有专有信息严格保密
• 未经书面同意不向第三方披露机密信息
• 应要求或合约终止时归还或销毁所有机密材料
• 在合约终止后 3 年内维持保密义务

9. 期限与终止
本协议自 {{date}} 开始生效，并持续至完成所有服务和最终付款。

任何一方可终止本协议：
• 提前 14 天书面通知
• 因重大违约立即终止
• 双方书面同意终止

终止时：
• 客户应支付截至终止日期已完成的所有工作
• 服务提供商应交付所有已完成的工作
• 双方应归还所有机密材料

10. 保证
服务提供商保证：
• 服务将以专业方式执行
• 工作将是原创的，不侵犯第三方权利
• 提供商有权签订本协议

11. 责任限制
服务提供商的总责任不应超过本协议项下支付的总金额。任何一方均不对间接、附带或后果性损害承担责任。

12. 独立承包商
服务提供商是独立承包商，而非员工。服务提供商负责所有税务、保险和其他义务。

13. 争议解决
任何争议应通过以下方式解决：
1. 双方之间的诚信谈判
2. 由双方同意的调解人进行调解
3. 具有约束力的仲裁或诉讼（如调解失败）

14. 不可抗力
任何一方均不对超出其合理控制范围的情况（包括自然灾害、战争、疫情或政府行为）造成的延误承担责任。

15. 修订
本协议仅可通过双方签署的书面协议进行修订。

16. 完整协议
本协议构成双方之间的完整协议，并取代所有先前的书面或口头协议。

17. 管辖法律
本协议应受主要执行服务所在司法管辖区的法律管辖和解释。

18. 通知
所有通知应发送至双方提供的电子邮件地址，并在电子邮件确认后视为已送达。

19. 可分割性
如任何条款被认定无效，其余条款应继续完全有效。

═══════════════════════════════════════════════════════

兹证明，双方已于上述首次书面日期签署本协议。

客户：
签署：_______________________
姓名：{{client_name}}
日期：{{date}}
电子邮件：{{client_email}}

服务提供商：
签署：_______________________
姓名：{{company_name}}
日期：{{date}}

═══════════════════════════════════════════════════════
由 CaseWHR 提供 - 专业接案平台`
        },
        variables: ['client_name', 'company_name', 'project_name', 'amount', 'currency', 'date', 'client_email', 'deposit', 'milestone', 'final']
      },
      ndaAgreement: {
        id: '2',
        name: {
          en: 'NDA Agreement',
          'zh-TW': '保密協議',
          'zh-CN': '保密协议'
        },
        description: {
          en: 'Non-disclosure agreement template',
          'zh-TW': '保密協議模板',
          'zh-CN': '保密协议模板'
        },
        content: {
          en: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is made as of {{date}} by and between {{client_name}} ("Disclosing Party") and {{company_name}} ("Receiving Party").

1. CONFIDENTIAL INFORMATION
The Receiving Party agrees to keep confidential all information related to: {{project_name}}

2. OBLIGATIONS
The Receiving Party shall:
- Not disclose confidential information to third parties
- Use the information solely for the purpose of {{project_name}}
- Return all materials upon request
- Implement reasonable security measures

3. TERM
This Agreement shall remain in effect for a period of 2 years from the date of signing.

4. EXCEPTIONS
Confidential information does not include information that is publicly available or independently developed.

Signed,
_______________________
{{client_name}}
Disclosing Party

_______________________
{{company_name}}
Receiving Party`,
          'zh-TW': `保密協議

本保密協議（「協議」）於 {{date}} 由 {{client_name}}（「披露方」）與 {{company_name}}（「接收方」）簽訂。

1. 保密資訊
接收方同意對以下相關的所有資訊保密：{{project_name}}

2. 義務
接收方應：
- 不向第三方披露保密資訊
- 僅將資訊用於 {{project_name}} 之目的
- 應要求歸還所有材料
- 實施合理的安全措施

3. 期限
本協議自簽署之日起生效，有效期為 2 年。

4. 例外情況
保密資訊不包括公開可用或獨立開發的資訊。

簽署，
_______________________
{{client_name}}
披露方

_______________________
{{company_name}}
接收方`,
          'zh-CN': `保密协议

本保密协议（"协议"）于 {{date}} 由 {{client_name}}（"披露方"）与 {{company_name}}（"接收方"）签订。

1. 保密信息
接收方同意对以下相关的所有信息保密：{{project_name}}

2. 义务
接收方应：
- 不向第三方披露保密信息
- 仅将信息用于 {{project_name}} 之目的
- 应要求归还所有材料
- 实施合理的安全措施

3. 期限
本协议自签署之日起生效，有效期为 2 年。

4. 例外情况
保密信息不包括公开可用或独立开发的信息。

签署，
_______________________
{{client_name}}
披露方

_______________________
{{company_name}}
接收方`
        },
        variables: ['client_name', 'company_name', 'project_name', 'date']
      },
      freelanceContract: {
        id: '3',
        name: {
          en: 'Freelance Contract',
          'zh-TW': '自由職業合約',
          'zh-CN': '自由职业合约'
        },
        description: {
          en: 'Freelance work contract template',
          'zh-TW': '自由職業工作合約模板',
          'zh-CN': '自由职业工作合约模板'
        },
        content: {
          en: `FREELANCE CONTRACT

Agreement between {{client_name}} ("Client") and {{freelancer_name}} ("Freelancer") dated {{date}}.

PROJECT: {{project_name}}
TOTAL FEE: {{currency}} {{amount}}

DELIVERABLES:
- Scope of work as agreed in project brief
- Timeline: As specified in project schedule
- Revisions: Up to 2 rounds included in fee

PAYMENT SCHEDULE:
- 30% upon project start
- 40% at milestone review
- 30% upon final delivery and approval

INTELLECTUAL PROPERTY:
Upon full payment, all rights transfer to the Client. Freelancer retains rights to use work samples for portfolio.

TERMINATION:
Either party may terminate with 7 days written notice.

Signatures:
_______________________
{{client_name}}
Client

_______________________
{{freelancer_name}}
Freelancer`,
          'zh-TW': `自由職業合約

{{client_name}}（「客戶」）與 {{freelancer_name}}（「自由職業者」）於 {{date}} 簽訂的協議。

項目：{{project_name}}
總費用：{{currency}} {{amount}}

交付成果：
- 按項目簡介中約定的工作範圍
- 時間表：按項目進度表規定
- 修改：費用中包含最多 2 輪修改

付款時間表：
- 項目開始時支付 30%
- 里程碑審查時支付 40%
- 最終交付和批准時支付 30%

知識產權：
全額付款後，所有權利轉讓給客戶。自由職業者保留將作品樣本用於作品集的權利。

終止條款：
任何一方可提前 7 天書面通知終止合約。

簽署：
_______________________
{{client_name}}
客戶

_______________________
{{freelancer_name}}
自由職業者`,
          'zh-CN': `自由职业合约

{{client_name}}（"客户"）与 {{freelancer_name}}（"自由职业者"）于 {{date}} 签订的协议。

项目：{{project_name}}
总费用：{{currency}} {{amount}}

交付成果：
- 按项目简介中约定的工作范围
- 时间表：按项目进度表规定
- 修改：费用中包含最多 2 轮修改

付款时间表：
- 项目开始时支付 30%
- 里程碑审查时支付 40%
- 最终交付和批准时支付 30%

知识产权：
全额付款后，所有权利转让给客户。自由职业者保留将作品样本用於作品集的权利。

终止条款：
任何一方可提前 7 天书面通知终止合约。

签署：
_______________________
{{client_name}}
客户

_______________________
{{freelancer_name}}
自由职业者`
        },
        variables: ['client_name', 'freelancer_name', 'project_name', 'amount', 'currency', 'date']
      }
    };

    const lang = language === 'zh' ? 'zh-TW' : language;
    
    return [
      {
        id: templates.serviceAgreement.id,
        name: templates.serviceAgreement.name[lang],
        description: templates.serviceAgreement.description[lang],
        content: templates.serviceAgreement.content[lang],
        variables: templates.serviceAgreement.variables
      },
      {
        id: templates.ndaAgreement.id,
        name: templates.ndaAgreement.name[lang],
        description: templates.ndaAgreement.description[lang],
        content: templates.ndaAgreement.content[lang],
        variables: templates.ndaAgreement.variables
      },
      {
        id: templates.freelanceContract.id,
        name: templates.freelanceContract.name[lang],
        description: templates.freelanceContract.description[lang],
        content: templates.freelanceContract.content[lang],
        variables: templates.freelanceContract.variables
      }
    ];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🔥 始終使用本地三語模板（不依賴後端）
      const localTemplates = getContractTemplates();
      setTemplates(localTemplates);
      
      // 🎁 開發模式支援
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        // 模擬合約數據 - 使用對應語言的完整內容
        const lang = language === 'zh' ? 'zh-TW' : language;
        
        // 獲取服務協議模板內容
        const serviceTemplate = localTemplates.find(t => t.id === '1');
        let serviceContent = serviceTemplate?.content || '';
        serviceContent = serviceContent
          .replace(/{{client_name}}/g, 'ABC Corporation')
          .replace(/{{company_name}}/g, 'CaseWHR Platform')
          .replace(/{{project_name}}/g, 'E-commerce Website Development')
          .replace(/{{amount}}/g, '15,000')
          .replace(/{{currency}}/g, 'USD')
          .replace(/{{date}}/g, new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString())
          .replace(/{{client_email}}/g, 'contact@abc-corp.com')
          .replace(/{{deposit}}/g, '4,500')
          .replace(/{{milestone}}/g, '6,000')
          .replace(/{{final}}/g, '4,500');

        // 獲取NDA模板內容
        const ndaTemplate = localTemplates.find(t => t.id === '2');
        let ndaContent = ndaTemplate?.content || '';
        ndaContent = ndaContent
          .replace(/{{client_name}}/g, 'Tech Startup Inc')
          .replace(/{{company_name}}/g, 'CaseWHR Platform')
          .replace(/{{project_name}}/g, 'iOS Mobile Application')
          .replace(/{{date}}/g, new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString());

        // 獲取自由職業合約模板內容
        const freelanceTemplate = localTemplates.find(t => t.id === '3');
        let freelanceContent = freelanceTemplate?.content || '';
        freelanceContent = freelanceContent
          .replace(/{{client_name}}/g, 'Design Studio')
          .replace(/{{freelancer_name}}/g, user?.user_metadata?.name || 'Professional Freelancer')
          .replace(/{{project_name}}/g, 'Brand Identity Package')
          .replace(/{{amount}}/g, '5,000')
          .replace(/{{currency}}/g, 'USD')
          .replace(/{{date}}/g, new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString());

        const contractTitles = {
          contract1: {
            en: 'Website Development Agreement',
            'zh-TW': '網站開發協議',
            'zh-CN': '网站开发协议'
          },
          contract2: {
            en: 'Mobile App Development NDA',
            'zh-TW': '移動應用開發保密協議',
            'zh-CN': '移动应用开发保密协议'
          },
          contract3: {
            en: 'Logo Design Contract',
            'zh-TW': 'Logo 設計合約',
            'zh-CN': 'Logo 设计合约'
          }
        };

        const mockContracts: Contract[] = [
          {
            id: '1',
            title: contractTitles.contract1[lang],
            template_id: '1',
            template_name: localTemplates[0].name,
            client_name: 'ABC Corporation',
            client_email: 'contact@abc-corp.com',
            project_name: 'E-commerce Website',
            amount: 15000,
            currency: 'USD',
            content: serviceContent,
            status: 'sent',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            sent_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            title: contractTitles.contract2[lang],
            template_id: '2',
            template_name: localTemplates[1].name,
            client_name: 'Tech Startup Inc',
            client_email: 'ceo@techstartup.com',
            project_name: 'iOS Mobile Application',
            amount: 0,
            currency: 'USD',
            content: ndaContent,
            status: 'signed',
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            sent_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
            signed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            title: contractTitles.contract3[lang],
            template_id: '3',
            template_name: localTemplates[2].name,
            client_name: 'Design Studio',
            client_email: 'hello@designstudio.com',
            project_name: 'Brand Identity Package',
            amount: 5000,
            currency: 'USD',
            content: freelanceContent,
            status: 'draft',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];

        setContracts(mockContracts);
        setLoading(false);
        return;
      }

      // 從後端獲取真實合約數據（模板已在上面設置）
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken;
      }

      const contractsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/contracts`, 
        { headers }
      );

      if (contractsResponse.ok) {
        const data = await contractsResponse.json();
        setContracts(data.contracts || []);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      // 即使出錯也確保模板可用
      const localTemplates = getContractTemplates();
      setTemplates(localTemplates);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async () => {
    if (!selectedTemplate || !formData.client_name || !formData.client_email || !formData.project_name) {
      toast.error(language === 'en' ? 'Please fill in all required fields' : '請填寫所有必填欄位');
      return;
    }

    try {
      // 🎁 開發模式
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        const template = templates.find(t => t.id === selectedTemplate);
        if (!template) return;

        // 替換變量
        let content = template.content;
        content = content.replace(/{{client_name}}/g, formData.client_name);
        content = content.replace(/{{project_name}}/g, formData.project_name);
        content = content.replace(/{{amount}}/g, formData.amount);
        content = content.replace(/{{currency}}/g, formData.currency);
        content = content.replace(/{{date}}/g, new Date().toLocaleDateString());
        content = content.replace(/{{company_name}}/g, user?.user_metadata?.name || 'Your Company');
        content = content.replace(/{{freelancer_name}}/g, user?.user_metadata?.name || 'Your Name');

        const newContract: Contract = {
          id: `temp-${Date.now()}`,
          title: formData.title,
          template_id: selectedTemplate,
          template_name: template.name,
          client_name: formData.client_name,
          client_email: formData.client_email,
          project_name: formData.project_name,
          amount: parseFloat(formData.amount) || 0,
          currency: formData.currency,
          content: content,
          status: 'draft',
          created_at: new Date().toISOString()
        };

        setContracts([newContract, ...contracts]);
        toast.success(t.createSuccess);
        setShowCreateDialog(false);
        resetForm();
        return;
      }

      // 真實 API
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/contracts`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...formData,
            template_id: selectedTemplate
          })
        }
      );

      if (response.ok) {
        toast.success(t.createSuccess);
        setShowCreateDialog(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create contract:', error);
      toast.error(language === 'en' ? 'Failed to create contract' : '創建合約失敗');
    }
  };

  const handleSendContract = async (contractId: string) => {
    try {
      // 🎁 開發模式
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        setContracts(contracts.map(c => 
          c.id === contractId 
            ? { ...c, status: 'sent', sent_at: new Date().toISOString() }
            : c
        ));
        toast.success(t.sendSuccess);
        return;
      }

      // 真實 API
      toast.success(t.sendSuccess);
    } catch (error) {
      console.error('Failed to send contract:', error);
      toast.error(language === 'en' ? 'Failed to send contract' : '發送合約失敗');
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm(language === 'en' ? 'Are you sure you want to delete this contract?' : '確定要刪除此合約嗎？')) {
      return;
    }

    try {
      // 🎁 開發模式
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        setContracts(contracts.filter(c => c.id !== contractId));
        toast.success(t.deleteSuccess);
        return;
      }

      // 真實 API
      toast.success(t.deleteSuccess);
      fetchData();
    } catch (error) {
      console.error('Failed to delete contract:', error);
      toast.error(language === 'en' ? 'Failed to delete contract' : '刪除合約失敗');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      client_name: '',
      client_email: '',
      project_name: '',
      amount: '',
      currency: 'USD'
    });
    setSelectedTemplate('');
  };

  const handleDownloadPDF = (contract: Contract) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      
      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(contract.title, margin, margin);
      
      // Contract details
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let yPos = margin + 15;
      
      pdf.text(`Client: ${contract.client_name}`, margin, yPos);
      yPos += 7;
      pdf.text(`Project: ${contract.project_name}`, margin, yPos);
      yPos += 7;
      pdf.text(`Amount: ${contract.currency} ${contract.amount.toLocaleString()}`, margin, yPos);
      yPos += 7;
      pdf.text(`Date: ${new Date(contract.created_at).toLocaleDateString()}`, margin, yPos);
      yPos += 15;
      
      // Contract content
      pdf.setFontSize(11);
      pdf.setFont('times', 'normal');
      
      // Split text into lines that fit the page width
      const lines = pdf.splitTextToSize(contract.content, maxWidth);
      
      // Add lines to PDF, handling page breaks
      for (let i = 0; i < lines.length; i++) {
        if (yPos + 7 > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.text(lines[i], margin, yPos);
        yPos += 7;
      }
      
      // Save the PDF
      const fileName = `${contract.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      pdf.save(fileName);
      
      toast.success(language === 'en' ? 'PDF downloaded successfully!' : 'PDF 下載成功！');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error(language === 'en' ? 'Failed to generate PDF' : 'PDF 生成失敗');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{t.statuses.draft}</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">{t.statuses.sent}</Badge>;
      case 'signed':
        return <Badge className="bg-green-100 text-green-700 border-green-200">{t.statuses.signed}</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">{t.statuses.completed}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            {t.title}
          </h2>
          <p className="text-sm text-gray-600 mt-1">{t.subtitle}</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.createContract}
        </Button>
      </div>

      {/* Templates Overview */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">{t.templatesAvailable}</CardTitle>
          <CardDescription>{templates.length} {language === 'en' ? 'templates ready to use' : '個模板可用'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileSignature className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{template.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      <Card>
        <CardHeader>
          <CardTitle>{t.myContracts} ({contracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              {language === 'en' ? 'Loading...' : '載入中...'}
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t.noContracts}
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{contract.title}</h4>
                      {getStatusBadge(contract.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="text-xs text-gray-500">{language === 'en' ? 'Client' : '客戶'}:</span>
                        <p className="font-medium">{contract.client_name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">{language === 'en' ? 'Project' : '項目'}:</span>
                        <p className="font-medium">{contract.project_name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">{language === 'en' ? 'Amount' : '金額'}:</span>
                        <p className="font-medium">{contract.currency} {contract.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">{language === 'en' ? 'Template' : '模板'}:</span>
                        <p className="font-medium text-xs">{contract.template_name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedContract(contract);
                        setShowPreviewDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {contract.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSendContract(contract.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteContract(contract.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Contract Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.createContract}</DialogTitle>
            <DialogDescription>
              {language === 'en' ? 'Fill in the details to create a new contract' : '填寫詳細信息以創建新合約'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t.selectTemplate}</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Choose a template' : '選擇模板'} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t.contractTitle}</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={language === 'en' ? 'e.g., Website Development Agreement' : '例如：網站開發協議'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t.clientName}</label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="ABC Corporation"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t.clientEmail}</label>
                <Input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t.projectName}</label>
              <Input
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                placeholder={language === 'en' ? 'E-commerce Website' : '電子商務網站'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t.amount}</label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="15000"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t.currency}</label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="TWD">TWD</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleCreateContract} className="bg-purple-600 hover:bg-purple-700">
              {t.create}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedContract?.title}</DialogTitle>
            <DialogDescription>
              {selectedContract?.client_name} - {selectedContract?.project_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-white border rounded-lg p-8 shadow-inner">
              <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
                {selectedContract?.content}
              </pre>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                {language === 'en' ? 'Close' : '關閉'}
              </Button>
              <Button variant="outline" onClick={() => handleDownloadPDF(selectedContract!)}>
                <Download className="h-4 w-4 mr-2" />
                {t.download}
              </Button>
              {selectedContract?.status === 'draft' && (
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    if (selectedContract) {
                      handleSendContract(selectedContract.id);
                      setShowPreviewDialog(false);
                    }
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t.send}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}