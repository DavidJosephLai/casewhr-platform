import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { Search, Filter, Star, MapPin, DollarSign, Briefcase, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  is_favorite?: boolean;
}

export default function TalentPool() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const allSkills = [
    'React', 'TypeScript', 'Node.js', 'Python', 'UI/UX Design',
    'Mobile Development', 'DevOps', 'Data Science', 'Machine Learning',
    'Graphic Design', 'Content Writing', 'Marketing', 'SEO', 'Video Editing'
  ];

  useEffect(() => {
    loadFreelancers();
  }, []);

  const loadFreelancers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/talent-pool`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFreelancers(data.freelancers || []);
      }
    } catch (error) {
      console.error('Error loading freelancers:', error);
      toast.error(language === 'en' ? 'Failed to load talent pool' : '載入人才庫失敗');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (freelancerId: string) => {
    const freelancer = freelancers.find(f => f.id === freelancerId);
    if (!freelancer) return;

    const endpoint = freelancer.is_favorite ? 'remove' : 'add';
    
    try {
      const accessToken = localStorage.getItem('access_token');
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
      toast.error(language === 'en' ? 'Failed to update favorites' : '更新收藏失敗');
    }
  };

  const filteredFreelancers = freelancers.filter(freelancer => {
    // 搜索過濾
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = freelancer.name?.toLowerCase().includes(query);
      const matchTitle = freelancer.title?.toLowerCase().includes(query);
      const matchSkills = freelancer.skills?.some(s => s.toLowerCase().includes(query));
      if (!matchName && !matchTitle && !matchSkills) return false;
    }

    // 技能過濾
    if (selectedSkills.length > 0) {
      const hasSkill = selectedSkills.some(skill =>
        freelancer.skills?.includes(skill)
      );
      if (!hasSkill) return false;
    }

    // 評分過濾
    if (minRating > 0 && (freelancer.rating || 0) < minRating) {
      return false;
    }

    return true;
  });

  const t = {
    title: language === 'en' ? 'Talent Pool' : language === 'zh-CN' ? '人才库' : '人才庫',
    subtitle: language === 'en' ? 'Find the perfect freelancer for your project' : language === 'zh-CN' ? '为您的项目找到完美的自由职业者' : '為您的專案找到完美的接案者',
    search: language === 'en' ? 'Search by name, skills, or title...' : language === 'zh-CN' ? '按姓名、技能或职位搜索...' : '按姓名、技能或職位搜尋...',
    filters: language === 'en' ? 'Filters' : language === 'zh-CN' ? '筛选' : '篩選',
    skills: language === 'en' ? 'Skills' : language === 'zh-CN' ? '技能' : '技能',
    minRating: language === 'en' ? 'Minimum Rating' : language === 'zh-CN' ? '最低评分' : '最低評分',
    clearFilters: language === 'en' ? 'Clear Filters' : language === 'zh-CN' ? '清除筛选' : '清除篩選',
    projects: language === 'en' ? 'Projects' : language === 'zh-CN' ? '项目' : '專案',
    reviews: language === 'en' ? 'Reviews' : language === 'zh-CN' ? '评价' : '評價',
    hourly: language === 'en' ? 'Hourly Rate' : language === 'zh-CN' ? '时薪' : '時薪',
    viewProfile: language === 'en' ? 'View Profile' : language === 'zh-CN' ? '查看档案' : '查看檔案',
    noResults: language === 'en' ? 'No freelancers found' : language === 'zh-CN' ? '未找到自由职业者' : '未找到接案者',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {language === 'en' ? 'Loading talent pool...' : language === 'zh-CN' ? '加载人才库中...' : '載入人才庫中...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-purple-100">{t.subtitle}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="w-5 h-5" />
              {t.filters}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              {/* Skills Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {t.skills}
                </label>
                <div className="flex flex-wrap gap-2">
                  {allSkills.map(skill => (
                    <button
                      key={skill}
                      onClick={() => {
                        setSelectedSkills(prev =>
                          prev.includes(skill)
                            ? prev.filter(s => s !== skill)
                            : [...prev, skill]
                        );
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedSkills.includes(skill)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {t.minRating}
                </label>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        minRating === rating
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {rating === 0 ? (language === 'en' ? 'All' : language === 'zh-CN' ? '全部' : '全部') : `${rating}+ ⭐`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedSkills.length > 0 || minRating > 0) && (
                <button
                  onClick={() => {
                    setSelectedSkills([]);
                    setMinRating(0);
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  {t.clearFilters}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          {language === 'en' 
            ? `${filteredFreelancers.length} freelancer${filteredFreelancers.length !== 1 ? 's' : ''} found`
            : language === 'zh-CN'
            ? `找到 ${filteredFreelancers.length} 位自由职业者`
            : `找到 ${filteredFreelancers.length} 位接案者`
          }
        </div>

        {/* Freelancer Grid */}
        {filteredFreelancers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{t.noResults}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFreelancers.map(freelancer => (
              <FreelancerCard
                key={freelancer.id}
                freelancer={freelancer}
                onToggleFavorite={toggleFavorite}
                onViewProfile={() => navigate(`/freelancer/${freelancer.id}`)}
                language={language}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FreelancerCardProps {
  freelancer: Freelancer;
  onToggleFavorite: (id: string) => void;
  onViewProfile: () => void;
  language: string;
}

function FreelancerCard({ freelancer, onToggleFavorite, onViewProfile, language }: FreelancerCardProps) {
  const t = {
    projects: language === 'en' ? 'Projects' : language === 'zh-CN' ? '项目' : '專案',
    reviews: language === 'en' ? 'Reviews' : language === 'zh-CN' ? '评价' : '評價',
    viewProfile: language === 'en' ? 'View Profile' : language === 'zh-CN' ? '查看档案' : '查看檔案',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xl font-bold">
            {freelancer.name?.charAt(0).toUpperCase() || 'F'}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{freelancer.name}</h3>
            <p className="text-sm text-gray-600">{freelancer.title || 'Freelancer'}</p>
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(freelancer.id);
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Star
            className={`w-5 h-5 ${
              freelancer.is_favorite
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {/* Bio */}
      {freelancer.bio && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {freelancer.bio}
        </p>
      )}

      {/* Skills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {freelancer.skills?.slice(0, 4).map((skill, idx) => (
          <span
            key={idx}
            className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full"
          >
            {skill}
          </span>
        ))}
        {freelancer.skills?.length > 4 && (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            +{freelancer.skills.length - 4}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        {/* Rating */}
        {freelancer.rating && (
          <div className="flex items-center gap-1 text-gray-600">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold">{freelancer.rating.toFixed(1)}</span>
            <span className="text-gray-400">({freelancer.review_count || 0})</span>
          </div>
        )}

        {/* Projects */}
        <div className="flex items-center gap-1 text-gray-600">
          <Briefcase className="w-4 h-4" />
          <span>{freelancer.completed_projects || 0} {t.projects}</span>
        </div>

        {/* Location */}
        {freelancer.location && (
          <div className="flex items-center gap-1 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{freelancer.location}</span>
          </div>
        )}

        {/* Hourly Rate */}
        {freelancer.hourly_rate_min && (
          <div className="flex items-center gap-1 text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>
              {freelancer.hourly_rate_min}
              {freelancer.hourly_rate_max && `-${freelancer.hourly_rate_max}`}
              <span className="text-xs ml-1">{freelancer.currency || 'TWD'}/hr</span>
            </span>
          </div>
        )}
      </div>

      {/* View Profile Button */}
      <button
        onClick={onViewProfile}
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        {t.viewProfile}
      </button>
    </div>
  );
}