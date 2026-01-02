import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner';
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

interface Membership {
  user_id: string;
  user_name: string;
  user_email: string;
  tier: 'free' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  billing_period?: 'monthly' | 'annual';
  created_at: string;
  end_date?: string;
  current_usage: {
    projects: number;
    proposals: number;
  };
}

interface MembershipStats {
  total: number;
  by_tier: {
    free: number;
    professional: number;
    enterprise: number;
  };
  by_status: {
    active: number;
    cancelled: number;
    expired: number;
  };
  this_month: number;
  monthly_revenue: number;
  annual_revenue: number;
}

export function AdminMemberships() {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [stats, setStats] = useState<MembershipStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [updateTier, setUpdateTier] = useState('');
  const [updateReason, setUpdateReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const content = {
    en: {
      title: 'Membership Management',
      search: 'Search members...',
      all: 'All',
      free: 'Free',
      professional: 'Professional',
      enterprise: 'Enterprise',
      active: 'Active',
      cancelled: 'Cancelled',
      expired: 'Expired',
      user: 'User',
      tier: 'Tier',
      status: 'Status',
      usage: 'Usage',
      joined: 'Joined',
      actions: 'Actions',
      update: 'Update',
      cancel: 'Cancel',
      noMemberships: 'No memberships found',
      loading: 'Loading memberships...',
      stats: {
        totalMembers: 'Total Members',
        monthlyRevenue: 'Monthly Revenue',
        thisMonth: 'New This Month',
        activeMembers: 'Active Members',
      },
      updateMembership: 'Update Membership',
      selectTier: 'Select new tier',
      reasonLabel: 'Reason',
      reasonPlaceholder: 'Enter reason for update (required)...',
      updateSuccess: 'Membership updated successfully',
      cancelMembership: 'Cancel Membership',
      cancelWarning: 'Are you sure you want to cancel this membership?',
      cancelReasonLabel: 'Cancellation Reason',
      cancelReasonPlaceholder: 'Enter reason for cancellation (required)...',
      confirmCancel: 'Confirm Cancellation',
      cancelSuccess: 'Membership cancelled successfully',
      error: 'Operation failed',
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
      projects: 'projects',
      proposals: 'proposals',
    },
    'zh-TW': {
      title: '會員管理',
      search: '搜索會員...',
      all: '全部',
      free: '免費版',
      professional: '專業版',
      enterprise: '企業版',
      active: '活躍',
      cancelled: '已取消',
      expired: '已過期',
      user: '用戶',
      tier: '方案',
      status: '狀態',
      usage: '使用量',
      joined: '加入時間',
      actions: '操作',
      update: '更新',
      cancel: '取消',
      noMemberships: '未找到會員',
      loading: '載入會員中...',
      stats: {
        totalMembers: '總會員數',
        monthlyRevenue: '月收入',
        thisMonth: '本月新增',
        activeMembers: '活躍會員',
      },
      updateMembership: '更新會員',
      selectTier: '選擇新方案',
      reasonLabel: '原因',
      reasonPlaceholder: '請輸入更新原因（必填）...',
      updateSuccess: '會員已更新',
      cancelMembership: '取消會員',
      cancelWarning: '確定要取消此會員嗎？',
      cancelReasonLabel: '取消原因',
      cancelReasonPlaceholder: '請輸入取消原因（必填）...',
      confirmCancel: '確認取消',
      cancelSuccess: '會員已取消',
      error: '操作失敗',
      page: '第',
      of: '頁，共',
      previous: '上一頁',
      next: '下一頁',
      projects: '個項目',
      proposals: '個提案',
    },
    'zh-CN': {
      title: '会员管理',
      search: '搜索会员...',
      all: '全部',
      free: '免费版',
      professional: '专业版',
      enterprise: '企业版',
      active: '活跃',
      cancelled: '已取消',
      expired: '已过期',
      user: '用户',
      tier: '方案',
      status: '状态',
      usage: '使用量',
      joined: '加入时间',
      actions: '操作',
      update: '更新',
      cancel: '取消',
      noMemberships: '未找到会员',
      loading: '载入会员中...',
      stats: {
        totalMembers: '总会员数',
        monthlyRevenue: '月收入',
        thisMonth: '本月新增',
        activeMembers: '活跃会员',
      },
      updateMembership: '更新会员',
      selectTier: '选择新方案',
      reasonLabel: '原因',
      reasonPlaceholder: '请输入更新原因（必填）...',
      updateSuccess: '会员已更新',
      cancelMembership: '取消会员',
      cancelWarning: '确定要取消此会员吗？',
      cancelReasonLabel: '取消原因',
      cancelReasonPlaceholder: '请输入取消原因（必填）...',
      confirmCancel: '确认取消',
      cancelSuccess: '会员已取消',
      error: '操作失败',
      page: '第',
      of: '页，共',
      previous: '上一页',
      next: '下一页',
      projects: '个项目',
      proposals: '个提案',
    }
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  useEffect(() => {
    if (accessToken) {
      fetchMemberships();
      fetchStats();
    }
  }, [accessToken, currentPage, tierFilter, statusFilter, searchQuery]);

  const fetchMemberships = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (tierFilter && tierFilter !== 'all') {
        params.append('tier', tierFilter);
      }

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/memberships?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMemberships(data.memberships || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/memberships/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
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

  const handleUpdateMembership = async () => {
    if (!selectedMembership || !updateTier || !updateReason.trim()) return;

    setActionLoading(selectedMembership.user_id);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/memberships/${selectedMembership.user_id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tier: updateTier,
            reason: updateReason,
          }),
        }
      );

      if (response.ok) {
        toast.success(t.updateSuccess);
        setShowUpdateDialog(false);
        setUpdateTier('');
        setUpdateReason('');
        setSelectedMembership(null);
        fetchMemberships();
        fetchStats();
      } else {
        throw new Error('Failed to update membership');
      }
    } catch (error) {
      console.error('Error updating membership:', error);
      toast.error(t.error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelMembership = async () => {
    if (!selectedMembership || !cancelReason.trim()) return;

    setActionLoading(selectedMembership.user_id);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/memberships/${selectedMembership.user_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: cancelReason }),
        }
      );

      if (response.ok) {
        toast.success(t.cancelSuccess);
        setShowCancelDialog(false);
        setCancelReason('');
        setSelectedMembership(null);
        fetchMemberships();
        fetchStats();
      } else {
        throw new Error('Failed to cancel membership');
      }
    } catch (error) {
      console.error('Error cancelling membership:', error);
      toast.error(t.error);
    } finally {
      setActionLoading(null);
    }
  };

  const openUpdateDialog = (membership: Membership) => {
    setSelectedMembership(membership);
    setUpdateTier(membership.tier);
    setShowUpdateDialog(true);
  };

  const openCancelDialog = (membership: Membership) => {
    setSelectedMembership(membership);
    setShowCancelDialog(true);
  };

  const getTierBadge = (tier: string) => {
    const tierConfig = {
      free: { color: 'bg-gray-500', text: t.free },
      professional: { color: 'bg-blue-500', text: t.professional },
      enterprise: { color: 'bg-purple-500', text: t.enterprise },
    };

    const config = tierConfig[tier as keyof typeof tierConfig] || { color: 'bg-gray-400', text: tier };

    return (
      <Badge className={`${config.color} text-white border-0`}>
        {config.text}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-500', text: t.active },
      cancelled: { color: 'bg-red-500', text: t.cancelled },
      expired: { color: 'bg-gray-500', text: t.expired },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-400', text: status };

    return (
      <Badge className={`${config.color} text-white border-0`}>
        {config.text}
      </Badge>
    );
  };

  if (loading && memberships.length === 0) {
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
                  <p className="text-sm text-gray-600">{t.stats.totalMembers}</p>
                  <p className="text-2xl font-semibold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.stats.monthlyRevenue}</p>
                  <p className="text-2xl font-semibold">
                    ${(stats.monthly_revenue + stats.annual_revenue).toFixed(0)}
                  </p>
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
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.stats.activeMembers}</p>
                  <p className="text-2xl font-semibold">{stats.by_status.active}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
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
              <Crown className="h-5 w-5" />
              {t.title}
            </CardTitle>
            <div className="text-sm text-gray-600">
              {total} {language === 'en' ? 'members' : '位會員'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
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
              
              <Select value={tierFilter} onValueChange={(value) => {
                setTierFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t.all} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="free">{t.free}</SelectItem>
                  <SelectItem value="professional">{t.professional}</SelectItem>
                  <SelectItem value="enterprise">{t.enterprise}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t.all} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="active">{t.active}</SelectItem>
                  <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                  <SelectItem value="expired">{t.expired}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Memberships Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.user}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.tier}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.status}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.usage}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.joined}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {memberships.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      {t.noMemberships}
                    </td>
                  </tr>
                ) : (
                  memberships.map((membership) => (
                    <tr key={membership.user_id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p className="font-medium">{membership.user_name}</p>
                          <p className="text-gray-500 text-xs">{membership.user_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getTierBadge(membership.tier)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(membership.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p>{membership.current_usage.projects} {t.projects}</p>
                          <p className="text-gray-500 text-xs">
                            {membership.current_usage.proposals} {t.proposals}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(membership.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openUpdateDialog(membership)}
                            disabled={actionLoading === membership.user_id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {membership.status === 'active' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openCancelDialog(membership)}
                              disabled={actionLoading === membership.user_id}
                            >
                              {actionLoading === membership.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}
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

      {/* Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.updateMembership}</DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? `Update membership for ${selectedMembership?.user_name}`
                : `更新 ${selectedMembership?.user_name} 的會員`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="tier">{t.selectTier}</Label>
              <Select value={updateTier} onValueChange={setUpdateTier}>
                <SelectTrigger id="tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">{t.free}</SelectItem>
                  <SelectItem value="professional">{t.professional}</SelectItem>
                  <SelectItem value="enterprise">{t.enterprise}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">{t.reasonLabel}</Label>
              <Textarea
                id="reason"
                placeholder={t.reasonPlaceholder}
                value={updateReason}
                onChange={(e) => setUpdateReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowUpdateDialog(false);
                setUpdateTier('');
                setUpdateReason('');
              }}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleUpdateMembership}
              disabled={!updateTier || !updateReason.trim() || actionLoading === selectedMembership?.user_id}
            >
              {actionLoading === selectedMembership?.user_id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Updating...' : '更新中...'}
                </>
              ) : (
                t.update
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.cancelMembership}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.cancelWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cancel-reason">{t.cancelReasonLabel}</Label>
              <Textarea
                id="cancel-reason"
                placeholder={t.cancelReasonPlaceholder}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelReason('')}>
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelMembership}
              disabled={!cancelReason.trim() || actionLoading === selectedMembership?.user_id}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === selectedMembership?.user_id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Cancelling...' : '取消中...'}
                </>
              ) : (
                t.confirmCancel
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}