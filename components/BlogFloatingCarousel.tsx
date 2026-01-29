import { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useView } from '../contexts/ViewContext';
import { BookOpen, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  title_zh: string;
  title_cn: string;
  excerpt: string;
  excerpt_zh: string;
  excerpt_cn: string;
  category: string;
  coverImage: string;
  publishedAt: string;
  readTime: number;
}

const content = {
  en: {
    title: '📚 Latest Blog',
    readMore: 'Read More',
    minRead: 'min read',
    close: 'Close',
    prev: 'Previous',
    next: 'Next'
  },
  'zh-TW': {
    title: '📚 最新文章',
    readMore: '閱讀更多',
    minRead: '分鐘閱讀',
    close: '關閉',
    prev: '上一篇',
    next: '下一篇'
  },
  'zh-CN': {
    title: '📚 最新文章',
    readMore: '阅读更多',
    minRead: '分钟阅读',
    close: '关闭',
    prev: '上一篇',
    next: '下一篇'
  }
};

export function BlogFloatingCarousel() {
  const { language } = useLanguage();
  const { setView } = useView();
  const t = content[language as keyof typeof content] || content.en;
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // 獲取最新 3 篇文章
  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        if (!projectId || !publicAnonKey) {
          console.error('❌ [BlogCarousel] Missing projectId or publicAnonKey');
          return;
        }
        
        const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/blog/posts?limit=3`;
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        } else {
          console.error('❌ [BlogCarousel] Failed to fetch posts:', response.status);
        }
      } catch (error) {
        console.error('❌ [BlogCarousel] Failed to fetch posts:', error);
      }
    };

    fetchLatestPosts();
  }, []);

  // 自動輪播 - 每 10 秒切換
  useEffect(() => {
    if (!isAutoPlaying || posts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, posts.length]);

  // 手動切換
  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  };

  // 點擊閱讀更多
  const handleReadMore = (slug: string) => {
    window.history.pushState({}, '', `/blog/${slug}`);
    setView('blog-post');
  };

  // 如果不顯示或沒有文章，隱藏組件
  if (!isVisible || posts.length === 0) {
    return null;
  }

  const currentPost = posts[currentIndex];
  
  // 多語言標題 - 帶 Fallback 機制
  const postTitle = language === 'en' 
    ? currentPost.title 
    : language === 'zh-TW' 
      ? (currentPost.title_zh || currentPost.title)
      : (currentPost.title_cn || currentPost.title);

  const postExcerpt = language === 'en' 
    ? currentPost.excerpt 
    : language === 'zh-TW' 
      ? (currentPost.excerpt_zh || currentPost.excerpt)
      : (currentPost.excerpt_cn || currentPost.excerpt);

  return (
    <div className="fixed bottom-6 left-6 z-[9999]">
      {/* 部落格輪播卡片 */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-80 border border-gray-200 animate-slideInLeft">
        {/* 頭部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-bold text-sm">{t.title}</h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="hover:bg-white/20 rounded-lg p-1 transition-colors"
            aria-label={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 文章內容 */}
        <div className="relative">
          {/* 封面圖 */}
          {currentPost.coverImage && (
            <div className="relative h-24 overflow-hidden">
              <img
                src={currentPost.coverImage}
                alt={postTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          )}

          {/* 文章資訊 */}
          <div className="p-4">
            {/* 分類標籤 */}
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-2">
              {currentPost.category}
            </span>

            {/* 標題 */}
            <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 text-base leading-tight">
              {postTitle}
            </h4>

            {/* 摘要 */}
            <p className="text-xs text-gray-600 line-clamp-2 mb-3">
              {postExcerpt}
            </p>

            {/* 閱讀時間 */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">
                {currentPost.readTime} {t.minRead}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(currentPost.publishedAt).toLocaleDateString(language)}
              </span>
            </div>

            {/* 閱讀按鈕 */}
            <button
              onClick={() => handleReadMore(currentPost.slug)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {t.readMore} →
            </button>
          </div>
        </div>

        {/* 輪播控制 */}
        {posts.length > 1 && (
          <div className="px-4 pb-4 flex items-center justify-between">
            {/* 上一篇/下一篇 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={t.prev}
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={t.next}
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* 指示器 */}
            <div className="flex items-center gap-1">
              {posts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-6 bg-gradient-to-r from-blue-600 to-purple-600'
                      : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to article ${index + 1}`}
                />
              ))}</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
