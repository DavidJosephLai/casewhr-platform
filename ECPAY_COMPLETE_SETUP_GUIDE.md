# 🇹🇼 ECPay 綠界金流完整設定指南

## 📋 您的 ECPay 憑證

### **重要：這些是機密資訊，請妥善保管！**

```
ECPAY_HASH_KEY: jc1Squ9KV6l4hKjV
ECPAY_HASH_IV: c2yFxsujqutR1w36
```

---

## 🚀 立即設定步驟

### **步驟 1：在 Supabase 設定環境變數**

1. 前往：https://supabase.com/dashboard/project/bihplitfentxioxyjalb/settings/secrets
2. 確認以下環境變數已設定：

```bash
ECPAY_MERCHANT_ID: [您的商店代號]
ECPAY_HASH_KEY: jc1Squ9KV6l4hKjV
ECPAY_HASH_IV: c2yFxsujqutR1w36
ECPAY_MODE: production
```

### **步驟 2：在 ECPay 後台設定回傳網址**

#### **登入 ECPay 後台**
- 測試環境：https://vendor-stage.ecpay.com.tw/
- 正式環境：https://vendor.ecpay.com.tw/

#### **設定路徑**
1. 點擊 **「系統開發管理」** → **「系統介接設定」**
2. 找到 **「交易回傳網址設定」**

#### **必填網址：**

##### ✅ **ReturnURL（後台通知網址）**
```
https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/ecpay/callback
```

**用途：** ECPay 伺服器通知您的後端付款結果（最重要！）

##### ✅ **ClientBackURL（前台跳轉網址）**
```
https://casewhr.com/wallet
```

**用途：** 用戶付款完成後，瀏覽器跳轉回您的網站

##### ✅ **OrderResultURL（訂單查詢網址）**
```
https://casewhr.com/dashboard
```

**用途：** 用戶查詢訂單時的跳轉網址

---

## 🔧 ECPay 後台完整設定清單

### **1. 基本資料設定**

前往：**系統開發管理** → **廠商基本資料**

```
商店名稱：CaseWHR 接得準
商店網址：https://casewhr.com
客服信箱：support@casewhr.com
客服電話：[您的電話]
```

### **2. 系統介接設定**

前往：**系統開發管理** → **系統介接設定**

#### **A. 交易回傳網址**

```
後台通知網址（ReturnURL）：
https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/ecpay/callback

前台跳轉網址（ClientBackURL）：
https://casewhr.com/wallet

訂單查詢網址（OrderResultURL）：
https://casewhr.com/dashboard
```

#### **B. 付款完成後的回傳參數**

確認勾選以下選項：
- ✅ 回傳交易編號（TradeNo）
- ✅ 回傳商店交易編號（MerchantTradeNo）
- ✅ 回傳交易金額（TradeAmt）
- ✅ 回傳付款時間（PaymentDate）
- ✅ 回傳付款方式（PaymentType）
- ✅ 回傳自訂欄位（CustomField1, CustomField2）

#### **C. 付款方式設定**

確認已啟用：
- ✅ 信用卡付款（Credit）
- ✅ ATM 虛擬帳號（ATM）
- ✅ 超商代碼繳費（CVS）
- ✅ 超商條碼繳費（BARCODE）

### **3. Hash Key 和 Hash IV**

前往：**系統開發管理** → **商店管理** → **查看金鑰**

確認您的金鑰：
```
Hash Key: jc1Squ9KV6l4hKjV
Hash IV: c2yFxsujqutR1w36
```

**⚠️ 重要提醒：**
- 如果金鑰不符，請在 ECPay 後台重新產生
- 重新產生後，必須更新 Supabase 環境變數

### **4. 白名單設定（如果有）**

前往：**系統開發管理** → **IP 白名單設定**

如果 ECPay 要求設定 IP 白名單，請添加：
```
Supabase IP 範圍（需要聯絡 Supabase 取得）
```

**或者：** 停用 IP 白名單檢查（僅開發測試用）

---

## 🧪 測試流程

### **步驟 1：測試環境設定（建議先測試）**

#### **切換到測試模式：**
```bash
# Supabase 環境變數
ECPAY_MODE: sandbox
```

#### **使用測試商店代號和測試金鑰**
```bash
ECPAY_MERCHANT_ID: 2000132
ECPAY_HASH_KEY: 5294y06JbISpM5x9
ECPAY_HASH_IV: v77hoKGq4kWxNNIS
```

#### **測試用信用卡**
```
卡號：4311-9522-2222-2222
有效期限：任何未來日期（如 12/25）
安全碼：任意3碼（如 123）
```

### **步驟 2：測試付款流程**

1. 前往：https://casewhr.com/wallet
2. 選擇「使用綠界付款」
3. 輸入金額：NT$ 300（最低金額）
4. 點擊「立即儲值」
5. 跳轉到 ECPay 測試頁面
6. 使用測試信用卡付款
7. 確認跳轉回您的網站
8. 檢查錢包餘額是否更新

### **步驟 3：檢查日誌**

在 Supabase Dashboard 查看 Edge Function 日誌：
```
https://supabase.com/dashboard/project/bihplitfentxioxyjalb/logs/edge-functions
```

應該看到：
```
[ECPay] Callback received
[ECPay] CheckMacValue verification success
[ECPay] Payment confirmed
```

### **步驟 4：切換到正式環境**

測試成功後，更新環境變數：
```bash
ECPAY_MODE: production
ECPAY_MERCHANT_ID: [您的正式商店代號]
ECPAY_HASH_KEY: jc1Squ9KV6l4hKjV
ECPAY_HASH_IV: c2yFxsujqutR1w36
```

---

## ❌ 常見錯誤和解決方案

### **錯誤 1：CheckMacValue error**

**原因：**
- Hash Key 或 Hash IV 設定錯誤
- 參數編碼不正確

**解決方案：**
1. 確認 Supabase 環境變數的 Hash Key 和 Hash IV 正確
2. 重新部署 Edge Function（更新環境變數後需重新部署）
3. 檢查 ECPay 後台的金鑰是否相同

### **錯誤 2：MerchantID not found**

**原因：**
- 商店代號錯誤
- 使用正式環境但填入測試商店代號（或相反）

**解決方案：**
1. 確認 `ECPAY_MODE` 和 `ECPAY_MERCHANT_ID` 匹配
2. 測試環境用測試商店代號
3. 正式環境用正式商店代號

### **錯誤 3：付款成功但餘額沒更新**

**原因：**
- ReturnURL 設定錯誤，ECPay 無法通知後端

**解決方案：**
1. 確認 ECPay 後台的 ReturnURL 為：
   ```
   https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/ecpay/callback
   ```
2. 檢查 Edge Function 日誌，看是否收到 callback
3. 確認沒有防火牆或 IP 白名單阻擋

### **錯誤 4：URL blocked by merchant**

**原因：**
- ClientBackURL 或 ReturnURL 沒有在 ECPay 後台設定

**解決方案：**
1. 在 ECPay 後台添加所有必要的 URL
2. 確認 URL 格式正確（https://）
3. 等待 5-10 分鐘讓設定生效

### **錯誤 5：MerchantTradeNo duplicated**

**原因：**
- 訂單編號重複（同一個訂單編號不能付款兩次）

**解決方案：**
- 這是正常的，系統會自動生成唯一的訂單編號
- 如果測試時遇到，等待幾秒後重試

---

## 🔍 驗證檢查清單

### ✅ Supabase 環境變數
- [ ] `ECPAY_MERCHANT_ID` 已設定
- [ ] `ECPAY_HASH_KEY` = `jc1Squ9KV6l4hKjV`
- [ ] `ECPAY_HASH_IV` = `c2yFxsujqutR1w36`
- [ ] `ECPAY_MODE` = `production`（或 `sandbox` 測試用）

### ✅ ECPay 後台設定
- [ ] 後台通知網址（ReturnURL）已設定
- [ ] 前台跳轉網址（ClientBackURL）已設定
- [ ] 訂單查詢網址（OrderResultURL）已設定
- [ ] Hash Key 和 Hash IV 與 Supabase 相同
- [ ] 已啟用信用卡付款
- [ ] 回傳參數已勾選

### ✅ 測試驗證
- [ ] 測試環境付款成功
- [ ] 能正常跳轉回網站
- [ ] 錢包餘額正確更新
- [ ] Edge Function 日誌正常
- [ ] 正式環境付款成功

---

## 📞 需要協助？

### **ECPay 客服**
- 電話：02-2655-1775
- 信箱：service@ecpay.com.tw
- 服務時間：週一至週五 09:00-18:00

### **常見問題**
1. **如何取得正式商店代號？**
   - 需要完成 ECPay 商店審核
   - 提供營業登記證、銀行帳戶等文件

2. **測試環境和正式環境可以同時使用嗎？**
   - 可以，但要使用不同的商店代號和金鑰
   - 通過 `ECPAY_MODE` 切換

3. **為什麼付款後要等一段時間才到帳？**
   - 信用卡付款：即時到帳
   - ATM 轉帳：約 10-30 分鐘
   - 超商繳費：約 1-3 天

---

## 🎯 快速命令參考

### **檢查 ECPay 配置**
```bash
curl https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/ecpay/config-check
```

### **查看 Edge Function 日誌**
```bash
supabase functions logs make-server-215f78a5 --project-ref bihplitfentxioxyjalb
```

### **測試 Callback URL**
```bash
curl -X POST https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/ecpay/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MerchantTradeNo=TEST123&RtnCode=1"
```

---

## 📝 重要提醒

### **安全性**
- ❌ 不要在前端程式碼中暴露 Hash Key 和 Hash IV
- ✅ 僅在 Supabase 環境變數中設定
- ✅ 使用 HTTPS 加密傳輸
- ✅ 定期檢查交易日誌

### **合規性**
- 確保符合 PCI DSS 標準（信用卡資料安全）
- 依法開立電子發票
- 保存交易記錄至少 5 年

### **用戶體驗**
- 清楚告知付款金額和幣別
- 提供多種付款方式選擇
- 付款成功後發送確認郵件
- 提供訂單查詢功能

---

**最後更新：** 2026-01-06  
**版本：** v1.0  
**狀態：** ✅ 生產環境就緒
