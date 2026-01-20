import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import { isSuperAdmin, getAdminLevel } from '../../config/admin';
import { projectId } from '../../utils/supabase/info';
import adminApi from '../../lib/adminApi'; // ✅ Import the new admin API client
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Users,
  Search,
  UserPlus,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  Mail,
  DollarSign,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  user_id: string;
  email: string;
  name?: string;
  full_name?: string;  // ✅ 加入 full_name 欄位
  account_types?: string[];
  account_type?: string;  // ✅ 向後兼容
  wallet_balance: number;
  subscription_tier: string;
  subscription_status: string;
  status?: string;
  created_at: string;
}

interface UserDetails {
  profile: any;
  wallet: any;
  subscription: any;
  stats: {
    totalProjects: number;
    totalProposals: number;
    recentTransactions: any[];
  };
}

export function UserManagement() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserAccountType, setNewUserAccountType] = useState('client');

  const userIsSuperAdmin = isSuperAdmin(user?.email);
  const userAdminLevel = getAdminLevel(user?.email);
  const canAddDeleteUsers = userAdminLevel === 'SUPER_ADMIN' || userAdminLevel === 'ADMIN';
  const canModifyUsers = userAdminLevel !== null; // All admin levels can view and suspend

  const t = {
    en: {
      title: 'User Management',
      description: 'View and manage platform users',
      search: 'Search users...',
      email: 'Email',
      name: 'Name',
      type: 'Type',
      balance: 'Balance',
      subscription: 'Subscription',
      status: 'Status',
      actions: 'Actions',
      viewDetails: 'View Details',
      active: 'Active',
      suspended: 'Suspended',
      client: 'Client',
      freelancer: 'Freelancer',
      loading: 'Loading users...',
      noUsers: 'No users found',
      userDetails: 'User Details',
      totalProjects: 'Total Projects',
      totalProposals: 'Total Proposals',
      recentTransactions: 'Recent Transactions',
      close: 'Close',
      suspendUser: 'Suspend User',
      activateUser: 'Activate User',
      addUser: 'Add User',
      emailPlaceholder: 'Email',
      passwordPlaceholder: 'Password',
      namePlaceholder: 'Name',
      accountType: 'Account Type',
      add: 'Add',
      cancel: 'Cancel',
      deleteUser: 'Delete User',
      deleteUserConfirm: 'Are you sure you want to delete this user? This action cannot be undone.',
      password: 'Password',
      resetWallet: 'Reset Wallet',
      resetWalletConfirm: 'Are you sure you want to reset this user\'s wallet balance to zero? This action cannot be undone.',
      resetReason: 'Reason for reset (optional)',
      resetReasonPlaceholder: 'Enter reason for wallet reset...',
      resetSuccess: 'Wallet reset successfully',
      resetError: 'Failed to reset wallet',
      superAdminOnly: 'Super Admin Only',
    },
    'zh-TW': {
      title: '用戶管理',
      description: '查看和管理平台用戶',
      search: '搜尋用戶...',
      email: '電子郵件',
      name: '姓名',
      type: '類型',
      balance: '餘額',
      subscription: '訂閱',
      status: '狀態',
      actions: '操作',
      viewDetails: '查看詳情',
      active: '正常',
      suspended: '已停用',
      client: '案主',
      freelancer: '接案者',
      loading: '載入用戶中...',
      noUsers: '未找到用戶',
      userDetails: '用戶詳情',
      totalProjects: '總項目數',
      totalProposals: '總提案數',
      recentTransactions: '最近交易',
      close: '關閉',
      suspendUser: '停用用戶',
      activateUser: '啟用用戶',
      addUser: '新增用戶',
      emailPlaceholder: '電子郵件',
      passwordPlaceholder: '密碼',
      namePlaceholder: '姓名',
      accountType: '帳戶類型',
      add: '新增',
      cancel: '取消',
      deleteUser: '刪除用戶',
      deleteUserConfirm: '確定要刪除此用戶嗎？此操作無法撤銷。',
      password: '密碼',
      resetWallet: '錢包歸零',
      resetWalletConfirm: '確定要將此用戶的錢包餘額歸零嗎？此操作無法撤銷。',
      resetReason: '歸原因（選填）',
      resetReasonPlaceholder: '輸入錢包歸零的因...',
      resetSuccess: '錢包歸零成功',
      resetError: '錢包歸零失敗',
      superAdminOnly: '僅超級管理員',
    },
    'zh-CN': {
      title: '用户管理',
      description: '查看和管理平台用户',
      search: '搜索用户...',
      email: '电子邮件',
      name: '姓名',
      type: '类型',
      balance: '余额',
      subscription: '订阅',
      status: '状态',
      actions: '操作',
      viewDetails: '查看详情',
      active: '正常',
      suspended: '已停用',
      client: '案主',
      freelancer: '接案者',
      loading: '载入用户中...',
      noUsers: '未找到用户',
      userDetails: '用户详情',
      totalProjects: '总项目数',
      totalProposals: '总提案数',
      recentTransactions: '最近交易',
      close: '关闭',
      suspendUser: '停用用户',
      activateUser: '启用用户',
      addUser: '新增用户',
      emailPlaceholder: '电子邮件',
      passwordPlaceholder: '密码',
      namePlaceholder: '姓名',
      accountType: '账户类型',
      add: '新增',
      cancel: '取消',
      deleteUser: '删除用户',
      deleteUserConfirm: '确定要删除此用户吗？此操作无法撤销。',
      password: '密码',
      resetWallet: '钱包归零',
      resetWalletConfirm: '确定要将此用户的钱包余额归零吗？操作无法撤销。',
      resetReason: '归零原因（选填）',
      resetReasonPlaceholder: '输入钱包归零的原因...',
      resetSuccess: '钱包归零成功',
      resetError: '钱包归零失败',
      superAdminOnly: '仅超级管理员',
    }
  };

  const text = t[language as keyof typeof t] || t['zh-TW'];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.email?.toLowerCase().includes(query) ||
        user.name?.toLowerCase().includes(query) ||
        user.user_id?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(accessToken); // ✅ Use the adminApi
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(language === 'en' ? 'Failed to load users' : '載入用戶失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const data = await adminApi.getUserDetails(userId, accessToken); // ✅ Use the adminApi
      setSelectedUser(data.user);
      setShowDetailsDialog(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error(language === 'en' ? 'Failed to load user details' : '載入用戶詳情失敗');
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      await adminApi.updateUserStatus(userId, status, accessToken); // ✅ Use the adminApi
      toast.success(
        language === 'en' 
          ? `User ${status === 'suspended' ? 'suspended' : 'activated'} successfully`
          : `用戶已${status === 'suspended' ? '停用' : '啟用'}`
      );
      fetchUsers();
      setShowDetailsDialog(false);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(language === 'en' ? 'Failed to update user status' : '更新用戶狀態失敗');
    }
  };

  const addUser = async () => {
    setAdding(true);
    try {
      await adminApi.createUser({ // ✅ Use the adminApi
        email: newUserEmail,
        password: newUserPassword,
        name: newUserName,
        account_type: newUserAccountType
      }, accessToken);
      
      toast.success(
        language === 'en' 
          ? 'User added successfully'
          : '用戶新增成功'
      );
      fetchUsers();
      setShowAddDialog(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setNewUserAccountType('client');
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to add user' : '新增用戶失敗'));
    } finally {
      setAdding(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm(text.deleteUserConfirm)) {
      return;
    }

    try {
      await adminApi.deleteUser(userId, accessToken); // ✅ Use the adminApi
      toast.success(
        language === 'en' 
          ? 'User deleted successfully'
          : '用戶刪除成功'
      );
      fetchUsers();
      setShowDetailsDialog(false);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to delete user' : '刪除用戶失敗'));
    }
  };

  const resetWallet = async (userId: string, reason: string) => {
    if (!confirm(text.resetWalletConfirm)) {
      return;
    }

    try {
      await adminApi.resetWallet(userId, accessToken); // ✅ Use the adminApi
      toast.success(text.resetSuccess);
      // Refresh user details
      await fetchUserDetails(userId);
      fetchUsers();
    } catch (error: any) {
      console.error('Error resetting wallet:', error);
      toast.error(error.message || text.resetError);
    }
  };

  const getSubscriptionBadge = (tier: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800',
      professional: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge className={colors[tier] || colors.free}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Admin Level Indicator */}
      {userAdminLevel && userAdminLevel !== 'SUPER_ADMIN' && (
        <div className={`p-3 rounded-lg ${
          userAdminLevel === 'ADMIN' 
            ? 'bg-blue-50 border border-blue-200' 
            : 'bg-green-50 border border-green-200'
        }`}>
          <p className="text-sm">
            <strong>
              {language === 'en' ? 'Your Role: ' : '您的角色：'}
              {userAdminLevel === 'ADMIN' 
                ? (language === 'en' ? 'Administrator' : '普通管理員')
                : (language === 'en' ? 'Moderator' : '審核員')
              }
            </strong>
            {' - '}
            {userAdminLevel === 'ADMIN'
              ? (language === 'en' 
                  ? 'You can view, add, delete, and suspend users.'
                  : '您可以查看、添加、刪除和停用用戶。')
              : (language === 'en'
                  ? 'You can view and suspend users.'
                  : '您可以查看和停用用戶。')
            }
          </p>
        </div>
      )}
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {text.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{text.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={text.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {canAddDeleteUsers && (
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                {text.addUser}
              </Button>
            )}
          </div>
        </div>
        <div>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{text.loading}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{text.noUsers}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{text.email}</TableHead>
                    <TableHead>{text.name}</TableHead>
                    <TableHead>{text.type}</TableHead>
                    <TableHead>{text.balance}</TableHead>
                    <TableHead>{text.subscription}</TableHead>
                    <TableHead>{text.status}</TableHead>
                    <TableHead className="text-right">{text.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{user.full_name || user.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.account_types?.includes('client') && (
                            <Badge variant="outline" className="text-xs">
                              {text.client}
                            </Badge>
                          )}
                          {user.account_types?.includes('freelancer') && (
                            <Badge variant="outline" className="text-xs">
                              {text.freelancer}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          {user.wallet_balance?.toFixed(2) || '0.00'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSubscriptionBadge(user.subscription_tier)}
                      </TableCell>
                      <TableCell>
                        {user.status === 'suspended' ? (
                          <Badge variant="destructive">{text.suspended}</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">{text.active}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchUserDetails(user.user_id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {text.viewDetails}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{text.userDetails}</DialogTitle>
            <DialogDescription>
              {selectedUser?.profile?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{text.balance}</span>
                    </div>
                    <p className="text-2xl font-bold">
                      ${selectedUser.wallet?.available_balance?.toFixed(2) || '0.00'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{text.totalProjects}</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {selectedUser.stats.totalProjects}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{text.recentTransactions}</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedUser.stats.recentTransactions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {language === 'en' ? 'No recent transactions' : '無最近交易'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedUser.stats.recentTransactions.map((transaction: any) => (
                        <div key={transaction.id} className="flex justify-between items-center text-sm border-b pb-2">
                          <span className="text-gray-600">{transaction.description}</span>
                          <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${Math.abs(transaction.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedUser?.profile?.status !== 'suspended' ? (
              <Button
                variant="destructive"
                onClick={() => updateUserStatus(selectedUser?.profile?.user_id, 'suspended')}
              >
                <Ban className="h-4 w-4 mr-2" />
                {text.suspendUser}
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => updateUserStatus(selectedUser?.profile?.user_id, 'active')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {text.activateUser}
              </Button>
            )}
            {canAddDeleteUsers && (
              <Button
                variant="destructive"
                onClick={() => deleteUser(selectedUser?.profile?.user_id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {text.deleteUser}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              {text.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{text.addUser}</DialogTitle>
            <DialogDescription>
              {text.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">{text.email}</Label>
                <Input
                  id="email"
                  placeholder={text.emailPlaceholder}
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">{text.password}</Label>
                <Input
                  id="password"
                  placeholder={text.passwordPlaceholder}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{text.name}</Label>
                <Input
                  id="name"
                  placeholder={text.namePlaceholder}
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="accountType">{text.accountType}</Label>
                <Select
                  id="accountType"
                  value={newUserAccountType}
                  onValueChange={(value) => setNewUserAccountType(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{newUserAccountType}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">{text.client}</SelectItem>
                    <SelectItem value="freelancer">{text.freelancer}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="default"
              onClick={addUser}
              disabled={adding}
            >
              {adding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {text.add}
            </Button>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {text.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}