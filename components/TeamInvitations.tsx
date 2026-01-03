import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Mail, CheckCircle, XCircle, Building2, User, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface TeamInvitationsProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status: string;
  organization_owner_id: string;
  organization_name: string;
  inviter_name: string;
  added_at: string;
}

export function TeamInvitations({ language = 'en' }: TeamInvitationsProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);

  const translations = {
    en: {
      title: 'Team Invitations',
      description: 'You have pending team invitations',
      noInvitations: 'No pending invitations',
      noInvitationsDesc: 'You don\'t have any pending team invitations at the moment.',
      accept: 'Accept',
      accepting: 'Accepting...',
      decline: 'Decline',
      invitedBy: 'Invited by',
      organization: 'Organization',
      role: 'Role',
      invitedOn: 'Invited on',
      admin: 'Admin',
      member: 'Member',
      acceptSuccess: 'You have joined the team!',
      acceptError: 'Failed to accept invitation',
      declineSuccess: 'Invitation declined',
      declineError: 'Failed to decline invitation',
    },
    zh: {
      title: '團隊邀請',
      description: '您有待處理的團隊邀請',
      noInvitations: '無待處理邀請',
      noInvitationsDesc: '目前沒有待處理的團隊邀請。',
      accept: '接受',
      accepting: '接受中...',
      decline: '拒絕',
      invitedBy: '邀請者',
      organization: '組織',
      role: '角色',
      invitedOn: '邀請日期',
      admin: '管理員',
      member: '成員',
      acceptSuccess: '您已成功加入團隊！',
      acceptError: '接受邀請失敗',
      declineSuccess: '已拒絕邀請',
      declineError: '拒絕邀請失敗',
    },
    'zh-TW': {
      title: '團隊邀請',
      description: '您有待處理的團隊邀請',
      noInvitations: '無待處理邀請',
      noInvitationsDesc: '目前沒有待處理的團隊邀請。',
      accept: '接受',
      accepting: '接受中...',
      decline: '拒絕',
      invitedBy: '邀請者',
      organization: '組織',
      role: '角色',
      invitedOn: '邀請日期',
      admin: '管理員',
      member: '成員',
      acceptSuccess: '您已成功加入團隊！',
      acceptError: '接受邀請失敗',
      declineSuccess: '已拒絕邀請',
      declineError: '拒絕邀請失敗',
    },
    'zh-CN': {
      title: '团队邀请',
      description: '您有待处理的团队邀请',
      noInvitations: '无待处理邀请',
      noInvitationsDesc: '目前没有待处理的团队邀请。',
      accept: '接受',
      accepting: '接受中...',
      decline: '拒绝',
      invitedBy: '邀请者',
      organization: '组织',
      role: '角色',
      invitedOn: '邀请日期',
      admin: '管理员',
      member: '成员',
      acceptSuccess: '您已成功加入团队！',
      acceptError: '接受邀请失败',
      declineSuccess: '已拒绝邀请',
      declineError: '拒绝邀请失败',
    },
  };

  const t = translations[language] || translations.en;
  
  // ✅ 安全檢查：確保 invitations 是數組
  const safeInvitations = Array.isArray(invitations) ? invitations : [];
  
  console.log('📬 [TeamInvitations] State check:', {
    invitations,
    isArray: Array.isArray(invitations),
    length: safeInvitations.length
  });

  useEffect(() => {
    if (user && accessToken) {
      fetchInvitations();
    }
  }, [user, accessToken]);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      // 🔧 FIX: Handle dev mode properly
      const isDevMode = localStorage.getItem('dev_mode_active') === 'true';
      
      // 🔥 在開發模式下，直接返回空邀請列表
      if (isDevMode) {
        console.log('🧪 [Invitations] Dev mode detected, using mock data');
        setInvitations([]);
        setLoading(false);
        return;
      }
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/team/my-invitations`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
        console.log('📬 [Invitations] Fetched invitations:', data.invitations);
      } else {
        console.error('Failed to fetch invitations:', response.status);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inviteId: string) => {
    setAccepting(inviteId);
    try {
      // 🔧 FIX: Handle dev mode properly
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
        'Content-Type': 'application/json',
      };
      
      // If dev mode, add dev token to custom header
      if (isDev && accessToken) {
        headers['X-Dev-Token'] = accessToken;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/team/accept-invitation/${inviteId}`,
        {
          method: 'POST',
          headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(t.acceptSuccess, { duration: 5000 });
        console.log('✅ [Invitations] Accepted invitation:', data);
        
        // Refresh invitations list
        fetchInvitations();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t.acceptError, { duration: 5000 });
        console.error('Failed to accept invitation:', errorData);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error(t.acceptError, { duration: 5000 });
    } finally {
      setAccepting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return language === 'en' 
      ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? 'bg-blue-600' : 'bg-gray-600';
  };

  if (!user) {
    return null;
  }

  // Don't show the card if there are no invitations and not loading
  if (!loading && invitations.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Mail className="size-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">{t.title}</CardTitle>
            {invitations.length > 0 && (
              <CardDescription className="mt-1">
                {t.description}
                <Badge className="ml-2 bg-purple-600">{invitations.length}</Badge>
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {safeInvitations.map((invitation) => (
              <Card key={invitation.id} className="overflow-hidden border-2 border-purple-100 hover:border-purple-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Organization */}
                      <div className="flex items-center gap-2">
                        <Building2 className="size-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-gray-600">{t.organization}</p>
                          <p className="font-semibold text-gray-900">{invitation.organization_name}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Inviter */}
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-600">{t.invitedBy}</p>
                            <p className="text-sm font-medium text-gray-900">{invitation.inviter_name}</p>
                          </div>
                        </div>

                        {/* Role */}
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-xs text-gray-600">{t.role}</p>
                            <Badge className={getRoleBadgeColor(invitation.role)}>
                              {t[invitation.role as keyof typeof t] || invitation.role}
                            </Badge>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-600">{t.invitedOn}</p>
                            <p className="text-sm text-gray-900">{formatDate(invitation.added_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleAccept(invitation.id)}
                        disabled={accepting === invitation.id}
                        className="bg-purple-600 hover:bg-purple-700"
                        size="sm"
                      >
                        {accepting === invitation.id ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            {t.accepting}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="size-4 mr-2" />
                            {t.accept}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}