import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  PlayCircle,
  Send,
  DollarSign,
  Calendar,
  FileText,
  Loader2,
  ArrowRight,
  CheckCheck,
  MessageSquare,
  Wallet
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { formatCurrency } from '../lib/currency';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface Milestone {
  id: string;
  proposal_id: string;
  project_id: string;
  client_id: string;
  freelancer_id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  order: number;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved';
  payment_status?: 'pending' | 'released' | 'failed';
  payment_released_at?: string;
  payment_error?: string;
  due_date?: string;
  deadline_days?: number;
  submission_notes?: string;
  deliverable_urls?: string[];
  approval_feedback?: string;
  rejection_feedback?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
}

interface MilestonePlan {
  status: 'not_submitted' | 'submitted' | 'resubmitted' | 'approved' | 'revision_requested';
  submitted_at?: string;
  reviewed_at?: string;
  feedback?: string;
  total_amount?: number;
  milestone_count?: number;
}

interface Proposal {
  id: string;
  project_id: string;
  freelancer_id: string;
  client_id: string;
  proposed_budget: number;
  currency: string;
  status: string;
}

interface MilestoneManagementProps {
  proposal: Proposal;
  isFreelancer: boolean; // true = 接案者, false = 案主
  onUpdate?: () => void;
}

export function MilestoneManagement({ proposal, isFreelancer, onUpdate }: MilestoneManagementProps) {
  const { language } = useLanguage();
  const { accessToken, user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [plan, setPlan] = useState<MilestonePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 🔥 Debug: 檢查身份判斷
  useEffect(() => {
    console.log('🔥 [MilestoneManagement] Identity Check:', {
      isFreelancer,
      userId: user?.id,
      proposalFreelancerId: proposal.freelancer_id,
      proposalClientId: proposal.client_id,
      isMatch: user?.id === proposal.freelancer_id,
      shouldBeClient: user?.id === proposal.client_id,
    });
  }, [isFreelancer, user?.id, proposal]);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    due_date: '',
  });
  const [submitData, setSubmitData] = useState({
    submission_notes: '',
    deliverable_urls: '',
  });
  const [reviewData, setReviewData] = useState({
    feedback: '',
  });

  useEffect(() => {
    if (proposal?.id) {
      loadMilestones();
      loadPlan();
    }
  }, [proposal?.id]);

  const getHeaders = () => {
    const isDevMode = accessToken?.startsWith('dev-user-');
    return isDevMode
      ? { 
          'X-Dev-Token': accessToken,
          'Authorization': `Bearer ${publicAnonKey}`
        }
      : { 'Authorization': `Bearer ${accessToken}` };
  };

  const loadMilestones = async () => {
    if (!proposal?.id || !accessToken) return;

    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/proposal/${proposal.id}`;
      const response = await fetch(url, { headers: getHeaders() });

      if (!response.ok) {
        throw new Error('Failed to load milestones');
      }

      const data = await response.json();
      setMilestones(data.milestones || []);
    } catch (error) {
      console.error('Error loading milestones:', error);
      toast.error(language === 'en' ? 'Failed to load milestones' : '載入里程碑失敗');
    }
  };

  const loadPlan = async () => {
    if (!proposal?.id || !accessToken) return;

    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/plan/${proposal.id}`;
      const response = await fetch(url, { headers: getHeaders() });

      if (!response.ok) {
        throw new Error('Failed to load plan');
      }

      const data = await response.json();
      setPlan(data.plan || { status: 'not_submitted', milestones: [], total_amount: 0 });
    } catch (error) {
      console.error('Error loading plan:', error);
    }
  };

  const createMilestone = async () => {
    if (!formData.title || !formData.amount) {
      toast.error(language === 'en' ? 'Please fill in all required fields' : '請填寫所有必填欄位');
      return;
    }

    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposal_id: proposal.id,
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          currency: proposal.currency,
          due_date: formData.due_date || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create milestone');
      }

      toast.success(language === 'en' ? 'Milestone created!' : '里程碑已創建！');
      setShowCreateDialog(false);
      setFormData({ title: '', description: '', amount: '', due_date: '' });
      await loadMilestones();
      await loadPlan();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error creating milestone:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to create milestone' : '創建里程碑失敗'));
    } finally {
      setLoading(false);
    }
  };

  const updateMilestone = async () => {
    if (!currentMilestone || !formData.title || !formData.amount) {
      toast.error(language === 'en' ? 'Please fill in all required fields' : '請填寫所有必填欄位');
      return;
    }

    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${currentMilestone.id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update milestone');
      }

      toast.success(language === 'en' ? 'Milestone updated!' : '里程碑已更新！');
      setShowEditDialog(false);
      setCurrentMilestone(null);
      await loadMilestones();
      await loadPlan();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error updating milestone:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to update milestone' : '更新里程碑失敗'));
    } finally {
      setLoading(false);
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${milestoneId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete milestone');
      }

      toast.success(language === 'en' ? 'Milestone deleted!' : '里程碑已刪除！');
      setDeleteConfirm(null);
      await loadMilestones();
      await loadPlan();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error deleting milestone:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to delete milestone' : '刪除里程碑失敗'));
    } finally {
      setLoading(false);
    }
  };

  const submitPlanForReview = async () => {
    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/plan/${proposal.id}/submit`;
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit plan');
      }

      toast.success(language === 'en' ? 'Plan submitted for review!' : '計劃已提交審核');
      await loadPlan();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error submitting plan:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to submit plan' : '提交計劃失敗'));
    } finally {
      setLoading(false);
    }
  };

  const approvePlan = async () => {
    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/plan/${proposal.id}/approve`;
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve plan');
      }

      toast.success(language === 'en' ? 'Plan approved!' : '計劃已批准！');
      setShowApproveDialog(false);
      await loadPlan();
      await loadMilestones();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error approving plan:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to approve plan' : '批准計劃失敗'));
    } finally {
      setLoading(false);
    }
  };

  const requestRevision = async () => {
    if (!reviewData.feedback.trim()) {
      toast.error(language === 'en' ? 'Please provide feedback' : '請提供反饋意見');
      return;
    }

    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/plan/${proposal.id}/request-revision`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: reviewData.feedback,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request revision');
      }

      toast.success(language === 'en' ? 'Revision requested!' : '已要求修改！');
      setShowRevisionDialog(false);
      setReviewData({ feedback: '' });
      await loadPlan();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error requesting revision:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to request revision' : '要求修改失敗'));
    } finally {
      setLoading(false);
    }
  };

  const startMilestone = async (milestoneId: string) => {
    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${milestoneId}/start`;
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start milestone');
      }

      toast.success(language === 'en' ? 'Milestone started!' : '里程碑已開始！');
      await loadMilestones();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error starting milestone:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to start milestone' : '開始里程碑失敗'));
    } finally {
      setLoading(false);
    }
  };

  const submitMilestone = async () => {
    if (!currentMilestone) return;

    setLoading(true);
    try {
      const urls = submitData.deliverable_urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url);

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${currentMilestone.id}/submit`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submission_notes: submitData.submission_notes,
          deliverable_urls: urls,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit milestone');
      }

      toast.success(language === 'en' ? 'Milestone submitted!' : '里程碑已提交！');
      setShowSubmitDialog(false);
      setCurrentMilestone(null);
      setSubmitData({ submission_notes: '', deliverable_urls: '' });
      await loadMilestones();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error submitting milestone:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to submit milestone' : '提交里程碑失敗'));
    } finally {
      setLoading(false);
    }
  };

  const approveMilestone = async () => {
    if (!currentMilestone) return;

    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${currentMilestone.id}/approve`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: reviewData.feedback,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve milestone');
      }

      toast.success(language === 'en' ? '✅ Milestone approved! Please confirm payment to release funds.' : '✅ 里程碑已批准！請確認支付以釋放款項。');
      setShowApproveDialog(false);
      setCurrentMilestone(null);
      setReviewData({ feedback: '' });
      await loadMilestones();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error approving milestone:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to approve milestone' : '批准里程碑失敗'));
    } finally {
      setLoading(false);
    }
  };

  // 🔥 新增：確認支付函數
  const releasePayment = async (milestoneId: string) => {
    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${milestoneId}/release-payment`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        // 🔥 優先顯示詳細錯誤訊息
        const errorMessage = error.details || error.error || 'Failed to release payment';
        console.error('❌ [MilestoneManagement] Payment release error:', error);
        
        // 🔥 如果是餘額不足錯誤，提供充值選項
        if (errorMessage.includes('Insufficient wallet balance')) {
          const message = language === 'en'
            ? `${errorMessage}\n\nWould you like to go to the wallet page to add funds?`
            : `${errorMessage}\n\n是否前往錢包頁面充值？`;
          
          const confirmTopUp = window.confirm(message);
          
          if (confirmTopUp) {
            window.location.href = '#wallet';
          }
          return;
        }
        
        throw new Error(errorMessage);
      }

      toast.success(language === 'en' ? '💰 Payment released successfully!' : '💰 款項已成功釋放！');
      await loadMilestones();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error releasing payment:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to release payment' : '釋放款項失敗'));
    } finally {
      setLoading(false);
    }
  };

  const rejectMilestone = async () => {
    if (!currentMilestone || !reviewData.feedback.trim()) {
      toast.error(language === 'en' ? 'Please provide feedback' : '請提供反饋意見');
      return;
    }

    setLoading(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${currentMilestone.id}/reject`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: reviewData.feedback,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject milestone');
      }

      toast.success(language === 'en' ? 'Revision requested!' : '已要求修改！');
      setShowRejectDialog(false);
      setCurrentMilestone(null);
      setReviewData({ feedback: '' });
      await loadMilestones();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error rejecting milestone:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to reject milestone' : '拒絕里程碑失敗'));
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneStatusBadge = (milestone: Milestone) => {
    const { status, payment_status } = milestone;

    if (status === 'approved' && payment_status === 'released') {
      return (
        <Badge className="bg-green-600 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          {language === 'en' ? 'Paid' : '已支付'}
        </Badge>
      );
    }

    if (status === 'approved' && payment_status === 'failed') {
      return (
        <Badge className="bg-red-600 text-white">
          <XCircle className="h-3 w-3 mr-1" />
          {language === 'en' ? 'Payment Failed' : '支付失敗'}
        </Badge>
      );
    }

    // 🔥 新增：已批准待支付狀態
    if (status === 'approved' && payment_status === 'pending') {
      return (
        <Badge className="bg-amber-500 text-white">
          <DollarSign className="h-3 w-3 mr-1" />
          {language === 'en' ? 'Awaiting Payment' : '待支付'}
        </Badge>
      );
    }

    if (status === 'approved') {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCheck className="h-3 w-3 mr-1" />
          {language === 'en' ? 'Approved' : '已批准'}
        </Badge>
      );
    }

    if (status === 'submitted') {
      return (
        <Badge className="bg-blue-500 text-white">
          <Send className="h-3 w-3 mr-1" />
          {language === 'en' ? 'Submitted' : '已提交'}
        </Badge>
      );
    }

    if (status === 'in_progress') {
      return (
        <Badge className="bg-yellow-500 text-white">
          <Clock className="h-3 w-3 mr-1" />
          {language === 'en' ? 'In Progress' : '進行中'}
        </Badge>
      );
    }

    return (
      <Badge className="bg-gray-400 text-white">
        <AlertCircle className="h-3 w-3 mr-1" />
        {language === 'en' ? 'Pending' : '待開始'}
      </Badge>
    );
  };

  const getPlanStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-600 text-white">
            <CheckCircle className="h-4 w-4 mr-1" />
            {language === 'en' ? 'Approved' : '已批准'}
          </Badge>
        );
      case 'submitted':
      case 'resubmitted':
        return (
          <Badge className="bg-blue-500 text-white">
            <AlertCircle className="h-4 w-4 mr-1" />
            {language === 'en' ? 'Under Review' : '審核中'}
          </Badge>
        );
      case 'revision_requested':
        return (
          <Badge className="bg-orange-500 text-white">
            <MessageSquare className="h-4 w-4 mr-1" />
            {language === 'en' ? 'Revision Requested' : '需要修改'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-400 text-white">
            {language === 'en' ? 'Not Submitted' : '未提交'}
          </Badge>
        );
    }
  };

  const canEdit = plan?.status !== 'approved';
  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const isAmountValid = Math.abs(totalAmount - proposal.proposed_budget) < 0.01;

  return (
    <div className="space-y-4">
      {/* Plan Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {language === 'en' ? 'Milestone Plan' : '里程碑計劃'}
                {getPlanStatusBadge(plan?.status || 'not_submitted')}
              </CardTitle>
              <CardDescription>
                {language === 'en' 
                  ? `Budget: ${formatCurrency(proposal.proposed_budget, proposal.currency)} • Milestones Total: ${formatCurrency(totalAmount, proposal.currency)}`
                  : `預算：${formatCurrency(proposal.proposed_budget, proposal.currency)} • 里程碑總：${formatCurrency(totalAmount, proposal.currency)}`
                }
              </CardDescription>
            </div>
            {isFreelancer && canEdit && (
              <Button onClick={() => setShowCreateDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {language === 'en' ? 'Add Milestone' : '新增里程碑'}
              </Button>
            )}
          </div>

          {/* Amount Validation Warning */}
          {!isAmountValid && milestones.length > 0 && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">
                  {language === 'en' ? 'Amount Mismatch' : '金額不匹配'}
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  {language === 'en' 
                    ? `Milestone total must equal project budget. Difference: ${formatCurrency(Math.abs(totalAmount - proposal.proposed_budget), proposal.currency)}`
                    : `里程碑總額必須等於項目預算。差異：${formatCurrency(Math.abs(totalAmount - proposal.proposed_budget), proposal.currency)}`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Revision Request Feedback */}
          {plan?.status === 'revision_requested' && plan.feedback && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-900 mb-1">
                {language === 'en' ? '💬 Client Feedback:' : '💬 案主反饋：'}
              </p>
              <p className="text-sm text-yellow-800">{plan.feedback}</p>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Milestones List */}
      <div className="space-y-3">
        {milestones.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{language === 'en' ? 'No milestones yet' : '暫無里程碑'}</p>
              {isFreelancer && (
                <p className="text-sm mt-1">
                  {language === 'en' ? 'Create milestones to structure your work' : '創建里程碑來規劃您的工作'}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          milestones.map((milestone, index) => (
            <Card key={milestone.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        #{index + 1}
                      </span>
                      <h4 className="font-semibold">{milestone.title}</h4>
                      {getMilestoneStatusBadge(milestone)}
                    </div>
                    
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">{formatCurrency(milestone.amount, milestone.currency)}</span>
                      </div>
                      {milestone.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(milestone.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Submission Info */}
                    {milestone.submission_notes && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          {language === 'en' ? '📝 Submission Notes:' : '📝 提交說明：'}
                        </p>
                        <p className="text-sm text-blue-800">{milestone.submission_notes}</p>
                        {milestone.deliverable_urls && milestone.deliverable_urls.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-blue-900 mb-1">
                              {language === 'en' ? 'Deliverables:' : '交付物：'}
                            </p>
                            {milestone.deliverable_urls.map((url, i) => (
                              <a 
                                key={i} 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline block"
                              >
                                {url}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Approval/Rejection Feedback */}
                    {milestone.approval_feedback && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-900 mb-1">
                          {language === 'en' ? '✅ Client Feedback:' : '✅ 案主反饋：'}
                        </p>
                        <p className="text-sm text-green-800">{milestone.approval_feedback}</p>
                      </div>
                    )}

                    {milestone.rejection_feedback && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm font-medium text-orange-900 mb-1">
                          {language === 'en' ? '💬 Revision Request:' : '💬 修改要求：'}
                        </p>
                        <p className="text-sm text-orange-800">{milestone.rejection_feedback}</p>
                      </div>
                    )}

                    {/* Payment Status */}
                    {milestone.payment_status === 'released' && milestone.payment_released_at && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-900">
                          💰 {language === 'en' ? 'Payment Released' : '款項已釋放'}
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          {new Date(milestone.payment_released_at).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {milestone.payment_status === 'failed' && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-900">
                          ❌ {language === 'en' ? 'Payment Failed' : '支付失敗'}
                        </p>
                        {milestone.payment_error && (
                          <p className="text-xs text-red-700 mt-1">{milestone.payment_error}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {/* Freelancer Actions */}
                    {isFreelancer && (
                      <>
                        {milestone.status === 'pending' && plan?.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => startMilestone(milestone.id)}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            {language === 'en' ? 'Start Work' : '開始工作'}
                          </Button>
                        )}
                        
                        {milestone.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setCurrentMilestone(milestone);
                              setShowSubmitDialog(true);
                            }}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            {language === 'en' ? 'Submit Work' : '提交成果'}
                          </Button>
                        )}

                        {/* 🔥 Debug: 顯示當前狀態 */}
                        <div className="text-xs text-gray-500 ml-2 flex items-center">
                          [接案者視圖] plan={plan?.status}
                        </div>
                        
                        {plan?.status !== 'approved' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCurrentMilestone(milestone);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              {language === 'en' ? 'Edit' : '編輯'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfirm(milestone.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {language === 'en' ? 'Delete' : '刪除'}
                            </Button>
                          </>
                        )}
                      </>
                    )}

                    {/* Client Actions */}
                    {!isFreelancer && (
                      <>
                        {/* 🔥 Debug: 顯示當前狀態 */}
                        <div className="text-xs text-gray-500 mr-2 flex items-center">
                          [案主視圖] status={milestone.status}, plan={plan?.status}, payment={milestone.payment_status}
                        </div>

                        {/* 🔥 案主可以在待开始状态就确认支付（预付到托管） */}
                        {milestone.status === 'pending' && plan?.status === 'approved' && milestone.payment_status !== 'released' && (
                          <Button
                            size="sm"
                            onClick={() => releasePayment(milestone.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            💰 {language === 'en' ? 'Confirm Payment' : '確認支付'}
                          </Button>
                        )}

                        {milestone.status === 'submitted' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setCurrentMilestone(milestone);
                                setShowApproveDialog(true);
                              }}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {language === 'en' ? 'Approve' : '批准'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCurrentMilestone(milestone);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {language === 'en' ? 'Request Changes' : '要求修改'}
                            </Button>
                          </>
                        )}
                        
                        {/* 🔥 已批准但未支付的里程碑也可以確認支付 */}
                        {milestone.status === 'approved' && milestone.payment_status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => releasePayment(milestone.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            💰 {language === 'en' ? 'Confirm Payment' : '確認支付'}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Plan Actions */}
      {milestones.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            {isFreelancer && (
              <>
                {(plan?.status === 'not_submitted' || plan?.status === 'revision_requested') && (
                  <Button
                    onClick={submitPlanForReview}
                    disabled={loading || !isAmountValid}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    {language === 'en' ? 'Submit Plan for Review' : '提交計劃審核'}
                  </Button>
                )}
              </>
            )}

            {!isFreelancer && (
              <>
                {(plan?.status === 'submitted' || plan?.status === 'resubmitted') && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowApproveDialog(true)}
                      disabled={loading || !isAmountValid}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {language === 'en' ? 'Approve Plan' : '批准計劃'}
                    </Button>
                    <Button
                      onClick={() => setShowRevisionDialog(true)}
                      variant="outline"
                      className="flex-1"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {language === 'en' ? 'Request Revision' : '要求修改'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Milestone Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Create Milestone' : '創建里程碑'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'en' ? 'Title' : '標題'} *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={language === 'en' ? 'e.g., Initial Design' : '例如：初步設計'}
              />
            </div>
            <div>
              <Label>{language === 'en' ? 'Description' : '描述'}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{language === 'en' ? 'Amount' : '金額'} * ({proposal.currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Due Date' : '截止日期'}</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button onClick={createMilestone} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'en' ? 'Create' : '創建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Milestone Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Edit Milestone' : '編輯里碑'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'en' ? 'Title' : '標題'} *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label>{language === 'en' ? 'Description' : '描述'}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{language === 'en' ? 'Amount' : '金額'} * ({proposal.currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Due Date' : '截止日期'}</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button onClick={updateMilestone} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'en' ? 'Update' : '新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Milestone Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Submit Milestone' : '提交里程碑'}</DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Provide details about your completed work'
                : '提供關於已完成工作的詳細信息'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'en' ? 'Notes' : '說明'}</Label>
              <Textarea
                value={submitData.submission_notes}
                onChange={(e) => setSubmitData({ ...submitData, submission_notes: e.target.value })}
                rows={4}
                placeholder={language === 'en' ? 'Describe what you\'ve completed...' : '描述您已完成的工作...'}
              />
            </div>
            <div>
              <Label>{language === 'en' ? 'Deliverable URLs (one per line)' : '交付物連結（每行一個）'}</Label>
              <Textarea
                value={submitData.deliverable_urls}
                onChange={(e) => setSubmitData({ ...submitData, deliverable_urls: e.target.value })}
                rows={3}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button onClick={submitMilestone} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'en' ? 'Submit' : '提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Plan Dialog */}
      <Dialog open={showApproveDialog && !currentMilestone} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Approve Milestone Plan' : '批准里程碑計劃'}</DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Once approved, the plan will be locked and work can begin.'
                : '批准後，計劃將被鎖定，工作可以開始。'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {language === 'en' ? 'Plan Summary:' : '計劃摘要：'}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                {language === 'en' 
                  ? `${milestones.length} milestones • Total: ${formatCurrency(totalAmount, proposal.currency)}`
                  : `${milestones.length} 個里程碑 • 總計：${formatCurrency(totalAmount, proposal.currency)}`
                }
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button onClick={approvePlan} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'en' ? 'Approve' : '批准'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Milestone Dialog */}
      <Dialog open={showApproveDialog && !!currentMilestone} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Approve Milestone' : '批准里程碑'}</DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? `Payment of ${formatCurrency(currentMilestone?.amount || 0, proposal.currency)} will be automatically released to the freelancer.`
                : `將自動釋放 ${formatCurrency(currentMilestone?.amount || 0, proposal.currency)} 給接案者。`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'en' ? 'Feedback (Optional)' : '反饋（可選）'}</Label>
              <Textarea
                value={reviewData.feedback}
                onChange={(e) => setReviewData({ feedback: e.target.value })}
                rows={3}
                placeholder={language === 'en' ? 'Great work!' : '做得很好！'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button onClick={approveMilestone} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              💰 {language === 'en' ? 'Approve & Pay' : '批准支付'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Milestone Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Request Changes' : '要求修改'}</DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Provide specific feedback on what needs to be improved.'
                : '提供具體的改進建議。'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'en' ? 'Feedback' : '反饋'} *</Label>
              <Textarea
                value={reviewData.feedback}
                onChange={(e) => setReviewData({ feedback: e.target.value })}
                rows={4}
                placeholder={language === 'en' ? 'Please revise...' : '請修改...'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button onClick={rejectMilestone} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'en' ? 'Send Feedback' : '發送反饋'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Request Plan Revision' : '要求修改計劃'}</DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Provide feedback on what should be changed in the milestone plan.'
                : '提供關於里程碑計劃需要修改的反饋。'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'en' ? 'Feedback' : '反饋'} *</Label>
              <Textarea
                value={reviewData.feedback}
                onChange={(e) => setReviewData({ feedback: e.target.value })}
                rows={4}
                placeholder={language === 'en' ? 'Please adjust the milestones...' : '請調整里程碑...'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button onClick={requestRevision} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'en' ? 'Request Revision' : '要求修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Delete Milestone?' : '刪除里程碑？'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? 'This action cannot be undone.'
                : '此操作無法撤銷。'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'en' ? 'Cancel' : '取消'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && deleteMilestone(deleteConfirm)}>
              {language === 'en' ? 'Delete' : '刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}