import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from './AuthProvider';
import { projectId } from '../utils/supabase/info';
import { 
  Search, 
  Image as ImageIcon, 
  Database,
  HardDrive,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface BrandingDiagnosticProps {
  language?: 'en' | 'zh';
}

export function BrandingDiagnostic({ language = 'en' }: BrandingDiagnosticProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const translations = {
    en: {
      title: '🔍 Branding LOGO Diagnostic',
      desc: 'Check your brand LOGO storage status',
      run: 'Run Diagnostic',
      running: 'Checking...',
      userId: 'User ID',
      kvStore: 'KV Store Configuration',
      storage: 'Storage Files',
      logoUrl: 'LOGO URL',
      found: 'Found',
      notFound: 'Not Found',
      company: 'Company Name',
      colors: 'Brand Colors',
      copy: 'Copy',
      copied: 'Copied!',
      refresh: 'Refresh',
      noLogo: 'No LOGO uploaded',
      hasLogo: 'LOGO exists',
      viewLogo: 'View LOGO',
    },
    zh: {
      title: '🔍 品牌 LOGO 診斷工具',
      desc: '檢查您的品牌 LOGO 存儲狀態',
      run: '執行診斷',
      running: '檢查中...',
      userId: '用戶 ID',
      kvStore: 'KV Store 配置',
      storage: 'Storage 文件',
      logoUrl: 'LOGO 網址',
      found: '已找到',
      notFound: '未找到',
      company: '公司名稱',
      colors: '品牌顏色',
      copy: '複製',
      copied: '已複製！',
      refresh: '刷新',
      noLogo: '尚未上傳 LOGO',
      hasLogo: 'LOGO 已存在',
      viewLogo: '查看 LOGO',
    }
  };

  const t = translations[language];

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      // Fetch branding settings
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResult(data.branding);
        console.log('📋 Branding Data:', data.branding);
      } else {
        toast.error('Failed to fetch branding data');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error running diagnostic');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t.copied);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-6 text-blue-600" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runDiagnostic} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                {t.running}
              </>
            ) : (
              <>
                <Search className="size-4 mr-2" />
                {t.run}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="size-5 text-purple-600" />
                {t.userId}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg font-mono text-sm">
                <span className="text-gray-700">{user?.id}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(user?.id || '')}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* KV Store Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="size-5 text-green-600" />
                {t.kvStore}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">{t.company}</div>
                  <div className="font-medium">{result.company_name || 'N/A'}</div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">LOGO Status</div>
                  <div className="flex items-center gap-2">
                    {result.logo_url ? (
                      <>
                        <CheckCircle2 className="size-4 text-green-600" />
                        <span className="text-green-700 font-medium">{t.hasLogo}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="size-4 text-red-600" />
                        <span className="text-red-700 font-medium">{t.noLogo}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {result.logo_url && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">{t.logoUrl}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-blue-50 rounded-lg font-mono text-xs text-blue-900 break-all">
                      {result.logo_url}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.logo_url)}
                    >
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(result.logo_url, '_blank')}
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">{t.colors}</div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="size-8 rounded border-2 border-gray-300" 
                      style={{ backgroundColor: result.primary_color }}
                    />
                    <span className="text-xs text-gray-600">Primary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="size-8 rounded border-2 border-gray-300" 
                      style={{ backgroundColor: result.secondary_color }}
                    />
                    <span className="text-xs text-gray-600">Secondary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="size-8 rounded border-2 border-gray-300" 
                      style={{ backgroundColor: result.accent_color }}
                    />
                    <span className="text-xs text-gray-600">Accent</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LOGO Preview */}
          {result.logo_url && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="size-5 text-green-600" />
                  LOGO Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-8 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                  <img 
                    src={result.logo_url} 
                    alt="Company Logo"
                    className="max-h-48 max-w-full object-contain"
                    onError={(e) => {
                      console.error('Failed to load logo');
                      toast.error('Failed to load logo image');
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Storage Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="size-5 text-orange-600" />
                {t.storage}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Supabase Storage Bucket</div>
                    <div className="text-sm text-gray-600 font-mono">make-215f78a5-branding</div>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700">
                    Private
                  </Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">File Path</div>
                  <div className="font-mono text-sm text-gray-700">
                    {user?.id}/{'{timestamp}'}-logo.{'{ext}'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          {(result.created_at || result.updated_at) && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {result.created_at && (
                    <div>
                      <div className="text-gray-600">Created</div>
                      <div className="font-medium">
                        {new Date(result.created_at).toLocaleString(language === 'zh' ? 'zh-TW' : 'en-US')}
                      </div>
                    </div>
                  )}
                  {result.updated_at && (
                    <div>
                      <div className="text-gray-600">Updated</div>
                      <div className="font-medium">
                        {new Date(result.updated_at).toLocaleString(language === 'zh' ? 'zh-TW' : 'en-US')}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}