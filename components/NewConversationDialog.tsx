import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { 
  Search, 
  User, 
  Loader2,
  Briefcase,
  MessageCircle,
  X
} from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface UserOption {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  type: 'client' | 'freelancer';
  projectTitle?: string;
  projectId?: string;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export function NewConversationDialog({ 
  open, 
  onOpenChange,
  onConversationCreated 
}: NewConversationDialogProps) {
  const { language } = useLanguage();
  const { user, profile, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  const t = language === 'en' ? {
    title: 'Start New Conversation',
    description: 'Select a user to start a conversation with',
    search: 'Search by name or email...',
    noUsers: 'No users found',
    loading: 'Loading users...',
    selectUser: 'Select a user to continue',
    cancel: 'Cancel',
    startConversation: 'Start Conversation',
    creating: 'Creating...',
    success: 'Conversation started!',
    error: 'Failed to start conversation',
    client: 'Client',
    freelancer: 'Freelancer',
    project: 'Project',
    cannotMessageSelf: 'You cannot message yourself',
  } : {
    title: '開始新對話',
    description: '選擇要聊天的用戶',
    search: '搜尋姓名或電子郵件...',
    noUsers: '找不到用戶',
    loading: '載入用戶中...',
    selectUser: '選擇用戶以繼續',
    cancel: '取消',
    startConversation: '開始對話',
    creating: '創建中...',
    success: '對話已開始！',
    error: '開始對話失敗',
    client: '案主',
    freelancer: '創作者',
    project: '項目',
    cannotMessageSelf: '您不能給自己發送訊息',
  };

  // Load available users when dialog opens
  useEffect(() => {
    if (open && user) {
      loadUsers();
    } else {
      // Reset state when dialog closes
      setSearchQuery('');
      setSelectedUser(null);
    }
  }, [open, user]);

  const loadUsers = async () => {
    if (!accessToken) {
      console.error('❌ [NewConversation] No access token');
      return;
    }
    
    console.log('🔵 [NewConversation] Loading available users...');
    setLoading(true);
    try {
      // 🔧 開發模式：處理 dev-user- token
      let token = accessToken;
      if (accessToken?.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }
      
      const isDevMode = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? {
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`,
          }
        : {
            'Authorization': `Bearer ${token}`,
          };
      
      // Load users from projects the current user is involved in
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/users/available-for-chat`,
        { headers }
      );

      console.log('🔵 [NewConversation] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [NewConversation] Users loaded:', {
          count: data.users?.length || 0,
          users: data.users,
        });
        setUsers(data.users || []);
      } else {
        const errorText = await response.text();
        console.error('❌ [NewConversation] Failed to load users:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ [NewConversation] Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async () => {
    if (!selectedUser || !user || !accessToken) return;

    // Don't allow messaging yourself
    if (selectedUser.id === user.id) {
      toast.error(t.cannotMessageSelf);
      return;
    }

    setCreating(true);
    try {
      // Determine who is client and who is freelancer
      const isCurrentUserFreelancer = profile?.is_freelancer ?? (profile?.account_type === 'freelancer');
      
      let clientId: string;
      let freelancerId: string;

      if (isCurrentUserFreelancer) {
        // Current user is freelancer
        freelancerId = user.id;
        clientId = selectedUser.id;
      } else {
        // Current user is client
        clientId = user.id;
        freelancerId = selectedUser.id;
      }

      console.log('🔵 [NewConversation] Creating conversation:', {
        clientId,
        freelancerId,
        projectId: selectedUser.projectId,
        currentUserId: user.id,
        selectedUserId: selectedUser.id,
        selectedUserType: selectedUser.type,
      });

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
          body: JSON.stringify({
            clientId,
            freelancerId,
            projectId: selectedUser.projectId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [NewConversation] Error:', errorData);
        throw new Error(errorData.error || 'Failed to create conversation');
      }

      const data = await response.json();
      console.log('✅ [NewConversation] Success:', data);
      
      toast.success(t.success);
      
      // Call callback with conversation ID
      if (onConversationCreated) {
        onConversationCreated(data.conversation.id);
      }
      
      // Close dialog
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('❌ [NewConversation] Error:', error);
      toast.error(t.error);
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.projectTitle?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users list */}
        <ScrollArea className="flex-1 -mx-6 px-6 min-h-[300px] max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-500">{t.loading}</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <User className="h-12 w-12 mb-2 text-gray-300" />
              <p className="text-sm">{t.noUsers}</p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {filteredUsers.map((userOption) => {
                const isSelected = selectedUser?.id === userOption.id;
                
                return (
                  <button
                    key={userOption.id}
                    onClick={() => setSelectedUser(userOption)}
                    className={`w-full p-4 rounded-lg text-left transition-all border-2 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={userOption.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                          {userOption.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">
                            {userOption.name}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              userOption.type === 'freelancer' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {userOption.type === 'freelancer' ? t.freelancer : t.client}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-500 truncate mb-1">
                          {userOption.email}
                        </p>
                        
                        {userOption.projectTitle && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                            <Briefcase className="h-3 w-3" />
                            <span className="truncate">{t.project}: {userOption.projectTitle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleStartConversation}
            disabled={!selectedUser || creating}
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.creating}
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 mr-2" />
                {t.startConversation}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}