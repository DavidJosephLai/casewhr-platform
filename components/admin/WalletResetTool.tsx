/**
 * Wallet Reset Tool
 * 錢包歸零工具
 * 管理員專用 - 批量重置所有用戶錢包餘額
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
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  Database,
  RefreshCw,
  Shield,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface WalletSummary {
  total_wallets: number;
  total_balance: number;
  total_pending: number;
  users_with_balance: number;
}

interface ResetResult {
  success: boolean;
  wallets_reset: number;
  total_balance_cleared: number;
  total_pending_cleared: number;
  backup_created: boolean;
  backup_id?: string;
}

export function WalletResetTool() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastResetResult, setLastResetResult] = useState<ResetResult | null>(null);

  useEffect(() => {
    loadWalletSummary();
  }, []);

  const loadWalletSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/wallet-summary`,
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
        throw new Error('Failed to load wallet summary');
      }
    } catch (error) {
      console.error('Error loading wallet summary:', error);
      toast.error(
        language === 'en'
          ? 'Failed to load wallet summary'
          : '載入錢包摘要失敗'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setProcessing(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/wallet-backup`,
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
        link.download = `wallet-backup-${data.backup.backup_id}.json`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success(
          language === 'en'
            ? `✅ Backup created: ${data.backup.wallets_backed_up} wallets`
            : `✅ 備份已創建：${data.backup.wallets_backed_up} 個錢包`
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

  const handleResetAllWallets = async () => {
    if (confirmText !== 'RESET ALL WALLETS') {
      toast.error(
        language === 'en'
          ? 'Please type "RESET ALL WALLETS" to confirm'
          : '請輸入 "RESET ALL WALLETS" 以確認'
      );
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/wallet-reset`,
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
          link.download = `wallet-backup-before-reset-${data.result.backup_id}.json`;
          link.click();
          URL.revokeObjectURL(url);
        }

        toast.success(
          language === 'en'
            ? `✅ Reset Complete!\n\n${data.result.wallets_reset} wallets reset\n$${data.result.total_balance_cleared.toFixed(2)} cleared\nBackup: ${data.result.backup_id}`
            : `✅ 重置完成！\n\n${data.result.wallets_reset} 個錢包已重置\n已清除 $${data.result.total_balance_cleared.toFixed(2)}\n備份：${data.result.backup_id}`,
          { duration: 10000 }
        );

        setShowResetDialog(false);
        setConfirmText('');
        loadWalletSummary();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset wallets');
      }
    } catch (error: any) {
      console.error('Error resetting wallets:', error);
      toast.error(
        error.message || 
        (language === 'en' ? 'Failed to reset wallets' : '重置錢包失敗')
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
              ? 'This tool will PERMANENTLY reset all user wallets to zero. This action cannot be undone except by restoring from backup. Use with extreme caution!'
              : '此工具將永久重置所有用戶錢包為零。此操作無法撤銷，除非從備份還原。請謹慎使用！'}
          </p>
        </AlertDescription>
      </Alert>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {language === 'en' ? 'Current Wallet Status' : '當前錢包狀態'}
          </CardTitle>
          <CardDescription>
            {language === 'en'
              ? 'Overview of all wallets in the system'
              : '系統中所有錢包的概覽'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'en' ? 'Total Wallets' : '總錢包數'}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {summary.total_wallets}
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'en' ? 'Total Balance' : '總餘額'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ${summary.total_balance.toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'en' ? 'Total Pending' : '總待處理'}
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${summary.total_pending.toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'en' ? 'Users w/ Balance' : '有餘額用戶'}
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {summary.users_with_balance}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">{language === 'en' ? 'Loading...' : '載入中...'}</p>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadWalletSummary}
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
                <span className="text-gray-600">{language === 'en' ? 'Wallets Reset:' : '重置錢包數：'}</span>
                <span className="font-bold">{lastResetResult.wallets_reset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'en' ? 'Balance Cleared:' : '清除餘額：'}</span>
                <span className="font-bold">${lastResetResult.total_balance_cleared.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'en' ? 'Pending Cleared:' : '清除待處理：'}</span>
                <span className="font-bold">${lastResetResult.total_pending_cleared.toFixed(2)}</span>
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
                  ? 'Download a backup of all wallet data before making changes'
                  : '在進行更改之前下載所有錢包數據的備份'}
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
                {language === 'en' ? 'Reset All Wallets' : '重置所有錢包'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {language === 'en'
                  ? 'Set all wallet balances to $0.00 (backup will be created automatically)'
                  : '將所有錢包餘額設為 $0.00（將自動創建備份）'}
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
              {language === 'en' ? 'Create Wallet Backup' : '創建錢包備份'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en'
                ? 'This will create a backup of all wallet data and download it as a JSON file.'
                : '這將創建所有錢包數據的備份並將其下載為 JSON 文件。'}
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {language === 'en'
                ? 'The backup file will contain all wallet balances, pending amounts, and transaction history. Keep this file safe for disaster recovery.'
                : '備份文件將包含所有錢包餘額、待處理金額和交易歷史。請妥善保管此文件以便災難恢復。'}
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
              {language === 'en' ? '⚠️ Reset All Wallets' : '⚠️ 重置所有錢包'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en'
                ? 'This action will PERMANENTLY reset all user wallets to zero.'
                : '此操作將永久重置所有用戶錢包為零。'}
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-red-600 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900 text-sm">
              <strong>{language === 'en' ? 'What will happen:' : '將發生什麼：'}</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  {language === 'en'
                    ? `${summary?.total_wallets || 0} wallets will be reset`
                    : `${summary?.total_wallets || 0} 個錢包將被重置`}
                </li>
                <li>
                  {language === 'en'
                    ? `$${summary?.total_balance.toFixed(2) || '0.00'} will be cleared`
                    : `$${summary?.total_balance.toFixed(2) || '0.00'} 將被清除`}
                </li>
                <li>
                  {language === 'en'
                    ? 'All pending withdrawals will be cleared'
                    : '所有待處理的提款將被清除'}
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
                ? 'Type "RESET ALL WALLETS" to confirm:'
                : '輸入 "RESET ALL WALLETS" 以確認：'}
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET ALL WALLETS"
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
              onClick={handleResetAllWallets}
              disabled={processing || confirmText !== 'RESET ALL WALLETS'}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Trash2 className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Reset All Wallets' : '重置所有錢包'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}