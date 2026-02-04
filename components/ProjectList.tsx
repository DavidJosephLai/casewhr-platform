import { useState, useEffect, useCallback, memo } from "react"; // ✅ 添加 React imports
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { getTranslation } from "../lib/translations";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { ProjectDialog } from "./ProjectDialog";
import { ProposalListDialog } from "./ProposalListDialog"; // ✅ 使用 ProposalListDialog（正確的提案列表組件）
import { ProjectPostingDialog } from "./ProjectPostingDialog";
import { ProjectCard } from "./ProjectCard"; // ✅ 使用 ProjectCard 組件
import { formatCurrency, getDefaultCurrency } from "../lib/currency";
import { projectApi } from "../lib/api";
import { Pagination } from "./Pagination";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Loader2, Briefcase, Calendar, DollarSign, MessageSquare, Trash2, Banknote, CheckCircle, Building2 } from "lucide-react";
import { toast } from "sonner";

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

// 🔄 ProjectCard 需要的格式
interface ProjectCardFormat {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  budget_type: "fixed" | "hourly";
  currency?: any;
  deadline: string | null;
  required_skills: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  client_id: string;
  client_name: string;
  client_email: string;
  proposal_count: number;
  created_at: string;
  updated_at: string;
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
  // const [showLoader, setShowLoader] = useState(false); // ✅ 不再需要 showLoader，避免畫面閃爍
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  
  // 🌟 企業版 LOGO 狀態
  const [enterpriseLogos, setEnterpriseLogos] = useState<Record<string, string | null>>({});
  const [enterpriseStatus, setEnterpriseStatus] = useState<Record<string, boolean>>({});
  const [enterpriseNames, setEnterpriseNames] = useState<Record<string, string>>({});

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
      
      // 🔍 詳細檢查每個案件的編碼
      response?.projects?.forEach((p: any, index: number) => {
        console.log(`🔍 [ProjectList] Project ${index}:`, {
          title: p.title,
          category: p.category,
          required_skills: p.required_skills,
          categoryBytes: p.category ? Array.from(new TextEncoder().encode(p.category)) : null,
        });
      });
      
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
  }, [loadProjects]);

  // 🎯 監聽從 InvitationNotifications 觸發的打開專案詳情事件
  // ⚠️ 已移除：改由 Dashboard 組件統一處理事件監聽
  // 因為 ProjectList 可能不在 DOM 中（當用戶在其他標籤頁時），
  // 所以將事件處理移到更高層級的 Dashboard 組件

  // 🌟 獲取企業版 LOGO
  useEffect(() => {
    if (projects.length === 0) return;
    
    const fetchEnterpriseLogos = async () => {
      // 獲取所有唯一的 user_id
      const userIds = [...new Set(projects.map(p => p.user_id))];
      
      console.log('🔍 [ProjectList] Fetching enterprise info for userIds:', userIds);
      
      for (const userId of userIds) {
        try {
          // 1️⃣ 先獲取企業名稱（所有用戶都可能有）
          const nameResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/public/enterprise-name/${userId}`,
            { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
          );
          
          if (nameResponse.ok) {
            const nameData = await nameResponse.json();
            console.log('🏢 [ProjectList] Name response for', userId, ':', nameData);
            
            if (nameData?.hasName && nameData?.name) {
              setEnterpriseNames(prev => ({ ...prev, [userId]: nameData.name }));
              console.log('✅ [ProjectList] Company name set:', nameData.name);
            }
          }
          
          // 2️⃣ 嘗試獲取 LOGO（不管訂閱狀態，先拿再說）
          const logoResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/public/enterprise-logo/${userId}`,
            { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
          );
          
          if (logoResponse.ok) {
            const logoData = await logoResponse.json();
            console.log('🖼️ [ProjectList] Logo response for', userId, ':', logoData);
            
            if (logoData?.hasLogo && logoData?.logoUrl) {
              setEnterpriseLogos(prev => ({ ...prev, [userId]: logoData.logoUrl }));
              setEnterpriseStatus(prev => ({ ...prev, [userId]: true })); // 有 LOGO 就標記為企業版
              console.log('✅ [ProjectList] Logo set:', logoData.logoUrl);
            }
          }
          
          // 3️⃣ 檢查訂閱狀態（用於其他用途）
          const subResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/status?userId=${userId}`,
            { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
          );
          
          if (subResponse.ok) {
            const subData = await subResponse.json();
            console.log('📊 [ProjectList] Subscription for', userId, ':', subData);
            
            const isEnterprise = 
              subData?.plan?.toLowerCase?.() === 'enterprise' ||
              subData?.hasEnterprise === true ||
              subData?.isEnterprise === true;
            
            if (isEnterprise) {
              setEnterpriseStatus(prev => ({ ...prev, [userId]: true }));
              console.log('✅ [ProjectList] Enterprise status confirmed for:', userId);
            }
          }
        } catch (error) {
          console.error('❌ [ProjectList] Error fetching for userId:', userId, error);
        }
      }
    };
    
    fetchEnterpriseLogos();
  }, [projects]);

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
      {/* ✅ 不再顯示 loading 覆蓋層，避免畫面閃爍 */}

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
              {/* 🌟 第一行：企業 LOGO + 企業名稱 */}
              {enterpriseNames[project.user_id] && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                  {/* LOGO：企業版顯示真實 LOGO，其他顯示預設圖標 */}
                  {enterpriseStatus[project.user_id] && enterpriseLogos[project.user_id] ? (
                    <img 
                      src={enterpriseLogos[project.user_id]} 
                      alt="Company Logo" 
                      className="h-12 w-12 object-contain"
                    />
                  ) : (
                    // ✅ 預設圖標：只要有公司名稱就顯示
                    <div className="h-12 w-12 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-sm">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  )}
                  {/* 公司名稱（所有用戶只要有就顯示） */}
                  <span className="text-sm font-semibold text-purple-700">
                    {enterpriseNames[project.user_id]}
                  </span>
                </div>
              )}
              
              {/* 第二行：案件標題 + 狀態 */}
              <div className="flex items-start justify-between">
                <CardTitle className="line-clamp-2 flex-1">{project.title}</CardTitle>
                <div className="flex gap-2 ml-2">
                  <Badge className={getStatusColor(project.status)}>
                    {t.status[project.status as keyof typeof t.status]}
                  </Badge>
                  {/* ⚠️ Pending Payment 特別提示 */}
                  {user?.id === project.user_id && project.status === 'pending_payment' && (
                    <Badge className="bg-orange-500 text-white animate-pulse">
                      💰 {language === 'en' ? 'Action Needed' : '需要撥款'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardDescription className="text-sm text-gray-500">
                {project.category ? (
                  <Badge className="bg-gray-100 text-gray-800 mr-2">
                    {project.category}
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800 mr-2">
                    {language === 'en' ? 'Uncategorized' : '未分類'}
                  </Badge>
                )}
                {/* ✅ 安全處理 required_skills - 可能是 undefined 或空陣列 */}
                {project.required_skills && Array.isArray(project.required_skills) && project.required_skills.map(skill => (
                  <Badge key={skill} className="bg-gray-100 text-gray-800 mr-2">
                    {skill}
                  </Badge>
                ))}
              </CardDescription>
              <CardDescription className="text-sm text-gray-500">
                {project.deadline ? (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                    {formatDate(project.deadline)}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                    {language === 'en' ? 'No deadline' : '無截止日期'}
                  </div>
                )}
              </CardDescription>
              <CardDescription className="text-sm text-gray-500">
                {project.budget_min || project.budget_max ? (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
                    {formatBudget(project.budget_min, project.budget_max)}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
                    {language === 'en' ? 'Budget not specified' : '未指定預算'}
                  </div>
                )}
              </CardDescription>
              <CardDescription className="text-sm text-gray-500">
                {project.proposal_count ? (
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 text-gray-500 mr-1" />
                    {project.proposal_count} {language === 'en' ? 'proposals' : '提案'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 text-gray-500 mr-1" />
                    {language === 'en' ? 'No proposals' : '無提案'}
                  </div>
                )}
              </CardDescription>
              <CardDescription className="text-sm text-gray-500">
                {project.pending_proposal_count ? (
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 text-gray-500 mr-1" />
                    {project.pending_proposal_count} {language === 'en' ? 'pending proposals' : '待審核提案'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 text-gray-500 mr-1" />
                    {language === 'en' ? 'No pending proposals' : '無待審核提案'}
                  </div>
                )}
              </CardDescription>
            </CardContent>
            <CardFooter className="p-4">
              <Button
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                onClick={() => handleViewProject(project)}
              >
                {language === 'en' ? 'View Project' : '查看項目'}
              </Button>
              <Button
                className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                onClick={() => handleViewProposals(project)}
              >
                {language === 'en' ? 'View Proposals' : '查看提案'}
              </Button>
              {!hideActions && (
                <Button
                  className="bg-red-500 text-white px-4 py-2 rounded"
                  onClick={() => handleDeleteProject(project)}
                >
                  {language === 'en' ? 'Delete Project' : '刪除項目'}
                </Button>
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
      <ProposalListDialog
        project={selectedProject}
        open={proposalDialogOpen}
        onOpenChange={setProposalDialogOpen}
        onProposalAccepted={loadProjects}
      />
    </>
  );
});