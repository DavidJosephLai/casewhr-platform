/**
 * 🌟 企業版 LOGO 管理服務
 * 
 * 功能：
 * 1. 為企業版用戶管理自定義郵件 LOGO
 * 2. 自動識別用戶訂閱等級
 * 3. 提供 LOGO 上傳、查詢、刪除功能
 */

import * as kv from './kv_store.tsx';

// 🎯 KV Store Keys
const KV_KEYS = {
  // 用戶企業 LOGO：user:enterprise-logo:{userId}
  userEnterpriseLogo: (userId: string) => `user:enterprise-logo:${userId}`,
  
  // 企業資訊：user:enterprise-info:{userId}
  userEnterpriseInfo: (userId: string) => `user:enterprise-info:${userId}`,
  
  // 默認平台 LOGO
  defaultPlatformLogo: 'system:email:logo-url',
};

// 📊 企業資訊接口
export interface EnterpriseInfo {
  userId: string;
  companyName: string;
  logoUrl: string;
  uploadedAt: string;
  lastUpdated: string;
}

/**
 * 🔍 獲取用戶的企業 LOGO URL
 * @param userId 用戶 ID
 * @returns LOGO URL 或 undefined
 */
export async function getUserEnterpriseLogo(userId: string): Promise<string | undefined> {
  try {
    const logoUrl = await kv.get(KV_KEYS.userEnterpriseLogo(userId)) as string | undefined;
    console.log('🔍 [Enterprise Logo] Get logo for user:', userId, '→', logoUrl || 'None');
    return logoUrl;
  } catch (error) {
    console.error('❌ [Enterprise Logo] Error getting logo:', error);
    return undefined;
  }
}

/**
 * 💾 設置用戶的企業 LOGO URL
 * @param userId 用戶 ID
 * @param logoUrl LOGO URL
 * @param companyName 公司名稱（可選）
 */
export async function setUserEnterpriseLogo(
  userId: string,
  logoUrl: string,
  companyName?: string
): Promise<void> {
  try {
    // 保存 LOGO URL
    await kv.set(KV_KEYS.userEnterpriseLogo(userId), logoUrl);
    
    // 保存企業資訊
    const enterpriseInfo: EnterpriseInfo = {
      userId,
      companyName: companyName || 'Enterprise Client',
      logoUrl,
      uploadedAt: enterpriseInfo?.uploadedAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    
    // 嘗試獲取現有資訊
    const existingInfo = await kv.get(KV_KEYS.userEnterpriseInfo(userId)) as EnterpriseInfo | undefined;
    if (existingInfo) {
      enterpriseInfo.uploadedAt = existingInfo.uploadedAt;
      if (!companyName) {
        enterpriseInfo.companyName = existingInfo.companyName;
      }
    }
    
    await kv.set(KV_KEYS.userEnterpriseInfo(userId), enterpriseInfo);
    
    console.log('✅ [Enterprise Logo] Set logo for user:', userId, '→', logoUrl);
    console.log('📋 [Enterprise Logo] Company:', enterpriseInfo.companyName);
  } catch (error) {
    console.error('❌ [Enterprise Logo] Error setting logo:', error);
    throw error;
  }
}

/**
 * 🗑️ 刪除用戶的企業 LOGO
 * @param userId 用戶 ID
 */
export async function deleteUserEnterpriseLogo(userId: string): Promise<void> {
  try {
    await kv.del(KV_KEYS.userEnterpriseLogo(userId));
    await kv.del(KV_KEYS.userEnterpriseInfo(userId));
    console.log('🗑️ [Enterprise Logo] Deleted logo for user:', userId);
  } catch (error) {
    console.error('❌ [Enterprise Logo] Error deleting logo:', error);
    throw error;
  }
}

/**
 * 📋 獲取用戶的企業資訊
 * @param userId 用戶 ID
 * @returns 企業資訊或 undefined
 */
export async function getUserEnterpriseInfo(userId: string): Promise<EnterpriseInfo | undefined> {
  try {
    const info = await kv.get(KV_KEYS.userEnterpriseInfo(userId)) as EnterpriseInfo | undefined;
    console.log('📋 [Enterprise Logo] Get info for user:', userId, '→', info ? 'Found' : 'None');
    return info;
  } catch (error) {
    console.error('❌ [Enterprise Logo] Error getting info:', error);
    return undefined;
  }
}

/**
 * 🎯 根據用戶訂閱等級獲取郵件 Header LOGO
 * 
 * 邏輯：
 * - 企業版用戶：使用自定義 LOGO（如果有）
 * - 其他用戶：返回 undefined（使用標準版文字 Header）
 * 
 * @param userId 用戶 ID
 * @param subscriptionTier 訂閱等級
 * @returns Header LOGO URL 或 undefined
 */
export async function getEmailHeaderLogoBySubscription(
  userId: string,
  subscriptionTier: string
): Promise<string | undefined> {
  console.log('🎯 [Enterprise Logo] Get header logo:', { userId, subscriptionTier });
  
  // 只有企業版用戶才能使用自定義 Header LOGO
  if (subscriptionTier.toLowerCase() === 'enterprise') {
    const logoUrl = await getUserEnterpriseLogo(userId);
    console.log('🌟 [Enterprise Logo] Enterprise user logo:', logoUrl || 'Not set');
    return logoUrl;
  }
  
  console.log('📧 [Enterprise Logo] Standard user - no custom header logo');
  return undefined; // 標準版/專業版用戶使用默認文字 Header
}

/**
 * 🎨 獲取郵件 Footer LOGO
 * 
 * 優先級：
 * 1. 自定義平台 LOGO（從 KV Store）
 * 2. 默認 CaseWHR LOGO
 * 
 * @returns Footer LOGO URL
 */
export async function getEmailFooterLogo(): Promise<string> {
  const customLogo = await kv.get(KV_KEYS.defaultPlatformLogo) as string | undefined;
  
  // 默認 CaseWHR LOGO
  const defaultLogo = 'https://bihplitfentxioxyjalb.supabase.co/storage/v1/object/public/platform-assets/casewhr-logo-white.png';
  
  const footerLogo = customLogo || defaultLogo;
  console.log('🎨 [Enterprise Logo] Footer logo:', footerLogo);
  
  return footerLogo;
}

/**
 * 📊 獲取所有企業版用戶的 LOGO（管理員功能）
 * @returns 企業資訊數組
 */
export async function getAllEnterpriseLogos(): Promise<EnterpriseInfo[]> {
  try {
    const keys = await kv.getByPrefix('user:enterprise-info:');
    const infos = keys.map(item => item.value as EnterpriseInfo);
    console.log('📊 [Enterprise Logo] Found', infos.length, 'enterprise clients');
    return infos;
  } catch (error) {
    console.error('❌ [Enterprise Logo] Error getting all logos:', error);
    return [];
  }
}

/**
 * 🔒 驗證用戶是否有權限設置企業 LOGO
 * @param userId 用戶 ID
 * @param subscriptionTier 訂閱等級
 * @returns 是否有權限
 */
export function canSetEnterpriseLogo(subscriptionTier: string): boolean {
  const allowed = subscriptionTier.toLowerCase() === 'enterprise';
  console.log('🔒 [Enterprise Logo] Can set logo:', { subscriptionTier, allowed });
  return allowed;
}

/**
 * 📝 企業 LOGO 使用統計
 */
export async function getEnterpriseLogoStats() {
  const allLogos = await getAllEnterpriseLogos();
  
  const stats = {
    totalEnterpriseClients: allLogos.length,
    clientsWithLogo: allLogos.filter(info => info.logoUrl).length,
    clientsWithoutLogo: allLogos.filter(info => !info.logoUrl).length,
    recentUploads: allLogos
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 5),
  };
  
  console.log('📝 [Enterprise Logo] Stats:', stats);
  return stats;
}
