import { useLanguage } from "../lib/LanguageContext";
import { useView } from "../contexts/ViewContext";
import { getTranslation } from "../lib/translations";
import { useState } from "react";
import { PostProjectDialog } from "./PostProjectDialog";
import { useAuth } from "../contexts/AuthContext";
import { Crown, Users, Briefcase, Star } from "lucide-react";
import { Button } from "./ui/button";

export function Hero() {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const { view, setView, setManualOverride } = useView();
  const t = getTranslation(language as any).hero;
  
  const [showProjectForm, setShowProjectForm] = useState(false);

  // 🔥 跟 Header 一樣的 scrollToSection 函數
  const scrollToSection = (id: string) => {
    const isChangingView = view !== 'home';
    
    if (isChangingView) {
      setView('home');
      setManualOverride(true);
    }
    
    // 滾動到指定元素
    const scrollToElement = () => {
      const element = document.getElementById(id);
      
      if (element) {
        // 計算元素位置並扣除 header 高度
        const headerHeight = 80;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const targetPosition = elementPosition - headerHeight;
        
        // 一次性滾動到目標位置
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        return true;
      }
      return false;
    };
    
    // 如果已經在首頁，立即滾動
    if (!isChangingView) {
      setTimeout(() => scrollToElement(), 50);
      return;
    }
    
    // 如果是從其他頁面切換過來，使用更長的初始延遲和重試機制
    setTimeout(() => {
      if (!scrollToElement()) {
        const retryDelays = [300, 300, 300, 300];
        
        const retry = (index: number) => {
          if (index >= retryDelays.length) {
            return;
          }
          
          setTimeout(() => {
            if (!scrollToElement()) {
              retry(index + 1);
            }
          }, retryDelays[index]);
        };
        
        retry(0);
      }
    }, 1000);
  };

  const handleGetStarted = () => {
    scrollToSection('talents');
  };

  const handleFindWork = () => {
    window.dispatchEvent(new CustomEvent('openAuthDialog', { detail: 'login' }));
  };

  const handleBrowseProjects = () => {
    scrollToSection('projects');
  };

  const handleBecomePro = () => {
    scrollToSection('talents');
  };

  const isPremium = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'vip';

  return (
    <>
      <div className="min-h-[70vh] py-20 relative overflow-hidden">
        {/* 🎬 背景影片層 - Ken Burns 縮放特效 + 電影級色彩濾鏡 */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
            style={{
              filter: 'saturate(1.2) contrast(1.1) brightness(0.9)',
              transform: 'scale(1.1)',
            }}
          >
            <source 
              src="https://bihplitfentxioxyjalb.supabase.co/storage/v1/object/public/Background/7693400-hd_1920_1080_25fps.mp4" 
              type="video/mp4" 
            />
          </video>
          
          {/* 電影級漸層疊加 - 從深藍到暖色 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-purple-900/40 to-orange-900/30 z-[1]" />
          
          {/* 深色底層確保文字可讀性 */}
          <div className="absolute inset-0 bg-black/30 z-[2]" />
          
          {/* 電影暗角效果 */}
          <div className="absolute inset-0 z-[3]" style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.4) 100%)'
          }} />
        </div>
        
        {/* 內容層 */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="mb-6">
              <span className="text-yellow-300 text-sm font-semibold">
                {t.badge}
              </span>
            </div>

            <h1 className="text-5xl font-bold text-white mb-6">
              {t.slogan}
            </h1>

            <p className="text-xl text-white/90 mb-8">
              {t.subtitle}
            </p>

            <p className="text-2xl text-blue-200 font-semibold mb-10">
              {t.vision}
            </p>

            {/* ✅ 按鈕組 - 確保正確的 z-index */}
            <div className="flex flex-wrap gap-4 mb-12 relative z-10">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold relative z-10"
              >
                {isPremium && <Crown className="size-5 mr-2 text-yellow-500" />}
                {t.cta1}
              </Button>
              
              <Button
                onClick={handleFindWork}
                size="lg"
                className="bg-green-600 text-white hover:bg-green-700 font-semibold relative z-10"
              >
                {t.cta2}
              </Button>
              
              <Button
                onClick={handleBrowseProjects}
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white hover:bg-white/20 font-semibold relative z-10"
              >
                {t.cta3}
              </Button>
              
              <Button
                onClick={handleBecomePro}
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white hover:bg-white/20 font-semibold relative z-10"
              >
                <Star className="size-5 mr-2" />
                {t.cta4}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PostProjectDialog 
        open={showProjectForm} 
        onOpenChange={setShowProjectForm}
      />
    </>
  );
}