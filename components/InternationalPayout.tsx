import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Building2, 
  CreditCard, 
  DollarSign, 
  Globe, 
  Info, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowUpFromLine,
  Banknote,
  Wallet as WalletIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '../utils/supabase/info';

interface BankAccount {
  id: string;
  account_type: 'local_taiwan' | 'international_bank' | 'paypal' | 'wise';
  currency: string;
  
  // Taiwan local bank
  bank_name?: string;
  bank_code?: string;
  account_number?: string;
  account_holder?: string;
  
  // International bank
  swift_code?: string;
  iban?: string;
  routing_number?: string;
  bank_address?: string;
  
  // PayPal
  paypal_email?: string;
  
  // Wise
  wise_email?: string;
  
  is_verified: boolean;
  is_default: boolean;
  created_at: string;
}

export function InternationalPayout() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [wallet, setWallet] = useState<any>(null);
  
  // Add account form
  const [accountType, setAccountType] = useState<'local_taiwan' | 'international_bank' | 'paypal' | 'wise'>('international_bank');
  const [currency, setCurrency] = useState('USD');
  const [formData, setFormData] = useState({
    // Taiwan
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_holder: '',
    
    // International
    swift_code: '',
    iban: '',
    routing_number: '',
    bank_address: '',
    
    // PayPal
    paypal_email: '',
    
    // Wise
    wise_email: '',
  });

  const content = {
    en: {
      title: 'International Payout',
      subtitle: 'Manage your international bank accounts and withdraw funds',
      availableBalance: 'Available Balance',
      addAccount: 'Add Account',
      withdraw: 'Withdraw',
      myAccounts: 'My Accounts',
      noAccounts: 'No payout accounts yet',
      noAccountsDesc: 'Add a bank account, PayPal, or Wise account to receive payments',
      
      // Account types
      accountTypes: {
        local_taiwan: 'Taiwan Bank Account',
        international_bank: 'International Bank',
        paypal: 'PayPal',
        wise: 'Wise (TransferWise)',
      },
      
      // Form labels
      selectAccountType: 'Account Type',
      selectCurrency: 'Currency',
      
      // Taiwan
      bankName: 'Bank Name',
      bankCode: 'Bank Code',
      accountNumber: 'Account Number',
      accountHolder: 'Account Holder Name',
      
      // International
      swiftCode: 'SWIFT/BIC Code',
      iban: 'IBAN (if applicable)',
      routingNumber: 'Routing Number (US only)',
      bankAddress: 'Bank Address',
      
      // PayPal
      paypalEmail: 'PayPal Email',
      
      // Wise
      wiseEmail: 'Wise Email',
      
      // Status
      verified: 'Verified',
      unverified: 'Unverified',
      default: 'Default',
      
      // Withdraw
      withdrawTitle: 'Withdraw Funds',
      withdrawDesc: 'Transfer money to your bank account',
      amount: 'Amount',
      selectAccount: 'Select Account',
      withdrawalFee: 'Withdrawal Fee',
      youWillReceive: 'You Will Receive',
      processingTime: 'Processing Time',
      
      // Buttons
      cancel: 'Cancel',
      save: 'Save Account',
      confirmWithdraw: 'Confirm Withdrawal',
      
      // Messages
      accountAdded: 'Account added successfully',
      withdrawalSuccess: 'Withdrawal request submitted',
      
      // Info
      taiwanInfo: 'For Taiwan bank accounts (TWD only)',
      internationalInfo: 'For international bank transfers (USD, EUR, GBP, etc.)',
      paypalInfo: 'Fast transfers, available in 200+ countries',
      wiseInfo: 'Low fees, fast transfers to 80+ countries',
      
      fees: {
        local_taiwan: '1-2 business days, NT$15 fee',
        international_bank: '3-5 business days, $25 + intermediary fees',
        paypal: 'Instant to 24 hours, 2% fee',
        wise: '1-2 business days, low fees',
      },
      
      currencies: {
        USD: 'US Dollar',
        EUR: 'Euro',
        GBP: 'British Pound',
        TWD: 'Taiwan Dollar',
        JPY: 'Japanese Yen',
        CNY: 'Chinese Yuan',
        HKD: 'Hong Kong Dollar',
        SGD: 'Singapore Dollar',
        AUD: 'Australian Dollar',
        CAD: 'Canadian Dollar',
      },
    },
    zh: {
      title: '國際收款',
      subtitle: '管理您的國際銀行帳戶並提領款項',
      availableBalance: '可用餘額',
      addAccount: '新增帳戶',
      withdraw: '提領',
      myAccounts: '我的帳戶',
      noAccounts: '尚未新增收款帳戶',
      noAccountsDesc: '新增銀行帳戶、PayPal 或 Wise 帳戶以接收款項',
      
      // Account types
      accountTypes: {
        local_taiwan: '台灣銀行帳戶',
        international_bank: '國際銀行',
        paypal: 'PayPal',
        wise: 'Wise (TransferWise)',
      },
      
      // Form labels
      selectAccountType: '帳戶類型',
      selectCurrency: '幣別',
      
      // Taiwan
      bankName: '銀行名稱',
      bankCode: '銀行代碼',
      accountNumber: '帳戶號碼',
      accountHolder: '戶名',
      
      // International
      swiftCode: 'SWIFT/BIC 代碼',
      iban: 'IBAN（如適用）',
      routingNumber: 'Routing Number（僅限美國）',
      bankAddress: '銀行地址',
      
      // PayPal
      paypalEmail: 'PayPal 電子郵件',
      
      // Wise
      wiseEmail: 'Wise 電子郵件',
      
      // Status
      verified: '已驗證',
      unverified: '未驗證',
      default: '預設',
      
      // Withdraw
      withdrawTitle: '提領款項',
      withdrawDesc: '將款項轉入您的銀行帳戶',
      amount: '金額',
      selectAccount: '選擇帳戶',
      withdrawalFee: '手續費',
      youWillReceive: '實際到帳',
      processingTime: '處理時間',
      
      // Buttons
      cancel: '取消',
      save: '儲存帳戶',
      confirmWithdraw: '確認提領',
      
      // Messages
      accountAdded: '帳戶新增成功',
      withdrawalSuccess: '提領申請已提交',
      
      // Info
      taiwanInfo: '台灣銀行帳戶（僅限台幣）',
      internationalInfo: '國際銀行轉帳（美元、歐元、英鎊等）',
      paypalInfo: '快速轉帳，支援 200+ 個國家',
      wiseInfo: '低手續費，快速轉帳至 80+ 個國家',
      
      fees: {
        local_taiwan: '1-2 個工作日，手續費 NT$15',
        international_bank: '3-5 個工作日，$25 + 中轉銀行費用',
        paypal: '即時到 24 小時，2% 手續費',
        wise: '1-2 個工作日，低手續費',
      },
      
      currencies: {
        USD: '美元',
        EUR: '歐元',
        GBP: '英鎊',
        TWD: '台幣',
        JPY: '日圓',
        CNY: '人民幣',
        HKD: '港幣',
        SGD: '新加坡幣',
        AUD: '澳幣',
        CAD: '加幣',
      },
    },
  };

  const t = content[language];

  useEffect(() => {
    if (user) {
      loadAccounts();
      loadWallet();
    }
  }, [user]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payout-accounts`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWallet(data.wallet);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const handleAddAccount = async () => {
    setProcessing(true);
    try {
      const payload = {
        account_type: accountType,
        currency: accountType === 'local_taiwan' ? 'TWD' : currency,
        ...formData,
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payout-accounts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        toast.success(t.accountAdded);
        setShowAddDialog(false);
        loadAccounts();
        // Reset form
        setFormData({
          bank_name: '',
          bank_code: '',
          account_number: '',
          account_holder: '',
          swift_code: '',
          iban: '',
          routing_number: '',
          bank_address: '',
          paypal_email: '',
          wise_email: '',
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add account');
      }
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error('Failed to add account');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    setProcessing(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payout-accounts/withdraw`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: parseFloat(withdrawAmount),
            account_id: selectedAccount,
          }),
        }
      );

      if (response.ok) {
        toast.success(t.withdrawalSuccess);
        setShowWithdrawDialog(false);
        setWithdrawAmount('');
        setSelectedAccount('');
        loadWallet();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to withdraw');
      }
    } catch (error) {
      console.error('Error withdrawing:', error);
      toast.error('Failed to withdraw');
    } finally {
      setProcessing(false);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'local_taiwan':
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'international_bank':
        return <Globe className="h-5 w-5 text-purple-600" />;
      case 'paypal':
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      case 'wise':
        return <Banknote className="h-5 w-5 text-green-600" />;
      default:
        return <WalletIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const calculateFee = (amount: number, accountType: string) => {
    switch (accountType) {
      case 'local_taiwan':
        return 15 / 30; // Convert to USD
      case 'international_bank':
        return 25;
      case 'paypal':
        return amount * 0.02; // 2%
      case 'wise':
        return amount * 0.01; // ~1%
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Balance */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-6 w-6 text-blue-600" />
              {t.title}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">{t.availableBalance}</div>
              <div className="text-2xl text-blue-600">
                ${(wallet?.available_balance || 0).toLocaleString()}
              </div>
            </div>
          </CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddDialog(true)} className="flex-1">
              <Building2 className="h-4 w-4 mr-2" />
              {t.addAccount}
            </Button>
            <Button 
              onClick={() => setShowWithdrawDialog(true)} 
              variant="outline"
              className="flex-1"
              disabled={(wallet?.available_balance || 0) === 0 || accounts.length === 0}
            >
              <ArrowUpFromLine className="h-4 w-4 mr-2" />
              {t.withdraw}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>{t.myAccounts}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="font-medium">{t.noAccounts}</p>
              <p className="text-sm mt-2">{t.noAccountsDesc}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAccountIcon(account.account_type)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {t.accountTypes[account.account_type]}
                          </p>
                          <Badge variant="outline">{account.currency}</Badge>
                          {account.is_default && (
                            <Badge className="bg-blue-600">{t.default}</Badge>
                          )}
                        </div>
                        
                        {/* Account details */}
                        <div className="text-sm text-gray-600 space-y-1">
                          {account.account_type === 'local_taiwan' && (
                            <>
                              <p>{account.bank_name} ({account.bank_code})</p>
                              <p>{account.account_number}</p>
                              <p>{account.account_holder}</p>
                            </>
                          )}
                          
                          {account.account_type === 'international_bank' && (
                            <>
                              {account.swift_code && <p>SWIFT: {account.swift_code}</p>}
                              {account.iban && <p>IBAN: {account.iban}</p>}
                              {account.account_number && <p>Account: {account.account_number}</p>}
                            </>
                          )}
                          
                          {account.account_type === 'paypal' && (
                            <p>{account.paypal_email}</p>
                          )}
                          
                          {account.account_type === 'wise' && (
                            <p>{account.wise_email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {account.is_verified ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t.verified}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {t.unverified}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.addAccount}</DialogTitle>
            <DialogDescription>
              Add your bank account or payment service to receive payouts
            </DialogDescription>
          </DialogHeader>

          <Tabs value={accountType} onValueChange={(v: any) => setAccountType(v)}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="local_taiwan">
                <Building2 className="h-4 w-4 mr-2" />
                Taiwan
              </TabsTrigger>
              <TabsTrigger value="international_bank">
                <Globe className="h-4 w-4 mr-2" />
                Bank
              </TabsTrigger>
              <TabsTrigger value="paypal">
                <CreditCard className="h-4 w-4 mr-2" />
                PayPal
              </TabsTrigger>
              <TabsTrigger value="wise">
                <Banknote className="h-4 w-4 mr-2" />
                Wise
              </TabsTrigger>
            </TabsList>

            {/* Taiwan Bank */}
            <TabsContent value="local_taiwan" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {t.taiwanInfo}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>{t.bankName}</Label>
                  <Input
                    placeholder="例如：台灣銀行"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>{t.bankCode}</Label>
                  <Input
                    placeholder="004"
                    value={formData.bank_code}
                    onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                  />
                </div>

                <div>
                  <Label>{t.accountNumber}</Label>
                  <Input
                    placeholder="123456789012"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  />
                </div>

                <div>
                  <Label>{t.accountHolder}</Label>
                  <Input
                    placeholder="王小明"
                    value={formData.account_holder}
                    onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* International Bank */}
            <TabsContent value="international_bank" className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {t.internationalInfo}
                </p>
              </div>

              <div>
                <Label>{t.selectCurrency}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t.currencies).map(([code, name]) => (
                      code !== 'TWD' && (
                        <SelectItem key={code} value={code}>
                          {code} - {name}
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>{t.swiftCode}</Label>
                  <Input
                    placeholder="ABCDUS33XXX"
                    value={formData.swift_code}
                    onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                  />
                </div>

                <div>
                  <Label>{t.iban}</Label>
                  <Input
                    placeholder="GB29 NWBK 6016 1331 9268 19"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  />
                </div>

                <div>
                  <Label>{t.accountNumber}</Label>
                  <Input
                    placeholder="123456789"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  />
                </div>

                <div>
                  <Label>{t.routingNumber}</Label>
                  <Input
                    placeholder="021000021"
                    value={formData.routing_number}
                    onChange={(e) => setFormData({ ...formData, routing_number: e.target.value })}
                  />
                </div>

                <div>
                  <Label>{t.accountHolder}</Label>
                  <Input
                    placeholder="John Doe"
                    value={formData.account_holder}
                    onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                  />
                </div>

                <div>
                  <Label>{t.bankAddress}</Label>
                  <Input
                    placeholder="123 Main St, New York, NY 10001, USA"
                    value={formData.bank_address}
                    onChange={(e) => setFormData({ ...formData, bank_address: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* PayPal */}
            <TabsContent value="paypal" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {t.paypalInfo}
                </p>
              </div>

              <div>
                <Label>{t.selectCurrency}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t.currencies).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t.paypalEmail}</Label>
                <Input
                  type="email"
                  placeholder="your-email@example.com"
                  value={formData.paypal_email}
                  onChange={(e) => setFormData({ ...formData, paypal_email: e.target.value })}
                />
              </div>
            </TabsContent>

            {/* Wise */}
            <TabsContent value="wise" className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {t.wiseInfo}
                </p>
              </div>

              <div>
                <Label>{t.selectCurrency}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t.currencies).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t.wiseEmail}</Label>
                <Input
                  type="email"
                  placeholder="your-email@example.com"
                  value={formData.wise_email}
                  onChange={(e) => setFormData({ ...formData, wise_email: e.target.value })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleAddAccount} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.withdrawTitle}</DialogTitle>
            <DialogDescription>{t.withdrawDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>{t.amount}</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={wallet?.available_balance || 0}
              />
              <p className="text-xs text-gray-500 mt-1">
                Max: ${(wallet?.available_balance || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <Label>{t.selectAccount}</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {t.accountTypes[account.account_type]} - {account.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAccount && withdrawAmount && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t.amount}</span>
                  <span className="font-medium">${parseFloat(withdrawAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t.withdrawalFee}</span>
                  <span className="text-red-600">
                    -${calculateFee(
                      parseFloat(withdrawAmount),
                      accounts.find(a => a.id === selectedAccount)?.account_type || ''
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-medium">{t.youWillReceive}</span>
                  <span className="text-lg font-semibold text-green-600">
                    ${(
                      parseFloat(withdrawAmount) - 
                      calculateFee(
                        parseFloat(withdrawAmount),
                        accounts.find(a => a.id === selectedAccount)?.account_type || ''
                      )
                    ).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 pt-2">
                  {t.processingTime}: {
                    t.fees[accounts.find(a => a.id === selectedAccount)?.account_type || 'international_bank']
                  }
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              {t.cancel}
            </Button>
            <Button 
              onClick={handleWithdraw} 
              disabled={processing || !selectedAccount || !withdrawAmount}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.confirmWithdraw}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}