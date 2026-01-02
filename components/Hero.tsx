import { Button } from "./ui/button";
import { useLanguage } from "../lib/LanguageContext";
import { useView } from "../contexts/ViewContext";
import { translations, getTranslation } from "../lib/translations";
import { useState, useEffect } from "react";
import { PostProjectDialog } from "./PostProjectDialog";
import { useAuth } from "../contexts/AuthContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ArrowRight, Crown } from "lucide-react";

export function Hero() {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const { setView, setManualOverride } = useView();
  const t = getTranslation(language as any).hero;
  const [showProjectForm, setShowProjectForm] = useState(false);
  
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
      <div className="relative h-screen">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1758518730384-be3d205838e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGhhbmRzaGFrZSUyMG1lZXRpbmd8ZW58MXx8fHwxNzY0NDkwMDAyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Business handshake"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center pt-16">
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
              <Button size="lg" onClick={scrollToTalents} className="bg-blue-600 hover:bg-blue-700">
                {t.cta1}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" onClick={scrollToProjects} className="bg-green-600 hover:bg-green-700">
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