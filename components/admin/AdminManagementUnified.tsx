import { useState, useEffect } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLevel, AdminUser, isRootAdmin } from '../../config/admin';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Shield,
  Crown,
  UserCog,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Database,
  Key,
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Helper function to create auth headers with dev token support
function createAuthHeaders(accessToken: string | null): HeadersInit {
  const headers: HeadersInit = {};
  
  if (accessToken?.startsWith('dev-user-')) {
    // Dev mode: Use publicAnonKey for Authorization, dev token in X-Dev-Token
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
    headers['X-Dev-Token'] = accessToken;
    console.log('[AdminManagementUnified] Dev mode: Using publicAnonKey for auth, dev token in X-Dev-Token header');
  } else if (accessToken) {
    // Production mode: Use access token
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
}

interface AdminStats {
  superAdmins: number;
  regularAdmins: number;
  moderators: number;
  total: number;
  rootAdmins: number;
}

interface AdminChangeLog {
  timestamp: string;
  action: 'ADD' | 'REMOVE' | 'UPDATE' | 'INIT';
  targetEmail: string;
  operatorEmail: string;
  oldData?: AdminUser;
  newData?: AdminUser;
  reason?: string;
}

export function AdminManagementUnified() {
  const { language } = useLanguage();
  const { accessToken, user, profile } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [changeLogs, setChangeLogs] = useState<AdminChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('admins');
  
  // Add admin dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminLevel, setNewAdminLevel] = useState<AdminLevel>(AdminLevel.MODERATOR);
  
  // Remove admin dialog
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<AdminUser | null>(null);
  const [removeReason, setRemoveReason] = useState('');

  // Promote admin dialog
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [adminToPromote, setAdminToPromote] = useState<AdminUser | null>(null);

  // Reset password dialog  
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [adminToResetPassword, setAdminToResetPassword] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // 檢查當前用戶是否為超級管理員
  const isCurrentUserSuperAdmin = user?.email && (
    isRootAdmin(user.email) ||
    profile?.adminLevel === AdminLevel.SUPER_ADMIN ||
    profile?.admin_role === AdminLevel.SUPER_ADMIN
  );

  // 調試日誌
  console.log('🔍 [AdminManagement] User:', user?.email, '| Super Admin:', isCurrentUserSuperAdmin);

  const content = {
    en: {
      title: 'Admin Management',
      subtitle: 'Manage system administrators and permissions',
      tabs: {
        admins: 'Administrators',
        stats: 'Statistics',
        logs: 'Change Log',
      },
      stats: {
        superAdmins: 'Super Admins',
        regularAdmins: 'Regular Admins',
        moderators: 'Moderators',
        totalAdmins: 'Total Admins',
        rootAdmins: 'Root Admins (Emergency)',
      },
      addAdmin: {
        title: 'Add Administrator',
        button: 'Add Admin',
        email: 'Email Address',
        name: 'Full Name',
        level: 'Admin Level',
        submit: 'Add Administrator',
        cancel: 'Cancel',
        success: 'Administrator added successfully',
        error: 'Failed to add administrator',
      },
      removeAdmin: {
        title: 'Remove Administrator',
        button: 'Remove',
        reason: 'Reason for removal',
        confirm: 'Are you sure you want to remove this administrator?',
        submit: 'Remove Administrator',
        cancel: 'Cancel',
        success: 'Administrator removed successfully',
        error: 'Failed to remove administrator',
      },
      promoteAdmin: {
        title: 'Promote to Super Admin',
        button: 'Promote',
        confirm: 'Are you sure you want to promote this administrator to Super Admin?',
        warning: 'Super Admins have full system access and can manage other administrators.',
        submit: 'Promote to Super Admin',
        cancel: 'Cancel',
        success: 'Administrator promoted successfully',
        error: 'Failed to promote administrator',
      },
      resetPassword: {
        title: 'Reset Password',
        button: 'Reset',
        confirm: 'Are you sure you want to reset this administrator\'s password?',
        warning: 'This action will reset the administrator\'s password to a new one.',
        submit: 'Reset Password',
        cancel: 'Cancel',
        success: 'Password reset successfully',
        error: 'Failed to reset password',
      },
      levels: {
        SUPER_ADMIN: 'Super Admin',
        ADMIN: 'Admin',
        MODERATOR: 'Moderator',
      },
      table: {
        email: 'Email',
        name: 'Name',
        level: 'Level',
        addedAt: 'Added Date',
        addedBy: 'Added By',
        actions: 'Actions',
      },
      logs: {
        action: 'Action',
        target: 'Target',
        operator: 'Operator',
        timestamp: 'Time',
        reason: 'Reason',
        actions: {
          ADD: 'Added',
          REMOVE: 'Removed',
          UPDATE: 'Updated',
          INIT: 'Initialized',
        },
      },
      refresh: 'Refresh',
      loading: 'Loading administrators...',
      noAdmins: 'No administrators found',
      noLogs: 'No change logs available',
      systemNote: 'System administrators with root access are hardcoded for security and cannot be modified here.',
    },
    'zh-TW': {
      title: '管理員管理',
      subtitle: '管理系統管理員和權限',
      tabs: {
        admins: '管理員列表',
        stats: '統計信息',
        logs: '變更記錄',
      },
      stats: {
        superAdmins: '超級管理員',
        regularAdmins: '普通管理員',
        moderators: '審核員',
        totalAdmins: '總管理員數',
        rootAdmins: '根管理員（緊急後備）',
      },
      addAdmin: {
        title: '添加管理員',
        button: '添加管理員',
        email: '郵箱地址',
        name: '完整姓名',
        level: '管理員級別',
        submit: '添加管理員',
        cancel: '取消',
        success: '管理員添加成功',
        error: '添加管理員失敗',
      },
      removeAdmin: {
        title: '移除管理員',
        button: '移除',
        reason: '移除原因',
        confirm: '您確定要移除此管理員嗎？',
        submit: '移除管理員',
        cancel: '取消',
        success: '管理員移除成功',
        error: '移除管理員失敗',
      },
      promoteAdmin: {
        title: '提升為超級管理員',
        button: '提升',
        confirm: '您確定要將此管理員提升為超級管理員嗎？',
        warning: '超級管理員擁有完整的系統訪問權限，可以管理其他管理員。',
        submit: '提升為超級管理員',
        cancel: '取消',
        success: '管理員提升成功',
        error: '管理員提升失敗',
      },
      resetPassword: {
        title: '重設密碼',
        button: '重設',
        confirm: '您確定要重設此管理員的密碼嗎？',
        warning: '此操作將重設管理員的密碼為新密碼。',
        submit: '重設密碼',
        cancel: '取消',
        success: '密碼重設成功',
        error: '重設密碼失敗',
      },
      levels: {
        SUPER_ADMIN: '超級管理員',
        ADMIN: '普通管理員',
        MODERATOR: '審核員',
      },
      table: {
        email: '郵箱',
        name: '姓名',
        level: '級別',
        addedAt: '添加日期',
        addedBy: '添加者',
        actions: '操作',
      },
      logs: {
        action: '操作',
        target: '目標',
        operator: '操作者',
        timestamp: '時間',
        reason: '原因',
        actions: {
          ADD: '添加',
          REMOVE: '移除',
          UPDATE: '更新',
          INIT: '初始化',
        },
      },
      refresh: '刷新',
      loading: '加載管理員中...',
      noAdmins: '沒有找到管理員',
      noLogs: '沒有可用的變更記錄',
      systemNote: '具有根訪問權限的系統管理員是硬編碼的，出於安全考慮無法在此處修改。',
    },
    'zh-CN': {
      title: '管理员管理',
      subtitle: '管理系统管理员和权限',
      tabs: {
        admins: '管理员列表',
        stats: '统计信息',
        logs: '变更记录',
      },
      stats: {
        superAdmins: '超级管理员',
        regularAdmins: '普通管理员',
        moderators: '审核员',
        totalAdmins: '总管理员数',
        rootAdmins: '根管理员（紧急后备）',
      },
      addAdmin: {
        title: '添加管理员',
        button: '添加管理员',
        email: '邮箱地址',
        name: '完整姓名',
        level: '管理员级别',
        submit: '添加管理员',
        cancel: '取消',
        success: '管理员添加成功',
        error: '添加管理员失败',
      },
      removeAdmin: {
        title: '移除管理员',
        button: '移除',
        reason: '移除原因',
        confirm: '您确定要移除此管理员吗？',
        submit: '移除管理员',
        cancel: '取消',
        success: '管理员移除成功',
        error: '移除管理员失败',
      },
      promoteAdmin: {
        title: '提升为超级管理员',
        button: '提升',
        confirm: '您确定要将此管理员提升为超级管理员吗？',
        warning: '超级管理员拥有完整的系统访问权限，可以管理其他管理员。',
        submit: '提升为超级管理员',
        cancel: '取消',
        success: '管理员提升成功',
        error: '管理员提升失败',
      },
      resetPassword: {
        title: '重设密码',
        button: '重设',
        confirm: '您确定要重设此管理员的密码吗？',
        warning: '此操作将重设管理员的密码为新密码。',
        submit: '重密',
        cancel: '取消',
        success: '密码重设成功',
        error: '重设密码失败',
      },
      levels: {
        SUPER_ADMIN: '超级管理员',
        ADMIN: '普通管理员',
        MODERATOR: '审核员',
      },
      table: {
        email: '邮箱',
        name: '姓名',
        level: '级别',
        addedAt: '添加日期',
        addedBy: '添加者',
        actions: '操作',
      },
      logs: {
        action: '操作',
        target: '目标',
        operator: '操作者',
        timestamp: '时间',
        reason: '原因',
        actions: {
          ADD: '添加',
          REMOVE: '移除',
          UPDATE: '更新',
          INIT: '初始化',
        },
      },
      refresh: '刷新',
      loading: '加载管理员中...',
      noAdmins: '没有找到管理员',
      noLogs: '没有可用的变更记录',
      systemNote: '具有根访问权限的系统管理员是硬编码的，出于安全考虑无法在此处修改。',
    },
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  useEffect(() => {
    loadAdmins();
    loadStats();
    loadChangeLogs();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/list-all`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const data = await response.json();
      setAdmins(data.admins || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
      toast.error(t.addAdmin.error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/stats`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadChangeLogs = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/change-logs?limit=50`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch change logs');
      }

      const data = await response.json();
      setChangeLogs(data.logs || []);
    } catch (error) {
      console.error('Error loading change logs:', error);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminName) {
      toast.error('Email and name are required');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/add`,
        {
          method: 'POST',
          headers: createAuthHeaders(accessToken),
          body: JSON.stringify({
            email: newAdminEmail,
            name: newAdminName,
            level: newAdminLevel,
            permissions: newAdminLevel === AdminLevel.SUPER_ADMIN ? ['*'] : [],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add admin');
      }

      toast.success(t.addAdmin.success);
      setShowAddDialog(false);
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminLevel(AdminLevel.MODERATOR);
      loadAdmins();
      loadChangeLogs();
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast.error(error.message || t.addAdmin.error);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!adminToRemove || !removeReason) {
      toast.error('Reason is required');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/remove`,
        {
          method: 'POST',
          headers: createAuthHeaders(accessToken),
          body: JSON.stringify({
            email: adminToRemove.email,
            reason: removeReason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove admin');
      }

      toast.success(t.removeAdmin.success);
      setShowRemoveDialog(false);
      setAdminToRemove(null);
      setRemoveReason('');
      loadAdmins();
      loadChangeLogs();
    } catch (error: any) {
      console.error('Error removing admin:', error);
      toast.error(error.message || t.removeAdmin.error);
    }
  };

  const handlePromoteAdmin = async () => {
    if (!adminToPromote) {
      toast.error('Admin to promote is required');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/promote`,
        {
          method: 'POST',
          headers: createAuthHeaders(accessToken),
          body: JSON.stringify({
            email: adminToPromote.email,
            level: AdminLevel.SUPER_ADMIN,
            permissions: ['*'],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to promote admin');
      }

      toast.success(t.promoteAdmin.success);
      setShowPromoteDialog(false);
      setAdminToPromote(null);
      loadAdmins();
      loadChangeLogs();
    } catch (error: any) {
      console.error('Error promoting admin:', error);
      toast.error(error.message || t.promoteAdmin.error);
    }
  };

  const handleResetPassword = async () => {
    if (!adminToResetPassword || newPassword !== confirmNewPassword) {
      toast.error('New password and confirmation must match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/admins/${encodeURIComponent(adminToResetPassword.email)}/reset-password`,
        {
          method: 'POST',
          headers: createAuthHeaders(accessToken),
          body: JSON.stringify({
            newPassword: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast.success(t.resetPassword.success);
      setShowResetPasswordDialog(false);
      setAdminToResetPassword(null);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || t.resetPassword.error);
    }
  };

  const getLevelIcon = (level: AdminLevel) => {
    switch (level) {
      case AdminLevel.SUPER_ADMIN:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case AdminLevel.ADMIN:
        return <Shield className="h-4 w-4 text-blue-500" />;
      case AdminLevel.MODERATOR:
        return <UserCog className="h-4 w-4 text-green-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadgeColor = (level: AdminLevel) => {
    switch (level) {
      case AdminLevel.SUPER_ADMIN:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case AdminLevel.ADMIN:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case AdminLevel.MODERATOR:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language.startsWith('zh') ? 'zh-TW' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            {t.title}
          </h2>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <Button onClick={() => { loadAdmins(); loadStats(); loadChangeLogs(); }} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t.refresh}
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                {t.stats.superAdmins}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats.superAdmins}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                {t.stats.regularAdmins}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats.regularAdmins}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserCog className="h-4 w-4 text-green-500" />
                {t.stats.moderators}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats.moderators}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-500" />
                {t.stats.totalAdmins}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-red-500" />
                {t.stats.rootAdmins}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats.rootAdmins}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="admins">{t.tabs.admins}</TabsTrigger>
          <TabsTrigger value="stats">{t.tabs.stats}</TabsTrigger>
          <TabsTrigger value="logs">{t.tabs.logs}</TabsTrigger>
        </TabsList>

        {/* Administrators List */}
        <TabsContent value="admins" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>{t.systemNote}</span>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addAdmin.button}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.addAdmin.title}</DialogTitle>
                  <DialogDescription>
                    Add a new administrator to the system
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.addAdmin.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.addAdmin.name}</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">{t.addAdmin.level}</Label>
                    <Select value={newAdminLevel} onValueChange={(val) => setNewAdminLevel(val as AdminLevel)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AdminLevel.MODERATOR}>{t.levels.MODERATOR}</SelectItem>
                        <SelectItem value={AdminLevel.ADMIN}>{t.levels.ADMIN}</SelectItem>
                        <SelectItem value={AdminLevel.SUPER_ADMIN}>{t.levels.SUPER_ADMIN}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    {t.addAdmin.cancel}
                  </Button>
                  <Button onClick={handleAddAdmin}>
                    {t.addAdmin.submit}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">{t.loading}</p>
                  </div>
                </div>
              ) : admins.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">{t.noAdmins}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">{t.table.email}</th>
                        <th className="text-left p-4">{t.table.name}</th>
                        <th className="text-left p-4">{t.table.level}</th>
                        <th className="text-left p-4">{t.table.addedAt}</th>
                        <th className="text-left p-4">{t.table.addedBy}</th>
                        <th className="text-right p-4">{t.table.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => {
                        const canPromote = isCurrentUserSuperAdmin && admin.level !== AdminLevel.SUPER_ADMIN && !isRootAdmin(admin.email);
                        console.log(`🔍 [Admin Row] ${admin.email}:`, {
                          isCurrentUserSuperAdmin,
                          adminLevel: admin.level,
                          isNotSuperAdmin: admin.level !== AdminLevel.SUPER_ADMIN,
                          isNotRootAdmin: !isRootAdmin(admin.email),
                          canPromote
                        });
                        
                        return (
                        <tr key={admin.email} className="border-b hover:bg-muted/50">
                          <td className="p-4">{admin.email}</td>
                          <td className="p-4">{admin.name}</td>
                          <td className="p-4">
                            <Badge className={getLevelBadgeColor(admin.level)}>
                              <span className="flex items-center gap-1">
                                {getLevelIcon(admin.level)}
                                {t.levels[admin.level]}
                              </span>
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {formatDate(admin.addedAt)}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {admin.addedBy || 'SYSTEM'}
                          </td>
                          <td className="p-4 text-right">
                            {canPromote && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  console.log('🔍 Promoting admin:', admin);
                                  setAdminToPromote(admin);
                                  setShowPromoteDialog(true);
                                }}
                                title={t.promoteAdmin.button}
                              >
                                <Crown className="h-4 w-4 text-yellow-500" />
                              </Button>
                            )}
                            {isCurrentUserSuperAdmin && admin.email === 'admin@casewhr.com' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setAdminToResetPassword(admin);
                                  setShowResetPasswordDialog(true);
                                }}
                                title={t.resetPassword.button}
                              >
                                <Key className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAdminToRemove(admin);
                                setShowRemoveDialog(true);
                              }}
                              title={t.removeAdmin.button}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Admin System Statistics</CardTitle>
              <CardDescription>Overview of the admin system</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Total Administrators</div>
                      <div className="text-3xl">{stats.total}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Root Admins (Emergency Backup)</div>
                      <div className="text-3xl">{stats.rootAdmins}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">Distribution by Level</div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          Super Admins
                        </span>
                        <span>{stats.superAdmins}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          Regular Admins
                        </span>
                        <span>{stats.regularAdmins}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-green-500" />
                          Moderators
                        </span>
                        <span>{stats.moderators}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>{t.tabs.logs}</CardTitle>
              <CardDescription>Recent administrative changes</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {changeLogs.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">{t.noLogs}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">{t.logs.action}</th>
                        <th className="text-left p-4">{t.logs.target}</th>
                        <th className="text-left p-4">{t.logs.operator}</th>
                        <th className="text-left p-4">{t.logs.timestamp}</th>
                        <th className="text-left p-4">{t.logs.reason}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changeLogs.map((log, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <Badge variant="outline">
                              {t.logs.actions[log.action] || log.action}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm">{log.targetEmail}</td>
                          <td className="p-4 text-sm text-muted-foreground">{log.operatorEmail}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {log.reason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Remove Admin Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.removeAdmin.title}</DialogTitle>
            <DialogDescription>
              {t.removeAdmin.confirm}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 p-3 bg-muted rounded-md">
            <div className="text-sm">
              <strong>{adminToRemove?.name}</strong> ({adminToRemove?.email})
            </div>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">{t.removeAdmin.reason}</Label>
              <Input
                id="reason"
                placeholder="e.g., Left the company"
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              {t.removeAdmin.cancel}
            </Button>
            <Button variant="destructive" onClick={handleRemoveAdmin}>
              {t.removeAdmin.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote Admin Dialog */}
      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.promoteAdmin.title}</DialogTitle>
            <DialogDescription>
              {t.promoteAdmin.confirm}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 p-3 bg-muted rounded-md">
            <div className="text-sm">
              <strong>{adminToPromote?.name}</strong> ({adminToPromote?.email})
            </div>
          </div>
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-600">
              {t.promoteAdmin.warning}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromoteDialog(false)}>
              {t.promoteAdmin.cancel}
            </Button>
            <Button variant="destructive" onClick={handlePromoteAdmin}>
              {t.promoteAdmin.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.resetPassword.title}</DialogTitle>
            <DialogDescription>
              {t.resetPassword.confirm}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 p-3 bg-muted rounded-md">
            <div className="text-sm">
              <strong>{adminToResetPassword?.name}</strong> ({adminToResetPassword?.email})
            </div>
          </div>
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-600">
              {t.resetPassword.warning}
            </div>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t.resetPassword.button}</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                placeholder="Confirm New Password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
              {t.resetPassword.cancel}
            </Button>
            <Button variant="destructive" onClick={handleResetPassword}>
              {t.resetPassword.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}