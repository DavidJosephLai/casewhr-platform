import { useState, useEffect } from "react";
import { formatCurrencyAuto, type Currency } from "../lib/currency";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner";
import { useLanguage } from "../lib/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Target,
  Circle,
  Clock,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  XCircle,
  Loader2
} from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  duration_days: number;
  deliverables: string[];
  order: number;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  started_at?: string;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  submission_notes?: string;
  deliverable_urls?: string[];
  approval_feedback?: string;
  rejection_feedback?: string;
  escrow_id?: string;
  proposal_id: string;
  project_id: string;
  freelancer_id: string;
  client_id: string;
}

interface ClientMilestoneManagerProps {
  projectId: string;
  proposalId?: string;
  currency?: Currency;
  accessToken: string;
  onUpdate?: () => void;
}

export function ClientMilestoneManager({
  projectId: projId,
  proposalId,
  currency = 'TWD',
  accessToken,
  onUpdate
}: ClientMilestoneManagerProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [hasMilestones, setHasMilestones] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState("");
  const [rejectionFeedback, setRejectionFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const translations = {
    en: {
      title: "Milestone Management",
      subtitle: "Review and approve project milestones",
      overallProgress: "Overall Progress",
      completed: "Completed",
      totalValue: "Total Value",
      released: "Released",
      pending: "Waiting to Start",
      inProgress: "In Progress",
      submitted: "Awaiting Your Review",
      approved: "Approved",
      rejected: "Changes Requested",
      amount: "Amount",
      duration: "Duration",
      days: "days",
      deliverables: "Deliverables",
      submissionNotes: "Freelancer's Notes",
      deliverableFiles: "Submitted Files",
      viewSubmission: "View Submission",
      approve: "Approve & Release Payment",
      reject: "Request Changes",
      approveTitle: "Approve Milestone",
      approveDescription: "You're about to approve this milestone and release the payment. This action cannot be undone.",
      approvalFeedback: "Optional Feedback",
      approvalFeedbackPlaceholder: "Great work! Everything looks perfect...",
      rejectTitle: "Request Changes",
      rejectDescription: "Please provide detailed feedback on what needs to be improved.",
      rejectionFeedback: "Required: What needs to be changed?",
      rejectionFeedbackPlaceholder: "Please revise the color scheme to match our brand guidelines...",
      cancel: "Cancel",
      confirmApprove: "Approve & Pay",
      confirmReject: "Request Changes",
      escrowStatus: "Payment Status",
      locked: "Locked in Escrow",
      releasedStatus: "Payment Released",
      notCreated: "Not Created",
      noMilestones: "No Milestones",
      noMilestonesDescription: "This project does not use milestone-based payments.",
      started: "Started",
      submitted: "Submitted",
      approvedAt: "Approved",
      rejectedAt: "Changes Requested",
      awaitingWork: "Waiting for freelancer to start",
      awaitingSubmission: "Freelancer is working on this",
    },
    'zh-TW': {
      title: "里程碑管理",
      subtitle: "審核並批准項目里程碑",
      overallProgress: "整體進度",
      completed: "已完成",
      totalValue: "總金額",
      released: "已釋放",
      pending: "等待開始",
      inProgress: "進行中",
      submitted: "等待您審核",
      approved: "已批准",
      rejected: "需要修改",
      amount: "金額",
      duration: "工期",
      days: "天",
      deliverables: "交付物",
      submissionNotes: "接案者說明",
      deliverableFiles: "提交的文件",
      viewSubmission: "查看提交",
      approve: "批准並釋放款項",
      reject: "要求修改",
      approveTitle: "批准里程碑",
      approveDescription: "您即將批准此里程碑並釋放款項。此操作無法撤銷。",
      approvalFeedback: "可選反饋",
      approvalFeedbackPlaceholder: "做得很好！一切都很完美...",
      rejectTitle: "要求修改",
      rejectDescription: "請提供詳細的反饋，說明需要改進的地方。",
      rejectionFeedback: "必填：需要修改什麼���",
      rejectionFeedbackPlaceholder: "請修改配色方案以符合我們的品牌準則...",
      cancel: "取消",
      confirmApprove: "批准並付款",
      confirmReject: "要求修改",
      escrowStatus: "付款狀態",
      locked: "托管中",
      releasedStatus: "已釋放",
      notCreated: "未創建",
      noMilestones: "無里程碑",
      noMilestonesDescription: "此項目不使用里程碑付款。",
      started: "開始時間",
      submitted: "交時間",
      approvedAt: "批准時間",
      rejectedAt: "要求修改時間",
      awaitingWork: "等待接案者開始工作",
      awaitingSubmission: "接案者正在進行此工作",
    },
    'zh-CN': {
      title: "里程碑管理",
      subtitle: "审核并批准项目里程碑",
      overallProgress: "整体进度",
      completed: "已完成",
      totalValue: "总金额",
      released: "已释放",
      pending: "等待开始",
      inProgress: "进行中",
      submitted: "等待您审核",
      approved: "已批准",
      rejected: "需要修改",
      amount: "金额",
      duration: "工期",
      days: "天",
      deliverables: "交付物",
      submissionNotes: "接案者说明",
      deliverableFiles: "提交的文件",
      viewSubmission: "查看提交",
      approve: "批���并释放款项",
      reject: "要求修改",
      approveTitle: "批准里程碑",
      approveDescription: "您即将批准此里程碑并释放款项。此操作无法撤销。",
      approvalFeedback: "可选反馈",
      approvalFeedbackPlaceholder: "做得很好！一切都很完美...",
      rejectTitle: "要求修改",
      rejectDescription: "请提供详细的反馈，说明需要改进的地方。",
      rejectionFeedback: "必填：需要修改什么？",
      rejectionFeedbackPlaceholder: "请修改配色方案以符合我们的品牌准则...",
      cancel: "取消",
      confirmApprove: "批准并付款",
      confirmReject: "要求修改",
      escrowStatus: "付款状态",
      locked: "托管中",
      releasedStatus: "已释放",
      notCreated: "未创建",
      noMilestones: "无里程碑",
      noMilestonesDescription: "此项目不使用里程碑付款。",
      started: "开始时间",
      submitted: "提交时间",
      approvedAt: "��准时间",
      rejectedAt: "要求修改时间",
      awaitingWork: "等待接案者开始工作",
      awaitingSubmission: "接案者正在进行此工作",
    }
  };

  const t = translations[language as keyof typeof translations] || translations['zh-TW'];

  useEffect(() => {
    if (proposalId) {
      fetchMilestones();
    } else {
      fetchProjectStats();
    }
  }, [proposalId, projId]);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/proposal/${proposalId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
        setHasMilestones(data.milestones && data.milestones.length > 0);
      } else {
        console.error('Failed to fetch milestones:', await response.text());
        setHasMilestones(false);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      setHasMilestones(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/project/${projId}/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHasMilestones(data.hasMilestones);
        if (data.hasMilestones) {
          setMilestones(data.milestones || []);
        }
      } else {
        setHasMilestones(false);
      }
    } catch (error) {
      console.error('Error fetching project stats:', error);
      setHasMilestones(false);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedMilestone) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${selectedMilestone.id}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback: approvalFeedback,
          }),
        }
      );

      if (response.ok) {
        toast.success(
          language === 'en'
            ? '✅ Milestone approved! Payment released to freelancer.'
            : '✅ 里程碑已批准！款項已釋放給接案者。'
        );
        setShowApproveDialog(false);
        setApprovalFeedback("");
        setSelectedMilestone(null);
        
        // Refresh milestones
        if (proposalId) {
          await fetchMilestones();
        } else {
          await fetchProjectStats();
        }
        
        if (onUpdate) onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to approve milestone');
      }
    } catch (error) {
      console.error('Error approving milestone:', error);
      toast.error(language === 'en' ? 'Failed to approve milestone' : '批准里程碑失敗');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedMilestone) return;

    if (!rejectionFeedback.trim()) {
      toast.error(
        language === 'en'
          ? 'Please provide feedback on what needs to be changed'
          : '請提供需要修改的反饋'
      );
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${selectedMilestone.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback: rejectionFeedback,
          }),
        }
      );

      if (response.ok) {
        toast.success(
          language === 'en'
            ? '📝 Changes requested. Freelancer has been notified.'
            : '📝 已要求修改。接案者已收到通知。'
        );
        setShowRejectDialog(false);
        setRejectionFeedback("");
        setSelectedMilestone(null);
        
        // Refresh milestones
        if (proposalId) {
          await fetchMilestones();
        } else {
          await fetchProjectStats();
        }
        
        if (onUpdate) onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to request changes');
      }
    } catch (error) {
      console.error('Error rejecting milestone:', error);
      toast.error(language === 'en' ? 'Failed to request changes' : '要求修改失敗');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusConfig = (status: Milestone['status']) => {
    const configs = {
      pending: {
        icon: Circle,
        color: 'text-gray-400',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        label: t.pending,
      },
      in_progress: {
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: t.inProgress,
      },
      submitted: {
        icon: Upload,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        label: t.submitted,
      },
      approved: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: t.approved,
      },
      rejected: {
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: t.rejected,
      },
    };
    return configs[status];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasMilestones) {
    return (
      <Card className="p-8 text-center">
        <Target className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <h3 className="font-semibold mb-2">{t.noMilestones}</h3>
        <p className="text-sm text-muted-foreground">{t.noMilestonesDescription}</p>
      </Card>
    );
  }

  // Calculate stats
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'approved').length;
  const progressPercentage = totalMilestones > 0
    ? (completedMilestones / totalMilestones) * 100
    : 0;

  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const releasedAmount = milestones
    .filter(m => m.status === 'approved')
    .reduce((sum, m) => sum + m.amount, 0);

  const pendingReview = milestones.filter(m => m.status === 'submitted').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          {t.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
      </div>

      {/* Overall Progress */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">{t.overallProgress}</span>
              <span className="font-semibold">{completedMilestones} / {totalMilestones}</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-xs text-gray-600 mt-1">
              {progressPercentage.toFixed(0)}% {t.completed}
            </p>
          </div>

          {/* Amount Summary */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-200">
            <div>
              <p className="text-xs text-gray-600">{t.totalValue}</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrencyAuto(totalAmount, currency, language)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">{t.released}</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrencyAuto(releasedAmount, currency, language)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">{language === 'en' ? 'Pending Review' : '待審核'}</p>
              <p className="text-xl font-bold text-purple-600">{pendingReview}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Milestones List */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const config = getStatusConfig(milestone.status);
          const StatusIcon = config.icon;
          const needsReview = milestone.status === 'submitted';

          return (
            <Card
              key={milestone.id}
              className={`p-6 border-2 transition-all ${
                needsReview
                  ? 'border-purple-300 shadow-lg ring-2 ring-purple-100'
                  : config.borderColor
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <StatusIcon className={`h-6 w-6 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {language === 'en' ? 'Milestone' : '里程碑'} {milestone.order}
                      </Badge>
                      <Badge className={`${config.color} border-0`}>
                        {config.label}
                      </Badge>
                      {needsReview && (
                        <Badge className="bg-purple-600 text-white animate-pulse">
                          {language === 'en' ? '⚡ Action Required' : '⚡ 需要操作'}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold mt-2">{milestone.title}</h4>
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {formatCurrencyAuto(milestone.amount, currency, language)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {milestone.duration_days} {t.days}
                  </p>
                </div>
              </div>

              {/* Deliverables */}
              {milestone.deliverables.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">{t.deliverables}:</p>
                  <div className="flex flex-wrap gap-2">
                    {milestone.deliverables.map((deliverable, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {deliverable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Submission Details */}
              {milestone.status === 'submitted' && milestone.submission_notes && (
                <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t.submissionNotes}
                  </p>
                  <p className="text-sm text-gray-700">{milestone.submission_notes}</p>
                  {milestone.deliverable_urls && milestone.deliverable_urls.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-2">{t.deliverableFiles}:</p>
                      <div className="space-y-1">
                        {milestone.deliverable_urls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            {language === 'en' ? 'File' : '文件'} {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Escrow Status */}
              {milestone.escrow_id && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">{t.escrowStatus}:</span>
                    <span>{t.releasedStatus}</span>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600 mb-4">
                {milestone.started_at && (
                  <div>
                    <p className="font-medium">{t.started}</p>
                    <p>{new Date(milestone.started_at).toLocaleDateString()}</p>
                  </div>
                )}
                {milestone.submitted_at && (
                  <div>
                    <p className="font-medium">{t.submitted}</p>
                    <p>{new Date(milestone.submitted_at).toLocaleDateString()}</p>
                  </div>
                )}
                {milestone.approved_at && (
                  <div>
                    <p className="font-medium">{t.approvedAt}</p>
                    <p>{new Date(milestone.approved_at).toLocaleDateString()}</p>
                  </div>
                )}
                {milestone.rejected_at && (
                  <div>
                    <p className="font-medium">{t.rejectedAt}</p>
                    <p>{new Date(milestone.rejected_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {milestone.status === 'pending' && (
                  <Badge variant="outline" className="w-full justify-center py-2">
                    <Clock className="h-4 w-4 mr-2" />
                    {t.awaitingWork}
                  </Badge>
                )}

                {milestone.status === 'in_progress' && (
                  <Badge variant="outline" className="w-full justify-center py-2 bg-blue-50">
                    <Clock className="h-4 w-4 mr-2" />
                    {t.awaitingSubmission}
                  </Badge>
                )}

                {milestone.status === 'submitted' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setShowRejectDialog(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {t.reject}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setShowApproveDialog(true);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {t.approve}
                    </Button>
                  </>
                )}

                {milestone.status === 'approved' && (
                  <Badge variant="outline" className="w-full justify-center py-2 bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t.approved}
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.approveTitle}</DialogTitle>
            <DialogDescription>{t.approveDescription}</DialogDescription>
          </DialogHeader>

          {selectedMilestone && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold">{selectedMilestone.title}</p>
                <p className="text-2xl font-bold text-blue-900 mt-2">
                  {formatCurrencyAuto(selectedMilestone.amount, currency, language)}
                </p>
              </div>

              <div>
                <Label htmlFor="approval-feedback">{t.approvalFeedback}</Label>
                <Textarea
                  id="approval-feedback"
                  value={approvalFeedback}
                  onChange={(e) => setApprovalFeedback(e.target.value)}
                  placeholder={t.approvalFeedbackPlaceholder}
                  rows={3}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setApprovalFeedback("");
                setSelectedMilestone(null);
              }}
              disabled={actionLoading}
            >
              {t.cancel}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Processing...' : '處理中...'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t.confirmApprove}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.rejectTitle}</DialogTitle>
            <DialogDescription>{t.rejectDescription}</DialogDescription>
          </DialogHeader>

          {selectedMilestone && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-semibold">{selectedMilestone.title}</p>
              </div>

              <div>
                <Label htmlFor="rejection-feedback" className="text-red-600">
                  {t.rejectionFeedback} *
                </Label>
                <Textarea
                  id="rejection-feedback"
                  value={rejectionFeedback}
                  onChange={(e) => setRejectionFeedback(e.target.value)}
                  placeholder={t.rejectionFeedbackPlaceholder}
                  rows={4}
                  className="mt-2"
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionFeedback("");
                setSelectedMilestone(null);
              }}
              disabled={actionLoading}
            >
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectionFeedback.trim()}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Processing...' : '處理中...'}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  {t.confirmReject}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}