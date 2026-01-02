import { useState, useEffect } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { projectId } from '../../utils/supabase/info';
import { formatCurrency } from '../../lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Loader2, 
  Search, 
  DollarSign, 
  Receipt, 
  Calendar, 
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  CreditCard,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface Transaction {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  type: 'deposit' | 'escrow' | 'payment' | 'withdrawal' | 'refund';
  amount: number;
  description: string;
  created_at: string;
  project_id?: string;
}

interface TransactionStats {
  total_amount: number;
  total_count: number;
  by_type: {
    deposit: { count: number; amount: number };
    escrow: { count: number; amount: number };
    payment: { count: number; amount: number };
    withdrawal: { count: number; amount: number };
    refund: { count: number; amount: number };
  };
  today_count: number;
  this_month_count: number;
}

export function AdminTransactions() {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // 根據語言選擇顯示貨幣
  const displayCurrency = language.startsWith('zh-') && language !== 'zh-CN' ? 'TWD' : (language === 'zh-CN' ? 'CNY' : 'USD');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  const content = {
    en: {
      title: 'Transaction History',
      search: 'Search transactions...',
      all: 'All Types',
      deposit: 'Deposit',
      escrow: 'Escrow',
      payment: 'Payment',
      withdrawal: 'Withdrawal',
      refund: 'Refund',
      user: 'User',
      type: 'Type',
      amount: 'Amount',
      description: 'Description',
      date: 'Date',
      noTransactions: 'No transactions found',
      loading: 'Loading transactions...',
      stats: {
        totalAmount: 'Total Amount',
        totalCount: 'Total Transactions',
        todayCount: 'Today',
        monthCount: 'This Month',
      },
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
    },
    'zh-TW': {
      title: '交易記錄',
      search: '搜索交易...',
      all: '全部類型',
      deposit: '充值',
      escrow: '托管',
      payment: '支付',
      withdrawal: '提現',
      refund: '退款',
      user: '用戶',
      type: '類型',
      amount: '金額',
      description: '描述',
      date: '日期',
      noTransactions: '未找到交易記錄',
      loading: '載入交易記錄中...',
      stats: {
        totalAmount: '總金額',
        totalCount: '總交易數',
        todayCount: '今日',
        monthCount: '本月',
      },
      page: '第',
      of: '頁，共',
      previous: '上一頁',
      next: '下一頁',
    },
    'zh-CN': {
      title: '交易记录',
      search: '搜索交易...',
      all: '全部类型',
      deposit: '充值',
      escrow: '托管',
      payment: '支付',
      withdrawal: '提现',
      refund: '退款',
      user: '用户',
      type: '类型',
      amount: '金额',
      description: '描述',
      date: '日期',
      noTransactions: '未找到交易记录',
      loading: '载入交易记录中...',
      stats: {
        totalAmount: '总金额',
        totalCount: '总交易数',
        todayCount: '今日',
        monthCount: '本月',
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
      fetchTransactions();
      fetchStats();
    }
  }, [accessToken, currentPage, typeFilter, searchQuery]);

  const fetchTransactions = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (typeFilter && typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/transactions?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/transactions/stats`,
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case 'escrow':
        return <Lock className="h-4 w-4 text-orange-600" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'withdrawal':
        return <ArrowUpCircle className="h-4 w-4 text-purple-600" />;
      case 'refund':
        return <RefreshCw className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      deposit: { color: 'bg-green-500', text: t.deposit },
      escrow: { color: 'bg-orange-500', text: t.escrow },
      payment: { color: 'bg-blue-500', text: t.payment },
      withdrawal: { color: 'bg-purple-500', text: t.withdrawal },
      refund: { color: 'bg-red-500', text: t.refund },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || { color: 'bg-gray-400', text: type };

    return (
      <Badge className={`${config.color} text-white border-0`}>
        {config.text}
      </Badge>
    );
  };

  const formatAmount = (amount: number) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const formattedAmount = formatCurrency(absAmount, displayCurrency);
    
    if (isNegative) {
      return <span className="text-red-600">-{formattedAmount}</span>;
    }
    return <span className="text-green-600">+{formattedAmount}</span>;
  };

  if (loading && transactions.length === 0) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.stats.totalAmount}</p>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(Math.abs(stats.total_amount), displayCurrency)}
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
                  <p className="text-sm text-gray-600">{t.stats.totalCount}</p>
                  <p className="text-2xl font-semibold">{stats.total_count}</p>
                </div>
                <Receipt className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.stats.todayCount}</p>
                  <p className="text-2xl font-semibold">{stats.today_count}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.stats.monthCount}</p>
                  <p className="text-2xl font-semibold">{stats.this_month_count}</p>
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
              <Receipt className="h-5 w-5" />
              {t.title}
            </CardTitle>
            <div className="text-sm text-gray-600">
              {total} {language === 'en' ? 'transactions' : '筆交易'}
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
              
              <Select value={typeFilter} onValueChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t.all} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="deposit">{t.deposit}</SelectItem>
                  <SelectItem value="escrow">{t.escrow}</SelectItem>
                  <SelectItem value="payment">{t.payment}</SelectItem>
                  <SelectItem value="withdrawal">{t.withdrawal}</SelectItem>
                  <SelectItem value="refund">{t.refund}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.user}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.type}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    {t.amount}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.description}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.date}
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      {t.noTransactions}
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p className="font-medium">{transaction.user_name}</p>
                          <p className="text-gray-500 text-xs">{transaction.user_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.type)}
                          {getTypeBadge(transaction.type)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold">
                          {formatAmount(transaction.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-700 truncate max-w-md">
                          {transaction.description}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleString()}
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
    </div>
  );
}