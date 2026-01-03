import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar } from './ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Trash2, 
  Crown, 
  Shield,
  User,
  MoreVertical,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'member';
  status: 'active' | 'pending' | 'inactive';
  permissions: {
    view_projects: boolean;
    edit_projects: boolean;
    manage_finances: boolean;
    manage_team: boolean;
    api_access: boolean;
  };
  joined_at: string;
}

interface TeamManagementProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function TeamManagement({ language = 'en' }: TeamManagementProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member'>('member');
  const [inviting, setInviting] = useState(false);

  const translations = {
    en: {
      title: 'Team Management',
      subtitle: 'Manage your team members and their permissions',
      addMember: 'Add Team Member',
      inviteTitle: 'Invite New Member',
      email: 'Email Address',
      name: 'Full Name',
      role: 'Role',
      invite: 'Send Invitation',
      cancel: 'Cancel',
      members: 'Team Members',
      permissions: 'Permissions',
      status: 'Status',
      actions: 'Actions',
      roles: {
        admin: 'Admin',
        manager: 'Manager',
        member: 'Member'
      },
      roleDescriptions: {
        admin: 'Full access to all features',
        manager: 'Can manage projects and team',
        member: 'Can view and edit assigned projects'
      },
      statuses: {
        active: 'Active',
        pending: 'Pending',
        inactive: 'Inactive'
      },
      permissionLabels: {
        view_projects: 'View Projects',
        edit_projects: 'Edit Projects',
        manage_finances: 'Manage Finances',
        manage_team: 'Manage Team',
        api_access: 'API Access'
      },
      remove: 'Remove',
      edit: 'Edit Permissions',
      resendInvite: 'Resend Invitation',
      noMembers: 'No team members yet. Invite your first member!',
      inviteSuccess: 'Invitation sent successfully!',
      removeSuccess: 'Team member removed successfully',
      updateSuccess: 'Permissions updated successfully'
    },
    zh: {
      title: '團隊管理',
      subtitle: '管理團隊成員及其權限',
      addMember: '添加團隊成員',
      inviteTitle: '邀請新成員',
      email: '電子郵件地址',
      name: '全名',
      role: '角色',
      invite: '發送邀請',
      cancel: '取消',
      members: '團隊成員',
      permissions: '權限',
      status: '狀態',
      actions: '操作',
      roles: {
        admin: '管理員',
        manager: '經理',
        member: '成員'
      },
      roleDescriptions: {
        admin: '完全訪問所有功能',
        manager: '可管理項目和團隊',
        member: '可查看和編輯分配的項目'
      },
      statuses: {
        active: '活躍',
        pending: '待處理',
        inactive: '停用'
      },
      permissionLabels: {
        view_projects: '查看項目',
        edit_projects: '編輯項目',
        manage_finances: '管理財務',
        manage_team: '管理團隊',
        api_access: 'API 訪問'
      },
      remove: '移除',
      edit: '編輯權限',
      resendInvite: '重新發送邀請',
      noMembers: '尚無團隊成員。邀請您的第一位成員！',
      inviteSuccess: '邀請發送成功！',
      removeSuccess: '團隊成員移除成功',
      updateSuccess: '權限更新成功'
    },
    'zh-TW': {
      title: '團隊管理',
      subtitle: '管理團隊成員及其權限',
      addMember: '添加團隊成員',
      inviteTitle: '邀請新成員',
      email: '電子郵件地址',
      name: '全名',
      role: '角色',
      invite: '發送邀請',
      cancel: '取消',
      members: '團隊成員',
      permissions: '權限',
      status: '狀態',
      actions: '操作',
      roles: {
        admin: '管理員',
        manager: '經理',
        member: '成員'
      },
      roleDescriptions: {
        admin: '完全訪問所有功能',
        manager: '可管理項目和團隊',
        member: '可查看和編輯分配的項目'
      },
      statuses: {
        active: '活躍',
        pending: '待處理',
        inactive: '停用'
      },
      permissionLabels: {
        view_projects: '查看項目',
        edit_projects: '編輯項目',
        manage_finances: '管理財務',
        manage_team: '管理團隊',
        api_access: 'API 訪問'
      },
      remove: '移除',
      edit: '編輯權限',
      resendInvite: '重新發送邀請',
      noMembers: '尚無團隊成員。邀請您的第一位成員！',
      inviteSuccess: '邀請發送成功！',
      removeSuccess: '團隊成員移除成功',
      updateSuccess: '權限更新成功'
    },
    'zh-CN': {
      title: '团队管理',
      subtitle: '管理团队成员及其权限',
      addMember: '添加团队成员',
      inviteTitle: '邀请新成员',
      email: '电子邮箱地址',
      name: '全名',
      role: '角色',
      invite: '发送邀请',
      cancel: '取消',
      members: '团队成员',
      permissions: '权限',
      status: '状态',
      actions: '操作',
      roles: {
        admin: '管理员',
        manager: '经理',
        member: '成员'
      },
      roleDescriptions: {
        admin: '完全访问所有功能',
        manager: '可管理项目和团队',
        member: '可查看和编辑分配的项目'
      },
      statuses: {
        active: '活跃',
        pending: '待处理',
        inactive: '停用'
      },
      permissionLabels: {
        view_projects: '查看项目',
        edit_projects: '编辑项目',
        manage_finances: '管理财务',
        manage_team: '管理团队',
        api_access: 'API 访问'
      },
      remove: '移除',
      edit: '编辑权限',
      resendInvite: '重新发送邀请',
      noMembers: '尚无团队成员。邀请您的第一位成员！',
      inviteSuccess: '邀请发送成功！',
      removeSuccess: '团队成员移除成功',
      updateSuccess: '权限更新成功'
    }
  };

  const t = translations[language] || translations.en; // ✅ Fallback to English

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // 🎁 開發模式支援
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        // 模擬團隊成員數據
        const mockMembers: TeamMember[] = [
          {
            id: '1',
            user_id: user?.id || '',
            email: user?.email || 'owner@example.com',
            name: user?.user_metadata?.name || 'Team Owner',
            role: 'admin',
            status: 'active',
            permissions: {
              view_projects: true,
              edit_projects: true,
              manage_finances: true,
              manage_team: true,
              api_access: true
            },
            joined_at: new Date().toISOString()
          },
          {
            id: '2',
            user_id: 'demo-user-1',
            email: 'manager@example.com',
            name: 'Project Manager',
            role: 'manager',
            status: 'active',
            permissions: {
              view_projects: true,
              edit_projects: true,
              manage_finances: false,
              manage_team: true,
              api_access: true
            },
            joined_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            user_id: 'demo-user-2',
            email: 'developer@example.com',
            name: 'Senior Developer',
            role: 'member',
            status: 'active',
            permissions: {
              view_projects: true,
              edit_projects: true,
              manage_finances: false,
              manage_team: false,
              api_access: true
            },
            joined_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '4',
            user_id: 'pending-user-1',
            email: 'newmember@example.com',
            name: 'New Member',
            role: 'member',
            status: 'pending',
            permissions: {
              view_projects: true,
              edit_projects: false,
              manage_finances: false,
              manage_team: false,
              api_access: false
            },
            joined_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setMembers(mockMembers);
        setLoading(false);
        return;
      }

      // 從後端獲取真實數據
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/team/members`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteName) {
      toast.error(language === 'en' ? 'Please fill in all fields' : '請填寫所有欄位');
      return;
    }

    setInviting(true);
    try {
      // 🎁 開發模式：模擬邀請
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        const newMember: TeamMember = {
          id: `temp-${Date.now()}`,
          user_id: `pending-${Date.now()}`,
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
          status: 'pending',
          permissions: getDefaultPermissions(inviteRole),
          joined_at: new Date().toISOString()
        };
        setMembers([...members, newMember]);
        toast.success(t.inviteSuccess);
        setInviteEmail('');
        setInviteName('');
        setInviteRole('member');
        setInviting(false);
        return;
      }

      // 真實 API 調用
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/team/invite`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email: inviteEmail,
            name: inviteName,
            role: inviteRole
          })
        }
      );

      if (response.ok) {
        toast.success(t.inviteSuccess);
        setInviteEmail('');
        setInviteName('');
        setInviteRole('member');
        fetchMembers();
      } else {
        throw new Error('Failed to send invitation');
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
      toast.error(language === 'en' ? 'Failed to send invitation' : '邀請發送失敗');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(language === 'en' ? 'Are you sure you want to remove this member?' : '確定要移除此成員嗎？')) {
      return;
    }

    try {
      // 🎁 開發模式
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        setMembers(members.filter(m => m.id !== memberId));
        toast.success(t.removeSuccess);
        return;
      }

      // 真實 API
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/team/members/${memberId}`,
        {
          method: 'DELETE',
          headers
        }
      );

      if (response.ok) {
        toast.success(t.removeSuccess);
        fetchMembers();
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error(language === 'en' ? 'Failed to remove member' : '移除成員失敗');
    }
  };

  const getDefaultPermissions = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          view_projects: true,
          edit_projects: true,
          manage_finances: true,
          manage_team: true,
          api_access: true
        };
      case 'manager':
        return {
          view_projects: true,
          edit_projects: true,
          manage_finances: false,
          manage_team: true,
          api_access: true
        };
      default:
        return {
          view_projects: true,
          edit_projects: false,
          manage_finances: false,
          manage_team: false,
          api_access: false
        };
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-purple-600" />;
      case 'manager':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200">{t.statuses.active}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t.statuses.pending}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{t.statuses.inactive}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600" />
            {t.title}
          </h2>
          <p className="text-sm text-gray-600 mt-1">{t.subtitle}</p>
        </div>
      </div>

      {/* Invite Form */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-purple-600" />
            {t.inviteTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t.email}</label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t.name}</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t.role}</label>
              <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t.roles.member}
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t.roles.manager}
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      {t.roles.admin}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleInvite}
                disabled={inviting}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                {inviting ? (language === 'en' ? 'Sending...' : '發送中...') : t.invite}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>{t.members} ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              {language === 'en' ? 'Loading...' : '載入中...'}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t.noMembers}
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-12 w-12 bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-semibold">
                      {member.name?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{member.name}</h4>
                        {getRoleIcon(member.role)}
                        <Badge variant="outline" className="text-xs">
                          {t.roles[member.role]}
                        </Badge>
                        {getStatusBadge(member.status)}
                      </div>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(member.permissions).map(([key, value]) => (
                          value && t?.permissionLabels?.[key as keyof typeof t.permissionLabels] && (
                            <Badge key={key} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {t.permissionLabels[key as keyof typeof t.permissionLabels]}
                            </Badge>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          {t.edit}
                        </DropdownMenuItem>
                        {member.status === 'pending' && (
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            {t.resendInvite}
                          </DropdownMenuItem>
                        )}
                        {member.user_id !== user?.id && (
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t.remove}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}