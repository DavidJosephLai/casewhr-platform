import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '../utils/supabase/info';

interface SubscriptionLimits {
  plan: 'free' | 'pro' | 'enterprise';
  limits: {
    projects: number;
    proposals: number;
  };
  usage: {
    projects: number;
    proposals: number;
  };
  canCreateProject: boolean;
  canSubmitProposal: boolean;
}

export function useSubscription() {
  const { user, accessToken } = useAuth();
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = useCallback(async () => {
    if (!user || !accessToken) {
      // 未登入用戶使用默認 free plan 限制
      console.log('ℹ️ [useSubscription] No user or token, using default free plan limits');
      setLimits({
        plan: 'free',
        limits: { projects: 3, proposals: 5 },
        usage: { projects: 0, proposals: 0 },
        canCreateProject: true,
        canSubmitProposal: true,
      });
      setLoading(false);
      return;
    }

    // 🔥 優先檢查開發模式的訂閱信息
    const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
    if (devModeActive) {
      const devSubscription = localStorage.getItem('dev_mode_subscription');
      if (devSubscription) {
        try {
          const subscription = JSON.parse(devSubscription);
          console.log('🎁 [useSubscription] Using dev mode subscription:', subscription);
          
          // 🔥 安全檢查：確保 limits 存在，否則使用默認值
          const limits = subscription.limits || { projects: 999999, proposals: 999999 };
          
          setLimits({
            plan: subscription.plan || 'free',
            limits: {
              projects: limits.projects || 999999,
              proposals: limits.proposals || 999999,
            },
            usage: {
              projects: 0,
              proposals: 0,
            },
            canCreateProject: true,
            canSubmitProposal: true,
          });
          setLoading(false);
          return;
        } catch (err) {
          console.error('Failed to parse dev mode subscription:', err);
          // 🔥 出錯時繼續執行，不 return，讓它使用默認的 free plan
        }
      }
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📊 [useSubscription] Fetching limits for user:', user.id);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/check-limits/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      console.log('📊 [useSubscription] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [useSubscription] Limits fetched:', data);
        setLimits(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // 如果是 401 錯誤，靜默處理並使用默認限制
        if (response.status === 401) {
          console.log('ℹ️ [useSubscription] Unauthorized, using default free plan limits');
        } else {
          console.log('ℹ️ [useSubscription] API error:', errorData);
        }
        
        throw new Error(errorData.error || 'Failed to fetch limits');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // 靜默處理所有錯誤，不在控制台顯示 ❌ 錯誤信息
      // 只記錄調試信息
      console.log('ℹ️ [useSubscription] Using default free plan limits due to:', errorMessage);
      
      // 不設置錯誤狀態，避免顯示錯誤給用戶
      // setError() 不調用
      
      // Set default free plan limits on error
      setLimits({
        plan: 'free',
        limits: { projects: 3, proposals: 5 },
        usage: { projects: 0, proposals: 0 },
        canCreateProject: true,
        canSubmitProposal: true,
      });
    } finally {
      setLoading(false);
    }
  }, [user, accessToken]);

  const incrementUsage = async (type: 'project' | 'proposal') => {
    if (!user || !accessToken) {
      console.log('ℹ️ [useSubscription] Cannot increment usage: no user or token');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/increment-usage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ type }),
        }
      );

      if (response.ok) {
        console.log('✅ [useSubscription] Usage incremented successfully');
        // Refresh limits after incrementing
        await fetchLimits();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.log('ℹ️ [useSubscription] Failed to increment usage:', errorData);
      }
    } catch (err) {
      console.log('ℹ️ [useSubscription] Error incrementing usage:', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  // 🔄 監聽全局訂閱刷新事件
  useEffect(() => {
    const handleRefreshSubscription = () => {
      console.log('🔄 [useSubscription] Refreshing subscription limits...');
      fetchLimits();
    };

    window.addEventListener('refreshSubscription', handleRefreshSubscription);

    return () => {
      window.removeEventListener('refreshSubscription', handleRefreshSubscription);
    };
  }, [fetchLimits]);

  return {
    limits,
    loading,
    error,
    refreshLimits: fetchLimits,
    incrementUsage,
    // 提供一個更完整的 subscription 對象用於 Dashboard 顯示
    subscription: limits ? {
      plan: limits.plan,
      maxProjects: limits.limits.projects,
      maxProposals: limits.limits.proposals,
      projectsPosted: limits.usage.projects,
      proposalsSent: limits.usage.proposals,
      hasFeaturedBadge: limits.plan !== 'free',
    } : null,
  };
}