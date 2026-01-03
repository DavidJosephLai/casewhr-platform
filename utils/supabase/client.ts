import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

/**
 * Supabase Client Instance
 * 用於前端的 Supabase 客戶端
 */
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);
