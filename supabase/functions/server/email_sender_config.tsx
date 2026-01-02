// 📧 Email Sender Configuration
// 統一管理不同類型郵件的發件人

export interface EmailSender {
  name: string;
  email: string;
}

export type EmailType = 
  | 'invoice'           // 發票
  | 'receipt'           // 收據
  | 'subscription'      // 訂閱通知
  | 'payment'           // 付款確認
  | 'system'            // 系統通知
  | 'verification'      // 驗證郵件
  | 'password_reset'    // 密碼重置
  | 'team_invitation'   // 團隊邀請
  | 'project'           // 項目通知
  | 'message'           // 訊息通知
  | 'default';          // 預設

/**
 * 根據郵件類型獲取對應的發件人
 * @param type 郵件類型
 * @param language 語言（'en' 或 'zh'）
 * @returns 發件人資訊
 */
export function getSenderByType(type: EmailType, language: 'en' | 'zh' = 'en'): EmailSender {
  // 中文發件人名稱映射
  const chineseNames = {
    admin: 'Case Where 接得準 管理團隊',
    support: 'Case Where 接得準 客服',
    system: 'Case Where 接得準 系統',
  };

  // 英文發件人名稱映射
  const englishNames = {
    admin: 'Case Where Admin',
    support: 'Case Where Support',
    system: 'Case Where',
  };

  const names = language === 'zh' ? chineseNames : englishNames;

  switch (type) {
    // 📄 發票、收據、付款相關 - 使用 admin@casewhr.com
    case 'invoice':
    case 'receipt':
    case 'payment':
    case 'subscription':
      return {
        name: names.admin,
        email: 'admin@casewhr.com',
      };

    // 👥 團隊和項目相關 - 使用 support@casewhr.com
    case 'team_invitation':
    case 'project':
    case 'message':
      return {
        name: names.support,
        email: 'support@casewhr.com',
      };

    // 🔐 系統通知、驗證、密碼重置 - 使用 support@casewhr.com
    case 'system':
    case 'verification':
    case 'password_reset':
      return {
        name: names.system,
        email: 'support@casewhr.com',
      };

    // 預設 - 使用 support@casewhr.com
    case 'default':
    default:
      return {
        name: names.support,
        email: 'support@casewhr.com',
      };
  }
}

/**
 * 獲取所有已驗證的發件人列表
 */
export function getAllVerifiedSenders(): EmailSender[] {
  return [
    {
      name: 'CaseWHR Admin',
      email: 'admin@casewhr.com',
    },
    {
      name: 'CaseWHR Support',
      email: 'support@casewhr.com',
    },
  ];
}

/**
 * 檢查發件人郵箱是否已驗證
 */
export function isVerifiedSender(email: string): boolean {
  const verifiedEmails = getAllVerifiedSenders().map(s => s.email);
  return verifiedEmails.includes(email.toLowerCase());
}

/**
 * 獲取預設發件人（用於後備）
 */
export function getDefaultSender(language: 'en' | 'zh' = 'en'): EmailSender {
  return getSenderByType('default', language);
}