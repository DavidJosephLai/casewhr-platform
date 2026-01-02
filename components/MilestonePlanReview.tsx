import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  MessageSquare,
  FileCheck,
  Clock
} from "lucide-react";
import { formatCurrency } from "../lib/currency";
import { StartMessageDialog } from "./StartMessageDialog";

interface Milestone {
  id: string;
  proposal_id: string;
  title: string;
  description: string;
  amount: number;
  currency?: string;
  duration_days: number; // 🔥 修改：後端使用 duration_days，不是 deadline_days
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  order_index?: number;
  due_date?: string;
  // ✅ 添加修改请求相关字段
  needs_revision?: boolean;
  revision_feedback?: string;
}

interface MilestonePlan {
  status: 'not_submitted' | 'submitted' | 'revision_requested' | 'approved';
  submitted_at?: string;
  reviewed_at?: string;
  feedback?: string;
  milestones: Milestone[];
  total_amount: number;
}

interface MilestonePlanReviewProps {
  proposalId: string;
  projectTitle: string;
  freelancerName: string;
  freelancerId: string; // 🔥 新增：接案者ID用于发送消息
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanApproved?: () => void;
  onRevisionRequested?: () => void; // 🔥 添加回調
}

export function MilestonePlanReview({
  proposalId,
  projectTitle,
  freelancerName,
  freelancerId,
  open,
  onOpenChange,
  onPlanApproved,
  onRevisionRequested,
}: MilestonePlanReviewProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [plan, setPlan] = useState<MilestonePlan | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  // ✅ 新增：追踪每个里程碑的修改请求
  const [milestoneRevisions, setMilestoneRevisions] = useState<Record<string, { needsRevision: boolean; feedback: string }>>({});
  // 🔥 新增：消息对话框状态
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  useEffect(() => {
    if (open && proposalId) {
      loadMilestonePlan();
    }
  }, [open, proposalId]);

  const loadMilestonePlan = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      console.log('📋 [MilestonePlanReview] Loading milestone plan for proposal:', proposalId);

      const isDevMode = accessToken.startsWith('dev-user-');
      let token = accessToken;
      if (isDevMode && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }

      const headers: Record<string, string> = isDevMode
        ? {
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        : { 'Authorization': `Bearer ${token}` };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/plan/${proposalId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error('Failed to load milestone plan');
      }

      const data = await response.json();
      console.log('✅ [MilestonePlanReview] Loaded plan:', data);
      console.log('🔍 [MilestonePlanReview] Milestones data:', JSON.stringify(data.plan?.milestones, null, 2));
      setPlan(data.plan);
    } catch (error) {
      console.error('❌ [MilestonePlanReview] Error:', error);
      toast.error(
        language === 'en'
          ? 'Failed to load milestone plan'
          : '載入里程碑計劃失敗'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!accessToken || !plan) return;

    setActionLoading(true);
    try {
      const isDevMode = accessToken.startsWith('dev-user-');
      let token = accessToken;
      if (isDevMode && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }

      const headers: Record<string, string> = isDevMode
        ? {
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          }
        : {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/plan/${proposalId}/approve`,
        {
          method: 'POST',
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // 🔥 處理錢包餘額不足的特殊錯誤
        if (data.error === 'insufficient_balance') {
          const userMessage = data.user_message?.[language] || data.user_message?.['zh-TW'] || data.message;
          
          toast.error(
            <div className="space-y-2">
              <div className="font-semibold">
                {language === 'en' ? '💰 Insufficient Wallet Balance' : '💰 錢包餘額不足'}
              </div>
              <div className="text-sm">{userMessage}</div>
              <div className="text-xs mt-2 bg-white/20 p-2 rounded">
                {language === 'en' 
                  ? `Required: ${formatCurrency(data.required_amount, data.currency, language)}`
                  : `需要金額：${formatCurrency(data.required_amount, data.currency, language)}`
                }
                <br />
                {language === 'en'
                  ? `Available: ${formatCurrency(data.available_balance, data.currency, language)}`
                  : `可用餘額：${formatCurrency(data.available_balance, data.currency, language)}`
                }
                <br />
                {language === 'en'
                  ? `Shortfall: ${formatCurrency(data.shortfall_amount, data.currency, language)}`
                  : `差額：${formatCurrency(data.shortfall_amount, data.currency, language)}`
                }
              </div>
            </div>,
            { duration: 8000 }
          );
          
          // 提示用戶前往錢包頁面充值
          setTimeout(() => {
            toast.info(
              <div className="flex flex-col gap-2">
                <span>
                  {language === 'en' 
                    ? '💳 Please go to your Wallet to deposit funds.' 
                    : '💳 請前往錢包頁面進行充值。'}
                </span>
                <a 
                  href="#wallet" 
                  className="text-blue-600 hover:underline font-semibold"
                  onClick={(e) => {
                    e.preventDefault();
                    // 觸發視圖切換到錢包
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'wallet' } }));
                    onOpenChange(false);
                  }}
                >
                  {language === 'en' ? '→ Go to Wallet' : '→ 前往錢包'}
                </a>
              </div>,
              { duration: 6000 }
            );
          }, 1000);
          
          return;
        }
        
        throw new Error(data.message || 'Failed to approve plan');
      }

      // 🔥 成功批准並創建託管
      toast.success(
        <div className="space-y-1">
          <div className="font-semibold">
            {language === 'en'
              ? '✅ Milestone Plan Approved!'
              : '✅ 里程碑計劃已批准！'}
          </div>
          <div className="text-sm">
            {language === 'en'
              ? `🔒 ${formatCurrency(data.escrow.amount, data.escrow.currency, language)} has been locked in escrow.`
              : `🔒 已將 ${formatCurrency(data.escrow.amount, data.escrow.currency, language)} 鎖定於託管。`}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {language === 'en'
              ? `Available balance: ${formatCurrency(data.wallet.available_balance, data.escrow.currency, language)}`
              : `可用餘額：${formatCurrency(data.wallet.available_balance, data.escrow.currency, language)}`}
          </div>
        </div>,
        { duration: 5000 }
      );

      if (onPlanApproved) {
        onPlanApproved();
      }

      onOpenChange(false);
    } catch (error) {
      console.error('❌ [MilestonePlanReview] Error approving:', error);
      toast.error(
        language === 'en'
          ? 'Failed to approve plan'
          : '批准計劃失敗'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    // ✅ 检查是否至少勾选了一个里程碑或提供了总体反馈
    const hasSelectedMilestones = Object.values(milestoneRevisions).some(rev => rev.needsRevision);
    
    if (!hasSelectedMilestones && !feedback.trim()) {
      toast.error(
        language === 'en'
          ? 'Please select milestones to revise or provide overall feedback'
          : '請勾選需要修改的里程碑或提供總體反饋'
      );
      return;
    }

    setActionLoading(true);
    try {
      const isDevMode = accessToken.startsWith('dev-user-');
      let token = accessToken;
      if (isDevMode && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }

      const headers: Record<string, string> = isDevMode
        ? {
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          }
        : {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          };

      // ✅ 构建详细的反馈信息
      let detailedFeedback = feedback.trim();
      
      // 添加每个里程碑的具体反馈
      const milestoneFeedbacks = Object.entries(milestoneRevisions)
        .filter(([_, rev]) => rev.needsRevision)
        .map(([milestoneId, rev]) => {
          const milestone = plan?.milestones.find(m => m.id === milestoneId);
          if (!milestone) return null;
          
          const index = plan!.milestones.indexOf(milestone);
          return `\n\n📌 ${language === 'en' ? 'Milestone' : '里程碑'} ${index + 1}: ${milestone.title}\n${rev.feedback || (language === 'en' ? '(Needs revision)' : '(需要修改)')}`;
        })
        .filter(Boolean)
        .join('');
      
      if (milestoneFeedbacks) {
        if (detailedFeedback) {
          detailedFeedback += '\n\n---' + (language === 'en' ? '\n\n## Specific Milestone Feedback:' : '\n\n## 具體里程碑反饋：') + milestoneFeedbacks;
        } else {
          detailedFeedback = (language === 'en' ? '## Specific Milestone Feedback:' : '## 具體里程碑反饋：') + milestoneFeedbacks;
        }
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/plan/${proposalId}/request-revision`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            feedback: detailedFeedback,
            milestone_revisions: milestoneRevisions // ✅ 同时发送结构化的数据
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to request revision');
      }

      toast.success(
        language === 'en'
          ? '✅ Revision requested. The freelancer will update the plan.'
          : '✅ 已要求修改。接案者將更新計劃。'
      );

      setFeedback("");
      setMilestoneRevisions({});
      setShowFeedbackDialog(false);
      
      // 🔥 重新加載數據以更新狀態
      await loadMilestonePlan();
      
      onOpenChange(false);
      
      // 🔥 呼叫回調
      if (onRevisionRequested) {
        onRevisionRequested();
      }
    } catch (error) {
      console.error('❌ [MilestonePlanReview] Error requesting revision:', error);
      toast.error(
        language === 'en'
          ? 'Failed to request revision'
          : '要求修改失敗'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const t = {
    en: {
      title: 'Review Milestone Plan',
      subtitle: 'Review and approve the proposed milestone plan',
      project: 'Project',
      freelancer: 'Freelancer',
      status: {
        not_submitted: 'Not Submitted',
        submitted: 'Awaiting Your Review',
        revision_requested: 'Revision Requested',
        approved: 'Approved & Locked',
      },
      totalBudget: 'Total Budget',
      submittedOn: 'Submitted on',
      reviewedOn: 'Reviewed on',
      feedback: 'Your Feedback',
      milestoneTitle: 'Milestone',
      description: 'Description',
      amount: 'Amount',
      deadline: 'Duration',
      days: 'days',
      noMilestones: 'No milestones submitted yet',
      noMilestonesDesc: 'The freelancer hasn\'t submitted a milestone plan for review.',
      approve: 'Approve Plan',
      requestRevision: 'Request Revision',
      provideFeedback: 'Provide Feedback',
      feedbackPlaceholder: 'Please provide specific feedback on what needs to be changed...',
      cancel: 'Cancel',
      submit: 'Submit Feedback',
      approveConfirm: 'Are you sure you want to approve this milestone plan?',
      approveWarning: 'Once approved, milestones will be locked and the project will begin.',
      contactFreelancer: 'Discuss via Message',
      revisionFeedback: 'Revision Feedback',
      // ✅ 新增翻译
      selectMilestones: 'Select milestones that need revision:',
      milestoneSpecificFeedback: 'Specific feedback for this milestone (optional):',
      overallFeedback: 'Overall feedback (optional):',
      overallFeedbackPlaceholder: 'Provide general feedback about the plan...',
    },
    zh: {
      title: '審核里程碑計劃',
      subtitle: '審核並批准接案者提出的里程碑計劃',
      project: '項目',
      freelancer: '接案者',
      status: {
        not_submitted: '尚未提交',
        submitted: '等待您審核',
        revision_requested: '已要求修改',
        approved: '已批准並鎖定',
      },
      totalBudget: '總預算',
      submittedOn: '提交於',
      reviewedOn: '審核於',
      feedback: '您的反饋',
      milestoneTitle: '里程碑',
      description: '描述',
      amount: '金額',
      deadline: '時長',
      days: '天',
      noMilestones: '尚未提交里程碑',
      noMilestonesDesc: '接案者尚未提交里程碑計劃供您審核。',
      approve: '批准計劃',
      requestRevision: '要求修改',
      provideFeedback: '提供反饋意見',
      feedbackPlaceholder: '請提供具體的修改建議...',
      cancel: '取消',
      submit: '提交反饋',
      approveConfirm: '確定要批准此里程碑計劃嗎？',
      approveWarning: '批准後，里程碑將被鎖定，項目將開始執行。',
      contactFreelancer: '通過消息討論',
      revisionFeedback: '修改意見',
      // ✅ 新增翻译
      selectMilestones: '勾選需要修改的里程碑：',
      milestoneSpecificFeedback: '針對此里程碑的具體意見（可選）：',
      overallFeedback: '總體反饋（可選）：',
      overallFeedbackPlaceholder: '提供關於整體計劃的反饋...',
    },
  };

  const text = language === 'en' ? t.en : t.zh;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-yellow-100 text-yellow-800">{text.status.submitted}</Badge>;
      case 'revision_requested':
        return <Badge className="bg-orange-100 text-orange-800">{text.status.revision_requested}</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">{text.status.approved}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{text.status.not_submitted}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] lg:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{text.title}</DialogTitle>
            <DialogDescription>{text.subtitle}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Project Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{text.project}</p>
                    <p className="font-medium">{projectTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{text.freelancer}</p>
                    <p className="font-medium">{freelancerName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : !plan || plan.milestones.length === 0 ? (
              <div className="text-center py-12">
                <FileCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{text.noMilestones}</h3>
                <p className="text-gray-500">{text.noMilestonesDesc}</p>
              </div>
            ) : (
              <>
                {/* Status & Summary */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{text.totalBudget}</CardTitle>
                      {getStatusBadge(plan.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {formatCurrency(
                            plan.total_amount,
                            plan.milestones[0]?.currency || 'TWD'
                          )}
                        </span>
                        <span className="text-sm text-gray-500">
                          {plan.milestones.length} {language === 'en' ? 'milestones' : '個里程碑'}
                        </span>
                      </div>

                      {plan.submitted_at && (
                        <div className="text-sm text-gray-500">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          {text.submittedOn} {formatDate(plan.submitted_at)}
                        </div>
                      )}

                      {plan.reviewed_at && (
                        <div className="text-sm text-gray-500">
                          <CheckCircle className="inline h-4 w-4 mr-1" />
                          {text.reviewedOn} {formatDate(plan.reviewed_at)}
                        </div>
                      )}

                      {plan.feedback && plan.status === 'revision_requested' && (
                        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                          <p className="text-sm font-medium text-orange-900 mb-1">
                            {text.revisionFeedback}
                          </p>
                          <p className="text-sm text-orange-700">{plan.feedback}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Milestone List */}
                <div className="space-y-3">
                  <h3 className="font-medium">
                    {language === 'en' ? 'Proposed Milestones' : '提議的里程碑'}
                  </h3>
                  {plan.milestones.map((milestone, index) => {
                    // 🔥 如果沒有 deadline_days，嘗試從 due_date 計算
                    let deadlineDays = milestone.duration_days;
                    if (!deadlineDays && milestone.due_date) {
                      const now = new Date();
                      const dueDate = new Date(milestone.due_date);
                      const diffTime = Math.abs(dueDate.getTime() - now.getTime());
                      deadlineDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }
                    
                    console.log('🔍 [MilestonePlanReview] Milestone:', {
                      title: milestone.title,
                      deadline_days: milestone.duration_days,
                      due_date: milestone.due_date,
                      calculated_days: deadlineDays
                    });
                    
                    return (
                      <Card key={milestone.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">
                                {index + 1}. {milestone.title}
                              </CardTitle>
                              <p className="text-sm text-gray-600 mt-1">
                                {milestone.description}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="text-sm text-gray-500">{text.amount}</p>
                                <p className="font-medium">
                                  {formatCurrency(milestone.amount, milestone.currency || 'TWD')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="text-sm text-gray-500">{text.deadline}</p>
                                <p className="font-medium">
                                  {deadlineDays ? `${deadlineDays} ${text.days}` : (milestone.due_date || '—')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                {(plan.status === 'submitted' || !plan.status || plan.status === 'not_submitted') && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <Button
                      onClick={handleApprovePlan}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {language === 'en' ? 'Approving...' : '批准中...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {text.approve}
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setShowFeedbackDialog(true)}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {text.requestRevision}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setShowMessageDialog(true)}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {text.contactFreelancer}
                    </Button>
                  </div>
                )}

                {plan.status === 'approved' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-medium text-green-900">
                        {language === 'en'
                          ? '✅ This milestone plan has been approved and locked.'
                          : '✅ 此里程碑計劃已批准並鎖定。'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{text.provideFeedback}</DialogTitle>
            <DialogDescription>
              {language === 'en'
                ? 'Select specific milestones that need revision and provide feedback.'
                : '勾選需要修改的里程碑並提供反饋意見。'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* ✅ 里程碑勾选清单 */}
            <div className="space-y-3">
              <label className="text-sm font-medium">{text.selectMilestones}</label>
              {plan?.milestones.map((milestone, index) => {
                const isSelected = milestoneRevisions[milestone.id]?.needsRevision || false;
                
                return (
                  <Card key={milestone.id} className={isSelected ? 'border-orange-300 bg-orange-50' : ''}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* 里程碑勾选框 */}
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id={`milestone-${milestone.id}`}
                            checked={isSelected}
                            onChange={(e) => {
                              setMilestoneRevisions(prev => ({
                                ...prev,
                                [milestone.id]: {
                                  needsRevision: e.target.checked,
                                  feedback: prev[milestone.id]?.feedback || ''
                                }
                              }));
                            }}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <label htmlFor={`milestone-${milestone.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium">
                                  {index + 1}. {milestone.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500 ml-4">
                                <span>{formatCurrency(milestone.amount, milestone.currency || 'TWD')}</span>
                                <span>{milestone.duration_days} {text.days}</span>
                              </div>
                            </div>
                          </label>
                        </div>
                        
                        {/* 如果勾选了，显示反馈输入框 */}
                        {isSelected && (
                          <div className="ml-7 space-y-2">
                            <label className="text-xs text-gray-600">{text.milestoneSpecificFeedback}</label>
                            <Textarea
                              value={milestoneRevisions[milestone.id]?.feedback || ''}
                              onChange={(e) => {
                                setMilestoneRevisions(prev => ({
                                  ...prev,
                                  [milestone.id]: {
                                    needsRevision: true,
                                    feedback: e.target.value
                                  }
                                }));
                              }}
                              placeholder={language === 'en' 
                                ? 'e.g., Please adjust the budget to $500 or extend the timeline to 10 days...'
                                : '例如：請調整預算至 $500 或延長時程至 10 天...'}
                              rows={2}
                              className="resize-none text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* ✅ 总体反馈 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{text.overallFeedback}</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={text.overallFeedbackPlaceholder}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* 按钮 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFeedbackDialog(false);
                  setFeedback("");
                  setMilestoneRevisions({});
                }}
                disabled={actionLoading}
                className="flex-1"
              >
                {text.cancel}
              </Button>
              <Button
                onClick={handleRequestRevision}
                disabled={actionLoading || (Object.values(milestoneRevisions).every(rev => !rev.needsRevision) && !feedback.trim())}
                className="flex-1"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'en' ? 'Submitting...' : '提交中...'}
                  </>
                ) : (
                  text.submit
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🔥 Message Dialog */}
      <StartMessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        recipientId={freelancerId}
        recipientName={freelancerName}
        projectId={proposalId}
        onSuccess={() => {
          toast.success(
            language === 'en'
              ? 'Message sent successfully!'
              : '消息發送成功！'
          );
        }}
      />
    </>
  );
}