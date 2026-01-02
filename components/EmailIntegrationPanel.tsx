import React, { useState } from 'react';
import { Send, Mail, TrendingUp, Target, Bell, MessageCircle, Users, BarChart3 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface EmailIntegrationPanelProps {
  language: 'en' | 'zh';
}

export function EmailIntegrationPanel({ language }: EmailIntegrationPanelProps) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const content = language === 'en' ? {
    title: 'Email Integration & Automation',
    subtitle: 'Trigger and test automated emails in business workflows',
    sections: {
      welcome: {
        title: 'Welcome Email',
        desc: 'Sent when a user registers',
        icon: Mail,
      },
      monthly: {
        title: 'Monthly Report',
        desc: 'Performance analytics sent monthly',
        icon: BarChart3,
      },
      recommendations: {
        title: 'Project Recommendations',
        desc: 'AI-matched projects based on skills',
        icon: Target,
      },
      milestone: {
        title: 'Milestone Reminder',
        desc: 'Progress updates and deadlines',
        icon: Bell,
      },
      message: {
        title: 'Message Notification',
        desc: 'New message alerts',
        icon: MessageCircle,
      },
      system: {
        title: 'System Notification',
        desc: 'Important platform updates',
        icon: Bell,
      },
    },
    testEmail: 'Test Email',
    sending: 'Sending...',
    success: 'Email sent successfully!',
    error: 'Failed to send email',
    emailPlaceholder: 'Enter email address',
    send: 'Send',
  } : {
    title: '郵件整合與自動化',
    subtitle: '在業務流程中觸發和測試自動化郵件',
    sections: {
      welcome: {
        title: '歡迎郵件',
        desc: '用戶註冊時發送',
        icon: Mail,
      },
      monthly: {
        title: '月度報告',
        desc: '每月發送績效分析',
        icon: BarChart3,
      },
      recommendations: {
        title: '項目推薦',
        desc: '基於技能的AI匹配項目',
        icon: Target,
      },
      milestone: {
        title: '里程碑提醒',
        desc: '進度更新和截止日期',
        icon: Bell,
      },
      message: {
        title: '訊息通知',
        desc: '新訊息提醒',
        icon: MessageCircle,
      },
      system: {
        title: '系統通知',
        desc: '重要平台更新',
        icon: Bell,
      },
    },
    testEmail: '測試郵件',
    sending: '發送中...',
    success: '郵件發送成功！',
    error: '郵件發送失敗',
    emailPlaceholder: '輸入郵件地址',
    send: '發送',
  };

  const sendTestEmail = async (type: string, email: string) => {
    setSending(true);
    setResult(null);

    try {
      let endpoint = '';
      let body: any = {
        userId: 'test-user-123',
        email,
        name: language === 'en' ? 'Test User' : '測試用戶',
        language,
      };

      switch (type) {
        case 'welcome':
          endpoint = '/emails/welcome';
          break;

        case 'monthly':
          endpoint = '/emails/monthly-report';
          body = {
            ...body,
            month: language === 'en' ? 'December' : '12月',
            stats: {
              projectsPosted: 5,
              proposalsSubmitted: 12,
              projectsCompleted: 6,
              earningsThisMonth: 1500,
              totalEarnings: 8900,
              newReviews: 4,
              averageRating: 4.8,
            },
          };
          break;

        case 'recommendations':
          endpoint = '/emails/project-recommendations';
          body = {
            ...body,
            projects: [
              {
                title: language === 'en' ? 'E-commerce Website Development' : '電商網站開發',
                budget: '$5,000 - $10,000',
                skills: ['React', 'Node.js', 'MongoDB'],
                deadline: '2024-01-15',
              },
              {
                title: language === 'en' ? 'Mobile App UI Design' : '手機應用 UI 設計',
                budget: '$3,000 - $5,000',
                skills: ['Figma', 'UI/UX', 'Mobile Design'],
                deadline: '2024-01-20',
              },
              {
                title: language === 'en' ? 'Marketing Campaign Strategy' : '行銷活動策略',
                budget: '$2,000 - $4,000',
                skills: ['Digital Marketing', 'SEO', 'Content Writing'],
                deadline: '2024-01-25',
              },
            ],
          };
          break;

        case 'milestone':
          endpoint = '/emails/milestone-reminder';
          body = {
            ...body,
            projectTitle: language === 'en' ? 'E-commerce Platform Development' : '電商平台開發',
            milestonesCompleted: 2,
            totalMilestones: 5,
            nextMilestone: language === 'en' ? 'Complete product page design' : '完成產品頁面設計',
            daysRemaining: 5,
          };
          break;

        case 'message':
          endpoint = '/emails/message-notification';
          body = {
            ...body,
            senderName: language === 'en' ? 'John Client' : '客戶張三',
            messagePreview: language === 'en' 
              ? 'Hi! I reviewed your proposal and would like to discuss further. Can we schedule a call?'
              : '您好！我已經查看了您的提��，想進一步討論。我們可以安排一次通話嗎？',
            projectTitle: language === 'en' ? 'Website Redesign Project' : '網站重新設計項目',
          };
          break;

        case 'system':
          endpoint = '/emails/system-notification';
          body = {
            ...body,
            title: language === 'en' ? 'New Feature Released' : '新功能發布',
            message: language === 'en'
              ? 'We\'ve just launched our new project recommendation engine! Get personalized project matches based on your skills and experience.'
              : '我們剛剛推出了新的項目推薦引擎！根據您的技能和經驗獲得個性化的項目匹配。',
            type: 'success',
            actionButton: {
              text: language === 'en' ? 'Explore Now' : '立即探索',
              url: '#',
            },
          };
          break;

        default:
          throw new Error('Unknown email type');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setResult({ type: 'success', message: content.success });
      } else {
        setResult({ type: 'error', message: data.error || content.error });
      }
    } catch (error: any) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">{content.title}</h1>
        <p className="text-gray-600">{content.subtitle}</p>
      </div>

      {result && (
        <div className={`mb-6 p-4 rounded-lg ${
          result.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {result.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(content.sections).map(([key, section]) => (
          <EmailCard
            key={key}
            type={key}
            title={section.title}
            description={section.desc}
            icon={section.icon}
            onSend={sendTestEmail}
            sending={sending}
            buttonText={sending ? content.sending : content.send}
            emailPlaceholder={content.emailPlaceholder}
            language={language}
          />
        ))}
      </div>
    </div>
  );
}

export default EmailIntegrationPanel;

interface EmailCardProps {
  type: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  onSend: (type: string, email: string) => void;
  sending: boolean;
  buttonText: string;
  emailPlaceholder: string;
  language: 'en' | 'zh';
}

function EmailCard({ 
  type, 
  title, 
  description, 
  icon: Icon, 
  onSend, 
  sending, 
  buttonText,
  emailPlaceholder,
  language 
}: EmailCardProps) {
  const [email, setEmail] = useState('');
  const [localSending, setLocalSending] = useState(false);

  const handleSend = async () => {
    if (!email || !email.includes('@')) {
      alert(language === 'en' ? 'Please enter a valid email' : '請輸入有效的郵件地址');
      return;
    }

    setLocalSending(true);
    await onSend(type, email);
    setLocalSending(false);
    setEmail('');
  };

  const iconColors: Record<string, string> = {
    welcome: 'text-green-600 bg-green-100',
    monthly: 'text-blue-600 bg-blue-100',
    recommendations: 'text-purple-600 bg-purple-100',
    milestone: 'text-orange-600 bg-orange-100',
    message: 'text-pink-600 bg-pink-100',
    system: 'text-indigo-600 bg-indigo-100',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 rounded-lg ${iconColors[type] || 'text-gray-600 bg-gray-100'} flex items-center justify-center mb-4`}>
        <Icon size={24} />
      </div>
      
      <h3 className="text-xl mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      
      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={emailPlaceholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          disabled={sending || localSending}
        />
        
        <button
          onClick={handleSend}
          disabled={sending || localSending || !email}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {localSending ? (language === 'en' ? 'Sending...' : '發送中...') : buttonText}
        </button>
      </div>
    </div>
  );
}