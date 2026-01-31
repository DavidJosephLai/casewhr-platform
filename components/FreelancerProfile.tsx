import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useView } from '../contexts/ViewContext';
import { 
  Star, MapPin, Briefcase, Award, Calendar, DollarSign, 
  Mail, Send, ArrowLeft, ExternalLink, Heart, CheckCircle 
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

interface FreelancerProfile {
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
  joined_date?: string;
  portfolio?: Array<{
    id: string;
    title: string;
    description: string;
    image?: string;
    url?: string;
  }>;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    reviewer_name: string;
    created_at: string;
  }>;
  is_favorite?: boolean;
}

export default function FreelancerProfile() {
  const { language } = useLanguage();
  const { setView } = useView();
  // Get freelancer ID from sessionStorage
  const id = sessionStorage.getItem('current_freelancer_id');
  console.log('🔍 [FreelancerProfile] Component mounted, ID:', id);
  
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [myProjects, setMyProjects] = useState<any[]>([]);

  useEffect(() => {
    console.log('🔍 [FreelancerProfile] useEffect triggered, ID:', id);
    if (id) {
      loadProfile();
    } else {
      console.log('❌ [FreelancerProfile] No ID found in sessionStorage');
    }
  }, [id]);

  const loadProfile = async () => {
    if (!id) {
      toast.error(language === 'en' ? 'Freelancer not found' : '找不到接案者');
      setView('talent-pool');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 [FreelancerProfile] Loading profile for ID:', id);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/freelancer/${id}/profile`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [FreelancerProfile] Profile loaded:', {
          id: data.profile?.id,
          name: data.profile?.name,
          portfolio_count: data.profile?.portfolio?.length || 0,
          portfolio_items: data.profile?.portfolio
        });
        
        setProfile(data.profile);
      } else {
        toast.error(language === 'en' ? 'Freelancer not found' : '找不到接案者');
        setView('talent-pool');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(language === 'en' ? 'Failed to load profile' : '載入檔案失敗');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!profile) return;

    const endpoint = profile.is_favorite ? 'remove' : 'add';
    
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
          body: JSON.stringify({ freelancer_id: profile.id }),
        }
      );

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null);
        toast.success(
          profile.is_favorite
            ? (language === 'en' ? 'Removed from favorites' : '已取消收藏')
            : (language === 'en' ? 'Added to favorites' : '已添加收藏')
        );
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(language === 'en' ? 'Failed to update favorites' : '更新收藏失敗');
    }
  };

  const openInviteModal = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      toast.error(language === 'en' ? 'Please login first' : '請先登入');
      return;
    }

    // Load user's projects
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/projects/my`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const activeProjects = data.projects.filter((p: any) => p.status === 'open');
        setMyProjects(activeProjects);
        setShowInviteModal(true);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error(language === 'en' ? 'Failed to load projects' : '載入專案失敗');
    }
  };

  const sendInvite = async (projectId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invite/${id}/${projectId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast.success(language === 'en' ? 'Invitation sent!' : '已發送邀請！');
        setShowInviteModal(false);
      } else {
        const error = await response.json();
        toast.error(error.message || (language === 'en' ? 'Failed to send invitation' : '發送邀請失敗'));
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error(language === 'en' ? 'Failed to send invitation' : '發送邀請失敗');
    }
  };

  const t = {
    backToTalentPool: language === 'en' ? 'Back to Talent Pool' : language === 'zh-CN' ? '返回人才库' : '返回人才庫',
    addToFavorites: language === 'en' ? 'Add to Favorites' : language === 'zh-CN' ? '添加收藏' : '添加收藏',
    removeFromFavorites: language === 'en' ? 'Remove from Favorites' : language === 'zh-CN' ? '取消收藏' : '取消收藏',
    inviteToProject: language === 'en' ? 'Invite to Project' : language === 'zh-CN' ? '邀请参与项目' : '邀請參與專案',
    contactFreelancer: language === 'en' ? 'Contact Freelancer' : language === 'zh-CN' ? '联系自由职业者' : '聯繫接案者',
    about: language === 'en' ? 'About' : language === 'zh-CN' ? '关于' : '關於',
    skills: language === 'en' ? 'Skills' : language === 'zh-CN' ? '技能' : '技能',
    portfolio: language === 'en' ? 'Portfolio' : language === 'zh-CN' ? '作品集' : '作品集',
    reviews: language === 'en' ? 'Reviews' : language === 'zh-CN' ? '评价' : '評價',
    memberSince: language === 'en' ? 'Member Since' : language === 'zh-CN' ? '加入时间' : '加入時間',
    completedProjects: language === 'en' ? 'Completed Projects' : language === 'zh-CN' ? '完成项目' : '完成專案',
    hourlyRate: language === 'en' ? 'Hourly Rate' : language === 'zh-CN' ? '时薪' : '時薪',
    rating: language === 'en' ? 'Rating' : language === 'zh-CN' ? '评分' : '評分',
    noPortfolio: language === 'en' ? 'No portfolio items yet' : language === 'zh-CN' ? '暂无作品集' : '暫無作品集',
    noReviews: language === 'en' ? 'No reviews yet' : language === 'zh-CN' ? '暂无评价' : '暫無評價',
    selectProject: language === 'en' ? 'Select a project to invite this freelancer' : language === 'zh-CN' ? '选择一个项目邀请此自由职业者' : '選擇一個專案邀請此接案者',
    noProjects: language === 'en' ? 'You have no active projects' : language === 'zh-CN' ? '您没有活跃的项目' : '您沒有活躍的專案',
    cancel: language === 'en' ? 'Cancel' : language === 'zh-CN' ? '取消' : '取消',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {language === 'en' ? 'Loading profile...' : language === 'zh-CN' ? '加载档案中...' : '載入檔案中...'}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => setView('talent-pool')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.backToTalentPool}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                  {profile.name?.charAt(0).toUpperCase() || 'F'}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                <p className="text-gray-600 mb-4">{profile.title || 'Freelancer'}</p>

                {/* Rating */}
                {profile.rating && (
                  <div className="flex items-center justify-center gap-2 text-lg mb-4">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{profile.rating.toFixed(1)}</span>
                    <span className="text-gray-400 text-sm">({profile.review_count || 0})</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={openInviteModal}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {t.inviteToProject}
                </button>

                <button
                  onClick={toggleFavorite}
                  className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    profile.is_favorite
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${profile.is_favorite ? 'fill-current' : ''}`} />
                  {profile.is_favorite ? t.removeFromFavorites : t.addToFavorites}
                </button>

                <a
                  href={`mailto:${profile.email}`}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  {t.contactFreelancer}
                </a>
              </div>

              {/* Stats */}
              <div className="space-y-4 text-sm">
                {profile.location && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span>{profile.location}</span>
                  </div>
                )}

                {profile.hourly_rate_min && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <span>
                      {profile.hourly_rate_min}
                      {profile.hourly_rate_max && `-${profile.hourly_rate_max}`}
                      {' '}{profile.currency || 'TWD'}/hr
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-gray-600">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <span>{profile.completed_projects || 0} {t.completedProjects}</span>
                </div>

                {profile.joined_date && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>{t.memberSince} {new Date(profile.joined_date).getFullYear()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {profile.bio && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t.about}</h2>
                <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t.skills}</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-purple-50 text-purple-700 font-medium rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t.portfolio}</h2>
              {profile.portfolio && profile.portfolio.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.portfolio.map((item) => (
                    <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {item.image && (
                        <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                          >
                            View Project <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">{t.noPortfolio}</p>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t.reviews}</h2>
              {profile.reviews && profile.reviews.length > 0 ? (
                <div className="space-y-4">
                  {profile.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">{t.noReviews}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t.inviteToProject}</h3>
            <p className="text-gray-600 mb-6">{t.selectProject}</p>

            {myProjects.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t.noProjects}</p>
            ) : (
              <div className="space-y-3 mb-6">
                {myProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => sendInvite(project.id)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{project.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                    <div className="mt-2 text-sm text-purple-600 font-medium">
                      {project.budget} {project.currency}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}