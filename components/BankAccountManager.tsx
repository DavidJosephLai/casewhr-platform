/**
 * Bank Account Manager Component
 * 銀行帳戶管理組件
 * 支援新增、編輯、刪除和設定預設銀行帳戶
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  bank_code?: string;
  account_number: string;
  account_name: string;
  branch_name?: string;
  branch_code?: string;
  account_type: 'checking' | 'savings';
  currency: 'TWD' | 'USD' | 'CNY';
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export function BankAccountManager() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_name: '',
    branch_name: '',
    branch_code: '',
    account_type: 'savings' as 'checking' | 'savings',
    currency: 'TWD' as 'TWD' | 'USD' | 'CNY',
  });

  useEffect(() => {
    if (user) {
      loadBankAccounts();
    }
  }, [user]);

  const loadBankAccounts = async () => {
    try {
      setLoading(true);
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
        setAccounts(data.bank_accounts || []);
      } else {
        throw new Error('Failed to load bank accounts');
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to load bank accounts' 
          : '載入銀行帳戶失敗'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!formData.bank_name || !formData.account_number || !formData.account_name) {
      toast.error(
        language === 'en'
          ? 'Please fill in all required fields'
          : '請填寫所有必填欄位'
      );
      return;
    }

    try {
      const url = editingAccount
        ? `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/bank-accounts/${editingAccount.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/bank-accounts`;

      const response = await fetch(url, {
        method: editingAccount ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          language === 'en'
            ? editingAccount ? 'Bank account updated' : 'Bank account added'
            : editingAccount ? '銀行帳戶已更新' : '銀行帳戶已新增'
        );
        setShowAddDialog(false);
        setEditingAccount(null);
        resetForm();
        loadBankAccounts();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save bank account');
      }
    } catch (error: any) {
      console.error('Error saving bank account:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to save bank account' : '儲存銀行帳戶失敗'));
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm(language === 'en' ? 'Are you sure you want to delete this bank account?' : '確定要刪除此銀行帳戶嗎？')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/bank-accounts/${accountId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast.success(language === 'en' ? 'Bank account deleted' : '銀行帳戶已刪除');
        loadBankAccounts();
      } else {
        throw new Error('Failed to delete bank account');
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.error(language === 'en' ? 'Failed to delete bank account' : '刪除銀行帳戶失敗');
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/bank-accounts/${accountId}/set-default`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast.success(language === 'en' ? 'Default account updated' : '預設帳戶已更新');
        loadBankAccounts();
      } else {
        throw new Error('Failed to set default account');
      }
    } catch (error) {
      console.error('Error setting default account:', error);
      toast.error(language === 'en' ? 'Failed to set default account' : '設定預設帳戶失敗');
    }
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      bank_name: account.bank_name,
      bank_code: account.bank_code || '',
      account_number: account.account_number,
      account_name: account.account_name,
      branch_name: account.branch_name || '',
      branch_code: account.branch_code || '',
      account_type: account.account_type,
      currency: account.currency,
    });
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      bank_name: '',
      bank_code: '',
      account_number: '',
      account_name: '',
      branch_name: '',
      branch_code: '',
      account_type: 'savings',
      currency: 'TWD',
    });
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setEditingAccount(null);
    setShowAddDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {language === 'en' ? 'Bank Accounts' : '銀行帳戶'}
              </CardTitle>
              <CardDescription>
                {language === 'en'
                  ? 'Manage your bank accounts for withdrawals'
                  : '管理您的銀行帳戶以便提款'}
              </CardDescription>
            </div>
            <Button onClick={handleOpenAddDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Add Account' : '新增帳戶'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>{language === 'en' ? 'No bank accounts added' : '尚未新增銀行帳戶'}</p>
              <p className="text-sm mt-2">
                {language === 'en'
                  ? 'Add a bank account to request withdrawals'
                  : '新增銀行帳戶以申請提款'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="border rounded-lg p-4 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{account.bank_name}</h4>
                        {account.is_default && (
                          <Badge variant="default">
                            {language === 'en' ? 'Default' : '預設'}
                          </Badge>
                        )}
                        {account.is_verified ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {language === 'en' ? 'Verified' : '已驗證'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {language === 'en' ? 'Pending' : '待驗證'}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">
                            {language === 'en' ? 'Account Name:' : '戶名：'}
                          </span>{' '}
                          {account.account_name}
                        </div>
                        <div>
                          <span className="font-medium">
                            {language === 'en' ? 'Account Number:' : '帳號：'}
                          </span>{' '}
                          {account.account_number}
                        </div>
                        {account.branch_name && (
                          <div>
                            <span className="font-medium">
                              {language === 'en' ? 'Branch:' : '分行：'}
                            </span>{' '}
                            {account.branch_name}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">
                            {language === 'en' ? 'Currency:' : '幣別：'}
                          </span>{' '}
                          {account.currency}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!account.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(account.id)}
                        >
                          {language === 'en' ? 'Set Default' : '設為預設'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAccount(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAccount(account.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Bank Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAccount
                ? language === 'en' ? 'Edit Bank Account' : '編輯銀行帳戶'
                : language === 'en' ? 'Add Bank Account' : '新增銀行帳戶'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en'
                ? 'Enter your bank account details for withdrawals'
                : '輸入您的銀行帳戶資訊以便提款'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Bank Name */}
            <div className="col-span-2">
              <Label htmlFor="bank_name">
                {language === 'en' ? 'Bank Name' : '銀行名稱'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder={language === 'en' ? 'e.g., First Bank' : '例如：第一銀行'}
              />
            </div>

            {/* Bank Code */}
            <div>
              <Label htmlFor="bank_code">
                {language === 'en' ? 'Bank Code' : '銀行代碼'}
              </Label>
              <Input
                id="bank_code"
                value={formData.bank_code}
                onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                placeholder={language === 'en' ? 'e.g., 007' : '例如：007'}
              />
            </div>

            {/* Branch Code */}
            <div>
              <Label htmlFor="branch_code">
                {language === 'en' ? 'Branch Code' : '分行代碼'}
              </Label>
              <Input
                id="branch_code"
                value={formData.branch_code}
                onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                placeholder={language === 'en' ? 'e.g., 0011' : '例如：0011'}
              />
            </div>

            {/* Branch Name */}
            <div className="col-span-2">
              <Label htmlFor="branch_name">
                {language === 'en' ? 'Branch Name' : '分行名稱'}
              </Label>
              <Input
                id="branch_name"
                value={formData.branch_name}
                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                placeholder={language === 'en' ? 'e.g., Taipei Main Branch' : '例如：台北分行'}
              />
            </div>

            {/* Account Number */}
            <div className="col-span-2">
              <Label htmlFor="account_number">
                {language === 'en' ? 'Account Number' : '帳號'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder={language === 'en' ? 'Enter account number' : '輸入帳號'}
              />
            </div>

            {/* Account Name */}
            <div className="col-span-2">
              <Label htmlFor="account_name">
                {language === 'en' ? 'Account Holder Name' : '戶名'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder={language === 'en' ? 'Enter account holder name' : '輸入戶名'}
              />
            </div>

            {/* Account Type */}
            <div>
              <Label htmlFor="account_type">
                {language === 'en' ? 'Account Type' : '帳戶類型'}
              </Label>
              <Select
                value={formData.account_type}
                onValueChange={(value: 'checking' | 'savings') =>
                  setFormData({ ...formData, account_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">
                    {language === 'en' ? 'Savings' : '儲蓄帳戶'}
                  </SelectItem>
                  <SelectItem value="checking">
                    {language === 'en' ? 'Checking' : '支票帳戶'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Currency */}
            <div>
              <Label htmlFor="currency">
                {language === 'en' ? 'Currency' : '幣別'}
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(value: 'TWD' | 'USD' | 'CNY') =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TWD">TWD (台幣)</SelectItem>
                  <SelectItem value="USD">USD (美金)</SelectItem>
                  <SelectItem value="CNY">CNY (人民幣)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditingAccount(null);
                resetForm();
              }}
            >
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button onClick={handleSaveAccount}>
              {language === 'en' ? 'Save' : '儲存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
