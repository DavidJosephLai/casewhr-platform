import { useState, useEffect, useCallback, memo } from "react"; // ✅ Added memo
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Loader2, Briefcase, DollarSign, Calendar, MessageSquare, Trash2, Banknote, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { getTranslation } from "../lib/translations";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { ProjectDialog } from "./ProjectDialog";
import { ProjectPostingDialog } from "./ProjectPostingDialog";
import { formatCurrency, getDefaultCurrency } from "../lib/currency";
import { projectApi } from "../lib/api";
import { Pagination } from "./Pagination";

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  required_skills: string[];
  category: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'pending_payment' | 'pending_review';
  created_at: string;
  updated_at: string;
  proposal_count?: number;
  pending_proposal_count?: number;
}

interface ProjectListProps {
  clientId?: string;
  refreshKey?: number; // ✅ Add refreshKey prop
  sortBy?: string; // 新增排序參數
  budgetMin?: string; // 新增預算篩選
  budgetMax?: string;
  searchQuery?: string; // 新增搜尋參數
  hideActions?: boolean; // 新增：隱藏操作按鈕（刪除、撥款等）用於公開瀏覽模式
  category?: string; // 新增類別篩選
  skill?: string[]; // 新增技能篩選
  status?: string; // 新增狀態篩選
  disableDevMode?: boolean; // 新增：禁用 dev mode mock 數據（用於 Dashboard 我的專案）
}

export const ProjectList = memo(function ProjectList({ clientId, refreshKey, sortBy, budgetMin, budgetMax, searchQuery, hideActions, category, skill, status, disableDevMode }: ProjectListProps) {
  const { accessToken, user, profile } = useAuth();
  const { language } = useLanguage();
  const t = getTranslation(language as any).projects;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false); // 延遲顯示載入器
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);

  // 📄 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 12; // 每頁顯示 12 個專案（3列 x 4行）
  
  // Calculate pagination
  const totalPages = Math.ceil(projects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const currentProjects = projects.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [clientId, refreshKey, sortBy, budgetMin, budgetMax, searchQuery, category, skill, status]);

  // ✅ Stabilize loadProjects with useCallback
  const loadProjects = useCallback(async () => {
    console.log('🔍 [ProjectList] ========== START LOADING PROJECTS ==========');
    console.log('🔍 [ProjectList] clientId:', clientId);
    console.log('🔍 [ProjectList] user?.id:', user?.id);
    console.log('🔍 [ProjectList] refreshKey:', refreshKey);
    
    setLoading(true);
    try {
      const filters: any = {};
      
      // 如果是接案者且沒有指定 userId（不是查看自己的項目），則根據技能過濾
      const isFreelancer = profile?.is_freelancer;
      const userSkills = profile?.skills;
      
      if (clientId) filters.user_id = clientId;
      if (sortBy) filters.sort_by = sortBy;
      if (budgetMin) filters.budget_min = budgetMin;
      if (budgetMax) filters.budget_max = budgetMax;
      if (searchQuery) filters.search_query = searchQuery;
      if (category) filters.category = category;
      // 將 skill 數組轉換為逗號分隔的字符串
      if (skill && skill.length > 0) filters.required_skills = skill.join(',');
      if (status) filters.status = status;

      console.log('🔍 [ProjectList] Filters:', filters);
      console.log('🔍 [ProjectList] Loading projects with filters:', { 
        filters, 
        isFreelancer, 
        userSkills 
      });
      
      // 🔥 開發模式支援：
      // - 如果有 clientId（Dashboard 我的專案）：使用真實 API
      // - 如果有 disableDevMode（強制禁用）：使用真實 API  
      // - 否則（主頁公開瀏覽）：也使用真實 API，確保能看到所有用戶發布的項目
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      
      // ❌ 暫時禁用 localStorage mock，統一使用真實 API
      // if (devModeActive && !clientId && !disableDevMode) {
      //   const devProjects = localStorage.getItem('dev_mode_projects');
      //   if (devProjects) {
      //     try {
      //       const projects = JSON.parse(devProjects);
      //       console.log('🧪 [ProjectList] Using dev mode projects for public view:', projects);
      //       setProjects(projects);
      //       setLoading(false);
      //       return;
      //     } catch (err) {
      //       console.error('Failed to parse dev mode projects:', err);
      //     }
      //   }
      // }
      
      if (clientId) {
        console.log('🔍 [ProjectList] ClientId exists, fetching real projects from API for user:', clientId);
      } else {
        console.log('🔍 [ProjectList] No clientId, fetching all projects from API (public view)');
      }
      
      console.log('🔍 [ProjectList] Calling projectApi.getAll...');
      const response = await projectApi.getAll(filters);
      console.log('🔍 [ProjectList] ========== API RESPONSE ==========');
      console.log('🔍 [ProjectList] Response:', response);
      console.log('🔍 [ProjectList] Projects count:', response?.projects?.length);
      console.log('🔍 [ProjectList] Projects data:', response?.projects);
      console.log('🔍 [ProjectList] ====================================');

      if (response && response.projects) {
        // ✅ 直接使用後端返回的排序結果，不需要前端再次排序
        console.log('🔍 [ProjectList] Setting projects:', response.projects.length, 'projects');
        setProjects(response.projects);
      } else {
        console.warn('⚠️ [ProjectList] No projects in response, setting empty array');
        setProjects([]);
      }
    } catch (error) {
      console.error('❌ [ProjectList] Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
      console.log('🔍 [ProjectList] ========== FINISHED LOADING PROJECTS ==========');
    }
  }, [clientId, profile, sortBy, budgetMin, budgetMax, searchQuery, category, skill, status, user, refreshKey, disableDevMode]); // ✅ Add all dependencies

  useEffect(() => {
    loadProjects();
  }, [loadProjects, refreshKey]); // ✅ Use loadProjects in dependency

  const getStatusColor = (projectStatus: string) => {
    switch (projectStatus) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending_payment':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return language === 'en' ? 'Budget not specified' : '未指定預算';
    const currency = getDefaultCurrency(language);
    if (min && max) return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
    if (min) return `From ${formatCurrency(min, currency)}`;
    if (max) return `Up to ${formatCurrency(max, currency)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleViewProposals = (project: Project) => {
    setSelectedProject(project);
    setProposalDialogOpen(true);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!accessToken) {
      toast.error(language === 'en' ? 'Please login to delete project' : '請登入以刪除項目');
      return;
    }

    // 確認刪除
    const confirmMessage = language === 'en' 
      ? `Are you sure you want to delete "${project.title}"? This action cannot be undone.`
      : `要刪除「${project.title}」嗎？此操作無法撤銷。`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    // 如果項目正在進行中，給予額外警告
    if (project.status === 'in_progress') {
      const warningMessage = language === 'en'
        ? 'Warning: This project is currently in progress. Deleting it may affect the assigned freelancer. Continue?'
        : '警告：此項目正在進行中。刪除它可能會影響已分配的接案者。是否繼續？';
      
      if (!confirm(warningMessage)) {
        return;
      }
    }

    try {
      await projectApi.delete(project.id, accessToken);
      toast.success(language === 'en' ? 'Project deleted successfully' : '項目已成功刪除');
      // 重新加載項目列表
      loadProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to delete project' : '刪除項目失敗'));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">
          {language === 'en' ? 'Loading projects...' : '載入項目中...'}
        </p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="mb-2 text-gray-900">{t.empty.title}</h3>
        <p className="text-gray-600 mb-6">{t.empty.description}</p>
        {!loading && (
          <p className="text-sm text-gray-500 mt-4">
            {language === 'en' 
              ? 'If you believe this is an error, please try refreshing the page.' 
              : '如果您認為這是一個錯誤，請嘗試刷新頁面。'}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        {language === 'en' 
          ? `Showing ${startIndex + 1}-${Math.min(endIndex, projects.length)} of ${projects.length} projects`
          : `顯示 ${startIndex + 1}-${Math.min(endIndex, projects.length)} 共 ${projects.length} 個專案`
        }
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(project.status)}>
                    {t.status[project.status as keyof typeof t.status]}
                  </Badge>
                  {/* ⚠️ Pending Payment 特別提示 */}
                  {user?.id === project.user_id && project.status === 'pending_payment' && (
                    <Badge className="bg-orange-500 text-white animate-pulse">
                      💰 {language === 'en' ? 'Action Needed' : '需要撥款'}
                    </Badge>
                  )}
                  {/* 显示提案量 - 仅项目发布者可见 */}
                  {user?.id === project.user_id && (project.proposal_count ?? 0) > 0 && (() => {
                    // 已完成或进行中的项目：显示 "1/1 Proposal"（已接受）
                    if (project.status === 'completed' || project.status === 'in_progress' || project.status === 'pending_review' || project.status === 'pending_payment') {
                      return (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          1/{project.proposal_count} {language === 'en' ? 'Proposal' : '提案'}
                        </Badge>
                      );
                    }
                    // 开放状态的项目：显示 "X/Y New"（待审核）
                    if (project.status === 'open' && (project.pending_proposal_count ?? 0) > 0) {
                      return (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {project.pending_proposal_count}/{project.proposal_count} {language === 'en' ? 'New' : '新'}
                        </Badge>
                      );
                    }
                    // 开放状态但没有新提案：只显示总数
                    if (project.status === 'open') {
                      return (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                          {project.proposal_count} {language === 'en' ? 'Proposal' + (project.proposal_count > 1 ? 's' : '') : '提案'}
                        </Badge>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Budget */}
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="h-4 w-4 mr-2" />
                <span>{formatBudget(project.budget_min, project.budget_max)}</span>
              </div>

              {/* Deadline */}
              {project.deadline && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDate(project.deadline)}</span>
                </div>
              )}

              {/* Category */}
              {project.category && (
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span>{project.category}</span>
                </div>
              )}

              {/* Skills */}
              {project.required_skills && project.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.required_skills.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {project.required_skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.required_skills.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <div className="flex justify-between items-center w-full">
                <span className="text-xs text-gray-500">
                  {formatDate(project.created_at)}
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewProject(project)}
                    className="h-9 border-2 border-gray-600 hover:border-gray-800 font-semibold"
                  >
                    {language === 'en' ? 'View Details' : '查看詳情'}
                  </Button>
                  {/* 只为项目发布者显示"查看提案"按钮 */}
                  {(() => {
                    const isOwner = user?.id === project.user_id;
                    const isOpen = project.status === 'open';
                    const shouldShow = !!(isOwner && isOpen); // 強制轉換為布爾值
                    
                    console.log('🔍 [Proposal Button Check]', {
                      projectTitle: project.title,
                      projectId: project.id,
                      projectUserId: project.user_id,
                      currentUserId: user?.id,
                      isOwner,
                      projectStatus: project.status,
                      isOpen,
                      shouldShowRaw: (isOwner && isOpen),
                      shouldShow,
                      userIdType: typeof user?.id,
                      projectUserIdType: typeof project.user_id,
                    });
                    
                    return shouldShow;
                  })() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProposals(project)}
                      className="h-9"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {language === 'en' ? 'Proposals' : '提案'}
                    </Button>
                  )}
                  {/* 只为项目发布者示\"刪除\"按钮 */}
                  {!hideActions && user?.id === project.user_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProject(project)}
                      className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* 案主快捷操作按钮 - 据项目状态显示 */}
              {!hideActions && user?.id === project.user_id && (
                <>
                  {/* pending_payment: 显示撥款按钮 - 添加醒目的動畫效果 */}
                  {project.status === 'pending_payment' && (
                    <div className="relative">
                      {/* 脈衝動畫背景 */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg opacity-75 blur animate-pulse"></div>
                      <Button
                        className="relative w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                        size="sm"
                        onClick={() => handleViewProject(project)}
                      >
                        <Banknote className="h-4 w-4 mr-2" />
                        {language === 'en' ? '💰 Release Payment Now' : '💰 立即撥款'}
                      </Button>
                    </div>
                  )}
                  
                  {/* pending_review: 显示待审核提示 */}
                  {project.status === 'pending_review' && (
                    <Button
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                      size="sm"
                      onClick={() => handleViewProject(project)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {language === 'en' ? '📋 Review Deliverable' : '📋 審核交付物'}
                    </Button>
                  )}
                </>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          language={language}
          sectionId="projects"
        />
      )}

      {/* Project Detail Dialog */}
      <ProjectDialog
        project={selectedProject}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={loadProjects}
      />

      {/* Post Project Dialog */}
      <ProjectPostingDialog
        open={postDialogOpen}
        onOpenChange={setPostDialogOpen}
        onSuccess={loadProjects}
      />

      {/* Proposal List Dialog */}
      <ProposalDialog
        project={selectedProject}
        open={proposalDialogOpen}
        onOpenChange={setProposalDialogOpen}
        onProposalAccepted={loadProjects}
      />
    </>
  );
});