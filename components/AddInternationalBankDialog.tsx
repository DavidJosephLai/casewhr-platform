import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Globe, Loader2, Info } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";

interface AddInternationalBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// 國家列表
const COUNTRIES = [
  { code: 'TW', name_en: 'Taiwan', name_zh: '台灣', currency: 'TWD' },
  { code: 'US', name_en: 'United States', name_zh: '美國', currency: 'USD' },
  { code: 'GB', name_en: 'United Kingdom', name_zh: '英國', currency: 'GBP' },
  { code: 'JP', name_en: 'Japan', name_zh: '日本', currency: 'JPY' },
  { code: 'CN', name_en: 'China', name_zh: '中國', currency: 'CNY' },
  { code: 'HK', name_en: 'Hong Kong', name_zh: '香港', currency: 'HKD' },
  { code: 'SG', name_en: 'Singapore', name_zh: '新加坡', currency: 'SGD' },
  { code: 'AU', name_en: 'Australia', name_zh: '澳洲', currency: 'AUD' },
  { code: 'CA', name_en: 'Canada', name_zh: '加拿大', currency: 'CAD' },
  { code: 'DE', name_en: 'Germany', name_zh: '德國', currency: 'EUR' },
  { code: 'FR', name_en: 'France', name_zh: '法國', currency: 'EUR' },
  { code: 'IT', name_en: 'Italy', name_zh: '意大利', currency: 'EUR' },
  { code: 'ES', name_en: 'Spain', name_zh: '西班牙', currency: 'EUR' },
  { code: 'NL', name_en: 'Netherlands', name_zh: '荷蘭', currency: 'EUR' },
  { code: 'CH', name_en: 'Switzerland', name_zh: '瑞士', currency: 'CHF' },
  { code: 'KR', name_en: 'South Korea', name_zh: '韓國', currency: 'KRW' },
  { code: 'MY', name_en: 'Malaysia', name_zh: '馬來西亞', currency: 'MYR' },
  { code: 'TH', name_en: 'Thailand', name_zh: '泰國', currency: 'THB' },
  { code: 'VN', name_en: 'Vietnam', name_zh: '越南', currency: 'VND' },
  { code: 'PH', name_en: 'Philippines', name_zh: '菲律賓', currency: 'PHP' },
];

// 台灣銀行列表
const TAIWAN_BANKS = [
  { code: '004', name: '台灣銀行', name_en: 'Bank of Taiwan' },
  { code: '005', name: '台灣土地銀行', name_en: 'Land Bank of Taiwan' },
  { code: '006', name: '合作金庫商業銀行', name_en: 'Taiwan Cooperative Bank' },
  { code: '007', name: '第一商業銀行', name_en: 'First Commercial Bank' },
  { code: '008', name: '華南商業銀行', name_en: 'Hua Nan Commercial Bank' },
  { code: '012', name: '台北富邦銀行', name_en: 'Taipei Fubon Bank' },
  { code: '013', name: '國泰世華商業銀行', name_en: 'Cathay United Bank' },
  { code: '017', name: '兆豐國際商業銀行', name_en: 'Mega International Commercial Bank' },
  { code: '808', name: '玉山商業銀行', name_en: 'E.SUN Commercial Bank' },
  { code: '822', name: '中國信託商業銀行', name_en: 'CTBC Bank' },
];

// 美國主要銀行
const US_BANKS = [
  { name: 'JPMorgan Chase Bank', swift: 'CHASUS33' },
  { name: 'Bank of America', swift: 'BOFAUS3N' },
  { name: 'Wells Fargo Bank', swift: 'WFBIUS6S' },
  { name: 'Citibank', swift: 'CITIUS33' },
  { name: 'U.S. Bank', swift: 'USBKUS44' },
  { name: 'PNC Bank', swift: 'PNCCUS33' },
  { name: 'Capital One', swift: 'HIBKUS44' },
  { name: 'TD Bank', swift: 'NRTHUS33' },
  { name: 'Fifth Third Bank', swift: 'FTBCUS3C' },
  { name: 'HSBC Bank USA', swift: 'MRMDUS33' },
];

// 歐洲主要銀行
const EUROPEAN_BANKS = [
  { name: 'HSBC Bank (UK)', country: 'GB', swift: 'HBUKGB4B' },
  { name: 'Barclays Bank', country: 'GB', swift: 'BARCGB22' },
  { name: 'Lloyds Bank', country: 'GB', swift: 'LOYDGB2L' },
  { name: 'Deutsche Bank', country: 'DE', swift: 'DEUTDEFF' },
  { name: 'Commerzbank', country: 'DE', swift: 'COBADEFF' },
  { name: 'BNP Paribas', country: 'FR', swift: 'BNPAFRPP' },
  { name: 'Société Générale', country: 'FR', swift: 'SOGEFRPP' },
  { name: 'UniCredit', country: 'IT', swift: 'UNCRITMM' },
  { name: 'Intesa Sanpaolo', country: 'IT', swift: 'BCITITMM' },
  { name: 'ING Bank', country: 'NL', swift: 'INGBNL2A' },
  { name: 'UBS', country: 'CH', swift: 'UBSWCHZH' },
  { name: 'Credit Suisse', country: 'CH', swift: 'CRESCHZZ' },
];

// 亞洲主要銀行
const ASIAN_BANKS = [
  { name: 'HSBC Hong Kong', country: 'HK', swift: 'HSBCHKHH' },
  { name: 'Hang Seng Bank', country: 'HK', swift: 'HASEHKHH' },
  { name: 'DBS Bank (Singapore)', country: 'SG', swift: 'DBSSSGSG' },
  { name: 'OCBC Bank', country: 'SG', swift: 'OCBCSGSG' },
  { name: 'UOB Bank', country: 'SG', swift: 'UOVBSGSG' },
  { name: 'Mitsubishi UFJ Bank', country: 'JP', swift: 'BOTKJPJT' },
  { name: 'Sumitomo Mitsui Banking', country: 'JP', swift: 'SMBCJPJT' },
  { name: 'Mizuho Bank', country: 'JP', swift: 'MHCBJPJT' },
  { name: 'Industrial and Commercial Bank of China', country: 'CN', swift: 'ICBKCNBJ' },
  { name: 'China Construction Bank', country: 'CN', swift: 'PCBCCNBJ' },
];

export function AddInternationalBankDialog({ open, onOpenChange, onSuccess }: AddInternationalBankDialogProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [country, setCountry] = useState('TW');
  const [accountType, setAccountType] = useState<'local' | 'international'>('local');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [currency, setCurrency] = useState('TWD');

  const content = {
    en: {
      title: 'Add International Bank Account',
      description: 'Add a bank account from any country',
      country: 'Country/Region',
      selectCountry: 'Select country',
      accountType: 'Account Type',
      local: 'Local Account',
      international: 'International (IBAN/SWIFT)',
      bankName: 'Bank Name',
      selectBank: 'Select your bank',
      customBank: 'Other Bank',
      accountNumber: 'Account Number',
      accountNumberPlaceholder: 'Enter your account number',
      iban: 'IBAN',
      ibanPlaceholder: 'GB29 NWBK 6016 1331 9268 19',
      accountHolderName: 'Account Holder Name',
      accountHolderPlaceholder: 'Full name as shown on account',
      swiftCode: 'SWIFT/BIC Code',
      swiftCodePlaceholder: 'e.g., HSBCHKHH',
      routingNumber: 'Routing Number',
      routingPlaceholder: '9-digit routing number',
      branchCode: 'Branch/Sort Code',
      branchCodePlaceholder: 'Branch or sort code',
      currency: 'Account Currency',
      submit: 'Add Bank Account',
      submitting: 'Adding...',
      fillRequired: 'Please fill in all required fields',
      success: 'Bank account added successfully',
      error: 'Failed to add bank account',
      ibanInfo: 'For European banks, IBAN is required',
      swiftInfo: 'SWIFT/BIC code is required for international transfers',
      routingInfo: 'For US banks only',
      securityNote: '🔒 Your account details are encrypted and stored securely.',
    },
    'zh-TW': {
      title: '添加國際銀行帳戶',
      description: '添加任何國家的銀行帳戶',
      country: '國家/地區',
      selectCountry: '選擇國家',
      accountType: '帳戶類型',
      local: '本地帳戶',
      international: '國際帳戶（IBAN/SWIFT）',
      bankName: '銀行名稱',
      selectBank: '選您的銀行',
      customBank: '其他銀行',
      accountNumber: '帳號',
      accountNumberPlaceholder: '輸入您的帳號',
      iban: 'IBAN',
      ibanPlaceholder: 'GB29 NWBK 6016 1331 9268 19',
      accountHolderName: '帳戶持有人姓名',
      accountHolderPlaceholder: '與帳戶上顯示的全名一致',
      swiftCode: 'SWIFT/BIC 代碼',
      swiftCodePlaceholder: '例如：HSBCHKHH',
      routingNumber: 'Routing 號碼',
      routingPlaceholder: '9 位數 routing 號碼',
      branchCode: '分行/Sort 代碼',
      branchCodePlaceholder: '分行代碼或 sort code',
      currency: '帳戶幣別',
      submit: '添加銀行帳戶',
      submitting: '添加中...',
      fillRequired: '請填寫所有必填欄位',
      success: '銀行帳戶添加成功',
      error: '添加銀行帳戶失敗',
      ibanInfo: '歐洲銀行需要 IBAN',
      swiftInfo: '國際轉帳需要 SWIFT/BIC 代碼',
      routingInfo: '僅適用於美國銀行',
      securityNote: '🔒 您的帳戶資訊已加密並安全存儲。',
    },
    'zh-CN': {
      title: '添加国际银行账户',
      description: '添加任何国家的银行账户',
      country: '国家/地区',
      selectCountry: '选择国家',
      accountType: '账户类型',
      local: '本地账户',
      international: '国际账户（IBAN/SWIFT）',
      bankName: '银行称',
      selectBank: '选择您的银行',
      customBank: '其他银行',
      accountNumber: '账号',
      accountNumberPlaceholder: '输入您的账号',
      iban: 'IBAN',
      ibanPlaceholder: 'GB29 NWBK 6016 1331 9268 19',
      accountHolderName: '账户持有人姓名',
      accountHolderPlaceholder: '与账户上显示的全名一致',
      swiftCode: 'SWIFT/BIC 代码',
      swiftCodePlaceholder: '例如：HSBCHKHH',
      routingNumber: 'Routing 号码',
      routingPlaceholder: '9 位数 routing 号码',
      branchCode: '分行/Sort 代码',
      branchCodePlaceholder: '分行代码或 sort code',
      currency: '账户币别',
      submit: '添加银行账户',
      submitting: '添加中...',
      fillRequired: '请填写所有必填栏位',
      success: '银行账户添加成功',
      error: '添加银行账户失败',
      ibanInfo: '欧洲银行需要 IBAN',
      swiftInfo: '国际转账需要 SWIFT/BIC 代码',
      routingInfo: '仅适用于美国银行',
      securityNote: '🔒 您的账户资讯已加密并安全存储。',
    },
    // 向后兼容旧的 'zh' 代码
    zh: {
      title: '添加國際銀行帳戶',
      description: '添加任何國家的銀行帳戶',
      country: '國家/地區',
      selectCountry: '選擇國家',
      accountType: '帳戶類型',
      local: '本地帳戶',
      international: '國際帳戶（IBAN/SWIFT）',
      bankName: '銀行名稱',
      selectBank: '選擇您的銀行',
      customBank: '其他銀行',
      accountNumber: '帳號',
      accountNumberPlaceholder: '輸入您的帳號',
      iban: 'IBAN',
      ibanPlaceholder: 'GB29 NWBK 6016 1331 9268 19',
      accountHolderName: '帳戶持有人姓名',
      accountHolderPlaceholder: '與帳戶上顯示的全名一致',
      swiftCode: 'SWIFT/BIC 代碼',
      swiftCodePlaceholder: '例如：HSBCHKHH',
      routingNumber: 'Routing 號碼',
      routingPlaceholder: '9 位數 routing 號碼',
      branchCode: '分行/Sort 代碼',
      branchCodePlaceholder: '分行代碼或 sort code',
      currency: '帳戶幣別',
      submit: '添加銀行帳戶',
      submitting: '添加中...',
      fillRequired: '請填寫所有必填欄位',
      success: '銀行帳戶添加成功',
      error: '添加銀行帳戶失敗',
      ibanInfo: '歐洲銀行需要 IBAN',
      swiftInfo: '國際轉帳需要 SWIFT/BIC 代碼',
      routingInfo: '僅適用於美國銀行',
      securityNote: '🔒 您的帳戶資訊已加密並安全存儲。',
    }
  };

  // 获取翻译，支持新的三语言系统和向后兼容
  const t = content[language as keyof typeof content] || content['en'];

  const getBankList = () => {
    switch (country) {
      case 'TW':
        return TAIWAN_BANKS;
      case 'US':
        return US_BANKS;
      case 'GB':
      case 'DE':
      case 'FR':
      case 'IT':
      case 'NL':
      case 'CH':
        return EUROPEAN_BANKS.filter(b => !b.country || b.country === country);
      case 'HK':
      case 'SG':
      case 'JP':
      case 'CN':
        return ASIAN_BANKS.filter(b => !b.country || b.country === country);
      default:
        return [];
    }
  };

  const getCurrencyForCountry = (countryCode: string) => {
    const c = COUNTRIES.find(c => c.code === countryCode);
    return c?.currency || 'USD';
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setBankName('');
    setSwiftCode('');
    setCurrency(getCurrencyForCountry(newCountry));
    
    // Auto-select account type based on country
    if (['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'CH'].includes(newCountry)) {
      setAccountType('international');
    } else {
      setAccountType('local');
    }
  };

  const handleBankSelect = (value: string) => {
    setBankName(value);
    
    // Auto-fill SWIFT code if available
    const banks = getBankList();
    const selectedBank = banks.find((b: any) => 
      (b.name === value || b.name_en === value)
    );
    
    if (selectedBank && 'swift' in selectedBank) {
      setSwiftCode((selectedBank as any).swift);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !accessToken) return;

    // Validation
    if (!bankName || !accountHolderName) {
      toast.error(t.fillRequired);
      return;
    }

    if (accountType === 'international') {
      if (!iban && !swiftCode) {
        toast.error(language === 'en' 
          ? 'IBAN or SWIFT code is required for international accounts'
          : '國際帳戶需要 IBAN 或 SWIFT 代碼'
        );
        return;
      }
    } else {
      if (!accountNumber) {
        toast.error(t.fillRequired);
        return;
      }
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
            country,
            account_type: accountType,
            bank_name: bankName,
            account_number: accountNumber || undefined,
            iban: iban || undefined,
            account_holder_name: accountHolderName,
            swift_code: swiftCode || undefined,
            routing_number: routingNumber || undefined,
            branch_code: branchCode || undefined,
            currency,
          }),
        }
      );

      if (response.ok) {
        toast.success(t.success);
        
        // Reset form
        setCountry('TW');
        setAccountType('local');
        setBankName('');
        setAccountNumber('');
        setIban('');
        setAccountHolderName('');
        setSwiftCode('');
        setRoutingNumber('');
        setBranchCode('');
        setCurrency('TWD');
        
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

  const isEuropeanCountry = ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'CH'].includes(country);
  const isUSCountry = country === 'US';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Country Selection */}
          <div className="space-y-2">
            <Label htmlFor="country">
              {t.country} <span className="text-red-500">*</span>
            </Label>
            <Select value={country} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectCountry} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {language === 'en' ? c.name_en : c.name_zh} ({c.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label>{t.accountType}</Label>
            <Tabs value={accountType} onValueChange={(v) => setAccountType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="local">{t.local}</TabsTrigger>
                <TabsTrigger value="international">{t.international}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Bank Name */}
          <div className="space-y-2">
            <Label htmlFor="bank-name">
              {t.bankName} <span className="text-red-500">*</span>
            </Label>
            {getBankList().length > 0 ? (
              <Select value={bankName} onValueChange={handleBankSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectBank} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {getBankList().map((bank: any, idx) => (
                    <SelectItem key={idx} value={bank.name || bank.name_en}>
                      {language === 'en' ? (bank.name_en || bank.name) : bank.name}
                      {bank.code && ` (${bank.code})`}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">{t.customBank}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="bank-name"
                placeholder={t.customBank}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />
            )}
            {bankName === 'other' && (
              <Input
                placeholder={t.customBank}
                value={bankName === 'other' ? '' : bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />
            )}
          </div>

          {/* Account Number or IBAN */}
          {accountType === 'international' ? (
            <div className="space-y-2">
              <Label htmlFor="iban">
                {t.iban} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="iban"
                type="text"
                placeholder={t.ibanPlaceholder}
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase())}
                maxLength={34}
                required
              />
              {isEuropeanCountry && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Info className="h-3 w-3" /> {t.ibanInfo}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="account-number">
                {t.accountNumber} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="account-number"
                type="text"
                placeholder={t.accountNumberPlaceholder}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
            </div>
          )}

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

          {/* SWIFT Code */}
          <div className="space-y-2">
            <Label htmlFor="swift-code">
              {t.swiftCode} {accountType === 'international' && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="swift-code"
              type="text"
              placeholder={t.swiftCodePlaceholder}
              value={swiftCode}
              onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
              maxLength={11}
              required={accountType === 'international'}
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Info className="h-3 w-3" /> {t.swiftInfo}
            </p>
          </div>

          {/* US Routing Number */}
          {isUSCountry && (
            <div className="space-y-2">
              <Label htmlFor="routing-number">{t.routingNumber}</Label>
              <Input
                id="routing-number"
                type="text"
                placeholder={t.routingPlaceholder}
                value={routingNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setRoutingNumber(value);
                }}
                maxLength={9}
              />
              <p className="text-xs text-gray-500">{t.routingInfo}</p>
            </div>
          )}

          {/* Branch/Sort Code */}
          {(country === 'TW' || country === 'GB') && (
            <div className="space-y-2">
              <Label htmlFor="branch-code">{t.branchCode}</Label>
              <Input
                id="branch-code"
                type="text"
                placeholder={t.branchCodePlaceholder}
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                maxLength={6}
              />
            </div>
          )}

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">{t.currency}</Label>
            <Input
              id="currency"
              type="text"
              value={currency}
              readOnly
              className="bg-gray-50"
            />
          </div>

          {/* Security Note */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t.securityNote}
            </AlertDescription>
          </Alert>

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