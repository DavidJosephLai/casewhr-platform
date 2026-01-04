import { useState, useEffect, useCallback, useMemo, memo } from 'react'; // ✅ Added useCallback, useMemo, memo
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { Building2, Plus, Trash2, Loader2, Check, Globe } from 'lucide-react';
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import { AddBankAccountDialog } from "./AddBankAccountDialog";
import { AddInternationalBankDialog } from "./AddInternationalBankDialog"; // ✅ 導入國際銀行對話框

interface BankAccount {
  id: string;
  user_id: string;
  country?: string;
  account_type?: 'local' | 'international';
  bank_name: string;
  account_number?: string;
  iban?: string;
  masked_account_number?: string;
  masked_iban?: string;
  account_holder_name: string;
  branch_code?: string;
  swift_code?: string;
  routing_number?: string;
  currency?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const BankAccountManager = memo(function BankAccountManager() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddInternationalDialog, setShowAddInternationalDialog] = useState(false); // ✅ 添加國際銀行對話框狀態

  const content = {
    en: {
      title: 'Bank Accounts',
      description: 'Manage your bank accounts for withdrawals',
      add: 'Add',
      noAccounts: 'No bank accounts added yet',
      addAccount: 'Add Bank Account',
      addInternationalAccount: 'Add International Bank', // ✅ 新增
      default: 'Default',
      setDefault: 'Set Default',
      accountHolder: 'Account Holder',
      accountNumber: 'Account',
      branch: 'Branch',
      swift: 'SWIFT',
      routing: 'Routing',
      deleteConfirm: 'Are you sure you want to delete this bank account?',
      deleteSuccess: 'Bank account deleted',
      deleteError: 'Failed to delete bank account',
      setDefaultSuccess: 'Default bank account updated',
      setDefaultError: 'Failed to update default bank account',
    },
    'zh-TW': {
      title: '銀行帳戶',
      description: '管理您的提現銀行帳戶',
      noAccounts: '尚未添加銀行帳戶',
      addAccount: '添加銀行帳戶',
      addInternationalAccount: '添加國際銀行', // ✅ 新增
      accountHolder: '帳戶持有人',
      accountNumber: '帳戶號碼',
      bankName: '銀行名稱',
      branchCode: '分行代碼',
      country: '國家',
      setDefault: '設為預設',
      default: '預設',
      remove: '移除',
      loading: '載入中...',
      confirmRemove: '確定要移除此銀行帳戶嗎？',
      removeSuccess: '銀行帳戶已移除',
      removeError: '移除失敗',
      setDefaultSuccess: '已更新預設銀行帳戶',
      setDefaultError: '更新失敗',
    },
    'zh-CN': {
      title: '银行账户',
      description: '管理您的提现银行账户',
      noAccounts: '尚未添加银行账户',
      addAccount: '添加银行账户',
      addInternationalAccount: '添加国际银行', // ✅ 新增
      accountHolder: '账户持有人',
      accountNumber: '账户号码',
      bankName: '银行名称',
      branchCode: '分行代码',
      country: '国家',
      setDefault: '设为默认',
      default: '默认',
      remove: '移除',
      loading: '载入中...',
      confirmRemove: '确定要移除此银行账户吗？',
      removeSuccess: '银行账户已移除',
      removeError: '移除失败',
      setDefaultSuccess: '已更新默认银行账户',
      setDefaultError: '更新失败',
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  useEffect(() => {
    if (user && accessToken) {
      fetchBankAccounts();
    }
  }, [user, accessToken]);

  const fetchBankAccounts = async () => {
    if (!user || !accessToken) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/bank-accounts/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.bank_accounts || []);
      } else {
        // Silently fail - bank accounts are optional feature
        setBankAccounts([]);
      }
    } catch (error) {
      // Silently fail - bank accounts are optional feature
      // This can happen if the backend is not running or network issue
      setBankAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    if (!user || !accessToken) return;
    
    setActionLoading(accountId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/bank-accounts/${accountId}/set-default`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        await fetchBankAccounts();
        toast.success(t.setDefaultSuccess);
      } else {
        throw new Error('Failed to set default');
      }
    } catch (error) {
      console.error('Error setting default bank account:', error);
      toast.error(t.setDefaultError);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!user || !accessToken) return;
    
    if (!confirm(t.confirmRemove)) {
      return;
    }

    setActionLoading(accountId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/bank-accounts/${accountId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        await fetchBankAccounts();
        toast.success(t.removeSuccess);
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.error(t.removeError);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {t.description}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t.addAccount}
              </Button>
              <Button size="sm" onClick={() => setShowAddInternationalDialog(true)} variant="outline">
                <Globe className="h-4 w-4 mr-2" />
                {t.addInternationalAccount}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                {t.noAccounts}
              </p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {t.addAccount}
              </Button>
            </div>
          ) : (
            bankAccounts.map((account) => (
              <div
                key={account.id}
                className={`border rounded-lg p-4 ${
                  account.is_default ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      <Building2 className="h-5 w-5 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {account.bank_name}
                        </span>
                        {account.is_default && (
                          <Badge variant="default" className="text-xs">
                            {t.default}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div>
                          <span className="text-xs text-gray-500">{t.accountHolder}: </span>
                          {account.account_holder_name}
                        </div>
                        {account.country && (
                          <div>
                            <span className="text-xs text-gray-500">Country: </span>
                            {account.country} {account.currency && `(${account.currency})`}
                          </div>
                        )}
                        {account.iban ? (
                          <div>
                            <span className="text-xs text-gray-500">IBAN: </span>
                            {account.masked_iban || account.iban}
                          </div>
                        ) : account.masked_account_number && (
                          <div>
                            <span className="text-xs text-gray-500">{t.accountNumber}: </span>
                            {account.masked_account_number}
                          </div>
                        )}
                        {account.branch_code && (
                          <div>
                            <span className="text-xs text-gray-500">{t.branch}: </span>
                            {account.branch_code}
                          </div>
                        )}
                        {account.swift_code && (
                          <div>
                            <span className="text-xs text-gray-500">{t.swift}: </span>
                            {account.swift_code}
                          </div>
                        )}
                        {account.routing_number && (
                          <div>
                            <span className="text-xs text-gray-500">{t.routing}: </span>
                            {account.routing_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!account.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(account.id)}
                        disabled={actionLoading === account.id}
                      >
                        {actionLoading === account.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            {t.setDefault}
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      disabled={actionLoading === account.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {actionLoading === account.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AddBankAccountDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false);
          fetchBankAccounts();
        }}
      />

      <AddInternationalBankDialog
        open={showAddInternationalDialog}
        onOpenChange={setShowAddInternationalDialog}
        onSuccess={() => {
          setShowAddInternationalDialog(false);
          fetchBankAccounts();
        }}
      />
    </>
  );
});