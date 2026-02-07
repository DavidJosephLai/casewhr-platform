import { useLanguage } from "../lib/LanguageContext";
import { useView } from "../contexts/ViewContext"; // ✅ 添加 useView
import { useAuth } from "../contexts/AuthContext";
import { translations, getTranslation } from "../lib/translations";
import { 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  Globe, 
  Calendar,
  MessageCircle,
  UserPlus,
  ExternalLink,
  User,
  Crown,
  Lock
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { ReviewList } from "./rating/ReviewList";
import { StartMessageDialog } from "./StartMessageDialog";
import { useState, useEffect } from "react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface TalentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent: {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    phone?: string;
    company?: string;
    job_title?: string;
    bio?: string;
    skills?: string | string[];
    website?: string;
    created_at: string;
    avatar_url?: string;
    subscription_plan?: 'free' | 'pro' | 'enterprise';
  } | null;
}

export function TalentDetailDialog({
  open,
  onOpenChange,
  talent,
}: TalentDetailDialogProps) {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const { setView } = useView(); // ✅ 添加 setView
  const t = getTranslation(language as any).talent.detail;
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [contactLimit, setContactLimit] = useState<{
    canContact: boolean;
    isUnlimited: boolean;
    contactsThisMonth: number;
    limit: number;
  } | null>(null);
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);

  // Check contact limit when dialog opens
  useEffect(() => {
    const checkContactLimit = async () => {
      if (!user || !accessToken || !talent || !open) {
        return;
      }

      // Only check if talent is premium (Pro or Enterprise)
      const isPremiumTalent = talent.subscription_plan === 'pro' || talent.subscription_plan === 'enterprise';
      
      if (!isPremiumTalent) {
        // Not a premium talent, no restrictions
        setContactLimit({ canContact: true, isUnlimited: true, contactsThisMonth: 0, limit: -1 });
        return;
      }

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/premium-contacts/check`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setContactLimit(data);
          setShowUpgradeAlert(!data.canContact && !data.isUnlimited);
        }
      } catch (error) {
        console.error('Failed to check contact limit:', error);
      }
    };

    checkContactLimit();
  }, [user, accessToken, talent, open]);

  if (!talent) return null;

  // Handle both string and array formats for skills
  const skillsArray = talent.skills
    ? (typeof talent.skills === 'string' 
        ? talent.skills.split(',').map(s => s.trim()).filter(Boolean)
        : Array.isArray(talent.skills)
          ? talent.skills
          : [])
    : [];

  const joinedDate = new Date(talent.created_at).toLocaleDateString(
    language === 'en' ? 'en-US' : 'zh-TW',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={talent.avatar_url}
                alt={talent.full_name || talent.email}
              />
              <AvatarFallback className="bg-blue-100">
                <User className="h-10 w-10 text-blue-600" />
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">
                {talent.full_name || talent.email}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="flex items-center gap-2 mt-1">
                  {talent.job_title ? (
                    <>
                      <Briefcase className="h-4 w-4" />
                      <span>{talent.job_title}</span>
                    </>
                  ) : (
                    <span>{t.noJobTitle}</span>
                  )}
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">{t.profile}</TabsTrigger>
            <TabsTrigger value="reviews">{t.reviews}</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <div className="space-y-6 mt-6">
              {/* Bio Section */}
              <div>
                <h3 className="flex items-center gap-2 mb-3">
                  <User className="h-5 w-5 text-blue-600" />
                  {t.profile}
                </h3>
                <p className="text-gray-700">
                  {talent.bio || t.noBio}
                </p>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h3 className="flex items-center gap-2 mb-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  {t.contact}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{talent.email}</span>
                  </div>
                  {talent.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{talent.phone}</span>
                    </div>
                  )}
                  {talent.website && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a
                        href={talent.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {t.visitWebsite}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Professional Information */}
              <div>
                <h3 className="flex items-center gap-2 mb-3">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  {t.professional}
                </h3>
                <div className="space-y-2">
                  {talent.company && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{talent.company}</span>
                    </div>
                  )}
                  {!talent.company && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500 italic">{t.noCompany}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {language === 'en' ? 'Joined' : '加入日期'} {joinedDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {skillsArray.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-3">
                      {language === 'en' ? 'Skills & Expertise' : '技能與專長'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {skillsArray.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          <TabsContent value="reviews">
            <ReviewList userId={talent.user_id} />
          </TabsContent>
        </Tabs>

        {/* Premium Contact Limit Warning */}
        {showUpgradeAlert && (talent.subscription_plan === 'pro' || talent.subscription_plan === 'enterprise') && (
          <Alert className="bg-amber-50 border-amber-200 mt-4">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              {language === 'en' ? (
                <>
                  <strong>Premium Talent Contact Limit Reached</strong>
                  <br />
                  You've used your free monthly contact with premium talents. Upgrade to <strong>Pro</strong> or <strong>Enterprise</strong> for unlimited contacts.
                </>
              ) : language === 'zh-CN' ? (
                <>
                  <strong>进阶人才联络次数已用完</strong>
                  <br />
                  您已使用本月免费联络进阶人才的次数。升级至 <strong>Pro</strong> 或 <strong>Enterprise</strong> 方案以解锁无限联络。
                </>
              ) : (
                <>
                  <strong>進階人才聯絡次數已用完</strong>
                  <br />
                  您已使用本月免費聯絡進階人才的次數。升級至 <strong>Pro</strong> 或 <strong>Enterprise</strong> 方案以解鎖無限聯絡。
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-6 border-t">
          {showUpgradeAlert ? (
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              onClick={() => {
                onOpenChange(false);
                setTimeout(() => {
                  setView('pricing'); // ✅ 正確的跳轉方式
                }, 200);
              }}
            >
              <Crown className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Upgrade to Contact' : language === 'zh-CN' ? '升级以联络' : '升級以聯絡'}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
              disabled={contactLimit !== null && !contactLimit.canContact}
              onClick={() => {
                if (!user) {
                  window.dispatchEvent(new CustomEvent('openAuthDialog', { detail: 'login' }));
                  return;
                }
                // Open the message dialog
                setIsMessageDialogOpen(true);
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {t.contactButton}
            </Button>
          )}
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              if (!user) {
                window.dispatchEvent(new CustomEvent('openAuthDialog', { detail: 'login' }));
                return;
              }
              onOpenChange(false);
              // 觸發打開發布項目對話框
              setTimeout(() => {
                setView('postProject'); // ✅ 使用 setView
                window.dispatchEvent(new CustomEvent('openPostProject', { 
                  detail: { prefilledFreelancerId: talent.id, freelancerName: talent.full_name }
                }));
              }, 200);
            }}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {t.hireButton}
          </Button>
        </div>

        {/* Start Message Dialog */}
        <StartMessageDialog
          open={isMessageDialogOpen}
          onOpenChange={setIsMessageDialogOpen}
          recipientId={talent.user_id}
          recipientName={talent.full_name || talent.email}
          recipientAvatar={talent.avatar_url}
        />
      </DialogContent>
    </Dialog>
  );
}