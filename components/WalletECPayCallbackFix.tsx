/**
 * 🔧 ECPay Callback Fix
 * 
 * 這個檔案包含修復後的 ECPay 回調處理邏輯
 * 主要改進：
 * 1. 返回時立即重新載入錢包
 * 2. 檢查付款狀態
 * 3. 如果是 pending，自動輪詢檢查（每 3 秒，最多 10 次）
 * 4. 更好的錯誤處理
 */

export const handleECPayCallback = async ({
  orderId,
  language,
  projectId,
  publicAnonKey,
  loadWalletData,
  toast,
}: {
  orderId: string;
  language: string;
  projectId: string;
  publicAnonKey: string;
  loadWalletData: () => Promise<void>;
  toast: any;
}) => {
  console.log('🔍 [ECPay] Return from ECPay detected, checking payment status:', { orderId });
  
  // 🚀 優化 1：先重新載入錢包數據（ECPay 回調可能已經完成）
  await loadWalletData();
  
  try {
    // 查詢付款狀態（使用 publicAnonKey，因為這是公開 API）
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay-payments/by-order/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const paymentData = data.payment;
      
      console.log('📊 [ECPay] Payment status:', {
        orderId,
        status: paymentData?.status,
        amount: paymentData?.amount_twd,
        userId: paymentData?.user_id
      });
      
      if (paymentData?.status === 'confirmed') {
        // ✅ 付款已確認，顯示成功訊息
        toast.success(
          language === 'en' 
            ? '🎉 綠界付款成功！您的錢包餘額已更新。\n\n📄 電子發票將於 24 小時內開立\n🔍 查詢請至：財政部電子發票整合服務平台\nhttps://www.einvoice.nat.gov.tw/' 
            : language === 'zh-CN'
            ? '🎉 绿界付款成功！您的钱包余额已更新。\n\n📄 电子发票将于 24 小时内开立\n🔍 查询请至：财政部电子发票整合服务平台\nhttps://www.einvoice.nat.gov.tw/'
            : '🎉 綠界付款成功！您的錢包餘額已更新。\n\n📄 電子發票將於 24 小時內開立\n🔍 查詢請至：財政部電子發票整合服務平台\nhttps://www.einvoice.nat.gov.tw/',
          { duration: 8000 }
        );
        
        // 再次重新加載錢包數據確保最新
        setTimeout(() => {
          loadWalletData();
        }, 1000);
        
      } else if (paymentData?.status === 'pending') {
        // ⏳ 付款待處理 - 顯示等待訊息並定期檢查
        toast.info(
          language === 'en' 
            ? '⏳ Payment is being processed. Please wait a moment...' 
            : language === 'zh-CN'
            ? '⏳ 付款处理中，请稍候...'
            : '⏳ 付款處理中，請稍候...',
          { duration: 5000 }
        );
        
        // 🔄 每 3 秒檢查一次，最多檢查 10 次（30 秒）
        let checkCount = 0;
        const maxChecks = 10;
        
        const checkPaymentStatus = async () => {
          checkCount++;
          
          try {
            const checkResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay-payments/by-order/${orderId}`,
              {
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
              }
            );
            
            if (checkResponse.ok) {
              const checkData = await checkResponse.json();
              const checkPaymentData = checkData.payment;
              
              console.log(`🔍 [ECPay] Payment check ${checkCount}/${maxChecks}:`, checkPaymentData?.status);
              
              if (checkPaymentData?.status === 'confirmed') {
                // ✅ 付款確認成功
                toast.success(
                  language === 'en' 
                    ? '🎉 綠界付款成功！您的錢包餘額已更新。' 
                    : language === 'zh-CN'
                    ? '🎉 绿界付款成功！您的钱包余额已更新。'
                    : '🎉 綠界付款成功！您的錢包餘額已更新。',
                  { duration: 5000 }
                );
                
                await loadWalletData();
                return; // 停止檢查
                
              } else if (checkPaymentData?.status === 'rejected') {
                // ❌ 付款失敗
                toast.error(
                  language === 'en' 
                    ? '❌ Payment failed. Please try again or contact support.' 
                    : language === 'zh-CN'
                    ? '❌ 付款失败，请重试或联系客服。'
                    : '❌ 付款失敗，請重試或聯繫客服。',
                  { duration: 5000 }
                );
                return; // 停止檢查
                
              } else if (checkCount < maxChecks) {
                // 繼續檢查
                setTimeout(checkPaymentStatus, 3000);
              } else {
                // ⏰ 超時
                toast.warning(
                  language === 'en' 
                    ? '⏰ Payment verification timeout. Please refresh the page in a moment.' 
                    : language === 'zh-CN'
                    ? '⏰ 付款确认超时，请稍后刷新页面。'
                    : '⏰ 付款確認超時，請稍後刷新頁面。',
                  { duration: 5000 }
                );
                
                // 最後再試一次載入錢包
                await loadWalletData();
              }
            }
          } catch (error) {
            console.error(`❌ [ECPay] Error checking payment status (attempt ${checkCount}):`, error);
            
            // 如果是最後一次檢查，還是嘗試載入錢包
            if (checkCount >= maxChecks) {
              await loadWalletData();
            }
          }
        };
        
        // 3 秒後開始第一次檢查
        setTimeout(checkPaymentStatus, 3000);
        
      } else if (paymentData?.status === 'rejected') {
        // ❌ 付款失敗
        toast.error(
          language === 'en' 
            ? '❌ Payment failed. Please try again or contact support.' 
            : language === 'zh-CN'
            ? '❌ 付款失败，请重试或联系客服。'
            : '❌ 付款失敗，請重試或聯繫客服。',
          { duration: 5000 }
        );
      }
    } else {
      console.warn('⚠️ [ECPay] Payment not found, might still be processing');
      toast.info(
        language === 'en' 
          ? '⏳ Checking payment status...' 
          : language === 'zh-CN'
          ? '⏳ 正在确认付款状态...'
          : '⏳ 正在確認付款狀態...',
        { duration: 3000 }
      );
      
      // 等待 5 秒後重新載入錢包
      setTimeout(() => {
        loadWalletData();
      }, 5000);
    }
  } catch (error) {
    console.error('❌ [ECPay] Error checking payment status:', error);
    
    // 即使出錯也重新載入錢包，以防後端已經處理成功
    setTimeout(() => {
      loadWalletData();
    }, 3000);
  }
};
