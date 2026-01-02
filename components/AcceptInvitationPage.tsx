import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../lib/supabase';

interface AcceptInvitationPageProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function AcceptInvitationPage({ language = 'en' }: AcceptInvitationPageProps) {
  const { setLanguage } = useLanguage();
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'pending' | 'success' | 'error' | 'not-found'>('pending');
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string>('');
  
  // 登入表單狀態
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const translations = {
    en: {
      title: 'Team Invitation',
      loading: 'Loading invitation...',
      notFound: 'Invitation Not Found',
      notFoundDesc: 'The invitation link is invalid or has expired.',
      pleaseSignIn: 'Please Sign In',
      pleaseSignInDesc: 'You need to sign in to accept this team invitation.',
      invitedTo: 'You have been invited to join',
      invitedBy: 'Invited by',
      role: 'Role',
      accept: 'Accept Invitation',
      accepting: 'Accepting...',
      success: 'Successfully Joined!',
      successDesc: 'You have successfully joined the team.',
      goToDashboard: 'Go to Dashboard',
      error: 'Error',
      alreadyProcessed: 'This invitation has already been processed.',
      wrongEmail: 'This invitation is for a different email address. Please sign in with the correct account.',
      emailPlaceholder: 'Email',
      passwordPlaceholder: 'Password',
      signIn: 'Sign In',
      signingIn: 'Signing in...',
      admin: 'Admin',
      member: 'Member',
    },
    zh: {
      title: '團隊邀請',
      loading: '載入邀請中...',
      notFound: '找不到邀請',
      notFoundDesc: '邀請連結無效或已過期。',
      pleaseSignIn: '請先登入',
      pleaseSignInDesc: '您需要登入才能接受此團隊邀請。',
      invitedTo: '您已被邀請加入',
      invitedBy: '邀請人',
      role: '角色',
      accept: '接受邀請',
      accepting: '接中...',
      success: '成功加入！',
      successDesc: '您已成功加入團隊。',
      goToDashboard: '前往控制台',
      error: '錯誤',
      alreadyProcessed: '此邀請已經處理過了。',
      wrongEmail: '此邀請是發給其他電子郵件地址的。請使用正確的帳號登入。',
      emailPlaceholder: '電子郵件',
      passwordPlaceholder: '密碼',
      signIn: '登入',
      signingIn: '登入中...',
      admin: '管理員',
      member: '成員',
    },
    'zh-TW': {
      title: '團隊邀請',
      loading: '載入邀請中...',
      notFound: '找不到邀請',
      notFoundDesc: '邀請連結無效或已過期。',
      pleaseSignIn: '請先登入',
      pleaseSignInDesc: '您需要登入才能接受此團隊邀請。',
      invitedTo: '您已被邀請加入',
      invitedBy: '邀請人',
      role: '角色',
      accept: '接受邀請',
      accepting: '接中...',
      success: '成功加入！',
      successDesc: '您已成功加入團隊。',
      goToDashboard: '前往控制台',
      error: '錯誤',
      alreadyProcessed: '此邀請已經處理過了。',
      wrongEmail: '此邀請是發給其他電子郵件地址的。請使用正確的帳號登入。',
      emailPlaceholder: '電子郵件',
      passwordPlaceholder: '密碼',
      signIn: '登入',
      signingIn: '登入中...',
      admin: '管理員',
      member: '成員',
    },
    'zh-CN': {
      title: '团队邀请',
      loading: '加载邀请中...',
      notFound: '找不到邀请',
      notFoundDesc: '邀请链接无效或已过期。',
      pleaseSignIn: '请先登录',
      pleaseSignInDesc: '您需要登录才能接受此团队邀请。',
      invitedTo: '您已被邀请加入',
      invitedBy: '邀请人',
      role: '角色',
      accept: '接受邀请',
      accepting: '接受中...',
      success: '成功加入！',
      successDesc: '您已成功加入团队。',
      goToDashboard: '前往控制台',
      error: '错误',
      alreadyProcessed: '此邀请已经处理过了。',
      wrongEmail: '此邀请是发给其他电子邮件地址的。请使用正确的账号登录。',
      emailPlaceholder: '电子邮件',
      passwordPlaceholder: '密码',
      signIn: '登录',
      signingIn: '登录中...',
      admin: '管理员',
      member: '成员',
    }
  };

  const t = translations[language];

  // 從 URL 參數獲取 inviteId
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (id) {
      setInviteId(id);
      console.log('📧 [AcceptInvitation] Invite ID from URL:', id);
      
      // 🔧 NEW: Read invitation details from URL parameters (no API call needed!)
      const email = urlParams.get('email');
      const org = urlParams.get('org');
      const role = urlParams.get('role');
      const inviter = urlParams.get('inviter');
      
      // 🔧 FIX: Make invitation validation more lenient - only email is truly required
      if (email) {
        // We have all the details in the URL - no need to call API!
        const invitationFromUrl = {
          id,
          email: decodeURIComponent(email),
          organization_name: org ? decodeURIComponent(org) : 'Organization',
          role: role || 'member',
          inviter_name: inviter ? decodeURIComponent(inviter) : 'Team Admin',
          status: 'invited'
        };
        
        setInvitation(invitationFromUrl);
        setLoading(false);
        console.log('✅ [AcceptInvitation] Loaded invitation from URL (lenient mode):', invitationFromUrl);
      } else {
        // Fallback: Try to load from API (for old invitation links)
        console.log('⚠️ [AcceptInvitation] Missing email in URL, will try API fallback');
        setLoading(false); // Will be handled by the next useEffect
      }
    } else {
      setStatus('not-found');
      setLoading(false);
      console.error('❌ [AcceptInvitation] No invite ID in URL');
    }
  }, []);

  // 載入邀請資料
  useEffect(() => {
    // 🔧 NEW: Only load from API if we don't have invitation data from URL (backward compatibility)
    if (!inviteId || invitation) return; // Skip if no ID or already have data

    const loadInvitation = async () => {
      try {
        // 🔥 重要：現在所有 API 都需要真實的 access token
        // 如果用戶未登入，我們使用 publicAnonKey 作為後備
        const authHeader = supabase.auth.session() 
          ? `Bearer ${supabase.auth.session()?.access_token}` 
          : `Bearer ${publicAnonKey}`;
        
        console.log('🔑 [AcceptInvitation] Loading invitation from API (fallback for old links)');
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/team/invitation/${inviteId}`,
          {
            headers: {
              'Authorization': authHeader,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setInvitation(data.invitation);
          console.log('✅ [AcceptInvitation] Loaded invitation from API:', data.invitation);
        } else {
          const errorData = await response.json();
          console.error('❌ [AcceptInvitation] Failed to load invitation:', errorData);
          setStatus('not-found');
        }
      } catch (error) {
        console.error('❌ [AcceptInvitation] Error loading invitation:', error);
        setStatus('not-found');
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [inviteId, invitation]);

  // 當用戶已登入且邀請已載入時，檢查是否為正確的用戶
  useEffect(() => {
    if (supabase.auth.session() && invitation && !processing && status === 'pending') {
      // 檢查是否為正確的郵箱
      if (supabase.auth.session()?.user.email !== invitation.email) {
        setStatus('error');
        setError(t.wrongEmail);
        toast.error(t.wrongEmail);
        return;
      }
    }
  }, [supabase.auth.session(), invitation, processing, status, t.wrongEmail]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(language === 'en' ? 'Please enter email and password' : '請輸入郵箱和密碼');
      return;
    }

    setSigningIn(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (data.session) {
        // 登入成功，調用 AuthContext 的 signIn 來更新狀態
        setLanguage(language);
        
        toast.success(language === 'en' ? 'Signed in successfully!' : '登入成功！');
        
        // 登入後會自動觸發接受邀請的流程（通過 useEffect）
      }
    } catch (error: any) {
      console.error('❌ [AcceptInvitation] Sign in error:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to sign in' : '登入失敗'));
    } finally {
      setSigningIn(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!inviteId || !supabase.auth.session()) {
      toast.error(language === 'en' ? 'Please sign in first' : '請先登入');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // 🔧 FIX: Send invitation data from URL in case it's not in database
      const requestBody = invitation ? {
        email: invitation.email,
        organization_name: invitation.organization_name,
        role: invitation.role,
        inviter_name: invitation.inviter_name
      } : {};
      
      console.log('📤 [AcceptInvitation] Sending request with body:', requestBody);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/team/accept-invitation/${inviteId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatus('success');
        toast.success(t.success, { duration: 5000 });
        console.log('✅ [AcceptInvitation] Successfully accepted invitation:', data);
        
        // 3 秒後跳轉到 Dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);
      } else {
        const errorData = await response.json();
        console.error('❌ [AcceptInvitation] Failed to accept invitation:', errorData);
        
        // 🔧 Better error messages
        let errorMessage = errorData.error || (language === 'en' ? 'Failed to accept invitation' : '接受邀請失敗');
        
        // Show debug info if available
        if (errorData.debug) {
          console.log('🔍 [AcceptInvitation] Debug info:', errorData.debug);
          errorMessage += `\n\nDebug: Found ${errorData.debug.totalInvitations} invitations in database`;
          errorMessage += `\nLooking for ID: ${errorData.debug.inviteId}`;
        }
        
        setStatus('error');
        setError(errorMessage);
        toast.error(errorMessage, { duration: 7000 });
      }
    } catch (error: any) {
      console.error('❌ [AcceptInvitation] Error accepting invitation:', error);
      setStatus('error');
      setError(error.message || (language === 'en' ? 'An error occurred' : '發生錯誤'));
      toast.error(error.message || (language === 'en' ? 'An error occurred' : '發生錯誤'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="size-12 animate-spin text-purple-600" />
              <p className="text-gray-600">{t.loading}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <XCircle className="size-8 text-red-500" />
              <div>
                <CardTitle>{t.notFound}</CardTitle>
                <CardDescription>{t.notFoundDesc}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-8 text-green-500" />
              <div>
                <CardTitle>{t.success}</CardTitle>
                <CardDescription>{t.successDesc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setView('dashboard')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {t.goToDashboard}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 需要登入
  if (!supabase.auth.session() && invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="size-8 text-purple-600" />
              <div>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.pleaseSignInDesc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 邀請資訊 */}
            <div className="bg-purple-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-gray-600">{t.invitedTo}:</p>
              <p className="text-purple-900">{invitation.organization_name || 'Team'}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.role}:</span>
                <span className="text-gray-900">{invitation.role === 'admin' ? t.admin : t.member}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.invitedBy}:</span>
                <span className="text-gray-900">{invitation.inviter_name || 'Unknown'}</span>
              </div>
            </div>

            {/* 登入表單 */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={signingIn}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {signingIn ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t.signingIn}
                  </>
                ) : (
                  <>
                    <LogIn className="size-4 mr-2" />
                    {t.signIn}
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-center text-gray-500">
              {language === 'en' 
                ? `Please sign in with: ${invitation.email}` 
                : `請使用此郵箱登入：${invitation.email}`}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 已登入，顯示接受邀請按鈕
  if (supabase.auth.session() && invitation && status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="size-8 text-purple-600" />
              <div>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.invitedTo}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 邀請資訊 */}
            <div className="bg-purple-50 rounded-lg p-4 space-y-2">
              <p className="text-purple-900">{invitation.organization_name || 'Team'}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.role}:</span>
                <span className="text-gray-900">{invitation.role === 'admin' ? t.admin : t.member}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.invitedBy}:</span>
                <span className="text-gray-900">{invitation.inviter_name || 'Unknown'}</span>
              </div>
            </div>

            {/* 接受按鈕 */}
            <Button
              onClick={handleAcceptInvitation}
              disabled={processing}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {processing ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t.accepting}
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 mr-2" />
                  {t.accept}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 錯誤狀態
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <XCircle className="size-8 text-red-500" />
              <div>
                <CardTitle>{t.error}</CardTitle>
                <CardDescription>{error || t.alreadyProcessed}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setView('dashboard')}
              variant="outline"
              className="w-full"
            >
              {t.goToDashboard}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

export default AcceptInvitationPage;