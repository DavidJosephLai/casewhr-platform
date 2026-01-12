import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useState } from 'react';
import { Sparkles, TrendingUp, Target, Zap, Search, Globe, BarChart3, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

interface AISEOAnalyzerProps {
  language: 'en' | 'zh-TW' | 'zh-CN';
  currentPage?: string;
  onApplyOptimization?: (optimization: SEOOptimization) => void;
}

interface SEOOptimization {
  title: string;
  description: string;
  keywords: string[];
  contentSuggestions: string[];
  score: number;
}

interface SEOAnalysisResult {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  issues: SEOIssue[];
  suggestions: string[];
  optimizedContent: SEOOptimization;
  competitors: CompetitorAnalysis[];
}

interface SEOIssue {
  type: 'critical' | 'warning' | 'info';
  message: string;
  fix: string;
}

interface CompetitorAnalysis {
  domain: string;
  score: number;
  strengths: string[];
}

export function AISEOAnalyzer({ language, currentPage = 'home', onApplyOptimization }: AISEOAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SEOAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'optimization' | 'competitors'>('analysis');

  const translations = {
    en: {
      title: 'AI SEO Analyzer',
      subtitle: 'Powered by Advanced AI - Optimize Your Search Rankings',
      analyzeButton: 'Analyze Current Page',
      analyzing: 'Analyzing SEO...',
      score: 'SEO Score',
      grade: 'Grade',
      issues: 'Issues Found',
      suggestions: 'AI Suggestions',
      optimization: 'AI Optimization',
      competitors: 'Competitor Analysis',
      apply: 'Apply Optimization',
      critical: 'Critical',
      warning: 'Warning',
      info: 'Info',
      noAnalysis: 'Click "Analyze Current Page" to start AI SEO analysis',
      optimizedTitle: 'Optimized Title',
      optimizedDesc: 'Optimized Description',
      keywords: 'Keywords',
      contentSuggestions: 'Content Suggestions',
      competitorDomain: 'Competitor Domain',
      competitorScore: 'Score',
      strengths: 'Strengths',
    },
    'zh-TW': {
      title: 'AI SEO 分析器',
      subtitle: '由先進 AI 驅動 - 優化您的搜索排名',
      analyzeButton: '分析當前頁面',
      analyzing: '正在分析 SEO...',
      score: 'SEO 評分',
      grade: '等級',
      issues: '發現問題',
      suggestions: 'AI 建議',
      optimization: 'AI 優化',
      competitors: '競爭對手分析',
      apply: '應用優化',
      critical: '嚴重',
      warning: '警告',
      info: '資訊',
      noAnalysis: '點擊「分析當前���面」開始 AI SEO 分析',
      optimizedTitle: '優化標題',
      optimizedDesc: '優化描述',
      keywords: '關鍵詞',
      contentSuggestions: '內容建議',
      competitorDomain: '競爭對手域名',
      competitorScore: '評分',
      strengths: '優勢',
    },
    'zh-CN': {
      title: 'AI SEO 分析器',
      subtitle: '由先进 AI 驱动 - 优化您的搜索排名',
      analyzeButton: '分析当前页面',
      analyzing: '正在分析 SEO...',
      score: 'SEO 评分',
      grade: '等级',
      issues: '发现问题',
      suggestions: 'AI 建议',
      optimization: 'AI 优化',
      competitors: '竞争对手分析',
      apply: '应用优化',
      critical: '严重',
      warning: '警告',
      info: '信息',
      noAnalysis: '点击「分析当前页面」开始 AI SEO 分析',
      optimizedTitle: '优化标题',
      optimizedDesc: '优化描述',
      keywords: '关键词',
      contentSuggestions: '内容建议',
      competitorDomain: '竞争对手域名',
      competitorScore: '评分',
      strengths: '优势',
    },
  };

  const t = translations[language];

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    
    try {
      // 獲取當前頁面的 SEO 數據
      const pageTitle = document.title;
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
      const pageContent = document.body.innerText.substring(0, 2000); // 獲取前2000字符
      
      // 調用後端 AI SEO 分析 API
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/analyze`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            language,
            page: currentPage,
            currentSEO: {
              title: pageTitle,
              description: metaDescription,
              keywords: metaKeywords,
              content: pageContent,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI SEO analysis failed:', errorText);
        throw new Error(`AI SEO analysis failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error('AI SEO Analysis Error:', error);
      console.error('完整錯誤信息:', {
        message: error.message,
        stack: error.stack
      });
      toast.error(
        language === 'en'
          ? `Analysis failed: ${error.message || 'Unknown error'}`
          : `分析失敗: ${error.message || '未知錯誤'}`
      );
      // 使用模擬數據以便測試
      setResult(getMockAnalysisResult());
    } finally {
      setAnalyzing(false);
    }
  };

  const getMockAnalysisResult = (): SEOAnalysisResult => {
    return {
      score: 85,
      grade: 'A',
      issues: [
        {
          type: 'warning',
          message: language === 'en' 
            ? 'Meta description is too short (under 120 characters)' 
            : '描述標籤太短（少於120字符）',
          fix: language === 'en'
            ? 'Expand to 150-160 characters for better click-through rates'
            : '擴展至150-160字符以提高點擊率',
        },
        {
          type: 'info',
          message: language === 'en'
            ? 'Consider adding more internal links'
            : '建議添加更多內部連結',
          fix: language === 'en'
            ? 'Add 3-5 relevant internal links to improve navigation'
            : '添加3-5個相關內部連結以改善導航',
        },
      ],
      suggestions: [
        language === 'en'
          ? '✨ Add schema markup for better rich snippets'
          : '✨ 添加結構化數據以獲得更好的富媒體摘要',
        language === 'en'
          ? '🎯 Include primary keyword in H1 heading'
          : '🎯 在H1標題中包含主要關鍵詞',
        language === 'en'
          ? '🚀 Optimize images with descriptive alt text'
          : '🚀 使用描述性alt文本優化圖片',
        language === 'en'
          ? '📱 Ensure mobile-first indexing optimization'
          : '📱 確保移動優先索引優化',
      ],
      optimizedContent: {
        title: language === 'en'
          ? 'CaseWHR - #1 Global Freelancing Platform | Taiwan 2025'
          : 'CaseWHR 接得準 - 全球第一接案平台 | 台灣 2025',
        description: language === 'en'
          ? 'Join 10,000+ professionals on CaseWHR, Taiwan\'s leading global freelancing platform. Multi-currency support (TWD, USD, CNY), ECPay & PayPal integration, complete contract management. Start freelancing today!'
          : '加入 CaseWHR 接得準，台灣領先的全球接案平台，已有 10,000+ 專業人才。支援多幣別（台幣、美金、人民幣），整合 ECPay 綠界與 PayPal，完整合約管理。立即開始接案！',
        keywords: [
          language === 'en' ? 'freelancing platform' : '接案平台',
          language === 'en' ? 'remote work Taiwan' : '台灣遠距工作',
          language === 'en' ? 'freelancer marketplace' : '自由工作者平台',
          language === 'en' ? 'ECPay payment' : 'ECPay 支付',
          language === 'en' ? 'global outsourcing' : '全球外包',
        ],
        contentSuggestions: [
          language === 'en'
            ? '📝 Add a "Success Stories" section with 3-5 case studies'
            : '📝 添加「成功案例」區塊，包含3-5個案例研究',
          language === 'en'
            ? '💬 Include customer testimonials with photos'
            : '💬 加入附照片的客戶見證',
          language === 'en'
            ? '📊 Add statistics: project completion rate, average response time'
            : '📊 添加統計數據：專案完成率、平均回應時間',
          language === 'en'
            ? '🎥 Embed a platform walkthrough video (2-3 minutes)'
            : '🎥 嵌入平台導覽影片（2-3分鐘）',
        ],
        score: 92,
      },
      competitors: [
        {
          domain: 'upwork.com',
          score: 88,
          strengths: [
            language === 'en' ? 'Strong brand recognition' : '強大品牌認知度',
            language === 'en' ? 'Extensive talent pool' : '廣泛人才庫',
          ],
        },
        {
          domain: 'fiverr.com',
          score: 85,
          strengths: [
            language === 'en' ? 'Simple pricing model' : '簡單定價模式',
            language === 'en' ? 'Fast turnaround' : '快速交付',
          ],
        },
      ],
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeBadgeColor = (grade: string) => {
    if (grade === 'A+' || grade === 'A') return 'bg-green-100 text-green-800';
    if (grade === 'B') return 'bg-blue-100 text-blue-800';
    if (grade === 'C') return 'bg-yellow-100 text-yellow-800';
    if (grade === 'D') return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getIssueIcon = (type: string) => {
    if (type === 'critical') return <XCircle className="w-5 h-5 text-red-500" />;
    if (type === 'warning') return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-2xl font-bold">{t.title}</h2>
            </div>
            <p className="text-purple-100">{t.subtitle}</p>
          </div>
          <button
            onClick={analyzeWithAI}
            disabled={analyzing}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
                {t.analyzing}
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                {t.analyzeButton}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="p-6">
        {!result ? (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>{t.noAnalysis}</p>
          </div>
        ) : (
          <>
            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-600">{t.score}</span>
                </div>
                <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score}
                  <span className="text-xl text-gray-400">/100</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">{t.grade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-4xl font-bold px-4 py-1 rounded-lg ${getGradeBadgeColor(result.grade)}`}>
                    {result.grade}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="text-sm text-gray-600">{t.issues}</span>
                </div>
                <div className="text-4xl font-bold text-orange-600">
                  {result.issues.length}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-6 py-3 font-semibold transition-colors relative ${
                  activeTab === 'analysis'
                    ? 'text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.suggestions}
                {activeTab === 'analysis' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('optimization')}
                className={`px-6 py-3 font-semibold transition-colors relative ${
                  activeTab === 'optimization'
                    ? 'text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.optimization}
                {activeTab === 'optimization' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('competitors')}
                className={`px-6 py-3 font-semibold transition-colors relative ${
                  activeTab === 'competitors'
                    ? 'text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.competitors}
                {activeTab === 'competitors' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
                )}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {/* Issues */}
                {result.issues.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4">{t.issues}</h3>
                    <div className="space-y-3">
                      {result.issues.map((issue, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start gap-3">
                            {getIssueIcon(issue.type)}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 mb-1">{issue.message}</p>
                              <p className="text-sm text-gray-600">{issue.fix}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Suggestions */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">{t.suggestions}</h3>
                  <div className="space-y-2">
                    {result.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="bg-purple-50 p-4 rounded-lg border border-purple-200 flex items-start gap-3"
                      >
                        <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'optimization' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Target className="w-6 h-6 text-purple-600" />
                      <h3 className="font-semibold text-lg">
                        {language === 'en' ? 'AI-Generated Optimization' : 'AI 生成優化'}
                      </h3>
                    </div>
                    {onApplyOptimization && (
                      <button
                        onClick={() => onApplyOptimization(result.optimizedContent)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                      >
                        {t.apply}
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                        {t.optimizedTitle}
                      </label>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        {result.optimizedContent.title}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                        {t.optimizedDesc}
                      </label>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        {result.optimizedContent.description}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                        {t.keywords}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {result.optimizedContent.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                        {t.contentSuggestions}
                      </label>
                      <div className="space-y-2">
                        {result.optimizedContent.contentSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="bg-white p-3 rounded-lg border border-gray-200 text-sm"
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'competitors' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-6 h-6 text-blue-600" />
                  <h3 className="font-semibold text-lg">
                    {language === 'en' ? 'Competitor SEO Analysis' : '競爭對手 SEO 分析'}
                  </h3>
                </div>
                {result.competitors.map((competitor, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-6 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{competitor.domain}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">{t.competitorScore}:</span>
                          <span className={`font-bold ${getScoreColor(competitor.score)}`}>
                            {competitor.score}/100
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">{t.strengths}:</p>
                      <ul className="space-y-1">
                        {competitor.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}