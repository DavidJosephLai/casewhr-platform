import { useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Loader2, Cloud } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';

interface JSONFileUploaderProps {
  onUploadComplete?: (reportId: string) => void;
}

export function JSONFileUploader({ onUploadComplete }: JSONFileUploaderProps) {
  const { language } = useLanguage();
  const { session } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const translations = {
    en: {
      title: 'Upload JSON Report',
      subtitle: 'Upload your existing SEO report JSON files to the cloud',
      dragDrop: 'Drag & drop your JSON file here',
      or: 'or',
      browse: 'Browse Files',
      uploadButton: 'Upload to Cloud',
      uploading: 'Uploading...',
      preview: 'Preview',
      fileName: 'File Name',
      fileSize: 'File Size',
      cancel: 'Cancel',
      success: 'Successfully uploaded!',
      errorInvalidJson: 'Invalid JSON file',
      errorNoSession: 'Please log in to upload files',
      errorUploadFailed: 'Upload failed',
    },
    'zh-TW': {
      title: '上傳 JSON 報告',
      subtitle: '將現有的 SEO 報告 JSON 文件上傳到雲端',
      dragDrop: '拖放 JSON 文件到這裡',
      or: '或',
      browse: '瀏覽文件',
      uploadButton: '上傳到雲端',
      uploading: '上傳中...',
      preview: '預覽',
      fileName: '文件名稱',
      fileSize: '文件大小',
      cancel: '取消',
      success: '上傳成功！',
      errorInvalidJson: '無效的 JSON 文件',
      errorNoSession: '請登入以上傳文件',
      errorUploadFailed: '上傳失敗',
    },
    'zh-CN': {
      title: '上传 JSON 报告',
      subtitle: '将现有的 SEO 报告 JSON 文件上传到云端',
      dragDrop: '拖放 JSON 文件到这里',
      or: '或',
      browse: '浏览文件',
      uploadButton: '上传到云端',
      uploading: '上传中...',
      preview: '预览',
      fileName: '文件名称',
      fileSize: '文件大小',
      cancel: '取消',
      success: '上传成功！',
      errorInvalidJson: '无效的 JSON 文件',
      errorNoSession: '请登录以上传文件',
      errorUploadFailed: '上传失败',
    },
  };

  const t = translations[language] || translations['zh-TW'];

  // 處理拖放事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(f => f.name.endsWith('.json'));

    if (jsonFile) {
      handleFileSelect(jsonFile);
    }
  };

  // 處理文件選擇
  const handleFileSelect = async (file: File) => {
    setError('');
    setUploadedFile(file);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setJsonData(data);
    } catch (err) {
      setError(t.errorInvalidJson);
      setJsonData(null);
      toast.error(t.errorInvalidJson);
    }
  };

  // 處理文件輸入
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 上傳到雲端
  const handleUpload = async () => {
    if (!session) {
      toast.error(t.errorNoSession);
      return;
    }

    if (!jsonData) {
      toast.error(t.errorInvalidJson);
      return;
    }

    setIsUploading(true);
    try {
      // 準備報告數據
      const reportData = {
        title: jsonData.title || uploadedFile?.name.replace('.json', '') || 'Imported Report',
        description: jsonData.description || '',
        keywords: jsonData.keywords || '',
        pageType: jsonData.pageType || 'home',
        analysis: jsonData.analysis || null,
        generatedData: jsonData.generatedData || null,
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ai/save-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reportData }),
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      toast.success(`${t.success} ☁️`);
      
      // 清除狀態
      setUploadedFile(null);
      setJsonData(null);

      // 回調
      if (onUploadComplete) {
        onUploadComplete(data.reportId);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t.errorUploadFailed);
    } finally {
      setIsUploading(false);
    }
  };

  // 取消
  const handleCancel = () => {
    setUploadedFile(null);
    setJsonData(null);
    setError('');
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Upload className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl">{t.title}</h2>
        </div>
        <p className="text-gray-600 text-sm">{t.subtitle}</p>
      </div>

      {/* Upload Area */}
      {!uploadedFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-700 mb-2">{t.dragDrop}</p>
          <p className="text-gray-500 text-sm mb-4">{t.or}</p>
          <label className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
            {t.browse}
            <input
              type="file"
              accept=".json"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* File Preview */}
      {uploadedFile && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start gap-4 mb-4">
            <File className="w-10 h-10 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">{t.fileName}</h3>
              <p className="text-sm text-gray-600">{uploadedFile.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {t.fileSize}: {formatFileSize(uploadedFile.size)}
              </p>
            </div>
            {jsonData && !error && (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            )}
            {error && (
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            )}
          </div>

          {/* JSON Preview */}
          {jsonData && !error && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{t.preview}</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-700">
                  {JSON.stringify(jsonData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={isUploading || !!error || !jsonData}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.uploading}
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  {t.uploadButton}
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      {!session && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{t.errorNoSession}</p>
          </div>
        </div>
      )}
    </div>
  );
}
