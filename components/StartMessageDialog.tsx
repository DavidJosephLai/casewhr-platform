import { useAuth } from "../contexts/AuthContext";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner";
import { useState } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Loader2, Send } from "lucide-react";

interface StartMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string | null;
  projectId?: string;
  onSuccess?: () => void;
}

export function StartMessageDialog({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  recipientAvatar,
  projectId: relatedProjectId,
  onSuccess,
}: StartMessageDialogProps) {
  const { accessToken, user } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const language = useLanguage();

  const t = {
    en: {
      title: "Send Message",
      description: "Start a conversation with",
      typeMessage: "Type your message...",
      send: "Send Message",
      sending: "Sending...",
      cancel: "Cancel",
      success: "Message sent successfully!",
      error: "Failed to send message",
    },
    zh: {
      title: "發送訊息",
      description: "開始與以下用戶對話",
      typeMessage: "輸入訊息...",
      send: "發送訊息",
      sending: "發送中...",
      cancel: "取消",
      success: "訊息已成功發送！",
      error: "發送訊息失敗",
    },
    'zh-TW': {
      title: "發送訊息",
      description: "開始與以下用戶對話",
      typeMessage: "輸入訊息...",
      send: "發送訊息",
      sending: "發送中...",
      cancel: "取消",
      success: "訊息已成功發送！",
      error: "發送訊息失敗",
    },
    'zh-CN': {
      title: "发送消息",
      description: "开始与以下用户对话",
      typeMessage: "输入消息...",
      send: "发送消息",
      sending: "发送中...",
      cancel: "取消",
      success: "消息已成功发送！",
      error: "发送消息失败",
    }
  };

  // 確保 translations 總是有值，回退到 en
  const translations = t[language as keyof typeof t] || t.en;

  const handleSend = async () => {
    if (!message.trim() || !accessToken) return;

    try {
      setSending(true);
      
      // 🔥 开发模式支持：构造正确的 token 和 headers
      let token = accessToken;
      if (accessToken.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }

      const isDevMode = accessToken.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? {
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          }
        : {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          };
      
      console.log('💬 [StartMessageDialog] Sending message:', {
        isDevMode,
        recipientId,
        hasToken: !!token,
      });
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/messages/send`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            receiver_id: recipientId,
            content: message.trim(),
            project_id: relatedProjectId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [StartMessageDialog] Error response:', errorData);
        throw new Error(errorData.error || 'Failed to send message');
      }

      console.log('✅ [StartMessageDialog] Message sent successfully');
      toast.success(translations.success);
      setMessage("");
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('❌ [StartMessageDialog] Error sending message:', error);
      toast.error(translations.error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{translations.title}</DialogTitle>
          <DialogDescription>
            {translations.description}:
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 py-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={recipientAvatar || undefined} />
            <AvatarFallback>
              {recipientName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p>{recipientName}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={translations.typeMessage}
            className="resize-none"
            rows={5}
            disabled={sending}
            autoFocus
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              {translations.cancel}
            </Button>
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sending}
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