import { useAuth } from "../contexts/AuthContext";
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import { formatCurrencyAuto, type Currency } from "../lib/currency";
import { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Receipt, 
  Download, 
  Eye, 
  Mail, 
  Printer, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Loader2 
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  date: string;
  due_date?: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  total: number;
  currency: string;
  payment_method?: string;
  transaction_id?: string;
  items?: InvoiceItem[];
  notes?: string;
  client_name?: string;
  client_email?: string;
  created_at: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoiceStats {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
}

export function EnhancedInvoiceManager() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  const translations = {
    en: {
      title: 'Invoice Management',
      description: 'Manage and track all your invoices',
      search: 'Search invoices...',
      filter: 'Filter by status',
      allStatuses: 'All Statuses',
      noInvoices: 'No invoices found',
      invoiceNumber: 'Invoice',
      date: 'Date',
      dueDate: 'Due Date',
      amount: 'Amount',
      status: 'Status',
      actions: 'Actions',
      view: 'View',
      download: 'Download',
      send: 'Send',
      print: 'Print',
      preview: 'Invoice Preview',
      overview: 'Overview',
      allInvoices: 'All Invoices',
      recent: 'Recent',
      statuses: {
        paid: 'Paid',
        pending: 'Pending',
        overdue: 'Overdue',
        cancelled: 'Cancelled',
      },
      stats: {
        total: 'Total Invoices',
        totalAmount: 'Total Amount',
        paid: 'Paid',
        pending: 'Pending',
        overdue: 'Overdue',
      },
      downloading: 'Downloading...',
      downloadSuccess: 'Invoice downloaded',
      downloadError: 'Failed to download invoice',
      sendSuccess: 'Invoice sent successfully',
      sendError: 'Failed to send invoice',
      client: 'Client',
      paymentMethod: 'Payment Method',
      transactionId: 'Transaction ID',
      items: 'Items',
      itemDescription: 'Description',
      quantity: 'Qty',
      unitPrice: 'Unit Price',
      total: 'Total',
      notes: 'Notes',
      subtotal: 'Subtotal',
      tax: 'Tax',
      grandTotal: 'Grand Total',
    },
    'zh-TW': {
      title: '發票管理',
      description: '管理和追踪所有發票',
      search: '搜尋發票...',
      filter: '按狀態篩選',
      allStatuses: '所有狀態',
      noInvoices: '沒有找到發票',
      invoiceNumber: '發票',
      date: '日期',
      dueDate: '到期日',
      amount: '金額',
      status: '狀態',
      actions: '操作',
      view: '查看',
      download: '下載',
      send: '發送',
      print: '列印',
      preview: '發票預覽',
      overview: '概覽',
      allInvoices: '所有發票',
      recent: '最近',
      statuses: {
        paid: '已付款',
        pending: '待付款',
        overdue: '逾期',
        cancelled: '已取消',
      },
      stats: {
        total: '總發票數',
        totalAmount: '總金額',
        paid: '已付款',
        pending: '待付款',
        overdue: '逾期',
      },
      downloading: '下載中...',
      downloadSuccess: '發票已下載',
      downloadError: '下載發票失敗',
      sendSuccess: '發票已成功發送',
      sendError: '發送發票失敗',
      client: '客戶',
      paymentMethod: '付款方式',
      transactionId: '交易編號',
      items: '項目',
      itemDescription: '描述',
      quantity: '數量',
      unitPrice: '單價',
      total: '總計',
      notes: '備註',
      subtotal: '小計',
      tax: '稅金',
      grandTotal: '總計',
    },
    'zh-CN': {
      title: '收據管理',
      description: '管理和追踪所有收據',
      search: '搜寻收據...',
      filter: '按状态筛选',
      allStatuses: '所有状态',
      noInvoices: '没有找到收據',
      invoiceNumber: '收據',
      date: '日期',
      dueDate: '到期日',
      amount: '金额',
      status: '状态',
      actions: '操作',
      view: '查看',
      download: '下载',
      send: '发送',
      print: '列印',
      preview: '收據预览',
      overview: '概览',
      allInvoices: '所有收據',
      recent: '最近',
      statuses: {
        paid: '已付款',
        pending: '待付款',
        overdue: '逾期',
        cancelled: '已取消',
      },
      stats: {
        total: '总收據数',
        totalAmount: '总金额',
        paid: '已付款',
        pending: '待付款',
        overdue: '逾期',
      },
      downloading: '下载中...',
      downloadSuccess: '收據已下载',
      downloadError: '下载收據失败',
      sendSuccess: '收據已成功发送',
      sendError: '发送收據失败',
      client: '客户',
      paymentMethod: '付款方式',
      transactionId: '交易编号',
      items: '项目',
      itemDescription: '描述',
      quantity: '数量',
      unitPrice: '单价',
      total: '总计',
      notes: '备注',
      subtotal: '小计',
      tax: '税金',
      grandTotal: '总计',
    },
    // 向后兼容旧的 'zh' 代码
    zh: {
      title: '發票管理',
      description: '管理和追蹤所有發票',
      search: '搜尋發票...',
      filter: '按狀態篩選',
      allStatuses: '所有狀態',
      noInvoices: '沒有找到發票',
      invoiceNumber: '發票',
      date: '日期',
      dueDate: '到期日',
      amount: '金額',
      status: '狀態',
      actions: '操作',
      view: '查看',
      download: '下載',
      send: '發送',
      print: '列印',
      preview: '發票預覽',
      overview: '概覽',
      allInvoices: '所有發票',
      recent: '最近',
      statuses: {
        paid: '已付款',
        pending: '待付款',
        overdue: '逾期',
        cancelled: '已取消',
      },
      stats: {
        total: '總發票數',
        totalAmount: '總金額',
        paid: '已付款',
        pending: '待付款',
        overdue: '逾期',
      },
      downloading: '下載中...',
      downloadSuccess: '發票已下載',
      downloadError: '下載發票失敗',
      sendSuccess: '發票已成功發送',
      sendError: '發送發票失敗',
      client: '客戶',
      paymentMethod: '付款方式',
      transactionId: '交易編號',
      items: '項目',
      itemDescription: '描述',
      quantity: '數量',
      unitPrice: '單價',
      total: '總計',
      notes: '備註',
      subtotal: '小計',
      tax: '稅金',
      grandTotal: '總計',
    }
  };

  // 获取翻译，支持新的三语言系统和向后兼容
  const t = translations[language as keyof typeof translations] || translations['en'];

  useEffect(() => {
    if (user?.id && accessToken) {
      loadInvoices();
      loadStats();
    }
  }, [user?.id, accessToken]);

  const loadInvoices = async () => {
    if (!user?.id || !accessToken) return;

    setLoading(true);
    try {
      console.log('📋 [Invoice List] Fetching invoices...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invoices`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📋 [Invoice List] Raw response:', data);
        console.log('📋 [Invoice List] Invoices:', data.invoices?.map((inv: Invoice) => ({
          invoice_number: inv.invoice_number,
          total: inv.total,
          status: inv.status,
          currency: inv.currency,
          items: inv.items?.length || 0
        })));
        setInvoices(data.invoices || []);
      } else if (response.status === 401) {
        // Silently handle auth errors - user might not be authenticated
        console.log('⚠️ [Invoice List] Not authenticated, skipping');
        return;
      } else {
        throw new Error('Failed to load invoices');
      }
    } catch (error) {
      // Check if it's an auth error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('401') || errorMessage.includes('Invalid JWT')) {
        console.log('⚠️ [Invoice List] Auth error, skipping');
        return;
      }
      console.error('❌ [Invoice List] Error loading invoices:', error);
      toast.error(t.downloadError);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id || !accessToken) return;

    try {
      console.log('📊 [Invoice Stats] Fetching invoice statistics...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invoices/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📊 [Invoice Stats] Raw response:', data);
        console.log('📊 [Invoice Stats] Stats data:', data.stats);
        setStats(data.stats);
      } else if (response.status === 401) {
        // Silently handle auth errors - user might not be authenticated
        console.log('⚠️ [Invoice Stats] Not authenticated, skipping');
      } else {
        const errorText = await response.text();
        console.error('❌ [Invoice Stats] Failed to load stats:', response.status, errorText);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('401') && !errorMessage.includes('Invalid JWT')) {
        console.error('❌ [Invoice Stats] Error loading stats:', error);
      } else {
        console.log('⚠️ [Invoice Stats] Auth error, skipping');
      }
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invoices/${invoice.id}/html?lang=${language}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const html = await response.text();
        setPreviewHtml(html);
        setSelectedInvoice(invoice);
        setShowPreview(true);
      } else {
        throw new Error('Failed to load invoice');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error(language === 'en' ? 'Failed to load invoice' : '載入發票失敗');
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invoices/${invoice.id}/download?lang=${language}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice_${invoice.invoice_number}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(t.downloadSuccess);
      } else {
        throw new Error('Failed to download invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error(t.downloadError);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invoices/${invoice.id}/send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success(t.sendSuccess);
      } else {
        throw new Error('Failed to send invoice');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(t.sendError);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const config: Record<Invoice['status'], { variant: 'default' | 'secondary' | 'destructive'; icon: any; className: string }> = {
      paid: { variant: 'default', icon: CheckCircle2, className: 'bg-green-100 text-green-800 border-green-200' },
      pending: { variant: 'secondary', icon: Clock, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      overdue: { variant: 'destructive', icon: AlertCircle, className: 'bg-red-100 text-red-800 border-red-200' },
      cancelled: { variant: 'secondary', icon: AlertCircle, className: 'bg-gray-100 text-gray-800 border-gray-200' },
    };

    // 🔧 添加安全檢查，防止未定義的狀態導致崩潰
    const statusConfig = config[status] || config.pending; // 默認使用 pending 配置
    const { icon: Icon, className } = statusConfig;

    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {t.statuses[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    // 使用自動匯率轉換
    // 發票可能有自己的 currency 字段，如果沒有則假設為 TWD（數據庫預設）
    const storedCurrency: Currency = (currency === 'TWD' || currency === 'USD' || currency === 'CNY') ? currency as Currency : 'TWD';
    return formatCurrencyAuto(amount, storedCurrency, language);
  };

  // 格式化統計卡片金額（⭐ 數據庫預設儲存 TWD）
  const formatStatsAmount = (amount: number) => {
    return formatCurrencyAuto(amount, 'TWD', language);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'recent' && new Date(invoice.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
      invoice.status === activeTab;
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-700">{t.stats.total}</span>
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-900">{stats.total_invoices}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-700">{t.stats.totalAmount}</span>
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {formatStatsAmount(stats.total_amount)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-700">{t.stats.paid}</span>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-900">
                {formatStatsAmount(stats.paid_amount)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-yellow-700">{t.stats.pending}</span>
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-900">
                {formatStatsAmount(stats.pending_amount)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-red-700">{t.stats.overdue}</span>
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-900">
                {formatStatsAmount(stats.overdue_amount)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 bg-blue-50">
              <TabsTrigger value="all">{t.allInvoices}</TabsTrigger>
              <TabsTrigger value="recent">{t.recent}</TabsTrigger>
              <TabsTrigger value="paid">{t.statuses.paid}</TabsTrigger>
              <TabsTrigger value="pending">{t.statuses.pending}</TabsTrigger>
              <TabsTrigger value="overdue">{t.statuses.overdue}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search and Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t.filter} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                {Object.entries(t.statuses).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoices List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.noInvoices}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-lg">
                            {invoice.invoice_number}
                          </p>
                          {getStatusBadge(invoice.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                          {invoice.client_name && (
                            <div>
                              <span className="text-gray-500">{t.client}: </span>
                              <span className="font-medium">{invoice.client_name}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">{t.date}: </span>
                            <span className="font-medium">{formatDate(invoice.date)}</span>
                          </div>
                          {invoice.due_date && (
                            <div>
                              <span className="text-gray-500">{t.dueDate}: </span>
                              <span className="font-medium">{formatDate(invoice.due_date)}</span>
                            </div>
                          )}
                          {invoice.payment_method && (
                            <div>
                              <span className="text-gray-500">{t.paymentMethod}: </span>
                              <span className="font-medium">{invoice.payment_method}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">{t.amount}</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                          title={t.view}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice)}
                          title={t.download}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {invoice.status === 'pending' && invoice.client_email && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendInvoice(invoice)}
                            title={t.send}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.print()}
                          title={t.print}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {t.preview}
            </DialogTitle>
            {selectedInvoice && (
              <DialogDescription>
                {selectedInvoice.invoice_number} • {formatDate(selectedInvoice.date)} • {formatCurrency(selectedInvoice.total, selectedInvoice.currency)}
              </DialogDescription>
            )}
          </DialogHeader>
          <div 
            className="border rounded-lg overflow-hidden bg-white"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}