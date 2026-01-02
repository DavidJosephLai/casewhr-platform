# 🌟 企業版郵件系統使用指南

## 📧 雙層郵件架構設計（精緻版）

CaseWHR 郵件系統採用**雙層精緻架構**，為不同級別的用戶提供差異化的視覺體驗：

### 🎯 架構對比

```
┌─────────────────────────────────────────┐
│         📧 標準版（所有用戶）              │
├─────────────────────────────────────────┤
│  Header: ┌──────────────────┐          │
│          │ Case Where 接得準 │          │
│          │   精緻卡片樣式     │          │
│          └──────────────────┘          │
│          ─────────────                  │
│          郵件標題卡片                    │
│  Content: 郵件內容                       │
│  Footer: ┌──────────────────┐          │
│          │ 🎯 精緻 LOGO 容器  │          │
│          │  半透明卡片設計    │          │
│          └──────────────────┘          │
│          公司資訊卡片 + 社群連結卡片      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│        🌟 企業版（企業客戶專屬）           │
├─────────────────────────────────────────┤
│  Header: ┌──────────────────┐          │
│          │ ✨ 企業 LOGO      │          │
│          │  毛玻璃卡片容器    │          │
│          │  漸層邊框 + 陰影   │          │
│          └──────────────────┘          │
│          ┌─ Powered by ─┐             │
│          │ Case Where    │  藥丸狀標籤  │
│          └───────────────┘             │
│          郵件標題卡片                    │
│  Content: 郵件內容                       │
│  Footer: ┌──────────────────┐          │
│          │ 🎯 CaseWHR LOGO  │          │
│          │  精緻卡片設計      │          │
│          └──────────────────┘          │
│          ��司資訊卡片 + 社群連結卡片      │
└─────────────────────────────────────────┘
```

---

## 🎨 精緻視覺效果

### ✨ 設計亮點

#### 📧 標準版郵件
- **品牌卡片：** 半透明背景 + 圓角邊框 + 微妙陰影
- **漸層分隔線：** 從透明到半透明的優雅過渡
- **郵件標題卡片：** 獨立卡片樣式，視覺層次分明
- **Footer LOGO：** 紫色漸層容器 + 邊框 + 陰影效果
- **聯絡資訊卡片：** 深色半透明背景，資訊清晰展示
- **股東招募區：** 🌟 金色漸層卡片 + 醒目設計 + CTA 按鈕
- **社群/連結區：** 按鈕化設計，統一卡片風格

#### 🌟 企業版郵件
- **企業 LOGO 容器：** 
  - 漸層背景（白色半透明）
  - 毛玻璃效果（backdrop-filter）
  - 柔和陰影（0 8px 24px）
  - 邊框高光（rgba(255,255,255,0.18)）
  - 圖片陰影（drop-shadow）
  
- **Powered by 標籤：**
  - 藥丸形狀（border-radius: 20px）
  - 毛玻璃背景
  - 精緻文字排版（• 分隔符）
  - 微妙的文字陰影

- **內容 Header：** 獨立卡片樣式，與企業 LOGO 區分開

---

## 💎 股東招募區塊

### 🌟 設計特色

所有郵件的 Footer 都包含精緻的**股東招募訊息卡片**：

#### 視覺設計
```css
🎨 金色漸層卡片：
  ✅ 背景：金色半透明漸層（rgba(251, 191, 36, 0.15)）
  ✅ 邊框：2px 金色邊框（rgba(251, 191, 36, 0.4)）
  ✅ 圓角：16px 大圓角
  ✅ 陰影：金色光暈（rgba(251, 191, 36, 0.12)）
  ✅ 毛玻璃：backdrop-filter: blur(8px)

💎 標題：
  ✅ 金色文字（#fbbf24）
  ✅ 💎 鑽石 emoji 裝飾
  ✅ 文字陰影效果
  ✅ 粗體 800 字重

📩 CTA 按鈕：
  ✅ 金色漸層背景（#fbbf24 → #f59e0b）
  ✅ 深色文字（#1f2937）高對比
  ✅ 藥丸形狀（border-radius: 20px）
  ✅ 金色光暈陰影
  ✅ 郵件連結（support@casewhr.com）
```

#### 文字內容
```
💎 股東招募中 💎
歡迎入股 | Welcome to Invest

共同打造全球接案平台，開創未來商機
Build the future together

[📩 洽詢入股 | Contact Us]
```

#### 聯絡方式
- **郵件地址：** support@casewhr.com
- **按鈕樣式：** 金色漸層 CTA
- **操作：** 點擊直接開啟郵件客戶端

### 🎯 商業價值

1. **品牌曝光：** 每封郵件都是潛在投資者的觸點
2. **專業形象：** 精緻設計展示公司實力
3. **行動號召：** 清晰的 CTA 引導投資洽詢
4. **雙語展示：** 吸引國際投資者

### 📊 預期效果

- 📧 每封郵件都是招募管道
- 💼 提升公司專業度
- 🌍 觸及全球投資者
- 💰 持續的股東招募曝光

---

## 🎯 精緻度提升對比

### 舊版 → 新版

#### Header LOGO 區域
```
舊版：
  ❌ 簡單的 img 標籤
  ❌ 平面文字
  ❌ 無視覺層次

新版：
  ✅ 漸層半透明卡片容器
  ✅ 毛玻璃效果backdrop-filter: blur(10px)）
  ✅ 多層陰影系統
  ✅ 邊框高光效果
  ✅ 圖片獨立陰影
  ✅ 藥丸狀 "Powered by" 標籤
```

#### Footer 區域
```
舊版：
  ❌ 直接放置 img
  ❌ 簡單文字列表
  ❌ 平面連結

新版：
  ✅ LOGO 精緻卡片容器（紫色漸層）
  ✅ 聯絡資訊卡片化
  ✅ 社群媒體按鈕化
  ✅ 連結統一卡片風格
  ✅ 漸層分隔線
  ✅ 整體視覺統一性
```

#### CTA 按鈕
```
舊版：
  ❌ 單色背景
  ❌ 基礎圓角

新版：
  ✅ 漸層背景
  ✅ 深度陰影
  ✅ 邊框高光
  ✅ 文字陰影
  ✅ 更大的視覺衝擊力
```

---

## 💻 使用方式

### 1️⃣ 標準版（所有用戶）

```typescript
import * as emailTemplates from './email_templates_enhanced';

// 發送標準版歡迎郵件
const emailHtml = emailTemplates.getWelcomeEmail({
  name: '張三',
  language: 'zh',
  // 不提供 headerLogoUrl = 標準版
});
```

**結果：**
- ✅ Header 顯示 "Case Where 接得準" 文字
- ✅ Footer 顯示 CaseWHR LOGO + 公司資訊

---

### 2️⃣ 企業版（企業客戶專屬）

```typescript
import * as emailTemplates from './email_templates_enhanced';

// 🌟 發送企業版歡迎郵件
const emailHtml = emailTemplates.getWelcomeEmail({
  name: '李四',
  language: 'en',
  // 🌟 提供企業 LOGO URL = 企業版
  headerLogoUrl: 'https://company.com/logo.png',
});
```

**結果：**
- ✨ Header 顯示企業自定義 LOGO
- ✨ Header 附加 "Powered by Case Where 接得準"
- ✅ Footer 顯示 CaseWHR LOGO + 公司資訊

---

### 3️⃣ 自定義 Footer LOGO（可選）

```typescript
import * as emailTemplates from './email_templates_enhanced';

// 如果需要替換 Footer 的 CaseWHR LOGO
const emailHtml = emailTemplates.getWelcomeEmail({
  name: '王五',
  language: 'zh',
  headerLogoUrl: 'https://company.com/logo.png', // 企業版 Header
  logoUrl: 'https://casewhr.com/custom-footer-logo.png', // 自定義 Footer LOGO
});
```

---

## 📚 支援的郵件類型

所有 7 種郵件類型都支援企業版：

### ✅ 1. 歡迎郵件
```typescript
emailTemplates.getWelcomeEmail({
  name: string,
  language: 'en' | 'zh',
  logoUrl?: string,          // Footer LOGO（可選）
  headerLogoUrl?: string,    // 🌟 企業版 Header LOGO
});
```

### ✅ 2. 密碼重設郵件
```typescript
emailTemplates.getPasswordResetEmail({
  userName: string,
  resetUrl: string,
  language: 'en' | 'zh',
  logoUrl?: string,          // Footer LOGO（可選）
  headerLogoUrl?: string,    // 🌟 企業版 Header LOGO
});
```

### ✅ 3. 月度報告郵件
```typescript
emailTemplates.getMonthlyReportEmail({
  name: string,
  month: string,
  stats: { ... },
  language: 'en' | 'zh',
  logoUrl?: string,          // Footer LOGO（可選）
  headerLogoUrl?: string,    // 🌟 企業版 Header LOGO
});
```

### ✅ 4. 項目推薦郵件
```typescript
emailTemplates.getProjectRecommendationEmail({
  name: string,
  projects: [...],
  language: 'en' | 'zh',
  logoUrl?: string,          // Footer LOGO（可選）
  headerLogoUrl?: string,    // 🌟 企業版 Header LOGO
});
```

### ✅ 5. 系統通知郵件
```typescript
emailTemplates.getSystemNotificationEmail({
  name: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'danger',
  actionButton?: { text: string, url: string },
  language: 'en' | 'zh',
  logoUrl?: string,          // Footer LOGO（可選）
  headerLogoUrl?: string,    // 🌟 企業版 Header LOGO
});
```

### ✅ 6. 里程碑提醒郵件
```typescript
emailTemplates.getMilestoneReminderEmail({
  name: string,
  projectTitle: string,
  milestonesCompleted: number,
  totalMilestones: number,
  nextMilestone: string,
  daysRemaining: number,
  language: 'en' | 'zh',
  logoUrl?: string,          // Footer LOGO（可選）
  headerLogoUrl?: string,    // 🌟 企業版 Header LOGO
});
```

### ✅ 7. 訊息通知郵件
```typescript
emailTemplates.getMessageNotificationEmail({
  name: string,
  senderName: string,
  messagePreview: string,
  projectTitle?: string,
  language: 'en' | 'zh',
  logoUrl?: string,          // Footer LOGO（可選）
  headerLogoUrl?: string,    // 🌟 企業版 Header LOGO
});
```

---

## 🎯 實戰範例

### 範例 1：標準用戶註冊
```typescript
// 從 KV Store 獲取預設 LOGO
const defaultLogoUrl = await kv.get('email_logo_url') || 
  'https://bihplitfentxioxyjalb.supabase.co/storage/v1/object/public/platform-assets/casewhr-logo-white.png';

const html = emailTemplates.getWelcomeEmail({
  name: user.name,
  language: user.preferredLanguage || 'zh',
  logoUrl: defaultLogoUrl, // Footer LOGO
  // 不提供 headerLogoUrl = 標準版
});

await sendEmail({
  to: user.email,
  subject: '歡迎來到 Case Where！ | Welcome to Case Where!',
  html,
});
```

### 範例 2：企業客戶註冊
```typescript
// 企業客戶有自己的 LOGO
const enterpriseUser = {
  name: 'John Smith',
  email: 'john@bigcorp.com',
  company: 'BigCorp Inc.',
  companyLogoUrl: 'https://bigcorp.com/logo.png', // 🌟 企業 LOGO
};

const html = emailTemplates.getWelcomeEmail({
  name: enterpriseUser.name,
  language: 'en',
  headerLogoUrl: enterpriseUser.companyLogoUrl, // 🌟 企業版
});

await sendEmail({
  to: enterpriseUser.email,
  subject: 'Welcome to Your Company Portal | Powered by Case Where',
  html,
});
```

### 範例 3：白標方案（完全品牌化）
```typescript
// 白標客戶使用自己的品牌
const whitelabelClient = {
  name: '陳經理',
  email: 'chen@startup.tw',
  company: 'Startup Taiwan',
  headerLogoUrl: 'https://startup.tw/header-logo.png',  // 🌟 Header 品牌
  footerLogoUrl: 'https://startup.tw/footer-logo.png',  // Footer 品牌（取代 CaseWHR）
};

const html = emailTemplates.getWelcomeEmail({
  name: whitelabelClient.name,
  language: 'zh',
  headerLogoUrl: whitelabelClient.headerLogoUrl, // 🌟 企業版 Header
  logoUrl: whitelabelClient.footerLogoUrl,       // 自定義 Footer
});
```

---

## 🎨 設計規範

### Header LOGO 尺寸建議
- **最大寬度：** 320px
- **格式：** PNG（透明背景）
- **顏色：** 適合深色漸層背景（紫色系）
- **建議比例：** 16:9 或 4:3

### Footer LOGO 尺寸建議
- **最大寬度：** 200px
- **格式：** PNG（透明背景）
- **顏色：** 適合深色背景（灰色系）
- **建議比例：** 正方形或橫向

---

## 💰 商業模式

### 訂閱方案對照

| 功能 | 免費版 | 專業版 | 企業版 |
|------|--------|--------|--------|
| 郵件 Header | ✅ CaseWHR 文字 | ✅ CaseWHR 文字 | 🌟 **自定義 LOGO** |
| 郵件 Footer | ✅ CaseWHR LOGO | ✅ CaseWHR LOGO | ✅ CaseWHR LOGO |
| Powered by 標記 | ✅ | ✅ | ✅ 顯示 |
| 白標方案 | ❌ | ❌ | 🌟 **可選購** |

### 白標方案（額外付費）
- 移除所有 "Powered by Case Where" 標記
- Footer 可使用客戶自己的 LOGO
- 完全的品牌控制

---

## 🔧 實作建議

### 在訂閱系統中判斷用戶等級

```typescript
// 從資料庫獲取用戶訂閱等級
async function sendUserEmail(userId: string, emailType: string) {
  const user = await getUserById(userId);
  const subscription = await getUserSubscription(userId);
  
  let headerLogoUrl: string | undefined;
  
  // 🌟 企業版用戶可以使用自定義 Header LOGO
  if (subscription.tier === 'ENTERPRISE' && user.companyLogoUrl) {
    headerLogoUrl = user.companyLogoUrl;
  }
  
  const html = emailTemplates.getWelcomeEmail({
    name: user.name,
    language: user.preferredLanguage,
    headerLogoUrl, // 企業版會有值，標準版為 undefined
  });
  
  return html;
}
```

---

## 📊 效益分析

### 對用戶的價值
- ✅ **標準版用戶：** 專業、一致的品牌體驗
- 🌟 **企業版用戶：** 展示自己的品牌，提升專業形象
- 💎 **白標用戶：** 完全的品牌掌控，無第三方標記

### 對平台的價值
- 💰 **差異化定價：** 企業版功能作為升級誘因
- 📈 **品牌露出：** 標準版用戶看到 CaseWHR 品牌
- 🤝 **企業友好：** 企業客戶可以白標化平台

---

## 🚀 下一步

### 建議實作順序
1. ✅ **完成模板系統**（已完成）
2. 🔄 在訂閱系統中添加企業版標記
3. 🔄 在用戶設定中添加 LOGO 上傳功能
4. 🔄 在郵件服務中根據用戶等級選擇模板
5. 🔄 建立白標方案的額外付費機制

### 測試清單
- [ ] 測試標準版郵件（無 headerLogoUrl）
- [ ] 測試企業版郵件（有 headerLogoUrl）
- [ ] 測試所有 7 種郵件類型
- [ ] 測試雙語顯示（中英文）
- [ ] 測試 LOGO 尺寸適應性
- [ ] 測試移動端顯示

---

## 📞 技術支援

如有任何問題，請聯繫：
- 📧 Email: support@casewhr.com
- 💬 開發團隊內部溝通

**最後更新：** 2024-12-17
**版本：** v2.0 - 企業版支援