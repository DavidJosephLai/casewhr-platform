/**
 * 🌟 企業版 LOGO 管理組件
 * 
 * 功能：
 * 1. 上傳企業 LOGO
 * 2. 預覽郵件效果
 * 3. 管理 LOGO 設置
 */

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, Image as ImageIcon, Mail, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface EnterpriseLogoInfo {
  logoUrl: string | null;
  info: {
    userId: string;
    companyName: string;
    logoUrl: string;
    uploadedAt: string;
    lastUpdated: string;
  } | null;
}

export function EnterpriseLogoManager() {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logoInfo, setLogoInfo] = useState<EnterpriseLogoInfo | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  // 加載現有 LOGO
  useEffect(() => {
    if (user && accessToken) {
      loadLogoInfo();
    }
  }, [user, accessToken]);

  const loadLogoInfo = async () => {
    try {
      setLoading(true);
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
        setLogoInfo(data);
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
        }
        if (data.info?.companyName) {
          setCompanyName(data.info.companyName);
        }
      }
    } catch (error) {
      console.error('Failed to load logo info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLogo = async () => {
    if (!logoUrl.trim()) {
      toast.error('請輸入 LOGO URL');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/enterprise/logo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            logoUrl: logoUrl.trim(),
            companyName: companyName.trim() || undefined,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('✅ 企業 LOGO 設置成功！');
        await loadLogoInfo();
      } else {
        if (response.status === 403) {
          toast.error('⚠️ 需要企業版訂閱才能設置自定義 LOGO');
        } else {
          toast.error(data.error || '設置失敗');
        }
      }
    } catch (error) {
      console.error('Failed to save logo:', error);
      toast.error('保存失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('確定要刪除企業 LOGO 嗎？')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/enterprise/logo`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success('✅ 企業 LOGO 已刪除');
        setLogoUrl('');
        setCompanyName('');
        await loadLogoInfo();
      } else {
        toast.error('刪除失敗');
      }
    } catch (error) {
      console.error('Failed to delete logo:', error);
      toast.error('刪除失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/test-smart-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'welcome',
            language: 'zh',
          }),
        }
      );

      if (response.ok) {
        toast.success('📧 測試郵件已發送，請查收！');
      } else {
        toast.error('發送失敗');
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast.error('發送失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 標題區 */}
      <div>
        <h2 className="text-2xl font-bold mb-2">🌟 企業版郵件 LOGO</h2>
        <p className="text-gray-600">
          設置您的企業 LOGO，讓所有郵件都展示您的品牌形象
        </p>
      </div>

      {/* 當前狀態 */}
      {logoInfo?.logoUrl && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-2">✅ 已設置企業 LOGO</h3>
              <p className="text-sm text-gray-600 mb-4">
                公司名稱：{logoInfo.info?.companyName || '未設置'}
              </p>
              <div className="bg-white rounded-lg p-4 inline-block border-2 border-purple-300">
                <img
                  src={logoInfo.logoUrl}
                  alt="企業 LOGO"
                  className="max-w-xs max-h-32 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x80?text=Logo+Error';
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* LOGO 設置表單 */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          設置 LOGO
        </h3>

        <div className="space-y-4">
          {/* 公司名稱 */}
          <div>
            <Label htmlFor="companyName">公司名稱（選填）</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="例：您的公司名稱"
              className="mt-1"
            />
          </div>

          {/* LOGO URL */}
          <div>
            <Label htmlFor="logoUrl">LOGO URL *</Label>
            <Input
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://your-domain.com/logo.png"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              💡 建議尺寸：320x120 像素，PNG 格式，透明背景
            </p>
          </div>

          {/* LOGO 預覽 */}
          {logoUrl && (
            <div>
              <Label>預覽</Label>
              <div className="mt-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-8 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <img
                    src={logoUrl}
                    alt="LOGO 預覽"
                    className="max-w-xs max-h-24 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x80?text=Invalid+URL';
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSaveLogo}
              disabled={loading || !logoUrl.trim()}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              保存設置
            </Button>

            {logoInfo?.logoUrl && (
              <Button
                variant="destructive"
                onClick={handleDeleteLogo}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                刪除
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 測試郵件 */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          測試郵件效果
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          發送測試郵件到您的郵箱，查看企業 LOGO 在郵件中的實際效果
        </p>
        <Button
          onClick={handleTestEmail}
          disabled={loading}
          variant="outline"
          className="border-blue-300 hover:bg-blue-100"
        >
          <Mail className="w-4 h-4 mr-2" />
          發送測試郵件
        </Button>
      </Card>

      {/* 使用說明 */}
      <Card className="p-6 bg-amber-50 border-amber-200">
        <h3 className="font-semibold text-lg mb-3">📋 使用說明</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-amber-600">•</span>
            <span>只有<strong>企業版</strong>訂閱用戶可以設置自定義郵件 LOGO</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600">•</span>
            <span>LOGO 將顯示在所有郵件的 Header 區域（歡迎郵件、月度報告等）</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600">•</span>
            <span>建議使用透明背景的 PNG 格式，尺寸為 320x120 像素</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600">•</span>
            <span>LOGO 會搭配 "Powered by Case Where" 標籤顯示</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600">•</span>
            <span>設置後立即生效，所有新發送的郵件都會使用新 LOGO</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}