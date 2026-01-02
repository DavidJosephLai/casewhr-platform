import { Card } from './ui/card';
import { toast } from 'sonner';
import { Mail, Send, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function EmailTestPage() {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('password-reset');

  const emailTypes = [
    { id: 'password-reset', name: '密碼重設 OTP / Password Reset OTP', emoji: '🔐' },
    { id: 'welcome', name: '歡迎郵件 / Welcome Email', emoji: '🎉' },
    { id: 'deliverable', name: '交付物通知 / Deliverable Notice', emoji: '📦' },
    { id: 'proposal', name: '提案通知 / Proposal Notice', emoji: '💼' },
    { id: 'payment', name: '付款通知 / Payment Notice', emoji: '💰' },
  ];

  const handleSendTestEmail = async () => {
    if (!email) {
      toast.error(language === 'en' ? 'Please enter your email' : '請輸入您的郵箱');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(language === 'en' ? 'Invalid email format' : '郵箱格式無效');
      return;
    }

    setLoading(true);

    try {
      let response;

      if (selectedType === 'password-reset') {
        // 測試密碼重設 OTP 郵件
        response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/password-reset/send-otp`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              email,
              language,
            }),
          }
        );
      } else {
        // 測試其他類型的增強版郵件
        response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/test-enhanced-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              email,
              type: selectedType,
              language,
            }),
          }
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast.success(
        language === 'en'
          ? `✅ Test email sent to ${email}! Check your inbox.`
          : `✅ 測試郵件已發送到 ${email}！請檢查您的收件箱。`
      );
    } catch (error: any) {
      console.error('❌ Email test error:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to send test email' : '發送測試郵件失敗'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'en' ? '📧 Email Template Tester' : '📧 郵件模板測試器'}
          </h1>
          <p className="text-gray-600">
            {language === 'en'
              ? 'Test all email templates with the new CaseWHR logo'
              : '測試所有帶有新 CaseWHR LOGO 的郵件模板'}
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-6 shadow-xl">
          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {language === 'en' ? '📬 Your Email Address' : '📬 您的郵箱地址'}
              </label>
              <Input
                type="email"
                placeholder={language === 'en' ? 'your@email.com' : '您的郵箱@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Email Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {language === 'en' ? '📋 Select Email Template' : '📋 選擇郵件模板'}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {emailTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.emoji}</span>
                      <span className="font-medium text-gray-900">{type.name}</span>
                      {selectedType === type.id && (
                        <div className="ml-auto">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">ℹ️</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {language === 'en' ? 'What will be tested?' : '將測試什麼？'}
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>✅ {language === 'en' ? 'CaseWHR logo display' : 'CaseWHR LOGO 顯示'}</li>
                    <li>✅ {language === 'en' ? 'Bilingual content (中/EN)' : '雙語內容（中/EN）'}</li>
                    <li>✅ {language === 'en' ? 'Professional design' : '專業設計'}</li>
                    <li>✅ {language === 'en' ? 'Mobile responsive layout' : '手機響應式佈局'}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendTestEmail}
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-6 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {language === 'en' ? 'Sending...' : '發送中...'}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {language === 'en' ? 'Send Test Email' : '發送測試郵件'}
                </>
              )}
            </Button>

            {/* Note */}
            <p className="text-xs text-center text-gray-500">
              {language === 'en'
                ? '💡 Tip: Check your spam folder if you don\'t see the email in your inbox'
                : '💡 提示：如果收件箱中沒有看到郵件，請檢查垃圾郵件夾'}
            </p>
          </div>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            {language === 'en' ? 'Email system ready' : '郵件系統就緒'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailTestPage;