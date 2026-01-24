import { Button } from "./ui/button";
import { useLanguage } from "../lib/LanguageContext";
import { useView } from "../contexts/ViewContext";
import { translations, getTranslation } from "../lib/translations";
import { useState, useEffect } from "react";
import { PostProjectDialog } from "./PostProjectDialog";
import { useAuth } from "../contexts/AuthContext";
import { ArrowRight, Crown, Users, Briefcase, Star } from "lucide-react";
import { supabase } from "../utils/supabase/client";

export function Hero() {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const { setView, setManualOverride } = useView();
  const t = getTranslation(language as any).hero;
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoUrl] = useState<string>('https://videos.pexels.com/video-files/3581208/3581208-hd_1920_1080_30fps.mp4');
  const [fallbackImageUrl] = useState<string>('https://images.unsplash.com/photo-1622126977176-bf029dbf6ed0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG9mZmljZSUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NjkxMjQ3MTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral');
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  // 🔥 動態統計數字動畫
  const [stats, setStats] = useState({
    freelancers: 0,
    projects: 0,
    clients: 0
  });
  
  // 統計數字動畫
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

  const handleGetStarted = () => {
    if (!user) {
      setManualOverride(true);
      setTimeout(() => setView('register'), 0);
    } else {
      setShowProjectForm(true);
    }
  };

  const handleFindWork = () => {
    if (!user) {
      setManualOverride(true);
      setTimeout(() => setView('register'), 0);
    } else {
      setManualOverride(true);
      setTimeout(() => setView('home'), 0);
    }
  };

  const isPremium = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'vip';

  return (
    <>
      <div className="relative overflow-hidden min-h-[80vh] flex flex-col">
        {/* 優先嘗試播放影片，失敗時使用圖片備用 */}
        {!videoError && videoUrl ? (
          <>
            <video
              key={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => {
                console.warn('⚠️ [Hero] 影片無法播放（可能是 Figma Make 環境限制）');
                console.log('🔄 [Hero] 自動切換到圖片備用方案');
                setVideoError(true);
              }}
              onLoadedData={() => {
                console.log('✅ [Hero] 影片已載入並可播放');
                setVideoLoaded(true);
              }}
              onLoadStart={() => {
                console.log('🔄 [Hero] 開始載入 Pexels 影片...');
              }}
            >
              <source src={videoUrl} type="video/mp4" />
              您的瀏覽器不支援影片播放。
            </video>
            
            {/* 載入指示器 */}
            {!videoLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 flex items-center justify-center z-5">
                <div className="text-white text-xl">🎬 載入影片中...</div>
              </div>
            )}
          </>
        ) : videoError && fallbackImageUrl ? (
          <>
            {/* 備用圖片 */}
            <img
              src={fallbackImageUrl}
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={() => {
                console.log('✅ [Hero] 備用圖片已載入');
                setVideoLoaded(true);
              }}
            />
          </>
        ) : (
          // 最終備用背景（漸層）
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600" />
        )}

        {/* 深色遮罩層 */}
        <div className="absolute inset-0 bg-black/60" />

        {/* 主要內容區域 - 垂直居中 */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-3xl">
              {/* 小標籤 */}
              <div className="inline-block mb-6">
                <span className="text-yellow-400 text-sm font-semibold tracking-wide">
                  超級國際雙語接洽平台
                </span>
              </div>

              {/* 主標題 */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                專業接洽，精準解決。
              </h1>

              {/* 描述文字 */}
              <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed max-w-2xl">
                Case Where 是您尋找專業人才和項目最基本和快捷的互信平台。從開始到部署，我們準時您與經驗豐富的專業人士。
              </p>

              {/* 高亮文字 */}
              <p className="text-xl sm:text-2xl text-blue-300 font-semibold mb-10 italic">
                在正確的地方，找到正確的解決方案，讓您安心好眠，更可放鬆。
              </p>

              {/* CTA 按鈕組 */}
              <div className="flex flex-wrap gap-4 mb-12">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base font-semibold rounded-md shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {isPremium && <Crown className="size-5 mr-2 text-yellow-300" />}
                  尋找人才
                </Button>
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base font-semibold rounded-md shadow-xl transition-all duration-300 hover:scale-105"
                >
                  開始發佈項目
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleFindWork}
                  className="bg-transparent hover:bg-white/10 text-white border-2 border-white/80 px-8 py-6 text-base font-semibold rounded-md shadow-xl transition-all duration-300 hover:scale-105"
                >
                  瀏覽項目
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleFindWork}
                  className="bg-transparent hover:bg-white/10 text-white border-2 border-white/80 px-8 py-6 text-base font-semibold rounded-md shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Star className="size-5 mr-2" />
                  查看作品
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 底部統計數字 - 水平排列 */}
        <div className="relative z-10 bg-black/30 backdrop-blur-sm border-t border-white/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* 統計 1：專業人才 */}
              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Users className="size-8 text-yellow-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {stats.freelancers.toLocaleString()}+
                  </div>
                  <div className="text-white/80 text-sm mt-1">
                    專業自由工作者
                  </div>
                </div>
              </div>

              {/* 統計 2：成功專案 */}
              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Briefcase className="size-8 text-green-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {stats.projects.toLocaleString()}+
                  </div>
                  <div className="text-white/80 text-sm mt-1">
                    已完成的成功專案
                  </div>
                </div>
              </div>

              {/* 統計 3：滿意客戶 */}
              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Crown className="size-8 text-purple-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {stats.clients.toLocaleString()}+
                  </div>
                  <div className="text-white/80 text-sm mt-1">
                    滿意客戶
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 專案發布對話框 */}
      <PostProjectDialog 
        open={showProjectForm} 
        onOpenChange={setShowProjectForm}
      />
    </>
  );
}