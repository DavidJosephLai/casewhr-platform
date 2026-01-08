import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, DollarSign, CheckCircle, XCircle, Clock, Eye, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface Withdrawal {
  id: string;
  user_id: string;
  user_email?: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  method_id: string;
  bank_info?: {
    bank_name: string;
    account_number?: string;
    iban?: string;
    masked_account_number?: string;
    masked_iban?: string;
    account_holder_name: string;
    swift_code?: string;
    routing_number?: string;
    country?: string;
    currency?: string;
  };
  created_at: string;
  processed_at?: string;
  rejection_reason?: string;
}

export function AdminWithdrawals() {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const content = {
    en: {
      title: 'Withdrawal Management',
      all: 'All',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      user: 'User',
      amount: 'Amount',
      fee: 'Fee',
      netAmount: 'Net Amount',
      status: 'Status',
      date: 'Date',
      actions: 'Actions',
      approve: 'Approve',
      reject: 'Reject',
      viewDetails: 'View Details',
      noWithdrawals: 'No withdrawal requests found',
      approveSuccess: 'Withdrawal approved successfully',
      rejectSuccess: 'Withdrawal rejected successfully',
      error: 'Operation failed',
      withdrawalDetails: 'Withdrawal Details',
      bankInformation: 'Bank Information',
      bankName: 'Bank Name',
      accountHolder: 'Account Holder',
      accountNumber: 'Account Number',
      iban: 'IBAN',
      swiftCode: 'SWIFT Code',
      routingNumber: 'Routing Number',
      country: 'Country',
      currency: 'Currency',
      rejectWithdrawal: 'Reject Withdrawal',
      rejectionReason: 'Rejection Reason',
      reasonPlaceholder: 'Enter reason for rejection...',
      cancel: 'Cancel',
      confirmReject: 'Confirm Rejection',
      processing: 'Processing',
      provideReason: 'Please provide a reason for rejection',
      rejectDescription: 'Please provide a reason for rejecting this withdrawal request.',
    },
    'zh-TW': {
      title: '提現管理',
      all: '全部',
      pending: '待審核',
      approved: '已批准',
      rejected: '已拒絕',
      user: '用戶',
      amount: '金額',
      fee: '手續費',
      netAmount: '實際金額',
      status: '狀態',
      date: '日期',
      actions: '操作',
      approve: '批准',
      reject: '拒絕',
      viewDetails: '查看詳情',
      noWithdrawals: '未找到提現申請',
      approveSuccess: '提現已批准',
      rejectSuccess: '提現已拒絕',
      error: '操作失敗',
      withdrawalDetails: '提現詳情',
      bankInformation: '銀行資訊',
      bankName: '銀行名稱',
      accountHolder: '帳戶持有人',
      accountNumber: '帳號',
      iban: 'IBAN',
      swiftCode: 'SWIFT 代碼',
      routingNumber: 'Routing 號碼',
      country: '國家',
      currency: '幣別',
      rejectWithdrawal: '拒絕提現',
      rejectionReason: '拒絕原因',
      reasonPlaceholder: '輸入拒絕原因...',
      cancel: '取消',
      confirmReject: '確認拒絕',
      processing: '處理中',
      provideReason: '請提供拒絕原因',
      rejectDescription: '請提供絕此提現申請的原因。',
    },
    'zh-CN': {
      title: '提现管理',
      all: '全部',
      pending: '待审核',
      approved: '已批准',
      rejected: '已拒绝',
      user: '用户',
      amount: '金额',
      fee: '手续费',
      netAmount: '实际金额',
      status: '状态',
      date: '日期',
      actions: '操作',
      approve: '批准',
      reject: '拒绝',
      viewDetails: '查看详情',
      noWithdrawals: '未找到提现申请',
      approveSuccess: '提现已批准',
      rejectSuccess: '提现已拒绝',
      error: '操作失败',
      withdrawalDetails: '提现详情',
      bankInformation: '银行资讯',
      bankName: '银行名称',
      accountHolder: '账户持有人',
      accountNumber: '账号',
      iban: 'IBAN',
      swiftCode: 'SWIFT 代码',
      routingNumber: 'Routing 号码',
      country: '国家',
      currency: '币别',
      rejectWithdrawal: '拒绝提现',
      rejectionReason: '拒绝原因',
      reasonPlaceholder: '输入拒绝原因...',
      cancel: '取消',
      confirmReject: '确认拒绝',
      processing: '处理中',
      provideReason: '请提供拒绝原因',
      rejectDescription: '请提供拒绝此提现申请的原因。',
    }
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  useEffect(() => {
    if (accessToken) {
      fetchWithdrawals();
    }
  }, [accessToken]);

  const fetchWithdrawals = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      console.log('🔍 [AdminWithdrawals] Fetching withdrawals...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/withdrawals`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      console.log('📡 [AdminWithdrawals] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 [AdminWithdrawals] Received withdrawals:', data.withdrawals?.length || 0);
        
        if (data.withdrawals && data.withdrawals.length > 0) {
          console.log('📝 [AdminWithdrawals] Latest withdrawal:', {
            id: data.withdrawals[0].id,
            user_id: data.withdrawals[0].user_id,
            user_email: data.withdrawals[0].user_email,
            amount: data.withdrawals[0].amount,
            status: data.withdrawals[0].status,
            created_at: data.withdrawals[0].created_at,
            created_at_date: new Date(data.withdrawals[0].created_at),
            created_at_formatted: new Date(data.withdrawals[0].created_at).toLocaleDateString(),
          });
        }
        
        setWithdrawals(data.withdrawals || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [AdminWithdrawals] Error response:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ [AdminWithdrawals] Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    if (!accessToken) return;

    setActionLoading(withdrawalId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/withdrawals/${withdrawalId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success(t.approveSuccess);
        fetchWithdrawals();
      } else {
        throw new Error('Failed to approve withdrawal');
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error(t.error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!accessToken || !selectedWithdrawal || !rejectionReason.trim()) return;

    setActionLoading(selectedWithdrawal.id);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/withdrawals/${selectedWithdrawal.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      if (response.ok) {
        toast.success(t.rejectSuccess);
        setShowRejectDialog(false);
        setRejectionReason('');
        setSelectedWithdrawal(null);
        fetchWithdrawals();
      } else {
        throw new Error('Failed to reject withdrawal');
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error(t.error);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowRejectDialog(true);
  };

  const openDetailsDialog = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailsDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <Clock className="h-3 w-3 mr-1" />
            {t.pending}
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            {t.processing}
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t.approved}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            {t.rejected}
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => 
    filterStatus === 'all' || w.status === filterStatus
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t.title}
            </CardTitle>
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
            >
              {t.all} ({withdrawals.length})
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('pending')}
            >
              {t.pending} ({withdrawals.filter(w => w.status === 'pending').length})
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'approved' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('approved')}
            >
              {t.approved} ({withdrawals.filter(w => w.status === 'approved').length})
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'rejected' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('rejected')}
            >
              {t.rejected} ({withdrawals.filter(w => w.status === 'rejected').length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{t.user}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{t.amount}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{t.fee}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{t.netAmount}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{t.status}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{t.date}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      {t.noWithdrawals}
                    </td>
                  </tr>
                ) : (
                  filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{withdrawal.user_email || withdrawal.user_id}</td>
                      <td className="py-3 px-4 text-sm font-semibold">${(withdrawal.amount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-red-600">-${(withdrawal.fee || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600">${(withdrawal.net_amount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">{getStatusBadge(withdrawal.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetailsDialog(withdrawal)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {withdrawal.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(withdrawal.id)}
                                disabled={actionLoading === withdrawal.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {actionLoading === withdrawal.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openRejectDialog(withdrawal)}
                                disabled={actionLoading === withdrawal.id}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.withdrawalDetails}</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-6">
              {/* Withdrawal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">{t.user}</Label>
                  <p className="font-medium">{selectedWithdrawal.user_email}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">{t.status}</Label>
                  <div className="mt-1">{getStatusBadge(selectedWithdrawal.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">{t.amount}</Label>
                  <p className="font-medium">${(selectedWithdrawal.amount || 0).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">{t.fee}</Label>
                  <p className="font-medium text-red-600">-${(selectedWithdrawal.fee || 0).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">{t.netAmount}</Label>
                  <p className="font-medium text-green-600">${(selectedWithdrawal.net_amount || 0).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">{t.date}</Label>
                  <p className="font-medium">{new Date(selectedWithdrawal.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Bank Information */}
              {selectedWithdrawal.bank_info && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t.bankInformation}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">{t.bankName}</Label>
                      <p className="font-medium">{selectedWithdrawal.bank_info.bank_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">{t.accountHolder}</Label>
                      <p className="font-medium">{selectedWithdrawal.bank_info.account_holder_name}</p>
                    </div>
                    {selectedWithdrawal.bank_info.country && (
                      <div>
                        <Label className="text-xs text-gray-500">{t.country}</Label>
                        <p className="font-medium">{selectedWithdrawal.bank_info.country}</p>
                      </div>
                    )}
                    {selectedWithdrawal.bank_info.currency && (
                      <div>
                        <Label className="text-xs text-gray-500">{t.currency}</Label>
                        <p className="font-medium">{selectedWithdrawal.bank_info.currency}</p>
                      </div>
                    )}
                    {selectedWithdrawal.bank_info.iban ? (
                      <div>
                        <Label className="text-xs text-gray-500">{t.iban}</Label>
                        <p className="font-medium font-mono">{selectedWithdrawal.bank_info.iban}</p>
                      </div>
                    ) : selectedWithdrawal.bank_info.account_number && (
                      <div>
                        <Label className="text-xs text-gray-500">{t.accountNumber}</Label>
                        <p className="font-medium font-mono">{selectedWithdrawal.bank_info.account_number}</p>
                      </div>
                    )}
                    {selectedWithdrawal.bank_info.swift_code && (
                      <div>
                        <Label className="text-xs text-gray-500">{t.swiftCode}</Label>
                        <p className="font-medium font-mono">{selectedWithdrawal.bank_info.swift_code}</p>
                      </div>
                    )}
                    {selectedWithdrawal.bank_info.routing_number && (
                      <div>
                        <Label className="text-xs text-gray-500">{t.routingNumber}</Label>
                        <p className="font-medium font-mono">{selectedWithdrawal.bank_info.routing_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedWithdrawal.rejection_reason && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-gray-500">{t.rejectionReason}</Label>
                  <p className="mt-1 text-red-600">{selectedWithdrawal.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.rejectWithdrawal}</DialogTitle>
            <DialogDescription>
              {t.rejectDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">{t.rejectionReason}</Label>
              <Textarea
                id="reason"
                placeholder={t.reasonPlaceholder}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
              >
                {t.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading === selectedWithdrawal?.id}
              >
                {actionLoading === selectedWithdrawal?.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.processing}
                  </>
                ) : (
                  t.confirmReject
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}