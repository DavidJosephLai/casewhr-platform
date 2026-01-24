import { Button } from "./ui/button";
import { useLanguage } from "../lib/LanguageContext";
import { useView } from "../contexts/ViewContext";
import { translations, getTranslation } from "../lib/translations";
import { useState, useEffect } from "react";
import { PostProjectDialog } from "./PostProjectDialog";
import { useAuth } from "../contexts/AuthContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ArrowRight, Crown, Users, Briefcase, Star, TrendingUp } from "lucide-react";

export function Hero() {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const { setView, setManualOverride } = useView();
  const t = getTranslation(language as any).hero;
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [videoError, setVideoError] = useState(false); // 🎬 追蹤影片載入狀態
  
  // 🔥 動態統計數字動畫
  const [stats, setStats] = useState({
    freelancers: 0,
    projects: 0,
    clients: 0
  });
  
  useEffect(() => {
    const targetStats = {
      freelancers: 15847,
      projects: 42389,
      clients: 8932
    };
    
    const duration = 2000; // 2秒動畫
    const steps = 60;
    const interval = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setStats({
        freelancers: Math.floor(targetStats.freelancers * progress),
        projects: Math.floor(targetStats.projects * progress),
        clients: Math.floor(targetStats.clients * progress)
      });
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setStats(targetStats);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, []);
  
  // 🔥 監聽登錄後打開發布項目對話框的事件
  useEffect(() => {
    const handleOpenPostProjectAfterLogin = () => {
      console.log('🔥 [Hero] Received openPostProjectAfterLogin event');
      console.log('🔥 [Hero] User:', user);
      console.log('🔥 [Hero] Profile:', profile);
      
      // 延遲一點確保用戶和profile數據已更新
      setTimeout(() => {
        const isClient = profile?.is_client ?? (profile?.account_type === 'client');
        console.log('🔥 [Hero] isClient:', isClient);
        
        if (isClient) {
          console.log('🔥 [Hero] Opening post project dialog');
          setShowProjectForm(true);
        } else {
          console.log('🔥 [Hero] User is not a client, navigating to dashboard');
          window.dispatchEvent(new Event('showDashboard'));
        }
      }, 200);
    };
    
    window.addEventListener('openPostProjectAfterLogin', handleOpenPostProjectAfterLogin);
    
    return () => {
      window.removeEventListener('openPostProjectAfterLogin', handleOpenPostProjectAfterLogin);
    };
  }, [user, profile]);

  const scrollToTalents = () => {
    document.getElementById('talents')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePostProject = () => {
    console.log('🔥🔥🔥 [Hero v2.0] handlePostProject CALLED - 2025-01-01');
    console.log('🔘 [Hero] Post Project clicked');
    console.log('🔘 [Hero] User:', user);
    console.log('🔘 [Hero] Profile:', profile);
    console.log('🔘 [Hero] Current language:', language);
    
    if (!user) {
      // Trigger login dialog if not authenticated
      console.log('🚨 [Hero] No user detected - Triggering login dialog');
      console.log('🚨 [Hero] Dispatching openAuthDialog event with detail: login');
      
      // 🔥 使用兩種方式觸發，確保至少一種工作
      const event = new CustomEvent('openAuthDialog', { detail: 'login' });
      window.dispatchEvent(event);
      
      // 🔥 同時觸發舊的事件名稱作為備用
      window.dispatchEvent(new Event('openLoginDialog'));
      
      console.log('🚨 [Hero] Both openAuthDialog and openLoginDialog events dispatched');
      
      // 🔥 額外日誌：檢查事件是否被監聽
      setTimeout(() => {
        console.log('🚨 [Hero] Checking if login dialog opened after 100ms...');
        console.log('🚨 [Hero] If dialog did not open, check Header and AuthDialogs event listeners');
      }, 100);
      
      // 🔥 保存目標動作，登錄成功後自動打開發布項目對話框
      sessionStorage.setItem('postLoginAction', 'openPostProject');
      
      return; // 不要繼續執行，等待用戶登錄
    } else {
      // Check new format (is_client) or old format (account_type)
      const isClient = profile?.is_client ?? (profile?.account_type === 'client');
      console.log('✅ [Hero] User logged in - isClient:', isClient);
      console.log('✅ [Hero] profile.is_client:', profile?.is_client);
      console.log('✅ [Hero] profile.account_type:', profile?.account_type);
      
      if (isClient) {
        // Open project post form for clients
        console.log('📝 [Hero] Opening project form for client');
        console.log('📝 [Hero] Setting showProjectForm to true');
        setShowProjectForm(true);
      } else {
        // Navigate to dashboard for non-clients
        console.log('📊 [Hero] Navigating to dashboard (not a client)');
        window.dispatchEvent(new Event('showDashboard'));
      }
    }
  };

  return (
    <>
      <div className="relative h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        {/* 🎬 背景圖片（Fallback） */}
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1758518730384-be3d205838e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGhhbmRzaGFrZSUyMG1lZXRpbmd8ZW58MXx8fHwxNzY0NDkwMDAyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Business handshake"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* 🎬 背景影片（優先顯示） */}
        {!videoError && (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => {
              console.log('⚠️ [Hero] Video failed to load, falling back to image');
              setVideoError(true);
            }}
            onLoadedData={() => {
              console.log('✅ [Hero] Video loaded successfully');
            }}
            onCanPlay={() => {
              console.log('✅ [Hero] Video can play');
            }}
            onPlaying={() => {
              console.log('🎬 [Hero] Video is now playing!');
            }}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 1 }}
          >
            {/* 🎬 使用更可靠的 Pexels 影片源 */}
            
            {/* 主影片：商務團隊合作（Pexels - 高可靠性） */}
            <source 
              src="https://videos.pexels.com/video-files/3191158/3191158-uhd_2560_1440_25fps.mp4" 
              type="video/mp4" 
            />
            
            {/* 備用影片 1：辦公室工作（Pexels） */}
            <source 
              src="https://videos.pexels.com/video-files/4065891/4065891-uhd_2560_1440_25fps.mp4" 
              type="video/mp4" 
            />
            
            {/* 備用影片 2：商業會議（Coverr） */}
            <source 
              src="https://coverr.co/videos/business-team-meeting--ZPmOGlVWt8/download"
              type="video/mp4" 
            />
            
            您的瀏覽器不支援影片播放。
          </video>
        )}
        
        {/* 🎨 深色遮罩層（確保文字清晰可讀） */}
        <div className="absolute inset-0 bg-black/60" style={{ zIndex: 2 }} />
        
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center pt-16" style={{ zIndex: 3 }}>
          <div className="max-w-3xl">
            <h1 className="text-white mb-6">
              {t.title}
            </h1>
            {/* Slogan */}
            <p className="text-3xl text-yellow-400 mb-6 tracking-wide">
              {t.slogan}
            </p>
            <p className="text-xl text-white/90 mb-4">
              {t.subtitle}
            </p>
            {/* Vision Statement */}
            <p className="text-2xl text-blue-300 mb-8 italic border-l-4 border-blue-400 pl-4 py-2">
              {t.vision}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={scrollToTalents} className="bg-blue-600 hover:bg-blue-700 text-white">
                {t.cta1}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" onClick={scrollToProjects} className="bg-green-600 hover:bg-green-700 text-white">
                {t.cta3}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={handlePostProject} className="bg-white/10 text-white border-white hover:bg-white/20">
                {t.cta2}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => {
                  console.log('🎯 Hero: Showing Pricing Page');
                  setView('pricing');
                  setManualOverride(true);
                }} 
                className="bg-white/10 text-white border-white hover:bg-white/20 gap-2"
              >
                <Crown className="h-5 w-5" />
                {language === 'en' ? 'View Pricing' : '查看方案'}
              </Button>
            </div>
          </div>
          
          {/* 🔥 動態統計數字條 - 置於螢幕底部 */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                {/* 專業接案者 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-8 w-8 text-yellow-400" />
                    <div className="text-4xl font-bold text-white">
                      {stats.freelancers.toLocaleString()}+
                    </div>
                  </div>
                  <div className="text-blue-200 font-medium">
                    {language === 'en' ? 'Skilled Freelancers' : language === 'zh-CN' ? '专业接案者' : '專業接案者'}
                  </div>
                </div>
                
                {/* 完成專案 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-8 w-8 text-green-400" />
                    <div className="text-4xl font-bold text-white">
                      {stats.projects.toLocaleString()}+
                    </div>
                  </div>
                  <div className="text-blue-200 font-medium">
                    {language === 'en' ? 'Projects Completed' : language === 'zh-CN' ? '已完成项目' : '已完成專案'}
                  </div>
                </div>
                
                {/* 滿意客戶 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                    <div className="text-4xl font-bold text-white">
                      {stats.clients.toLocaleString()}+
                    </div>
                  </div>
                  <div className="text-blue-200 font-medium">
                    {language === 'en' ? 'Happy Clients' : language === 'zh-CN' ? '满意客户' : '滿意客戶'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Post Form */}
      {user && (profile?.is_client || profile?.account_type === 'client') && (
        <PostProjectDialog
          open={showProjectForm}
          onOpenChange={setShowProjectForm}
          onSubmitted={() => {
            setShowProjectForm(false);
            // Navigate to dashboard after posting
            window.dispatchEvent(new Event('showDashboard'));
          }}
        />
      )}
    </>
  );
}