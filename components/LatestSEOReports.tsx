import { useEffect, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { FileText, TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SEOReport {
  id: string;
  url: string;
  title: string;
  description: string;
  keywords: string[];
  generatedAt: string;
  customKeywords?: string | null;
}

export function LatestSEOReports() {
  const { language } = useLanguage();
  const [reports, setReports] = useState<SEOReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestReports();
  }, []);

  const fetchLatestReports = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/reports`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // 從 API 返回的 data.reports 中提取報告列表
        const reportsList = data.reports || [];
        // 只显示最新的 6 个报告
        setReports(reportsList.slice(0, 6));
      }
    } catch (error) {
      console.error('❌ [LatestSEOReports] Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getReportTitle = (report: SEOReport) => {
    return report.title || report.url || 'SEO Report';
  };

  const getReportDescription = (report: SEOReport) => {
    return report.description || '';
  };

  const getMainKeyword = (report: SEOReport) => {
    if (report.customKeywords) {
      return report.customKeywords;
    }
    if (report.keywords && report.keywords.length > 0) {
      return report.keywords[0];
    }
    return 'SEO Analysis';
  };

  if (loading || reports.length === 0) {
    return null; // 不显示任何内容
  }

  const translations = {
    en: {
      title: 'Latest SEO Reports',
      subtitle: 'Discover professional SEO analysis and insights',
      viewReport: 'View Report',
      publishedOn: 'Published',
    },
    zh: {
      title: '最新 SEO 報告',
      subtitle: '探索專業的 SEO 分析與洞察',
      viewReport: '查看報告',
      publishedOn: '發布於',
    },
    'zh-CN': {
      title: '最新 SEO 报告',
      subtitle: '探索专业的 SEO 分析与洞察',
      viewReport: '查看报告',
      publishedOn: '发布于',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            <span>SEO Insights</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* 报告网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reports.map((report) => (
            <a
              key={report.id}
              href={`/seo-report/${report.id}`}
              className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1"
            >
              {/* 卡片头部 */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                <div className="flex items-start justify-between">
                  <FileText className="w-8 h-8 text-white" />
                  <ExternalLink className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
                </div>
              </div>

              {/* 卡片内容 */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {getReportTitle(report)}
                </h3>
                
                {getReportDescription(report) && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {getReportDescription(report)}
                  </p>
                )}

                {/* 关键词标签 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    🎯 {getMainKeyword(report)}
                  </span>
                </div>

                {/* 日期和按钮 */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(report.generatedAt)}</span>
                  </div>
                  <span className="text-blue-600 font-medium text-sm group-hover:gap-2 inline-flex items-center gap-1 transition-all">
                    {t.viewReport}
                    <ExternalLink className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* 查看更多按钮 */}
        {reports.length >= 6 && (
          <div className="text-center mt-12">
            <a
              href="/#ai-seo"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <TrendingUp className="w-5 h-5" />
              {language === 'en' ? 'View All Reports' : language === 'zh-CN' ? '查看所有报告' : '查看所有報告'}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}