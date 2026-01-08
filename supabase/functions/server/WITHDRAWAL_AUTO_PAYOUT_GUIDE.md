# 💸 自動提現功能使用指南

## 📋 功能概覽

Case Where 平台現已支援**自動提現到 PayPal**功能！當用戶選擇 PayPal 作為提現方式時，管理員批准後系統會自動轉帳到用戶的 PayPal 帳戶。

---

## 🎯 支援的提現方式

### 1️⃣ **PayPal 自動提現**（推薦）✅
- ✅ 管理員批准後自動轉帳
- ✅ 實時到帳（通常幾分鐘內）
- ✅ 支援全球 200+ 國家/地區
- ✅ 手續費：2%
- ✅ 最低金額：$1 USD
- ✅ 最高金額：$20,000 USD

### 2️⃣ **銀行轉帳**（手動）🏦
- ⚠️ 需要管理員手動轉帳
- ⚠️ 到帳時間：3-5 工作日
- ⚠️ 手續費：$15-25 USD（依銀行而定）
- ✅ 支援台灣本地銀行
- ✅ 支援國際銀行（SWIFT/IBAN）

---

## 🚀 使用流程

### 📝 **用戶端流程**

1. **添加 PayPal 帳戶**
   - 進入「我的錢包」→「提現請求」
   - 選擇「添加提現方式」
   - 選擇「PayPal」
   - 輸入 PayPal 郵箱地址

2. **創建提現請求**
   - 輸入提現金額（USD）
   - 選擇 PayPal 帳戶
   - 提交請求

3. **等待審核**
   - 狀態：「待審核」(pending)
   - 錢包餘額會立即凍結相應金額

4. **收到款項**
   - 管理員批准後，系統自動轉帳
   - PayPal 會發送收款通知郵件
   - 通常幾分鐘內到帳

---

### 🔧 **管理員端流程**

1. **審核提現請求**
   - 進入「超級管理員」→「提現管理」
   - 查看待審核的提現請求

2. **批准提現**（PayPal 自動）
   - 點擊「批准」
   - 系統自動調用 PayPal Payouts API
   - 自動轉帳到用戶 PayPal 帳戶
   - 狀態自動更新為「已完成」

3. **批准提現**（銀行手動）
   - 點擊「批准」
   - 狀態更新為「已完成」
   - ⚠️ **需要手動轉帳到用戶銀行帳戶**
   - 轉帳後在備註欄記錄轉帳憑證

---

## 🔍 提現狀態說明

| 狀態 | 說明 | 下一步 |
|------|------|--------|
| **pending** | 待審核 | 等待管理員批准/拒絕 |
| **processing** | 處理中 | PayPal 自動轉帳失敗，需檢查 |
| **completed** | 已完成 | 款項已轉出 |
| **rejected** | 已拒絕 | 退回錢包餘額 |

---

## ⚠️ PayPal 自動轉帳失敗處理

如果 PayPal 自動轉帳失敗，系統會：

1. 將狀態標記為 `processing`
2. 記錄錯誤訊息在 `payout_error` 欄位
3. 保留在「處理中」列表，供管理員檢查

**常見失敗原因：**
- ❌ PayPal 郵箱錯誤或不存在
- ❌ PayPal 帳戶未驗證
- ❌ PayPal API 配置錯誤
- ❌ 金額超過單筆限額（$20,000）
- ❌ PayPal 帳戶被限制

**解決方案：**
1. 聯繫用戶確認 PayPal 郵箱
2. 要求用戶更新 PayPal 郵箱
3. 重新批准提現，或手動轉帳並標記為完成

---

## 🔐 安全性說明

### PayPal API 權限
- ✅ 使用 PayPal Payouts API
- ✅ 需要 `PAYPAL_CLIENT_ID` 和 `PAYPAL_CLIENT_SECRET`
- ✅ 支援 Sandbox（測試）和 Production（生產）模式
- ⚠️ API 憑證僅存在 Supabase 環境變數中，不會洩露

### 資金安全
- ✅ 用戶創建提現時，資金立即從 `available_balance` 轉移到 `pending_withdrawal`
- ✅ 管理員批准後才真正轉出
- ✅ 拒絕提現會自動退回 `available_balance`
- ✅ 所有操作都有完整的交易記錄

---

## 📊 提現數據結構

```typescript
interface Withdrawal {
  id: string;                    // 提現ID
  user_id: string;               // 用戶ID
  amount: number;                // 提現金額（USD）
  fee: number;                   // 手續費
  net_amount: number;            // 實際到帳金額
  method_id: string;             // 提現方式ID
  method_type: 'bank' | 'paypal'; // 提現方式類型
  method_details: string;        // 方式詳情（顯示用）
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;            // 創建時間
  processed_at?: string;         // 處理時間
  updated_at: string;            // 更新時間
  
  // PayPal 自動轉帳資訊
  payout_batch_id?: string;      // PayPal 批次ID
  payout_item_id?: string;       // PayPal 項目ID
  payout_status?: string;        // PayPal 轉帳狀態
  payout_method?: string;        // 'paypal_auto' | 'manual' | 'paypal_auto_failed'
  payout_error?: string;         // 錯誤訊息（如果失敗）
}
```

---

## 🧪 測試步驟

### Sandbox 模式測試（開發環境）

1. **設定 PayPal Sandbox 環境變數**
   ```
   PAYPAL_MODE=sandbox
   PAYPAL_CLIENT_ID=<Your Sandbox Client ID>
   PAYPAL_CLIENT_SECRET=<Your Sandbox Client Secret>
   ```

2. **創建 PayPal Sandbox 帳戶**
   - 前往 https://developer.paypal.com/
   - 創建測試用的 Business 和 Personal 帳戶

3. **測試提現流程**
   - 使用測試用 Personal 帳戶的郵箱
   - 創建提現請求
   - 管理員批准
   - 登入 Sandbox 帳戶確認收款

### Production 模式（生產環境）

⚠️ **上線前檢查清單：**
- [ ] PayPal Business 帳戶已驗證
- [ ] 已申請 Payouts API 權限
- [ ] 環境變數已設定為 Production
- [ ] 已測試小額提現（$1-10）
- [ ] 已設定提現通知郵件

---

## 💡 最佳實踐

### 用戶端
1. ✅ 使用已驗證的 PayPal 帳戶
2. ✅ 確認 PayPal 郵箱正確無誤
3. ✅ 小額測試後再進行大額提現
4. ✅ 保留提現記錄和 PayPal 收款憑證

### 管理員端
1. ✅ 批准前檢查用戶身份和 KYC 狀態
2. ✅ 監控 PayPal 自動轉帳成功率
3. ✅ 定期檢查「處理中」的提現
4. ✅ 記錄手動轉帳的憑證號碼
5. ✅ 設定每日/每月提現限額

---

## 🆘 常見問題

### Q1: PayPal 提現多久到帳？
**A:** 通常幾分鐘內，最長不超過 30 分鐘。

### Q2: 為什麼 PayPal 轉帳失敗？
**A:** 最常見的原因是 PayPal 郵箱錯誤或帳戶未驗證。請聯繫用戶確認。

### Q3: 銀行提現需要多久？
**A:** 3-5 工作日，依銀行處理速度而定。

### Q4: 手續費如何計算？
**A:**
- PayPal: 2% (最低 $1)
- 台灣銀行: NT$15 (約 $0.50)
- 國際銀行: $25 固定費用

### Q5: 能否取消提現請求？
**A:** 只有「待審核」狀態可以取消，已批准或處理中的無法取消。

---

## 📞 技術支援

如有問題，請聯繫技術團隊：
- 📧 Email: support@casewhr.com
- 💬 Slack: #technical-support
- 📱 緊急熱線: +886-XXX-XXXX

---

**版本：** v1.0  
**更新日期：** 2026/01/08  
**作者：** Case Where 技術團隊
