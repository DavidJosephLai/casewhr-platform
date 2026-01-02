import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { User, Calendar, DollarSign, Clock, MessageSquare, Loader2, CheckCircle, XCircle, TrendingUp, FileText, Eye } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/currency';
import { StartConversationButton } from './StartConversationButton';
import { MilestoneManager } from "./MilestoneManager";
import { MilestonePlanReview } from "./MilestonePlanReview";
import { AcceptedProposalDialog } from "./AcceptedProposalDialog";

interface Proposal {
  id: string;
  project_id: string;
  freelancer_id: string;
  freelancer_name?: string;
  client_id?: string; // 🔥 新增：案主 ID
  proposed_budget: number;
  delivery_time: string;
  cover_letter: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  currency?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  user_id: string;
}

interface ProposalListDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProposalAccepted?: () => void;
}

export function ProposalListDialog({ project, open, onOpenChange, onProposalAccepted }: ProposalListDialogProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showMilestoneManager, setShowMilestoneManager] = useState(false);
  const [showPlanReview, setShowPlanReview] = useState(false); // 🔥 新增：里程碑計劃審核狀態
  const [showProposalDetail, setShowProposalDetail] = useState(false); // 🔥 新增：提案詳情弹窗狀態

  useEffect(() => {
    if (open && project?.id) {
      loadProposals();
    }
  }, [open, project?.id]);

  const loadProposals = async () => {
    if (!project || !accessToken) return;

    setLoading(true);
    try {
      // 🔥 開發模式支援：檢測是否為 mock 項目
      const isDevMode = localStorage.getItem('dev_mode_active') === 'true';
      const isMockProject = project.id.startsWith('mock-project-');
      
      if (isDevMode && isMockProject) {
        // 創建 mock 提案數據
        const mockProposals: Proposal[] = [
          {
            id: `proposal-${project.id}-1`,
            project_id: project.id,
            freelancer_id: 'dev-freelancer-001',
            freelancer_name: '張小明',
            client_id: 'dev-client-001', // 🔥 新增：案主 ID
            proposed_budget: 35000,
            delivery_time: '30 天',
            cover_letter: `您好！我對「${project.title}」這個項目非常感興趣。我有 5 年以上的相關開發經驗，曾參與多個類似項目的開發工作。\n\n我的優勢：\n- 精通 React、Node.js、PostgreSQL 等技術棧\n- 有完整的電商平台開發經驗\n- 可以提供詳細的技術方案和時程規劃\n\n期待與您合作！`,
            status: 'accepted', // 🔥 改為 accepted，顯示里程碑管理按鈕
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            currency: 'TWD', // 台幣
          },
          {
            id: `proposal-${project.id}-2`,
            project_id: project.id,
            freelancer_id: 'dev-freelancer-002',
            freelancer_name: 'Sarah Chen',
            client_id: 'dev-client-002', // 🔥 新增：案主 ID
            proposed_budget: 5500,
            delivery_time: '25 天',
            cover_letter: `Hi! I'm a full-stack developer with 7 years of experience in e-commerce development.\n\nWhy choose me:\n✅ Delivered 10+ successful e-commerce projects\n✅ Expert in React, Node.js, and PostgreSQL\n✅ Fast delivery with high quality\n✅ Free 3-month maintenance support\n\nLooking forward to working with you!`,
            status: 'accepted', // 🔥 也改為 accepted，支持多幣別測試
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            currency: 'USD', // 美金
          },
          {
            id: `proposal-${project.id}-3`,
            project_id: project.id,
            freelancer_id: 'dev-freelancer-003',
            freelancer_name: '李建華',
            client_id: 'dev-client-003', // 🔥 新增：案主 ID
            proposed_budget: 38000,
            delivery_time: '35 天',
            cover_letter: `您好！我是一名資深全端工程師，專注於電商平台開發。\n\n我的經驗包括：\n• 開發過 20+ 個電商網站\n• 熟悉支付系統整合（綠界、藍新、PayPal）\n• 擅長效能優化和 SEO\n• 提供完整的測試和文件\n\n希望能為您的項目提供專業服務`,
            status: 'accepted', // 🔥 改為 accepted，支持人民幣測試
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            currency: 'CNY', // 人民幣
          },
        ];
        
        setProposals(mockProposals);
        setLoading(false);
        return;
      }
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/proposals/project/${project.id}`;
      
      // 🔧 如果 accessToken 以 'dev-user-' 開頭（開發模式），需要含 email
      let token = accessToken;
      if (accessToken.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }
      
      // 🔧 在開發模式下使用 X-Dev-Token header，避免 Supabase Edge Functions 的 JWT 驗證
      const isDevModeAPI = accessToken.startsWith('dev-user-');
      const headers: Record<string, string> = isDevModeAPI
        ? { 
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        : { 'Authorization': `Bearer ${token}` };
      
      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load proposals');
      }

      const data = await response.json();
      setProposals(data.proposals || []);
    } catch (error) {
      console.error('❌ [ProposalListDialog] Error loading proposals:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to load proposals' 
          : '載入提案失敗'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async (proposalId: string, freelancerId: string) => {
    if (!accessToken) return;

    setActionLoading(proposalId);
    try {
      // 🔧 如果 accessToken 以 'dev-user-' 開頭（開發模式），需要包含 email
      let token = accessToken;
      if (accessToken.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }
      
      // 🔧 開發模式下使用 X-Dev-Token header，避免 Supabase Edge Functions 的 JWT 驗證
      const isDevMode = accessToken.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? { 
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        : { 'Authorization': `Bearer ${token}` };
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/proposals/${proposalId}/accept`,
        {
          method: 'POST',
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // 🔥 處理里程碑計劃未批准的錯誤
        if (errorData.error === 'milestone_plan_not_approved') {
          const userMessage = errorData.user_message?.[language] || errorData.user_message?.['zh-TW'] || errorData.message;
          
          toast.error(
            <div className="space-y-2">
              <div className="font-semibold">
                {language === 'en' ? '⚠️ Milestone Plan Required' : '⚠️ 需要里程碑計劃'}
              </div>
              <div className="text-sm">{userMessage}</div>
              <Button 
                size="sm" 
                className="w-full mt-2 bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  // 找到對應的提案並打開里程碑計劃審核對話框
                  const targetProposal = proposals.find(p => p.id === proposalId);
                  if (targetProposal) {
                    setSelectedProposal(targetProposal);
                    setShowPlanReview(true);
                  }
                }}
              >
                {language === 'en' ? '→ Review Milestone Plan' : '→ 審核里程碑計劃'}
              </Button>
            </div>,
            { duration: 8000 }
          );
          return;
        }
        
        // 🔥 處理託管未創建的錯誤（通常是餘額不足）
        if (errorData.error === 'escrow_not_created') {
          const userMessage = errorData.user_message?.[language] || errorData.user_message?.['zh-TW'] || errorData.message;
          
          toast.error(
            <div className="space-y-2">
              <div className="font-semibold">
                {language === 'en' ? '💰 Escrow Not Created' : '💰 託管未建立'}
              </div>
              <div className="text-sm">{userMessage}</div>
              <div className="flex gap-2 mt-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    // 跳轉到錢包充值
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'wallet' } }));
                    onOpenChange(false);
                  }}
                >
                  {language === 'en' ? '💳 Go to Wallet' : '💳 前往錢包'}
                </Button>
              </div>
            </div>,
            { duration: 10000 }
          );
          return;
        }
        
        // 🔥 處理餘額不足的錯誤（傳統託管流程）
        if (errorData.error === 'insufficient_balance') {
          const userMessage = errorData.user_message?.[language] || errorData.user_message?.['zh-TW'] || errorData.message;
          
          toast.error(
            <div className="space-y-2">
              <div className="font-semibold">
                {language === 'en' ? '💰 Insufficient Balance' : '💰 餘額不足'}
              </div>
              <div className="text-sm">{userMessage}</div>
              {errorData.required_amount && (
                <div className="text-xs mt-2 bg-white/20 p-2 rounded">
                  {language === 'en' 
                    ? `Required: ${formatCurrency(errorData.required_amount, errorData.currency, language)}`
                    : `需要金額：${formatCurrency(errorData.required_amount, errorData.currency, language)}`
                  }
                  <br />
                  {language === 'en'
                    ? `Available: ${formatCurrency(errorData.available_balance || 0, errorData.currency, language)}`
                    : `可用餘額：${formatCurrency(errorData.available_balance || 0, errorData.currency, language)}`
                  }
                  <br />
                  {language === 'en'
                    ? `Shortfall: ${formatCurrency(errorData.shortfall_amount, errorData.currency, language)}`
                    : `差額：${formatCurrency(errorData.shortfall_amount, errorData.currency, language)}`
                  }
                </div>
              )}
              <Button 
                size="sm" 
                className="w-full mt-2 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  // 跳轉到錢包充值
                  window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'wallet' } }));
                  onOpenChange(false);
                }}
              >
                {language === 'en' ? '💳 Go to Wallet to Deposit' : '💳 前往錢包充值'}
              </Button>
            </div>,
            { duration: 10000 }
          );
          return;
        }
        
        throw new Error(errorData.error || 'Failed to accept proposal');
      }

      toast.success(
        language === 'en' 
          ? 'Proposal accepted successfully!' 
          : '提案接受成功！'
      );

      // 清除選中的提案，避免自動開里程碑管理器
      setSelectedProposal(null);
      
      // 重新載入提案列表
      await loadProposals();

      // 通知父組件刷新項目列表
      if (onProposalAccepted) {
        onProposalAccepted();
      }
    } catch (error) {
      console.error('❌ [ProposalListDialog] Error accepting proposal:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to accept proposal' 
          : '接受提案失敗'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    if (!accessToken) return;

    setActionLoading(proposalId);
    try {
      // 🔧 如果 accessToken 以 'dev-user-' 開頭（開發模式），需要包含 email
      let token = accessToken;
      if (accessToken.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`; 
      }
      
      // 🔧 在開發模式下使用 X-Dev-Token header，避免 Supabase Edge Functions 的 JWT 驗證
      const isDevMode = accessToken.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? { 
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        : { 'Authorization': `Bearer ${token}` };
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/proposals/${proposalId}/reject`,
        {
          method: 'POST',
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject proposal');
      }

      toast.success(
        language === 'en' 
          ? 'Proposal rejected' 
          : '提案已拒絕'
      );

      // 重新載入提案列表
      await loadProposals();
    } catch (error) {
      console.error('❌ [ProposalListDialog] Error rejecting proposal:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to reject proposal' 
          : '拒絕提案失敗'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">{language === 'en' ? 'Accepted' : '已接受'}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">{language === 'en' ? 'Rejected' : '已拒絕'}</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">{language === 'en' ? 'Pending' : '待審核'}</Badge>;
    }
  };

  if (!project) return null;

  const t = {
    en: {
      title: 'Proposals',
      subtitle: 'Review and manage proposals for',
      noProposals: 'No proposals yet',
      noProposalsDesc: 'Freelancers haven\'t submitted any proposals for this project yet.',
      budget: 'Proposed Budget',
      deliveryTime: 'Delivery Time',
      coverLetter: 'Cover Letter',
      submittedOn: 'Submitted on',
      accept: 'Accept',
      reject: 'Reject',
      accepting: 'Accepting...',
      rejecting: 'Rejecting...',
      contactFreelancer: 'Contact Freelancer',
      manageMilestones: 'Manage Milestones',
    },
    zh: {
      title: '提案列表',
      subtitle: '審查並管理提案：',
      noProposals: '尚無提案',
      noProposalsDesc: '此項目尚未收到提案。',
      budget: '建議預算',
      delivery: '交付時間',
      days: '天',
      coverLetter: '求職信',
      accept: '接受',
      reject: '拒絕',
      accepting: '接受中...',
      rejecting: '拒絕中...',
      contactFreelancer: '聯繫接案者',
      manageMilestones: '管理里程碑',
    },
  };

  const text = language === 'en' ? t.en : t.zh;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{text.title}</DialogTitle>
            <DialogDescription>
              {text.subtitle} <span className="font-medium text-gray-900">{project.title}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : proposals.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{text.noProposals}</h3>
                <p className="text-gray-500">{text.noProposalsDesc}</p>
              </div>
            ) : (
              proposals.map((proposal) => (
                <Card key={proposal.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <User className="h-10 w-10 text-gray-400 bg-gray-100 rounded-full p-2" />
                        <div>
                          <CardTitle className="text-lg">
                            {proposal.freelancer_name || (language === 'en' ? 'Freelancer' : '接案者')}
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {text.submittedOn} {formatDate(proposal.created_at)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(proposal.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* 預算和交付時間 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">{text.budget}</p>
                          <p className="font-medium">
                            {formatCurrency(proposal.proposed_budget, proposal.currency || 'TWD')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">{text.deliveryTime}</p>
                          <p className="font-medium">{proposal.delivery_time}</p>
                        </div>
                      </div>
                    </div>

                    {/* 求職信 */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">{text.coverLetter}</p>
                      <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                        {proposal.cover_letter}
                      </p>
                    </div>

                    {/* 操作按鈕 */}
                    {proposal.status === 'pending' && (
                      <div className="space-y-3 pt-4 border-t">
                        {/* 🔥 第一行：審核里程碑計劃按鈕 - 紫色高亮 */}
                        <Button
                          onClick={() => {
                            setSelectedProposal(proposal);
                            setShowPlanReview(true);
                          }}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          {language === 'en' ? 'Review Milestone Plan' : '審核里程碑計劃'}
                        </Button>
                        
                        {/* 🔥 第二行：接受和拒絕按鈕 */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => handleAcceptProposal(proposal.id, proposal.freelancer_id)}
                            disabled={actionLoading === proposal.id}
                            className="w-full"
                          >
                            {actionLoading === proposal.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {text.accepting}
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {text.accept}
                              </>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => handleRejectProposal(proposal.id)}
                            disabled={actionLoading === proposal.id}
                            className="w-full"
                          >
                            {actionLoading === proposal.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {text.rejecting}
                              </>
                            ) : (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                {text.reject}
                              </>
                            )}
                          </Button>
                        </div>

                        {/* 🔥 第三行：聯繫接案者按鈕 */}
                        <StartConversationButton
                          recipientId={proposal.freelancer_id}
                          recipientType="freelancer"
                          projectId={project.id}
                          variant="outline"
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* 🔥 已接受的提案：顯示里程碑管理按鈕 */}
                    {proposal.status === 'accepted' && (
                      <div className="space-y-2 pt-2">
                        {/* 🔥 管理詳情按鈕 - 顯示概覽、消息、里程碑三個標籤 */}
                        <Button
                          onClick={() => {
                            setSelectedProposal(proposal);
                            setShowProposalDetail(true);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {language === 'en' ? 'Manage Details' : '管理詳情'}
                        </Button>
                        
                        <Button
                          onClick={() => {
                            setSelectedProposal(proposal);
                            setShowMilestoneManager(true);
                          }}
                          className="w-full"
                          variant="default"
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          {text.manageMilestones}
                        </Button>
                        
                        <StartConversationButton
                          recipientId={proposal.freelancer_id}
                          recipientType="freelancer"
                          projectId={project.id}
                          variant="outline"
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* 🔥 已拒絕的提案：也顯示聯繫按鈕 */}
                    {proposal.status === 'rejected' && (
                      <div className="pt-2">
                        <StartConversationButton
                          recipientId={proposal.freelancer_id}
                          recipientType="freelancer"
                          projectId={project.id}
                          variant="outline"
                          className="w-full"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 🔥 Milestone Manager Dialog - 獨立渲染在 ProposalListDialog 外部，避免對話框嵌套問題 */}
      {selectedProposal && (
        <MilestoneManager
            proposalId={selectedProposal.id}
            userRole="client"
            open={showMilestoneManager}
            onOpenChange={setShowMilestoneManager}
            proposalCurrency={selectedProposal.currency || 'TWD'}
          />
      )}
      
      {/* 🔥 Milestone Plan Review Dialog - 獨立渲染在 ProposalListDialog 外部，避免對話框嵌套問題 */}
      {selectedProposal && (
        <MilestonePlanReview
          proposalId={selectedProposal.id}
          projectTitle={project?.title || ''}
          freelancerName={selectedProposal.freelancer_name || 'Unknown'}
          freelancerId={selectedProposal.freelancer_id}
          open={showPlanReview}
          onOpenChange={setShowPlanReview}
          onRevisionRequested={() => {
            // 🔥 Client 要求修改後，重新加載提案列表
            loadProposals();
          }}
        />
      )}
      
      {/* 🔥 Accepted Proposal Detail Dialog - 顯示概覽、消息、里程碑三個標籤 */}
      {selectedProposal && (
        <AcceptedProposalDialog
          proposal={{
            ...selectedProposal,
            project_title: project?.title,
          }}
          open={showProposalDetail}
          onOpenChange={setShowProposalDetail}
        />
      )}
    </>
  );
}