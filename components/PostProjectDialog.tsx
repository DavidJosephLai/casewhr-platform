import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { projectApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Loader2, X, Lock } from "lucide-react";
import { Badge } from "./ui/badge";
import { useSubscription } from "../hooks/useSubscription";
import { LimitReachedDialog } from "./LimitReachedDialog";
import { CurrencySelector } from "./CurrencySelector";
import { Currency, formatCurrency, convertCurrency, getExchangeRateText, getDefaultCurrency } from "../lib/currency";
import { ProjectAISEOHelper } from "./ProjectAISEOHelper";
import { toast } from "sonner@2.0.3"; // 🔥 使用正確的 toast 庫

interface PostProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PostProjectDialog({ open, onOpenChange, onSuccess }: PostProjectDialogProps) {
  const { language } = useLanguage();
  const { accessToken, user } = useAuth(); // 🔥 添加 user 檢查
  const t = getTranslation(language as any).projects;
  
  // 🔥 VERSION STAMP - Force recompile 2025-01-01-v2.2.4
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔥🔥🔥 [PostProjectDialog v2.2.4] COMPONENT LOADED');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 Open prop:', open);
  console.log('👤 User exists:', !!user);
  console.log('📧 User email:', user?.email || 'NO USER');
  console.log('🔑 Access Token:', !!accessToken);
  console.log('💡 Effective Open (open && !!user):', open && !!user);
  console.log('🚦 Dialog will show:', open && !!user ? '✅ YES - OPENING' : '❌ NO - BLOCKED');
  console.log('🌍 Language:', language);
  console.log('═══════════════════════════════════════════════════════');
  
  // 🔥 如果對話框被打開但用戶未登錄，立即關閉並觸發登錄對話框
  useEffect(() => {
    if (open && !user) {
      console.log('🚨 [PostProjectDialog] Dialog opened without login! Triggering login...');
      
      // 立即關閉對話框
      onOpenChange(false);
      
      // 觸發登錄對話框
      window.dispatchEvent(new CustomEvent('openAuthDialog', { detail: 'login' }));
      
      // 保存登錄後要執行的動作
      sessionStorage.setItem('postLoginAction', 'openPostProject');
      
      // 顯示提示
      toast.error(language === 'en' ? 'Please sign in first' : '請先登入');
    }
  }, [open, user, onOpenChange, language]);
  
  const categories = getTranslation(language as any).categories.items;
  const { limits, incrementUsage } = useSubscription();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  // 根據語言自動設置貨幣：中文用 TWD，英文用 USD
  const [currency, setCurrency] = useState<Currency>(getDefaultCurrency(language));

  // 當語言改變時，自動更新貨幣
  useEffect(() => {
    setCurrency(getDefaultCurrency(language));
  }, [language]);

  // 監聽來自開發與IT服務方塊的事件，預填分類和技能
  useEffect(() => {
    const handleOpenWithCategory = (event: CustomEvent) => {
      const { category, subcategory, skills: suggestedSkills } = event.detail;
      
      console.log('📥 收到預填事件:', { category, subcategory, suggestedSkills });
      
      // 設置分類為 "Development & IT"
      const categoryMatch = categories.find(cat => 
        cat.title === category || cat.title === 'Development & IT' || cat.value === 'development'
      );
      
      if (categoryMatch) {
        setCategory(categoryMatch.title);
        console.log('✅ 已設置分類:', categoryMatch.title);
      }
      
      // 將子分類和技能添加到標題或描述提示
      if (subcategory) {
        setTitle(`${subcategory} Project`);
        console.log('✅ 已設置標題提示:', subcategory);
      }
      
      // 預填技能（取前3個）
      if (suggestedSkills && suggestedSkills.length > 0) {
        const prefilledSkills = suggestedSkills.slice(0, 3);
        setSkills(prefilledSkills);
        console.log('✅ 已預填技能:', prefilledSkills);
      }
      
      // 打開對話框
      onOpenChange(true);
    };

    window.addEventListener('openPostProjectWithCategory', handleOpenWithCategory as EventListener);
    
    return () => {
      window.removeEventListener('openPostProjectWithCategory', handleOpenWithCategory as EventListener);
    };
  }, [categories, onOpenChange]);

  // Get all skills from all categories
  const allSkills = categories.flatMap(cat => cat.skills || []);
  
  // Get skills for selected category
  const selectedCategorySkills = category 
    ? categories.find(cat => cat.title === category)?.skills || []
    : [];
  
  // Show category-specific skills first, then others
  const skillSuggestions = [
    ...selectedCategorySkills.filter(s => !skills.includes(s)),
    ...allSkills.filter(s => !skills.includes(s) && !selectedCategorySkills.includes(s))
  ].slice(0, 12);

  const handleAddSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Check if user has reached their monthly limit
    if (limits && !limits.canCreateProject) {
      setShowLimitDialog(true);
      return;
    }
    
    // Validation
    if (!title.trim()) {
      setError(language === 'en' ? 'Project title is required' : '請輸入項目標題');
      return;
    }
    if (!description.trim()) {
      setError(language === 'en' ? 'Project description is required' : '請輸入項目描述');
      return;
    }
    if (!category) {
      setError(language === 'en' ? 'Please select a category' : '請選擇項目分類');
      return;
    }

    setLoading(true);

    try {
      const projectData = {
        title: title.trim(),
        description: description.trim(),
        category,
        budget_min: budgetMin ? parseInt(budgetMin) : null,
        budget_max: budgetMax ? parseInt(budgetMax) : null,
        currency: currency,
        deadline: deadline || null,
        required_skills: skills,
        status: 'open', // 默认状态为 open
      };

      // 使用正确的 API 方法名: create
      await projectApi.create(projectData, accessToken);
      
      // Increment usage counter
      await incrementUsage('project');
      
      const successMsg = language === 'en' 
        ? '✅ Project posted successfully! You can view it in Dashboard → My Projects.' 
        : language === 'zh-CN'
        ? '✅ 項目發布成功！您可以在 儀表板 → 我的項目 中查看。'
        : '✅ 專案發布成功！您可以在 儀表板 → 我的專案 中查看。';
      toast.success(successMsg, { duration: 6000 });
      
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setBudgetMin("");
      setBudgetMax("");
      setDeadline("");
      setSkills([]);
      setSkillInput("");
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
      // 🔥 滾動到頁面頂部，讓用戶看到新項目
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
      
      // 🔥 延遲後提示用戶切換到 Dashboard 查看項目
      setTimeout(() => {
        const dashboardMsg = language === 'en'
          ? '💡 Tip: Go to Dashboard to manage your project and view proposals'
          : language === 'zh-CN'
          ? '💡 提示：前往儀表板管理您的項目並查看提案'
          : '💡 提示：前往儀表板管理您的專案並查看提案';
        toast.info(dashboardMsg, { duration: 8000 });
      }, 2500);
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || (language === 'en' 
        ? 'Failed to create project. Please try again.' 
        : '創建項目失敗，請重試。'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open && !!user} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {(() => {
                let titleText = language === 'en' 
                  ? 'Post a New Project' 
                  : language === 'zh-CN' 
                    ? '发布新项目' 
                    : '發布新項目';
                console.log('🎨 [PostProjectDialog] Dialog Title:', titleText);
                console.log('🎨 [PostProjectDialog] Language value:', language);
                console.log('🎨 [PostProjectDialog] Language type:', typeof language);
                return titleText;
              })()}
            </DialogTitle>
            <DialogDescription>
              {(() => {
                let descText = language === 'en' 
                  ? 'Fill out the form below to post your project.' 
                  : language === 'zh-CN' 
                    ? '填写下面的表单以发布您的项目。' 
                    : '填寫下面的表單以發布您的項目。';
                console.log('🎨 [PostProjectDialog] Dialog Description:', descText);
                return descText;
              })()}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                {t.form.title} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={language === 'en' 
                  ? 'e.g., Build a React website for my business' 
                  : '例如：為我的企業建立一個React網站'}
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {t.form.description} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'en'
                  ? 'Describe your project in detail, including requirements, goals, and any specific preferences...'
                  : '詳細描述您的項目，包括需求、目標和任何特定偏好...'}
                rows={10}
                maxLength={5000}
                className="min-h-[200px]"
              />
              <p className="text-xs text-gray-500">
                {description.length}/5000
              </p>
            </div>

            {/* AI SEO Helper */}
            <ProjectAISEOHelper
              title={title}
              description={description}
              category={category}
              skills={skills}
              language={language as 'zh-TW' | 'en' | 'zh-CN'}
              onOptimize={(optimized) => {
                if (optimized.title) setTitle(optimized.title);
                if (optimized.description) setDescription(optimized.description);
                if (optimized.keywords && optimized.keywords.length > 0) {
                  // 添加优化的关键词到技能列表
                  const newSkills = [...new Set([...skills, ...optimized.keywords.slice(0, 5)])];
                  setSkills(newSkills);
                }
              }}
            />

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                {t.form.category} <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Select category' : '選擇分類'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat, index) => (
                    <SelectItem key={`${cat.title}-${index}`} value={cat.title}>
                      {cat.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Budget Range */}
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Budget Range' : '預算範圍'}</Label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      placeholder={language === 'en' ? 'Min' : '最低'}
                      min="0"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      placeholder={language === 'en' ? 'Max' : '最高'}
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CurrencySelector
                    value={currency}
                    onChange={setCurrency}
                    className="flex-1"
                  />
                  <p className="text-xs text-gray-500 flex-1">
                    {getExchangeRateText(language)}
                  </p>
                </div>
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline">
                {language === 'en' ? 'Deadline (Optional)' : '截止日期（選填）'}
              </Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Required Skills */}
            <div className="space-y-2">
              <Label htmlFor="skills">
                {language === 'en' ? 'Required Skills' : '所需技能'}
              </Label>
              
              {/* Selected Skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded border">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Skill Input */}
              <div className="flex gap-2">
                <Input
                  id="skills"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(skillInput);
                    }
                  }}
                  placeholder={language === 'en' 
                    ? 'Type a skill and press Enter' 
                    : '輸入技能並按Enter'}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddSkill(skillInput)}
                >
                  {language === 'en' ? 'Add' : '添加'}
                </Button>
              </div>

              {/* Skill Suggestions */}
              <div className="flex flex-wrap gap-2">
                {skillSuggestions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {language === 'en' ? 'Cancel' : '取消'}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading 
                  ? (language === 'en' ? 'Posting...' : '發布中...') 
                  : (language === 'en' ? 'Post Project' : '發布項目')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Limit Reached Dialog */}
      {limits && (
        <LimitReachedDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          limitType="project"
          currentPlan={limits.plan}
          usage={limits.usage.projects}
          limit={limits.limits.projects}
        />
      )}
    </>
  );
}