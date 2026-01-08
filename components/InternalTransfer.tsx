/**
 * 🏦 Internal Transfer Component
 * 
 * 用戶內部轉帳功能組件
 * 
 * Features:
 * - 即時轉帳
 * - 搜尋收款人
 * - 手續費計算
 * - 轉帳密碼驗證
 * - 限額提示
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Send, 
  User, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Info,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { formatCurrency, convertCurrency } from '../lib/currency';

interface TransferLimits {
  tier: string;
  daily_limit: number;
  per_transaction_limit: number;
  used_today: number;
  remaining_today: number;
  fee_info: {
    rate: number;
    min: number;
    max: number;
    free_threshold: number;
  };
}

export function InternalTransfer() {
  const { user, accessToken } = useAuth();
  const { language, currency } = useLanguage();
  
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [hasPin, setHasPin] = useState(false);
  const [showSetPin, setShowSetPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settingPin, setSettingPin] = useState(false);
  const [limits, setLimits] = useState<TransferLimits | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(true);

  // 語言文本
  const t = {
    en: {
      title: 'Internal Transfer',
      description: 'Transfer funds to other platform users instantly',
      recipientEmail: 'Recipient Email',
      recipientPlaceholder: 'Enter recipient email address',
      amount: 'Transfer Amount',
      amountPlaceholder: 'Enter amount',
      note: 'Note (Optional)',
      notePlaceholder: 'Add a note for this transfer',
      pin: 'Transfer PIN (6 digits)',
      pinPlaceholder: 'Enter your transfer PIN',
      transfer: 'Transfer Now',
      transferring: 'Processing...',
      fee: 'Fee',
      total: 'Total Deduction',
      willReceive: 'Recipient Will Receive',
      limits: 'Transfer Limits',
      dailyLimit: 'Daily Limit',
      perTransactionLimit: 'Per Transaction',
      usedToday: 'Used Today',
      remaining: 'Remaining',
      freeUnder: 'Free for transfers under',
      setupPin: 'Set Up Transfer PIN',
      setupPinDescription: 'Create a 6-digit PIN to secure your transfers',
      newPin: 'New PIN (6 digits)',
      confirmNewPin: 'Confirm PIN',
      setPin: 'Set PIN',
      changePin: 'Change PIN',
      success: 'Transfer Successful!',
      successMessage: 'Your transfer has been completed',
      errorTitle: 'Transfer Failed',
      pinMismatch: 'PINs do not match',
      invalidPin: 'PIN must be exactly 6 digits',
      pinSetSuccess: 'Transfer PIN set successfully',
      upgrade: 'Upgrade to increase limits',
      instantTransfer: '⚡ Instant Transfer',
      instantDesc: 'Funds arrive in seconds'
    },
    'zh-CN': {
      title: '内部转账',
      description: '即时转账给其他平台用户',
      recipientEmail: '收款人邮箱',
      recipientPlaceholder: '输入收款人邮箱地址',
      amount: '转账金额',
      amountPlaceholder: '输入金额',
      note: '备注（可选）',
      notePlaceholder: '为此转账添加备注',
      pin: '转账密码（6位数字）',
      pinPlaceholder: '输入您的转账密码',
      transfer: '立即转账',
      transferring: '处理中...',
      fee: '手续费',
      total: '总扣款',
      willReceive: '收款人将收到',
      limits: '转账限额',
      dailyLimit: '每日限额',
      perTransactionLimit: '单笔限额',
      usedToday: '今日已用',
      remaining: '剩余',
      freeUnder: '转账金额低于',
      setupPin: '设置转账密码',
      setupPinDescription: '创建一个6位数字密码以保护您的转账',
      newPin: '新密码（6位数字）',
      confirmNewPin: '确认密码',
      setPin: '设置密码',
      changePin: '更改密码',
      success: '转账成功！',
      successMessage: '您的转账已完成',
      errorTitle: '转账失败',
      pinMismatch: '密码不匹配',
      invalidPin: '密码必须是6位数字',
      pinSetSuccess: '转账密码设置成功',
      upgrade: '升级以提高限额',
      instantTransfer: '⚡ 即时到账',
      instantDesc: '资金秒级到账'
    },
    'zh-TW': {
      title: '內部轉帳',
      description: '即時轉帳給其他平台用戶',
      recipientEmail: '收款人郵箱',
      recipientPlaceholder: '輸入收款人郵箱地址',
      amount: '轉帳金額',
      amountPlaceholder: '輸入金額',
      note: '備註（可選）',
      notePlaceholder: '為此轉帳添加備註',
      pin: '轉帳密碼（6位數字）',
      pinPlaceholder: '輸入您的轉帳密碼',
      transfer: '立即轉帳',
      transferring: '處理中...',
      fee: '手續費',
      total: '總扣款',
      willReceive: '收款將收到',
      limits: '轉帳限額',
      dailyLimit: '每日限額',
      perTransactionLimit: '單筆限額',
      usedToday: '今日已用',
      remaining: '剩餘',
      freeUnder: '轉帳金額低於',
      setupPin: '設置轉帳密碼',
      setupPinDescription: '創建一個6位數字密碼以保護您的轉帳',
      newPin: '新密碼（6位數字）',
      confirmNewPin: '確認密碼',
      setPin: '設置密碼',
      changePin: '更改密碼',
      success: '轉帳成功！',
      successMessage: '您的轉帳已完成',
      errorTitle: '轉帳失敗',
      pinMismatch: '密碼不匹配',
      invalidPin: '密碼必須是6位數字',
      pinSetSuccess: '轉帳密碼設置成功',
      upgrade: '升級以提高限額',
      instantTransfer: '⚡ 即時到帳',
      instantDesc: '資金秒級到帳'
    }
  };

  const text = t[language] || t.en;

  // 計算手續費
  const calculateFee = (amt: number): number => {
    if (!limits) return 0;
    if (amt < limits.fee_info.free_threshold) return 0;
    
    const fee = amt * limits.fee_info.rate;
    if (fee < limits.fee_info.min) return limits.fee_info.min;
    if (fee > limits.fee_info.max) return limits.fee_info.max;
    
    return Math.round(fee * 100) / 100;
  };

  const amountNum = parseFloat(amount) || 0;
  const fee = calculateFee(amountNum);
  const totalDeduction = amountNum + fee;

  // 檢查是否已設置 PIN
  useEffect(() => {
    const checkPin = async () => {
      if (!user || !accessToken) return;

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/transfer/has-pin`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setHasPin(data.hasPin);
        }
      } catch (error) {
        console.error('Error checking PIN:', error);
      }
    };

    checkPin();
  }, [user, accessToken]);

  // 獲取轉帳限額
  useEffect(() => {
    const fetchLimits = async () => {
      if (!user || !accessToken) return;

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/transfer/limits`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setLimits(data);
        }
      } catch (error) {
        console.error('Error fetching limits:', error);
      } finally {
        setLoadingLimits(false);
      }
    };

    fetchLimits();
  }, [user, accessToken]);

  // 設置 PIN
  const handleSetPin = async () => {
    if (newPin !== confirmPin) {
      toast.error(text.pinMismatch);
      return;
    }

    if (!/^\d{6}$/.test(newPin)) {
      toast.error(text.invalidPin);
      return;
    }

    setSettingPin(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/transfer/set-pin`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ pin: newPin })
        }
      );

      if (response.ok) {
        toast.success(text.pinSetSuccess);
        setHasPin(true);
        setShowSetPin(false);
        setNewPin('');
        setConfirmPin('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to set PIN');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSettingPin(false);
    }
  };

  // 執行轉帳
  const handleTransfer = async () => {
    if (!recipientEmail || !amount || !pin) {
      toast.error(language === 'en' ? 'Please fill in all required fields' : language === 'zh-CN' ? '请填写所有必填字段' : '請填寫所有必填字段');
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      toast.error(text.invalidPin);
      return;
    }

    setLoading(true);

    try {
      // 🔍 診斷日誌
      console.log('🔍 [Transfer] Request details:', {
        user_id: user?.id,
        user_email: user?.email,
        to_user_email: recipientEmail,
        amount: parseFloat(amount),
        note,
        hasAccessToken: !!accessToken
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/transfer`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to_user_email: recipientEmail,
            amount: parseFloat(amount),
            note,
            transfer_pin: pin
          })
        }
      );

      console.log('🔍 [Transfer] Response status:', response.status);

      // ✅ 修復：先解析 JSON，檢查 success 字段
      const data = await response.json();
      console.log('🔍 [Transfer] Response data:', data);

      if (response.ok || data.success) {  // ← 修復：也檢查 data.success
        console.log('✅ [Transfer] Success:', data);
        toast.success(
          <div>
            <div className="font-bold">{text.success}</div>
            <div className="text-sm mt-1">{text.successMessage}</div>
            <div className="text-xs mt-2 text-gray-600">
              {language === 'en' ? 'Transfer ID:' : '轉帳 ID:'} {data.transfer_id.substring(0, 8)}...
            </div>
          </div>
        );
        
        // 清空表單
        setRecipientEmail('');
        setAmount('');
        setNote('');
        setPin('');
        
        // 刷新限額
        const limitsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/transfer/limits`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
        if (limitsResponse.ok) {
          const limitsData = await limitsResponse.json();
          setLimits(limitsData);
        }
        
        // 觸發錢包刷新事件
        window.dispatchEvent(new CustomEvent('wallet-updated'));
      } else {
        // ❌ 真正的錯誤
        console.error('❌ [Transfer] Error response:', {
          status: response.status,
          error: data,
          full_response: data
        });
        toast.error(
          <div>
            <div className="font-bold">{text.errorTitle}</div>
            <div className="text-sm mt-1">{data.error || 'Unknown error'}</div>
          </div>
        );
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!hasPin && !showSetPin) {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            {text.title}
          </CardTitle>
          <CardDescription>{text.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {text.setupPinDescription}
            </AlertDescription>
          </Alert>
          <Button onClick={() => setShowSetPin(true)} className="w-full">
            {text.setupPin}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showSetPin) {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            {text.setupPin}
          </CardTitle>
          <CardDescription>{text.setupPinDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{text.newPin}</Label>
            <Input
              type="password"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
            />
          </div>
          <div>
            <Label>{text.confirmNewPin}</Label>
            <Input
              type="password"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleSetPin} 
              disabled={settingPin}
              className="flex-1"
            >
              {settingPin ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Setting...' : '設置中...'}
                </>
              ) : (
                text.setPin
              )}
            </Button>
            {hasPin && (
              <Button 
                variant="outline" 
                onClick={() => setShowSetPin(false)}
              >
                {language === 'en' ? 'Cancel' : '取消'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 轉帳限額資訊 */}
      {limits && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                {text.limits}
              </span>
              <Badge variant="outline" className="text-xs">
                {limits.tier.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 text-xs mb-1">{text.dailyLimit}</div>
                <div className="font-semibold">
                  {formatCurrency(convertCurrency(limits.daily_limit, 'USD', currency), currency)}
                </div>
              </div>
              <div>
                <div className="text-gray-600 text-xs mb-1">{text.perTransactionLimit}</div>
                <div className="font-semibold">
                  {formatCurrency(convertCurrency(limits.per_transaction_limit, 'USD', currency), currency)}
                </div>
              </div>
              <div>
                <div className="text-gray-600 text-xs mb-1">{text.usedToday}</div>
                <div className="font-semibold text-orange-600">
                  {formatCurrency(convertCurrency(limits.used_today, 'USD', currency), currency)}
                </div>
              </div>
              <div>
                <div className="text-gray-600 text-xs mb-1">{text.remaining}</div>
                <div className="font-semibold text-green-600">
                  {formatCurrency(convertCurrency(limits.remaining_today, 'USD', currency), currency)}
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-600">
              💡 {text.freeUnder} {formatCurrency(convertCurrency(limits.fee_info.free_threshold, 'USD', currency), currency)} {language === 'en' ? 'are fee-free' : '免手續費'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 轉帳表單 */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                {text.title}
              </CardTitle>
              <CardDescription>{text.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-600 font-medium">{text.instantTransfer}</div>
              <div className="text-xs text-gray-600">{text.instantDesc}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 收款人 */}
          <div>
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {text.recipientEmail}
            </Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder={text.recipientPlaceholder}
            />
          </div>

          {/* 金額 */}
          <div>
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {text.amount}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={text.amountPlaceholder}
            />
            {amountNum > 0 && (
              <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'en' ? 'Amount:' : '金額：'}</span>
                  <span className="font-medium">{formatCurrency(convertCurrency(amountNum, 'USD', currency), currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{text.fee}:</span>
                  <span className="font-medium text-orange-600">{formatCurrency(convertCurrency(fee, 'USD', currency), currency)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">{text.total}:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(convertCurrency(totalDeduction, 'USD', currency), currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{text.willReceive}:</span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    {formatCurrency(convertCurrency(amountNum, 'USD', currency), currency)}
                    <CheckCircle className="h-4 w-4" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 備註 */}
          <div>
            <Label>{text.note}</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={text.notePlaceholder}
              maxLength={100}
            />
          </div>

          {/* PIN */}
          <div>
            <Label className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {text.pin}
            </Label>
            <Input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder={text.pinPlaceholder}
            />
            <div className="flex justify-end mt-1">
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowSetPin(true)}
                className="text-xs"
              >
                {text.changePin}
              </Button>
            </div>
          </div>

          {/* 轉帳按鈕 */}
          <Button 
            onClick={handleTransfer} 
            disabled={loading || !recipientEmail || !amount || !pin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {text.transferring}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {text.transfer}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}