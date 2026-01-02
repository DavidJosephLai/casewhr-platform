import React, { useState } from 'react';
import { Button } from './ui/button';
import { CheckCircle, Circle, ExternalLink, Copy, Check } from 'lucide-react';

interface EmailSetupWizardProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function EmailSetupWizard({ language = 'zh' }: EmailSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const markStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
    if (step < steps.length - 1) {
      setCurrentStep(step + 1);
    }
  };

  const content = {
    zh: {
      title: '📧 郵件配置嚮導',
      subtitle: '跟隨步驟完成 SPF 和 DKIM 配置，提高郵件送達率',
      markComplete: '標記為完成',
      copyButton: '複製',
      copied: '已複製！',
      openLink: '打開連結',
      finalMessage: {
        title: '🎉 配置完成！',
        description: '恭喜！您已完成所有配置步驟。',
        nextSteps: '接下來：',
        step1: '1. 等待 10-30 分鐘讓 DNS 傳播',
        step2: '2. 在 Brevo Dashboard 中驗證域名',
        step3: '3. 通知我們更新系統中的發件人地址',
        notifyButton: '我已完成配置',
      },
    },
    en: {
      title: '📧 Email Setup Wizard',
      subtitle: 'Follow the steps to configure SPF and DKIM for better email delivery',
      markComplete: 'Mark as Complete',
      copyButton: 'Copy',
      copied: 'Copied!',
      openLink: 'Open Link',
      finalMessage: {
        title: '🎉 Setup Complete!',
        description: 'Congratulations! You\'ve completed all configuration steps.',
        nextSteps: 'Next Steps:',
        step1: '1. Wait 10-30 minutes for DNS propagation',
        step2: '2. Verify domain in Brevo Dashboard',
        step3: '3. Notify us to update sender address in system',
        notifyButton: 'I\'ve Completed Setup',
      },
    },
  };

  const t = content[language];

  const steps = language === 'zh' ? [
    {
      title: '第一步：登錄 Brevo',
      description: '訪問 Brevo Dashboard 並登錄您的帳戶',
      actions: [
        {
          type: 'link' as const,
          label: '打開 Brevo Dashboard',
          url: 'https://app.brevo.com',
        },
      ],
    },
    {
      title: '第二步：檢查 DNS CNAME 衝突',
      description: '⚠️ 重要：根�� RFC 1912 規定，CNAME 不能與其他記錄類型共存',
      instructions: [
        '在添加 TXT 記錄前，必須先檢查是否有 CNAME 記錄：',
        '',
        '✅ 檢查根域名（@）是否有 CNAME',
        '✅ 檢查 mail._domainkey 是否有 CNAME',
        '✅ 檢查 _dmarc 是否有 CNAME',
        '',
        '如果發現 CNAME 記錄，請選擇以下方案之一：',
        '• 方案 A：刪除 CNAME，改用 A 記錄',
        '• 方案 B：使用子域名（如 mail.casewhr.com）發送郵件',
        '• 方案 C：使用 Cloudflare CNAME Flattening（自動處理）',
      ],
      actions: [
        {
          type: 'link' as const,
          label: '使用 MX Toolbox 檢查',
          url: 'https://mxtoolbox.com/SuperTool.aspx?action=cname%3acasewhr.com',
        },
        {
          type: 'link' as const,
          label: '查看 CNAME 衝突解決指南',
          url: '/DNS_CNAME_CONFLICT_GUIDE.md',
        },
      ],
    },
    {
      title: '第三步：添加域名',
      description: '在 Brevo 中添加您的域名 casewhr.com',
      instructions: [
        '1. 點擊 Settings → Senders & IP → Domains',
        '2. 點擊 "Add a Domain"',
        '3. 輸入：casewhr.com（或 mail.casewhr.com，如果使用子域名）',
        '4. 點擊 "Add Domain"',
      ],
      actions: [
        {
          type: 'link' as const,
          label: '前往 Domains 設置',
          url: 'https://app.brevo.com/settings/sender',
        },
      ],
    },
    {
      title: '第四步：配置 SPF 記錄',
      description: '在您的 DNS 提供商中添加 SPF TXT 記錄',
      instructions: [
        '登錄您的 DNS 管理後台（Cloudflare、GoDaddy 等）',
        '',
        '⚠️ 確認要添加記錄的主機名沒有 CNAME！',
        '',
        '添加以下 TXT 記錄：',
      ],
      dnsRecords: [
        {
          type: 'TXT',
          name: '@',
          value: 'v=spf1 include:spf.brevo.com ~all',
          note: '⚠️ 如果 @ 有 CNAME，請改用子域名或刪除 CNAME',
        },
      ],
    },
    {
      title: '第五步：配置 DKIM 記錄',
      description: '從 Brevo 獲取 DKIM 值並添加到 DNS',
      instructions: [
        '1. 在 Brevo Domains 頁面，找到 DKIM 記錄值',
        '2. 複製完整的 DKIM 字符串',
        '',
        '⚠️ 確認 mail._domainkey 沒有 CNAME！',
        '',
        '3. 在 DNS 中添加以下 TXT 記錄：',
      ],
      dnsRecords: [
        {
          type: 'TXT',
          name: 'mail._domainkey',
          value: '(從 Brevo 複製完整值)',
          note: '⚠️ DKIM 值很長，請確保完整複製。此主機名不能有 CNAME 記錄！',
        },
      ],
    },
    {
      title: '第六步：配置 DMARC 記錄（可選但推薦）',
      description: '添加 DMARC 記錄以進一步提高郵件安全性',
      instructions: [
        '在 DNS 中添加以下 TXT 記錄：',
      ],
      dnsRecords: [
        {
          type: 'TXT',
          name: '_dmarc',
          value: 'v=DMARC1; p=none; rua=mailto:dmarc@casewhr.com',
        },
      ],
    },
    {
      title: '第七步：添加發件人地址',
      description: '在 Brevo 中驗證新的發件人地址',
      instructions: [
        '1. 在 Brevo，點擊 Senders & IP → Senders',
        '2. 點擊 "Add a Sender"',
        '3. 輸入名稱：Case Where',
        '4. 輸入郵箱：noreply@casewhr.com',
        '5. 點擊 "Add" 並驗證',
      ],
      actions: [
        {
          type: 'link' as const,
          label: '前往 Senders 設置',
          url: 'https://app.brevo.com/settings/sender',
        },
      ],
    },
    {
      title: '第八步：驗證配置',
      description: '確認所有記錄都已正確配置並驗證',
      instructions: [
        '1. 在 Brevo Domains 頁面，點擊 "Verify"',
        '2. 確認所有記錄都顯示為 ✅ Verified',
        '3. 使用在線工具再次檢查：',
      ],
      actions: [
        {
          type: 'link' as const,
          label: 'MX Toolbox SPF 檢查',
          url: 'https://mxtoolbox.com/spf.aspx',
        },
        {
          type: 'link' as const,
          label: 'MX Toolbox DKIM 檢查',
          url: 'https://mxtoolbox.com/dkim.aspx',
        },
      ],
    },
  ] : [
    {
      title: 'Step 1: Log in to Brevo',
      description: 'Visit Brevo Dashboard and log in to your account',
      actions: [
        {
          type: 'link' as const,
          label: 'Open Brevo Dashboard',
          url: 'https://app.brevo.com',
        },
      ],
    },
    {
      title: 'Step 2: Check DNS CNAME Conflicts',
      description: '⚠️ Important: According to RFC 1912, CNAME cannot coexist with other record types',
      instructions: [
        'Before adding TXT records, you must check for CNAME records:',
        '',
        '✅ Check if the root domain (@) has a CNAME',
        '✅ Check if mail._domainkey has a CNAME',
        '✅ Check if _dmarc has a CNAME',
        '',
        'If CNAME records are found, choose one of the following solutions:',
        '• Solution A: Delete CNAME and use an A record',
        '• Solution B: Use a subdomain (e.g., mail.casewhr.com) to send emails',
        '• Solution C: Use Cloudflare CNAME Flattening (automatic handling)',
      ],
      actions: [
        {
          type: 'link' as const,
          label: 'Check with MX Toolbox',
          url: 'https://mxtoolbox.com/SuperTool.aspx?action=cname%3acasewhr.com',
        },
        {
          type: 'link' as const,
          label: 'View CNAME Conflict Resolution Guide',
          url: '/DNS_CNAME_CONFLICT_GUIDE.md',
        },
      ],
    },
    {
      title: 'Step 3: Add Domain',
      description: 'Add your domain casewhr.com in Brevo',
      instructions: [
        '1. Click Settings → Senders & IP → Domains',
        '2. Click "Add a Domain"',
        '3. Enter: casewhr.com (or mail.casewhr.com, if using a subdomain)',
        '4. Click "Add Domain"',
      ],
      actions: [
        {
          type: 'link' as const,
          label: 'Go to Domains Settings',
          url: 'https://app.brevo.com/settings/sender',
        },
      ],
    },
    {
      title: 'Step 4: Configure SPF Record',
      description: 'Add SPF TXT record in your DNS provider',
      instructions: [
        'Log in to your DNS management panel (Cloudflare, GoDaddy, etc.)',
        '',
        '⚠️ Ensure the hostname for the record to be added does not have a CNAME!',
        '',
        'Add the following TXT record:',
      ],
      dnsRecords: [
        {
          type: 'TXT',
          name: '@',
          value: 'v=spf1 include:spf.brevo.com ~all',
          note: '⚠️ If @ has a CNAME, use a subdomain or delete the CNAME',
        },
      ],
    },
    {
      title: 'Step 5: Configure DKIM Record',
      description: 'Get DKIM value from Brevo and add to DNS',
      instructions: [
        '1. In Brevo Domains page, find the DKIM record value',
        '2. Copy the complete DKIM string',
        '',
        '⚠️ Ensure mail._domainkey does not have a CNAME!',
        '',
        '3. Add the following TXT record in DNS:',
      ],
      dnsRecords: [
        {
          type: 'TXT',
          name: 'mail._domainkey',
          value: '(Copy full value from Brevo)',
          note: '⚠️ DKIM value is very long, make sure to copy completely. This hostname cannot have a CNAME record!',
        },
      ],
    },
    {
      title: 'Step 6: Configure DMARC Record (Optional but Recommended)',
      description: 'Add DMARC record for additional email security',
      instructions: [
        'Add the following TXT record in DNS:',
      ],
      dnsRecords: [
        {
          type: 'TXT',
          name: '_dmarc',
          value: 'v=DMARC1; p=none; rua=mailto:dmarc@casewhr.com',
        },
      ],
    },
    {
      title: 'Step 7: Add Sender Address',
      description: 'Verify new sender address in Brevo',
      instructions: [
        '1. In Brevo, click Senders & IP → Senders',
        '2. Click "Add a Sender"',
        '3. Enter Name: Case Where',
        '4. Enter Email: noreply@casewhr.com',
        '5. Click "Add" and verify',
      ],
      actions: [
        {
          type: 'link' as const,
          label: 'Go to Senders Settings',
          url: 'https://app.brevo.com/settings/sender',
        },
      ],
    },
    {
      title: 'Step 8: Verify Configuration',
      description: 'Confirm all records are correctly configured and verified',
      instructions: [
        '1. In Brevo Domains page, click "Verify"',
        '2. Confirm all records show ✅ Verified',
        '3. Double-check using online tools:',
      ],
      actions: [
        {
          type: 'link' as const,
          label: 'MX Toolbox SPF Check',
          url: 'https://mxtoolbox.com/spf.aspx',
        },
        {
          type: 'link' as const,
          label: 'MX Toolbox DKIM Check',
          url: 'https://mxtoolbox.com/dkim.aspx',
        },
      ],
    },
  ];

  const isStepComplete = (index: number) => completedSteps.includes(index);
  const allStepsComplete = completedSteps.length === steps.length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-gray-900">{t.title}</h1>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">
            {language === 'zh' ? '進度' : 'Progress'}: {completedSteps.length} / {steps.length}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round((completedSteps.length / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`bg-white border-2 rounded-lg transition-all ${
              currentStep === index
                ? 'border-blue-500 shadow-lg'
                : isStepComplete(index)
                ? 'border-green-500'
                : 'border-gray-200'
            }`}
          >
            <div
              className="p-6 cursor-pointer"
              onClick={() => setCurrentStep(index)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {isStepComplete(index) ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{step.description}</p>

                  {currentStep === index && (
                    <div className="space-y-4 mt-4">
                      {step.instructions && (
                        <div className="space-y-2">
                          {step.instructions.map((instruction, i) => (
                            <p key={i} className="text-sm text-gray-700">
                              {instruction}
                            </p>
                          ))}
                        </div>
                      )}

                      {step.dnsRecords && (
                        <div className="space-y-3">
                          {step.dnsRecords.map((record, i) => (
                            <div key={i} className="bg-gray-50 border border-gray-200 rounded p-4">
                              <div className="grid grid-cols-3 gap-4 mb-2">
                                <div>
                                  <span className="text-xs text-gray-500">{language === 'zh' ? '類型' : 'Type'}</span>
                                  <p className="font-mono text-sm">{record.type}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">{language === 'zh' ? '主機名' : 'Name'}</span>
                                  <p className="font-mono text-sm">{record.name}</p>
                                </div>
                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(record.value, `dns-${i}`)}
                                  >
                                    {copiedText === `dns-${i}` ? (
                                      <>
                                        <Check className="w-3 h-3 mr-1" />
                                        {t.copied}
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3 mr-1" />
                                        {t.copyButton}
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">{language === 'zh' ? '值' : 'Value'}</span>
                                <p className="font-mono text-xs bg-white p-2 rounded border border-gray-200 break-all">
                                  {record.value}
                                </p>
                              </div>
                              {record.note && (
                                <p className="text-xs text-amber-600 mt-2">{record.note}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {step.actions && (
                        <div className="flex flex-wrap gap-2">
                          {step.actions.map((action, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              onClick={() => window.open(action.url, '_blank')}
                            >
                              {action.label}
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                          ))}
                        </div>
                      )}

                      <Button
                        onClick={() => markStepComplete(index)}
                        disabled={isStepComplete(index)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isStepComplete(index) ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {language === 'zh' ? '已完成' : 'Completed'}
                          </>
                        ) : (
                          t.markComplete
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Final Message */}
      {allStepsComplete && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-8 text-center space-y-4">
          <h2 className="text-green-900">{t.finalMessage.title}</h2>
          <p className="text-green-700">{t.finalMessage.description}</p>
          <div className="text-left max-w-md mx-auto space-y-2 text-sm text-green-800">
            <p className="mb-2">{t.finalMessage.nextSteps}</p>
            <p>{t.finalMessage.step1}</p>
            <p>{t.finalMessage.step2}</p>
            <p>{t.finalMessage.step3}</p>
          </div>
          <Button
            className="bg-green-600 hover:bg-green-700 mt-4"
            onClick={() => {
              alert(
                language === 'zh'
                  ? '太好了！請在聊天中告訴我「已完成 SPF/DKIM 配置」，我會立即更新系統中的發件人地址。'
                  : 'Great! Please tell me "SPF/DKIM configuration completed" in the chat, and I will update the sender address in the system immediately.'
              );
            }}
          >
            {t.finalMessage.notifyButton}
          </Button>
        </div>
      )}
    </div>
  );
}