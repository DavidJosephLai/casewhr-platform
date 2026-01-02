import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Copy, Check, AlertCircle, Settings } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export function OAuthConfigHelper() {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  
  const [config, setConfig] = useState({
    enableGoogleAuth: true,
    enableGithubAuth: true,
    enableFacebookAuth: true,
    showOAuthNotice: true,
  });

  const generateConfig = () => {
    return `export const oauthConfig = {
  enableGoogleAuth: ${config.enableGoogleAuth},
  enableGithubAuth: ${config.enableGithubAuth},
  enableFacebookAuth: ${config.enableFacebookAuth},
  showOAuthNotice: ${config.showOAuthNotice},
};`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateConfig());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isEnglish = language === 'en';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {isEnglish ? 'OAuth Configuration Helper' : 'OAuth 配置助手'}
        </CardTitle>
        <CardDescription>
          {isEnglish 
            ? 'Quickly generate configuration for OAuth social login'
            : '快速生成 OAuth 社交登入配置'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            {isEnglish
              ? 'Configure which social login buttons to display in your application.'
              : '配置您的應用程式中要顯示哪些社交登入按鈕。'}
          </AlertDescription>
        </Alert>

        {/* Configuration Options */}
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="google-auth">
                {isEnglish ? 'Google Login' : 'Google 登入'}
              </Label>
              <p className="text-sm text-gray-500">
                {isEnglish 
                  ? 'Show Google login button'
                  : '顯示 Google 登入按鈕'}
              </p>
            </div>
            <Switch
              id="google-auth"
              checked={config.enableGoogleAuth}
              onCheckedChange={(checked) =>
                setConfig({ ...config, enableGoogleAuth: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="github-auth">
                {isEnglish ? 'GitHub Login' : 'GitHub 登入'}
              </Label>
              <p className="text-sm text-gray-500">
                {isEnglish 
                  ? 'Show GitHub login button'
                  : '顯示 GitHub 登入按鈕'}
              </p>
            </div>
            <Switch
              id="github-auth"
              checked={config.enableGithubAuth}
              onCheckedChange={(checked) =>
                setConfig({ ...config, enableGithubAuth: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="facebook-auth">
                {isEnglish ? 'Facebook Login' : 'Facebook 登入'}
              </Label>
              <p className="text-sm text-gray-500">
                {isEnglish 
                  ? 'Show Facebook login button'
                  : '顯示 Facebook 登入按鈕'}
              </p>
            </div>
            <Switch
              id="facebook-auth"
              checked={config.enableFacebookAuth}
              onCheckedChange={(checked) =>
                setConfig({ ...config, enableFacebookAuth: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-notice">
                {isEnglish ? 'Setup Notice' : '設置提示'}
              </Label>
              <p className="text-sm text-gray-500">
                {isEnglish 
                  ? 'Show OAuth setup reminder'
                  : '顯示 OAuth 設置提醒'}
              </p>
            </div>
            <Switch
              id="show-notice"
              checked={config.showOAuthNotice}
              onCheckedChange={(checked) =>
                setConfig({ ...config, showOAuthNotice: checked })
              }
            />
          </div>
        </div>

        {/* Current Configuration Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              {isEnglish ? 'Generated Configuration' : '生成的配置'}
            </Label>
            <Badge variant={config.enableGoogleAuth || config.enableGithubAuth ? 'default' : 'secondary'}>
              {config.enableGoogleAuth || config.enableGithubAuth
                ? (isEnglish ? 'Enabled' : '已啟用')
                : (isEnglish ? 'Disabled' : '已禁用')}
            </Badge>
          </div>
          
          <div className="relative">
            <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
              <code>{generateConfig()}</code>
            </pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={copyToClipboard}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {isEnglish ? 'Copied' : '已複製'}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  {isEnglish ? 'Copy' : '複製'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {isEnglish ? (
              <>
                <strong>How to apply:</strong>
                <ol className="mt-2 ml-4 space-y-1 list-decimal">
                  <li>Copy the configuration above</li>
                  <li>Open <code className="bg-gray-100 px-1 rounded">/config/oauth.ts</code></li>
                  <li>Replace the <code className="bg-gray-100 px-1 rounded">oauthConfig</code> export</li>
                  <li>Save the file</li>
                  <li>Refresh your application</li>
                </ol>
              </>
            ) : (
              <>
                <strong>如何應用：</strong>
                <ol className="mt-2 ml-4 space-y-1 list-decimal">
                  <li>複製上面的配置</li>
                  <li>打開 <code className="bg-gray-100 px-1 rounded">/config/oauth.ts</code></li>
                  <li>替換 <code className="bg-gray-100 px-1 rounded">oauthConfig</code> 導出</li>
                  <li>保存文件</li>
                  <li>刷新您的應用程式</li>
                </ol>
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Quick Actions */}
        <div className="space-y-2">
          <Label>{isEnglish ? 'Quick Actions' : '快速操作'}</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setConfig({
                enableGoogleAuth: false,
                enableGithubAuth: false,
                enableFacebookAuth: false,
                showOAuthNotice: false,
              })}
            >
              {isEnglish ? 'Disable All' : '全部禁用'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfig({
                enableGoogleAuth: true,
                enableGithubAuth: true,
                enableFacebookAuth: true,
                showOAuthNotice: true,
              })}
            >
              {isEnglish ? 'Enable All' : '全部啟用'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}