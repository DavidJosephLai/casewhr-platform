import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { 
  Palette, 
  Upload, 
  Crown,
  Image as ImageIcon,
  Globe,
  Mail,
  FileText,
  Check,
  X,
  Eye,
  Sparkles,
  Info,
  Copy
} from 'lucide-react';

interface BrandingConfig {
  id: string;
  user_id: string;
  company_name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  custom_domain?: string;
  email_footer?: string;
  created_at: string;
  updated_at: string;
}

interface BrandingSettingsProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function BrandingSettings({ language = 'en' }: BrandingSettingsProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  console.log('🎨 [BrandingSettings] Component rendered!', { user: user?.id, accessToken: accessToken?.substring(0, 20), language });
  
  const [formData, setFormData] = useState({
    company_name: '',
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    accent_color: '#ec4899',
    custom_domain: '',
    email_footer: ''
  });

  const translations = {
    en: {
      title: 'Custom Branding',
      enterpriseOnly: 'Enterprise Only',
      upgrade: 'Upgrade to Enterprise',
      upgradeDesc: 'Customize your brand identity with your own logo, colors, and domain! Available exclusively for Enterprise plan.',
      companyName: 'Company Name',
      companyNamePlaceholder: 'Your Company Name',
      logo: 'Company Logo',
      uploadLogo: 'Upload Logo',
      changeLogo: 'Change Logo',
      removeLogo: 'Remove Logo',
      logoSpecs: 'Recommended: PNG or JPG, max 2MB, 500x500px',
      brandColors: 'Brand Colors',
      primaryColor: 'Primary Color',
      secondaryColor: 'Secondary Color',
      accentColor: 'Accent Color',
      customDomain: 'Custom Domain',
      customDomainPlaceholder: 'your-company.com',
      domainNotConfigured: 'Domain not configured yet',
      emailBranding: 'Email Branding',
      emailFooter: 'Custom Email Footer',
      emailFooterPlaceholder: 'Add custom text to all emails...',
      preview: 'Preview',
      previewTitle: 'Brand Preview',
      save: 'Save Changes',
      saving: 'Saving...',
      saved: 'Branding settings saved successfully',
      uploadSuccess: 'Logo uploaded successfully',
      uploadError: 'Failed to upload logo',
      benefits: {
        title: 'Enterprise Branding Benefits:',
        items: [
          'Custom logo on all communications',
          'Brand colors throughout the platform',
          'Custom domain for your workspace',
          'Branded email templates',
          'Branded invoices and documents',
          'Professional brand consistency'
        ]
      },
      preview_sections: {
        email: 'Email Template',
        invoice: 'Invoice',
        profile: 'Public Profile'
      }
    },
    zh: {
      title: '自訂品牌',
      enterpriseOnly: '企業版專屬',
      upgrade: '升級至企業版',
      upgradeDesc: '使用您自己的 Logo、顏色和網域自訂品牌識別！僅限企業版方案。',
      companyName: '公司名稱',
      companyNamePlaceholder: '您的公司名稱',
      logo: '公司 Logo',
      uploadLogo: '上傳 Logo',
      changeLogo: '更換 Logo',
      removeLogo: '移除 Logo',
      logoSpecs: '建議：PNG 或 JPG，最大 2MB，500x500px',
      brandColors: '品牌顏色',
      primaryColor: '主要顏色',
      secondaryColor: '次要顏色',
      accentColor: '強調顏色',
      customDomain: '自訂網域',
      customDomainPlaceholder: 'your-company.com',
      domainNotConfigured: '網域尚未配置',
      emailBranding: '郵件品牌',
      emailFooter: '自訂郵件頁尾',
      emailFooterPlaceholder: '在所有郵件中添加自訂文字...',
      preview: '預覽',
      previewTitle: '品牌預覽',
      save: '儲存變更',
      saving: '儲存中...',
      saved: '品牌設置已成功儲存',
      uploadSuccess: 'Logo 上傳成功',
      uploadError: 'Logo 上傳失敗',
      benefits: {
        title: '企業版品牌優勢：',
        items: [
          '所有通訊中顯示自訂 Logo',
          '平台全面使用品牌顏色',
          '工作區自訂網域',
          '品牌化郵件模板',
          '品牌化發票和文件',
          '專業品牌一致性'
        ]
      },
      preview_sections: {
        email: '郵件模板',
        invoice: '發票',
        profile: '公開檔案'
      }
    },
    'zh-TW': {
      title: '自訂品牌',
      enterpriseOnly: '企業版專屬',
      upgrade: '升級至企業版',
      upgradeDesc: '使用您自己的 Logo、顏色和網域自訂品牌識別！僅限企業版案。',
      companyName: '公司名稱',
      companyNamePlaceholder: '您的公司名稱',
      logo: '公司 Logo',
      uploadLogo: '上傳 Logo',
      changeLogo: '更換 Logo',
      removeLogo: '移除 Logo',
      logoSpecs: '建議：PNG 或 JPG，最大 2MB，500x500px',
      brandColors: '品牌顏色',
      primaryColor: '主要顏色',
      secondaryColor: '次要顏色',
      accentColor: '強調顏色',
      customDomain: '自訂網域',
      customDomainPlaceholder: 'your-company.com',
      domainNotConfigured: '網域尚未配置',
      emailBranding: '郵件品牌',
      emailFooter: '自訂郵件頁尾',
      emailFooterPlaceholder: '在所有郵件中添加自訂文字...',
      preview: '預覽',
      previewTitle: '品牌預覽',
      save: '儲存變更',
      saving: '儲存中...',
      saved: '品牌設置已成功儲存',
      uploadSuccess: 'Logo 上傳成功',
      uploadError: 'Logo 上傳失敗',
      benefits: {
        title: '企業版品牌優勢：',
        items: [
          '所有通訊中顯示自訂 Logo',
          '平台全面使用品牌顏色',
          '工作區自訂網域',
          '品牌化郵件模板',
          '品牌化發票和文件',
          '專業品牌一致性'
        ]
      },
      preview_sections: {
        email: '郵件模板',
        invoice: '發票',
        profile: '公開檔案'
      }
    },
    'zh-CN': {
      title: '自定义品牌',
      enterpriseOnly: '企业版专属',
      upgrade: '升级至企业版',
      upgradeDesc: '使用您自己的 Logo、颜色和域名自定义品牌识别！仅限企业版方案。',
      companyName: '公司名称',
      companyNamePlaceholder: '您的公司名称',
      logo: '公司 Logo',
      uploadLogo: '上传 Logo',
      changeLogo: '更换 Logo',
      removeLogo: '移除 Logo',
      logoSpecs: '建议：PNG 或 JPG，最大 2MB，500x500px',
      brandColors: '品牌颜色',
      primaryColor: '主要颜色',
      secondaryColor: '次要颜色',
      accentColor: '强调颜色',
      customDomain: '自定义域名',
      customDomainPlaceholder: 'your-company.com',
      domainNotConfigured: '域名尚未配置',
      emailBranding: '邮件品牌',
      emailFooter: '自定义邮件页尾',
      emailFooterPlaceholder: '在所有邮件中添加自定义文字...',
      preview: '预览',
      previewTitle: '品牌预览',
      save: '保存更改',
      saving: '保存中...',
      saved: '品牌设置已成功保存',
      uploadSuccess: 'Logo 上传成功',
      uploadError: 'Logo 上传失败',
      benefits: {
        title: '企业版品牌优势：',
        items: [
          '所有通讯中显示自定义 Logo',
          '平台全面使用品牌颜色',
          '工作区自定义域名',
          '品牌化邮件模板',
          '品牌化发票和文档',
          '专业品牌一致性'
        ]
      },
      preview_sections: {
        email: '邮件模板',
        invoice: '发票',
        profile: '公开档案'
      }
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    if (user && accessToken) {
      fetchData();
    }
  }, [user, accessToken]);

  const fetchData = async () => {
    if (!accessToken) {
      console.log('ℹ️ [BrandingSettings] No access token - user not logged in');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Fetch subscription
      console.log('🔍 [BrandingSettings] Fetching subscription for user:', user?.id);
      const subResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (subResponse.ok) {
        const subData = await subResponse.json();
        console.log('✅ [BrandingSettings] Subscription data received:', subData);
        console.log('📊 [BrandingSettings] Subscription plan:', subData.subscription?.plan);
        setSubscription(subData.subscription);
      } else {
        // 401 錯誤時靜默處理，不顯示警告
        if (subResponse.status !== 401) {
          console.warn('⚠️ [BrandingSettings] Failed to fetch subscription: ' + subResponse.status);
        }
        // 使用默認訂閱（免費方案）
        setSubscription({
          plan: 'free',
          status: 'active',
          features: []
        });
      }

      // Fetch branding settings if enterprise
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken;
      }

      const brandingResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding`,
        { headers }
      );

      if (brandingResponse.ok) {
        const brandingData = await brandingResponse.json();
        console.log('✅ [BrandingSettings] Branding data received:', brandingData);
        const brandingSettings = brandingData.branding || brandingData.settings;
        if (brandingSettings) {
          setBranding(brandingSettings);
          setFormData({
            company_name: brandingSettings.company_name || brandingSettings.workspace_name || '',
            primary_color: brandingSettings.primary_color || '#6366f1',
            secondary_color: brandingSettings.secondary_color || '#8b5cf6',
            accent_color: brandingSettings.accent_color || '#ec4899',
            custom_domain: brandingSettings.custom_domain || '',
            email_footer: brandingSettings.email_footer || ''
          });
        }
      } else {
        console.warn('⚠️ [BrandingSettings] Failed to fetch branding: ' + brandingResponse.status);
      }
    } catch (error) {
      console.error('❌ [BrandingSettings] Error fetching branding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📤 [BrandingSettings] File upload triggered!', { file: file?.name, size: file?.size });
    
    if (!file) {
      console.log('⚠️ [BrandingSettings] No file selected');
      return;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error(language === 'en' ? 'Please upload an image file' : '請上傳圖片檔案');
      console.error('❌ [BrandingSettings] Invalid file type:', file.type);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === 'en' ? 'File size must be less than 2MB' : '檔案大小必須小於 2MB');
      console.error('❌ [BrandingSettings] File too large:', file.size);
      return;
    }

    setUploading(true);
    toast.info(language === 'en' ? `Uploading ${file.name}...` : `正在上傳 ${file.name}...`, { duration: 2000 });
    
    try {
      console.log('📤 [BrandingSettings] Starting logo upload...', { fileName: file.name, fileSize: file.size });
      
      const formDataObj = new FormData();
      formDataObj.append('file', file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding/logo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formDataObj,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [BrandingSettings] Upload failed:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('✅ [BrandingSettings] Upload successful:', data);
      
      // Update branding state immediately
      setBranding(prev => prev ? { ...prev, logo_url: data.logo_url } : null);
      
      toast.success(t.uploadSuccess);
      
      // Notify other components about branding update
      window.dispatchEvent(new Event('branding-updated'));
      console.log('📣 [BrandingSettings] Dispatched branding-updated event');
      
      // Refresh all data to ensure consistency
      await fetchData();
    } catch (error: any) {
      console.error('❌ [BrandingSettings] Error uploading logo:', error);
      toast.error(error.message || t.uploadError);
    } finally {
      setUploading(false);
      // Clear the file input so the same file can be uploaded again if needed
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding/logo`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove logo');
      }

      setBranding(prev => prev ? { ...prev, logo_url: undefined } : null);
      toast.success(language === 'en' ? 'Logo removed' : 'Logo 已移除');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error(language === 'en' ? 'Failed to remove logo' : '移除 Logo 失敗');
    }
  };

  const handleSave = async () => {
    if (!formData.company_name.trim()) {
      toast.error(language === 'en' ? 'Company name is required' : '公司名稱為必填');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save branding');
      }

      toast.success(t.saved);
      fetchData();
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error(language === 'en' ? 'Failed to save branding' : '儲存品牌設置失敗');
    } finally {
      setSaving(false);
    }
  };

  const isEnterprise = subscription?.plan === 'enterprise';
  
  console.log('🔍 [BrandingSettings] isEnterprise check:', {
    subscription,
    plan: subscription?.plan,
    isEnterprise,
    loading
  });

  if (!isEnterprise) {
    console.log('⚠️ [BrandingSettings] Showing upgrade prompt - not enterprise');
    return (
      <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Crown className="size-8 text-purple-600" />
            <h3 className="text-2xl text-purple-900">{t.title}</h3>
          </div>
          <Badge className="bg-purple-600 text-white">
            {t.enterpriseOnly}
          </Badge>
          <p className="text-purple-800 max-w-md mx-auto">
            {t.upgradeDesc}
          </p>
          
          {/* 🔍 Debug Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4 text-xs text-left max-w-md mx-auto">
            <div className="font-semibold text-yellow-900 mb-2">🔍 Debug Info:</div>
            <div className="space-y-1 text-yellow-800 font-mono text-[10px]">\n              <div>User ID: {user?.id}</div>
              <div>Plan: {subscription?.plan || 'null'}</div>
              <div>Subscription: {JSON.stringify(subscription, null, 2)}</div>
            </div>
          </div>
          
          <div className="bg-white/50 rounded-lg p-6 mt-6">
            <h4 className="font-semibold text-purple-900 mb-4">{t.benefits.title}</h4>
            <ul className="text-left space-y-2 max-w-md mx-auto">
              {t.benefits.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-purple-800">
                  <Sparkles className="size-5 text-purple-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    );
  }

  console.log('✅ [BrandingSettings] Showing branding settings - is enterprise');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            {language === 'en' ? 'Loading...' : '載入中...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Palette className="size-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{t.title}</CardTitle>
                <CardDescription className="mt-1">
                  {language === 'en' 
                    ? 'Customize your brand identity across the platform'
                    : '在平台上自訂您的品牌識別'}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-purple-600">{t.enterpriseOnly}</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          {/* Company Name */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.companyName}</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder={t.companyNamePlaceholder}
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="size-5" />
                {t.logo}
              </CardTitle>
              <CardDescription>{t.logoSpecs}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {branding?.logo_url ? (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                    <img 
                      src={branding.logo_url} 
                      alt="Company Logo" 
                      className="max-h-32 mx-auto"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log('🔘 [BrandingSettings] Change Logo button clicked!');
                        toast.info(language === 'en' ? 'Opening file picker...' : '開啟檔案選擇器...', { duration: 1000 });
                        fileInputRef.current?.click();
                      }}
                      disabled={uploading}
                      className="flex-1"
                    >
                      <Upload className="size-4 mr-2" />
                      {t.changeLogo}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRemoveLogo}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="size-4 mr-2" />
                      {t.removeLogo}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log('🔘 [BrandingSettings] Upload Logo button clicked!');
                    console.log('🔘 [BrandingSettings] fileInputRef.current:', fileInputRef.current);
                    toast.info(language === 'en' ? 'Opening file picker...' : '開啟檔案選擇器...', { duration: 1000 });
                    fileInputRef.current?.click();
                  }}
                  disabled={uploading}
                  className="w-full h-32 border-2 border-dashed"
                >
                  {uploading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {language === 'en' ? 'Uploading...' : '上傳中...'}
                    </>
                  ) : (
                    <>
                      <Upload className="size-6 mr-2" />
                      {t.uploadLogo}
                    </>
                  )}
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Brand Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="size-5" />
                {t.brandColors}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t.primaryColor}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.secondaryColor}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.accentColor}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Domain */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="size-5" />
                {t.customDomain}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder={t.customDomainPlaceholder}
                value={formData.custom_domain}
                onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                {t.domainNotConfigured}
              </p>
            </CardContent>
          </Card>

          {/* Email Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="size-5" />
                {t.emailBranding}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>{t.emailFooter}</Label>
                <Textarea
                  placeholder={t.emailFooterPlaceholder}
                  value={formData.email_footer}
                  onChange={(e) => setFormData({ ...formData, email_footer: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            {saving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {t.saving}
              </>
            ) : (
              <>
                <Check className="size-4 mr-2" />
                {t.save}
              </>
            )}
          </Button>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="size-5" />
                {t.previewTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Preview */}
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <h4 className="text-sm font-semibold mb-3 text-gray-700">
                  {t.preview_sections.email}
                </h4>
                <div 
                  className="p-4 rounded border"
                  style={{ borderColor: formData.primary_color }}
                >
                  {branding?.logo_url && (
                    <div className="mb-3 flex justify-center">
                      <img 
                        src={branding.logo_url} 
                        alt="Logo" 
                        className="h-12 object-contain"
                        onError={(e) => {
                          console.error('❌ [Preview] Email logo failed to load:', branding.logo_url);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('✅ [Preview] Email logo loaded successfully');
                        }}
                      />
                    </div>
                  )}
                  {!branding?.logo_url && (
                    <div className="mb-3 text-center text-xs text-gray-400 italic">
                      {language === 'en' ? 'Logo will appear here' : 'Logo 會顯示在這裡'}
                    </div>
                  )}
                  <div 
                    className="text-xl font-semibold mb-2"
                    style={{ color: formData.primary_color }}
                  >
                    {formData.company_name || 'Your Company'}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {language === 'en' ? 'Sample email content...' : '範例郵件內容...'}
                  </div>
                  <div 
                    className="text-xs pt-3 border-t"
                    style={{ borderColor: formData.secondary_color }}
                  >
                    {formData.email_footer || (language === 'en' ? 'Custom footer text' : '自訂頁尾文字')}
                  </div>
                </div>
              </div>

              {/* Invoice Preview */}
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <h4 className="text-sm font-semibold mb-3 text-gray-700">
                  {t.preview_sections.invoice}
                </h4>
                <div className="border rounded p-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      {branding?.logo_url ? (
                        <img 
                          src={branding.logo_url} 
                          alt="Logo" 
                          className="h-8 object-contain"
                          onError={(e) => {
                            console.error('❌ [Preview] Invoice logo failed to load:', branding.logo_url);
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('✅ [Preview] Invoice logo loaded successfully');
                          }}
                        />
                      ) : (
                        <div className="text-xs text-gray-400 italic">
                          {language === 'en' ? 'Logo' : 'Logo'}
                        </div>
                      )}
                    </div>
                    <div 
                      className="text-lg font-semibold"
                      style={{ color: formData.primary_color }}
                    >
                      {language === 'en' ? 'INVOICE' : '發票'}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">{formData.company_name || 'Your Company'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {language === 'en' ? 'Invoice details...' : '發票詳情...'}
                    </div>
                  </div>
                  <div 
                    className="mt-3 pt-2 border-t text-xs font-semibold"
                    style={{ 
                      borderColor: formData.accent_color,
                      color: formData.accent_color 
                    }}
                  >
                    {language === 'en' ? 'Total: $1,000.00' : '總計：$1,000.00'}
                  </div>
                </div>
              </div>

              {/* Color Palette Preview */}
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <h4 className="text-sm font-semibold mb-3 text-gray-700">
                  {language === 'en' ? 'Color Palette' : '顏色配置'}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div 
                      className="h-16 rounded mb-1"
                      style={{ backgroundColor: formData.primary_color }}
                    />
                    <div className="text-xs text-gray-600">{t.primaryColor}</div>
                  </div>
                  <div className="text-center">
                    <div 
                      className="h-16 rounded mb-1"
                      style={{ backgroundColor: formData.secondary_color }}
                    />
                    <div className="text-xs text-gray-600">{t.secondaryColor}</div>
                  </div>
                  <div className="text-center">
                    <div 
                      className="h-16 rounded mb-1"
                      style={{ backgroundColor: formData.accent_color }}
                    />
                    <div className="text-xs text-gray-600">{t.accentColor}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}