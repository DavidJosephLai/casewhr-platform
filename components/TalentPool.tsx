import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useView } from '../contexts/ViewContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, Filter, Star, MapPin, DollarSign, Briefcase, Award, 
  Grid, List, Users, TrendingUp, Clock, CheckCircle, BookmarkPlus,
  Sliders, ChevronDown, X, Download, Send, Building2, Mail, MessageSquare, Image as ImageIcon
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

interface Freelancer {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  title?: string;
  bio?: string;
  skills: string[];
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  currency?: string;
  location?: string;
  rating?: number;
  review_count?: number;
  completed_projects?: number;
  portfolio_count?: number; // 🔥 添加作品集數量
  is_favorite?: boolean;
  availability?: string;
  response_time?: string;
  languages?: string[];
  experience_years?: number;
  created_at?: string;
}

const SKILL_CATEGORIES = {
  development: ['React', 'TypeScript', 'Node.js', 'Python', 'Java', 'PHP'],
  design: ['UI/UX Design', 'Graphic Design', 'Web Design', 'Product Design'],
  mobile: ['Mobile Development', 'iOS Development', 'Android Development', 'React Native'],
  data: ['Data Science', 'Machine Learning', 'AI', 'Data Analysis'],
  devops: ['DevOps', 'AWS', 'Docker', 'Kubernetes', 'CI/CD'],
  marketing: ['Marketing', 'SEO', 'Content Writing', 'Social Media'],
  multimedia: ['Video Editing', 'Animation', '3D Modeling', 'Photography'],
  other: ['Project Management', 'Business Analysis', 'Consulting', 'Translation']
};

export default function TalentPool() {
  const { language } = useLanguage();
  const { setView } = useView();
  const { user, accessToken } = useAuth();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'rate-low' | 'rate-high' | 'projects' | 'newest'>('relevance');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>('all');
  const [experienceLevel, setExperienceLevel] = useState<string>('all');
  
  // 📄 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 每頁顯示 12 個人才

  // 📧 聯繫對話框狀態
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const t = {
    title: language === 'en' ? 'Advanced Talent Search' : language === 'zh-CN' ? '进阶人才搜索' : '進階人才搜尋',
    subtitle: language === 'en' ? 'Find, filter, and recruit the perfect freelancer with powerful search tools' : language === 'zh-CN' ? '用强大的搜索工具查找、筛选和招募完美的自由职业者' : '使用強大的搜尋工具查找、篩選和招募完美的接案者',
    search: language === 'en' ? 'Search by name, skills, or keywords...' : language === 'zh-CN' ? '按姓名、技能或关键词搜索...' : '按姓名、技能或關鍵字搜尋...',
    filters: language === 'en' ? 'Filters' : language === 'zh-CN' ? '筛选' : '篩選',
    skills: language === 'en' ? 'Skills' : language === 'zh-CN' ? '技能' : '技能',
    rating: language === 'en' ? 'Minimum Rating' : language === 'zh-CN' ? '最低评分' : '最低評分',
    priceRange: language === 'en' ? 'Hourly Rate Range' : language === 'zh-CN' ? '时薪范围' : '時薪範圍',
    location: language === 'en' ? 'Location' : language === 'zh-CN' ? '地点' : '地點',
    availability: language === 'en' ? 'Availability' : language === 'zh-CN' ? '可用性' : '可用性',
    experience: language === 'en' ? 'Experience Level' : language === 'zh-CN' ? '经验水平' : '經驗水平',
    sortBy: language === 'en' ? 'Sort By' : language === 'zh-CN' ? '排序方式' : '排序方式',
    sortRelevance: language === 'en' ? 'Relevance' : language === 'zh-CN' ? '相关性' : '相關性',
    sortRating: language === 'en' ? 'Highest Rated' : language === 'zh-CN' ? '评分最高' : '評分最高',
    sortRateLow: language === 'en' ? 'Lowest Rate' : language === 'zh-CN' ? '时薪最低' : '時薪最低',
    sortRateHigh: language === 'en' ? 'Highest Rate' : language === 'zh-CN' ? '时薪最高' : '時薪最高',
    sortProjects: language === 'en' ? 'Most Projects' : language === 'zh-CN' ? '项目最多' : '專案最多',
    sortNewest: language === 'en' ? 'Newest Members' : language === 'zh-CN' ? '最新加入' : '最新加入',
    results: language === 'en' ? 'results' : language === 'zh-CN' ? '个结果' : '個結果',
    viewProfile: language === 'en' ? 'View Profile' : language === 'zh-CN' ? '查看档案' : '查看檔案',
    contact: language === 'en' ? 'Contact' : language === 'zh-CN' ? '联系' : '聯繫',
    contactFreelancer: language === 'en' ? 'Contact Freelancer' : language === 'zh-CN' ? '联系接案者' : '聯繫接案者',
    messageSubject: language === 'en' ? 'Subject' : language === 'zh-CN' ? '主题' : '主題',
    messagePlaceholder: language === 'en' ? 'Write your message here...' : language === 'zh-CN' ? '在这里写下您的消息...' : '在這裡寫下您的訊息...',
    send: language === 'en' ? 'Send Message' : language === 'zh-CN' ? '发送消息' : '發送訊息',
    sending: language === 'en' ? 'Sending...' : language === 'zh-CN' ? '发送中...' : '發送中...',
    cancel: language === 'en' ? 'Cancel' : language === 'zh-CN' ? '取消' : '取消',
    messageSent: language === 'en' ? 'Message sent successfully!' : language === 'zh-CN' ? '消息发送成功！' : '訊息發送成功！',
    messageFailed: language === 'en' ? 'Failed to send message' : language === 'zh-CN' ? '消息发送失败' : '訊息發送失敗',
    loginRequired: language === 'en' ? 'Please login first' : language === 'zh-CN' ? '请先登录' : '請先登入',
    saveCandidate: language === 'en' ? 'Save' : language === 'zh-CN' ? '保存' : '儲存',
    exportResults: language === 'en' ? 'Export Results' : language === 'zh-CN' ? '导出结果' : '匯出結果',
    clearFilters: language === 'en' ? 'Clear All' : language === 'zh-CN' ? '清除全部' : '清除全部',
    noResults: language === 'en' ? 'No freelancers match your criteria' : language === 'zh-CN' ? '没有符合条件的自由职业者' : '沒有符合條件的接案者',
    loading: language === 'en' ? 'Loading talent pool...' : language === 'zh-CN' ? '加载人才库中...' : '載入人才庫中...',
  };

  useEffect(() => {
    loadFreelancers();
  }, []);

  const loadFreelancers = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken || publicAnonKey}`
      };

      // 🔥 使用與 TalentDirectory 相同的 API 端點
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profiles/freelancers`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [TalentPool] Loaded profiles:', data.profiles?.length);
        
        // 🔄 轉換資料格式以符合 Freelancer 介面
        const freelancerData = (data.profiles || []).map((profile: any) => ({
          id: profile.user_id || profile.id,
          email: profile.email,
          name: profile.full_name || profile.name || profile.email?.split('@')[0],
          avatar: profile.avatar_url,
          title: profile.job_title || profile.title,
          bio: profile.bio,
          skills: Array.isArray(profile.skills) 
            ? profile.skills 
            : typeof profile.skills === 'string' 
              ? profile.skills.split(',').map((s: string) => s.trim())
              : [],
          hourly_rate_min: profile.hourly_rate_min,
          hourly_rate_max: profile.hourly_rate_max,
          currency: profile.currency || 'TWD',
          location: profile.location,
          rating: profile.rating,
          review_count: profile.review_count || 0,
          completed_projects: profile.completed_projects || 0,
          portfolio_count: profile.portfolio_count || 0, // 🔥 添加作品集數量
          is_favorite: false, // 🔥 稍後會更新
          created_at: profile.created_at,
        }));

        console.log('✅ [TalentPool] Converted freelancers:', freelancerData.length);
        console.log('✅ [TalentPool] Sample names:', freelancerData.slice(0, 5).map((f: any) => f.name));
        
        // 🔥 如果用戶已登入，載入收藏狀態
        if (accessToken && accessToken !== publicAnonKey) {
          try {
            const favResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/favorites/list`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            
            if (favResponse.ok) {
              const { favorites } = await favResponse.json();
              const favoriteIds = new Set(favorites || []);
              
              // 更新收藏狀態
              freelancerData.forEach((f: any) => {
                f.is_favorite = favoriteIds.has(f.id);
              });
            }
          } catch (error) {
            console.log('⚠️ [TalentPool] Could not load favorites:', error);
          }
        }
        
        setFreelancers(freelancerData);
      }
    } catch (error) {
      console.error('❌ [TalentPool] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (freelancerId: string) => {
    const freelancer = freelancers.find(f => f.id === freelancerId);
    if (!freelancer) return;

    const endpoint = freelancer.is_favorite ? 'remove' : 'add';
    
    try {
      if (!accessToken) {
        toast.error(language === 'en' ? 'Please login first' : '請先登入');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/favorites/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ freelancer_id: freelancerId }),
        }
      );

      if (response.ok) {
        setFreelancers(prev =>
          prev.map(f =>
            f.id === freelancerId ? { ...f, is_favorite: !f.is_favorite } : f
          )
        );
        toast.success(
          freelancer.is_favorite
            ? (language === 'en' ? 'Removed from favorites' : '已取消收藏')
            : (language === 'en' ? 'Added to favorites' : '已添加收藏')
        );
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Advanced filtering logic
  const filteredFreelancers = freelancers
    .filter(freelancer => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = freelancer.name?.toLowerCase().includes(query);
        const matchTitle = freelancer.title?.toLowerCase().includes(query);
        const matchSkills = freelancer.skills?.some(s => s.toLowerCase().includes(query));
        if (!matchName && !matchTitle && !matchSkills) return false;
      }

      // Skills filter
      if (selectedSkills.length > 0) {
        const hasSkill = selectedSkills.every(skill =>
          freelancer.skills?.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        );
        if (!hasSkill) return false;
      }

      // Rating filter
      if (minRating > 0 && (!freelancer.rating || freelancer.rating < minRating)) {
        return false;
      }

      // Price range filter
      if (freelancer.hourly_rate_min !== undefined) {
        if (freelancer.hourly_rate_min < priceRange[0] || freelancer.hourly_rate_min > priceRange[1]) {
          return false;
        }
      }

      // Location filter
      if (selectedLocations.length > 0) {
        if (!freelancer.location || !selectedLocations.includes(freelancer.location)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'rate-low':
          return (a.hourly_rate_min || 0) - (b.hourly_rate_min || 0);
        case 'rate-high':
          return (b.hourly_rate_min || 0) - (a.hourly_rate_min || 0);
        case 'projects':
          return (b.completed_projects || 0) - (a.completed_projects || 0);
        case 'newest':
          // 按加入時間排序（最新的在前）
          if (!a.created_at && !b.created_at) return 0;
          if (!a.created_at) return 1;
          if (!b.created_at) return -1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  const allSkills = Object.values(SKILL_CATEGORIES).flat();
  const uniqueLocations = Array.from(new Set(freelancers.map(f => f.location).filter(Boolean))) as string[];

  // 📄 分頁計算
  const totalPages = Math.ceil(filteredFreelancers.length / itemsPerPage);
  const paginatedFreelancers = filteredFreelancers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 🔄 當篩選條件改變時，重置到第一頁
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSkills, minRating, priceRange, selectedLocations, sortBy]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-10 h-10" />
            <h1 className="text-5xl font-bold">{t.title}</h1>
          </div>
          <p className="text-xl text-purple-100 max-w-3xl">{t.subtitle}</p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold">{freelancers.length}</div>
              <div className="text-sm text-purple-100">Total Talents</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold">{allSkills.length}</div>
              <div className="text-sm text-purple-100">Skills Available</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold">{uniqueLocations.length}</div>
              <div className="text-sm text-purple-100">Locations</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold">24h</div>
              <div className="text-sm text-purple-100">Avg Response</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <div className={`${showFilters ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-lg">{t.filters}</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedSkills([]);
                    setMinRating(0);
                    setPriceRange([0, 10000]);
                    setSelectedLocations([]);
                  }}
                  className="text-sm text-gray-500 hover:text-purple-600"
                >
                  {t.clearFilters}
                </button>
              </div>

              {/* Skills Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.skills}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allSkills.map(skill => (
                    <label key={skill} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSkills([...selectedSkills, skill]);
                          } else {
                            setSelectedSkills(selectedSkills.filter(s => s !== skill));
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.rating}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Any</span>
                  <span className="font-semibold text-purple-600">{minRating}+</span>
                  <span>5.0</span>
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.priceRange}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Location Filter */}
              {uniqueLocations.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.location}
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uniqueLocations.map(location => (
                      <label key={location} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedLocations.includes(location)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLocations([...selectedLocations, location]);
                            } else {
                              setSelectedLocations(selectedLocations.filter(l => l !== location));
                            }
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">{location}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Controls */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.search}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="relevance">{t.sortRelevance}</option>
                  <option value="rating">{t.sortRating}</option>
                  <option value="rate-low">{t.sortRateLow}</option>
                  <option value="rate-high">{t.sortRateHigh}</option>
                  <option value="projects">{t.sortProjects}</option>
                  <option value="newest">{t.sortNewest}</option>
                </select>

                {/* View Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                {/* Toggle Filters */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Active Filters */}
              {(selectedSkills.length > 0 || minRating > 0 || selectedLocations.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedSkills.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
                      {skill}
                      <button onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {minRating > 0 && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                      {minRating}+ Rating
                      <button onClick={() => setMinRating(0)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedLocations.map(location => (
                    <span key={location} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                      {location}
                      <button onClick={() => setSelectedLocations(selectedLocations.filter(l => l !== location))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Results Count and Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-600">
                <span className="font-semibold text-lg text-gray-900">{filteredFreelancers.length}</span> {t.results}
              </div>
              <button
                onClick={() => toast.success('Export feature coming soon!')}
                className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                {t.exportResults}
              </button>
            </div>

            {/* Freelancers Grid/List */}
            {filteredFreelancers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">{t.noResults}</p>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {paginatedFreelancers.map(freelancer => (
                    <div
                      key={freelancer.id}
                      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                        viewMode === 'list' ? 'flex items-center gap-6 p-4' : 'p-6'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`${viewMode === 'list' ? 'flex-shrink-0' : 'mb-4'}`}>
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xl font-bold">
                          {freelancer.name?.charAt(0).toUpperCase() || 'F'}
                        </div>
                      </div>

                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{freelancer.name}</h3>
                            <p className="text-sm text-gray-600">{freelancer.title || 'Freelancer'}</p>
                          </div>
                          <button
                            onClick={() => toggleFavorite(freelancer.id)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                freelancer.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Bio */}
                        {freelancer.bio && viewMode === 'grid' && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{freelancer.bio}</p>
                        )}

                        {/* Skills */}
                        {freelancer.skills && freelancer.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {freelancer.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded"
                              >
                                {skill}
                              </span>
                            ))}
                            {freelancer.skills.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                +{freelancer.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                          {freelancer.rating && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Award className="w-3 h-3 text-yellow-500" />
                              <span className="font-semibold">{freelancer.rating.toFixed(1)}</span>
                              <span className="text-gray-400">({freelancer.review_count || 0})</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-gray-600">
                            <Briefcase className="w-3 h-3" />
                            <span>{freelancer.completed_projects || 0} projects</span>
                          </div>
                          {(freelancer.portfolio_count || 0) > 0 && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <ImageIcon className="w-3 h-3 text-purple-500" />
                              <span>{freelancer.portfolio_count} portfolio</span>
                            </div>
                          )}
                          {freelancer.location && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{freelancer.location}</span>
                            </div>
                          )}
                          {freelancer.hourly_rate_min && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <DollarSign className="w-3 h-3" />
                              <span>{freelancer.hourly_rate_min}/hr</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              console.log('🔍 [TalentPool] Viewing profile for:', freelancer.id, freelancer.name);
                              sessionStorage.setItem('current_freelancer_id', freelancer.id);
                              console.log('✅ [TalentPool] Stored in sessionStorage:', sessionStorage.getItem('current_freelancer_id'));
                              setView('freelancer-profile');
                              console.log('✅ [TalentPool] View set to: freelancer-profile');
                            }}
                            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors"
                          >
                            {t.viewProfile}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFreelancer(freelancer);
                              setShowContactModal(true);
                            }}
                            className="px-4 py-2 border border-purple-600 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 📄 分頁組件 */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    {/* 上一頁按鈕 */}
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDown className="w-5 h-5 rotate-90" />
                    </button>

                    {/* 頁碼按鈕 */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // 顯示邏輯：首頁、尾頁、當前頁及其前後各一頁
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {/* 在需要的地方插入省略號 */}
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => {
                              setCurrentPage(page);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              currentPage === page
                                ? 'bg-purple-600 text-white font-semibold'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}

                    {/* 下一頁按鈕 */}
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDown className="w-5 h-5 -rotate-90" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 聯繫對話框 */}
      {showContactModal && selectedFreelancer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{t.contact} {selectedFreelancer.name}</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder={t.messageSubject}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder={t.messagePlaceholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32"
              />
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                onClick={async () => {
                  setSendingMessage(true);
                  try {
                    if (!accessToken) {
                      toast.error(t.loginRequired);
                      return;
                    }

                    // 組合主題和訊息內容
                    const fullMessage = contactSubject 
                      ? `**${contactSubject}**\n\n${contactMessage}` 
                      : contactMessage;

                    const response = await fetch(
                      `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/messages/send`,
                      {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${accessToken}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          receiver_id: selectedFreelancer.id,
                          content: fullMessage,
                        }),
                      }
                    );

                    if (response.ok) {
                      toast.success(t.messageSent);
                      setShowContactModal(false);
                      setContactMessage('');
                      setContactSubject('');
                    } else {
                      const errorData = await response.json();
                      console.error('❌ [TalentPool] Error response:', errorData);
                      toast.error(t.messageFailed);
                    }
                  } catch (error) {
                    console.error('❌ [TalentPool] Error sending message:', error);
                    toast.error(t.messageFailed);
                  } finally {
                    setSendingMessage(false);
                  }
                }}
                className="ml-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors"
                disabled={sendingMessage || !contactMessage.trim()}
              >
                {sendingMessage ? t.sending : t.send}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}