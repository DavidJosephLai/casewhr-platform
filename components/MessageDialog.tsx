import { useAuth } from "../contexts/AuthContext";
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { RefreshCw, Loader2, Send } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface MessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  conversationId: string;
}

export function MessageDialog({
  open,
  onOpenChange,
  onClose,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  conversationId,
}: MessageDialogProps) {
  const { accessToken, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const language = useLanguage();

  const t = {
    en: {
      sendMessage: "Send Message",
      typeMessage: "Type your message...",
      send: "Send",
      sending: "Sending...",
      noMessages: "No messages yet. Start the conversation!",
      today: "Today",
      yesterday: "Yesterday",
      refresh: "Refresh",
    },
    zh: {
      sendMessage: "發送訊息",
      typeMessage: "輸入訊息...",
      send: "發送",
      sending: "發送中...",
      noMessages: "尚無訊息。開始對話吧！",
      today: "今天",
      yesterday: "昨天",
      refresh: "刷新",
    },
    'zh-TW': {
      sendMessage: "發送訊息",
      typeMessage: "輸入訊息...",
      send: "發送",
      sending: "發送中...",
      noMessages: "尚無訊息。開始對話吧！",
      today: "今天",
      yesterday: "昨天",
      refresh: "刷新",
    },
    'zh-CN': {
      sendMessage: "发送消息",
      typeMessage: "输入消息...",
      send: "发送",
      sending: "发送中...",
      noMessages: "尚无消息。开始对话吧！",
      today: "今天",
      yesterday: "昨天",
      refresh: "刷新",
    }
  };

  // 確保 translations 總是有值，回退到 en
  const translations = t[language as keyof typeof t] || t.en;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!accessToken || !conversationId) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/messages/${conversationId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
      
      // Scroll to bottom after loading
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Silently handle errors on auto-refresh to avoid spam
    } finally {
      setLoading(false);
    }
  }, [accessToken, conversationId, scrollToBottom]); // ✅ Removed 'loading' and 'language' from dependencies

  useEffect(() => {
    if (open) {
      loadMessages();
      
      // Auto-refresh every 5 seconds
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [open, loadMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !accessToken) return;

    try {
      setSending(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/messages/send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receiver_id: otherUserId,
            content: newMessage.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add the new message to the list
      setMessages([...messages, data.message]);
      setNewMessage("");
      
      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
      
      toast.success(language === 'en' ? 'Message sent' : '訊息已發送');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(language === 'en' ? 'Failed to send message' : '發送訊息失敗');
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

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return translations.today;
    } else if (diffInDays === 1) {
      return translations.yesterday;
    } else {
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Group messages by date
  const groupedMessages: { [key: string]: Message[] } = {};
  messages.forEach(msg => {
    const dateKey = formatMessageDate(msg.created_at);
    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = [];
    }
    groupedMessages[dateKey].push(msg);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherUserAvatar || undefined} />
              <AvatarFallback>
                {otherUserName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle>{otherUserName}</DialogTitle>
              <DialogDescription className="sr-only">
                {translations.sendMessage}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMessages}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                {translations.noMessages}
              </p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                {/* Date Divider */}
                <div className="flex items-center justify-center my-4">
                  <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                    {date}
                  </div>
                </div>

                {/* Messages */}
                {msgs.map((message) => {
                  const isSentByMe = message.sender_id === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2 mb-3 ${
                        isSentByMe ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {!isSentByMe && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={otherUserAvatar || undefined} />
                          <AvatarFallback>
                            {otherUserName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isSentByMe
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isSentByMe
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="px-6 py-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={translations.typeMessage}
              className="resize-none"
              rows={2}
              disabled={sending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="shrink-0"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {translations.sending}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {translations.send}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}