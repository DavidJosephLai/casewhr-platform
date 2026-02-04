import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Mail,
  Briefcase,
  Calendar,
  User,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface Invitation {
  invitation_id: string;
  project_id: string;
  project_title: string;
  freelancer_id: string;
  freelancer_name: string;
  freelancer_email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at?: string;
  message?: string;
}

export function SentInvitations() {
  const { user, accessToken } = useAuth();
  const { language } = useLanguage();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');

  const t = {
    en: {
      title: 'Sent Invitations',
      description: 'Manage invitations you\'ve sent to freelancers',
      noInvitations: 'No invitations sent yet',
      noInvitationsDesc: 'Visit the Talent Pool to invite freelancers to your projects',
      status: 'Status',
      pending: 'Pending',
      accepted: 'Accepted',
      declined: 'Declined',
      sentTo: 'Sent to',
      project: 'Project',
      sentAt: 'Sent at',
      respondedAt: 'Responded at',
      filterAll: 'All',
      filterPending: 'Pending',
      filterAccepted: 'Accepted',
      filterDeclined: 'Declined',
      viewProject: 'View Project',
      viewProfile: 'View Profile',
      resendInvite: 'Resend',
      message: 'Message',
    },
    'zh-TW': {
      title: '已發送的邀請',
      description: '管理您發送給接案者的邀請',
      noInvitations: '尚未發送任何邀請',
      noInvitationsDesc: '前往人才庫邀請接案者參與您的專案',
      status: '狀態',
      pending: '待回應',
      accepted: '已接受',
      declined: '已拒絕',
      sentTo: '發送給',
      project: '專案',
      sentAt: '發送時間',
      respondedAt: '回應時間',
      filterAll: '全部',
      filterPending: '待回應',
      filterAccepted: '已接受',
      filterDeclined: '已拒絕',
      viewProject: '查看專案',
      viewProfile: '查看個人資料',
      resendInvite: '重新發送',
      message: '訊息',
    },
    'zh-CN': {
      title: '已发送的邀请',
      description: '管理您发送给接案者的邀请',
      noInvitations: '尚未发送任何邀请',
      noInvitationsDesc: '前往人才库邀请接案者参与您的项目',
      status: '状态',
      pending: '待回应',
      accepted: '已接受',
      declined: '已拒绝',
      sentTo: '发送给',
      project: '项目',
      sentAt: '发送时间',
      respondedAt: '回应时间',
      filterAll: '全部',
      filterPending: '待回应',
      filterAccepted: '已接受',
      filterDeclined: '已拒绝',
      viewProject: '查看项目',
      viewProfile: '查看个人资料',
      resendInvite: '重新发送',
      message: '讯息',
    },
  };

  const text = t[language as keyof typeof t] || t['zh-TW'];

  useEffect(() => {
    if (user?.id && accessToken) {
      loadInvitations();
    }
  }, [user, accessToken]);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invitations/sent`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SentInvitations] Loaded invitations:', data.invitations);
        setInvitations(data.invitations || []);
      } else {
        const error = await response.json();
        console.error('❌ [SentInvitations] Failed to load:', error);
        toast.error(text.noInvitations);
      }
    } catch (error) {
      console.error('❌ [SentInvitations] Error:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            {text.accepted}
          </Badge>
        );
      case 'declined':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            {text.declined}
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            {text.pending}
          </Badge>
        );
    }
  };

  const filteredInvitations = invitations.filter((inv) => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewProject = (projectId: string) => {
    window.dispatchEvent(new CustomEvent('openProjectDetail', { 
      detail: { projectId } 
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              {text.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {text.description}
            </CardDescription>
          </div>
          
          {/* Filter Buttons */}
          {invitations.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-blue-600' : ''}
              >
                {text.filterAll}
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
                className={filter === 'pending' ? 'bg-yellow-600' : ''}
              >
                {text.filterPending}
              </Button>
              <Button
                variant={filter === 'accepted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('accepted')}
                className={filter === 'accepted' ? 'bg-green-600' : ''}
              >
                {text.filterAccepted}
              </Button>
              <Button
                variant={filter === 'declined' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('declined')}
                className={filter === 'declined' ? 'bg-red-600' : ''}
              >
                {text.filterDeclined}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {filteredInvitations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Send className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">{text.noInvitations}</p>
            <p className="text-sm text-gray-500">{text.noInvitationsDesc}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvitations.map((invitation) => (
              <div
                key={invitation.invitation_id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left Section: Main Info */}
                  <div className="flex-1 space-y-3">
                    {/* Freelancer Info */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {invitation.freelancer_name || invitation.freelancer_email}
                          </h4>
                          {getStatusBadge(invitation.status)}
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          {invitation.freelancer_email}
                        </div>
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{text.project}:</span>
                      <span className="truncate">{invitation.project_title}</span>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {text.sentAt}: {formatDate(invitation.created_at)}
                      </span>
                      
                      {invitation.responded_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {text.respondedAt}: {formatDate(invitation.responded_at)}
                        </span>
                      )}
                    </div>

                    {/* Message */}
                    {invitation.message && (
                      <div className="text-sm bg-blue-50 border border-blue-200 rounded p-3">
                        <span className="font-medium text-gray-700">{text.message}:</span>
                        <p className="text-gray-600 mt-1">{invitation.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Section: Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProject(invitation.project_id)}
                      className="whitespace-nowrap"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      {text.viewProject}
                    </Button>
                    
                    {invitation.status === 'accepted' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                        onClick={() => {
                          // 🔥 跳轉到接案者的個人資料頁面
                          window.dispatchEvent(
                            new CustomEvent('navigate-to-freelancer-profile', {
                              detail: { freelancerId: invitation.freelancer_id }
                            })
                          );
                        }}
                      >
                        <User className="w-3 h-3 mr-1" />
                        {text.viewProfile}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {invitations.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-gray-900">{invitations.length}</div>
                <div className="text-sm text-gray-600">{text.filterAll}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-center">
                <div className="text-2xl font-bold text-yellow-700">
                  {invitations.filter(i => i.status === 'pending').length}
                </div>
                <div className="text-sm text-yellow-700">{text.filterPending}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
                <div className="text-2xl font-bold text-green-700">
                  {invitations.filter(i => i.status === 'accepted').length}
                </div>
                <div className="text-sm text-green-700">{text.filterAccepted}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
                <div className="text-2xl font-bold text-red-700">
                  {invitations.filter(i => i.status === 'declined').length}
                </div>
                <div className="text-sm text-red-700">{text.filterDeclined}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}