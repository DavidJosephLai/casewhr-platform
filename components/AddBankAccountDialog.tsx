import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Building2, Loader2 } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface AddBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// 台灣主要銀行列表
const TAIWAN_BANKS = [
  { code: '004', name: '台灣銀行' },
  { code: '005', name: '台灣土地銀行' },
  { code: '006', name: '合作金庫商業銀行' },
  { code: '007', name: '第一商業銀行' },
  { code: '008', name: '華南商業銀行' },
  { code: '009', name: '彰化商業銀行' },
  { code: '011', name: '上海商業儲蓄銀行' },
  { code: '012', name: '台北富邦銀行' },
  { code: '013', name: '國泰世華商業銀行' },
  { code: '016', name: '高雄銀行' },
  { code: '017', name: '兆豐國際商業銀行' },
  { code: '021', name: '花旗（台灣）商業銀行' },
  { code: '050', name: '台灣中小企業銀行' },
  { code: '052', name: '渣打國際商業銀行' },
  { code: '053', name: '台中商業銀行' },
  { code: '054', name: '京城商業銀行' },
  { code: '081', name: '滙豐（台灣）商業銀行' },
  { code: '103', name: '臺灣新光商業銀行' },
  { code: '108', name: '陽信商業銀行' },
  { code: '147', name: '三信商業銀行' },
  { code: '803', name: '聯邦商業銀行' },
  { code: '805', name: '遠東國際商業銀行' },
  { code: '806', name: '元大商業銀行' },
  { code: '807', name: '永豐商業銀行' },
  { code: '808', name: '玉山商業銀行' },
  { code: '809', name: '凱基商業銀行' },
  { code: '810', name: '星展（台灣）商業銀行' },
  { code: '812', name: '台新國際商業銀行' },
  { code: '822', name: '中國信託商業銀行' },
];

export function AddBankAccountDialog({ open, onOpenChange, onSuccess }: AddBankAccountDialogProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [swiftCode, setSwiftCode] = useState('');

  const content = {
    en: {
      title: 'Add Bank Account',
      description: 'Add a new bank account for withdrawals',
      bankName: 'Bank Name',
      selectBank: 'Select your bank',
      accountNumber: 'Account Number',
      accountNumberPlaceholder: 'Enter your account number',
      accountHolderName: 'Account Holder Name',
      accountHolderPlaceholder: 'Full name as shown on account',
      branchCode: 'Branch Code (Optional)',
      branchCodePlaceholder: '4-digit branch code',
      swiftCode: 'SWIFT Code (Optional)',
      swiftCodePlaceholder: 'For international transfers',
      submit: 'Add Bank Account',
      submitting: 'Adding...',
      fillRequired: 'Please fill in all required fields',
      success: 'Bank account added successfully',
      error: 'Failed to add bank account',
      securityNote: '🔒 Your account details are encrypted and stored securely.',
    },
    'zh-TW': {
      title: '添加銀行帳戶',
      description: '添加新的銀行帳戶用於提現',
      bankName: '銀行名稱',
      selectBank: '選擇銀行',
      accountNumber: '帳戶號碼',
      accountHolder: '帳戶持有人',
      branchCode: '分行代碼',
      cancel: '取消',
      submit: '提交',
      submitting: '提交中...',
      success: '銀行帳戶已添加',
      error: '添加失敗',
      invalidAccount: '請輸入有效的帳戶號碼',
      enterAccountNumber: '請輸入您的帳戶號碼',
      enterAccountHolder: '請輸入帳戶持有人姓名',
      enterBranchCode: '選填',
      securityNote: '🔒 您的帳戶資訊已加密並安全儲存。',
    },
    'zh-CN': {
      title: '添加银行账户',
      description: '添加新的银行账户用于提现',
      bankName: '银行名称',
      selectBank: '选择银行',
      accountNumber: '账户号码',
      accountHolder: '账户持有人',
      branchCode: '分行代码',
      cancel: '取消',
      submit: '提交',
      submitting: '提交中...',
      success: '银行账户已添加',
      error: '添加失败',
      invalidAccount: '请输入有效的账户号码',
      enterAccountNumber: '请输入您的账户号码',
      enterAccountHolder: '请输入账户持有人姓名',
      enterBranchCode: '选填',
      securityNote: '🔒 您的账户信息已加密并安全储存。',
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !accessToken) return;

    // Validation
    if (!bankName || !accountNumber || !accountHolderName) {
      toast.error(t.fillRequired);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/bank-accounts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            bank_name: bankName,
            account_number: accountNumber,
            account_holder_name: accountHolderName,
            branch_code: branchCode || undefined,
            swift_code: swiftCode || undefined,
          }),
        }
      );

      if (response.ok) {
        toast.success(t.success);
        
        // Reset form
        setBankName('');
        setAccountNumber('');
        setAccountHolderName('');
        setBranchCode('');
        setSwiftCode('');
        
        onSuccess();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add bank account');
      }
    } catch (error: any) {
      console.error('Error adding bank account:', error);
      toast.error(error.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bank Name */}
          <div className="space-y-2">
            <Label htmlFor="bank-name">
              {t.bankName} <span className="text-red-500">*</span>
            </Label>
            <Select value={bankName} onValueChange={setBankName}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectBank} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {TAIWAN_BANKS.map((bank) => (
                  <SelectItem key={bank.code} value={bank.name}>
                    {bank.code} - {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="account-number">
              {t.accountNumber} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="account-number"
              type="text"
              placeholder={t.accountNumberPlaceholder}
              value={accountNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setAccountNumber(value);
              }}
              maxLength={20}
              required
            />
          </div>

          {/* Account Holder Name */}
          <div className="space-y-2">
            <Label htmlFor="account-holder">
              {t.accountHolderName} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="account-holder"
              type="text"
              placeholder={t.accountHolderPlaceholder}
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              required
            />
          </div>

          {/* Branch Code */}
          <div className="space-y-2">
            <Label htmlFor="branch-code">{t.branchCode}</Label>
            <Input
              id="branch-code"
              type="text"
              placeholder={t.branchCodePlaceholder}
              value={branchCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setBranchCode(value);
              }}
              maxLength={4}
            />
          </div>

          {/* SWIFT Code */}
          <div className="space-y-2">
            <Label htmlFor="swift-code">{t.swiftCode}</Label>
            <Input
              id="swift-code"
              type="text"
              placeholder={t.swiftCodePlaceholder}
              value={swiftCode}
              onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
              maxLength={11}
            />
          </div>

          {/* Security Note */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
            {t.securityNote}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? t.submitting : t.submit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}