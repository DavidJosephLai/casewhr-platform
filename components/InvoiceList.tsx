import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Pagination } from "./Pagination";

interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  date: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  total: number;
  currency: string;
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
}

export function InvoiceList() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  const content = {
    en: {
      title: 'Invoices',
      description: 'View and download your invoices',
      noInvoices: 'No invoices found',
      invoiceNumber: 'Invoice',
      date: 'Date',
      amount: 'Amount',
      status: 'Status',
      actions: 'Actions',
      view: 'View',
      download: 'Download',
      preview: 'Invoice Preview',
      statuses: {
        paid: 'Paid',
        pending: 'Pending',
        overdue: 'Overdue',
        cancelled: 'Cancelled',
      },
      downloading: 'Downloading...',
      downloadSuccess: 'Invoice downloaded',
      downloadError: 'Failed to download invoice',
    },
    'zh-TW': {
      title: '發票',
      description: '查看和下載您的發票',
      noInvoices: '沒有找到發票',
      invoiceNumber: '發票',
      date: '日期',
      amount: '金額',
      status: '狀態',
      actions: '操作',
      view: '查看',
      download: '下載',
      preview: '發票預覽',
      statuses: {
        paid: '已付款',
        pending: '待付款',
        overdue: '逾期',
        cancelled: '已取消',
      },
      downloading: '下載中...',
      downloadSuccess: '發票已下載',
      downloadError: '下載發票失敗',
    },
    'zh-CN': {
      title: '发票',
      description: '查看和下载您的发票',
      noInvoices: '没有找到发票',
      invoiceNumber: '发票',
      date: '日期',
      amount: '金额',
      status: '状态',
      actions: '操作',
      view: '查看',
      download: '下载',
      preview: '发票预览',
      statuses: {
        paid: '已付款',
        pending: '待付款',
        overdue: '逾期',
        cancelled: '已取消',
      },
      downloading: '下载中...',
      downloadSuccess: '发票已下载',
      downloadError: '下载发票失败',
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  useEffect(() => {
    if (user?.id && accessToken) {
      loadInvoices();
    }
  }, [user?.id, accessToken]);

  const loadInvoices = async () => {
    if (!user?.id || !accessToken) return;

    setLoading(true);
    try {
      console.log('🔍 [InvoiceList] Fetching invoices...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invoices`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      console.log('📡 [InvoiceList] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [InvoiceList] Received data:', data);
        setInvoices(data.invoices || []);
        setTotalPages(Math.ceil(data.invoices.length / itemsPerPage));
      } else if (response.status === 401) {
        // Silently handle auth errors - user might not be authenticated
        console.log('⚠️ [InvoiceList] Not authenticated, skipping');
        return;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [InvoiceList] Error response:', response.status, errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to load invoices');
      }
    } catch (error) {
      // Check if it's an auth error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('401') || errorMessage.includes('Invalid JWT')) {
        console.log('⚠️ [InvoiceList] Auth error, skipping');
        return;
      }
      console.error('❌ [InvoiceList] Error loading invoices:', error);
      toast.error(language === 'en' ? `Failed to load invoices: ${errorMessage}` : `載入發票失敗：${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invoices/${invoiceId}/html?lang=${language}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const html = await response.text();
        setPreviewHtml(html);
        setShowPreview(true);
      } else {
        throw new Error('Failed to load invoice');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error(language === 'en' ? 'Failed to load invoice' : '載入發票失敗');
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/invoices/${invoiceId}/download?lang=${language}`,
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
        link.download = `invoice_${invoiceNumber}.html`;
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

  const getStatusBadge = (status: Invoice['status']) => {
    const variants: Record<Invoice['status'], 'default' | 'secondary' | 'destructive'> = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
      cancelled: 'secondary',
    };

    return (
      <Badge variant={variants[status]}>
        {t.statuses[status]}
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

  const currentInvoices = invoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.noInvoices}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {invoice.invoice_number}
                        </p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(invoice.date)}
                      </p>
                      {invoice.payment_method && (
                        <p className="text-xs text-gray-400 mt-1">
                          {invoice.payment_method}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {invoice.currency === 'USD' ? '$' : ''}{invoice.total.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t.view}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_number)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t.download}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {invoices.length > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  language={language}
                />
              )}
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
          </DialogHeader>
          <div 
            className="border rounded-lg overflow-hidden"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}