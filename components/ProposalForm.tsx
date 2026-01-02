import { useAuth } from "../contexts/AuthContext";
import { proposalApi } from "../lib/api";
import { toast } from "sonner"; // ✅ 移除版本号
import { Loader2, Target } from "lucide-react";
import { MilestoneBuilder, type Milestone } from "./MilestoneBuilder";
import { CurrencySelector } from "./CurrencySelector";
import { type Currency, getDefaultCurrency, getCurrencyInfo } from "../lib/currency";

interface Project {
  id: string;
  title: string;
}

interface ProposalFormProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}

export function ProposalForm({ project, open, onOpenChange, onSubmitted }: ProposalFormProps) {
  const { language } = useLanguage();
  const { accessToken, refreshSession } = useAuth();
  const t = getTranslation(language).proposals;

  const [loading, setLoading] = useState(false);
  const [useMilestones, setUseMilestones] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [formData, setFormData] = useState({
    cover_letter: "",
    proposed_budget: "",
    delivery_time: "",
    milestones: "",
    currency: getDefaultCurrency(language) as Currency,
  });

  // Helper function to get currency display name
  const getCurrencyName = (currency: Currency) => {
    const info = getCurrencyInfo(currency);
    if (language === 'en') return info.name;
    if (language === 'zh-CN') return info.nameCN;
    return info.nameTW;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      alert(language === 'en' 
        ? 'Please login first' 
        : language === 'zh-CN'
        ? '请先登录'
        : '請先登入');
      return;
    }

    setLoading(true);

    try {
      const proposalData = {
        project_id: project.id,
        cover_letter: formData.cover_letter,
        proposed_budget: parseFloat(formData.proposed_budget),
        delivery_time: formData.delivery_time || null,
        milestones: useMilestones ? milestones : (formData.milestones ? formData.milestones.split('\\n').filter(Boolean) : []),
        use_structured_milestones: useMilestones,
        currency: formData.currency,
      };

      console.log('🚀 [ProposalForm] Sending proposal data:', proposalData);
      
      // 🔧 Try to submit, if 401 then refresh token and retry
      let currentToken = accessToken;
      try {
        await proposalApi.create(proposalData, currentToken);
      } catch (firstError: any) {
        console.log('❌ [ProposalForm] First attempt failed:', firstError.message);
        console.log('❌ [ProposalForm] Error status:', firstError.status);
        
        // ✅ 特別處理「已提交提案」的錯誤（檢查在第一次嘗試就失敗的情況）
        if (firstError.message && firstError.message.includes('already submitted a proposal')) {
          console.log('ℹ️ [ProposalForm] User already submitted proposal, showing info message');
          const alreadySubmittedMsg = language === 'en' 
            ? '✅ You have already submitted a proposal for this project. You can view your proposal in the Dashboard.' 
            : language === 'zh-CN'
            ? '✅ 您已經為此項目提交過提案。您可以在儀表板中查看您的提案。'
            : '✅ 您已經為此專案提交過提案。您可以在儀表板中查看您的提案。';
          
          toast.info(alreadySubmittedMsg, {
            duration: 5000,
          });
          
          // 關閉對話框
          onOpenChange(false);
          if (onSubmitted) onSubmitted();
          setLoading(false);
          return;
        }
        
        // Check if it's a 401 error (Invalid JWT)
        if (firstError.status === 401 || (firstError.message && (firstError.message.includes('Invalid JWT') || firstError.message.includes('401')))) {
          console.log('🔄 [ProposalForm] Token expired (401 error), refreshing session...');
          
          try {
            const newToken = await refreshSession();
            if (newToken) {
              console.log('✅ [ProposalForm] Token refreshed successfully, retrying with new token...');
              currentToken = newToken;
              // Retry with new token
              await proposalApi.create(proposalData, currentToken);
              console.log('✅ [ProposalForm] Proposal created successfully after token refresh');
            } else {
              console.error('❌ [ProposalForm] Failed to refresh token - got null');
              throw new Error(language === 'en' 
                ? 'Session expired. Please login again.' 
                : language === 'zh-CN'
                ? '会话已过期。请重新登录。'
                : '會話已過期。請重新登入。');
            }
          } catch (refreshError) {
            console.error('❌ [ProposalForm] Error during token refresh:', refreshError);
            
            // Show user-friendly message and redirect to login
            const loginMsg = language === 'en' 
              ? 'Your session has expired. Please login again to continue.' 
              : language === 'zh-CN'
              ? '您的会话已过期。请重新登录以继续。'
              : '您的會話已過期。請重新登入以繼續。';
            
            toast.error(loginMsg);
            
            // Close dialog and redirect to login after 2 seconds
            setTimeout(() => {
              onOpenChange(false);
              // Redirect to login view
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'auth');
              window.history.pushState({}, '', url);
              window.location.reload();
            }, 2000);
            
            return; // Don't throw, we're handling it
          }
        } else {
          // Not a token error, rethrow
          throw firstError;
        }
      }
      
      console.log('✅ [ProposalForm] Proposal created successfully');

      const successMsg = language === 'en' 
        ? 'Proposal submitted successfully!' 
        : language === 'zh-CN'
        ? '提案提交成功！'
        : '提案提交成功！';
      toast.success(successMsg);

      // Reset form
      setFormData({
        cover_letter: "",
        proposed_budget: "",
        delivery_time: "",
        milestones: "",
        currency: getDefaultCurrency(language) as Currency,
      });
      setUseMilestones(false);
      setMilestones([]);

      onOpenChange(false);
      if (onSubmitted) onSubmitted();
    } catch (error: any) {
      console.error('Error submitting proposal:', error);
      
      // ✅ 特別處理「已提交提案」的錯誤
      if (error.message && error.message.includes('already submitted a proposal')) {
        console.log('ℹ️ [ProposalForm] User already submitted proposal (caught in outer catch), showing info message');
        const alreadySubmittedMsg = language === 'en' 
          ? '✅ You have already submitted a proposal for this project. You can view your proposal in the Dashboard.' 
          : language === 'zh-CN'
          ? '✅ 您已經為此項目提交過提案。您可以在儀表板中查看您的提案。'
          : '✅ 您已經為此專案提交過提案。您可以在儀表板中查看您的提案。';
        
        toast.info(alreadySubmittedMsg, {
          duration: 5000,
        });
        
        // 關閉對話框
        onOpenChange(false);
        if (onSubmitted) onSubmitted();
        return;
      }
      
      // 其他錯誤
      const errorMsg = error.message || (language === 'en' 
        ? 'Failed to submit proposal' 
        : language === 'zh-CN'
        ? '提交提案失败'
        : '提交提案失敗');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.form.title || (language === 'en' ? 'Submit Proposal' : language === 'zh-CN' ? '提交提案' : '提交提案')}</DialogTitle>
          <DialogDescription>
            {language === 'en' 
              ? 'Submit your proposal for this project. Please provide your budget estimate and cover letter.' 
              : language === 'zh-CN'
              ? '为此项目提交您的提案。请提供您的预算报价和求职信。'
              : '為此案件提交您的提案。請提供您的預算報價和求職信。'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Currency Selector - Move to top */}
          <div>
            <Label htmlFor="currency">
              {language === 'en' ? 'Currency' : language === 'zh-CN' ? '货币' : '貨幣'} *
            </Label>
            <CurrencySelector
              id="currency"
              value={formData.currency}
              onChange={(currency) => setFormData({ ...formData, currency })}
            />
          </div>

          <div>
            <Label htmlFor="proposed_budget">
              {language === 'en' 
                ? `Proposed Budget (${getCurrencyName(formData.currency)})` 
                : language === 'zh-CN'
                ? `案预算（${getCurrencyName(formData.currency)}）`
                : `提案預算（${getCurrencyName(formData.currency)}）`} *
            </Label>
            <Input
              id="proposed_budget"
              type="number"
              value={formData.proposed_budget}
              onChange={(e) => setFormData({ ...formData, proposed_budget: e.target.value })}
              placeholder={
                language === 'en' 
                  ? `Enter your bid amount in ${formData.currency}` 
                  : language === 'zh-CN'
                  ? `输入您的报价（${getCurrencyName(formData.currency)}）`
                  : `輸入您的報價（${getCurrencyName(formData.currency)}）`
              }
              required
              min="1"
              step="any"
            />
            <p className="text-xs text-gray-500 mt-1">
              {language === 'en' 
                ? 'Amount you will charge for this project'
                : language === 'zh-CN'
                ? '您将为此项目收取的金额'
                : '您將為此案件收取的金額'}
            </p>
          </div>

          {/* Cover Letter */}
          <div>
            <Label htmlFor="cover_letter">
              {t.form.coverLetter} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="cover_letter"
              value={formData.cover_letter}
              onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
              placeholder={t.form.coverLetterPlaceholder}
              rows={6}
              required
            />
          </div>

          {/* Delivery Time */}
          <div>
            <Label htmlFor="delivery_time">{t.form.deliveryTime}</Label>
            <Input
              id="delivery_time"
              value={formData.delivery_time}
              onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
              placeholder={t.form.deliveryPlaceholder}
            />
          </div>

          {/* Milestone Toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <Label htmlFor="use_milestones" className="cursor-pointer">
                  {language === 'en' 
                    ? 'Use Milestone-Based Payment' 
                    : language === 'zh-CN'
                    ? '使用里程碑付款'
                    : '使用里程碑付款'}
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  {language === 'en' 
                    ? 'Recommended for projects over $5,000' 
                    : language === 'zh-CN'
                    ? '推荐用于 $5,000 以上的项目'
                    : '建議用於 $5,000 以上的項目'}
                </p>
              </div>
            </div>
            <Switch
              id="use_milestones"
              checked={useMilestones}
              onCheckedChange={setUseMilestones}
            />
          </div>

          {/* Milestones - Structured or Simple */}
          {useMilestones ? (
            <MilestoneBuilder
              totalBudget={parseFloat(formData.proposed_budget) || 0}
              currency={formData.currency}
              onChange={setMilestones}
              initialMilestones={milestones}
            />
          ) : (
            <div>
              <Label htmlFor="milestones">{t.form.milestones}</Label>
              <Textarea
                id="milestones"
                value={formData.milestones}
                onChange={(e) => setFormData({ ...formData, milestones: e.target.value })}
                placeholder={t.form.milestonePlaceholder}
                rows={4}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t.form.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' 
                    ? 'Submitting...' 
                    : language === 'zh-CN'
                    ? '提交中...'
                    : '提交中...'}
                </>
              ) : (
                t.form.submit
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}