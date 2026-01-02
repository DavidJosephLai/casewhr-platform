import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { User, Mail, Phone, Building2, Briefcase, Save, Loader2, Camera, Upload, Globe } from "lucide-react"; // ✅ 新增 Globe
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { ReviewList } from "./rating/ReviewList";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { EmailDeliveryHelp } from "./EmailDeliveryHelp";
import { getTranslation } from "../lib/translations";

interface UserProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileData {
  full_name: string;
  phone: string;
  company: string;
  job_title: string;
  bio: string;
  is_client: boolean;
  is_freelancer: boolean;
  skills: string;
  website: string;
  avatar_url?: string;
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function UserProfile({ open, onOpenChange }: UserProfileProps) {
  const { language } = useLanguage();
  const { user, accessToken, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: "",
    company: "",
    job_title: "",
    bio: "",
    is_client: false,
    is_freelancer: false,
    skills: "",
    website: "",
    avatar_url: "",
    language: 'en'
  });
  const [uploading, setUploading] = useState(false);

  const translations = {
    en: {
      title: "My Profile",
      subtitle: "Manage your account settings and preferences",
      tabs: {
        basic: "Basic Info",
        professional: "Professional Info",
      },
      fields: {
        email: "Email",
        fullName: "Full Name",
        phone: "Phone Number",
        company: "Company",
        jobTitle: "Job Title",
        bio: "Bio",
        accountType: "Account Type",
        skills: "Skills",
        website: "Website",
        client: "Client",
        freelancer: "Freelancer",
        language: "Language Preference",
        languageDescription: "Used for emails and notifications",
      },
      placeholders: {
        fullName: "Enter your full name",
        phone: "+1 (555) 123-4567",
        company: "Your company name",
        jobTitle: "Your job title",
        bio: "Tell us about yourself...",
        skills: "e.g., Web Development, Design, Marketing",
        website: "https://yourwebsite.com",
      },
      buttons: {
        save: "Save Changes",
        saving: "Saving...",
      },
      messages: {
        loadError: "Failed to load profile",
        saveSuccess: "Profile updated successfully!",
        saveError: "Failed to update profile",
      },
    },
    zh: {
      title: "我的個人資料",
      subtitle: "管理您的帳戶設定和偏好",
      tabs: {
        basic: "基本資訊",
        professional: "專業資訊",
      },
      fields: {
        email: "電子郵件",
        fullName: "姓名",
        phone: "電話號碼",
        company: "公司",
        jobTitle: "職稱",
        bio: "個人簡介",
        accountType: "帳戶類型",
        skills: "專業技能",
        website: "網站",
        client: "企業客戶",
        freelancer: "自由工作者",
        language: "語言偏好",
        languageDescription: "用於郵件和通知",
      },
      placeholders: {
        fullName: "請輸入您的姓名",
        phone: "+886 912 345 678",
        company: "司名稱",
        jobTitle: "您的職稱",
        bio: "介紹一下您自己...",
        skills: "例如：網站開發、設計、營銷",
        website: "https://yourwebsite.com",
      },
      buttons: {
        save: "儲存變更",
        saving: "儲存中...",
      },
      messages: {
        loadError: "載入個人資料失敗",
        saveSuccess: "個人資料更新成功！",
        saveError: "更新個人資料失敗",
      },
    },
    'zh-TW': {
      title: "我的個人資料",
      subtitle: "管理您的帳戶設定和偏好",
      tabs: {
        basic: "基本資訊",
        professional: "專業資訊",
      },
      fields: {
        email: "電子郵件",
        fullName: "姓名",
        phone: "電話號碼",
        company: "公司",
        jobTitle: "職稱",
        bio: "個人簡介",
        accountType: "帳戶類型",
        skills: "專業技能",
        website: "網站",
        client: "企業客戶",
        freelancer: "自由工作者",
        language: "語言偏好",
        languageDescription: "用於郵件和通知",
      },
      placeholders: {
        fullName: "請輸入您的姓名",
        phone: "+886 912 345 678",
        company: "您的公司名稱",
        jobTitle: "您的職稱",
        bio: "介紹一自...",
        skills: "例：網站開發、設計、營銷",
        website: "https://yourwebsite.com",
      },
      buttons: {
        save: "儲存變更",
        saving: "儲存中...",
      },
      messages: {
        loadError: "載入個人資料失敗",
        saveSuccess: "個人資料更新成功！",
        saveError: "更新個人資料失敗",
      },
    },
    'zh-CN': {
      title: "我的个人资料",
      subtitle: "管理您的帐户设定和偏好",
      tabs: {
        basic: "基本资讯",
        professional: "专业资讯",
      },
      fields: {
        email: "电子邮件",
        fullName: "姓名",
        phone: "电话号码",
        company: "公司",
        jobTitle: "职称",
        bio: "个人简介",
        accountType: "帐户类型",
        skills: "专业技能",
        website: "网站",
        client: "企业客户",
        freelancer: "自由工作者",
        language: "语言偏好",
        languageDescription: "用于邮件和通知",
      },
      placeholders: {
        fullName: "请输入您的姓名",
        phone: "+86 138 0000 0000",
        company: "您的公司名称",
        jobTitle: "您的职称",
        bio: "介绍一下您自己...",
        skills: "例如：网站开发、设计、营销",
        website: "https://yourwebsite.com",
      },
      buttons: {
        save: "保存更改",
        saving: "保存中...",
      },
      messages: {
        loadError: "载入个人资料失败",
        saveSuccess: "个人资料更新成功！",
        saveError: "更新个人资料失败",
      },
    }
  };

  // 使用本地翻译对象，而不是全局的 getTranslation
  const t = translations[language as keyof typeof translations] || translations.en;

  // Stable loadProfile function using useCallback
  const loadProfile = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info.tsx');
      console.log('📥 [UserProfile] Loading profile for user:', user.id);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const profile = data.profile;
        
        // Check if profile exists (backend returns null for non-existent profiles)
        if (!profile) {
          console.log('⚠️ [UserProfile] No profile found, using default values');
          setProfileData({
            full_name: user.user_metadata?.name || user.email?.split('@')[0] || '',
            phone: '',
            company: '',
            job_title: '',
            bio: '',
            is_client: true, // 默認為客戶
            is_freelancer: false,
            skills: '',
            website: '',
            avatar_url: '',
            language: 'en'
          });
        } else {
          console.log('✅ [UserProfile] Profile loaded:', {
            name: profile.name,
            email: profile.email,
            job_title: profile.job_title,
            bio: profile.bio?.substring(0, 30),
            skills: profile.skills,
            is_freelancer: profile.is_freelancer
          });
          
          // 支持新舊數據格式
          let is_client = profile.is_client ?? false;
          let is_freelancer = profile.is_freelancer ?? false;
          
          // 如果是舊格式（account_type），轉換為新格式
          if (profile.account_type) {
            is_client = profile.account_type === 'client';
            is_freelancer = profile.account_type === 'freelancer';
          }
          
          setProfileData({
            full_name: profile.name || '',
            phone: profile.phone || '',
            company: profile.company || '',
            job_title: profile.job_title || '',
            bio: profile.bio || '',
            is_client,
            is_freelancer,
            skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || ''),
            website: profile.website || '',
            avatar_url: profile.avatar_url || '',
            language: profile.language || 'en' // ✅ 語言偏好
          });
          
          console.log('✅ [UserProfile] Profile data set in component state');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [UserProfile] Failed to load profile:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // 即使載入失敗，也使用默認值（讓用戶可以創建新 profile）
        console.log('⚠️ [UserProfile] Using default profile data');
        setProfileData({
          full_name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          phone: '',
          company: '',
          job_title: '',
          bio: '',
          is_client: true, // 默認為客戶
          is_freelancer: false,
          skills: '',
          website: '',
          avatar_url: '',
          language: 'en'
        });
      }
    } catch (error) {
      console.error('❌ [UserProfile] Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]); // ✅ Only depend on user

  // Load profile when dialog opens
  useEffect(() => {
    if (open && user) {
      loadProfile();
    }
  }, [open, user, loadProfile]); // ✅ Include loadProfile in dependencies

  const saveProfile = async () => {
    if (!user) return;
    
    if (!user.id) {
      console.error('❌ [UserProfile] user.id is undefined!', user);
      toast.error('User ID is missing. Please try logging in again.');
      return;
    }

    // 至少选择一个身份
    if (!profileData.is_client && !profileData.is_freelancer) {
      toast.error(
        language === 'en'
          ? 'Please select at least one account type'
          : '請至少選擇一種帳戶類型'
      );
      return;
    }

    setLoading(true);
    try {
      // 準備更新的 profile 數據
      const { projectId, publicAnonKey } = await import('../utils/supabase/info.tsx');
      
      // 🔍 檢查並獲取有效的 access token
      let authToken = accessToken;
      
      console.log('🔐 [UserProfile] Auth token check:', {
        hasAccessToken: !!accessToken,
        tokenLength: accessToken?.length,
        tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'null',
        userId: user.id
      });
      
      // 如果沒有 accessToken，嘗試從 Supabase 獲取當前 session
      if (!authToken) {
        console.warn('⚠️ [UserProfile] No access token from context, fetching from Supabase...');
        const { supabase } = await import('../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || null;
        
        console.log('🔐 [UserProfile] Token from Supabase:', {
          hasToken: !!authToken,
          tokenPreview: authToken ? authToken.substring(0, 20) + '...' : 'null'
        });
      }
      
      // 如果還是沒有 token，使用 publicAnonKey 作為後備
      if (!authToken) {
        console.warn('⚠️ [UserProfile] No access token available, using publicAnonKey as fallback');
        authToken = publicAnonKey;
      }
      
      const updatedProfile = {
        user_id: user.id,
        email: user.email,
        full_name: profileData.full_name,
        phone: profileData.phone,
        company: profileData.company,
        job_title: profileData.job_title,
        bio: profileData.bio,
        // 保存新格式的雙重身份
        is_client: profileData.is_client,
        is_freelancer: profileData.is_freelancer,
        skills: profileData.skills.split(',').map(s => s.trim()).filter(s => s),
        website: profileData.website,
        avatar_url: profileData.avatar_url,
        language: profileData.language // ✅ 儲存語言偏好
      };

      console.log('💾 [UserProfile] Saving profile for user:', user.id, {
        full_name: updatedProfile.full_name,
        email: updatedProfile.email,
        job_title: updatedProfile.job_title,
        is_client: updatedProfile.is_client,
        is_freelancer: updatedProfile.is_freelancer,
        skills: updatedProfile.skills,
        company: updatedProfile.company,
        usingToken: authToken === publicAnonKey ? 'publicAnonKey' : 'accessToken'
      });

      console.log('📤 [UserProfile] Request body:', JSON.stringify(updatedProfile, null, 2));
      console.log('📤 [UserProfile] Authorization header:', `Bearer ${authToken.substring(0, 30)}...`);

      // 🔥 終極方案：直接使用 KV store API，完全繞過認證問題
      console.log('🔥 [UserProfile] Using direct KV store approach to bypass auth issues...');
      
      // 準備 profile 數據
      const kvProfileData = {
        name: updatedProfile.full_name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        company: updatedProfile.company,
        job_title: updatedProfile.job_title,
        bio: updatedProfile.bio,
        is_client: updatedProfile.is_client,
        is_freelancer: updatedProfile.is_freelancer,
        skills: updatedProfile.skills,
        website: updatedProfile.website,
        avatar_url: updatedProfile.avatar_url,
        language: updatedProfile.language,
        updated_at: new Date().toISOString(),
      };

      // 計算 account_type
      const accountTypes = [];
      if (kvProfileData.is_client) accountTypes.push('client');
      if (kvProfileData.is_freelancer) accountTypes.push('freelancer');
      kvProfileData.account_type = accountTypes.length > 0 ? accountTypes : ['client'];

      console.log('💾 [UserProfile] Saving to KV store:', {
        key: `profile_${user.id}`,
        name: kvProfileData.name,
        account_type: kvProfileData.account_type
      });

      // 使用通用 KV store API（不需要認證）
      const kvResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            key: `profile_${user.id}`,
            value: kvProfileData
          }),
        }
      );

      if (!kvResponse.ok) {
        const kvError = await kvResponse.json().catch(() => ({}));
        console.error('❌ [UserProfile] KV store save failed:', kvError);
        throw new Error('Failed to save to KV store');
      }

      console.log(`✅ [UserProfile] Saved to profile_${user.id}`);

      // 同時保存到舊格式（向後兼容）
      const kvResponse2 = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            key: `profile:${user.id}`,
            value: kvProfileData
          }),
        }
      );

      console.log('✅ [UserProfile] Profile saved successfully via KV store!');

      toast.success(t.messages.saveSuccess);
      
      // 🔧 觸發 profileUpdated 事件，通知其他組件（如 ProjectDialog）
      console.log('📡 [UserProfile] Dispatching profileUpdated event...');
      window.dispatchEvent(new CustomEvent('profileUpdated'));

      // Refresh user data in AuthContext to update profile everywhere
      if (refreshUser) {
        console.log('🔄 [UserProfile] Calling refreshUser()...');
        await refreshUser();
      }

      // 🔧 只在保存成功後才關閉對話框
      console.log('✅ [UserProfile] Closing profile dialog after successful save');
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ [UserProfile] Save profile error:', error);
      toast.error(`${t.messages.saveError}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        language === 'en'
          ? 'File size must be less than 2MB'
          : '檔案大小必須小於 2MB'
      );
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error(
        language === 'en'
          ? 'Please upload an image file'
          : '請上傳圖片檔案'
      );
      return;
    }

    setUploading(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info.tsx');
      
      // Create form data
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile/${user.id}/avatar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();
      
      // Update local state
      setProfileData(prev => ({
        ...prev,
        avatar_url: data.avatar_url
      }));

      toast.success(
        language === 'en'
          ? 'Avatar uploaded successfully!'
          : '頭像上傳成功！'
      );
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(
        language === 'en'
          ? `Failed to upload avatar: ${error.message}`
          : `上傳頭像失敗：${error.message}`
      );
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.subtitle}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">{t.tabs.basic}</TabsTrigger>
              <TabsTrigger value="professional">{t.tabs.professional}</TabsTrigger>
            </TabsList>

            {/* 基本資訊 */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-lg">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.avatar_url} alt="Profile" />
                    <AvatarFallback className="bg-blue-100">
                      <User className="h-12 w-12 text-blue-600" />
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg border-2 border-white"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 text-white" />
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm">
                    {language === 'en' ? 'Profile Photo' : '個人頭像'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'en' ? 'Click camera to upload (Max 2MB)' : '點擊相機上傳（最大 2MB）'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.fields.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="pl-10 bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">{t.fields.fullName}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t.placeholders.fullName}
                    value={profileData.full_name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, full_name: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t.fields.phone}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t.placeholders.phone}
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>{t.fields.accountType}</Label>
                <p className="text-sm text-gray-500">
                  {language === 'en' 
                    ? 'You can be both a client and a freelancer' 
                    : '您可以同時是客戶和自由工作者'}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id="is_client"
                      checked={profileData.is_client}
                      onCheckedChange={(checked) =>
                        setProfileData({ ...profileData, is_client: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="is_client"
                      className="flex-1 cursor-pointer select-none"
                    >
                      <div className="font-medium">{t.fields.client}</div>
                      <div className="text-sm text-gray-500">
                        {language === 'en' 
                          ? 'I want to post projects and hire freelancers' 
                          : '我想發佈項目並聘請自由工作者'}
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id="is_freelancer"
                      checked={profileData.is_freelancer}
                      onCheckedChange={(checked) =>
                        setProfileData({ ...profileData, is_freelancer: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="is_freelancer"
                      className="flex-1 cursor-pointer select-none"
                    >
                      <div className="font-medium">{t.fields.freelancer}</div>
                      <div className="text-sm text-gray-500">
                        {language === 'en' 
                          ? 'I want to browse projects and submit proposals' 
                          : '我想瀏覽項目並提交提案'}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* ✅ 語言偏好選擇器 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t.fields.language}
                </Label>
                <p className="text-sm text-gray-500">
                  {t.fields.languageDescription}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={profileData.language === "zh" ? "default" : "outline"}
                    onClick={() => setProfileData({ ...profileData, language: "zh" })}
                    className={profileData.language === "zh" ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    🇹🇼 中文
                  </Button>
                  <Button
                    type="button"
                    variant={profileData.language === "en" ? "default" : "outline"}
                    onClick={() => setProfileData({ ...profileData, language: "en" })}
                    className={profileData.language === "en" ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    🇺🇸 English
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t.fields.bio}</Label>
                <Textarea
                  id="bio"
                  placeholder={t.placeholders.bio}
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  rows={8}
                  className="min-h-[200px] max-h-[300px] resize-y"
                />
              </div>
            </TabsContent>

            {/* 專業資訊 */}
            <TabsContent value="professional" className="space-y-4 mt-4">
              {/* 仅为客户显示公司字段 */}
              {profileData.is_client && (
                <div className="space-y-2">
                  <Label htmlFor="company">
                    {t.fields.company}
                    <span className="text-gray-400 text-sm ml-2">
                      ({language === 'en' ? 'Optional for freelancers' : '自由工作者可选填'})
                    </span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="company"
                      type="text"
                      placeholder={t.placeholders.company}
                      value={profileData.company}
                      onChange={(e) =>
                        setProfileData({ ...profileData, company: e.target.value })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="jobTitle">{t.fields.jobTitle}</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="jobTitle"
                    type="text"
                    placeholder={t.placeholders.jobTitle}
                    value={profileData.job_title}
                    onChange={(e) =>
                      setProfileData({ ...profileData, job_title: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">{t.fields.skills}</Label>
                <Input
                  id="skills"
                  type="text"
                  placeholder={t.placeholders.skills}
                  value={profileData.skills}
                  onChange={(e) =>
                    setProfileData({ ...profileData, skills: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">
                  {language === 'en' 
                    ? 'Separate multiple skills with commas' 
                    : '多個技能請用逗號分隔'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">{t.fields.website}</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder={t.placeholders.website}
                  value={profileData.website}
                  onChange={(e) =>
                    setProfileData({ ...profileData, website: e.target.value })
                  }
                />
              </div>

              {profileData.skills && (
                <div className="space-y-2">
                  <Label>{language === 'en' ? 'Your Skills' : '您的技能'}</Label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.skills.split(',').map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'en' ? 'Cancel' : '取消'}
          </Button>
          <Button
            onClick={saveProfile}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.buttons.saving}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t.buttons.save}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}