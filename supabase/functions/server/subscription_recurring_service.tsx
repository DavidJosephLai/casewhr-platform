/**
 * 獲取用戶訂閱狀態
 * ✅ 自動檢查是否過期，過期則降級為 free
 */
export async function getUserSubscription(userId: string): Promise<any> {
  const subscription = await kv.get(`subscription_${userId}`);
  
  if (!subscription) {
    return {
      plan: 'free',
      status: 'active',
      payment_method: null,
      auto_renew: false,
    };
  }
  
  // ✅ 檢查訂閱是否已過期（且未自動續費）
  if (subscription.next_billing_date && subscription.status === 'active') {
    const now = new Date();
    const nextBillingDate = new Date(subscription.next_billing_date);
    
    // 如果已過期且未自動續費，降級為 free
    if (now > nextBillingDate && !subscription.auto_renew) {
      console.log(`⏰ [Subscription] User ${userId} subscription expired, downgrading to free`);
      
      subscription.plan = 'free';
      subscription.status = 'expired';
      subscription.expired_at = now.toISOString();
      subscription.updated_at = now.toISOString();
      
      // 更新資料庫
      await kv.set(`subscription_${userId}`, subscription);
    }
  }
  
  return subscription;
}