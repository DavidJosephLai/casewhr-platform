import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  Calendar,
  Clock,
  CheckCircle2,
  Crown,
  Send
} from 'lucide-react';

interface AccountManager {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  title: string;
  specialties: string[];
  languages: string[];
  timezone: string;
  availability: string;
}

interface ContactMessage {
  id: string;
  message: string;
  created_at: string;
  response?: string;
  responded_at?: string;
  status: 'pending' | 'responded';
}

interface AccountManagerProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function AccountManager({ language = 'en' }: AccountManagerProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [manager, setManager] = useState<AccountManager | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [contactHistory, setContactHistory] = useState<ContactMessage[]>([]);

  const translations = {
    en: {
      title: 'Your Account Manager',
      enterpriseOnly: 'Enterprise Only',
      upgrade: 'Upgrade to Enterprise',
      upgradeDesc: 'Get a dedicated account manager to help you succeed! Available exclusively for Enterprise plan.',
      contact: 'Contact Manager',
      viewHistory: 'View Contact History',
      specialties: 'Specialties',
      languages: 'Languages',
      timezone: 'Timezone',
      availability: 'Availability',
      sendMessage: 'Send Message',
      yourMessage: 'Your Message',
      messagePlaceholder: 'Type your message here...',
      send: 'Send',
      sending: 'Sending...',
      cancel: 'Cancel',
      messageSent: 'Message sent successfully',
      messageError: 'Failed to send message',
      noManager: 'No account manager assigned yet',
      pending: 'Pending Response',
      responded: 'Responded',
      benefits: {
        title: 'What Your Account Manager Can Help With:',
        items: [
          'Strategic guidance for growing your business',
          'Priority support for urgent issues',
          'Personalized platform training',
          'Custom feature recommendations',
          'Direct communication channel',
          'Quarterly business reviews'
        ]
      }
    },
    zh: {
      title: '您的專屬客戶經理',
      enterpriseOnly: '企業版專屬',
      upgrade: '升級至企業版',
      upgradeDesc: '獲得專屬客戶經理協助您成功！僅限企業版方案。',
      contact: '聯繫經理',
      viewHistory: '查看聯繫記錄',
      specialties: '專長領域',
      languages: '語言',
      timezone: '時區',
      availability: '服務時間',
      sendMessage: '發送訊息',
      yourMessage: '您的訊息',
      messagePlaceholder: '在此輸入您的訊息...',
      send: '發送',
      sending: '發送中...',
      cancel: '取消',
      messageSent: '訊息發送成功',
      messageError: '訊息發送失敗',
      noManager: '尚未分配客戶經理',
      pending: '等待回覆',
      responded: '已回覆',
      benefits: {
        title: '您的客戶經理可以協助：',
        items: [
          '業務增長的策略指導',
          '緊急問題的優先支援',
          '個人化平台培訓',
          '自訂功能建議',
          '直接溝通渠道',
          '季度業務審查'
        ]
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

      // Fetch account manager if enterprise
      const managerResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/account-manager`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (managerResponse.ok) {
        const managerData = await managerResponse.json();
        setManager(managerData.manager);
        if (managerData.contactHistory) {
          setContactHistory(managerData.contactHistory);
        }
      }
    } catch (error) {
      console.error('Error fetching account manager:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error(t.messageError, {
        description: language === 'en' ? 'Please enter a message' : '請輸入訊息',
      });
      return;
    }

    setSending(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/account-manager/contact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ message }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.success(t.messageSent);
      setMessage('');
      setContactDialogOpen(false);
      fetchData(); // Refresh to get new message
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t.messageError);
    } finally {
      setSending(false);
    }
  };

  const isEnterprise = subscription?.plan === 'enterprise';

  if (!isEnterprise) {
    return (
      <Card className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Crown className="size-8 text-amber-600" />
            <h3 className="text-2xl text-amber-900">{t.title}</h3>
          </div>
          <Badge className="bg-amber-600 text-white">
            {t.enterpriseOnly}
          </Badge>
          <p className="text-amber-800 max-w-md mx-auto">
            {t.upgradeDesc}
          </p>
          
          <div className="bg-white/50 rounded-lg p-6 mt-6">
            <h4 className="font-semibold text-amber-900 mb-4">{t.benefits.title}</h4>
            <ul className="text-left space-y-2 max-w-md mx-auto">
              {t.benefits.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-amber-800">
                  <CheckCircle2 className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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

  if (!manager) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            {t.noManager}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Manager Profile Card */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-20 border-4 border-white shadow-lg">
              <AvatarImage src={manager.avatar} alt={manager.name} />
              <AvatarFallback className="bg-blue-600 text-white text-xl">
                {manager.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{manager.name}</CardTitle>
              <CardDescription className="text-base mt-1">{manager.title}</CardDescription>
              <Badge className="mt-2 bg-blue-600">{t.enterpriseOnly}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Mail className="size-5 text-blue-600" />
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <a href={`mailto:${manager.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                  {manager.email}
                </a>
              </div>
            </div>

            {manager.phone && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Phone className="size-5 text-green-600" />
                <div>
                  <div className="text-xs text-gray-500">
                    {language === 'en' ? 'Phone' : '電話'}
                  </div>
                  <a href={`tel:${manager.phone}`} className="text-sm font-medium text-green-600 hover:underline">
                    {manager.phone}
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Clock className="size-5 text-purple-600" />
              <div>
                <div className="text-xs text-gray-500">{t.timezone}</div>
                <div className="text-sm font-medium">{manager.timezone}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Calendar className="size-5 text-orange-600" />
              <div>
                <div className="text-xs text-gray-500">{t.availability}</div>
                <div className="text-sm font-medium">{manager.availability}</div>
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <User className="size-4" />
              {t.specialties}
            </h4>
            <div className="flex flex-wrap gap-2">
              {manager.specialties.map((specialty, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="size-4" />
              {t.languages}
            </h4>
            <div className="flex flex-wrap gap-2">
              {manager.languages.map((lang, index) => (
                <Badge key={index} variant="outline" className="bg-purple-50">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <MessageSquare className="size-4 mr-2" />
                  {t.contact}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.sendMessage}</DialogTitle>
                  <DialogDescription>
                    {language === 'en' 
                      ? `Send a message to ${manager.name}. They will respond within 24 hours.`
                      : `向 ${manager.name} 發送訊息。他們將在 24 小時內回覆。`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Textarea
                    placeholder={t.messagePlaceholder}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setContactDialogOpen(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      {t.cancel}
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !message.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {sending ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
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
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Contact History */}
          {contactHistory.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold mb-3">{t.viewHistory}</h4>
              <div className="space-y-3">
                {contactHistory.slice(0, 3).map((contact) => (
                  <div key={contact.id} className="border-l-4 border-blue-600 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={contact.status === 'responded' ? 'default' : 'secondary'}>
                        {contact.status === 'responded' ? t.responded : t.pending}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(contact.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{contact.message}</p>
                    {contact.response && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700">
                        <strong>{manager.name}:</strong> {contact.response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}