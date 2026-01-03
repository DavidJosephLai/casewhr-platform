import { useState, useEffect, memo } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { getTranslation } from "../lib/translations";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner";
import { formatCurrency, convertCurrency, getDefaultCurrency, type Currency } from "../lib/currency";
import { ecpayConfig } from "../config/payment";
import { ExchangeRateIndicator } from "./ExchangeRateIndicator";
import { useExchangeRate } from "../hooks/useExchangeRate";
import { fetchWithRetry, parseJsonResponse } from "../lib/apiErrorHandler";
import { ECPayDiagnostic } from "./ECPayDiagnostic";
import { DiagnosticQuickGuide } from "./DiagnosticQuickGuide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { 
  Wallet as WalletIcon, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Lock, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  DollarSign, 
  Loader2,
  ShoppingCart,
  ExternalLink,
  AlertCircle
} from "lucide-react";

interface Wallet {
  user_id: string;
  available_balance: number;
  pending_withdrawal: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'escrow' | 'release' | 'refund' | 'withdrawal';
  amount: number;
  status: string;
  description: string;
  created_at: string;
  project_id?: string;
}

interface WalletProps {
  refreshKey?: number;
}

// ✅ 優化：將組件重命名為內部組件
function WalletComponent({ refreshKey }: WalletProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ecpay' | 'paypal'>('ecpay');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(getDefaultCurrency());
  const { convertedAmount, getConvertedAmount, isLoading: rateLoading } = useExchangeRate();
  const [showECPayDiagnostic, setShowECPayDiagnostic] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);

  // 🔥 添加認證 headers 處理函數
  const getHeaders = () => {
    const isDevMode = accessToken?.startsWith('dev-user-');
    return isDevMode
      ? { 
          'X-Dev-Token': accessToken,
          'Authorization': `Bearer ${publicAnonKey}`
        }
      : { 'Authorization': `Bearer ${accessToken}` };
  };
  
  const isClient = user?.profile?.is_client ?? (user?.profile?.account_type === 'client');
  const isFreelancer = user?.profile?.is_freelancer ?? (user?.profile?.account_type === 'freelancer');

  useEffect(() => {
    if (user?.id && accessToken) {
      loadWalletData();
    }
  }, [user?.id, accessToken, refreshKey]); // ✅ 添加 refreshKey 依賴

  const loadWalletData = async () => {
    if (!user?.id || !accessToken) return;

    setLoading(true);
    try {
      // 🔥 優先檢查開發模式的錢包信息
      const devModeActive = localStorage.getItem('dev_mode_active') === 'true';
      if (devModeActive) {
        const devWallet = localStorage.getItem('dev_mode_wallet');
        if (devWallet) {
          try {
            const walletData = JSON.parse(devWallet);
            console.log('🎁 [Wallet] Using dev mode wallet:', walletData);
            
            setWallet({
              user_id: user.id,
              available_balance: walletData.balance || 0,
              pending_withdrawal: 0,
              total_earned: 0,
              total_spent: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            setTransactions([]);
            setLoading(false);
            return;
          } catch (err) {
            console.error('Failed to parse dev mode wallet:', err);
          }
        }
      }

      console.log('[Wallet] Loading wallet data for user:', user.id);
      
      // 加载钱包余额 with automatic retry
      const walletResponse = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/${user.id}`,
        {
          headers: getHeaders(),
        },
        2, // maxRetries
        20000 // timeout - increased to 20 seconds
      );

      if (walletResponse.ok) {
        const walletData = await parseJsonResponse(walletResponse);
        console.log('[Wallet] Wallet data loaded:', walletData);
        setWallet((walletData as any).wallet);
      } else {
        const errorData = await parseJsonResponse(walletResponse).catch(() => ({ error: 'Unknown error' }));
        console.error('[Wallet] Error loading wallet:', walletResponse.status, errorData);
        
        // Set default wallet if not found
        if (walletResponse.status === 404) {
          setWallet({
            user_id: user.id,
            available_balance: 0,
            pending_withdrawal: 0,
            total_earned: 0,
            total_spent: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }

      // 加载交易历史 with automatic retry
      const transactionsResponse = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/transactions`,
        {
          headers: getHeaders(),
        },
        2, // maxRetries
        20000 // timeout - increased to 20 seconds
      );

      if (transactionsResponse.ok) {
        const transactionsData = await parseJsonResponse(transactionsResponse);
        console.log('[Wallet] Transactions loaded:', (transactionsData as any).transactions?.length || 0);
        setTransactions((transactionsData as any).transactions || []);
      } else {
        console.error('[Wallet] Error loading transactions:', transactionsResponse.status);
        setTransactions([]);
      }
    } catch (error: any) {
      console.error('[Wallet] Error loading wallet data:', error.message);
      
      toast.error(language === 'en' ? 'Failed to load wallet data' : '載入錢包數據失敗');
      
      // Set default values on persistent error
      setWallet({
        user_id: user.id || '',
        available_balance: 0,
        pending_withdrawal: 0,
        total_earned: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    
    // 檢查是否已登入
    if (!user?.id || !accessToken) {
      toast.error(
        language === 'en' 
          ? '🔐 Please sign in to deposit funds' 
          : '🔐 請先登入以充值'
      );
      return;
    }
    
    if (!amount || amount <= 0) {
      toast.error(language === 'en' ? 'Please enter a valid amount' : '請輸入有效金額');
      return;
    }

    // 檢查最低儲值金額 300 NTD
    const twdAmount = selectedCurrency === 'TWD'
      ? amount
      : convertCurrency(amount, selectedCurrency, 'TWD');
    
    if (twdAmount < 300) {
      toast.error(
        language === 'en' 
          ? 'Minimum deposit is NT$300' 
          : '最小充值金額為 NT$300'
      );
      return;
    }

    // 將輸入金額轉換為 USD（PayPal 只支持 USD）
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const usdAmount = selectedCurrency === 'USD'
      ? numericAmount  // 英文版：已經是 USD
      : convertCurrency(numericAmount, selectedCurrency, 'USD');  // TWD/CNY → USD

    console.log('💰 [PayPal] Amount conversion:', {
      inputAmount: numericAmount,
      language,
      usdAmount,
      selectedCurrency
    });

    // 驗證 USD 金額
    if (usdAmount < 1) {
      toast.error(
        language === 'en' 
          ? 'Minimum deposit is $1 USD' 
          : '最小充值金額為 $1 USD（約 NT$' + Math.round(convertCurrency(1, 'USD', 'TWD')) + '）'
      );
      return;
    }

    if (usdAmount > 1000000) {
      toast.error(language === 'en' ? 'Maximum deposit amount is $1,000,000' : '最大充值金額為 $1,000,000 USD');
      return;
    }

    setLoading(true);
    try {
      // Create PayPal Order (always use USD)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/paypal/create-order`,
        {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount: usdAmount }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Check if PayPal is configured
        if (data.configured === false) {
          toast.error(
            language === 'en' 
              ? '💳 PayPal payment is not available. Please contact support.' 
              : '💳 PayPal 支付不可用。請聯繫客服。'
          );
          setLoading(false);
          return;
        }
        
        // Redirect to PayPal Checkout
        if (data.approvalUrl) {
          window.location.href = data.approvalUrl;
        } else {
          throw new Error('No checkout URL returned');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to start payment' : '無法啟動付款'));
      setLoading(false);
    }
  };

  // Handle payment success callback
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const payment = urlParams.get('payment');
      const provider = urlParams.get('provider');
      const token = urlParams.get('token'); // PayPal order token
      const orderId = urlParams.get('orderId'); // ECPay order ID

      console.log('💳 [Payment Callback] URL params:', {
        paymentStatus: payment,
        provider: provider,
        token: token,
        orderId: orderId,
        fullURL: window.location.href,
      });

      // 🆕 Handle ECPay payment success
      if (payment === 'success' && provider === 'ecpay' && orderId) {
        console.log('💚 [ECPay] Payment callback detected:', { orderId });
        
        // Show success message
        toast.success(
          language === 'en' 
            ? '🎉 ECPay payment successful! Your wallet will be updated shortly.' 
            : '🎉 綠界付款成功！您的錢包餘額即將更新。',
          { duration: 5000 }
        );
        
        // Reload wallet data after a short delay to allow backend processing
        setTimeout(() => {
          console.log('🔄 [ECPay] Reloading wallet data...');
          loadWalletData();
        }, 2000);
        
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      // Handle PayPal payment success
      if (payment === 'success' && provider === 'paypal' && token) {
        try {
          console.log('🅿️ [PayPal] Processing payment callback...', { token });
          
          // Show loading toast
          toast.loading(language === 'en' ? 'Processing PayPal payment...' : '處理 PayPal 付款中...');

          // Capture the payment - No JWT required!
          // The backend will extract user_id from PayPal order data
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/paypal/capture-payment`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`, // ✅ Use Anon Key instead of access token
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ orderId: token }),
            }
          );

          console.log('🅿️ [PayPal] Capture response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            
            console.log('✅ [PayPal] Payment captured:', { success: true, amount: data.amount });
            
            toast.dismiss(); // Dismiss loading toast
            toast.success(
              language === 'en' 
                ? `🎉 Payment successful! $${data.amount.toLocaleString()} added to your wallet.` 
                : `🎉 付款成功！已將 $${data.amount.toLocaleString()} 加入您的錢包。`,
              { duration: 5000 }
            );
            
            // Reload wallet data
            loadWalletData();
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ [PayPal] Capture failed:', errorData);
            
            toast.dismiss();
            
            // More detailed error message
            const errorMessage = errorData.error || errorData.message || '未知錯';
            const errorCode = errorData.code || response.status;
            
            toast.error(
              language === 'en' 
                ? `❌ Payment failed (${errorCode}): ${errorMessage}` 
                : `❌ 付款失敗 (${errorCode})：${errorMessage}`,
              { duration: 8000 }
            );
          }
        } catch (error: any) {
          console.error('❌ [PayPal] Error capturing payment:', error);
          toast.dismiss();
          
          // Better error message with details
          const errorMessage = error?.message || error?.toString() || '未知錯誤';
          toast.error(
            language === 'en' 
              ? ` Failed to process payment: ${errorMessage}` 
              : `❌ 處理付款失敗：${errorMessage}`,
            { duration: 8000 }
          );
        }

        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      } 
      // Handle payment cancellation
      else if (payment === 'cancel') {
        toast.error(
          language === 'en' ? 'Payment cancelled' : '付款已取消',
          { duration: 3000 }
        );
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    handlePaymentSuccess();
  }, [language]); // No longer need accessToken dependency

  // ECPay deposit handler
  const handleECPayDeposit = async () => {
    const amount = parseFloat(depositAmount);
    
    // 检查是否已登入
    if (!user?.id || !accessToken) {
      toast.error(
        language === 'en' 
          ? '🔐 Please sign in to deposit funds' 
          : language === 'zh-CN'
          ? '🔐 请先登入以充值'
          : '🔐 請先登入以充值'
      );
      return;
    }
    
    if (!amount || amount <= 0) {
      toast.error(language === 'en' ? 'Please enter a valid amount' : '請輸入有效金額');
      return;
    }

    // 根據顯示貨幣轉換為 TWD（ECPay 只支持 TWD）
    const twdAmount = selectedCurrency === 'TWD'
      ? Math.round(amount)  // 已經是 TWD
      : Math.round(convertCurrency(amount, selectedCurrency, 'TWD'));  // USD/CNY → TWD

    // 檢查最低儲值金額 300 NTD
    if (twdAmount < 300) {
      toast.error(
        language === 'en' 
          ? 'Minimum deposit is NT$300' 
          : '最小充值金額為 NT$300'
      );
      return;
    }

    setLoading(true);
    try {
      console.log('💳 [ECPay] Creating order:', { amount: twdAmount });
      
      // 调用新的创建订单 API
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay/create-order`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            amount: twdAmount,
            payment_type: 'deposit',
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        console.log(' [ECPay] Order created:', {
          orderId: data.orderId,
          paymentId: data.paymentId,
        });
        
        // 使用自动提交表单跳转到 ECPay
        if (data.autoSubmitForm) {
          const paymentWindow = window.open('', '_blank');
          if (paymentWindow) {
            paymentWindow.document.write(data.autoSubmitForm);
            paymentWindow.document.close();
            
            toast.success(
              language === 'en'
                ? '🔄 Redirecting to ECPay payment page...'
                : language === 'zh-CN'
                ? '🔄 正在跳转到绿界付款页面...'
                : '🔄 正在跳轉到綠界付款頁面...',
              { duration: 3000 }
            );
            
            setShowDepositDialog(false);
            setDepositAmount('');
          } else {
            toast.error(
              language === 'en'
                ? '❌ Please allow pop-ups to complete payment'
                : language === 'zh-CN'
                ? '❌ 请允许弹出窗口以完成付款'
                : '❌ 請允許彈出視窗以完成付款'
            );
          }
        } else {
          throw new Error('No payment form returned');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ [ECPay] Create order failed:', errorData);
        
        toast.error(
          language === 'en'
            ? `Failed to create order: ${errorData.error}`
            : language === 'zh-CN'
            ? `创建订单失败：${errorData.error}`
            : `創建訂單失敗：${errorData.error}`
        );
      }
    } catch (error: any) {
      console.error('❌ [ECPay] Error:', error);
      toast.error(
        language === 'en'
          ? 'Failed to start ECPay payment'
          : language === 'zh-CN'
          ? '无法启动绿界付款'
          : '無法啟動綠界付款'
      );
    } finally {
      setLoading(false);
    }
  };

  // LINE Pay deposit handler
  const handleLINEPayDeposit = () => {
    const amount = parseFloat(depositAmount);
    
    if (!amount || amount <= 0) {
      toast.error(language === 'en' ? 'Please enter a valid amount' : '請輸入有效金額');
      return;
    }

    // 根據顯示貨幣轉換為 TWD（LINE Pay 只支持 TWD）
    const twdAmount = selectedCurrency === 'TWD'
      ? Math.round(amount)  // 已經是 TWD
      : Math.round(convertCurrency(amount, selectedCurrency, 'TWD'));  // USD/CNY → TWD

    // 檢查最低儲值金額 300 NTD
    if (twdAmount < 300) {
      toast.error(
        language === 'en' 
          ? 'Minimum deposit is NT$300' 
          : '最小充值金額為 NT$300'
      );
      return;
    }

    // 提示用戶 - 演示環境說明
    toast.info(
      language === 'en'
        ? '💡 LINE Pay is a demo feature\nActual deployment requires LINE Pay merchant account and API integration'
        : language === 'zh-CN'
        ? '💡 LINE Pay 付款为演示功能\n实际部署时需开通 LINE Pay 商家账号并设定 API 串接' 
        : '💡 LINE Pay 付款為演示功能\n實際部署時需開通 LINE Pay 商家帳號並設定 API 串接',
      { duration: 5000 }
    );
    
    // 在新標籤打開 LINE Pay 官網（演示用）
    window.open('https://pay.line.me/tw/intro', '_blank', 'noopener,noreferrer');
    
    // 顯示後續指示
    setTimeout(() => {
      toast.success(
        language === 'en'
          ? `📋 Demo Process:\n1. Complete payment of NT$${twdAmount.toLocaleString()}\n2. Take screenshot of payment proof\n3. Contact support to submit proof\n4. Wait for confirmation for automatic top-up`
          : language === 'zh-CN'
          ? `📋 演示流程：\n1. 完成付款 NT$${twdAmount.toLocaleString()}\n2. 截图付款证明\n3. 联系客服提交付款证明\n4. 等待确认后自动充值` 
          : `📋 演示流程：\n1. 完成付款 NT$${twdAmount.toLocaleString()}\n2. 截圖付款證明\n3. 聯繫客服提交付款證明\n4. 等待確認後自動充值`,
        { duration: 12000 }
      );
    }, 2500);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast.error(language === 'en' ? 'Please enter a valid amount' : '���輸入有效金額');
      return;
    }

    if (amount > (wallet?.available_balance || 0)) {
      toast.error(language === 'en' ? 'Insufficient balance' : '餘額不足');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/withdraw`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ amount }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWallet(data.wallet);
        toast.success(language === 'en' ? `Withdrawn $${amount.toLocaleString()}` : `已提領 $${amount.toLocaleString()}`);
        setWithdrawAmount("");
        setShowWithdrawDialog(false);
        loadWalletData(); // 重新加载以更新交易记录
      } else {
        const error = await response.json();
        toast.error(error.error || (language === 'en' ? 'Failed to withdraw' : '提領失敗'));
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error(language === 'en' ? 'Failed to withdraw' : '提領失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateWallet = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/migrate`,
        {
          method: 'POST',
          headers: getHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('🔧 Migration result:', data);
        toast.success(language === 'en' ? 'Wallet migrated successfully!' : '錢包遷移成功！');
        loadWalletData(); // 重新加载钱包数据
      } else {
        const error = await response.json();
        toast.error(error.error || (language === 'en' ? 'Failed to migrate' : '遷移失敗'));
      }
    } catch (error) {
      console.error('Error migrating wallet:', error);
      toast.error(language === 'en' ? 'Failed to migrate' : '遷移失敗');
    } finally {
      setLoading(false);
    }
  };

  // 🎁 開發模式：添加測試餘額
  const handleAddTestFunds = async () => {
    const isDevMode = accessToken?.startsWith('dev-user-');
    if (!isDevMode) {
      toast.error('This feature is only available in development mode');
      return;
    }

    setLoading(true);
    try {
      // 直接創建測試錢包
      const testWallet = {
        user_id: user?.id,
        balance: 1000000, // 100萬測試餘額
        total_earned: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 使用後端 API 創建錢包
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/${user?.id}/add-test-funds`,
        {
          method: 'POST',
          headers: getHeaders(),
        }
      );

      if (response.ok || response.status === 404) {
        toast.success(
          language === 'en'
            ? '🎁 Added NT$1,000,000 test funds!'
            : '🎁 已添加 NT$1,000,000 測試餘額！'
        );
        await loadWalletData();
      } else {
        throw new Error('Failed to add test funds');
      }
    } catch (error) {
      console.error('Error adding test funds:', error);
      toast.error(
        language === 'en'
          ? 'Failed to add test funds'
          : '添加測試餘額失敗'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'deposit') return <ArrowDownToLine className="h-4 w-4 text-green-600" />;
    if (type === 'withdrawal') return <ArrowUpFromLine className="h-4 w-4 text-orange-600" />;
    if (type === 'escrow') return <Lock className="h-4 w-4 text-blue-600" />;
    if (type === 'release') {
      return amount > 0 
        ? <TrendingUp className="h-4 w-4 text-green-600" />
        : <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <DollarSign className="h-4 w-4 text-gray-600" />;
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (type === 'deposit' || (type === 'release' && amount > 0)) return 'text-green-600';
    if (type === 'withdrawal' || (type === 'release' && amount < 0)) return 'text-red-600';
    if (type === 'escrow') return 'text-blue-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'en' ? 'en-US' : language === 'zh-CN' ? 'zh-CN' : 'zh-TW';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">
          {language === 'en' ? 'Loading wallet...' : '載入錢包中...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 三幣別匯率指示器 */}
      <ExchangeRateIndicator />

      {/* 🚨 ECPay 診斷工具 - 置頂顯示 */}
      <Card className="border-2 border-red-500 bg-gradient-to-r from-red-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="h-5 w-5" />
            🔍 ECPay 充值診斷工具
          </CardTitle>
          <CardDescription>
            如果充值後錢包餘額未更新，請使用此工具檢查並手動確認付款
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ECPayDiagnostic />
        </CardContent>
      </Card>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <WalletIcon className="h-5 w-5" />
              {getTranslation(language).wallet?.availableBalance || (language === 'en' ? 'Available Balance' : '可用餘額')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-blue-600">
              {formatCurrency(wallet?.available_balance || 0, selectedCurrency)}
            </p>
            <div className="flex gap-2 mt-4">
              <Button 
                size="sm" 
                onClick={() => setShowDepositDialog(true)}
                className="flex-1"
              >
                <ArrowDownToLine className="h-4 w-4 mr-1" />
                {getTranslation(language).wallet?.deposit || (language === 'en' ? 'Deposit' : '充值')}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowWithdrawDialog(true)}
                disabled={(wallet?.available_balance || 0) === 0}
                className="flex-1"
              >
                <ArrowUpFromLine className="h-4 w-4 mr-1" />
                {getTranslation(language).wallet?.withdraw || (language === 'en' ? 'Withdraw' : '提領')}
              </Button>
            </div>
            {/* 🎁 開發模式：測試充值按鈕 */}
            {accessToken?.startsWith('dev-user-') && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddTestFunds}
                disabled={loading}
                className="w-full mt-2 border-2 border-dashed border-green-500 text-green-700 hover:bg-green-50"
              >
                🎁 {language === 'en' ? 'Add Test Funds (NT$1M)' : '添加測試餘額 (NT$100萬)'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Locked in Escrow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Lock className="h-5 w-5" />
              {getTranslation(language).wallet?.lockedInEscrow || (language === 'en' ? 'Locked in Escrow' : '托管中')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-gray-700">
              {formatCurrency(wallet?.pending_withdrawal || 0, selectedCurrency)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {isClient 
                ? (language === 'en' ? 'Funds locked for active projects' : '專案進行中的托管款項')
                : (language === 'en' ? 'Protected by escrow system' : '受托管系統保護')}
            </p>
          </CardContent>
        </Card>

        {/* Total Earned/Spent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              {isFreelancer ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {isFreelancer 
                ? (getTranslation(language).wallet?.totalEarned || (language === 'en' ? 'Total Earned' : '總收入'))
                : (getTranslation(language).wallet?.totalSpent || (language === 'en' ? 'Total Spent' : '總支出'))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-gray-700">
              {isFreelancer 
                ? formatCurrency(wallet?.total_earned || 0, selectedCurrency)
                : formatCurrency(wallet?.total_spent || 0, selectedCurrency)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {language === 'en' ? 'Lifetime' : '歷史總計'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {getTranslation(language).wallet?.transactionHistory || (language === 'en' ? 'Transaction History' : '交易記錄')}
          </CardTitle>
          <CardDescription>
            {language === 'en' 
              ? 'View all your wallet transactions' 
              : '查看您的所有錢包交易錄'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p>{language === 'en' ? 'No transactions yet' : '暫無交易記錄'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'en' ? 'Type' : '類型'}</TableHead>
                    <TableHead>{language === 'en' ? 'Description' : '描述'}</TableHead>
                    <TableHead>{language === 'en' ? 'Date' : '日期'}</TableHead>
                    <TableHead className="text-right">{language === 'en' ? 'Amount' : '金額'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type, transaction.amount)}
                          <Badge variant="outline" className="capitalize">
                            {getTranslation(language).wallet?.transactionTypes?.[transaction.type] || transaction.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="line-clamp-2 text-sm">{transaction.description}</p>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(transaction.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${getTransactionColor(transaction.type, transaction.amount)}`}>
                          {transaction.amount > 0 ? '+' : ''}{Math.abs(transaction.amount).toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5" />
              {getTranslation(language).wallet?.depositFunds || (language === 'en' ? 'Deposit Funds' : '充值包')}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Add money to your wallet for payments and subscriptions' 
                : '為您的錢包充值以支付專案款項和訂閱費用'}
            </DialogDescription>
          </DialogHeader>
          
          {/* 最小充值提示 */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-green-900">
              💰 {language === 'en' ? 'Minimum Deposit Requirements' : language === 'zh-CN' ? '最低充值要求' : '最低充值要求'}
            </p>
            <p className="text-sm text-green-800">
              {language === 'en' 
                ? '💵 Minimum deposit amount: NT$300 (≈ $10 USD)' 
                : language === 'zh-CN'
                ? '💵 最低充值金额：NT$300（约 ¥70 民币 / $10 美元）'
                : '💵 最低充值金額：NT$300（約 $10 USD）'}
            </p>
            <p className="text-xs text-green-700 whitespace-pre-line">
              {language === 'en'
                ? '• ECPay (Taiwan): Credit/Debit cards, ATM, convenience stores\n• PayPal: International payments via PayPal account'
                : language === 'zh-CN'
                ? '• 绿界支付（台湾）：信用卡/借记卡、ATM、便利店\n• PayPal：通过 PayPal 账号国际支付'
                : '• 綠界支付（台灣）：信用卡/金融卡、ATM、超商代碼\n• PayPal：透過 PayPal 帳號國際支付'}
            </p>
          </div>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">
                {language === 'en' ? `Amount (${selectedCurrency})` : language === 'zh-CN' ? `金额 (${selectedCurrency})` : `金額 (${selectedCurrency})`}
              </Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder={selectedCurrency === 'USD' ? '0.00' : '0'}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min={selectedCurrency === 'TWD' ? '300' : selectedCurrency === 'CNY' ? '70' : '10'}
                step={selectedCurrency === 'USD' ? '0.01' : '1'}
              />
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md mt-2">
                <div className="text-yellow-600 mt-0.5">⚠️</div>
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">
                    {language === 'en' 
                      ? 'Minimum deposit: NT$300 (≈ $10 USD)' 
                      : language === 'zh-CN'
                      ? '最低储值金额：NT$300（约 $10 USD）'
                      : '最低儲值金額：NT$300（約 $10 USD）'}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {language === 'en'
                      ? 'ECPay requires a minimum of NT$100, but we recommend NT$300 for better value.'
                      : language === 'zh-CN'
                      ? '绿界金流最低 NT$100，建议 NT$300 以上较划算。'
                      : '綠界金流最低 NT$100，建議 NT$300 以上較划算。'}
                  </p>
                </div>
              </div>
              {depositAmount && parseFloat(depositAmount) > 0 && (
                <p className="text-sm text-gray-600">
                  {language === 'en' ? (
                    `💱 約 NT$${convertCurrency(parseFloat(depositAmount), 'USD', 'TWD').toLocaleString()} 台幣`
                  ) : (
                    `💱 約 $${convertCurrency(parseFloat(depositAmount), 'TWD', 'USD').toFixed(2)} USD`
                  )}
                </p>
              )}
            </div>
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-blue-900">
                💡 {language === 'en' ? 'Quick amounts:' : '快速選擇金額：'}
              </p>
              <div className="flex gap-2 flex-wrap">
                {language === 'en' ? (
                  // English - USD amounts
                  [100, 500, 1000, 5000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount(amount.toString())}
                    >
                      ${amount.toLocaleString()}
                    </Button>
                  ))
                ) : (
                  // Chinese - TWD amounts
                  [3000, 5000, 10000, 30000].map((twd) => {
                    const usd = convertCurrency(twd, 'TWD', 'USD');
                    return (
                      <Button
                        key={twd}
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount(twd.toString())}
                        className="flex flex-col items-start py-2 h-auto"
                      >
                        <span className="font-semibold">NT${twd.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">≈ ${usd.toFixed(2)}</span>
                      </Button>
                    );
                  })
                )}
              </div>
              {language === 'zh' && !rateLoading && (
                <p className="text-xs text-blue-700 mt-2">
                  💱 即時匯率：1 USD = {convertedAmount?.toFixed(2) || '0'} TWD
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-3">
            {/* Row 1: 取消按钮 */}
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setShowDepositDialog(false)} className="w-full">
                {language === 'en' ? 'Cancel' : '取消'}
              </Button>
            </div>
            
            {/* Row 2: 綠界 PayPal (台灣用戶優先顯示綠界) */}
            <div className="flex gap-2 w-full">
              {language === 'zh' ? (
                <>
                  {/* 台灣用戶：綠界優先 */}
                  <Button 
                    onClick={handleECPayDeposit} 
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    綠界信用卡
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                  <Button 
                    onClick={handleDeposit} 
                    disabled={loading}
                    className="flex-1 bg-[#0070ba] hover:bg-[#003087] text-white"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg style={{ height: '20px', width: 'auto' }} viewBox="0 0 124 33" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.564.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.56-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317z" fill="white"></path>
                        <path d="M84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z" fill="white"></path>
                        <path d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317z" fill="white"></path>
                      </svg>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {/* 英文用戶：PayPal 優先 */}
                  <Button 
                    onClick={handleDeposit} 
                    disabled={loading}
                    className="flex-1 bg-[#0070ba] hover:bg-[#003087] text-white"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg style={{ height: '20px', width: 'auto' }} viewBox="0 0 124 33" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.564.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.56-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317z" fill="white"></path>
                        <path d="M84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z" fill="white"></path>
                        <path d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317z" fill="white"></path>
                      </svg>
                    )}
                  </Button>
                  <Button 
                    onClick={handleECPayDeposit} 
                    disabled={loading}
                    variant="outline"
                    className="flex-1 bg-white hover:bg-gray-50 border-2 border-green-500"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-green-600">綠界付款</span>
                    <ExternalLink className="h-3 w-3 ml-1 text-green-600" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Row 3: LINE Pay (佔滿寬度) */}
            <div className="w-full">
              <Button 
                variant="outline"
                disabled
                className="w-full bg-gray-50 border-2 border-dashed border-gray-300 cursor-not-allowed opacity-60"
              >
                <span className="text-gray-400">LINE Pay</span>
                <span className="ml-2 text-xs text-gray-400">(即將推出)</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 提現對話框 - Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? '💸 Withdraw Funds' : '💸 提現'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Withdraw funds from your wallet to your payment method' 
                : '從錢包提領資金到您的付款方式'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">
                {language === 'en' ? `Amount (${selectedCurrency})` : `金額 (${selectedCurrency})`}
              </Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder={selectedCurrency === 'USD' ? '0.00' : '0'}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="1"
                step={selectedCurrency === 'USD' ? '0.01' : '1'}
              />
              <p className="text-sm text-gray-600">
                {language === 'en' 
                  ? `Available balance: ${formatCurrency(wallet?.available_balance || 0, selectedCurrency)}` 
                  : `可用餘額：${formatCurrency(wallet?.available_balance || 0, selectedCurrency)}`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button onClick={handleWithdraw} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {language === 'en' ? 'Withdraw' : '提現'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ✅ 使用 React.memo 優化組件渲染
// 只在 refreshKey 改變時重新渲染
export const Wallet = memo(WalletComponent, (prevProps, nextProps) => {
  // 返回 true 表示 props 相同，不需要重新渲染
  // 返回 false 表示 props 不同，需要重新渲染
  return prevProps.refreshKey === nextProps.refreshKey;
});