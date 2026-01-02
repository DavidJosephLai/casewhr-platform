// 项目 AI SEO 辅助组件 - 用于案件发布表单
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Sparkles, Loader2, Check, Lightbulb } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface ProjectAISEOHelperProps {
  title: string;
  description: string;
  category?: string;
  skills?: string[];
  language: 'zh-TW' | 'en' | 'zh-CN';
  onOptimize?: (optimized: { title: string; description: string; keywords: string[] }) => void;
}

export function ProjectAISEOHelper({
  title,
  description,
  category,
  skills = [],
  language,
  onOptimize
}: ProjectAISEOHelperProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedData, setOptimizedData] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const getText = (key: string) => {
    const texts = {
      en: {
        optimize: 'AI SEO Optimize',
        optimizing: 'Optimizing...',
        fillFirst: 'Please fill in title and description first',
        optimized: 'AI Optimized Content',
        apply: 'Apply Optimization',
        score: 'SEO Score',
        suggestions: 'Suggestions',
        keywords: 'Recommended Keywords'
      },
      'zh-TW': {
        optimize: 'AI SEO 優化',
        optimizing: '正在優化...',
        fillFirst: '請先填寫標題和描述',
        optimized: 'AI 優化後內容',
        apply: '應用優化',
        score: 'SEO 評分',
        suggestions: '優化建議',
        keywords: '推薦關鍵詞'
      },
      'zh-CN': {
        optimize: 'AI SEO 优化',
        optimizing: '正在优化...',
        fillFirst: '请先填写标题和描述',
        optimized: 'AI 优化后内容',
        apply: '应用优化',
        score: 'SEO 评分',
        suggestions: '优化建议',
        keywords: '推荐关键词'
      }
    };
    return texts[language][key] || texts['zh-TW'][key];
  };

  const handleOptimize = async () => {
    if (!title.trim() || !description.trim()) {
      alert(getText('fillFirst'));
      return;
    }

    setIsOptimizing(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            title,
            description,
            category,
            tags: skills,
            language,
            targetAudience: 'freelancers',
            projectType: 'marketplace'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to optimize');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setOptimizedData(result.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('AI SEO optimization failed:', error);
      alert('Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApply = () => {
    if (optimizedData && onOptimize) {
      onOptimize({
        title: optimizedData.optimizedTitle || title,
        description: optimizedData.optimizedDescription || description,
        keywords: optimizedData.recommendedKeywords || []
      });
      setShowResults(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* AI 优化按钮 */}
      <Button
        type="button"
        onClick={handleOptimize}
        disabled={isOptimizing || !title || !description}
        variant="outline"
        className="w-full bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:border-purple-300"
      >
        {isOptimizing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {getText('optimizing')}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            {getText('optimize')}
          </>
        )}
      </Button>

      {/* 优化结果 */}
      {showResults && optimizedData && (
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                {getText('optimized')}
              </h4>
              {optimizedData.score && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {getText('score')}: {optimizedData.score}/100
                </Badge>
              )}
            </div>

            {/* 优化后的标题 */}
            {optimizedData.optimizedTitle && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {language === 'en' ? 'Optimized Title' : '優化後標題'}
                </label>
                <p className="mt-1 p-2 bg-white rounded border border-purple-100 text-sm">
                  {optimizedData.optimizedTitle}
                </p>
              </div>
            )}

            {/* 优化后的描述 */}
            {optimizedData.optimizedDescription && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {language === 'en' ? 'Optimized Description' : '優化後描述'}
                </label>
                <p className="mt-1 p-2 bg-white rounded border border-purple-100 text-sm whitespace-pre-wrap">
                  {optimizedData.optimizedDescription}
                </p>
              </div>
            )}

            {/* 推荐关键词 */}
            {optimizedData.recommendedKeywords && optimizedData.recommendedKeywords.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {getText('keywords')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {optimizedData.recommendedKeywords.map((keyword: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-800">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 优化建议 */}
            {optimizedData.suggestions && optimizedData.suggestions.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {getText('suggestions')}
                </label>
                <ul className="text-sm space-y-1 text-gray-600">
                  {optimizedData.suggestions.slice(0, 3).map((suggestion: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 应用按钮 */}
            <Button
              type="button"
              onClick={handleApply}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Check className="mr-2 h-4 w-4" />
              {getText('apply')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
