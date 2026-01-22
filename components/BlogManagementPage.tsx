/**
 * 📝 Blog 管理頁面
 * 完整的 CMS 系統 - 所有登入用戶可發布文章
 * ✅ 用戶可以發布/編輯自己的文章
 * 🔐 超級管理員可以管理所有文章
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { useLanguage } from '../lib/LanguageContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  Search,
  Calendar,
  Tag,
  Upload,
  FileText,
  Globe,
  BookOpen,
  TrendingUp,
  User as UserIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";

interface BlogPost {
  slug: string;
  title: string;
  title_zh: string;
  title_cn: string;
  excerpt: string;
  excerpt_zh: string;
  excerpt_cn: string;
  content: string;
  content_zh: string;
  content_cn: string;
  category: string;
  tags: string[];
  author: string;
  coverImage: string;
  publishedAt: string;
  readTime: number;
  views: number;
  status: 'draft' | 'published';
}

export function BlogManagementPage() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔥 檢查 URL 參數，如果是新建文章，自動打開編輯器
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    console.log('🔍 [BlogManagement] Checking URL params:', { action, user: !!user, isEditorOpen, editingPost: !!editingPost });
    
    if (action === 'new' && !isEditorOpen && !editingPost && user) {
      console.log('🆕 [BlogManagement] Auto-creating new post from URL parameter');
      
      // 延遲一點點，確保狀態更新完成
      setTimeout(() => {
        // 直接建立新文章
        const newPost: BlogPost = {
          slug: `new-post-${Date.now()}`,
          title: '',
          title_zh: '',
          title_cn: '',
          excerpt: '',
          excerpt_zh: '',
          excerpt_cn: '',
          content: '',
          content_zh: '',
          content_cn: '',
          category: 'freelancer-tips',
          tags: [],
          author: user?.email || 'Admin',
          coverImage: '',
          publishedAt: new Date().toISOString().split('T')[0],
          readTime: 5,
          views: 0,
          status: 'draft',
        };
        
        console.log('✅ [BlogManagement] New post created:', newPost);
        setEditingPost(newPost);
        setIsEditorOpen(true);
        
        // 🔥 在打開編輯器後才清除 URL 參數
        window.history.replaceState({}, '', '/blog/admin');
      }, 100);
    }
  }, [user, isEditorOpen, editingPost]); // 🔥 增加依賴項，確保狀態同步

  const content = {
    en: {
      title: 'Blog Management',
      subtitle: 'Manage your blog posts and content',
      newPost: 'New Post',
      search: 'Search posts...',
      allCategories: 'All Categories',
      edit: 'Edit',
      delete: 'Delete',
      preview: 'Preview',
      views: 'views',
      published: 'Published',
      draft: 'Draft',
      save: 'Save',
      cancel: 'Cancel',
      deleteConfirm: 'Are you sure you want to delete this post?',
      postTitle: 'Post Title',
      excerpt: 'Excerpt',
      content: 'Content',
      category: 'Category',
      tags: 'Tags (comma separated)',
      coverImage: 'Cover Image URL',
      author: 'Author',
      readTime: 'Read Time (minutes)',
      status: 'Status',
      slug: 'URL Slug',
      success: 'Post saved successfully!',
      error: 'Failed to save post',
      deleteSuccess: 'Post deleted successfully!',
      deleteError: 'Failed to delete post',
    },
    'zh-TW': {
      title: 'Blog 管理',
      subtitle: '管理您的部落格文章和內容',
      newPost: '新增文章',
      search: '搜尋文章...',
      allCategories: '全部分類',
      edit: '編輯',
      delete: '刪除',
      preview: '預覽',
      views: '次瀏覽',
      published: '已發布',
      draft: '草稿',
      save: '儲存',
      cancel: '取消',
      deleteConfirm: '確定要刪除這篇文章嗎？',
      postTitle: '文章標題',
      excerpt: '摘要',
      content: '內容',
      category: '分類',
      tags: '標籤（逗號分隔）',
      coverImage: '封面圖片 URL',
      author: '作者',
      readTime: '閱讀時間（分鐘）',
      status: '狀態',
      slug: 'URL 路徑',
      success: '文章儲存成功！',
      error: '文章儲存失敗',
      deleteSuccess: '文章刪除成功！',
      deleteError: '文章刪除失敗',
    },
    'zh-CN': {
      title: 'Blog 管理',
      subtitle: '管理您的博客文章和内容',
      newPost: '新增文章',
      search: '搜索文章...',
      allCategories: '全部分类',
      edit: '编辑',
      delete: '删除',
      preview: '预览',
      views: '次浏览',
      published: '已发布',
      draft: '草稿',
      save: '保存',
      cancel: '取消',
      deleteConfirm: '确定要删除这篇文章吗？',
      postTitle: '文章标题',
      excerpt: '摘要',
      content: '内容',
      category: '分类',
      tags: '标签（逗号分隔）',
      coverImage: '封面图片 URL',
      author: '作者',
      readTime: '阅读时间（分钟）',
      status: '状态',
      slug: 'URL 路径',
      success: '文章保存成功！',
      error: '文章保存失败',
      deleteSuccess: '文章删除成功！',
      deleteError: '文章删除失败',
    },
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  const categories = [
    { id: 'all', label: language === 'en' ? 'All Categories' : '全部分類', icon: BookOpen },
    { id: 'freelancer-tips', label: language === 'en' ? 'Freelancer Tips' : '接案技巧', icon: TrendingUp },
    { id: 'client-guide', label: language === 'en' ? 'Client Guide' : '發案指南', icon: UserIcon },
    { id: 'platform-guide', label: language === 'en' ? 'Platform Guide' : '平台使用', icon: BookOpen },
    { id: 'industry-insights', label: language === 'en' ? 'Industry Insights' : '行業洞察', icon: TrendingUp },
    { id: 'success-stories', label: language === 'en' ? 'Success Stories' : '成功案例', icon: TrendingUp },
  ];

  useEffect(() => {
    loadPosts();
  }, [accessToken]); // 🔥 當 accessToken 改變時重新載入

  const loadPosts = async () => {
    // 🔥 如果沒有 accessToken，跳過載入
    if (!accessToken) {
      console.log('⏳ [BlogManagement] Waiting for access token...');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/blog/posts`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response && response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        console.warn('[BlogManagement] Failed to load posts:', response?.status || 'No response');
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ [BlogManagement] Failed to load blog posts:', error);
      // 不顯示錯誤訊息，只是設置空陣列
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPost = () => {
    const newPost: BlogPost = {
      slug: `new-post-${Date.now()}`,
      title: '',
      title_zh: '',
      title_cn: '',
      excerpt: '',
      excerpt_zh: '',
      excerpt_cn: '',
      content: '',
      content_zh: '',
      content_cn: '',
      category: 'freelancer-tips',
      tags: [],
      author: user?.email || 'Admin',
      coverImage: '',
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: 5,
      views: 0,
      status: 'draft',
    };
    console.log('✅ [BlogManagement] Creating new post:', newPost);
    setEditingPost(newPost);
    // 延遲打開對話框，確保 state 更新完成
    setTimeout(() => setIsEditorOpen(true), 50);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost({ ...post });
    setIsEditorOpen(true);
  };

  const handleDeletePost = async (slug: string) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/blog/posts/${slug}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response && response.ok) {
        toast.success(t.deleteSuccess);
        loadPosts();
      } else {
        toast.error(t.deleteError);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error(t.deleteError);
    }
  };

  const handleSavePost = async () => {
    if (!editingPost) return;

    // 驗證必填欄位
    if (!editingPost.title || !editingPost.slug) {
      toast.error(language === 'en' ? 'Title and slug are required' : '標題和路徑為必填');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/blog/posts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editingPost),
        }
      );

      if (response && response.ok) {
        toast.success(t.success);
        setIsEditorOpen(false);
        setEditingPost(null);
        loadPosts();
      } else {
        const error = await response.json();
        toast.error(error.message || t.error);
      }
    } catch (error) {
      console.error('Failed to save post:', error);
      toast.error(t.error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (post: BlogPost) => {
    window.open(`/blog/${post.slug}`, '_blank');
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-black mb-2">📝 {t.title}</h1>
            <p className="text-blue-100">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleNewPost} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              {t.newPost}
            </Button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl text-gray-600">
                {searchTerm ? '找不到相關文章' : '尚無文章'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Card key={post.slug} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    {post.coverImage && (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                              {post.status === 'published' ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> {t.published}</>
                              ) : (
                                <><AlertCircle className="w-3 h-3 mr-1" /> {t.draft}</>
                              )}
                            </Badge>
                            <Badge variant="outline">
                              {categories.find(c => c.id === post.category)?.label}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-bold mb-1">{post.title || post.title_zh}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt || post.excerpt_zh}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(post)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPost(post)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePost(post.slug)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.views} {t.views}
                        </span>
                        {post.tags && post.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            {post.tags.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Dialog */}
      {isEditorOpen && editingPost && (
        <Dialog open={true} onOpenChange={setIsEditorOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost.slug.startsWith('new-post-') ? t.newPost : t.edit}
              </DialogTitle>
              <DialogDescription>
                {language === 'en' ? 'Edit post content in multiple languages' : '編輯多語言文章內容'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t.slug}</label>
                  <Input
                    value={editingPost.slug}
                    onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                    placeholder="url-friendly-slug"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t.category}</label>
                  <Select
                    value={editingPost.category}
                    onValueChange={(value) => setEditingPost({ ...editingPost, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.id !== 'all').map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t.author}</label>
                  <Input
                    value={editingPost.author}
                    onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t.readTime}</label>
                  <Input
                    type="number"
                    value={editingPost.readTime}
                    onChange={(e) => setEditingPost({ ...editingPost, readTime: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t.status}</label>
                  <Select
                    value={editingPost.status}
                    onValueChange={(value: 'draft' | 'published') => setEditingPost({ ...editingPost, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t.draft}</SelectItem>
                      <SelectItem value="published">{t.published}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{t.coverImage}</label>
                <Input
                  value={editingPost.coverImage}
                  onChange={(e) => setEditingPost({ ...editingPost, coverImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{t.tags}</label>
                <Input
                  value={editingPost.tags.join(', ')}
                  onChange={(e) => setEditingPost({ ...editingPost, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              {/* Multi-language Content */}
              <Tabs key={editingPost.slug} defaultValue="en" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="en">🇺🇸 English</TabsTrigger>
                  <TabsTrigger value="zh-TW">🇹🇼 繁體中文</TabsTrigger>
                  <TabsTrigger value="zh-CN">🇨🇳 简体中文</TabsTrigger>
                </TabsList>

                <TabsContent value="en" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t.postTitle} (EN)</label>
                    <Input
                      value={editingPost.title}
                      onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                      placeholder="Post title in English"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t.excerpt} (EN)</label>
                    <Textarea
                      value={editingPost.excerpt}
                      onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                      placeholder="Short description..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t.content} (EN)</label>
                    <Textarea
                      value={editingPost.content}
                      onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                      placeholder="Full content in HTML or Markdown..."
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="zh-TW" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t.postTitle} (繁中)</label>
                    <Input
                      value={editingPost.title_zh}
                      onChange={(e) => setEditingPost({ ...editingPost, title_zh: e.target.value })}
                      placeholder="繁體中文標題"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t.excerpt} (繁中)</label>
                    <Textarea
                      value={editingPost.excerpt_zh}
                      onChange={(e) => setEditingPost({ ...editingPost, excerpt_zh: e.target.value })}
                      placeholder="簡短描述..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t.content} (繁中)</label>
                    <Textarea
                      value={editingPost.content_zh}
                      onChange={(e) => setEditingPost({ ...editingPost, content_zh: e.target.value })}
                      placeholder="完整內容（HTML 或 Markdown）..."
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="zh-CN" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t.postTitle} (简中)</label>
                    <Input
                      value={editingPost.title_cn}
                      onChange={(e) => setEditingPost({ ...editingPost, title_cn: e.target.value })}
                      placeholder="简体中文标题"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t.excerpt} (简中)</label>
                    <Textarea
                      value={editingPost.excerpt_cn}
                      onChange={(e) => setEditingPost({ ...editingPost, excerpt_cn: e.target.value })}
                      placeholder="简短描述..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t.content} (简中)</label>
                    <Textarea
                      value={editingPost.content_cn}
                      onChange={(e) => setEditingPost({ ...editingPost, content_cn: e.target.value })}
                      placeholder="完整内容（HTML 或 Markdown）..."
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditorOpen(false)} disabled={saving}>
                <X className="w-4 h-4 mr-2" />
                {t.cancel}
              </Button>
              <Button onClick={handleSavePost} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {saving ? (language === 'en' ? 'Saving...' : '儲存中...') : t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default BlogManagementPage;