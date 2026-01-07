# 🇹🇼 ECPay 绿界金流集成包

---

## 📦 **包含内容**

这个集成包包含了完整配置 ECPay 绿界金流所需的所有文件和脚本。

---

## 🔑 **你的 ECPay 凭证**

```
商店代号：2000132
Hash Key：jc1Squ9KV6l4hKjV
Hash IV：c2yFxsujqutR1w36
模式：测试环境
```

⚠️ **重要**：这些凭证仅用于测试环境！

---

## 📁 **文件清单**

| 文件 | 类型 | 用途 |
|------|------|------|
| `ECPAY_README.md` | 📖 总览 | 本文件 - 快速开始指南 |
| `ECPAY_QUICK_REFERENCE.md` | ⚡ 参考 | 凭证、命令快速参考 |
| `ECPAY_SETUP_GUIDE.md` | 📚 指南 | 完整配置教程 |
| `ECPAY_DEPLOYMENT.md` | 🚀 部署 | 详细部署步骤 |
| `setup_ecpay.sh` | 🔧 脚本 | 配置环境变量 |
| `deploy_ecpay.sh` | 🚀 脚本 | 一键部署 |
| `.env.ecpay.example` | 📋 示例 | 环境变量示例 |

---

## ⚡ **快速开始（3 步）**

### **步骤 1：运行部署脚本**

```bash
chmod +x deploy_ecpay.sh
./deploy_ecpay.sh
```

### **步骤 2：启动开发服务器**

```bash
npm run dev
```

### **步骤 3：测试充值**

1. 访问：`http://localhost:5173/wallet`
2. 点击：ECPay 充值
3. 使用测试卡：`4311-9522-2222-2222`

**完成！** ✅

---

## 📚 **文档指引**

### **🚀 我想立即开始使用**
→ 运行 `./deploy_ecpay.sh`

### **⚡ 我需要快速参考**
→ 查看 `ECPAY_QUICK_REFERENCE.md`

### **📖 我想了解详细配置**
→ 阅读 `ECPAY_SETUP_GUIDE.md`

### **🔧 我需要手动部署**
→ 参考 `ECPAY_DEPLOYMENT.md`

### **🐛 我遇到了问题**
→ 查看 `ECPAY_DEPLOYMENT.md` 的「常见问题排查」部分

---

## 🎯 **适用场景**

这个 ECPay 集成支持：

- ✅ **钱包充值**：用户储值到平台钱包
- ✅ **订阅付费**：购买会员套餐
- ✅ **项目付款**：接案项目付款
- ✅ **多币种**：支持 TWD、USD、CNY 显示
- ✅ **多支付方式**：信用卡、ATM、超商

---

## 🧪 **测试环境**

### **测试 URL：**
```
https://payment-stage.ecpay.com.tw
```

### **测试信用卡：**
```
卡号：4311-9522-2222-2222
有效期：12/25（任意未来日期）
CVV：123（任意三位数）
```

### **最低充值金额：**
```
NT$100 = USD$3.17 = CNY¥22
```

---

## 🔐 **安全说明**

### **✅ 安全做法：**
- Hash Key 和 IV 仅在后端使用
- 通过 Supabase Secrets 管理敏感信息
- 不在前端代码中硬编码凭证
- 不提交 .env 文件到 Git

### **❌ 不安全做法：**
- 在前端代码中写入 Hash Key/IV
- 将凭证提交到 Git
- 分享凭证给他人
- 在测试环境使用生产凭证

---

## 📊 **部署架构**

```
前端 (Vite/React)
    ↓
Supabase Edge Functions
    ↓ (使用环境变量中的 Hash Key/IV)
ECPay API
    ↓
支付完成 → 回调 → 更新钱包
```

---

## ✅ **功能特性**

### **支付流程：**
1. 用户选择充值金额
2. 系统创建支付订单
3. 跳转到 ECPay 支付页面
4. 用户完成支付
5. ECPay 回调服务器
6. 验证 CheckMacValue
7. 更新用户钱包
8. 记录交易历史

### **管理功能：**
- 查看所有支付订单
- 确认/拒绝支付（演示模式）
- 删除支付记录
- 查看交易历史

---

## 🚀 **生产环境部署**

### **步骤：**

1. **申请正式商店账号**
   - 访问：https://www.ecpay.com.tw
   - 需要台湾公司登记

2. **获取生产凭证**
   - 商店代号（Production Merchant ID）
   - Hash Key（Production）
   - Hash IV（Production）

3. **更新环境变量**
   ```bash
   supabase secrets set ECPAY_MERCHANT_ID=YOUR_PRODUCTION_ID
   supabase secrets set ECPAY_HASH_KEY=YOUR_PRODUCTION_KEY
   supabase secrets set ECPAY_HASH_IV=YOUR_PRODUCTION_IV
   supabase secrets set ECPAY_MODE=production
   ```

4. **部署并测试**
   ```bash
   supabase functions deploy make-server-215f78a5
   ```

---

## 🔍 **验证清单**

部署后，确认：

- [ ] ✅ 环境变量已设置（4 个）
- [ ] ✅ Edge Functions 已部署
- [ ] ✅ 前端能访问钱包页面
- [ ] ✅ 能点击 ECPay 充值
- [ ] ✅ 能跳转到支付页面
- [ ] ✅ 能完成测试支付
- [ ] ✅ 回调处理正确
- [ ] ✅ 钱包余额更新
- [ ] ✅ 交易记录生成

---

## 🛠️ **技术栈**

### **后端：**
- Supabase Edge Functions (Deno)
- Hono Web Framework
- ECPay API Integration
- SHA256 CheckMacValue

### **前端：**
- React + TypeScript
- TailwindCSS
- Vite

### **存储：**
- Supabase KV Store
- Supabase Auth

---

## 📞 **支持与帮助**

### **ECPay 官方：**
- 客服电话：02-2655-1775
- 客服邮箱：service@ecpay.com.tw
- 技术文档：https://developers.ecpay.com.tw

### **项目文档：**
- 完整指南：`ECPAY_SETUP_GUIDE.md`
- 快速参考：`ECPAY_QUICK_REFERENCE.md`
- 部署指南：`ECPAY_DEPLOYMENT.md`

---

## 🎯 **下一步行动**

### **现在就开始：**

```bash
# 1. 运行部署脚本
chmod +x deploy_ecpay.sh
./deploy_ecpay.sh

# 2. 启动开发服务器
npm run dev

# 3. 测试充值功能
# 访问 http://localhost:5173/wallet
```

### **或者查看文档：**

```bash
# 快速参考
cat ECPAY_QUICK_REFERENCE.md

# 详细指南
cat ECPAY_SETUP_GUIDE.md

# 部署步骤
cat ECPAY_DEPLOYMENT.md
```

---

## 💡 **最佳实践**

### **开发环境：**
- ✅ 使用测试凭证
- ✅ 使用测试信用卡
- ✅ 小额测试交易
- ✅ 查看日志排查问题

### **生产环境：**
- ✅ 使用生产凭证
- ✅ 设置正确的回调 URL
- ✅ 监控交易状态
- ✅ 定期备份交易数据

---

## 🎉 **准备好了吗？**

选择你的路径：

### **路径 A：快速开始（推荐新手）**
```bash
./deploy_ecpay.sh
```

### **路径 B：手动配置（推荐学习）**
查看 `ECPAY_DEPLOYMENT.md`

### **路径 C：深入了解（推荐专家）**
阅读 `ECPAY_SETUP_GUIDE.md`

---

## 📈 **版本信息**

- **版本**：1.0.0
- **更新日期**：2024-12-26
- **状态**：✅ 生产就绪

---

## 🏆 **功能完成度**

- ✅ ECPay API 集成
- ✅ CheckMacValue 生成
- ✅ 支付订单创建
- ✅ 回调处理
- ✅ 钱包充值
- ✅ 交易记录
- ✅ 多币种支持
- ✅ 测试环境
- ✅ 生产环境支持
- ✅ 完整文档

---

**✅ 一切准备就绪！开始使用 ECPay 吧！** 🎊

---

**需要帮助？**
1. 查看 `ECPAY_QUICK_REFERENCE.md` 快速参考
2. 阅读 `ECPAY_DEPLOYMENT.md` 排查问题
3. 参考 `ECPAY_SETUP_GUIDE.md` 深入了解

**祝你部署顺利！** 🚀
