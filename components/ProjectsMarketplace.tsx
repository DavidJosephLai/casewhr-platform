import { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { useAuth } from "../contexts/AuthContext";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { ProjectDialog } from "./ProjectDialog";
import { PostProjectDialog } from "./PostProjectDialog";
import { ProposalForm } from "./ProposalForm";
import { fetchWithRetry, parseJsonResponse } from "../lib/apiErrorHandler";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Filter, X, Loader2, Briefcase, DollarSign, Calendar, Plus } from "lucide-react";

interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  deadline: string | null;
  required_skills: string[];
  category: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

const categories = [
  { value: "development", en: "Development & IT", "zh-TW": "開發與IT", "zh-CN": "开发与IT" },
  { value: "design", en: "Design & Creative", "zh-TW": "設計與創意", "zh-CN": "设计与创意" },
  { value: "content", en: "Content & Writing", "zh-TW": "內容與寫作", "zh-CN": "内容与写作" },
  { value: "marketing", en: "Marketing & Sales", "zh-TW": "營銷與銷售", "zh-CN": "营销与销售" },
  { value: "video", en: "Video & Animation", "zh-TW": "視頻與動畫", "zh-CN": "视频与动画" },
  { value: "business", en: "Business Consulting", "zh-TW": "商業諮詢", "zh-CN": "商业咨询" },
];

export function ProjectsMarketplace() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const t = getTranslation(language as any);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("open");
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false); // 新增：查看詳情對話框狀態

  // ✅ Stabilize loadProjects with useCallback
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/projects`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          mode: 'cors',
        },
        2, // maxRetries
        45000 // 45 second timeout - increased for better stability
      );

      if (response.ok) {
        const data = await parseJsonResponse<any>(response);
        setProjects(data.projects || []);
      } else {
        const data = await parseJsonResponse<any>(response).catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to load projects:', data.error);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ No dependencies needed

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // ✅ Use useMemo for filtering instead of useEffect
  const filteredResults = useMemo(() => {
    let filtered = [...projects];

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(p => p.status === selectedStatus);
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.required_skills.some(skill => skill.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [projects, selectedStatus, selectedCategory, searchQuery]);

  // ✅ Update filtered projects when results change
  useEffect(() => {
    setFilteredProjects(filteredResults);
  }, [filteredResults]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("open");
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || selectedStatus !== "open";

  const formatBudget = (min: number, max: number) => {
    if (min === 0 && max === 0) return language === 'en' ? 'Negotiable' : '面議';
    if (min === max) return `$${min.toLocaleString()}`;
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { en: string; zh: string }> = {
      open: { en: 'Open', zh: '開放中' },
      in_progress: { en: 'In Progress', zh: '進行中' },
      completed: { en: 'Completed', zh: '已完成' },
      cancelled: { en: 'Cancelled', zh: '已取消' },
    };
    return language === 'en' ? statusMap[status]?.en : statusMap[status]?.zh;
  };

  const getCategoryName = (categoryValue: string) => {
    const cat = categories.find(c => c.value === categoryValue);
    return cat ? (language === 'en' ? cat.en : cat[language as 'zh-TW' | 'zh-CN']) : categoryValue;
  };

  const handleApplyClick = (project: Project) => {
    if (!user) {
      toast.error(language === 'en' ? 'Please sign in to apply' : '請登入以申請');
      return;
    }
    setSelectedProject(project);
    setProposalDialogOpen(true);
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setViewDialogOpen(true);
  };

  return (
    <section id="projects" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="mb-2">
              {language === 'en' ? 'Project Marketplace' : '案件市場'}
            </h2>
            <p className="text-gray-600">
              {language === 'en' 
                ? 'Browse available projects and submit proposals'
                : '瀏覽可用案件並提交提案'}
            </p>
          </div>
          {user && (
            <Button onClick={() => setPostDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {language === 'en' ? 'Post Project' : '發布案件'}
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-50 rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={language === 'en' ? 'Search projects...' : '搜尋案件...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={language === 'en' ? 'Category' : '分類'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'en' ? 'All Categories' : '所有分類'}
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {language === 'en' ? cat.en : cat[language as 'zh-TW' | 'zh-CN']}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={language === 'en' ? 'Status' : '狀態'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'en' ? 'All Status' : '所有狀態'}
                  </SelectItem>
                  <SelectItem value="open">
                    {language === 'en' ? 'Open' : '開放中'}
                  </SelectItem>
                  <SelectItem value="in_progress">
                    {language === 'en' ? 'In Progress' : '進行中'}
                  </SelectItem>
                  <SelectItem value="completed">
                    {language === 'en' ? 'Completed' : '已完成'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {language === 'en' ? 'Active filters:' : '活躍篩選器：'}
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-blue-600 hover:text-blue-700">
                <X className="h-4 w-4 mr-1" />
                {language === 'en' ? 'Clear all' : '清除全部'}
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-6 text-sm text-gray-600">
          {language === 'en' ? 'Showing' : '顯示'}{' '}
          <span className="font-semibold">{filteredProjects.length}</span>{' '}
          {language === 'en' ? 'of' : '/'}{' '}
          <span className="font-semibold">{projects.length}</span>{' '}
          {language === 'en' ? 'projects' : '個案件'}
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">
              {language === 'en' ? 'Loading projects...' : '載入案件中...'}
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="mb-2 text-gray-900">
              {language === 'en' ? 'No projects found' : '未找到案件'}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === 'en' 
                ? 'Try adjusting your filters or check back later for new projects.'
                : '嘗試調整篩選條件或稍後回來查看新案件。'}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline">
                {language === 'en' ? 'Clear filters' : '清除篩選'}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow border-2 border-gray-300 hover:border-gray-400">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{project.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusText(project.status)}
                        </Badge>
                        <Badge variant="outline">{getCategoryName(project.category)}</Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Budget */}
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {language === 'en' ? 'Budget:' : '預算：'}
                      </span>
                      <span className="font-semibold text-green-600">
                        {formatBudget(project.budget_min, project.budget_max)}
                      </span>
                    </div>

                    {/* Deadline */}
                    {project.deadline && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {language === 'en' ? 'Deadline:' : '截止日期：'}
                        </span>
                        <span>{formatDate(project.deadline)}</span>
                      </div>
                    )}

                    {/* Skills */}
                    {project.required_skills.length > 0 && (
                      <div className="pt-2">
                        <div className="flex flex-wrap gap-1">
                          {project.required_skills.slice(0, 5).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {project.required_skills.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{project.required_skills.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(project)}
                    className="border-[3px] border-gray-600 hover:border-gray-800 font-semibold"
                  >
                    {language === 'en' ? 'View Details' : '查看詳情'}
                  </Button>
                  {project.status === 'open' && user && project.client_id !== user.id && (
                    <Button onClick={() => handleApplyClick(project)}>
                      {language === 'en' ? 'Apply Now' : '立即申請'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {/* 🔥 只有登錄用戶才能看到發布項目對話框 */}
      {user && (
        <PostProjectDialog 
          open={postDialogOpen} 
          onOpenChange={setPostDialogOpen}
          onSuccess={loadProjects}
        />
      )}
      
      {/* 查看詳情對話框 */}
      {selectedProject && (
        <ProjectDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          project={selectedProject}
          onUpdate={loadProjects}
        />
      )}
      
      {/* 提案表單對話框 */}
      {selectedProject && (
        <ProposalForm
          open={proposalDialogOpen}
          onOpenChange={setProposalDialogOpen}
          project={selectedProject}
          onSuccess={() => {
            setProposalDialogOpen(false);
            toast.success(language === 'en' ? 'Proposal submitted!' : '提案已提交！');
          }}
        />
      )}
    </section>
  );
}