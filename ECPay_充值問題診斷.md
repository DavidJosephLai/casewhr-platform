# 🚨 **ECPay 充值成功但錢包為零 - 問題診斷**

---

## ❗ **問題描述**

**現象：**
- ✅ 使用私人信用卡完成 ECPay 充值
- ✅ 綠界收款頁面顯示「付款成功」
- ❌ 錢包餘額仍然是 **$0**

---

## 🔍 **根本原因分析**

### **ECPay 目前的運作模式：手動確認模式**

目前平台的 ECPay 整合是 **「手動確認模式」**，而不是「自動回調模式」：

```
實際流程：
1. 用戶點擊「充值」→ 輸入金額
2. 跳轉到 ECPay 綠界付款頁面
3. 用戶完成信用卡支付 ✅
4. 🛑 ECPay **不會自動回調**後端
5. 🛑 後端**不知道**你已經付款
6. 🛑 錢包餘額**不會自動更新**
7. ⏳ 等待用戶手動提交付款證明
8. ⏳ 等待管理員手動確認
9. ✅ 管理員確認後才會充值
```

---

## 📋 **完整解決方案**

### **方案 A：手動提交付款證明（當前方式）**

#### **步驟 1：準備付款證明**

```bash
1. 📸 截圖保存付款成功頁面
   - 確保截圖包含：
     ✅ 交易編號
     ✅ 付款金額（NT$）
     ✅ 付款時間
     ✅ 商店代號 (2000132)
     ✅ 付款狀態（成功/完成）

2. 📝 記錄交易資訊：
   - 交易編號：_________________
   - 付款金額：NT$ _____________
   - 付款時間：_________________
```

---

#### **步驟 2：前往管理後台提交**

```bash
# 1. 登入平台
https://casewhr.com

# 2. 前往 ECPay 付款管理
導航路徑：
首頁 → 個人資料/設定 → 管理後台 → ECPay 付款管理

# 或直接訪問（如果有權限）：
https://casewhr.com/admin/ecpay
```

---

#### **步驟 3：提交付款記錄**

1. **點擊「新增付款記錄」按鈕**

2. **填寫表單：**
   ```
   用戶郵箱：[你的註冊郵箱]
   付款類型：儲值/充值 (deposit)
   金額 (TWD)：[你支付的台幣金額]
   ECPay 交易編號：[從截圖中找到]
   備註：[可選] 例如：2024-12-26 信用卡充值
   ```

3. **上傳截圖**（如果系統支持）

4. **提交並等待確認**

---

#### **步驟 4：等待管理員確認**

```
⏱️ 預計處理時間：
- 測試環境：1-24 小時
- 正式環境：1-3 個工作日

✅ 確認後：
- 錢包餘額自動更新
- 收到系統通知
- 可在交易記錄中查看
```

---

### **方案 B：設置自動回調（推薦 - 需要配置）**

這需要完成 ECPay API 整合，讓系統自動處理付款：

#### **需要完成的配置：**

```bash
1. 創建 ECPay API 路由 - 自動創建訂單
2. 設置 ReturnURL - 付款成功後跳轉
3. 設置 PaymentInfoURL - 接收付款通知
4. 自動驗證 CheckMacValue
5. 自動更新錢包餘額
```

**⚠️ 這需要修改代碼，稍後可以實現。**

---

## 🔧 **立即檢查清單**

### **1. 確認付款是否真的成功**

```bash
登入 ECPay 商店後台：
https://vendor-stage.ecpay.com.tw  (測試環境)
或
https://vendor.ecpay.com.tw  (正式環境)

帳號：[你的 ECPay 商店帳號]
商店代號：2000132

查看：
✅ 交易記錄 → 找到你的交易
✅ 確認狀態：已付款/成功
✅ 記錄交易編號
```

---

### **2. 檢查錢包數據**

打開瀏覽器開發者工具（F12），執行：

```javascript
// 在瀏覽器控制台執行
console.log('當前錢包數據：', 
  document.querySelector('[class*="available_balance"]')?.textContent
);

// 或直接檢查 API
fetch('https://[你的專案ID].supabase.co/functions/v1/make-server-215f78a5/wallet/[你的用戶ID]', {
  headers: {
    'Authorization': 'Bearer [你的 Access Token]'
  }
})
.then(r => r.json())
.then(data => console.log('錢包餘額：', data.wallet.available_balance));
```

---

### **3. 檢查 ECPay 付款記錄是否存在**

```javascript
// 在瀏覽器控制台執行
fetch('https://[你的專案ID].supabase.co/functions/v1/make-server-215f78a5/ecpay-payments/my-payments', {
  headers: {
    'Authorization': 'Bearer [你的 Access Token]'
  }
})
.then(r => r.json())
.then(data => console.log('我的 ECPay 付款記錄：', data.payments));
```

**預期結果：**
- ❌ 如果返回空數組 `[]` → 證實沒有自動記錄
- ✅ 如果有記錄但 `status: 'pending'` → 需要管理員確認
- ✅ 如果 `status: 'confirmed'` 但錢包為零 → 後端處理有問題

---

## 🎯 **快速解決步驟**

### **立即可以做的：**

```bash
1️⃣ 截圖保存付款證明

2️⃣ 前往平台：
   https://casewhr.com/wallet

3️⃣ 查看交易記錄
   - 如果看到待確認的記錄 → 等待確認
   - 如果沒有記錄 → 手動提交

4️⃣ 聯繫管理員（如果有急需）：
   - 提供：交易編號、金額、付款時間
   - 請求手動確認

5️⃣ 刷新頁面確認餘額更新
```

---

## 📊 **系統狀態檢查**

### **檢查 Supabase 環境變量是否正確**

```bash
# 在 Supabase Dashboard 檢查
https://app.supabase.com

Edge Functions → Settings → Secrets

必須存在：
✅ ECPAY_MERCHANT_ID = 2000132
✅ ECPAY_HASH_KEY = jc1Squ9KV6l4hKjV
✅ ECPAY_HASH_IV = c2yFxsujqutR1w36
✅ ECPAY_MODE = test
```

---

### **檢查 Edge Function 是否正確部署**

```bash
# 查看 Edge Function 日誌
Supabase Dashboard → Edge Functions → make-server-215f78a5 → Logs

搜尋關鍵字：
- "ECPay"
- "payment"
- "deposit"

確認：
✅ ECPay 路由已註冊
✅ 沒有錯誤日誌
```

---

## 🚀 **下一步改進建議**

### **實現自動回調充值（推薦）**

需要添加以下功能：

1. **創建訂單 API** (`/ecpay/create-order`)
   ```typescript
   // 生成 ECPay 表單
   // 設置 ReturnURL, PaymentInfoURL
   // 計算 CheckMacValue
   ```

2. **付款回調 API** (`/ecpay/callback`)
   ```typescript
   // 接收 ECPay 付款通知
   // 驗證 CheckMacValue
   // 自動創建付款記錄
   // 自動更新錢包餘額
   ```

3. **更新前端充值流程**
   ```typescript
   // 不再直接打開 ECPay 連結
   // 而是調用後端 create-order
   // 取得動態生成的付款表單
   ```

---

## 📝 **重要提醒**

### **⚠️ 測試環境 vs 正式環境**

```bash
目前配置：
ECPAY_MODE = test
商店代號 = 2000132 (測試商店)

⚠️ 注意：
- 測試環境的交易**不是真實扣款**
- 測試信用卡號需使用 ECPay 提供的測試卡號
- 如果用真實信用卡，可能無法成功（或需要 ECPay 特別設置）

正式環境切換：
1. 申請正式商店帳號
2. 更新環境變量：
   ECPAY_MODE = production
   ECPAY_MERCHANT_ID = [正式商店代號]
   ECPAY_HASH_KEY = [正式 Hash Key]
   ECPAY_HASH_IV = [正式 Hash IV]
```

---

## 📞 **需要協助？**

### **如果問題仍未解決：**

1. **提供以下資訊：**
   ```
   - 付款時間：
   - 付款金額：
   - ECPay 交易編號：
   - 用戶郵箱：
   - 付款截圖
   ```

2. **檢查項目：**
   - [ ] ECPay 後台確認付款成功
   - [ ] 截圖已保存
   - [ ] 已嘗試手動提交付款記錄
   - [ ] 已等待至少 5 分鐘刷新頁面
   - [ ] 已檢查 Supabase Edge Function 日誌

3. **下一步：**
   - 如需立即充值，可使用 **PayPal 充值**（自動處理）
   - 等待 ECPay 自動回調功能開發完成
   - 聯繫平台管理員手動處理

---

## ✅ **總結**

### **當前狀態：**
- ECPay 整合 = ✅ **已完成配置**
- 自動回調 = ❌ **尚未實現**
- 手動確認 = ✅ **可用**

### **解決方案：**
1. **短期：** 手動提交付款證明 → 管理員確認 → 充值成功
2. **長期：** 開發自動回調功能 → 即時充值

### **預計時間：**
- 手動確認：1-24 小時
- 自動回調開發：需要 1-2 小時開發時間

---

**🎉 不用擔心，你的付款不會丟失！**

只需要完成手動提交流程，管理員確認後就會立即充值到錢包。

---

**最後更新：** 2024-12-26  
**文件版本：** v1.0
