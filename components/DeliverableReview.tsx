import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { FileText, Download, CheckCircle2, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DeliverableReviewProps {
  projectId: string;
  onReviewComplete?: () => void;
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

interface DeliverableFile {
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  download_url?: string;
  signed_url?: string; // Backend uses this field name
}

interface Deliverable {
  id: string;
  project_id: string;
  freelancer_id: string;
  description: string;
  files: DeliverableFile[];
  status: 'pending_review' | 'approved' | 'revision_requested';
  submitted_at: string;
  reviewed_at: string | null;
  review_feedback: string | null;
  feedback?: string; // Alternative field name from backend
}

export function DeliverableReview({ 
  projectId: projectIdProp, 
  onReviewComplete,
  language = 'en' 
}: DeliverableReviewProps) {
  const { accessToken, user } = useAuth();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const translations = {
    en: {
      title: 'Review Deliverables',
      noDeliverables: 'No deliverables submitted yet',
      description: 'Description',
      noDescription: 'No description provided',
      files: 'Files',
      status: {
        pending_review: 'Pending Review',
        approved: 'Approved',
        revision_requested: 'Revision Requested',
      },
      submittedAt: 'Submitted',
      reviewedAt: 'Reviewed',
      feedback: 'Feedback',
      noFeedback: 'No feedback provided',
      provideFeedback: 'Provide Feedback (optional)',
      feedbackPlaceholder: 'Provide feedback or request specific changes...',
      approve: 'Approve',
      requestRevision: 'Request Revision',
      download: 'Download',
      approving: 'Approving...',
      requesting: 'Requesting...',
      approveSuccess: 'Deliverable approved successfully!',
      revisionSuccess: 'Revision requested successfully! The freelancer will be notified.',
      error: 'Failed to review deliverable',
      loadError: 'Failed to load deliverables',
      reviewActions: 'Review Actions',
      cancel: 'Cancel',
    },
    zh: {
      title: '審核交付物',
      noDeliverables: '尚未提交交付物',
      description: '描述',
      noDescription: '未提供描述',
      files: '文件',
      status: {
        pending_review: '待審核',
        approved: '已批准',
        revision_requested: '要求修改',
      },
      submittedAt: '提交時間',
      reviewedAt: '審核時間',
      feedback: '反饋',
      noFeedback: '未提供反饋',
      provideFeedback: '提供反饋（可選）',
      feedbackPlaceholder: '提供反饋或要求具體修改...',
      approve: '批准',
      requestRevision: '要求修改',
      download: '下載',
      approving: '批准中...',
      requesting: '請求中...',
      approveSuccess: '交付物已成功批准！',
      revisionSuccess: '已成功請求修改！接案者將收到通知。',
      error: '審核交付物失敗',
      loadError: '加載交付物失敗',
      reviewActions: '審核操作',
      cancel: '取消',
    },
    'zh-TW': {
      title: '審核交付物',
      noDeliverables: '尚未提交交付物',
      description: '描述',
      noDescription: '未提供描述',
      files: '文件',
      status: {
        pending_review: '待審核',
        approved: '已批准',
        revision_requested: '要求修改',
      },
      submittedAt: '提交時間',
      reviewedAt: '審核時',
      feedback: '反饋',
      noFeedback: '未提供反饋',
      provideFeedback: '提供反饋（可選）',
      feedbackPlaceholder: '提供反饋或要求具體修改...',
      approve: '批准',
      requestRevision: '要求修改',
      download: '下載',
      approving: '批准中...',
      requesting: '請求中...',
      approveSuccess: '交付物已成功批准！',
      revisionSuccess: '已成功請求修改！接案者將收到通知。',
      error: '審核交付物失敗',
      loadError: '加載交付物失敗',
      reviewActions: '審核操作',
      cancel: '取消',
    },
    'zh-CN': {
      title: '审核交付物',
      noDeliverables: '尚未提交交付物',
      description: '描述',
      noDescription: '未提供描述',
      files: '文件',
      status: {
        pending_review: '待审核',
        approved: '已批准',
        revision_requested: '要求修改',
      },
      submittedAt: '提交时间',
      reviewedAt: '审核时间',
      feedback: '反馈',
      noFeedback: '未提供反馈',
      provideFeedback: '提供反馈（可选）',
      feedbackPlaceholder: '提供反馈或要求具体修改...',
      approve: '批准',
      requestRevision: '要求修改',
      download: '下载',
      approving: '批准中...',
      requesting: '请求中...',
      approveSuccess: '交付物��成功批准！',
      revisionSuccess: '已成功请求修改！接案者将收到通知。',
      error: '审核交付物失败',
      loadError: '加载交付物失败',
      reviewActions: '审核操作',
      cancel: '取消',
    },
  };

  const t = translations[language];

  useEffect(() => {
    fetchDeliverables();
  }, [projectIdProp]);

  const fetchDeliverables = async () => {
    try {
      console.log('Fetching deliverables for project:', projectIdProp);
      
      // 🔧 開發模式：處理 dev-user- token
      let token = accessToken;
      if (accessToken?.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }
      
      const isDevMode = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? { 
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        : { 'Authorization': `Bearer ${token}` };
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables/project/${projectIdProp}`,
        { headers }
      );

      console.log('Deliverables response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [DeliverableReview] Fetch error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          projectId: projectIdProp,
        });
        throw new Error(errorData.error || 'Failed to fetch deliverables');
      }

      const data = await response.json();
      console.log('Deliverables data received:', data);
      setDeliverables(data.deliverables || []);
    } catch (error) {
      console.error('Fetch deliverables error:', error);
      toast.error(t.loadError);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (deliverableId: string) => {
    setActionLoading(true);
    try {
      // 🔧 開發模式：處理 dev-user- token
      let token = accessToken;
      if (accessToken?.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }
      
      const isDevMode = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? { 
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        : { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables/${deliverableId}/review`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'approve',
            feedback,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve');
      }

      toast.success(t.approveSuccess);
      setFeedback('');
      setReviewingId(null);
      
      // Refresh deliverables
      await fetchDeliverables();
      
      if (onReviewComplete) {
        onReviewComplete();
      }
    } catch (error: any) {
      console.error('Approve error:', error);
      toast.error(`${t.error}: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async (deliverableId: string) => {
    if (!feedback.trim()) {
      toast.error(language === 'en' 
        ? 'Please provide feedback for the revision request' 
        : '請為修改請求提供反饋');
      return;
    }

    setActionLoading(true);
    try {
      // 🔧 開發模式：處理 dev-user- token
      let token = accessToken;
      if (accessToken?.startsWith('dev-user-') && user?.email && !accessToken.includes('||')) {
        token = `${accessToken}||${user.email}`;
      }
      
      const isDevMode = accessToken?.startsWith('dev-user-');
      const headers: Record<string, string> = isDevMode
        ? { 
            'X-Dev-Token': token,
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        : { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables/${deliverableId}/review`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'request_revision',
            feedback,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request revision');
      }

      toast.success(t.revisionSuccess);
      setFeedback('');
      setReviewingId(null);
      
      // Refresh deliverables
      await fetchDeliverables();
      
      if (onReviewComplete) {
        onReviewComplete();
      }
    } catch (error: any) {
      console.error('Request revision error:', error);
      toast.error(`${t.error}: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: Deliverable['status']) => {
    const variants = {
      pending_review: { variant: 'default' as const, icon: Clock, color: 'text-yellow-600' },
      approved: { variant: 'default' as const, icon: CheckCircle2, color: 'text-green-600' },
      revision_requested: { variant: 'default' as const, icon: AlertCircle, color: 'text-orange-600' },
    };

    const { icon: Icon, color } = variants[status];
    return (
      <Badge className="flex items-center gap-1">
        <Icon className={`size-3 ${color}`} />
        {t.status[status]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (deliverables.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="size-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">{t.noDeliverables}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2">{t.title}</h3>
        <p className="text-muted-foreground">
          {language === 'en' 
            ? 'Review submitted work and approve or request revisions.' 
            : '審核提交的工作，批准或要求修改。'}
        </p>
      </div>

      {deliverables.map((deliverable) => (
        <Card key={deliverable.id} className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t.submittedAt}: {formatDate(deliverable.submitted_at)}
                </p>
                {deliverable.reviewed_at && (
                  <p className="text-sm text-muted-foreground">
                    {t.reviewedAt}: {formatDate(deliverable.reviewed_at)}
                  </p>
                )}
              </div>
              {getStatusBadge(deliverable.status)}
            </div>

            {/* Description */}
            {deliverable.description && (
              <div>
                <label className="block mb-1 text-sm">{t.description}</label>
                <p className="text-muted-foreground">{deliverable.description}</p>
              </div>
            )}

            {/* Files */}
            <div>
              <label className="block mb-2 text-sm">{t.files}</label>
              <div className="space-y-2">
                {deliverable.files.map((file, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="size-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{file.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.file_size)}
                          </p>
                        </div>
                      </div>
                      {(file.download_url || file.signed_url) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a 
                            href={file.download_url || file.signed_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            download
                          >
                            <Download className="size-4 mr-2" />
                            {t.download}
                          </a>
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Previous Feedback */}
            {deliverable.review_feedback && (
              <div>
                <label className="block mb-1 text-sm">{t.feedback}</label>
                <Card className="p-3 bg-muted">
                  <p className="text-sm">{deliverable.review_feedback}</p>
                </Card>
              </div>
            )}

            {/* Review Actions - Only for pending deliverables */}
            {deliverable.status === 'pending_review' && (
              <div className="space-y-3 pt-3 border-t">
                {reviewingId === deliverable.id ? (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm">{t.provideFeedback}</label>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder={t.feedbackPlaceholder}
                        rows={3}
                        className={!feedback.trim() ? 'border-orange-300' : ''}
                      />
                      {!feedback.trim() && (
                        <p className="text-xs text-orange-600 flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          {language === 'en' 
                            ? 'Feedback is required when requesting a revision' 
                            : '請求修改時必須提供反饋'}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(deliverable.id)}
                        disabled={actionLoading}
                        className="flex-1"
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            {t.approving}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="size-4 mr-2" />
                            {t.approve}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleRequestRevision(deliverable.id)}
                        disabled={actionLoading}
                        variant="outline"
                        className="flex-1"
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            {t.requesting}
                          </>
                        ) : (
                          <>
                            <XCircle className="size-4 mr-2" />
                            {t.requestRevision}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setReviewingId(null);
                          setFeedback('');
                        }}
                        variant="ghost"
                      >
                        {t.cancel}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    onClick={() => setReviewingId(deliverable.id)}
                    className="w-full"
                    variant="outline"
                  >
                    {t.reviewActions}
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}