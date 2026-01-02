import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import { LimitReachedDialog } from "./LimitReachedDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Lock, Crown, Zap } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

interface SubscriptionGateProps {
  children: React.ReactNode;
  feature: "project" | "proposal" | "premium";
  onProceed?: () => void;
  fallback?: React.ReactNode;
}

/**
 * 訂閱門控組件 - 根據用戶訂閱狀態控制功能訪問
 */
export function SubscriptionGate({ 
  children, 
  feature, 
  onProceed,
  fallback 
}: SubscriptionGateProps) {
  const { user } = useAuth();
  const { limits, loading } = useSubscription();
  const { language } = useLanguage();
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // 未登入用戶
  if (!user) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <>
        <div onClick={() => setShowLoginPrompt(true)} className="cursor-pointer">
          {children}
        </div>
        <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Lock className="h-6 w-6 text-blue-600" />
                </div>
                <DialogTitle>
                  {language === 'en' ? 'Login Required' : '需要登入'}
                </DialogTitle>
              </div>
              <DialogDescription>
                {language === 'en' 
                  ? 'Please log in or sign up to access this feature.' 
                  : '請登入或註冊以使用此功能。'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1"
              >
                {language === 'en' ? 'Cancel' : '取消'}
              </Button>
              <Button 
                onClick={() => {
                  setShowLoginPrompt(false);
                  // 觸發登入對話框
                  window.dispatchEvent(new CustomEvent('openAuthDialog', { detail: 'login' }));
                }}
                className="flex-1"
              >
                {language === 'en' ? 'Login' : '登入'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 載入中
  if (loading) {
    return <div className="opacity-50 pointer-events-none">{children}</div>;
  }

  // 檢查權限
  const canAccess = () => {
    if (!limits) return false;

    switch (feature) {
      case 'project':
        return limits.canCreateProject;
      case 'proposal':
        return limits.canSubmitProposal;
      case 'premium':
        return limits.plan !== 'free';
      default:
        return true;
    }
  };

  // 如果有權限，直接顯示內容
  if (canAccess()) {
    return <>{children}</>;
  }

  // 無權限 - 顯示升級提示
  const isPremiumFeature = feature === 'premium';
  const isLimitReached = (feature === 'project' && !limits?.canCreateProject) || 
                         (feature === 'proposal' && !limits?.canSubmitProposal);

  return (
    <>
      <div 
        onClick={() => {
          if (isPremiumFeature) {
            setShowUpgradePrompt(true);
          } else if (isLimitReached) {
            setShowLimitDialog(true);
          }
        }}
        className="cursor-pointer relative"
      >
        {children}
      </div>

      {/* 限額達到對話框 */}
      {isLimitReached && limits && (
        <LimitReachedDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          limitType={feature === 'project' ? 'project' : 'proposal'}
          currentPlan={limits.plan}
          usage={feature === 'project' ? limits.usage.projects : limits.usage.proposals}
          limit={feature === 'project' ? limits.limits.projects : limits.limits.proposals}
        />
      )}

      {/* Premium 功能升級提示 */}
      {isPremiumFeature && (
        <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle>
                    {language === 'en' ? 'Premium Feature' : '高級功能'}
                  </DialogTitle>
                  <DialogDescription>
                    {language === 'en' 
                      ? 'Upgrade to unlock this feature' 
                      : '升級以解鎖此功能'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="py-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Zap className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-3">
                      {language === 'en' ? 'Pro Plan Benefits:' : 'Pro 方案優勢：'}
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        {language === 'en' ? 'Unlimited projects & proposals' : '無限項目和提案'}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        {language === 'en' ? 'Lower service fees (10% vs 20%)' : '更低服務費（10% vs 20%）'}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        {language === 'en' ? 'Priority customer support' : '優先客戶支援'}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        {language === 'en' ? 'Advanced analytics' : '進階數據分析'}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowUpgradePrompt(false)}
                className="flex-1"
              >
                {language === 'en' ? 'Maybe Later' : '稍後再說'}
              </Button>
              <Button 
                onClick={() => {
                  setShowUpgradePrompt(false);
                  window.dispatchEvent(new Event('showPricing'));
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Upgrade Now' : '立即升級'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
