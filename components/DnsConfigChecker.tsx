import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CheckCircle, XCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

interface DnsConfigCheckerProps {
  domain?: string;
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

interface CheckResult {
  type: 'SPF' | 'DKIM' | 'DMARC';
  status: 'success' | 'warning' | 'error' | 'checking';
  message: string;
  details?: string;
}

export function DnsConfigChecker({ domain = 'casewhr.com', language = 'zh' }: DnsConfigCheckerProps) {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [customDomain, setCustomDomain] = useState(domain);

  const content = {
    zh: {
      title: 'DNS 配置檢查工具',
      subtitle: '檢查您的 SPF、DKIM 和 DMARC 記錄配置狀態',
      domainLabel: '域名',
      checkButton: '開始檢查',
      checking: '檢查中...',
      spf: {
        name: 'SPF 記錄',
        description: '驗證發件服務器授權',
        success: 'SPF 記錄配置正確 ✅',
        warning: 'SPF 記錄存在但可能需要優化',
        error: '未找到 SPF 記錄或配置錯誤',
        expected: '期望值：v=spf1 include:spf.brevo.com ~all',
      },
      dkim: {
        name: 'DKIM 記錄',
        description: '驗證郵件內容完整性',
        success: 'DKIM 記錄配置正確 ✅',
        warning: 'DKIM 記錄存在但可能需要驗證',
        error: '未找到 DKIM 記錄',
        expected: '期望值：v=DKIM1; k=rsa; p=...',
      },
      dmarc: {
        name: 'DMARC 記錄',
        description: '郵件域名防欺詐策略',
        success: 'DMARC 記錄配置正確 ✅',
        warning: 'DMARC 記錄存在但策略較寬鬆',
        error: '未找到 DMARC 記錄（可選但推薦）',
        expected: '期望值：v=DMARC1; p=none; rua=mailto:...',
      },
      instructions: {
        title: '📋 配置說明',
        spfStep: '1. 在 DNS 中添加 TXT 記錄：@ → v=spf1 include:spf.brevo.com ~all',
        dkimStep: '2. 在 DNS 中添加 TXT 記錄：mail._domainkey → （從 Brevo 獲取）',
        dmarcStep: '3. 在 DNS 中添加 TXT 記錄：_dmarc → v=DMARC1; p=none; rua=mailto:dmarc@casewhr.com',
        waitTime: '⏰ 添加後等待 10-30 分鐘讓 DNS 傳播',
      },
      tools: {
        title: '🔗 在線檢查工具',
        mxtoolbox: 'MX Toolbox - 專業 DNS 檢查',
        mailTester: 'Mail Tester - 郵件評分測試',
        brevoHelp: 'Brevo 幫助文檔',
      },
    },
    en: {
      title: 'DNS Configuration Checker',
      subtitle: 'Check your SPF, DKIM, and DMARC record configuration status',
      domainLabel: 'Domain',
      checkButton: 'Check Now',
      checking: 'Checking...',
      spf: {
        name: 'SPF Record',
        description: 'Validates mail server authorization',
        success: 'SPF record configured correctly ✅',
        warning: 'SPF record exists but may need optimization',
        error: 'SPF record not found or misconfigured',
        expected: 'Expected: v=spf1 include:spf.brevo.com ~all',
      },
      dkim: {
        name: 'DKIM Record',
        description: 'Validates email content integrity',
        success: 'DKIM record configured correctly ✅',
        warning: 'DKIM record exists but may need verification',
        error: 'DKIM record not found',
        expected: 'Expected: v=DKIM1; k=rsa; p=...',
      },
      dmarc: {
        name: 'DMARC Record',
        description: 'Email domain anti-spoofing policy',
        success: 'DMARC record configured correctly ✅',
        warning: 'DMARC record exists but policy is lenient',
        error: 'DMARC record not found (optional but recommended)',
        expected: 'Expected: v=DMARC1; p=none; rua=mailto:...',
      },
      instructions: {
        title: '📋 Configuration Instructions',
        spfStep: '1. Add TXT record in DNS: @ → v=spf1 include:spf.brevo.com ~all',
        dkimStep: '2. Add TXT record in DNS: mail._domainkey → (Get from Brevo)',
        dmarcStep: '3. Add TXT record in DNS: _dmarc → v=DMARC1; p=none; rua=mailto:dmarc@casewhr.com',
        waitTime: '⏰ Wait 10-30 minutes for DNS propagation after adding',
      },
      tools: {
        title: '🔗 Online Checking Tools',
        mxtoolbox: 'MX Toolbox - Professional DNS Check',
        mailTester: 'Mail Tester - Email Score Test',
        brevoHelp: 'Brevo Help Documentation',
      },
    },
  };

  const t = content[language];

  const checkDnsRecords = async () => {
    setChecking(true);
    setResults([
      { type: 'SPF', status: 'checking', message: 'Checking SPF record...' },
      { type: 'DKIM', status: 'checking', message: 'Checking DKIM record...' },
      { type: 'DMARC', status: 'checking', message: 'Checking DMARC record...' },
    ]);

    // Simulate DNS checking (in production, you'd use a real DNS API)
    // Since we can't directly query DNS from browser, we show instructions
    setTimeout(() => {
      setResults([
        {
          type: 'SPF',
          status: 'warning',
          message: language === 'zh' 
            ? '⚠️ 無法從瀏覽器直接檢查 DNS 記錄，請使用下方的在線工具'
            : '⚠️ Cannot directly check DNS from browser, please use online tools below',
          details: t.spf.expected,
        },
        {
          type: 'DKIM',
          status: 'warning',
          message: language === 'zh'
            ? '⚠️ 請使用 MX Toolbox 檢查 DKIM 記錄'
            : '⚠️ Please use MX Toolbox to check DKIM record',
          details: t.dkim.expected,
        },
        {
          type: 'DMARC',
          status: 'warning',
          message: language === 'zh'
            ? '⚠️ 請使用 MX Toolbox 檢查 DMARC 記錄'
            : '⚠️ Please use MX Toolbox to check DMARC record',
          details: t.dmarc.expected,
        },
      ]);
      setChecking(false);
    }, 2000);
  };

  const getStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'checking':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-gray-900">{t.title}</h1>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      {/* Domain Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="domain">{t.domainLabel}</Label>
          <div className="flex gap-2">
            <Input
              id="domain"
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="casewhr.com"
              className="flex-1"
            />
            <Button
              onClick={checkDnsRecords}
              disabled={checking}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.checking}
                </>
              ) : (
                t.checkButton
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3 mt-6">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg"
              >
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h3 className="text-gray-900 text-sm mb-1">
                    {result.type}
                  </h3>
                  <p className="text-sm text-gray-600">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-500 mt-2 font-mono bg-white p-2 rounded border border-gray-200">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
        <h2 className="text-blue-900">{t.instructions.title}</h2>
        <div className="space-y-2 text-sm text-blue-800">
          <p>✅ {t.instructions.spfStep}</p>
          <p>✅ {t.instructions.dkimStep}</p>
          <p>✅ {t.instructions.dmarcStep}</p>
          <p className="text-blue-600 mt-3">{t.instructions.waitTime}</p>
        </div>
      </div>

      {/* Online Tools */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-gray-900">{t.tools.title}</h2>
        <div className="grid gap-3">
          <a
            href={`https://mxtoolbox.com/SuperTool.aspx?action=mx:${customDomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div>
              <p className="text-gray-900">MX Toolbox</p>
              <p className="text-sm text-gray-600">{t.tools.mxtoolbox}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-gray-400" />
          </a>

          <a
            href="https://www.mail-tester.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div>
              <p className="text-gray-900">Mail Tester</p>
              <p className="text-sm text-gray-600">{t.tools.mailTester}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-gray-400" />
          </a>

          <a
            href="https://help.brevo.com/hc/en-us/articles/209467485"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div>
              <p className="text-gray-900">Brevo Help</p>
              <p className="text-sm text-gray-600">{t.tools.brevoHelp}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-gray-400" />
          </a>
        </div>
      </div>

      {/* Setup Guide Link */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 text-center">
        <p className="text-purple-900 mb-3">
          {language === 'zh' 
            ? '📖 需要詳細的配置步驟？'
            : '📖 Need detailed setup instructions?'}
        </p>
        <p className="text-sm text-purple-700 mb-4">
          {language === 'zh'
            ? '請查看完整的 SPF 和 DKIM 配置指南'
            : 'Check out the complete SPF and DKIM setup guide'}
        </p>
        <Button
          variant="outline"
          className="border-purple-300 text-purple-700 hover:bg-purple-100"
          onClick={() => window.open('/SPF_DKIM_SETUP_GUIDE.md', '_blank')}
        >
          {language === 'zh' ? '查看完整指南' : 'View Complete Guide'}
        </Button>
      </div>
    </div>
  );
}