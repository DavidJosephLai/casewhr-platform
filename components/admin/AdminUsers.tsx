import { useState, useEffect } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { AdminLevel, isSuperAdmin } from '../../config/admin';
import { TalentDetailDialog } from '../TalentDetailDialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  User, 
  Search, 
  Mail, 
  Ban, 
  CheckCircle, 
  Eye, 
  Loader2, 
  Wallet,
  DollarSign 
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name?: string;
  user_type?: 'client' | 'freelancer';
  membership_tier?: 'free' | 'basic' | 'premium';
  subscription_tier?: string; // ✅ 新增：從後端獲取的訂閱等級
  subscription_status?: string; // ✅ 新增：訂閱狀態
  wallet_balance?: number; // ✅ 新增：錢包餘額
  account_types?: string[]; // ✅ 新增：帳號類型（陣列格式）
  banned?: boolean;
  is_banned?: boolean;
  created_at?: string;
}

export function AdminUsers() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  // Wallet management states
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [walletUser, setWalletUser] = useState<UserData | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);

  // Assume admin level for now (should be passed from parent or context)
  const adminLevel = AdminLevel.SUPER_ADMIN;

  // Check permissions
  const canEdit = adminLevel === AdminLevel.SUPER_ADMIN || adminLevel === AdminLevel.ADMIN;
  const canDelete = adminLevel === AdminLevel.SUPER_ADMIN;
  const canBan = canEdit;
  
  // 🔍 檢查是否為超級管理員（用於顯示修復按鈕）
  const userIsSuperAdmin = isSuperAdmin(user?.email);

  // 🐛 強制調試：輸出用戶信息和權限檢查
  console.log('='.repeat(60));
  console.log('🔍 [AdminUsers] 權限檢查:');
  console.log('  - user object:', user);
  console.log('  - user.email:', user?.email);
  console.log('  - userIsSuperAdmin:', userIsSuperAdmin);
  console.log('  - isSuperAdmin function result:', isSuperAdmin(user?.email));
  console.log('='.repeat(60));
  
  const content = {
    en: {
      title: 'User Management',
      search: 'Search users...',
      email: 'Email',
      name: 'Name',
      type: 'Type',
      membership: 'Membership',
      actions: 'Actions',
      client: 'Client',
      freelancer: 'Freelancer',
      viewProfile: 'View Profile',
      ban: 'Ban',
      unban: 'Unban',
      banned: 'Banned',
      active: 'Active',
      wallet: 'Wallet',
      addBalance: 'Add Balance',
      noUsers: 'No users found',
      banSuccess: 'User banned successfully',
      unbanSuccess: 'User unbanned successfully',
      error: 'An error occurred',
      walletTitle: 'Add Balance',
      walletDescription: 'Add funds to user wallet',
      amount: 'Amount',
      amountPlaceholder: 'Enter amount',
      cancel: 'Cancel',
      confirm: 'Confirm',
    },
    'zh-TW': {
      title: '用戶管理',
      search: '搜索用戶...',
      email: '電子郵件',
      name: '名稱',
      type: '類型',
      membership: '會員等級',
      actions: '操作',
      client: '客戶',
      freelancer: '自由工作者',
      viewProfile: '查看資',
      ban: '封禁',
      unban: '解封',
      banned: '已封禁',
      active: '正常',
      wallet: '錢包',
      addBalance: '添加餘額',
      noUsers: '未找到用戶',
      banSuccess: '用戶已成功封禁',
      unbanSuccess: '用戶已成功解封',
      error: '發生錯誤',
      walletTitle: '添加餘額',
      walletDescription: '向用戶錢包添加資金',
      amount: '金額',
      amountPlaceholder: '輸入金額',
      cancel: '取消',
      confirm: '確認',
    },
    'zh-CN': {
      title: '用户管理',
      search: '搜索用户...',
      email: '电子邮件',
      name: '名称',
      type: '类型',
      membership: '会员等级',
      actions: '操作',
      client: '客户',
      freelancer: '自由工作者',
      viewProfile: '查看资料',
      ban: '封禁',
      unban: '解封',
      banned: '已封禁',
      active: '正常',
      wallet: '钱包',
      addBalance: '添加余额',
      noUsers: '未找到用户',
      banSuccess: '用户已成功封禁',
      unbanSuccess: '用户已成功解封',
      error: '发生错误',
      walletTitle: '添加余额',
      walletDescription: '向用户钱包添加资金',
      amount: '金额',
      amountPlaceholder: '输入金额',
      cancel: '取消',
      confirm: '确认',
    },
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  useEffect(() => {
    if (accessToken) {
      fetchUsers();
    }
  }, [accessToken]);

  const fetchUsers = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [AdminUsers] 獲取用戶數據:', data.users);
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, shouldBan: boolean) => {
    if (!accessToken) return;

    setActionLoading(userId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/users/${userId}/ban`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ banned: shouldBan }),
        }
      );

      if (response.ok) {
        toast.success(shouldBan ? t.banSuccess : t.unbanSuccess);
        fetchUsers();
      } else {
        throw new Error('Failed to ban/unban user');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error(t.error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewProfile = async (userId: string) => {
    console.log('👤 [AdminUsers] Fetching profile for user:', userId);
    setLoadingProfile(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const profile = data.profile;
        
        console.log('✅ [AdminUsers] Profile fetched:', {
          user_id: profile.user_id,
          full_name: profile.full_name || profile.name,
          email: profile.email,
          job_title: profile.job_title
        });

        // 轉換為 TalentDetailDialog 需要的格式
        const talentData = {
          id: profile.user_id,
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name || profile.name || profile.email,
          phone: profile.phone,
          company: profile.company,
          job_title: profile.job_title,
          bio: profile.bio,
          skills: profile.skills,
          website: profile.website,
          created_at: profile.created_at,
          avatar_url: profile.avatar_url,
        };

        setSelectedUser(talentData);
        setDetailDialogOpen(true);
      } else {
        console.error('❌ [AdminUsers] Failed to fetch profile, status:', response.status);
        toast.error(language === 'en' ? 'Failed to load user profile' : '載入用戶資料失敗');
      }
    } catch (error) {
      console.error('❌ [AdminUsers] Error fetching profile:', error);
      toast.error(language === 'en' ? 'Failed to load user profile' : '載入用戶資料失敗');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleOpenWallet = (user: UserData) => {
    setWalletUser(user);
    setDepositAmount('');
    setWalletDialogOpen(true);
  };

  const handleAddBalance = async () => {
    if (!walletUser || !accessToken) return;

    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error(language === 'en' ? 'Please enter a valid amount' : '請輸入有效金額');
      return;
    }

    setWalletLoading(true);
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
            user_id: walletUser.id,
            amount: amount,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(
          language === 'en' 
            ? `Successfully added NT$ ${amount.toLocaleString()} to ${walletUser.email}` 
            : `成功為 ${walletUser.email} 儲值 NT$ ${amount.toLocaleString()}`
        );
        setWalletDialogOpen(false);
        setDepositAmount('');
      } else {
        throw new Error(data.error || 'Failed to add balance');
      }
    } catch (error) {
      console.error('Error adding balance:', error);
      toast.error(language === 'en' ? 'Failed to add balance' : '儲值失敗');
    } finally {
      setWalletLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.id?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t.title}
            </CardTitle>
            <div className="text-sm text-gray-600">
              {filteredUsers.length} {language === 'en' ? 'users' : '位用戶'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Fix Button */}
          <div className="mb-6 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.email}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.name}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.type}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.membership}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      {t.noUsers}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewProfile(user.id)}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer"
                          disabled={loadingProfile}
                        >
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm underline">{user.email}</span>
                          {loadingProfile && <Loader2 className="h-3 w-3 animate-spin" />}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{user.name || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          {user.user_type === 'client' ? t.client : t.freelancer}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="text-xs w-fit">
                            {user.subscription_tier || user.membership_tier || 'free'}
                          </Badge>
                          {user.wallet_balance !== undefined && (
                            <span className="text-xs text-gray-500">
                              💰 NT$ {user.wallet_balance.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {user.is_banned ? (
                          <Badge variant="destructive" className="text-xs">
                            <Ban className="h-3 w-3 mr-1" />
                            {t.banned}
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t.active}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenWallet(user)}
                            className="min-w-[80px]"
                            title={t.wallet}
                          >
                            <Wallet className="h-4 w-4 mr-1" />
                            {t.wallet}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewProfile(user.id)}
                            disabled={loadingProfile}
                            className="min-w-[80px]"
                          >
                            {loadingProfile ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                {t.viewProfile}
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant={user.is_banned ? "outline" : "destructive"}
                            onClick={() => handleBanUser(user.id, !user.is_banned)}
                            disabled={actionLoading === user.id}
                            className="min-w-[60px]"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.is_banned ? (
                              t.unban
                            ) : (
                              t.ban
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {selectedUser && (
        <TalentDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          talent={selectedUser}
        />
      )}

      {/* Wallet Dialog */}
      <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              {t.walletTitle}
            </DialogTitle>
            <DialogDescription>
              {t.walletDescription}
              {walletUser && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>{t.email}:</strong> {walletUser.email}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    <strong>User ID:</strong> {walletUser.id}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t.amount}</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  placeholder={t.amountPlaceholder}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddBalance()}
                  className="pl-10"
                  min="1"
                  step="1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWalletDialogOpen(false)}
              disabled={walletLoading}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleAddBalance}
              disabled={walletLoading || !depositAmount}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {walletLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Processing...' : '處理中...'}
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  {t.confirm}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}