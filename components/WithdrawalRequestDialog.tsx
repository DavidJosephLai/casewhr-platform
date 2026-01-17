/**
 * Withdrawal Request Dialog Component
 * 提款申請對話框組件
 * 用戶申請提款到已綁定的銀行帳戶
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Textarea } from './ui/textarea';
import { 
  AlertCircle, 
  Building2, 
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { formatCurrency, convertCurrency, type Currency } from '../lib/currency';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  currency: 'TWD' | 'USD' | 'CNY';
  is_default: boolean;
  is_verified: boolean;
}

interface WithdrawalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number; // USD
  onSuccess: () => void;
  selectedCurrency: Currency;
}

export function WithdrawalRequestDialog({
  open,
  onOpenChange,
  availableBalance,
  onSuccess,
  selectedCurrency,
}: WithdrawalRequestDialogProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open && user) {
      loadBankAccounts();
    }
  }, [open, user]);

  const loadBankAccounts = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/bank-accounts/${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const accounts = data.bank_accounts || [];
        setBankAccounts(accounts);
        
        // 自動選擇預設帳戶
        const defaultAccount = accounts.find((acc: BankAccount) => acc.is_default);
        if (defaultAccount) {
          setSelectedAccountId(defaultAccount.id);
        } else if (accounts.length > 0) {
          setSelectedAccountId(accounts[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    }
  };

  const handleSubmitRequest = async () => {
    const withdrawalAmount = parseFloat(amount);

    if (!withdrawalAmount || withdrawalAmount <= 0) {
      toast.error(
        language === 'en' 
          ? 'Please enter a valid amount' 
          : '請輸入有效金額'
      );
      return;
    }

    if (!selectedAccountId) {
      toast.error(
        language === 'en'
          ? 'Please select a bank account'
          : '請選擇銀行帳戶'
      );
      return;
    }

    // 轉換為 USD 進行比較
    const displayedBalance = selectedCurrency === 'USD'
      ? availableBalance
      : convertCurrency(availableBalance, 'USD', selectedCurrency);

    if (withdrawalAmount > displayedBalance) {
      toast.error(
        language === 'en'
          ? 'Insufficient balance'
          : '餘額不足'
      );
      return;
    }

    // 轉換輸入金額為 USD（後端統一用 USD）
    const usdAmount = selectedCurrency === 'USD'
      ? withdrawalAmount
      : convertCurrency(withdrawalAmount, selectedCurrency, 'USD');

    try {
      setLoading(true);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/withdrawal-requests`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bank_account_id: selectedAccountId,
            amount: usdAmount,
            currency: selectedCurrency,
            note: note.trim() || undefined,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(
          language === 'en'
            ? `✅ Withdrawal request submitted!\n\nRequest ID: ${data.request.id}\nAmount: ${formatCurrency(withdrawalAmount, selectedCurrency)}\nStatus: Pending Review`
            : `✅ 提款申請已提交！\n\n申請編號：${data.request.id}\n金額：${formatCurrency(withdrawalAmount, selectedCurrency)}\n狀態：待審核`,
          { duration: 8000 }
        );
        setAmount('');
        setNote('');
        onOpenChange(false);
        onSuccess();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit withdrawal request');
      }
    } catch (error: any) {
      console.error('Error submitting withdrawal request:', error);
      toast.error(
        error.message || 
        (language === 'en' ? 'Failed to submit request' : '提交申請失敗')
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = bankAccounts.find(acc => acc.id === selectedAccountId);

  const displayedBalance = selectedCurrency === 'USD'
    ? availableBalance
    : convertCurrency(availableBalance, 'USD', selectedCurrency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Request Withdrawal' : '申請提款'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en'
              ? 'Submit a withdrawal request to your bank account'
              : '提交提款申請到您的銀行帳戶'}
          </DialogDescription>
        </DialogHeader>

        {bankAccounts.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {language === 'en'
                ? 'No bank accounts found. Please add a bank account first.'
                : '未找到銀行帳戶。請先新增銀行帳戶。'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4 py-4">
            {/* Available Balance */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">
                {language === 'en' ? 'Available Balance' : '可用餘額'}
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(displayedBalance, selectedCurrency)}
              </div>
            </div>

            {/* Bank Account Selection */}
            <div>
              <Label htmlFor="bank_account">
                {language === 'en' ? 'Withdraw to' : '提款至'}
              </Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>
                          {account.bank_name} - {account.account_number}
                          {account.is_default && ` (${language === 'en' ? 'Default' : '預設'})`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Bank Account Details */}
              {selectedAccount && (
                <div className="mt-2 p-3 bg-gray-50 rounded border text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Account Name:' : '戶名：'}
                    </span>
                    <span className="font-medium">{selectedAccount.account_name}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Currency:' : '幣別：'}
                    </span>
                    <span className="font-medium">{selectedAccount.currency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Status:' : '狀態：'}
                    </span>
                    {selectedAccount.is_verified ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        {language === 'en' ? 'Verified' : '已驗證'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <AlertCircle className="h-3 w-3" />
                        {language === 'en' ? 'Pending' : '待驗證'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Withdrawal Amount */}
            <div>
              <Label htmlFor="amount">
                {language === 'en' ? `Amount (${selectedCurrency})` : `金額 (${selectedCurrency})`}
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={selectedCurrency === 'USD' ? '0.00' : '0'}
                step={selectedCurrency === 'USD' ? '0.01' : '1'}
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === 'en'
                  ? `Maximum: ${formatCurrency(displayedBalance, selectedCurrency)}`
                  : `最多：${formatCurrency(displayedBalance, selectedCurrency)}`}
              </p>
            </div>

            {/* Note */}
            <div>
              <Label htmlFor="note">
                {language === 'en' ? 'Note (Optional)' : '備註（選填）'}
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'Add any additional information...'
                    : '新增任何額外資訊...'
                }
                rows={3}
              />
            </div>

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {language === 'en'
                  ? '⏱️ Processing time: 1-3 business days\n💰 The amount will be deducted immediately and held pending\n📧 You will receive email notifications at each status update'
                  : '⏱️ 處理時間：1-3 個工作天\n💰 金額將立即扣除並暫時凍結\n📧 每次狀態更新時您都會收到郵件通知'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {language === 'en' ? 'Cancel' : '取消'}
          </Button>
          <Button 
            onClick={handleSubmitRequest} 
            disabled={loading || bankAccounts.length === 0}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {language === 'en' ? 'Submit Request' : '提交申請'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}