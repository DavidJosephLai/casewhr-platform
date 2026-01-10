/**
 * 關鍵字研究測試頁面
 * 測試 AI SEO 關鍵字生成功能
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Search, 
  Loader2, 
  TrendingUp, 
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from '../lib/LanguageContext';
import { toast } from 'sonner';

interface Keyword {
  keyword: string;
  relevance: number;
  difficulty: string;
  searchVolume: string;
  suggestions?: string[];
}

export default function KeywordResearchTest() {
  const { language } = useLanguage();
  const [topic, setTopic] = useState('React 網頁開發');
  const [industry, setIndustry] = useState('technology');
  const [keywordCount, setKeywordCount] = useState(10);
  const [isResearching, setIsResearching] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const isZh = language === 'zh' || language === 'zh-CN';

  /**
   * 執行關鍵字研究
   */
  const performResearch = async () => {
    if (!topic.trim()) {
      toast.error(isZh ? '請輸入主題' : 'Please enter a topic');
      return;
    }

    setIsResearching(true);
    setError(null);
    setKeywords([]);
    setResponseTime(null);

    const startTime = Date.now();

    try {
      console.log('🔍 [Keyword Research] Starting research...', {
        topic,
        industry,
        count: keywordCount,
        language,
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/keywords`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: topic.trim(),
            industry: industry || undefined,
            language: language === 'en' ? 'en' : language === 'zh-CN' ? 'zh-CN' : 'zh-TW',
            count: keywordCount,
          }),
        }
      );

      const duration = Date.now() - startTime;
      setResponseTime(duration);

      console.log('🔍 [Keyword Research] Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [Keyword Research] Result:', result);

        if (result.success && result.data?.keywords) {
          setKeywords(result.data.keywords);
          toast.success(
            isZh 
              ? `✅ 成功找到 ${result.data.keywords.length} 個關鍵字！`
              : `✅ Found ${result.data.keywords.length} keywords!`
          );
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [Keyword Research] Failed:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (err: any) {
      console.error('❌ [Keyword Research] Error:', err);
      setError(err.message || 'Unknown error');
      toast.error(
        isZh 
          ? `❌ 關鍵字研究失敗：${err.message}`
          : `❌ Keyword research failed: ${err.message}`
      );
    } finally {
      setIsResearching(false);
    }
  };

  /**
   * 渲染難度徽章
   */
  const renderDifficultyBadge = (difficulty: string) => {
    const difficultyMap: Record<string, { color: string; label: string }> = {
      'low': { color: 'bg-green-100 text-green-800 border-green-300', label: isZh ? '容易' : 'Easy' },
      'easy': { color: 'bg-green-100 text-green-800 border-green-300', label: isZh ? '容易' : 'Easy' },
      'medium': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: isZh ? '中等' : 'Medium' },
      'moderate': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: isZh ? '中等' : 'Medium' },
      'high': { color: 'bg-red-100 text-red-800 border-red-300', label: isZh ? '困難' : 'Hard' },
      'hard': { color: 'bg-red-100 text-red-800 border-red-300', label: isZh ? '困難' : 'Hard' },
    };

    const config = difficultyMap[difficulty.toLowerCase()] || {
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      label: difficulty,
    };

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  /**
   * 渲染相關度分數
   */
  const renderRelevanceScore = (relevance: number) => {
    const percentage = Math.round(relevance * 100);
    const color = 
      percentage >= 80 ? 'bg-green-500' :
      percentage >= 60 ? 'bg-yellow-500' :
      'bg-orange-500';

    return (
      <div className="flex items-center gap-2">
        <div className="w-24 bg-gray-200 rounded-full h-2">
          <div 
            className={`${color} h-2 rounded-full transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-semibold">{percentage}%</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 標題 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Search className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {isZh ? '關鍵字研究測試' : 'Keyword Research Test'}
            </h1>
          </div>
          <p className="text-gray-600">
            {isZh 
              ? '測試 AI SEO 關鍵字生成功能'
              : 'Test AI SEO keyword generation feature'}
          </p>
        </div>

        {/* 輸入表單 */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              {isZh ? '研究參數' : 'Research Parameters'}
            </CardTitle>
            <CardDescription>
              {isZh 
                ? '輸入主題和參數以開始關鍵字研究'
                : 'Enter topic and parameters to start keyword research'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 主題 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                {isZh ? '主題' : 'Topic'} <span className="text-red-500">*</span>
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={isZh ? '例如：React 網頁開發' : 'e.g., React Web Development'}
                className="w-full"
              />
            </div>

            {/* 行業 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                {isZh ? '行業（可選）' : 'Industry (Optional)'}
              </label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder={isZh ? '例如：technology, marketing' : 'e.g., technology, marketing'}
                className="w-full"
              />
            </div>

            {/* 關鍵字數量 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                {isZh ? '關鍵字數量' : 'Keyword Count'}
              </label>
              <Input
                type="number"
                value={keywordCount}
                onChange={(e) => setKeywordCount(parseInt(e.target.value) || 10)}
                min="5"
                max="20"
                className="w-full"
              />
            </div>

            {/* 執行按鈕 */}
            <Button
              onClick={performResearch}
              disabled={isResearching}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isResearching ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {isZh ? '研究中...' : 'Researching...'}
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  {isZh ? '開始研究' : 'Start Research'}
                </>
              )}
            </Button>

            {/* 響應時間 */}
            {responseTime !== null && (
              <p className="text-xs text-gray-500 text-center">
                {isZh ? '響應時間：' : 'Response time: '}{responseTime}ms
              </p>
            )}
          </CardContent>
        </Card>

        {/* 錯誤提示 */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{isZh ? '錯誤：' : 'Error: '}</strong>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 關鍵字結果 */}
        {keywords.length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    {isZh ? '研究結果' : 'Research Results'}
                  </CardTitle>
                  <CardDescription>
                    {isZh 
                      ? `找到 ${keywords.length} 個相關關鍵字`
                      : `Found ${keywords.length} relevant keywords`}
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-300 text-lg px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {keywords.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {keywords.map((kw, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* 關鍵字信息 */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            {kw.keyword}
                          </span>
                          {renderDifficultyBadge(kw.difficulty)}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          {/* 搜索量 */}
                          <div className="flex items-center gap-1">
                            <Search className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {isZh ? '搜索量：' : 'Volume: '}
                              <strong>{kw.searchVolume}</strong>
                            </span>
                          </div>

                          {/* 相關度 */}
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {isZh ? '相關度' : 'Relevance'}
                            </span>
                          </div>
                        </div>

                        {/* 相關度分數條 */}
                        <div>
                          {renderRelevanceScore(kw.relevance)}
                        </div>

                        {/* 建議 */}
                        {kw.suggestions && kw.suggestions.length > 0 && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs font-semibold text-blue-800 mb-1">
                              {isZh ? '💡 使用建議' : '💡 Usage Tips'}
                            </p>
                            <ul className="text-xs text-blue-700 space-y-1">
                              {kw.suggestions.map((suggestion, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 載入中狀態 */}
        {isResearching && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-gray-600 font-semibold">
              {isZh ? '正在使用 AI 分析關鍵字...' : 'Analyzing keywords with AI...'}
            </p>
            <p className="text-sm text-gray-500">
              {isZh ? '這可能需要幾秒鐘' : 'This may take a few seconds'}
            </p>
          </div>
        )}

        {/* 提示信息 */}
        {!isResearching && keywords.length === 0 && !error && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-12 text-center space-y-4">
              <Search className="h-16 w-16 text-gray-300 mx-auto" />
              <p className="text-gray-500">
                {isZh 
                  ? '輸入主題並點擊「開始研究」來獲取 AI 關鍵字建議'
                  : 'Enter a topic and click "Start Research" to get AI keyword suggestions'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
