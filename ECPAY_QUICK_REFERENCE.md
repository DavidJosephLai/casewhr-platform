# 🇹🇼 ECPay 绿界金流快速参考

---

## 🔑 **你的凭证**

```
商店代号：2000132
Hash Key：jc1Squ9KV6l4hKjV
Hash IV：c2yFxsujqutR1w36
模式：测试环境 (test)
```

⚠️ **重要**：这些是敏感信息，只能在后端使用！

---

## ⚡ **快速配置（2 分钟）**

### **方法 1：使用自动脚本**

```bash
chmod +x setup_ecpay.sh
./setup_ecpay.sh
```

### **方法 2：手动配置**

#### **步骤 1：设置 Supabase 环境变量**

```bash
supabase secrets set ECPAY_MERCHANT_ID=2000132
supabase secrets set ECPAY_HASH_KEY=jc1Squ9KV6l4hKjV
supabase secrets set ECPAY_HASH_IV=c2yFxsujqutR1w36
supabase secrets set ECPAY_MODE=test
```

**或在 Supabase Dashboard 网页操作：**
1. https://app.supabase.com
2. 你的项目 → Edge Functions → 设置
3. Environment Variables
4. 添加上面 4 个变量

#### **步骤 2：更新 .env 文件（可选）**

```bash
echo "VITE_ECPAY_MODE=test" >> .env
```

#### **步骤 3：重新部署**

```bash
supabase functions deploy make-server-215f78a5
```

---

## 🧪 **测试信息**

### **测试环境 URL：**
```
https://payment-stage.ecpay.com.tw
```

### **测试信用卡：**
```
卡号：4311-9522-2222-2222
有效期：任意未来日期（例如 12/25）
CVV：任意三位数（例如 123）
持卡人姓名：任意名字
```

### **测试流程：**
1. 在平台点击 ECPay 充值
2. 输入金额（最低 NT$100）
3. 跳转到绿界支付页面
4. 使用测试信用卡支付
5. 完成后返回平台
6. 检查钱包余额是否更新

---

## 📁 **文件位置**

### **后端文件：**
```
/supabase/functions/server/ecpay_payment_service.tsx
```

### **前端配置：**
```
/config/payment.ts (ecpayConfig)
/components/Wallet.tsx (handleECPayDeposit)
```

---

## 🔧 **常用 API**

### **创建订单：**
```
POST /make-server-215f78a5/ecpay/create-order

Body:
{
  "amount": 100,
  "description": "充值",
  "userId": "user-id",
  "userEmail": "user@example.com"
}
```

### **查询订单：**
```
GET /make-server-215f78a5/ecpay/order/:orderId
```

### **支付回调：**
```
POST /make-server-215f78a5/ecpay/callback
(由绿界服务器调用)
```

---

## ✅ **验证检查清单**

配置完成后，确认：

- [ ] ✅ Supabase 环境变量已设置（4 个）
- [ ] ✅ Edge Functions 已重新部署
- [ ] ✅ 前端 .env 已更新（可选）
- [ ] ✅ 能创建订单
- [ ] ✅ 能跳转到支付页面
- [ ] ✅ 能完成测试支付
- [ ] ✅ 回调处理正确
- [ ] ✅ 钱包余额更新

---

## 🐛 **常见问题**

### **Q1: CheckMacValue 错误**
```
原因：Hash Key 或 IV 不正确
解决：检查环境变量是否正确设置
```

### **Q2: 回调没有收到**
```
原因：ReturnURL 配置错误
解决：确保 URL 为 https://YOUR_PROJECT.supabase.co/functions/v1/make-server-215f78a5/ecpay/callback
```

### **Q3: 钱包没有充值**
```
原因：回调处理失败
解决：查看 Supabase 日志，检查错误信息
```

---

## 📚 **详细文档**

- 📖 **完整指南**：`ECPAY_SETUP_GUIDE.md`
- 🤖 **配置脚本**：`setup_ecpay.sh`
- 🌐 **官方文档**：https://developers.ecpay.com.tw

---

## 🚀 **部署到生产环境**

### **步骤：**

1. **申请正式商店账号**
   - https://www.ecpay.com.tw
   - 需要台湾公司登记

2. **获取生产凭证**
   - 商店代号（不同于测试环境）
   - Hash Key（不同于测试环境）
   - Hash IV（不同于测试环境）

3. **更新环境变量**
   ```bash
   supabase secrets set ECPAY_MERCHANT_ID=YOUR_PRODUCTION_ID
   supabase secrets set ECPAY_HASH_KEY=YOUR_PRODUCTION_KEY
   supabase secrets set ECPAY_HASH_IV=YOUR_PRODUCTION_IV
   supabase secrets set ECPAY_MODE=production
   ```

4. **重新部署**
   ```bash
   supabase functions deploy make-server-215f78a5
   ```

---

## 💳 **支付方式**

ECPay 支持以下支付方式：

| 方式 | 代码 | 说明 |
|------|------|------|
| 💳 信用卡 | Credit | 即时到账 |
| 🏦 ATM 转账 | ATM | 需确认入账 |
| 🏪 超商代码 | CVS | 取代码后付款 |
| 📊 超商条码 | BARCODE | 打印条码付款 |

---

## 📊 **费率参考**

| 支付方式 | 手续费 |
|---------|-------|
| 信用卡 | 2.8% |
| ATM | NT$10/笔 |
| 超商 | NT$28/笔 |

*实际费率以绿界合约为准*

---

## 🔒 **安全提醒**

### **✅ 必须做：**
- 只在后端使用 Hash Key 和 IV
- 验证所有回调的 CheckMacValue
- 使用 HTTPS
- 记录所有交易

### **❌ 不要做：**
- 在前端代码中硬编码密钥
- 跳过 CheckMacValue 验证
- 忽略订单状态检查
- 允许重复处理

---

## 📞 **支持联系**

- **绿界客服**：02-2655-1775
- **技术文档**：https://developers.ecpay.com.tw
- **客服信箱**：service@ecpay.com.tw

---

**✅ 配置完成！开始使用绿界 ECPay 吧！** 🎉

---

## 🎯 **下一步**

1. ✅ 运行配置脚本或手动配置
2. ✅ 测试充值流程
3. ✅ 验证回调处理
4. ✅ 查看详细文档（如需要）

**需要帮助？** 查看 `ECPAY_SETUP_GUIDE.md` 获取完整指南。
