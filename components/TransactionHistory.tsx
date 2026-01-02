import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import { formatCurrency, convertCurrency, type Currency } from "../lib/currency";
import { useState, useEffect, useCallback, useMemo, memo } from "react"; // ✅ Added useCallback, useMemo, memo
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  History, 
  Download, 
  Search, 
  Filter, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Calendar,
  Loader2,
  FileDown
} from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { Pagination } from "./Pagination";

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  status?: string;
  reference_id?: string;
}

export const TransactionHistory = memo(function TransactionHistory() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  
  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 每頁顯示 10 筆交易
  
  // 數據庫存儲貨幣 (統一為 TWD)
  const storedCurrency: Currency = 'TWD';
  // 根據語言選擇顯示貨幣
  const displayCurrency: Currency = language === 'zh' ? 'TWD' : 'USD';
  
  // ✅ Memoize displayAmount function
  const displayAmount = useCallback((amount: number): string => {
    if (storedCurrency === displayCurrency) {
      return formatCurrency(amount, displayCurrency);
    }
    const converted = convertCurrency(Math.abs(amount), storedCurrency, displayCurrency);
    return formatCurrency(amount < 0 ? -converted : converted, displayCurrency);
  }, [storedCurrency, displayCurrency]);

  // ✅ Memoize content translations
  const content = useMemo(() => ({
    en: {
      title: 'Transaction History',
      description: 'View all your payment and wallet transactions',
      search: 'Search transactions...',
      filterType: 'Transaction Type',
      filterDate: 'Date Range',
      exportCSV: 'Export CSV',
      exporting: 'Exporting...',
      noTransactions: 'No transactions found',
      types: {
        all: 'All Types',
        deposit: 'Deposit',
        withdrawal: 'Withdrawal',
        subscription_upgrade: 'Subscription',
        project_payment: 'Project Payment',
        project_refund: 'Refund',
        milestone_payment: 'Milestone',
      },
      dates: {
        all: 'All Time',
        today: 'Today',
        week: 'This Week',
        month: 'This Month',
        year: 'This Year',
      },
      amount: 'Amount',
      date: 'Date',
      description: 'Description',
      status: 'Status',
      reference: 'Reference',
      exported: 'Transaction history exported',
      exportError: 'Failed to export transactions',
    },
    'zh-TW': {
      title: '交易記錄',
      description: '查看所有付款和錢包交易',
      search: '搜尋交易...',
      filterType: '交易類型',
      filterDate: '日期範圍',
      exportCSV: '匯出 CSV',
      exporting: '匯出中...',
      noTransactions: '沒有找到交易記錄',
      types: {
        all: '所有類型',
        deposit: '儲值',
        withdrawal: '提款',
        subscription_upgrade: '訂閱',
        project_payment: '項目付款',
        project_refund: '退款',
        milestone_payment: '里程碑',
      },
      dates: {
        all: '全部時間',
        today: '今天',
        week: '本週',
        month: '本月',
        year: '今年',
      },
      amount: '金額',
      date: '日期',
      description: '描述',
      status: '狀態',
      reference: '參考編號',
      exported: '交易記錄已匯出',
      exportError: '匯出交易記錄失敗',
    },
    'zh-CN': {
      title: '交易记录',
      description: '查看所有付款和钱包交易',
      search: '搜索交易...',
      filterType: '交易类型',
      filterDate: '日期范围',
      exportCSV: '导出 CSV',
      exporting: '导出中...',
      noTransactions: '没有找到交易记录',
      types: {
        all: '所有类型',
        deposit: '充值',
        withdrawal: '提款',
        subscription_upgrade: '订阅',
        project_payment: '项目付款',
        project_refund: '退款',
        milestone_payment: '里程碑',
      },
      dates: {
        all: '全部时间',
        today: '今天',
        week: '本周',
        month: '本月',
        year: '今年',
      },
      amount: '金额',
      date: '日期',
      description: '描述',
      status: '状态',
      reference: '参考编号',
      exported: '交易记录已导出',
      exportError: '导出交易记录失败',
    }
  }), [language]);

  const t = content[language as keyof typeof content] || content.en;

  // ✅ Stabilize loadTransactions with useCallback
  const loadTransactions = useCallback(async () => {
    if (!user?.id || !accessToken) return;

    setLoading(true);
    try {
      console.log('🔍 [TransactionHistory] Fetching transactions...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/transactions`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      console.log('📡 [TransactionHistory] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [TransactionHistory] Received data:', data);
        // Sort by date, newest first
        const sorted = (data.transactions || []).sort(
          (a: Transaction, b: Transaction) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setTransactions(sorted);
      } else if (response.status === 401) {
        // Silently handle auth errors - user might not be authenticated
        console.log('⚠️ [TransactionHistory] Not authenticated, skipping');
        return;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [TransactionHistory] Error response:', response.status, errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to load transactions');
      }
    } catch (error) {
      // Check if it's an auth error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('401') || errorMessage.includes('Invalid JWT')) {
        console.log('⚠️ [TransactionHistory] Auth error, skipping');
        return;
      }
      console.error('❌ [TransactionHistory] Error loading transactions:', error);
      toast.error(language === 'en' ? `Failed to load transactions: ${errorMessage}` : `載入交易記錄失敗：${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id, accessToken, language]);

  // ✅ Stabilize filterTransactions with useCallback
  const filterTransactions = useCallback(() => {
    let filtered = [...transactions];

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(t => {
        const txDate = new Date(t.created_at);
        
        switch (dateFilter) {
          case 'today':
            return txDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return txDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return txDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return txDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.type.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query) ||
        (t.reference_id && t.reference_id.toLowerCase().includes(query))
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, typeFilter, dateFilter, searchQuery]);

  useEffect(() => {
    if (user?.id && accessToken) {
      loadTransactions();
    }
  }, [loadTransactions]); // ✅ Use loadTransactions in dependencies

  useEffect(() => {
    filterTransactions();
    // 重置到第一頁當篩選條件改變
    setCurrentPage(1);
  }, [filterTransactions]); // ✅ Use filterTransactions in dependencies

  // ✅ Stabilize exportToCSV with useCallback
  const exportToCSV = useCallback(() => {
    try {
      // CSV headers
      const headers = ['Date', 'Type', 'Description', 'Amount', 'Status', 'Reference ID'];
      
      // CSV rows
      const rows = filteredTransactions.map(t => [
        new Date(t.created_at).toLocaleString(),
        t.type,
        t.description,
        t.amount.toString(),
        t.status || 'completed',
        t.reference_id || t.id,
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(t.exported);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error(t.exportError);
    }
  }, [filteredTransactions, t]);

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) {
      return <ArrowDownCircle className="h-5 w-5 text-green-600" />;
    } else {
      return <ArrowUpCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return t.types[type as keyof typeof t.types] || type;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t.title}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
          >
            <FileDown className="h-4 w-4 mr-2" />
            {t.exportCSV}
          </Button>
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.types.all}</SelectItem>
              <SelectItem value="deposit">{t.types.deposit}</SelectItem>
              <SelectItem value="withdrawal">{t.types.withdrawal}</SelectItem>
              <SelectItem value="subscription_upgrade">{t.types.subscription_upgrade}</SelectItem>
              <SelectItem value="project_payment">{t.types.project_payment}</SelectItem>
              <SelectItem value="project_refund">{t.types.project_refund}</SelectItem>
              <SelectItem value="milestone_payment">{t.types.milestone_payment}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.dates.all}</SelectItem>
              <SelectItem value="today">{t.dates.today}</SelectItem>
              <SelectItem value="week">{t.dates.week}</SelectItem>
              <SelectItem value="month">{t.dates.month}</SelectItem>
              <SelectItem value="year">{t.dates.year}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.noTransactions}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {getTransactionIcon(transaction.type, transaction.amount)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">
                        {transaction.description}
                      </p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {getTypeLabel(transaction.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(transaction.created_at)}
                    </p>
                    {transaction.reference_id && (
                      <p className="text-xs text-gray-400 mt-1">
                        {t.reference}: {transaction.reference_id}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right ml-4">
                  <p className={`font-semibold ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{displayAmount(transaction.amount)}
                  </p>
                  {transaction.status && (
                    <Badge 
                      variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs mt-1"
                    >
                      {transaction.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredTransactions.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {language === 'en' 
                  ? `Showing ${filteredTransactions.length} of ${transactions.length} transactions`
                  : `顯示 ${filteredTransactions.length} / ${transactions.length} 筆交易`}
              </span>
              <span>
                {language === 'en' ? 'Total' : '總計'}: 
                <span className={`ml-2 font-semibold ${
                  filteredTransactions.reduce((sum, t) => sum + t.amount, 0) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {displayAmount(filteredTransactions.reduce((sum, t) => sum + t.amount, 0))}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Pagination */}
        {filteredTransactions.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredTransactions.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            language={language}
          />
        )}
      </CardContent>
    </Card>
  );
});