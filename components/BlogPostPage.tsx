/**
 * 📄 Blog 文章詳情頁面
 * 顯示單篇部落格文章的完整內容
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useView } from '../contexts/ViewContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Tag, 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin,
  Eye,
  User,
  BookOpen,
  Lock
} from 'lucide-react';
import { SEO } from './SEO';
import { ArticleTopAd, ArticleMiddleAd, ArticleBottomAd } from './AdSenseAd'; // ✅ 引入廣告組件

interface BlogPost {
  slug: string;
  title: string;
  title_zh: string;
  title_cn: string;
  excerpt: string;
  excerpt_zh: string;
  excerpt_cn: string;
  content: string;
  content_zh: string;
  content_cn: string;
  category: string;
  tags: string[];
  author: string;
  coverImage: string;
  publishedAt: string;
  readTime: number;
  views: number;
}

interface BlogPostPageProps {
  slug?: string;
}

export function BlogPostPage({ slug }: BlogPostPageProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { setView } = useView();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // 從 prop、sessionStorage 或 URL 獲取 slug
  const postSlug = useMemo(() => {
    if (slug) return slug;
    try {
      if (typeof window === 'undefined') return null;
      // 優先從 sessionStorage 讀取（ViewContext 導航方式）
      const stored = sessionStorage.getItem('current_blog_slug');
      if (stored) {
        sessionStorage.removeItem('current_blog_slug');
        return stored;
      }
      // 再從 URL 路徑讀取（直接連結 / 全頁刷新）
      const pathname = window.location.pathname;
      const match = pathname.match(/\/blog\/(.+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('❌ [BlogPostPage] Error getting slug:', error);
      return null;
    }
  }, [slug]);

  // 🔍 DEBUG: 組件渲染日誌
  console.log('🎨 [BlogPostPage] Component rendered:', {
    user: user ? `${user.email} (ID: ${user.id})` : 'NULL',
    slug,
    postSlug,
    loading,
    hasPost: !!post
  });

  const content = {
    en: {
      backToBlog: 'Back to Blog',
      readTime: 'min read',
      views: 'views',
      shareArticle: 'Share Article',
      relatedArticles: 'Related Articles',
      author: 'Author',
      publishedOn: 'Published on',
      tags: 'Tags',
      notFound: 'Article not found',
      loading: 'Loading...',
      loginRequired: 'Member Login Required',
      loginMessage: 'Please log in to read this article',
      loginButton: 'Login',
      signupButton: 'Sign Up',
      loginHint: 'Join CaseWHR to access exclusive content',
    },
    'zh-TW': {
      backToBlog: '返回部落格',
      readTime: '分鐘閱讀',
      views: '次瀏覽',
      shareArticle: '分享文章',
      relatedArticles: '相關文章',
      author: '作者',
      publishedOn: '發佈於',
      tags: '標籤',
      notFound: '找不到文章',
      loading: '載入中...',
      loginRequired: '需要會員登入',
      loginMessage: '請登入以閱讀此文章',
      loginButton: '立即登入',
      signupButton: '註冊帳號',
      loginHint: '加入 CaseWHR 存取專屬內容',
    },
    'zh-CN': {
      backToBlog: '返回博客',
      readTime: '分钟阅读',
      views: '次浏览',
      shareArticle: '分享文章',
      relatedArticles: '相关文章',
      author: '作者',
      publishedOn: '发布于',
      tags: '标签',
      notFound: '找不到文章',
      loading: '载入中...',
      loginRequired: '需要会员登录',
      loginMessage: '请登录以阅读此文章',
      loginButton: '立即登录',
      signupButton: '注册账号',
      loginHint: '加入 CaseWHR 访问专属内容',
    },
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  // 📝 格式化內容 - 將純文字轉換為 HTML，保留段落
  const formatContent = (content: string): string => {
    if (!content) return '';
    
    // 🔍 檢查是否已經包含 HTML 標籤
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
    
    if (hasHtmlTags) {
      // 已經是 HTML 格式，直接返回
      return content;
    }
    
    // 純文字格式，需要轉換
    // 1. 將雙換行轉換為段落 <p>
    // 2. 將單換行轉換為 <br>
    return content
      .split('\n\n')
      .map(paragraph => {
        if (paragraph.trim()) {
          // 處理段落內的單換行
          const formattedParagraph = paragraph
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .join('<br>');
          
          return `<p class="mb-4">${formattedParagraph}</p>`;
        }
        return '';
      })
      .filter(p => p)
      .join('\n');
  };

  // 📦 定義所有函數（必須在 useEffect 之前）
  const loadPost = async (slug: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/blog/posts/${slug}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
        setRelatedPosts(data.relatedPosts || []);
        
        // 增加瀏覽次數
        incrementViews(slug);
      } else {
        // 使用示範數據
        const demoPost = getDemoPost(slug);
        setPost(demoPost);
        setRelatedPosts(getRelatedDemoPosts(demoPost.category));
      }
    } catch (error) {
      console.error('Failed to load blog post:', error);
      const demoPost = getDemoPost(slug);
      setPost(demoPost);
      setRelatedPosts(getRelatedDemoPosts(demoPost.category));
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (slug: string) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/blog/posts/${slug}/view`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  };

  const getLocalizedField = (post: BlogPost, field: 'title' | 'excerpt' | 'content') => {
    if (language === 'en') return post[field];
    if (language === 'zh-CN') return post[`${field}_cn`] || post[`${field}_zh`] || post[field];
    return post[`${field}_zh`] || post[field];
  };

  const shareOnSocial = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    const url = window.location.href;
    const title = post ? getLocalizedField(post, 'title') : '';
    
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  // ✅ 載入文章數據（開放所有人瀏覽，無需登入）
  useEffect(() => {
    if (postSlug) {
      console.log('📥 [BlogPostPage] Loading post:', postSlug);
      loadPost(postSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  // 🔓 開放所有人瀏覽，無需登入

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">{t.notFound}</h2>
          <Button onClick={() => setView('blog')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToBlog}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SEO 
        title={`${getLocalizedField(post, 'title')} - CaseWHR Blog`}
        description={getLocalizedField(post, 'excerpt')}
        canonicalUrl={`https://casewhr.com/blog/${post.slug}`}
        ogImage={post.coverImage}
      />

      {/* 返回按鈕 */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => setView('blog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToBlog}
          </Button>
        </div>
      </div>

      {/* 文章內容 */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 封面圖片 */}
          {post.coverImage && (
            <div className="rounded-2xl overflow-hidden mb-8 shadow-xl">
              <img 
                src={post.coverImage} 
                alt={getLocalizedField(post, 'title')}
                className="w-full h-96 object-cover"
              />
            </div>
          )}

          {/* 文章標題和 Meta */}
          <div className="mb-8">
            <Badge className="mb-4 bg-blue-600 text-white">
              <Tag className="w-3 h-3 mr-1" />
              {post.category}
            </Badge>

            <h1 className="text-5xl font-black mb-4 leading-tight">
              {getLocalizedField(post, 'title')}
            </h1>

            <p className="text-xl text-gray-600 mb-6">
              {getLocalizedField(post, 'excerpt')}
            </p>

            {/* Meta 資訊 */}
            <div className="flex items-center justify-between py-4 border-y">
              <div className="flex items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span className="font-medium">{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(post.publishedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{post.readTime} {t.readTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <span>{post.views} {t.views}</span>
                </div>
              </div>

              {/* 分享按鈕 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 mr-2">{t.shareArticle}:</span>
                <Button size="sm" variant="outline" onClick={() => shareOnSocial('facebook')}>
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => shareOnSocial('twitter')}>
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => shareOnSocial('linkedin')}>
                  <Linkedin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 💰 廣告位置 1: 文章頂部 */}
          <ArticleTopAd />

          {/* 文章內容 */}
          <Card className="p-8 mb-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: formatContent(getLocalizedField(post, 'content')) }}
            />
          </Card>

          {/* 💰 廣告位置 2: 文章中間 */}
          <ArticleMiddleAd />

          {/* 標籤 */}
          {post.tags && post.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-3">{t.tags}</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm px-3 py-1">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 💰 廣告位置 3: 文章底部 */}
          <ArticleBottomAd />

          {/* 相關文章 */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold mb-6">{t.relatedArticles}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.slice(0, 3).map((relatedPost) => (
                  <Card 
                    key={relatedPost.slug}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      sessionStorage.setItem('current_blog_slug', relatedPost.slug);
                      if (typeof history !== 'undefined') history.pushState({}, '', `/blog/${relatedPost.slug}`);
                      setView('blog-post');
                    }}
                  >
                    {relatedPost.coverImage && (
                      <img 
                        src={relatedPost.coverImage} 
                        alt={getLocalizedField(relatedPost, 'title')}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold mb-2 line-clamp-2">
                        {getLocalizedField(relatedPost, 'title')}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {getLocalizedField(relatedPost, 'excerpt')}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 示範數據
function getDemoPost(slug: string): BlogPost {
  const posts: Record<string, BlogPost> = {
    'how-to-write-winning-proposals': {
      slug: 'how-to-write-winning-proposals',
      title: 'How to Write Winning Proposals',
      title_zh: '如何撰寫吸引客戶的提案',
      title_cn: '如何撰写吸引客户的提案',
      excerpt: 'Learn the secrets to crafting proposals that win clients and projects.',
      excerpt_zh: '學習撰寫能贏得客戶和專案的提案技巧，提高接案成功率。',
      excerpt_cn: '学撰写能赢得客户和项目的提案技巧，提高接案成功率。',
      content: `
        <h2>為什麼提案如此重要？</h2>
        <p>一份好的提案是您與客戶之間的第一次深度溝通。它不僅展示您的專業能力，更重要的是展現您對項目的理解和熱情。</p>
        
        <h2>提案的核心要素</h2>
        <h3>1. 客製化開場白</h3>
        <p>避免使用範本式的開場。花時間研究客戶的需求，並在開場就展現您的理解：</p>
        <ul>
          <li>✅ 提及客戶公司的具體細節</li>
          <li>✅ 展示您對行的了解</li>
          <li>✅ 說明為什麼您是最佳人選</li>
        </ul>
        
        <h3>2. 清晰的解決方案</h3>
        <p>客戶想知道您如何解決他們的問題：</p>
        <ul>
          <li>📋 分解項目為具體步驟</li>
          <li>⏰ 提供明確的時間表</li>
          <li>💡 展示您的獨特方法</li>
        </ul>
        
        <h3>3. 相關經驗展示</h3>
        <p>不要只是列出您的所有經驗，選擇最相關的：</p>
        <ul>
          <li>🎯 挑選類似項目案例</li>
          <li>📊 用數據展現成果</li>
          <li>⭐ 附上客戶評價</li>
        </ul>
        
        <h3>4. 合理的定價</h3>
        <p>定價策略會直接影響成交率：</p>
        <ul>
          <li>💰 提供清晰的價格分項</li>
          <li>📈 解釋值而非只談價格</li>
          <li>🎁 考慮提供小優惠或增值服務</li>
        </ul>
        
        <h2>常見錯誤避免</h2>
        <p>以下是新手常犯的錯誤：</p>
        <ul>
          <li>❌ 複製貼上同一份提案給所有客戶</li>
          <li>❌ 只談論自己而忽略客戶需求</li>
          <li>❌ 價格過低試圖競爭</li>
          <li>❌ 提案過於冗長或過於簡短</li>
          <li>❌ 沒有清晰的行動呼籲</li>
        </ul>
        
        <h2>提案範本</h2>
        <p>以下是一個成功提案的基本結構：</p>
        <pre>
親愛的 [客戶名稱]，

我注意到您的 [項目名稱] 需要 [具體服��]。作為在 [領域] 有 X 年經驗的專業人士，我相信我能為您提供卓越的解決方案。

【理解需求】
根據您的描述，我了解到...

【解決方案】
我建議採用以下方法...

【時間表】
- 第1-2週：...
- 第3-4週：...

【相關經驗】
我曾為 [類似客戶] 完成 [類似項目]，果是...

【投資】
總費用：[金額]
包含：[詳細清單]

期待與您合作！

[您的名字]
        </pre>
        
        <h2>結論</h2>
        <p>撰寫出色的提案需要時間和練習。記住，每一份提案都是展現您專業度的機會。投入時間精心製作，您的成功率會顯著提升！</p>
      `,
      content_zh: `
        <h2>為什麼提案如此重要？</h2>
        <p>一份好的提案是您與客戶之間的第一次深度溝通。它不僅展示您的專業能力，更重要的是展現您對項目的理解和熱情。</p>
        
        <h2>提案的核心要素</h2>
        <h3>1. 客製化開場白</h3>
        <p>避免使用範本式的開場。花時間研究客戶的需求，並在開場就展現您的理解：</p>
        <ul>
          <li>✅ 提及客戶公司的具體細節</li>
          <li>✅ 展示您對行業的了解</li>
          <li>✅ 說明為什麼您是最佳人選</li>
        </ul>
        
        <h3>2. 清晰的解決方案</h3>
        <p>客戶想知道您如何解決他們的問題：</p>
        <ul>
          <li>📋 分解項目為具體步驟</li>
          <li>⏰ 提供明確的時間表</li>
          <li>💡 展示您的獨特方法</li>
        </ul>
        
        <h3>3. 相關經驗展示</h3>
        <p>不要只是列出您的所有經驗，選擇最相關的：</p>
        <ul>
          <li>🎯 挑選類似項目案例</li>
          <li>📊 用數據展現成果</li>
          <li>⭐ 附上客戶評價</li>
        </ul>
        
        <h3>4. 合理的定價</h3>
        <p>定價策略會直接影響成交率：</p>
        <ul>
          <li>💰 提供清晰的價格分項</li>
          <li>📈 解釋價值而非只談價格</li>
          <li>🎁 考慮提供小優惠或增值服務</li>
        </ul>
        
        <h2>常見錯誤避免</h2>
        <p>以下是新手常犯的錯誤：</p>
        <ul>
          <li>❌ 複製貼上同一份提案給所有客戶</li>
          <li>❌ 只談論自己而忽略客戶需求</li>
          <li>❌ 價格過低試圖競爭</li>
          <li>❌ 提案過於冗長或過於簡短</li>
          <li>❌ 沒有清晰的行動呼籲</li>
        </ul>
        
        <h2>提案範本</h2>
        <p>以下是一個成功提案的基本結構：</p>
        <pre>
親愛的 [客戶名稱]，

我注意到您的 [項目名稱] 需要 [具體服務]。作為在 [領域] 有 X 年經驗的專業人士，我相信我能為您提供卓越的解決方案。

【理解需求】
根據您的描述，我了解到...

【解決方案】
我建議採用以下方法...

【時間表】
- 第1-2週：...
- 第3-4週：...

【相關經驗】
我曾為 [類似客戶] 成 [類似項目]，結果是...

【投資】
總費：[金額]
包含：[詳細清單]

期待與您合作！

[您的名字]
        </pre>
        
        <h2>結論</h2>
        <p>撰寫出色的提案需要時間和練習。記住，每一份提案都是展現您專業度的機會。投入時間精心製作，您的成功率會顯著提升！</p>
      `,
      content_cn: '',
      category: 'freelancer-tips',
      tags: ['提案', '接案技巧', '文案'],
      author: 'CaseWHR Team',
      coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
      publishedAt: '2026-01-20',
      readTime: 8,
      views: 1234,
    },
  };

  return posts[slug] || posts['how-to-write-winning-proposals'];
}

function getRelatedDemoPosts(category: string): BlogPost[] {
  // 返回相同分類的其他文章
  return [
    {
      slug: 'pricing-strategies-for-freelancers',
      title: 'Pricing Strategies for Freelancers',
      title_zh: '接案者定價策略完整指南',
      title_cn: '接案者定价策略完整指南',
      excerpt: 'Master the art of pricing your services.',
      excerpt_zh: '掌握服務定價的藝術，最大化您的收入。',
      excerpt_cn: '掌握服务定价的艺术，最大化您的收入。',
      content: '',
      content_zh: '',
      content_cn: '',
      category: 'freelancer-tips',
      tags: ['定價', '收入'],
      author: 'David Lai',
      coverImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
      publishedAt: '2026-01-18',
      readTime: 10,
      views: 987,
    },
    {
      slug: 'platform-milestone-payment-guide',
      title: 'Milestone Payment Guide',
      title_zh: '里程碑付款系統說明',
      title_cn: '里程碑付款系统说明',
      excerpt: 'Understand milestone payments.',
      excerpt_zh: '了解里程碑付款系統。',
      excerpt_cn: '了解里程碑付款系统。',
      content: '',
      content_zh: '',
      content_cn: '',
      category: 'platform-guide',
      tags: ['付款', '教學'],
      author: 'Support Team',
      coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      publishedAt: '2026-01-12',
      readTime: 6,
      views: 654,
    },
  ];
}

export default BlogPostPage;