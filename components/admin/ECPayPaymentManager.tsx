import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import {
  Search,
  RefreshCw,
  Plus,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  ShoppingCart,
} from 'lucide-react';

interface ECPayPayment {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  payment_type: 'subscription' | 'deposit' | 'project';
  amount_twd: number;
  amount_usd: number;
  status: 'pending' | 'confirmed' | 'rejected';
  screenshot_url?: string;
  notes?: string;
  ecpay_transaction_id?: string;
  created_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
}

interface ECPayPaymentManagerProps {
  accessToken: string;
}

export function ECPayPaymentManager({ accessToken }: ECPayPaymentManagerProps) {
  const [payments, setPayments] = useState<ECPayPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<ECPayPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<ECPayPayment | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // New payment form
  const [newPayment, setNewPayment] = useState({
    user_email: '',
    payment_type: 'deposit' as 'subscription' | 'deposit' | 'project',
    amount_twd: '',
    notes: '',
    ecpay_transaction_id: '',
  });

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, typeFilter]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      // 🧪 在 Figma Make 環境中，使用正確的認證方式
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      
      // 構建請求頭
      const headers: Record<string, string> = {};
      
      if (devModeActive && accessToken.startsWith('dev-user-')) {
        // Dev mode: 使用自定義 header 避免 Supabase JWT 驗證
        headers['X-Dev-Token'] = accessToken;
        headers['Authorization'] = `Bearer ${publicAnonKey}`;
      } else {
        // Production: 使用標準 JWT token
        headers['Authorization'] = `Bearer ${accessToken || publicAnonKey}`;
      }
      
      // 從 KV store 載入付款記錄
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/ecpay-payments`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [ECPayPaymentManager] Raw response data:', data);
        console.log('🔍 [ECPayPaymentManager] Payments array:', data.payments);
        console.log('🔍 [ECPayPaymentManager] First payment sample:', data.payments?.[0]);
        
        // 過濾掉 null 值
        const validPayments = (data.payments || []).filter((p: any) => p != null);
        console.log('🔍 [ECPayPaymentManager] Valid payments count:', validPayments.length);
        console.log('🔍 [ECPayPaymentManager] Valid payments sample:', validPayments[0]);
        
        setPayments(validPayments);
      } else {
        const errorText = await response.text();
        toast.error(`載入 ECPay 付款記錄失敗: ${response.status} ${response.statusText}`);
        setPayments([]);
      }
    } catch (error) {
      toast.error('載入 ECPay 付款記錄時發生錯誤');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    // 先過濾掉 null 值
    let filtered = payments.filter(p => p != null);

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.payment_type === typeFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.user_email?.toLowerCase().includes(term) ||
        p.user_name?.toLowerCase().includes(term) ||
        p.ecpay_transaction_id?.toLowerCase().includes(term) ||
        p.id?.toLowerCase().includes(term)
      );
    }

    // Sort by created_at (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredPayments(filtered);
  };

  const handleAddPayment = async () => {
    console.log('[ECPayPaymentManager] handleAddPayment called');
    console.log('[ECPayPaymentManager] newPayment:', newPayment);
    
    if (!newPayment.user_email || !newPayment.amount_twd) {
      console.error('[ECPayPaymentManager] Validation failed: missing required fields');
      toast.error('請填寫必填欄位');
      return;
    }

    const amountTWD = parseFloat(newPayment.amount_twd);
    if (isNaN(amountTWD) || amountTWD <= 0) {
      console.error('[ECPayPaymentManager] Validation failed: invalid amount');
      toast.error('請輸入有效的金額');
      return;
    }

    console.log('[ECPayPaymentManager] Starting payment creation...');
    setProcessing(true);
    
    try {
      // 🧪 在 Figma Make 環境中，使用正確的認證方式
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      
      // 構建請求頭
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (devModeActive && accessToken.startsWith('dev-user-')) {
        headers['X-Dev-Token'] = accessToken;
        headers['Authorization'] = `Bearer ${publicAnonKey}`;
        console.log('[ECPayPaymentManager] Using dev mode with X-Dev-Token for POST');
      } else {
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('[ECPayPaymentManager] Using production JWT token for POST');
      }

      const requestBody = {
        user_email: newPayment.user_email,
        payment_type: newPayment.payment_type,
        amount_twd: amountTWD,
        amount_usd: Math.round(amountTWD / 30), // 自動換算
        notes: newPayment.notes,
        ecpay_transaction_id: newPayment.ecpay_transaction_id,
      };

      console.log('[ECPayPaymentManager] Request body:', requestBody);
      console.log('[ECPayPaymentManager] Request headers:', headers);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/ecpay-payments`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        }
      );

      console.log('[ECPayPaymentManager] Response status:', response.status);
      console.log('[ECPayPaymentManager] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('[ECPayPaymentManager] Payment created successfully:', data);
        toast.success('付款記錄已新增');
        setAddPaymentDialogOpen(false);
        setNewPayment({
          user_email: '',
          payment_type: 'deposit',
          amount_twd: '',
          notes: '',
          ecpay_transaction_id: '',
        });
        await loadPayments();
      } else {
        const errorText = await response.text();
        console.error('[ECPayPaymentManager] Error response:', errorText);
        let errorMessage = '新增失敗';
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('[ECPayPaymentManager] Error adding payment:', error);
      toast.error('新增付款記錄失敗: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setProcessing(false);
      console.log('[ECPayPaymentManager] handleAddPayment completed');
    }
  };

  const handleConfirmPayment = async (payment: ECPayPayment) => {
    setProcessing(true);
    try {
      // 🧪 在 Figma Make 環境中，使用正確的認證方式
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (devModeActive && accessToken.startsWith('dev-user-')) {
        headers['X-Dev-Token'] = accessToken;
        headers['Authorization'] = `Bearer ${publicAnonKey}`;
      } else {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/ecpay-payments/${payment.id}/confirm`,
        {
          method: 'POST',
          headers,
        }
      );

      if (response.ok) {
        toast.success('付款已確認並處理');
        setConfirmDialogOpen(false);
        setSelectedPayment(null);
        loadPayments();
      } else {
        const error = await response.json();
        toast.error(error.error || '確認失敗');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('確認付款失敗');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectPayment = async (payment: ECPayPayment) => {
    if (!confirm('定要拒絕此付款嗎？')) return;

    setProcessing(true);
    try {
      // 🧪 在 Figma Make 環境中，使用正確的認證方式
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (devModeActive && accessToken.startsWith('dev-user-')) {
        headers['X-Dev-Token'] = accessToken;
        headers['Authorization'] = `Bearer ${publicAnonKey}`;
      } else {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/ecpay-payments/${payment.id}/reject`,
        {
          method: 'POST',
          headers,
        }
      );

      if (response.ok) {
        toast.success('付款已拒絕');
        loadPayments();
      } else {
        const error = await response.json();
        toast.error(error.error || '拒絕失敗');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('拒絕付款失敗');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('確定要刪除此記錄嗎？此操作無法撤銷。')) return;

    setProcessing(true);
    try {
      // 🧪 在 Figma Make 環境中，使用正確的認證方式
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      
      const headers: Record<string, string> = {};
      
      if (devModeActive && accessToken.startsWith('dev-user-')) {
        headers['X-Dev-Token'] = accessToken;
        headers['Authorization'] = `Bearer ${publicAnonKey}`;
      } else {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/ecpay-payments/${paymentId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (response.ok) {
        toast.success('記錄已刪除');
        loadPayments();
      } else {
        const error = await response.json();
        toast.error(error.error || '刪除失敗');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('刪除記錄失敗');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          待確認
        </Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          已確認
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          已拒絕
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'subscription':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          訂閱
        </Badge>;
      case 'deposit':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
          儲值
        </Badge>;
      case 'project':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
          項目
        </Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '—';
    
    try {
      const date = new Date(dateString);
      // 檢查日期是否有效
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const stats = {
    total: payments.filter(p => p != null).length,
    pending: payments.filter(p => p != null && p.status === 'pending').length,
    confirmed: payments.filter(p => p != null && p.status === 'confirmed').length,
    rejected: payments.filter(p => p != null && p.status === 'rejected').length,
    totalAmount: payments
      .filter(p => p != null && p.status === 'confirmed')
      .reduce((sum, p) => sum + p.amount_twd, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-green-600" />
            綠界付款管理
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            管理和確認綠界金流付款記錄
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayments}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </Button>
          <Button
            size="sm"
            onClick={() => setAddPaymentDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            新增付款記錄
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open('https://vendor.ecpay.com.tw', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            綠界後台
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">總記錄數</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="text-sm text-yellow-700">待確認</div>
            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="text-sm text-green-700">已確認</div>
            <div className="text-2xl font-bold text-green-800">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-sm text-red-700">已拒絕</div>
            <div className="text-2xl font-bold text-red-800">{stats.rejected}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="text-sm text-blue-700">已確認額</div>
            <div className="text-xl font-bold text-blue-800">
              NT${stats.totalAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>搜尋</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜尋 Email、用戶名、交易編號..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>狀態篩選</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="pending">待確認</SelectItem>
                  <SelectItem value="confirmed">已確認</SelectItem>
                  <SelectItem value="rejected">已拒絕</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label>類型篩選</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類型</SelectItem>
                  <SelectItem value="subscription">訂閱</SelectItem>
                  <SelectItem value="deposit">儲值</SelectItem>
                  <SelectItem value="project">項目</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>付款記錄</CardTitle>
          <CardDescription>
            共 {filteredPayments.length} 筆記錄
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              載入中...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>暫無付款記錄</p>
              <p className="text-sm mt-2">當用戶使用綠界付款時，記錄會顯示在這裡</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用戶</TableHead>
                    <TableHead>類型</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>交易編號</TableHead>
                    <TableHead>建立時間</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.user_name || '未知'}</div>
                          <div className="text-sm text-gray-500">{payment.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(payment.payment_type)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">NT${payment.amount_twd?.toLocaleString() || 0}</div>
                          <div className="text-sm text-gray-500">${payment.amount_usd || 0}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.ecpay_transaction_id || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(payment.created_at)}</div>
                        {payment.confirmed_at && (
                          <div className="text-xs text-gray-500">
                            確認: {formatDate(payment.confirmed_at)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {payment.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setConfirmDialogOpen(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                確認
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectPayment(payment)}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePayment(payment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={addPaymentDialogOpen} onOpenChange={setAddPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增綠界付款記錄</DialogTitle>
            <DialogDescription>
              手動新增用戶的綠界付款記錄
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>用戶 Email *</Label>
                <Input
                  placeholder="user@example.com"
                  value={newPayment.user_email}
                  onChange={(e) => setNewPayment({ ...newPayment, user_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>付款類 *</Label>
                <Select
                  value={newPayment.payment_type}
                  onValueChange={(value: any) => setNewPayment({ ...newPayment, payment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">儲值</SelectItem>
                    <SelectItem value="subscription">訂閱</SelectItem>
                    <SelectItem value="project">項目</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>金額（台幣）*</Label>
                <Input
                  type="number"
                  placeholder="3000"
                  value={newPayment.amount_twd}
                  onChange={(e) => setNewPayment({ ...newPayment, amount_twd: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  美元金額將自動換算（÷30）
                </p>
              </div>
              <div className="space-y-2">
                <Label>綠界交易編號</Label>
                <Input
                  placeholder="選填"
                  value={newPayment.ecpay_transaction_id}
                  onChange={(e) => setNewPayment({ ...newPayment, ecpay_transaction_id: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>備註</Label>
              <Input
                placeholder="選填"
                value={newPayment.notes}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">提醒</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>新增記錄後狀態為「待確認」</li>
                    <li>確認後將自動處理（儲值/訂閱/項目付款）</li>
                    <li>請確保在綠界後台已收到款項</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddPaymentDialogOpen(false)}
              disabled={processing}
            >
              取消
            </Button>
            <Button onClick={handleAddPayment} disabled={processing}>
              {processing ? '新增中...' : '新增記錄'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認付款</DialogTitle>
            <DialogDescription>
              請確認以下付款資訊無誤後再進行確認
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">用戶</span>
                  <span className="font-medium">{selectedPayment.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">類型</span>
                  {getTypeBadge(selectedPayment.payment_type)}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">金額</span>
                  <div className="text-right">
                    <div className="font-medium">NT${selectedPayment.amount_twd?.toLocaleString() || 0}</div>
                    <div className="text-sm text-gray-500">${selectedPayment.amount_usd || 0} USD</div>
                  </div>
                </div>
                {selectedPayment.ecpay_transaction_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">交易編號</span>
                    <span className="font-medium">{selectedPayment.ecpay_transaction_id}</span>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-900">
                    <p className="font-medium mb-1">確認前請檢查</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li>已在綠界後台確認收款</li>
                      <li>用戶資訊和金額正確無誤</li>
                      <li>
                        {selectedPayment.payment_type === 'subscription' && '將自動開通訂閱'}
                        {selectedPayment.payment_type === 'deposit' && '將自動充值錢包'}
                        {selectedPayment.payment_type === 'project' && '將自動處理項目付款'}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
                setSelectedPayment(null);
              }}
              disabled={processing}
            >
              取消
            </Button>
            <Button
              onClick={() => selectedPayment && handleConfirmPayment(selectedPayment)}
              disabled={processing}
            >
              {processing ? '處理中...' : '確認付款'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}