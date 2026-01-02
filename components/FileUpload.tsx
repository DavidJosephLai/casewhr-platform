import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import {
  Upload,
  File,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  X,
  Loader2,
  Download,
  Trash2,
  Check,
} from 'lucide-react';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  path?: string;
  url?: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

interface FileUploadProps {
  bucketType?: 'DELIVERABLES' | 'INVOICES' | 'ATTACHMENTS' | 'AVATARS';
  projectId?: string;
  category?: 'IMAGE' | 'DOCUMENT' | 'ARCHIVE' | 'VIDEO' | 'AUDIO' | 'ANY';
  maxFiles?: number;
  onFilesChange?: (files: UploadedFile[]) => void;
  existingFiles?: UploadedFile[];
  disabled?: boolean;
}

export function FileUpload({
  bucketType = 'ATTACHMENTS',
  projectId: propProjectId,
  category = 'ANY',
  maxFiles = 10,
  onFilesChange,
  existingFiles = [],
  disabled = false,
}: FileUploadProps) {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);

  const content = {
    en: {
      uploadFiles: 'Upload Files',
      dropFiles: 'Drop files here or click to browse',
      uploading: 'Uploading...',
      uploaded: 'Uploaded',
      failed: 'Failed',
      remove: 'Remove',
      download: 'Download',
      maxFiles: `Maximum ${maxFiles} files`,
      fileTooLarge: 'File too large',
      invalidType: 'Invalid file type',
      uploadFailed: 'Upload failed',
      category: {
        IMAGE: 'Images (JPG, PNG, GIF, WebP, SVG)',
        DOCUMENT: 'Documents (PDF, DOC, DOCX, XLS, XLSX, TXT)',
        ARCHIVE: 'Archives (ZIP, RAR, 7Z, GZ, TAR)',
        VIDEO: 'Videos (MP4, MPEG, MOV, AVI, WebM)',
        AUDIO: 'Audio (MP3, WAV, OGG, WebM)',
        ANY: 'All files',
      },
    },
    zh: {
      uploadFiles: '上傳檔案',
      dropFiles: '拖放檔案至此或點擊瀏覽',
      uploading: '上傳中...',
      uploaded: '已上傳',
      failed: '失敗',
      remove: '移除',
      download: '下載',
      maxFiles: `最多 ${maxFiles} 個檔案`,
      fileTooLarge: '檔案過大',
      invalidType: '無效的檔案類型',
      uploadFailed: '上傳失敗',
      category: {
        IMAGE: '圖片 (JPG, PNG, GIF, WebP, SVG)',
        DOCUMENT: '文件 (PDF, DOC, DOCX, XLS, XLSX, TXT)',
        ARCHIVE: '壓縮檔 (ZIP, RAR, 7Z, GZ, TAR)',
        VIDEO: '影片 (MP4, MPEG, MOV, AVI, WebM)',
        AUDIO: '音訊 (MP3, WAV, OGG, WebM)',
        ANY: '所有檔案',
      },
    },
  };

  const t = content[language];

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-8 w-8" />;
    if (type.startsWith('video/')) return <Video className="h-8 w-8" />;
    if (type.startsWith('audio/')) return <Music className="h-8 w-8" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-8 w-8" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || !accessToken) return;

    const newFiles = Array.from(selectedFiles);

    // Check max files limit
    if (files.length + newFiles.length > maxFiles) {
      toast.error(t.maxFiles);
      return;
    }

    // Add files to state with uploading status
    const filesToUpload: UploadedFile[] = newFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      uploading: true,
      progress: 0,
    }));

    setFiles(prev => [...prev, ...filesToUpload]);

    // Upload each file
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const fileIndex = files.length + i;

      try {
        // Step 1: Get signed upload URL
        const urlResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/files/upload-url`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file_name: file.name,
              file_size: file.size,
              file_type: file.type,
              bucket_type: bucketType,
              project_id: propProjectId,
              category: category,
            }),
          }
        );

        if (!urlResponse.ok) {
          const error = await urlResponse.json();
          throw new Error(error.error || t.uploadFailed);
        }

        const { upload_url, file_path } = await urlResponse.json();

        // Step 2: Upload file to signed URL
        const uploadResponse = await fetch(upload_url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(t.uploadFailed);
        }

        // Step 3: Get download URL
        const downloadResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/files/download-url`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file_path: file_path,
              bucket_type: bucketType,
            }),
          }
        );

        if (!downloadResponse.ok) {
          throw new Error('Failed to get download URL');
        }

        const { download_url } = await downloadResponse.json();

        // Update file status to uploaded
        setFiles(prev => {
          const updated = [...prev];
          updated[fileIndex] = {
            ...updated[fileIndex],
            uploading: false,
            progress: 100,
            path: file_path,
            url: download_url,
          };
          return updated;
        });

        toast.success(`${file.name} ${t.uploaded}`);

      } catch (error: any) {
        console.error('Upload error:', error);
        
        // Update file status to error
        setFiles(prev => {
          const updated = [...prev];
          updated[fileIndex] = {
            ...updated[fileIndex],
            uploading: false,
            error: error.message,
          };
          return updated;
        });

        toast.error(`${file.name}: ${error.message}`);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = async (index: number) => {
    const file = files[index];

    // If file has a path, delete it from storage
    if (file.path && accessToken) {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/files/${file.path}?bucket_type=${bucketType}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );
      } catch (error) {
        console.error('Delete error:', error);
      }
    }

    // Remove from state
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
  };

  const handleDownloadFile = async (file: UploadedFile) => {
    if (!file.url) return;

    try {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(language === 'en' ? 'Failed to download file' : '下載失敗');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${disabled ? 'bg-muted cursor-not-allowed' : 'hover:border-primary cursor-pointer'}
            `}
            onClick={() => !disabled && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!disabled) {
                handleFileSelect(e.dataTransfer.files);
              }
            }}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="mb-2">{t.dropFiles}</p>
            <p className="text-sm text-muted-foreground">
              {t.category[category]}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {t.maxFiles}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            disabled={disabled}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* File Icon */}
                  <div className="text-muted-foreground">
                    {getFileIcon(file.type)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>

                    {/* Progress/Status */}
                    {file.uploading && (
                      <div className="flex items-center gap-2 mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{t.uploading}</span>
                      </div>
                    )}

                    {file.error && (
                      <p className="text-sm text-destructive mt-2">
                        {t.failed}: {file.error}
                      </p>
                    )}

                    {!file.uploading && !file.error && file.url && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                        <Check className="h-4 w-4" />
                        <span>{t.uploaded}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {file.url && !file.uploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      disabled={file.uploading}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}