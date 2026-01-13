/**
 * Revenue Reset Tool
 * 平台收入歸零工具
 * 管理員專用 - 批量重置所有平台收入數據
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  AlertTriangle, 
  Trash2, 
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RefreshCw,
  Shield,
  DollarSign,
  CreditCard,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface RevenueSummary {
  total_subscription_revenue: number;
  total_service_fee_revenue: number;
  total_revenue: number;
  total_subscription_transactions: number;
  total_service_fee_transactions: number;
  total_transactions: number;
  active_subscriptions: number;
}

interface ResetResult {
  success: boolean;
  subscription_transactions_deleted: number;
  service_fee_transactions_deleted: number;
  total_transactions_deleted: number;
  total_revenue_cleared: number;
  subscriptions_cancelled: number;
  backup_created: boolean;
  backup_id?: string;
}

export function RevenueResetTool() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastResetResult, setLastResetResult] = useState<ResetResult | null>(null);

  useEffect(() => {
    loadRevenueSummary();
  }, []);

  const loadRevenueSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/revenue-summary`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      } else {
        throw new Error('Failed to load revenue summary');
      }
    } catch (error) {
      console.error('Error loading revenue summary:', error);
      toast.error(
        language === 'en'
          ? 'Failed to load revenue summary'
          : '載入收入摘要失敗'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setProcessing(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/revenue-backup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Download backup as JSON file
        const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `revenue-backup-${data.backup.backup_id}.json`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success(
          language === 'en'
            ? `✅ Backup created: ${data.backup.transactions_backed_up} transactions`
            : `✅ 備份已創建：${data.backup.transactions_backed_up} 筆交易`
        );
        setShowBackupDialog(false);
      } else {
        throw new Error('Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error(
        language === 'en'
          ? 'Failed to create backup'
          : '創建備份失敗'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleResetAllRevenue = async () => {
    if (confirmText !== 'RESET ALL REVENUE') {
      toast.error(
        language === 'en'
          ? 'Please type "RESET ALL REVENUE" to confirm'
          : '請輸入 "RESET ALL REVENUE" 以確認'
      );
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/revenue-reset`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            create_backup: true,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLastResetResult(data.result);

        // Download backup if created
        if (data.result.backup_created && data.backup_data) {
          const blob = new Blob([JSON.stringify(data.backup_data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `revenue-backup-before-reset-${data.result.backup_id}.json`;
          link.click();
          URL.revokeObjectURL(url);
        }

        toast.success(
          language === 'en'
            ? `✅ Reset Complete!\n\n${data.result.total_transactions_deleted} transactions deleted\n$${data.result.total_revenue_cleared.toFixed(2)} revenue cleared\n${data.result.subscriptions_cancelled} subscriptions cancelled\nBackup: ${data.result.backup_id}`
            : `✅ 重置完成！\n\n${data.result.total_transactions_deleted} 筆交易已刪除\n已清除 $${data.result.total_revenue_cleared.toFixed(2)} 收入\n${data.result.subscriptions_cancelled} 個訂閱已取消\n備份：${data.result.backup_id}`,
          { duration: 10000 }
        );

        setShowResetDialog(false);
        setConfirmText('');
        loadRevenueSummary();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset revenue');
      }
    } catch (error: any) {
      console.error('Error resetting revenue:', error);
      toast.error(
        error.message || 
        (language === 'en' ? 'Failed to reset revenue' : '重置收入失敗')
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Alert className="border-red-600 bg-red-50">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-900">
          <strong>{language === 'en' ? '⚠️ DANGER ZONE' : '⚠️ 危險區域'}</strong>
          <p className="mt-2">
            {language === 'en'
              ? 'This tool will PERMANENTLY delete all platform revenue records and cancel all subscriptions. This action cannot be undone except by restoring from backup. Use with extreme caution!'
              : '此工具將永久刪除所有平台收入記錄並取消所有訂閱。此操作無法撤銷，除非從備份還原。請謹慎使用！'}
          </p>
        </AlertDescription>
      </Alert>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {language === 'en' ? 'Current Revenue Status' : '當前收入狀態'}
          </CardTitle>
          <CardDescription>
            {language === 'en'
              ? 'Overview of all platform revenue in the system'
              : '系統中所有平台收入的概覽'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary ? (
            <div className="space-y-4">
              {/* Revenue Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-gray-600">
                      {language === 'en' ? 'Total Revenue' : '總收入'}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    ${summary.total_revenue.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-gray-600">
                      {language === 'en' ? 'Subscription Revenue' : '訂閱收入'}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    ${summary.total_subscription_revenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.total_subscription_transactions} {language === 'en' ? 'transactions' : '筆交易'}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="h-5 w-5 text-purple-600" />
                    <p className="text-sm text-gray-600">
                      {language === 'en' ? 'Service Fee Revenue' : '服務費收入'}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    ${summary.total_service_fee_revenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.total_service_fee_transactions} {language === 'en' ? 'transactions' : '筆交易'}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600 mb-1">
                    {language === 'en' ? 'Total Transactions' : '總交易數'}
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {summary.total_transactions}
                  </p>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600 mb-1">
                    {language === 'en' ? 'Active Subscriptions' : '活躍訂閱數'}
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {summary.active_subscriptions}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">{language === 'en' ? 'Loading...' : '載入中...'}</p>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadRevenueSummary}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Refresh' : '刷新'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Reset Result */}
      {lastResetResult && (
        <Card className="border-green-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              {language === 'en' ? 'Last Reset Result' : '上次重置結果'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'en' ? 'Transactions Deleted:' : '刪除交易數：'}</span>
                <span className="font-bold">{lastResetResult.total_transactions_deleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'en' ? 'Revenue Cleared:' : '清除收入：'}</span>
                <span className="font-bold">${lastResetResult.total_revenue_cleared.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'en' ? 'Subscriptions Cancelled:' : '取消訂閱數：'}</span>
                <span className="font-bold">{lastResetResult.subscriptions_cancelled}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'en' ? 'Backup Created:' : '已創建備份：'}</span>
                <span className="font-bold">
                  {lastResetResult.backup_created ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {language === 'en' ? 'Yes' : '是'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      {language === 'en' ? 'No' : '否'}
                    </Badge>
                  )}
                </span>
              </div>
              {lastResetResult.backup_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'en' ? 'Backup ID:' : '備份 ID：'}</span>
                  <span className="font-mono text-xs">{lastResetResult.backup_id}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {language === 'en' ? 'Actions' : '操作'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Backup */}
          <div className="flex items-start justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h4 className="font-semibold flex items-center gap-2">
                <Download className="h-4 w-4" />
                {language === 'en' ? 'Create Backup' : '創建備份'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {language === 'en'
                  ? 'Download a backup of all revenue data before making changes'
                  : '在進行更改之前下載所有收入數據的備份'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowBackupDialog(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Backup' : '備份'}
            </Button>
          </div>

          {/* Reset */}
          <div className="flex items-start justify-between p-4 border border-red-300 rounded-lg bg-red-50">
            <div className="flex-1">
              <h4 className="font-semibold flex items-center gap-2 text-red-600">
                <Trash2 className="h-4 w-4" />
                {language === 'en' ? 'Reset All Revenue' : '重置所有收入'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {language === 'en'
                  ? 'Delete all revenue transactions and cancel all subscriptions (backup will be created automatically)'
                  : '刪除所有收入交易並取消所有訂閱（將自動創建備份）'}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowResetDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Reset All' : '全部重置'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Create Revenue Backup' : '創建收入備份'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en'
                ? 'This will create a backup of all revenue data and download it as a JSON file.'
                : '這將創建所有收入數據的備份並將其下載為 JSON 文件。'}
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {language === 'en'
                ? 'The backup file will contain all revenue transactions, subscriptions, and related data. Keep this file safe for disaster recovery.'
                : '備份文件將包含所有收入交易、訂閱和相關數據。請妥善保管此文件以便災難恢復。'}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBackupDialog(false)}
              disabled={processing}
            >
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button onClick={handleCreateBackup} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Download className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Create & Download' : '創建並下載'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              {language === 'en' ? '⚠️ Reset All Revenue' : '⚠️ 重置所有收入'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en'
                ? 'This action will PERMANENTLY delete all revenue records and cancel all subscriptions.'
                : '此操作將永久刪除所有收入記錄並取消所有訂閱。'}
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-red-600 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900 text-sm">
              <strong>{language === 'en' ? 'What will happen:' : '將發生什麼：'}</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  {language === 'en'
                    ? `${summary?.total_transactions || 0} revenue transactions will be deleted`
                    : `${summary?.total_transactions || 0} 筆收入交易將被刪除`}
                </li>
                <li>
                  {language === 'en'
                    ? `$${summary?.total_revenue.toFixed(2) || '0.00'} revenue will be cleared`
                    : `$${summary?.total_revenue.toFixed(2) || '0.00'} 收入將被清除`}
                </li>
                <li>
                  {language === 'en'
                    ? `${summary?.active_subscriptions || 0} active subscriptions will be cancelled`
                    : `${summary?.active_subscriptions || 0} 個活躍訂閱將被取消`}
                </li>
                <li>
                  {language === 'en'
                    ? 'A backup will be created automatically'
                    : '將自動創建備份'}
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-red-600">
              {language === 'en'
                ? 'Type "RESET ALL REVENUE" to confirm:'
                : '輸入 "RESET ALL REVENUE" 以確認：'}
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET ALL REVENUE"
              className="font-mono"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetDialog(false);
                setConfirmText('');
              }}
              disabled={processing}
            >
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetAllRevenue}
              disabled={processing || confirmText !== 'RESET ALL REVENUE'}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Trash2 className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Reset All Revenue' : '重置所有收入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
