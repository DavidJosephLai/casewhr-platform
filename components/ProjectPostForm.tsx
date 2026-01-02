import { projectApi } from "../lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProjectPostFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}

export function ProjectPostForm({ open, onOpenChange, onSubmitted }: ProjectPostFormProps) {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const { incrementUsage } = useSubscription();
  const t = getTranslation(language).projects;
  const categories = getTranslation(language).categories.items;

  const [loading, setLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(getDefaultCurrency(language));
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget_min: "",
    budget_max: "",
    deadline: "",
    required_skills: "",
  });

  // Update currency when language changes
  useEffect(() => {
    setSelectedCurrency(getDefaultCurrency(language));
  }, [language]);

  // 監聽來自開發與IT服務方塊的事件，預填分類和技能
  useEffect(() => {
    const handleOpenWithCategory = (event: CustomEvent) => {
      const { category, subcategory, skills: suggestedSkills } = event.detail;
      
      console.log('📥 [ProjectPostForm] 收到預填事件:', { category, subcategory, suggestedSkills });
      
      // 設置分類為 "Development & IT"
      const categoryMatch = categories.find(cat => 
        cat.title === category || cat.title === 'Development & IT' || cat.value === 'development'
      );
      
      if (categoryMatch) {
        console.log('✅ [ProjectPostForm] 已設置分類:', categoryMatch.title);
      }
      
      // 更新表單數據
      setFormData(prev => ({
        ...prev,
        title: subcategory ? `${subcategory} Project` : prev.title,
        category: categoryMatch ? categoryMatch.title : prev.category,
        required_skills: suggestedSkills ? suggestedSkills.slice(0, 3).join(', ') : prev.required_skills,
      }));
      
      console.log('✅ [ProjectPostForm] 已預填表單數據');
      
      // 打開對話框
      onOpenChange(true);
    };

    window.addEventListener('openPostProjectWithCategory', handleOpenWithCategory as EventListener);
    
    return () => {
      window.removeEventListener('openPostProjectWithCategory', handleOpenWithCategory as EventListener);
    };
  }, [categories, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error(language === 'en' ? 'Please fill in all required fields' : '請填寫所有必填欄位');
      return;
    }

    if (!accessToken) {
      toast.error(language === 'en' ? 'Please login to post a project' : '請登入以發布項目');
      return;
    }

    setLoading(true);

    try {
      const projectData = {
        title: formData.title,
        description: formData.description,
        category: formData.category || null,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        currency: selectedCurrency,
        deadline: formData.deadline || null,
        required_skills: formData.required_skills
          ? formData.required_skills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };

      await projectApi.create(projectData, accessToken);

      // Increment usage counter
      await incrementUsage('project');

      toast.success(language === 'en' ? 'Project posted successfully!' : '項目發布成功！');

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        budget_min: "",
        budget_max: "",
        deadline: "",
        required_skills: "",
      });

      onOpenChange(false);
      if (onSubmitted) onSubmitted();
    } catch (error: any) {
      console.error('Error posting project:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to post project' : '發布項目失敗'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.postProject}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">
              {t.form.title} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t.form.titlePlaceholder}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">
              {t.form.description} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t.form.descriptionPlaceholder}
              rows={6}
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">{t.form.category}</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.form.categoryPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat, index) => (
                  <SelectItem key={index} value={cat.title}>
                    {cat.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget_min">{t.form.budgetMin}</Label>
              <Input
                id="budget_min"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                placeholder={t.form.budgetPlaceholder}
              />
            </div>
            <div>
              <Label htmlFor="budget_max">{t.form.budgetMax}</Label>
              <Input
                id="budget_max"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                placeholder={t.form.budgetPlaceholder}
              />
            </div>
            <div>
              <Label htmlFor="currency">{t.form.currency}</Label>
              <CurrencySelector
                value={selectedCurrency}
                onChange={setSelectedCurrency}
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="deadline">{t.form.deadline}</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          {/* Required Skills */}
          <div>
            <Label htmlFor="skills">{t.form.requiredSkills}</Label>
            <Input
              id="skills"
              value={formData.required_skills}
              onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
              placeholder={t.form.skillsPlaceholder}
            />
            <p className="text-sm text-gray-500 mt-1">{t.form.skillsHelper}</p>
          </div>

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
                  {language === 'en' ? 'Posting...' : '發布中...'}
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