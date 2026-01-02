import { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { proposalApi } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Loader2, FileText, Clock, DollarSign, CheckCircle, XCircle, AlertCircle, Edit } from "lucide-react";
import { formatCurrency } from "../lib/currency";
import type { Currency } from "../lib/currency";
import { MilestoneManager } from "./MilestoneManager";

interface Proposal {
  id: string;
  project_id: string;
  project_title?: string;
  cover_letter: string;
  proposed_budget: number;
  currency: Currency;
  delivery_time: string;
  status: 'pending' | 'accepted' | 'rejected' | 'revision_requested'; // 🔥 添加 revision_requested 狀態
  created_at: string;
  milestones?: any[];
  milestone_plan_status?: 'not_submitted' | 'submitted' | 'revision_requested' | 'approved' | 'resubmitted';
}

export function MyProposals() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showMilestoneManager, setShowMilestoneManager] = useState(false);

  useEffect(() => {
    if (user?.id && accessToken) {
      loadProposals();
    }
  }, [user?.id, accessToken]);

  const loadProposals = async () => {
    if (!user?.id || !accessToken) return;

    try {
      setLoading(true);
      
      const data = await proposalApi.getByUser(user.id, accessToken);
      
      setProposals(data.proposals || []);
    } catch (error) {
      console.error('❌ [MyProposals] Failed to load proposals:', error);
      console.error('❌ [MyProposals] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown',
        userId: user.id,
        hasToken: !!accessToken
      });
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            {language === 'en' ? 'Accepted' : language === 'zh-CN' ? '已接受' : '已接受'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            {language === 'en' ? 'Rejected' : language === 'zh-CN' ? '已拒���' : '已拒絕'}
          </Badge>
        );
      case 'revision_requested':
        return (
          <Badge className="bg-orange-500 text-white">
            <AlertCircle className="h-3 w-3 mr-1" />
            {language === 'en' ? 'Revision Requested' : language === 'zh-CN' ? '请求修订' : '請求修訂'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500 text-white">
            <AlertCircle className="h-3 w-3 mr-1" />
            {language === 'en' ? 'Pending' : language === 'zh-CN' ? '待审核' : '待審核'}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {language === 'en' 
              ? 'You haven\'t submitted any proposals yet.' 
              : language === 'zh-CN'
              ? '您还没有提交任何提案。'
              : '您還沒有提交任何提案。'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium">
            {language === 'en' ? 'My Proposals' : language === 'zh-CN' ? '我的提案' : '我的提案'}
          </h3>
          <p className="text-sm text-gray-500">
            {language === 'en' 
              ? `You have submitted ${proposals.length} proposal${proposals.length > 1 ? 's' : ''}` 
              : language === 'zh-CN'
              ? `您已提交 ${proposals.length} 个提案`
              : `您已提交 ${proposals.length} 個提案`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadProposals}
        >
          {language === 'en' ? '🔄 Refresh' : '🔄 重新整理'}
        </Button>
      </div>

      <div className="grid gap-4">
        {proposals.map((proposal) => {
          return (
            <Card key={proposal.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {proposal.project_title || (language === 'en' ? 'Project' : language === 'zh-CN' ? '项目' : '專案')}
                    </CardTitle>
                    {getStatusBadge(proposal.status)}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-lg font-semibold text-blue-600">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(proposal.proposed_budget, proposal.currency)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {language === 'en' ? 'Cover Letter:' : language === 'zh-CN' ? '求职信：' : '求職信：'}
                    </p>
                    <p className="text-sm text-gray-800 line-clamp-3">
                      {proposal.cover_letter}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {language === 'en' ? 'Delivery:' : language === 'zh-CN' ? '交付时间：' : '交付時間：'}
                      <span className="font-medium">{proposal.delivery_time}</span>
                    </div>
                    
                    {proposal.milestones && proposal.milestones.length > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {proposal.milestones.length} {language === 'en' ? 'milestones' : language === 'zh-CN' ? '个里程碑' : '個里程碑'}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    {language === 'en' ? 'Submitted:' : language === 'zh-CN' ? '提交时间：' : '提交時間：'}
                    {' '}
                    {new Date(proposal.created_at).toLocaleDateString(
                      language === 'en' ? 'en-US' : language === 'zh-CN' ? 'zh-CN' : 'zh-TW',
                      { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                    )}
                  </div>

                  {/* 🔥 提案修改按鈕 - 當 status === 'revision_requested' ��顯示紅色 */}
                  {proposal.status === 'revision_requested' && (
                    <div className="pt-3 border-t">
                      <Button
                        onClick={() => {
                          // TODO: 打開提案編輯對話框
                          alert('提案編輯功能開發中...');
                        }}
                        className="w-full"
                        variant="destructive"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {language === 'en' ? 'Revise & Re-edit Proposal' : language === 'zh-CN' ? '修改-重新编辑提案' : '修改-重新編輯提案'}
                      </Button>
                    </div>
                  )}

                  {/* 里程碑管理按鈕 - 僅在提案被接受後顯示 */}
                  {(proposal.status === 'accepted' || proposal.milestone_plan_status) && (
                    <div className="pt-3 border-t">
                      <Button
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setShowMilestoneManager(true);
                        }}
                        className="w-full"
                        variant={
                          proposal.milestone_plan_status === 'revision_requested' || 
                          proposal.milestone_plan_status === 'resubmitted' 
                            ? 'destructive' 
                            : 'default'
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {proposal.milestone_plan_status === 'revision_requested' || proposal.milestone_plan_status === 'resubmitted'
                          ? (language === 'en' ? 'Revise & Re-edit' : language === 'zh-CN' ? '修改-重新编辑' : '修改-重新編輯')
                          : proposal.milestone_plan_status === 'submitted'
                          ? (language === 'en' ? 'View Milestones (Under Review)' : '查看里程碑（審核中）')
                          : proposal.milestone_plan_status === 'approved'
                          ? (language === 'en' ? 'View Milestones (Approved)' : '查看里程碑（已批准）')
                          : (language === 'en' ? 'Create Milestone Plan' : '創建里程碑計劃')
                        }
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 里程碑管理器對話框 */}
      {selectedProposal && (
        <MilestoneManager
          proposalId={selectedProposal.id}
          userRole="freelancer"
          open={showMilestoneManager}
          onOpenChange={setShowMilestoneManager}
          proposalCurrency={selectedProposal.currency || 'TWD'}
        />
      )}
    </div>
  );
}