import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '../utils/supabase/info';
import { Crown, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function QuickSubscriptionCheck() {
  const { user, accessToken } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = async () => {
    if (!user || !accessToken) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Checking subscription for user:', user.id);
      console.log('📧 User email:', user.email);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        // Don't throw error for 401 - silently fail
        if (response.status === 401) {
          console.log('⚠️ [QuickSubscriptionCheck] Not authenticated, skipping');
          setError('Not authenticated');
          return;
        }
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to fetch subscription: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Subscription data:', data);
      
      setSubscription(data.subscription);
      
      if (data.subscription?.plan === 'enterprise') {
        toast.success('✅ Enterprise subscription confirmed!');
      } else {
        toast.info(`Current plan: ${data.subscription?.plan || 'free'}`);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      toast.error('Failed to check subscription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && accessToken) {
      checkSubscription();
    }
  }, [user, accessToken]);

  // 🔄 監聽全局訂閱刷新事件
  useEffect(() => {
    const handleRefreshSubscription = () => {
      console.log('🔄 [QuickSubscriptionCheck] Refreshing subscription...');
      // Only refresh if user is logged in
      if (user && accessToken) {
        checkSubscription();
      }
    };

    window.addEventListener('refreshSubscription', handleRefreshSubscription);

    return () => {
      window.removeEventListener('refreshSubscription', handleRefreshSubscription);
    };
  }, [user, accessToken]);

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-purple-600" />
          Subscription Status Check
        </CardTitle>
        <CardDescription>
          Debug tool to verify your subscription tier
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Checking subscription...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 py-4 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : subscription ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Subscription Found</span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Plan:</span>
                <Badge className={
                  subscription.plan === 'enterprise' 
                    ? 'bg-purple-600 text-white' 
                    : subscription.plan === 'pro'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-500 text-white'
                }>
                  {subscription.plan?.toUpperCase() || 'FREE'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge className={
                  subscription.status === 'active' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-yellow-600 text-white'
                }>
                  {subscription.status?.toUpperCase() || 'UNKNOWN'}
                </Badge>
              </div>

              {subscription.start_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Start Date:</span>
                  <span className="text-sm font-medium">
                    {new Date(subscription.start_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {subscription.end_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">End Date:</span>
                  <span className="text-sm font-medium">
                    {new Date(subscription.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {subscription.next_billing_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next Billing:</span>
                  <span className="text-sm font-medium">
                    {new Date(subscription.next_billing_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto Renew:</span>
                <span className="text-sm font-medium">
                  {subscription.auto_renew ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {subscription.plan === 'enterprise' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-900 font-medium">
                  ✅ Enterprise features should be available
                </p>
              </div>
            )}

            {subscription.plan !== 'enterprise' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-900">
                  ℹ️ Upgrade to Enterprise to access advanced features like Contract Management
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No subscription data
          </div>
        )}

        <Button 
          onClick={checkSubscription} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        {user && (
          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
            <div>User ID: {user.id}</div>
            <div>Email: {user.email}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}