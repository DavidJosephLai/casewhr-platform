import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

/**
 * Supabase Client Instance
 * 用於前端的 Supabase 客戶端
 */
function getSafeStorage(): Storage | undefined {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.getItem('__test__');
      return window.localStorage;
    }
  } catch {
    // localStorage blocked in sandboxed iframes
  }
  return undefined;
}

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  { auth: { storage: getSafeStorage() } }
);
