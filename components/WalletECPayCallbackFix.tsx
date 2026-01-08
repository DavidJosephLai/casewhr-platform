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
  accessToken, // 🔧 新增：使用用戶的 accessToken
  loadWalletData,
  toast,
}: {
  orderId: string;
  language: string;
  projectId: string;
  publicAnonKey: string;
  accessToken: string | null; // 🔧 新增參數
  loadWalletData: () => Promise<void>;
  toast: any;
}) => {
  console.log('🔍 [ECPay] Return from ECPay detected, checking payment status:', { orderId });
  
  // 🚀 優化 1：先重新載入錢包數據（ECPay 回調可能已經完成）
  await loadWalletData();
  
  // 🔧 決定使用哪個 token（優先使用 accessToken，回退到 publicAnonKey）
  const authToken = accessToken || publicAnonKey;
  console.log('🔑 [ECPay] Using auth token:', accessToken ? 'User accessToken' : 'Public anonKey');
  
  try {
    // 查詢付款狀態
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay-payments/by-order/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
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
        
        // 🔄 開始輪詢檢查付款狀態
        toast.info(
          language === 'en'
            ? '⏳ Verifying payment with ECPay...'
            : '⏳ 正在向綠界確認付款狀態...'
        );

        let attempts = 0;
        const maxAttempts = 10; // 最多輪詢 10 次（30 秒）
        const pollInterval = 3000; // 每 3 秒查詢一次

        const pollPaymentStatus = async () => {
          attempts++;
          console.log(`💫 [ECPay Polling] Attempt ${attempts}/${maxAttempts} - Querying order status...`);

          try {
            // 🚀 直接向 ECPay 查詢訂單狀態
            const queryResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay/query-order`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  merchantTradeNo: orderId,
                }),
              }
            );

            const queryData = await queryResponse.json();
            console.log(`💫 [ECPay Polling] Query API response:`, queryData);

            if (queryData.success && queryData.status === 'confirmed') {
              // ✅ 付款已確認！
              console.log('✅ [ECPay Polling] Payment confirmed by ECPay!');
              
              toast.success(
                language === 'en'
                  ? `✅ Payment confirmed! $${queryData.payment?.amount_usd} USD added to wallet`
                  : `✅ 付款已確認！已將 $${queryData.payment?.amount_usd} USD 加入錢包`,
                { duration: 5000 }
              );

              // 刷新錢包數據
              await loadWalletData();
              return; // 停止輪詢
            } else if (queryData.success && queryData.status === 'already_confirmed') {
              // ✅ 付款已經確認過了
              console.log('✅ [ECPay Polling] Payment already confirmed');
              
              toast.success(
                language === 'en'
                  ? '✅ Payment already confirmed!'
                  : '✅ 付款已經確認！',
                { duration: 3000 }
              );

              await loadWalletData();
              return; // 停止輪詢
            } else if (queryData.success && queryData.status === 'pending') {
              // ⏳ 仍在處理中
              console.log(`⏳ [ECPay Polling] Still pending (TradeStatus: ${queryData.tradeStatus})`);

              if (attempts < maxAttempts) {
                // 繼續輪詢
                setTimeout(pollPaymentStatus, pollInterval);
              } else {
                // ⏰ 超時 - 提供手動確認選項
                const timeoutMessage = language === 'en' 
                  ? `⏰ Payment verification timeout.\n\n💡 Your payment may still be processing.\n\n✅ Solution:\n1. Scroll down to find "💰 Manual Payment Confirmation" section\n2. Click "Load My Payments" to check status\n3. If payment shows as pending, wait 5 minutes and try again\n\nOrder ID: ${orderId}` 
                  : language === 'zh-CN'
                  ? `⏰ 付款確認超時。\n\n💡 您的付款可能仍在處理中。\n\n✅ 解決方法：\n1. 向下滾動找到「💰 手動確認付款」區塊\n2. 點擊「載入我的付款記錄」檢查狀態\n3. 如果顯示待確認，請等待 5 分鐘後再試\n\n訂單編號：${orderId}`
                  : `⏰ 付款確認超時。\n\n💡 您的付款可能仍在處理中。\n\n✅ 解決方法：\n1. 向下滾動找到「💰 手動確認付款」區塊\n2. 點擊「載入我的付款記錄」檢查狀態\n3. 如果顯示待確認，請等待 5 分鐘後再試\n\n訂單編號：${orderId}`;
                
                toast.warning(timeoutMessage, { duration: 15000 });
                
                // 最後再試一次載入錢包
                await loadWalletData();
              }
            } else {
              // ❌ 錯誤
              console.error('❌ [ECPay Polling] Query failed:', queryData);
              
              if (attempts < maxAttempts) {
                setTimeout(pollPaymentStatus, pollInterval);
              } else {
                toast.error(
                  language === 'en'
                    ? '❌ Failed to verify payment. Please contact support.'
                    : '❌ 付款確認失敗，請聯繫客服。'
                );
              }
            }
          } catch (error) {
            console.error('❌ [ECPay Polling] Error:', error);
            
            if (attempts < maxAttempts) {
              // 發生錯誤，繼續嘗試
              setTimeout(pollPaymentStatus, pollInterval);
            } else {
              toast.error(
                language === 'en'
                  ? '❌ Network error. Please refresh and check your wallet.'
                  : '❌ 網絡錯誤，請刷新頁面檢查錢包。'
              );
            }
          }
        };

        // 開始輪詢
        pollPaymentStatus();
        
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