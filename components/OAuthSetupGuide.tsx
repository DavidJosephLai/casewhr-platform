import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { OAuthConfigHelper } from "./OAuthConfigHelper";

export function OAuthSetupGuide() {
  const { language } = useLanguage();

  const isEnglish = language === 'en';

  return (
    <div className="space-y-6">
      {/* Configuration Helper */}
      <OAuthConfigHelper />
      
      {/* Original Setup Guide */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            {isEnglish ? 'OAuth Setup Required' : 'OAuth 設置需求'}
          </CardTitle>
          <CardDescription>
            {isEnglish 
              ? 'Follow these steps to enable Google and GitHub social login'
              : '請按照以下步驟啟用 Google 和 GitHub 社交登入'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {isEnglish ? 'Important' : '重要提醒'}
            </AlertTitle>
            <AlertDescription>
              {isEnglish
                ? 'Social login buttons are visible but will not work until you complete the OAuth provider configuration in Supabase.'
                : '社交登入按鈕已顯示，但在您完成 Supabase 中的 OAuth 提供者配置之前將無法使用。'}
            </AlertDescription>
          </Alert>

          {/* Google OAuth Setup */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600">Google</Badge>
              <h3 className="text-lg font-semibold">
                {isEnglish ? 'Google OAuth Setup' : 'Google OAuth 設置'}
              </h3>
            </div>

            <ol className="space-y-3 text-sm ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-blue-600 min-w-[24px]">1.</span>
                <div className="space-y-1">
                  <p>
                    {isEnglish
                      ? 'Go to your Supabase project dashboard:'
                      : '前往您的 Supabase 項目儀表板：'}
                  </p>
                  <a 
                    href="https://supabase.com/dashboard/project/bihplitfentxioxyjalb/auth/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    Authentication → Providers
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="font-semibold text-blue-600 min-w-[24px]">2.</span>
                <p>
                  {isEnglish
                    ? 'Find "Google" in the list of providers and click to configure'
                    : '在提供者列表中找到 "Google" 並點擊配置'}
                </p>
              </li>

              <li className="flex gap-3">
                <span className="font-semibold text-blue-600 min-w-[24px]">3.</span>
                <div className="space-y-1">
                  <p>
                    {isEnglish
                      ? 'Follow the setup guide provided by Supabase:'
                      : '按照 Supabase 提供的設置指南進行操作：'}
                  </p>
                  <a 
                    href="https://supabase.com/docs/guides/auth/social-login/auth-google"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    {isEnglish ? 'Google OAuth Documentation' : 'Google OAuth 文檔'}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="font-semibold text-blue-600 min-w-[24px]">4.</span>
                <div className="space-y-1">
                  <p>
                    {isEnglish
                      ? 'You will need to:'
                      : '您需要：'}
                  </p>
                  <ul className="list-disc ml-5 space-y-1 text-gray-600">
                    <li>
                      {isEnglish
                        ? 'Create a Google Cloud project'
                        : '創建 Google Cloud 項目'}
                    </li>
                    <li>
                      {isEnglish
                        ? 'Configure OAuth consent screen'
                        : '配置 OAuth 同意畫面'}
                    </li>
                    <li>
                      {isEnglish
                        ? 'Create OAuth 2.0 credentials'
                        : '創建 OAuth 2.0 憑證'}
                    </li>
                    <li>
                      {isEnglish
                        ? 'Add your Supabase callback URL'
                        : '添加您的 Supabase 回調 URL'}
                    </li>
                  </ul>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="font-semibold text-blue-600 min-w-[24px]">5.</span>
                <p>
                  {isEnglish
                    ? 'Enable the Google provider in Supabase and save your changes'
                    : '在 Supabase 中啟用 Google 提供者並保存更改'}
                </p>
              </li>
            </ol>
          </div>

          {/* GitHub OAuth Setup */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-800">GitHub</Badge>
              <h3 className="text-lg font-semibold">
                {isEnglish ? 'GitHub OAuth Setup' : 'GitHub OAuth 設置'}
              </h3>
            </div>

            <ol className="space-y-3 text-sm ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-gray-800 min-w-[24px]">1.</span>
                <div className="space-y-1">
                  <p>
                    {isEnglish
                      ? 'Go to your Supabase project dashboard:'
                      : '前往您的 Supabase 項目儀表板：'}
                  </p>
                  <a 
                    href="https://supabase.com/dashboard/project/bihplitfentxioxyjalb/auth/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    Authentication → Providers
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="font-semibold text-gray-800 min-w-[24px]">2.</span>
                <p>
                  {isEnglish
                    ? 'Find "GitHub" in the list of providers and click to configure'
                    : '在提供者列表中找到 "GitHub" 並點擊配置'}
                </p>
              </li>

              <li className="flex gap-3">
                <span className="font-semibold text-gray-800 min-w-[24px]">3.</span>
                <div className="space-y-1">
                  <p>
                    {isEnglish
                      ? 'Follow the setup guide provided by Supabase:'
                      : '按照 Supabase 提供的設置指南進行操作：'}
                  </p>
                  <a 
                    href="https://supabase.com/docs/guides/auth/social-login/auth-github"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    {isEnglish ? 'GitHub OAuth Documentation' : 'GitHub OAuth 文檔'}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="font-semibold text-gray-800 min-w-[24px]">4.</span>
                <div className="space-y-1">
                  <p>
                    {isEnglish
                      ? 'You will need to:'
                      : '您需要：'}
                  </p>
                  <ul className="list-disc ml-5 space-y-1 text-gray-600">
                    <li>
                      {isEnglish
                        ? 'Go to GitHub Settings → Developer settings → OAuth Apps'
                        : '前往 GitHub 設置 → 開發者設置 → OAuth Apps'}
                    </li>
                    <li>
                      {isEnglish
                        ? 'Create a new OAuth App'
                        : '創建新的 OAuth App'}
                    </li>
                    <li>
                      {isEnglish
                        ? 'Add your Supabase callback URL'
                        : '添加您的 Supabase 回調 URL'}
                    </li>
                    <li>
                      {isEnglish
                        ? 'Copy the Client ID and Client Secret'
                        : '複製 Client ID 和 Client Secret'}
                    </li>
                  </ul>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="font-semibold text-gray-800 min-w-[24px]">5.</span>
                <p>
                  {isEnglish
                    ? 'Enable the GitHub provider in Supabase and save your changes'
                    : '在 Supabase 中啟用 GitHub 提供者並保存更改'}
                </p>
              </li>
            </ol>
          </div>

          {/* Testing */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">
                {isEnglish ? 'Testing' : '測試'}
              </h3>
            </div>
            
            <p className="text-sm text-gray-600">
              {isEnglish
                ? 'Once configured, click the Google or GitHub buttons in the login/signup forms to test the OAuth flow. Users will be redirected to the respective provider to authorize, then redirected back to your application.'
                : '配置完成後，在登入/註冊表單中點擊 Google 或 GitHub 按鈕測試 OAuth 流程。用戶將被重定向到相應的提供者進行授權，然後重定向回您的應用程式。'}
            </p>
          </div>

          {/* Callback URL Info */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">
              {isEnglish ? 'Redirect URL' : '重定向 URL'}
            </AlertTitle>
            <AlertDescription className="text-blue-800">
              <p className="mb-2">
                {isEnglish
                  ? 'Your Supabase callback URL should be:'
                  : '您的 Supabase 回調 URL 應為：'}
              </p>
              <code className="block bg-white p-2 rounded text-xs break-all">
                https://bihplitfentxioxyjalb.supabase.co/auth/v1/callback
              </code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}