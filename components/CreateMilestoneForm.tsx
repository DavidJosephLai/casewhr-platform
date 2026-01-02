import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

interface CreateMilestoneFormProps {
  proposalId: string;
  currency?: string; // 🔥 新增：提案的幣別
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateMilestoneForm({ proposalId, currency, onSuccess, onCancel }: CreateMilestoneFormProps) {
  const { language } = useLanguage();
  const { accessToken, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.amount || !formData.dueDate) {
      toast.error(
        language === 'en' 
          ? 'Please fill in all required fields' 
          : '請填寫所有必填欄位'
      );
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(
        language === 'en' 
          ? 'Please enter a valid amount' 
          : '請輸入有效金額'
      );
      return;
    }

    setLoading(true);
    try {
      console.log('🆕 [CreateMilestoneForm] Creating milestone:', formData);

      // 🔥 開發模式支援
      const isDevModeActive = localStorage.getItem('dev_mode_active') === 'true';
      const isMockProposal = proposalId.startsWith('proposal-mock-project-');

      if (isDevModeActive && isMockProposal) {
        console.log('🧪 [CreateMilestoneForm] Dev mode: Simulating milestone creation');
        
        // 模擬成功
        await new Promise(resolve => setTimeout(resolve, 800));
        
        toast.success(
          language === 'en' 
            ? 'Milestone created successfully!' 
            : '里程碑創建成功！'
        );
        
        onSuccess();
        return;
      }

      let token = accessToken || '';
      if (token.startsWith('dev-user-') && user?.email && !token.includes('||')) {
        token = `${token}||${user.email}`;
      }

      const isDevMode = token.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? {
            'Content-Type': 'application/json',
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        : {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            proposal_id: proposalId,
            title: formData.title,
            description: formData.description,
            amount,
            due_date: formData.dueDate,
            currency: currency || 'TWD',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create milestone');
      }

      toast.success(
        language === 'en' 
          ? 'Milestone created successfully!' 
          : '里程碑創建成功！'
      );

      onSuccess();
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to create milestone' 
          : '創建里程碑失敗'
      );
    } finally {
      setLoading(false);
    }
  };

  const t = {
    en: {
      title: 'Create New Milestone',
      milestoneTitle: 'Milestone Title',
      milestoneTitlePlaceholder: 'e.g., Frontend Development',
      description: 'Description',
      descriptionPlaceholder: 'Describe the deliverables for this milestone...',
      amount: `Amount (${currency || 'TWD'})`, // 🔥 動態顯示幣別
      amountPlaceholder: '10000',
      dueDate: 'Due Date',
      cancel: 'Cancel',
      create: 'Create Milestone',
      creating: 'Creating...',
    },
    zh: {
      title: '創建新里程碑',
      milestoneTitle: '里程碑標題',
      milestoneTitlePlaceholder: '例如：前端開發',
      description: '描述',
      descriptionPlaceholder: '描述此里程碑的交付成果...',
      amount: `金額 (${currency || 'TWD'})`, // 🔥 動態顯示幣別
      amountPlaceholder: '10000',
      dueDate: '截止日期',
      cancel: '取消',
      create: '創建里程碑',
      creating: '創建中...',
    },
  };

  const text = language === 'en' ? t.en : t.zh;

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            {text.title}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {text.milestoneTitle} <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={text.milestoneTitlePlaceholder}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {text.description}
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={text.descriptionPlaceholder}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {text.amount} <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder={text.amountPlaceholder}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {text.dueDate} <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                disabled={loading}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              {text.cancel}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {text.creating}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {text.create}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}