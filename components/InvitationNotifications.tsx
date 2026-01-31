import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useView } from '../contexts/ViewContext';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { Bell, Check, X, Briefcase, Calendar, User, Loader2, Eye } from 'lucide-react';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: {
    project_id: string;
    project_title: string;
    client_id: string;
    invitation_id: string;
  };
  read: boolean;
  created_at: string;
}

interface InvitationNotificationsProps {
  onUnreadCountChange?: (count: number) => void;
}

export function InvitationNotifications({ onUnreadCountChange }: InvitationNotificationsProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const { setView } = useView();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && accessToken) {
      loadNotifications();
    }
  }, [user?.id, accessToken]);

  const loadNotifications = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/notifications`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        
        // 通知父組件未讀數量
        if (onUnreadCountChange) {
          onUnreadCountChange(data.unread_count || 0);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        
        // 更新未讀數量
        const unreadCount = notifications.filter(n => !n.read && n.id !== notificationId).length;
        if (onUnreadCountChange) {
          onUnreadCountChange(unreadCount);
        }
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/notifications/read-all`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        if (onUnreadCountChange) {
          onUnreadCountChange(0);
        }
        toast.success(language === 'en' ? 'All notifications marked as read' : '已全部標記為已讀');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const respondToInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      setProcessingId(invitationId);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invitations/${invitationId}/respond`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        }
      );

      if (response.ok) {
        if (action === 'accept') {
          toast.success(language === 'en' ? 'Invitation accepted!' : '已接受邀請！');
        } else {
          toast.success(language === 'en' ? 'Invitation declined' : '已拒絕邀請');
        }
        
        // 重新載入通知
        await loadNotifications();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to respond');
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast.error(language === 'en' ? 'Failed to respond' : '回應失敗');
    } finally {
      setProcessingId(null);
    }
  };

  const viewProject = (projectId: string, notificationId: string) => {
    // 標記為已讀
    markAsRead(notificationId);
    
    // 跳轉到項目詳情
    sessionStorage.setItem('selected_project_id', projectId);
    setView('project-detail');
  };

  const t = {
    title: language === 'en' ? 'Notifications' : language === 'zh-CN' ? '通知' : '通知',
    noNotifications: language === 'en' ? 'No notifications' : language === 'zh-CN' ? '暂无通知' : '暫無通知',
    markAllRead: language === 'en' ? 'Mark all as read' : language === 'zh-CN' ? '全部标为已读' : '全部標為已讀',
    accept: language === 'en' ? 'Accept' : language === 'zh-CN' ? '接受' : '接受',
    decline: language === 'en' ? 'Decline' : language === 'zh-CN' ? '拒绝' : '拒絕',
    viewProject: language === 'en' ? 'View Project' : language === 'zh-CN' ? '查看项目' : '查看專案',
    accepted: language === 'en' ? 'Accepted' : language === 'zh-CN' ? '已接受' : '已接受',
    declined: language === 'en' ? 'Declined' : language === 'zh-CN' ? '已拒绝' : '已拒絕',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // 只顯示邀請類型的通知
  const inviteNotifications = notifications.filter(n => n.type === 'project_invite');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          {t.title}
        </h3>
        {inviteNotifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {t.markAllRead}
          </button>
        )}
      </div>

      {/* Notifications List */}
      {inviteNotifications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">{t.noNotifications}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inviteNotifications.map((notification) => {
            // 從通知數據中獲取邀請信息
            const invitation = notification.data;
            const isProcessing = processingId === invitation.invitation_id;

            return (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all ${
                  notification.read
                    ? 'bg-white border-gray-200'
                    : 'bg-blue-50 border-blue-300 shadow-sm'
                }`}
              >
                {/* Notification Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {language === 'en' ? notification.title : '新項目邀請'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {language === 'en' 
                        ? notification.message
                        : `您收到了「${invitation.project_title}」項目的投標邀請`}
                    </p>
                    
                    {/* Project Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(notification.created_at).toLocaleDateString(
                          language === 'en' ? 'en-US' : 'zh-TW'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => viewProject(invitation.project_id, notification.id)}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {t.viewProject}
                  </button>
                  
                  <button
                    onClick={() => respondToInvitation(invitation.invitation_id, 'accept')}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {t.accept}
                  </button>
                  
                  <button
                    onClick={() => respondToInvitation(invitation.invitation_id, 'decline')}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    {t.decline}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
