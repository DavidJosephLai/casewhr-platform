import { useState } from 'react';
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';

interface StartConversationButtonProps {
  recipientId: string;
  recipientType: 'client' | 'freelancer';
  projectId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  onConversationCreated?: (conversationId: string) => void;
}

export function StartConversationButton({
  recipientId,
  recipientType,
  projectId: relatedProjectId,
  variant = 'outline',
  className = '',
  onConversationCreated,
}: StartConversationButtonProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth(); // 添加 accessToken
  const [loading, setLoading] = useState(false);

  const t = language === 'en' ? {
    contactClient: 'Contact Client',
    contactFreelancer: 'Contact Freelancer',
    sendMessage: 'Send Message',
    loading: 'Loading...',
    loginRequired: 'Please login to send messages',
    conversationCreated: 'Conversation started!',
    error: 'Failed to start conversation',
  } : {
    contactClient: '聯繫客戶',
    contactFreelancer: '聯繫接案者',
    sendMessage: '發送訊息',
    loading: '載入中...',
    loginRequired: '請登入以發送訊息',
    conversationCreated: '對話已開始！',
    error: '開始對話失敗',
  };

  const handleStartConversation = async () => {
    if (!user) {
      toast.error(t.loginRequired);
      window.dispatchEvent(new CustomEvent('openAuthDialog', { detail: 'login' }));
      return;
    }

    if (!accessToken) {
      toast.error(t.loginRequired);
      return;
    }

    // Don't allow messaging yourself
    if (user.id === recipientId) {
      toast.error(
        language === 'en'
          ? 'You cannot message yourself'
          : '您不能給自己發送訊息'
      );
      return;
    }

    setLoading(true);
    
    // Validate recipientId
    if (!recipientId) {
      console.error('❌ [StartConversation] recipientId is missing!');
      toast.error(language === 'en' ? 'Recipient ID is missing' : '收件人ID缺失');
      setLoading(false);
      return;
    }
    
    // Validate user.id
    if (!user.id) {
      console.error('❌ [StartConversation] user.id is missing!');
      toast.error(language === 'en' ? 'User ID is missing' : '用戶ID缺失');
      setLoading(false);
      return;
    }
    
    // Determine clientId and freelancerId based on recipientType
    const clientId = recipientType === 'client' ? recipientId : user.id;
    const freelancerId = recipientType === 'freelancer' ? recipientId : user.id;
    
    console.log('🔹 [StartConversation] Starting conversation:', {
      recipientId,
      recipientType,
      clientId,
      freelancerId,
      projectId: relatedProjectId,
      userId: user.id,
      validation: {
        hasRecipientId: !!recipientId,
        hasUserId: !!user.id,
        hasClientId: !!clientId,
        hasFreelancerId: !!freelancerId,
      }
    });

    try {
      const requestBody = {
        clientId,
        freelancerId,
        projectId: relatedProjectId,
      };
      
      console.log('🔹 [StartConversation] Request body:', JSON.stringify(requestBody));
      
      // 🔧 開發模式：處理 dev-user- token
      let token = accessToken;
      if (accessToken?.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }
      
      const isDevMode = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? {
            'Content-Type': 'application/json',
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`,
          }
        : {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          };
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/conversations`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        }
      );

      console.log('🔹 [StartConversation] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [StartConversation] Error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData.error || 'Failed to create conversation');
      }

      const data = await response.json();
      console.log('✅ [StartConversation] Conversation created:', data);
      console.log('🔍 [StartConversation] Conversation participants:', {
        client_id: data.conversation?.participants?.client_id,
        client_name: data.conversation?.participants?.client_name,
        client_avatar: data.conversation?.participants?.client_avatar,
        freelancer_id: data.conversation?.participants?.freelancer_id,
        freelancer_name: data.conversation?.participants?.freelancer_name,
        freelancer_avatar: data.conversation?.participants?.freelancer_avatar,
      });
      
      toast.success(t.conversationCreated);
      
      // Open message center with this conversation
      if (onConversationCreated) {
        onConversationCreated(data.conversation.id);
      }
      
      // Dispatch event to open message center
      console.log('🔹 [StartConversation] Dispatching openMessageCenter event with conversationId:', data.conversation.id);
      window.dispatchEvent(new CustomEvent('openMessageCenter', {
        detail: { conversationId: data.conversation.id }
      }));
      
    } catch (error: any) {
      console.error('❌ [StartConversation] Error:', error);
      
      // 顯示更詳細的錯誤信息
      const errorMessage = error.message || t.error;
      toast.error(errorMessage);
      
      // 如果是 profile 不存在的錯誤，提供額外提示
      if (errorMessage.includes('找不到') || errorMessage.includes('not found')) {
        setTimeout(() => {
          toast.info(
            language === 'en'
              ? 'The user may not have completed their profile setup.'
              : '該用戶可能尚未完成個人資料設定。'
          );
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const buttonText = recipientType === 'client' 
    ? t.contactClient 
    : t.contactFreelancer;

  return (
    <Button
      variant={variant}
      onClick={handleStartConversation}
      disabled={loading}
      className={`flex items-center gap-2 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {t.loading}
        </>
      ) : (
        <>
          <MessageCircle className="h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
}