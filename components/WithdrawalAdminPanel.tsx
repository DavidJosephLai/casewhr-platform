/**
 * Withdrawal Admin Panel Component
 * 提款審核管理面板
 * 僅限管理員使用，用於審核和處理提款申請
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  User,
  Building2,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { formatCurrency } from '../lib/currency';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  bank_account_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  note?: string;
  admin_note?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Populated fields
  user_email?: string;
  user_name?: string;
  bank_account?: {
    bank_name: string;
    account_number: string;
    account_name: string;
    branch_name?: string;
  };
}

export function WithdrawalAdminPanel() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete'>('approve');
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('pending');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/withdrawal-requests/admin/all`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        throw new Error('Failed to load requests');
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error(
        language === 'en'
          ? 'Failed to load withdrawal requests'
          : '載入提款申請失敗'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);

      let endpoint = '';
      let body: any = { admin_note: adminNote.trim() || undefined };

      switch (actionType) {
        case 'approve':
          endpoint = `/withdrawal-requests/${selectedRequest.id}/approve`;
          break;
        case 'reject':
          endpoint = `/withdrawal-requests/${selectedRequest.id}/reject`;
          break;
        case 'complete':
          endpoint = `/withdrawal-requests/${selectedRequest.id}/complete`;
          break;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        toast.success(
          language === 'en'
            ? `Request ${actionType}d successfully`
            : `申請已${actionType === 'approve' ? '批准' : actionType === 'reject' ? '拒絕' : '完成'}`
        );
        setShowActionDialog(false);
        setSelectedRequest(null);
        setAdminNote('');
        loadRequests();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process request');
      }
    } catch (error: any) {
      console.error('Error processing request:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to process request' : '處理申請失敗'));
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (request: WithdrawalRequest, action: 'approve' | 'reject' | 'complete') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNote('');
    setShowActionDialog(true);
  };

  const exportToCSV = () => {
    const filteredRequests = requests.filter(r => {
      if (activeTab === 'all') return true;
      return r.status === activeTab;
    });

    const headers = ['ID', 'Date', 'User', 'Bank', 'Account', 'Amount', 'Currency', 'Status', 'Note'];
    const rows = filteredRequests.map(req => [
      req.id,
      new Date(req.created_at).toLocaleDateString(),
      req.user_email || req.user_id,
      req.bank_account?.bank_name || '',
      req.bank_account?.account_number || '',
      req.amount.toFixed(2),
      req.currency,
      req.status,
      req.note || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `withdrawal-requests-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(language === 'en' ? 'CSV exported' : 'CSV 已匯出');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string; labelZh: string }> = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pending', labelZh: '待審核' },
      approved: { variant: 'default', icon: CheckCircle, label: 'Approved', labelZh: '已批准' },
      processing: { variant: 'outline', icon: RefreshCw, label: 'Processing', labelZh: '處理中' },
      completed: { variant: 'outline', icon: CheckCircle, label: 'Completed', labelZh: '已完成' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected', labelZh: '已拒絕' },
      cancelled: { variant: 'outline', icon: XCircle, label: 'Cancelled', labelZh: '已取消' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {language === 'en' ? config.label : config.labelZh}
      </Badge>
    );
  };

  const filterRequests = (status: string) => {
    if (status === 'all') return requests;
    return requests.filter(r => r.status === status);
  };

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{language === 'en' ? 'Pending' : '待審核'}</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{language === 'en' ? 'Approved' : '已批准'}</p>
                <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{language === 'en' ? 'Completed' : '已完成'}</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{language === 'en' ? 'Rejected' : '已拒絕'}</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{language === 'en' ? 'Withdrawal Requests' : '提款申請'}</CardTitle>
              <CardDescription>
                {language === 'en' ? 'Review and process withdrawal requests' : '審核和處理提款申請'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadRequests}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Refresh' : '刷新'}
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Export CSV' : '匯出 CSV'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">
                {language === 'en' ? 'All' : '全部'} ({requests.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                {language === 'en' ? 'Pending' : '待審核'} ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved">
                {language === 'en' ? 'Approved' : '已批准'} ({stats.approved})
              </TabsTrigger>
              <TabsTrigger value="processing">
                {language === 'en' ? 'Processing' : '處理中'}
              </TabsTrigger>
              <TabsTrigger value="completed">
                {language === 'en' ? 'Completed' : '已完成'} ({stats.completed})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                {language === 'en' ? 'Rejected' : '已拒絕'} ({stats.rejected})
              </TabsTrigger>
            </TabsList>

            {['all', 'pending', 'approved', 'processing', 'completed', 'rejected'].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-6">
                <div className="space-y-4">
                  {filterRequests(tab).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>{language === 'en' ? 'No requests found' : '沒有找到申請'}</p>
                    </div>
                  ) : (
                    filterRequests(tab).map((request) => (
                      <div
                        key={request.id}
                        className="border rounded-lg p-4 hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-sm text-gray-600">#{request.id.slice(0, 8)}</span>
                              {getStatusBadge(request.status)}
                              <span className="text-sm text-gray-500">
                                {new Date(request.created_at).toLocaleString(language === 'en' ? 'en-US' : 'zh-TW')}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {language === 'en' ? 'User:' : '用戶：'}
                                </span>
                                <span className="font-medium ml-4">
                                  {request.user_email || request.user_name || request.user_id}
                                </span>
                              </div>
                              
                              <div>
                                <span className="text-gray-600 flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {language === 'en' ? 'Amount:' : '金額：'}
                                </span>
                                <span className="font-bold text-lg ml-4">
                                  {formatCurrency(request.amount, request.currency as any)}
                                </span>
                              </div>

                              {request.bank_account && (
                                <>
                                  <div>
                                    <span className="text-gray-600 flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {language === 'en' ? 'Bank:' : '銀行：'}
                                    </span>
                                    <span className="font-medium ml-4">{request.bank_account.bank_name}</span>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-600">
                                      {language === 'en' ? 'Account:' : '帳號：'}
                                    </span>
                                    <span className="font-medium ml-2">{request.bank_account.account_number}</span>
                                  </div>

                                  <div className="col-span-2">
                                    <span className="text-gray-600">
                                      {language === 'en' ? 'Account Name:' : '戶名：'}
                                    </span>
                                    <span className="font-medium ml-2">{request.bank_account.account_name}</span>
                                  </div>
                                </>
                              )}

                              {request.note && (
                                <div className="col-span-2">
                                  <span className="text-gray-600">{language === 'en' ? 'Note:' : '備註：'}</span>
                                  <p className="text-gray-800 mt-1 italic">{request.note}</p>
                                </div>
                              )}

                              {request.admin_note && (
                                <div className="col-span-2 bg-yellow-50 p-2 rounded">
                                  <span className="text-gray-600">{language === 'en' ? 'Admin Note:' : '管理員備註：'}</span>
                                  <p className="text-gray-800 mt-1">{request.admin_note}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => openActionDialog(request, 'approve')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  {language === 'en' ? 'Approve' : '批准'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openActionDialog(request, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  {language === 'en' ? 'Reject' : '拒絕'}
                                </Button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => openActionDialog(request, 'complete')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {language === 'en' ? 'Mark as Complete' : '標記為完成'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && (language === 'en' ? 'Approve Withdrawal' : '批准提款')}
              {actionType === 'reject' && (language === 'en' ? 'Reject Withdrawal' : '拒絕提款')}
              {actionType === 'complete' && (language === 'en' ? 'Complete Withdrawal' : '完成提款')}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <div className="mt-2 space-y-2">
                  <p>
                    {language === 'en' ? 'Request ID:' : '申請編號：'} <strong>#{selectedRequest.id.slice(0, 8)}</strong>
                  </p>
                  <p>
                    {language === 'en' ? 'Amount:' : '金額：'}{' '}
                    <strong>{formatCurrency(selectedRequest.amount, selectedRequest.currency as any)}</strong>
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="admin_note">
              {language === 'en' ? 'Admin Note (Optional)' : '管理員備註（選填）'}
            </Label>
            <Textarea
              id="admin_note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={
                language === 'en'
                  ? 'Add a note for this action...'
                  : '為此操作新增備註...'
              }
              rows={3}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)} disabled={processing}>
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'en' ? 'Confirm' : '確認'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
