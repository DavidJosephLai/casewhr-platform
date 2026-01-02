import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle, Clock, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DeliverableSubmitProps {
  projectId: string;
  onSubmitSuccess?: () => void;
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

interface UploadedFile {
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded: boolean;
}

interface DeliverableFile {
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  download_url?: string;
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
  feedback: string | null;
}

export function DeliverableSubmit({ 
  projectId: projectIdProp, 
  onSubmitSuccess,
  language = 'en' 
}: DeliverableSubmitProps) {
  const { accessToken } = useAuth();
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);

  const translations = {
    en: {
      title: 'Submit Deliverables',
      description: 'Description (optional)',
      descriptionPlaceholder: 'Describe what you have completed...',
      uploadFiles: 'Upload Files',
      dragDrop: 'Drag and drop files here, or click to select',
      maxSize: 'Maximum file size: 50MB',
      uploadedFiles: 'Uploaded Files',
      remove: 'Remove',
      submit: 'Submit for Review',
      submitting: 'Submitting...',
      noFiles: 'Please upload at least one file',
      uploadError: 'Failed to upload file',
      submitError: 'Failed to submit deliverables',
      submitSuccess: 'Deliverables submitted successfully! The client will review your work.',
      uploading: 'Uploading...',
      pendingReview: 'Pending Review',
      approved: 'Approved',
      revisionRequested: 'Revision Requested',
      feedback: 'Feedback',
      reviewStatus: 'Review Status',
      download: 'Download',
      refresh: 'Refresh',
      noDeliverables: 'No deliverables found',
    },
    zh: {
      title: '提交交付物',
      description: '描述（可選）',
      descriptionPlaceholder: '描述你完成的工作...',
      uploadFiles: '上傳文件',
      dragDrop: '拖放文件到這裡，或點擊選擇',
      maxSize: '最大文件大小：50MB',
      uploadedFiles: '已上傳文件',
      remove: '移除',
      submit: '提交審核',
      submitting: '提交中...',
      noFiles: '請至少上傳一個文件',
      uploadError: '文件上傳失敗',
      submitError: '提交交付物失敗',
      submitSuccess: '交付物提交成功！案主將審核你的工作。',
      uploading: '上傳中...',
      pendingReview: '等待審核',
      approved: '已批准',
      revisionRequested: '需要修訂',
      feedback: '反饋',
      reviewStatus: '審核狀態',
      download: '下載',
      refresh: '刷新',
      noDeliverables: '沒有找到交付物',
    },
    'zh-TW': {
      title: '提交交付物',
      description: '描述（可選）',
      descriptionPlaceholder: '描述你完成的工作...',
      uploadFiles: '上傳文件',
      dragDrop: '拖放文件到這裡，或點擊選擇',
      maxSize: '最大文件大小：50MB',
      uploadedFiles: '已上傳文件',
      remove: '移除',
      submit: '提交審核',
      submitting: '提交中...',
      noFiles: '請至少上傳一個文件',
      uploadError: '文件上傳失敗',
      submitError: '提��交付物失敗',
      submitSuccess: '交付物提交成功！案主將審核你的工作。',
      uploading: '上傳中...',
      pendingReview: '等待審核',
      approved: '已批准',
      revisionRequested: '需要修訂',
      feedback: '反饋',
      reviewStatus: '審核狀態',
      download: '下載',
      refresh: '刷新',
      noDeliverables: '沒有找到交付物',
    },
    'zh-CN': {
      title: '提交交付物',
      description: '描述（可选）',
      descriptionPlaceholder: '描述你完成的工作...',
      uploadFiles: '上传文件',
      dragDrop: '拖放文件到此处，或点击选择',
      maxSize: '最大文件大小：50MB',
      uploadedFiles: '已上传文件',
      remove: '移除',
      submit: '提交审核',
      submitting: '提交中...',
      noFiles: '请至少上传一个文件',
      uploadError: '文件上传失败',
      submitError: '提交交付物失败',
      submitSuccess: '交付物提交成功！客户将审核你的工作。',
      uploading: '上传中...',
      pendingReview: '等待审核',
      approved: '已批准',
      revisionRequested: '需要修订',
      feedback: '反馈',
      reviewStatus: '审核状态',
      download: '下载',
      refresh: '刷新',
      noDeliverables: '没有找到交付物',
    },
  };

  const t = getTranslation(language);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) return;

    setUploading(true);

    try {
      for (const file of selectedFiles) {
        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name}: ${language === 'en' ? 'File too large (max 50MB)' : '文件太大（最大50MB）'}`);
          continue;
        }

        // Step 1: Get signed upload URL from backend
        const urlResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables/upload-url`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              project_id: projectIdProp,
              file_name: file.name,
              file_type: file.type,
            }),
          }
        );

        if (!urlResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { upload_url, file_path, token } = await urlResponse.json();

        // Step 2: Upload file to Supabase Storage using signed URL
        const uploadResponse = await fetch(upload_url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        // Step 3: Add to uploaded files list
        setFiles(prev => [...prev, {
          file_name: file.name,
          file_path: file_path,
          file_size: file.size,
          file_type: file.type,
          uploaded: true,
        }]);

        toast.success(`${file.name} ${language === 'en' ? 'uploaded successfully' : '上傳成功'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error(t.noFiles);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            project_id: projectIdProp,
            description,
            files,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit');
      }

      toast.success(t.submitSuccess);
      
      // Reset form
      setDescription('');
      setFiles([]);
      
      // Refresh deliverables list
      await fetchDeliverables();
      
      // Callback
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(`${t.submitError}: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const fetchDeliverables = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables/project/${projectIdProp}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Fetch deliverables error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          projectId: projectIdProp,
        });
        throw new Error(errorData.error || 'Failed to fetch deliverables');
      }

      const data = await response.json();
      setDeliverables(data.deliverables || []);
    } catch (error: any) {
      console.error('Fetch deliverables error:', error);
    }
  };

  useEffect(() => {
    fetchDeliverables();
  }, [projectIdProp]);

  return (
    <div className="space-y-6">
      {/* Previously Submitted Deliverables - Show at Top */}
      {deliverables.length > 0 && (
        <div className="space-y-4 pb-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mb-1">{language === 'en' ? 'Submitted Deliverables' : '已提交的交付物'}</h3>
              <p className="text-sm text-muted-foreground">
                {language === 'en' 
                  ? 'Review the status of your submitted work' 
                  : '查看你提交的工作狀態'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDeliverables}
            >
              <RefreshCw className="size-4 mr-2" />
              {t.refresh}
            </Button>
          </div>
          
          <div className="space-y-3">
            {deliverables.map((deliverable) => {
              const statusConfig = {
                pending_review: { 
                  variant: 'default' as const, 
                  icon: Clock, 
                  color: 'text-yellow-600',
                  bgColor: 'bg-yellow-50 border-yellow-200',
                  label: t.pendingReview
                },
                approved: { 
                  variant: 'default' as const, 
                  icon: CheckCircle2, 
                  color: 'text-green-600',
                  bgColor: 'bg-green-50 border-green-200',
                  label: t.approved
                },
                revision_requested: { 
                  variant: 'default' as const, 
                  icon: AlertCircle, 
                  color: 'text-orange-600',
                  bgColor: 'bg-orange-50 border-orange-200',
                  label: t.revisionRequested
                },
              };
              
              const config = statusConfig[deliverable.status];
              const StatusIcon = config.icon;
              
              return (
                <Card key={deliverable.id} className={`p-4 border-2 ${config.bgColor}`}>
                  <div className="space-y-3">
                    {/* Header with Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <StatusIcon className={`size-4 ${config.color}`} />
                          <Badge variant="outline" className={config.color}>
                            {config.label}
                          </Badge>
                        </div>
                        {deliverable.description && (
                          <p className="text-sm">{deliverable.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Files */}
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>{language === 'en' ? 'Files:' : '文件：'}</strong>
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {deliverable.files.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-white/50 rounded border">
                            <FileText className="size-4 text-primary flex-shrink-0" />
                            <span className="text-sm flex-1 truncate">{file.file_name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (file.signed_url) {
                                  window.open(file.signed_url, '_blank');
                                }
                              }}
                            >
                              <Download className="size-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Feedback for Revision Requested */}
                    {deliverable.status === 'revision_requested' && deliverable.feedback && (
                      <div className="p-3 bg-orange-100 border border-orange-300 rounded">
                        <p className="text-sm mb-1">
                          <strong className="text-orange-900">{t.feedback}:</strong>
                        </p>
                        <p className="text-sm text-orange-900">{deliverable.feedback}</p>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {language === 'en' ? 'Submitted:' : '提交時間：'} 
                        {new Date(deliverable.submitted_at).toLocaleString(language === 'en' ? 'en-US' : 'zh-TW')}
                      </span>
                      {deliverable.reviewed_at && (
                        <span>
                          {language === 'en' ? 'Reviewed:' : '審核時間：'} 
                          {new Date(deliverable.reviewed_at).toLocaleString(language === 'en' ? 'en-US' : 'zh-TW')}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* New Deliverable Submission Form */}
      <div>
        <h3 className="mb-2">{t.title}</h3>
        <p className="text-muted-foreground">
          {language === 'en' 
            ? 'Upload your completed work files for client review.' 
            : '上傳你完成的工作文件供案主審核。'}
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block">{t.description}</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.descriptionPlaceholder}
          rows={3}
        />
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <label className="block">{t.uploadFiles}</label>
        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <Input
            type="file"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <label 
            htmlFor="file-upload" 
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="size-8 text-primary animate-spin" />
                <p>{t.uploading}</p>
              </>
            ) : (
              <>
                <Upload className="size-8 text-muted-foreground" />
                <p>{t.dragDrop}</p>
                <p className="text-sm text-muted-foreground">{t.maxSize}</p>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <label className="block">{t.uploadedFiles}</label>
          <div className="space-y-2">
            {files.map((file, index) => (
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
                    {file.uploaded && (
                      <CheckCircle2 className="size-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={submitting || files.length === 0}
        className="w-full"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            {t.submitting}
          </>
        ) : (
          t.submit
        )}
      </Button>
    </div>
  );
}