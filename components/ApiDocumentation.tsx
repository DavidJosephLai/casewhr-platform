import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Code, 
  Book, 
  Zap, 
  Lock, 
  Search, 
  Copy, 
  Check,
  ExternalLink,
  Terminal,
  FileJson,
  Shield,
  Globe,
  Briefcase,
  FileText,
  DollarSign,
  Mail,
  Users,
  Settings,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

export function ApiDocumentation() {
  const { language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const baseUrl = 'https://{projectId}.supabase.co/functions/v1/make-server-215f78a5';

  const translations = {
    en: {
      title: 'API Documentation',
      subtitle: 'Complete reference for CaseWHR Platform API',
      version: 'Version 2.0.5',
      search: 'Search endpoints...',
      categories: {
        overview: 'Overview',
        authentication: 'Authentication',
        projects: 'Projects',
        proposals: 'Proposals',
        payments: 'Payments',
        invoices: 'Invoices & Receipts',
        messaging: 'Messaging',
        users: 'Users',
        admin: 'Admin',
        seo: 'SEO & Analytics',
      },
      overview: {
        title: 'API Overview',
        description: 'CaseWHR provides a RESTful API for managing freelance projects, proposals, payments, and more.',
        baseUrl: 'Base URL',
        authentication: 'Authentication',
        authDescription: 'All API requests require authentication using a Bearer token obtained from Supabase Auth.',
        rateLimit: 'Rate Limiting',
        rateLimitDescription: 'API requests are limited to 100 requests per minute per user.',
        support: 'Support',
        supportDescription: 'For API support, contact: api@casewhr.com',
      },
      quickStart: {
        title: 'Quick Start',
        step1: '1. Sign up at casewhr.com',
        step2: '2. Obtain your access token via Supabase Auth',
        step3: '3. Make your first API call',
        example: 'Example Request',
      },
      responseFormats: {
        title: 'Response Formats',
        success: 'Success Response',
        error: 'Error Response',
      },
      currencies: {
        title: 'Multi-Currency Support',
        description: 'All amounts are stored in USD and automatically converted to TWD or CNY based on user preference.',
        rates: 'Current Exchange Rates',
      },
      copied: 'Copied to clipboard',
      copyCode: 'Copy code',
    },
    'zh-TW': {
      title: 'API 說明文檔',
      subtitle: 'CaseWHR 平台 API 完整參考',
      version: '版本 2.0.5',
      search: '搜尋端點...',
      categories: {
        overview: '概覽',
        authentication: '認證',
        projects: '專案',
        proposals: '提案',
        payments: '付款',
        invoices: '發票與收據',
        messaging: '訊息',
        users: '用戶',
        admin: '管理員',
        seo: 'SEO 與分析',
      },
      overview: {
        title: 'API 概覽',
        description: 'CaseWHR 提供 RESTful API 用於管理自由接案專案、提案、付款等功能。',
        baseUrl: '基礎 URL',
        authentication: '認證方式',
        authDescription: '所有 API 請求需要使用從 Supabase Auth 獲取的 Bearer Token 進行認證。',
        rateLimit: '速率限制',
        rateLimitDescription: '每個用戶每分鐘最多可發送 100 個 API 請求。',
        support: '技術支援',
        supportDescription: 'API 技術支援請聯絡：api@casewhr.com',
      },
      quickStart: {
        title: '快速開始',
        step1: '1. 在 casewhr.com 註冊',
        step2: '2. 通過 Supabase Auth 獲取存取令牌',
        step3: '3. 發送您的第一個 API 請求',
        example: '範例請求',
      },
      responseFormats: {
        title: '回應格式',
        success: '成功回應',
        error: '錯誤回應',
      },
      currencies: {
        title: '多幣別支援',
        description: '所有金額以美元（USD）儲存，並根據用戶偏好自動轉換為新台幣（TWD）或人民幣（CNY）。',
        rates: '當前匯率',
      },
      copied: '已複製到剪貼簿',
      copyCode: '複製程式碼',
    },
    'zh-CN': {
      title: 'API 说明文档',
      subtitle: 'CaseWHR 平台 API 完整参考',
      version: '版本 2.0.5',
      search: '搜寻端点...',
      categories: {
        overview: '概览',
        authentication: '认证',
        projects: '项目',
        proposals: '提案',
        payments: '付款',
        invoices: '发票与收据',
        messaging: '消息',
        users: '用户',
        admin: '管理员',
        seo: 'SEO 与分析',
      },
      overview: {
        title: 'API 概览',
        description: 'CaseWHR 提供 RESTful API 用于管理自由接案项目、提案、付款等功能。',
        baseUrl: '基础 URL',
        authentication: '认证方式',
        authDescription: '所有 API 请求需要使用从 Supabase Auth 获取的 Bearer Token 进行认证。',
        rateLimit: '速率限制',
        rateLimitDescription: '每个用户每分钟最多可发送 100 个 API 请求。',
        support: '技术支持',
        supportDescription: 'API 技术支持请联络：api@casewhr.com',
      },
      quickStart: {
        title: '快速开始',
        step1: '1. 在 casewhr.com 注册',
        step2: '2. 通过 Supabase Auth 获取访问令牌',
        step3: '3. 发送您的第一个 API 请求',
        example: '范例请求',
      },
      responseFormats: {
        title: '响应格式',
        success: '成功响应',
        error: '错误响应',
      },
      currencies: {
        title: '多币别支持',
        description: '所有金额以美元（USD）储存，并根据用户偏好自动转换为新台币（TWD）或人民币（CNY）。',
        rates: '当前汇率',
      },
      copied: '已复制到剪贴板',
      copyCode: '复制代码',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  const apiEndpoints = {
    projects: [
      {
        method: 'POST',
        path: '/projects',
        title: language === 'en' ? 'Create Project' : language === 'zh-CN' ? '创建项目' : '建立專案',
        description: language === 'en' ? 'Create a new project' : language === 'zh-CN' ? '创建新项目' : '建立新專案',
        auth: true,
        body: {
          title: 'string',
          description: 'string',
          budget: 'number',
          currency: 'USD | TWD | CNY',
          deadline: 'string (ISO 8601)',
        },
      },
      {
        method: 'GET',
        path: '/projects',
        title: language === 'en' ? 'List Projects' : language === 'zh-CN' ? '列出项目' : '列出專案',
        description: language === 'en' ? 'Get all projects with optional filters' : language === 'zh-CN' ? '获取所有项目（可选过滤）' : '取得所有專案（可選篩選）',
        auth: true,
        params: {
          status: 'open | in_progress | completed',
          client_id: 'string',
          page: 'number',
        },
      },
      {
        method: 'GET',
        path: '/projects/:id',
        title: language === 'en' ? 'Get Project' : language === 'zh-CN' ? '获取项目' : '取得專案',
        description: language === 'en' ? 'Get project details by ID' : language === 'zh-CN' ? '通过 ID 获取项目详情' : '透過 ID 取得專案詳情',
        auth: true,
      },
      {
        method: 'PUT',
        path: '/projects/:id',
        title: language === 'en' ? 'Update Project' : language === 'zh-CN' ? '更新项目' : '更新專案',
        description: language === 'en' ? 'Update project information' : language === 'zh-CN' ? '更新项目信息' : '更新專案資訊',
        auth: true,
      },
      {
        method: 'DELETE',
        path: '/projects/:id',
        title: language === 'en' ? 'Delete Project' : language === 'zh-CN' ? '删除项目' : '刪除專案',
        description: language === 'en' ? 'Delete a project' : language === 'zh-CN' ? '删除项目' : '刪除專案',
        auth: true,
      },
    ],
    proposals: [
      {
        method: 'POST',
        path: '/proposals',
        title: language === 'en' ? 'Submit Proposal' : language === 'zh-CN' ? '提交提案' : '提交提案',
        description: language === 'en' ? 'Submit a proposal for a project' : language === 'zh-CN' ? '为项目提交提案' : '為專案提交提案',
        auth: true,
        body: {
          project_id: 'string',
          cover_letter: 'string',
          proposed_budget: 'number',
          estimated_duration: 'number',
        },
      },
      {
        method: 'GET',
        path: '/proposals/project/:projectId',
        title: language === 'en' ? 'Get Project Proposals' : language === 'zh-CN' ? '获取项目提案' : '取得專案提案',
        description: language === 'en' ? 'Get all proposals for a project' : language === 'zh-CN' ? '获取项目的所有提案' : '取得專案的所有提案',
        auth: true,
      },
      {
        method: 'GET',
        path: '/proposals/user/:userId',
        title: language === 'en' ? 'Get User Proposals' : language === 'zh-CN' ? '获取用户提案' : '取得用戶提案',
        description: language === 'en' ? 'Get all proposals by a user' : language === 'zh-CN' ? '获取用户的所有提案' : '取得用戶的所有提案',
        auth: true,
      },
      {
        method: 'POST',
        path: '/proposals/:id/accept',
        title: language === 'en' ? 'Accept Proposal' : language === 'zh-CN' ? '接受提案' : '接受提案',
        description: language === 'en' ? 'Accept a proposal' : language === 'zh-CN' ? '接受提案' : '接受提案',
        auth: true,
      },
      {
        method: 'POST',
        path: '/proposals/:id/reject',
        title: language === 'en' ? 'Reject Proposal' : language === 'zh-CN' ? '拒绝提案' : '拒絕提案',
        description: language === 'en' ? 'Reject a proposal' : language === 'zh-CN' ? '拒绝提案' : '拒絕提案',
        auth: true,
      },
    ],
    payments: [
      {
        method: 'POST',
        path: '/paypal/create-order',
        title: language === 'en' ? 'Create PayPal Order' : language === 'zh-CN' ? '创建 PayPal 订单' : '建立 PayPal 訂單',
        description: language === 'en' ? 'Create a PayPal payment order' : language === 'zh-CN' ? '创建 PayPal 付款订单' : '建立 PayPal 付款訂單',
        auth: true,
        body: {
          amount: 'number',
          currency: 'USD | TWD | CNY',
        },
      },
      {
        method: 'POST',
        path: '/paypal/capture-payment',
        title: language === 'en' ? 'Capture PayPal Payment' : language === 'zh-CN' ? '捕获 PayPal 付款' : '捕獲 PayPal 付款',
        description: language === 'en' ? 'Capture a PayPal payment' : language === 'zh-CN' ? '捕获 PayPal 付款' : '捕獲 PayPal 付款',
        auth: true,
        body: {
          orderId: 'string',
        },
      },
      {
        method: 'POST',
        path: '/ecpay/create-payment',
        title: language === 'en' ? 'Create ECPay Order' : language === 'zh-CN' ? '创建绿界订单' : '建立綠界訂單',
        description: language === 'en' ? 'Create an ECPay payment order' : language === 'zh-CN' ? '创建绿界付款订单' : '建立綠界付款訂單',
        auth: true,
        body: {
          amount: 'number',
          payment_method: 'Credit | ATM | CVS',
        },
      },
      {
        method: 'GET',
        path: '/wallet/balance',
        title: language === 'en' ? 'Get Wallet Balance' : language === 'zh-CN' ? '获取钱包余额' : '取得錢包餘額',
        description: language === 'en' ? 'Get user wallet balance' : language === 'zh-CN' ? '获取用户钱包余额' : '取得用戶錢包餘額',
        auth: true,
      },
    ],
    invoices: [
      {
        method: 'GET',
        path: '/unified-invoices',
        title: language === 'en' ? 'List Invoices & Receipts' : language === 'zh-CN' ? '列出发票与收据' : '列出發票與收據',
        description: language === 'en' ? 'Get all invoices and receipts' : language === 'zh-CN' ? '获取所有发票和收据' : '取得所有發票和收據',
        auth: true,
      },
      {
        method: 'GET',
        path: '/unified-invoices/stats',
        title: language === 'en' ? 'Invoice Statistics' : language === 'zh-CN' ? '发票统计' : '發票統計',
        description: language === 'en' ? 'Get invoice statistics' : language === 'zh-CN' ? '获取发票统计数据' : '取得發票統計資料',
        auth: true,
      },
      {
        method: 'GET',
        path: '/unified-invoices/:id/download',
        title: language === 'en' ? 'Download Invoice' : language === 'zh-CN' ? '下载发票' : '下載發票',
        description: language === 'en' ? 'Download invoice as PDF' : language === 'zh-CN' ? '下载发票 PDF' : '下載發票 PDF',
        auth: true,
      },
    ],
    users: [
      {
        method: 'POST',
        path: '/signup',
        title: language === 'en' ? 'Sign Up' : language === 'zh-CN' ? '注册' : '註冊',
        description: language === 'en' ? 'Create a new user account' : language === 'zh-CN' ? '创建新用户账户' : '建立新用戶帳戶',
        auth: false,
        body: {
          email: 'string',
          password: 'string',
          name: 'string',
          account_type: 'client | freelancer | both',
        },
      },
      {
        method: 'GET',
        path: '/profile/:userId',
        title: language === 'en' ? 'Get User Profile' : language === 'zh-CN' ? '获取用户资料' : '取得用戶資料',
        description: language === 'en' ? 'Get user profile information' : language === 'zh-CN' ? '获取用户资料信息' : '取得用戶資料資訊',
        auth: true,
      },
      {
        method: 'POST',
        path: '/password-reset/send-otp',
        title: language === 'en' ? 'Send Password Reset OTP' : language === 'zh-CN' ? '发送重设密码 OTP' : '發送重設密碼 OTP',
        description: language === 'en' ? 'Send OTP for password reset' : language === 'zh-CN' ? '发送重设密码的 OTP' : '發送重設密碼的 OTP',
        auth: false,
        body: {
          email: 'string',
          language: 'en | zh-TW | zh-CN',
        },
      },
    ],
    seo: [
      {
        method: 'GET',
        path: '/sitemap.xml',
        title: language === 'en' ? 'Get Sitemap' : language === 'zh-CN' ? '获取站点地图' : '取得網站地圖',
        description: language === 'en' ? 'Get XML sitemap for SEO' : language === 'zh-CN' ? '获取 SEO 的 XML 站点地图' : '取得 SEO 的 XML 網站地圖',
        auth: false,
      },
      {
        method: 'GET',
        path: '/robots.txt',
        title: language === 'en' ? 'Get Robots.txt' : language === 'zh-CN' ? '获取 Robots.txt' : '取得 Robots.txt',
        description: language === 'en' ? 'Get robots.txt file' : language === 'zh-CN' ? '获取 robots.txt 文件' : '取得 robots.txt 檔案',
        auth: false,
      },
      {
        method: 'POST',
        path: '/ai-seo/generate-report',
        title: language === 'en' ? 'Generate SEO Report' : language === 'zh-CN' ? '生成 SEO 报告' : '生成 SEO 報告',
        description: language === 'en' ? 'Generate AI-powered SEO analysis' : language === 'zh-CN' ? '生成 AI 驱动的 SEO 分析' : '生成 AI 驅動的 SEO 分析',
        auth: true,
        body: {
          url: 'string',
        },
      },
    ],
  };

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    toast.success(t.copied);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const renderMethodBadge = (method: string) => {
    const colors = {
      GET: 'bg-blue-100 text-blue-800 border-blue-200',
      POST: 'bg-green-100 text-green-800 border-green-200',
      PUT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      DELETE: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <Badge className={colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {method}
      </Badge>
    );
  };

  const renderEndpointCard = (endpoint: any) => {
    const fullUrl = `${baseUrl}${endpoint.path}`;
    
    return (
      <Card key={endpoint.path} className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {renderMethodBadge(endpoint.method)}
                {endpoint.auth && (
                  <Badge variant="outline" className="border-purple-300 text-purple-700">
                    <Lock className="h-3 w-3 mr-1" />
                    {language === 'en' ? 'Auth Required' : language === 'zh-CN' ? '需要认证' : '需要認證'}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{endpoint.title}</CardTitle>
              <CardDescription className="mt-1">{endpoint.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Endpoint URL */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  {language === 'en' ? 'Endpoint' : language === 'zh-CN' ? '端点' : '端點'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(fullUrl, endpoint.path)}
                  className="h-6 px-2"
                >
                  {copiedEndpoint === endpoint.path ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <code className="text-sm text-gray-800 break-all">
                {endpoint.method} {fullUrl}
              </code>
            </div>

            {/* Request Body */}
            {endpoint.body && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-blue-700 uppercase tracking-wide mb-2">
                  {language === 'en' ? 'Request Body' : language === 'zh-CN' ? '请求主体' : '請求主體'}
                </div>
                <pre className="text-xs text-blue-900 overflow-x-auto">
                  {JSON.stringify(endpoint.body, null, 2)}
                </pre>
              </div>
            )}

            {/* Query Parameters */}
            {endpoint.params && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="text-xs text-purple-700 uppercase tracking-wide mb-2">
                  {language === 'en' ? 'Query Parameters' : language === 'zh-CN' ? '查询参数' : '查詢參數'}
                </div>
                <pre className="text-xs text-purple-900 overflow-x-auto">
                  {JSON.stringify(endpoint.params, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Book className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900">{t.title}</h1>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>
        </div>
        <Badge variant="outline" className="border-blue-300 text-blue-700">
          {t.version}
        </Badge>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9 bg-blue-50 mb-6">
          <TabsTrigger value="overview">
            <Zap className="h-4 w-4 mr-1" />
            {t.categories.overview}
          </TabsTrigger>
          <TabsTrigger value="authentication">
            <Lock className="h-4 w-4 mr-1" />
            {t.categories.authentication}
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Briefcase className="h-4 w-4 mr-1" />
            {t.categories.projects}
          </TabsTrigger>
          <TabsTrigger value="proposals">
            <FileText className="h-4 w-4 mr-1" />
            {t.categories.proposals}
          </TabsTrigger>
          <TabsTrigger value="payments">
            <DollarSign className="h-4 w-4 mr-1" />
            {t.categories.payments}
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileJson className="h-4 w-4 mr-1" />
            {t.categories.invoices}
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-1" />
            {t.categories.users}
          </TabsTrigger>
          <TabsTrigger value="seo">
            <TrendingUp className="h-4 w-4 mr-1" />
            {t.categories.seo}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t.overview.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{t.overview.description}</p>

                {/* Base URL */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{t.overview.baseUrl}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(baseUrl, 'baseUrl')}
                    >
                      {copiedEndpoint === 'baseUrl' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <code className="text-sm text-blue-600">{baseUrl}</code>
                </div>

                {/* Authentication */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    {t.overview.authentication}
                  </h3>
                  <p className="text-gray-600 mb-3">{t.overview.authDescription}</p>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <code className="text-sm text-purple-900">
                      Authorization: Bearer {'<your_access_token>'}
                    </code>
                  </div>
                </div>

                {/* Quick Start */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t.quickStart.title}</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-gray-600">{t.quickStart.step1}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="text-gray-600">{t.quickStart.step2}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <p className="text-gray-600">{t.quickStart.step3}</p>
                    </div>
                  </div>
                </div>

                {/* Example Request */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t.quickStart.example}</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-green-400">
{`curl -X GET "${baseUrl}/projects" \\
  -H "Authorization: Bearer <your_access_token>" \\
  -H "Content-Type: application/json"`}
                    </pre>
                  </div>
                </div>

                {/* Multi-Currency */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    {t.currencies.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{t.currencies.description}</p>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="text-xs text-green-700 uppercase tracking-wide mb-2">
                      {t.currencies.rates}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">USD → TWD:</span>
                        <span className="ml-2 font-semibold text-green-900">31.5</span>
                      </div>
                      <div>
                        <span className="text-gray-600">USD → CNY:</span>
                        <span className="ml-2 font-semibold text-green-900">7.2</span>
                      </div>
                      <div>
                        <span className="text-gray-600">TWD → CNY:</span>
                        <span className="ml-2 font-semibold text-green-900">0.23</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Response Formats */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t.responseFormats.title}</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-green-700 mb-1">{t.responseFormats.success}</div>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-xs text-green-400">
{`{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}`}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-red-700 mb-1">{t.responseFormats.error}</div>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-xs text-red-400">
{`{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Authentication Tab */}
        <TabsContent value="authentication">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t.categories.authentication}
              </CardTitle>
              <CardDescription>
                {t.overview.authDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">
                    {language === 'en' ? 'Authentication Header' : language === 'zh-CN' ? '认证标头' : '認證標頭'}
                  </h4>
                  <code className="text-sm text-purple-800">
                    Authorization: Bearer {'<access_token>'}
                  </code>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    {language === 'en' ? 'Obtain Access Token' : language === 'zh-CN' ? '获取访问令牌' : '取得存取令牌'}
                  </h4>
                  <p className="text-sm text-blue-800">
                    {language === 'en' 
                      ? 'Use Supabase Auth to sign in and obtain your access token.' 
                      : language === 'zh-CN'
                      ? '使用 Supabase Auth 登录并获取访问令牌。'
                      : '使用 Supabase Auth 登入並取得存取令牌。'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <div className="space-y-4">
            {apiEndpoints.projects.map(renderEndpointCard)}
          </div>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals">
          <div className="space-y-4">
            {apiEndpoints.proposals.map(renderEndpointCard)}
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="space-y-4">
            {apiEndpoints.payments.map(renderEndpointCard)}
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <div className="space-y-4">
            {apiEndpoints.invoices.map(renderEndpointCard)}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="space-y-4">
            {apiEndpoints.users.map(renderEndpointCard)}
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo">
          <div className="space-y-4">
            {apiEndpoints.seo.map(renderEndpointCard)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card className="mt-8 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">{t.overview.support}</h4>
              <p className="text-sm text-blue-700">{t.overview.supportDescription}</p>
              <Button
                variant="link"
                className="text-blue-600 hover:text-blue-800 p-0 h-auto mt-2"
                onClick={() => window.location.href = 'mailto:api@casewhr.com'}
              >
                api@casewhr.com
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
