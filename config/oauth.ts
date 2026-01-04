/**
 * OAuth 社交登入配置
 * OAuth Social Login Configuration
 * 
 * 🌐 域名: casewhr.com
 * 🏢 公司: Case Where 接得準股份有限公司
 * 
 * ⚠️ 如果您遇到 "403: That's an error" 錯誤：
 * ⚠️ If you encounter "403: That's an error":
 * 
 * 這是因為 Google Cloud Console 的 OAuth 配置不正確
 * This is due to incorrect OAuth configuration in Google Cloud Console
 * 
 * 📖 請查看針對 casewhr.com 的專屬設置指南：
 * 📖 Please see the setup guide for casewhr.com:
 * /CASEWHR_GOOGLE_OAUTH_SETUP.md
 * 
 * 或查看詳細修復指南：/GOOGLE_403_ERROR_FIX.md
 * Or see detailed fix guide: /GOOGLE_403_ERROR_FIX.md
 * 
 * 快速解決方案 Quick Solutions:
 * ================================
 * 
 * 選項 1: 正確配置 Google OAuth（推薦）
 * Option 1: Configure Google OAuth correctly (Recommended)
 * 
 * 1. 前往 Google Cloud Console
 *    Go to Google Cloud Console
 * 
 * 2. 在 OAuth 2.0 客戶端設置中，添加授權重定向 URI：
 *    In OAuth 2.0 client settings, add authorized redirect URI:
 *    https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
 * 
 * 3. 配置 OAuth 同意屏幕：
 *    Configure OAuth consent screen:
 *    - App name: Case Where 接案平台
 *    - Support email: support@casewhr.com
 *    - Home page: https://casewhr.com
 *    - Authorized domains: casewhr.com, supabase.co
 * 
 * 4. 如果是測試模式，添加測試用戶郵箱
 *    If in testing mode, add test user emails
 * 
 * 5. 在 Supabase Dashboard → Authentication → Providers 中啟用 Google
 *    Enable Google in Supabase Dashboard → Authentication → Providers
 * 
 * 6. 將下面的 enableGoogleAuth 改為 true
 *    Change enableGoogleAuth below to true
 * 
 * ---
 * 
 * 選項 2: 暫時禁用 Google 登入（當前設置）
 * Option 2: Temporarily disable Google login (Current setting)
 * 
 * 將下面的 enableGoogleAuth 保持為 false
 * Keep enableGoogleAuth as false below
 * 
 * 用戶仍可使用：
 * Users can still use:
 * - 郵箱/密碼登入 Email/Password login ✅
 * - GitHub 登入（如已配置）GitHub login (if configured) ✅
 * - Facebook 登入（如已配置）Facebook login (if configured) ✅
 */

export const oauthConfig = {
  // 啟用/禁用 Google 登入 / Enable/Disable Google Login
  // ✅ Google 登入已啟用！請確保已完成配置
  // ✅ Google login enabled! Make sure configuration is complete
  // 📖 配置指南: /GOOGLE_OAUTH_NOW.md
  enableGoogleAuth: true, // ✅ 恢復啟用，準備配置
  
  // 啟用/禁用 GitHub 登入 / Enable/Disable GitHub Login
  // ✅ GitHub 登入已啟用！請確保已完成配置
  enableGithubAuth: true, // ✅ GitHub OAuth 已在 Supabase Dashboard 配置完成
  
  // 啟用/禁用 Facebook 登入 / Enable/Disable Facebook Login
  // ✅ Facebook 登入已啟用！請確保已完成配置
  // ✅ Facebook login enabled! Make sure configuration is complete
  // 📖 配置指南: 請按照以下步驟在 Supabase 和 Facebook 配置 OAuth
  enableFacebookAuth: true, // ✅ 已啟用 Facebook OAuth！請完成 Facebook App 和 Supabase 配置
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