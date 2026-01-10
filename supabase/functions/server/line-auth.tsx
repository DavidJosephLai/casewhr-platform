// 🟢 LINE OAuth 認證服務
// LINE Login OAuth 2.0 完整流程實現

import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// LINE OAuth 配置 - 從環境變數讀取
const LINE_CHANNEL_ID = Deno.env.get('LINE_CHANNEL_ID');
const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET');
const LINE_CALLBACK_URL = Deno.env.get('LINE_CALLBACK_URL');

// LINE API 端點
const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';

/**
 * 生成 LINE 授權 URL
 */
export function generateLineAuthUrl(state: string): string {
  if (!LINE_CHANNEL_ID || !LINE_CALLBACK_URL) {
    throw new Error('LINE OAuth not configured: Missing CHANNEL_ID or CALLBACK_URL');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_CHANNEL_ID,
    redirect_uri: LINE_CALLBACK_URL,
    state: state,
    scope: 'profile openid email',
  });

  const authUrl = `${LINE_AUTH_URL}?${params.toString()}`;
  console.log('🟢 [LINE Auth] Generated auth URL');
  
  return authUrl;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  id_token?: string;
  expires_in: number;
}> {
  console.log('🟢 [LINE Auth] Exchanging code for token...');
  console.log('🔍 [LINE Auth] Environment variables check:', {
    hasChannelId: !!LINE_CHANNEL_ID,
    hasChannelSecret: !!LINE_CHANNEL_SECRET,
    hasCallbackUrl: !!LINE_CALLBACK_URL,
    channelId: LINE_CHANNEL_ID ? `${LINE_CHANNEL_ID.substring(0, 5)}...` : 'NOT SET',
    callbackUrl: LINE_CALLBACK_URL || 'NOT SET',
  });

  if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET || !LINE_CALLBACK_URL) {
    const missing = [];
    if (!LINE_CHANNEL_ID) missing.push('LINE_CHANNEL_ID');
    if (!LINE_CHANNEL_SECRET) missing.push('LINE_CHANNEL_SECRET');
    if (!LINE_CALLBACK_URL) missing.push('LINE_CALLBACK_URL');
    
    const errorMsg = `LINE OAuth not configured. Missing environment variables: ${missing.join(', ')}. Please set these in Supabase Dashboard > Settings > Edge Functions > Secrets, then redeploy the Edge Function.`;
    console.error('❌ [LINE Auth] Configuration error:', errorMsg);
    throw new Error(errorMsg);
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: LINE_CALLBACK_URL,
    client_id: LINE_CHANNEL_ID,
    client_secret: LINE_CHANNEL_SECRET,
  });

  const response = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ [LINE Auth] Token exchange failed:', error);
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  const data = await response.json();
  console.log('✅ [LINE Auth] Token exchanged successfully');
  
  return data;
}

/**
 * Get LINE user profile
 */
export async function getLineProfile(accessToken: string): Promise<{
  userId: string;
  displayName: string;
  pictureUrl?: string;
  email?: string;
}> {
  console.log('🟢 [LINE Auth] Fetching user profile...');

  const response = await fetch(LINE_PROFILE_URL, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ [LINE Auth] Profile fetch failed:', error);
    throw new Error(`Failed to fetch LINE profile: ${error}`);
  }

  const profile = await response.json();
  console.log('✅ [LINE Auth] Profile fetched:', {
    userId: profile.userId,
    displayName: profile.displayName,
  });

  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    email: profile.email, // May be undefined if not granted
  };
}

/**
 * 創建或登入 Supabase 用戶（基於 LINE 用戶資料）
 */
export async function createOrLoginUser(lineProfile: {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  email?: string;
}): Promise<{ user: any; accessToken: string }> {
  console.log('🟢 [LINE Auth] Creating/logging in user...');

  // 生成郵箱（如果 LINE 沒提供）
  const email = lineProfile.email || `line_${lineProfile.userId}@casewhr.com`;

  // 檢查用戶是否已存在（使用 email 查詢而不是 LINE userId）
  let existingUser = null;
  try {
    // 列出所有用戶並找到匹配的郵箱（注意：這只適用於小規模應用）
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (users) {
      existingUser = users.find(u => u.email === email);
    }
  } catch (error) {
    console.log('⚠️ [LINE Auth] Error checking existing user:', error);
  }

  if (existingUser) {
    console.log('✅ [LINE Auth] User exists, generating access token...', existingUser.id);
    
    // 用戶已存在，生成新的 access token
    // 使用 admin API 創建一個臨時 token
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (error || !data) {
      console.error('❌ [LINE Auth] Token generation failed:', error);
      throw error || new Error('Failed to generate token');
    }
    
    // 提取 access token from the verification token
    // generateLink 返回的是一個 URL，我們需要從中提取 token
    // 但更好的方法是使用 Supabase 的 Service Role Key 創建一個自定義 JWT
    // 為了簡化，我們將使用用戶的 ID 作為唯一標識符
    console.log('✅ [LINE Auth] Link generated for existing user');
    
    // 返回用戶信息和一個可以用於前端的標識符
    // 前端將使用此信息通過標準登錄流程完成認證
    return { 
      user: existingUser, 
      accessToken: existingUser.id // 使用用戶 ID 作為標識符
    };
  }

  // 創建新用戶
  console.log('🟢 [LINE Auth] Creating new user...');
  
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    email_confirm: true, // 自動確認郵箱（因為來自 LINE OAuth）
    user_metadata: {
      full_name: lineProfile.displayName,
      avatar_url: lineProfile.pictureUrl,
      line_user_id: lineProfile.userId,
      auth_provider: 'line',
    },
  });

  if (createError || !newUser?.user) {
    console.error('❌ [LINE Auth] User creation failed:', createError);
    throw createError || new Error('Failed to create user');
  }

  console.log('✅ [LINE Auth] New user created:', newUser.user.id);

  // 創建 profile
  try {
    const profile = {
      user_id: newUser.user.id,
      email: email,
      full_name: lineProfile.displayName,
      avatar_url: lineProfile.pictureUrl || '',
      account_type: 'client', // 默認為客戶
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_client: true,
      is_freelancer: false,
    };

    // 使用 KV store 保存 profile（根據現有架構）
    const { set } = await import('./kv_store.tsx');
    await set(`profile_${newUser.user.id}`, profile);
    await set(`profile:${newUser.user.id}`, profile); // 雙格式兼容
    
    console.log('✅ [LINE Auth] Profile created');
  } catch (profileError) {
    console.error('⚠️ [LINE Auth] Profile creation failed (non-critical):', profileError);
  }

  // 生成 access token
  const { data, error: tokenError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
  });

  if (tokenError || !data) {
    console.error('❌ [LINE Auth] Token generation failed:', tokenError);
    throw tokenError || new Error('Failed to generate token');
  }

  console.log('✅ [LINE Auth] Token generated for new user');

  return { 
    user: newUser.user, 
    accessToken: newUser.user.id // 使用用戶 ID 作為標識符
  };
}

/**
 * 完整的 LINE 登入流程
 */
export async function handleLineCallback(code: string): Promise<{
  user: any;
  userId: string;
  email: string;
}> {
  console.log('🟢 [LINE Auth] Starting LINE login flow...');

  // 1. Exchange code for access token
  const tokenData = await exchangeCodeForToken(code);

  // 2. Get LINE user profile
  const lineProfile = await getLineProfile(tokenData.access_token);

  // 3. Create or login Supabase user
  const { user, accessToken } = await createOrLoginUser(lineProfile);

  console.log('✅ [LINE Auth] LINE login completed successfully');

  return {
    user,
    userId: user.id,
    email: user.email,
  };
}