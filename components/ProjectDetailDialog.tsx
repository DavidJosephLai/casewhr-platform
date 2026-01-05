import {
  FileText,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  Tag,
  User,
  Mail,
  MessageCircle,
} from "lucide-react";
import { projectId } from "../utils/supabase/info";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useState } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getTranslation } from "../lib/translations";
import { formatCurrency, formatCurrencyRange, Currency, getDefaultCurrency, convertCurrency } from "../lib/currency";
import { ProposalForm } from "./ProposalForm";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  budget_type: "fixed" | "hourly";
  currency?: Currency;
  deadline: string | null;
  required_skills: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  client_id: string;
  client_name: string;
  client_email: string;
  proposal_count: number;
  created_at: string;
  updated_at: string;
}

interface ProjectDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProjectDetailDialog({
  open,
  onOpenChange,
  project,
  onEdit,
  onDelete,
}: ProjectDetailDialogProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const t = getTranslation(language as any).projects;
  const [isContactingClient, setIsContactingClient] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false); // ✅ 新增提案對話框狀態

  if (!project) return null;

  const isOwner = user?.id === project.client_id;

  // Contact client function
  const handleContactClient = async () => {
    if (!user || !accessToken) {
      alert(language === 'en' ? 'Please login to contact the client' : '請登入後聯繫案主');
      return;
    }

    if (isOwner) {
      alert(language === 'en' ? 'You cannot contact yourself' : '您不能聯繫自己');
      return;
    }

    setIsContactingClient(true);

    try {
      // Check if conversation already exists
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/conversations`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      const existingConversation = data.conversations?.find((conv: any) =>
        conv.participants.some((p: any) => p.id === project.client_id)
      );

      if (existingConversation) {
        // Navigate to existing conversation
        onOpenChange(false);
        navigate(`/messages?conversation=${existingConversation.id}`);
      } else {
        // Create new conversation
        // Current user is freelancer, project owner is client
        const createResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/conversations`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientId: project.client_id,
              freelancerId: user.id,
              projectId: project.id,
            }),
          }
        );

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || 'Failed to create conversation');
        }

        const newConversation = await createResponse.json();
        onOpenChange(false);
        navigate(`/messages?conversation=${newConversation.conversation.id}`);
      }
    } catch (error: any) {
      console.error('❌ Error contacting client:', error);
      alert(
        language === 'en'
          ? `Failed to contact client: ${error.message}`
          : `聯繫案主失敗：${error.message}`
      );
    } finally {
      setIsContactingClient(false);
    }
  };

  const formatBudget = (project: Project) => {
    
    // ⭐ 項目存儲的貨幣（預設 TWD，符合系統規範）
    const storedCurrency = project.currency || 'TWD';
    // 根據語言決定顯示貨幣：中文顯示 TWD，英文顯示 USD
    const displayCurrency = getDefaultCurrency(language);
    
    // 轉換金額
    const minAmount = storedCurrency === displayCurrency 
      ? project.budget_min 
      : convertCurrency(project.budget_min, storedCurrency, displayCurrency);
    const maxAmount = storedCurrency === displayCurrency 
      ? project.budget_max 
      : convertCurrency(project.budget_max, storedCurrency, displayCurrency);
    
    if (project.budget_type === 'hourly') {
      return `${formatCurrency(minAmount, displayCurrency)} - ${formatCurrency(maxAmount, displayCurrency)}/hr`;
    }
    
    return formatCurrencyRange(minAmount, maxAmount, displayCurrency);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDeadline = () => {
    if (!project.deadline) {
      return language === 'en' ? 'Flexible' : '靈活';
    }
    
    const date = new Date(project.deadline);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = () => {
    switch (project.status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const skills = project.required_skills
    ? project.required_skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="flex-1">{project.title}</DialogTitle>
            <Badge className={getStatusColor()}>
              {t.statuses[project.status]}
            </Badge>
          </div>
          <DialogDescription className="sr-only">
            {language === 'en' ? 'Project details and information' : '專案詳情與資訊'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h4>{t.detail.description}</h4>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
          </div>

          <Separator />

          {/* Project Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">{t.detail.category}</p>
                <p className="text-gray-900">{project.category}</p>
              </div>
            </div>

            {/* Budget */}
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">{t.detail.budget}</p>
                <p className="text-gray-900">{formatBudget(project)}</p>
                <p className="text-xs text-gray-500">{t.budgetTypes[project.budget_type]}</p>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">{t.detail.deadline}</p>
                <p className="text-gray-900">{formatDeadline()}</p>
              </div>
            </div>

            {/* Posted Date */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">{t.detail.postedOn}</p>
                <p className="text-gray-900">{formatDate(project.created_at)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Required Skills */}
          {skills.length > 0 && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-5 w-5 text-blue-600" />
                  <h4>{t.detail.requiredSkills}</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Client Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-blue-600" />
              <h4>{t.detail.postedBy}</h4>
            </div>
            <div className="space-y-2">
              <p className="text-gray-900">{project.client_name || language === 'en' ? 'Anonymous' : '匿名'}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{project.client_email}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              {project.proposal_count} {language === 'en' ? 'proposals received' : '份提案'}
            </div>
            <div className="flex gap-2">
              {isOwner ? (
                <>
                  {onEdit && (
                    <Button onClick={onEdit} variant="outline">
                      {t.detail.editProject}
                    </Button>
                  )}
                  {onDelete && (
                    <Button onClick={onDelete} variant="destructive">
                      {t.detail.deleteProject}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {user ? (
                    <>
                      <Button 
                        onClick={handleContactClient} 
                        variant="outline" 
                        disabled={isContactingClient}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {isContactingClient 
                          ? (language === 'en' ? 'Contacting...' : '聯繫中...') 
                          : (language === 'en' ? 'Contact Client' : '聯繫案主')
                        }
                      </Button>
                      <Button onClick={() => setProposalDialogOpen(true)}>
                        {t.detail.applyButton}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => alert(language === 'en' ? 'Please login to apply' : '請登入後申請')}>
                      {t.detail.applyButton}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* ✅ 提案表單對話框 */}
      {user && project && (
        <ProposalForm
          open={proposalDialogOpen}
          onOpenChange={setProposalDialogOpen}
          project={project}
          onSubmitted={() => {
            setProposalDialogOpen(false);
            // 可選：刷新項目數據
          }}
        />
      )}
    </Dialog>
  );
}