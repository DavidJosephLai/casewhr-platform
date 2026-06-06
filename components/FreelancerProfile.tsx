import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useView } from '../contexts/ViewContext';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Star, MapPin, DollarSign, Briefcase, Send, Heart,
  Mail, ExternalLink, Calendar, CheckCircle, X, Globe, Clock,
  ThumbsUp, Award, Shield, ChevronRight, Share2, Flag, MessageCircle
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
  website?: string;
  availability?: string;
  response_time?: string;
  languages?: string[];
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

type Tab = 'overview' | 'portfolio' | 'reviews';

export default function FreelancerProfile() {
  const { language } = useLanguage();
  const { setView } = useView();
  const { user, accessToken } = useAuth();
  const id = sessionStorage.getItem('current_freelancer_id');

  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [myProjects, setMyProjects] = useState<any[]>([]);

  useEffect(() => {
    let isCancelled = false;
    if (id) {
      loadProfile(isCancelled);
    } else {
      setLoading(false);
    }
    return () => { isCancelled = true; };
  }, [id]);

  const loadProfile = async (isCancelled: boolean) => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/freelancer/${id}/profile`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      if (!isCancelled) {
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
        } else {
          toast.error(language === 'en' ? 'Freelancer not found' : '找不到接案者');
          setTimeout(() => setView('talent-pool'), 100);
        }
      }
    } catch (error) {
      if (!isCancelled) {
        toast.error(language === 'en' ? 'Failed to load profile' : '載入失敗');
      }
    } finally {
      if (!isCancelled) setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!profile) return;
    if (!accessToken) { toast.error(language === 'en' ? 'Please login first' : '請先登入'); return; }
    const endpoint = profile.is_favorite ? 'remove' : 'add';
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/favorites/${endpoint}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ freelancer_id: profile.id }),
        }
      );
      if (response.ok) {
        setProfile(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null);
        toast.success(profile.is_favorite
          ? (language === 'en' ? 'Removed from favorites' : '已取消收藏')
          : (language === 'en' ? 'Added to favorites' : '已加入收藏'));
      }
    } catch { toast.error(language === 'en' ? 'Failed to update' : '更新失敗'); }
  };

  const openInviteModal = async () => {
    if (!accessToken) { toast.error(language === 'en' ? 'Please login first' : '請先登入'); return; }
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/projects/my`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setMyProjects(data.projects.filter((p: any) => p.status === 'open'));
        setShowInviteModal(true);
      }
    } catch { toast.error(language === 'en' ? 'Failed to load projects' : '載入專案失敗'); }
  };

  const sendInvite = async (selectedProjectId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invite/${id}/${selectedProjectId}`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        toast.success(language === 'en' ? 'Invitation sent!' : '已發送邀請！');
        setShowInviteModal(false);
      } else {
        const error = await response.json();
        toast.error(error.error || (language === 'en' ? 'Failed to send invitation' : '發送邀請失敗'));
      }
    } catch { toast.error(language === 'en' ? 'Failed to send invitation' : '發送邀請失敗'); }
  };

  const t = {
    back: language === 'en' ? 'Back' : language === 'zh-CN' ? '返回' : '返回',
    inviteToProject: language === 'en' ? 'Invite to Project' : language === 'zh-CN' ? '邀请参与项目' : '邀請參與專案',
    saveToFavorites: language === 'en' ? 'Save' : language === 'zh-CN' ? '收藏' : '收藏',
    saved: language === 'en' ? 'Saved' : language === 'zh-CN' ? '已收藏' : '已收藏',
    contact: language === 'en' ? 'Contact' : language === 'zh-CN' ? '联系' : '聯繫',
    overview: language === 'en' ? 'Overview' : language === 'zh-CN' ? '概览' : '概覽',
    portfolio: language === 'en' ? 'Portfolio' : language === 'zh-CN' ? '作品集' : '作品集',
    reviews: language === 'en' ? 'Reviews' : language === 'zh-CN' ? '评价' : '評價',
    about: language === 'en' ? 'About' : language === 'zh-CN' ? '关于我' : '關於我',
    skills: language === 'en' ? 'Skills & Expertise' : language === 'zh-CN' ? '技能与专长' : '技能與專長',
    completedProjects: language === 'en' ? 'Jobs Done' : language === 'zh-CN' ? '完成项目' : '完成專案',
    memberSince: language === 'en' ? 'Member Since' : language === 'zh-CN' ? '加入时间' : '加入時間',
    hourlyRate: language === 'en' ? 'Hourly Rate' : language === 'zh-CN' ? '时薪' : '時薪',
    noPortfolio: language === 'en' ? 'No portfolio items yet' : language === 'zh-CN' ? '暂无作品集' : '暫無作品集',
    noReviews: language === 'en' ? 'No reviews yet' : language === 'zh-CN' ? '暂无评价' : '暫無評價',
    selectProject: language === 'en' ? 'Select a project to invite' : language === 'zh-CN' ? '选择要邀请的项目' : '選擇要邀請的專案',
    noProjects: language === 'en' ? 'No active projects' : language === 'zh-CN' ? '没有活跃项目' : '沒有活躍專案',
    cancel: language === 'en' ? 'Cancel' : language === 'zh-CN' ? '取消' : '取消',
    viewProject: language === 'en' ? 'View Project' : language === 'zh-CN' ? '查看项目' : '查看作品',
    topRated: language === 'en' ? 'Top Rated' : language === 'zh-CN' ? '顶级评分' : '頂級評分',
    verified: language === 'en' ? 'Verified' : language === 'zh-CN' ? '已认证' : '已認證',
    available: language === 'en' ? 'Available' : language === 'zh-CN' ? '可接案' : '可接案',
    responseTime: language === 'en' ? 'Avg. response' : language === 'zh-CN' ? '平均回复' : '平均回覆',
    jobSuccess: language === 'en' ? 'Job Success' : language === 'zh-CN' ? '项目成功率' : '專案成功率',
  };

  const avatarInitial = profile?.name?.charAt(0).toUpperCase() || 'F';
  const ratingPercent = profile?.rating ? Math.round((profile.rating / 5) * 100) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">{language === 'en' ? 'Loading profile...' : '載入中...'}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: t.overview },
    { key: 'portfolio', label: t.portfolio, count: profile.portfolio?.length },
    { key: 'reviews', label: t.reviews, count: profile.reviews?.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setView('talent-pool')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success(language === 'en' ? 'Link copied!' : '連結已複製！');
              }}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT SIDEBAR ── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Cover gradient */}
              <div className="h-24 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600" />

              <div className="px-6 pb-6">
                {/* Avatar */}
                <div className="flex justify-between items-end -mt-16 mb-4">
                  <div className="relative">
                    {/* 二吋照片比例 3:4 */}
                    {profile.avatar ? (
                      <div className="w-[78px] h-[104px] rounded-lg border-4 border-white shadow-md overflow-hidden">
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-[78px] h-[104px] rounded-lg border-4 border-white shadow-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                        {avatarInitial}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {t.available}
                  </span>
                </div>

                <h1 className="text-xl font-bold text-gray-900 leading-tight">{profile.name}</h1>
                <p className="text-purple-600 font-medium text-sm mt-0.5 mb-3">
                  {profile.title || 'Freelancer'}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                    <Shield className="w-3 h-3" /> {t.verified}
                  </span>
                  {profile.rating && profile.rating >= 4.5 && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      <Award className="w-3 h-3" /> {t.topRated}
                    </span>
                  )}
                </div>

                {/* Rating bar */}
                {profile.rating && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.round(profile.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{profile.rating.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${ratingPercent}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{profile.review_count || 0} {language === 'en' ? 'reviews' : '則評價'}</p>
                  </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-purple-700">{profile.completed_projects || 0}</p>
                    <p className="text-xs text-purple-600 mt-0.5">{t.completedProjects}</p>
                  </div>
                  {ratingPercent && (
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{ratingPercent}%</p>
                      <p className="text-xs text-green-600 mt-0.5">{t.jobSuccess}</p>
                    </div>
                  )}
                  {profile.hourly_rate_min && (
                    <div className="col-span-2 bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-blue-700">
                        {profile.hourly_rate_min}{profile.hourly_rate_max ? `–${profile.hourly_rate_max}` : '+'} {profile.currency || 'TWD'}
                      </p>
                      <p className="text-xs text-blue-600 mt-0.5">{t.hourlyRate}</p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="space-y-2.5">
                  <button
                    onClick={openInviteModal}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm shadow-purple-200"
                  >
                    <Send className="w-4 h-4" />
                    {t.inviteToProject}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={toggleFavorite}
                      className={`py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 ${
                        profile.is_favorite
                          ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${profile.is_favorite ? 'fill-current' : ''}`} />
                      {profile.is_favorite ? t.saved : t.saveToFavorites}
                    </button>
                    <button
                      onClick={() => {
                        if (!accessToken) { toast.error(language === 'en' ? 'Please login first' : '請先登入'); return; }
                        window.location.href = `mailto:${profile.email}`;
                      }}
                      className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Mail className="w-4 h-4" />
                      {t.contact}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              {profile.location && (
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.joined_date && (
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{t.memberSince} {new Date(profile.joined_date).getFullYear()}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 truncate transition-colors">
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{t.responseTime} &lt; 24h</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-green-700 font-medium">{t.verified} Profile</span>
              </div>
            </div>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="lg:col-span-2">

            {/* Tab navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
              <div className="flex border-b border-gray-100">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                      activeTab === tab.key
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        activeTab === tab.key ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* About */}
                    {profile.bio && (
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">{t.about}</h2>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">{profile.bio}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {profile.skills && profile.skills.length > 0 && (
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">{t.skills}</h2>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((skill, idx) => (
                            <span key={idx}
                              className="px-3 py-1.5 bg-white border-2 border-purple-100 text-purple-700 font-medium rounded-xl text-sm hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-default">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick stats row */}
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-3">
                        {language === 'en' ? 'Track Record' : '工作紀錄'}
                      </h2>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { icon: <Briefcase className="w-5 h-5 text-purple-500" />, value: profile.completed_projects || 0, label: language === 'en' ? 'Jobs Done' : '完成專案' },
                          { icon: <Star className="w-5 h-5 text-yellow-500" />, value: profile.rating ? profile.rating.toFixed(1) : '—', label: language === 'en' ? 'Rating' : '評分' },
                          { icon: <ThumbsUp className="w-5 h-5 text-green-500" />, value: ratingPercent ? `${ratingPercent}%` : '—', label: language === 'en' ? 'Success Rate' : '成功率' },
                        ].map((stat, i) => (
                          <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                            <div className="flex justify-center mb-2">{stat.icon}</div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent reviews preview */}
                    {profile.reviews && profile.reviews.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h2 className="text-lg font-bold text-gray-900">
                            {language === 'en' ? 'Recent Reviews' : '最新評價'}
                          </h2>
                          <button onClick={() => setActiveTab('reviews')}
                            className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                            {language === 'en' ? 'See all' : '查看全部'} <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        {profile.reviews.slice(0, 2).map(review => (
                          <div key={review.id} className="bg-gray-50 rounded-xl p-4 mb-3 last:mb-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                                  {review.reviewer_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{review.reviewer_name}</p>
                                  <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PORTFOLIO TAB */}
                {activeTab === 'portfolio' && (
                  <div>
                    {profile.portfolio && profile.portfolio.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {profile.portfolio.map(item => (
                          <div key={item.id}
                            className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all duration-200">
                            {item.image ? (
                              <div className="relative h-48 overflow-hidden">
                                <img src={item.image} alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ) : (
                              <div className="h-48 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                                <div className="text-center text-gray-400">
                                  <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                  <p className="text-xs">{language === 'en' ? 'No preview' : '無預覽圖'}</p>
                                </div>
                              </div>
                            )}
                            <div className="p-4">
                              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                              {item.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>
                              )}
                              {item.url && (
                                <a href={item.url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 font-semibold transition-colors">
                                  {t.viewProject} <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">{t.noPortfolio}</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {language === 'en' ? 'Check back later' : '請稍後再查看'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* REVIEWS TAB */}
                {activeTab === 'reviews' && (
                  <div>
                    {profile.reviews && profile.reviews.length > 0 ? (
                      <>
                        {/* Summary */}
                        {profile.rating && (
                          <div className="bg-gray-50 rounded-2xl p-5 mb-6 flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-5xl font-bold text-gray-900">{profile.rating.toFixed(1)}</p>
                              <div className="flex justify-center gap-0.5 my-1.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${i < Math.round(profile.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                                ))}
                              </div>
                              <p className="text-xs text-gray-500">{profile.review_count || 0} {language === 'en' ? 'reviews' : '則評價'}</p>
                            </div>
                            <div className="flex-1 space-y-2">
                              {[5, 4, 3, 2, 1].map(star => {
                                const count = profile.reviews!.filter(r => r.rating === star).length;
                                const pct = profile.reviews!.length > 0 ? (count / profile.reviews!.length) * 100 : 0;
                                return (
                                  <div key={star} className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-500 w-3">{star}</span>
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                      <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-gray-400 w-4 text-right">{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          {profile.reviews.map(review => (
                            <div key={review.id} className="border border-gray-100 rounded-2xl p-5">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                                    {review.reviewer_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                                    <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-full">
                                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-bold text-yellow-700">{review.rating}.0</span>
                                </div>
                              </div>
                              <p className="text-gray-700 leading-relaxed text-sm">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-16">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">{t.noReviews}</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {language === 'en' ? 'Be the first to leave a review' : '成為第一個留下評價的人'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowInviteModal(false); }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{t.inviteToProject}</h3>
              <button onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-5 text-sm">{t.selectProject}</p>
              {myProjects.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t.noProjects}</p>
              ) : (
                <div className="space-y-3 mb-5">
                  {myProjects.map(project => (
                    <button key={project.id} onClick={() => sendInvite(project.id)}
                      className="w-full text-left p-4 border-2 border-gray-100 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all">
                      <h4 className="font-semibold text-gray-900 mb-1">{project.title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{project.description}</p>
                      <span className="text-sm font-bold text-purple-600">{project.budget} {project.currency}</span>
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setShowInviteModal(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors">
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
