import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Mail, Send, Sparkles } from 'lucide-react';

export function EnhancedEmailTester() {
  const [email, setEmail] = useState('');
  const [emailType, setEmailType] = useState('welcome');
  const [language, setLanguage] = useState('zh');
  const [sending, setSending] = useState(false);

  const emailTypes = [
    { value: 'welcome', label: '🎉 歡迎郵件 Welcome Email', description: '新用戶註冊時發送' },
    { value: 'monthly-report', label: '📊 月度報告 Monthly Report', description: '用戶活動統計報告' },
    { value: 'project-recommendation', label: '🎯 項目推薦 Project Recommendations', description: '推薦符合技能的項目' },
    { value: 'milestone-reminder', label: '🎊 里程碑提醒 Milestone Reminder', description: '項目進度提醒' },
    { value: 'message-notification', label: '💌 訊息通知 Message Notification', description: '新訊息通知' },
    { value: 'system-notification', label: '🔔 系統通知 System Notification', description: '系統公告和維護通知' },
  ];

  const handleSendTestEmail = async () => {
    if (!email) {
      toast.error('請輸入郵件地址');
      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/test-enhanced-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email,
            type: emailType,
            language,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(
          <div>
            <div className="font-bold">郵件發送成功！📧</div>
            <div className="text-sm mt-1">
              已發送到：{email}
            </div>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(
          <div>
            <div className="font-bold">郵件發送失敗</div>
            <div className="text-sm mt-1">{data.error || '未知錯誤'}</div>
          </div>,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast.error('發送失敗，請檢查網絡連接');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">增強版郵件測試工具</h2>
          <p className="text-sm text-gray-600">測試新的豐富郵件模板</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">郵件地址 *</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="emailType">郵件類型</Label>
          <Select value={emailType} onValueChange={setEmailType}>
            <SelectTrigger id="emailType" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {emailTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div>{type.label}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            {emailTypes.find(t => t.value === emailType)?.description}
          </p>
        </div>

        <div>
          <Label htmlFor="language">語言</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh">🇹🇼 繁體中文</SelectItem>
              <SelectItem value="en">🇺🇸 English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">郵件特色：</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✨ 現代化的視覺設計與漸變色</li>
            <li>📊 數據統計與進度條</li>
            <li>🎨 品牌色彩與專業排版</li>
            <li>📱 響應式設計，支持手機端</li>
            <li>🔗 社交媒體鏈接與互動按鈕</li>
            <li>🌐 完整的中英雙語支持</li>
          </ul>
        </div>

        <Button
          onClick={handleSendTestEmail}
          disabled={sending || !email}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              發送中...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              發送測試郵件
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 提示</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 郵件將通過 Brevo SMTP 服務發送</li>
          <li>• 請確保 BREVO_API_KEY 已在環境變數中設置</li>
          <li>• 檢查垃圾郵件夾如果沒有收到郵件</li>
          <li>• 所有郵件都包含專業的品牌設計和互動元素</li>
        </ul>
      </div>
    </Card>
  );
}