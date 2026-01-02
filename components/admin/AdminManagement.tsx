import { useState, useEffect } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLevel, isSuperAdmin, SUPER_ADMINS } from '../../config/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Shield, UserPlus, Trash2, Crown, UserCog, Eye, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { DebugAdminProfile } from './DebugAdminProfile';
import { QuickProfileCheck } from './QuickProfileCheck';

// Helper function to create auth headers with dev token support
function createAuthHeaders(accessToken: string | null): HeadersInit {
  const headers: HeadersInit = {};
  
  if (accessToken?.startsWith('dev-user-')) {
    // Dev mode: Use publicAnonKey for Authorization, dev token in X-Dev-Token
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
    headers['X-Dev-Token'] = accessToken;
    console.log('[AdminManagement] Dev mode: Using publicAnonKey for auth, dev token in X-Dev-Token header');
  } else if (accessToken) {
    // Production mode: Use access token
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
}

interface AdminUser {
  userId: string;
  email: string;
  name: string;
  level: string;
  addedAt: string;
  addedBy?: string;
}

export function AdminManagement() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminLevel, setNewAdminLevel] = useState<AdminLevel>(AdminLevel.ADMIN);
  const [adding, setAdding] = useState(false);
  const [addingType, setAddingType] = useState<'admin' | 'moderator'>('admin');

  const userIsSuperAdmin = isSuperAdmin(user?.email);

  console.log('🔍 [AdminManagement] User:', user?.email, '| Super Admin:', userIsSuperAdmin);

  const content = {
    en: {
      title: 'Administrator Management',
      description: 'Manage system administrators and their permissions',
      superAdminOnly: 'Only super administrators can manage other admins',
      addAdmin: 'Add Administrator',
      addModerator: 'Add Moderator',
      remove: 'Remove',
      removeAdmin: 'Remove Admin',
      removeConfirm: 'Are you sure you want to remove this administrator?',
      email: 'Email',
      name: 'Name',
      level: 'Level',
      addedAt: 'Added On',
      addedBy: 'Added By',
      cancel: 'Cancel',
      confirm: 'Confirm',
      add: 'Add',
      saving: 'Saving...',
      enterEmail: 'Enter email address',
      enterName: 'Enter name',
      selectLevel: 'Select admin level',
      admin: 'Admin',
      moderator: 'Moderator',
      cannotRemoveSuperAdmin: 'Cannot remove super administrators',
      superAdmins: 'Super Administrators',
      regularAdmins: 'Administrators',
      moderators: 'Moderators',
      noAdmins: 'No administrators yet',
      noModerators: 'No moderators yet',
      levels: {
        SUPER_ADMIN: 'Super Admin',
        ADMIN: 'Admin',
        MODERATOR: 'Moderator',
      },
      levelDescriptions: {
        SUPER_ADMIN: 'Full access to all features',
        ADMIN: 'Manage users, projects, withdrawals, transactions, memberships, messages',
        MODERATOR: 'View dashboard, users, projects, messages, transactions',
      },
      newAdmin: {
        titleAdmin: 'Add Administrator',
        titleModerator: 'Add Moderator',
        descriptionAdmin: 'Add a new administrator to manage platform features',
        descriptionModerator: 'Add a new moderator to review platform content',
        emailLabel: 'Email',
        emailPlaceholder: 'admin@example.com',
        nameLabel: 'Name',
        namePlaceholder: 'Full name',
        levelLabel: 'Admin Level',
        levelPlaceholder: 'Select level',
      },
      success: {
        added: 'Administrator added successfully. The user needs to refresh or sign in again to see admin features.',
        removed: 'Administrator removed successfully',
      },
      error: {
        loadFailed: 'Failed to load administrators',
        addFailed: 'Failed to add administrator',
        removeFailed: 'Failed to remove administrator',
        invalidEmail: 'Invalid email address',
        invalidName: 'Name is required',
      },
    },
    'zh-TW': {
      title: '管理員管理',
      description: '管理系統管理員及其權限',
      superAdminOnly: '只有超級管理員可以管理其他管理員',
      addAdmin: '添加管理員',
      addModerator: '添加審核員',
      remove: '移除',
      removeAdmin: '移除管理員',
      removeConfirm: '確定要移除此管理員嗎？',
      email: '郵箱',
      name: '姓名',
      level: '級別',
      addedAt: '添加時間',
      addedBy: '添加者',
      cancel: '取消',
      confirm: '確認',
      add: '添加',
      saving: '保存中...',
      enterEmail: '輸入郵箱地址',
      enterName: '輸入姓名',
      selectLevel: '選擇管理員級別',
      admin: '管理員',
      moderator: '審核員',
      cannotRemoveSuperAdmin: '無法移除超級管理員',
      superAdmins: '超級管理員',
      regularAdmins: '普通管理員',
      moderators: '審核員',
      noAdmins: '暫無管理員',
      noModerators: '暫無審核員',
      levels: {
        SUPER_ADMIN: '超級管理員',
        ADMIN: '管理員',
        MODERATOR: '審核員',
      },
      levelDescriptions: {
        SUPER_ADMIN: '擁有所有功能的完整訪問權限',
        ADMIN: '管理用戶、項目、提款、交易、會員、消息',
        MODERATOR: '查看儀表板、用戶、項目、消息、交易',
      },
      newAdmin: {
        titleAdmin: '添加管理員',
        titleModerator: '添加審核員',
        descriptionAdmin: '添加新的管理員來管理平台功能',
        descriptionModerator: '添加新的審核員來審核平台內容',
        emailLabel: '郵箱',
        emailPlaceholder: 'admin@example.com',
        nameLabel: '姓名',
        namePlaceholder: '全名',
        levelLabel: '管理員級別',
        levelPlaceholder: '選擇級別',
      },
      success: {
        added: '管理員添加成功。用戶需要刷新或重新登錄才能看到管理功能。',
        removed: '管理員移除成功',
      },
      error: {
        loadFailed: '載入管理員失敗',
        addFailed: '添加管理員失敗',
        removeFailed: '移除管理員失敗',
        invalidEmail: '郵箱地址無效',
        invalidName: '姓名為必填項',
      },
    },
    'zh-CN': {
      title: '管理员管理',
      description: '管理系统管理员及其权限',
      superAdminOnly: '只有超级管理员可以管理其他管理员',
      addAdmin: '添加管理员',
      addModerator: '添加审核员',
      remove: '移除',
      removeAdmin: '移除管理员',
      removeConfirm: '确定要移除此管理员吗？',
      email: '邮箱',
      name: '姓名',
      level: '级别',
      addedAt: '添加时间',
      addedBy: '添加者',
      cancel: '取消',
      confirm: '确认',
      add: '添加',
      saving: '保存中...',
      enterEmail: '输入邮箱地址',
      enterName: '输入姓名',
      selectLevel: '选择管理员级别',
      admin: '管理员',
      moderator: '审核员',
      cannotRemoveSuperAdmin: '无法移除超级管理员',
      superAdmins: '超级管理员',
      regularAdmins: '普通管理员',
      moderators: '审核员',
      noAdmins: '暂无管理员',
      noModerators: '暂无审核员',
      levels: {
        SUPER_ADMIN: '超级管理员',
        ADMIN: '管理员',
        MODERATOR: '审核员',
      },
      levelDescriptions: {
        SUPER_ADMIN: '拥有所有功能的完整访问权限',
        ADMIN: '管理用户、项目、提款、交易、会员、消息',
        MODERATOR: '查看仪表板、用户、项目、消息、交易',
      },
      newAdmin: {
        titleAdmin: '添加管理员',
        titleModerator: '添加审核员',
        descriptionAdmin: '添加新的管理员来管理平台功能',
        descriptionModerator: '添加新的审核员来审核平台内容',
        emailLabel: '邮箱',
        emailPlaceholder: 'admin@example.com',
        nameLabel: '姓名',
        namePlaceholder: '全名',
        levelLabel: '管理员级别',
        levelPlaceholder: '选择级别',
      },
      success: {
        added: '管理员添加成功。用户需要刷新或重新登录才能看到管理功能。',
        removed: '管理员移除成功',
      },
      error: {
        loadFailed: '载入管理员失败',
        addFailed: '添加管理员失败',
        removeFailed: '移除管理员失败',
        invalidEmail: '邮箱地址无效',
        invalidName: '姓名为必填项',
      },
    },
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  useEffect(() => {
    if (userIsSuperAdmin) {
      fetchAdmins();
    } else {
      setLoading(false);
    }
  }, [userIsSuperAdmin]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/admins`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const data = await response.json();
      console.log('📋 [AdminManagement] Raw admin data from server:', data.admins);
      console.log('📋 [AdminManagement] First admin object:', data.admins?.[0]);
      setAdmins(data.admins || []);
    } catch (error: any) {
      console.error('Error fetching admins:', error);
      toast.error(t.error.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      toast.error(t.error.invalidEmail);
      return;
    }

    if (!newAdminName.trim()) {
      toast.error(t.error.invalidName);
      return;
    }

    try {
      setAdding(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/admins`,
        {
          method: 'POST',
          headers: createAuthHeaders(accessToken),
          body: JSON.stringify({
            email: newAdminEmail.trim().toLowerCase(),
            name: newAdminName.trim(),
            level: newAdminLevel,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add admin');
      }

      toast.success(t.success.added);
      setAddDialogOpen(false);
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminLevel(AdminLevel.ADMIN);
      fetchAdmins();
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast.error(error.message || t.error.addFailed);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async (userId: string, email: string) => {
    // 🔥 顯示完整的 admin 對象 - 找到傳入的管理員
    const adminToRemove = admins.find(a => a.email === email);
    console.log('🗑️  [Frontend] Remove button clicked');
    console.log('📦 Complete Admin Object:', JSON.stringify(adminToRemove, null, 2));
    console.log('📌 userId parameter:', userId);
    console.log('📌 email parameter:', email);
    
    // Only protect hardcoded super admins (from config)
    if (SUPER_ADMINS.some(admin => admin.email === email)) {
      console.log('❌ [Frontend] Cannot remove hardcoded super admin:', email);
      toast.error(t.cannotRemoveSuperAdmin);
      return;
    }

    if (!confirm(t.removeConfirm)) {
      console.log('⏭️  [Frontend] User cancelled removal');
      return;
    }

    console.log('🚀 [Frontend] Sending DELETE request to backend...');
    
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/admins/${userId}`;
      console.log('📍 [Frontend] DELETE URL:', url);
      console.log('🔑 [Frontend] Using token:', accessToken?.substring(0, 20) + '...');
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: createAuthHeaders(accessToken),
      });

      console.log('📥 [Frontend] Response status:', response.status);
      const data = await response.json().catch(() => ({}));
      console.log('📦 [Frontend] Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove admin');
      }

      console.log('✅ [Frontend] Admin removed successfully');
      toast.success(t.success.removed);
      
      console.log('🔄 [Frontend] Refreshing admin list...');
      fetchAdmins();
    } catch (error: any) {
      console.error('❌ [Frontend] Error removing admin:', error);
      toast.error(t.error.removeFailed);
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case AdminLevel.SUPER_ADMIN:
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
      case AdminLevel.ADMIN:
        return 'bg-blue-600 text-white';
      case AdminLevel.MODERATOR:
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const openAddAdminDialog = () => {
    setAddingType('admin');
    setNewAdminLevel(AdminLevel.ADMIN);
    setNewAdminEmail('');
    setNewAdminName('');
    setAddDialogOpen(true);
  };

  const openAddModeratorDialog = () => {
    setAddingType('moderator');
    setNewAdminLevel(AdminLevel.MODERATOR);
    setNewAdminEmail('');
    setNewAdminName('');
    setAddDialogOpen(true);
  };

  if (!userIsSuperAdmin) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <Shield className="h-16 w-16 text-gray-300" />
            <div>
              <p className="text-lg font-medium text-gray-900">{t.superAdminOnly}</p>
              <p className="text-sm text-gray-500 mt-1">
                {language === 'en' 
                  ? 'This section is only accessible to super administrators.'
                  : '此部分僅供超級管理員訪問。'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const superAdmins = SUPER_ADMINS.map(admin => ({
    userId: 'system',
    email: admin.email,
    name: admin.name,
    level: admin.level,
    addedAt: admin.addedAt,
    addedBy: 'System',
  }));

  // 分離普通管理員、審核員和動態添加的超級管理員
  console.log('🔍 [AdminManagement] All admins from server:', admins);
  console.log('🔍 [AdminManagement] AdminLevel enum:', AdminLevel);
  
  const regularAdmins = admins.filter(admin => {
    console.log(`🔍 [AdminManagement] Checking admin ${admin.email}: level="${admin.level}", AdminLevel.ADMIN="${AdminLevel.ADMIN}", match=${admin.level === AdminLevel.ADMIN}`);
    return admin.level === AdminLevel.ADMIN;
  });
  
  const moderators = admins.filter(admin => admin.level === AdminLevel.MODERATOR);
  const dynamicSuperAdmins = admins.filter(admin => 
    admin.level === AdminLevel.SUPER_ADMIN && 
    !SUPER_ADMINS.some(sa => sa.email === admin.email)
  );
  
  console.log('🔍 [AdminManagement] Regular admins:', regularAdmins);
  console.log('🔍 [AdminManagement] Moderators:', moderators);
  console.log('🔍 [AdminManagement] Dynamic super admins:', dynamicSuperAdmins);

  return (
    <div className="space-y-6">
      {/* 🔍 調試工具 - 僅超級管理員可見 */}
      <DebugAdminProfile />
      <QuickProfileCheck />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                {t.title}
              </CardTitle>
              <CardDescription className="mt-1">{t.description}</CardDescription>
            </div>
            <Button onClick={openAddAdminDialog}>
              <UserPlus className="h-4 w-4 mr-2" />
            {t.addAdmin}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Super Admins */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                {t.superAdmins}
              </h3>
              <div className="space-y-2">
                {superAdmins.map((admin) => (
                  <div
                    key={admin.email}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Shield className="h-8 w-8 text-yellow-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium">{admin.name}</span>
                          <Badge className={getLevelBadgeColor(admin.level)}>
                            <Crown className="h-3 w-3 mr-1" />
                            {t.levels[admin.level as keyof typeof t.levels]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{admin.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t.addedAt}: {new Date(admin.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Protected
                      </Badge>
                    </div>
                  </div>
                ))}
                {dynamicSuperAdmins.map((admin) => (
                  <div
                    key={admin.email}
                    className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-300"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Shield className="h-8 w-8 text-yellow-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium">{admin.name}</span>
                          <Badge className={getLevelBadgeColor(admin.level)}>
                            <Crown className="h-3 w-3 mr-1" />
                            {t.levels[admin.level as keyof typeof t.levels]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{admin.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t.addedAt}: {new Date(admin.addedAt).toLocaleDateString()}
                          {admin.addedBy && ` • ${t.addedBy}: ${admin.addedBy}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin.userId || admin.email, admin.email)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t.remove}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Regular Admins */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  {t.regularAdmins}
                </h3>
                <Button size="sm" variant="outline" onClick={openAddAdminDialog} className="border-blue-500 text-blue-600 hover:bg-blue-50">
                  <UserPlus className="h-3 w-3 mr-1" />
                  {t.addAdmin}
                </Button>
              </div>
              {regularAdmins.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Shield className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t.noAdmins}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {regularAdmins.map((admin) => (
                    <div
                      key={admin.userId || admin.email}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <Shield className="h-8 w-8 text-blue-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium">{admin.name}</span>
                            <Badge className={getLevelBadgeColor(admin.level)}>
                              {t.levels[admin.level as keyof typeof t.levels]}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{admin.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {t.addedAt}: {new Date(admin.addedAt).toLocaleDateString()}
                            {admin.addedBy && ` • ${t.addedBy}: ${admin.addedBy}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAdmin(admin.userId || admin.email, admin.email)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t.remove}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Moderators */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  {t.moderators}
                </h3>
                <Button size="sm" variant="outline" onClick={openAddModeratorDialog} className="border-green-500 text-green-600 hover:bg-green-50">
                  <UserPlus className="h-3 w-3 mr-1" />
                  {t.addModerator}
                </Button>
              </div>
              {moderators.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Shield className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t.noModerators}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {moderators.map((admin) => (
                    <div
                      key={admin.userId || admin.email}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Shield className="h-8 w-8 text-green-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium">{admin.name}</span>
                            <Badge className={getLevelBadgeColor(admin.level)}>
                              {t.levels[admin.level as keyof typeof t.levels]}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{admin.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {t.addedAt}: {new Date(admin.addedAt).toLocaleDateString()}
                            {admin.addedBy && ` • ${t.addedBy}: ${admin.addedBy}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAdmin(admin.userId || admin.email, admin.email)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t.remove}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Add Admin Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addingType === 'admin' ? t.newAdmin.titleAdmin : t.newAdmin.titleModerator}
            </DialogTitle>
            <DialogDescription>
              {addingType === 'admin' ? t.newAdmin.descriptionAdmin : t.newAdmin.descriptionModerator}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.newAdmin.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t.newAdmin.emailPlaceholder}
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t.newAdmin.nameLabel}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t.newAdmin.namePlaceholder}
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">{t.newAdmin.levelLabel}</Label>
              <Select value={newAdminLevel} onValueChange={(value) => setNewAdminLevel(value as AdminLevel)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.newAdmin.levelPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="admin" value={AdminLevel.ADMIN}>
                    <div className="flex flex-col items-start">
                      <span>{t.levels.ADMIN}</span>
                      <span className="text-xs text-gray-500">{t.levelDescriptions.ADMIN}</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="moderator" value={AdminLevel.MODERATOR}>
                    <div className="flex flex-col items-start">
                      <span>{t.levels.MODERATOR}</span>
                      <span className="text-xs text-gray-500">{t.levelDescriptions.MODERATOR}</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="super_admin" value={AdminLevel.SUPER_ADMIN}>
                    <div className="flex flex-col items-start">
                      <span>{t.levels.SUPER_ADMIN}</span>
                      <span className="text-xs text-gray-500">{t.levelDescriptions.SUPER_ADMIN}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleAddAdmin} disabled={adding}>
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.saving}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t.add}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
    </div>
  );
}