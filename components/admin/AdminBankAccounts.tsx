import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Loader2, 
  Building2, 
  Search, 
  Flag, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit, 
  AlertTriangle, 
  Calendar,
  Globe,
  Shield,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface BankAccount {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  type: 'bank_account' | 'international_bank';
  bank_name: string;
  account_number: string;
  account_holder?: string;
  country?: string;
  swift_code?: string;
  iban?: string;
  verified?: boolean;
  flagged?: boolean;
  flag_reason?: string;
  created_at: string;
  admin_note?: string;
}

interface BankAccountStats {
  total: number;
  by_type: {
    local: number;
    international: number;
  };
  by_verified: {
    verified: number;
    unverified: number;
  };
  flagged: number;
  this_month: number;
}

export function AdminBankAccounts() {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [stats, setStats] = useState<BankAccountStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [verifyNote, setVerifyNote] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const content = {
    en: {
      title: 'Bank Account Management',
      search: 'Search accounts...',
      all: 'All',
      local: 'Local',
      international: 'International',
      verified: 'Verified',
      unverified: 'Unverified',
      user: 'User',
      type: 'Type',
      bank: 'Bank',
      account: 'Account Number',
      status: 'Status',
      actions: 'Actions',
      verify: 'Verify',
      flag: 'Flag',
      delete: 'Delete',
      noAccounts: 'No bank accounts found',
      loading: 'Loading bank accounts...',
      stats: {
        totalAccounts: 'Total Accounts',
        verifiedAccounts: 'Verified',
        flaggedAccounts: 'Flagged',
        thisMonth: 'New This Month',
      },
      verifyAccount: 'Verify Bank Account',
      unverifyAccount: 'Unverify Bank Account',
      noteLabel: 'Admin Note',
      notePlaceholder: 'Optional note...',
      verifySuccess: 'Account verification updated',
      flagAccount: 'Flag Bank Account',
      unflagAccount: 'Unflag Bank Account',
      flagReasonLabel: 'Flag Reason',
      flagReasonPlaceholder: 'Enter reason for flagging (required)...',
      flagSuccess: 'Account flagged successfully',
      unflagSuccess: 'Account unflagged successfully',
      deleteAccount: 'Delete Bank Account',
      deleteWarning: 'Are you sure you want to delete this bank account? This action cannot be undone.',
      deleteReasonLabel: 'Deletion Reason',
      deleteReasonPlaceholder: 'Enter reason for deletion (required)...',
      confirmDelete: 'Confirm Deletion',
      deleteSuccess: 'Account deleted successfully',
      error: 'Operation failed',
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
      country: 'Country',
      swift: 'SWIFT',
      iban: 'IBAN',
      flagged: 'Flagged',
      masked: 'Masked for security',
    },
    'zh-TW': {
      title: '銀行帳戶管理',
      search: '搜索帳戶...',
      all: '全部',
      local: '本地帳戶',
      international: '國際帳戶',
      verified: '已驗證',
      unverified: '未驗證',
      user: '用戶',
      type: '類型',
      bank: '銀行',
      account: '帳號',
      status: '狀態',
      actions: '操作',
      verify: '驗證',
      flag: '標記',
      delete: '刪除',
      noAccounts: '未找到銀行帳戶',
      loading: '載入銀行帳戶中...',
      stats: {
        totalAccounts: '總帳戶數',
        verifiedAccounts: '已驗證',
        flaggedAccounts: '已標記',
        thisMonth: '本月新增',
      },
      verifyAccount: '驗證銀行帳戶',
      unverifyAccount: '取消驗證',
      noteLabel: '管理員備註',
      notePlaceholder: '可選備註...',
      verifySuccess: '帳戶驗證已更新',
      flagAccount: '標記銀行帳戶',
      unflagAccount: '取消標記',
      flagReasonLabel: '標記原因',
      flagReasonPlaceholder: '請輸入標記原因（必填）...',
      flagSuccess: '帳戶已標記',
      unflagSuccess: '標記已取消',
      deleteAccount: '刪除銀行帳戶',
      deleteWarning: '確定要刪除此銀行帳戶嗎？此操作無法撤銷。',
      deleteReasonLabel: '刪除原因',
      deleteReasonPlaceholder: '請輸入刪除原因（必填）...',
      confirmDelete: '確認刪除',
      deleteSuccess: '帳戶已刪除',
      error: '操作失敗',
      page: '第',
      of: '頁，共',
      previous: '上一頁',
      next: '下一頁',
      country: '國家',
      swift: 'SWIFT',
      iban: 'IBAN',
      flagged: '已標記',
      masked: '已遮蔽保護',
    },
    'zh-CN': {
      title: '银行账户管理',
      search: '搜索账户...',
      all: '全部',
      local: '本地账户',
      international: '国际账户',
      verified: '已验证',
      unverified: '未验证',
      user: '用户',
      type: '类型',
      bank: '银行',
      account: '账号',
      status: '状态',
      actions: '操作',
      verify: '验证',
      flag: '标记',
      delete: '删除',
      noAccounts: '未找到银行账户',
      loading: '载入银行账户中...',
      stats: {
        totalAccounts: '总账户数',
        verifiedAccounts: '已验证',
        flaggedAccounts: '已标记',
        thisMonth: '本月新增',
      },
      verifyAccount: '验证银行账户',
      unverifyAccount: '取消验证',
      noteLabel: '管理员备注',
      notePlaceholder: '可选备注...',
      verifySuccess: '账户验证已更新',
      flagAccount: '标记银行账户',
      unflagAccount: '取消标记',
      flagReasonLabel: '标记原因',
      flagReasonPlaceholder: '请输入标记原因（必填）...',
      flagSuccess: '账户已标记',
      unflagSuccess: '标记已取消',
      deleteAccount: '删除银行账户',
      deleteWarning: '确定要删除此银行账户吗？此操作无法撤销。',
      deleteReasonLabel: '删除原因',
      deleteReasonPlaceholder: '请输入删除原因（必填）...',
      confirmDelete: '确认删除',
      deleteSuccess: '账户已删除',
      error: '操作失败',
      page: '第',
      of: '页，共',
      previous: '上一页',
      next: '下一页',
      country: '国家',
      swift: 'SWIFT',
      iban: 'IBAN',
      flagged: '已标记',
      masked: '已遮蔽保护',
    }
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  useEffect(() => {
    if (accessToken) {
      fetchAccounts();
      fetchStats();
    }
  }, [accessToken, currentPage, typeFilter, verifiedFilter, searchQuery]);

  const fetchAccounts = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (typeFilter && typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      if (verifiedFilter && verifiedFilter !== 'all') {
        params.append('verified', verifiedFilter);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/bank-accounts?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/bank-accounts/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleVerify = async (verified: boolean) => {
    if (!selectedAccount) return;

    setActionLoading(selectedAccount.id);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/bank-accounts/${selectedAccount.id}/verify`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            verified,
            note: verifyNote,
          }),
        }
      );

      if (response.ok) {
        toast.success(t.verifySuccess);
        setShowVerifyDialog(false);
        setVerifyNote('');
        setSelectedAccount(null);
        fetchAccounts();
        fetchStats();
      } else {
        throw new Error('Failed to update verification');
      }
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error(t.error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlag = async (flagged: boolean) => {
    if (!selectedAccount) return;

    if (flagged && !flagReason.trim()) {
      toast.error(language === 'en' ? 'Reason is required' : '請填寫原因');
      return;
    }

    setActionLoading(selectedAccount.id);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/bank-accounts/${selectedAccount.id}/flag`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flagged,
            reason: flagReason,
          }),
        }
      );

      if (response.ok) {
        toast.success(flagged ? t.flagSuccess : t.unflagSuccess);
        setShowFlagDialog(false);
        setFlagReason('');
        setSelectedAccount(null);
        fetchAccounts();
        fetchStats();
      } else {
        throw new Error('Failed to flag account');
      }
    } catch (error) {
      console.error('Error flagging account:', error);
      toast.error(t.error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount || !deleteReason.trim()) return;

    setActionLoading(selectedAccount.id);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/bank-accounts/${selectedAccount.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: deleteReason }),
        }
      );

      if (response.ok) {
        toast.success(t.deleteSuccess);
        setShowDeleteDialog(false);
        setDeleteReason('');
        setSelectedAccount(null);
        fetchAccounts();
        fetchStats();
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(t.error);
    } finally {
      setActionLoading(null);
    }
  };

  const openVerifyDialog = (account: BankAccount, verify: boolean) => {
    setSelectedAccount(account);
    setShowVerifyDialog(true);
  };

  const openFlagDialog = (account: BankAccount, flag: boolean) => {
    setSelectedAccount(account);
    setFlagReason(flag ? '' : account.flag_reason || '');
    setShowFlagDialog(true);
  };

  const openDeleteDialog = (account: BankAccount) => {
    setSelectedAccount(account);
    setShowDeleteDialog(true);
  };

  const getTypeBadge = (type: string) => {
    if (type === 'international_bank') {
      return (
        <Badge className="bg-blue-500 text-white border-0">
          <Globe className="h-3 w-3 mr-1" />
          {t.international}
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-500 text-white border-0">
        <Building2 className="h-3 w-3 mr-1" />
        {t.local}
      </Badge>
    );
  };

  const maskAccountNumber = (number: string) => {
    if (!number || number.length < 4) return '****';
    return '****' + number.slice(-4);
  };

  if (loading && accounts.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">{t.loading}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.stats.totalAccounts}</p>
                  <p className="text-2xl font-semibold">{stats.total}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.stats.verifiedAccounts}</p>
                  <p className="text-2xl font-semibold">{stats.by_verified.verified}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.stats.flaggedAccounts}</p>
                  <p className="text-2xl font-semibold">{stats.flagged}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.stats.thisMonth}</p>
                  <p className="text-2xl font-semibold">{stats.this_month}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t.title}
            </CardTitle>
            <div className="text-sm text-gray-600">
              {total} {language === 'en' ? 'accounts' : '個帳戶'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t.all} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="bank_account">{t.local}</SelectItem>
                  <SelectItem value="international_bank">{t.international}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={verifiedFilter} onValueChange={(value) => {
                setVerifiedFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t.all} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="verified">{t.verified}</SelectItem>
                  <SelectItem value="unverified">{t.unverified}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.user}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.type}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.bank}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.account}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    {t.status}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      {t.noAccounts}
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p className="font-medium">{account.user_name}</p>
                          <p className="text-gray-500 text-xs">{account.user_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getTypeBadge(account.type)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p className="font-medium">{account.bank_name}</p>
                          {account.country && (
                            <p className="text-gray-500 text-xs">{account.country}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-mono">
                          <p>{maskAccountNumber(account.account_number)}</p>
                          <p className="text-gray-400 text-xs">{t.masked}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {account.verified ? (
                            <Badge className="bg-green-500 text-white border-0 w-fit">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t.verified}
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-400 text-white border-0 w-fit">
                              <XCircle className="h-3 w-3 mr-1" />
                              {t.unverified}
                            </Badge>
                          )}
                          {account.flagged && (
                            <Badge className="bg-red-500 text-white border-0 w-fit">
                              <Flag className="h-3 w-3 mr-1" />
                              {t.flagged}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant={account.verified ? "outline" : "default"}
                            onClick={() => openVerifyDialog(account, !account.verified)}
                            disabled={actionLoading === account.id}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={account.flagged ? "default" : "outline"}
                            className={account.flagged ? "bg-orange-600 hover:bg-orange-700" : ""}
                            onClick={() => openFlagDialog(account, !account.flagged)}
                            disabled={actionLoading === account.id}
                          >
                            <Flag className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(account)}
                            disabled={actionLoading === account.id}
                          >
                            {actionLoading === account.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                {t.page} {currentPage} {t.of} {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t.previous}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t.next}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAccount?.verified ? t.unverifyAccount : t.verifyAccount}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? `${selectedAccount?.verified ? 'Unverify' : 'Verify'} bank account for ${selectedAccount?.user_name}`
                : `${selectedAccount?.verified ? '取消驗證' : '驗證'} ${selectedAccount?.user_name} 的銀行帳戶`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="note">{t.noteLabel}</Label>
              <Textarea
                id="note"
                placeholder={t.notePlaceholder}
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowVerifyDialog(false);
                setVerifyNote('');
              }}
            >
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button
              onClick={() => handleVerify(!selectedAccount?.verified)}
              disabled={actionLoading === selectedAccount?.id}
            >
              {actionLoading === selectedAccount?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Processing...' : '處理中...'}
                </>
              ) : (
                selectedAccount?.verified ? (language === 'en' ? 'Unverify' : '取消驗證') : t.verify
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAccount?.flagged ? t.unflagAccount : t.flagAccount}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? `${selectedAccount?.flagged ? 'Remove flag from' : 'Flag'} ${selectedAccount?.user_name}'s bank account`
                : `${selectedAccount?.flagged ? '取消標記' : '標記'} ${selectedAccount?.user_name} 的銀行帳戶`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="flag-reason">{t.flagReasonLabel}</Label>
              <Textarea
                id="flag-reason"
                placeholder={t.flagReasonPlaceholder}
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowFlagDialog(false);
                setFlagReason('');
              }}
            >
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button
              onClick={() => handleFlag(!selectedAccount?.flagged)}
              disabled={(!selectedAccount?.flagged && !flagReason.trim()) || actionLoading === selectedAccount?.id}
              className={!selectedAccount?.flagged ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {actionLoading === selectedAccount?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Processing...' : '處理中...'}
                </>
              ) : (
                selectedAccount?.flagged ? (language === 'en' ? 'Unflag' : '取消標記') : t.flag
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteAccount}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="delete-reason">{t.deleteReasonLabel}</Label>
              <Textarea
                id="delete-reason"
                placeholder={t.deleteReasonPlaceholder}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteReason('')}>
              {language === 'en' ? 'Cancel' : '取消'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!deleteReason.trim() || actionLoading === selectedAccount?.id}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === selectedAccount?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Deleting...' : '刪除中...'}
                </>
              ) : (
                t.confirmDelete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}