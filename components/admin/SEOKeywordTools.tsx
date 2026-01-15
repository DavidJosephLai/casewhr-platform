/**
 * SEO Keyword Analysis Tools
 * 關鍵字分析、標題優化、Meta Description 生成器
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Search, TrendingUp, FileText, Link as LinkIcon, AlertCircle, CheckCircle2, Lightbulb, Target, BarChart } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

interface KeywordAnalysis {
  keyword: string;
  frequency: number;
  density: number;
  category: 'high' | 'medium' | 'low';
}

interface SEOScore {
  score: number;
  titleScore: number;
  descriptionScore: number;
  keywordScore: number;
  lengthScore: number;
  issues: string[];
  suggestions: string[];
}

export function SEOKeywordTools() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'analyzer' | 'titleOptimizer' | 'metaGenerator' | 'urlSlug'>('analyzer');

  // 關鍵字分析器狀態
  const [analysisText, setAnalysisText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<KeywordAnalysis[]>([]);

  // 標題優化器狀態
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [seoScore, setSeoScore] = useState<SEOScore | null>(null);

  // Meta Description 生成器狀態
  const [metaKeywords, setMetaKeywords] = useState('');
  const [generatedMeta, setGeneratedMeta] = useState('');

  // URL Slug 生成器狀態
  const [urlInput, setUrlInput] = useState('');
  const [generatedSlug, setGeneratedSlug] = useState('');

  // 熱門關鍵字數據庫（台灣接案平台相關）
  const popularKeywords = {
    'zh-TW': [
      { keyword: '接案平台', volume: 12000, competition: 'high', cpc: 'NT$15-25' },
      { keyword: '台灣接案', volume: 8100, competition: 'medium', cpc: 'NT$10-18' },
      { keyword: '外包平台', volume: 6600, competition: 'high', cpc: 'NT$12-22' },
      { keyword: '自由工作者', volume: 4400, competition: 'medium', cpc: 'NT$8-15' },
      { keyword: '遠距工作', volume: 5200, competition: 'medium', cpc: 'NT$10-20' },
      { keyword: '接案網站', volume: 3300, competition: 'low', cpc: 'NT$6-12' },
      { keyword: '斜槓工作', volume: 2900, competition: 'low', cpc: 'NT$5-10' },
      { keyword: '兼職平台', volume: 2400, competition: 'medium', cpc: 'NT$7-14' },
      { keyword: '專案外包', volume: 2100, competition: 'low', cpc: 'NT$8-16' },
      { keyword: '在家工作', volume: 9800, competition: 'high', cpc: 'NT$12-25' },
      { keyword: 'logo設計接案', volume: 1800, competition: 'low', cpc: 'NT$10-18' },
      { keyword: '網站製作接案', volume: 1600, competition: 'medium', cpc: 'NT$15-30' },
      { keyword: '程式外包', volume: 2200, competition: 'medium', cpc: 'NT$18-35' },
      { keyword: '文案接案', volume: 1400, competition: 'low', cpc: 'NT$8-15' },
      { keyword: '翻譯接案', volume: 1300, competition: 'low', cpc: 'NT$10-20' },
    ],
    'en': [
      { keyword: 'freelance platform', volume: 33100, competition: 'high', cpc: '$2-4' },
      { keyword: 'remote work', volume: 110000, competition: 'high', cpc: '$3-6' },
      { keyword: 'global freelancing', volume: 8100, competition: 'medium', cpc: '$1.5-3' },
      { keyword: 'talent marketplace', volume: 4400, competition: 'medium', cpc: '$2-5' },
      { keyword: 'project outsourcing', volume: 3600, competition: 'low', cpc: '$1-2.5' },
      { keyword: 'freelancer', volume: 450000, competition: 'high', cpc: '$2-5' },
      { keyword: 'gig economy', volume: 27100, competition: 'medium', cpc: '$1.5-3' },
      { keyword: 'contract work', volume: 12100, competition: 'medium', cpc: '$2-4' },
    ],
    'zh-CN': [
      { keyword: '接案平台', volume: 8900, competition: 'medium', cpc: '¥6-12' },
      { keyword: '自由职业者', volume: 14800, competition: 'high', cpc: '¥8-15' },
      { keyword: '远程工作', volume: 22000, competition: 'high', cpc: '¥10-20' },
      { keyword: '外包平台', volume: 6700, competition: 'medium', cpc: '¥5-10' },
      { keyword: '项目外包', volume: 4500, competition: 'low', cpc: '¥4-8' },
    ]
  };

  const content = {
    'en': {
      title: 'SEO Keyword Analysis Tools',
      description: 'Optimize your content with keyword analysis, title optimization, and meta description generation',
      tabs: {
        analyzer: 'Keyword Analyzer',
        titleOptimizer: 'Title Optimizer',
        metaGenerator: 'Meta Generator',
        urlSlug: 'URL Slug',
      },
      // 關鍵字分析器
      analyzerTitle: 'Keyword Density Analyzer',
      analyzerDesc: 'Analyze keyword frequency and density in your content',
      analyzerPlaceholder: 'Paste your content here for SEO keyword analysis...',
      analyzeBtn: 'Analyze Keywords',
      noKeywords: 'No keywords found. Please enter content to analyze.',
      frequency: 'Frequency',
      density: 'Density',
      // 標題優化器
      titleOptimizerTitle: 'Project Title SEO Optimizer',
      titleOptimizerDesc: 'Check SEO score and get optimization suggestions',
      projectTitleLabel: 'Project Title',
      projectTitlePlaceholder: 'Enter project title (e.g., "Professional Logo Design Service")',
      projectDescLabel: 'Project Description',
      projectDescPlaceholder: 'Enter project description (optional)',
      checkSEOBtn: 'Check SEO Score',
      seoScoreTitle: 'SEO Score',
      titleScoreLabel: 'Title Score',
      descScoreLabel: 'Description Score',
      keywordScoreLabel: 'Keyword Score',
      lengthScoreLabel: 'Length Score',
      issues: 'Issues',
      suggestions: 'Suggestions',
      // Meta Description 生成器
      metaGenTitle: 'Meta Description Generator',
      metaGenDesc: 'Generate SEO-friendly meta descriptions',
      metaKeywordsLabel: 'Keywords (comma separated)',
      metaKeywordsPlaceholder: 'e.g., freelance, design, development',
      generateBtn: 'Generate Meta Description',
      generatedMetaTitle: 'Generated Meta Description',
      copyBtn: 'Copy',
      // URL Slug 生成器
      urlSlugTitle: 'SEO-Friendly URL Slug Generator',
      urlSlugDesc: 'Convert titles to SEO-friendly URL slugs',
      urlInputLabel: 'Title or Text',
      urlInputPlaceholder: 'e.g., "Professional Web Development Service"',
      generateSlugBtn: 'Generate Slug',
      generatedSlugTitle: 'Generated URL Slug',
      // 熱門關鍵字
      popularKeywordsTitle: 'Popular Keywords',
      popularKeywordsDesc: 'High-volume keywords for freelance platforms',
      keywordCol: 'Keyword',
      volumeCol: 'Monthly Searches',
      competitionCol: 'Competition',
      cpcCol: 'CPC',
    },
    'zh-TW': {
      title: 'SEO 關鍵字分析工具',
      description: '關鍵字分析、標題優化、Meta Description 生成器',
      tabs: {
        analyzer: '關鍵字分析',
        titleOptimizer: '標題優化',
        metaGenerator: 'Meta 生成',
        urlSlug: 'URL 生成',
      },
      // 關鍵字分析器
      analyzerTitle: '關鍵字密度分析器',
      analyzerDesc: '分析內容中的關鍵字頻率和密度',
      analyzerPlaceholder: '貼上您的內容，進行 SEO 關鍵字分析...',
      analyzeBtn: '分析關鍵字',
      noKeywords: '未找到關鍵字。請輸入內容進行分析。',
      frequency: '出現次數',
      density: '密度',
      // 標題優化器
      titleOptimizerTitle: '案件標題 SEO 優化器',
      titleOptimizerDesc: '檢查 SEO 分數並獲取優化建議',
      projectTitleLabel: '案件標題',
      projectTitlePlaceholder: '輸入案件標題（例如：「專業 Logo 設計服務」）',
      projectDescLabel: '案件描述',
      projectDescPlaceholder: '輸入案件描述（選填）',
      checkSEOBtn: '檢查 SEO 分數',
      seoScoreTitle: 'SEO 分數',
      titleScoreLabel: '標題分數',
      descScoreLabel: '描述分數',
      keywordScoreLabel: '關鍵字分數',
      lengthScoreLabel: '長度分數',
      issues: '問題',
      suggestions: '建議',
      // Meta Description 生成器
      metaGenTitle: 'Meta Description 生成器',
      metaGenDesc: '生成符合 SEO 的 Meta 描述',
      metaKeywordsLabel: '關鍵字（逗號分隔）',
      metaKeywordsPlaceholder: '例如：接案、設計、開發',
      generateBtn: '生成 Meta Description',
      generatedMetaTitle: '生成的 Meta Description',
      copyBtn: '複製',
      // URL Slug 生成器
      urlSlugTitle: 'SEO 友善 URL Slug 生成器',
      urlSlugDesc: '將標題轉換為 SEO 友善的 URL',
      urlInputLabel: '標題或文字',
      urlInputPlaceholder: '例如：「專業網站開發服務」',
      generateSlugBtn: '生成 Slug',
      generatedSlugTitle: '生成的 URL Slug',
      // 熱門關鍵字
      popularKeywordsTitle: '熱門關鍵字',
      popularKeywordsDesc: '接案平台高搜索量關鍵字',
      keywordCol: '關鍵字',
      volumeCol: '月搜索量',
      competitionCol: '競爭度',
      cpcCol: '建議出價',
    },
    'zh-CN': {
      title: 'SEO 关键字分析工具',
      description: '关键字分析、标题优化、Meta Description 生成器',
      tabs: {
        analyzer: '关键字分析',
        titleOptimizer: '标题优化',
        metaGenerator: 'Meta 生成',
        urlSlug: 'URL 生成',
      },
      // 關鍵字分析器
      analyzerTitle: '关键字密度分析器',
      analyzerDesc: '分析内容中的关键字频率和密度',
      analyzerPlaceholder: '粘贴您的内容，进行 SEO 关键字分析...',
      analyzeBtn: '分析关键字',
      noKeywords: '未找到关键字。请输入内容进行分析。',
      frequency: '出现次数',
      density: '密度',
      // 標題優化器
      titleOptimizerTitle: '案件标题 SEO 优化器',
      titleOptimizerDesc: '检查 SEO 分数并获取优化建议',
      projectTitleLabel: '案件标题',
      projectTitlePlaceholder: '输入案件标题（例如："专业 Logo 设计服务"）',
      projectDescLabel: '案件描述',
      projectDescPlaceholder: '输入案件描述（选填）',
      checkSEOBtn: '检查 SEO 分数',
      seoScoreTitle: 'SEO 分数',
      titleScoreLabel: '标题分数',
      descScoreLabel: '描述分数',
      keywordScoreLabel: '关键字分数',
      lengthScoreLabel: '长度分数',
      issues: '问题',
      suggestions: '建议',
      // Meta Description 生成器
      metaGenTitle: 'Meta Description 生成器',
      metaGenDesc: '生成符合 SEO 的 Meta 描述',
      metaKeywordsLabel: '关键字（逗号分隔）',
      metaKeywordsPlaceholder: '例如：接案、设计、开发',
      generateBtn: '生成 Meta Description',
      generatedMetaTitle: '生成的 Meta Description',
      copyBtn: '复制',
      // URL Slug 生成器
      urlSlugTitle: 'SEO 友好 URL Slug 生成器',
      urlSlugDesc: '将标题转换为 SEO 友好的 URL',
      urlInputLabel: '标题或文字',
      urlInputPlaceholder: '例如："专业网站开发服务"',
      generateSlugBtn: '生成 Slug',
      generatedSlugTitle: '生成的 URL Slug',
      // 熱門關鍵字
      popularKeywordsTitle: '热门关键字',
      popularKeywordsDesc: '接案平台高搜索量关键字',
      keywordCol: '关键字',
      volumeCol: '月搜索量',
      competitionCol: '竞争度',
      cpcCol: '建议出价',
    },
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];
  const keywords = popularKeywords[language as keyof typeof popularKeywords] || popularKeywords['zh-TW'];

  // 關鍵字分析邏輯
  const analyzeKeywords = () => {
    if (!analysisText.trim()) return;

    // 移除標點符號並轉為小寫
    const text = analysisText.toLowerCase();
    
    // 中文分詞（簡單版本）
    let words: string[] = [];
    if (language === 'zh-TW' || language === 'zh-CN') {
      // 提取 2-4 字的詞組
      for (let len = 4; len >= 2; len--) {
        for (let i = 0; i <= text.length - len; i++) {
          const word = text.slice(i, i + len);
          if (/[\u4e00-\u9fa5]{2,}/.test(word)) {
            words.push(word);
          }
        }
      }
    } else {
      // 英文分詞
      words = text
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3); // 只保留 4 字母以上的詞
    }

    // 統計詞頻
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // 計算總詞數
    const totalWords = words.length;

    // 轉換為分析結果
    const analysis: KeywordAnalysis[] = Object.entries(wordCount)
      .map(([keyword, frequency]) => {
        const density = (frequency / totalWords) * 100;
        let category: 'high' | 'medium' | 'low';
        if (density >= 2) category = 'high';
        else if (density >= 1) category = 'medium';
        else category = 'low';

        return { keyword, frequency, density, category };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20); // 只顯示前 20 個

    setAnalysisResult(analysis);
  };

  // 標題 SEO 分數計算
  const calculateSEOScore = () => {
    if (!projectTitle.trim()) return;

    let titleScore = 0;
    let descriptionScore = 0;
    let keywordScore = 0;
    let lengthScore = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 1. 標題長度評分（理想 40-60 字符）
    const titleLength = projectTitle.length;
    if (titleLength >= 40 && titleLength <= 60) {
      titleScore = 100;
    } else if (titleLength >= 30 && titleLength < 40) {
      titleScore = 80;
      suggestions.push(language === 'zh-TW' ? '標題可以再長一點（建議 40-60 字符）' : 'Title could be longer (40-60 chars recommended)');
    } else if (titleLength > 60) {
      titleScore = 70;
      issues.push(language === 'zh-TW' ? '標題過長，可能在搜尋結果中被截斷' : 'Title too long, may be truncated in search results');
    } else {
      titleScore = 50;
      issues.push(language === 'zh-TW' ? '標題太短，不利於 SEO' : 'Title too short for SEO');
    }

    // 2. 描述長度評分（理想 120-160 字符）
    const descLength = projectDescription.length;
    if (descLength >= 120 && descLength <= 160) {
      descriptionScore = 100;
    } else if (descLength >= 80 && descLength < 120) {
      descriptionScore = 70;
      suggestions.push(language === 'zh-TW' ? '描述可以更詳細（建議 120-160 字符）' : 'Description could be more detailed (120-160 chars)');
    } else if (descLength > 160) {
      descriptionScore = 60;
      issues.push(language === 'zh-TW' ? '描述過長' : 'Description too long');
    } else if (descLength > 0) {
      descriptionScore = 40;
      issues.push(language === 'zh-TW' ? '描述太短' : 'Description too short');
    }

    // 3. 關鍵字評分（檢查是否包含熱門關鍵字）
    const titleLower = projectTitle.toLowerCase();
    const descLower = projectDescription.toLowerCase();
    const combinedText = titleLower + ' ' + descLower;

    let keywordMatches = 0;
    keywords.forEach(kw => {
      if (combinedText.includes(kw.keyword.toLowerCase())) {
        keywordMatches++;
      }
    });

    if (keywordMatches >= 3) {
      keywordScore = 100;
      suggestions.push(language === 'zh-TW' ? `✅ 包含 ${keywordMatches} 個熱門關鍵字` : `✅ Contains ${keywordMatches} popular keywords`);
    } else if (keywordMatches >= 2) {
      keywordScore = 70;
      suggestions.push(language === 'zh-TW' ? '可以加入更多熱門關鍵字' : 'Consider adding more popular keywords');
    } else if (keywordMatches >= 1) {
      keywordScore = 50;
      issues.push(language === 'zh-TW' ? '關鍵字不足' : 'Insufficient keywords');
    } else {
      keywordScore = 20;
      issues.push(language === 'zh-TW' ? '未包含任何熱門關鍵字' : 'No popular keywords found');
    }

    // 4. 整體長度評分
    if (titleLength > 0 && descLength > 0) {
      lengthScore = 100;
    } else if (titleLength > 0) {
      lengthScore = 50;
      issues.push(language === 'zh-TW' ? '缺少描述' : 'Missing description');
    }

    // 計算總分
    const totalScore = Math.round((titleScore + descriptionScore + keywordScore + lengthScore) / 4);

    setSeoScore({
      score: totalScore,
      titleScore,
      descriptionScore,
      keywordScore,
      lengthScore,
      issues,
      suggestions,
    });
  };

  // Meta Description 生成器
  const generateMetaDescription = () => {
    if (!metaKeywords.trim()) return;

    const keywordList = metaKeywords.split(',').map(k => k.trim()).filter(k => k);
    
    const templates = {
      'zh-TW': [
        `在 CaseWhr 尋找專業的${keywordList[0]}服務。提供${keywordList.join('、')}等完整解決方案。立即發案，快速媒合優質人才！`,
        `${keywordList.join('、')}專業接案平台 - CaseWhr 提供安全的交易環境、多幣系統支援，讓您輕鬆找到最適合的專業人才。`,
        `CaseWhr 接得準：台灣領先的${keywordList[0]}接案平台。支援${keywordList.join('、')}，超過 10,000 位專業人才為您服務。`,
      ],
      'en': [
        `Find professional ${keywordList[0]} services on CaseWhr. Offering ${keywordList.join(', ')} solutions. Post your project and connect with top talent today!`,
        `${keywordList.join(', ')} freelance marketplace - CaseWhr provides secure transactions, multi-currency support, and connects you with verified professionals worldwide.`,
        `CaseWhr: Leading platform for ${keywordList[0]}. Specializing in ${keywordList.join(', ')}. Join 10,000+ professionals and businesses globally.`,
      ],
      'zh-CN': [
        `在 CaseWhr 寻找专业的${keywordList[0]}服务。提供${keywordList.join('、')}等完整解决方案。立即发案，快速匹配优质人才！`,
        `${keywordList.join('、')}专业接案平台 - CaseWhr 提供安全的交易环境、多币系统支持，让您轻松找到最适合的专业人才。`,
      ],
    };

    const langTemplates = templates[language as keyof typeof templates] || templates['zh-TW'];
    const randomTemplate = langTemplates[Math.floor(Math.random() * langTemplates.length)];
    
    setGeneratedMeta(randomTemplate);
  };

  // URL Slug 生成器
  const generateURLSlug = () => {
    if (!urlInput.trim()) return;

    let slug = urlInput.toLowerCase();

    // 中文轉拼音（簡化版本）
    if (/[\u4e00-\u9fa5]/.test(slug)) {
      // 如果包含中文，建議使用英文或羅馬拼音
      // 這裡我們使用簡單的替換
      const chineseToEnglish: { [key: string]: string } = {
        '設計': 'design',
        '開發': 'development',
        '程式': 'programming',
        '網站': 'website',
        '接案': 'freelance',
        '平台': 'platform',
        '專業': 'professional',
        '服務': 'service',
        '翻譯': 'translation',
        '文案': 'copywriting',
        'logo': 'logo',
      };

      Object.entries(chineseToEnglish).forEach(([zh, en]) => {
        slug = slug.replace(new RegExp(zh, 'g'), en);
      });
    }

    // 移除特殊字符，只保留字母、數字和連字符
    slug = slug
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    setGeneratedSlug(slug);
  };

  // 複製到剪貼板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(language === 'zh-TW' ? '已複製到剪貼板！' : 'Copied to clipboard!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b pb-2 flex-wrap">
          <Button
            variant={activeTab === 'analyzer' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('analyzer')}
          >
            <BarChart className="h-4 w-4 mr-2" />
            {t.tabs.analyzer}
          </Button>
          <Button
            variant={activeTab === 'titleOptimizer' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('titleOptimizer')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {t.tabs.titleOptimizer}
          </Button>
          <Button
            variant={activeTab === 'metaGenerator' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('metaGenerator')}
          >
            <FileText className="h-4 w-4 mr-2" />
            {t.tabs.metaGenerator}
          </Button>
          <Button
            variant={activeTab === 'urlSlug' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('urlSlug')}
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            {t.tabs.urlSlug}
          </Button>
        </div>

        {/* 1. 關鍵字分析器 */}
        {activeTab === 'analyzer' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.analyzerTitle}</h3>
              <p className="text-sm text-gray-600 mb-4">{t.analyzerDesc}</p>
              
              <Textarea
                value={analysisText}
                onChange={(e) => setAnalysisText(e.target.value)}
                placeholder={t.analyzerPlaceholder}
                rows={8}
                className="mb-4"
              />
              
              <Button onClick={analyzeKeywords} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                {t.analyzeBtn}
              </Button>
            </div>

            {/* 分析結果 */}
            {analysisResult.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">分析結果</h4>
                <div className="space-y-2">
                  {analysisResult.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg">{item.keyword}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.category === 'high' ? 'bg-red-100 text-red-700' :
                          item.category === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {item.category.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span>{t.frequency}: <strong>{item.frequency}</strong></span>
                        <span>{t.density}: <strong>{item.density.toFixed(2)}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.length === 0 && analysisText && (
              <div className="text-center text-gray-500 py-8">
                {t.noKeywords}
              </div>
            )}
          </div>
        )}

        {/* 2. 標題優化器 */}
        {activeTab === 'titleOptimizer' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.titleOptimizerTitle}</h3>
              <p className="text-sm text-gray-600 mb-4">{t.titleOptimizerDesc}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t.projectTitleLabel}</label>
                  <Input
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder={t.projectTitlePlaceholder}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t.projectDescLabel}</label>
                  <Textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder={t.projectDescPlaceholder}
                    rows={4}
                  />
                </div>

                <Button onClick={calculateSEOScore} className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {t.checkSEOBtn}
                </Button>
              </div>
            </div>

            {/* SEO 分數結果 */}
            {seoScore && (
              <div className="border rounded-lg p-4 space-y-4">
                {/* 總分 */}
                <div className="text-center">
                  <h4 className="text-sm text-gray-600 mb-2">{t.seoScoreTitle}</h4>
                  <div className={`text-6xl font-bold ${
                    seoScore.score >= 80 ? 'text-green-600' :
                    seoScore.score >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {seoScore.score}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">/ 100</div>
                </div>

                {/* 分項評分 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm text-gray-600">{t.titleScoreLabel}</div>
                    <div className="text-2xl font-bold text-blue-600">{seoScore.titleScore}</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="text-sm text-gray-600">{t.descScoreLabel}</div>
                    <div className="text-2xl font-bold text-purple-600">{seoScore.descriptionScore}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-sm text-gray-600">{t.keywordScoreLabel}</div>
                    <div className="text-2xl font-bold text-green-600">{seoScore.keywordScore}</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <div className="text-sm text-gray-600">{t.lengthScoreLabel}</div>
                    <div className="text-2xl font-bold text-orange-600">{seoScore.lengthScore}</div>
                  </div>
                </div>

                {/* 問題 */}
                {seoScore.issues.length > 0 && (
                  <div className="bg-red-50 p-4 rounded">
                    <h5 className="font-semibold text-red-700 flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      {t.issues}
                    </h5>
                    <ul className="space-y-1 text-sm text-red-600">
                      {seoScore.issues.map((issue, i) => (
                        <li key={i}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 建議 */}
                {seoScore.suggestions.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded">
                    <h5 className="font-semibold text-blue-700 flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4" />
                      {t.suggestions}
                    </h5>
                    <ul className="space-y-1 text-sm text-blue-600">
                      {seoScore.suggestions.map((suggestion, i) => (
                        <li key={i}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Meta Description 生成器 */}
        {activeTab === 'metaGenerator' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.metaGenTitle}</h3>
              <p className="text-sm text-gray-600 mb-4">{t.metaGenDesc}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t.metaKeywordsLabel}</label>
                  <Input
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder={t.metaKeywordsPlaceholder}
                  />
                </div>

                <Button onClick={generateMetaDescription} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  {t.generateBtn}
                </Button>
              </div>
            </div>

            {generatedMeta && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{t.generatedMetaTitle}</h4>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedMeta)}>
                    {t.copyBtn}
                  </Button>
                </div>
                <div className="bg-gray-50 p-4 rounded text-sm">
                  {generatedMeta}
                </div>
                <div className="text-xs text-gray-500">
                  Length: {generatedMeta.length} characters
                  {generatedMeta.length < 120 && ' (建議增加長度)'}
                  {generatedMeta.length > 160 && ' (建議縮短長度)'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. URL Slug 生成器 */}
        {activeTab === 'urlSlug' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.urlSlugTitle}</h3>
              <p className="text-sm text-gray-600 mb-4">{t.urlSlugDesc}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t.urlInputLabel}</label>
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={t.urlInputPlaceholder}
                  />
                </div>

                <Button onClick={generateURLSlug} className="w-full">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  {t.generateSlugBtn}
                </Button>
              </div>
            </div>

            {generatedSlug && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{t.generatedSlugTitle}</h4>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedSlug)}>
                    {t.copyBtn}
                  </Button>
                </div>
                <div className="bg-gray-50 p-4 rounded font-mono text-sm">
                  {generatedSlug}
                </div>
                <div className="text-xs text-gray-500">
                  Full URL: https://casewhr.com/projects/{generatedSlug}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 熱門關鍵字參考 */}
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">{t.popularKeywordsTitle}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">{t.popularKeywordsDesc}</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">{t.keywordCol}</th>
                  <th className="px-4 py-2 text-right">{t.volumeCol}</th>
                  <th className="px-4 py-2 text-center">{t.competitionCol}</th>
                  <th className="px-4 py-2 text-right">{t.cpcCol}</th>
                </tr>
              </thead>
              <tbody>
                {keywords.slice(0, 10).map((kw, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{kw.keyword}</td>
                    <td className="px-4 py-2 text-right">{kw.volume.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        kw.competition === 'high' ? 'bg-red-100 text-red-700' :
                        kw.competition === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {kw.competition}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">{kw.cpc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
