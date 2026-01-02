import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { AlertCircle, TrendingUp, Crown } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { Badge } from "./ui/badge";
import { useSubscription } from "../hooks/useSubscription";

interface LimitReachedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: 'project' | 'proposal';
  currentPlan?: 'free' | 'pro' | 'enterprise';
  usage?: number;
  limit?: number;
}

export function LimitReachedDialog({ 
  open, 
  onOpenChange, 
  limitType, 
  currentPlan: currentPlanProp,
  usage: usageProp,
  limit: limitProp
}: LimitReachedDialogProps) {
  const { language } = useLanguage();
  const t = getTranslation(language).subscription;
  const { limits } = useSubscription();

  // 使用傳入的參數或從 useSubscription 獲取
  const currentPlan = currentPlanProp || (limits?.tier as 'free' | 'pro' | 'enterprise') || 'free';
  const usage = usageProp ?? (limitType === 'project' ? limits?.usage?.projects ?? 0 : limits?.usage?.proposals ?? 0);
  const limit = limitProp ?? (limitType === 'project' ? limits?.limits?.projects ?? 0 : limits?.limits?.proposals ?? 0);

  const handleUpgrade = () => {
    onOpenChange(false);
    // Navigate to pricing page
    window.dispatchEvent(new Event('showPricing'));
  };

  const limitText = limitType === 'project' 
    ? (language === 'en' ? 'project postings' : '項目發布')
    : (language === 'en' ? 'proposal submissions' : '提案提交');

  const nextPlan = currentPlan === 'free' ? 'pro' : 'enterprise';
  const nextPlanName = t.plans[nextPlan].name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <DialogTitle>{t.limits.limitReached}</DialogTitle>
              <DialogDescription className="mt-1">
                {language === 'en' 
                  ? `You've reached your monthly limit` 
                  : '您已達到本月限額'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Usage */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                {language === 'en' ? 'Current Plan' : '當前方案'}
              </span>
              <Badge variant="outline" className="text-xs">
                {t.plans[currentPlan].name}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-medium">{usage}</span>
              <span className="text-gray-500">/ {limit === Infinity ? '∞' : limit}</span>
              <span className="text-sm text-gray-500 ml-auto">{limitText}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {language === 'en' 
                ? `You've used all ${limit} ${limitText} this month` 
                : `本月 ${limit} 次${limitText}已全部使用`}
            </p>
          </div>

          {/* Upgrade Prompt */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  {language === 'en' 
                    ? `Upgrade to ${nextPlanName}` 
                    : `升級至${nextPlanName}`}
                </h4>
                <p className="text-sm text-gray-600">
                  {language === 'en' 
                    ? `Get unlimited ${limitText} and unlock premium features` 
                    : `獲得無限${limitText}並解鎖高級功能`}
                </p>
                {nextPlan === 'pro' && (
                  <ul className="mt-3 space-y-1">
                    <li className="text-xs text-gray-600">✓ {language === 'en' ? 'Unlimited projects & proposals' : '無限項目和提案'}</li>
                    <li className="text-xs text-gray-600">✓ {language === 'en' ? '10% service fee (vs 20%)' : '10% 服務費（原 20%）'}</li>
                    <li className="text-xs text-gray-600">✓ {language === 'en' ? 'Priority support' : '優先支援'}</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'en' ? 'Maybe Later' : '稍後再說'}
          </Button>
          <Button onClick={handleUpgrade}>
            <TrendingUp className="h-4 w-4 mr-2" />
            {t.actions.upgrade}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}