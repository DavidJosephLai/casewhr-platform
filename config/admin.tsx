/**
 * 管理員權限配置文件
 * Admin Configuration File
 * 
 * 這是系統管理員權限配置的前端接口
 * This is the frontend interface for admin privileges
 * 
 * ⚠️ 重要變更：管理員數據現在統一存儲在後端 KV Store 中
 * IMPORTANT: Admin data is now centrally stored in backend KV Store
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
 * 這些用戶是硬編碼的系統管理員，即使 KV Store 出現問題也能訪問系統
 * 
 * Root admin emails (emergency backup)
 * These are hardcoded system admins who can access the system even if KV Store fails
 */
export const ROOT_ADMINS: AdminUser[] = [
  {
    email: 'davidlai117@yahoo.com.tw',
    level: AdminLevel.SUPER_ADMIN,
    name: 'David Lai (Root)',
    addedAt: '2024-12-07',
    permissions: ['*'], // 所有權限
  },
  {
    email: 'davidlai234@hotmail.com',
    level: AdminLevel.SUPER_ADMIN,
    name: 'David Lai (Root)',
    addedAt: '2024-12-13',
    permissions: ['*'], // 所有權限
  },
  {
    email: 'davidjosephlai@gmail.com',
    level: AdminLevel.SUPER_ADMIN,
    name: 'David Lai (Gmail)',
    addedAt: '2024-12-21',
    permissions: ['*'], // 所有權限
  },
  {
    email: 'davidjosephlai@casewhr.com',
    level: AdminLevel.SUPER_ADMIN,
    name: 'David Lai (CaseWHR)',
    addedAt: '2024-12-21',
    permissions: ['*'], // 所有權限
  },
  {
    email: 'admin@casewhr.com',
    level: AdminLevel.SUPER_ADMIN,
    name: 'CaseWHR Admin',
    addedAt: '2024-12-14',
    permissions: ['*'], // 所有權限
  },
];

// ==================== 向後兼容 / Backward Compatibility ====================

/**
 * @deprecated 此數組已廢棄，管理員數據現在統一存儲在後端 KV Store 中
 * 請使用 API 端點獲取管理員列表
 * 
 * This array is deprecated. Admin data is now stored in backend KV Store.
 * Please use API endpoints to get admin list.
 */
export const SUPER_ADMINS: AdminUser[] = ROOT_ADMINS;

// ==================== 前端權限檢查函數 / Frontend Permission Check Functions ====================

/**
 * 檢查用戶是否為根管理員（僅檢查硬編碼的根管理員）
 * 這是同步函數，可在前端接使用
 */
export function isRootAdmin(email: string | undefined): boolean {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // 🔍 調：輸出所有根管理員
  console.log('🔍 [Admin] Checking root admin:', normalizedEmail);
  console.log(' [Admin] ROOT_ADMINS list:', ROOT_ADMINS.map(a => a.email));
  
  const result = ROOT_ADMINS.some(admin => {
    const adminEmail = admin.email.toLowerCase();
    console.log(`🔍 [Admin] Comparing "${adminEmail}" with "${normalizedEmail}": ${adminEmail === normalizedEmail}`);
    return adminEmail === normalizedEmail;
  });
  
  console.log('🔍 [Admin] isRootAdmin result:', result);
  
  return result;
}

/**
 * 檢查用戶是否為超級管理員（僅前端快速檢查）
 * 注意：這只檢查根管理員，完整檢查需要調用後端 API
 * 
 * @deprecated 建議使用 checkAdminStatus API 獲取完整的管理員狀態
 */
export function isSuperAdmin(email: string | undefined): boolean {
  if (!email) return false;
  
  return isRootAdmin(email);
}

/**
 * 檢查用戶是否為任何級別的管理員（僅前端快速檢查）
 * 注意：這只檢查根管理員和 profile 標記，完整檢查需要調用後端 API
 * 
 * @deprecated 建議使用 checkAdminStatus API 獲取完整的管理員狀態
 */
export function isAnyAdmin(email: string | undefined, profile?: any): boolean {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // 檢查根管理員
  const isRoot = isRootAdmin(email);
  if (isRoot) {
    console.log('✅ [Admin] User is root admin:', normalizedEmail);
    return true;
  }
  
  // 檢查 profile 中的 isAdmin 標記
  if (profile?.isAdmin === true) {
    console.log('✅ [Admin] User has isAdmin flag in profile:', normalizedEmail);
    return true;
  }
  
  // 檢查管理員域名後綴（向後兼容）
  if (email.endsWith('@admin.caseswhere.com')) {
    console.log('✅ [Admin] User has admin domain:', normalizedEmail);
    return true;
  }
  
  console.log('❌ [Admin] User is not admin:', normalizedEmail);
  return false;
}

/**
 * 獲取用戶的管理員級別（僅前端快速檢查）
 * 注意：這只檢查根管理員和 profile，完整檢查需要調用後端 API
 * 
 * @deprecated 建議使用 checkAdminStatus API 獲取完整的管理員狀態
 */
export function getAdminLevel(email: string | undefined, profile?: any): AdminLevel | null {
  if (!email) return null;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // 檢查 ROOT_ADMINS 中的管理員並返回其級別
  const rootAdmin = ROOT_ADMINS.find(admin => admin.email.toLowerCase() === normalizedEmail);
  if (rootAdmin) {
    return rootAdmin.level;
  }
  
  // 檢查 profile 中的 adminLevel
  if (profile?.adminLevel) {
    const level = profile.adminLevel.toString().toUpperCase();
    if (level === 'SUPERADMIN' || level === 'SUPER_ADMIN') return AdminLevel.SUPER_ADMIN;
    if (level === 'ADMIN') return AdminLevel.ADMIN;
    if (level === 'MODERATOR') return AdminLevel.MODERATOR;
    
    return profile.adminLevel as AdminLevel;
  }
  
  if (email.endsWith('@admin.caseswhere.com')) return AdminLevel.ADMIN;
  
  return null;
}

/**
 * 檢查用戶是否有特定權限（僅前端快速檢查）
 * 注意：這只檢查根管理員，完整檢查需要調用後端 API
 */
export function hasPermission(email: string | undefined, permission: string): boolean {
  if (!email) return false;
  
  // 根管理員有所有權限
  if (isRootAdmin(email)) return true;
  
  return false;
}

// ==================== API 輔助函數 / API Helper Functions ====================

/**
 * 從後端 API 獲取完整的管理員狀態
 * 這是推薦的方式來檢查用戶的管理員權限
 */
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
    
    // 降級到本地檢查
    return {
      isAdmin: isRootAdmin(email),
      level: isRootAdmin(email) ? AdminLevel.SUPER_ADMIN : null,
      isRoot: isRootAdmin(email),
      admin: ROOT_ADMINS.find(a => a.email.toLowerCase() === email.toLowerCase()) || null,
    };
  }
}

/**
 * 從後端 API 獲取所有管理員列表
 */
export async function getAllAdmins(
  projectId: string,
  accessToken: string
): Promise<{ success: boolean; admins?: AdminUser[]; error?: string }> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/list-all`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, admins: data.admins };
  } catch (error) {
    console.error('[Admin] Error getting admin list:', error);
    return { success: false, error: 'Network error' };
  }
}

// ==================== 權限列表 / Permissions List ====================

export const PERMISSIONS = {
  // 用戶管理
  USER_VIEW: 'user.view',
  USER_EDIT: 'user.edit',
  USER_DELETE: 'user.delete',
  USER_BAN: 'user.ban',
  
  // 項目管理
  PROJECT_VIEW: 'project.view',
  PROJECT_EDIT: 'project.edit',
  PROJECT_DELETE: 'project.delete',
  PROJECT_FEATURE: 'project.feature',
  
  // 財務管理
  FINANCE_VIEW: 'finance.view',
  FINANCE_APPROVE: 'finance.approve',
  FINANCE_REJECT: 'finance.reject',
  
  // 訊息監控
  MESSAGE_VIEW: 'message.view',
  MESSAGE_DELETE: 'message.delete',
  
  // 系統設置
  SYSTEM_SETTINGS: 'system.settings',
  
  // 管理員管理
  ADMIN_MANAGE: 'admin.manage',
  
  // 郵件系統
  EMAIL_SEND: 'email.send',
  EMAIL_TEST: 'email.test',
  
  // 會員管理
  MEMBERSHIP_MANAGE: 'membership.manage',
} as const;

// ==================== 管理員驗證中間件配置 / Admin Verification Config ====================

/**
 * 後端驗證配置
 * 用於後端 API 路由的權限驗證
 */
export const BACKEND_ADMIN_CONFIG = {
  // KV Store 中存儲管理員表的鍵
  ADMIN_LIST_KEY: 'system:admin_users',
  
  // KV Store 中存儲管理員設置的鍵前綴
  ADMIN_PROFILE_PREFIX: 'admin:profile:',
  
  // Session 過期時間（小時）
  SESSION_EXPIRY_HOURS: 24,
};

/**
 * 前端配置
 */
export const FRONTEND_ADMIN_CONFIG = {
  // 管理員登錄頁面路徑
  LOGIN_PATH: '/admin/login',
  
  // 管理員後台路徑
  DASHBOARD_PATH: '/admin',
  
  // 未授權時跳轉路徑
  UNAUTHORIZED_REDIRECT: '/',
};

// ==================== 輔助函數 / Helper Functions ====================

/**
 * 獲取所有根管理員的郵箱列表
 */
export function getRootAdminEmails(): string[] {
  return ROOT_ADMINS.map(admin => admin.email);
}

/**
 * 驗證郵箱格式
 */
export function isValidAdminEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 格式化管理員信息用於顯示
 */
export function formatAdminInfo(admin: AdminUser): string {
  return `${admin.name} (${admin.email}) - ${admin.level}`;
}

/**
 * 檢查是否可以執行危險操作（需要超級管理員）
 */
export function canPerformDangerousOperation(email: string | undefined): boolean {
  return isRootAdmin(email);
}

// ==================== 導出配置 / Export Config ====================

export const AdminConfig = {
  ROOT_ADMINS,
  SUPER_ADMINS, // 向後兼容
  AdminLevel,
  PERMISSIONS,
  BACKEND_ADMIN_CONFIG,
  FRONTEND_ADMIN_CONFIG,
  
  // 函數
  isRootAdmin,
  isSuperAdmin,
  isAnyAdmin,
  getAdminLevel,
  hasPermission,
  getRootAdminEmails,
  isValidAdminEmail,
  formatAdminInfo,
  canPerformDangerousOperation,
  
  // API 函數
  checkAdminStatus,
  getAllAdmins,
} as const;

export default AdminConfig;