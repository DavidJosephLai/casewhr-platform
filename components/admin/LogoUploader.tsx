import { useState } from 'react';
import { Upload, CheckCircle, XCircle, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../../utils/supabase/info';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export function LogoUploader() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('https://bihplitfentxioxyjalb.supabase.co/storage/v1/object/public/platform-assets/casewhr-logo-white.png');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const content = {
    en: {
      title: 'Email Logo Manager',
      description: 'Upload and manage the CaseWHR logo displayed in email templates',
      currentLogo: 'Current Logo',
      uploadNew: 'Upload New Logo',
      selectFile: 'Select Logo File',
      uploadBtn: 'Upload Logo',
      uploading: 'Uploading...',
      requirements: 'Logo Requirements',
      req1: 'Format: PNG with transparent background (recommended)',
      req2: 'Size: 280-400px width recommended',
      req3: 'Color: White logo on transparent background works best',
      req4: 'Max file size: 2MB',
      preview: 'Preview',
      success: 'Logo uploaded successfully!',
      failed: 'Failed to upload logo',
      invalidFile: 'Please select a PNG file',
      logoPath: 'Logo URL (used in emails)',
      copyUrl: 'Copy URL',
      urlCopied: 'URL copied to clipboard!',
    },
    zh: {
      title: '郵件 LOGO 管理器',
      description: '上傳和管理郵件模板中顯示的 CaseWHR 標誌',
      currentLogo: '當前 LOGO',
      uploadNew: '上傳新 LOGO',
      selectFile: '選擇 LOGO 文件',
      uploadBtn: '上傳 LOGO',
      uploading: '上傳中...',
      requirements: 'LOGO 要求',
      req1: '格式：PNG 透明背景（推薦）',
      req2: '尺寸：建議寬度 280-400px',
      req3: '顏色：透明背景上的白色 LOGO 效果最佳',
      req4: '最大文件大小：2MB',
      preview: '預覽',
      success: 'LOGO 上傳成功！',
      failed: 'LOGO 上傳失敗',
      invalidFile: '請選擇 PNG 文件',
      logoPath: 'LOGO URL（用於郵件）',
      copyUrl: '複製 URL',
      urlCopied: 'URL 已複製到剪貼板！',
    }
  };

  const t = content[language];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t.invalidFile);
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === 'en' ? 'File size must be less than 2MB' : '文件大小必須小於 2MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async () => {
    if (!selectedFile) {
      toast.error(language === 'en' ? 'Please select a file first' : '請先選擇文件');
      return;
    }

    if (!accessToken) {
      toast.error(language === 'en' ? 'Please login first' : '請先登入');
      return;
    }

    setUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('📤 Uploading logo to server...');
      console.log('📤 User ID:', user?.id);
      console.log('📤 File:', selectedFile.name, selectedFile.type, selectedFile.size);

      // Upload via server API
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/upload-email-logo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      console.log('📤 Response status:', response.status);

      let data;
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        throw new Error('Server returned invalid response');
      }

      console.log('📤 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Upload failed`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      console.log('✅ Upload successful:', data);

      const newLogoUrl = data.logo_url;
      setLogoUrl(newLogoUrl);

      toast.success(t.success);
      
      toast.info(
        language === 'en'
          ? '✨ The new logo will now be used in all email templates!'
          : '✨ 新 LOGO 現在將用於所有郵件模板！',
        { duration: 5000 }
      );
      
      // Clear selection
      setSelectedFile(null);
      setPreviewUrl(null);

      // Reload preview with cache buster
      setTimeout(() => {
        setLogoUrl(newLogoUrl + '?t=' + Date.now());
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error uploading logo:', error);
      const errorMsg = error.message || String(error);
      toast.error(
        language === 'en' 
          ? `Upload failed: ${errorMsg}`
          : `上傳失敗：${errorMsg}`,
        { duration: 6000 }
      );
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(logoUrl);
    toast.success(t.urlCopied);
  };

  // 🔍 檢查 KV Store 中的 LOGO URL
  const checkKVStore = async () => {
    if (!accessToken) {
      toast.error(language === 'en' ? 'Please login first' : '請先登入');
      return;
    }

    try {
      console.log('🔍 Checking KV Store for logo URL...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/get-email-logo`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      
      console.log('🔍 KV Store response:', data);

      if (response.ok && data.success) {
        if (data.has_logo) {
          toast.success(
            language === 'en'
              ? `✅ Logo found in KV Store!\n${data.logo_url}`
              : `✅ 在 KV Store 中找到 LOGO！\n${data.logo_url}`,
            { duration: 5000 }
          );
          
          // Update local state
          setLogoUrl(data.logo_url);
        } else {
          toast.warning(
            language === 'en'
              ? '⚠️ No logo found in KV Store. Please upload one.'
              : '⚠️ KV Store 中沒有 LOGO。請上傳一個。',
            { duration: 5000 }
          );
        }
      } else {
        throw new Error(data.error || 'Failed to check KV Store');
      }
    } catch (error: any) {
      console.error('❌ Error checking KV Store:', error);
      toast.error(
        language === 'en'
          ? `Failed to check KV Store: ${error.message}`
          : `檢查 KV Store 失敗：${error.message}`,
        { duration: 6000 }
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Logo Preview */}
        <div>
          <h3 className="font-medium mb-3">{t.currentLogo}</h3>
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-lg flex items-center justify-center">
            <img 
              src={logoUrl} 
              alt="CaseWHR Logo" 
              className="max-w-[280px] h-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="280" height="80" viewBox="0 0 280 80"%3E%3Crect width="280" height="80" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="14"%3ENo Logo Uploaded%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium mb-2">{t.logoPath}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={logoUrl}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md bg-gray-50 font-mono text-sm"
            />
            <Button onClick={copyUrl} variant="outline" size="sm">
              {t.copyUrl}
            </Button>
            <Button onClick={checkKVStore} variant="outline" size="sm">
              🔍 {language === 'en' ? 'Check KV' : '檢查 KV'}
            </Button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="border-t pt-6">
          <h3 className="font-medium mb-3">{t.uploadNew}</h3>
          
          {/* Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-2">{t.requirements}</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ {t.req1}</li>
                  <li>✓ {t.req2}</li>
                  <li>✓ {t.req3}</li>
                  <li>✓ {t.req4}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* File Input */}
          <div className="mb-4">
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  {selectedFile ? selectedFile.name : t.selectFile}
                </p>
                <p className="text-xs text-gray-500">
                  {language === 'en' ? 'Click to select or drag and drop' : '點擊選擇或拖放文件'}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </label>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{t.preview}</label>
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-lg flex items-center justify-center">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-[280px] h-auto"
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={uploadLogo}
            disabled={uploading || !selectedFile}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.uploading}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t.uploadBtn}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}