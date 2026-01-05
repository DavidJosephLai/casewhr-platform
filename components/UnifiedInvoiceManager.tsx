import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { formatCurrencyAuto, type Currency } from '../lib/currency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  Receipt, 
  FileText,
  Download, 
  Eye, 
  Mail, 
  Printer, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Loader2,
  ExternalLink,
  FileCheck,
  FileClock
} from 'lucide-react';

// Helper function to create auth headers with dev token support
function createAuthHeaders(accessToken: string | null): HeadersInit {
  const headers: HeadersInit = {};
  
  if (accessToken?.startsWith('dev-user-')) {
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
    headers['X-Dev-Token'] = accessToken;
  } else if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  headers['Content-Type'] = 'application/json';
  return headers;
}

// 統一的發票/收據介面
interface UnifiedInvoice {
  id: string;
  type: 'gov_invoice' | 'platform_receipt'; // 政府發票 vs 平台收據
  invoice_number: string;
  invoice_date: string;
  transaction_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  tax_id?: string; // 統一編號（買方）
  seller_tax_id?: string; // 統一編號（賣方）
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  status: 'issued' | 'voided' | 'cancelled' | 'paid' | 'pending';
  payment_method?: string;
  gov_invoice_number?: string; // 財政部發票號碼（如 AB-12345678）
  notes?: string;
  created_at: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceStats {
  total_count: number;
  gov_invoice_count: number;
  platform_receipt_count: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
}

export function UnifiedInvoiceManager() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [invoices, setInvoices] = useState<UnifiedInvoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<UnifiedInvoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all'); // all, gov_invoice, platform_receipt
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  const translations = {
    en: {
      title: 'Invoice & Receipt Management',
      description: 'Manage E-Invoices and Platform Receipts',
      subtitle: 'Unified management of Ministry of Finance E-Invoices and platform receipts',
      search: 'Search invoice number, email or name...',
      typeFilter: 'Type',
      statusFilter: 'Status',
      allTypes: 'All Types',
      allStatuses: 'All Statuses',
      govInvoice: 'Gov E-Invoice',
      platformReceipt: 'Platform Receipt',
      noRecords: 'No records found',
      invoiceNumber: 'Number',
      invoiceDate: 'Date',
      user: 'User',
      amount: 'Amount',
      taxAmount: 'Tax',
      total: 'Total',
      type: 'Type',
      status: 'Status',
      actions: 'Actions',
      view: 'View',
      download: 'Download',
      send: 'Send Email',
      print: 'Print',
      preview: 'Preview',
      allInvoices: 'All',
      recent: 'Recent',
      statuses: {
        issued: 'Issued',
        paid: 'Paid',
        pending: 'Pending',
        voided: 'Voided',
        cancelled: 'Cancelled',
      },
      stats: {
        total: 'Total Records',
        govInvoices: 'Gov E-Invoices',
        platformReceipts: 'Platform Receipts',
        totalAmount: 'Total Amount',
        paid: 'Paid',
        pending: 'Pending',
      },
      govPlatformLink: 'Check at Ministry of Finance Platform',
      govPlatformUrl: 'https://www.einvoice.nat.gov.tw/',
      downloadSuccess: 'Downloaded successfully',
      downloadError: 'Download failed',
      sendSuccess: 'Email sent successfully',
      sendError: 'Failed to send email',
    },
    'zh-TW': {
      title: '發票與收據管理',
      description: '統一管理電子發票和平台收據',
      subtitle: '整合財政部電子發票與平台內部收據管理',
      search: '搜尋發票號碼、Email 或姓名...',
      typeFilter: '類型',
      statusFilter: '狀態',
      allTypes: '所有類型',
      allStatuses: '所有狀態',
      govInvoice: '財政部電子發票',
      platformReceipt: '平台收據',
      noRecords: '沒有找到記錄',
      invoiceNumber: '發票/收據號碼',
      invoiceDate: '日期',
      user: '用戶',
      amount: '金額',
      taxAmount: '稅額',
      total: '總計',
      type: '類型',
      status: '狀態',
      actions: '操作',
      view: '查看',
      download: '下載',
      send: '發送郵件',
      print: '列印',
      preview: '預覽',
      allInvoices: '全部',
      recent: '最近',
      statuses: {
        issued: '已開立',
        paid: '已付款',
        pending: '待付款',
        voided: '已作廢',
        cancelled: '已取消',
      },
      stats: {
        total: '總記錄數',
        govInvoices: '政府電子發票',
        platformReceipts: '平台收據',
        totalAmount: '總金額',
        paid: '已付款',
        pending: '待付款',
      },
      govPlatformLink: '至財政部平台查詢',
      govPlatformUrl: 'https://www.einvoice.nat.gov.tw/',
      downloadSuccess: '下載成功',
      downloadError: '下載失敗',
      sendSuccess: '郵件已成功發送',
      sendError: '發送郵件失敗',
    },
    'zh-CN': {
      title: '发票与收据管理',
      description: '统一管理电子发票和平台收据',
      subtitle: '整合财政部电子发票与平台内部收据管理',
      search: '搜寻发票号码、Email 或姓名...',
      typeFilter: '类型',
      statusFilter: '状态',
      allTypes: '所有类型',
      allStatuses: '所有状态',
      govInvoice: '财政部电子发票',
      platformReceipt: '平台收据',
      noRecords: '没有找到记录',
      invoiceNumber: '发票/收据号码',
      invoiceDate: '日期',
      user: '用户',
      amount: '金额',
      taxAmount: '税额',
      total: '总计',
      type: '类型',
      status: '状态',
      actions: '操作',
      view: '查看',
      download: '下载',
      send: '发送邮件',
      print: '列印',
      preview: '预览',
      allInvoices: '全部',
      recent: '最近',
      statuses: {
        issued: '已开立',
        paid: '已付款',
        pending: '待付款',
        voided: '已作废',
        cancelled: '已取消',
      },
      stats: {
        total: '总记录数',
        govInvoices: '政府电子发票',
        platformReceipts: '平台收据',
        totalAmount: '总金额',
        paid: '已付款',
        pending: '待付款',
      },
      govPlatformLink: '至财政部平台查询',
      govPlatformUrl: 'https://www.einvoice.nat.gov.tw/',
      downloadSuccess: '下载成功',
      downloadError: '下载失败',
      sendSuccess: '邮件已成功发送',
      sendError: '发送邮件失败',
    },
  };

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
      console.log('📋 [Unified Invoice] Fetching invoices...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/unified-invoices`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📋 [Unified Invoice] Loaded:', data.invoices?.length || 0);
        setInvoices(data.invoices || []);
      } else if (response.status === 401) {
        console.log('⚠️ [Unified Invoice] Not authenticated, skipping');
        return;
      } else {
        throw new Error('Failed to load invoices');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('401') || errorMessage.includes('Invalid JWT')) {
        console.log('⚠️ [Unified Invoice] Auth error, skipping');
        return;
      }
      console.error('❌ [Unified Invoice] Error:', error);
      toast.error(t.downloadError);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id || !accessToken) return;

    try {
      console.log('📊 [Unified Invoice Stats] Fetching...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/unified-invoices/stats`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📊 [Unified Invoice Stats] Loaded:', data.stats);
        setStats(data.stats);
      } else if (response.status === 401) {
        console.log('⚠️ [Unified Invoice Stats] Not authenticated, skipping');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('401') && !errorMessage.includes('Invalid JWT')) {
        console.error('❌ [Unified Invoice Stats] Error:', error);
      }
    }
  };

  const handleViewInvoice = async (invoice: UnifiedInvoice) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/unified-invoices/${invoice.id}/html?lang=${language}`,
        {
          headers: createAuthHeaders(accessToken),
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
      toast.error(t.downloadError);
    }
  };

  const handleDownloadInvoice = async (invoice: UnifiedInvoice) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/unified-invoices/${invoice.id}/download?lang=${language}`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${invoice.type === 'gov_invoice' ? 'invoice' : 'receipt'}_${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(t.downloadSuccess);
      } else {
        throw new Error('Failed to download');
      }
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error(t.downloadError);
    }
  };

  const handleSendInvoice = async (invoice: UnifiedInvoice) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/unified-invoices/${invoice.id}/send`,
        {
          method: 'POST',
          headers: createAuthHeaders(accessToken),
        }
      );

      if (response.ok) {
        toast.success(t.sendSuccess);
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error('Error sending:', error);
      toast.error(t.sendError);
    }
  };

  const getTypeBadge = (type: UnifiedInvoice['type']) => {
    const config = {
      gov_invoice: {
        label: t.govInvoice,
        icon: FileCheck,
        className: 'bg-blue-100 text-blue-800 border-blue-200',
      },
      platform_receipt: {
        label: t.platformReceipt,
        icon: FileClock,
        className: 'bg-purple-100 text-purple-800 border-purple-200',
      },
    };

    const { label, icon: Icon, className } = config[type];

    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getStatusBadge = (status: UnifiedInvoice['status']) => {
    const config: Record<UnifiedInvoice['status'], { icon: any; className: string }> = {
      issued: { icon: CheckCircle2, className: 'bg-green-100 text-green-800 border-green-200' },
      paid: { icon: CheckCircle2, className: 'bg-green-100 text-green-800 border-green-200' },
      pending: { icon: Clock, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      voided: { icon: AlertCircle, className: 'bg-red-100 text-red-800 border-red-200' },
      cancelled: { icon: AlertCircle, className: 'bg-gray-100 text-gray-800 border-gray-200' },
    };

    const statusConfig = config[status] || config.pending;
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
    return date.toLocaleDateString(language === 'en' ? 'en-US' : language === 'zh-CN' ? 'zh-CN' : 'zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    const storedCurrency: Currency = (currency === 'TWD' || currency === 'USD' || currency === 'CNY') ? currency as Currency : 'TWD';
    return formatCurrencyAuto(amount, storedCurrency, language);
  };

  const formatStatsAmount = (amount: number) => {
    return formatCurrencyAuto(amount, 'TWD', language);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || invoice.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'recent' && new Date(invoice.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
      invoice.status === activeTab;
    
    return matchesSearch && matchesType && matchesStatus && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* 財政部平台連結提示 */}
      <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                📄 {language === 'en' ? 'Ministry of Finance E-Invoice Platform' : '財政部電子發票整合服務平台'}
              </p>
              <p className="text-xs text-blue-700 mb-2">
                {language === 'en' 
                  ? 'All government e-invoices can be queried at the official platform'
                  : '所有政府電子發票都可以在官方平台查詢'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(t.govPlatformUrl, '_blank')}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {t.govPlatformLink}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-700">{t.stats.total}</span>
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-900">{stats.total_count}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-cyan-200 bg-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-cyan-700">{t.stats.govInvoices}</span>
                <FileCheck className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="text-2xl font-bold text-cyan-900">{stats.gov_invoice_count}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-700">{t.stats.platformReceipts}</span>
                <FileClock className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-900">{stats.platform_receipt_count}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-indigo-200 bg-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-indigo-700">{t.stats.totalAmount}</span>
                <DollarSign className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="text-xl font-bold text-indigo-900">
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
              <div className="text-xl font-bold text-green-900">
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
              <div className="text-xl font-bold text-yellow-900">
                {formatStatsAmount(stats.pending_amount)}
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
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 bg-blue-50">
              <TabsTrigger value="all">{t.allInvoices}</TabsTrigger>
              <TabsTrigger value="recent">{t.recent}</TabsTrigger>
              <TabsTrigger value="paid">{t.statuses.paid}</TabsTrigger>
              <TabsTrigger value="pending">{t.statuses.pending}</TabsTrigger>
              <TabsTrigger value="issued">{t.statuses.issued}</TabsTrigger>
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
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t.typeFilter} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allTypes}</SelectItem>
                <SelectItem value="gov_invoice">{t.govInvoice}</SelectItem>
                <SelectItem value="platform_receipt">{t.platformReceipt}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t.statusFilter} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                {Object.entries(t.statuses).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Records List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.noRecords}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.invoiceNumber}</TableHead>
                    <TableHead>{t.type}</TableHead>
                    <TableHead>{t.invoiceDate}</TableHead>
                    <TableHead>{t.user}</TableHead>
                    <TableHead className="text-right">{t.total}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{invoice.invoice_number}</p>
                          {invoice.gov_invoice_number && (
                            <p className="text-xs text-gray-500 mt-1">
                              {invoice.gov_invoice_number}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(invoice.type)}</TableCell>
                      <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.user_name}</p>
                          <p className="text-xs text-gray-500">{invoice.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
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
                          {invoice.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendInvoice(invoice)}
                              title={t.send}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {t.preview}
            </DialogTitle>
            {selectedInvoice && (
              <DialogDescription>
                {selectedInvoice.invoice_number} • {formatDate(selectedInvoice.invoice_date)} • {formatCurrency(selectedInvoice.total, selectedInvoice.currency)}
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
