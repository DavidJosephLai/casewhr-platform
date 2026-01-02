import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { CheckCircle, Clock, DollarSign, Loader2, Plus, Send, ThumbsUp, XCircle, FileText, PlayCircle, Upload, CheckCircle2, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { formatCurrency } from "../lib/currency";
import { CreateMilestoneForm } from "./CreateMilestoneForm";
import { MilestonePlanReview } from "./MilestonePlanReview";
import { EditMilestoneForm } from "./EditMilestoneForm";

export interface Milestone {
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
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  started_at?: string;
  submitted_at?: string;
  approved_at?: string;
  submission_notes?: string;
  deliverable_urls?: string[];
  approval_feedback?: string;
}

interface MilestoneManagerProps {
  proposalId: string;
  userRole: 'client' | 'freelancer';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalCurrency?: string; // 🔥 新增：提案的幣別
}

export function MilestoneManager({ proposalId, userRole, open, onOpenChange, proposalCurrency }: MilestoneManagerProps) {
  const { language } = useLanguage();
  const { accessToken, user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState<Record<string, string>>({});
  const [approvalFeedback, setApprovalFeedback] = useState<Record<string, string>>({});
  
  // 🔥 新增里程碑表單狀態
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: '',
  });
  
  // 🔥 新增：里程碑計劃審核狀態
  const [showPlanReview, setShowPlanReview] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  
  // 🔥 新增：編輯里程碑狀態
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  useEffect(() => {
    if (open && proposalId) {
      loadMilestones();
      loadProposal(); // 🔥 載入提案信息
    }
  }, [open, proposalId]);
  
  // 🔥 新增：載入提案信息
  const loadProposal = async () => {
    if (!accessToken) return;
    
    try {
      let token = accessToken;
      if (accessToken.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }

      const isDevMode = accessToken.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? { 
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        : { 'Authorization': `Bearer ${token}` };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/proposals/${proposalId}`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setProposal(data.proposal || null);
        
        // 🔥 DEBUG: 檢查 proposal 數據
        console.log('🔍 [MilestoneManager] Loaded proposal:', {
          proposalId,
          milestone_plan_status: data.proposal?.milestone_plan_status,
          milestone_plan_feedback: data.proposal?.milestone_plan_feedback,
          milestone_plan_reviewed_at: data.proposal?.milestone_plan_reviewed_at,
          fullProposal: data.proposal
        });
      }
    } catch (error) {
      console.error('Error loading proposal:', error);
    }
  };

  const loadMilestones = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      console.log('📋 [MilestoneManager] Loading milestones for proposal:', proposalId);
      
      // 🔥 開發模式支援：檢測是否為 mock 提案
      const isDevModeActive = localStorage.getItem('dev_mode_active') === 'true';
      const isMockProposal = proposalId.startsWith('proposal-mock-project-');
      
      if (isDevModeActive && isMockProposal) {
        console.log('🧪 [MilestoneManager] Dev mode detected, using mock milestones');
        
        // 創建 mock 里程碑數據
        const mockMilestones = [
          {
            id: `milestone-${proposalId}-1`,
            proposal_id: proposalId,
            title: '需求分析與設計',
            description: '完成產品需求分析文檔和 UI/UX 設計稿',
            amount: 10000,
            currency: 'TWD',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            order_index: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: `milestone-${proposalId}-2`,
            proposal_id: proposalId,
            title: '前端開發',
            description: '完成所有頁面的前端開發和響應式設計',
            amount: 15000,
            currency: 'TWD',
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            order_index: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: `milestone-${proposalId}-3`,
            proposal_id: proposalId,
            title: '後端開發與整合',
            description: '完成後端 API 開發、數據庫設計和支付系統整合',
            amount: 10000,
            currency: 'TWD',
            due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            order_index: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        
        console.log('✅ [MilestoneManager] Loaded mock milestones:', mockMilestones);
        setMilestones(mockMilestones);
        setLoading(false);
        return;
      }
      
      let token = accessToken;
      if (accessToken.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }

      const isDevMode = accessToken.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? { 
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        : { 'Authorization': `Bearer ${token}` };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/proposal/${proposalId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error('Failed to load milestones');
      }

      const data = await response.json();
      setMilestones(data.milestones || []);
    } catch (error) {
      console.error('Error loading milestones:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to load milestones' 
          : '載入里程碑失敗'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartMilestone = async (milestoneId: string) => {
    if (!accessToken) return;

    setActionLoading(milestoneId);
    try {
      let token = accessToken;
      if (accessToken.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }

      const isDevMode = accessToken.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? { 
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        : { 'Authorization': `Bearer ${token}` };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${milestoneId}/start`,
        {
          method: 'POST',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start milestone');
      }

      toast.success(
        language === 'en' 
          ? 'Milestone started successfully!' 
          : '里程碑已開！'
      );

      await loadMilestones();
    } catch (error) {
      console.error('Error starting milestone:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to start milestone' 
          : '開始里程碑失敗'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitMilestone = async (milestoneId: string) => {
    if (!accessToken) return;

    const notes = submissionNotes[milestoneId] || '';
    if (!notes.trim()) {
      toast.error(
        language === 'en' 
          ? 'Please provide submission notes' 
          : '請提供提交說明'
      );
      return;
    }

    setActionLoading(milestoneId);
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
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${milestoneId}/submit`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            submission_notes: notes,
            deliverable_urls: [],
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit milestone');
      }

      toast.success(
        language === 'en' 
          ? 'Milestone submitted for review!' 
          : '里程碑已提交審核！'
      );

      setSubmissionNotes(prev => ({ ...prev, [milestoneId]: '' }));
      await loadMilestones();
    } catch (error) {
      console.error('Error submitting milestone:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to submit milestone' 
          : '提交里程碑失敗'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    if (!accessToken) return;

    setActionLoading(milestoneId);
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
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${milestoneId}/approve`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            feedback: approvalFeedback[milestoneId] || '',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve milestone');
      }

      toast.success(
        language === 'en' 
          ? 'Milestone approved! Payment released.' 
          : '里程碑已批准！款項已釋放。'
      );

      setApprovalFeedback(prev => ({ ...prev, [milestoneId]: '' }));
      await loadMilestones();
    } catch (error) {
      console.error('Error approving milestone:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to approve milestone' 
          : '批准里程碑失敗'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: 'bg-gray-100 text-gray-800',
        icon: Clock,
        label: language === 'en' ? 'Pending' : '待開始',
      },
      in_progress: {
        color: 'bg-blue-100 text-blue-800',
        icon: PlayCircle,
        label: language === 'en' ? 'In Progress' : '進行中',
      },
      submitted: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Upload,
        label: language === 'en' ? 'Under Review' : '審核中',
      },
      approved: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle2,
        label: language === 'en' ? 'Approved' : '已批准',
      },
      rejected: {
        color: 'bg-red-100 text-red-800',
        icon: AlertCircle,
        label: language === 'en' ? 'Rejected' : '已拒絕',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const completedAmount = milestones
    .filter(m => m.status === 'approved')
    .reduce((sum, m) => sum + m.amount, 0);
  const progressPercentage = totalAmount > 0 ? (completedAmount / totalAmount) * 100 : 0;

  const t = {
    en: {
      title: 'Milestone Management',
      subtitle: 'Track project progress and payments',
      overview: 'Overview',
      totalBudget: 'Total Budget',
      completed: 'Completed',
      progress: 'Progress',
      milestoneTitle: 'Milestone',
      description: 'Description',
      amount: 'Amount',
      status: 'Status',
      created: 'Created',
      started: 'Started',
      submitted: 'Submitted',
      approved: 'Approved',
      startWork: 'Start Work',
      submitWork: 'Submit Work',
      approve: 'Approve & Release Payment',
      submissionNotes: 'Submission Notes',
      submissionNotesPlaceholder: 'Describe what you\'ve completed for this milestone...',
      approvalFeedback: 'Approval Feedback (Optional)',
      approvalFeedbackPlaceholder: 'Provide feedback for the freelancer...',
      noMilestones: 'No milestones defined',
      noMilestonesDesc: 'This project doesn\'t have milestones set up yet.',
    },
    zh: {
      title: '里程碑管理',
      subtitle: '追蹤項目進度和付款',
      overview: '概覽',
      totalBudget: '總預算',
      completed: '已完成',
      progress: '進度',
      milestoneTitle: '里程碑',
      description: '描述',
      amount: '金額',
      status: '狀態',
      created: '創建時間',
      started: '開始時間',
      submitted: '提交時間',
      approved: '批准時間',
      startWork: '開始工作',
      submitWork: '提交工作',
      approve: '批准並釋放款項',
      submissionNotes: '提交說明',
      submissionNotesPlaceholder: '描述您為此里程碑完成的動作...',
      approvalFeedback: '批准回饋（可選）',
      approvalFeedbackPlaceholder: '為接案者提供回饋...',
      noMilestones: '尚無里程碑',
      noMilestonesDesc: '此項目尚未設置里程碑。',
    },
  };

  const text = language === 'en' ? t.en : t.zh;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            {text.title}
          </DialogTitle>
          <DialogDescription>{text.subtitle}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* 🔥 允許創建里程碑的條件：
                1. Client 總是可以創建
                2. Freelancer 在計劃未提交或需要修改時可以創建 */}
            {((userRole === 'client') || 
              (userRole === 'freelancer' && (!proposal?.milestone_plan_status || 
                                             proposal?.milestone_plan_status === 'not_submitted' ||
                                             proposal?.milestone_plan_status === 'revision_requested'))) && 
              !showCreateForm && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="w-full mb-4"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                {language === 'en' ? 'Add New Milestone' : '新增里程碑'}
              </Button>
            )}
            
            {/* 🔥 創建里程碑表單 */}
            {showCreateForm && (
              <div className="mb-4">
                <CreateMilestoneForm
                  proposalId={proposalId}
                  currency={proposalCurrency || 'TWD'}
                  onSuccess={() => {
                    setShowCreateForm(false);
                    loadMilestones();
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            )}
            
            {milestones.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{text.noMilestones}</h3>
                <p className="text-gray-500">{text.noMilestonesDesc}</p>
              </div>
            ) : (
              <>
                {/* ✅ 客户修改反馈提示 - 显示在接案者界面 */}
                {userRole === 'freelancer' && 
                 proposal?.milestone_plan_status === 'revision_requested' && 
                 proposal?.milestone_plan_feedback && (
                  <Card className="mb-4 border-orange-300 bg-orange-50">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-orange-900 mb-2">
                            {language === 'en' 
                              ? '⚠️ Client Requested Revisions' 
                              : '⚠️ 發案者要求修改'}
                          </h4>
                          <div className="text-sm text-orange-800 whitespace-pre-wrap bg-white p-3 rounded border border-orange-200">
                            {proposal.milestone_plan_feedback}
                          </div>
                          {proposal.milestone_plan_reviewed_at && (
                            <p className="text-xs text-orange-600 mt-2">
                              {language === 'en' ? 'Reviewed on: ' : '審核時間：'}
                              {new Date(proposal.milestone_plan_reviewed_at).toLocaleString(
                                language === 'en' ? 'en-US' : 'zh-TW'
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* 🔥 Freelancer 提交里程碑計劃按鈕 */}
                {userRole === 'freelancer' && milestones.length > 0 && 
                 (!proposal?.milestone_plan_status || 
                  proposal?.milestone_plan_status === 'not_submitted' ||
                  proposal?.milestone_plan_status === 'revision_requested') && (
                  <div className="mb-4">
                    <Button
                      onClick={async () => {
                        if (!accessToken) return;
                        
                        try {
                          let token = accessToken;
                          if (accessToken.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
                            token = `${accessToken}||${user.email}`;
                          }

                          const isDevMode = accessToken.startsWith('dev-user-');
                          const headers: Record<string, string> = isDevMode
                            ? { 
                                'X-Dev-Token': token,
                                'Authorization': `Bearer ${publicAnonKey}`
                              }
                            : { 'Authorization': `Bearer ${token}` };

                          const response = await fetch(
                            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/plan/${proposalId}/submit`,
                            {
                              method: 'POST',
                              headers,
                            }
                          );

                          if (!response.ok) {
                            throw new Error('Failed to submit plan');
                          }

                          toast.success(
                            language === 'en' 
                              ? '✅ Milestone plan submitted for client review!' 
                              : '✅ 里程碑計劃已提交，等待發案者審核！'
                          );

                          // Reload to update status
                          await loadProposal();
                          onOpenChange(false);
                        } catch (error) {
                          console.error('Error submitting plan:', error);
                          toast.error(
                            language === 'en' 
                              ? 'Failed to submit plan' 
                              : '提交計劃失敗'
                          );
                        }
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {proposal?.milestone_plan_status === 'revision_requested'
                        ? (language === 'en' ? '✅ Re-submit Milestone Plan' : '✅ 重新提交里程碑計劃')
                        : (language === 'en' ? '✅ Submit Milestone Plan for Review' : '✅ 提交里程碑計劃供審核')
                      }
                    </Button>
                  </div>
                )}
                
                {/* Overview Card */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <DollarSign className="h-4 w-4" />
                          {text.totalBudget}
                        </div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(totalAmount, proposalCurrency || 'TWD')}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <CheckCircle2 className="h-4 w-4" />
                          {text.completed}
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(completedAmount, proposalCurrency || 'TWD')}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <TrendingUp className="h-4 w-4" />
                          {text.progress}
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {progressPercentage.toFixed(0)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Milestones List */}
                <div className="space-y-4 mt-4">
                  {milestones.map((milestone, index) => (
                    <Card key={milestone.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{milestone.title}</CardTitle>
                              <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            {getStatusBadge(milestone.status)}
                            <div className="text-xl font-bold text-blue-600">
                              {formatCurrency(milestone.amount, milestone.currency)}
                            </div>
                            
                            {/* 🔥 編輯/刪除按鈕 - 只在計劃未批准時顯示 */}
                            {(!proposal?.milestone_plan_status || 
                              proposal?.milestone_plan_status === 'not_submitted' ||
                              proposal?.milestone_plan_status === 'revision_requested') && 
                             milestone.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingMilestoneId(milestone.id);
                                  }}
                                  className="text-xs"
                                >
                                  ✏️ {language === 'en' ? 'Edit' : '編輯'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    if (!accessToken) return;
                                    
                                    if (!confirm(language === 'en' ? 'Delete this milestone?' : '確定要刪除這個里程碑嗎？')) {
                                      return;
                                    }
                                    
                                    try {
                                      let token = accessToken;
                                      if (accessToken.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
                                        token = `${accessToken}||${user.email}`;
                                      }

                                      const isDevMode = accessToken.startsWith('dev-user-');
                                      const headers: Record<string, string> = isDevMode
                                        ? { 
                                            'X-Dev-Token': token,
                                            'Authorization': `Bearer ${publicAnonKey}`
                                          }
                                        : { 'Authorization': `Bearer ${token}` };

                                      const response = await fetch(
                                        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/${milestone.id}`,
                                        {
                                          method: 'DELETE',
                                          headers,
                                        }
                                      );

                                      if (!response.ok) {
                                        throw new Error('Failed to delete milestone');
                                      }

                                      toast.success(
                                        language === 'en' 
                                          ? 'Milestone deleted!' 
                                          : '里程碑已刪除！'
                                      );

                                      await loadMilestones();
                                    } catch (error) {
                                      console.error('Error deleting milestone:', error);
                                      toast.error(
                                        language === 'en' 
                                          ? 'Failed to delete milestone' 
                                          : '刪除里程碑失敗'
                                      );
                                    }
                                  }}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  🗑️ {language === 'en' ? 'Delete' : '刪除'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* ✏️ 編輯表單 - 顯示在 CardContent 開頭 */}
                        {editingMilestoneId === milestone.id && (
                          <EditMilestoneForm
                            milestone={milestone}
                            onSuccess={() => {
                              setEditingMilestoneId(null);
                              loadMilestones();
                            }}
                            onCancel={() => setEditingMilestoneId(null)}
                          />
                        )}

                        {/* Timeline */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {text.created}
                            </div>
                            <div className="font-medium">{formatDate(milestone.created_at)}</div>
                          </div>
                          {milestone.started_at && (
                            <div>
                              <div className="text-gray-500 flex items-center gap-1">
                                <PlayCircle className="h-3 w-3" />
                                {text.started}
                              </div>
                              <div className="font-medium">{formatDate(milestone.started_at)}</div>
                            </div>
                          )}
                          {milestone.submitted_at && (
                            <div>
                              <div className="text-gray-500 flex items-center gap-1">
                                <Upload className="h-3 w-3" />
                                {text.submitted}
                              </div>
                              <div className="font-medium">{formatDate(milestone.submitted_at)}</div>
                            </div>
                          )}
                          {milestone.approved_at && (
                            <div>
                              <div className="text-gray-500 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {text.approved}
                              </div>
                              <div className="font-medium">{formatDate(milestone.approved_at)}</div>
                            </div>
                          )}
                        </div>

                        {/* Submission Notes (if submitted) */}
                        {milestone.submission_notes && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="font-medium text-sm text-yellow-800 mb-2">
                              {text.submissionNotes}
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {milestone.submission_notes}
                            </p>
                          </div>
                        )}

                        {/* Approval Feedback (if approved) */}
                        {milestone.approval_feedback && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="font-medium text-sm text-green-800 mb-2">
                              {text.approvalFeedback}
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {milestone.approval_feedback}
                            </p>
                          </div>
                        )}

                        {/* Actions for Freelancer */}
                        {userRole === 'freelancer' && (
                          <>
                            {milestone.status === 'pending' && (
                              <Button
                                onClick={() => handleStartMilestone(milestone.id)}
                                disabled={actionLoading === milestone.id}
                                className="w-full"
                              >
                                {actionLoading === milestone.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {language === 'en' ? 'Starting...' : '開始中...'}
                                  </>
                                ) : (
                                  <>
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    {text.startWork}
                                  </>
                                )}
                              </Button>
                            )}

                            {milestone.status === 'in_progress' && (
                              <div className="space-y-3">
                                <Textarea
                                  placeholder={text.submissionNotesPlaceholder}
                                  value={submissionNotes[milestone.id] || ''}
                                  onChange={(e) => setSubmissionNotes(prev => ({
                                    ...prev,
                                    [milestone.id]: e.target.value
                                  }))}
                                  rows={4}
                                />
                                <Button
                                  onClick={() => handleSubmitMilestone(milestone.id)}
                                  disabled={actionLoading === milestone.id}
                                  className="w-full"
                                >
                                  {actionLoading === milestone.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      {language === 'en' ? 'Submitting...' : '交中...'}
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="mr-2 h-4 w-4" />
                                      {text.submitWork}
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </>
                        )}

                        {/* Actions for Client */}
                        {userRole === 'client' && milestone.status === 'submitted' && (
                          <div className="space-y-3">
                            <Textarea
                              placeholder={text.approvalFeedbackPlaceholder}
                              value={approvalFeedback[milestone.id] || ''}
                              onChange={(e) => setApprovalFeedback(prev => ({
                                ...prev,
                                [milestone.id]: e.target.value
                              }))}
                              rows={3}
                            />
                            <Button
                              onClick={() => handleApproveMilestone(milestone.id)}
                              disabled={actionLoading === milestone.id}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              {actionLoading === milestone.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {language === 'en' ? 'Approving...' : '批准中...'}
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  {text.approve}
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}