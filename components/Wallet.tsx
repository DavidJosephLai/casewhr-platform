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
import { ECPayManualConfirm } from "./ECPayManualConfirm";
import { ECPayCallbackDiagnostic } from "./ECPayCallbackDiagnostic";
import { PlatformRevenueFixTool } from "./PlatformRevenueFixTool";
import { PayPalTransactionFixTool } from "./PayPalTransactionFixTool";
import { handleECPayCallback } from "./WalletECPayCallbackFix"; // 🔧 ECPay 回調修復
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
  // 🚀 優化：移除全局 loading，改用樂觀更新
  const [loadingWallet, setLoadingWallet] = useState(true); // 只在初始載入時顯示
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ecpay' | 'paypal'>('ecpay');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(getDefaultCurrency(language));
  const { convertedAmount, getConvertedAmount, isLoading: rateLoading } = useExchangeRate();
  const [showECPayDiagnostic, setShowECPayDiagnostic] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  
  // ⭐ 平台收入統計（僅顯示給 davidlai234@hotmail.com）
  const [platformRevenue, setPlatformRevenue] = useState<{
    total: number;
    subscription: number;
    serviceFee: number;
  } | null>(null);
  const isPlatformOwner = user?.email === 'davidlai234@hotmail.com';

  // 🌍 當語言變更時，自動更新顯示貨幣
  useEffect(() => {
    setSelectedCurrency(getDefaultCurrency(language));
  }, [language]);

  // 💱 錢包金額換算輔助函數（資料庫存 USD，顯示時換算）
  const convertWalletAmount = (usdAmount: number): number => {
    return convertCurrency(usdAmount, 'USD', selectedCurrency);
  };

  // 💰 計算當前顯示的錢包餘額（轉換一次後存儲，避免重複計算）
  const displayedAvailableBalance = convertWalletAmount(wallet?.available_balance || 0);
  const displayedPendingWithdrawal = convertWalletAmount(wallet?.pending_withdrawal || 0);
  const displayedTotalEarned = convertWalletAmount(wallet?.total_earned || 0);
  const displayedTotalSpent = convertWalletAmount(wallet?.total_spent || 0);

  // 🐛 調試函數：顯示原始 USD 數據
  const showDebugInfo = () => {
    if (!wallet) return;
    
    // 獲取當前匯率
    const twdRate = convertCurrency(1, 'USD', 'TWD');
    const cnyRate = convertCurrency(1, 'USD', 'CNY');
    
    const debugInfo = `
 錢包調試信息：

💰 原始數據（USD）：
- 可用餘額：$${wallet.available_balance?.toFixed(2) || '0.00'} USD
- 托管中：$${wallet.pending_withdrawal?.toFixed(2) || '0.00'} USD
- 總收入：$${wallet.total_earned?.toFixed(2) || '0.00'} USD
- 總支出：$${wallet.total_spent?.toFixed(2) || '0.00'} USD

💱 顯示數據（${selectedCurrency}）：
- 可用餘額：${formatCurrency(displayedAvailableBalance, selectedCurrency)}
- 托管中：${formatCurrency(displayedPendingWithdrawal, selectedCurrency)}
- 總收入：${formatCurrency(displayedTotalEarned, selectedCurrency)}
- 總支出：${formatCurrency(displayedTotalSpent, selectedCurrency)}

⚙️ 當前即時匯率：
1 USD = ${twdRate.toFixed(4)} TWD
1 USD = ${cnyRate.toFixed(4)} CNY

📊 匯率來源：
${rateLoading ? '⏳ 載入中...' : '✅ API 即時匯率（緩存 1 小時）'}

🧮 計算驗證：
$${wallet.available_balance?.toFixed(2)} × ${twdRate.toFixed(4)} = NT$${((wallet.available_balance || 0) * twdRate).toFixed(2)}
$${wallet.total_spent?.toFixed(2)} × ${twdRate.toFixed(4)} = NT$${((wallet.total_spent || 0) * twdRate).toFixed(2)}

📝 最近 5 筆交易（原始 USD）：
${transactions.slice(0, 5).map((t, i) => `${i + 1}. ${t.type}: $${t.amount.toFixed(2)} USD (${t.description})`).join('\n')}
    `.trim();
    
    console.log(debugInfo);
    alert(debugInfo);
  };
  
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

  // 🔄 監聽錢包刷新事件
  useEffect(() => {
    const handleRefreshWallet = () => {
      console.log('🔄 [Wallet] Received refreshWallet event, reloading data...');
      loadWalletData();
    };

    window.addEventListener('refreshWallet', handleRefreshWallet);
    
    return () => {
      window.removeEventListener('refreshWallet', handleRefreshWallet);
    };
  }, [user?.id, accessToken]); // 依賴於 user 和 token

  const loadWalletData = async () => {
    if (!user?.id || !accessToken) return;

    setLoadingWallet(true);
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
            setLoadingWallet(false);
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

      let transactionsData: any = null; // 🔧 初始化變量
      
      if (transactionsResponse.ok) {
        transactionsData = await parseJsonResponse(transactionsResponse);
        console.log('[Wallet] Transactions loaded:', transactionsData.transactions?.length || 0);
        setTransactions(transactionsData.transactions || []);
      } else {
        console.error('[Wallet] Error loading transactions:', transactionsResponse.status);
        setTransactions([]);
      }

      // ⭐ 加載平台收入統計（僅平台擁有者）
      if (isPlatformOwner) {
        try {
          const revenueTransactions = transactionsData?.transactions?.filter(
            (t: Transaction) => t.type === 'subscription_revenue'
          ) || [];
          
          const subscriptionRevenue = revenueTransactions.reduce(
            (sum: number, t: Transaction) => sum + (t.amount || 0), 
            0
          );

          setPlatformRevenue({
            total: subscriptionRevenue,
            subscription: subscriptionRevenue,
            serviceFee: 0 // 未來可以加入服務費統計
          });

          console.log('💰 [Platform Revenue] Loaded:', { subscriptionRevenue });
        } catch (error) {
          console.error('Error loading platform revenue:', error);
        }
      }
    } catch (error: any) {
      console.error('[Wallet] Error loading wallet data:', error.message);
      
      // 🔧 添加更詳細的錯誤日誌
      console.error('[Wallet] Error details:', {
        message: error.message,
        stack: error.stack,
        userId: user.id,
        hasToken: !!accessToken,
      });
      
      toast.error(
        language === 'en' 
          ? 'Failed to load wallet data' 
          : language === 'zh-CN'
          ? '載入錢包數據失敗'
          : '載入錢包數據失敗'
      );
      
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
      setLoadingWallet(false);
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

    // 檢查最低儲值金 300 NTD
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
      toast.error(language === 'en' ? 'Maximum deposit amount is $1,000,000' : '最充值金額為 $1,000,000 USD');
      return;
    }

    // 🚀 優化：使用 toast 提示，不阻塞 UI
    const loadingToast = toast.loading(
      language === 'en' ? 'Creating PayPal order...' : '創建 PayPal 訂單中...'
    );
    
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
          toast.dismiss(loadingToast);
          toast.error(
            language === 'en' 
              ? '💳 PayPal payment is not available. Please contact support.' 
              : '💳 PayPal 支付不可用。聯繫客服。'
          );
          return;
        }
        
        // Redirect to PayPal Checkout
        if (data.approvalUrl) {
          toast.dismiss(loadingToast);
          toast.success(
            language === 'en' ? '🔄 Redirecting to PayPal...' : '🔄 正在跳轉到 PayPal...'
          );
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
      toast.dismiss(loadingToast);
      toast.error(error.message || (language === 'en' ? 'Failed to start payment' : '無法啟動付款'));
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
            ? '🎉 ECPay payment successful! Your wallet will be updated shortly.\n\n📄 E-invoice will be issued within 24 hours.\n🔍 Check at: Ministry of Finance E-Invoice Platform\nhttps://www.einvoice.nat.gov.tw/' 
            : '🎉 綠界付款成功！您的錢包餘額即將更新。\n\n📄 電子發票將於 24 小時內開立\n🔍 查詢請至：財政部電子發票整合服務平台\nhttps://www.einvoice.nat.gov.tw/',
          { duration: 8000 }
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

      // 🔧 修復：當用戶從 ECPay 返回時，查詢後端驗證付款狀態
      if (provider === 'ecpay' && orderId) {
        await handleECPayCallback({
          orderId,
          language,
          projectId,
          publicAnonKey,
          accessToken, // 🔧 傳入用戶的 accessToken
          loadWalletData,
          toast,
        });
        
        /*
        try {
          // 查詢付款狀態
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay-payments/by-order/${orderId}`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const paymentData = data.payment;
            
            console.log('📊 [ECPay] Payment status:', paymentData.status);
            
            if (paymentData.status === 'confirmed') {
              // 付款已確認，顯示成功訊息
              toast.success(
                language === 'en' 
                  ? '🎉 ECPay payment successful! Your wallet has been updated.\n\n📄 E-invoice will be issued within 24 hours.\n🔍 Check at: Ministry of Finance E-Invoice Platform\nhttps://www.einvoice.nat.gov.tw/' 
                  : '🎉 綠界付款成功！您的錢包餘額已更新。\n\n📄 電子發票將於 24 小時內開立\n🔍 查詢請至：財政部電子發票整合服務平台\nhttps://www.einvoice.nat.gov.tw/',
                { duration: 8000 }
              );
              
              // 重新加載錢包數據
              loadWalletData();
            } else if (paymentData.status === 'pending') {
              // 付款待處理
              toast.info(
                language === 'en' 
                  ? '⏳ Payment is being processed. Please wait a moment...' 
                  : '⏳ 付款處理中，請稍候...',
                { duration: 5000 }
              );
              
              // 2秒後重新檢查
              setTimeout(() => {
                loadWalletData();
              }, 2000);
            } else if (paymentData.status === 'rejected') {
              // 付款失敗
              toast.error(
                language === 'en' 
                  ? '❌ Payment failed. Please try again or contact support.' 
                  : '❌ 付款失敗，請重試或聯繫客服。',
                { duration: 5000 }
              );
            }
          } else {
            console.warn('⚠️ [ECPay] Payment not found, might still be processing');
            toast.info(
              language === 'en' 
                ? '⏳ Checking payment status...' 
                : '⏳ 正在確認付款狀態...',
              { duration: 3000 }
            );
          }
        } catch (error) {
          console.error('❌ [ECPay] Error checking payment status:', error);
        }
        */
        
        // 清理 URL
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
                ? `🎉 Payment successful! $${data.amount.toLocaleString()} added to your wallet.\n\n📄 E-invoice will be issued within 24 hours.\n🔍 Check at: Ministry of Finance E-Invoice Platform\nhttps://www.einvoice.nat.gov.tw/` 
                : `🎉 付款成功！已將 $${data.amount.toLocaleString()} 加入您的錢包。\n\n📄 電子發票將於 24 小時內開立\n🔍 查詢請至：財政部電子發票整合服務平台\nhttps://www.einvoice.nat.gov.tw/`,
              { duration: 8000 }
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

    // 🚀 優化：使用 toast 提示，不阻塞 UI
    const loadingToast = toast.loading(
      language === 'en' ? 'Creating ECPay order...' : '創建綠界訂單中...'
    );
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
                ? '🔄 正跳到绿界付款页面...'
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
            : `創訂單失敗：${errorData.error}`
        );
      }
    } catch (error: any) {
      console.error('❌ [ECPay] Error:', error);
      toast.dismiss(loadingToast);
      toast.error(
        language === 'en'
          ? 'Failed to start ECPay payment'
          : language === 'zh-CN'
          ? '无法启动绿界付款'
          : '無法啟動綠界付款'
      );
    }
  };

  // LINE Pay deposit handler
  const handleLINEPayDeposit = () => {
    const amount = parseFloat(depositAmount);
    
    if (!amount || amount <= 0) {
      toast.error(language === 'en' ? 'Please enter a valid amount' : '請輸入有效額');
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
      toast.error(language === 'en' ? 'Please enter a valid amount' : '輸入有效金額');
      return;
    }

    // ✅ 修复：使用转换后的余额进行比较（当地货币 vs 当地货币）
    if (amount > displayedAvailableBalance) {
      toast.error(language === 'en' ? 'Insufficient balance' : '餘額不足');
      return;
    }

    // 🚀 優化：使用 toast 提示，不阻塞 UI
    const loadingToast = toast.loading(
      language === 'en' ? 'Processing withdrawal...' : '處理提現中...'
    );
    try {
      // ️ 重要：后端需要 USD，所以要转回 USD
      const usdAmount = selectedCurrency === 'USD'
        ? amount
        : convertCurrency(amount, selectedCurrency, 'USD');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wallet/withdraw`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ amount: usdAmount }),  // ✅ 发送 USD 到后端
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWallet(data.wallet);
        toast.dismiss(loadingToast);
        toast.success(language === 'en' ? `Withdrawn ${formatCurrency(amount, selectedCurrency)}` : `已提領 ${formatCurrency(amount, selectedCurrency)}`);
        setWithdrawAmount("");
        setShowWithdrawDialog(false);
        loadWalletData(); // 重新加载以更新交易记录
      } else {
        const error = await response.json();
        toast.dismiss(loadingToast);
        toast.error(error.error || (language === 'en' ? 'Failed to withdraw' : '提領失敗'));
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.dismiss(loadingToast);
      toast.error(language === 'en' ? 'Failed to withdraw' : '提領失敗');
    }
  };

  const handleMigrateWallet = async () => {
    // 🚀 優化：使用 toast 提示，不阻塞 UI
    const loadingToast = toast.loading(
      language === 'en' ? 'Migrating wallet...' : '遷移錢包中...'
    );
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
        toast.dismiss(loadingToast);
        toast.success(language === 'en' ? 'Wallet migrated successfully!' : '錢包遷移成功！');
        loadWalletData(); // 重新加载钱包数据
      } else {
        const error = await response.json();
        toast.dismiss(loadingToast);
        toast.error(error.error || (language === 'en' ? 'Failed to migrate' : '遷移失敗'));
      }
    } catch (error) {
      console.error('Error migrating wallet:', error);
      toast.dismiss(loadingToast);
      toast.error(language === 'en' ? 'Failed to migrate' : '遷移失敗');
    }
  };

  // 🎁 開發模式：添加測試餘額
  const handleAddTestFunds = async () => {
    const isDevMode = accessToken?.startsWith('dev-user-');
    if (!isDevMode) {
      toast.error('This feature is only available in development mode');
      return;
    }

    // 🚀 優化：使用 toast 提示，不阻塞 UI
    const loadingToast = toast.loading(
      language === 'en' ? 'Adding test funds...' : '添加測試餘額中...'
    );
    
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
        toast.dismiss(loadingToast);
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
      toast.dismiss(loadingToast);
      toast.error(
        language === 'en'
          ? 'Failed to add test funds'
          : '添加測試餘額失敗'
      );
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

  // 🚀 優化：使用骨架屏代替藍屏載入器
  const SkeletonCard = () => (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-32 bg-gray-200 rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="h-10 w-40 bg-gray-200 rounded mb-4"></div>
        <div className="flex gap-2">
          <div className="h-9 flex-1 bg-gray-200 rounded"></div>
          <div className="h-9 flex-1 bg-gray-200 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );

  if (loadingWallet) {
    return (
      <div className="space-y-6">
        {/* 三幣別匯率指示器 */}
        <ExchangeRateIndicator />
        
        {/* 骨架屏：3 張卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        
        {/* 交易記錄骨架屏 */}
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-40 bg-gray-200 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 三幣別匯率指示器 */}
      <ExchangeRateIndicator />

      {/* 🐛 調試按鈕（開發模式） */}
      {accessToken?.startsWith('dev-user-') && (
        <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-900">
                🐛 開發者調試工具
              </p>
              <p className="text-xs text-purple-700">
                查看原始 USD 數據和貨幣轉換詳情
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={showDebugInfo}
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              顯示調試信息
            </Button>
          </div>
        </div>
      )}

      {/* 🆕 ECPay 手動確認工具 */}
      <ECPayManualConfirm />

      {/* ⭐ 平台收入統計（僅顯示給平台擁有者） */}
      {isPlatformOwner && platformRevenue && (
        <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-white mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <TrendingUp className="h-5 w-5" />
              {language === 'en' ? 'Platform Revenue' : '平台收入'}
            </CardTitle>
            <CardDescription>
              {language === 'en' ? 'Total subscription revenue received' : '總訂閱收入'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'en' ? 'Total Revenue' : '總收入'}
                </p>
                <p className="text-2xl text-green-600">
                  {formatCurrency(convertWalletAmount(platformRevenue.total), selectedCurrency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'en' ? 'Subscription' : '訂閱收入'}
                </p>
                <p className="text-2xl text-blue-600">
                  {formatCurrency(convertWalletAmount(platformRevenue.subscription), selectedCurrency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'en' ? 'Service Fees' : '服務費'}
                </p>
                <p className="text-2xl text-purple-600">
                  {formatCurrency(convertWalletAmount(platformRevenue.serviceFee), selectedCurrency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🔧 平台收入修復工具（僅平台擁有者可見） */}
      {isPlatformOwner && <PlatformRevenueFixTool />}

      {/* 🔧 PayPal 交易記錄格式修復工具（僅平台擁有者可見） */}
      {isPlatformOwner && <PayPalTransactionFixTool />}

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
              {formatCurrency(displayedAvailableBalance, selectedCurrency)}
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
              {formatCurrency(displayedPendingWithdrawal, selectedCurrency)}
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
                ? formatCurrency(displayedTotalEarned, selectedCurrency)
                : formatCurrency(displayedTotalSpent, selectedCurrency)}
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
            {getTranslation(language).wallet?.transactionHistory || (language === 'en' ? 'Transaction History' : '交易記')}
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
                ? '💵 最低充值金额：NT$300（约 ¥70 民币 / $10 美）'
                : '💵 最低充值金額：NT$300（約 $10 USD）'}
            </p>
            <p className="text-xs text-green-700 whitespace-pre-line">
              {language === 'en'
                ? '• ECPay (Taiwan): Credit/Debit cards, ATM, convenience stores\n• PayPal: International payments via PayPal account'
                : language === 'zh-CN'
                ? '• 界支付（台湾）：信用卡/借记卡、ATM、便利店\n• PayPal：通过 PayPal 账号国际支付'
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    綠界信用卡
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                  <Button 
                    onClick={handleDeposit} 
                    disabled={loadingWallet}
                    className="flex-1 bg-[#0070ba] hover:bg-[#003087] text-white"
                  >
                    {loadingWallet ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    PayPal
                  </Button>
                </>
              ) : (
                <>
                  {/* 英文用戶：PayPal 優先 */}
                  <Button 
                    onClick={handleDeposit} 
                    disabled={loadingWallet}
                    className="flex-1 bg-[#0070ba] hover:bg-[#003087] text-white"
                  >
                    {loadingWallet ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    PayPal
                  </Button>
                  <Button 
                    onClick={handleECPayDeposit} 
                    disabled={loadingWallet}
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
                  ? `Available balance: ${formatCurrency(displayedAvailableBalance, selectedCurrency)}` 
                  : `可用餘額：${formatCurrency(displayedAvailableBalance, selectedCurrency)}`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button onClick={handleWithdraw} disabled={loadingWallet}>
              {loadingWallet ? (
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