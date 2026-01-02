import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { 
  Mail, 
  FileText, 
  Globe, 
  MessageSquare,
  Eye,
  Sparkles,
  Send
} from 'lucide-react';

interface BrandingConfig {
  logo_url?: string;
  company_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  email_footer?: string;
}

interface BrandPreviewProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function BrandPreview({ language = 'en' }: BrandPreviewProps) {
  const { user, accessToken } = useAuth();
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  console.log('🎨 [BrandPreview] Component rendered with language:', language);

  const translations = {
    en: {
      title: 'Brand Preview',
      description: 'See how your brand appears across the platform',
      emailTab: 'Email Templates',
      invoiceTab: 'Invoices',
      profileTab: 'Public Profile',
      messagesTab: 'Messages',
      sampleEmail: 'Sample Welcome Email',
      sampleInvoice: 'Sample Invoice',
      emailSubject: 'Welcome to Our Platform!',
      emailBody: 'Thank you for joining us. We\'re excited to have you on board!',
      invoiceNumber: 'Invoice #INV-2024-001',
      invoiceDate: 'Date: Jan 15, 2024',
      invoiceAmount: 'Total: $1,000.00',
      profileHeader: 'Company Profile',
      profileDescription: 'Your public company profile page',
      noLogo: 'No logo uploaded yet',
      uploadLogo: 'Upload your company logo in Brand Settings to see it here',
      sendTestEmail: 'Send Test Team Invitation',
      sending: 'Sending...',
      testEmailSuccess: 'Test team invitation email sent successfully!',
      testEmailError: 'Failed to send test email',
    },
    zh: {
      title: '品牌預覽',
      description: '查看您的品牌在平台各處的顯示效果',
      emailTab: '郵件模板',
      invoiceTab: '發票',
      profileTab: '公開檔案',
      messagesTab: '訊息',
      sampleEmail: '範例歡迎郵件',
      sampleInvoice: '範例發票',
      emailSubject: '歡迎加入我們的平台！',
      emailBody: '感謝您的加入。我們很高興您能成為我們的一員！',
      invoiceNumber: '發票編號 #INV-2024-001',
      invoiceDate: '日期：2024年1月15日',
      invoiceAmount: '總計：$1,000.00',
      profileHeader: '公司檔案',
      profileDescription: '您的公開公司檔案頁面',
      noLogo: '尚未上傳 Logo',
      uploadLogo: '在品牌設置中上傳您的公司 Logo 即可在此處顯示',
      sendTestEmail: '發送測試團隊邀請郵件',
      sending: '發送中...',
      testEmailSuccess: '測試團隊邀請郵件已成功發送！',
      testEmailError: '發送測試郵件失敗',
    },
    'zh-TW': {
      title: '品牌預覽',
      description: '查看您的品牌在平台各處的顯示效果',
      emailTab: '郵件模板',
      invoiceTab: '發票',
      profileTab: '公開檔案',
      messagesTab: '訊息',
      sampleEmail: '範例歡迎郵件',
      sampleInvoice: '範例發票',
      emailSubject: '歡迎加入我們的平台！',
      emailBody: '感謝您的加入。我們很高興您能成為我們的一員！',
      invoiceNumber: '發票編號 #INV-2024-001',
      invoiceDate: '日期：2024年1月15日',
      invoiceAmount: '總計：$1,000.00',
      profileHeader: '公司檔案',
      profileDescription: '您的公開公司檔案頁面',
      noLogo: '尚未上傳 Logo',
      uploadLogo: '在品牌設置中上傳您的公司 Logo 即可在此處顯示',
      sendTestEmail: '發送測試團隊邀請郵件',
      sending: '發送中...',
      testEmailSuccess: '測試團隊邀請郵件已成功發送！',
      testEmailError: '發送測試郵件失敗',
    },
    'zh-CN': {
      title: '品牌预览',
      description: '查看您的品牌在平台各处的显示效果',
      emailTab: '邮件模板',
      invoiceTab: '发票',
      profileTab: '公开档案',
      messagesTab: '讯息',
      sampleEmail: '范例欢迎邮件',
      sampleInvoice: '范例发票',
      emailSubject: '欢迎加入我们的平台！',
      emailBody: '感谢您的加入。我们很高兴您能成为我们的一员！',
      invoiceNumber: '发票编号 #INV-2024-001',
      invoiceDate: '日期：2024年1月15日',
      invoiceAmount: '总计：$1,000.00',
      profileHeader: '公司档案',
      profileDescription: '您的公开公司档案页面',
      noLogo: '尚未上传 Logo',
      uploadLogo: '在品牌设置中上传您的公司 Logo 即可在此处显示',
      sendTestEmail: '发送测试团队邀请邮件',
      sending: '发送中...',
      testEmailSuccess: '测试团队邀请邮件已成功发送！',
      testEmailError: '发送测试邮件失败',
    }
  };

  const t = translations[language] || translations.en;

  // Initial fetch on mount
  useEffect(() => {
    if (user && accessToken) {
      fetchBranding();
    }
  }, [user, accessToken]);

  const fetchBranding = async () => {
    if (!user || !accessToken) {
      console.log('ℹ️ [BrandPreview] No user or access token - user not logged in');
      setLoading(false);
      return;
    }
    
    try {
      console.log('🎨 [BrandPreview] Fetching branding for user:', user.id);
      
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [BrandPreview] Branding data received:', data);
        console.log('🖼️ [BrandPreview] Logo URL:', data.branding?.logo_url || data.settings?.logo_url);
        console.log('🏢 [BrandPreview] Company name:', data.branding?.company_name || data.settings?.company_name);
        console.log('🎨 [BrandPreview] Colors:', {
          primary: data.branding?.primary_color || data.settings?.primary_color,
          secondary: data.branding?.secondary_color || data.settings?.secondary_color,
          accent: data.branding?.accent_color || data.settings?.accent_color
        });
        setBranding(data.branding || data.settings);
      } else {
        console.warn('⚠️ [BrandPreview] Failed to fetch branding: ' + response.status);
      }
    } catch (error) {
      console.error('❌ [BrandPreview] Error fetching branding:', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when component mounts or when user changes
  useEffect(() => {
    const handleBrandingUpdate = () => {
      console.log('🔄 [BrandPreview] Branding update event detected, refreshing...');
      fetchBranding();
    };

    window.addEventListener('branding-updated', handleBrandingUpdate);
    return () => window.removeEventListener('branding-updated', handleBrandingUpdate);
  }, [user, accessToken]);

  // Send test team invitation email
  const sendTestTeamInvitation = async () => {
    if (!user || !accessToken) return;

    setSending(true);
    try {
      console.log('📧 [BrandPreview] Sending test team invitation email...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/send-test-team-invitation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            to: user.email, // Send to self for testing
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [BrandPreview] Test email sent successfully:', data);
        toast.success(t.testEmailSuccess);
      } else {
        const error = await response.json();
        console.error('❌ [BrandPreview] Failed to send test email:', error);
        toast.error(t.testEmailError);
      }
    } catch (error) {
      console.error('❌ [BrandPreview] Error sending test email:', error);
      toast.error(t.testEmailError);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          {language === 'en' ? 'Loading...' : '載入中...'}
        </CardContent>
      </Card>
    );
  }

  if (!branding) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-8 text-center">
          <Eye className="size-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-blue-900 mb-2">{t.title}</h3>
          <p className="text-blue-700">{t.uploadLogo}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="size-5" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
            <Sparkles className="size-3 mr-1" />
            Live Preview
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="email">
              <Mail className="size-4 mr-2" />
              {t.emailTab}
            </TabsTrigger>
            <TabsTrigger value="invoice">
              <FileText className="size-4 mr-2" />
              {t.invoiceTab}
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Globe className="size-4 mr-2" />
              {t.profileTab}
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="size-4 mr-2" />
              {t.messagesTab}
            </TabsTrigger>
          </TabsList>

          {/* Email Preview */}
          <TabsContent value="email" className="space-y-4">
            {/* Test Button */}
            <div className="flex justify-end">
              <Button
                onClick={sendTestTeamInvitation}
                disabled={sending}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {sending ? (
                  <>
                    <Send className="size-4 animate-pulse" />
                    {t.sending}
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    {t.sendTestEmail}
                  </>
                )}
              </Button>
            </div>

            <div className="border-2 rounded-lg overflow-hidden bg-white shadow-lg">
              {/* Email Header */}
              <div 
                className="p-6 text-white"
                style={{
                  background: `linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%)`
                }}
              >
                {branding.logo_url && (
                  <div className="text-center mb-4">
                    <img 
                      src={branding.logo_url} 
                      alt={branding.company_name}
                      className="h-16 mx-auto object-contain"
                      onLoad={() => console.log('✅ [BrandPreview Email] Logo loaded:', branding.logo_url)}
                      onError={(e) => console.error('❌ [BrandPreview Email] Logo failed to load:', branding.logo_url, e)}
                    />
                  </div>
                )}
                {!branding.logo_url && console.log('⚠️ [BrandPreview Email] No logo URL available')}
                <h2 className="text-2xl text-center">{t.emailSubject}</h2>
              </div>
              
              {/* Email Body */}
              <div className="p-6 bg-gray-50">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <p className="text-gray-700 mb-4">Hello,</p>
                  <p className="text-gray-700 mb-4">{t.emailBody}</p>
                  <p className="text-gray-700">Best regards,<br/>{branding.company_name}</p>
                </div>
                
                {branding.email_footer && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
                    {branding.email_footer}
                  </div>
                )}
              </div>
              
              {/* Email Footer */}
              <div className="p-4 bg-gray-100 text-center text-xs text-gray-500">
                © 2024 {branding.company_name}
              </div>
            </div>
          </TabsContent>

          {/* Invoice Preview */}
          <TabsContent value="invoice" className="space-y-4">
            <div className="border-2 rounded-lg bg-white p-8 shadow-lg">
              {/* Invoice Header */}
              <div className="flex items-start justify-between mb-8 pb-4 border-b-2" style={{ borderColor: branding.primary_color }}>
                <div>
                  {branding.logo_url && (
                    <img 
                      src={branding.logo_url} 
                      alt={branding.company_name}
                      className="h-12 mb-2"
                    />
                  )}
                  <div className="font-bold text-lg">{branding.company_name}</div>
                </div>
                <div className="text-right">
                  <div 
                    className="text-2xl font-bold mb-1"
                    style={{ color: branding.primary_color }}
                  >
                    {language === 'en' ? 'INVOICE' : '發票'}
                  </div>
                  <div className="text-sm text-gray-600">{t.invoiceNumber}</div>
                  <div className="text-sm text-gray-600">{t.invoiceDate}</div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: branding.secondary_color }}>
                      <th className="text-left py-2">{language === 'en' ? 'Description' : '描述'}</th>
                      <th className="text-right py-2">{language === 'en' ? 'Amount' : '金額'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-3">{language === 'en' ? 'Professional Services' : '專業服務'}</td>
                      <td className="text-right">$1,000.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Invoice Total */}
              <div className="flex justify-end">
                <div 
                  className="text-xl font-bold px-6 py-3 rounded-lg"
                  style={{ 
                    backgroundColor: `${branding.accent_color}20`,
                    color: branding.accent_color,
                    borderLeft: `4px solid ${branding.accent_color}`
                  }}
                >
                  {t.invoiceAmount}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Profile Preview */}
          <TabsContent value="profile" className="space-y-4">
            <div className="border-2 rounded-lg overflow-hidden bg-white shadow-lg">
              {/* Profile Header */}
              <div 
                className="h-32"
                style={{
                  background: `linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%)`
                }}
              />
              
              {/* Profile Content */}
              <div className="p-6 -mt-16">
                {branding.logo_url ? (
                  <div className="bg-white w-32 h-32 rounded-xl shadow-xl p-4 mb-4 flex items-center justify-center border-4 border-white">
                    <img 
                      src={branding.logo_url} 
                      alt={branding.company_name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-32 h-32 rounded-xl shadow-xl mb-4 flex items-center justify-center border-4 border-white text-white text-2xl font-bold"
                    style={{ backgroundColor: branding.primary_color }}
                  >
                    {branding.company_name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                
                <h2 className="text-2xl font-bold mb-2">{branding.company_name}</h2>
                <p className="text-gray-600 mb-4">{t.profileDescription}</p>
                
                <div className="flex gap-2">
                  <div 
                    className="px-4 py-2 rounded-lg font-medium text-white"
                    style={{ backgroundColor: branding.primary_color }}
                  >
                    {language === 'en' ? 'View Projects' : '查看案件'}
                  </div>
                  <div 
                    className="px-4 py-2 rounded-lg font-medium"
                    style={{ 
                      backgroundColor: `${branding.secondary_color}20`,
                      color: branding.secondary_color 
                    }}
                  >
                    {language === 'en' ? 'Contact' : '聯絡'}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Messages Preview */}
          <TabsContent value="messages" className="space-y-4">
            <div className="border-2 rounded-lg bg-white shadow-lg">
              {/* Message Header */}
              <div 
                className="p-4 flex items-center gap-3"
                style={{ borderBottom: `2px solid ${branding.primary_color}20` }}
              >
                {branding.logo_url ? (
                  <img 
                    src={branding.logo_url} 
                    alt={branding.company_name}
                    className="size-10 rounded-lg object-contain"
                  />
                ) : (
                  <div 
                    className="size-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: branding.primary_color }}
                  >
                    {branding.company_name.substring(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold">{branding.company_name}</div>
                  <div className="text-xs text-gray-500">
                    {language === 'en' ? 'Active now' : '在線'}
                  </div>
                </div>
              </div>
              
              {/* Message Content */}
              <div className="p-6 space-y-4">
                <div className="flex gap-3">
                  {branding.logo_url ? (
                    <img 
                      src={branding.logo_url} 
                      alt={branding.company_name}
                      className="size-8 rounded-lg object-contain"
                    />
                  ) : (
                    <div 
                      className="size-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: branding.primary_color }}
                    >
                      {branding.company_name.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div 
                    className="flex-1 rounded-lg p-3"
                    style={{ backgroundColor: `${branding.primary_color}10` }}
                  >
                    <p className="text-sm">
                      {language === 'en' 
                        ? 'Hello! Thank you for your interest. How can we help you today?' 
                        : '您好！感謝您的關注。我們今天能為您做些什麼？'}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">10:30 AM</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}