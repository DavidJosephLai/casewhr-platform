import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { MessageSquare, Search, Trash2, Loader2, Filter, Users, Eye, Calendar, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

// Helper function to create auth headers with dev token support
function createAuthHeaders(accessToken: string | null): HeadersInit {
  const headers: HeadersInit = {};
  
  if (accessToken?.startsWith('dev-user-')) {
    // Dev mode: Use publicAnonKey for Authorization, dev token in X-Dev-Token
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
    headers['X-Dev-Token'] = accessToken;
    console.log('[AdminMessages] Dev mode: Using publicAnonKey for auth, dev token in X-Dev-Token header');
  } else if (accessToken) {
    // Normal mode: Use real access token
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  project_id?: string;
  project_title?: string;
  participants: {
    client_id: string;
    client_name: string;
    client_avatar?: string;
    freelancer_id: string;
    freelancer_name: string;
    freelancer_avatar?: string;
  };
  last_message?: string;
  last_message_at?: string;
  unread_count_client: number;
  unread_count_freelancer: number;
  message_count?: number;
}

export function AdminMessages() {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const content = {
    en: {
      title: 'Message Monitoring',
      description: 'View and monitor all conversations between clients and freelancers',
      searchPlaceholder: 'Search conversations...',
      noConversations: 'No conversations found',
      selectConversation: 'Select a conversation to view messages',
      loadingConversations: 'Loading conversations...',
      loadingMessages: 'Loading messages...',
      refresh: 'Refresh',
      showUnreadOnly: 'Unread Only',
      allConversations: 'All Conversations',
      conversationsWith: 'Conversation',
      project: 'Project',
      client: 'Client',
      freelancer: 'Freelancer',
      messages: 'Messages',
      lastMessage: 'Last Message',
      noMessages: 'No messages yet',
      unread: 'Unread',
      total: 'Total',
      deleteConversation: 'Delete Conversation',
      deleteConfirmTitle: 'Delete Conversation',
      deleteConfirmDescription: 'Are you sure you want to delete this conversation? This action cannot be undone and will permanently delete all messages.',
      cancel: 'Cancel',
      delete: 'Delete',
      deleteSuccess: 'Conversation deleted successfully',
      deleteFailed: 'Failed to delete conversation',
      stats: {
        totalConversations: 'Total Conversations',
        activeConversations: 'Active Today',
        totalMessages: 'Total Messages',
        unreadMessages: 'Unread',
      },
    },
    'zh-TW': {
      title: '訊息監控',
      description: '查看並監控所有客戶與接案者之間的對話',
      searchPlaceholder: '搜尋對話...',
      noConversations: '沒有找到對話',
      selectConversation: '選擇一個對話以查看訊息',
      loadingConversations: '載入對話中...',
      loadingMessages: '載入訊息中...',
      refresh: '重新整理',
      showUnreadOnly: '顯示未讀',
      allConversations: '所有對話',
      conversationsWith: '對話',
      project: '項目',
      client: '客戶',
      freelancer: '接案者',
      messages: '訊息',
      lastMessage: '最後訊息',
      noMessages: '還沒有訊息',
      unread: '未讀',
      total: '總計',
      deleteConversation: '刪除對話',
      deleteConfirmTitle: '刪除對話',
      deleteConfirmDescription: '確定要刪除此對話嗎？此操作無法撤銷，將永久刪除所有訊息。',
      cancel: '取消',
      delete: '刪除',
      deleteSuccess: '對話刪除成功',
      deleteFailed: '刪除對話失敗',
      stats: {
        totalConversations: '總對話數',
        activeConversations: '今日活躍',
        totalMessages: '總訊息數',
        unreadMessages: '未讀',
      },
    },
    'zh-CN': {
      title: '消息监控',
      description: '查看并监控所有客户与接案者之间的对话',
      searchPlaceholder: '搜索对话...',
      noConversations: '没有找到对话',
      selectConversation: '选择一个对话以查看消息',
      loadingConversations: '载入对话中...',
      loadingMessages: '载入消息中...',
      refresh: '重新整理',
      showUnreadOnly: '只显示未读',
      allConversations: '所有对话',
      conversationsWith: '对话',
      project: '项目',
      client: '户',
      freelancer: '接案者',
      messages: '消息',
      lastMessage: '最后消息',
      noMessages: '还没有消息',
      unread: '未读',
      total: '总计',
      deleteConversation: '删除对话',
      deleteConfirmTitle: '删除对话',
      deleteConfirmDescription: '确定要删除此对话吗？此操作无法撤销，将永久删除所有消息。',
      cancel: '取消',
      delete: '删除',
      deleteSuccess: '对话删除成功',
      deleteFailed: '删除对话失败',
      stats: {
        totalConversations: '总对话数',
        activeConversations: '今日活跃',
        totalMessages: '总消息数',
        unreadMessages: '未读',
      },
    },
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  useEffect(() => {
    if (accessToken) {
      fetchConversations();
    }
  }, [accessToken]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 [AdminMessages] Fetching conversations...');
      console.log('🔍 [AdminMessages] projectId:', projectId);
      console.log('🔍 [AdminMessages] accessToken:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NULL');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/conversations`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      console.log('🔍 [AdminMessages] Response status:', response.status);
      console.log('🔍 [AdminMessages] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AdminMessages] Error response:', errorText);
        throw new Error(`Failed to fetch conversations: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [AdminMessages] Conversations loaded:', data.conversations?.length || 0);
      setConversations(data.conversations || []);
    } catch (error: any) {
      console.error('❌ [AdminMessages] Error fetching conversations:', error);
      toast.error(
        language === 'en'
          ? 'Failed to load conversations'
          : '載入對話失敗'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/conversations/${conversationId}/messages`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error(
        language === 'en'
          ? 'Failed to load messages'
          : '載入訊息失敗'
      );
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery === '' || 
      conv.participants.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participants.freelancer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.project_title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = !filterUnread || 
      (conv.unread_count_client > 0 || conv.unread_count_freelancer > 0);
    
    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const totalConversations = conversations.length;
  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.unread_count_client + conv.unread_count_freelancer,
    0
  );
  const totalMessages = conversations.reduce(
    (sum, conv) => sum + (conv.message_count || 0),
    0
  );
  const today = new Date().toISOString().split('T')[0];
  const activeToday = conversations.filter(conv => 
    conv.last_message_at?.startsWith(today)
  ).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'en' ? 'Just now' : '剛剛';
    if (diffMins < 60) return `${diffMins}${language === 'en' ? 'm ago' : '分鐘前'}`;
    if (diffHours < 24) return `${diffHours}${language === 'en' ? 'h ago' : '小時前'}`;
    if (diffDays < 7) return `${diffDays}${language === 'en' ? 'd ago' : '天前'}`;
    
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW');
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/conversations/${conversationToDelete.id}`,
        {
          method: 'DELETE',
          headers: createAuthHeaders(accessToken),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      setConversations(conversations.filter(conv => conv.id !== conversationToDelete.id));
      toast.success(t.deleteSuccess);
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast.error(t.deleteFailed);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.stats.totalConversations}</p>
                <p className="text-2xl font-bold">{totalConversations}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.stats.activeConversations}</p>
                <p className="text-2xl font-bold">{activeToday}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.stats.totalMessages}</p>
                <p className="text-2xl font-bold">{totalMessages}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.stats.unreadMessages}</p>
                <p className="text-2xl font-bold text-red-600">{totalUnread}</p>
              </div>
              <Eye className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t.title}
              </CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchConversations}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1 space-y-4">
              {/* Search and Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={filterUnread ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterUnread(!filterUnread)}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {filterUnread ? t.showUnreadOnly : t.allConversations}
                </Button>
              </div>

              {/* Conversations */}
              <ScrollArea className="h-[600px] pr-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-500">{t.loadingConversations}</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{t.noConversations}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-4 rounded-lg border transition-all group ${
                          selectedConversation?.id === conv.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="flex -space-x-2 cursor-pointer"
                            onClick={() => handleSelectConversation(conv)}
                          >
                            <Avatar className="h-8 w-8 border-2 border-white">
                              <AvatarImage src={conv.participants.client_avatar} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                {conv.participants.client_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <Avatar className="h-8 w-8 border-2 border-white">
                              <AvatarImage src={conv.participants.freelancer_avatar} />
                              <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                                {conv.participants.freelancer_name[0]}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleSelectConversation(conv)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">
                                {conv.participants.client_name} ↔ {conv.participants.freelancer_name}
                              </p>
                              {(conv.unread_count_client > 0 || conv.unread_count_freelancer > 0) && (
                                <Badge variant="destructive" className="ml-2">
                                  {conv.unread_count_client + conv.unread_count_freelancer}
                                </Badge>
                              )}
                            </div>
                            
                            {conv.project_title && (
                              <p className="text-xs text-blue-600 mb-1 truncate">
                                📋 {conv.project_title}
                              </p>
                            )}
                            
                            {conv.last_message && (
                              <p className="text-xs text-gray-500 truncate">
                                {conv.last_message}
                              </p>
                            )}
                            
                            {conv.last_message_at && (
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(conv.last_message_at)}
                              </p>
                            )}
                          </div>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConversationToDelete(conv);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Messages View */}
            <div className="lg:col-span-2">
              {!selectedConversation ? (
                <div className="flex flex-col items-center justify-center h-[600px] bg-gray-50 rounded-lg">
                  <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">{t.selectConversation}</p>
                </div>
              ) : (
                <div className="border rounded-lg h-[600px] flex flex-col bg-white">
                  {/* Conversation Header */}
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{t.conversationsWith}</h3>
                      <Badge variant="secondary">
                        {messages.length} {t.messages}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">{t.client}</p>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedConversation.participants.client_avatar} />
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {selectedConversation.participants.client_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{selectedConversation.participants.client_name}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-500 text-xs mb-1">{t.freelancer}</p>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedConversation.participants.freelancer_avatar} />
                            <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                              {selectedConversation.participants.freelancer_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{selectedConversation.participants.freelancer_name}</span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedConversation.project_title && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-500">{t.project}</p>
                        <p className="text-sm text-blue-600">{selectedConversation.project_title}</p>
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <p className="text-sm text-gray-500">{t.loadingMessages}</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500">{t.noMessages}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isClient = message.sender_id === selectedConversation.participants.client_id;
                          return (
                            <div
                              key={message.id}
                              className={`flex gap-3 ${!isClient ? 'flex-row-reverse' : ''}`}
                            >
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={message.sender_avatar} />
                                <AvatarFallback className={isClient ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}>
                                  {message.sender_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className={`flex-1 max-w-[70%] ${!isClient ? 'flex flex-col items-end' : ''}`}>
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="text-sm font-medium">{message.sender_name}</span>
                                  <span className="text-xs text-gray-400">
                                    {formatDate(message.created_at)}
                                  </span>
                                </div>
                                <div className={`p-3 rounded-lg ${
                                  isClient 
                                    ? 'bg-blue-100 text-blue-900' 
                                    : 'bg-green-100 text-green-900'
                                }`}>
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Conversation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t.delete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}