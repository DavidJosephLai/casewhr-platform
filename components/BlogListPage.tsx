/**
 * 📝 Blog 列表頁面
 * 顯示所有部落格文章
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Search, Calendar, Clock, Tag, ArrowRight, BookOpen, TrendingUp, User, Lock } from 'lucide-react';

interface BlogPost {
  slug: string;
  title: string;
  title_zh: string;
  title_cn: string;
  excerpt: string;
  excerpt_zh: string;
  excerpt_cn: string;
  category: string;
  tags: string[];
  author: string;
  coverImage: string;
  publishedAt: string;
  readTime: number;
}

// 示範數據
const DEMO_POSTS: BlogPost[] = [
  {
    slug: 'how-to-write-winning-proposals',
    title: 'How to Write Winning Proposals',
    title_zh: '如何撰寫吸引客戶的提案',
    title_cn: '如何撰写吸引客户的提案',
    excerpt: 'Learn the secrets to crafting proposals that win clients and projects.',
    excerpt_zh: '學習撰寫能贏得客戶和專案的提案技巧，提高接案成功率。',
    excerpt_cn: '学习撰写能赢得客户和项目的提案技巧，提高接案成功率。',
    category: 'freelancer-tips',
    tags: ['提案', '接案技巧', '文案'],
    author: 'CaseWHR Team',
    coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
    publishedAt: '2026-01-20',
    readTime: 8,
  },
  {
    slug: 'pricing-strategies-for-freelancers',
    title: 'Pricing Strategies for Freelancers',
    title_zh: '接案者定價策略完整指南',
    title_cn: '接案者定价策略完整指南',
    excerpt: 'Master the art of pricing your services to maximize earnings.',
    excerpt_zh: '掌握服務定價的藝術，最大化您的收入。包含市場分析和實用技巧。',
    excerpt_cn: '掌握服务定价的艺术，最大化您的收入。包含市场分析和实用技巧。',
    category: 'freelancer-tips',
    tags: ['定價', '收入', '策略'],
    author: 'David Lai',
    coverImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
    publishedAt: '2026-01-18',
    readTime: 10,
  },
  {
    slug: 'how-to-choose-right-freelancer',
    title: 'How to Choose the Right Freelancer',
    title_zh: '如何選擇最適合的接案者',
    title_cn: '如何选择最适合的接案者',
    excerpt: 'A comprehensive guide for clients to find and hire the perfect talent.',
    excerpt_zh: '為客戶提供完整的指南，幫助您找到並聘用完美的人才。',
    excerpt_cn: '为客户提供完整的指南，帮助您找到并聘用完美的人才。',
    category: 'client-guide',
    tags: ['招聘', '發案', '人才'],
    author: 'CaseWHR Team',
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
    publishedAt: '2026-01-15',
    readTime: 7,
  },
  {
    slug: 'platform-milestone-payment-guide',
    title: 'Milestone Payment System Guide',
    title_zh: '里程碑付款系統完整說明',
    title_cn: '里程碑付款系统完整说明',
    excerpt: 'Understand how milestone payments protect both clients and freelancers.',
    excerpt_zh: '了解里程碑付款系統如何保護客戶和接案者雙方的權益。',
    excerpt_cn: '了解里程碑付款系统如何保护客户和接案者双方的权益。',
    category: 'platform-guide',
    tags: ['付款', '里程碑', '教學'],
    author: 'Support Team',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    publishedAt: '2026-01-12',
    readTime: 6,
  },
  {
    slug: '2026-freelance-trends',
    title: '2026 Freelance Market Trends',
    title_zh: '2026 年自由工作者市場趨勢報告',
    title_cn: '2026 年自由工作者市场趋势报告',
    excerpt: 'Discover the latest trends shaping the freelance industry in 2026.',
    excerpt_zh: '探索 2026 年塑造自由工作者行業的最新趨勢和機遇。',
    excerpt_cn: '探索 2026 年塑造自由工作者行业的最新趋势和机遇。',
    category: 'industry-insights',
    tags: ['趨勢', '市場分析', '2026'],
    author: 'Research Team',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    publishedAt: '2026-01-10',
    readTime: 12,
  },
  {
    slug: 'designer-success-story',
    title: "From Zero to $10K: A Designer's Journey",
    title_zh: '從零到月入 10 萬：設計師的成功故事',
    title_cn: '从零到月入 10 万：设计师的成功故事',
    excerpt: 'How one designer built a thriving freelance business on CaseWHR.',
    excerpt_zh: '一位設計師如何在 CaseWHR 平台上建立蓬勃發展的接案事業。',
    excerpt_cn: '一位设计师如何在 CaseWHR 平台上建立蓬勃发展的接案事业。',
    category: 'success-stories',
    tags: ['成功案例', '設計師', '激勵'],
    author: 'Maria Chen',
    coverImage: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&q=80',
    publishedAt: '2026-01-08',
    readTime: 9,
  },
];

export function BlogListPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>(DEMO_POSTS);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(DEMO_POSTS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  console.log('🔍 [BlogListPage] Rendering - user:', user?.email, 'posts:', posts.length);

  const content = {
    en: {
      title: 'Blog',
      subtitle: 'Insights, tips, and stories for freelancers and clients',
      search: 'Search articles...',
      allCategories: 'All Categories',
      freelancerTips: 'Freelancer Tips',
      clientGuide: 'Client Guide',
      platformGuide: 'Platform Guide',
      industryInsights: 'Industry Insights',
      successStories: 'Success Stories',
      readMore: 'Read More',
      minRead: 'min read',
      noResults: 'No articles found',
      featured: 'Featured',
      loginRequired: 'Member Login Required',
      loginMessage: 'Please log in to access our exclusive blog content',
      loginButton: 'Login',
      signupButton: 'Sign Up',
      loginHint: 'Join CaseWHR to read premium articles and connect with top professionals',
    },
    'zh-TW': {
      title: '部落格',
      subtitle: '為接案者和發案者提供深度洞察、實用技巧和成功故事',
      search: '搜尋文章...',
      allCategories: '全部分類',
      freelancerTips: '接案技巧',
      clientGuide: '發案指南',
      platformGuide: '平台使用',
      industryInsights: '行業洞察',
      successStories: '成功案例',
      readMore: '閱讀更多',
      minRead: '分鐘閱讀',
      noResults: '找不到相關文章',
      featured: '精選文章',
      loginRequired: '需要會員登入',
      loginMessage: '請登入以閱讀我們的專屬部落格內容',
      loginButton: '立即登入',
      signupButton: '註冊帳號',
      loginHint: '加入 CaseWHR 閱讀優質文章，並與頂尖專業人士連結',
    },
    'zh-CN': {
      title: '博客',
      subtitle: '为接案者和发案者提供深度洞察、实用技巧和成功故事',
      search: '搜索文章...',
      allCategories: '全部分类',
      freelancerTips: '接案技巧',
      clientGuide: '发案指南',
      platformGuide: '平台使用',
      industryInsights: '行业洞察',
      successStories: '成功案例',
      readMore: '阅读更多',
      minRead: '分钟阅读',
      noResults: '找不到相关文章',
      featured: '精选文章',
      loginRequired: '需要会员登录',
      loginMessage: '请登录以阅读我们的专属博客内容',
      loginButton: '立即登录',
      signupButton: '注册账号',
      loginHint: '加入 CaseWHR 阅读优质文章，并与顶尖专业人士连结',
    },
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  const categories = [
    { id: 'all', label: t.allCategories, icon: BookOpen },
    { id: 'freelancer-tips', label: t.freelancerTips, icon: TrendingUp },
    { id: 'client-guide', label: t.clientGuide, icon: User },
    { id: 'platform-guide', label: t.platformGuide, icon: BookOpen },
    { id: 'industry-insights', label: t.industryInsights, icon: TrendingUp },
    { id: 'success-stories', label: t.successStories, icon: TrendingUp },
  ];

  // 🔒 登入檢查
  if (!user) {
    console.log('🔒 [BlogListPage] User not logged in, showing login screen');
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="p-6 sm:p-8 text-center shadow-2xl border-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🔒 {t.loginRequired}
            </h2>
            
            <p className="text-gray-600 mb-4 sm:mb-6 text-base sm:text-lg">
              {t.loginMessage}
            </p>
            
            <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
              💡 {t.loginHint}
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  console.log('🔐 [Blog] Opening login dialog...');
                  window.dispatchEvent(new Event('openLoginDialog'));
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 sm:py-6 text-base sm:text-lg font-semibold"
              >
                {t.loginButton}
              </Button>
              
              <Button 
                onClick={() => {
                  console.log('📝 [Blog] Opening signup dialog...');
                  window.dispatchEvent(new CustomEvent('openAuthDialog', { detail: 'signup' }));
                }}
                variant="outline"
                className="w-full py-4 sm:py-6 text-base sm:text-lg font-semibold border-2 hover:bg-gray-50"
              >
                {t.signupButton}
              </Button>
            </div>
            
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
              <p className="text-xs text-gray-400">
                {language === 'en' 
                  ? 'Free to join • No credit card required' 
                  : language === 'zh-CN'
                  ? '免费注册 • 无需信用卡'
                  : '免費註冊 • 無需信用卡'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // 搜尋和篩選
  useEffect(() => {
    console.log('🔍 [BlogListPage] Filtering - category:', selectedCategory, 'search:', searchTerm);
    let filtered = [...posts];

    // 分類篩選
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // 搜尋篩選
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(post => {
        const title = getLocalizedField(post, 'title').toLowerCase();
        const excerpt = getLocalizedField(post, 'excerpt').toLowerCase();
        return title.includes(term) || excerpt.includes(term) || post.tags.some(tag => tag.toLowerCase().includes(term));
      });
    }

    console.log('✅ [BlogListPage] Filtered posts:', filtered.length);
    setFilteredPosts(filtered);
  }, [posts, searchTerm, selectedCategory, language]);

  const getLocalizedField = (post: BlogPost, field: 'title' | 'excerpt') => {
    if (language === 'en') return post[field];
    if (language === 'zh-CN') return post[`${field}_cn`] || post[`${field}_zh`] || post[field];
    return post[`${field}_zh`] || post[field];
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'freelancer-tips': 'bg-blue-100 text-blue-700 border-blue-200',
      'client-guide': 'bg-green-100 text-green-700 border-green-200',
      'platform-guide': 'bg-purple-100 text-purple-700 border-purple-200',
      'industry-insights': 'bg-orange-100 text-orange-700 border-orange-200',
      'success-stories': 'bg-pink-100 text-pink-700 border-pink-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  console.log('📊 [BlogListPage] Rendering content - filteredPosts:', filteredPosts.length);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-black mb-4 drop-shadow-lg">
              📝 {t.title}
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              {t.subtitle}
            </p>

            {/* 搜尋框 */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg bg-white text-gray-900 rounded-xl border-2 border-white/20 focus:border-white shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分類導航 */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="whitespace-nowrap"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {cat.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">載入中...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl text-gray-600">{t.noResults}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, index) => (
              <Card 
                key={post.slug} 
                className="overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                onClick={() => window.location.href = `/blog/${post.slug}`}
              >
                {/* 封面圖片 */}
                {post.coverImage && (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={post.coverImage} 
                      alt={getLocalizedField(post, 'title')}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {index === 0 && (
                      <Badge className="absolute top-4 right-4 bg-yellow-500 text-white border-0">
                        ⭐ {t.featured}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="p-6">
                  {/* 分類 */}
                  <Badge className={`mb-3 ${getCategoryColor(post.category)}`}>
                    <Tag className="w-3 h-3 mr-1" />
                    {categories.find(c => c.id === post.category)?.label || post.category}
                  </Badge>

                  {/* 標題 */}
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {getLocalizedField(post, 'title')}
                  </h3>

                  {/* 摘要 */}
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {getLocalizedField(post, 'excerpt')}
                  </p>

                  {/* Meta 資訊 */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.publishedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime} {t.minRead}
                      </span>
                    </div>
                  </div>

                  {/* 標籤 */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 閱讀更多按鈕 */}
                  <Button variant="ghost" className="w-full group-hover:bg-blue-50 group-hover:text-blue-600">
                    {t.readMore}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogListPage;
