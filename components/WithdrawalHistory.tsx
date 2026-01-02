import { useState, useEffect, useCallback, useMemo, memo } from 'react'; // ✅ Added useCallback, useMemo, memo
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { 
  ArrowDownCircle, 
  ArrowUpCircle,
  Loader2, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  History
} from 'lucide-react';
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import { formatCurrency, convertCurrency, type Currency } from "../lib/currency";
import { Pagination } from "./Pagination";

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
}

export const WithdrawalHistory = memo(function WithdrawalHistory() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // 數據庫存儲貨幣 (統一為 TWD)
  const storedCurrency: Currency = 'TWD';
  // 根據語言選擇顯示貨幣
  const displayCurrency: Currency = language === 'zh' ? 'TWD' : 'USD';
  
  // 轉換並格式化金額的輔助函數
  const displayAmount = (amount: number): string => {
    if (storedCurrency === displayCurrency) {
      return formatCurrency(amount, displayCurrency);
    }
    const converted = convertCurrency(amount, storedCurrency, displayCurrency);
    return formatCurrency(converted, displayCurrency);
  };

  const content = {
    en: {
      title: 'Withdrawal History',
      description: 'View your withdrawal requests',
      noWithdrawals: 'No withdrawal requests found',
      amount: 'Amount',
      fee: 'Fee',
      netAmount: 'Net Amount',
      method: 'Method',
      status: 'Status',
      date: 'Date',
      statuses: {
        pending: 'Pending',
        processing: 'Processing',
        completed: 'Completed',
        rejected: 'Rejected',
      },
      refresh: 'Refresh',
    },
    'zh-TW': {
      title: '提現記錄',
      description: '查看您的提現申請',
      noWithdrawals: '沒有提現記錄',
      amount: '金額',
      method: '提現方式',
      status: '狀態',
      date: '申請日期',
      statuses: {
        pending: '處理中',
        approved: '已批准',
        completed: '已完成',
        rejected: '已拒絕',
      },
      types: {
        bank: '銀行轉帳',
        paypal: 'PayPal',
      },
      refresh: '刷新',
    },
    'zh-CN': {
      title: '提现记录',
      description: '查看您的提现申请',
      noWithdrawals: '没有提现记录',
      amount: '金额',
      method: '提现方式',
      status: '状态',
      date: '申请日期',
      statuses: {
        pending: '处理中',
        approved: '已批准',
        completed: '已完成',
        rejected: '已拒绝',
      },
      types: {
        bank: '银行转账',
        paypal: 'PayPal',
      },
      refresh: '刷新',
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  useEffect(() => {
    if (user?.id && accessToken) {
      loadWithdrawals();
    }
  }, [user?.id, accessToken]);

  // Listen for new withdrawal submissions
  useEffect(() => {
    const handleWithdrawalSubmitted = () => {
      // Only reload if user is logged in
      if (user?.id && accessToken) {
        loadWithdrawals();
      }
    };

    window.addEventListener('withdrawal-submitted', handleWithdrawalSubmitted);
    return () => window.removeEventListener('withdrawal-submitted', handleWithdrawalSubmitted);
  }, [user?.id, accessToken]);

  const loadWithdrawals = async () => {
    if (!user?.id || !accessToken) return;

    setLoading(true);
    try {
      console.log('🔍 [WithdrawalHistory] Fetching withdrawals...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/withdrawals`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      console.log('📡 [WithdrawalHistory] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [WithdrawalHistory] Received data:', data);
        setWithdrawals(data.withdrawals || []);
        setTotalPages(Math.ceil(data.withdrawals.length / itemsPerPage));
      } else if (response.status === 401) {
        // Silently handle auth errors - user might not be authenticated
        console.log('⚠️ [WithdrawalHistory] Not authenticated, skipping');
        return;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [WithdrawalHistory] Error response:', response.status, errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to load withdrawals');
      }
    } catch (error) {
      // Check if it's an auth error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('401') || errorMessage.includes('Invalid JWT')) {
        console.log('⚠️ [WithdrawalHistory] Auth error, skipping');
        return;
      }
      console.error('❌ [WithdrawalHistory] Error loading withdrawals:', error);
      toast.error(language === 'en' ? `Failed to load withdrawal history: ${errorMessage}` : `載入提現記錄失敗：${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Withdrawal['status']) => {
    const config = {
      pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      processing: { variant: 'secondary' as const, icon: RefreshCw, color: 'text-blue-600' },
      completed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
    };

    const { variant, icon: Icon, color } = config[status];

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {t.statuses[status]}
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ArrowUpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.noWithdrawals}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                    <ArrowUpCircle className="h-5 w-5 text-red-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        {displayAmount(withdrawal.amount)}
                      </p>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>{formatDate(withdrawal.created_at)}</p>
                      <p className="text-xs">{withdrawal.method_details}</p>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4 space-y-1">
                  <p className="text-sm text-gray-500">
                    {t.fee}: -{displayAmount(withdrawal.fee)}
                  </p>
                  <p className="font-semibold text-green-600">
                    {t.netAmount}: {displayAmount(withdrawal.net_amount)}
                  </p>
                  {withdrawal.notes && (
                    <p className="text-xs text-gray-400 max-w-[200px] truncate">
                      {withdrawal.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              language={language}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
});