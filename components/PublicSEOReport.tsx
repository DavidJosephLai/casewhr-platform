import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  FileText, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign,
  Search,
  Award,
  AlertCircle,
  ExternalLink 
} from 'lucide-react';

interface AISEOReport {
  id: string;
  keyword: string;
  analysis: {
    seo_score: number;
    search_volume: number;
    competition: string;
    keyword_difficulty: number;
    cpc: number;
    search_intent: string;
    trend: string;
    content_suggestions: string[];
    long_tail_keywords: string[];
    top_ranking_pages: Array<{
      title: string;
      url: string;
      meta_description: string;
    }>;
    semantic_keywords: string[];
    content_gaps: string[];
    recommended_actions: string[];
  };
  createdAt: string;
  userId: string;
}

export function PublicSEOReport() {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<AISEOReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/public/seo-report/${reportId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('報告未找到');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err: any) {
      console.error('Error fetching report:', err);
      setError(err.message || '載入報告失敗');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入報告中...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">報告未找到</h2>
          <p className="text-gray-600 mb-6">{error || '此報告不存在或已被刪除'}</p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            返回首頁
          </a>
        </div>
      </div>
    );
  }

  const { analysis } = report;
  const pageTitle = `${report.keyword} - SEO 關鍵字分析報告 | CaseWHR`;
  const pageDescription = `深入分析「${report.keyword}」的 SEO 表現：搜尋量 ${analysis.search_volume?.toLocaleString() || 'N/A'}、競爭度 ${analysis.competition}、SEO 分數 ${analysis.seo_score}/100。${analysis.content_suggestions?.[0] || ''}`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`https://casewhr.com/seo-report/${reportId}`} />
        <meta property="og:site_name" content="CaseWHR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        
        {/* Additional SEO */}
        <meta name="keywords" content={`${report.keyword}, SEO分析, 關鍵字分析, ${analysis.semantic_keywords?.join(', ')}`} />
        <link rel="canonical" content={`https://casewhr.com/seo-report/${reportId}`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center space-x-2">
                <Search className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">CaseWHR</span>
              </a>
              <a
                href="/ai-seo-manager"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
              >
                <span>創建你的 SEO 報告</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Report Title */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 mb-8 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-10 h-10" />
              <h1 className="text-4xl font-bold">SEO 關鍵字分析報告</h1>
            </div>
            <p className="text-2xl font-semibold mb-2">關鍵字：{report.keyword}</p>
            <p className="text-blue-100">
              生成時間：{new Date(report.createdAt).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              icon={<Award className="w-6 h-6" />}
              title="SEO 分數"
              value={`${analysis.seo_score}/100`}
              color="blue"
            />
            <MetricCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="搜尋量"
              value={analysis.search_volume?.toLocaleString() || 'N/A'}
              color="green"
            />
            <MetricCard
              icon={<Target className="w-6 h-6" />}
              title="競爭度"
              value={analysis.competition}
              color="orange"
            />
            <MetricCard
              icon={<DollarSign className="w-6 h-6" />}
              title="每次點擊成本"
              value={`$${analysis.cpc?.toFixed(2) || '0.00'}`}
              color="purple"
            />
          </div>

          {/* Analysis Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Search Intent & Trend */}
            <InfoCard title="搜尋意圖與趨勢">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">搜尋意圖</p>
                  <p className="text-lg font-semibold text-gray-900">{analysis.search_intent}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">趨勢</p>
                  <p className="text-lg font-semibold text-gray-900">{analysis.trend}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">關鍵字難度</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${analysis.keyword_difficulty}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{analysis.keyword_difficulty}%</span>
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Content Suggestions */}
            <InfoCard title="內容建議">
              <ul className="space-y-2">
                {analysis.content_suggestions?.map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>

            {/* Long-tail Keywords */}
            <InfoCard title="長尾關鍵字">
              <div className="flex flex-wrap gap-2">
                {analysis.long_tail_keywords?.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </InfoCard>

            {/* Semantic Keywords */}
            <InfoCard title="語意相關關鍵字">
              <div className="flex flex-wrap gap-2">
                {analysis.semantic_keywords?.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </InfoCard>

            {/* Content Gaps */}
            <InfoCard title="內容缺口分析">
              <ul className="space-y-2">
                {analysis.content_gaps?.map((gap, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-orange-600 mt-1">⚠</span>
                    <span className="text-gray-700">{gap}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>

            {/* Recommended Actions */}
            <InfoCard title="建議行動">
              <ul className="space-y-2">
                {analysis.recommended_actions?.map((action, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">→</span>
                    <span className="text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>
          </div>

          {/* Top Ranking Pages */}
          {analysis.top_ranking_pages && analysis.top_ranking_pages.length > 0 && (
            <div className="mt-8">
              <InfoCard title="排名前列的頁面">
                <div className="space-y-4">
                  {analysis.top_ranking_pages.map((page, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <h4 className="font-semibold text-gray-900 mb-1">{page.title}</h4>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center space-x-1 mb-2"
                      >
                        <span>{page.url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <p className="text-gray-600 text-sm">{page.meta_description}</p>
                    </div>
                  ))}
                </div>
              </InfoCard>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">想要為你的關鍵字生成 SEO 報告？</h2>
            <p className="text-xl mb-6 text-blue-100">使用 CaseWHR 的 AI SEO 分析工具，快速取得專業的關鍵字分析報告</p>
            <a
              href="/ai-seo-manager"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              免費開始分析
            </a>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-gray-600">
              © 2025 CaseWHR. All rights reserved. | 
              <a href="/" className="text-blue-600 hover:underline ml-2">返回首頁</a>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

// Metric Card Component
interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function MetricCard({ icon, title, value, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// Info Card Component
interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

function InfoCard({ title, children }: InfoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
        <span>{title}</span>
      </h3>
      {children}
    </div>
  );
}
