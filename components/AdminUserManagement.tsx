import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Search, DollarSign } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function AdminUserManagement() {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [userEmail, setUserEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const content = {
    en: {
      title: 'User Wallet Management',
      description: 'Add balance to user wallets',
      searchUser: 'Search User',
      userEmail: 'User Email',
      emailPlaceholder: 'Enter user email...',
      searchButton: 'Search User',
      addBalance: 'Add Balance',
      amount: 'Amount (TWD)',
      amountPlaceholder: 'Enter amount...',
      addButton: 'Add Balance',
      userNotFound: 'User not found',
      balanceAdded: 'Balance added successfully',
      error: 'Operation failed',
      userId: 'User ID',
      currentBalance: 'Current Balance',
      noUserSelected: 'Search for a user first',
      enterEmail: 'Please enter an email',
      userFound: 'User found',
      validAmount: 'Please enter a valid amount',
    },
    'zh-TW': {
      title: '用戶錢包管理',
      description: '為用戶錢包添加餘額',
      searchUser: '搜尋用戶',
      userEmail: '用戶郵箱',
      emailPlaceholder: '輸入用戶郵箱...',
      searchButton: '搜尋用戶',
      addBalance: '儲值',
      amount: '金額 (TWD)',
      amountPlaceholder: '輸入金額...',
      addButton: '儲值',
      userNotFound: '找不到用戶',
      balanceAdded: '儲值成功',
      error: '操作失敗',
      userId: '用戶 ID',
      currentBalance: '當前餘額',
      noUserSelected: '請先搜尋用戶',
      enterEmail: '請輸入郵箱',
      userFound: '找到用戶',
      validAmount: '請輸入有效金額',
    },
    'zh-CN': {
      title: '用户钱包管理',
      description: '为用户钱包添加余额',
      searchUser: '搜寻用户',
      userEmail: '用户邮箱',
      emailPlaceholder: '输入用户邮箱...',
      searchButton: '搜寻用户',
      addBalance: '储值',
      amount: '金额 (TWD)',
      amountPlaceholder: '输入金额...',
      addButton: '储值',
      userNotFound: '找不到用户',
      balanceAdded: '储值成功',
      error: '操作失败',
      userId: '用户 ID',
      currentBalance: '当前余额',
      noUserSelected: '请先搜寻用户',
      enterEmail: '请输入邮箱',
      userFound: '找到用户',
      validAmount: '请输入有效金额',
    }
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  const searchUser = async () => {
    if (!userEmail.trim()) {
      toast.error(t.enterEmail);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/get-user-by-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: userEmail.trim() }),
        }
      );

      const data = await response.json();

      if (response.ok && data.user) {
        setUserProfile(data.user);
        toast.success(t.userFound);
      } else {
        setUserProfile(null);
        toast.error(t.userNotFound);
      }
    } catch (error) {
      console.error('Error searching user:', error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const addBalance = async () => {
    if (!userProfile) {
      toast.error(t.noUserSelected);
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error(t.validAmount);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/add-test-balance`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userProfile.id,
            amount: amountNum,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`${t.balanceAdded}: NT$ ${amountNum.toLocaleString()}`);
        setAmount('');
        // 重新搜尋用戶以更新餘額
        await searchUser();
      } else {
        toast.error(data.error || t.error);
      }
    } catch (error) {
      console.error('Error adding balance:', error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t.searchUser}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userEmail">{t.userEmail}</Label>
            <div className="flex gap-2">
              <Input
                id="userEmail"
                type="email"
                placeholder={t.emailPlaceholder}
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchUser();
                  }
                }}
              />
              <Button onClick={searchUser} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {t.searchButton}
              </Button>
            </div>
          </div>

          {userProfile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">{userProfile.email}</span>
              </div>
              <div className="text-sm text-blue-700">
                <p><strong>{t.userId}:</strong> {userProfile.id}</p>
                {userProfile.wallet && (
                  <p><strong>{t.currentBalance}:</strong> NT$ {userProfile.wallet.available_balance?.toLocaleString() || 0}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Balance */}
      {userProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t.addBalance}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t.amount}</Label>
              <Input
                id="amount"
                type="number"
                placeholder={t.amountPlaceholder}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBalance();
                  }
                }}
                min="1"
                step="1"
              />
            </div>
            <Button onClick={addBalance} disabled={loading} className="w-full">
              <DollarSign className="h-4 w-4 mr-2" />
              {t.addButton}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
