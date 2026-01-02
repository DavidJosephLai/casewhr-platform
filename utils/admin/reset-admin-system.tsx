// ==================== 🔄 管理員系統重置工具 ====================
// Admin System Reset Utility
// 
// 這個工具用於重置管理員系統的初始化狀態
// 使用方法：在瀏覽器控制台中執行 resetAdminSystem()

import { projectId, publicAnonKey } from '../supabase/info';

/**
 * 重置管理員系統
 * 需要超級管理員權限
 */
export async function resetAdminSystem(accessToken: string): Promise<void> {
  try {
    console.log('🔄 [Admin Reset] Starting admin system reset...');
    console.log('🔑 [Admin Reset] Using access token:', accessToken ? '✅ Provided' : '❌ Missing');

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/reset-admin-system`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ [Admin Reset] Success!', data);
      console.log('💡 [Admin Reset] The admin system will reinitialize on the next API call');
      console.log('🔄 [Admin Reset] Please refresh the page to see the changes');
      return data;
    } else {
      console.error('❌ [Admin Reset] Error:', data);
      throw new Error(data.error || 'Failed to reset admin system');
    }
  } catch (error) {
    console.error('❌ [Admin Reset] Exception:', error);
    throw error;
  }
}

/**
 * 獲取當前用戶的訪問令牌
 * 從 Supabase getSession() 中讀取
 */
export function getAccessToken(): string | null {
  try {
    // 嘗試查找所有 Supabase auth keys
    const keys = Object.keys(localStorage).filter(key => 
      key.includes('auth-token') || key.startsWith('sb-')
    );
    
    console.log('🔍 [getAccessToken] Found localStorage keys:', keys);
    
    // 嘗試每個可能的 key
    for (const key of keys) {
      try {
        const storageItem = localStorage.getItem(key);
        if (!storageItem) continue;
        
        const authData = JSON.parse(storageItem);
        const accessToken = authData?.access_token;
        
        if (accessToken) {
          console.log('✅ [getAccessToken] Access token found in key:', key);
          return accessToken;
        }
      } catch (e) {
        // Continue to next key
      }
    }
    
    console.error('❌ [getAccessToken] No access token found in any localStorage key');
    return null;
  } catch (error) {
    console.error('❌ [getAccessToken] Error getting access token:', error);
    return null;
  }
}

/**
 * 一鍵重置函數（自動獲取 token）
 * 在瀏覽器控制台中直接調用
 */
export async function quickResetAdminSystem(): Promise<void> {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    console.error('❌ [Admin Reset] Cannot reset: No access token available');
    console.error('💡 [Admin Reset] Please make sure you are logged in');
    return;
  }

  console.log('🚀 [Admin Reset] Quick reset starting...');
  await resetAdminSystem(accessToken);
}

// 將函數掛載到 window 對象，方便在控制台調用
if (typeof window !== 'undefined') {
  (window as any).resetAdminSystem = resetAdminSystem;
  (window as any).quickResetAdminSystem = quickResetAdminSystem;
  (window as any).getAccessToken = getAccessToken;
  
  console.log('✅ [Admin Reset] Utility functions loaded:');
  console.log('   - window.quickResetAdminSystem() - 一鍵重置管理員系統');
  console.log('   - window.resetAdminSystem(token) - 使用指定 token 重置');
  console.log('   - window.getAccessToken() - 獲取當前訪問令牌');
}