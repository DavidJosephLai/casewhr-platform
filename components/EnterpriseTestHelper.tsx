import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Zap, Wallet, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';

export function EnterpriseTestHelper() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [targetEmail, setTargetEmail] = useState('davidjosephilai1@gmail.com');
  const [walletAmount, setWalletAmount] = useState(50000);

  const setupEnterpriseAccount = async () => {
    if (!accessToken) {
      toast.error('請先登入管理員帳號');
      return;
    }

    if (!targetEmail || !targetEmail.includes('@')) {
      toast.error('請輸入有效的用戶郵箱');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 [Enterprise] Setting up Enterprise for:', targetEmail);
      
      // Step 1: Get user by email
      console.log('📋 [Enterprise] Step 1: Getting user info...');
      const userResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/get-user-by-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: targetEmail,
          }),
        }
      );

      const userData = await userResponse.json();
      console.log('📊 [Enterprise] User response:', userData);

      if (!userResponse.ok || !userData.user) {
        throw new Error(userData.error || '找不到該用戶');
      }

      const userId = userData.user.id;
      console.log('✅ [Enterprise] Found user ID:', userId);

      // Step 2: Create Enterprise subscription
      console.log('📋 [Enterprise] Step 2: Creating Enterprise subscription...');
      const subResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/create-test-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            plan: 'enterprise',
            payment_method: 'admin_upgrade',
          }),
        }
      );

      const subData = await subResponse.json();
      console.log('📊 [Enterprise] Subscription response:', subData);

      if (!subResponse.ok) {
        throw new Error(subData.error || 'Failed to create subscription');
      }

      console.log('✅ [Enterprise] Subscription created successfully');

      // Step 3: Add wallet balance
      console.log('💰 [Enterprise] Step 3: Adding wallet balance...');
      const walletResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/add-test-balance`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            amount: walletAmount,
          }),
        }
      );

      const walletData = await walletResponse.json();
      console.log('📊 [Enterprise] Wallet response:', walletData);

      if (!walletResponse.ok) {
        throw new Error(walletData.error || 'Failed to add balance');
      }

      console.log('✅ [Enterprise] Wallet balance added successfully');

      // Success!
      toast.success(
        `🎉 Enterprise 設置完成！\n\n` +
        `👤 用戶: ${targetEmail}\n` +
        `✅ 訂閱方案: Enterprise\n` +
        `💰 錢包餘額: NT$ ${walletAmount.toLocaleString()}\n` +
        `🚀 所有功能已解鎖`,
        { duration: 8000 }
      );

    } catch (error) {
      console.error('❌ [Enterprise] Error:', error);
      toast.error('設置失敗：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <Crown className="h-6 w-6 text-amber-600" />
          Enterprise 升級工具（管理員專用）
        </CardTitle>
        <CardDescription className="text-amber-700">
          為指定用戶升級到 Enterprise 並充值錢包
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="targetEmail">目標用戶郵箱</Label>
          <Input
            id="targetEmail"
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="user@example.com"
            className="border-amber-300 focus:border-amber-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="walletAmount">錢包充值金額（TWD）</Label>
          <Input
            id="walletAmount"
            type="number"
            value={walletAmount}
            onChange={(e) => setWalletAmount(Number(e.target.value))}
            placeholder="50000"
            min="0"
            step="1000"
            className="border-amber-300 focus:border-amber-500"
          />
        </div>

        <div className="p-4 bg-white rounded-lg border border-amber-200 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Crown className="h-4 w-4 text-amber-600" />
            <span className="font-medium">訂閱方案:</span>
            <span className="text-amber-700">Enterprise</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-green-600" />
            <span className="font-medium">錢包餘額:</span>
            <span className="text-green-700">NT$ {walletAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="font-medium">功能:</span>
            <span className="text-blue-700">無限專案、團隊協作、優先支援</span>
          </div>
        </div>

        <Button
          onClick={setupEnterpriseAccount}
          disabled={loading || !targetEmail}
          className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-semibold py-6"
          size="lg"
        >
          <Crown className="h-5 w-5 mr-2" />
          {loading ? '設置中...' : '🚀 升級用戶到 Enterprise'}
        </Button>

        <p className="text-xs text-amber-600 text-center">
          ⚠️ 僅超級管理員可使用此功能
        </p>
      </CardContent>
    </Card>
  );
}