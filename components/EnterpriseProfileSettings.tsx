import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Building2, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

interface EnterpriseProfileSettingsProps {
  onUpdate?: () => void;
}

export const EnterpriseProfileSettings = ({ onUpdate }: EnterpriseProfileSettingsProps) => {
  const { user, accessToken } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const content = {
    en: {
      title: 'Enterprise Profile',
      description: 'Customize your company branding shown on project cards',
      companyNameLabel: 'Company Name',
      companyNamePlaceholder: 'Enter your company name',
      logoLabel: 'Company Logo',
      logoDescription: 'Upload your company logo (PNG, JPG, max 2MB)',
      currentLogo: 'Current Logo',
      selectFile: 'Select Logo File',
      saveButton: 'Save Enterprise Profile',
      saving: 'Saving...',
      uploadSuccess: 'Enterprise profile updated successfully!',
      uploadError: 'Failed to update enterprise profile',
      loadError: 'Failed to load enterprise profile',
      requirements: 'Logo Requirements:',
      req1: 'Format: PNG, JPG, or JPEG',
      req2: 'Recommended size: 200x200px',
      req3: 'Max file size: 2MB',
      req4: 'Square logos work best',
      noLogo: 'No logo uploaded yet',
      changeFile: 'Change Logo',
    },
    'zh-TW': {
      title: '企業資料設定',
      description: '自訂顯示在案件卡片上的企業品牌形象',
      companyNameLabel: '企業名稱',
      companyNamePlaceholder: '輸入您的企業名稱',
      logoLabel: '企業 LOGO',
      logoDescription: '上傳企業 LOGO（PNG、JPG，最大 2MB）',
      currentLogo: '目前的 LOGO',
      selectFile: '選擇 LOGO 檔案',
      saveButton: '儲存企業資料',
      saving: '儲存中...',
      uploadSuccess: '企業資料更新成功！',
      uploadError: '更新企業資料失敗',
      loadError: '載入企業資料失敗',
      requirements: 'LOGO 要求：',
      req1: '格式：PNG、JPG 或 JPEG',
      req2: '建議尺寸：200x200px',
      req3: '最大檔案大小：2MB',
      req4: '方形 LOGO 效果最佳',
      noLogo: '尚未上傳 LOGO',
      changeFile: '變更 LOGO',
    },
    'zh-CN': {
      title: '企业资料设定',
      description: '自定义显示在案件卡片上的企业品牌形象',
      companyNameLabel: '企业名称',
      companyNamePlaceholder: '输入您的企业名称',
      logoLabel: '企业 LOGO',
      logoDescription: '上传企业 LOGO（PNG、JPG，最大 2MB）',
      currentLogo: '当前的 LOGO',
      selectFile: '选择 LOGO 文件',
      saveButton: '保存企业资料',
      saving: '保存中...',
      uploadSuccess: '企业资料更新成功！',
      uploadError: '更新企业资料失败',
      loadError: '加载企业资料失败',
      requirements: 'LOGO 要求：',
      req1: '格式：PNG、JPG 或 JPEG',
      req2: '建议尺寸：200x200px',
      req3: '最大文件大小：2MB',
      req4: '方形 LOGO 效果最佳',
      noLogo: '尚未上传 LOGO',
      changeFile: '变更 LOGO',
    },
  };

  const t = content[language as keyof typeof content] || content.en;

  // 載入現有的企業資料
  useEffect(() => {
    const loadEnterpriseProfile = async () => {
      if (!user?.id || !accessToken) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/enterprise/logo`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
            setPreviewUrl(data.logoUrl);
          }
          if (data.info?.companyName) {
            setCompanyName(data.info.companyName);
          }
        }
      } catch (error) {
        console.error('Failed to load enterprise profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEnterpriseProfile();
  }, [user, accessToken]);

  // 處理文件選擇
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 驗證文件類型
    if (!file.type.match(/^image\/(png|jpg|jpeg)$/)) {
      toast.error(language === 'en' ? 'Please select a PNG or JPG file' : '請選擇 PNG 或 JPG 格式的檔案');
      return;
    }

    // 驗證文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === 'en' ? 'File size must be less than 2MB' : '檔案大小必須小於 2MB');
      return;
    }

    setLogoFile(file);
    
    // 生成預覽
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 上傳 LOGO 並保存
  const handleSave = async () => {
    if (!user?.id || !accessToken) return;
    
    setSaving(true);
    try {
      let finalLogoUrl = logoUrl;

      // 如果有新的 LOGO 文件，先上傳
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);

        const uploadResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding/logo`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload logo');
        }

        const uploadData = await uploadResponse.json();
        finalLogoUrl = uploadData.logo_url;
      }

      // 保存企業資料
      const saveResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/enterprise/logo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            logoUrl: finalLogoUrl,
            companyName: companyName.trim() || undefined,
          }),
        }
      );

      if (!saveResponse.ok) {
        throw new Error('Failed to save enterprise profile');
      }

      toast.success(t.uploadSuccess);
      setLogoUrl(finalLogoUrl);
      setLogoFile(null);
      
      // 觸發父組件更新
      onUpdate?.();
    } catch (error) {
      console.error('Error saving enterprise profile:', error);
      toast.error(t.uploadError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">
              {language === 'en' ? 'Loading...' : '載入中...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-purple-600" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 企業名稱 */}
        <div className="space-y-2">
          <Label htmlFor="companyName">{t.companyNameLabel}</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t.companyNamePlaceholder}
            maxLength={100}
          />
        </div>

        {/* LOGO 上傳 */}
        <div className="space-y-3">
          <Label>{t.logoLabel}</Label>
          <p className="text-sm text-gray-600">{t.logoDescription}</p>

          {/* 當前 LOGO 預覽 */}
          {previewUrl && (
            <div className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-purple-200">
              <div className="flex-shrink-0">
                <img
                  src={previewUrl}
                  alt="Company Logo Preview"
                  className="h-20 w-20 rounded object-contain bg-gray-50 border border-gray-200 p-2"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{t.currentLogo}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {logoFile ? logoFile.name : t.noLogo}
                </p>
              </div>
            </div>
          )}

          {/* 文件選擇 */}
          <div>
            <Input
              id="logoFile"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('logoFile')?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {previewUrl ? t.changeFile : t.selectFile}
            </Button>
          </div>

          {/* 要求說明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-blue-900 mb-2">{t.requirements}</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• {t.req1}</li>
              <li>• {t.req2}</li>
              <li>• {t.req3}</li>
              <li>• {t.req4}</li>
            </ul>
          </div>
        </div>

        {/* 保存按鈕 */}
        <Button
          onClick={handleSave}
          disabled={saving || (!companyName.trim() && !logoFile && !logoUrl)}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.saving}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              {t.saveButton}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
