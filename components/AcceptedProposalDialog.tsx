import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { formatCurrency } from '../lib/currency';
import { StartConversationButton } from './StartConversationButton';
import { MilestoneManagement } from './MilestoneManagement';
import { toast } from 'sonner';

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'revision_requested';
  order: number; // 🔥 修复：使用 order 而不是 order_index，与后端一致
  created_at: string;
}

interface Proposal {
  id: string;
  project_id: string;
  project_title?: string;
  freelancer_id: string;
  freelancer_name?: string;
  client_id?: string; // 🔥 新增：案主 ID
  proposed_budget: number;
  delivery_time: string;
  cover_letter: string;
  status: string;
  created_at: string;
  currency?: string;
}

interface AcceptedProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: Proposal | null;
}

export function AcceptedProposalDialog({ open, onOpenChange, proposal }: AcceptedProposalDialogProps) {
  const { language } = useLanguage();
  const { accessToken, user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (open && proposal?.id) {
      console.log('🔥 [AcceptedProposalDialog] useEffect triggered:', {
        open,
        proposalId: proposal.id,
        freelancerName: proposal.freelancer_name,
        freelancerId: proposal.freelancer_id,
        projectTitle: proposal.project_title,
        fullProposal: JSON.stringify(proposal, null, 2),
      });
      loadMilestones();
    }
  }, [open, proposal?.id]);

  const loadMilestones = async () => {
    if (!proposal || !accessToken) {
      console.log('❌ [AcceptedProposalDialog] Cannot load milestones:', {
        hasProposal: !!proposal,
        hasAccessToken: !!accessToken,
      });
      return;
    }

    console.log('🔄 [AcceptedProposalDialog] Loading milestones...', {
      proposalId: proposal.id,
      tokenPreview: accessToken.substring(0, 30),
    });

    setLoading(true);
    try {
      // 🔧 開發模式支援
      let token = accessToken;
      if (accessToken.startsWith('dev-user-')) {
        token = `${accessToken}`;
        console.log('🧪 [AcceptedProposalDialog] Dev mode detected');
      }
      
      const isDevMode = accessToken.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? { 
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        : { 'Authorization': `Bearer ${token}` };
      
      console.log('📡 [AcceptedProposalDialog] Request headers:', isDevMode ? 'X-Dev-Token' : 'Authorization');

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/milestones/proposal/${proposal.id}`;
      console.log('📡 [AcceptedProposalDialog] Fetching from:', url);

      const response = await fetch(url, { headers });
      
      console.log('📡 [AcceptedProposalDialog] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [AcceptedProposalDialog] Error response:', errorData);
        throw new Error(errorData.error || 'Failed to load milestones');
      }

      const data = await response.json();
      console.log('✅ [AcceptedProposalDialog] Milestones loaded:', {
        count: data.milestones?.length || 0,
        milestones: data.milestones,
      });
      
      setMilestones(data.milestones || []);
    } catch (error) {
      console.error('❌ [AcceptedProposalDialog] Error loading milestones:', error);
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            {language === 'en' ? 'Approved' : '已批准'}
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-blue-500 text-white">
            <AlertCircle className="h-3 w-3 mr-1" />
            {language === 'en' ? 'Submitted' : '已提交'}
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            {language === 'en' ? 'In Progress' : '進行中'}
          </Badge>
        );
      case 'revision_requested':
        return (
          <Badge className="bg-orange-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            {language === 'en' ? 'Revision' : '需修改'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-400 text-white">
            {language === 'en' ? 'Pending' : '待處理'}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!proposal) return null;

  const t = {
    en: {
      title: 'Proposal Details',
      tabs: {
        overview: 'Overview',
        messages: 'Messages',
        milestones: 'Milestones',
      },
      overview: {
        budget: 'Proposed Budget',
        delivery: 'Delivery Time',
        submittedOn: 'Submitted On',
        coverLetter: 'Cover Letter',
        freelancer: 'Freelancer',
      },
      milestones: {
        title: 'Milestones',
        noMilestones: 'No milestones yet',
        noMilestonesDesc: 'The freelancer hasn\'t created any milestones for this proposal yet.',
        total: 'Total',
        status: 'Status',
      },
      messages: {
        title: 'Messages',
        noMessages: 'No messages',
        noMessagesDesc: 'Start a conversation with the freelancer.',
        contactFreelancer: 'Contact Freelancer',
      },
    },
    zh: {
      title: '提案詳情',
      tabs: {
        overview: '概覽',
        messages: '消息',
        milestones: '里程碑',
      },
      overview: {
        budget: '建議預算',
        delivery: '交付時間',
        submittedOn: '提交於',
        coverLetter: '求職信',
        freelancer: '接案者',
      },
      milestones: {
        title: '里程碑',
        noMilestones: '暫無里程碑',
        noMilestonesDesc: '此提案尚未創建里程碑。',
        total: '總計',
        status: '狀態',
      },
      messages: {
        title: '消息',
        noMessages: '暫無評論',
        noMessagesDesc: '與接案者開始對話。',
        contactFreelancer: '聯繫接案者',
      },
    },
  };

  const text = language === 'en' ? t.en : t.zh;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{proposal.project_title || text.title}</DialogTitle>
          <DialogDescription>
            {language === 'en' 
              ? 'View proposal details, milestones, and communicate with the freelancer.' 
              : '查看提案詳情、里程碑，並與接案者溝通。'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{text.tabs.overview}</TabsTrigger>
            <TabsTrigger value="messages">{text.tabs.messages}</TabsTrigger>
            <TabsTrigger value="milestones">{text.tabs.milestones}</TabsTrigger>
          </TabsList>

          {/* 概覽標籤 */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{text.overview.freelancer}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">
                  {proposal.freelancer_name || (language === 'en' ? 'Freelancer' : '接案者')}
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {text.overview.budget}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold text-green-600">
                    {formatCurrency(proposal.proposed_budget, proposal.currency || 'TWD')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {text.overview.delivery}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold text-blue-600">
                    {proposal.delivery_time}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {text.overview.submittedOn}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{formatDate(proposal.created_at)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{text.overview.coverLetter}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-700">{proposal.cover_letter}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 消息標籤 */}
          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{text.messages.noMessages}</h3>
                <p className="text-gray-500 mb-6">{text.messages.noMessagesDesc}</p>
                <StartConversationButton
                  recipientId={proposal.freelancer_id}
                  recipientType="freelancer"
                  projectId={proposal.project_id}
                  variant="default"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 里程碑標籤 */}
          <TabsContent value="milestones" className="mt-6">
            <MilestoneManagement
              proposal={{
                id: proposal.id,
                project_id: proposal.project_id,
                freelancer_id: proposal.freelancer_id,
                client_id: proposal.client_id || '', // 🔥 從 proposal 中獲取 client_id
                proposed_budget: proposal.proposed_budget,
                currency: proposal.currency || 'TWD',
                status: proposal.status,
              }}
              isFreelancer={user?.id === proposal.freelancer_id}
              onUpdate={loadMilestones}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}