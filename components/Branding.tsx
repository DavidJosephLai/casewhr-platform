import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { 
  Palette, 
  Upload,
  RefreshCw,
  Eye,
  Save,
  Image as ImageIcon,
  Type,
  Layout,
  Sparkles
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';

interface BrandingSettings {
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  workspace_name: string;
  custom_domain?: string;
}

interface BrandingProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function Branding({ language = 'en' }: BrandingProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState<BrandingSettings>({
    primary_color: '#7c3aed',
    secondary_color: '#ec4899',
    accent_color: '#06b6d4',
    font_family: 'Inter',
    workspace_name: 'My Workspace'
  });
  const [previewMode, setPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const translations = {
    en: {
      title: 'Custom Branding',
      subtitle: 'Personalize your workspace with your brand identity',
      save: 'Save Changes',
      preview: 'Preview',
      reset: 'Reset to Default',
      colors: 'Colors',
      logo: 'Logo & Identity',
      typography: 'Typography',
      layout: 'Layout',
      primaryColor: 'Primary Color',
      secondaryColor: 'Secondary Color',
      accentColor: 'Accent Color',
      uploadLogo: 'Upload Logo',
      workspaceName: 'Workspace Name',
      customDomain: 'Custom Domain',
      fontFamily: 'Font Family',
      saveSuccess: 'Branding settings saved successfully!',
      previewMode: 'Preview Mode',
      colorDescription: 'Choose colors that represent your brand',
      logoDescription: 'Upload your company logo and set your workspace name',
      typographyDescription: 'Select fonts and text styles',
      layoutDescription: 'Customize the layout and appearance'
    },
    zh: {
      title: '自訂品牌',
      subtitle: '使用品牌標識個人化您的工作空間',
      save: '保存更改',
      preview: '預覽',
      reset: '重置為默認',
      colors: '顏色',
      logo: '標誌與身份',
      typography: '字體',
      layout: '佈局',
      primaryColor: '主要顏色',
      secondaryColor: '次要顏色',
      accentColor: '強調顏色',
      uploadLogo: '上傳標誌',
      workspaceName: '工作空間名稱',
      customDomain: '自訂域名',
      fontFamily: '字體系列',
      saveSuccess: '品牌設置保存成功！',
      previewMode: '預覽模式',
      colorDescription: '選擇代表您品牌的顏色',
      logoDescription: '上傳您的公司標誌並設置工作空間名稱',
      typographyDescription: '選擇字體和文本樣式',
      layoutDescription: '自訂佈局和外觀'
    },
    'zh-TW': {
      title: '自訂品牌',
      subtitle: '使用品牌標識個人化您的工作空間',
      save: '保存更改',
      preview: '預覽',
      reset: '重置為默認',
      colors: '顏色',
      logo: '標誌與身份',
      typography: '字體',
      layout: '佈局',
      primaryColor: '主要顏色',
      secondaryColor: '次要顏色',
      accentColor: '強調顏色',
      uploadLogo: '上傳標誌',
      workspaceName: '工作空間名稱',
      customDomain: '自訂域名',
      fontFamily: '字體系列',
      saveSuccess: '品牌設置保存成功！',
      previewMode: '預覽模式',
      colorDescription: '選擇代表您品牌的顏色',
      logoDescription: '上傳您的公司標誌並設置工作空間名稱',
      typographyDescription: '選擇字體和文本樣式',
      layoutDescription: '自訂佈局和外觀'
    },
    'zh-CN': {
      title: '自定义品牌',
      subtitle: '使用品牌标识个性化您的工作空间',
      save: '保存更改',
      preview: '预览',
      reset: '重置为默认',
      colors: '颜色',
      logo: '标志与身份',
      typography: '字体',
      layout: '布局',
      primaryColor: '主要颜色',
      secondaryColor: '次要颜色',
      accentColor: '强调颜色',
      uploadLogo: '上传标志',
      workspaceName: '工作空间名称',
      customDomain: '自定义域名',
      fontFamily: '字体系列',
      saveSuccess: '品牌设置保存成功！',
      previewMode: '预览模式',
      colorDescription: '选择代表您品牌的颜色',
      logoDescription: '上传您的公司标志并设置工作空间名称',
      typographyDescription: '选择字体和文本样式',
      layoutDescription: '自定义布局和外观'
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchBrandingSettings();
  }, []);

  const fetchBrandingSettings = async () => {
    setLoading(true);
    try {
      // 🎁 開發模式支援 - 移除 mock logo_url
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        const mockSettings: BrandingSettings = {
          // logo_url: undefined, // 不設置假的 logo_url
          primary_color: '#7c3aed',
          secondary_color: '#ec4899',
          accent_color: '#06b6d4',
          font_family: 'Inter',
          workspace_name: 'CaseWHR Enterprise',
          custom_domain: 'enterprise.casewhr.com'
        };
        setSettings(mockSettings);
        setLoading(false);
        return;
      }

      // 從後端獲取真實數據
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
        console.log('✅ [Branding] Fetched settings:', data);
        setSettings(data.settings || settings);
      } else {
        console.log('ℹ️ [Branding] No saved settings, using defaults');
      }
    } catch (error) {
      console.error('Failed to fetch branding settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 🎁 開發模式
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        setTimeout(() => {
          toast.success(t.saveSuccess);
          setSaving(false);
        }, 500);
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
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(settings)
        }
      );

      if (response.ok) {
        toast.success(t.saveSuccess);
      }
    } catch (error) {
      console.error('Failed to save branding settings:', error);
      toast.error(language === 'en' ? 'Failed to save settings' : '保存設置失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      primary_color: '#7c3aed',
      secondary_color: '#ec4899',
      accent_color: '#06b6d4',
      font_family: 'Inter',
      workspace_name: 'My Workspace'
    });
    toast.success(language === 'en' ? 'Reset to default' : '已重置為默認值');
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📤 [Branding] Logo upload triggered!', { file: file?.name, size: file?.size });
    
    if (!file) {
      console.log('⚠️ [Branding] No file selected');
      return;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error(language === 'en' ? 'Please upload an image file' : '請上傳圖片檔案');
      console.error('❌ [Branding] Invalid file type:', file.type);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === 'en' ? 'File size must be less than 2MB' : '檔案大小必須小於 2MB');
      console.error('❌ [Branding] File too large:', file.size);
      return;
    }

    setUploading(true);
    toast.info(language === 'en' ? `Uploading ${file.name}...` : `正在上傳 ${file.name}...`, { duration: 2000 });
    
    try {
      console.log('📤 [Branding] Starting logo upload...', { fileName: file.name, fileSize: file.size });
      
      const formDataObj = new FormData();
      formDataObj.append('file', file);

      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken || '';
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding/logo`,
        {
          method: 'POST',
          headers,
          body: formDataObj,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Branding] Upload failed:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('✅ [Branding] Upload successful:', data);
      
      // Update settings immediately
      setSettings(prev => ({ ...prev, logo_url: data.logo_url }));
      
      toast.success(language === 'en' ? 'Logo uploaded successfully!' : 'Logo 上傳成功！');
      
      // 🔥 自動保存到後端
      console.log('💾 [Branding] Auto-saving settings after logo upload...');
      await handleSaveAfterUpload(data.logo_url);
      
    } catch (error: any) {
      console.error('❌ [Branding] Error uploading logo:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to upload logo' : 'Logo 上傳失敗'));
    } finally {
      setUploading(false);
      // Clear the file input so the same file can be uploaded again if needed
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // 上傳後自動保存設置
  const handleSaveAfterUpload = async (logoUrl: string) => {
    try {
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken || '';
      }

      const updatedSettings = { ...settings, logo_url: logoUrl };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(updatedSettings)
        }
      );

      if (response.ok) {
        console.log('✅ [Branding] Settings auto-saved successfully');
        toast.success(language === 'en' ? 'Settings saved!' : '設置已保存！', { duration: 1500 });
      } else {
        console.error('❌ [Branding] Failed to auto-save settings');
      }
    } catch (error) {
      console.error('❌ [Branding] Error auto-saving settings:', error);
    }
  };

  const fontOptions = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Source Sans Pro',
    'Arial',
    'Helvetica'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-purple-600" />
            {t.title}
          </h2>
          <p className="text-sm text-gray-600 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {t.preview}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? (language === 'en' ? 'Saving...' : '保存中...') : t.save}
          </Button>
        </div>
      </div>

      {previewMode && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-900">{t.previewMode}</span>
            </div>
            <p className="text-sm text-purple-700">
              {language === 'en' 
                ? 'Viewing your workspace with custom branding applied' 
                : '查看應用自訂品牌的工作空間'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 🎨 品牌預覽卡片 - 永久顯示 */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-600" />
            {language === 'en' ? 'Brand Preview' : '品牌預覽'}
          </CardTitle>
          <CardDescription>
            {language === 'en' 
              ? 'See how your branding looks' 
              : '查看您的品牌外觀'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Logo 預覽 */}
            <div className="p-6 border-2 border-dashed rounded-lg bg-white text-center">
              {settings.logo_url ? (
                <div className="space-y-2">
                  <img 
                    src={settings.logo_url} 
                    alt={settings.workspace_name} 
                    className="h-16 mx-auto object-contain max-w-full"
                    onLoad={() => {
                      console.log('✅ [Branding] Logo loaded successfully:', settings.logo_url);
                    }}
                    onError={(e) => {
                      console.error('❌ [Branding] Logo failed to load:', settings.logo_url);
                      // 隱藏失敗的圖片，顯示錯誤訊息
                      e.currentTarget.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'py-4';
                      errorDiv.innerHTML = `
                        <svg class="h-12 w-12 mx-auto text-red-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p class="text-sm text-red-600">${language === 'en' ? 'Failed to load logo' : 'Logo 載入失敗'}</p>
                      `;
                      e.currentTarget.parentElement?.appendChild(errorDiv);
                    }}
                  />
                  <p className="text-sm text-gray-600">
                    {settings.workspace_name}
                  </p>
                </div>
              ) : (
                <div className="py-4">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">
                    {language === 'en' ? 'No logo uploaded' : '未上傳標誌'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {language === 'en' ? 'Upload a logo in the "Logo & Identity" tab' : '在「標誌與身份」標籤上傳標誌'}
                  </p>
                </div>
              )}
            </div>

            {/* 顏色預覽 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div 
                  className="h-12 rounded-lg mb-1" 
                  style={{ backgroundColor: settings.primary_color }}
                ></div>
                <p className="text-xs text-gray-600">
                  {language === 'en' ? 'Primary' : '主要'}
                </p>
              </div>
              <div className="text-center">
                <div 
                  className="h-12 rounded-lg mb-1" 
                  style={{ backgroundColor: settings.secondary_color }}
                ></div>
                <p className="text-xs text-gray-600">
                  {language === 'en' ? 'Secondary' : '次要'}
                </p>
              </div>
              <div className="text-center">
                <div 
                  className="h-12 rounded-lg mb-1" 
                  style={{ backgroundColor: settings.accent_color }}
                ></div>
                <p className="text-xs text-gray-600">
                  {language === 'en' ? 'Accent' : '強調'}
                </p>
              </div>
            </div>

            {/* 字體預覽 */}
            <div className="p-4 border rounded-lg bg-white" style={{ fontFamily: settings.font_family }}>
              <p className="text-sm text-gray-500 mb-1">
                {language === 'en' ? 'Font:' : '字體：'} {settings.font_family}
              </p>
              <p className="text-lg">
                {language === 'en' ? 'The quick brown fox jumps over the lazy dog' : '快速的棕色狐狸跳過懶狗'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            {t.colors}
          </TabsTrigger>
          <TabsTrigger value="logo">
            <ImageIcon className="h-4 w-4 mr-2" />
            {t.logo}
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            {t.typography}
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Layout className="h-4 w-4 mr-2" />
            {t.layout}
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>{t.colors}</CardTitle>
              <CardDescription>{t.colorDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>{t.primaryColor}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                  <div className="h-16 rounded-lg" style={{ backgroundColor: settings.primary_color }}></div>
                </div>

                <div className="space-y-2">
                  <Label>{t.secondaryColor}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                  <div className="h-16 rounded-lg" style={{ backgroundColor: settings.secondary_color }}></div>
                </div>

                <div className="space-y-2">
                  <Label>{t.accentColor}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.accent_color}
                      onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={settings.accent_color}
                      onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                  <div className="h-16 rounded-lg" style={{ backgroundColor: settings.accent_color }}></div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-6 p-6 border rounded-lg" style={{ 
                background: `linear-gradient(135deg, ${settings.primary_color} 0%, ${settings.secondary_color} 50%, ${settings.accent_color} 100%)` 
              }}>
                <div className="text-white text-center">
                  <h3 className="text-xl font-bold mb-2">
                    {language === 'en' ? 'Color Preview' : '顏色預覽'}
                  </h3>
                  <p className="text-sm opacity-90">
                    {language === 'en' 
                      ? 'Your brand colors working together' 
                      : '您的品牌顏色組合效果'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logo Tab */}
        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <CardTitle>{t.logo}</CardTitle>
              <CardDescription>{t.logoDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t.workspaceName}</Label>
                <Input
                  value={settings.workspace_name}
                  onChange={(e) => setSettings({ ...settings, workspace_name: e.target.value })}
                  placeholder="My Company"
                />
              </div>

              <div className="space-y-2">
                <Label>{t.uploadLogo}</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                  onClick={() => {
                    console.log('🔘 [Branding] Upload area clicked!');
                    console.log('🔘 [Branding] fileInputRef.current:', fileInputRef.current);
                    toast.info(language === 'en' ? 'Opening file picker...' : '開啟檔案選擇器...', { duration: 1000 });
                    fileInputRef.current?.click();
                  }}
                >
                  {settings.logo_url ? (
                    <div className="space-y-4">
                      <img src={settings.logo_url} alt="Logo" className="h-16 mx-auto" />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🔘 [Branding] Change Logo button clicked!');
                          toast.info(language === 'en' ? 'Opening file picker...' : '開啟檔案選擇器...', { duration: 1000 });
                          fileInputRef.current?.click();
                        }}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? (language === 'en' ? 'Uploading...' : '上傳中...') : (language === 'en' ? 'Change Logo' : '更換標誌')}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {uploading ? (
                        <>
                          <div className="animate-spin h-8 w-8 mx-auto border-4 border-purple-600 border-t-transparent rounded-full" />
                          <p className="text-sm text-gray-600">
                            {language === 'en' ? 'Uploading...' : '上傳中...'}
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-gray-400" />
                          <p className="text-sm text-gray-600">
                            {language === 'en' ? 'Click to upload or drag and drop' : '點擊上傳或拖放文件'}
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, SVG (max. 2MB)
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* 使用原生 input 而不是 Input 組件 */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.customDomain}</Label>
                <Input
                  value={settings.custom_domain || ''}
                  onChange={(e) => setSettings({ ...settings, custom_domain: e.target.value })}
                  placeholder="workspace.yourcompany.com"
                />
                <p className="text-xs text-gray-500">
                  {language === 'en' 
                    ? 'Contact support to configure your custom domain' 
                    : '聯繫支援以配置您的自訂域名'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography">
          <Card>
            <CardHeader>
              <CardTitle>{t.typography}</CardTitle>
              <CardDescription>{t.typographyDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t.fontFamily}</Label>
                <select
                  value={settings.font_family}
                  onChange={(e) => setSettings({ ...settings, font_family: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Preview */}
              <div className="p-6 border rounded-lg" style={{ fontFamily: settings.font_family }}>
                <h1 className="text-4xl font-bold mb-4">
                  {language === 'en' ? 'Heading 1' : '標題 1'}
                </h1>
                <h2 className="text-2xl font-semibold mb-4">
                  {language === 'en' ? 'Heading 2' : '標題 2'}
                </h2>
                <p className="text-base mb-2">
                  {language === 'en' 
                    ? 'This is how your text will look with the selected font.' 
                    : '這是使用所選字體的文本顯示效果。'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'en' 
                    ? 'Small text and captions will appear like this.' 
                    : '小文本和標註將以這種方式顯示。'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle>{t.layout}</CardTitle>
              <CardDescription>{t.layoutDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Layout className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'en' ? 'Layout Customization' : '佈局自訂'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {language === 'en'
                    ? 'Advanced layout options will be available soon. Customize sidebar position, navigation style, and more.'
                    : '高級佈局選項即將推出。自訂側邊欄位置、導航樣式等。'}
                </p>
                <Badge className="mt-4 bg-purple-100 text-purple-700 border-purple-200">
                  {language === 'en' ? 'Coming Soon' : '即將推出'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleReset}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t.reset}
        </Button>
      </div>
    </div>
  );
}