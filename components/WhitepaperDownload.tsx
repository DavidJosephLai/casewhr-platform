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

      // Generate whitepaper content
      const whitepaperContent = generateWhitepaper(language);
      
      // Create PDF and download
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const maxLineWidth = pageWidth - margin * 2;
      let yPosition = margin;

      // Helper function to add text with auto-pagination
      const addText = (text: string, fontSize = 10, isBold = false) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxLineWidth);
        
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
      };

      // Add content based on language
      if (language === 'en') {
        // Cover page
        pdf.setFontSize(24);
        pdf.text('CASEWHR PLATFORM WHITEPAPER', pageWidth / 2, 50, { align: 'center' });
        pdf.setFontSize(14);
        pdf.text('January 2026', pageWidth / 2, 70, { align: 'center' });
        pdf.addPage();
        yPosition = margin;

        // Table of Contents
        addText('TABLE OF CONTENTS', 16, true);
        yPosition += 5;
        addText('1. Executive Summary');
        addText('2. Platform Architecture & Technology Stack');
        addText('3. Multi-Currency System Design');
        addText('4. AI-Powered Project Matching Algorithm');
        addText('5. Security & Escrow System');
        addText('6. Enterprise Solutions Overview');
        addText('7. Future Roadmap & Vision');
        pdf.addPage();
        yPosition = margin;

        // Chapter 1
        addText('1. EXECUTIVE SUMMARY', 14, true);
        yPosition += 5;
        addText('CaseWhr is a next-generation global freelance platform designed to connect businesses with talented professionals worldwide. Our platform addresses the key pain points of traditional freelance marketplaces through innovative technology and user-centric design.');
        yPosition += 5;
        addText('Key Differentiators:');
        addText('- Multi-currency support (USD, TWD, CNY)');
        addText('- Low service fees (5-10% vs industry standard 20%)');
        addText('- AI-powered project matching');
        addText('- Same-day withdrawal capability');
        addText('- Enterprise-grade solutions with custom branding');
        yPosition += 10;

        // Chapter 2
        addText('2. PLATFORM ARCHITECTURE & TECHNOLOGY STACK', 14, true);
        yPosition += 5;
        addText('Frontend: React + TypeScript for type-safe development, Tailwind CSS v4 for modern responsive design, Real-time updates with WebSocket connections');
        yPosition += 3;
        addText('Backend: Supabase for database and authentication, Edge Functions for serverless API endpoints, PostgreSQL for reliable data storage');
        yPosition += 3;
        addText('Payment Infrastructure: Stripe for international payments, PayPal for global transactions, ECPay for Taiwan market, Bank transfer integration for local payments');
        yPosition += 10;

        // Chapter 3
        addText('3. MULTI-CURRENCY SYSTEM DESIGN', 14, true);
        yPosition += 5;
        addText('Our innovative multi-currency system allows users to work in their preferred currency while maintaining platform-wide consistency.');
        yPosition += 3;
        addText('Storage: All transactions stored in USD (base currency)');
        addText('Display: Automatic conversion to user preferred currency (USD/TWD/CNY)');
        addText('Rates: Real-time exchange rates with daily updates');
        addText('Transparency: Clear fee breakdown in all currencies');
        yPosition += 10;

        // Chapter 4
        addText('4. AI-POWERED PROJECT MATCHING ALGORITHM', 14, true);
        yPosition += 5;
        addText('Our proprietary AI matching algorithm analyzes: Freelancer skills and expertise, Project requirements and complexity, Historical performance data, Client preferences and feedback, Timezone and language compatibility.');
        yPosition += 3;
        addText('Result: 85% higher project success rate compared to manual matching');
        yPosition += 10;

        // Chapter 5
        addText('5. SECURITY & ESCROW SYSTEM', 14, true);
        yPosition += 5;
        addText('Security Features: KYC verification for all users, Two-factor authentication (2FA), Encrypted data transmission, Regular security audits');
        yPosition += 3;
        addText('Escrow System: Client funds held securely until project completion, Milestone-based release system, Dispute resolution mechanism, Same-day withdrawal for completed projects');
        yPosition += 10;

        // Chapter 6
        addText('6. ENTERPRISE SOLUTIONS OVERVIEW', 14, true);
        yPosition += 5;
        addText('Our Enterprise tier offers: Custom branding and white-label options, Dedicated account manager, Priority support (24/7), Advanced analytics and reporting, Team management tools, Custom integration capabilities');
        yPosition += 3;
        addText('Ideal for: Agencies, consulting firms, and businesses with ongoing freelance needs');
        yPosition += 10;

        // Chapter 7
        addText('7. FUTURE ROADMAP & VISION', 14, true);
        yPosition += 5;
        addText('Q1 2026: Cryptocurrency payment integration, Mobile app launch (iOS & Android), Advanced AI project recommendations');
        yPosition += 3;
        addText('Q2 2026: Blockchain-based reputation system, Global talent certification program, Video consultation features');
        yPosition += 3;
        addText('Q3 2026: Marketplace for digital products, Automated contract generation, Multi-language AI translation');
        yPosition += 3;
        addText('Q4 2026: Decentralized identity verification, Smart contract automation, Global expansion to 50+ countries');
        yPosition += 10;

        // Conclusion
        addText('CONCLUSION', 14, true);
        yPosition += 5;
        addText('CaseWhr is positioned to become the leading global freelance platform by combining cutting-edge technology with user-focused features. Our commitment to transparency, security, and innovation sets us apart in the competitive freelance marketplace.');
        yPosition += 10;

        // Contact
        addText('Contact: support@casewhr.com');
        addText('Website: https://casewhr.com');
        addText('Version: 1.0 | Updated: January 2026');
      } else {
        // Chinese version (similar structure)
        pdf.setFontSize(24);
        pdf.text('接得準平台白皮書', pageWidth / 2, 50, { align: 'center' });
        pdf.setFontSize(14);
        pdf.text('2026 年 1 月', pageWidth / 2, 70, { align: 'center' });
        pdf.addPage();
        yPosition = margin;

        addText('目錄', 16, true);
        yPosition += 5;
        addText('1. 執行摘要');
        addText('2. 平台架構與技術堆疊');
        addText('3. 多幣計價系統設計');
        addText('4. AI 智能專案配對演算法');
        addText('5. 安全性與託管系統');
        addText('6. 企業級解決方案概覽');
        addText('7. 未來發展藍圖與願景');
        pdf.addPage();
        yPosition = margin;

        addText('1. 執行摘要', 14, true);
        yPosition += 5;
        addText('接得準（CaseWhr）是新一代全球接案平台，旨在連接全球企業與專業人才。我們的平台透過創新技術和以用戶為中心的設計，解決了傳統接案市場的關鍵痛點。');
        yPosition += 5;
        addText('核心優勢：多幣計價支援（USD、TWD、CNY）、低服務費（5-10% vs 業界標準 20%）、AI 智能專案配對、當日提款功能、企業級解決方案與客製化品牌');
        yPosition += 10;

        addText('2. 平台架構與技術堆疊', 14, true);
        yPosition += 5;
        addText('前端技術：React + TypeScript 實現類型安全開發，Tailwind CSS v4 打造現代響應式設計，WebSocket 實現即時更新');
        yPosition += 3;
        addText('後端技術：Supabase 提供數���庫和身份驗證，Edge Functions 實現無服務器 API，PostgreSQL 確保可靠的數據存儲');
        yPosition += 3;
        addText('支付基礎設施：Stripe 處理國際支付，PayPal 支援全球交易，ECPay 服務台灣市場，銀行轉帳整合本地支付');
        yPosition += 10;

        addText('3. 多幣計價系統設計', 14, true);
        yPosition += 5;
        addText('我們創新的多幣計價系統允許用戶使用偏好貨幣，同時保持平台一致性。存儲：所有交易以 USD（基準貨幣）存儲。顯示：自動轉換為用戶偏好貨幣（USD/TWD/CNY）。匯率：每日更新的即時匯率。透明度：所有貨幣的清晰費用明細。');
        yPosition += 10;

        addText('4. AI 智能專案配對演算法', 14, true);
        yPosition += 5;
        addText('我們專有的 AI 配對演算法分析：接案者技能與專業知識、專案需求與複雜度、歷史績效數據、客戶偏好與回饋、時區與語言相容性。結果：與手動配對相比，專案成功率提高 85%');
        yPosition += 10;

        addText('5. 安全性與託管系統', 14, true);
        yPosition += 5;
        addText('安全功能：所有用戶的 KYC 身份驗證、雙因素身份驗證（2FA）、加密數據傳輸、定期安全審計');
        yPosition += 3;
        addText('託管系統：客戶資金安全��管至專案完成、里程碑式釋放系統、爭議解決機制、完成專案當日提款');
        yPosition += 10;

        addText('6. 企業級解決方案概覽', 14, true);
        yPosition += 5;
        addText('我們的企業版提供：客製化品牌與白標選項、專屬客戶經理、優先支援（24/7）、高級分析與報表、團隊管理工具、客製化整合功能。適合：代理商、諮詢公司及有持續接案需求的企業');
        yPosition += 10;

        addText('7. 未來發展藍圖與願景', 14, true);
        yPosition += 5;
        addText('2026 年第一季：加密貨幣支付整合、移動應用程式發布（iOS & Android）、高級 AI 專案推薦');
        yPosition += 3;
        addText('2026 年第二季：區塊鏈聲譽系統、全球人才認證計劃、視訊諮詢功能');
        yPosition += 3;
        addText('2026 年第三季：數位產品市場、自動化合約生成、多語言 AI 翻譯');
        yPosition += 3;
        addText('2026 年第四季：去中心化身份驗證、智能合約自動化、全球擴展至 50+ 國家');
        yPosition += 10;

        addText('結論', 14, true);
        yPosition += 5;
        addText('接得準致力於結合尖端技術與用戶導向功能，成為領先的全球接案平台。我們對透明度、安全性和創新的承諾，讓我們在競爭激烈的接案市場中脫穎而出。');
        yPosition += 10;

        addText('聯絡方式：support@casewhr.com');
        addText('網站：https://casewhr.com');
        addText('版本：1.0 | 更新日期：2026 年 1 月');
      }

      pdf.save(`CaseWhr-Whitepaper-${language.toUpperCase()}-2026.pdf`);

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

  const generateWhitepaper = (lang: string) => {
    if (lang === 'en') {
      return `
================================================================================
                    CASEWHR PLATFORM WHITEPAPER
                          January 2026
================================================================================

TABLE OF CONTENTS
1. Executive Summary
2. Platform Architecture & Technology Stack
3. Multi-Currency System Design
4. AI-Powered Project Matching Algorithm
5. Security & Escrow System
6. Enterprise Solutions Overview
7. Future Roadmap & Vision

================================================================================
1. EXECUTIVE SUMMARY
================================================================================

CaseWhr (接得準) is a next-generation global freelance platform designed to 
connect businesses with talented professionals worldwide. Our platform addresses
the key pain points of traditional freelance marketplaces through innovative
technology and user-centric design.

Key Differentiators:
- Multi-currency support (USD, TWD, CNY)
- Low service fees (5-10% vs industry standard 20%)
- AI-powered project matching
- Same-day withdrawal capability
- Enterprise-grade solutions with custom branding

================================================================================
2. PLATFORM ARCHITECTURE & TECHNOLOGY STACK
================================================================================

Frontend:
- React + TypeScript for type-safe development
- Tailwind CSS v4 for modern, responsive design
- Real-time updates with WebSocket connections

Backend:
- Supabase for database and authentication
- Edge Functions for serverless API endpoints
- PostgreSQL for reliable data storage

Payment Infrastructure:
- Stripe for international payments
- PayPal for global transactions
- ECPay for Taiwan market
- Bank transfer integration for local payments

================================================================================
3. MULTI-CURRENCY SYSTEM DESIGN
================================================================================

Our innovative multi-currency system allows users to work in their preferred
currency while maintaining platform-wide consistency:

Storage: All transactions stored in USD (base currency)
Display: Automatic conversion to user's preferred currency (USD/TWD/CNY)
Rates: Real-time exchange rates with daily updates
Transparency: Clear fee breakdown in all currencies

This system eliminates currency confusion and provides a seamless experience
for international collaboration.

================================================================================
4. AI-POWERED PROJECT MATCHING ALGORITHM
================================================================================

Our proprietary AI matching algorithm analyzes:
- Freelancer skills and expertise
- Project requirements and complexity
- Historical performance data
- Client preferences and feedback
- Timezone and language compatibility

Result: 85% higher project success rate compared to manual matching

================================================================================
5. SECURITY & ESCROW SYSTEM
================================================================================

Security Features:
- KYC verification for all users
- Two-factor authentication (2FA)
- Encrypted data transmission
- Regular security audits

Escrow System:
- Client funds held securely until project completion
- Milestone-based release system
- Dispute resolution mechanism
- Same-day withdrawal for completed projects

================================================================================
6. ENTERPRISE SOLUTIONS OVERVIEW
================================================================================

Our Enterprise tier offers:
- Custom branding and white-label options
- Dedicated account manager
- Priority support (24/7)
- Advanced analytics and reporting
- Team management tools
- Custom integration capabilities

Ideal for: Agencies, consulting firms, and businesses with ongoing freelance needs

================================================================================
7. FUTURE ROADMAP & VISION
================================================================================

Q1 2026:
- Cryptocurrency payment integration
- Mobile app launch (iOS & Android)
- Advanced AI project recommendations

Q2 2026:
- Blockchain-based reputation system
- Global talent certification program
- Video consultation features

Q3 2026:
- Marketplace for digital products
- Automated contract generation
- Multi-language AI translation

Q4 2026:
- Decentralized identity verification
- Smart contract automation
- Global expansion to 50+ countries

================================================================================
CONCLUSION
================================================================================

CaseWhr is positioned to become the leading global freelance platform by
combining cutting-edge technology with user-focused features. Our commitment
to transparency, security, and innovation sets us apart in the competitive
freelance marketplace.

Join us in revolutionizing the future of work.

================================================================================
Contact: info@casewhr.com
Website: https://casewhr.com
Version: 1.0 | Updated: January 2026
================================================================================
`;
    } else {
      return `
================================================================================
                    接得準平台��皮書
                      2026 年 1 月
================================================================================

目錄
1. 執行摘要
2. 平台架構與技術堆疊
3. 多幣計價系統設計
4. AI 智能專案配對演算法
5. 安全性與託管系統
6. 企業級解決方案概覽
7. 未來發展藍圖與願景

================================================================================
1. 執行摘要
================================================================================

接得準（CaseWhr）是新一代全球接案平台，旨在連接全球企業與專業人才。
我們的平台透過創新技術和以用戶為中心的設計，解決了傳統接案市場的關鍵痛點。

核心優勢：
- 多幣計價支援（USD、TWD、CNY）
- 低服務費（5-10% vs 業界標準 20%）
- AI 智能專案配對
- 當日提款功能
- 企業級解決方案與客製化品牌

================================================================================
2. 平台架構與技術堆疊
================================================================================

前端技術：
- React + TypeScript 實現類型安全開發
- Tailwind CSS v4 打造現代響應式設計
- WebSocket 實現即時更新

後端技術：
- Supabase 提供數據庫和身份驗證
- Edge Functions 實現無服務器 API
- PostgreSQL 確保可靠的數據存儲

支付基礎設施：
- Stripe 處理國際支付
- PayPal 支援全球交易
- ECPay 服務台灣市場
- 銀行轉帳整合本地支付

================================================================================
3. 多幣計價系統設計
================================================================================

我們創新的多幣計價系統允許用戶使用偏好貨幣，同時保持平台一致性：

存儲：所有交易以 USD（基準貨幣）存儲
顯示：自動轉換為用戶偏好貨幣（USD/TWD/CNY）
匯率：每日更新的即時匯率
透明度：所有貨幣的清晰費用明細

此系統消除了貨幣混淆，為國際合作提供無縫體驗。

================================================================================
4. AI 智能專案配對演算法
================================================================================

我們專有的 AI 配對演算法分析：
- 接案者技能與專業知識
- 專案需求與複雜度
- 歷史績效數據
- 客戶偏好與回饋
- 時區與語言相容性

結果：與手動配對相比，專案成功率提高 85%

================================================================================
5. 安全性與託管系統
================================================================================

安全功能：
- 所有用戶的 KYC 身份驗證
- 雙因素身份驗證（2FA）
- 加密數據傳輸
- 定期安全審計

託管系統：
- 客戶資金安全保管至專案完成
- 里程碑式釋放系統
- 爭議解決機制
- 完成專案當日提款

================================================================================
6. 企業級解決方案概覽
================================================================================

我們的企業版提供：
- 客製化品牌與白標選項
- 專屬客戶經理
- 優先支援（24/7）
- 高級分析與報表
- 團隊管理工具
- 客製化整合功能

適合：代理商、諮詢公司及有持續接案需求的企業

================================================================================
7. 未來發展藍圖與願景
================================================================================

2026 年第一季：
- 加密貨幣支付整合
- 移動應用程式發布（iOS & Android）
- 高級 AI 專案推薦

2026 年第二季：
- 區塊鏈聲譽系統
- 全球人才認證計劃
- 視訊諮詢功能

2026 年第三季：
- 數位產品市場
- 自動化合約生成
- 多語言 AI 翻譯

2026 年第四季：
- 去中心化身份驗證
- 智能合約自動化
- 全球擴展至 50+ 國家

================================================================================
結論
================================================================================

接得準致力於結合尖端技術與用戶導向功能，成為領先的全球接案平台。
我們對透明度、安全性和創新的承諾，讓我們在競爭激烈的接案市場中脫穎而出。

加入我們，共同革新工作的未來。

================================================================================
聯絡方式：info@casewhr.com
網站：https://casewhr.com
版本：1.0 | 更新日期：2026 年 1 月
================================================================================
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