import { projectId } from "../../utils/supabase/info";
import { toast } from "sonner";

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  method_id: string;
  method_type: string;
  method_details: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  user_email?: string;
  user_name?: string;
}

export function WithdrawalManagement() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const content = {
    en: {
      title: 'Withdrawal Management',
      description: 'Review and process withdrawal requests',
      tabs: {
        pending: 'Pending',
        processing: 'Processing',
        completed: 'Completed',
        rejected: 'Rejected',
        all: 'All',
      },
      search: 'Search by user or amount...',
      amount: 'Amount',
      fee: 'Fee',
      netAmount: 'Net Amount',
      user: 'User',
      method: 'Method',
      requestDate: 'Request Date',
      actions: 'Actions',
      approve: 'Approve',
      reject: 'Reject',
      approving: 'Approving...',
      rejecting: 'Rejecting...',
      refresh: 'Refresh',
      noWithdrawals: 'No withdrawals found',
      rejectDialog: {
        title: 'Reject Withdrawal',
        description: 'Please provide a reason for rejecting this withdrawal',
        reasonLabel: 'Rejection Reason',
        reasonPlaceholder: 'e.g., Verification failed, Invalid account...',
        cancel: 'Cancel',
        confirm: 'Confirm Rejection',
      },
      success: {
        approved: 'Withdrawal approved successfully',
        rejected: 'Withdrawal rejected successfully',
      },
      error: {
        approve: 'Failed to approve withdrawal',
        reject: 'Failed to reject withdrawal',
        load: 'Failed to load withdrawals',
      },
      stats: {
        total: 'Total',
        totalAmount: 'Total Amount',
        totalFees: 'Total Fees',
      },
    },
    'zh-TW': {
      title: '提現管理',
      description: '審核和處理提現請求',
      tabs: {
        pending: '待處理',
        processing: '處理中',
        completed: '已完成',
        rejected: '已拒絕',
        all: '全部',
      },
      search: '搜索用戶或金額...',
      amount: '金額',
      fee: '手續費',
      netAmount: '實際到賬',
      user: '用戶',
      method: '方式',
      requestDate: '申請日期',
      actions: '操作',
      approve: '批准',
      reject: '拒絕',
      approving: '批准中...',
      rejecting: '拒絕中...',
      refresh: '刷新',
      noWithdrawals: '沒有找到提現記錄',
      rejectDialog: {
        title: '拒絕提現',
        description: '請提供拒絕此提現的原因',
        reasonLabel: '拒絕原因',
        reasonPlaceholder: '例如：驗證失敗、無效賬戶...',
        cancel: '取消',
        confirm: '確認拒絕',
      },
      success: {
        approved: '提現已批准',
        rejected: '提現已拒絕',
      },
      error: {
        approve: '批准提現失敗',
        reject: '拒絕提現失敗',
        load: '載入提現記錄失敗',
      },
      stats: {
        total: '總數',
        totalAmount: '總金額',
        totalFees: '總手續費',
      },
    },
    'zh-CN': {
      title: '提现管理',
      description: '审核和处理提现请求',
      tabs: {
        pending: '待处理',
        processing: '处理中',
        completed: '已完成',
        rejected: '已拒绝',
        all: '全部',
      },
      search: '搜索用户或金额...',
      amount: '金额',
      fee: '手续费',
      netAmount: '实际到账',
      user: '用户',
      method: '方式',
      requestDate: '申请日期',
      actions: '操作',
      approve: '批准',
      reject: '拒绝',
      approving: '批准中...',
      rejecting: '拒绝中...',
      refresh: '刷新',
      noWithdrawals: '没有找到提现记录',
      rejectDialog: {
        title: '拒绝提现',
        description: '请提供拒绝此提现的原因',
        reasonLabel: '拒绝原因',
        reasonPlaceholder: '例如：验证失败、无效账户...',
        cancel: '取消',
        confirm: '确认拒绝',
      },
      success: {
        approved: '提现已批准',
        rejected: '提现已拒绝',
      },
      error: {
        approve: '批准提现失败',
        reject: '拒绝提现失败',
        load: '载入提现记录失败',
      },
      stats: {
        total: '总数',
        totalAmount: '总金额',
        totalFees: '总手续费',
      },
    }
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  useEffect(() => {
    if (user?.id && accessToken) {
      loadWithdrawals();
    }
  }, [user?.id, accessToken]);

  const loadWithdrawals = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      // Get all withdrawals (admin endpoint)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/withdrawals/all`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Enrich with user info
        const enriched = await Promise.all(
          (data.withdrawals || []).map(async (w: Withdrawal) => {
            try {
              const userResponse = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profiles/${w.user_id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                  },
                }
              );
              
              if (userResponse.ok) {
                const userData = await userResponse.json();
                return {
                  ...w,
                  user_email: userData.profile?.email,
                  user_name: userData.profile?.name,
                };
              }
            } catch (error) {
              console.error('Error loading user data:', error);
            }
            return w;
          })
        );

        setWithdrawals(enriched);
      } else {
        throw new Error('Failed to load withdrawals');
      }
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      toast.error(t.error.load);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawal: Withdrawal) => {
    setProcessing(withdrawal.id);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/withdrawals/${withdrawal.id}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success(t.success.approved);
        loadWithdrawals();
      } else {
        throw new Error('Failed to approve');
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error(t.error.approve);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectClick = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectReason("");
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedWithdrawal || !rejectReason.trim()) {
      toast.error(language === 'en' ? 'Please provide a reason' : '請提供原因');
      return;
    }

    setProcessing(selectedWithdrawal.id);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/withdrawals/${selectedWithdrawal.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );

      if (response.ok) {
        toast.success(t.success.rejected);
        setShowRejectDialog(false);
        loadWithdrawals();
      } else {
        throw new Error('Failed to reject');
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error(t.error.reject);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: Withdrawal['status']) => {
    const config = {
      pending: { variant: 'secondary' as const, icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      processing: { variant: 'secondary' as const, icon: RefreshCw, color: 'bg-blue-100 text-blue-800 border-blue-200' },
      completed: { variant: 'default' as const, icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
      rejected: { variant: 'destructive' as const, icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200' },
    };

    const { icon: Icon, color } = config[status];

    return (
      <Badge className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        {t.tabs[status]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filterWithdrawals = (status?: string) => {
    let filtered = withdrawals;

    if (status && status !== 'all') {
      filtered = filtered.filter(w => w.status === status);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(w =>
        w.user_email?.toLowerCase().includes(term) ||
        w.user_name?.toLowerCase().includes(term) ||
        w.amount.toString().includes(term) ||
        w.method_details.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const getStats = (status?: string) => {
    const filtered = filterWithdrawals(status);
    return {
      count: filtered.length,
      totalAmount: filtered.reduce((sum, w) => sum + w.amount, 0),
      totalFees: filtered.reduce((sum, w) => sum + w.fee, 0),
    };
  };

  const renderWithdrawalsList = (status?: string) => {
    const filtered = filterWithdrawals(status);
    const stats = getStats(status);

    if (filtered.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <ArrowUpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t.noWithdrawals}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">{t.stats.total}</div>
              <div className="text-2xl font-semibold">{stats.count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">{t.stats.totalAmount}</div>
              <div className="text-2xl font-semibold text-blue-600">${stats.totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">{t.stats.totalFees}</div>
              <div className="text-2xl font-semibold text-green-600">${stats.totalFees.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawals List */}
        <div className="space-y-3">
          {filtered.map((withdrawal) => (
            <Card key={withdrawal.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                      <ArrowUpCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">${withdrawal.amount.toFixed(2)}</span>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{withdrawal.user_name || withdrawal.user_email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{withdrawal.method_details}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(withdrawal.created_at)}</span>
                        </div>
                        <div>
                          {t.fee}: ${withdrawal.fee.toFixed(2)} | {t.netAmount}: ${withdrawal.net_amount.toFixed(2)}
                        </div>
                      </div>

                      {withdrawal.notes && (
                        <Alert className="mt-2">
                          <AlertDescription className="text-xs">{withdrawal.notes}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  {(withdrawal.status === 'pending' || withdrawal.status === 'processing') && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleApprove(withdrawal)}
                        disabled={processing === withdrawal.id}
                      >
                        {processing === withdrawal.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            {t.approving}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t.approve}
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleRejectClick(withdrawal)}
                        disabled={processing === withdrawal.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {t.reject}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5" />
                {t.title}
              </CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadWithdrawals}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="pending">{t.tabs.pending}</TabsTrigger>
                <TabsTrigger value="processing">{t.tabs.processing}</TabsTrigger>
                <TabsTrigger value="completed">{t.tabs.completed}</TabsTrigger>
                <TabsTrigger value="rejected">{t.tabs.rejected}</TabsTrigger>
                <TabsTrigger value="all">{t.tabs.all}</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                {renderWithdrawalsList('pending')}
              </TabsContent>

              <TabsContent value="processing" className="mt-6">
                {renderWithdrawalsList('processing')}
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                {renderWithdrawalsList('completed')}
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                {renderWithdrawalsList('rejected')}
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                {renderWithdrawalsList('all')}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.rejectDialog.title}</DialogTitle>
            <DialogDescription>{t.rejectDialog.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.rejectDialog.reasonLabel}</label>
              <Textarea
                placeholder={t.rejectDialog.reasonPlaceholder}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {t.rejectDialog.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || !!processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.rejecting}
                </>
              ) : (
                t.rejectDialog.confirm
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}