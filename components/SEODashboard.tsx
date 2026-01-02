import { useState, useEffect } from 'react';
import { TrendingUp, Search, FileText, Globe, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { analyzeLocalSEO } from '../lib/aiSeoService';

interface PageSEOStatus {
  page: string;
  title: string;
  description: string;
  keywords: string;
  score: number;
  status: 'excellent' | 'good' | 'needs-work';
}

/**
 * SEO 監控儀表板
 * 顯示所有頁面的 SEO 狀態概覽
 */
export function SEODashboard() {
  const { language } = useLanguage();
  const [pages, setPages] = useState<PageSEOStatus[]>([]);
  const [averageScore, setAverageScore] = useState(0);

  const translations = {
    en: {
      title: 'SEO Dashboard',
      subtitle: 'Monitor SEO performance across all pages',
      averageScore: 'Average Score',
      totalPages: 'Total Pages',
      excellent: 'Excellent',
      good: 'Good',
      needsWork: 'Needs Work',
      page: 'Page',
      score: 'Score',
      status: 'Status',
      viewDetails: 'View Details',
    },
    'zh-TW': {
      title: 'SEO 儀表板',
      subtitle: '監控所有頁面的 SEO 表現',
      averageScore: '平均分數',
      totalPages: '總頁面數',
      excellent: '優秀',
      good: '良好',
      needsWork: '需要改進',
      page: '頁面',
      score: '分數',
      status: '狀態',
      viewDetails: '查看詳情',
    },
    'zh-CN': {
      title: 'SEO 仪表板',
      subtitle: '监控所有页面的 SEO 表现',
      averageScore: '平均分数',
      totalPages: '总页面数',
      excellent: '优秀',
      good: '良好',
      needsWork: '需要改进',
      page: '页面',
      score: '分数',
      status: '状态',
      viewDetails: '查看详情',
    },
  };

  const t = translations[language] || translations['zh-TW'];

  // 模擬頁面數據（實際應該從 seoConfig 獲取）
  useEffect(() => {
    const mockPages: PageSEOStatus[] = [
      {
        page: 'home',
        title: 'CaseWHR 接得準 - 全球專業接案平台',
        description: '台灣領先的全球接案平台，提供專業的自由工作者媒合服務...',
        keywords: '接案平台, 自由工作者, 台灣接案, 遠距工作',
        score: 0,
        status: 'excellent',
      },
      {
        page: 'pricing',
        title: '定價方案 - CaseWHR 接得準',
        description: '查看 CaseWHR 平台的定價方案...',
        keywords: '定價, 價格, 方案',
        score: 0,
        status: 'good',
      },
      {
        page: 'about',
        title: '關於我們 - CaseWHR',
        description: '了解 CaseWHR 平台...',
        keywords: '關於, 公司',
        score: 0,
        status: 'needs-work',
      },
    ];

    // 計算每個頁面的分數
    const analyzedPages = mockPages.map(page => {
      const analysis = analyzeLocalSEO(page.title, page.description, page.keywords);
      const status =
        analysis.score >= 80
          ? 'excellent'
          : analysis.score >= 60
          ? 'good'
          : 'needs-work';

      return {
        ...page,
        score: analysis.score,
        status,
      };
    });

    setPages(analyzedPages);

    // 計算平均分數
    const total = analyzedPages.reduce((sum, page) => sum + page.score, 0);
    setAverageScore(Math.round(total / analyzedPages.length));
  }, []);

  const excellentCount = pages.filter(p => p.status === 'excellent').length;
  const goodCount = pages.filter(p => p.status === 'good').length;
  const needsWorkCount = pages.filter(p => p.status === 'needs-work').length;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl">{t.title}</h1>
        </div>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Average Score */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{t.averageScore}</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl mb-1">{averageScore}</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                averageScore >= 80
                  ? 'bg-green-500'
                  : averageScore >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${averageScore}%` }}
            />
          </div>
        </div>

        {/* Total Pages */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{t.totalPages}</span>
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl">{pages.length}</div>
          <div className="text-xs text-gray-500 mt-1">
            {language === 'en' ? 'Monitored pages' : '監控頁面'}
          </div>
        </div>

        {/* Excellent */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{t.excellent}</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl text-green-600">{excellentCount}</div>
          <div className="text-xs text-gray-500 mt-1">80-100 {t.score}</div>
        </div>

        {/* Needs Work */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{t.needsWork}</span>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl text-red-600">{needsWorkCount}</div>
          <div className="text-xs text-gray-500 mt-1">0-59 {t.score}</div>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700">
                {t.page}
              </th>
              <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700">
                {t.score}
              </th>
              <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700">
                {t.status}
              </th>
              <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-gray-700">
                {language === 'en' ? 'Actions' : '操作'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pages.map((page, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm">{page.title}</div>
                      <div className="text-xs text-gray-500">/{page.page}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">{page.score}</div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          page.status === 'excellent'
                            ? 'bg-green-500'
                            : page.status === 'good'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${page.score}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                      page.status === 'excellent'
                        ? 'bg-green-100 text-green-800'
                        : page.status === 'good'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {page.status === 'excellent' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {page.status === 'excellent'
                      ? t.excellent
                      : page.status === 'good'
                      ? t.good
                      : t.needsWork}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 hover:text-blue-700 text-sm">
                    {t.viewDetails}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg mb-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          {language === 'en' ? 'SEO Tips' : 'SEO 優化建議'}
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            {language === 'en'
              ? 'Maintain title length between 50-60 characters'
              : '保持標題長度在 50-60 字元之間'}
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            {language === 'en'
              ? 'Keep meta descriptions between 150-160 characters'
              : '保持 meta 描述在 150-160 字元之間'}
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            {language === 'en'
              ? 'Use 5-10 relevant keywords per page'
              : '每個頁面使用 5-10 個相關關鍵字'}
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            {language === 'en'
              ? 'Regularly update content to improve rankings'
              : '定期更新內容以提升排名'}
          </li>
        </ul>
      </div>
    </div>
  );
}
