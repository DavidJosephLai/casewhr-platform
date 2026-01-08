/**
 * 🏦 Transfer History Component
 * 
 * 顯示用戶的轉帳歷史記錄
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2,
  FileText,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { projectId } from '../utils/supabase/info';
import { formatCurrency, convertCurrency } from '../lib/currency';

interface TransferRecord {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  fee: number;
  total_deduction: number;
  note: string;
  status: string;
  created_at: string;
  completed_at: string;
}

interface TransferHistory {
  sent: TransferRecord[];
  received: TransferRecord[];
}

export function TransferHistory() {
  const { user, accessToken } = useAuth();
  const { language, currency } = useLanguage();
  
  const [history, setHistory] = useState<TransferHistory>({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);

  const t = {
    en: {
      title: 'Transfer History',
      description: 'View your transfer transactions',
      sent: 'Sent',
      received: 'Received',
      to: 'To:',
      from: 'From:',
      amount: 'Amount',
      fee: 'Fee',
      total: 'Total',
      note: 'Note',
      date: 'Date',
      noSent: 'No sent transfers yet',
      noReceived: 'No received transfers yet',
      transferId: 'Transfer ID'
    },
    'zh-CN': {
      title: '转账记录',
      description: '查看您的转账交易',
      sent: '已发送',
      received: '已接收',
      to: '收款人：',
      from: '发送人：',
      amount: '金额',
      fee: '手续费',
      total: '总计',
      note: '备注',
      date: '日期',
      noSent: '暂无发送记录',
      noReceived: '暂无接收记录',
      transferId: '转账 ID'
    },
    'zh-TW': {
      title: '轉帳記錄',
      description: '查看您的轉帳交易',
      sent: '已發送',
      received: '已接收',
      to: '收款人：',
      from: '發送人：',
      amount: '金額',
      fee: '手續費',
      total: '總計',
      note: '備註',
      date: '日期',
      noSent: '暫無發送記錄',
      noReceived: '暫無接收記錄',
      transferId: '轉帳 ID'
    }
  };

  const text = t[language] || t.en;

  useEffect(() => {
    fetchHistory();
    
    // 監聽錢包更新事件
    const handleWalletUpdate = () => {
      fetchHistory();
    };
    
    window.addEventListener('wallet-updated', handleWalletUpdate);
    
    return () => {
      window.removeEventListener('wallet-updated', handleWalletUpdate);
    };
  }, [user, accessToken]);

  const fetchHistory = async () => {
    if (!user || !accessToken) return;

    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/transfer/history`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        // ✅ 確保數據結構正確
        setHistory({
          sent: Array.isArray(data?.sent) ? data.sent : [],
          received: Array.isArray(data?.received) ? data.received : []
        });
      } else {
        // 如果 API 失敗，設置空數組
        console.error('Failed to fetch transfer history:', response.status);
        setHistory({ sent: [], received: [] });
      }
    } catch (error) {
      console.error('Error fetching transfer history:', error);
      // 發生錯誤時也設置空數組
      setHistory({ sent: [], received: [] });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === 'zh-CN' ? 'zh-CN' : language === 'zh-TW' ? 'zh-TW' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">
              {language === 'en' ? 'Loading transfer history...' : '載入轉帳記錄中...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {text.title}
        </CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              {text.received} ({history?.received?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="sent">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              {text.sent} ({history?.sent?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4 mt-4">
            {history.received.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ArrowDownLeft className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>{text.noReceived}</p>
              </div>
            ) : (
              history.received.map((transfer) => (
                <div
                  key={transfer.id}
                  className="p-4 border rounded-lg bg-green-50 border-green-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <ArrowDownLeft className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium text-green-900">{text.from} {transfer.from_user_id.substring(0, 8)}...</div>
                        <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transfer.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        +{formatCurrency(convertCurrency(transfer.amount, 'USD', currency), currency)}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs bg-green-100 text-green-700 border-green-300">
                        {transfer.status}
                      </Badge>
                    </div>
                  </div>
                  {transfer.note && (
                    <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded border border-green-200">
                      💬 {transfer.note}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {text.transferId}: {transfer.id.substring(0, 16)}...
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4 mt-4">
            {history.sent.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ArrowUpRight className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>{text.noSent}</p>
              </div>
            ) : (
              history.sent.map((transfer) => (
                <div
                  key={transfer.id}
                  className="p-4 border rounded-lg bg-orange-50 border-orange-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-medium text-orange-900">{text.to} {transfer.to_user_id.substring(0, 8)}...</div>
                        <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transfer.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-orange-600">
                        -{formatCurrency(convertCurrency(transfer.total_deduction, 'USD', currency), currency)}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs bg-orange-100 text-orange-700 border-orange-300">
                        {transfer.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2 rounded border border-orange-200">
                      <div className="text-gray-600">{text.amount}</div>
                      <div className="font-medium">
                        {formatCurrency(convertCurrency(transfer.amount, 'USD', currency), currency)}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border border-orange-200">
                      <div className="text-gray-600">{text.fee}</div>
                      <div className="font-medium">
                        {formatCurrency(convertCurrency(transfer.fee, 'USD', currency), currency)}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border border-orange-200">
                      <div className="text-gray-600">{text.total}</div>
                      <div className="font-medium font-bold">
                        {formatCurrency(convertCurrency(transfer.total_deduction, 'USD', currency), currency)}
                      </div>
                    </div>
                  </div>
                  {transfer.note && (
                    <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded border border-orange-200">
                      💬 {transfer.note}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {text.transferId}: {transfer.id.substring(0, 16)}...
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}