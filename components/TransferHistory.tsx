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

export function TransferHistory() {
  const { user, accessToken } = useAuth();
  const { language, currency } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<{
    sent: TransferRecord[];
    received: TransferRecord[];
  }>({ sent: [], received: [] });

  const text = {
    en: {
      title: 'Transfer History',
      description: 'View your transfer history',
      received: 'Received',
      sent: 'Sent',
      noReceived: 'No received transfers yet',
      noSent: 'No sent transfers yet',
      from: 'From:',
      to: 'To:',
      amount: 'Amount',
      fee: 'Fee',
      total: 'Total',
      transferId: 'Transfer ID'
    },
    'zh-TW': {
      title: '轉帳歷史',
      description: '查看您的轉帳記錄',
      received: '收款記錄',
      sent: '付款記錄',
      noReceived: '暫無收款記錄',
      noSent: '暫無付款記錄',
      from: '來自:',
      to: '收款人:',
      amount: '金額',
      fee: '手續費',
      total: '總計',
      transferId: '轉帳 ID'
    },
    'zh-CN': {
      title: '转账历史',
      description: '查看您的转账记录',
      received: '收款记录',
      sent: '付款记录',
      noReceived: '暂无收款记录',
      noSent: '暂无付款记录',
      from: '来自:',
      to: '收款人:',
      amount: '金额',
      fee: '手续费',
      total: '总计',
      transferId: '转账 ID'
    }
  }[language] || text.en;

  useEffect(() => {
    fetchTransferHistory();
    
    // 🔄 監聽錢包更新事件，自動刷新轉帳歷史
    const handleWalletUpdate = () => {
      console.log('🔄 [TransferHistory] Wallet updated, refreshing transfer history...');
      fetchTransferHistory();
    };
    
    window.addEventListener('wallet-updated', handleWalletUpdate);
    
    return () => {
      window.removeEventListener('wallet-updated', handleWalletUpdate);
    };
  }, [accessToken]);

  const fetchTransferHistory = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/transfer/history`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        setHistory({
          sent: Array.isArray(data.sent) ? data.sent : [],
          received: Array.isArray(data.received) ? data.received : []
        });
      } else {
        console.error('Failed to fetch transfer history:', response.status);
        setHistory({ sent: [], received: [] });
      }
    } catch (error) {
      console.error('Error fetching transfer history:', error);
      setHistory({ sent: [], received: [] });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // 🐛 修復：先檢查是否是有效的日期字符串
      if (!dateString) {
        return language === 'en' ? 'Invalid Date' : '無效日期';
      }
      
      const date = new Date(dateString);
      
      // 檢查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn('⚠️ [TransferHistory] Invalid date:', dateString);
        return language === 'en' ? 'Invalid Date' : '無效日期';
      }
      
      return date.toLocaleString(language === 'zh-CN' ? 'zh-CN' : language === 'zh-TW' ? 'zh-TW' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('❌ [TransferHistory] Error formatting date:', error);
      return language === 'en' ? 'Invalid Date' : '無效日期';
    }
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
        <Tabs defaultValue="sent" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sent">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              {text.sent} ({history.sent.length})
            </TabsTrigger>
            <TabsTrigger value="received">
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              {text.received} ({history.received.length})
            </TabsTrigger>
          </TabsList>

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
                        <div className="font-medium text-orange-900">
                          {text.to} {transfer.to_user_id.substring(0, 8)}...
                        </div>
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
                        <div className="font-medium text-green-900">
                          {text.from} {transfer.from_user_id.substring(0, 8)}...
                        </div>
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
        </Tabs>
      </CardContent>
    </Card>
  );
}