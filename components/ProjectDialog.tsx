import { projectApi } from "../lib/api";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { useLanguage } from "../lib/LanguageContext";
import { getTranslation } from "../lib/translations";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Calendar, DollarSign, User, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, Banknote, FileText, Send, Briefcase, AlertCircle } from "lucide-react";
import { ProposalForm } from "./ProposalForm";
import { ReviewForm } from "./rating/ReviewForm";
import { formatCurrency, getDefaultCurrency } from "../lib/currency";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DeliverableSubmit } from "./DeliverableSubmit";
import { DeliverableReview } from "./DeliverableReview";
import { PaymentRelease } from "./PaymentRelease";
import { EscrowStatus } from "./EscrowStatus";
import { StartConversationButton } from "./StartConversationButton";
import { ProposalListDialog } from "./ProposalListDialog"; // 🔧 新增：提案列表對話框

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  required_skills: string[];
  category: string | null;
  status: string;
  created_at: string;
  assigned_freelancer_id?: string;
}

interface ProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function ProjectDialog({ project, open, onOpenChange, onUpdate }: ProjectDialogProps) {
  const { language } = useLanguage();
  const { user, profile, accessToken } = useAuth();
  const t = getTranslation(language as any).projects;
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // 🔵 添加调试：监控 showProposalForm 状态变化
  useEffect(() => {
    console.log('🔵 [ProjectDialog] showProposalForm changed:', showProposalForm);
  }, [showProposalForm]);

  const [recipientInfo, setRecipientInfo] = useState<{ id: string; name: string; type: 'client' | 'freelancer' } | null>(null);
  const [milestonesCompleted, setMilestonesCompleted] = useState(0);
  const [totalMilestones, setTotalMilestones] = useState(1);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [checkingReview, setCheckingReview] = useState(false);
  // 🔧 添加狀態來追蹤是否需要在 Profile 更新後重新打開
  const [pendingProjectReopen, setPendingProjectReopen] = useState(false);
  // 🔧 添加提案列表對話框狀態
  const [showProposalListDialog, setShowProposalListDialog] = useState(false);

  // Fetch deliverables status when dialog opens and project is completed
  useEffect(() => {
    if (open && project && project.status === 'completed' && accessToken) {
      fetchDeliverablesStatus();
      checkReviewStatus();
    }
  }, [open, project?.id, project?.status]);

  // 🔧 監聽 Profile 更新事件，自動重新打開項目詳情
  useEffect(() => {
    const handleProfileUpdated = () => {
      console.log('✅ [ProjectDialog] Profile updated, reopening project dialog...');
      if (pendingProjectReopen && project) {
        setPendingProjectReopen(false);
        // 延遲一點重新打開，確保 Profile Dialog 完全關閉
        setTimeout(() => {
          onOpenChange(true);
        }, 300);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdated);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdated);
  }, [pendingProjectReopen, project, onOpenChange]);

  const fetchDeliverablesStatus = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables/project/${project.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const deliverables = data.deliverables || [];
        const approvedCount = deliverables.filter((d: any) => d.status === 'approved').length;
        const totalCount = Math.max(deliverables.length, 1); // 至少显示1个里程碑
        
        setMilestonesCompleted(approvedCount);
        setTotalMilestones(totalCount);
      } else {
        const errorData = await response.json();
        console.error('❌ [ProjectDialog] Fetch deliverables error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          projectId: project.id,
        });
      }
    } catch (error) {
      console.error('Failed to fetch deliverables status:', error);
      // 使用默认值
      setMilestonesCompleted(1);
      setTotalMilestones(1);
    }
  };

  const checkReviewStatus = async () => {
    if (!project || !accessToken) return;
    
    setCheckingReview(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/reviews/check/${project.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Review check result:', data);
        setHasReviewed(data.has_reviewed);
      }
    } catch (error) {
      console.error('Error checking review status:', error);
    } finally {
      setCheckingReview(false);
    }
  };

  if (!project) return null;

  // 🔧 檢查是否為特殊用戶（開發者帳號）
  const SPECIAL_USER_EMAILS = [
    'davidlai117@yahoo.com.tw',
    'davidlai234@hotmail.com'
  ];
  const isSpecialUser = user?.email && SPECIAL_USER_EMAILS.includes(user.email.toLowerCase());

  // 🔧 真正的項目所有者判斷（只比對 user_id）
  const isRealOwner = user?.id === project.user_id;
  
  // 🔧 特殊用戶只對自己真正發布的項目才是所有者，不再有全局管理員特權
  const isOwner = isRealOwner;
  
  // 支持新格式：is_freelancer 或旧格式 account_type
  const isFreelancer = profile?.is_freelancer ?? (profile?.account_type === 'freelancer');
  const canSubmitProposal = !isOwner && isFreelancer && project.status === 'open';
  const isLoggedIn = !!user;
  const needsFreelancerProfile = isLoggedIn && !isFreelancer && !isOwner && project.status === 'open';
  const needsLogin = !isLoggedIn && project.status === 'open';

  // 🔍 調試日誌：檢查權限邏輯
  console.log('🔍 [ProjectDialog] Permission Check:', {
    projectId: project.id,
    projectTitle: project.title,
    projectUserId: project.user_id,
    projectStatus: project.status,
    currentUserId: user?.id,
    currentUserEmail: user?.email,
    isSpecialUser, // 🔧 新增：特殊用戶標記
    isRealOwner,
    isOwner,
    isFreelancer,
    profileData: {
      is_freelancer: profile?.is_freelancer,
      is_client: profile?.is_client,
      account_type: profile?.account_type
    },
    canSubmitProposal,
    needsFreelancerProfile,
    needsLogin,
  });

  // 🧪 開發模式專用調試
  const isDevelopment = localStorage.getItem('dev_mode_active') === 'true';
  if (isDevelopment) {
    console.log('🧪 [ProjectDialog] Dev Mode Profile Debug:', {
      profile,
      is_freelancer: profile?.is_freelancer,
      canSubmitProposal,
      reasonIfCant: !canSubmitProposal ? {
        isOwner: isOwner,
        isFreelancer: isFreelancer,
        projectStatus: project.status,
        expectedStatus: 'open'
      } : 'Can submit!'
    });
  }

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return language === 'en' ? 'Budget not specified' : '未指定預算';
    
    // 獲取預設貨幣
    const currency = getDefaultCurrency(language);
    
    if (min && max) return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
    if (min) return `${language === 'en' ? 'From' : '起'} ${formatCurrency(min, currency)}`;
    if (max) return `${language === 'en' ? 'Up to' : '最高'} ${formatCurrency(max, currency)}`;
    
    return language === 'en' ? 'Budget not specified' : '未指定預算';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (showProposalForm) {
    return (
      <ProposalForm
        project={project}
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShowProposalForm(false);
            onOpenChange(false);
          }
        }}
        onSubmitted={() => {
          setShowProposalForm(false);
          onOpenChange(false);
          if (onUpdate) onUpdate();
        }}
      />
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] lg:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <DialogTitle className="pr-8">{project.title}</DialogTitle>
              <Badge className={getStatusColor(project.status)}>
                {t.status[project.status as keyof typeof t.status]}
              </Badge>
            </div>
            <DialogDescription className="sr-only">
              {project.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="mb-2">{t.form.description}</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget */}
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">{t.detail.budget}</p>
                  <p>{formatBudget(project.budget_min, project.budget_max)}</p>
                </div>
              </div>

              {/* Deadline */}
              {project.deadline && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">{t.detail.deadline}</p>
                    <p>{formatDate(project.deadline)}</p>
                  </div>
                </div>
              )}

              {/* Category */}
              {project.category && (
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">{t.form.category}</p>
                    <p>{project.category}</p>
                  </div>
                </div>
              )}

              {/* Posted Date */}
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">{t.detail.postedOn}</p>
                  <p>{formatDate(project.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Required Skills */}
            {project.required_skills && project.required_skills.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  <Briefcase className="inline h-4 w-4 mr-1" />
                  {t.detail.requiredSkills}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.required_skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions - 按钮区域 */}
            <div className="space-y-2 pt-4 border-t">
              {!isLoggedIn ? (
                <Button
                  className="w-full"
                  onClick={() => {
                    // 触发登录对话框
                    window.dispatchEvent(new CustomEvent('openAuthDialog', { detail: 'login' }));
                    onOpenChange(false);
                  }}
                >
                  {t.detail.loginToSubmitProposal}
                </Button>
              ) : (
                <>
                  {project.status === 'open' ? (
                    <>
                      <p className="text-xs text-gray-500 mb-2">
                        {language === 'en' ? 'Project Actions' : '項目操作'}
                      </p>
                      
                      {/* Freelancer 可以提交提案 */}
                      {canSubmitProposal && (
                        <>
                          <Button
                            className="w-full"
                            onClick={() => {
                              console.log('🔵 [ProjectDialog] Submit Proposal button clicked');
                              console.log('🔵 [ProjectDialog] Current showProposalForm:', showProposalForm);
                              console.log('🔵 [ProjectDialog] Setting showProposalForm to true');
                              setShowProposalForm(true);
                            }}
                          >
                            {t.detail.submitProposal}
                          </Button>
                          
                          {/* Freelancer 可以联客户 */}
                          <StartConversationButton
                            recipientId={project.user_id}
                            recipientType="client"
                            projectId={project.id}
                            variant="outline"
                            className="w-full"
                          />
                        </>
                      )}
                      
                      {/* 项目发布者可以查看提案 */}
                      {isOwner && (
                        <>
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => {
                              // 🔧 打開提案列表對話框
                              setShowProposalListDialog(true);
                            }}
                          >
                            {t.detail.viewProposals}
                          </Button>
                          
                          {/* 如果項目已分配給接案者，案主可以聯繫接案者 */}
                          {project.assigned_freelancer_id ? (
                            <StartConversationButton
                              recipientId={project.assigned_freelancer_id}
                              recipientType="freelancer"
                              projectId={project.id}
                              variant="outline"
                              className="w-full"
                            />
                          ) : (
                            <div className="text-center text-sm text-gray-500 py-2">
                              {language === 'en' 
                                ? 'No freelancer assigned yet' 
                                : '尚未分配接案者'}
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* 已登录但需要设 Freelancer Profile */}
                      {needsFreelancerProfile && (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => {
                            // 触发 Edit Profile 对话框
                            setPendingProjectReopen(true);
                            window.dispatchEvent(new CustomEvent('openProfileDialog'));
                            onOpenChange(false);
                          }}
                        >
                          {t.detail.setupFreelancerProfile}
                        </Button>
                      )}
                    </>
                  ) : project.status === 'in_progress' || project.status === 'pending_review' ? (
                    /* 项目进行中或待审核 - 案主和接案者都能看到交付物 */
                    <>
                      <p className="text-xs text-gray-500 mb-2">
                        {language === 'en' 
                          ? (project.status === 'pending_review' ? 'Deliverable Submitted - Awaiting Review' : 'Project in Progress')
                          : (project.status === 'pending_review' ? '交付物已提交 - 等待審核' : '項目進行中')}
                      </p>
                      
                      {/* 交付物管理标签页 */}
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="overview">
                            {language === 'en' ? 'Overview' : '概覽'}
                          </TabsTrigger>
                          <TabsTrigger value="deliverables">
                            {language === 'en' ? 'Deliverables' : '交付物'}
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="overview" className="space-y-3 mt-4">
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm text-blue-700 mb-3">
                              {language === 'en' 
                                ? '✓ This project is currently in progress with a selected freelancer.' 
                                : '✓ 此項目正進行中，已選定接案者。'}
                            </p>
                            
                            {/* 聯繫按鈕 - 案主和創作者都可以使用 */}
                            {project.assigned_freelancer_id && (
                              <>
                                {isOwner ? (
                                  <StartConversationButton
                                    recipientId={project.assigned_freelancer_id}
                                    recipientType="freelancer"
                                    projectId={project.id}
                                    variant="outline"
                                    className="w-full mb-3"
                                  />
                                ) : (
                                  <StartConversationButton
                                    recipientId={project.user_id}
                                    recipientType="client"
                                    projectId={project.id}
                                    variant="outline"
                                    className="w-full mb-3"
                                  />
                                )}
                              </>
                            )}
                            
                            {/* 🔥 案主可以查看已接受提案詳情 */}
                            {isOwner && (
                              <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 mb-3"
                                onClick={() => {
                                  setShowProposalListDialog(true);
                                }}
                              >
                                {language === 'en' ? 'View Proposal Details' : '���看提案詳情'}
                              </Button>
                            )}
                            
                            {/* 案主可以标记完成 */}
                            {isOwner && (
                              <Button
                                className="w-full"
                                onClick={() => {
                                  setShowCompleteConfirm(true);
                                }}
                              >
                                {language === 'en' ? 'Mark as Completed' : '標記為已完成'}
                              </Button>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="deliverables" className="mt-4 min-h-[500px] max-h-[600px] overflow-y-auto">
                          {/* 接案者可以提交交付物 */}
                          {isFreelancer && !isOwner && (
                            <DeliverableSubmit 
                              projectId={project.id} 
                              language={language}
                              onSubmitSuccess={() => {
                                toast.success(language === 'en' 
                                  ? 'Deliverable submitted! The client will review your work.' 
                                  : '交付物已提交！案主將審核您的工作。');
                                if (onUpdate) onUpdate();
                              }}
                            />
                          )}
                          
                          {/* 案主可以审核交付物 */}
                          {isOwner && (
                            <DeliverableReview 
                              projectId={project.id}
                              language={language}
                              onReviewComplete={() => {
                                // 批准後關閉 Dialog，刷新項目列表以顯示「立即撥款」按鈕
                                if (onUpdate) onUpdate();
                                onOpenChange(false);
                                
                                // 延遲顯示成功提示，確保 Dialog 關閉後才顯示
                                setTimeout(() => {
                                  toast.success(
                                    language === 'en' 
                                      ? '✅ Deliverable approved! Look for the "💰 Release Payment Now" button on the project card.' 
                                      : '✅ 交付物已批准！請在項目卡上找「💰 立即撥款」按鈕。',
                                    { duration: 6000 }
                                  );
                                }, 300);
                              }}
                            />
                          )}
                          
                          {/* 如果两者都不显示，显示提示信息 */}
                          {!isOwner && !(isFreelancer && !isOwner) && (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">
                                {language === 'en' 
                                  ? 'You do not have permission to view deliverables for this project.' 
                                  : '您沒有權限查看此項的交付物。'}
                              </p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </>
                  ) : project.status === 'pending_payment' ? (
                    /* 等待撥款 - 案主需要撥款 */
                    <>
                      {/* 醒目的提示框 - 案主 */}
                      {isOwner && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="size-6 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-900 mb-1">
                                {language === 'en' 
                                  ? '⚠️ Action Required: Confirm Payment Release' 
                                  : '⚠️ 需要操作：確認撥款'}
                              </h4>
                              <p className="text-sm text-blue-800">
                                {language === 'en'
                                  ? 'The deliverable has been approved. Please review and click the "Confirm & Release Payment" button below to complete the payment to the freelancer.'
                                  : '交付物已批准。請檢查並點擊下方「確認並撥款」按鈕以完成付款給接案者。'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mb-2">
                        {language === 'en' ? 'Awaiting Payment Release' : '等待撥款'}
                      </p>
                      
                      {/* 撥款组件 - 只有案主可以看到 */}
                      {isOwner && (
                        <PaymentRelease
                          projectId={project.id}
                          projectStatus={project.status}
                          language={language}
                          onPaymentReleased={() => {
                            toast.success(
                              language === 'en'
                                ? 'Payment released successfully! Project completed.'
                                : '撥款成功！項目已完成。'
                            );
                            if (onUpdate) onUpdate();
                          }}
                        />
                      )}
                      
                      {/* 托管状态 - 双方都可以看到 */}
                      <div className="mt-4">
                        <EscrowStatus
                          projectId={project.id}
                          language={language}
                        />
                      </div>
                      
                      {/* 接案者看到的提示 */}
                      {!isOwner && isFreelancer && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded mt-4">
                          <p className="text-sm text-green-700">
                            {language === 'en'
                              ? '✓ Your deliverable has been approved! Waiting for the client to release payment.'
                              : '✓ 您的交付物已被批准！等待案主撥款。'}
                          </p>
                        </div>
                      )}
                    </>
                  ) : project.status === 'completed' ? (
                    /* 项目已完成 - 显示评价功能 */
                    <>
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-gray-700">
                            {language === 'en' ? 'Project Completed' : '項目已完成'}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {language === 'en' ? `Milestones ${milestonesCompleted}/${totalMilestones}` : `里程碑 ${milestonesCompleted}/${totalMilestones}`}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          {language === 'en' 
                            ? 'This project has been completed successfully. You can leave a review for the other party.' 
                            : '此項目已成功完成。您可以為對方留下評價。'}
                        </p>
                        
                        {/* 评价按钮 - 案主评价接案者，接案者评价案主 */}
                        {hasReviewed ? (
                          <Button
                            className="w-full"
                            disabled
                            variant="outline"
                          >
                            ✅ {language === 'en' ? 'Review Submitted' : '已提交評價'}
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            disabled={checkingReview}
                            onClick={async () => {
                              // 获取对方ID和类型
                              const recipientId = isOwner ? project.assigned_freelancer_id : project.user_id;
                              const recipientType = isOwner ? 'freelancer' : 'client';
                              
                              if (!recipientId) {
                                toast.error(language === 'en' 
                                  ? 'Cannot find the other party information. This project may not have an assigned freelancer.' 
                                  : '無法找到對方資訊。此項目可能沒有分配接案者。');
                                return;
                              }
                              
                              // 获取对名字
                              try {
                                const response = await fetch(
                                  `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile/${recipientId}`,
                                  {
                                    headers: {
                                      'Authorization': `Bearer ${accessToken}`,
                                    },
                                  }
                                );
                                
                                if (response.ok) {
                                  const data = await response.json();
                                  setRecipientInfo({
                                    id: recipientId,
                                    name: data.profile?.name || (language === 'en' ? 'User' : '用戶'),
                                    type: recipientType,
                                  });
                                  setShowReviewForm(true);
                                } else {
                                  // 即使获取失败，也显示评价表单
                                  setRecipientInfo({
                                    id: recipientId,
                                    name: language === 'en' ? 'User' : '用戶',
                                    type: recipientType,
                                  });
                                  setShowReviewForm(true);
                                }
                              } catch (error) {
                                // 出错时也显示评价表单
                                setRecipientInfo({
                                  id: recipientId,
                                  name: language === 'en' ? 'User' : '用戶',
                                  type: recipientType,
                                });
                                setShowReviewForm(true);
                              }
                            }}
                          >
                            {checkingReview ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {language === 'en' ? 'Checking...' : '檢查中...'}
                              </>
                            ) : (
                              language === 'en' 
                                ? isOwner ? 'Review Freelancer' : 'Review Client'
                                : isOwner ? '評價接案者' : '評價主'
                            )}
                          </Button>
                        )}
                      </div>
                      
                      {/* Review Form Dialog */}
                      {showReviewForm && recipientInfo && (
                        <ReviewForm
                          projectId={project.id}
                          recipientId={recipientInfo.id}
                          recipientName={recipientInfo.name}
                          recipientType={recipientInfo.type}
                          open={showReviewForm}
                          onOpenChange={setShowReviewForm}
                          language={language}
                          onSubmitted={() => {
                            setHasReviewed(true); // 标记为已评价
                            if (onUpdate) onUpdate();
                          }}
                        />
                      )}
                    </>
                  ) : (
                    /* 项目取消 */
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center">
                      <p className="font-medium text-gray-700 mb-1">
                        {language === 'en' ? 'Project Cancelled' : '項目已取消'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === 'en'
                          ? 'This project has been cancelled by the client.'
                          : '此項目已被客戶取消。'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Project Confirmation Dialog */}
      <AlertDialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Mark Project as Completed?' : '標記項目為已完成？'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? 'This will finalize the project and allow both parties to leave reviews. This action cannot be undone.' 
                : '這將完成項目並允許雙方互相評價。此操作無法撤銷。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'en' ? 'Cancel' : '取消'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setCompleteLoading(true);
                setShowCompleteConfirm(false);
                projectApi.markProjectAsCompleted(project.id, accessToken)
                  .then(() => {
                    toast.success(language === 'en' ? 'Project marked as completed!' : '項目已標記為已完成！');
                    if (onUpdate) onUpdate();
                    setCompleteLoading(false);
                  })
                  .catch((error) => {
                    toast.error(language === 'en' ? 'Failed to mark project as completed.' : '標記項目為已完成失敗。');
                    setCompleteLoading(false);
                  });
              }}
              disabled={completeLoading}
            >
              {completeLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Completing...' : '完成中...'}
                </>
              ) : (
                language === 'en' ? 'Confirm' : '確認'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Proposal List Dialog */}
      <ProposalListDialog
        project={project}
        open={showProposalListDialog}
        onOpenChange={setShowProposalListDialog}
        onProposalAccepted={() => {
          // 刷新項目列表
          if (onUpdate) onUpdate();
        }}
      />
    </>
  );
}