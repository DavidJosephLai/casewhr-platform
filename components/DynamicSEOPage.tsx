/**
 * Dynamic SEO Content Page
 * 顯示 AI 生成的 SEO 優化內容頁面
 * 包含完整的結構化數據和 Schema.org 標記
 */

import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  Share2,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from '../lib/LanguageContext';
import { toast } from 'sonner';

interface DynamicSEOPageProps {
  contentId: string;
}

interface GeneratedContent {
  id: string;
  url: string;
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  sections: Array<{
    h2: string;
    h3?: string[];
    content: string[];
    keyPoints?: string[];
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
  callToAction: string;
  internalLinks?: Array<{
    text: string;
    url: string;
    context: string;
  }>;
  seoScore: number;
  improvements: string[];
  generatedAt: string;
}

export function DynamicSEOPage({ contentId }: DynamicSEOPageProps) {
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    loadContent();
  }, [contentId]);

  // 更新 SEO meta 標籤
  useEffect(() => {
    if (content) {
      updatePageSEO(content);
      injectStructuredData(content);
    }
  }, [content]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai-content/${contentId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load content');
      }

      const data = await response.json();
      setContent(data);
    } catch (err: any) {
      console.error('❌ Error loading content:', err);
      setError(err.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新頁面 SEO Meta 標籤
   */
  const updatePageSEO = (content: GeneratedContent) => {
    // 更新 title
    document.title = `${content.title} | CaseWHR`;

    // 更新 meta description
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    setMeta('description', content.description);
    setMeta('keywords', content.keywords.join(', '));
    setMeta('og:title', content.title, true);
    setMeta('og:description', content.description, true);
    setMeta('og:type', 'article', true);
    setMeta('og:url', `https://casewhr.com${content.url}`, true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', content.title);
    setMeta('twitter:description', content.description);

    // 設置 canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `https://casewhr.com${content.url}`;
  };

  /**
   * 注入結構化數據（Schema.org）
   */
  const injectStructuredData = (content: GeneratedContent) => {
    // Article Schema
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: content.h1,
      description: content.description,
      image: 'https://casewhr.com/og-image.png',
      datePublished: content.generatedAt,
      dateModified: content.generatedAt,
      author: {
        '@type': 'Organization',
        name: 'CaseWHR',
        url: 'https://casewhr.com',
      },
      publisher: {
        '@type': 'Organization',
        name: 'CaseWHR',
        logo: {
          '@type': 'ImageObject',
          url: 'https://casewhr.com/logo-512.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://casewhr.com${content.url}`,
      },
      keywords: content.keywords.join(', '),
    };

    // FAQ Schema
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: content.faq.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    // BreadcrumbList Schema
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://casewhr.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: content.title,
          item: `https://casewhr.com${content.url}`,
        },
      ],
    };

    // 插入 Schema
    const insertSchema = (id: string, schema: object) => {
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    };

    insertSchema('schema-article', articleSchema);
    insertSchema('schema-faq', faqSchema);
    insertSchema('schema-breadcrumb', breadcrumbSchema);
  };

  /**
   * 處理分享功能
   */
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: content?.title || 'CaseWHR',
      text: content?.description || '',
      url: shareUrl,
    };

    // 檢查是否支持 Web Share API
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('分享成功！');
      } catch (error: any) {
        // 用戶取消分享
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
          // 降級到複製連結
          copyToClipboard(shareUrl);
        }
      }
    } else {
      // 不支持 Web Share API，直接複製連結
      copyToClipboard(shareUrl);
    }
  };

  /**
   * 複製連結到剪貼簿
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('✅ 連結已複製到剪貼簿！');
      
      // 3秒後重置圖標
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('複製失敗，請手動複製連結');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">載入內容中...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || '找不到內容'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <a href="/" className="hover:text-blue-600">首頁</a>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{content.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {content.h1}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(content.generatedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW')}
            </div>
            
            {content.seoScore > 0 && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                SEO 分數: <span className="font-semibold text-green-600">{content.seoScore}/100</span>
              </div>
            )}
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap gap-2 mb-6">
            {content.keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>

          {/* Description */}
          <p className="text-lg text-gray-700 leading-relaxed">
            {content.description}
          </p>
        </header>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          {content.sections.map((section, sectionIndex) => (
            <section key={sectionIndex} className="mb-8 last:mb-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {section.h2}
              </h2>

              {/* H3 Subheadings */}
              {section.h3 && section.h3.length > 0 && (
                <div className="space-y-4 mb-4">
                  {section.h3.map((h3, h3Index) => (
                    <h3 key={h3Index} className="text-xl font-semibold text-gray-800">
                      {h3}
                    </h3>
                  ))}
                </div>
              )}

              {/* Content Paragraphs */}
              <div className="prose prose-lg max-w-none mb-4">
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-gray-700 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Key Points */}
              {section.keyPoints && section.keyPoints.length > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                  <ul className="space-y-2">
                    {section.keyPoints.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-800">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* FAQ Section */}
        {content.faq && content.faq.length > 0 && (
          <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              常見問題 (FAQ)
            </h2>
            
            <div className="space-y-6">
              {content.faq.map((item, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.question}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Call to Action */}
        {content.callToAction && (
          <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">
              {content.callToAction}
            </h3>
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => window.location.href = '/'}
            >
              立即開始
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        )}

        {/* Internal Links Section */}
        {content.internalLinks && content.internalLinks.length > 0 && (
          <section className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              相關資源
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.internalLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">{link.text}</div>
                    <div className="text-sm text-gray-600">{link.context}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Share Section */}
        <div className="mt-8 flex justify-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            className="hover:bg-blue-50 hover:border-blue-500"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                已複製
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                分享此頁面
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(window.location.href)}
            className="hover:bg-gray-50"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Social Share Links (Optional, shown on larger screens) */}
        <div className="mt-4 flex justify-center gap-2 text-xs text-gray-500">
          <span>分享到：</span>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors"
          >
            Facebook
          </a>
          <span>•</span>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(content.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors"
          >
            Twitter
          </a>
          <span>•</span>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-700 transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </article>
  );
}

export default DynamicSEOPage;