import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { Star, MapPin, DollarSign, Briefcase, Award, Heart, Loader2 } from 'lucide-react';
import { useView } from '../contexts/ViewContext';

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
}

export function FavoritesList() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const { setView } = useView();
  const [favorites, setFavorites] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [user?.id]);

  const loadFavorites = async () => {
    if (!user?.id || !accessToken) return;

    try {
      setLoading(true);

      // 1. 獲取用戶收藏的接案者 ID 列表
      const favoritesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/favorites/list`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!favoritesResponse.ok) {
        throw new Error('Failed to load favorites');
      }

      const favoritesData = await favoritesResponse.json();
      const freelancerIds = favoritesData.favorites || [];

      if (freelancerIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // 2. 獲取所有收藏的接案者詳細資料
      const freelancerPromises = freelancerIds.map(async (id: string) => {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/freelancer/${id}/profile`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          return data.profile;
        }
        return null;
      });

      const freelancersData = await Promise.all(freelancerPromises);
      setFavorites(freelancersData.filter(f => f !== null));

    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error(language === 'en' ? 'Failed to load favorites' : '載入收藏失敗');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (freelancerId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/favorites/remove`,
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
        setFavorites(prev => prev.filter(f => f.id !== freelancerId));
        toast.success(language === 'en' ? 'Removed from favorites' : '已取消收藏');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error(language === 'en' ? 'Failed to remove favorite' : '移除收藏失敗');
    }
  };

  const viewProfile = (freelancerId: string) => {
    // 更新 URL
    window.history.pushState({}, '', `/freelancer/${freelancerId}`);
    // 切換視圖
    setView('freelancer-profile');
  };

  const t = {
    title: language === 'en' ? 'My Favorites' : language === 'zh-CN' ? '我的收藏' : '我的收藏',
    subtitle: language === 'en' ? 'Freelancers you have favorited' : language === 'zh-CN' ? '您收藏的自由职业者' : '您收藏的接案者',
    noFavorites: language === 'en' ? 'No favorites yet' : language === 'zh-CN' ? '暂无收藏' : '暫無收藏',
    browseTalent: language === 'en' ? 'Browse Talent Pool' : language === 'zh-CN' ? '浏览人才库' : '瀏覽人才庫',
    viewProfile: language === 'en' ? 'View Profile' : language === 'zh-CN' ? '查看档案' : '查看檔案',
    remove: language === 'en' ? 'Remove' : language === 'zh-CN' ? '移除' : '移除',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
        <p className="text-gray-600 mt-1">{t.subtitle}</p>
      </div>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.noFavorites}</h3>
          <p className="text-gray-600 mb-6">
            {language === 'en'
              ? 'Start building your favorites list by browsing the talent pool.'
              : language === 'zh-CN'
              ? '浏览人才库，开始建立您的收藏列表。'
              : '瀏覽人才庫，開始建立您的收藏列表。'}
          </p>
          <button
            onClick={() => {
              setView('talent-pool');
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {t.browseTalent}
          </button>
        </div>
      ) : (
        /* Favorites Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((freelancer) => (
            <div
              key={freelancer.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xl font-bold">
                    {freelancer.name?.charAt(0).toUpperCase() || 'F'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {freelancer.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {freelancer.title || 'Freelancer'}
                    </p>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFavorite(freelancer.id)}
                  className="p-2 hover:bg-red-50 rounded-full transition-colors group"
                  title={t.remove}
                >
                  <Heart className="w-5 h-5 fill-red-400 text-red-400 group-hover:fill-red-600 group-hover:text-red-600" />
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
                {freelancer.skills?.slice(0, 3).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {freelancer.skills?.length > 3 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    +{freelancer.skills.length - 3}
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
                  <span>{freelancer.completed_projects || 0}</span>
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
                    <span className="text-xs">
                      {freelancer.hourly_rate_min}
                      {freelancer.hourly_rate_max && `-${freelancer.hourly_rate_max}`}
                      <span className="ml-1">{freelancer.currency || 'TWD'}/hr</span>
                    </span>
                  </div>
                )}
              </div>

              {/* View Profile Button */}
              <button
                onClick={() => viewProfile(freelancer.id)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {t.viewProfile}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}