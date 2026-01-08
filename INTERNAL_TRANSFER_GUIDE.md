# 🏦 內部轉帳功能 - 完整實現指南

## 📋 概述

CaseWHR 平台現在支持完整的**用戶內部轉帳功能**，允許平台用戶之間進行即時、安全的資金轉移。

### ✨ 功能特點

- ⚡ **即時到帳**：轉帳在秒級完成
- 🔐 **安全可靠**：6位數轉帳密碼保護
- 💰 **透明費用**：清晰的手續費計算
- 📊 **限額管理**：基於會員等級的轉帳限額
- 📧 **通知系統**：雙方自動收到郵件通知
- 📝 **完整記錄**：詳細的轉帳歷史追蹤

---

## 🎯 功能詳情

### 1. 轉帳流程

```
1️⃣ 首次使用：設置 6 位數轉帳密碼
2️⃣ 輸入收款人 Email
3️⃣ 輸入轉帳金額
4️⃣ 添加備註（可選）
5️⃣ 輸入轉帳密碼驗證
6️⃣ 確認轉帳
7️⃣ 即時完成 ✅
```

### 2. 手續費結構

| 轉帳金額 | 手續費 |
|---------|--------|
| < $10 | **免費** 🎉 |
| ≥ $10 | **1%** (最低 $0.1，最高 $10) |

**範例：**
- 轉帳 $8 → 手續費 $0（免費）
- 轉帳 $50 → 手續費 $0.50
- 轉帳 $200 → 手續費 $2.00
- 轉帳 $2000 → 手續費 $10（封頂）

### 3. 轉帳限額

基於用戶的會員等級：

| 會員等級 | 每日限額 | 單筆限額 |
|----------|----------|----------|
| 🆓 **Free** | $100 | $50 |
| 💼 **Professional** | $1,000 | $500 |
| 🏢 **Enterprise** | $10,000 | $5,000 |

---

## 🔧 技術架構

### 後端 API

#### 1. 設置轉帳密碼
```http
POST /make-server-215f78a5/wallet/transfer/set-pin
Headers: Authorization: Bearer {access_token}
Body: { "pin": "123456" }
```

#### 2. 檢查是否已設置密碼
```http
GET /make-server-215f78a5/wallet/transfer/has-pin
Headers: Authorization: Bearer {access_token}
Response: { "hasPin": true/false }
```

#### 3. 執行轉帳
```http
POST /make-server-215f78a5/wallet/transfer
Headers: Authorization: Bearer {access_token}
Body: {
  "to_user_email": "recipient@example.com",
  "amount": 100.00,
  "note": "Payment for services",
  "transfer_pin": "123456"
}
Response: {
  "success": true,
  "transfer_id": "uuid",
  "fee": 1.00,
  "message": "Transfer completed successfully"
}
```

#### 4. 獲取轉帳歷史
```http
GET /make-server-215f78a5/wallet/transfer/history
Headers: Authorization: Bearer {access_token}
Response: {
  "sent": [...],
  "received": [...]
}
```

#### 5. 獲取轉帳限額資訊
```http
GET /make-server-215f78a5/wallet/transfer/limits
Headers: Authorization: Bearer {access_token}
Response: {
  "tier": "professional",
  "daily_limit": 1000,
  "per_transaction_limit": 500,
  "used_today": 200,
  "remaining_today": 800,
  "fee_info": { ... }
}
```

### 數據結構

#### 轉帳記錄
```typescript
{
  id: string,                    // UUID
  from_user_id: string,          // 發送方用戶 ID
  to_user_id: string,            // 接收方用戶 ID
  amount: number,                // 轉帳金額（USD）
  fee: number,                   // 手續費（USD）
  total_deduction: number,       // 總扣款（amount + fee）
  note: string,                  // 備註
  status: 'completed',           // 狀態
  created_at: string,            // 創建時間
  completed_at: string           // 完成時間
}
```

#### KV Store 數據鍵

| 鍵 | 值 | 說明 |
|----|-----|------|
| `transfer_pin:{userId}` | `{ pin, created_at }` | 用戶轉帳密碼 |
| `transfer:{transferId}` | `TransferRecord` | 轉帳記錄 |
| `transfers_sent:{userId}` | `TransferRecord[]` | 發送的轉帳（最近100筆） |
| `transfers_received:{userId}` | `TransferRecord[]` | 接收的轉帳（最近100筆） |
| `transfer_limit:{userId}:{date}` | `{ used, updated_at }` | 每日使用額度 |
| `platform_revenue` | `{ total, transfers }` | 平台收益統計 |

---

## 🎨 前端組件

### 1. InternalTransfer.tsx
主要轉帳介面組件

**功能：**
- PIN 設置/驗證
- 轉帳表單
- 手續費計算預覽
- 限額資訊顯示
- 即時驗證

### 2. TransferHistory.tsx
轉帳歷史記錄組件

**功能：**
- 已發送轉帳列表
- 已接收轉帳列表
- 詳細交易資訊
- 日期時間顯示

### 集成到 Dashboard
```tsx
// /components/Dashboard.tsx
import { InternalTransfer } from './InternalTransfer';
import { TransferHistory } from './TransferHistory';

// 在 Wallet Tab 中使用
<TabsContent value="wallet" className="space-y-6">
  <Wallet />
  <KYCVerification />
  <WithdrawalRequest />
  <WithdrawalHistory />
  <InternalTransfer />      {/* 新增 */}
  <TransferHistory />        {/* 新增 */}
</TabsContent>
```

---

## 🔒 安全機制

### 1. 轉帳密碼
- 6位數字密碼
- 僅用於轉帳操作
- 與登入密碼分離

⚠️ **注意**：當前版本使用明文存儲，生產環境應使用加密：
```typescript
// 推薦：使用 bcrypt 或類似加密
import bcrypt from 'bcrypt';
const hashedPin = await bcrypt.hash(pin, 10);
```

### 2. 防護措施
✅ 防止自己轉給自己
✅ 餘額檢查
✅ 限額檢查
✅ 原子操作保證數據一致性
✅ 用戶身份驗證

### 3. 未來增強
- [ ] PIN 錯誤次數限制（3次鎖定）
- [ ] 2FA 雙重驗證（可選）
- [ ] IP 白名單
- [ ] 異常金額警告
- [ ] 頻繁轉帳偵測

---

## 📧 通知系統

### 發送方郵件
```
標題：✅ Transfer Sent Successfully | 轉帳成功

內容：
- 收款人：姓名 (email)
- 金額：$100.00 USD
- 手續費：$1.00 USD
- 總扣款：$101.00 USD
- 備註：Payment for services
- Transfer ID：abc123...

CTA：查看交易記錄 → Dashboard
```

### 接收方郵件
```
標題：💰 You Received a Transfer | 您收到一筆轉帳

內容：
- 發送人：姓名 (email)
- 金額：$100.00 USD
- 備註：Payment for services
- Transfer ID：abc123...
- 狀態：已存入錢包

CTA：查看錢包 → Dashboard
```

---

## 📊 數據流程

### 轉帳執行流程

```
1. 驗證用戶身份 (JWT)
   ↓
2. 驗證轉帳密碼
   ↓
3. 查找收款人
   ↓
4. 計算手續費
   ↓
5. 檢查餘額
   ↓
6. 檢查限額
   ↓
7. 原子操作：
   a. 扣除發送方餘額
   b. 增加接收方餘額
   c. 記錄交易
   ↓
8. 更新每日限額
   ↓
9. 計入平台收益
   ↓
10. 發送通知郵件
    ↓
11. 返回成功響應
```

### 錯誤處理

| 錯誤 | HTTP 狀態 | 說明 |
|------|----------|------|
| PIN 錯誤 | 400 | Invalid transfer PIN |
| 收款人不存在 | 404 | Recipient not found |
| 餘額不足 | 400 | Insufficient balance |
| 超過限額 | 400 | Transfer limit exceeded |
| 自己轉自己 | 400 | Cannot transfer to yourself |
| 未授權 | 401 | Unauthorized |

---

## 🚀 部署清單

### 後端
- [x] `/supabase/functions/server/internal_transfer_service.tsx` - 創建轉帳服務
- [x] `/supabase/functions/server/index.tsx` - 註冊路由

### 前端
- [x] `/components/InternalTransfer.tsx` - 轉帳組件
- [x] `/components/TransferHistory.tsx` - 歷史記錄組件
- [x] `/components/Dashboard.tsx` - 集成到 Dashboard

### 部署步驟
```bash
# 1. 部署後端到 Supabase
cd supabase/functions
supabase functions deploy server

# 2. 部署前端到 Vercel
vercel --prod
```

### 環境變數
無需新增環境變數，使用現有的：
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_ANON_KEY`

---

## 📈 使用統計

### 平台收益追蹤
```typescript
// 從 KV Store 讀取
const revenue = await kv.get('platform_revenue');
console.log('轉帳手續費收益:', revenue.transfers);
```

### 用戶統計
```typescript
// 單個用戶的轉帳統計
const sent = await kv.get(`transfers_sent:${userId}`);
const received = await kv.get(`transfers_received:${userId}`);

console.log('總發送:', sent.length);
console.log('總接收:', received.length);
```

---

## 🎯 測試指南

### 1. 功能測試

#### 設置 PIN
```typescript
// 測試設置 PIN
await fetch('/wallet/transfer/set-pin', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ pin: '123456' })
});
```

#### 執行轉帳
```typescript
// 測試轉帳
const result = await fetch('/wallet/transfer', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    to_user_email: 'recipient@example.com',
    amount: 50,
    note: 'Test transfer',
    transfer_pin: '123456'
  })
});
```

### 2. 邊界測試

- [ ] 小額免費轉帳（< $10）
- [ ] 手續費計算驗證
- [ ] 超過單筆限額
- [ ] 超過每日限額
- [ ] 餘額不足
- [ ] 錯誤的 PIN
- [ ] 不存在的收款人
- [ ] 自己轉給自己

### 3. 壓力測試

- [ ] 同時多筆轉帳
- [ ] 大量歷史記錄載入
- [ ] 限額邊界測試

---

## 💡 最佳實踐

### 用戶引導
1. 首次使用時引導設置 PIN
2. 顯示清晰的手續費計算
3. 提醒每日限額使用情況
4. 提供升級會員的提示

### 安全建議
1. 定期提醒用戶更改 PIN
2. 記錄異常轉帳行為
3. 大額轉帳額外確認
4. 實施轉帳冷卻時間（可選）

### 性能優化
1. 轉帳歷史分頁載入
2. 使用緩存減少 API 調用
3. 異步發送通知郵件
4. 批量處理統計數據

---

## 🔮 未來規劃

### Phase 2：安全增強
- [ ] PIN 加密存儲（bcrypt）
- [ ] 錯誤次數限制
- [ ] 2FA 雙重驗證
- [ ] 設備白名單

### Phase 3：進階功能
- [ ] 批量轉帳（CSV 上傳）
- [ ] 定期自動轉帳
- [ ] 轉帳模板（常用收款人）
- [ ] 轉帳標籤分類

### Phase 4：商業智能
- [ ] 轉帳趨勢分析
- [ ] 用戶行為洞察
- [ ] 異常檢測系統
- [ ] 合規報告生成

---

## 📞 支援

### 常見問題

**Q: 轉帳需要多久到帳？**
A: 即時到帳，通常在幾秒內完成。

**Q: 可以取消已發送的轉帳嗎？**
A: 不可以，轉帳一旦完成無法取消。請在轉帳前仔細確認。

**Q: 忘記 PIN 怎麼辦？**
A: 可以重新設置新的 PIN，會覆蓋舊的 PIN。

**Q: 手續費如何計算？**
A: 低於 $10 免費，其他為 1%（最低 $0.1，最高 $10）。

**Q: 如何提高轉帳限額？**
A: 升級到專業版或企業版會員即可提高限額。

---

## 📝 更新日誌

### v1.0.0 (2025-01-08)
- ✅ 基礎轉帳功能
- ✅ PIN 驗證系統
- ✅ 限額管理
- ✅ 手續費計算
- ✅ 郵件通知
- ✅ 轉帳歷史
- ✅ 三語支援（英文/繁中/簡中）
- ✅ 三幣顯示（USD/TWD/CNY）

---

**開發團隊：CaseWHR Platform**  
**最後更新：2025-01-08**
