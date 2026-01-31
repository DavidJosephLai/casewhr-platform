import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useView } from '../contexts/ViewContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, Trash2, Edit, X, Save, ExternalLink, Image as ImageIcon,
  Upload, Link as LinkIcon, FileText, ArrowLeft
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  url?: string;
  tags?: string[];
}

export default function PortfolioManager() {
  const { language } = useLanguage();
  const { setView } = useView();
  const { user, accessToken } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // 調試日誌狀態 - 直接顯示在頁面上
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true);
  
  // 添加日誌的函數
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };
  
  // 表單狀態
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    url: '',
    tags: [] as string[],
  });

  const t = {
    title: language === 'en' ? 'Manage Portfolio' : language === 'zh-CN' ? '管理作品集' : '管理作品集',
    subtitle: language === 'en' ? 'Showcase your best work to attract clients' : language === 'zh-CN' ? '展示您的最佳作品以吸引客户' : '展示您的最佳作品以吸引客戶',
    addProject: language === 'en' ? 'Add Project' : language === 'zh-CN' ? '添加项目' : '新增專案',
    editProject: language === 'en' ? 'Edit Project' : language === 'zh-CN' ? '编辑项目' : '編輯專案',
    projectTitle: language === 'en' ? 'Project Title' : language === 'zh-CN' ? '项目标题' : '專案標題',
    projectDescription: language === 'en' ? 'Project Description' : language === 'zh-CN' ? '项目描述' : '專案描述',
    imageUrl: language === 'en' ? 'Image URL' : language === 'zh-CN' ? '图片链接' : '圖片連結',
    projectUrl: language === 'en' ? 'Project URL (optional)' : language === 'zh-CN' ? '项目链接（可选）' : '專案連結（選填）',
    tags: language === 'en' ? 'Tags (comma separated)' : language === 'zh-CN' ? '标签（逗号分隔）' : '標籤（逗號分隔）',
    save: language === 'en' ? 'Save' : language === 'zh-CN' ? '保存' : '儲存',
    cancel: language === 'en' ? 'Cancel' : language === 'zh-CN' ? '取消' : '取消',
    delete: language === 'en' ? 'Delete' : language === 'zh-CN' ? '删除' : '刪除',
    edit: language === 'en' ? 'Edit' : language === 'zh-CN' ? '编辑' : '編輯',
    noProjects: language === 'en' ? 'No portfolio projects yet. Add your first project!' : language === 'zh-CN' ? '还没有作品集项目。添加您的第一个项目！' : '還沒有作品集專案。新增您的第一個專案！',
    saving: language === 'en' ? 'Saving...' : language === 'zh-CN' ? '保存中...' : '儲存中...',
    saved: language === 'en' ? 'Portfolio saved successfully!' : language === 'zh-CN' ? '作品集保存成功！' : '作品集儲存成功！',
    saveFailed: language === 'en' ? 'Failed to save portfolio' : language === 'zh-CN' ? '保存作品集失败' : '儲存作品集失敗',
    loading: language === 'en' ? 'Loading portfolio...' : language === 'zh-CN' ? '加载作品集中...' : '載入作品集中...',
    backToProfile: language === 'en' ? 'Back to Profile' : language === 'zh-CN' ? '返回档案' : '返回檔案',
    deleteConfirm: language === 'en' ? 'Project deleted' : language === 'zh-CN' ? '项目已删除' : '專案已刪除',
    fillRequired: language === 'en' ? 'Please fill in all required fields' : language === 'zh-CN' ? '请填写所有必填字段' : '請填寫所有必填欄位',
    uploadImage: language === 'en' ? 'Upload Image' : language === 'zh-CN' ? '上传图片' : '上傳圖片',
    uploading: language === 'en' ? 'Uploading...' : language === 'zh-CN' ? '上传中...' : '上傳中...',
    uploadSuccess: language === 'en' ? 'Image uploaded successfully!' : language === 'zh-CN' ? '图片上传成功！' : '圖片上傳成功！',
    uploadFailed: language === 'en' ? 'Failed to upload image' : language === 'zh-CN' ? '图片上传失败' : '圖片上傳失敗',
    orEnterUrl: language === 'en' ? 'Or enter image URL manually' : language === 'zh-CN' ? '或手动输入图片链接' : '或手動輸入圖片連結',
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      if (!accessToken) {
        console.log('⚠️ [PortfolioManager] No access token, skipping portfolio load');
        toast.error(language === 'en' ? 'Please login first' : '請先登入');
        setView('login');
        return;
      }

      console.log('📂 [PortfolioManager] Loading portfolio...');

      // Get current user ID from token
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const userId = data.profile?.user_id;
        
        console.log('👤 [PortfolioManager] User ID:', userId);
        
        if (userId) {
          // Load portfolio
          const portfolioResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/portfolio/${userId}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );

          if (portfolioResponse.ok) {
            const portfolioData = await portfolioResponse.json();
            console.log('✅ [PortfolioManager] Portfolio loaded:', portfolioData);
            setPortfolio(portfolioData.portfolio?.items || []);
          } else {
            console.warn('⚠️ [PortfolioManager] Failed to load portfolio:', portfolioResponse.status);
            // Set empty portfolio instead of failing
            setPortfolio([]);
          }
        } else {
          console.warn('⚠️ [PortfolioManager] No user ID found');
          setPortfolio([]);
        }
      } else {
        console.warn('⚠️ [PortfolioManager] Failed to load profile:', response.status);
        setPortfolio([]);
      }
    } catch (error) {
      console.error('❌ [PortfolioManager] Error loading portfolio:', error);
      // Don't show error toast here, just set empty portfolio
      setPortfolio([]);
    } finally {
      setLoading(false);
    }
  };

  const addProject = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error(t.fillRequired);
      return;
    }

    const newProject: PortfolioItem = {
      id: `portfolio_${Date.now()}`,
      title: formData.title,
      description: formData.description,
      image: formData.image || undefined,
      url: formData.url || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    };

    const updatedPortfolio = [...portfolio, newProject];
    setPortfolio(updatedPortfolio);
    resetForm();
    setShowAddForm(false);
    toast.success(language === 'en' ? 'Project added! Click Save to persist changes.' : '專案已新增！點擊儲存按鈕以保存更改。');
  };

  const updateProject = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error(t.fillRequired);
      return;
    }

    const updatedPortfolio = portfolio.map(item => 
      item.id === editingId 
        ? {
            ...item,
            title: formData.title,
            description: formData.description,
            image: formData.image || undefined,
            url: formData.url || undefined,
            tags: formData.tags.length > 0 ? formData.tags : undefined,
          }
        : item
    );
    
    setPortfolio(updatedPortfolio);
    resetForm();
    setEditingId(null);
    toast.success(language === 'en' ? 'Project updated! Click Save to persist changes.' : '專案已更新！點擊儲存按鈕以保存更改。');
  };

  const deleteProject = (id: string) => {
    const updatedPortfolio = portfolio.filter(item => item.id !== id);
    setPortfolio(updatedPortfolio);
    toast.success(t.deleteConfirm);
  };

  // Helper function to save portfolio with specific data
  const savePortfolioWithData = async (portfolioData: PortfolioItem[]) => {
    try {
      setSaving(true);
      setDebugLogs([]); // 清空舊日誌
      addLog('💾 開始儲存作品集...');
      addLog(`💾 Access Token 存在: ${!!accessToken}`);
      addLog(`💾 作品數量: ${portfolioData.length}`);
      
      if (!accessToken) {
        addLog('❌ 錯誤: 沒有 Access Token');
        toast.error(language === 'en' ? 'Please login first' : '請先登入');
        setSaving(false);
        return;
      }

      // Get current user ID
      addLog('📡 正在獲取用戶資料...');
      const profileResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      addLog(`📡 用戶資料響應狀態: ${profileResponse.status}`);

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        addLog(`❌ 獲取用戶資料失敗: ${profileResponse.status}`);
        addLog(`❌ 錯誤詳情: ${errorText}`);
        toast.error(t.saveFailed + ': Profile fetch failed');
        setSaving(false);
        return;
      }

      const profileData = await profileResponse.json();
      const userId = profileData.profile?.user_id;
      
      addLog(`📦 完整的 Profile 響應: ${JSON.stringify(profileData, null, 2)}`);
      addLog(`👤 用戶 ID: ${userId}`);

      if (!userId) {
        addLog('❌ 錯誤: 找不到用戶 ID');
        toast.error(t.saveFailed + ': No user ID');
        setSaving(false);
        return;
      }

      addLog(`💾 正在儲存用戶 ${userId} 的作品集...`);
      addLog(`💾 作品項目: ${JSON.stringify(portfolioData, null, 2)}`);

      // Save portfolio
      const saveUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/portfolio/${userId}`;
      addLog(`📡 儲存 URL: ${saveUrl}`);
      
      const response = await fetch(saveUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolio_items: portfolioData,
        }),
      });

      addLog(`📡 儲存響應狀態: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        addLog(`✅ 作品集儲存成功!`);
        addLog(`✅ 響應: ${JSON.stringify(result, null, 2)}`);
        toast.success(t.saved);
      } else {
        // Get error details from backend
        let errorDetails = '';
        try {
          const errorJson = await response.json();
          errorDetails = JSON.stringify(errorJson, null, 2);
          addLog(`❌ 儲存失敗 - 錯誤 JSON: ${errorDetails}`);
        } catch {
          errorDetails = await response.text();
          addLog(`❌ 儲存失敗 - 錯誤文字: ${errorDetails}`);
        }
        
        addLog(`❌ 儲存失敗，狀態碼: ${response.status}`);
        toast.error(t.saveFailed + ' (Status: ' + response.status + ')');
      }
    } catch (error) {
      addLog(`❌ 儲存時發生例外: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addLog(`❌ 錯誤堆疊: ${error instanceof Error ? error.stack : 'No stack trace'}`);
      toast.error(t.saveFailed + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
      addLog('💾 儲存流程結束');
    }
  };

  const startEdit = (item: PortfolioItem) => {
    setFormData({
      title: item.title,
      description: item.description,
      image: item.image || '',
      url: item.url || '',
      tags: item.tags || [],
    });
    setEditingId(item.id);
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      url: '',
      tags: [],
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(language === 'en' ? 'Please select an image file' : '請選擇圖片文件');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'en' ? 'Image must be less than 5MB' : '圖片大小不能超過 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      if (!accessToken) {
        toast.error(language === 'en' ? 'Please login first' : '請先登入');
        return;
      }

      // Step 1: Get upload URL from backend
      const uploadUrlResponse = await fetch(
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
            bucket_type: 'AVATARS', // Using AVATARS bucket for portfolio images
            category: 'IMAGE',
          }),
        }
      );

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { upload_url, file_path, bucket } = await uploadUrlResponse.json();

      console.log('📤 [PortfolioManager] Upload details:', { 
        file_path, 
        bucket, 
        fileName: file.name,
        fileSize: file.size 
      });

      // Step 2: Upload file to Supabase Storage
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      console.log('📤 [PortfolioManager] Upload response:', {
        ok: uploadResponse.ok,
        status: uploadResponse.status,
        statusText: uploadResponse.statusText
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ [PortfolioManager] Upload failed:', errorText);
        throw new Error('Failed to upload file');
      }

      // Wait a bit for Storage to process the file
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Get public URL for the uploaded file
      const publicUrlResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/files/download-url`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_path,
            bucket_type: 'AVATARS', // Pass bucket_type instead of bucket name
          }),
        }
      );

      console.log('📥 [PortfolioManager] Download URL response:', {
        ok: publicUrlResponse.ok,
        status: publicUrlResponse.status
      });

      if (!publicUrlResponse.ok) {
        const errorText = await publicUrlResponse.text();
        console.error('❌ [PortfolioManager] Failed to get download URL:', errorText);
        throw new Error('Failed to get public URL');
      }

      const { download_url } = await publicUrlResponse.json();

      // Update form data with the uploaded image URL
      setFormData({ ...formData, image: download_url });
      toast.success(t.uploadSuccess);
    } catch (error) {
      console.error('❌ [PortfolioManager] Error uploading image:', error);
      toast.error(t.uploadFailed);
    } finally {
      setUploadingImage(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => {
              setView('dashboard');
              // 觸發切換到 profile 標籤
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('showDashboard', { detail: { tab: 'profile' } }));
              }, 100);
            }}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.backToProfile}
          </button>
          <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
          <p className="text-purple-100">{t.subtitle}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Save Button - Fixed at top */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm || editingId !== null}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t.addProject}
          </button>
          
          <button
            onClick={() => savePortfolioWithData(portfolio)}
            disabled={saving}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors min-w-[120px]"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {t.saving}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {t.save}
              </>
            )}
          </button>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">
              {editingId ? t.editProject : t.addProject}
            </h3>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.projectTitle} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., E-commerce Website Redesign"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.projectDescription} *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32"
                  placeholder="Describe your project, your role, and the results achieved..."
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.imageUrl}
                </label>
                
                {/* Upload Button */}
                <div className="flex gap-2 mb-2">
                  <label
                    className={`flex-1 px-4 py-2 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-lg cursor-pointer transition-colors ${
                      uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 text-purple-600">
                      <Upload className="w-5 h-5" />
                      <span className="font-medium">
                        {uploadingImage ? t.uploading : t.uploadImage}
                      </span>
                    </div>
                  </label>
                </div>
                
                {/* Or divider */}
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-xs text-gray-500">{t.orEnterUrl}</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                
                {/* Manual URL Input */}
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                
                {/* Image Preview */}
                {formData.image && (
                  <div className="mt-2 relative">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23f3f4f6" width="400" height="200"/%3E%3Ctext fill="%23ef4444" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EInvalid Image URL%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Project URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.projectUrl}
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com/project"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.tags}
                </label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="React, TypeScript, E-commerce"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingId ? updateProject : addProject}
                  className="flex-1 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingId 
                    ? (language === 'en' ? 'Update' : language === 'zh-CN' ? '更新' : '更新')
                    : (language === 'en' ? 'Add' : language === 'zh-CN' ? '添加' : '新增')
                  }
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddForm(false);
                    setEditingId(null);
                  }}
                  className="px-6 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Grid */}
        {portfolio.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{t.noProjects}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                {item.image && (
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">{item.description}</p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 border border-purple-600 text-purple-600 hover:bg-purple-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </a>
                    )}
                    <button
                      onClick={() => startEdit(item)}
                      className="px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProject(item.id)}
                      className="px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Debug Logs */}
        {showDebug && (
          <div className="mt-6 bg-gray-100 p-4 rounded-lg">
            <h4 className="text-sm font-bold mb-2">Debug Logs</h4>
            <ul className="text-xs text-gray-500">
              {debugLogs.map((log, idx) => (
                <li key={idx}>{log}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}