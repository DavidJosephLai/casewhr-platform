import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useAuth } from './AuthProvider';
import { 
  Headphones, 
  Plus, 
  MessageSquare, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Crown,
  Zap,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  is_enterprise: boolean;
  response_time?: number;
  resolution_time?: number;
}

interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
}

interface PrioritySupportProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function PrioritySupport({ language = 'en' }: PrioritySupportProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium' as const
  });

  const translations = {
    en: {
      title: 'Priority Support 24/7',
      enterpriseOnly: 'Enterprise Only',
      upgrade: 'Upgrade to Enterprise',
      upgradeDesc: 'Get priority support with 24/7 availability and faster response times! Available exclusively for Enterprise plan.',
      createTicket: 'Create Support Ticket',
      subject: 'Subject',
      subjectPlaceholder: 'Brief description of your issue',
      description: 'Description',
      descriptionPlaceholder: 'Provide detailed information about your issue...',
      category: 'Category',
      selectCategory: 'Select category',
      priority: 'Priority',
      selectPriority: 'Select priority',
      create: 'Create Ticket',
      creating: 'Creating...',
      cancel: 'Cancel',
      status: 'Status',
      open: 'Open',
      inProgress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
      createdAt: 'Created',
      updatedAt: 'Updated',
      responseTime: 'Response Time',
      noTickets: 'No support tickets yet. Create one if you need assistance!',
      ticketCreated: 'Support ticket created successfully',
      categories: {
        technical: 'Technical Issue',
        billing: 'Billing & Payments',
        account: 'Account Management',
        feature: 'Feature Request',
        bug: 'Bug Report',
        other: 'Other'
      },
      priorities: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent'
      },
      sla: {
        title: 'Enterprise SLA',
        urgent: 'Urgent: 1 hour response',
        high: 'High: 2 hours response',
        medium: 'Medium: 4 hours response',
        low: 'Low: 8 hours response'
      },
      benefits: {
        title: 'Enterprise Support Benefits:',
        items: [
          '24/7 availability - Support anytime',
          'Priority queue - Jump ahead of standard users',
          'Faster response times - Based on SLA',
          'Dedicated support team',
          'Direct phone support available',
          'Quarterly check-in calls'
        ]
      },
      contact: {
        title: 'Contact Options',
        email: 'Email Support',
        emailDesc: 'support@casewhr.com',
        phone: 'Phone Support',
        phoneDesc: '+1-888-CASEWHR',
        hours: 'Available 24/7 for Enterprise users'
      }
    },
    zh: {
      title: '24/7 優先客服',
      enterpriseOnly: '企業版專屬',
      upgrade: '升級至企業版',
      upgradeDesc: '獲得 24/7 優先客服支援，享受更快的回應時間！僅限企業版方案。',
      createTicket: '創建支援工單',
      subject: '主旨',
      subjectPlaceholder: '簡要描述您的問題',
      description: '詳細說明',
      descriptionPlaceholder: '請詳細說明您遇到的問題...',
      category: '類別',
      selectCategory: '選擇類別',
      priority: '優先級',
      selectPriority: '選擇優先級',
      create: '創建工單',
      creating: '創建中...',
      cancel: '取消',
      status: '狀態',
      open: '待處理',
      inProgress: '處理中',
      resolved: '已解決',
      closed: '已關閉',
      createdAt: '創建時間',
      updatedAt: '更新時間',
      responseTime: '回應時間',
      noTickets: '尚無支援工單。如需協助請創建一個！',
      ticketCreated: '支援工單創建成功',
      categories: {
        technical: '技術問題',
        billing: '帳務與付款',
        account: '帳戶管理',
        feature: '功能建議',
        bug: 'Bug 回報',
        other: '其他'
      },
      priorities: {
        low: '低',
        medium: '中',
        high: '高',
        urgent: '緊急'
      },
      sla: {
        title: '企業版 SLA',
        urgent: '緊急：1小時內回應',
        high: '高：2小時內回應',
        medium: '中：4小時內回應',
        low: '低：8小時內回應'
      },
      benefits: {
        title: '企業版支援優勢：',
        items: [
          '24/7 全天候支援',
          '優先處理隊列 - 優先於一般用戶',
          '更快的回應時間 - 基於 SLA',
          '專屬支援團隊',
          '可直接電話支援',
          '季度檢查電話'
        ]
      },
      contact: {
        title: '聯繫方式',
        email: '郵件支援',
        emailDesc: 'support@casewhr.com',
        phone: '電話支援',
        phoneDesc: '+886-2-1234-5678',
        hours: '企業版用戶 24/7 可用'
      }
    },
    'zh-TW': {
      title: '24/7 優先客服',
      enterpriseOnly: '企業版專屬',
      upgrade: '升級至企業版',
      upgradeDesc: '獲得 24/7 優先客服支援，享受更快的回應時間！僅限企業版方案。',
      createTicket: '創建支援工單',
      subject: '主旨',
      subjectPlaceholder: '簡要描述您的問題',
      description: '詳細說明',
      descriptionPlaceholder: '請詳細說明您遇到的問題...',
      category: '類別',
      selectCategory: '選擇類別',
      priority: '優先級',
      selectPriority: '選擇優先級',
      create: '創建工單',
      creating: '創建中...',
      cancel: '取消',
      status: '狀態',
      open: '待處理',
      inProgress: '處理中',
      resolved: '已解決',
      closed: '已關閉',
      createdAt: '創建時間',
      updatedAt: '更新時間',
      responseTime: '回應時間',
      noTickets: '尚無支援工單。如需協助請創建一個！',
      ticketCreated: '支援工單創建成功',
      categories: {
        technical: '技術問題',
        billing: '帳務與付款',
        account: '帳戶管理',
        feature: '功能建議',
        bug: 'Bug 回報',
        other: '其他'
      },
      priorities: {
        low: '低',
        medium: '中',
        high: '高',
        urgent: '緊急'
      },
      sla: {
        title: '企業版 SLA',
        urgent: '緊急：1小時內回應',
        high: '高：2小時內回應',
        medium: '中：4小時內回應',
        low: '低：8小時內回應'
      },
      benefits: {
        title: '企業版支援優勢：',
        items: [
          '24/7 全天候支援',
          '優先處理隊列 - 優先於一般用戶',
          '更快的回應時間 - 基於 SLA',
          '專屬支援團隊',
          '可直接電話支援',
          '季度檢查電話'
        ]
      },
      contact: {
        title: '聯繫方式',
        email: '郵件支援',
        emailDesc: 'support@casewhr.com',
        phone: '電話支援',
        phoneDesc: '+886-2-1234-5678',
        hours: '企業版用戶 24/7 可用'
      }
    },
    'zh-CN': {
      title: '24/7 优先客服',
      enterpriseOnly: '企业版专属',
      upgrade: '升级至企业版',
      upgradeDesc: '获得 24/7 优先客服支持，享受更快的响应时间！仅限企业版方案。',
      createTicket: '创建支持工单',
      subject: '主题',
      subjectPlaceholder: '简要描述您的问题',
      description: '详细说明',
      descriptionPlaceholder: '请详细说明您遇到的问题...',
      category: '类别',
      selectCategory: '选择类别',
      priority: '优先级',
      selectPriority: '选择优先级',
      create: '创建工单',
      creating: '创建中...',
      cancel: '取消',
      status: '状态',
      open: '待处理',
      inProgress: '处理中',
      resolved: '已解决',
      closed: '已关闭',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      responseTime: '响应时间',
      noTickets: '尚无支持工单。如需协助请创建一个！',
      ticketCreated: '支持工单创建成功',
      categories: {
        technical: '技术问题',
        billing: '账务与付款',
        account: '账户管理',
        feature: '功能建议',
        bug: 'Bug 报告',
        other: '其他'
      },
      priorities: {
        low: '低',
        medium: '中',
        high: '高',
        urgent: '紧急'
      },
      sla: {
        title: '企业版 SLA',
        urgent: '紧急：1小时内响应',
        high: '高：2小时内响应',
        medium: '中：4小时内响应',
        low: '低：8小时内响应'
      },
      benefits: {
        title: '企业版支持优势：',
        items: [
          '24/7 全天候支持',
          '优先处理队列 - 优先于一般用户',
          '更快的响应时间 - 基于 SLA',
          '专属支持团队',
          '可直接电话支持',
          '季度检查电话'
        ]
      },
      contact: {
        title: '联系方式',
        email: '邮件支持',
        emailDesc: 'support@casewhr.com',
        phone: '电话支持',
        phoneDesc: '+886-2-1234-5678',
        hours: '企业版用户 24/7 可用'
      }
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch subscription
      const subResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/subscriptions/user/${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.subscription);
      }

      // Fetch support tickets if enterprise
      const ticketsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/support/tickets`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setTickets(ticketsData.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching support data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!formData.subject.trim() || !formData.description.trim() || !formData.category) {
      toast.error(language === 'en' ? 'Please fill in all fields' : '請填寫所有欄位');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/support/tickets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }

      toast.success(t.ticketCreated);
      setFormData({
        subject: '',
        description: '',
        category: '',
        priority: 'medium'
      });
      setCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(language === 'en' ? 'Failed to create ticket' : '創建工單失敗');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isEnterprise = subscription?.plan === 'enterprise';

  if (!isEnterprise) {
    return (
      <Card className="p-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Crown className="size-8 text-blue-600" />
            <h3 className="text-2xl text-blue-900">{t.title}</h3>
          </div>
          <Badge className="bg-blue-600 text-white">
            {t.enterpriseOnly}
          </Badge>
          <p className="text-blue-800 max-w-md mx-auto">
            {t.upgradeDesc}
          </p>
          
          <div className="bg-white/50 rounded-lg p-6 mt-6">
            <h4 className="font-semibold text-blue-900 mb-4">{t.benefits.title}</h4>
            <ul className="text-left space-y-2 max-w-md mx-auto">
              {t.benefits.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-blue-800">
                  <Zap className="size-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SLA Information */}
          <div className="bg-white/50 rounded-lg p-6 mt-4">
            <h4 className="font-semibold text-blue-900 mb-4">{t.sla.title}</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-600">{t.priorities.urgent}</Badge>
                <span className="text-blue-800">{t.sla.urgent}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-600">{t.priorities.high}</Badge>
                <span className="text-blue-800">{t.sla.high}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-600">{t.priorities.medium}</Badge>
                <span className="text-blue-800">{t.sla.medium}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">{t.priorities.low}</Badge>
                <span className="text-blue-800">{t.sla.low}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            {language === 'en' ? 'Loading...' : '載入中...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Headphones className="size-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{t.title}</CardTitle>
                <CardDescription className="mt-1">
                  {language === 'en' 
                    ? 'Get help from our dedicated support team anytime'
                    : '隨時從我們的專屬支援團隊獲得幫助'}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-blue-600">{t.enterpriseOnly}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* SLA Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="size-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">{t.sla.title}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="bg-white p-2 rounded">
                  <Badge className="bg-red-600 mb-1">{t.priorities.urgent}</Badge>
                  <p className="text-xs text-gray-600">{t.sla.urgent}</p>
                </div>
                <div className="bg-white p-2 rounded">
                  <Badge className="bg-orange-600 mb-1">{t.priorities.high}</Badge>
                  <p className="text-xs text-gray-600">{t.sla.high}</p>
                </div>
                <div className="bg-white p-2 rounded">
                  <Badge className="bg-yellow-600 mb-1">{t.priorities.medium}</Badge>
                  <p className="text-xs text-gray-600">{t.sla.medium}</p>
                </div>
                <div className="bg-white p-2 rounded">
                  <Badge className="bg-green-600 mb-1">{t.priorities.low}</Badge>
                  <p className="text-xs text-gray-600">{t.sla.low}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Options */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="size-5 text-blue-600" />
              <h4 className="font-semibold">{t.contact.email}</h4>
            </div>
            <p className="text-sm text-gray-600">{t.contact.emailDesc}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Phone className="size-5 text-green-600" />
              <h4 className="font-semibold">{t.contact.phone}</h4>
            </div>
            <p className="text-sm text-gray-600">{t.contact.phoneDesc}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="size-5 text-purple-600" />
              <h4 className="font-semibold">
                {language === 'en' ? 'Availability' : '服務時間'}
              </h4>
            </div>
            <p className="text-sm text-gray-600">{t.contact.hours}</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Ticket Button */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="size-4 mr-2" />
            {t.createTicket}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.createTicket}</DialogTitle>
            <DialogDescription>
              {language === 'en'
                ? 'Submit a support ticket and our team will respond according to your priority level.'
                : '提交支援工單，我們的團隊將根據您的優先級回應。'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">{t.subject}</Label>
              <Input
                id="subject"
                placeholder={t.subjectPlaceholder}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t.category}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">{t.categories.technical}</SelectItem>
                    <SelectItem value="billing">{t.categories.billing}</SelectItem>
                    <SelectItem value="account">{t.categories.account}</SelectItem>
                    <SelectItem value="feature">{t.categories.feature}</SelectItem>
                    <SelectItem value="bug">{t.categories.bug}</SelectItem>
                    <SelectItem value="other">{t.categories.other}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">{t.priority}</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectPriority} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t.priorities.low}</SelectItem>
                    <SelectItem value="medium">{t.priorities.medium}</SelectItem>
                    <SelectItem value="high">{t.priorities.high}</SelectItem>
                    <SelectItem value="urgent">{t.priorities.urgent}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t.description}</Label>
              <Textarea
                id="description"
                placeholder={t.descriptionPlaceholder}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setCreateDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                {t.cancel}
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={creating}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {creating ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {t.creating}
                  </>
                ) : (
                  <>
                    <Plus className="size-4 mr-2" />
                    {t.create}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'en' ? 'Your Support Tickets' : '您的支援工單'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t.noTickets}
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{ticket.subject}</h4>
                        {ticket.is_enterprise && (
                          <Badge className="bg-blue-600">
                            <Zap className="size-3 mr-1" />
                            Priority
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={getStatusColor(ticket.status)}>
                          {t[ticket.status as keyof typeof t] || ticket.status}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                          {t.priorities[ticket.priority]}
                        </Badge>
                        <Badge variant="outline">
                          {t.categories[ticket.category as keyof typeof t.categories]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {t.createdAt}: {new Date(ticket.created_at).toLocaleString(language === 'en' ? 'en-US' : 'zh-TW')}
                    </span>
                    {ticket.response_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {t.responseTime}: {Math.round(ticket.response_time / 60)}min
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}