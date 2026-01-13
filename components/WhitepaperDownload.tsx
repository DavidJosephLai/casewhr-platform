/**
 * Whitepaper Download Component
 * 白皮書下載組件 - 提供平台白皮書下載
 */

import React, { useState } from 'react';
import { Download, FileText, Mail, User, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function WhitepaperDownload() {
  const { language } = useLanguage();
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
  });

  const content = {
    en: {
      title: 'Download Our Whitepaper',
      subtitle: 'Learn about our platform technology, vision, and roadmap',
      cta: 'Download Whitepaper',
      dialogTitle: 'Get the CaseWhr Whitepaper',
      dialogDescription: 'Enter your details to download our comprehensive platform whitepaper',
      formLabels: {
        name: 'Full Name',
        email: 'Email Address',
        company: 'Company (Optional)',
      },
      placeholders: {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Your Company',
      },
      submit: 'Download Now',
      submitting: 'Processing...',
      cancel: 'Cancel',
      success: 'Whitepaper downloaded successfully!',
      error: 'Failed to download. Please try again.',
      features: [
        'Platform Architecture & Technology Stack',
        'Multi-Currency System Design',
        'AI-Powered Project Matching Algorithm',
        'Security & Escrow System',
        'Enterprise Solutions Overview',
        'Future Roadmap & Vision',
      ],
      stats: {
        pages: '50+ Pages',
        updated: 'Updated Jan 2026',
        format: 'PDF Format',
      },
    },
    'zh-TW': {
      title: '下載平台白皮書',
      subtitle: '深入了解我們的平台技術、願景與發展藍圖',
      cta: '下載白皮書',
      dialogTitle: '獲取接得準白皮書',
      dialogDescription: '填寫您的資訊以下載我們的完整平台白皮書',
      formLabels: {
        name: '姓名',
        email: '電子郵件',
        company: '公司名稱（選填）',
      },
      placeholders: {
        name: '王小明',
        email: 'wang@example.com',
        company: '您的公司',
      },
      submit: '立即下載',
      submitting: '處理中...',
      cancel: '取消',
      success: '白皮書下載成功！',
      error: '下載失敗，請重試。',
      features: [
        '平台架構與技術堆疊',
        '多幣計價系統設計',
        'AI 智能專案配對演算法',
        '安全性與託管系統',
        '企業級解決方案概覽',
        '未來發展藍圖與願景',
      ],
      stats: {
        pages: '50+ 頁',
        updated: '2026年1月更新',
        format: 'PDF 格式',
      },
    },
    'zh-CN': {
      title: '下载平台白皮书',
      subtitle: '深入了解我们的平台技术、愿景与发展蓝图',
      cta: '下载白皮书',
      dialogTitle: '获取接得准白皮书',
      dialogDescription: '填写您的信息以下载我们的完整平台白皮书',
      formLabels: {
        name: '姓名',
        email: '电子邮箱',
        company: '公司名称（选填）',
      },
      placeholders: {
        name: '王小明',
        email: 'wang@example.com',
        company: '您的公司',
      },
      submit: '立即下载',
      submitting: '处理中...',
      cancel: '取消',
      success: '白皮书下载成功！',
      error: '下载失败，请重试。',
      features: [
        '平台架构与技术堆栈',
        '多币计价系统设计',
        'AI 智能项目配对算法',
        '安全性与托管系统',
        '企业级解决方案概览',
        '未来发展蓝图与愿景',
      ],
      stats: {
        pages: '50+ 页',
        updated: '2026年1月更新',
        format: 'PDF 格式',
      },
    },
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error(
        language === 'en'
          ? 'Please fill in all required fields'
          : '請填寫所有必填欄位'
      );
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(
        language === 'en'
          ? 'Please enter a valid email address'
          : '請輸入有效的電子郵件地址'
      );
      return;
    }

    try {
      setLoading(true);

      // Log whitepaper download request
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/whitepaper-download`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            company: formData.company || 'N/A',
            language,
            downloaded_at: new Date().toISOString(),
          }),
        }
      );

      // Generate HTML whitepaper (supports Chinese perfectly)
      const htmlContent = generateHTMLWhitepaper(language);
      
      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CaseWhr-Whitepaper-${language.toUpperCase()}-2026.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t.success);
      setShowDialog(false);
      setFormData({ name: '', email: '', company: '' });
    } catch (error) {
      console.error('Error downloading whitepaper:', error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const generateHTMLWhitepaper = (lang: string) => {
    if (lang === 'en') {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CaseWhr Platform Whitepaper</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      width: 80%;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    h1, h2, h3, h4, h5, h6 {
      color: #333;
    }
    p {
      color: #666;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 10px;
    }
    .header h2 {
      font-size: 14px;
      color: #999;
    }
    .toc {
      margin-bottom: 20px;
    }
    .toc h2 {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .toc p {
      margin: 0;
      margin-bottom: 3px;
    }
    .chapter {
      margin-bottom: 20px;
    }
    .chapter h2 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .chapter p {
      margin: 0;
      margin-bottom: 3px;
    }
    .chapter ul {
      margin: 0;
      padding-left: 20px;
    }
    .chapter ul li {
      margin-bottom: 3px;
    }
    .conclusion {
      margin-bottom: 20px;
    }
    .conclusion h2 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .conclusion p {
      margin: 0;
      margin-bottom: 3px;
    }
    .contact {
      margin-bottom: 20px;
    }
    .contact h2 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .contact p {
      margin: 0;
      margin-bottom: 3px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CASEWHR PLATFORM WHITEPAPER</h1>
      <h2>January 2026</h2>
    </div>
    <div class="toc">
      <h2>TABLE OF CONTENTS</h2>
      <p>1. Executive Summary</p>
      <p>2. Platform Architecture & Technology Stack</p>
      <p>3. Multi-Currency System Design</p>
      <p>4. AI-Powered Project Matching Algorithm</p>
      <p>5. Security & Escrow System</p>
      <p>6. Enterprise Solutions Overview</p>
      <p>7. Future Roadmap & Vision</p>
    </div>
    <div class="chapter">
      <h2>1. EXECUTIVE SUMMARY</h2>
      <p>CaseWhr is a next-generation global freelance platform designed to connect businesses with talented professionals worldwide. Our platform addresses the key pain points of traditional freelance marketplaces through innovative technology and user-centric design.</p>
      <p>Key Differentiators:</p>
      <ul>
        <li>Multi-currency support (USD, TWD, CNY)</li>
        <li>Low service fees (5-10% vs industry standard 20%)</li>
        <li>AI-powered project matching</li>
        <li>Same-day withdrawal capability</li>
        <li>Enterprise-grade solutions with custom branding</li>
      </ul>
    </div>
    <div class="chapter">
      <h2>2. PLATFORM ARCHITECTURE & TECHNOLOGY STACK</h2>
      <p>Frontend: React + TypeScript for type-safe development, Tailwind CSS v4 for modern responsive design, Real-time updates with WebSocket connections</p>
      <p>Backend: Supabase for database and authentication, Edge Functions for serverless API endpoints, PostgreSQL for reliable data storage</p>
      <p>Payment Infrastructure: Stripe for international payments, PayPal for global transactions, ECPay for Taiwan market, Bank transfer integration for local payments</p>
    </div>
    <div class="chapter">
      <h2>3. MULTI-CURRENCY SYSTEM DESIGN</h2>
      <p>Our innovative multi-currency system allows users to work in their preferred currency while maintaining platform-wide consistency.</p>
      <ul>
        <li>Storage: All transactions stored in USD (base currency)</li>
        <li>Display: Automatic conversion to user preferred currency (USD/TWD/CNY)</li>
        <li>Rates: Real-time exchange rates with daily updates</li>
        <li>Transparency: Clear fee breakdown in all currencies</li>
      </ul>
    </div>
    <div class="chapter">
      <h2>4. AI-POWERED PROJECT MATCHING ALGORITHM</h2>
      <p>Our proprietary AI matching algorithm analyzes: Freelancer skills and expertise, Project requirements and complexity, Historical performance data, Client preferences and feedback, Timezone and language compatibility.</p>
      <p>Result: 85% higher project success rate compared to manual matching</p>
    </div>
    <div class="chapter">
      <h2>5. SECURITY & ESCROW SYSTEM</h2>
      <p>Security Features: KYC verification for all users, Two-factor authentication (2FA), Encrypted data transmission, Regular security audits</p>
      <p>Escrow System: Client funds held securely until project completion, Milestone-based release system, Dispute resolution mechanism, Same-day withdrawal for completed projects</p>
    </div>
    <div class="chapter">
      <h2>6. ENTERPRISE SOLUTIONS OVERVIEW</h2>
      <p>Our Enterprise tier offers: Custom branding and white-label options, Dedicated account manager, Priority support (24/7), Advanced analytics and reporting, Team management tools, Custom integration capabilities</p>
      <p>Ideal for: Agencies, consulting firms, and businesses with ongoing freelance needs</p>
    </div>
    <div class="chapter">
      <h2>7. FUTURE ROADMAP & VISION</h2>
      <p>Q1 2026: Cryptocurrency payment integration, Mobile app launch (iOS & Android), Advanced AI project recommendations</p>
      <p>Q2 2026: Blockchain-based reputation system, Global talent certification program, Video consultation features</p>
      <p>Q3 2026: Marketplace for digital products, Automated contract generation, Multi-language AI translation</p>
      <p>Q4 2026: Decentralized identity verification, Smart contract automation, Global expansion to 50+ countries</p>
    </div>
    <div class="conclusion">
      <h2>CONCLUSION</h2>
      <p>CaseWhr is positioned to become the leading global freelance platform by combining cutting-edge technology with user-focused features. Our commitment to transparency, security, and innovation sets us apart in the competitive freelance marketplace.</p>
    </div>
    <div class="contact">
      <h2>Contact</h2>
      <p>Email: support@casewhr.com</p>
      <p>Website: https://casewhr.com</p>
      <p>Version: 1.0 | Updated: January 2026</p>
    </div>
  </div>
</body>
</html>
`;
    } else {
      return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>接得準平台白皮書</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      width: 80%;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    h1, h2, h3, h4, h5, h6 {
      color: #333;
    }
    p {
      color: #666;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 10px;
    }
    .header h2 {
      font-size: 14px;
      color: #999;
    }
    .toc {
      margin-bottom: 20px;
    }
    .toc h2 {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .toc p {
      margin: 0;
      margin-bottom: 3px;
    }
    .chapter {
      margin-bottom: 20px;
    }
    .chapter h2 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .chapter p {
      margin: 0;
      margin-bottom: 3px;
    }
    .chapter ul {
      margin: 0;
      padding-left: 20px;
    }
    .chapter ul li {
      margin-bottom: 3px;
    }
    .conclusion {
      margin-bottom: 20px;
    }
    .conclusion h2 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .conclusion p {
      margin: 0;
      margin-bottom: 3px;
    }
    .contact {
      margin-bottom: 20px;
    }
    .contact h2 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .contact p {
      margin: 0;
      margin-bottom: 3px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>接得準平台白皮書</h1>
      <h2>2026 年 1 月</h2>
    </div>
    <div class="toc">
      <h2>目錄</h2>
      <p>1. 執行摘要</p>
      <p>2. 平台架構與技術堆疊</p>
      <p>3. 多幣計價系統設計</p>
      <p>4. AI 智能專案配對演算法</p>
      <p>5. 安全性與託管系統</p>
      <p>6. 企業級解決方案概覽</p>
      <p>7. 未來發展藍圖與願景</p>
    </div>
    <div class="chapter">
      <h2>1. 執行摘要</h2>
      <p>接得準（CaseWhr）是新一代全球接案平台，旨在連接全球企業與專業人才。我們的平台透過創新技術和以用戶為中心的設計，解決了傳統接案市場的關鍵痛點。</p>
      <p>核心優勢：</p>
      <ul>
        <li>多幣計價支援（USD、TWD、CNY）</li>
        <li>低服務費（5-10% vs 業界標準 20%）</li>
        <li>AI 智能專案配對</li>
        <li>當日提款功能</li>
        <li>企業級解決方案與客製化品牌</li>
      </ul>
    </div>
    <div class="chapter">
      <h2>2. 平台架構與技術堆疊</h2>
      <p>前端技術：React + TypeScript 實現類型安全開發，Tailwind CSS v4 打造現代響應式設計，WebSocket 實現即時更新</p>
      <p>後端技術：Supabase 提供數庫和身份驗證，Edge Functions 實現無服務器 API，PostgreSQL 確保可靠的數據存儲</p>
      <p>支付基礎設施：Stripe 處理國際支付，PayPal 支援全球交易，ECPay 服務台灣市場，銀行轉帳整合本地支付</p>
    </div>
    <div class="chapter">
      <h2>3. 多幣計價系統設計</h2>
      <p>我們創新的多幣計價系統允許用戶使用偏好貨幣，同時保持平台一致性。</p>
      <ul>
        <li>存儲：所有交易以 USD（基準貨幣）存儲</li>
        <li>顯示：自動轉換為用戶偏好貨幣（USD/TWD/CNY）</li>
        <li>匯率：每日更新的即時匯率</li>
        <li>透明度：所有貨幣的清晰費用明細</li>
      </ul>
    </div>
    <div class="chapter">
      <h2>4. AI 智能專案配對演算法</h2>
      <p>我們專有的 AI 配對演算法分析：接案者技能與專業知識、專案需求與複雜度、歷史績效數據、客戶偏好與回饋、時區與語言相容性。</p>
      <p>結果：與手動配對相比，專案成功率提高 85%</p>
    </div>
    <div class="chapter">
      <h2>5. 安全性與託管系統</h2>
      <p>安全功能：所有用戶的 KYC 身份驗證、雙因素身份驗證（2FA）、加密數據傳輸、定期安全審計</p>
      <p>託管系統：客戶資金安全管至專案完成、里程碑式釋放系統、爭議解決機制、完成專案當日提款</p>
    </div>
    <div class="chapter">
      <h2>6. 企業級解決方案概覽</h2>
      <p>我們的企業版提供：客製化品牌與白標選項、專屬客戶經理、優先支援（24/7）、高級分析與報表、團隊管理工具、客製化整合功能。</p>
      <p>適合：代理商、諮詢公司及有持續接案需求的企業</p>
    </div>
    <div class="chapter">
      <h2>7. 未來發展藍圖與願景</h2>
      <p>2026 年第一季：加密貨幣支付整合、移動應用程式發布（iOS & Android）、高級 AI 專案推薦</p>
      <p>2026 年第二季：區塊鏈聲譽系統、全球人才認證計劃、視訊諮詢功能</p>
      <p>2026 年第三季：數位產品市場、自動化合約生成、多語言 AI 翻譯</p>
      <p>2026 年第四季：去中心化身份驗證、智能合約自動化、全球擴展至 50+ 國家</p>
    </div>
    <div class="conclusion">
      <h2>結論</h2>
      <p>接得準致力於結合尖端技術與用戶導向功能，成為領先的全球接案平台。我們對透明度、安全性和創新的承諾，讓我們在競爭激烈的接案市場中脫穎而出。</p>
    </div>
    <div class="contact">
      <h2>聯絡方式</h2>
      <p>Email: support@casewhr.com</p>
      <p>網站: https://casewhr.com</p>
      <p>版本: 1.0 | 更新日期: 2026 年 1 月</p>
    </div>
  </div>
</body>
</html>
`;
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Info */}
            <div className="p-8 lg:p-12 text-white">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-12 w-12" />
                <h2 className="text-3xl sm:text-4xl font-bold">
                  {t.title}
                </h2>
              </div>
              
              <p className="text-lg text-blue-100 mb-8">
                {t.subtitle}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold">{t.stats.pages}</div>
                  <div className="text-sm text-blue-100 mt-1">
                    {language === 'en' ? 'Comprehensive' : '內容豐富'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{t.stats.updated}</div>
                  <div className="text-sm text-blue-100 mt-1">
                    {language === 'en' ? 'Latest' : '最新版本'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{t.stats.format}</div>
                  <div className="text-sm text-blue-100 mt-1">
                    {language === 'en' ? 'Easy Read' : '易於閱讀'}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {t.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-100">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - CTA */}
            <div className="bg-white p-8 lg:p-12 flex flex-col justify-center">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                  <Download className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {language === 'en'
                    ? 'Get Your Free Copy'
                    : '獲取免費副本'}
                </h3>
                <p className="text-gray-600">
                  {language === 'en'
                    ? 'Download our comprehensive platform whitepaper and learn how we\'re revolutionizing the freelance industry.'
                    : '下載我們的完整平台白皮書，了解我們如何革新接案產業。'}
                </p>
              </div>

              <Button
                onClick={() => setShowDialog(true)}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Download className="h-5 w-5 mr-2" />
                {t.cta}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                {language === 'en'
                  ? 'No credit card required. Instant download.'
                  : '無需信用卡。即時下載。'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Download Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.dialogTitle}</DialogTitle>
            <DialogDescription>{t.dialogDescription}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t.formLabels.name} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t.placeholders.name}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                {t.formLabels.email} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t.placeholders.email}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">{t.formLabels.company}</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder={t.placeholders.company}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
                disabled={loading}
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {t.submit}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}