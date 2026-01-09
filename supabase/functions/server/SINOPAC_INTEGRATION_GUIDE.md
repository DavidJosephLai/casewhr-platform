# 🏦 永豐銀行寰宇金融 API 集成指南

## 📋 文件概覽

本文件說明如何將 **永豐銀行寰宇金融 API** 集成到 Case Where 平台的提現系統中。

---

## 🎯 永豐銀行寰宇金融 API 簡介

**寰宇金融（SinoPac Global Finance）** 是永豐銀行提供給企業客戶的金融 API 服務，主要功能包括：

1. ✅ **批次代付/轉帳**：自動化批次撥款給多個收款人
2. ✅ **帳戶餘額查詢**：即時查詢企業帳戶餘額
3. ✅ **交易明細查詢**：查詢歷史轉帳記錄
4. ✅ **轉帳狀態查詢**：追蹤轉帳進度（處理中/完成/失敗）
5. ✅ **帳戶驗證**：驗證收款帳號是否正確
6. ✅ **即時通知**：Webhook 推送轉帳結果

---

## 🚀 申請流程

### 步驟 1：開立永豐銀行企業戶

1. 📞 聯繫永豐銀行企業金融部門
   - 客服專線：**0800-088-111**
   - 或直接到分行臨櫃辦理

2. 📝 準備文件：
   - 公司營業登記證
   - 公司大小章
   - 負責人身份證
   - 公司章程

3. 🏦 開立帳戶：
   - 企業活期存款帳戶
   - 申請網路銀行企業版

---

### 步驟 2：申請寰宇金融 API 服務

1. **聯繫永豐銀行 API 業務窗口**

   向您的業務經理或客服說：
   
   > 「您好，我們是 **casewhr.com** 接案平台，需要申請**寰宇金融 API 服務**，用於自動化批次撥款給平台接案者。」

2. **填寫 API 申請表**

   需要提供的資訊：
   - ✅ 公司基本資料
   - ✅ 平台網域：`casewhr.com`
   - ✅ 業務說明：接案平台自動撥款
   - ✅ 預估每月轉帳筆數：100-1,000 筆
   - ✅ 預估每月轉帳金額：NT$50,000 - NT$500,000
   - ✅ Webhook 接收網址（稍後設定）
   - ✅ API 伺服器 IP 白名單（如需要）

3. **簽署服務合約**

   - 閱讀並簽署 API 服務合約
   - 確認手續費和限額
   - 通常需要 3-5 工作日審核

4. **領取 API 憑證**

   審核通過後，永豐銀行會提供：
   - 📄 `API Key`（公鑰）
   - 🔐 `API Secret`（私鑰）
   - 🏢 `Merchant ID`（商戶號）
   - 📚 API 技術文件

---

## 🔧 環境設定

### 步驟 1：設定環境變數

在 Supabase Dashboard 中設定以下環境變數：

```bash
# 永豐銀行 API 配置
SINOPAC_API_URL=https://api.sinopac.com          # API 基礎網址（正式環境）
SINOPAC_API_KEY=your_api_key_here                # API Key（公鑰）
SINOPAC_API_SECRET=your_api_secret_here          # API Secret（私鑰）
SINOPAC_MERCHANT_ID=your_merchant_id_here        # 商戶號

# 永豐銀行帳戶資訊
SINOPAC_ACCOUNT_NUMBER=123456789012              # 貴司在永豐的帳號
SINOPAC_ACCOUNT_NAME=接得準有限公司               # 帳戶戶名
SINOPAC_BRANCH_CODE=0035                         # 分行代碼

# 模式（sandbox 測試環境 或 production 正式環境）
SINOPAC_MODE=sandbox
```

### 步驟 2：測試連接

設定完成後，測試 API 連接：

```bash
# 測試 API 連接
GET https://{project_id}.supabase.co/functions/v1/make-server-215f78a5/sinopac/test
```

**預期回應：**
```json
{
  "service": "永豐銀行寰宇金融 API",
  "status": "connected",
  "mode": "sandbox",
  "configured": true,
  "balance": 1000000.00
}
```

---

## 📊 API 功能說明

### 1️⃣ 批次代付/轉帳

**功能：** 自動撥款給接案者

**API Endpoint：** `POST /make-server-215f78a5/sinopac/process-withdrawal`

**請求範例：**
```json
{
  "withdrawal_id": "withdrawal_1234567890_abc"
}
```

**流程：**
1. 系統從 KV 讀取提現資料
2. 獲取收款帳戶資訊（帳號、戶名、銀行代碼）
3. 將 USD 轉換為 TWD（根據即時匯率）
4. 調用永豐銀行轉帳 API
5. 更新提現狀態為 `processing`
6. 記錄永豐交易 ID

**回應範例：**
```json
{
  "success": true,
  "transaction_id": "SINOPAC_TXN_20260109_001234"
}
```

---

### 2️⃣ 查詢帳戶餘額

**功能：** 即時查詢平台在永豐的帳戶餘額

**API Endpoint：** `GET /make-server-215f78a5/sinopac/balance`

**回應範例：**
```json
{
  "success": true,
  "balance": 1250000.50,
  "currency": "TWD",
  "account_number": "123456789012",
  "timestamp": "2026-01-09T10:30:00Z"
}
```

---

### 3️⃣ 驗證收款帳戶

**功能：** 驗證接案者的銀行帳號是否正確

**API Endpoint：** `POST /make-server-215f78a5/sinopac/verify-account`

**請求範例：**
```json
{
  "account_number": "123456789012",
  "bank_code": "807",
  "account_name": "王小明"
}
```

**回應範例：**
```json
{
  "success": true,
  "verified": true,
  "name": "王小明"
}
```

---

### 4️⃣ 查詢轉帳狀態

**功能：** 查詢轉帳是否已完成

**API Endpoint：** `GET /make-server-215f78a5/sinopac/transaction/{txnId}`

**回應範例：**
```json
{
  "success": true,
  "transaction_id": "SINOPAC_TXN_20260109_001234",
  "status": "completed",
  "message": "轉帳成功",
  "timestamp": "2026-01-09T10:35:00Z"
}
```

**狀態說明：**
- `pending`：待處理
- `processing`：處理中
- `completed`：已完成
- `failed`：失敗

---

## 🔄 整合到現有提現系統

### 修改 `international_payout_service.tsx`

在 `processSinopacWithdrawal()` 函數中，當管理員批准提現時：

```typescript
// 1. 判斷帳戶類型
if (account.account_type === 'local_taiwan') {
  // 使用永豐銀行 API 自動撥款
  const result = await processSinopacWithdrawal(withdrawal.id);
  
  if (result.success) {
    // 更新狀態為 processing
    withdrawal.status = 'processing';
    withdrawal.payout_method = 'sinopac_auto';
    withdrawal.payout_transaction_id = result.transaction_id;
  } else {
    // 記錄錯誤，改為手動處理
    withdrawal.payout_method = 'sinopac_auto_failed';
    withdrawal.payout_error = result.error;
  }
}
```

---

## 🎛️ 管理員操作流程

### 場景 1：自動撥款（永豐銀行）

1. **用戶創建提現請求**
   - 選擇台灣本地銀行帳戶
   - 輸入提現金額（USD）
   - 提交請求

2. **管理員審核**
   - 進入「提現管理」頁面
   - 檢查用戶 KYC 和帳戶資訊
   - 點擊「批准」

3. **系統自動處理**
   - ✅ 調用永豐銀行 API
   - ✅ 自動轉帳到用戶帳戶
   - ✅ 更新狀態為 `processing`
   - ✅ 發送郵件通知用戶

4. **確認完成**
   - 永豐銀行回傳轉帳結果（通常幾分鐘內）
   - 狀態更新為 `completed`
   - 用戶收到款項

---

### 場景 2：自動撥款失敗（需手動處理）

如果永豐銀行 API 失敗（例如：帳號錯誤、餘額不足），系統會：

1. 標記為 `processing` + `sinopac_auto_failed`
2. 記錄錯誤訊息在 `payout_error` 欄位
3. 管理員需要：
   - 檢查錯誤原因
   - 聯繫用戶確認帳號
   - 手動轉帳，或更新帳號後重試

---

## 💰 手續費說明

### 永豐銀行收費（預估）

| 轉帳類型 | 手續費 | 到帳時間 |
|---------|-------|---------|
| 同行轉帳（永豐→永豐） | NT$0 - NT$10 | 即時 |
| 跨行轉帳（永豐→其他銀行） | NT$15 - NT$30 | 即時或當日 |
| 大額跨行轉帳（>NT$300萬） | NT$30 - NT$50 | 即時 |

**注意：** 實際手續費以永豐銀行合約為準。

### 平台手續費

```typescript
// 台灣本地銀行提現手續費（在 international_payout_service.tsx 中）
case 'local_taiwan':
  return 15 / 30; // NT$15 converted to USD (約 $0.50)
```

建議根據永豐銀行的實際收費調整此數值。

---

## 🔐 安全性說明

### API 憑證保護

- ✅ `SINOPAC_API_SECRET` 僅存在 Supabase 環境變數中
- ✅ 不會暴露到前端
- ✅ 每次 API 請求都使用簽章（HMAC-SHA256）
- ✅ 支援 IP 白名單限制（如永豐要求）

### 交易安全

- ✅ 管理員批准後才轉帳
- ✅ 每筆轉帳都有唯一的 `reference_id`（withdrawal_id）
- ✅ 記錄完整的交易歷史
- ✅ 支援轉帳結果查詢和對帳

---

## 🧪 測試步驟

### 步驟 1：Sandbox 環境測試

1. **設定測試環境變數**
   ```bash
   SINOPAC_MODE=sandbox
   SINOPAC_API_URL=https://sandbox-api.sinopac.com  # 測試環境網址
   ```

2. **測試 API 連接**
   ```bash
   GET /make-server-215f78a5/sinopac/test
   ```

3. **測試帳戶驗證**
   ```bash
   POST /make-server-215f78a5/sinopac/verify-account
   {
     "account_number": "測試帳號",
     "bank_code": "807",
     "account_name": "測試戶名"
   }
   ```

4. **測試小額轉帳**
   - 創建測試用提現請求（$1 USD）
   - 管理員批准
   - 檢查是否成功調用 API
   - 查詢轉帳狀態

---

### 步驟 2：正式環境上線

**上線前檢查清單：**

- [ ] 永豐銀行 API 已申請並開通
- [ ] 環境變數已設定為 `production`
- [ ] API Key 和 Secret 正確無誤
- [ ] 已在 Sandbox 測試成功
- [ ] 已測試小額轉帳（NT$100）
- [ ] 已設定提現通知郵件
- [ ] 管理員已培訓操作流程
- [ ] 已準備緊急聯絡窗口（永豐銀行客服）

**上線步驟：**

1. 切換環境變數為正式環境
2. 測試小額提現（NT$100）
3. 確認到帳後，開放給用戶使用
4. 監控前 10 筆轉帳的成功率
5. 如有問題，立即切回手動模式

---

## 📞 技術支援

### 永豐銀行客服

- ☎️ 客服專線：**0800-088-111**
- 🌐 網路銀行：https://ibank.sinopac.com
- 📧 API 技術支援：（向業務經理索取）

### Case Where 技術團隊

- 📧 Email: support@casewhr.com
- 💬 Slack: #technical-support

---

## 📝 常見問題

### Q1: 永豐銀行 API 需要收費嗎？

**A:** 通常需要支付 API 服務費（例如：每月固定費用或按筆計費）。實際收費標準請向永豐銀行業務經理確認。

---

### Q2: 轉帳多久會到帳？

**A:**
- 同行轉帳（永豐→永豐）：**即時**
- 跨行轉帳（永豐→其他銀行）：**即時或當日**（依對方銀行而定）

---

### Q3: 如果轉帳失敗怎麼辦？

**A:** 系統會記錄錯誤訊息，管理員可以：
1. 查看錯誤原因（帳號錯誤/餘額不足/銀行維護）
2. 聯繫用戶更正資料
3. 重新提交轉帳請求
4. 或改為手動轉帳

---

### Q4: 是否支援國際轉帳？

**A:** 永豐銀行寰宇金融 API 主要支援**台灣本地轉帳**（TWD）。國際轉帳（USD/其他幣種）可能需要申請其他服務，請向永豐銀行確認。

---

### Q5: 如何處理退款？

**A:** 如需退款，可以：
1. 使用同樣的 API 反向轉帳
2. 或在平台內部轉帳（Internal Transfer）退回用戶錢包

---

## 🚀 下一步

### 立即行動：

1. ✅ **聯繫永豐銀行**：預約業務經理，說明需求
2. ✅ **準備文件**：公司登記證、負責人身份證
3. ✅ **開立帳戶**：永豐銀行企業戶 + 網路銀行
4. ✅ **申請 API**：填寫申請表，等待審核
5. ✅ **設定系統**：收到 API 憑證後，設定環境變數
6. ✅ **測試上線**：Sandbox 測試 → 小額測試 → 正式上線

---

### 預估時程：

- **開戶**：1-3 工作日
- **API 申請審核**：3-7 工作日
- **系統開發/測試**：已完成（本指南提供的代碼）
- **正式上線**：收到 API 憑證後 1 天內

**預計總時程：約 2 週**

---

## 📄 附錄：台灣銀行代碼

| 銀行 | 代碼 | 備註 |
|------|------|------|
| 永豐銀行 | 807 | 本平台主要使用 |
| 台灣銀行 | 004 | |
| 土地銀行 | 005 | |
| 合作金庫 | 006 | |
| 第一銀行 | 007 | |
| 華南銀行 | 008 | |
| 彰化銀行 | 009 | |
| 台北富邦 | 012 | |
| 國泰世華 | 013 | |
| 中國信託 | 822 | |
| 玉山銀行 | 808 | |

完整列表：https://www.fisc.com.tw/TC/OPENDATA/

---

**版本：** v1.0  
**更新日期：** 2026/01/09  
**作者：** Case Where 技術團隊  
**聯絡：** support@casewhr.com
