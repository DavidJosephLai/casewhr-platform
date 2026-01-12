// AI SEO 引擎 - 智能内容优化
// 使用 OpenAI GPT 自动生成 SEO 优化内容

import React, { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AISEOGeneratorProps {
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  language?: 'zh-TW' | 'en' | 'zh-CN';
  onSEOGenerated?: (seoData: any) => void;
}

export function AISEOGenerator({ 
  title, 
  description, 
  category,
  tags = [],
  language = 'zh-TW',
  onSEOGenerated 
}: AISEOGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [seoData, setSeoData] = useState<any>(null);

  // AI 生成 SEO 内容
  const generateSEOContent = async () => {
    if (!title || !description) {
      toast.error(language === 'en' ? 'Please fill in title and description first' : '请先填写标题和描述');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          title,
          description,
          category,
          tags,
          language,
          targetAudience: 'freelancers',
          projectType: 'marketplace'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate SEO');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setSeoData(result.data);
        toast.success(language === 'en' ? 'SEO optimized successfully!' : 'SEO 优化成功！');
        
        // 回调父组件
        if (onSEOGenerated) {
          onSEOGenerated(result.data);
        }
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('AI SEO 生成失败:', error);
      console.error('完整錯誤信息:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      toast.error(
        language === 'en' 
          ? `SEO generation failed: ${error.message || 'Unknown error'}` 
          : `SEO 生成失败: ${error.message || '未知錯誤'}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="ai-seo-generator">
      <Button
        onClick={generateSEOContent}
        disabled={isGenerating}
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
      >
        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {isGenerating ? '🤖 AI 正在生成...' : '✨ AI 智能 SEO 优化'}
      </Button>

      {seoData && (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4">🎯 AI 生成的 SEO 内容</h3>
          
          <div className="space-y-4">
            <div>
              <label className="font-semibold">标题 (Title):</label>
              <p className="text-gray-700">{seoData.title}</p>
            </div>

            <div>
              <label className="font-semibold">描述 (Description):</label>
              <p className="text-gray-700">{seoData.description}</p>
            </div>

            <div>
              <label className="font-semibold">关键词 (Keywords):</label>
              <p className="text-gray-700">{seoData.keywords}</p>
            </div>

            <div>
              <label className="font-semibold">生成的内容:</label>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: seoData.content }}
              />
            </div>

            <div>
              <label className="font-semibold">SEO 评分:</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-green-500 h-4 rounded-full transition-all"
                    style={{ width: `${seoData.score}%` }}
                  />
                </div>
                <span className="font-bold">{seoData.score}/100</span>
              </div>
            </div>

            <div>
              <label className="font-semibold">优化建议:</label>
              <ul className="list-disc list-inside space-y-1">
                {seoData.suggestions?.map((suggestion: string, idx: number) => (
                  <li key={idx} className="text-gray-700">{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            onClick={() => applyGeneratedSEO(seoData)}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ✅ 应用此 SEO 配置
          </Button>
        </div>
      )}
    </div>
  );
}

// 应用生成的 SEO
const applyGeneratedSEO = (content: any) => {
  // 更新 meta tags
  document.title = content.title;
  updateMetaTag('description', content.description);
  updateMetaTag('keywords', content.keywords);

  // 更新 Open Graph
  updateMetaTag('og:title', content.ogTitle);
  updateMetaTag('og:description', content.ogDescription);
  updateMetaTag('og:image', content.ogImage);

  // 更新 Twitter Card
  updateMetaTag('twitter:title', content.twitterTitle);
  updateMetaTag('twitter:description', content.twitterDescription);

  // 更新结构化数据
  updateStructuredData(content.schema);
};

const updateMetaTag = (name: string, content: string) => {
  let element = document.querySelector(`meta[name="${name}"]`) ||
                document.querySelector(`meta[property="${name}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      element.setAttribute('property', name);
    } else {
      element.setAttribute('name', name);
    }
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
};

const updateStructuredData = (schema: any) => {
  let script = document.querySelector('script[type="application/ld+json"]');
  
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  
  script.textContent = JSON.stringify(schema);
};

// 自动 AI SEO Hook
export function useAISEO(pageData: any) {
  const [seoContent, setSeoContent] = useState<any>(null);

  React.useEffect(() => {
    // 页面加载时自动生成 SEO
    generateAutoSEO();
  }, [pageData]);

  const generateAutoSEO = async () => {
    try {
      const response = await fetch('/api/ai-seo/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });

      const result = await response.json();
      setSeoContent(result);

      // 自动应用
      applyToDocument(result);
    } catch (error) {
      console.error('Auto SEO failed:', error);
    }
  };

  const applyToDocument = (content: any) => {
    if (typeof document !== 'undefined') {
      document.title = content.title;
      // ... 应用其他 SEO 元素
    }
  };

  return { seoContent, regenerate: generateAutoSEO };
}

// AI 关键词研究组件
export function AIKeywordResearch() {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [topic, setTopic] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeKeywords = async () => {
    setIsAnalyzing(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-seo/keywords`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          topic,
          language: 'zh-TW',
          count: 10
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setKeywords(result.data?.keywords || []);
      } else {
        console.error('Keyword research failed:', await response.text());
      }
    } catch (error) {
      console.error('Keyword research failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">🔍 AI 关键词研究</h3>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="输入主题或产品..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <Button
          onClick={analyzeKeywords}
          disabled={isAnalyzing}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {isAnalyzing ? '分析中...' : '分析'}
        </Button>
      </div>

      {keywords.length > 0 && (
        <div className="space-y-2">
          {keywords.map((kw, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <span className="font-semibold">{kw.keyword}</span>
                <div className="text-sm text-gray-600">
                  搜索量: {kw.volume} | 难度: {kw.difficulty} | CPC: ${kw.cpc}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  得分: {kw.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// AI 内容优化建议
export function AIContentOptimizer({ content }: { content: string }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeContent = async () => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/ai-seo/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('Content analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">📊 AI 内容分析</h3>
      
      <Button
        onClick={analyzeContent}
        disabled={isAnalyzing}
        className="mb-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        {isAnalyzing ? '分析中...' : '分析内容'}
      </Button>

      {analysis && (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">SEO 评分</h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-6">
                <div 
                  className={`h-6 rounded-full transition-all ${
                    analysis.score >= 80 ? 'bg-green-500' :
                    analysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${analysis.score}%` }}
                />
              </div>
              <span className="font-bold text-lg">{analysis.score}/100</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">✅ 优点</h4>
            <ul className="list-disc list-inside space-y-1 text-green-700">
              {analysis.strengths?.map((s: string, idx: number) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">⚠️ 需要改进</h4>
            <ul className="list-disc list-inside space-y-1 text-orange-700">
              {analysis.improvements?.map((i: string, idx: number) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">💡 AI 建议</h4>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-700">{analysis.aiSuggestion}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">🎯 关键词密度</h4>
            <div className="space-y-2">
              {analysis.keywordDensity?.map((kw: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <span>{kw.keyword}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(kw.count / kw.optimal) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{kw.count} / {kw.optimal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AISEOGenerator;