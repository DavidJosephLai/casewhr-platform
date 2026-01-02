# 🚀 快速設置 David 企業 LOGO

## 📋 步驟

### 1. 設置訂閱為企業版

使用以下 API 呼叫（在瀏覽器 Console 或 Postman）：

```javascript
// 先獲取 David 的 user ID
const email = 'davidlai234@hotmail.com';

// 使用管理員 token
const adminToken = 'YOUR_ADMIN_ACCESS_TOKEN';

// 查找用戶
const usersResponse = await fetch(
  'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/admin/users',
  {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  }
);

const users = await usersResponse.json();
const davidUser = users.users.find(u => u.email === email);
console.log('David User ID:', davidUser.user_id);

// 設置訂閱
const userId = davidUser.user_id;

await fetch(
  'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/kv/set',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: `subscription:${userId}`,
      value: {
        user_id: userId,
        plan: 'enterprise',
        status: 'active',
        billing_cycle: 'annual',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method: 'admin',
        auto_renew: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }),
  }
);

console.log('✅ Subscription set to Enterprise');
```

### 2. 設置企業 LOGO

```javascript
// 使用 Case Where 的 LOGO
const logoUrl = 'https://bihplitfentxioxyjalb.supabase.co/storage/v1/object/public/platform-assets/casewhr-logo-white.png';
const companyName = 'Case Where 接得準股份有限公司';

// 設置 LOGO URL
await fetch(
  'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/kv/set',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: `user:enterprise-logo:${userId}`,
      value: logoUrl,
    }),
  }
);

// 設置企業資訊
await fetch(
  'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/kv/set',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: `user:enterprise-info:${userId}`,
      value: {
        userId: userId,
        companyName: companyName,
        logoUrl: logoUrl,
        uploadedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      }
    }),
  }
);

console.log('✅ Enterprise LOGO set');
```

### 3. 發送測試郵件

```javascript
// 發送測試歡迎郵件
await fetch(
  'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/test-enhanced-email',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'davidlai234@hotmail.com',
      type: 'welcome',
      language: 'zh',
    }),
  }
);

console.log('✅ Test email sent! Check davidlai234@hotmail.com inbox');
```

### 4. 驗證設置

```javascript
// 檢查訂閱
const subResponse = await fetch(
  'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/kv/get',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: `subscription:${userId}`,
    }),
  }
);

const sub = await subResponse.json();
console.log('Subscription:', sub);

// 檢查 LOGO
const logoResponse = await fetch(
  'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/kv/get',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: `user:enterprise-logo:${userId}`,
    }),
  }
);

const logo = await logoResponse.json();
console.log('Enterprise LOGO:', logo);
```

---

## 🎯 一鍵執行腳本

複製以下完整腳本到瀏覽器 Console：

```javascript
(async function setupDavidEnterpriseLogo() {
  const email = 'davidlai234@hotmail.com';
  const logoUrl = 'https://bihplitfentxioxyjalb.supabase.co/storage/v1/object/public/platform-assets/casewhr-logo-white.png';
  const companyName = 'Case Where 接得準股份有限公司';
  
  // 從 localStorage 獲取 access token（如果已登入）
  const session = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
  const adminToken = session.currentSession?.access_token;
  
  if (!adminToken) {
    console.error('❌ 請先登入管理員帳號！');
    return;
  }
  
  console.log('🚀 開始設置 David 的企業 LOGO...\n');
  
  try {
    // 1. 查找用戶
    console.log('1️⃣ 查找用戶...');
    const usersResponse = await fetch(
      'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/admin/users',
      {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      }
    );
    
    const usersData = await usersResponse.json();
    const davidUser = usersData.users?.find(u => u.email === email);
    
    if (!davidUser) {
      console.error('❌ 找不到用戶:', email);
      return;
    }
    
    const userId = davidUser.user_id;
    console.log('✅ 找到用戶:', userId);
    
    // 2. 設置訂閱
    console.log('\n2️⃣ 設置訂閱為企業版...');
    await fetch(
      'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/kv/set',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: `subscription:${userId}`,
          value: {
            user_id: userId,
            plan: 'enterprise',
            status: 'active',
            billing_cycle: 'annual',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            payment_method: 'admin',
            auto_renew: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }),
      }
    );
    console.log('✅ 訂閱設置完成');
    
    // 3. 設置 LOGO
    console.log('\n3️⃣ 設置企業 LOGO...');
    await fetch(
      'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/kv/set',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: `user:enterprise-logo:${userId}`,
          value: logoUrl,
        }),
      }
    );
    
    await fetch(
      'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/kv/set',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: `user:enterprise-info:${userId}`,
          value: {
            userId,
            companyName,
            logoUrl,
            uploadedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          }
        }),
      }
    );
    console.log('✅ LOGO 設置完成');
    
    // 4. 發送測試郵件
    console.log('\n4️⃣ 發送測試郵件...');
    const emailResponse = await fetch(
      'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/test-enhanced-email',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          type: 'welcome',
          language: 'zh',
        }),
      }
    );
    
    const emailResult = await emailResponse.json();
    console.log('✅ 測試郵件已發送:', emailResult);
    
    // 完成
    console.log('\n🎉 設置完成！');
    console.log('📧 請查收郵件:', email);
    console.log('🌟 郵件應該包含企業 LOGO');
    
  } catch (error) {
    console.error('❌ 設置失敗:', error);
  }
})();
```

---

## ✅ 預期結果

設置完成後，davidlai234@hotmail.com 收到的測試郵件應該包含：

1. **Header 區域：**
   - ✅ Case Where LOGO（毛玻璃卡片）
   - ✅ "Powered by Case Where 接得準" 標籤

2. **Footer 區域：**
   - ✅ Case Where LOGO
   - ✅ 💎 股東招募中區塊（support@casewhr.com）
   - ✅ 公司資訊和社群連結

3. **整體樣式：**
   - ✅ 企業版專屬設計
   - ✅ 漸層背景
   - ✅ 精緻卡片效果

---

## 🔍 故障排除

### LOGO 沒有出現？

檢查以下項目：

```javascript
// 1. 檢查訂閱等級
const userId = 'USER_ID_HERE';
const subResponse = await fetch(
  'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/kv/get',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key: `subscription:${userId}` }),
  }
);
const sub = await subResponse.json();
console.log('Plan:', sub.value?.plan); // 應該是 'enterprise'

// 2. 檢查 LOGO URL
const logoResponse = await fetch(
  'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/kv/get',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key: `user:enterprise-logo:${userId}` }),
  }
);
const logo = await logoResponse.json();
console.log('Logo URL:', logo.value); // 應該有 URL

// 3. 重新發送測試郵件
await fetch(
  'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/test-enhanced-email',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'davidlai234@hotmail.com',
      type: 'welcome',
      language: 'zh',
    }),
  }
);
```

---

## 📞 需要協助？

如果設置後仍然沒有顯示 LOGO，請提供：
1. 用戶 ID
2. 訂閱等級（從上面的檢查腳本）
3. LOGO URL（從上面的檢查腳本）
4. 測試郵件發送結果
