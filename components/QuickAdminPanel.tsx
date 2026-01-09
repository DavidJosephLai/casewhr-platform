import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Shield, X, Database, Eye, RefreshCw, Plus, UserPlus, Briefcase, FolderPlus, Loader2, Crown, Trash2, Key, Sparkles, BarChart3 } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { isAdmin as checkIsAdmin } from '../lib/adminConfig';
import { useAuth } from '../contexts/AuthContext';
import { useView } from '../contexts/ViewContext';

export function QuickAdminPanel() {
  const { user, accessToken } = useAuth();
  const { language } = useLanguage();
  const { setView } = useView();
  const [isOpen, setIsOpen] = useState(false);
  const [section, setSection] = useState('main');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setIsAdmin(checkIsAdmin(user?.email));
  }, [user]);

  if (!isAdmin) return null;

  const isZh = language === 'zh';

  const api = async (endpoint: string, onSuccess: (data: any) => void, method: 'GET' | 'POST' = 'POST') => {
    if (!accessToken) {
      console.error('❌ [QuickAdmin] No access token available');
      toast.error('Please sign in again', { duration: 5000 });
      return;
    }
    
    try {
      console.log(`🔵 [QuickAdmin] Calling API: ${endpoint}`);
      
      // 🔄 First attempt with current token
      let res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5${endpoint}`, {
        method: endpoint.includes('admin/debug') ? 'GET' : method,
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      });
      
      console.log(`🔵 [QuickAdmin] Response status:`, res.status);
      
      // 🔄 If JWT is invalid (401), try to refresh the session
      if (res.status === 401) {
        console.log('🔄 [QuickAdmin] Token expired, refreshing session...');
        
        try {
          const { createClient } = await import('../utils/supabase/client');
          const supabase = createClient();
          const { data: { session }, error } = await supabase.auth.refreshSession();
          
          if (error || !session?.access_token) {
            throw new Error('Failed to refresh session');
          }
          
          console.log('✅ [QuickAdmin] Session refreshed, retrying API call...');
          
          // Retry with new token
          res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5${endpoint}`, {
            method: endpoint.includes('admin/debug') ? 'GET' : method,
            headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
          });
          
          console.log(`🔵 [QuickAdmin] Retry response status:`, res.status);
        } catch (refreshError) {
          console.error('❌ [QuickAdmin] Failed to refresh session:', refreshError);
          toast.error('Session expired. Please sign in again.', { duration: 8000 });
          setLoading('');
          return;
        }
      }
      
      const data = await res.json();
      console.log(`🔵 [QuickAdmin] Response data:`, data);
      if (res.ok) {
        onSuccess(data);
      } else {
        console.error(`❌ [QuickAdmin] API error:`, data);
        toast.error(`❌ ${data.error || data.message || 'Unknown error'}`, { duration: 10000 });
      }
    } catch (e) {
      console.error('❌ [QuickAdmin] Exception:', e);
      toast.error(`❌ Error: ${e instanceof Error ? e.message : 'Unknown error'}`, { duration: 10000 });
    } finally {
      setLoading('');
    }
  };

  const gen = (type: string, endpoint: string, msg: (d: any) => string) => {
    setLoading(type);
    api(endpoint, (d) => {
      console.log(`✅ [QuickAdmin] Success response:`, d);
      toast.success(msg(d), { duration: 8000 });
      
      // 如果是生成所有數據，顯示詳細信息
      if (endpoint === '/admin/initialize-data' && d.created) {
        console.log('📊 [QuickAdmin] Created:', d.created);
        console.log('🔍 [QuickAdmin] Verified:', d.verified);
        
        // 額外顯示驗證信息
        if (d.verified?.projects_in_db !== undefined) {
          setTimeout(() => {
            toast.info(
              `🔍 驗證: 資料庫中找到 ${d.verified.projects_in_db} 個專案`,
              { duration: 6000 }
            );
          }, 1000);
        }
      }
      
      if (stats) loadStats();
    });
  };
  
  // 🆕 退出開發模式並重新登入
  const exitDevModeAndLogin = () => {
    console.log('🔄 [QuickAdmin] Exiting dev mode...');
    
    // 清除所有認證相關的 localStorage
    localStorage.removeItem('dev_mode_active');
    localStorage.removeItem('dev_mode_user');
    localStorage.removeItem('dev_mode_profile');
    localStorage.removeItem('dev_mode_token'); // 🔥 清除開發模式 token
    
    toast.info('🔄 正在退出開發模式...', {
      description: '即將重新載入頁面並打開登入視窗',
      duration: 2000
    });
    
    // 刷新頁面以觸發真實的 Supabase 登入
    setTimeout(() => {
      window.location.reload();
      
      // 頁面刷新後自動打開登入對話框
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openAuthDialog', { detail: 'login' }));
      }, 500);
    }, 2000);
  };

  // 🆕 設置特殊用戶（企業版 + 錢包餘額）
  const handleInitializeSpecialUsers = async () => {
    // 🔥 立即顯示 toast 確認函數被調用
    toast.info('🎁 開始設置特殊用戶...', { duration: 3000 });
    console.log('🎁 [QuickAdmin] handleInitializeSpecialUsers called!');
    
    setLoading('special'); // 🔥 添加 loading 慶
    
    try {
      console.log('🎁 [QuickAdmin] Initializing special users with secret key...');
      
      // 🔧 使用公開 API 端點，但仍需要 Authorization header（Supabase 要求）
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/public/initialize-special-users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}` // Supabase Functions 需要這個
        },
        body: JSON.stringify({
          secretKey: 'INIT_SPECIAL_USERS_2025' // 固定密鑰用於初始化
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log('✅ [QuickAdmin] Special users initialized:', data);
        
        const successCount = data.results?.filter((r: any) => r.status === 'success' || r.status === 'partial').length || 0;
        
        toast.success(`🎁 成功設置 ${successCount} 個特殊用戶！`, { 
          description: 'davidlai117@yahoo.com.tw 和 davidlai234@hotmail.com 已設為企業版並充值 NT$100,000\n🔑 密碼: CaseWHR2025! (固定密碼)',
          duration: 12000 
        });
        
        // 🔍 詳細顯示每個用戶的設置結果
        data.results?.forEach((result: any) => {
          console.log('=' .repeat(60));
          console.log(`📧 Email: ${result.email}`);
          console.log(`🆔 User ID: ${result.userId}`);
          console.log(`📋 Status: ${result.status}`);
          console.log(`💼 Subscription: ${result.subscription}`);
          console.log(`💰 Wallet Balance: NT$${result.wallet_balance}`);
          console.log(`✉️ Message: ${result.message}`);
          console.log('=' .repeat(60));
          
          if (result.status === 'success' || result.status === 'partial') {
            console.log(`✅ ${result.email}: ${result.message}`);
          } else {
            console.warn(`⚠️ ${result.email}: ${result.message}`);
          }
        });
        
        // 🔥 檢查當前登入用戶是否是特殊用戶之一
        const specialEmails = ['davidlai117@yahoo.com.tw', 'davidlai234@hotmail.com'];
        const isCurrentUserSpecial = user && specialEmails.includes(user.email || '');
        
        if (isCurrentUserSpecial) {
          // 當前用戶就是特殊用戶，立即刷新訂閱信息
          console.log('🔄 [QuickAdmin] Current user is special user, refreshing subscription...');
          
          // 🔥 立即調用檢查訂閱，確保設置成功
          setTimeout(async () => {
            console.log('🔍 [QuickAdmin] Verifying subscription update...');
            await checkMySubscription();
            
            // 觸全局刷新事件
            window.dispatchEvent(new Event('refreshSubscription'));
            
            toast.success('✅ 訂閱信息已更新！', {
              description: '您的帳戶已升級為企業版，請查看上方的訂閱狀態提示',
              duration: 8000
            });
            
            // 🔥 提示用戶刷新頁面以確保所有UI更新
            setTimeout(() => {
              toast.info('🔄 建議刷新頁面', {
                description: '點擊此通知或按 F5 刷新頁面以查看完整的企業版功能',
                duration: 15000,
                action: {
                  label: '立即刷新',
                  onClick: () => window.location.reload()
                }
              });
            }, 2000);
          }, 1500);
        } else {
          // 🔄 提示用戶重新登入以更新訂閱狀態
          setTimeout(() => {
            toast.info('🔄 請重新登入以查看企業版功能', {
              description: '點擊右上角登，然後使用 davidlai117@yahoo.com.tw 重新登入',
              duration: 10000
            });
          }, 2000);
        }
        
        // 📋 顯示登入資訊（固定密碼）
        setTimeout(() => {
          const fixedPassword = 'CaseWHR2025!';
          
          toast.info('🔑 特殊用戶登入資訊', {
            description: `📧 davidlai117@yahoo.com.tw\n📧 davidlai234@hotmail.com\n🔐 密碼: ${fixedPassword} (固定密碼，無需重置)`,
            duration: 30000
          });
          
          console.log('🔑 ========== 特殊用戶登入資訊 ==========');
          console.log(`📧 Email: davidlai117@yahoo.com.tw`);
          console.log(`🔐 Password: ${fixedPassword}`);
          console.log('---');
          console.log(`📧 Email: davidlai234@hotmail.com`);
          console.log(`🔐 Password: ${fixedPassword}`);
          console.log('🔑 ====================================');
        }, 3000);
      } else {
        console.error('❌ [QuickAdmin] Failed to initialize special users:', data);
        
        // 特別處理 JWT 錯誤
        if (res.status === 401 || data.message?.includes('JWT')) {
          toast.error('❌ 登入已過期，請重新登入', { 
            description: '您的登入憑證已失效，請登出後重新登入',
            duration: 10000 
          });
        } else {
          toast.error(`❌ ${data.error || data.message || '未知錯誤'}`, { duration: 10000 });
        }
      }
    } catch (error) {
      console.error('❌ [QuickAdmin] Exception:', error);
      toast.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { duration: 10000 });
    } finally {
      setLoading('');
    }
  };

  // 🔑 重置特殊用戶密碼為固定密碼
  const resetSpecialUserPasswords = async () => {
    // 🔥 檢查是否在開發模式
    if (localStorage.getItem('dev_mode_active') === 'true') {
      toast.error('❌ 無法在開發模式下重置密碼', {
        description: '請退出開發模式並使用真實的 Supabase 登入後再試',
        duration: 10000
      });
      return;
    }
    
    // 🔥 檢查 accessToken 是否有效
    if (!accessToken || accessToken.startsWith('dev-user-')) {
      toast.error('❌ 登入憑證無效', {
        description: '請重新登入後再試。您可能需要點擊右上角登出，然後重新登入。',
        duration: 10000,
        action: {
          label: '刷新頁面',
          onClick: () => window.location.reload()
        }
      });
      return;
    }
    
    setLoading('resetPwd');
    
    const fixedPassword = 'CaseWHR2025!'; // 固定密碼方便記憶
    
    try {
      console.log('🔑 [QuickAdmin] Resetting passwords for special users...');
      console.log('🔑 [QuickAdmin] Using access token:', accessToken.substring(0, 20) + '...');
      
      toast.info('🔑 正在重置密碼...', {
        description: `將設置密碼為: ${fixedPassword}`,
        duration: 3000
      });
      
      const specialEmails = ['davidlai117@yahoo.com.tw', 'davidlai234@hotmail.com'];
      const results = [];
      
      for (const email of specialEmails) {
        try {
          console.log(`🔑 [QuickAdmin] Sending reset request for: ${email}`);
          
          const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/reset-password`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email,
              newPassword: fixedPassword
            })
          });
          
          console.log(`🔵 [QuickAdmin] Response status for ${email}:`, res.status);
          
          // Check if response is JSON
          const contentType = res.headers.get('content-type');
          console.log(`🔵 [QuickAdmin] Content-Type for ${email}:`, contentType);
          
          let data;
          if (contentType && contentType.includes('application/json')) {
            data = await res.json();
          } else {
            const text = await res.text();
            console.error(`❌ [QuickAdmin] Non-JSON response for ${email}:`, text);
            data = { error: `Invalid response: ${text.substring(0, 100)}` };
          }
          
          console.log(`🔵 [QuickAdmin] Response data for ${email}:`, data);
          
          if (res.ok) {
            results.push({ email, success: true });
            console.log(`✅ [QuickAdmin] Password reset for ${email}`);
          } else {
            const errorMsg = data.error || data.message || `HTTP ${res.status}`;
            results.push({ email, success: false, error: errorMsg });
            console.error(`❌ [QuickAdmin] Failed to reset password for ${email}:`, errorMsg);
            
            // 特別處理 JWT 錯誤
            if (errorMsg.includes('JWT') || errorMsg.includes('token') || errorMsg.includes('Unauthorized')) {
              toast.error('❌ 登入憑證已過期', {
                description: '請重新登入後再試',
                duration: 10000,
                action: {
                  label: '重新登入',
                  onClick: () => {
                    // 觸發登出
                    window.dispatchEvent(new CustomEvent('forceSignOut'));
                  }
                }
              });
              break; // 停止處理其他用戶
            }
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ [QuickAdmin] Exception for ${email}:`, error);
          results.push({ email, success: false, error: errorMsg });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failedResults = results.filter(r => !r.success);
      
      if (successCount > 0) {
        toast.success(`🔑 成功重置 ${successCount} 個用戶密碼！`, {
          description: `密碼: ${fixedPassword}\n適用於: davidlai117@yahoo.com.tw 和 davidlai234@hotmail.com`,
          duration: 30000
        });
        
        console.log('🔑 ========== 特殊用戶登入資訊 ==========');
        console.log(`📧 Email: davidlai117@yahoo.com.tw`);
        console.log(`🔐 Password: ${fixedPassword}`);
        console.log('---');
        console.log(`📧 Email: davidlai234@hotmail.com`);
        console.log(`🔐 Password: ${fixedPassword}`);
        console.log('🔑 ====================================');
      }
      
      if (failedResults.length > 0) {
        // Show detailed error for failed resets
        failedResults.forEach(result => {
          toast.error(`❌ 重置失敗: ${result.email}`, {
            description: result.error,
            duration: 10000
          });
        });
      }
      
      if (successCount === 0) {
        toast.error('❌ 密碼重置失敗', {
          description: '請檢查控制台以獲取詳細錯誤信息',
          duration: 8000
        });
      }
    } catch (error) {
      console.error('❌ [QuickAdmin] Reset password error:', error);
      toast.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { duration: 10000 });
    } finally {
      setLoading('');
    }
  };

  const loadStats = () => {
    setLoading('stats');
    api('/admin/debug-keys', (d) => setStats(d));
  };

  // 🔍 檢查當前用戶的訂閱狀態
  const checkMySubscription = async () => {
    if (!user?.id || !accessToken) {
      toast.error('❌ 請先登入');
      return;
    }
    
    setLoading('checkSub');
    try {
      console.log('🔍 [QuickAdmin] Checking subscription for:', user.email, user.id);
      
      // 取所有 keys 來查看訂閱資料
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/debug-keys`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // 查找當前用戶的訂閱
        const subKey = `subscription_${user.id}`;
        const subscription = data.data?.[subKey];
        
        console.log('🔍 [QuickAdmin] Current user subscription:', subscription);
        
        if (subscription) {
          toast.success(`📋 訂閱狀態: ${subscription.plan}`, {
            description: `狀態: ${subscription.status} | 到期: ${subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : '無'}`,
            duration: 10000
          });
        } else {
          toast.warning('⚠️ 未找到訂閱資料', {
            description: '您可能還沒有設置訂閱，或需要重新登入',
            duration: 8000
          });
        }
        
        // 同時檢查錢包
        const walletKey = `wallet_${user.id}`;
        const wallet = data.data?.[walletKey];
        console.log('🔍 [QuickAdmin] Current user wallet:', wallet);
        
        if (wallet) {
          setTimeout(() => {
            toast.info(`💰 錢包餘額: NT$${wallet.balance || 0}`, {
              description: `凍結: NT$${wallet.frozen || 0}`,
              duration: 8000
            });
          }, 500);
        }
      }
    } catch (error) {
      console.error('❌ [QuickAdmin] Check subscription error:', error);
      toast.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { duration: 10000 });
    } finally {
      setLoading('');
    }
  };

  // 🏢 升級當前用戶為企業版
  const setEnterpriseSubscription = async () => {
    if (!user?.id || !accessToken) {
      toast.error('❌ 請先登入');
      return;
    }
    
    // 🔥 檢查是否在開發模式
    if (localStorage.getItem('dev_mode_active') === 'true') {
      toast.error('❌ 無法在開發模式下升級訂閱', {
        description: '請退出開發模式並使用真實的 Supabase 登入後再試',
        duration: 10000,
        action: {
          label: '退出開發模式',
          onClick: exitDevModeAndLogin
        }
      });
      return;
    }
    
    // 🔥 檢�� accessToken 是否有效
    if (accessToken.startsWith('dev-user-')) {
      toast.error('❌ 登入憑證無效', {
        description: '檢測到開發模式憑證，請使用真實的 Supabase 登入',
        duration: 10000,
        action: {
          label: '刷新頁面',
          onClick: () => window.location.reload()
        }
      });
      return;
    }
    
    setLoading('enterprise');
    try {
      console.log('🏢 [QuickAdmin] Upgrading to enterprise for:', user.email, user.id);
      console.log('🏢 [QuickAdmin] Access token:', accessToken.substring(0, 30) + '...');
      
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscription/upgrade`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: 'enterprise',
          billing_cycle: 'yearly'
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log('✅ [QuickAdmin] Upgraded to enterprise:', data);
        
        toast.success('🏢 已升級為企業版！', {
          description: '您現在可以使用所有企業功能',
          duration: 8000
        });
        
        // 觸發訂閱刷新
        setTimeout(() => {
          window.dispatchEvent(new Event('refreshSubscription'));
          
          toast.info('🔄 建議刷新頁面', {
            description: '點擊此通知或按 F5 刷新頁面以查看完整的企業版功能',
            duration: 15000,
            action: {
              label: '立即刷新',
              onClick: () => window.location.reload()
            }
          });
        }, 1000);
      } else {
        console.error('❌ [QuickAdmin] Failed to upgrade:', data);
        
        // 特別處理 JWT 錯誤
        if (res.status === 401 || data.message?.includes('JWT') || data.message?.includes('token')) {
          toast.error('❌ 登入憑證已過期', {
            description: '請重新登入後再試。建議先登出，然後重新登入。',
            duration: 15000,
            action: {
              label: '刷新頁面並重登入',
              onClick: () => {
                // 清除可能的開發模式標記
                localStorage.removeItem('dev_mode_active');
                localStorage.removeItem('dev_mode_user');
                localStorage.removeItem('dev_mode_profile');
                window.location.reload();
              }
            }
          });
        } else {
          toast.error(`❌ ${data.error || data.message || '升級失敗'}`, { duration: 10000 });
        }
      }
    } catch (error) {
      console.error('❌ [QuickAdmin] Upgrade error:', error);
      toast.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { duration: 10000 });
    } finally {
      setLoading('');
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-[9999] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xl rounded-full h-14 w-14 p-0"
        title="管理員面板 - 快速管理工具"
      >
        <Shield className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-[9999]">
      <Card className="w-80 max-h-[80vh] shadow-2xl border-2 border-blue-200 overflow-hidden flex flex-col">
        <div className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-white" />
              <h3 className="font-semibold text-white">{isZh ? '快速管理' : 'Quick Admin'}</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)} 
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">{section === 'main' && (
          <div className="space-y-2">
            {/* 🔥 開發模式警告 - 已移除 */}
            
            <Button onClick={() => setSection('gen')} className="w-full justify-start bg-green-600 hover:bg-green-700" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {isZh ? '生成數據' : 'Generate Data'}
            </Button>
            <Button onClick={() => setSection('db')} className="w-full justify-start bg-blue-600 hover:bg-blue-700" size="sm">
              <Database className="h-4 w-4 mr-2" />
              {isZh ? '資料庫工具' : 'Database'}
            </Button>
            <Button onClick={() => { setSection('stats'); loadStats(); }} className="w-full justify-start bg-purple-600 hover:bg-purple-700" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              {isZh ? '統計數據' : 'Statistics'}
            </Button>
            <div className="border-t my-2" />
            <Button onClick={checkMySubscription} disabled={!!loading} className="w-full justify-start bg-indigo-600 hover:bg-indigo-700" size="sm">
              {loading === 'checkSub' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isZh ? '檢查中...' : 'Checking...'}</> : <><Eye className="h-4 w-4 mr-2" />{isZh ? '檢我的訂閱' : 'Check My Subscription'}</>}
            </Button>
            <Button onClick={setEnterpriseSubscription} disabled={!!loading} className="w-full justify-start bg-amber-600 hover:bg-amber-700" size="sm">
              {loading === 'enterprise' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isZh ? '設置中...' : 'Setting...'}</> : <><Crown className="h-4 w-4 mr-2" />{isZh ? '升級企業版' : 'Upgrade Enterprise'}</>}
            </Button>
            <div className="border-t my-2" />
            <Button onClick={handleInitializeSpecialUsers} disabled={!!loading} className="w-full justify-start bg-pink-600 hover:bg-pink-700" size="sm">
              {loading === 'special' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isZh ? '設置中...' : 'Setting...'}</> : <><Crown className="h-4 w-4 mr-2" />{isZh ? '設置特殊用戶 (密碼: CaseWHR2025!)' : 'Setup Special Users'}</>}
            </Button>
            <Button onClick={resetSpecialUserPasswords} disabled={!!loading} className="w-full justify-start bg-red-600 hover:bg-red-700" size="sm">
              {loading === 'resetPwd' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isZh ? '重置中...' : 'Resetting...'}</> : <><Key className="h-4 w-4 mr-2" />{isZh ? '重設密碼 (CaseWHR2025!)' : 'Reset Passwords'}</>}
            </Button>
            <div className="border-t my-2" />
            {/* 🌟 AI SEO 工具區 */}
            <Button onClick={() => { setView('ai-seo'); setIsOpen(false); }} className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" size="sm">
              <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
              {isZh ? 'AI SEO 管理器' : 'AI SEO Manager'}
            </Button>
            <div className="border-t my-2" />
            <Button onClick={() => { setView('admin'); setIsOpen(false); }} variant="outline" className="w-full justify-start" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              {isZh ? '開啟管理後台' : 'Open Admin'}
            </Button>
          </div>
        )}

        {section === 'gen' && (
          <div className="space-y-2">
            <Button onClick={() => setSection('main')} variant="ghost" size="sm" className="w-full justify-start mb-2">
              ← {isZh ? '返回' : 'Back'}
            </Button>
            <Button onClick={() => gen('c', '/admin/generate-creator', (d) => `✅ ${isZh ? '創作者' : 'Creator'}: ${d.email} | ${isZh ? '密碼' : 'Pass'}: ${d.password}`)} disabled={!!loading} className="w-full justify-start bg-green-600 hover:bg-green-700" size="sm">
              {loading === 'c' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isZh ? '生成中...' : 'Generating...'}</> : <><UserPlus className="h-4 w-4 mr-2" />{isZh ? '生成創作者' : 'Generate Creator'}</>}
            </Button>
            <Button onClick={() => gen('cl', '/admin/generate-client', (d) => ` ${isZh ? '發案者' : 'Client'}: ${d.email} | ${isZh ? '密碼' : 'Pass'}: ${d.password}`)} disabled={!!loading} className="w-full justify-start bg-purple-600 hover:bg-purple-700" size="sm">
              {loading === 'cl' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isZh ? '生成中...' : 'Generating...'}</> : <><Briefcase className="h-4 w-4 mr-2" />{isZh ? '生成發案者' : 'Generate Client'}</>}
            </Button>
            <Button onClick={() => gen('p', '/admin/generate-project', (d) => `✅ ${isZh ? '案' : 'Project'}: ${d.title}`)} disabled={!!loading} className="w-full justify-start bg-orange-600 hover:bg-orange-700" size="sm">
              {loading === 'p' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isZh ? '生成中...' : 'Generating...'}</> : <><FolderPlus className="h-4 w-4 mr-2" />{isZh ? '生成專案' : 'Generate Project'}</>}
            </Button>
            <div className="border-t my-2" />
            <Button onClick={() => gen('all', '/admin/initialize-data', (d) => `✅ ${d.created?.users || 0} users, ${d.created?.projects || 0} projects`)} disabled={!!loading} className="w-full justify-start bg-blue-600 hover:bg-blue-700" size="sm">
              {loading === 'all' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isZh ? '生成中...' : 'Generating...'}</> : <><Database className="h-4 w-4 mr-2" />{isZh ? '生成所有數據' : 'Generate All'}</>}
            </Button>
            <div className="border-t my-2" />
            <Button 
              onClick={() => gen('clean', '/admin/delete-test-data', (d) => `✅ ${isZh ? '已清除' : 'Deleted'} ${d.deleted || 0} ${isZh ? '項測試數據' : 'test items'}`)} 
              disabled={!!loading} 
              className="w-full justify-start bg-red-600 hover:bg-red-700" 
              size="sm"
            >
              {loading === 'clean' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isZh ? '清除中...' : 'Cleaning...'}</> : <><Trash2 className="h-4 w-4 mr-2" />{isZh ? '清除測試數據' : 'Clean Test Data'}</>}
            </Button>
          </div>
        )}

        {section === 'db' && (
          <div className="space-y-2">
            <Button onClick={() => setSection('main')} variant="ghost" size="sm" className="w-full justify-start mb-2">
              ← {isZh ? '返回' : 'Back'}
            </Button>
            <Button onClick={loadStats} disabled={!!loading} variant="outline" className="w-full justify-start" size="sm">
              {loading === 'stats' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isZh ? '載入中...' : 'Loading...'}</> : <><RefreshCw className="h-4 w-4 mr-2" />{isZh ? '檢查資料庫' : 'Check DB'}</>}
            </Button>
          </div>
        )}

        {section === 'stats' && (
          <div className="space-y-2">
            <Button onClick={() => setSection('main')} variant="ghost" size="sm" className="w-full justify-start mb-2">
              ← {isZh ? '返回' : 'Back'}
            </Button>
            {loading === 'stats' ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
            ) : stats ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{isZh ? '總計' : 'Total'}</span>
                    <Badge>{stats.total || 0}</Badge>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span>{isZh ? '用戶' : 'Profiles'}:</span>
                      <Badge variant="secondary">{(stats.summary?.profile_colon || 0) + (stats.summary?.profile_underscore || 0)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>{isZh ? '專案' : 'Projects'}:</span>
                      <Badge variant="secondary">{(stats.summary?.project_colon || 0) + (stats.summary?.project_underscore || 0)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>{isZh ? '錢包' : 'Wallets'}:</span>
                      <Badge variant="secondary">{(stats.summary?.wallet_colon || 0) + (stats.summary?.wallet_underscore || 0)}</Badge>
                    </div>
                  </div>
                </div>
                <Button onClick={loadStats} variant="outline" size="sm" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isZh ? '刷新' : 'Refresh'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                {isZh ? '點擊「檢查資料庫」載入統計' : 'Click "Check DB"'}
              </div>
            )}
          </div>
        )}
        </div>
      </Card>
    </div>
  );
}