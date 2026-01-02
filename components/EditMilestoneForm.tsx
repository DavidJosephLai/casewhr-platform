import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Loader2, Save, X } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { Milestone } from './MilestoneManager';

interface EditMilestoneFormProps {
  milestone: Milestone;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditMilestoneForm({ milestone, onSuccess, onCancel }: EditMilestoneFormProps) {
  const { language } = useLanguage();
  const { accessToken, user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: milestone.title,
    description: milestone.description,
    amount: milestone.amount.toString(),
    dueDate: milestone.due_date?.split('T')[0] || '', // Convert ISO to YYYY-MM-DD
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken) {
      toast.error(language === 'en' ? 'Not authenticated' : '未登錄');
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error(language === 'en' ? 'Title is required' : '請輸入標題');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error(language === 'en' ? 'Description is required' : '請輸入描述');
      return;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(language === 'en' ? 'Invalid amount' : '金額無效');
      return;
    }

    setLoading(true);
    
    try {
      let token = accessToken;
      if (accessToken.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }

      const isDevMode = accessToken.startsWith('dev-user-');
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
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${milestone.id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim(),
            amount: amount,
            due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update milestone');
      }

      toast.success(language === 'en' ? 'Milestone updated!' : '里程碑已更新！');
      onSuccess();
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to update milestone' 
          : '更新里程碑失敗'
      );
    } finally {
      setLoading(false);
    }
  };

  const t = {
    en: {
      title: 'Edit Milestone',
      milestoneTitle: 'Milestone Title',
      titlePlaceholder: 'Enter milestone title...',
      description: 'Description',
      descriptionPlaceholder: 'Describe what will be delivered in this milestone...',
      amount: 'Amount',
      amountPlaceholder: 'Enter amount...',
      dueDate: 'Due Date (Optional)',
      cancel: 'Cancel',
      save: 'Save Changes',
      saving: 'Saving...',
    },
    zh: {
      title: '編輯里程碑',
      milestoneTitle: '里程碑標題',
      titlePlaceholder: '輸入里程碑標題...',
      description: '描述',
      descriptionPlaceholder: '描述此里程碑將交付的內容...',
      amount: '金額',
      amountPlaceholder: '輸入金額...',
      dueDate: '截止日期（可選）',
      cancel: '取消',
      save: '保存更改',
      saving: '保存中...',
    },
  };

  const text = language === 'en' ? t.en : t.zh;

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 text-blue-900">
        ✏️ {text.title}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="edit-title">{text.milestoneTitle}</Label>
          <Input
            id="edit-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={text.titlePlaceholder}
            required
          />
        </div>

        <div>
          <Label htmlFor="edit-description">{text.description}</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={text.descriptionPlaceholder}
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-amount">{text.amount} ({milestone.currency})</Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder={text.amountPlaceholder}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-dueDate">{text.dueDate}</Label>
            <Input
              id="edit-dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="mr-2 h-4 w-4" />
            {text.cancel}
          </Button>
          
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {text.saving}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {text.save}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
