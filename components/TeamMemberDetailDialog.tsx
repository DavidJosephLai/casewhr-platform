import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Star,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Globe,
  Award,
  DollarSign,
  Clock,
  Target,
  Code,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '../utils/supabase/info';

interface TeamMemberDetailDialogProps {
  member: any;
  open: boolean;
  onClose: () => void;
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function TeamMemberDetailDialog({ 
  member, 
  open, 
  onClose,
  language = 'en' 
}: TeamMemberDetailDialogProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // 郵件發送狀態
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sending, setSending] = useState(false);

  const translations = {
    en: {
      title: 'Team Member Details',
      profile: 'Profile',
      contact: 'Contact',
      loading: 'Loading member information...',
      error: 'Failed to load member information',
      // Profile fields
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      location: 'Location',
      company: 'Company',
      jobTitle: 'Job Title',
      role: 'Role',
      status: 'Status',
      joinedAt: 'Joined',
      skills: 'Skills',
      bio: 'Bio',
      rating: 'Rating',
      completedProjects: 'Completed Projects',
      website: 'Website',
      hourlyRate: 'Hourly Rate',
      availability: 'Availability',
      accountType: 'Account Type',
      language: 'Language',
      // Contact form
      sendMessage: 'Send Message',
      subject: 'Subject',
      message: 'Message',
      subjectPlaceholder: 'Message subject',
      messagePlaceholder: 'Type your message here...',
      send: 'Send',
      sending: 'Sending...',
      sendSuccess: 'Message sent successfully!',
      sendError: 'Failed to send message',
      // Status badges
      active: 'Active',
      invited: 'Pending',
      inactive: 'Inactive',
      owner: 'Owner',
      admin: 'Admin',
      member: 'Member',
      client: 'Client',
      freelancer: 'Freelancer',
      // Actions
      close: 'Close',
      noProfile: 'Profile information not available',
      professionalInfo: 'Professional Information',
      contactInfo: 'Contact Information',
      accountDetails: 'Account Details',
    },
    zh: {
      title: '團隊成員詳情',
      profile: '個人資料',
      contact: '聯繫',
      loading: '載入成員資訊中...',
      error: '載入成員資訊失敗',
      // Profile fields
      name: '姓名',
      email: '電子郵件',
      phone: '電話',
      location: '地點',
      company: '公司',
      jobTitle: '職稱',
      role: '角色',
      status: '狀態',
      joinedAt: '加入時間',
      skills: '技能',
      bio: '簡介',
      rating: '評分',
      completedProjects: '完成專案',
      website: '網站',
      hourlyRate: '時薪',
      availability: '可用性',
      accountType: '帳戶類型',
      language: '語言',
      // Contact form
      sendMessage: '發送訊息',
      subject: '主旨',
      message: '訊息',
      subjectPlaceholder: '訊息主旨',
      messagePlaceholder: '在此輸入您的訊息...',
      send: '發送',
      sending: '發送中...',
      sendSuccess: '訊息發送成功！',
      sendError: '發送訊息失敗',
      // Status badges
      active: '活躍',
      invited: '待確認',
      inactive: '啟用',
      owner: '擁有者',
      admin: '管理員',
      member: '成員',
      client: '案主',
      freelancer: '接案者',
      // Actions
      close: '關閉',
      noProfile: '無個人資料',
      professionalInfo: '專業資訊',
      contactInfo: '聯絡資訊',
      accountDetails: '帳戶詳情',
    },
    'zh-TW': {
      title: '團隊成員詳情',
      profile: '個人資料',
      contact: '聯繫',
      loading: '載入成員資訊中...',
      error: '載入成員資訊失敗',
      // Profile fields
      name: '姓名',
      email: '電子郵件',
      phone: '電話',
      location: '地點',
      company: '公司',
      jobTitle: '職稱',
      role: '角色',
      status: '狀態',
      joinedAt: '加入時間',
      skills: '技能',
      bio: '簡介',
      rating: '評分',
      completedProjects: '完成專案',
      website: '網站',
      hourlyRate: '時薪',
      availability: '可用性',
      accountType: '帳戶類型',
      language: '語言',
      // Contact form
      sendMessage: '發送訊息',
      subject: '主旨',
      message: '訊息',
      subjectPlaceholder: '訊息主旨',
      messagePlaceholder: '在此輸入您的訊息...',
      send: '發送',
      sending: '發送中...',
      sendSuccess: '訊息發送成功！',
      sendError: '發送訊息失敗',
      // Status badges
      active: '活躍',
      invited: '待確認',
      inactive: '啟用',
      owner: '擁有者',
      admin: '管理員',
      member: '成員',
      client: '案主',
      freelancer: '接案者',
      // Actions
      close: '關閉',
      noProfile: '無個人資料',
      professionalInfo: '專業資訊',
      contactInfo: '聯絡資訊',
      accountDetails: '帳戶詳情',
    },
    'zh-CN': {
      title: '团队成员详情',
      profile: '个人资料',
      contact: '联系',
      loading: '加载成员信息中...',
      error: '加载成员信息失败',
      // Profile fields
      name: '姓名',
      email: '电子邮件',
      phone: '电话',
      location: '地点',
      company: '公司',
      jobTitle: '职位',
      role: '角色',
      status: '状态',
      joinedAt: '加入时间',
      skills: '技能',
      bio: '简介',
      rating: '评分',
      completedProjects: '完成项目',
      website: '网站',
      hourlyRate: '时薪',
      availability: '可用性',
      accountType: '账户类型',
      language: '语言',
      // Contact form
      sendMessage: '发送消息',
      subject: '主题',
      message: '消息',
      subjectPlaceholder: '消息主题',
      messagePlaceholder: '在此输入您的消息...',
      send: '发���',
      sending: '发送中...',
      sendSuccess: '消息发送成功！',
      sendError: '发送消息失败',
      // Status badges
      active: '活跃',
      invited: '待确认',
      inactive: '未启用',
      owner: '拥有者',
      admin: '管理员',
      member: '成员',
      client: '客户',
      freelancer: '自由职业者',
      // Actions
      close: '关闭',
      noProfile: '无个人资料',
      professionalInfo: '专业信息',
      contactInfo: '联系信息',
      accountDetails: '账户详情',
    }
  };

  const t = translations[language];

  // 載入成員詳細資料
  useEffect(() => {
    if (open && member) {
      loadMemberProfile();
    }
  }, [open, member]);

  const loadMemberProfile = async () => {
    if (!member?.user_id) {
      console.log('⚠️ [MemberDetail] No user_id, using basic member info');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/team/member/${member.user_id}/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        console.log('✅ [MemberDetail] Loaded profile:', data.profile);
      } else {
        console.error('❌ [MemberDetail] Failed to load profile');
      }
    } catch (error) {
      console.error('❌ [MemberDetail] Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error(language === 'en' ? 'Please fill in subject and message' : '請填寫主旨和訊息');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/team/send-message`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient_email: member.email,
            recipient_name: member.full_name || profile?.full_name || member.email,
            subject: emailSubject,
            message: emailMessage,
          }),
        }
      );

      if (response.ok) {
        toast.success(t.sendSuccess, { duration: 5000 });
        setEmailSubject('');
        setEmailMessage('');
        console.log('✅ [MemberDetail] Message sent successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t.sendError);
        console.error('❌ [MemberDetail] Failed to send message:', errorData);
      }
    } catch (error: any) {
      console.error('❌ [MemberDetail] Error sending message:', error);
      toast.error(t.sendError);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = () => {
    const status = member?.status || 'inactive';
    const statusColors = {
      active: 'bg-green-100 text-green-800 border-green-300',
      invited: 'bg-orange-100 text-orange-800 border-orange-300',
      inactive: 'bg-gray-100 text-gray-800 border-gray-300',
    };

    return (
      <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
        {status === 'active' && <CheckCircle2 className="size-3 mr-1" />}
        {status === 'invited' && <XCircle className="size-3 mr-1" />}
        {t[status as keyof typeof t] || status}
      </Badge>
    );
  };

  const getRoleBadge = () => {
    const role = member?.role || 'member';
    const roleColors = {
      owner: 'bg-amber-600 text-white',
      admin: 'bg-blue-600 text-white',
      member: 'bg-gray-600 text-white',
    };

    return (
      <Badge className={roleColors[role as keyof typeof roleColors]}>
        {t[role as keyof typeof t] || role}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="size-6 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {member?.full_name || profile?.full_name || member?.email}
                {getStatusBadge()}
                {getRoleBadge()}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            {t.title}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">
              <User className="size-4 mr-2" />
              {t.profile}
            </TabsTrigger>
            <TabsTrigger value="contact">
              <MessageSquare className="size-4 mr-2" />
              {t.contact}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-purple-600" />
                <span className="ml-3 text-gray-600">{t.loading}</span>
              </div>
            ) : profile ? (
              <div className="space-y-6">
                {/* Contact Information Section */}
                <Card className="p-4 border-2 border-blue-100">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Mail className="size-5" />
                    {t.contactInfo}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Mail className="size-4" />
                        {t.email}
                      </div>
                      <div className="font-medium text-sm">{profile.email || member?.email || 'N/A'}</div>
                    </div>

                    {profile?.phone && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Phone className="size-4" />
                          {t.phone}
                        </div>
                        <div className="font-medium text-sm">{profile.phone}</div>
                      </div>
                    )}

                    {profile?.location && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <MapPin className="size-4" />
                          {t.location}
                        </div>
                        <div className="font-medium text-sm">{profile.location}</div>
                      </div>
                    )}

                    {profile?.website && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Globe className="size-4" />
                          {t.website}
                        </div>
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-sm text-blue-600 hover:underline"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Professional Information Section */}
                <Card className="p-4 border-2 border-purple-100">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Briefcase className="size-5" />
                    {t.professionalInfo}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile?.company && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Briefcase className="size-4" />
                          {t.company}
                        </div>
                        <div className="font-medium text-sm">{profile.company}</div>
                      </div>
                    )}

                    {profile?.job_title && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Award className="size-4" />
                          {t.jobTitle}
                        </div>
                        <div className="font-medium text-sm">{profile.job_title}</div>
                      </div>
                    )}

                    {profile?.hourly_rate && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <DollarSign className="size-4" />
                          {t.hourlyRate}
                        </div>
                        <div className="font-medium text-sm">${profile.hourly_rate}/hr</div>
                      </div>
                    )}

                    {profile?.availability && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Clock className="size-4" />
                          {t.availability}
                        </div>
                        <div className="font-medium text-sm">{profile.availability}</div>
                      </div>
                    )}

                    {profile?.rating && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Star className="size-4" />
                          {t.rating}
                        </div>
                        <div className="font-medium text-sm flex items-center gap-1">
                          {profile.rating}
                          <Star className="size-4 fill-yellow-400 text-yellow-400" />
                        </div>
                      </div>
                    )}

                    {profile?.completed_projects !== undefined && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Target className="size-4" />
                          {t.completedProjects}
                        </div>
                        <div className="font-medium text-sm">{profile.completed_projects}</div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Bio */}
                {profile?.bio && (
                  <Card className="p-4 border-2 border-green-100">
                    <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <User className="size-5" />
                      {t.bio}
                    </h3>
                    <div className="text-gray-900 text-sm whitespace-pre-wrap leading-relaxed">
                      {profile.bio}
                    </div>
                  </Card>
                )}

                {/* Skills */}
                {profile?.skills && profile.skills.length > 0 && (
                  <Card className="p-4 border-2 border-amber-100">
                    <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                      <Code className="size-5" />
                      {t.skills}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-amber-50 text-amber-900 border-amber-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Account Details */}
                <Card className="p-4 border-2 border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="size-5" />
                    {t.accountDetails}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar className="size-4" />
                        {t.joinedAt}
                      </div>
                      <div className="font-medium text-sm">
                        {member?.added_at 
                          ? new Date(member.added_at).toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'N/A'
                        }
                      </div>
                    </div>

                    {(profile?.is_client || profile?.is_freelancer) && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <User className="size-4" />
                          {t.accountType}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {profile.is_client && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {t.client}
                            </Badge>
                          )}
                          {profile.is_freelancer && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {t.freelancer}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {profile?.language && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Globe className="size-4" />
                          {t.language}
                        </div>
                        <div className="font-medium text-sm">
                          {profile.language === 'zh' ? '中文' : 'English'}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="size-12 mx-auto mb-2 opacity-30" />
                <p>{t.noProfile}</p>
              </div>
            )}
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-4 mt-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Mail className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">{t.sendMessage}</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    {language === 'en' 
                      ? `Send an email to ${member?.full_name || member?.email}`
                      : `發送郵件給 ${member?.full_name || member?.email}`
                    }
                  </p>
                  <div className="mt-3 p-3 bg-cyan-50 border border-cyan-200 rounded text-xs text-cyan-900">
                    <p className="font-semibold mb-1">
                      {language === 'en' ? '📧 Direct Reply Feature' : '📧 直接回覆功能'}
                    </p>
                    <p className="leading-relaxed">
                      {language === 'en' 
                        ? 'The recipient can reply directly to this email, and their response will come straight to your inbox.'
                        : '收件人可以直接回覆此郵件，他們的回覆將直接發送到您的收件箱。'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t.subject}
                </label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder={t.subjectPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t.message}
                </label>
                <Textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder={t.messagePlaceholder}
                  rows={15}
                  className="resize-none min-h-[300px]"
                />
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={sending || !emailSubject.trim() || !emailMessage.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {sending ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t.sending}
                  </>
                ) : (
                  <>
                    <Send className="size-4 mr-2" />
                    {t.send}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}