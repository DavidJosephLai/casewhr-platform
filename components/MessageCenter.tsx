import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Search,
  User,
  Clock,
  X,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { NewConversationDialog } from "./NewConversationDialog";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
  read: boolean;
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
  created_at: string;
  updated_at: string;
}

interface MessageCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialConversationId?: string;
}

export function MessageCenter({ 
  open, 
  onOpenChange,
  initialConversationId 
}: MessageCenterProps) {
  const { language } = useLanguage();
  const { user, profile, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedInitialConversationRef = useRef<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const t = language === 'en' ? {
    title: 'Messages',
    search: 'Search conversations...',
    noConversations: 'No conversations yet',
    noMessages: 'No messages yet',
    startConversation: 'Start a conversation from a project',
    newConversation: 'New Conversation',
    typeMessage: 'Type a message...',
    send: 'Send',
    you: 'You',
    project: 'Project',
    loading: 'Loading...',
    sending: 'Sending...',
    messageSent: 'Message sent successfully',
    messageFailed: 'Failed to send message',
    loadFailed: 'Failed to load messages',
  } : {
    title: '訊息',
    search: '搜尋對話...',
    noConversations: '尚無對話',
    noMessages: '尚無訊息',
    startConversation: '從項目開始對話',
    newConversation: '新增對話',
    typeMessage: '輸入訊息...',
    send: '發送',
    you: '您',
    project: '項目',
    loading: '載入中...',
    sending: '發送中...',
    messageSent: '訊息發送成功',
    messageFailed: '發送訊息失敗',
    loadFailed: '載入訊息失敗',
  };

  // Load conversations
  useEffect(() => {
    if (open && user) {
      loadConversations();
    }
  }, [open, user]);

  // Select initial conversation
  useEffect(() => {
    // Skip if we've already processed this conversation ID
    if (!initialConversationId || processedInitialConversationRef.current === initialConversationId) {
      return;
    }
    
    console.log('🔹 [MessageCenter] Checking initial conversation:', {
      initialConversationId,
      conversationsCount: conversations.length,
      processedBefore: processedInitialConversationRef.current,
    });
    
    if (conversations.length > 0) {
      const conv = conversations.find(c => c.id === initialConversationId);
      if (conv) {
        console.log('✅ [MessageCenter] Found and selecting initial conversation:', conv.id);
        setSelectedConversation(conv);
        processedInitialConversationRef.current = initialConversationId;
      } else {
        console.log('❌ [MessageCenter] Initial conversation not found in list');
      }
    }
  }, [initialConversationId, conversations]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    // 🧪 Check for dev mode - skip API calls in dev mode
    const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
    if (devModeActive) {
      console.log('🧪 [MessageCenter] Dev mode active - skipping conversations API call');
      setConversations([]);
      setLoading(false);
      return;
    }
    
    if (!accessToken) {
      console.error('❌ [MessageCenter] No access token available');
      return;
    }
    
    setLoading(true);
    console.log('🔹 [MessageCenter] Loading conversations...');
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/conversations`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      console.log('🔹 [MessageCenter] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [MessageCenter] Failed to load conversations:', response.status, errorText);
        throw new Error('Failed to load conversations');
      }

      const data = await response.json();
      console.log('✅ [MessageCenter] Conversations loaded:', {
        count: data.conversations?.length || 0,
        conversations: data.conversations,
      });
      
      setConversations(data.conversations || []);
    } catch (error: any) {
      console.error('❌ [MessageCenter] Load conversations error:', error);
      toast.error(t.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    // 🧪 Check for dev mode - skip API calls in dev mode
    const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
    if (devModeActive) {
      console.log('🧪 [MessageCenter] Dev mode active - skipping messages API call');
      setMessages([]);
      setMessagesLoading(false);
      return;
    }
    
    if (!accessToken) {
      console.error('❌ [MessageCenter] No access token for loading messages');
      return;
    }
    
    console.log('🔹 [MessageCenter] Loading messages for conversation:', conversationId);
    setMessagesLoading(true);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/conversations/${conversationId}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      console.log('🔹 [MessageCenter] Messages response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [MessageCenter] Failed to load messages:', response.status, errorText);
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      console.log('✅ [MessageCenter] Messages loaded:', {
        count: data.messages?.length || 0,
        messages: data.messages,
      });
      
      setMessages(data.messages || []);
      
      // Update conversation unread count to 0
      const updatedConversations = conversations.map(conv => {
        if (conv.id === conversationId) {
          const isClient = user?.id === conv.participants.client_id;
          return {
            ...conv,
            unread_count_client: isClient ? 0 : conv.unread_count_client,
            unread_count_freelancer: isClient ? conv.unread_count_freelancer : 0,
          };
        }
        return conv;
      });
      setConversations(updatedConversations);
    } catch (error: any) {
      console.error('❌ [MessageCenter] Load messages error:', error);
      toast.error(t.loadFailed);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || !accessToken) return;

    setSending(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/conversations/${selectedConversation.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            content: newMessage.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add new message to list
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      
      // Update conversation's last message
      const updatedConversations = conversations.map(conv => {
        if (conv.id === selectedConversation.id) {
          return {
            ...conv,
            last_message: newMessage.trim(),
            last_message_at: data.message.created_at,
            updated_at: data.message.created_at,
          };
        }
        return conv;
      });
      setConversations(updatedConversations);
      
      toast.success(t.messageSent);
    } catch (error: any) {
      console.error('Send message error:', error);
      toast.error(t.messageFailed);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const isClient = user?.id === conversation.participants.client_id;
    return isClient
      ? {
          name: conversation.participants.freelancer_name,
          avatar: conversation.participants.freelancer_avatar,
        }
      : {
          name: conversation.participants.client_name,
          avatar: conversation.participants.client_avatar,
        };
  };

  const getUnreadCount = (conversation: Conversation) => {
    const isClient = user?.id === conversation.participants.client_id;
    return isClient 
      ? conversation.unread_count_client 
      : conversation.unread_count_freelancer;
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const other = getOtherParticipant(conv);
    const searchLower = searchQuery.toLowerCase();
    return (
      other.name?.toLowerCase().includes(searchLower) ||
      conv.last_message?.toLowerCase().includes(searchLower)
    );
  });

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return language === 'en' ? 'Just now' : '剛剛';
    if (diffInMins < 60) return `${diffInMins}${language === 'en' ? 'm' : '分鐘'}`;
    if (diffInHours < 24) return `${diffInHours}${language === 'en' ? 'h' : '小時'}`;
    if (diffInDays < 7) return `${diffInDays}${language === 'en' ? 'd' : '天'}`;
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW');
  };

  const handleConversationCreated = async (conversationId: string) => {
    // Reload conversations to show the new one
    await loadConversations();
    
    // Find and select the new conversation
    const newConv = conversations.find(c => c.id === conversationId);
    if (newConv) {
      setSelectedConversation(newConv);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[85vh] p-0">
          <DialogDescription className="sr-only">
            {language === 'en' ? 'View and manage your conversations' : '查看和管理您的對話'}
          </DialogDescription>
          <div className="flex h-[80vh]">
            {/* Left sidebar - Conversations list */}
            <div className="w-1/3 border-r bg-gray-50 flex flex-col">
              <DialogHeader className="p-4 border-b bg-white">
                <DialogTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  {t.title}
                </DialogTitle>
              </DialogHeader>

              {/* Search */}
              <div className="p-3 bg-white border-b space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* 新增對話按鈕 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewConversationOpen(true)}
                  className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.newConversation}
                </Button>
              </div>

              {/* Conversations */}
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-500 px-4 text-center">
                    <MessageCircle className="h-12 w-12 mb-2 text-gray-300" />
                    <p className="text-sm">{t.noConversations}</p>
                    <p className="text-xs mt-1">{t.startConversation}</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredConversations.map((conv) => {
                      const other = getOtherParticipant(conv);
                      const unreadCount = getUnreadCount(conv);
                      const isSelected = selectedConversation?.id === conv.id;

                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={`w-full p-3 rounded-lg text-left transition-colors mb-1 ${
                            isSelected
                              ? 'bg-blue-50 border-blue-200 border'
                              : 'hover:bg-white border border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={other.avatar} />
                              <AvatarFallback className="bg-blue-100">
                                <User className="h-5 w-5 text-blue-600" />
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-medium text-sm truncate">
                                  {other.name}
                                </p>
                                {conv.last_message_at && (
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    {formatMessageTime(conv.last_message_at)}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <p className="text-xs text-gray-600 truncate flex-1">
                                  {typeof conv.last_message === 'string' 
                                    ? (conv.last_message || t.noMessages)
                                    : (conv.last_message?.content || t.noMessages)
                                  }
                                </p>
                                {unreadCount > 0 && (
                                  <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center">
                                    {unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Right side - Messages */}
            <div className="flex-1 flex flex-col bg-white">
              {selectedConversation ? (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getOtherParticipant(selectedConversation).avatar} />
                        <AvatarFallback className="bg-blue-100">
                          <User className="h-5 w-5 text-blue-600" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {getOtherParticipant(selectedConversation).name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                          <MessageCircle className="h-12 w-12 mb-2 text-gray-300" />
                          <p className="text-sm">{t.noMessages}</p>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isOwn = message.sender_id === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarImage src={message.sender_avatar} />
                                  <AvatarFallback className={isOwn ? 'bg-blue-100' : 'bg-gray-100'}>
                                    <User className={`h-4 w-4 ${isOwn ? 'text-blue-600' : 'text-gray-600'}`} />
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div>
                                  <div
                                    className={`rounded-2xl px-4 py-2 ${
                                      isOwn
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                      {message.content}
                                    </p>
                                  </div>
                                  <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                      {formatMessageTime(message.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message input */}
                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex gap-2">
                      <Input
                        placeholder={t.typeMessage}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">
                      {t.noConversations}
                    </p>
                    <p className="text-sm">{t.startConversation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        onConversationCreated={handleConversationCreated}
      />
    </>
  );
}