import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, FileText, Eye } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '../utils/supabase/info';

interface ECPayPayment {
  id: string;
  payment_type: 'subscription' | 'deposit' | 'project';
  amount_twd: number;
  amount_usd: number;
  status: 'pending' | 'confirmed' | 'rejected';
  ecpay_transaction_id?: string;
  notes?: string;
  created_at: string;
  confirmed_at?: string;
}

export function MyECPayPayments() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [payments, setPayments] = useState<ECPayPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const content = {
    en: {
      title: 'My ECPay Payments',
      description: 'View your ECPay payment history',
      noPayments: 'No payment records yet',
      noPaymentsDesc: 'Your ECPay payment submissions will appear here',
      refresh: 'Refresh',
      type: 'Type',
      amount: 'Amount',
      status: 'Status',
      date: 'Date',
      transactionId: 'Transaction ID',
      types: {
        subscription: 'Subscription',
        deposit: 'Wallet Deposit',
        project: 'Project',
      },
      statuses: {
        pending: 'Pending',
        confirmed: 'Confirmed',
        rejected: 'Rejected',
      },
      loadError: 'Failed to load payments',
    },
    zh: {
      title: '我的綠界付款',
      description: '查看您的綠界付款歷史',
      noPayments: '暫無付款記錄',
      noPaymentsDesc: '您提交的綠界付款記錄將顯示在這裡',
      refresh: '重新整理',
      type: '類型',
      amount: '金額',
      status: '狀態',
      date: '日期',
      transactionId: '交易編號',
      types: {
        subscription: '訂閱',
        deposit: '錢包儲值',
        project: '項目',
      },
      statuses: {
        pending: '待確認',
        confirmed: '已確認',
        rejected: '已拒絕',
      },
      loadError: '載入付款記錄失敗',
    },
  };

  const t = content[language];

  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay-payments/my-payments`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      } else {
        console.error('Failed to load payments');
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            {t.statuses.pending}
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t.statuses.confirmed}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            {t.statuses.rejected}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'subscription':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            {t.types.subscription}
          </Badge>
        );
      case 'deposit':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
            {t.types.deposit}
          </Badge>
        );
      case 'project':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
            {t.types.project}
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'zh' ? 'zh-TW' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayments}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            載入中...
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="font-medium">{t.noPayments}</p>
            <p className="text-sm mt-2">{t.noPaymentsDesc}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.type}</TableHead>
                  <TableHead>{t.amount}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.transactionId}</TableHead>
                  <TableHead>{t.date}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{getTypeBadge(payment.payment_type)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">NT${payment.amount_twd.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">${payment.amount_usd}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {payment.ecpay_transaction_id || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(payment.created_at)}</div>
                        {payment.confirmed_at && (
                          <div className="text-xs text-gray-500">
                            確認: {formatDate(payment.confirmed_at)}
                          </div>
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
  );
}
