import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle, Info, ExternalLink } from 'lucide-react';

interface EmailDeliveryHelpProps {
  userEmail?: string;
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function EmailDeliveryHelp({ userEmail, language = 'zh' }: EmailDeliveryHelpProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const content = {
    zh: {
      title: '沒收到郵件？',
      subtitle: '如果您使用 Hotmail/Outlook，郵件可能在垃圾郵件文件夾中',
      steps: {
        title: '請按照以下步驟操作：',
        items: [
          {
            title: '1️⃣ 檢查垃圾郵件文件夾',
            description: '登錄您的郵箱，點擊左側的"垃圾郵件"或"Junk"文件夾',
            isHotmail: true,
          },
          {
            title: '2️⃣ 查找 Case Where 的郵件',
            description: '搜索來自 support@casewhr.com 的郵件',
            isHotmail: true,
          },
          {
            title: '3️⃣ 標記為安全',
            description: '右鍵點擊郵件，選擇「非垃圾郵件」或「Mark as Not Junk」',
            isHotmail: true,
          },
          {
            title: '4️⃣ 添加到安全發件人',
            description: '將 support@casewhr.com 添加到您的聯繫人或安全發件人列表',
            isHotmail: true,
          },
        ],
        alternative: '或者，您也可以使用 Gmail 或 Yahoo 郵箱以獲得更好的郵件送達率。',
      },
      providers: {
        title: '各郵件服務商送達率：',
        list: [
          { name: 'Gmail', rate: '95-98%', status: 'excellent' },
          { name: 'Yahoo Mail', rate: '90-95%', status: 'good' },
          { name: 'Hotmail/Outlook', rate: '70-85%', status: 'fair' },
        ],
      },
      hotmailLink: {
        text: '打開 Outlook 垃圾郵件文件夾',
        url: 'https://outlook.live.com/mail/junkemail',
      },
      toggleText: isExpanded ? '收起' : '查看詳細說明',
    },
    en: {
      title: 'Didn\'t receive the email?',
      subtitle: 'If you\'re using Hotmail/Outlook, the email might be in your spam folder',
      steps: {
        title: 'Please follow these steps:',
        items: [
          {
            title: '1️⃣ Check Spam/Junk Folder',
            description: 'Log in to your mailbox and click "Spam" or "Junk" folder on the left',
            isHotmail: true,
          },
          {
            title: '2️⃣ Find Case Where Emails',
            description: 'Search for emails from support@casewhr.com',
            isHotmail: true,
          },
          {
            title: '3️⃣ Mark as Safe',
            description: 'Right-click the email and select "Not Junk" or "Mark as Safe"',
            isHotmail: true,
          },
          {
            title: '4️⃣ Add to Safe Senders',
            description: 'Add support@casewhr.com to your contacts or safe senders list',
            isHotmail: true,
          },
        ],
        alternative: 'Alternatively, you can use Gmail or Yahoo Mail for better email delivery rates.',
      },
      providers: {
        title: 'Email Provider Delivery Rates:',
        list: [
          { name: 'Gmail', rate: '95-98%', status: 'excellent' },
          { name: 'Yahoo Mail', rate: '90-95%', status: 'good' },
          { name: 'Hotmail/Outlook', rate: '70-85%', status: 'fair' },
        ],
      },
      hotmailLink: {
        text: 'Open Outlook Junk Folder',
        url: 'https://outlook.live.com/mail/junkemail',
      },
      toggleText: isExpanded ? 'Hide Details' : 'View Detailed Instructions',
    },
  };

  const t = content[language];
  const isHotmail = userEmail?.includes('@hotmail.') || userEmail?.includes('@outlook.') || userEmail?.includes('@live.');

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Mail className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-blue-900 flex items-center gap-2">
            {t.title}
          </h3>
          <p className="text-blue-700 text-sm mt-1">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Quick Link for Hotmail Users */}
      {isHotmail && (
        <a
          href={t.hotmailLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <ExternalLink className="w-5 h-5 text-blue-600" />
          <span className="text-blue-900">{t.hotmailLink.text}</span>
        </a>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-blue-700 hover:text-blue-900 transition-colors"
      >
        <Info className="w-4 h-4" />
        <span className="text-sm">{t.toggleText}</span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-blue-200">
          {/* Steps */}
          <div className="space-y-3">
            <h4 className="text-blue-900">{t.steps.title}</h4>
            {t.steps.items.map((step, index) => (
              <div key={index} className="flex gap-3 bg-white rounded-lg p-4">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-blue-900 text-sm mb-1">{step.title}</p>
                  <p className="text-blue-600 text-xs">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Alternative */}
          <div className="flex items-start gap-2 bg-white rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">{t.steps.alternative}</p>
          </div>

          {/* Provider Stats */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-gray-900 text-sm mb-3">{t.providers.title}</h4>
            <div className="space-y-2">
              {t.providers.list.map((provider, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{provider.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{provider.rate}</span>
                    {provider.status === 'excellent' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {provider.status === 'good' && (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                    {provider.status === 'fair' && (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}