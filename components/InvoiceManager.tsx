import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';
import { FileText, Download, Eye, X, Search, Calendar, DollarSign } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from '../lib/LanguageContext';

// Helper function to create auth headers with dev token support
function createAuthHeaders(accessToken: string | null): HeadersInit {
  const headers: HeadersInit = {};
  
  if (accessToken?.startsWith('dev-user-')) {
    // Dev mode: Use publicAnonKey for Authorization, dev token in X-Dev-Token
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
    headers['X-Dev-Token'] = accessToken;
    console.log('[InvoiceManager] Dev mode: Using publicAnonKey for auth, dev token in X-Dev-Token header');
  } else if (accessToken) {
    // Production mode: Use access token
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  headers['Content-Type'] = 'application/json';
  return headers;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  transaction_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  tax_id?: string; // 统一编号（买方）
  seller_tax_id: string; // 统一编号（卖方，平台）
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number; // 5% 营业税
  tax_amount: number;
  total: number;
  currency: string;
  status: 'issued' | 'voided' | 'cancelled';
  notes?: string;
  created_at: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export function InvoiceManager({ userId, accessToken, isAdmin = false }: { 
  userId?: string; 
  accessToken: string;
  isAdmin?: boolean;
}) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { language } = useLanguage();

  // 翻譯字典
  const translations = {
    en: {
      title: 'E-Invoice Management',
      subtitle: 'Manage Taiwan E-Invoices',
      createInvoice: 'Issue Invoice',
      createDialogTitle: 'Issue E-Invoice',
      createDialogDesc: 'Fill in invoice information',
      searchPlaceholder: 'Search invoice number, email or name...',
      filterPlaceholder: 'Invoice Status',
      allStatus: 'All Status',
      recordsTitle: 'Invoice Records',
      recordsCount: (count: number) => `Total ${count} invoices`,
      noRecords: 'No invoice records',
      invoiceNumber: 'Invoice Number',
      invoiceDate: 'Invoice Date',
      user: 'User',
      amount: 'Amount',
      taxAmount: 'Tax Amount',
      total: 'Total',
      status: 'Status',
      actions: 'Actions',
      statusIssued: 'Issued',
      statusVoided: 'Voided',
      statusCancelled: 'Cancelled',
      success: {
        created: 'E-invoice issued successfully',
        voided: 'Invoice voided successfully',
        downloaded: 'Invoice downloaded successfully',
        sent: 'Invoice email sent successfully',
      },
      error: {
        fetch: 'Failed to fetch invoices',
        create: 'Failed to issue invoice',
        void: 'Failed to void invoice',
        download: 'Failed to download invoice',
        send: 'Failed to send invoice email',
      },
      form: {
        userEmail: 'User Email *',
        userName: 'User Name *',
        taxId: 'Tax ID (Optional)',
        taxIdPlaceholder: '8 digits',
        description: 'Description *',
        descriptionPlaceholder: 'e.g., Platform service fee',
        amountPreTax: 'Amount (Pre-tax) *',
        currency: 'Currency',
        subtotalLabel: 'Subtotal:',
        taxLabel: 'Business Tax (5%):',
        totalLabel: 'Total:',
        cancel: 'Cancel',
        submit: 'Issue Invoice',
      },
      dialog: {
        title: 'Invoice Details',
        invoiceNumberLabel: 'Invoice Number:',
        seller: 'Seller (Platform)',
        buyer: 'Buyer',
        date: 'Invoice Date',
        currencyLabel: 'Currency',
        statusLabel: 'Status',
        details: 'Details',
        itemDescription: 'Description',
        quantity: 'Quantity',
        unitPrice: 'Unit Price',
        itemAmount: 'Amount',
        subtotal: 'Subtotal:',
        tax: 'Business Tax (5%):',
        grandTotal: 'Total:',
        notes: 'Notes',
        close: 'Close',
        sendEmail: 'Send Email',
        downloadPDF: 'Download PDF',
        taxIdLabel: 'Tax ID:',
      },
    },
    'zh-TW': {
      title: '電子發票管理',
      subtitle: '管理台灣電子發票',
      createInvoice: '開具發票',
      createDialogTitle: '開具電子發票',
      createDialogDesc: '填寫發票資訊',
      searchPlaceholder: '搜尋發票號碼、用戶郵箱或姓名...',
      filterPlaceholder: '發票狀態',
      allStatus: '全部狀態',
      recordsTitle: '發票記錄',
      recordsCount: (count: number) => `共 ${count} 張發票`,
      noRecords: '暫無發票記錄',
      invoiceNumber: '發票號碼',
      invoiceDate: '開票日期',
      user: '用戶',
      amount: '金額',
      taxAmount: '稅額',
      total: '總計',
      status: '狀態',
      actions: '操作',
      statusIssued: '已開具',
      statusVoided: '已作廢',
      statusCancelled: '已取消',
      success: {
        created: '電子發票已開具',
        voided: '發票已作廢',
        downloaded: '發票下載成功',
        sent: '發票郵件已發送',
      },
      error: {
        fetch: '獲取發票失敗',
        create: '開具發票失敗',
        void: '作廢發票失敗',
        download: '下載發票失敗',
        send: '發送發票郵件失敗',
      },
    },
    'zh-CN': {
      title: '收據管理',
      subtitle: '管理收據記錄',
      createInvoice: '開具收據',
      createDialogTitle: '開具收據',
      createDialogDesc: '填寫收據資訊',
      searchPlaceholder: '搜尋收據號碼、用戶郵箱或姓名...',
      filterPlaceholder: '收據狀態',
      allStatus: '全部状态',
      recordsTitle: '收據記錄',
      recordsCount: (count: number) => `共 ${count} 張收據`,
      noRecords: '暫無收據記錄',
      invoiceNumber: '收據號碼',
      invoiceDate: '開具日期',
      user: '用户',
      amount: '金额',
      taxAmount: '税额',
      total: '总计',
      status: '状态',
      actions: '操作',
      statusIssued: '已开具',
      statusVoided: '已作废',
      statusCancelled: '已取消',
      success: {
        created: '收據已開具',
        voided: '收據已作廢',
        downloaded: '收據下載成功',
        sent: '收據郵件已發送',
      },
      error: {
        fetch: '獲取收據失敗',
        create: '開具收據失敗',
        void: '作廢收據失敗',
        download: '下載收據失敗',
        send: '發送收據郵件失敗',
      },
    },
    // 向後兼容
    zh: {
      title: '電子發票管理',
      subtitle: '管理台灣電子發票',
      createInvoice: '開具發票',
      createDialogTitle: '開具電子發票',
      createDialogDesc: '填寫發票資訊',
      searchPlaceholder: '搜尋發票號碼、用戶郵箱或姓名...',
      filterPlaceholder: '發票狀態',
      allStatus: '全部狀態',
      recordsTitle: '發票記錄',
      recordsCount: (count: number) => `共 ${count} 張發票`,
      noRecords: '暫無發票��錄',
      invoiceNumber: '發票號碼',
      invoiceDate: '開票日期',
      user: '用戶',
      amount: '金額',
      taxAmount: '稅額',
      total: '總計',
      status: '狀態',
      actions: '操作',
      statusIssued: '已開具',
      statusVoided: '已作廢',
      statusCancelled: '已取消',
      success: {
        created: '電子發票已開具',
        voided: '發票已作廢',
        downloaded: '發票下載成功',
        sent: '發票郵件已發送',
      },
      error: {
        fetch: '獲取發票失敗',
        create: '開具發票失敗',
        void: '作廢發票失敗',
        download: '下載發票失敗',
        send: '發送發票郵件失敗',
      },
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    fetchInvoices();
  }, [userId, statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin 
        ? '/make-server-215f78a5/admin/invoices'
        : `/make-server-215f78a5/user/invoices/${userId}`;

      const url = `https://${projectId}.supabase.co/functions/v1${endpoint}${
        statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      }`;

      console.log('[InvoiceManager] Fetching invoices from:', url);
      console.log('[InvoiceManager] isAdmin:', isAdmin);
      console.log('[InvoiceManager] accessToken:', accessToken?.substring(0, 30) + '...');

      const response = await fetch(url, {
        headers: createAuthHeaders(accessToken),
      });

      console.log('[InvoiceManager] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[InvoiceManager] Error response:', errorText);
        throw new Error(`Failed to fetch invoices: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[InvoiceManager] Received invoices:', data.invoices?.length || 0);
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error(t.error.fetch);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    // 台湾发票格式：两位大写字母 + 8位数字
    const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                   String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const numbers = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
    return `${letters}${numbers}`;
  };

  const createInvoice = async (data: Partial<Invoice>) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invoices/create`,
        {
          method: 'POST',
          headers: createAuthHeaders(accessToken),
          body: JSON.stringify({
            ...data,
            invoice_number: generateInvoiceNumber(),
            invoice_date: new Date().toISOString().split('T')[0],
            seller_tax_id: '60882875', // CaseWhr 公司统一编号
            tax_rate: 0.05, // 5% 营业税
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to create invoice');
      const result = await response.json();
      
      toast.success(t.success.created);
      setShowCreateDialog(false);
      fetchInvoices();
      
      return result.invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(t.error.create);
    }
  };

  const voidInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invoices/${invoiceId}/void`,
        {
          method: 'POST',
          headers: createAuthHeaders(accessToken),
        }
      );

      if (!response.ok) throw new Error('Failed to void invoice');
      
      toast.success(t.success.voided);
      fetchInvoices();
    } catch (error) {
      console.error('Error voiding invoice:', error);
      toast.error(t.error.void);
    }
  };

  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invoices/${invoice.id}/pdf`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (!response.ok) throw new Error('Failed to download invoice');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(t.success.downloaded);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error(t.error.download);
    }
  };

  const sendInvoiceEmail = async (invoiceId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invoices/${invoiceId}/send-email`,
        {
          method: 'POST',
          headers: createAuthHeaders(accessToken),
        }
      );

      if (!response.ok) throw new Error('Failed to send invoice email');
      
      toast.success(t.success.sent);
    } catch (error) {
      console.error('Error sending invoice email:', error);
      toast.error(t.error.send);
    }
  };

  const filteredInvoices = invoices.filter(invoice => 
    invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return <Badge className="bg-green-500">{t.statusIssued}</Badge>;
      case 'voided':
        return <Badge className="bg-red-500">{t.statusVoided}</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500">{t.statusCancelled}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">{t.title}</h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>
        {isAdmin && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                {t.createInvoice}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t.createDialogTitle}</DialogTitle>
                <DialogDescription>{t.createDialogDesc}</DialogDescription>
              </DialogHeader>
              <CreateInvoiceForm onSubmit={createInvoice} onCancel={() => setShowCreateDialog(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.filterPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatus}</SelectItem>
                <SelectItem value="issued">{t.statusIssued}</SelectItem>
                <SelectItem value="voided">{t.statusVoided}</SelectItem>
                <SelectItem value="cancelled">{t.statusCancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 发票列表 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.recordsTitle}</CardTitle>
          <CardDescription>{t.recordsCount(filteredInvoices.length)}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t.noRecords}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.invoiceNumber}</TableHead>
                    <TableHead>{t.invoiceDate}</TableHead>
                    <TableHead>{t.user}</TableHead>
                    <TableHead>{t.amount}</TableHead>
                    <TableHead>{t.taxAmount}</TableHead>
                    <TableHead>{t.total}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.invoice_date}</TableCell>
                      <TableCell>
                        <div>
                          <div>{invoice.user_name}</div>
                          <div className="text-sm text-gray-500">{invoice.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.currency} {invoice.subtotal.toLocaleString()}</TableCell>
                      <TableCell>{invoice.currency} {invoice.tax_amount.toLocaleString()}</TableCell>
                      <TableCell>{invoice.currency} {invoice.total.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadInvoicePDF(invoice)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {isAdmin && invoice.status === 'issued' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => voidInvoice(invoice.id)}
                            >
                              <X className="w-4 h-4" />
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

      {/* 发票详情对话框 */}
      {selectedInvoice && (
        <InvoiceDetailDialog
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDownload={downloadInvoicePDF}
          onSendEmail={sendInvoiceEmail}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

function CreateInvoiceForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (data: Partial<Invoice>) => void;
  onCancel: () => void;
}) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    user_email: '',
    user_name: '',
    tax_id: '',
    description: '',
    amount: '',
    currency: 'TWD',
  });

  // Form translations
  const formTranslations = {
    en: {
      userEmail: 'User Email *',
      userName: 'User Name *',
      taxId: 'Tax ID (Optional)',
      taxIdPlaceholder: '8 digits',
      description: 'Description *',
      descriptionPlaceholder: 'e.g., Platform service fee',
      amountPreTax: 'Amount (Pre-tax) *',
      currency: 'Currency',
      currencyTWD: 'TWD - New Taiwan Dollar',
      currencyUSD: 'USD - US Dollar',
      subtotalLabel: 'Subtotal:',
      taxLabel: 'Business Tax (5%):',
      totalLabel: 'Total:',
      cancel: 'Cancel',
      submit: 'Issue Invoice',
    },
    'zh-TW': {
      userEmail: '用戶郵箱 *',
      userName: '用戶姓名 *',
      taxId: '統一編號（選填）',
      taxIdPlaceholder: '8位數字',
      description: '品名 *',
      descriptionPlaceholder: '例如：平台服務費',
      amountPreTax: '金額（未稅）*',
      currency: '幣別',
      currencyTWD: 'TWD 新台幣',
      currencyUSD: 'USD 美元',
      subtotalLabel: '未稅金額：',
      taxLabel: '營業稅 (5%)：',
      totalLabel: '總計：',
      cancel: '取消',
      submit: '開具發票',
    },
    'zh-CN': {
      userEmail: '用户邮箱 *',
      userName: '用户姓名 *',
      taxId: '统一编号（选填）',
      taxIdPlaceholder: '8位数字',
      description: '品名 *',
      descriptionPlaceholder: '例如：平台服务费',
      amountPreTax: '金额（未税）*',
      currency: '币别',
      currencyTWD: 'TWD 新台币',
      currencyUSD: 'USD 美元',
      subtotalLabel: '未税金额：',
      taxLabel: '营业税 (5%)：',
      totalLabel: '总计：',
      cancel: '取消',
      submit: '开具收据',
    },
    zh: {
      userEmail: '用戶郵箱 *',
      userName: '用戶姓名 *',
      taxId: '統一編號（選填）',
      taxIdPlaceholder: '8位數字',
      description: '品名 *',
      descriptionPlaceholder: '例如：平台服務費',
      amountPreTax: '金額（未稅）*',
      currency: '幣別',
      currencyTWD: 'TWD 新台幣',
      currencyUSD: 'USD 美元',
      subtotalLabel: '未稅金額：',
      taxLabel: '營業稅 (5%)：',
      totalLabel: '總計：',
      cancel: '取消',
      submit: '開具發票',
    },
  };

  const ft = formTranslations[language as keyof typeof formTranslations] || formTranslations.en;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    const taxAmount = amount * 0.05;
    const total = amount + taxAmount;

    onSubmit({
      user_email: formData.user_email,
      user_name: formData.user_name,
      tax_id: formData.tax_id || undefined,
      items: [{
        description: formData.description,
        quantity: 1,
        unit_price: amount,
        amount: amount,
      }],
      subtotal: amount,
      tax_amount: taxAmount,
      total: total,
      currency: formData.currency,
      status: 'issued',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="user_email">{ft.userEmail}</Label>
          <Input
            id="user_email"
            type="email"
            value={formData.user_email}
            onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="user_name">{ft.userName}</Label>
          <Input
            id="user_name"
            value={formData.user_name}
            onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="tax_id">{ft.taxId}</Label>
        <Input
          id="tax_id"
          placeholder={ft.taxIdPlaceholder}
          maxLength={8}
          value={formData.tax_id}
          onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="description">{ft.description}</Label>
        <Input
          id="description"
          placeholder={ft.descriptionPlaceholder}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">{ft.amountPreTax}</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="currency">{ft.currency}</Label>
          <Select 
            value={formData.currency} 
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TWD">{ft.currencyTWD}</SelectItem>
              <SelectItem value="USD">{ft.currencyUSD}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.amount && (
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{ft.subtotalLabel}</span>
                <span>{formData.currency} {parseFloat(formData.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{ft.taxLabel}</span>
                <span>{formData.currency} {(parseFloat(formData.amount) * 0.05).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>{ft.totalLabel}</span>
                <span>{formData.currency} {(parseFloat(formData.amount) * 1.05).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {ft.cancel}
        </Button>
        <Button type="submit">
          {ft.submit}
        </Button>
      </div>
    </form>
  );
}

function InvoiceDetailDialog({
  invoice,
  onClose,
  onDownload,
  onSendEmail,
  isAdmin,
}: {
  invoice: Invoice;
  onClose: () => void;
  onDownload: (invoice: Invoice) => void;
  onSendEmail: (invoiceId: string) => void;
  isAdmin: boolean;
}) {
  const { language } = useLanguage();

  // Dialog translations
  const dialogTranslations = {
    en: {
      title: 'Invoice Details',
      invoiceNumberLabel: 'Invoice Number:',
      seller: 'Seller (Platform)',
      buyer: 'Buyer',
      taxIdLabel: 'Tax ID:',
      date: 'Invoice Date',
      currencyLabel: 'Currency',
      statusLabel: 'Status',
      statusIssued: 'Issued',
      statusVoided: 'Voided',
      statusCancelled: 'Cancelled',
      details: 'Details',
      itemDescription: 'Description',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      itemAmount: 'Amount',
      subtotal: 'Subtotal:',
      tax: 'Business Tax (5%):',
      grandTotal: 'Total:',
      notes: 'Notes',
      close: 'Close',
      sendEmail: 'Send Email',
      downloadPDF: 'Download PDF',
    },
    'zh-TW': {
      title: '電子發票詳情',
      invoiceNumberLabel: '發票號碼:',
      seller: '賣方（平台）',
      buyer: '買方',
      taxIdLabel: '統一編號:',
      date: '開票日期',
      currencyLabel: '幣別',
      statusLabel: '狀態',
      statusIssued: '已開具',
      statusVoided: '已作廢',
      statusCancelled: '已取消',
      details: '明細',
      itemDescription: '品名',
      quantity: '數量',
      unitPrice: '單價',
      itemAmount: '金額',
      subtotal: '小計：',
      tax: '營業稅 (5%)：',
      grandTotal: '總計：',
      notes: '備註',
      close: '關閉',
      sendEmail: '發送郵件',
      downloadPDF: '下載 PDF',
    },
    'zh-CN': {
      title: '收據詳情',
      invoiceNumberLabel: '收據號碼:',
      seller: '卖方（平台）',
      buyer: '买方',
      taxIdLabel: '统一编号:',
      date: '开具日期',
      currencyLabel: '币别',
      statusLabel: '状态',
      statusIssued: '已开具',
      statusVoided: '已作废',
      statusCancelled: '已取消',
      details: '明细',
      itemDescription: '品名',
      quantity: '数量',
      unitPrice: '单价',
      itemAmount: '金额',
      subtotal: '小计：',
      tax: '营业税 (5%)：',
      grandTotal: '总计：',
      notes: '备注',
      close: '关闭',
      sendEmail: '发送邮件',
      downloadPDF: '下载 PDF',
    },
    zh: {
      title: '電子發票詳情',
      invoiceNumberLabel: '發票號碼:',
      seller: '賣方（平台）',
      buyer: '買方',
      taxIdLabel: '統一編號:',
      date: '開票日期',
      currencyLabel: '幣別',
      statusLabel: '狀態',
      statusIssued: '已開具',
      statusVoided: '已作廢',
      statusCancelled: '已取消',
      details: '明細',
      itemDescription: '品名',
      quantity: '數量',
      unitPrice: '單價',
      itemAmount: '金額',
      subtotal: '小計：',
      tax: '營業稅 (5%)：',
      grandTotal: '總計：',
      notes: '備註',
      close: '關閉',
      sendEmail: '發送郵件',
      downloadPDF: '下載 PDF',
    },
  };

  const dt = dialogTranslations[language as keyof typeof dialogTranslations] || dialogTranslations.en;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'issued':
        return dt.statusIssued;
      case 'voided':
        return dt.statusVoided;
      case 'cancelled':
        return dt.statusCancelled;
      default:
        return status;
    }
  };

  return (
    <Dialog open={!!invoice} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dt.title}</DialogTitle>
          <DialogDescription>{dt.invoiceNumberLabel} {invoice.invoice_number}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 发票抬头 */}
          <div className="border-b pb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>{dt.seller}</Label>
                <p>CaseWhr 接案平台</p>
                <p className="text-gray-600">{dt.taxIdLabel} {invoice.seller_tax_id}</p>
              </div>
              <div>
                <Label>{dt.buyer}</Label>
                <p>{invoice.user_name}</p>
                <p className="text-gray-600">{invoice.user_email}</p>
                {invoice.tax_id && (
                  <p className="text-gray-600">{dt.taxIdLabel} {invoice.tax_id}</p>
                )}
              </div>
            </div>
          </div>

          {/* 发票信息 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>{dt.date}</Label>
              <p>{invoice.invoice_date}</p>
            </div>
            <div>
              <Label>{dt.currencyLabel}</Label>
              <p>{invoice.currency}</p>
            </div>
            <div>
              <Label>{dt.statusLabel}</Label>
              <p>{getStatusText(invoice.status)}</p>
            </div>
          </div>

          {/* 明细项目 */}
          <div>
            <Label>{dt.details}</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dt.itemDescription}</TableHead>
                  <TableHead className="text-right">{dt.quantity}</TableHead>
                  <TableHead className="text-right">{dt.unitPrice}</TableHead>
                  <TableHead className="text-right">{dt.itemAmount}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.unit_price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 金额汇总 */}
          <div className="border-t pt-4">
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span>{dt.subtotal}</span>
                <span>{invoice.currency} {invoice.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{dt.tax}</span>
                <span>{invoice.currency} {invoice.tax_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg border-t pt-2">
                <span>{dt.grandTotal}</span>
                <span>{invoice.currency} {invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div>
              <Label>{dt.notes}</Label>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {dt.close}
            </Button>
            {isAdmin && (
              <Button variant="outline" onClick={() => onSendEmail(invoice.id)}>
                {dt.sendEmail}
              </Button>
            )}
            <Button onClick={() => onDownload(invoice)}>
              <Download className="w-4 h-4 mr-2" />
              {dt.downloadPDF}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}