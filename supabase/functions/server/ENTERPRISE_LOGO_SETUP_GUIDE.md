# 🌟 企業版客戶 LOGO 整合指南

## 📋 目錄

1. [系統架構](#系統架構)
2. [功能特性](#功能特性)
3. [API 文檔](#api-文檔)
4. [前端組件](#前端組件)
5. [使用流程](#使用流程)
6. [測試指南](#測試指南)
7. [故障排除](#故障排除)

---

## 🏗️ 系統架構

### 核心服務

```
┌─────────────────────────────────────────────┐
│         企業版 LOGO 系統架構                  │
├─────────────────────────────────────────────┤
│                                             │
│  📱 前端組件                                 │
│  ├─ EnterpriseLogoManager.tsx              │
│  │   └─ 用戶自行管理 LOGO                   │
│  └─ EnterpriseLogosAdmin.tsx               │
│      └─ 管理員查看所有企業 LOGO              │
│                                             │
│  🔧 後端服務                                 │
│  ├─ enterprise_logo_service.tsx            │
│  │   ├─ LOGO 存儲管理                       │
│  │   ├─ 權限驗證                            │
│  │   └─ 統計分析                            │
│  │                                          │
│  ├─ smart_email_sender.tsx                 │
│  │   ├─ 自動識別用戶訂閱等級                 │
│  │   ├─ 動態選擇郵件模板                    │
│  │   └─ 企業版/標準版切換                   │
│  │                                          │
│  └─ email_templates_enhanced.tsx           │
│      ├─ 標準版模板（文字 Header）            │
│      └─ 企業版模板（LOGO Header）            │
│                                             │
│  💾 數據存儲 (KV Store)                      │
│  ├─ user:enterprise-logo:{userId}          │
│  │   └─ LOGO URL                           │
│  └─ user:enterprise-info:{userId}          │
│      └─ 企業資訊（公司名稱、上傳時間等）      │
│                                             │
└─────────────────────────────────────────────┘
```

### 數據流程

```
用戶操作 → 前端組件 → API → 服務層 → KV Store
                                  ↓
                            訂閱等級驗證
                                  ↓
                            權限檢查
                                  ↓
                         LOGO 保存/刪除
```

---

## ✨ 功能特性

### 1. 🎯 自動化郵件系統

#### 標準版用戶（Free / Professional）
```typescript
// 自動使用文字 Header
{
  headerLogoUrl: undefined  // ❌ 無自定義 LOGO
  ↓
  郵件顯示：「Case Where 接得準」文字
}
```

#### 企業版用戶（Enterprise）
```typescript
// 自動使用企業 LOGO
{
  headerLogoUrl: "https://company.com/logo.png"  // ✅ 企業 LOGO
  ↓
  郵件顯示：企業 LOGO + "Powered by Case Where"
}
```

### 2. 📊 訂閱等級識別

系統會自動：
1. 從 KV Store 讀取用戶訂閱等級
2. 判斷是否為企業版用戶
3. 企業版用戶：查找自定義 LOGO
4. 其他用戶：使用標準文字 Header

### 3. 🔒 權限控制

| 操作 | 免費版 | 專業版 | 企業版 |
|------|--------|--------|--------|
| 設置 LOGO | ❌ | ❌ | ✅ |
| 查看 LOGO | ✅ | ✅ | ✅ |
| 刪除 LOGO | ❌ | ❌ | ✅ |
| 測試郵件 | ✅ | ✅ | ✅ |

---

## 🔌 API 文檔

### 1. 獲取企業 LOGO

**端點：** `GET /make-server-215f78a5/enterprise/logo`

**請求頭：**
```http
Authorization: Bearer {accessToken}
```

**響應：**
```json
{
  "success": true,
  "logoUrl": "https://company.com/logo.png",
  "info": {
    "userId": "user-id-here",
    "companyName": "Example Corp",
    "logoUrl": "https://company.com/logo.png",
    "uploadedAt": "2024-01-01T00:00:00Z",
    "lastUpdated": "2024-01-15T00:00:00Z"
  }
}
```

---

### 2. 設置企業 LOGO

**端點：** `POST /make-server-215f78a5/enterprise/logo`

**請求頭：**
```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**請求體：**
```json
{
  "logoUrl": "https://company.com/logo.png",
  "companyName": "Example Corporation"  // 可選
}
```

**成功響應：**
```json
{
  "success": true,
  "message": "Enterprise logo set successfully",
  "logoUrl": "https://company.com/logo.png",
  "companyName": "Example Corporation"
}
```

**失敗響應（非企業版）：**
```json
{
  "error": "Enterprise subscription required",
  "message": "Only Enterprise tier users can set custom email logos",
  "currentTier": "professional"
}
```

---

### 3. 刪除企業 LOGO

**端點：** `DELETE /make-server-215f78a5/enterprise/logo`

**請求頭：**
```http
Authorization: Bearer {accessToken}
```

**響應：**
```json
{
  "success": true,
  "message": "Enterprise logo deleted successfully"
}
```

---

### 4. 管理員：查看所有企業 LOGO

**端點：** `GET /make-server-215f78a5/admin/enterprise-logos`

**請求頭：**
```http
Authorization: Bearer {adminAccessToken}
```

**響應：**
```json
{
  "success": true,
  "logos": [
    {
      "userId": "user-1",
      "companyName": "Company A",
      "logoUrl": "https://company-a.com/logo.png",
      "uploadedAt": "2024-01-01T00:00:00Z",
      "lastUpdated": "2024-01-15T00:00:00Z"
    }
  ],
  "stats": {
    "totalEnterpriseClients": 10,
    "clientsWithLogo": 7,
    "clientsWithoutLogo": 3,
    "recentUploads": [...]
  }
}
```

---

### 5. 測試智能郵件發送

**端點：** `POST /make-server-215f78a5/test-smart-email`

**請求頭：**
```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**請求體：**
```json
{
  "type": "welcome",  // welcome | password-reset | monthly-report
  "language": "zh"    // zh | en
}
```

**響應：**
```json
{
  "success": true,
  "message": "Smart email sent successfully",
  "result": {
    "success": true,
    "messageId": "..."
  },
  "userInfo": {
    "tier": "enterprise",
    "hasCustomLogo": true
  }
}
```

---

## 🎨 前端組件

### 1. EnterpriseLogoManager（用戶端）

**路徑：** `/components/EnterpriseLogoManager.tsx`

**功能：**
- ✅ 查看當前 LOGO
- ✅ 上傳新 LOGO
- ✅ 預覽 LOGO 效果
- ✅ 發送測試郵件
- ✅ 刪除 LOGO

**使用方式：**
```tsx
import { EnterpriseLogoManager } from './components/EnterpriseLogoManager';

function SettingsPage() {
  return (
    <div>
      <h1>企業設置</h1>
      <EnterpriseLogoManager />
    </div>
  );
}
```

---

### 2. EnterpriseLogosAdmin（管理員端）

**路徑：** `/components/admin/EnterpriseLogosAdmin.tsx`

**功能：**
- ✅ 查看所有企業 LOGO
- ✅ 統計數據展示
- ✅ 最近更新列表
- ✅ 企業資訊管理

**使用方式：**
```tsx
import { EnterpriseLogosAdmin } from './components/admin/EnterpriseLogosAdmin';

function AdminDashboard() {
  return (
    <div>
      <h1>管理面板</h1>
      <EnterpriseLogosAdmin />
    </div>
  );
}
```

---

## 📝 使用流程

### 企業用戶設置 LOGO

```
1. 用戶升級到企業版訂閱
   └─ 訂閱系統：subscription.plan = 'enterprise'

2. 前往設置頁面
   └─ 訪問 EnterpriseLogoManager 組件

3. 上傳 LOGO
   ├─ 輸入 LOGO URL
   ├─ 輸入公司名稱（可選）
   └─ 點擊「保存設置」

4. 系統驗證
   ├─ 檢查訂閱等級
   ├─ 驗證 LOGO URL
   └─ 保存到 KV Store

5. LOGO 生效
   └─ 所有新發送的郵件都會使用企業 LOGO
```

### 自動郵件發送流程

```
觸發郵件發送事件
   ↓
smartEmailSender.sendWelcomeEmail({
  userId: "user-123",
  email: "user@company.com",
  name: "John",
  // subscriptionTier 可選，會自動查詢
})
   ↓
1. 查詢用戶訂閱等級
   └─ subscription:user-123 → plan: 'enterprise'
   
2. 獲取 LOGO 配置
   ├─ 企業版？
   │  └─ YES → 查詢 user:enterprise-logo:user-123
   └─ 標準版？
      └─ NO → headerLogoUrl = undefined
   
3. 生成郵件 HTML
   ├─ 調用 email_templates_enhanced.tsx
   ├─ 傳入 headerLogoUrl
   └─ 自動選擇模板樣式
   
4. 發送郵件
   └─ 使用 Brevo SMTP
```

---

## 🧪 測試指南

### 1. 設置測試企業用戶

```typescript
// 在 KV Store 中設置測試用戶為企業版
const userId = 'test-user-123';

await kv.set(`subscription:${userId}`, {
  plan: 'enterprise',
  status: 'active',
  billing_cycle: 'annual',
  start_date: new Date().toISOString(),
});

console.log('✅ Test user set to Enterprise tier');
```

---

### 2. 測試 LOGO 上傳

```bash
# 測試 LOGO URL（使用公開的測試圖片）
curl -X POST \
  https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/enterprise/logo \
  -H "Authorization: Bearer ${accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "logoUrl": "https://via.placeholder.com/320x120/6366f1/ffffff?text=Test+Logo",
    "companyName": "Test Corporation"
  }'
```

---

### 3. 測試智能郵件發送

```bash
# 發送測試郵件
curl -X POST \
  https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/test-smart-email \
  -H "Authorization: Bearer ${accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "language": "zh"
  }'
```

---

### 4. 驗證郵件效果

**檢查項目：**
- ✅ Header 顯示企業 LOGO（企業版）
- ✅ Header 顯示文字（標準版）
- ✅ Footer 顯示 CaseWHR LOGO
- ✅ "Powered by Case Where" 標籤
- ✅ 股東招募區塊（support@casewhr.com）
- ✅ 郵件整體樣式精緻

---

## 🔧 故障排除

### 問題 1：LOGO 未顯示

**可能原因：**
1. 用戶不是企業版
2. LOGO URL 無效
3. KV Store 未正確保存

**解決方法：**
```typescript
// 1. 檢查訂閱等級
const subscription = await kv.get(`subscription:${userId}`);
console.log('Subscription:', subscription);

// 2. 檢查 LOGO URL
const logoUrl = await kv.get(`user:enterprise-logo:${userId}`);
console.log('Logo URL:', logoUrl);

// 3. 測試 URL 可訪問性
fetch(logoUrl).then(res => console.log('Logo accessible:', res.ok));
```

---

### 問題 2：403 Forbidden（設置 LOGO 時）

**原因：** 用戶不是企業版

**解決方法：**
```typescript
// 升級用戶到企業版
await kv.set(`subscription:${userId}`, {
  plan: 'enterprise',
  status: 'active',
  // ...其他訂閱資訊
});
```

---

### 問題 3：郵件中 LOGO 顯示錯誤

**可能原因：**
1. LOGO URL 使用 HTTPS
2. LOGO 尺寸過大
3. LOGO 格式不支援

**建議：**
- ✅ 使用 HTTPS URL
- ✅ 尺寸：320x120 像素
- ✅ 格式：PNG（透明背景）
- ✅ 文件大小：< 500KB

---

## 📊 統計與監控

### 查看企業版使用統計

```typescript
import * as enterpriseLogoService from './enterprise_logo_service.tsx';

const stats = await enterpriseLogoService.getEnterpriseLogoStats();

console.log('📊 Enterprise Logo Stats:', {
  totalClients: stats.totalEnterpriseClients,
  withLogo: stats.clientsWithLogo,
  withoutLogo: stats.clientsWithoutLogo,
  recentUploads: stats.recentUploads.length,
});
```

---

## 🚀 進階功能

### 1. 批量導入企業 LOGO

```typescript
const enterpriseClients = [
  { userId: 'user-1', logoUrl: 'https://...', companyName: 'Company A' },
  { userId: 'user-2', logoUrl: 'https://...', companyName: 'Company B' },
];

for (const client of enterpriseClients) {
  await enterpriseLogoService.setUserEnterpriseLogo(
    client.userId,
    client.logoUrl,
    client.companyName
  );
}

console.log('✅ Bulk import completed');
```

---

### 2. 自定義郵件發送

```typescript
import * as smartEmailSender from './smart_email_sender.tsx';

// 發送月度報告
await smartEmailSender.sendMonthlyReportEmail(
  {
    userId: 'enterprise-user-123',
    email: 'ceo@company.com',
    name: 'John CEO',
    subscriptionTier: 'enterprise',
    preferredLanguage: 'en',
  },
  {
    month: 'December 2024',
    stats: {
      totalProjects: 50,
      completedProjects: 45,
      totalEarnings: 150000,
      currency: 'USD',
    },
  }
);
```

---

## 📞 技術支援

**問題反饋：** support@casewhr.com

**文檔更新：** 2024-12-17

**版本：** v1.0.0 - 企業版 LOGO 系統

---

## 🎉 總結

企業版 LOGO 系統已完全整合，特性包括：

✅ **自動化：** 根據訂閱等級自動選擇郵件模板  
✅ **權限控制：** 只有企業版用戶可設置 LOGO  
✅ **智能發送：** 一個接口處理所有郵件類型  
✅ **管理友好：** 完整的管理面板和統計功能  
✅ **測試完善：** 內建測試功能，快速驗證效果  

**開始使用企業版 LOGO 功能，讓您的品牌在每封郵件中閃耀！** ✨
