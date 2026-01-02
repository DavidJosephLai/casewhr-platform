import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  ExternalLink,
  Info,
  Clock,
  Mail,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../lib/LanguageContext';

interface DmarcPolicy {
  phase: number;
  name: string;
  policy: string;
  percentage: number;
  record: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  duration: string;
  benefits: string[];
  warnings: string[];
}

type DnsProvider = 'hinet' | 'cloudflare' | 'other';

export function DmarcConfigHelper() {
  const { language } = useLanguage();
  const [currentPhase, setCurrentPhase] = useState(1);
  const [copied, setCopied] = useState(false);
  const [dnsProvider, setDnsProvider] = useState<DnsProvider>('hinet');
  const isEnglish = language === 'en';

  const domain = 'casewhr.com';
  const reportEmail = 'dmarc-reports@casewhr.com';

  const phases: DmarcPolicy[] = [
    {
      phase: 1,
      name: isEnglish ? 'Monitoring Mode (Recommended Start)' : '監控模式（建議起始）',
      policy: 'none',
      percentage: 100,
      record: `v=DMARC1; p=none; pct=100; rua=mailto:${reportEmail}; ruf=mailto:${reportEmail}; fo=1`,
      description: isEnglish 
        ? 'Monitor only, no impact on email delivery. Collect data for 1-2 weeks.'
        : '僅監控，不影響郵件送達。收集 1-2 週數據。',
      risk: 'low',
      duration: isEnglish ? '1-2 weeks' : '1-2 週',
      benefits: isEnglish 
        ? [
          'Safe to implement immediately',
          'Collect authentication reports',
          'No risk of blocking legitimate emails',
          'Learn about your email sources'
        ]
        : [
          '可立即安全實施',
          '收集驗證報告',
          '不會阻擋合法郵件',
          '了解您的郵件來源'
        ],
      warnings: isEnglish
        ? ['MX Toolbox will show "Policy Not Enabled" warning']
        : ['MX Toolbox 會顯示「策略未啟用」警告']
    },
    {
      phase: 2,
      name: isEnglish ? 'Quarantine Mode - 10%' : '隔離模式 - 10%',
      policy: 'quarantine',
      percentage: 10,
      record: `v=DMARC1; p=quarantine; pct=10; rua=mailto:${reportEmail}; ruf=mailto:${reportEmail}; fo=1; adkim=r; aspf=r`,
      description: isEnglish
        ? 'Apply quarantine policy to 10% of suspicious emails. Test phase.'
        : '對 10% 可疑郵件應用隔離策略。測試階段。',
      risk: 'low',
      duration: isEnglish ? '1 week' : '1 週',
      benefits: isEnglish
        ? [
          'Start protecting your domain',
          'MX Toolbox warnings resolved',
          'Improved spam score',
          'Low risk - only 10% affected'
        ]
        : [
          '開始保護您的域名',
          'MX Toolbox 警告解決',
          '改善垃圾郵件評分',
          '低風險 - 僅影響 10%'
        ],
      warnings: isEnglish
        ? ['Monitor reports for any legitimate email issues']
        : ['監控報告是否有合法郵件問題']
    },
    {
      phase: 3,
      name: isEnglish ? 'Quarantine Mode - 50%' : '隔離模式 - 50%',
      policy: 'quarantine',
      percentage: 50,
      record: `v=DMARC1; p=quarantine; pct=50; rua=mailto:${reportEmail}; ruf=mailto:${reportEmail}; fo=1; adkim=r; aspf=r`,
      description: isEnglish
        ? 'Increase protection to 50% of emails. Confidence building phase.'
        : '將保護提升至 50% 的郵件。建立信心階段。',
      risk: 'medium',
      duration: isEnglish ? '1 week' : '1 週',
      benefits: isEnglish
        ? [
          'Stronger domain protection',
          'Better email reputation',
          'Reduced spam/phishing risk',
          'Higher deliverability'
        ]
        : [
          '更強的域名保護',
          '更好的郵件信譽',
          '降低垃圾/釣魚風險',
          '更高送達率'
        ],
      warnings: isEnglish
        ? ['Check reports daily for any issues']
        : ['每日檢查報告是否有問題']
    },
    {
      phase: 4,
      name: isEnglish ? 'Quarantine Mode - 100%' : '隔離模式 - 100%',
      policy: 'quarantine',
      percentage: 100,
      record: `v=DMARC1; p=quarantine; pct=100; rua=mailto:${reportEmail}; ruf=mailto:${reportEmail}; fo=1; adkim=r; aspf=r`,
      description: isEnglish
        ? 'Full quarantine protection. Suspicious emails go to spam folder.'
        : '完整隔離保護。可疑郵件進入垃圾郵件夾。',
      risk: 'medium',
      duration: isEnglish ? '2 weeks' : '2 週',
      benefits: isEnglish
        ? [
          'Full domain protection',
          'Excellent email reputation',
          'High spam score (9-10/10)',
          'Professional email security'
        ]
        : [
          '完整域名保護',
          '優秀的郵件信譽',
          '高垃圾郵件評分 (9-10/10)',
          '專業郵件安全'
        ],
      warnings: isEnglish
        ? ['Maintain SPF and DKIM records properly']
        : ['妥善維護 SPF 和 DKIM 記錄']
    },
    {
      phase: 5,
      name: isEnglish ? 'Reject Mode (Maximum Security)' : '拒絕模式（最高安全性）',
      policy: 'reject',
      percentage: 100,
      record: `v=DMARC1; p=reject; pct=100; rua=mailto:${reportEmail}; ruf=mailto:${reportEmail}; fo=1; adkim=s; aspf=s`,
      description: isEnglish
        ? 'Maximum protection. Reject all unauthenticated emails completely.'
        : '最大保護。完全拒絕所有未驗證的郵件。',
      risk: 'high',
      duration: isEnglish ? 'Permanent' : '永久',
      benefits: isEnglish
        ? [
          'Maximum domain protection',
          'Best-in-class email security',
          'Perfect spam score (10/10)',
          'Complete brand protection',
          'Industry best practice'
        ]
        : [
          '最大域名保護',
          '頂級郵件安全',
          '完美垃圾郵件評分 (10/10)',
          '完整品牌保護',
          '行業最佳實踐'
        ],
      warnings: isEnglish
        ? [
          'Only implement after successful Phase 4',
          'Requires strict SPF/DKIM alignment',
          'Any misconfiguration will block emails'
        ]
        : [
          '僅在成功完成階段 4 後實施',
          '需要嚴格的 SPF/DKIM 對齊',
          '任何配置錯誤都會阻擋郵件'
        ]
    }
  ];

  const currentConfig = phases[currentPhase - 1];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(isEnglish ? 'Copied to clipboard!' : '已複製到剪貼簿！');
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>
                {isEnglish ? 'DMARC Configuration Assistant' : 'DMARC 配置助手'}
              </CardTitle>
              <CardDescription>
                {isEnglish 
                  ? 'Step-by-step guide to secure your email domain'
                  : '逐步指南以保護您的郵件域名'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              {isEnglish 
                ? 'DMARC (Domain-based Message Authentication, Reporting & Conformance) protects your domain from email spoofing and phishing. Follow the phases below for safe implementation.'
                : 'DMARC（基於域的訊息驗證、報告和一致性）保護您的域名免受郵件偽造和釣魚攻擊。按照以下階段安全實施。'
              }
            </AlertDescription>
          </Alert>

          {/* Phase Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">
                {isEnglish ? 'Implementation Progress' : '實施進度'}
              </span>
              <span className="text-sm text-gray-600">
                {isEnglish ? 'Phase' : '階段'} {currentPhase} / 5
              </span>
            </div>
            <div className="flex gap-2">
              {phases.map((phase) => (
                <button
                  key={phase.phase}
                  onClick={() => setCurrentPhase(phase.phase)}
                  className={`flex-1 h-3 rounded-full transition-all ${
                    phase.phase === currentPhase
                      ? 'bg-blue-600 ring-2 ring-blue-300 ring-offset-2'
                      : phase.phase < currentPhase
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                  title={phase.name}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{isEnglish ? 'Start' : '開始'}</span>
              <span>{isEnglish ? 'Maximum Security' : '最高安全性'}</span>
            </div>
          </div>

          {/* Current Phase Details */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{currentConfig.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{currentConfig.description}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={getRiskColor(currentConfig.risk)}>
                  {isEnglish ? 'Risk: ' : '風險：'}
                  {currentConfig.risk.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {currentConfig.duration}
                </Badge>
              </div>
            </div>

            {/* DNS Record to Add */}
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-gray-400">
                  {isEnglish ? 'DNS TXT Record' : 'DNS TXT 記錄'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(currentConfig.record)}
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {isEnglish ? 'Copied!' : '已複製！'}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      {isEnglish ? 'Copy' : '複製'}
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className="text-gray-400">Type:</span>
                  <span className="font-mono">TXT</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className="text-gray-400">Name:</span>
                  <span className="font-mono">_dmarc</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className="text-gray-400">Content:</span>
                  <span className="font-mono break-all">{currentConfig.record}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className="text-gray-400">TTL:</span>
                  <span className="font-mono">Auto</span>
                </div>
              </div>
            </div>

            {/* Record Explanation */}
            <Tabs defaultValue="explanation" className="mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="explanation">
                  {isEnglish ? 'Record Explanation' : '記錄說明'}
                </TabsTrigger>
                <TabsTrigger value="parameters">
                  {isEnglish ? 'Parameters' : '參數詳解'}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="explanation" className="space-y-3">
                <div className="text-sm space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <span className="font-semibold">
                        {isEnglish ? 'Policy: ' : '策略：'}
                      </span>
                      <code className="bg-white px-2 py-0.5 rounded">p={currentConfig.policy}</code>
                      <p className="text-gray-600 mt-1">
                        {currentConfig.policy === 'none' && (isEnglish 
                          ? 'Monitor only - no action taken on failed emails'
                          : '僅監控 - 不對失敗郵件採取行動'
                        )}
                        {currentConfig.policy === 'quarantine' && (isEnglish
                          ? 'Move suspicious emails to spam/junk folder'
                          : '將可疑郵件移至垃圾郵件夾'
                        )}
                        {currentConfig.policy === 'reject' && (isEnglish
                          ? 'Completely reject unauthenticated emails'
                          : '完全拒絕未驗證的郵件'
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <span className="font-semibold">
                        {isEnglish ? 'Percentage: ' : '比例：'}
                      </span>
                      <code className="bg-white px-2 py-0.5 rounded">pct={currentConfig.percentage}</code>
                      <p className="text-gray-600 mt-1">
                        {isEnglish 
                          ? `Apply policy to ${currentConfig.percentage}% of emails`
                          : `對 ${currentConfig.percentage}% 的郵件應用策略`
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <span className="font-semibold">
                        {isEnglish ? 'Reports: ' : '報告：'}
                      </span>
                      <code className="bg-white px-2 py-0.5 rounded text-xs">rua/ruf={reportEmail}</code>
                      <p className="text-gray-600 mt-1">
                        {isEnglish 
                          ? 'Daily aggregate and forensic reports sent here'
                          : '每日匯總和詳細報告發送至此'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="parameters" className="space-y-2">
                <div className="text-sm space-y-2 bg-gray-50 p-4 rounded-lg font-mono">
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-gray-600">v=DMARC1</span>
                    <span>{isEnglish ? 'DMARC version 1' : 'DMARC 版本 1'}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-gray-600">p=...</span>
                    <span>{isEnglish ? 'Policy for domain' : '域名策略'}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-gray-600">pct=...</span>
                    <span>{isEnglish ? 'Percentage to apply' : '應用比例'}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-gray-600">rua=...</span>
                    <span>{isEnglish ? 'Aggregate reports' : '匯總報告'}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-gray-600">ruf=...</span>
                    <span>{isEnglish ? 'Forensic reports' : '詳細報告'}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-gray-600">fo=1</span>
                    <span>{isEnglish ? 'Report all failures' : '報告所有失敗'}</span>
                  </div>
                  {currentConfig.record.includes('adkim') && (
                    <>
                      <div className="grid grid-cols-[120px_1fr] gap-2">
                        <span className="text-gray-600">adkim=r/s</span>
                        <span>{isEnglish ? 'DKIM alignment (r=relaxed, s=strict)' : 'DKIM 對齊 (r=寬鬆, s=嚴格)'}</span>
                      </div>
                      <div className="grid grid-cols-[120px_1fr] gap-2">
                        <span className="text-gray-600">aspf=r/s</span>
                        <span>{isEnglish ? 'SPF alignment (r=relaxed, s=strict)' : 'SPF 對齊 (r=寬鬆, s=嚴格)'}</span>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Benefits */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                {isEnglish ? 'Benefits of This Phase' : '此階段的優勢'}
              </h4>
              <ul className="space-y-1 text-sm">
                {currentConfig.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Warnings */}
            {currentConfig.warnings.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <span className="font-semibold text-yellow-900">
                    {isEnglish ? 'Important Warnings:' : '重要警告：'}
                  </span>
                  <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                    {currentConfig.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentPhase(Math.max(1, currentPhase - 1))}
              disabled={currentPhase === 1}
              className="flex-1"
            >
              {isEnglish ? '← Previous Phase' : '← 上一階段'}
            </Button>
            <Button
              onClick={() => setCurrentPhase(Math.min(5, currentPhase + 1))}
              disabled={currentPhase === 5}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isEnglish ? 'Next Phase →' : '下一階段 →'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {isEnglish ? 'Implementation Steps' : '實施步驟'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h4 className="font-semibold">
                  {isEnglish ? 'Login to Cloudflare' : '登入 Cloudflare'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {isEnglish 
                    ? 'Go to dash.cloudflare.com and select your domain'
                    : '前往 dash.cloudflare.com 並選擇您的域名'
                  }
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open('https://dash.cloudflare.com', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  {isEnglish ? 'Open Cloudflare' : '打開 Cloudflare'}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h4 className="font-semibold">
                  {isEnglish ? 'Add DNS Record' : '添加 DNS 記錄'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {isEnglish 
                    ? 'Navigate to DNS → Records → Add record'
                    : '前往 DNS → Records → Add record'
                  }
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {isEnglish 
                    ? 'Copy the record details above and paste into Cloudflare'
                    : '複製上方的記錄詳情並貼到 Cloudflare'
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h4 className="font-semibold">
                  {isEnglish ? 'Wait for DNS Propagation' : '等待 DNS 傳播'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {isEnglish 
                    ? 'Wait 10-30 minutes for DNS changes to propagate globally'
                    : '等待 10-30 分鐘讓 DNS 變更全球傳播'
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h4 className="font-semibold">
                  {isEnglish ? 'Verify Configuration' : '驗證配置'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {isEnglish 
                    ? 'Use MX Toolbox to verify your DMARC record'
                    : '使用 MX Toolbox 驗證您的 DMARC 記錄'
                  }
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://mxtoolbox.com/dmarc.aspx', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    MX Toolbox
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://www.mail-tester.com', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Mail Tester
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                5
              </div>
              <div>
                <h4 className="font-semibold">
                  {isEnglish ? 'Monitor Reports' : '監控報告'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {isEnglish 
                    ? `Check ${reportEmail} for DMARC reports and monitor for issues`
                    : `檢查 ${reportEmail} 的 DMARC 報告並監控問題`
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold">
                6
              </div>
              <div>
                <h4 className="font-semibold">
                  {isEnglish ? 'Advance to Next Phase' : '進入下一階段'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {isEnglish 
                    ? `After ${currentConfig.duration}, if no issues, advance to the next phase`
                    : `${currentConfig.duration}後，如無問題，進入下一階段`
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isEnglish ? 'Quick Reference' : '快速參考'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 text-green-700">
                {isEnglish ? 'Monitoring (p=none)' : '監控 (p=none)'}
              </h4>
              <p className="text-sm text-gray-600">
                {isEnglish 
                  ? 'Only collect reports, no action taken'
                  : '僅收集報告，不採取行動'
                }
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 text-yellow-700">
                {isEnglish ? 'Quarantine (p=quarantine)' : '隔離 (p=quarantine)'}
              </h4>
              <p className="text-sm text-gray-600">
                {isEnglish 
                  ? 'Send suspicious emails to spam folder'
                  : '將可疑郵件發送到垃圾郵件夾'
                }
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 text-red-700">
                {isEnglish ? 'Reject (p=reject)' : '拒絕 (p=reject)'}
              </h4>
              <p className="text-sm text-gray-600">
                {isEnglish 
                  ? 'Completely reject unauthenticated emails'
                  : '完全拒絕未驗證的郵件'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}