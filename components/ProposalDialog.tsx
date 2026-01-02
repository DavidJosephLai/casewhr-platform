import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useState } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSubscription } from "../hooks/useSubscription";
import { LimitReachedDialog } from "./LimitReachedDialog";
import { getDefaultCurrency, getCurrencyName, type Currency } from "../lib/currency";
import { CurrencySelector } from "./CurrencySelector";

interface Project {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  currency?: Currency; // 項目的貨幣
}

interface ProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSuccess?: () => void;
}

export function ProposalDialog({ open, onOpenChange, project, onSuccess }: ProposalDialogProps) {
  const { language } = useLanguage();
  const { session } = useAuth();
  const { limits, incrementUsage } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  
  // 根據語言自動設置貨幣
  const [currency, setCurrency] = useState<Currency>(getDefaultCurrency(language));

  const [formData, setFormData] = useState({
    amount: "",
    delivery_days: "",
    cover_letter: "",
  });
  
  // 將 null 檢查移到所有 hooks 之後
  if (!project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      const errorMsg = language === 'en' 
        ? 'Please sign in to submit proposal' 
        : language === 'zh-CN'
        ? '请登录以提交提案'
        : '請登入以提交提案';
      toast.error(errorMsg);
      return;
    }

    // Check if user has reached their monthly limit
    if (limits && !limits.canSubmitProposal) {
      setShowLimitDialog(true);
      return;
    }

    if (!formData.amount || !formData.delivery_days || !formData.cover_letter) {
      const errorMsg = language === 'en' 
        ? 'Please fill in all fields' 
        : language === 'zh-CN'
        ? '请填写所有字段'
        : '請填寫所有欄位';
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/proposals`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            project_id: project.id,
            proposed_budget: Number(formData.amount),
            delivery_time: `${formData.delivery_days} days`,
            cover_letter: formData.cover_letter,
            currency: currency, // 添加貨幣欄位
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit proposal');
      }

      // Increment usage counter
      await incrementUsage('proposal');

      const successMsg = language === 'en' 
        ? 'Proposal submitted successfully!' 
        : language === 'zh-CN'
        ? '提案提交成功！'
        : '提案提交成功！';
      toast.success(successMsg);
      
      // Show email notification reminder for Hotmail/Outlook users
      // Get user profile to check email
      const profileResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const userEmail = profileData.email;
        const isHotmailUser = userEmail?.includes('@hotmail.') || 
                              userEmail?.includes('@outlook.') || 
                              userEmail?.includes('@live.');
        
        if (isHotmailUser) {
          // Show additional reminder for Hotmail/Outlook users
          setTimeout(() => {
            const emailMsg = language === 'en' 
              ? '📧 Please check your spam folder if you don\'t receive a confirmation email'
              : language === 'zh-CN'
              ? '📧 如果未收到确认邮件，请检查您的垃圾邮件文件夹'
              : '📧 如果未收到確認郵件，請檢查您的垃圾郵件文件夾';
            toast.info(emailMsg, { duration: 8000 });
          }, 2000);
        }
      }
      
      // Reset form
      setFormData({
        amount: "",
        delivery_days: "",
        cover_letter: "",
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting proposal:', error);
      const errorMsg = language === 'en' 
        ? 'Failed to submit proposal' 
        : language === 'zh-CN'
        ? '提交提案失败'
        : '提交提案失敗';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' 
                ? 'Submit Your Proposal' 
                : language === 'zh-CN'
                ? '提交您的提案'
                : '提交您的提案'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Project:' 
                : language === 'zh-CN'
                ? '项目：'
                : '案件：'} {project.title}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Currency Selector */}
            <div className="space-y-2">
              <Label>
                {language === 'en' ? 'Currency' : language === 'zh-CN' ? '货币' : '貨幣'} *
              </Label>
              <CurrencySelector value={currency} onChange={setCurrency} className="w-full" />
              <p className="text-xs text-gray-500">
                {language === 'en' 
                  ? 'Select the currency for your proposal' 
                  : language === 'zh-CN'
                  ? '选择您提案的货币'
                  : '選擇您提案的貨幣'}
              </p>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount">
                {language === 'en' 
                  ? `Your Bid Amount (${getCurrencyName(currency, language)})` 
                  : language === 'zh-CN'
                  ? `您的报价金额（${getCurrencyName(currency, language)}）`
                  : `您的出價金額（${getCurrencyName(currency, language)}）`} *
              </Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder={
                  language === 'en' 
                    ? `Enter amount in ${currency}` 
                    : language === 'zh-CN'
                    ? `输入金额（${getCurrencyName(currency, language)}）`
                    : `輸入金額（${getCurrencyName(currency, language)}）`
                }
                required
                min="1"
                step="any"
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === 'en' 
                  ? `Project budget: ${project.budget_min} - ${project.budget_max} ${project.currency || 'TWD'}`
                  : language === 'zh-CN'
                  ? `项目预算：${project.budget_min} - ${project.budget_max} ${project.currency || 'TWD'}`
                  : `專案預算：${project.budget_min} - ${project.budget_max} ${project.currency || 'TWD'}`}
              </p>
            </div>

            {/* Delivery Days */}
            <div>
              <Label htmlFor="delivery_days">
                {language === 'en' ? 'Delivery Time (Days)' : '交付時間（天）'} *
              </Label>
              <Input
                id="delivery_days"
                type="number"
                value={formData.delivery_days}
                onChange={(e) => setFormData({ ...formData, delivery_days: e.target.value })}
                placeholder="14"
                min="1"
                required
              />
            </div>

            {/* Cover Letter */}
            <div>
              <Label htmlFor="cover_letter">
                {language === 'en' ? 'Cover Letter' : '提案說明'} *
              </Label>
              <Textarea
                id="cover_letter"
                value={formData.cover_letter}
                onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                placeholder={language === 'en' 
                  ? 'Explain why you are the best fit for this project. Include your relevant experience and approach...'
                  : '說明為什麼您最適合這個案件。包括您的相關經驗和方法...'}
                rows={8}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                {language === 'en' ? 'Cancel' : '取消'}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === 'en' ? 'Submit Proposal' : '提交提案'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <LimitReachedDialog
        open={showLimitDialog}
        onOpenChange={setShowLimitDialog}
        limitType="proposal"
      />
    </>
  );
}