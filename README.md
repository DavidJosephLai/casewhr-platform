# 🚀 CaseWHR - 全球专业接案平台

<div align="center">

![CaseWHR Logo](public/logo.svg)

**连接全球人才与项目的专业平台**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.1.4-646CFF?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com)

[官网](https://casewhr.com) • [文档](#-文档) • [功能](#-核心功能) • [部署](#-快速部署)

</div>

---

## 📋 **项目简介**

CaseWHR（接得準）是一个功能完整的全球接案平台，专为连接客户与自由职业者而设计。平台支持：

- 🌍 **三语言**：繁体中文、简体中文、英文
- 🤖 **AI 驱动**：智能 SEO 优化、AI 客服助手
- 💳 **全球支付**：Stripe、PayPal、ECPay 绿界金流
- 🔐 **安全登录**：SSO（Google、GitHub、Facebook OAuth）
- 📧 **邮件系统**：专业邮件模板 + Brevo 集成
- 🎯 **企业级**：完整的项目管理、里程碑、合约系统

---

## ✨ **核心功能**

### 🎯 **项目管理**
- ✅ 发布项目（文字、图片、附件）
- ✅ AI SEO 智能优化（自动生成标题、描述、标签）
- ✅ 项目浏览和搜索
- ✅ 多货币支持（TWD、CNY、USD）

### 👥 **用户系统**
- ✅ 用户注册/登录
- ✅ SSO 单点登录（Google、GitHub、Facebook）
- ✅ 用户资料和技能管理
- ✅ 三级会员系统（Free、Pro、Enterprise）

### 💼 **接案流程**
- ✅ 提交提案
- ✅ 创建合约
- ✅ 里程碑管理
- ✅ 交付物上传和审核
- ✅ 评价系统

### 💰 **支付系统**
- ✅ 钱包充值（Stripe、PayPal、ECPay）
- ✅ 托管支付
- ✅ 提现管理（本地和国际银行）
- ✅ 交易历史和发票

### 💬 **通讯系统**
- ✅ 即时消息
- ✅ 未读消息提醒
- ✅ 多人对话

### 🤖 **AI 功能**
- ✅ AI SEO 生成器（OpenAI GPT-4o-mini）
- ✅ AI Chatbot 智能客服（多语言支持）
- ✅ AI 项目推荐
- ✅ AI 提案助手

### 🔧 **管理后台**
- ✅ 用户管理（三级权限：super_admin、moderator、support）
- ✅ 项目审核
- ✅ 提现审批
- ✅ 交易管理
- ✅ 邮件测试工具
- ✅ 系统设置

---

## 🛠️ **技术栈**

### **前端**
- ⚛️ **React 18.3.1** - UI 框架
- 📘 **TypeScript 5.3.3** - 类型安全
- ⚡ **Vite 5.1.4** - 构建工具
- 🎨 **Tailwind CSS 4.0** - 样式框架
- 🎭 **Radix UI** - 无障碍组件库
- 🔄 **React Router** - 路由管理

### **后端**
- 🗄️ **Supabase** - BaaS（数据库 + 认证 + 存储）
- 🌐 **Hono** - Edge Functions Web 框架
- 🔒 **Row Level Security** - 数据安全
- 📧 **Brevo** - 邮件服务

### **支付集成**
- 💳 **Stripe** - 国际信用卡
- 🅿️ **PayPal** - PayPal 支付
- 🇹🇼 **ECPay** - 台湾绿界金流

### **AI 服务**
- 🤖 **OpenAI GPT-4o-mini** - AI 引擎
- 🧠 **智能 SEO** - 内容优化
- 💬 **智能客服** - 多语言支持

### **部署**
- ▲ **Vercel** - 前端托管
- 🌐 **Cloudflare** - CDN（可选）
- 🚀 **CI/CD** - 自动部署

---

## 📁 **项目结构**

```
casewhr-platform/
├── App.tsx                      # 主应用组件
├── main.tsx                     # 入口文件
├── index.html                   # HTML 模板
│
├── components/                  # React 组件 (~100+ 个)
│   ├── ui/                      # UI 基础组件库
│   ├── admin/                   # 管理员组件
│   ├── AIChatbot.tsx            # AI 客服
│   ├── AISEOGenerator.tsx       # AI SEO 生成器
│   ├── Dashboard.tsx            # 用户仪表板
│   ├── Header.tsx               # 全局导航
│   ├── Hero.tsx                 # 首页
│   └── ...                      # 其他组件
│
├── pages/                       # 页面组件
│   └── AdminPage.tsx            # 管理员后台
│
├── contexts/                    # React Context
│   ├── AuthContext.tsx          # 认证上下文
│   └── ViewContext.tsx          # 视图管理
│
├── lib/                         # 工具库
│   ├── supabase.ts              # Supabase 客户端
│   ├── translations.ts          # 三语言翻译
│   ├── currency.ts              # 货币转换
│   └── ...                      # 其他工具
│
├── hooks/                       # 自定义 Hooks
│   └── useExchangeRate.tsx      # 汇率 Hook
│
├── supabase/                    # Supabase Edge Functions
│   └── functions/
│       └── server/              # Hono 服务器
│           ├── index.tsx        # 主服务器
│           ├── ai_chatbot_service.tsx
│           ├── ai_seo_service.tsx
│           ├── payment_service.tsx
│           └── ...              # 其他服务
│
├── styles/                      # 样式文件
│   └── globals.css              # 全局样式
│
├── public/                      # 静态资源
│   ├── robots.txt               # SEO 爬虫规则
│   ├── sitemap.xml              # 网站地图
│   └── logo.svg                 # Logo
│
├── vercel.json                  # Vercel 配置
├── netlify.toml                 # Netlify 配置
├── package.json                 # 依赖管理
├── vite.config.ts               # Vite 配置
├── tsconfig.json                # TypeScript 配置
└── .env.example                 # 环境变量示例
```

---

## 🚀 **快速开始**

### **前置要求**

- Node.js 18+ 
- npm 或 pnpm
- Git

### **1. 克隆项目**

```bash
git clone https://github.com/你的用户名/casewhr-platform.git
cd casewhr-platform
```

### **2. 安装依赖**

```bash
npm install
```

### **3. 配置环境变量**

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入实际值
nano .env
```

**必需的环境变量：**

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=sk-proj-...
```

### **4. 启动开发服务器**

```bash
npm run dev
```

访问 http://localhost:5173

### **5. 构建生产版本**

```bash
npm run build
npm run preview
```

---

## 📦 **快速部署**

### **部署到 Vercel（推荐）**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/你的用户名/casewhr-platform)

**或手动部署：**

1. **推送到 GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. **在 Vercel 导入项目**
   - 访问 https://vercel.com
   - 点击 "Add New" → "Project"
   - 选择 GitHub 仓库
   - 配置环境变量
   - 点击 "Deploy"

3. **绑定域名**
   - Settings → Domains
   - 添加 casewhr.com
   - 配置 DNS 记录

**详细指南：**
- 📖 [快速部署指南](./QUICK_DEPLOY.md) - 30 分钟上线
- 📖 [完整部署教程](./DEPLOYMENT_GUIDE.md) - 详细步骤
- 📖 [环境变量配置](./ENV_VARIABLES_GUIDE.md) - API Keys 获取

---

## 📚 **文档**

### **部署文档**
- [README_DEPLOYMENT.md](./README_DEPLOYMENT.md) - 部署总览
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - 快速部署（30 分钟）
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 完整部署指南
- [FILE_EXPORT_CHECKLIST.md](./FILE_EXPORT_CHECKLIST.md) - 文件导出清单
- [ENV_VARIABLES_GUIDE.md](./ENV_VARIABLES_GUIDE.md) - 环境变量配置

### **功能文档**
- [COMPLETE_FEATURE_STATUS.md](./COMPLETE_FEATURE_STATUS.md) - 功能完整度报告
- [FEATURE_VERIFICATION_GUIDE.md](./FEATURE_VERIFICATION_GUIDE.md) - 功能验证指南
- [EMAIL_TEST_VERIFICATION.md](./EMAIL_TEST_VERIFICATION.md) - 邮件测试指南
- [QUICK_EMAIL_TEST_GUIDE.md](./QUICK_EMAIL_TEST_GUIDE.md) - 快速邮件测试

---

## 🔧 **开发指南**

### **脚本命令**

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run preview          # 预览生产版本

# 部署
vercel                   # 部署到 Vercel（预览）
vercel --prod            # 部署到生产环境

# Supabase
supabase functions deploy make-server-215f78a5  # 部署 Edge Functions
supabase secrets set KEY=value                   # 设置后端环境变量
```

### **代码规范**

- ✅ 使用 TypeScript 进行类型检查
- ✅ 遵循 React Hooks 规范
- ✅ 组件采用函数式编程
- ✅ 使用 Tailwind CSS 进行样式管理
- ✅ 避免内联样式

### **组件命名**

```typescript
// ✅ 好的命名
export function UserProfile() { }
export function ProjectCard() { }

// ❌ 不好的命名
export function profile() { }
export function card() { }
```

---

## 🌍 **多语言支持**

平台支持三种语言，通过 `lib/translations.ts` 管理：

```typescript
import { useLanguage } from './lib/LanguageContext';

function MyComponent() {
  const { language } = useLanguage();
  
  const text = {
    en: { title: 'Welcome' },
    'zh-TW': { title: '歡迎' },
    'zh-CN': { title: '欢迎' }
  };
  
  return <h1>{text[language].title}</h1>;
}
```

---

## 💰 **成本估算**

### **免费方案（推荐初创）**

| 服务 | 免费额度 | 费用 |
|------|---------|------|
| Vercel | 100 GB/月 | $0 |
| Supabase | 500 MB 数据库 | $0 |
| GitHub | 无限私有仓库 | $0 |
| Cloudflare | 无限带宽 | $0 |
| **总计** | - | **$0/月** |

### **增长方案**

| 服务 | 方案 | 费用 |
|------|------|------|
| Vercel Pro | 更多带宽 | $20/月 |
| Supabase Pro | 8 GB 数据库 | $25/月 |
| OpenAI | API 使用 | ~$10-20/月 |
| Brevo | 邮件服务 | $0 (300封/天) |
| **总计** | - | **~$55-65/月** |

---

## 🔒 **安全性**

- ✅ Row Level Security (RLS) 数据保护
- ✅ HTTPS 加密传输
- ✅ OAuth 2.0 安全登录
- ✅ CSRF 保护
- ✅ XSS 防护
- ✅ SQL 注入防护
- ✅ 环境变量隔离
- ✅ API Key 轮换机制

---

## 📊 **性能优化**

- ⚡ **Vite 构建**：快速热更新
- 🎯 **代码分割**：按需加载
- 🖼️ **图片优化**：懒加载 + WebP
- 💾 **缓存策略**：浏览器缓存 + CDN
- 📦 **Tree Shaking**：移除未使用代码
- 🔄 **Virtual List**：大列表虚拟滚动

**目标性能指标：**
- Google PageSpeed: 90+
- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3.5s

---

## 🤝 **贡献指南**

欢迎贡献！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

## 📄 **许可证**

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 👥 **团队**

- **创始人**: David Lai
- **技术栈**: React + TypeScript + Supabase
- **支持**: AI-powered development

---

## 📞 **联系方式**

- 🌐 官网: https://casewhr.com
- 📧 邮箱: support@casewhr.com
- 💬 反馈: [GitHub Issues](https://github.com/你的用户名/casewhr-platform/issues)

---

## 🙏 **致谢**

感谢以下开源项目：

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Supabase](https://supabase.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
- [OpenAI](https://openai.com)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by CaseWHR Team

[返回顶部](#-casewhr---全球专业接案平台)

</div>
