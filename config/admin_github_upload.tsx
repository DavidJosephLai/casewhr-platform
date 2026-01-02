/**
 * 管理員權限配置文件
 * Admin Configuration File
 * 
 * 這是系統管理員權限配置的前端接口
 * This is the frontend interface for admin privileges
 */

// ==================== 管理員級別 / Admin Levels ====================

export enum AdminLevel {
  SUPER_ADMIN = 'SUPER_ADMIN',  // 超級管理員 - 最高權限
  ADMIN = 'ADMIN',                // 普通管理員 - 完整管理權限
  MODERATOR = 'MODERATOR',        // 審核員 - 有限權限
}

export interface AdminUser {
  email: string;
  level: AdminLevel;
  name: string;
  addedAt: string;
  addedBy?: string;
  permissions?: string[];
}

// ==================== 根管理員列表 / Root Admins ====================

/**
 * 根管理員郵箱列表（緊急後備）
 * Root admin emails (emergency backup)
 */
export const ROOT_ADMINS: AdminUser[] = [
  {
    email: 'davidlai117@yahoo.com.tw',
    level: AdminLevel.SUPER_ADMIN,
    name: 'David Lai (Root)',
    addedAt: '2024-12-07',
    permissions: ['*'],
  },
  {
    email: 'davidlai234@hotmail.com',
    level: AdminLevel.SUPER_ADMIN,
    name: 'David Lai (Root)',
    addedAt: '2024-12-13',
    permissions: ['*'],
  },
  {
    email: 'davidjosephlai@gmail.com',
    level: AdminLevel.SUPER_ADMIN,
    name: 'David Lai (Gmail)',
    addedAt: '2024-12-21',
    permissions: ['*'],
  },
  {
    email: 'admin@casewhr.com',
    level: AdminLevel.SUPER_ADMIN,
    name: 'CaseWHR Admin',
    addedAt: '2024-12-14',
    permissions: ['*'],
  },
];

// ==================== 前端權限檢查函數 / Frontend Permission Check ====================

export function isRootAdmin(email: string | undefined): boolean {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  return ROOT_ADMINS.some(admin => 
    admin.email.toLowerCase() === normalizedEmail
  );
}

export function isSuperAdmin(email: string | undefined): boolean {
  return isRootAdmin(email);
}

export function isAnyAdmin(email: string | undefined, profile?: any): boolean {
  if (!email) return false;
  
  // 檢查根管理員
  if (isRootAdmin(email)) return true;
  
  // 檢查 profile 中的 isAdmin 標記
  if (profile?.isAdmin === true) return true;
  
  return false;
}

export function getAdminLevel(email: string | undefined, profile?: any): AdminLevel | null {
  if (!email) return null;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  const rootAdmin = ROOT_ADMINS.find(admin => admin.email.toLowerCase() === normalizedEmail);
  if (rootAdmin) {
    return rootAdmin.level;
  }
  
  if (profile?.adminLevel) {
    return profile.adminLevel as AdminLevel;
  }
  
  return null;
}

// ==================== API 輔助函數 / API Helper Functions ====================

export async function checkAdminStatus(
  email: string,
  projectId: string,
  publicAnonKey: string
): Promise<{
  isAdmin: boolean;
  level: AdminLevel | null;
  isRoot: boolean;
  admin: AdminUser | null;
}> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/check-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Admin] Error checking admin status:', error);
    
    return {
      isAdmin: isRootAdmin(email),
      level: isRootAdmin(email) ? AdminLevel.SUPER_ADMIN : null,
      isRoot: isRootAdmin(email),
      admin: ROOT_ADMINS.find(a => a.email.toLowerCase() === email.toLowerCase()) || null,
    };
  }
}

// ==================== 權限列表 / Permissions List ====================

export const PERMISSIONS = {
  USER_VIEW: 'user.view',
  USER_EDIT: 'user.edit',
  USER_DELETE: 'user.delete',
  PROJECT_VIEW: 'project.view',
  PROJECT_EDIT: 'project.edit',
  FINANCE_VIEW: 'finance.view',
  FINANCE_APPROVE: 'finance.approve',
  SYSTEM_SETTINGS: 'system.settings',
  ADMIN_MANAGE: 'admin.manage',
} as const;

// ==================== 導出配置 / Export Config ====================

export const AdminConfig = {
  ROOT_ADMINS,
  AdminLevel,
  PERMISSIONS,
  isRootAdmin,
  isSuperAdmin,
  isAnyAdmin,
  getAdminLevel,
  checkAdminStatus,
} as const;

export default AdminConfig;
