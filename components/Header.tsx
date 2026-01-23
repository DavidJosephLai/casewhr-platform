import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Crown, ChevronDown, Menu, X, Globe, User, Settings, LogOut, MessageSquare, Bell, LayoutDashboard, Briefcase, Target, Shield, MessageCircle } from "lucide-react";
import { useLanguage } from '../lib/LanguageContext';
import { translations, getTranslation } from "../lib/translations";
import { AuthDialogs } from "./AuthDialogs";
import { UserProfile } from "./UserProfile";
import { MessageCenter } from "./MessageCenter";
import { UnreadMessageBadge } from "./UnreadMessageBadge";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useView } from "../contexts/ViewContext";
import { useSubscription } from "../hooks/useSubscription";
import { isAnyAdmin, getAdminLevel, AdminLevel } from "../config/admin";
import { projectId } from "../utils/supabase/info";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Header() {
  const { language, setLanguage } = useLanguage();
  const t = getTranslation(language);
  const { user, profile, signOut, accessToken } = useAuth();
  const { view, setView, manualOverride, setManualOverride } = useView();

  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [initialConversationId, setInitialConversationId] = useState<string | undefined>(undefined);
  const [pendingKYCCount, setPendingKYCCount] = useState(0); // 🔔 待審核 KYC 數量

  // 監聽自定義事件來打開對話框
  useEffect(() => {
    console.log('🔷 [Header] Event listeners being set up...');
    
    const handleOpenLogin = () => {
      console.log('🔷 [Header] handleOpenLogin called');
      setLoginOpen(true);
    };
    
    const handleOpenProfile = () => {
      console.log('🔷 [Header] handleOpenProfile called');
      setProfileOpen(true);
    };
    
    const handleOpenMessageCenter = (e: CustomEvent) => {
      console.log('🔷 [Header] openMessageCenter event received:', e.detail);
      setInitialConversationId(e.detail?.conversationId);
      setMessageOpen(true);
    };
    
    const handleOpenAuthDialog = (e: CustomEvent) => {
      console.log('🔷🔷🔷 [Header] openAuthDialog event received!');
      console.log('🔷 [Header] Event detail:', e.detail);
      console.log('🔷 [Header] Event type:', e.type);
      
      if (e.detail === 'login') {
        console.log('🔷 [Header] Opening login dialog...');
        setLoginOpen(true);
        console.log('🔷 [Header] setLoginOpen(true) called');
      } else if (e.detail === 'signup') {
        console.log('🔷 [Header] Opening signup dialog...');
        setLoginOpen(false);
        // 如果需要註冊對話框，可以在這裡添加
      }
    };

    window.addEventListener('openLoginDialog', handleOpenLogin);
    window.addEventListener('openAuthDialog', handleOpenAuthDialog as EventListener);
    window.addEventListener('openProfileDialog', handleOpenProfile);
    window.addEventListener('openMessageCenter', handleOpenMessageCenter as EventListener);
    
    console.log('🔷 [Header] All event listeners registered successfully');

    return () => {
      console.log('🔷 [Header] Cleaning up event listeners...');
      window.removeEventListener('openLoginDialog', handleOpenLogin);
      window.removeEventListener('openAuthDialog', handleOpenAuthDialog as EventListener);
      window.removeEventListener('openProfileDialog', handleOpenProfile);
      window.removeEventListener('openMessageCenter', handleOpenMessageCenter as EventListener);
    };
  }, []);

  const scrollToSection = (id: string) => {
    console.log(`🎯 [Header] scrollToSection called with id: ${id}`);
    console.log(`🎯 [Header] Current view: ${view}`);
    
    // 切換到首頁並滾動到指定區域
    const isChangingView = view !== 'home';
    setView('home');
    setManualOverride(true);
    
    console.log(`🎯 [Header] View changed to home, isChangingView: ${isChangingView}`);
    
    // 滾動到指定元素
    const scrollToElement = () => {
      const element = document.getElementById(id);
      console.log(`🔍 [Header] Looking for element #${id}:`, element);
      
      if (element) {
        // 計算元素位置並扣除 header 高度
        const headerHeight = 80;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const targetPosition = elementPosition - headerHeight;
        
        console.log(`📍 [Header] Element position: ${elementPosition}, target: ${targetPosition}, current scroll: ${window.pageYOffset}`);
        
        // 一次性滾動到目標位置
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        console.log(`✅ [Header] Scrolled to section: ${id}`);
        return true;
      }
      console.log(`⏳ [Header] Element #${id} not found, retrying...`);
      return false;
    };
    
    // 如果已經在首頁，立即滾動
    if (!isChangingView) {
      console.log(`⏰ [Header] Already on home page, scrolling immediately`);
      setTimeout(() => scrollToElement(), 50);
      return;
    }
    
    // 如果是從其他頁面切換過來，使用更長的初始延遲和重試機制
    console.log(`⏰ [Header] Switching from ${view} to home, using extended retry mechanism`);
    
    // 第一次嘗試：等待 1000ms（確保頁面完全渲染）
    // 後續重試：每次間隔 300ms
    setTimeout(() => {
      console.log(`⏰ [Header] First scroll attempt after 1000ms`);
      if (!scrollToElement()) {
        // 如果第一次失敗，繼續重試
        const retryDelays = [300, 300, 300, 300];
        let attemptCount = 1;
        
        const retry = (index: number) => {
          if (index >= retryDelays.length) {
            console.warn(`❌ [Header] Failed to scroll to #${id} after ${attemptCount + 1} attempts`);
            return;
          }
          
          setTimeout(() => {
            attemptCount++;
            console.log(`⏰ [Header] Retry attempt ${attemptCount}`);
            if (!scrollToElement()) {
              retry(index + 1);
            }
          }, retryDelays[index]);
        };
        
        retry(0);
      }
    }, 1000);
  };

  const scrollToTop = () => {
    // 切換到首頁並滾動到頂部
    setView('home');
    setManualOverride(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchToSignup = () => {
    setLoginOpen(false);
    setSignupOpen(true);
  };

  const handleSwitchToLogin = () => {
    setSignupOpen(false);
    setLoginOpen(true);
  };

  const handleSignOut = async () => {
    try {
      console.log('🔓 [Header] Starting sign out...');
      await signOut();
      console.log('✅ [Header] Sign out successful');
      
      // 強制跳轉到首頁並刷新（這比 reload 更可靠）
      window.location.href = window.location.origin;
    } catch (error) {
      console.error('❌ [Header] Sign out error:', error);
      // 即使出錯也嘗試清除本地狀態並刷新頁面
      try {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = window.location.origin;
      } catch (e) {
        console.error('❌ [Header] Failed to clear storage:', e);
        // 最手段：強制刷新當前頁面
        window.location.reload();
      }
    }
  };

  const handleShowPricing = () => {
    setView('pricing');
    setManualOverride(true);
  };

  const handleShowDashboard = () => {
    setView('dashboard');
    setManualOverride(true); // ✅ 設置為 true 防止被重定向
  };

  const handleShowAdmin = () => {
    setView('admin');
    setManualOverride(true);
  };

  const { limits } = useSubscription();

  // 檢查是否為管理員 - 使用 profile 信息
  const isAdmin = isAnyAdmin(user?.email, profile);
  const adminLevel = getAdminLevel(user?.email, profile);

  // 🔍 調試日誌
  useEffect(() => {
    if (user?.email) {
      console.log('🔍 [Header] Admin Check:', {
        email: user.email,
        isAdmin,
        adminLevel,
        profile: profile ? { isAdmin: profile.isAdmin, adminLevel: profile.adminLevel } : null
      });
    }
  }, [user?.email, isAdmin, adminLevel, profile]);

  // 🔔 獲取待審核 KYC 數量（僅管理員）
  useEffect(() => {
    const fetchPendingKYCCount = async () => {
      if (!isAdmin || !user?.id || !accessToken) return;

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/kyc/pending-count`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setPendingKYCCount(data.pending_count || 0);
          console.log('🔔 [Header] Pending KYC count:', data.pending_count);
        }
      } catch (error) {
        console.error('❌ [Header] Error fetching pending KYC count:', error);
      }
    };

    fetchPendingKYCCount();
    
    // 每 30 秒刷新一次
    const interval = setInterval(fetchPendingKYCCount, 30000);
    
    // 監聽 KYC 提交和審核事件
    const handleKYCEvent = () => {
      console.log('🔔 [Header] KYC event received, refreshing count...');
      fetchPendingKYCCount();
    };
    
    window.addEventListener('kyc-submitted', handleKYCEvent);
    window.addEventListener('kyc-approved', handleKYCEvent);
    window.addEventListener('kyc-rejected', handleKYCEvent);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('kyc-submitted', handleKYCEvent);
      window.removeEventListener('kyc-approved', handleKYCEvent);
      window.removeEventListener('kyc-rejected', handleKYCEvent);
    };
  }, [isAdmin, user?.id, accessToken]);

  // 根據管理員級別設置盾牌按鈕顏色
  const getAdminButtonStyle = () => {
    if (adminLevel === 'SUPER_ADMIN') {
      // 超級管理員 - 紅色
      return {
        className: 'flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200',
        label: language === 'en' ? 'Super Admin' : '超級管理員'
      };
    } else if (adminLevel === 'ADMIN') {
      // 普通管理員 - 藍色
      return {
        className: 'flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200',
        label: language === 'en' ? 'Admin' : '管理員'
      };
    } else {
      // 審核員 - 綠色
      return {
        className: 'flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200',
        label: language === 'en' ? 'Moderator' : '審核員'
      };
    }
  };

  const adminButtonStyle = getAdminButtonStyle();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button onClick={scrollToTop} className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
              <img 
                src="/Case Where.png" 
                className="h-12 w-auto" 
                alt="Case Where Logo"
              />
              <span className="text-2xl font-bold text-gray-800 whitespace-nowrap leading-none">接得準</span>
            </button>

            <nav className="hidden md:flex items-center gap-6 xl:gap-8">
              {user && (
                <button 
                  onClick={handleShowDashboard} 
                  className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {language === 'en' ? 'Dashboard' : '儀表板'}
                </button>
              )}
              <button onClick={() => scrollToSection('services')} className="text-[#111827] hover:text-blue-600 transition-colors font-medium">
                {t.nav.services}
              </button>
              <button onClick={() => scrollToSection('talents')} className="text-[#111827] hover:text-blue-600 transition-colors font-medium">
                {language === 'en' ? 'Browse Talent' : '瀏覽人才'}
              </button>
              <button onClick={() => scrollToSection('projects')} className="text-[#111827] hover:text-blue-600 transition-colors font-medium">
                {language === 'en' ? 'Browse Posted Projects' : '瀏覽發案項目'}
              </button>
              <button onClick={() => scrollToSection('cases')} className="text-[#111827] hover:text-blue-600 transition-colors -ml-3 xl:-ml-4 font-medium">
                {t.nav.cases}
              </button>
              <button onClick={() => scrollToSection('categories')} className="text-[#111827] hover:text-blue-600 transition-colors font-medium">
                {t.nav.categories}
              </button>
              <button 
                onClick={() => window.location.href = '/blog'} 
                className="text-[#111827] hover:text-blue-600 transition-colors font-medium"
              >
                {language === 'en' ? 'Blog' : language === 'zh-CN' ? '博客' : '部落格'}
              </button>
              <button 
                onClick={handleShowPricing} 
                className="text-blue-600 hover:text-blue-700 transition-colors font-medium flex items-center gap-1"
              >
                <Crown className="h-4 w-4" />
                {language === 'en' ? 'Pricing' : '方案'}
              </button>
              
              {/* 流程下拉菜單 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-[#111827] hover:text-blue-600 transition-colors flex items-center gap-1 font-medium">
                    {t.nav.process}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  <DropdownMenuItem onClick={() => scrollToSection('process')} className="cursor-pointer">
                    <Briefcase className="mr-2 h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{language === 'en' ? 'How It Works' : '服務流程'}</div>
                      <div className="text-xs text-gray-500">{language === 'en' ? '5-step process' : '5步驟流程'}</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => scrollToSection('milestone-feature')} className="cursor-pointer">
                    <Target className="mr-2 h-4 w-4 text-purple-600" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {language === 'en' ? 'Milestone Payments' : language === 'zh-CN' ? '里程碑付款' : '里程碑付款'}
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 text-[10px] px-1.5 py-0">
                          {language === 'en' ? 'NEW' : '新'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {language === 'en' ? 'Secure phased payments' : language === 'zh-CN' ? '安全分阶段付款' : '安全階段付款'}
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <button onClick={() => scrollToSection('contact')} className="text-[#111827] hover:text-blue-600 transition-colors font-medium">
                {t.nav.contact}
              </button>
            </nav>

            <div className="flex items-center gap-4">
              {/* Language Selector Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    {language === 'en' && 'English'}
                    {language === 'zh-TW' && '繁體中文'}
                    {language === 'zh-CN' && '简体中文'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => setLanguage('en')}
                    className={language === 'en' ? 'bg-blue-50 text-blue-700' : ''}
                  >
                    🇺🇸 English
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLanguage('zh-TW')}
                    className={language === 'zh-TW' ? 'bg-blue-50 text-blue-700' : ''}
                  >
                    🇹🇼 繁體中文
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLanguage('zh-CN')}
                    className={language === 'zh-CN' ? 'bg-blue-50 text-blue-700' : ''}
                  >
                    🇨🇳 简体中文
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {user ? (
                <>
                  {/* 會員狀態徽章 */}
                  {limits && limits.plan !== 'free' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // 🔥 企業版用戶點擊徽章時，顯示企業聊天而不是方案頁面
                        if (limits.plan === 'enterprise') {
                          window.dispatchEvent(new CustomEvent('showDashboard', { detail: { tab: 'enterprise-chat' } }));
                        } else {
                          window.dispatchEvent(new Event('showPricing'));
                        }
                      }}
                      className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 hover:from-yellow-100 hover:to-orange-100"
                      title={limits.plan === 'enterprise' ? (language === 'en' ? 'Open Enterprise Chat' : '開啟企業即時聊天') : undefined}
                    >
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-700 font-medium">
                        {limits.plan === 'pro' ? 'Pro' : 'Enterprise'}
                      </span>
                    </Button>
                  )}
                  {limits && limits.plan === 'free' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.dispatchEvent(new Event('showPricing'))}
                      className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-blue-600"
                    >
                      <Crown className="h-4 w-4" />
                      <span>{language === 'en' ? 'Upgrade' : '升級'}</span>
                    </Button>
                  )}
                  {/* 🛡️ 管理員按鈕 - 僅管理員���見，含待審核 KYC 徽章 */}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShowAdmin}
                      className={`${adminButtonStyle.className} relative`}
                      title={language === 'en' ? 'Admin Dashboard' : '管理員後台'}
                    >
                      <Shield className="h-4 w-4" />
                      <span className="hidden lg:inline">{adminButtonStyle.label}</span>
                      {pendingKYCCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-lg ring-2 ring-white">
                          {pendingKYCCount > 9 ? '9+' : pendingKYCCount}
                        </span>
                      )}
                    </Button>
                  )}
                  
                  {/*  訊息按鈕 - 含未讀章 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMessageOpen(true)}
                    className="relative flex items-center gap-2 hover:text-blue-600"
                    title={language === 'en' ? 'Messages' : '訊息'}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="hidden lg:inline">{language === 'en' ? 'Messages' : '訊息'}</span>
                    <UnreadMessageBadge />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hidden sm:flex items-center gap-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || user.email} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {profile?.full_name?.[0] || user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="max-w-[150px] truncate">{profile?.full_name || user.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <DropdownMenuLabel>{language === 'en' ? 'My Account' : '我的帳戶'}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleShowDashboard}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>{language === 'en' ? 'Dashboard' : language === 'zh-CN' ? '仪表板' : '儀表板'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                        <User className="mr-2 h-4 w-4" />
                        <span>{language === 'en' ? 'Profile' : language === 'zh-CN' ? '个人档案' : '個人檔案'}</span>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleShowAdmin} className="text-red-600">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>{language === 'en' ? 'Admin Dashboard' : '管理台'}</span>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{language === 'en' ? 'Sign Out' : '登出'}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="sm:hidden gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    {language === 'en' ? 'Sign Out' : '出'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLoginOpen(true)}
                    className="text-[#111827] hover:text-blue-600 hover:bg-blue-50"
                  >
                    {t.nav.login}
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => setSignupOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t.nav.signup}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthDialogs
        loginOpen={loginOpen}
        signupOpen={signupOpen}
        onLoginOpenChange={setLoginOpen}
        onSignupOpenChange={setSignupOpen}
        onSwitchToSignup={handleSwitchToSignup}
        onSwitchToLogin={handleSwitchToLogin}
      />

      <UserProfile
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />

      <MessageCenter 
        open={messageOpen}
        onOpenChange={setMessageOpen}
        initialConversationId={initialConversationId}
      />
    </>
  );
}