/**
 * Platform Comparison Component
 * 平台比較組件 - 展示 CaseWhr 與其他接案平台的對比
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export function PlatformComparison() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: 'Why Choose CaseWhr?',
      subtitle: 'Compare us with other freelance platforms',
      caseWhr: 'CaseWhr',
      platforms: {
        fiverr: 'Fiverr',
        upwork: 'Upwork',
        freelancer: 'Freelancer',
        job518: '518外包網',
      },
      features: {
        multiCurrency: 'Multi-Currency Support (USD/TWD/CNY)',
        lowFees: 'Low Service Fees (5-10%)',
        fastPayment: 'Fast Payment Processing',
        escrow: 'Secure Escrow System',
        milestone: 'Milestone Payment Support',
        localSupport: 'Local Language Support',
        bankTransfer: 'Direct Bank Transfer',
        cryptoPayment: 'Cryptocurrency Support (Coming Soon)',
        noSubscription: 'No Mandatory Subscription',
        instantChat: 'Real-time Chat System',
        aiMatching: 'AI Project Matching',
        transparentFees: 'Transparent Fee Structure',
        sameDay: 'Same-Day Withdrawal',
        enterprise: 'Enterprise Solutions',
        customBranding: 'Custom Branding (Enterprise)',
      },
    },
    'zh-TW': {
      title: '為什麼選擇接得準？',
      subtitle: '與其他接案平台的完整對比',
      caseWhr: '接得準',
      platforms: {
        fiverr: 'Fiverr',
        upwork: 'Upwork',
        freelancer: 'Freelancer',
        job518: '518外包網',
      },
      features: {
        multiCurrency: '多幣計價系統 (USD/TWD/CNY)',
        lowFees: '低服務費 (5-10%)',
        fastPayment: '快速付款處理',
        escrow: '安全託管系統',
        milestone: '里程碑付款支援',
        localSupport: '在地語言支援',
        bankTransfer: '直接銀行轉帳',
        cryptoPayment: '加密貨幣支付 (即將推出)',
        noSubscription: '無強制訂閱',
        instantChat: '即時聊天系統',
        aiMatching: 'AI 智能配對',
        transparentFees: '透明費用結構',
        sameDay: '當日提款',
        enterprise: '企業級解決方案',
        customBranding: '客製化品牌 (企業版)',
      },
    },
    'zh-CN': {
      title: '为什么选择接得准？',
      subtitle: '与其他接案平台的完整对比',
      caseWhr: '接得准',
      platforms: {
        fiverr: 'Fiverr',
        upwork: 'Upwork',
        freelancer: 'Freelancer',
        job518: '518外包網',
      },
      features: {
        multiCurrency: '多币计价系统 (USD/TWD/CNY)',
        lowFees: '低服务费 (5-10%)',
        fastPayment: '快速付款处理',
        escrow: '安全托管系统',
        milestone: '里程碑付款支持',
        localSupport: '本地语言支持',
        bankTransfer: '直接银行转账',
        cryptoPayment: '加密货币支付 (即将推出)',
        noSubscription: '无强制订阅',
        instantChat: '即时聊天系统',
        aiMatching: 'AI 智能配对',
        transparentFees: '透明费用结构',
        sameDay: '当日提款',
        enterprise: '企业级解决方案',
        customBranding: '定制化品牌 (企业版)',
      },
    },
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  // 對比數據：true = 支援, false = 不支援
  const comparisonData = [
    {
      feature: t.features.multiCurrency,
      caseWhr: true,
      fiverr: false,
      upwork: false,
      freelancer: false,
      job518: false, // 518只支援TWD
    },
    {
      feature: t.features.lowFees,
      caseWhr: true,
      fiverr: false, // Fiverr 收 20%
      upwork: false, // Upwork 收 10-20%
      freelancer: false, // Freelancer 收 10%
      job518: false, // 518 收 10-15%
    },
    {
      feature: t.features.fastPayment,
      caseWhr: true,
      fiverr: true,
      upwork: true,
      freelancer: true,
      job518: false, // 較慢的付款流程
    },
    {
      feature: t.features.escrow,
      caseWhr: true,
      fiverr: true,
      upwork: true,
      freelancer: true,
      job518: false, // 無託管系統
    },
    {
      feature: t.features.milestone,
      caseWhr: true,
      fiverr: false,
      upwork: true,
      freelancer: true,
      job518: false, // 不支援里程碑付款
    },
    {
      feature: t.features.localSupport,
      caseWhr: true,
      fiverr: false,
      upwork: false,
      freelancer: false,
      job518: true, // 518有在地支援
    },
    {
      feature: t.features.bankTransfer,
      caseWhr: true,
      fiverr: false,
      upwork: true,
      freelancer: true,
      job518: true, // 518支援銀行轉帳
    },
    {
      feature: t.features.cryptoPayment,
      caseWhr: true,
      fiverr: false,
      upwork: false,
      freelancer: false,
      job518: false, // 無加密貨幣支援
    },
    {
      feature: t.features.noSubscription,
      caseWhr: true,
      fiverr: true,
      upwork: false, // Upwork 有付費會員
      freelancer: false, // Freelancer 有付費會員
      job518: false, // 518有付費會員制度
    },
    {
      feature: t.features.instantChat,
      caseWhr: true,
      fiverr: true,
      upwork: true,
      freelancer: true,
      job518: false, // 無即時聊天系統
    },
    {
      feature: t.features.aiMatching,
      caseWhr: true,
      fiverr: false,
      upwork: false,
      freelancer: false,
      job518: false, // 無AI配對功能
    },
    {
      feature: t.features.transparentFees,
      caseWhr: true,
      fiverr: false,
      upwork: false,
      freelancer: false,
      job518: false, // 費用結構不透明
    },
    {
      feature: t.features.sameDay,
      caseWhr: true,
      fiverr: false,
      upwork: false,
      freelancer: false,
      job518: false, // 無當日提款
    },
    {
      feature: t.features.enterprise,
      caseWhr: true,
      fiverr: true,
      upwork: true,
      freelancer: false,
      job518: false, // 無企業解決方案
    },
    {
      feature: t.features.customBranding,
      caseWhr: true,
      fiverr: false,
      upwork: false,
      freelancer: false,
      job518: false, // 無客製化品牌
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-200 rounded-lg shadow-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-[30%]">
                      {language === 'en' ? 'Features' : '功能特色'}
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-blue-600 bg-blue-50 w-[14%]">
                      <div className="flex flex-col items-center">
                        <span className="text-base">{t.caseWhr}</span>
                        <span className="text-xs text-gray-500 mt-1">
                          {language === 'en' ? '(Us)' : '(本平台)'}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 w-[14%]">
                      {t.platforms.fiverr}
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 w-[14%]">
                      {t.platforms.upwork}
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 w-[14%]">
                      {t.platforms.freelancer}
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 w-[14%]">
                      {t.platforms.job518}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparisonData.map((row, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {row.feature}
                      </td>
                      <td className="px-6 py-4 text-center bg-blue-50">
                        {row.caseWhr ? (
                          <Check className="h-6 w-6 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-6 w-6 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.fiverr ? (
                          <Check className="h-6 w-6 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-6 w-6 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.upwork ? (
                          <Check className="h-6 w-6 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-6 w-6 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.freelancer ? (
                          <Check className="h-6 w-6 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-6 w-6 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.job518 ? (
                          <Check className="h-6 w-6 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-6 w-6 text-gray-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            {language === 'en'
              ? 'Experience the difference with CaseWhr today!'
              : '立即體驗接得準的不同之處！'}
          </p>
          <button
            onClick={() => {
              const event = new CustomEvent('showPricing');
              window.dispatchEvent(event);
            }}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            {language === 'en' ? 'Get Started Free' : '免費開始使用'}
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            {language === 'en'
              ? '* Comparison based on public information as of 2025. Features and fees may vary.'
              : '* 對比基於 2025 年公開資訊。功能和費用可能有所變動。'}
          </p>
        </div>
      </div>
    </section>
  );
}