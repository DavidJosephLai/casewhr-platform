import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  DollarSign, 
  Calendar,
  Upload,
  Eye,
  AlertCircle
} from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { formatCurrencyAuto, type Currency } from "../lib/currency";
import { projectId, publicAnonKey } from "../utils/supabase/info";

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
  escrow_id?: string;
}

interface MilestoneProgressProps {
  projectId: string;
  proposalId: string;
  milestones: Milestone[];
  currency?: Currency;
  isFreelancer?: boolean;
  onRefresh?: () => void;
}

export function MilestoneProgress({ 
  projectId: projId,
  proposalId,
  milestones, 
  currency = 'TWD',
  isFreelancer = false,
  onRefresh
}: MilestoneProgressProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);

  const translations = {
    en: {
      title: "Milestone Progress",
      overallProgress: "Overall Progress",
      completed: "Completed",
      inProgress: "In Progress",
      pending: "Pending",
      submitted: "Submitted",
      approved: "Approved",
      rejected: "Rejected",
      amount: "Amount",
      duration: "Duration",
      days: "days",
      deliverables: "Deliverables",
      startWork: "Start Work",
      submitWork: "Submit Work",
      viewSubmission: "View Submission",
      approve: "Approve & Release Payment",
      reject: "Request Changes",
      escrowStatus: "Payment Status",
      locked: "Locked in Escrow",
      released: "Payment Released",
      notCreated: "Not Created",
    },
    zh: {
      title: "里程碑進度",
      overallProgress: "整體進度",
      completed: "已完成",
      inProgress: "進行中",
      pending: "待開始",
      submitted: "已提交",
      approved: "已批准",
      rejected: "需修改",
      amount: "金額",
      duration: "工期",
      days: "天",
      deliverables: "交付物",
      startWork: "開始工作",
      submitWork: "提交工作",
      viewSubmission: "查看提交",
      approve: "批准並釋放款項",
      reject: "要求修改",
      escrowStatus: "付款狀態",
      locked: "托管中",
      released: "已釋放",
      notCreated: "未創建",
    }
  };

  const t = translations[language];

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
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: t.rejected,
      },
    };
    return configs[status];
  };

  // Calculate overall progress
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'approved').length;
  const progressPercentage = totalMilestones > 0 
    ? (completedMilestones / totalMilestones) * 100 
    : 0;
  
  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const releasedAmount = milestones
    .filter(m => m.status === 'approved')
    .reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header & Overall Progress */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="text-lg font-semibold mb-4">{t.title}</h3>
        
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>{t.overallProgress}</span>
              <span className="font-semibold">{completedMilestones} / {totalMilestones}</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-xs text-gray-600 mt-1">{progressPercentage.toFixed(0)}% {t.completed}</p>
          </div>

          {/* Amount Summary */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-200">
            <div>
              <p className="text-xs text-gray-600">{language === 'en' ? 'Total Value' : '總金額'}</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrencyAuto(totalAmount, currency, language)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">{language === 'en' ? 'Released' : '已釋放'}</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrencyAuto(releasedAmount, currency, language)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Milestones List */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const config = getStatusConfig(milestone.status);
          const StatusIcon = config.icon;
          const isActive = milestone.status === 'in_progress' || milestone.status === 'submitted';

          return (
            <Card 
              key={milestone.id} 
              className={`p-6 border-2 transition-all ${
                isActive ? config.borderColor + ' shadow-md' : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <StatusIcon className={`h-6 w-6 ${config.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {language === 'en' ? 'Milestone' : '里程碑'} {milestone.order}
                      </Badge>
                      <Badge className={config.color + ' border-0'}>
                        {config.label}
                      </Badge>
                    </div>
                    <h4 className="font-semibold mt-1">{milestone.title}</h4>
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatCurrencyAuto(milestone.amount, currency, language)}</p>
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

              {/* Escrow Status */}
              {milestone.escrow_id && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">{t.escrowStatus}:</span>
                    <span className={milestone.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}>
                      {milestone.status === 'approved' ? t.released : t.locked}
                    </span>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 mb-4">
                {milestone.started_at && (
                  <div>
                    <p className="font-medium">{language === 'en' ? 'Started' : '開始'}</p>
                    <p>{new Date(milestone.started_at).toLocaleDateString()}</p>
                  </div>
                )}
                {milestone.submitted_at && (
                  <div>
                    <p className="font-medium">{language === 'en' ? 'Submitted' : '提交'}</p>
                    <p>{new Date(milestone.submitted_at).toLocaleDateString()}</p>
                  </div>
                )}
                {milestone.approved_at && (
                  <div>
                    <p className="font-medium">{language === 'en' ? 'Approved' : '批准'}</p>
                    <p>{new Date(milestone.approved_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {isFreelancer ? (
                  <>
                    {milestone.status === 'pending' && (
                      <Button size="sm" className="w-full">
                        <Clock className="h-4 w-4 mr-2" />
                        {t.startWork}
                      </Button>
                    )}
                    {milestone.status === 'in_progress' && (
                      <Button size="sm" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        {t.submitWork}
                      </Button>
                    )}
                    {milestone.status === 'submitted' && (
                      <Badge variant="outline" className="w-full justify-center py-2">
                        <Clock className="h-4 w-4 mr-2" />
                        {language === 'en' ? 'Awaiting Client Review' : '等待客戶審核'}
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    {milestone.status === 'submitted' && (
                      <>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          {t.viewSubmission}
                        </Button>
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {t.approve}
                        </Button>
                      </>
                    )}
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
    </div>
  );
}
