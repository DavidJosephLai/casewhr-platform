# 🔐 Facebook OAuth 完整設定指南

## 📋 前置需求

- Facebook 開發者帳號
- CaseWHR 網站已部署到 casewhr.com
- Supabase 專案

---

## 🚀 步驟 1：創建 Facebook 應用程式

### 1.1 前往 Facebook 開發者中心
```
https://developers.facebook.com/apps/
```

### 1.2 創建應用程式
1. 點擊 **「建立應用程式」**
2. 選擇 **「消費者」** 類型
3. 填寫：
   ```
   應用程式名稱：CaseWHR Platform
   應用程式聯絡電郵：support@casewhr.com
   ```
4. 點擊 **「建立應用程式」**

---

## ⚙️ 步驟 2：基本設定

### 2.1 設定基本資料
前往：**設定** → **基本資料**

填寫以下資訊：

#### **應用程式顯示名稱**
```
CaseWHR 接得準
```

#### **應用程式網域**
```
casewhr.com
localhost
```

#### **隱私政策網址** ⭐ 必填
```
https://casewhr.com/privacy-policy
```

#### **服務條款網址** ⭐ 必填
```
https://casewhr.com/terms-of-service
```

#### **應用程式圖示**
- 上傳 Logo（1024x1024 像素）
- 必須是正方形
- 格式：PNG 或 JPG

#### **類別**
```
商業與經濟 → 就業
```

點擊 **「儲存變更」**

---

## 🔑 步驟 3：設定 Facebook 登入

### 3.1 新增產品
1. 在左側菜單找到 **「新增產品」**
2. 找到 **「Facebook 登入」**
3. 點擊 **「設定」**

### 3.2 選擇平台
選擇 **「網頁」（Web）**

### 3.3 設定網站 URL
```
網站 URL：https://casewhr.com
```

### 3.4 設定 OAuth 設定

前往：**產品** → **Facebook 登入** → **設定**

#### **用戶端 OAuth 登入**
```
✓ 啟用
```

#### **Web OAuth 登入**
```
✓ 啟用
```

#### **有效的 OAuth 重新導向 URI** ⭐ 重要

添加以下 3 個 URI（每行一個）：

```
https://casewhr.com/auth/callback
http://localhost:5173/auth/callback
https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
```

**注意：** 將 `YOUR_SUPABASE_PROJECT` 替換為您的實際 Supabase 專案 ID

#### **登出網址**
```
https://casewhr.com
```

#### **已停用的平台**
不需要填寫

點擊 **「儲存變更」**

---

## 🔐 步驟 4：取得應用程式憑證

### 4.1 複製 App ID 和 App Secret

前往：**設定** → **基本資料**

```
應用程式編號（App ID）：[複製這個]
應用程式密鑰（App Secret）：[點擊「顯示」然後複製]
```

**⚠️ 警告：** App Secret 是機密資料，不要分享給任何人！

---

## 🗄️ 步驟 5：在 Supabase 設定 Facebook Provider

### 5.1 前往 Supabase Dashboard
```
https://supabase.com/dashboard/project/YOUR_PROJECT_ID
```

### 5.2 啟用 Facebook Provider
1. 點擊 **Authentication** → **Providers**
2. 找到 **Facebook**
3. 開啟開關 **「啟用 Facebook」**

### 5.3 填入憑證
```
Facebook Client ID：[貼上您的 App ID]
Facebook Client Secret：[貼上您的 App Secret]
```

### 5.4 複製 Callback URL
Supabase 會顯示一個 Callback URL，類似：
```
https://xxxxxxxxxxx.supabase.co/auth/v1/callback
```

**記下這個 URL！** 稍後需要在 Facebook 中設定。

### 5.5 儲存設定
點擊 **「儲存」**

---

## 🔄 步驟 6：回到 Facebook 添加 Supabase Callback

### 6.1 返回 Facebook 開發者中心
**產品** → **Facebook 登入** → **設定**

### 6.2 更新 OAuth 重新導向 URI
在 **「有效的 OAuth 重新導向 URI」** 中，確保包含：
```
https://casewhr.com/auth/callback
http://localhost:5173/auth/callback
https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback  ← 添加這個
```

點擊 **「儲存變更」**

---

## 📱 步驟 7：設定權限

### 7.1 新增權限
前往：**應用程式審查** → **權限與功能**

預設已包含的權限：
- ✓ `public_profile`（公開個人檔案）
- ✓ `email`（電子郵件）

這些權限足夠了！

---

## 🚀 步驟 8：發布應用程式

### 8.1 切換到上線模式

⚠️ **重要：** 在開發模式下，只有測試用戶可以登入

#### 方法 1：快速發布（推薦）
1. 點擊右上角的開關
2. 從 **「開發模式」** 切換到 **「上線模式」**
3. 確認彈窗

#### 方法 2：完整審查（如需要更多權限）
1. 前往 **「應用程式審查」**
2. 提交審查請求（通常需要 1-3 個工作日）

---

## ✅ 步驟 9：測試 Facebook 登入

### 9.1 本地測試
1. 啟動開發伺服器：
   ```bash
   npm run dev
   ```
2. 前往：`http://localhost:5173`
3. 點擊 **「使用 Facebook 登入」**
4. 應該會跳轉到 Facebook 授權頁面
5. 授權後，應該返回網站並完成登入

### 9.2 正式環境測試
1. 前往：`https://casewhr.com`
2. 點擊 **「使用 Facebook 登入」**
3. 測試登入流程

---

## 🔧 故障排除

### 問題 1：「URL 被封鎖」錯誤

**錯誤訊息：**
```
URL blocked: This redirect failed because the redirect URI is not whitelisted in the app's Client OAuth Settings.
```

**解決方案：**
1. 檢查 Facebook 的 **「有效的 OAuth 重新導向 URI」**
2. 確認包含所有必要的 URI
3. 確認沒有拼寫錯誤
4. 等待 5 分鐘讓設定生效

### 問題 2：「應用程式未上線」

**錯誤訊息：**
```
App Not Setup: This app is still in development mode.
```

**解決方案：**
1. 確認已填寫 **隱私政策 URL**
2. 確認已填寫 **服務條款 URL**
3. 將應用切換到 **「上線模式」**

### 問題 3：「缺少或無效的 client_id」

**解決方案：**
1. 檢查 Supabase 的 Facebook Provider 設定
2. 確認 Client ID 和 Client Secret 正確
3. 重新儲存設定

### 問題 4：Callback 後沒有登入

**解決方案：**
1. 檢查瀏覽器控制台的錯誤
2. 確認 Supabase Callback URL 正確
3. 檢查 email 權限是否已授權

---

## 📊 完整檢查清單

### Facebook 開發者中心
- [ ] 創建應用程式
- [ ] 填寫隱私政策 URL：`https://casewhr.com/privacy-policy`
- [ ] 填寫服務條款 URL：`https://casewhr.com/terms-of-service`
- [ ] 設定應用網域：`casewhr.com`
- [ ] 新增 Facebook 登入產品
- [ ] 設定 OAuth 重新導向 URI（3 個）
- [ ] 複製 App ID
- [ ] 複製 App Secret
- [ ] 切換到上線模式

### Supabase
- [ ] 啟用 Facebook Provider
- [ ] 填入 Client ID
- [ ] 填入 Client Secret
- [ ] 複製 Callback URL
- [ ] 儲存設定

### 測試
- [ ] 本地環境測試
- [ ] 正式環境測試
- [ ] 測試登入流程
- [ ] 測試登出功能
- [ ] 確認用戶資料正確儲存

---

## 🎯 快速參考

### Facebook 應用設定頁面
```
基本資料：https://developers.facebook.com/apps/YOUR_APP_ID/settings/basic/
Facebook 登入：https://developers.facebook.com/apps/YOUR_APP_ID/fb-login/settings/
應用審查：https://developers.facebook.com/apps/YOUR_APP_ID/app-review/
```

### 必填的 URL
```
隱私政策：https://casewhr.com/privacy-policy
服務條款：https://casewhr.com/terms-of-service
網站 URL：https://casewhr.com
```

### OAuth 重新導向 URI
```
https://casewhr.com/auth/callback
http://localhost:5173/auth/callback
https://[YOUR_PROJECT].supabase.co/auth/v1/callback
```

---

## 📞 需要幫助？

### Facebook 開發者支援
- 文件：https://developers.facebook.com/docs/facebook-login/web
- 社群：https://developers.facebook.com/community/

### Supabase 支援
- 文件：https://supabase.com/docs/guides/auth/social-login/auth-facebook
- Discord：https://discord.supabase.com/

---

## 🎉 完成！

設定完成後，您的用戶就可以使用 Facebook 帳號快速登入 CaseWHR 平台了！

**預期流程：**
1. 用戶點擊「使用 Facebook 登入」
2. 跳轉到 Facebook 授權頁面
3. 用戶授權後返回 CaseWHR
4. 自動創建帳號並登入
5. 可以開始使用平台功能

---

**最後更新：** 2026-01-06  
**版本：** v1.0
