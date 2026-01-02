import { useState, useEffect } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLevel } from '../../config/admin';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Briefcase,
  Search,
  Filter,
  Eye,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  Loader2,
  DollarSign,
  Users,
  TrendingUp,
  Flag,
  AlertTriangle,
  Play,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Helper function to create auth headers with dev token support
function createAuthHeaders(accessToken: string | null): HeadersInit {
  const headers: HeadersInit = {};
  
  if (accessToken?.startsWith('dev-user-')) {
    // Dev mode: Use publicAnonKey for Authorization, dev token in X-Dev-Token
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
    headers['X-Dev-Token'] = accessToken;
    console.log('[AdminProjects] Dev mode: Using publicAnonKey for auth, dev token in X-Dev-Token header');
  } else if (accessToken) {
    // Production mode: Use access token
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  budget_min?: number;
  budget_max?: number;
  client_name: string;
  client_email: string;
  proposal_count: number;
  pending_proposals: number;
  created_at: string;
  updated_at: string;
  required_skills?: string[];
  freelancer?: {
    id: string;
    name: string;
    email: string;
  };
  flags?: any[];
}

interface ProjectStats {
  total: number;
  by_status: {
    open: number;
    in_progress: number;
    pending_review: number;
    completed: number;
    cancelled: number;
    paused: number;
  };
  average_budget: number;
  flagged_count: number;
  this_month: number;
}

export function AdminProjects() {
  const { language } = useLanguage();
  const { accessToken, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const content = {
    en: {
      title: 'Project Management',
      search: 'Search projects...',
      all: 'All',
      open: 'Open',
      inProgress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      paused: 'Paused',
      projectTitle: 'Project Title',
      client: 'Client',
      budget: 'Budget',
      status: 'Status',
      proposals: 'Proposals',
      created: 'Created',
      actions: 'Actions',
      viewDetails: 'View Details',
      pauseProject: 'Pause',
      resumeProject: 'Resume',
      deleteProject: 'Delete',
      noProjects: 'No projects found',
      projectDetails: 'Project Details',
      description: 'Description',
      category: 'Category',
      skills: 'Required Skills',
      deadline: 'Deadline',
      assignedTo: 'Assigned To',
      proposalList: 'Proposals',
      pendingProposals: 'Pending',
      confirmDelete: 'Delete Project',
      deleteWarning: 'Are you sure you want to delete this project? This action cannot be undone.',
      deleteReasonLabel: 'Deletion Reason',
      deleteReasonPlaceholder: 'Enter reason for deletion (required)...',
      cancel: 'Cancel',
      confirmDeleteBtn: 'Delete Project',
      deleteSuccess: 'Project deleted successfully',
      changeStatus: 'Change Status',
      selectStatus: 'Select new status',
      statusReasonLabel: 'Reason (optional)',
      statusReasonPlaceholder: 'Enter reason for status change...',
      updateStatus: 'Update Status',
      statusUpdateSuccess: 'Project status updated successfully',
      error: 'Operation failed',
      loading: 'Loading projects...',
      stats: {
        totalProjects: 'Total Projects',
        averageBudget: 'Avg Budget',
        thisMonth: 'This Month',
        flagged: 'Flagged',
      },
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
    },
    'zh-TW': {
      title: '項目管理',
      search: '搜索項目...',
      all: '全部',
      open: '進行中',
      inProgress: '開發中',
      completed: '已完成',
      cancelled: '已取消',
      paused: '已暫停',
      projectTitle: '項目標題',
      client: '客戶',
      budget: '預算',
      status: '狀態',
      proposals: '提案',
      created: '創建時間',
      actions: '操作',
      viewDetails: '查看詳情',
      pauseProject: '暫停',
      resumeProject: '恢復',
      deleteProject: '刪除',
      noProjects: '未找到項目',
      projectDetails: '項目詳情',
      description: '描述',
      category: '類別',
      skills: '所需技能',
      deadline: '截止日期',
      assignedTo: '指派給',
      proposalList: '提案列表',
      pendingProposals: '待審核',
      confirmDelete: '刪除項目',
      deleteWarning: '確定要刪除此項目嗎？此操作無法撤銷。',
      deleteReasonLabel: '刪除原因',
      deleteReasonPlaceholder: '請輸入刪除原因（必填）...',
      cancel: '取消',
      confirmDeleteBtn: '確認刪除',
      deleteSuccess: '項目已刪除',
      changeStatus: '更改狀態',
      selectStatus: '選擇新狀態',
      statusReasonLabel: '原因（可選）',
      statusReasonPlaceholder: '請輸入狀態更改原因...',
      updateStatus: '更新狀態',
      statusUpdateSuccess: '項目狀態已更新',
      error: '操作失敗',
      loading: '載入項目中...',
      stats: {
        totalProjects: '項目總數',
        averageBudget: '平均預算',
        thisMonth: '本月新增',
        flagged: '問題項目',
      },
      page: '第',
      of: '頁，共',
      previous: '上一頁',
      next: '下一頁',
    },
    'zh-CN': {
      title: '项目管理',
      search: '搜索项目...',
      all: '全部',
      open: '进行中',
      inProgress: '开发中',
      completed: '已完成',
      cancelled: '已取消',
      paused: '已暂停',
      projectTitle: '项目标题',
      client: '客户',
      budget: '预算',
      status: '状态',
      proposals: '提案',
      created: '创建时间',
      actions: '操作',
      viewDetails: '查看详情',
      pauseProject: '暂停',
      resumeProject: '恢复',
      deleteProject: '删除',
      noProjects: '未找到项目',
      projectDetails: '项目详情',
      description: '描述',
      category: '类别',
      skills: '所需技能',
      deadline: '截止日期',
      assignedTo: '指派给',
      proposalList: '提案列表',
      pendingProposals: '待审核',
      confirmDelete: '删除项目',
      deleteWarning: '确定要删除此项目吗？此操作无法撤销。',
      deleteReasonLabel: '删除原因',
      deleteReasonPlaceholder: '请输入删除原因（必填）...',
      cancel: '取消',
      confirmDeleteBtn: '确认删除',
      deleteSuccess: '项目已删除',
      changeStatus: '更改状态',
      selectStatus: '选择新状态',
      statusReasonLabel: '原因（可选）',
      statusReasonPlaceholder: '请输入状态更改原因...',
      updateStatus: '更新状态',
      statusUpdateSuccess: '项目状态已更新',
      error: '操作失败',
      loading: '载入项目中...',
      stats: {
        totalProjects: '项目总数',
        averageBudget: '平均预算',
        thisMonth: '本月新增',
        flagged: '问题项目',
      },
      page: '第',
      of: '页，共',
      previous: '上一页',
      next: '下一页',
    }
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  useEffect(() => {
    if (accessToken) {
      fetchProjects();
      fetchStats();
    }
  }, [accessToken, currentPage, statusFilter, searchQuery]);

  const fetchProjects = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/projects?${params}`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/projects/stats`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject || !deleteReason.trim()) return;

    setActionLoading(selectedProject.id);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/projects/${selectedProject.id}`,
        {
          method: 'DELETE',
          headers: createAuthHeaders(accessToken),
          body: JSON.stringify({ reason: deleteReason }),
        }
      );

      if (response.ok) {
        toast.success(t.deleteSuccess);
        setShowDeleteDialog(false);
        setDeleteReason('');
        setSelectedProject(null);
        fetchProjects();
        fetchStats();
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(t.error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedProject || !newStatus) return;

    setActionLoading(selectedProject.id);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/projects/${selectedProject.id}/status`,
        {
          method: 'PUT',
          headers: createAuthHeaders(accessToken),
          body: JSON.stringify({ 
            status: newStatus,
            reason: statusReason 
          }),
        }
      );

      if (response.ok) {
        toast.success(t.statusUpdateSuccess);
        setShowStatusDialog(false);
        setStatusReason('');
        setNewStatus('');
        setSelectedProject(null);
        fetchProjects();
        fetchStats();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t.error);
    } finally {
      setActionLoading(null);
    }
  };

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteDialog(true);
  };

  const openStatusDialog = (project: Project, status: string) => {
    setSelectedProject(project);
    setNewStatus(status);
    setShowStatusDialog(true);
  };

  const openDetailsDialog = (project: Project) => {
    setSelectedProject(project);
    setShowDetailsDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-green-500', text: t.open },
      in_progress: { color: 'bg-blue-500', text: t.inProgress },
      completed: { color: 'bg-gray-500', text: t.completed },
      cancelled: { color: 'bg-red-500', text: t.cancelled },
      paused: { color: 'bg-yellow-500', text: t.paused },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-400', text: status };

    return (
      <Badge className={`${config.color} text-white border-0`}>
        {config.text}
      </Badge>
    );
  };

  if (loading && projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">{t.loading}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.stats.totalProjects}</p>
                  <p className="text-2xl font-semibold">{stats.total}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.stats.averageBudget}</p>
                  <p className="text-2xl font-semibold">${Math.round(stats.average_budget)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.stats.thisMonth}</p>
                  <p className="text-2xl font-semibold">{stats.this_month}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.stats.flagged}</p>
                  <p className="text-2xl font-semibold">{stats.flagged_count}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {t.title}
            </CardTitle>
            <div className="text-sm text-gray-600">
              {total} {language === 'en' ? 'projects' : '個項目'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
              >
                {t.all}
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'open' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('open');
                  setCurrentPage(1);
                }}
              >
                {t.open}
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('in_progress');
                  setCurrentPage(1);
                }}
              >
                {t.inProgress}
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('completed');
                  setCurrentPage(1);
                }}
              >
                {t.completed}
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'paused' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('paused');
                  setCurrentPage(1);
                }}
              >
                {t.paused}
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('cancelled');
                  setCurrentPage(1);
                }}
              >
                {t.cancelled}
              </Button>
            </div>
          </div>

          {/* Projects Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.projectTitle}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.client}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.budget}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.status}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.proposals}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.created}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      {t.noProjects}
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {project.title}
                            </p>
                            {project.flags && project.flags.length > 0 && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Flagged
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p className="font-medium">{project.client_name}</p>
                          <p className="text-gray-500 text-xs">{project.client_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium">
                          {project.budget_min && project.budget_max
                            ? `$${project.budget_min} - $${project.budget_max}`
                            : project.budget_max
                            ? `$${project.budget_max}`
                            : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(project.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <span className="font-medium">{project.proposal_count}</span>
                          {project.pending_proposals > 0 && (
                            <span className="text-orange-600 ml-1">
                              ({project.pending_proposals} {t.pendingProposals})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetailsDialog(project)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {project.status === 'paused' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openStatusDialog(project, 'open')}
                              disabled={actionLoading === project.id}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          ) : project.status === 'open' || project.status === 'in_progress' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openStatusDialog(project, 'paused')}
                              disabled={actionLoading === project.id}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : null}

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(project)}
                            disabled={actionLoading === project.id}
                          >
                            {actionLoading === project.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                {t.page} {currentPage} {t.of} {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t.previous}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t.next}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.projectDetails}</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">{t.projectTitle}</Label>
                  <p className="font-medium">{selectedProject.title}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">{t.status}</Label>
                  <div className="mt-1">{getStatusBadge(selectedProject.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">{t.client}</Label>
                  <p className="font-medium">{selectedProject.client_name}</p>
                  <p className="text-xs text-gray-500">{selectedProject.client_email}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">{t.budget}</Label>
                  <p className="font-medium">
                    {selectedProject.budget_min && selectedProject.budget_max
                      ? `$${selectedProject.budget_min} - $${selectedProject.budget_max}`
                      : selectedProject.budget_max
                      ? `$${selectedProject.budget_max}`
                      : '-'}
                  </p>
                </div>
                {selectedProject.category && (
                  <div>
                    <Label className="text-xs text-gray-500">{t.category}</Label>
                    <p className="font-medium">{selectedProject.category}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-gray-500">{t.created}</Label>
                  <p className="font-medium">
                    {new Date(selectedProject.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs text-gray-500">{t.description}</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap">{selectedProject.description}</p>
              </div>

              {/* Skills */}
              {selectedProject.required_skills && selectedProject.required_skills.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">{t.skills}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProject.required_skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Freelancer */}
              {selectedProject.freelancer && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-gray-500">{t.assignedTo}</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{selectedProject.freelancer.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedProject.freelancer.email}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Proposals Count */}
              <div className="border-t pt-4">
                <Label className="text-xs text-gray-500">{t.proposalList}</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {selectedProject.proposal_count} {language === 'en' ? 'total' : '總計'}
                      </span>
                    </div>
                    {selectedProject.pending_proposals > 0 && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-400" />
                        <span className="text-sm text-orange-600">
                          {selectedProject.pending_proposals} {t.pendingProposals}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="delete-reason">{t.deleteReasonLabel}</Label>
              <Textarea
                id="delete-reason"
                placeholder={t.deleteReasonPlaceholder}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteReason('')}>
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={!deleteReason.trim() || actionLoading === selectedProject?.id}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === selectedProject?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Deleting...' : '刪除中...'}
                </>
              ) : (
                t.confirmDeleteBtn
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.changeStatus}</DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? `Change project status to "${newStatus}"`
                : `將項目狀態更改為「${newStatus}」`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="status-reason">{t.statusReasonLabel}</Label>
              <Textarea
                id="status-reason"
                placeholder={t.statusReasonPlaceholder}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusDialog(false);
                setStatusReason('');
                setNewStatus('');
              }}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={actionLoading === selectedProject?.id}
            >
              {actionLoading === selectedProject?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Updating...' : '更新中...'}
                </>
              ) : (
                t.updateStatus
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}