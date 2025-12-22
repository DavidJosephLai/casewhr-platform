/**
 * OAuth 社交登入配置
 * OAuth Social Login Configuration
 * 
 * 🌐 域名: casewhr.com
 * 🏢 公司: Case Where 接得準股份有限公司
 */

export const oauthConfig = {
  // 啟用/禁用 Google 登入 / Enable/Disable Google Login
  // ✅ Google 登入已啟用！請確保已完成配置
  enableGoogleAuth: true,
  
  // 啟用/禁用 GitHub 登入 / Enable/Disable GitHub Login
  // ⚠️ 暫時禁用，需要先在 Supabase 配置 GitHub OAuth
  enableGithubAuth: true,
  
  // 啟用/禁用 Facebook 登入 / Enable/Disable Facebook Login
  // ⚠️ 暫時禁用，需要先在 Supabase 配置 Facebook OAuth
  enableFacebookAuth: false,
  
  // 顯示 OAuth 設置提示 / Show OAuth setup notice
  showOAuthNotice: true,
};

/**
 * 檢查是否啟用了任何社交登入
 * Check if any social login is enabled
 */
export const isSocialLoginEnabled = () => {
  return oauthConfig.enableGoogleAuth || 
         oauthConfig.enableGithubAuth || 
         oauthConfig.enableFacebookAuth;
};
