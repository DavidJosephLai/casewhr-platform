# LINE OAuth 登入系统 - 配置指南

## 📋 概述

LINE OAuth 登入系统已完成重构，改用**前端回调**架构，解决了 Supabase Edge Functions 的认证限制问题。

---

## 🔧 配置步骤

### **步骤 1: 设置 Supabase 环境变量**

在 [Supabase Dashboard](https://supabase.com/dashboard/project/bihplitfentxioxyjalb/settings/functions) 中设置以下环境变量：

1. `LINE_CHANNEL_ID` - 你的 LINE Channel ID
2. `LINE_CHANNEL_SECRET` - 你的 LINE Channel Secret  
3. `LINE_CALLBACK_URL` - **重要！设置为：**
   ```
   https://casewhr.com/line-callback
   ```

⚠️ **注意**：这是前端 URL，不是后端 API 端点！

---

### **步骤 2: 配置 LINE Developers Console**

1. 登录 [LINE Developers Console](https://developers.line.biz/console/)
2. 选择你的 LINE Login Channel
3. 在 **LINE Login** 设置中找到 **Callback URL**
4. 设置为：
   ```
   https://casewhr.com/line-callback
   ```
5. **保存设置**

⚠️ **注意**：不要在末尾加 `/`

---

## 🔄 新架构流程

```
┌─────────┐    ┌──────┐    ┌─────────────┐    ┌─────────┐    ┌─────────┐
│ 用户点击 │───>│ LINE │───>│ 前端回调页面 │───>│ 后端 API│───>│ 自动登入 │
│ 登录按钮 │    │ 授权 │    │ /line-callback│   │ 交换 token│  │ (magic link)│
└─────────┘    └──────┘    └─────────────┘    └─────────┘    └─────────┘
```

### **详细步骤**

1. **前端发起登录**
   - 用户点击 LINE 登录按钮
   - 调用 `GET /auth/line` 获取授权 URL
   - 重定向到 LINE 授权页面

2. **LINE 授权**
   - 用户在 LINE 页面授权
   - LINE 重定向回 `https://casewhr.com/line-callback?code=xxx&state=xxx`

3. **前端接收回调**
   - `/line-callback` 路由捕获 `code` 和 `state` 参数
   - 调用后端 API `POST /auth/line/exchange-token`

4. **后端处理**
   - 验证 `state`（CSRF 保护）
   - 使用 `code` 向 LINE 换取 access token
   - 获取 LINE 用户资料
   - 创建/登录 Supabase 用户
   - 生成 magic link

5. **自动登录**
   - 前端使用 magic link 重定向
   - Supabase 自动建立 session
   - 跳转到 Dashboard

---

## 🎯 优点

✅ **解决认证问题** - LINE 回调不需要 Authorization header  
✅ **更安全** - State 验证在后端完成  
✅ **更可靠** - 使用 Supabase 官方 magic link 机制  
✅ **更简单** - 前端不需要手动管理 session  

---

## 🧪 测试步骤

1. 访问 [casewhr.com](https://casewhr.com)
2. 点击登录按钮
3. 选择 LINE 登录
4. 在 LINE 页面完成授权
5. 应该自动跳转到 Dashboard

---

## 🔍 调试

### **检查环境变量**

访问诊断端点：
```
https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/health/env-check
```

### **查看日志**

1. **前端日志**：浏览器 Console（F12）
2. **后端日志**：[Supabase Functions Logs](https://supabase.com/dashboard/project/bihplitfentxioxyjalb/functions)

### **常见问题**

1. **Missing authorization header**
   - ✅ 已解决！现在使用前端回调，不会出现此问题

2. **Invalid state**
   - 检查后端 KV store 是否正常
   - State 有效期为 5 分钟

3. **LINE 授权失败**
   - 检查 LINE_CALLBACK_URL 是否正确
   - 检查 LINE Developers Console 配置

---

## 📝 文件修改清单

1. `/supabase/functions/server/index.tsx`
   - ✅ 添加 `POST /auth/line/exchange-token` 端点
   
2. `/supabase/functions/server/line-auth.tsx`
   - ✅ 修改 `handleLineCallback` 返回 magic link

3. `/App.tsx`
   - ✅ 添加 `/line-callback` 路由处理
   - ✅ 删除旧的 temp_key 逻辑

---

## 🚀 部署

配置完成后，系统会自动生效，无需手动部署。

**Supabase Edge Functions** 会在环境变量更新后自动重新部署。

---

## ✅ 完成确认

- [ ] Supabase 环境变量已设置
- [ ] LINE Developers Console 已配置
- [ ] 测试登录流程正常
- [ ] 前端和后端日志无错误

---

## 💡 下一步

如果测试成功，可以考虑：
1. 添加更多社交登录选项（Facebook、GitHub）
2. 优化登录流程的用户体验
3. 添加登录失败的友好提示

---

**最后更新：** 2026-01-10  
**状态：** ✅ 已完成并准备测试
