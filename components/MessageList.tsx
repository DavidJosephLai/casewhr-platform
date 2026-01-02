import { useState, useEffect, useCallback, useMemo, memo } from 'react'; // ✅ Added useMemo, memo
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { projectId } from '../utils/supabase/info';
import { MessageDialog } from "./MessageDialog";
import { toast } from "sonner";
import { Pagination } from "./Pagination";

interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export const MessageList = memo(function MessageList() {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 每頁顯示 10 個對話

  // ✅ Memoize content translations
  const content = useMemo(() => ({
    en: {
      title: "Messages",
      noMessages: "No messages yet",
      noMessagesDesc: "Start a conversation by messaging a freelancer or client",
      newMessage: "New message",
      loading: "Loading messages...",
      refresh: "Refresh",
    },
    'zh-TW': {
      title: "訊息",
      noMessages: "尚無訊息",
      noMessagesDesc: "開始與自由工作者或客戶對話",
      newMessage: "新訊息",
      loading: "載入中...",
      refresh: "重新整理",
    },
    'zh-CN': {
      title: "消息",
      noMessages: "尚无消息",
      noMessagesDesc: "开始与自由工作者或客户对话",
      newMessage: "新消息",
      loading: "载入中...",
      refresh: "刷新",
    }
  }), []);

  const t = content[language as keyof typeof content] || content.en;

  // ✅ Stabilize loadConversations with useCallback
  const loadConversations = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/messages/conversations`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        // Silently handle 401/403 - user not authenticated
        if (response.status === 401 || response.status === 403) {
          console.log('⚠️ [MessageList] User not authenticated, skipping');
          setConversations([]);
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [MessageList] Failed to load conversations:', response.status, errorData);
        
        // Don't throw error - just set empty conversations
        setConversations([]);
        return;
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('❌ [MessageList] Error loading conversations:', error);
      // Silently handle errors on auto-refresh to avoid spam
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]); // ✅ Removed 'loading' and 'language' from dependencies

  useEffect(() => {
    loadConversations();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  const handleOpenConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    loadConversations(); // Refresh to update unread counts
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return language === 'en' ? 'Yesterday' : '昨天';
    } else {
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t.title}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadConversations}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="mb-2">{t.noMessages}</h3>
              <p className="text-muted-foreground text-sm">{t.noMessagesDesc}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((conversation) => (
                <button
                  key={conversation.conversation_id}
                  onClick={() => handleOpenConversation(conversation)}
                  className="w-full p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conversation.other_user_avatar || undefined} />
                      <AvatarFallback>
                        {conversation.other_user_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="truncate pr-2">
                          {conversation.other_user_name}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate pr-2">
                          {conversation.last_message}
                        </p>
                        
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="ml-2 shrink-0">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Pagination */}
              {conversations.length > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(conversations.length / itemsPerPage)}
                  onPageChange={setCurrentPage}
                  language={language}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedConversation && (
        <MessageDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onClose={handleCloseDialog}
          otherUserId={selectedConversation.other_user_id}
          otherUserName={selectedConversation.other_user_name}
          otherUserAvatar={selectedConversation.other_user_avatar}
          conversationId={selectedConversation.conversation_id}
        />
      )}
    </>
  );
});