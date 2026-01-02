import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Loader2, X, Plus } from "lucide-react";

interface ProjectPostingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const categories = [
  { value: "development", en: "Development & IT", "zh-TW": "開發與IT", "zh-CN": "开发与IT" },
  { value: "design", en: "Design & Creative", "zh-TW": "設計與創意", "zh-CN": "设计与创意" },
  { value: "content", en: "Content & Writing", "zh-TW": "內容與寫作", "zh-CN": "内容与写作" },
  { value: "marketing", en: "Marketing & Sales", "zh-TW": "營銷與銷售", "zh-CN": "营销与销售" },
  { value: "video", en: "Video & Animation", "zh-TW": "視頻與動畫", "zh-CN": "视频与动画" },
  { value: "business", en: "Business Consulting", "zh-TW": "商業諮詢", "zh-CN": "商业咨询" },
];

export function ProjectPostingDialog({ open, onOpenChange, onSuccess }: ProjectPostingDialogProps) {
  const { language } = useLanguage();
  const { user, session, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget_min: "",
    budget_max: "",
    deadline: "",
    required_skills: [] as string[],
  });

  const [skillInput, setSkillInput] = useState("");

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        required_skills: [...formData.required_skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.filter(s => s !== skill),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !session) {
      toast.error(language === 'en' ? 'Please sign in to post a project' : '請登入以發布案件');
      return;
    }

    if (!formData.title || !formData.description || !formData.category) {
      toast.error(language === 'en' ? 'Please fill in all required fields' : '請填寫所有必填欄位');
      return;
    }

    setLoading(true);
    try {
      // 🔧 DEV MODE: Prepare token for API call
      let token = accessToken || session?.access_token || '';
      if (token.startsWith('dev-user-') && user?.email && !token.includes('||')) {
        token = `${token}||${user.email}`;
      }

      const isDevMode = token.startsWith('dev-user-');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (isDevMode) {
        headers['X-Dev-Token'] = token;
        headers['Authorization'] = `Bearer ${publicAnonKey}`;
      } else {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/projects`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            budget_min: formData.budget_min ? Number(formData.budget_min) : 0,
            budget_max: formData.budget_max ? Number(formData.budget_max) : 0,
            deadline: formData.deadline || null,
            required_skills: formData.required_skills,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ API call failed:', {
          endpoint: '/projects',
          method: 'POST',
          error: data.error,
          fullUrl: `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/projects`
        });
        throw new Error(data.error || 'Failed to create project');
      }

      toast.success(language === 'en' ? 'Project posted successfully!' : '案件發布成功！');
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        budget_min: "",
        budget_max: "",
        deadline: "",
        required_skills: [],
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error posting project:', error);
      toast.error(language === 'en' ? 'Failed to post project' : '發布案件失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Post a New Project' : '發布新案件'}
          </DialogTitle>
          <DialogDescription>
            {language === 'en' 
              ? 'Share details about your project and connect with talented professionals.'
              : '分享您的案件詳情，與專業人才建立聯繫。'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">
              {language === 'en' ? 'Project Title' : '案件標題'} *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={language === 'en' ? 'e.g., Build a mobile app for delivery service' : '例如：開發外送服務的移動應用'}
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">
              {language === 'en' ? 'Category' : '分類'} *
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'en' ? 'Select a category' : '選擇分類'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {language === 'en' ? cat.en : (language === 'zh-TW' ? cat['zh-TW'] : cat['zh-CN'])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">
              {language === 'en' ? 'Description' : '描述'} *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={language === 'en' 
                ? 'Describe your project in detail, including requirements and expectations...'
                : '詳細描述您的案件，包括要求和期望...'}
              rows={10}
              required
              className="min-h-[200px]"
            />
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget_min">
                {language === 'en' ? 'Min Budget (USD)' : '最低預算 (台幣)'}
              </Label>
              <Input
                id="budget_min"
                type="number"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                placeholder={language === 'en' ? '300' : '10,000'}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="budget_max">
                {language === 'en' ? 'Max Budget (USD)' : '最高預算 (台幣)'}
              </Label>
              <Input
                id="budget_max"
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                placeholder={language === 'en' ? '1,000' : '50,000'}
                min="0"
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="deadline">
              {language === 'en' ? 'Deadline (Optional)' : '截止日期（選填）'}
            </Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Required Skills */}
          <div>
            <Label>
              {language === 'en' ? 'Required Skills' : '所需技能'}
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder={language === 'en' ? 'e.g., React, Node.js' : '例如：React、Node.js'}
              />
              <Button type="button" onClick={handleAddSkill} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.required_skills.map((skill) => (
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === 'en' ? 'Post Project' : '發布案件'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}