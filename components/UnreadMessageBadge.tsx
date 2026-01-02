import { useState, useEffect, useCallback } from "react";
import { Badge } from "./ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function UnreadMessageBadge() {
  const { user, accessToken } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    // 🧪 Check for dev mode - skip API calls in dev mode
    const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
    if (devModeActive) {
      setUnreadCount(0);
      return;
    }
    
    if (!accessToken) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout (increased from 8)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/messages/unread-count`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || data.unread_count || 0);
      } else if (response.status === 403) {
        // Auth issue - user might need to re-login
        setUnreadCount(0);
      } else if (response.status === 404) {
        // Endpoint might not exist yet - just set to 0
        setUnreadCount(0);
      } else if (response.status === 401) {
        // Unauthorized - likely dev mode or invalid token
        setUnreadCount(0);
      }
    } catch (error: any) {
      // Silently fail for AbortError (timeout) - don't log to console
      if (error.name !== 'AbortError') {
        // Only log non-timeout errors if in development
        if (process.env.NODE_ENV === 'development') {
          console.debug('[UnreadBadge] Error:', error.message);
        }
      }
      // Don't change count on error to avoid UI flicker
    }
  }, [accessToken]); // ✅ Only depend on accessToken, not user

  useEffect(() => {
    // Only load if user is logged in and has an access token
    if (user && accessToken) {
      loadUnreadCount();
      // Poll for new messages every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      // Reset count if user logs out
      setUnreadCount(0);
    }
  }, [user, accessToken, loadUnreadCount]);

  if (unreadCount === 0) return null;

  return (
    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}