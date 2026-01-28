import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Send,
  Crown,
  Circle,
  Users,
  Headphones,
  Clock,
  Check,
  CheckCheck,
  Search,
  Plus,
  MoreVertical,
  Phone,
  Video,
  Info
} from 'lucide-react';

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
  read: boolean;
}

interface Chat {
  id: string;
  user_id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_type: 'manager' | 'team' | 'support';
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  online: boolean;
}

interface EnterpriseChatProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function EnterpriseChat({ language = 'en' }: EnterpriseChatProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<any>(null);

  const translations = {
    en: {
      title: 'Enterprise Chat',
      enterpriseOnly: 'Enterprise Only',
      upgrade: 'Upgrade to Enterprise',
      upgradeDesc: 'Get instant access to real-time chat with your account manager and team members!',
      chats: 'Chats',
      messages: 'Messages',
      online: 'Online',
      offline: 'Offline',
      typing: 'Typing...',
      search: 'Search chats...',
      newChat: 'New Chat',
      sendMessage: 'Send message',
      typeMessage: 'Type a message...',
      noChats: 'No chats yet. Start a conversation!',
      noMessages: 'No messages yet. Send the first one!',
      manager: 'Account Manager',
      support: 'Support Team',
      team: 'Team',
      now: 'Now',
      today: 'Today',
      yesterday: 'Yesterday',
      read: 'Read',
      delivered: 'Delivered',
      features: {
        title: 'Enterprise Chat Features:',
        items: [
          'Real-time messaging',
          'Chat with account manager',
          'Team collaboration',
          'Message history',
          'Online status',
          'File sharing (coming soon)'
        ]
      },
      benefits: {
        instant: 'Instant responses from your account manager',
        team: 'Seamless team communication',
        history: 'Complete message history',
        status: 'See who\'s online'
      }
    },
    zh: {
      title: '企業版即時聊天',
      enterpriseOnly: '企業版專屬',
      upgrade: '升級至企業版',
      upgradeDesc: '立即獲得與客戶經理和團隊成員的即時聊天功能！',
      chats: '聊天',
      messages: '訊息',
      online: '在線',
      offline: '離線',
      typing: '輸入中...',
      search: '搜尋聊天...',
      newChat: '新聊天',
      sendMessage: '發送訊息',
      typeMessage: '輸入訊息...',
      noChats: '尚無聊天。開始對話！',
      noMessages: '尚無訊息。發送第一條！',
      manager: '客戶經理',
      support: '支援團隊',
      team: '團隊',
      now: '現在',
      today: '今天',
      yesterday: '昨天',
      read: '已讀',
      delivered: '已送達',
      features: {
        title: '企業版聊天功能：',
        items: [
          '即時訊息',
          '與客戶經理聊天',
          '隊協作',
          '訊息歷史',
          '在線狀態',
          '文件分享（即將推出）'
        ]
      },
      benefits: {
        instant: '客戶經理即時回應',
        team: '無縫團隊溝通',
        history: '完整訊息歷史',
        status: '查看誰在線'
      }
    },
    'zh-TW': {
      title: '企業版即時聊天',
      enterpriseOnly: '企業版專屬',
      upgrade: '升級至企業版',
      upgradeDesc: '立即獲得與客戶經理和團隊成員的即時聊天功能！',
      chats: '聊天',
      messages: '訊息',
      online: '在線',
      offline: '離線',
      typing: '輸入中...',
      search: '搜尋聊天...',
      newChat: '新聊天',
      sendMessage: '發送訊息',
      typeMessage: '輸入訊息...',
      noChats: '尚無聊天。開始對話！',
      noMessages: '尚無訊息。發送第一條！',
      manager: '客戶經理',
      support: '支援團隊',
      team: '團隊',
      now: '現在',
      today: '今天',
      yesterday: '昨天',
      read: '已讀',
      delivered: '已送達',
      features: {
        title: '企業版聊天功能：',
        items: [
          '即時訊息',
          '與客戶經理聊天',
          '團隊協作',
          '訊息歷史',
          '在線狀態',
          '文件分享（即將推出）'
        ]
      },
      benefits: {
        instant: '客戶經理即時回應',
        team: '無縫團隊溝通',
        history: '完整訊息歷史',
        status: '查看誰在線'
      }
    },
    'zh-CN': {
      title: '企业版即时聊天',
      enterpriseOnly: '企业版专属',
      upgrade: '升级至企业版',
      upgradeDesc: '立即获得与客户经理和团队成员的即时聊天功能！',
      chats: '聊天',
      messages: '消息',
      online: '在线',
      offline: '离线',
      typing: '输入中...',
      search: '搜索聊天...',
      newChat: '新聊天',
      sendMessage: '发送消息',
      typeMessage: '输入消息...',
      noChats: '尚无聊天。开始对话！',
      noMessages: '尚无消息。发送第一条！',
      manager: '客户经理',
      support: '支持团队',
      team: '团队',
      now: '现在',
      today: '今天',
      yesterday: '昨天',
      read: '已读',
      delivered: '已送达',
      features: {
        title: '企业版聊天功能：',
        items: [
          '即时消息',
          '与客户经理聊天',
          '团队协作',
          '消息历史',
          '在线状态',
          '文件分享（即将推出）'
        ]
      },
      benefits: {
        instant: '客户经理即时回应',
        team: '无缝团队沟通',
        history: '完整消息历史',
        status: '查看谁在线'
      }
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (user) {
      fetchData();
    }
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔄 [EnterpriseChat] Fetching subscription data for user:', user?.id);
      
      // 🔥 優先檢查開發模式的訂閱信息
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      let subData: any = null;
      
      if (devModeActive) {
        const devSubscription = localStorage.getItem('dev_mode_subscription');
        if (devSubscription) {
          try {
            const subscription = JSON.parse(devSubscription);
            console.log('🎁 [EnterpriseChat] Using dev mode subscription:', subscription);
            subData = { subscription };
            setSubscription(subscription);
          } catch (err) {
            console.error('Failed to parse dev mode subscription:', err);
          }
        }
      }
      
      // 如果不是開發模式或沒有開發模式訂閱，則從後端獲取
      if (!subData) {
        // Fetch subscription
        // 🔥 FIX: Handle dev mode properly - use publicAnonKey for dev mode
        const isDev = accessToken?.startsWith('dev-user-');
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
        };
        if (isDev) {
          headers['X-Dev-Token'] = accessToken;
          console.log('🧪 [EnterpriseChat] Using dev mode for subscription API');
        }
        
        const subResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/${user?.id}`,
          { headers }
        );

        console.log('📊 [EnterpriseChat] Subscription response status:', subResponse.status);

        if (subResponse.ok) {
          subData = await subResponse.json();
          console.log('✅ [EnterpriseChat] Subscription data:', subData);
          setSubscription(subData.subscription);
        } else {
          const errorText = await subResponse.text();
          console.error('❌ [EnterpriseChat] Failed to fetch subscription:', errorText);
        }
      }

      // Check if user is an enterprise team member
      console.log('🔄 [EnterpriseChat] Checking team membership...');
      try {
        const isDev = accessToken?.startsWith('dev-user-');
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
        };
        if (isDev) {
          headers['X-Dev-Token'] = accessToken;
        }
        
        const teamCheckResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/check-team-member`,
          { headers }
        );
        if (teamCheckResponse.ok) {
          const teamData = await teamCheckResponse.json();
          setIsTeamMember(teamData.isTeamMember || false);
          console.log('✅ [EnterpriseChat] Team member status:', teamData.isTeamMember);
        }
      } catch (err) {
        console.warn('⚠️ [EnterpriseChat] Failed to check team membership:', err);
      }

      const hasEnterpriseAccess = subData?.subscription?.plan === 'enterprise' || isTeamMember;
      console.log('🔑 [EnterpriseChat] Enterprise access:', hasEnterpriseAccess, '(subscription:', subData?.subscription?.plan, ', team member:', isTeamMember, ')');

      console.log('🔄 [EnterpriseChat] Fetching chats...');

      // Fetch chats if enterprise or team member
      // 🔥 FIX: Handle dev mode properly
      const isDev = accessToken?.startsWith('dev-user-');
      const fetchHeaders: Record<string, string> = {
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        fetchHeaders['X-Dev-Token'] = accessToken;
      }
      
      const chatsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/chats`,
        { headers: fetchHeaders }
      );

      console.log('📊 [EnterpriseChat] Chats response status:', chatsResponse.status);

      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        console.log('✅ [EnterpriseChat] Chats data:', chatsData);
        setChats(chatsData.chats || []);
        
        // If no chats exist and user has enterprise access, initialize default chats
        if ((!chatsData.chats || chatsData.chats.length === 0) && hasEnterpriseAccess) {
          console.log('🔧 [EnterpriseChat] No chats found, initializing default chats...');
          await initializeDefaultChats();
          
          // Refetch chats after initialization
          console.log('🔄 [EnterpriseChat] Refetching chats after initialization...');
          const isDev = accessToken?.startsWith('dev-user-');
          const refreshHeaders: Record<string, string> = {
            'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
          };
          if (isDev) {
            refreshHeaders['X-Dev-Token'] = accessToken;
          }
          
          const refreshResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/chats`,
            { headers: refreshHeaders }
          );
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log('✅ [EnterpriseChat] Refreshed chats:', refreshData);
            setChats(refreshData.chats || []);
          } else {
            const errorText = await refreshResponse.text();
            console.error('❌ [EnterpriseChat] Failed to refresh chats:', errorText);
          }
        }
      } else {
        const errorText = await chatsResponse.text();
        console.error('❌ [EnterpriseChat] Failed to fetch chats:', errorText);
        
        // If user has enterprise access but chats fetch failed, try initializing
        if (hasEnterpriseAccess) {
          console.log('🔧 [EnterpriseChat] User with enterprise access, initializing default chats...');
          await initializeDefaultChats();
          
          // Try fetching again
          const retryResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/chats`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            console.log('✅ [EnterpriseChat] Retry chats:', retryData);
            setChats(retryData.chats || []);
          }
        }
      }
    } catch (error) {
      console.error('❌ [EnterpriseChat] Error fetching chat data:', error);
      toast.error(language === 'en' ? 'Failed to load chat data' : '載入聊天資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultChats = async () => {
    try {
      console.log('🚀 [EnterpriseChat] Initializing default chats...');
      
      // Create default chats for enterprise users
      const defaultChats = [
        {
          recipient_id: 'account-manager-001',
          recipient_name: language === 'en' ? 'Account Manager' : '客戶經理',
          recipient_type: 'manager'
        },
        {
          recipient_id: 'support-team-001',
          recipient_name: language === 'en' ? 'Support Team' : '即時支援',
          recipient_type: 'support'
        }
      ];

      const isDev = accessToken?.startsWith('dev-user-');
      
      for (const chat of defaultChats) {
        try {
          console.log('📝 [EnterpriseChat] Creating chat:', chat);
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
          };
          if (isDev) {
            headers['X-Dev-Token'] = accessToken;
          }
          
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/chats`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify(chat),
            }
          );
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ [EnterpriseChat] Chat created:', result);
          } else {
            const errorText = await response.text();
            console.error('❌ [EnterpriseChat] Failed to create chat:', errorText);
          }
        } catch (err) {
          console.error('❌ [EnterpriseChat] Error creating default chat:', err);
        }
      }
      
      console.log('✅ [EnterpriseChat] Default chats initialization completed');
    } catch (error) {
      console.error('❌ [EnterpriseChat] Error initializing default chats:', error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/chats/${chatId}/messages`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Mark messages as read
        await markAsRead(chatId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markAsRead = async (chatId: string) => {
    try {
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken;
      }
      
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/chats/${chatId}/read`,
        {
          method: 'POST',
          headers,
        }
      );
      // Update local chat unread count
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, unread_count: 0 } : c
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (selectedChat) {
        fetchMessages(selectedChat.id);
      }
    }, 3000); // Poll every 3 seconds
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    setSending(true);
    try {
      const isDev = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${isDev ? publicAnonKey : accessToken}`,
      };
      if (isDev) {
        headers['X-Dev-Token'] = accessToken;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/chats/${selectedChat.id}/messages`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: newMessage.trim()
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      await fetchMessages(selectedChat.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(language === 'en' ? 'Failed to send message' : '发送消息失败');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.now;
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 0) return t.today;
    if (diffDays === 1) return t.yesterday;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecipientIcon = (type: string) => {
    switch (type) {
      case 'manager': return <Crown className="size-4 text-purple-600" />;
      case 'support': return <Headphones className="size-4 text-blue-600" />;
      case 'team': return <Users className="size-4 text-green-600" />;
      default: return <MessageSquare className="size-4" />;
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if user has enterprise access (either owns enterprise subscription or is a team member)
  const hasEnterpriseAccess = subscription?.plan === 'enterprise' || isTeamMember;
  
  // 🔥 添加調試日誌
  console.log('🔍 [EnterpriseChat] Render check:', {
    subscription: subscription,
    subscriptionPlan: subscription?.plan,
    isTeamMember,
    hasEnterpriseAccess,
    loading
  });

  if (!hasEnterpriseAccess && !loading) {
    return (
      <Card className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Crown className="size-8 text-purple-600" />
            <h3 className="text-2xl text-purple-900">{t.title}</h3>
          </div>
          <Badge className="bg-purple-600 text-white">
            {t.enterpriseOnly}
          </Badge>
          <p className="text-purple-800 max-w-md mx-auto">
            {t.upgradeDesc}
          </p>
          
          {/* 主升級按鈕 */}
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
            onClick={() => {
              window.location.href = '/#subscription';
            }}
          >
            <Crown className="size-5 mr-2" />
            {language === 'en' ? 'Upgrade Now' : '立即升級'}
          </Button>
          
          <div className="bg-white/50 rounded-lg p-6 mt-6">
            <h4 className="font-semibold text-purple-900 mb-4">{t.features.title}</h4>
            <ul className="text-left space-y-2 max-w-md mx-auto">
              {t.features.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-purple-800">
                  <MessageSquare className="size-5 text-purple-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <Card 
              className="bg-white/70 cursor-pointer hover:bg-white hover:shadow-lg transition-all"
              onClick={() => {
                window.location.href = '/#subscription';
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Headphones className="size-5 text-blue-600" />
                  <h5 className="font-semibold text-sm">{language === 'en' ? 'Instant Support' : '即時支援'}</h5>
                </div>
                <p className="text-xs text-gray-600">{t.benefits.instant}</p>
                <div className="mt-3 text-xs text-purple-600 font-semibold">
                  {language === 'en' ? 'Click to upgrade →' : '點擊升級 →'}
                </div>
              </CardContent>
            </Card>
            <Card 
              className="bg-white/70 cursor-pointer hover:bg-white hover:shadow-lg transition-all"
              onClick={() => {
                window.location.href = '/#subscription';
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="size-5 text-green-600" />
                  <h5 className="font-semibold text-sm">{language === 'en' ? 'Team Chat' : '團隊聊天'}</h5>
                </div>
                <p className="text-xs text-gray-600">{t.benefits.team}</p>
                <div className="mt-3 text-xs text-purple-600 font-semibold">
                  {language === 'en' ? 'Click to upgrade →' : '點擊升級 →'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            {language === 'en' ? 'Loading...' : '載入中...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="size-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{t.title}</CardTitle>
                <CardDescription className="mt-1">
                  {language === 'en' 
                    ? 'Real-time communication with your team'
                    : '與您的團隊即時溝通'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-600">{t.enterpriseOnly}</Badge>
              {/* Debug button to force initialize chats */}
              <Button 
                size="sm" 
                variant="outline"
                onClick={async () => {
                  console.log('🔧 [DEBUG] Force initializing chats...');
                  await initializeDefaultChats();
                  await fetchData();
                  toast.success(language === 'en' ? 'Chats initialized!' : '聊天已初始化！');
                }}
              >
                🔧 {language === 'en' ? 'Init Chats' : '初始化聊天'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        <div className="flex flex-1 overflow-hidden">
          {/* Chat List */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{t.chats}</h3>
                <Button size="sm" variant="outline" className="h-8">
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {t.noChats}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`w-full p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                        selectedChat?.id === chat.id ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="relative">
                        <div className="size-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white font-semibold">
                          {chat.recipient_name[0].toUpperCase()}
                        </div>
                        {chat.online && (
                          <Circle className="absolute bottom-0 right-0 size-3 text-green-500 fill-green-500 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            {getRecipientIcon(chat.recipient_type)}
                            <span className="font-semibold text-sm truncate">
                              {chat.recipient_name}
                            </span>
                          </div>
                          {chat.last_message_at && (
                            <span className="text-xs text-gray-500">
                              {formatTime(chat.last_message_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600 truncate flex-1">
                            {chat.last_message || (language === 'en' ? 'No messages' : '無訊息')}
                          </p>
                          {chat.unread_count > 0 && (
                            <Badge className="bg-purple-600 text-white text-xs h-5 px-2">
                              {chat.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="size-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white font-semibold">
                        {selectedChat.recipient_name[0].toUpperCase()}
                      </div>
                      {selectedChat.online && (
                        <Circle className="absolute bottom-0 right-0 size-3 text-green-500 fill-green-500 bg-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getRecipientIcon(selectedChat.recipient_type)}
                        <h4 className="font-semibold">{selectedChat.recipient_name}</h4>
                      </div>
                      <p className="text-xs text-gray-500">
                        {selectedChat.online ? t.online : t.offline}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost">
                      <Phone className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Video className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Info className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                      {t.noMessages}
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => {
                        const isOwn = message.sender_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  isOwn
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white border'
                                }`}
                              >
                                {!isOwn && (
                                  <p className="text-xs font-semibold mb-1 text-gray-700">
                                    {message.sender_name}
                                  </p>
                                )}
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.message}
                                </p>
                              </div>
                              <div className={`flex items-center gap-1 mt-1 px-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-xs text-gray-500">
                                  {formatMessageTime(message.created_at)}
                                </span>
                                {isOwn && (
                                  message.read ? (
                                    <CheckCheck className="size-3 text-purple-600" />
                                  ) : (
                                    <Check className="size-3 text-gray-400" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-white">
                  <div className="flex items-end gap-2">
                    <Textarea
                      placeholder={t.typeMessage}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      rows={1}
                      className="resize-none min-h-[40px] max-h-[120px]"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-purple-600 hover:bg-purple-700 h-10 shrink-0"
                    >
                      {sending ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="size-16 mx-auto mb-4 text-gray-400" />
                  <p>{language === 'en' ? 'Select a chat to start messaging' : '选择聊天开始消息'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}