import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Wallet, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';

export function QuickDepositHelper() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const quickDeposit = async () => {
    if (!accessToken) {
      toast.error('Please login as admin first');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 [QuickDeposit] Step 1: Searching for user...');
      
      // First, search for the user
      const searchResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/get-user-by-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'davidjosephilai1@outlook.com' }),
        }
      );

      const searchData = await searchResponse.json();
      console.log('📊 [QuickDeposit] Search response:', searchData);

      if (!searchResponse.ok || !searchData.user) {
        console.error('❌ [QuickDeposit] User not found');
        toast.error('User not found: davidjosephilai1@outlook.com');
        return;
      }

      console.log('✅ [QuickDeposit] User found:', searchData.user.id);
      console.log('💰 [QuickDeposit] Step 2: Adding balance...');

      // Add balance
      const depositResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/add-test-balance`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: searchData.user.id,
            amount: 3000,
          }),
        }
      );

      const depositData = await depositResponse.json();
      console.log('📊 [QuickDeposit] Deposit response:', depositData);

      if (depositResponse.ok && depositData.success) {
        console.log('✅ [QuickDeposit] Balance added successfully');
        console.log('💰 [QuickDeposit] New balance:', depositData.wallet?.available_balance);
        toast.success(`✅ 成功為 davidjosephilai1@outlook.com 儲值 NT$ 3,000！\n新餘額: NT$ ${depositData.wallet?.available_balance?.toLocaleString() || 0}`);
      } else {
        console.error('❌ [QuickDeposit] Deposit failed:', depositData.error);
        throw new Error(depositData.error || 'Failed to deposit');
      }
    } catch (error) {
      console.error('❌ [QuickDeposit] Error:', error);
      toast.error('儲值失敗：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-green-500 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900">
          <Zap className="h-5 w-5" />
          快速儲值工具
        </CardTitle>
        <CardDescription>
          一鍵為 davidjosephilai1@outlook.com 儲值 NT$ 3,000
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={quickDeposit}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          <Wallet className="h-5 w-5 mr-2" />
          {loading ? '處理中...' : '立即儲值 NT$ 3,000'}
        </Button>
      </CardContent>
    </Card>
  );
}