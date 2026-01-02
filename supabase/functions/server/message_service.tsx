/**
 * Message Service
 * Handles all messaging and conversation logic for the platform
 */

import * as kv from './kv_store.tsx';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

/**
 * Helper function to get user info from Supabase Auth
 */
async function getUserInfoFromAuth(userId: string): Promise<{ name: string; avatar?: string } | null> {
  try {
    // 🔧 開發模式：dev-user- 前綴的用戶 ID 不是真實的 UUID
    if (userId.startsWith('dev-user-')) {
      console.log('🔧 [getUserInfoFromAuth] Dev mode user detected, fetching from profile instead');
      
      // 嘗試從 profile 獲取用戶信息
      const profile = await kv.get(`profile_${userId}`) || await kv.get(`profile:${userId}`);
      
      if (profile) {
        return {
          name: profile.name || profile.email?.split('@')[0] || 'User',
          avatar: profile.avatar_url,
        };
      }
      
      // 如果 profile 不存在，返回默認值
      console.warn('⚠️ [getUserInfoFromAuth] Dev user profile not found:', userId);
      return {
        name: 'Dev User',
        avatar: undefined,
      };
    }
    
    // 正式環境：使用 Supabase Auth
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error || !data?.user) {
      console.error('❌ [getUserInfoFromAuth] Error fetching user:', error);
      return null;
    }
    
    const user = data.user;
    const name = user.user_metadata?.name || 
                 user.user_metadata?.full_name || 
                 user.email?.split('@')[0] || 
                 'User';
    const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    
    console.log('✅ [getUserInfoFromAuth] User info:', { userId, name, hasAvatar: !!avatar });
    return { name, avatar };
  } catch (error) {
    console.error('❌ [getUserInfoFromAuth] Exception:', error);
    return null;
  }
}

/**
 * Get or create a conversation between a client and freelancer
 */
export async function getOrCreateConversation(
  clientId: string,
  freelancerId: string,
  projectId: string
): Promise<any> {
  console.log('💬 [getOrCreateConversation] Called with:', {
    clientId,
    freelancerId,
    projectId,
  });

  // Check for existing conversation
  const clientConversations = (await kv.get(`user:${clientId}:conversations`)) || [];
  console.log('💬 [getOrCreateConversation] Client has conversations:', clientConversations.length);
  
  for (const convId of clientConversations) {
    const conv = await kv.get(`conversation:${convId}`);
    if (
      conv?.participants?.client_id === clientId &&
      conv?.participants?.freelancer_id === freelancerId &&
      conv?.project_id === projectId
    ) {
      console.log('💬 [getOrCreateConversation] Found existing conversation:', convId);
      return conv;
    }
  }

  console.log('💬 [getOrCreateConversation] Creating new conversation...');

  // Create new conversation
  const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Get user info from profiles
  let clientProfile = await kv.get(`profile_${clientId}`);
  if (!clientProfile) {
    clientProfile = await kv.get(`profile:${clientId}`);
  }
  
  let freelancerProfile = await kv.get(`profile_${freelancerId}`);
  if (!freelancerProfile) {
    freelancerProfile = await kv.get(`profile:${freelancerId}`);
  }

  console.log('💬 [getOrCreateConversation] Profiles found:', {
    hasClientProfile: !!clientProfile,
    hasFreelancerProfile: !!freelancerProfile,
    clientName: clientProfile?.name,
    freelancerName: freelancerProfile?.name,
  });

  // Fallback to Auth if no profile exists
  let clientInfo = { 
    name: clientProfile?.name || 'Client', 
    avatar: clientProfile?.avatar 
  };
  
  let freelancerInfo = { 
    name: freelancerProfile?.name || 'Freelancer', 
    avatar: freelancerProfile?.avatar 
  };

  // If profile doesn't have name, try Auth
  if (!clientProfile?.name) {
    console.log('⚠️ [getOrCreateConversation] Client profile missing name, checking Auth...');
    const authInfo = await getUserInfoFromAuth(clientId);
    if (authInfo) {
      clientInfo = authInfo;
      console.log('✅ [getOrCreateConversation] Got client name from Auth:', clientInfo.name);
    }
  }

  if (!freelancerProfile?.name) {
    console.log('⚠️ [getOrCreateConversation] Freelancer profile missing name, checking Auth...');
    const authInfo = await getUserInfoFromAuth(freelancerId);
    if (authInfo) {
      freelancerInfo = authInfo;
      console.log('✅ [getOrCreateConversation] Got freelancer name from Auth:', freelancerInfo.name);
    }
  }

  // Get project info
  const project = await kv.get(`project:${projectId}`);

  const conversation = {
    id: conversationId,
    project_id: projectId,
    project_title: project?.title || 'Project',
    participants: {
      client_id: clientId,
      client_name: clientInfo.name,
      client_avatar: clientInfo.avatar,
      freelancer_id: freelancerId,
      freelancer_name: freelancerInfo.name,
      freelancer_avatar: freelancerInfo.avatar,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    unread_count_client: 0,
    unread_count_freelancer: 0,
    last_message: null,
  };

  console.log('💬 [getOrCreateConversation] Created conversation:', {
    id: conversationId,
    clientName: conversation.participants.client_name,
    freelancerName: conversation.participants.freelancer_name,
  });

  // Save conversation
  await kv.set(`conversation:${conversationId}`, conversation);
  await kv.set(`conversation:${conversationId}:messages`, []);

  // Add to user's conversation lists
  const updatedClientConvs = [...clientConversations, conversationId];
  await kv.set(`user:${clientId}:conversations`, updatedClientConvs);

  const freelancerConversations = (await kv.get(`user:${freelancerId}:conversations`)) || [];
  const updatedFreelancerConvs = [...freelancerConversations, conversationId];
  await kv.set(`user:${freelancerId}:conversations`, updatedFreelancerConvs);

  return conversation;
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  attachments: string[] = []
): Promise<any> {
  const conversation = await kv.get(`conversation:${conversationId}`);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const message = {
    id: messageId,
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    attachments,
    created_at: new Date().toISOString(),
    read: false,
  };

  // Add message to conversation
  const messageIds = (await kv.get(`conversation:${conversationId}:messages`)) || [];
  messageIds.push(messageId);
  await kv.set(`conversation:${conversationId}:messages`, messageIds);
  await kv.set(`message:${messageId}`, message);

  // Update conversation metadata
  conversation.updated_at = new Date().toISOString();
  conversation.last_message = content.length > 100 ? content.substring(0, 100) + '...' : content;
  conversation.last_message_at = message.created_at;

  // Update unread count for recipient
  const isClient = senderId === conversation.participants.client_id;
  if (isClient) {
    conversation.unread_count_freelancer = (conversation.unread_count_freelancer || 0) + 1;
  } else {
    conversation.unread_count_client = (conversation.unread_count_client || 0) + 1;
  }

  await kv.set(`conversation:${conversationId}`, conversation);

  return message;
}

/**
 * Get messages in a conversation
 */
export async function getMessages(conversationId: string): Promise<any[]> {
  const conversation = await kv.get(`conversation:${conversationId}`);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const messageIds = (await kv.get(`conversation:${conversationId}:messages`)) || [];
  const messages = [];

  for (const msgId of messageIds) {
    const msg = await kv.get(`message:${msgId}`);
    if (msg) {
      // Add sender info from conversation participants
      const isClient = msg.sender_id === conversation.participants.client_id;
      const senderInfo = isClient 
        ? {
            sender_name: conversation.participants.client_name,
            sender_avatar: conversation.participants.client_avatar,
          }
        : {
            sender_name: conversation.participants.freelancer_name,
            sender_avatar: conversation.participants.freelancer_avatar,
          };
      
      messages.push({
        ...msg,
        ...senderInfo,
      });
    }
  }
  
  return messages.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const conversation = await kv.get(`conversation:${conversationId}`);
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  
  const messageIds = (await kv.get(`conversation:${conversationId}:messages`)) || [];
  
  // Mark all messages from other user as read
  for (const msgId of messageIds) {
    const msg = await kv.get(`message:${msgId}`);
    if (msg && msg.sender_id !== userId && !msg.read) {
      msg.read = true;
      await kv.set(`message:${msgId}`, msg);
    }
  }
  
  // Reset unread count
  const isClient = userId === conversation.participants.client_id;
  if (isClient) {
    conversation.unread_count_client = 0;
  } else {
    conversation.unread_count_freelancer = 0;
  }
  
  await kv.set(`conversation:${conversationId}`, conversation);
}

/**
 * Get user's conversations
 */
export async function getUserConversations(
  userId: string,
  isAdmin: boolean = false
): Promise<any[]> {
  try {
    if (isAdmin) {
      // Admin can see all conversations
      // Since getByPrefix only returns values without keys, we need a different approach
      // We'll get all user conversation lists and aggregate them
      console.log('🔍 [getUserConversations] Admin loading all conversations...');
      
      // Get all conversation keys from all users
      const allUserKeys = await kv.getByPrefix('user:');
      console.log('🔍 [getUserConversations] Found user keys:', allUserKeys.length);
      
      // Collect all conversation IDs
      const conversationIds = new Set<string>();
      for (const userConvList of allUserKeys) {
        if (Array.isArray(userConvList)) {
          userConvList.forEach((convId: string) => conversationIds.add(convId));
        }
      }
      
      console.log('🔍 [getUserConversations] Unique conversation IDs:', conversationIds.size);
      
      // Load all conversations
      const conversations: any[] = [];
      for (const convId of conversationIds) {
        try {
          const conv = await kv.get(`conversation:${convId}`);
          if (conv) {
            // Add message count
            const messageIds = (await kv.get(`conversation:${convId}:messages`)) || [];
            conv.message_count = Array.isArray(messageIds) ? messageIds.length : 0;
            conversations.push(conv);
          }
        } catch (error) {
          console.error('❌ [getUserConversations] Error loading conversation:', convId, error);
        }
      }
      
      const sorted = conversations.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      
      console.log('✅ [getUserConversations] Returning admin conversations:', sorted.length);
      return sorted;
    }
    
    console.log('🔍 [getUserConversations] User loading conversations:', userId);
    const conversationIds = (await kv.get(`user:${userId}:conversations`)) || [];
    console.log('🔍 [getUserConversations] Found conversation IDs:', conversationIds.length);
    
    const conversations: any[] = [];
    
    for (const convId of conversationIds) {
      try {
        const conv = await kv.get(`conversation:${convId}`);
        if (conv) {
          // Add message count
          const messageIds = (await kv.get(`conversation:${convId}:messages`)) || [];
          conv.message_count = Array.isArray(messageIds) ? messageIds.length : 0;
          conversations.push(conv);
        } else {
          console.warn('⚠️ [getUserConversations] Conversation not found:', convId);
        }
      } catch (error) {
        console.error('❌ [getUserConversations] Error loading conversation:', convId, error);
        // Continue with other conversations
      }
    }
    
    const sorted = conversations.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    
    console.log('✅ [getUserConversations] Returning conversations:', sorted.length);
    return sorted;
  } catch (error) {
    console.error('❌ [getUserConversations] Fatal error:', error);
    throw error;
  }
}

/**
 * Get total unread message count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    console.log('📬 [getUnreadCount] Starting for user:', userId);
    
    const conversationIds = (await kv.get(`user:${userId}:conversations`)) || [];
    console.log('📬 [getUnreadCount] User has conversations:', conversationIds.length);
    
    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      console.log('📬 [getUnreadCount] No conversations found');
      return 0;
    }
    
    let totalUnread = 0;

    for (const convId of conversationIds) {
      try {
        const conv = await kv.get(`conversation:${convId}`);
        if (conv) {
          const isClient = userId === conv.participants?.client_id;
          const unreadCount = isClient ? (conv.unread_count_client || 0) : (conv.unread_count_freelancer || 0);
          totalUnread += unreadCount;
          
          if (unreadCount > 0) {
            console.log('📬 [getUnreadCount] Conversation', convId, 'has', unreadCount, 'unread messages');
          }
        } else {
          console.warn('⚠️ [getUnreadCount] Conversation not found:', convId);
        }
      } catch (convError: any) {
        // Handle network/Cloudflare errors gracefully
        if (convError?.message?.includes('<html>') || convError?.message?.includes('Internal Server Error')) {
          console.warn('⚠️ [getUnreadCount] Network error loading conversation:', convId, '- skipping');
        } else {
          console.error('❌ [getUnreadCount] Error loading conversation:', convId, convError);
        }
        // Continue with other conversations
      }
    }

    console.log('✅ [getUnreadCount] Total unread:', totalUnread);
    return totalUnread;
  } catch (error: any) {
    // Handle network/Cloudflare errors gracefully
    if (error?.message?.includes('<html>') || error?.message?.includes('Internal Server Error')) {
      console.warn('⚠️ [getUnreadCount] Network error, returning 0');
      return 0;
    }
    console.error('❌ [getUnreadCount] Fatal error:', error);
    return 0; // Return 0 instead of throwing error
  }
}

/**
 * Delete a conversation (admin only)
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  const conversation = await kv.get(`conversation:${conversationId}`);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Delete all messages
  const messageIds = (await kv.get(`conversation:${conversationId}:messages`)) || [];
  for (const msgId of messageIds) {
    await kv.del(`message:${msgId}`);
  }

  // Delete message list
  await kv.del(`conversation:${conversationId}:messages`);

  // Delete conversation
  await kv.del(`conversation:${conversationId}`);

  // Remove from user conversation lists
  const clientId = conversation.participants.client_id;
  const freelancerId = conversation.participants.freelancer_id;

  const clientConversations = (await kv.get(`user:${clientId}:conversations`)) || [];
  const updatedClientConvs = clientConversations.filter((id: string) => id !== conversationId);
  await kv.set(`user:${clientId}:conversations`, updatedClientConvs);

  const freelancerConversations = (await kv.get(`user:${freelancerId}:conversations`)) || [];
  const updatedFreelancerConvs = freelancerConversations.filter((id: string) => id !== conversationId);
  await kv.set(`user:${freelancerId}:conversations`, updatedFreelancerConvs);
}