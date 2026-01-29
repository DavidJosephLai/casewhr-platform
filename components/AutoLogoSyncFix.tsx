import { useEffect, useRef } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AutoLogoSyncFixProps {
  userId: string;
}

/**
 * 🔄 自動檢測並修復企業 LOGO 同步問題
 * 
 * 在背景中自動執行，不需要用戶手動操作：
 * 1. 檢查用戶是否為 Enterprise 訂閱
 * 2. 檢查是否有品牌設定 LOGO
 * 3. 檢查企業 LOGO 是否已同步
 * 4. 如果未同步，自動執行同步
 */
export function AutoLogoSyncFix({ userId }: AutoLogoSyncFixProps) {
  const hasRun = useRef(false);

  useEffect(() => {
    // 防止重複執行
    if (hasRun.current) return;
    hasRun.current = true;

    const autoFixLogo = async () => {
      try {
        console.log('🔍 [AutoFix] Checking enterprise logo sync status for user:', userId);

        // 1. 檢查訂閱狀態
        const subResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/status?userId=${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        const subData = await subResponse.json();

        // 如果不是 Enterprise，不需要修復
        if (!subData.hasEnterprise && !subData.isRootAdmin) {
          console.log('⏭️ [AutoFix] User is not Enterprise, skipping logo sync');
          return;
        }

        console.log('✅ [AutoFix] User is Enterprise or Root Admin');

        // 2. 檢查品牌設定
        const brandingResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/branding/config?userId=${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        const brandingData = await brandingResponse.json();

        // 如果沒有品牌設定 LOGO，不需要修復
        if (!brandingData.hasConfig || !brandingData.logoUrl) {
          console.log('⏭️ [AutoFix] No branding logo found, skipping sync');
          return;
        }

        console.log('✅ [AutoFix] Branding logo found:', brandingData.logoUrl);

        // 3. 檢查企業 LOGO
        const logoResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/public/enterprise-logo/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        const logoData = await logoResponse.json();

        // 如果企業 LOGO 已存在，不需要修復
        if (logoData.hasLogo) {
          console.log('✅ [AutoFix] Enterprise logo already synced, no fix needed');
          return;
        }

        console.log('⚠️ [AutoFix] Enterprise logo not synced! Auto-fixing...');

        // 4. 執行自動同步（使用公開 API，不需要授權）
        const accessToken = localStorage.getItem('supabase_auth_token');
        
        const syncResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/sync-enterprise-logo-public`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken || publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
            }),
          }
        );

        if (syncResponse.ok) {
          const result = await syncResponse.json();
          console.log('✅ [AutoFix] Enterprise logo synced automatically:', result);
        } else {
          const error = await syncResponse.text();
          console.error('❌ [AutoFix] Failed to auto-sync logo:', error);
        }
      } catch (error) {
        console.error('❌ [AutoFix] Error during auto-fix:', error);
      }
    };

    // 延遲 2 秒執行，避免影響頁面初始載入
    const timer = setTimeout(() => {
      autoFixLogo();
    }, 2000);

    return () => clearTimeout(timer);
  }, [userId]);

  // 這個組件不渲染任何內容
  return null;
}
