import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { projectId } from '../../utils/supabase/info';

export function DebugAdminProfile() {
  const { accessToken } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const t = language === 'en' ? {
    title: 'Debug User Profile',
    description: 'Check admin status in database for any user',
    emailLabel: 'User Email',
    emailPlaceholder: 'user@example.com',
    checkButton: 'Check Profile',
    checking: 'Checking...',
    noResult: 'No results yet. Enter an email and click Check Profile.',
    colonFormat: 'Colon Format (profile:userId)',
    underscoreFormat: 'Underscore Format (profile_userId)',
    exists: 'Exists',
    notExists: 'Does Not Exist',
    isAdmin: 'Is Admin',
    adminLevel: 'Admin Level',
    yes: 'Yes',
    no: 'No',
    none: 'None',
  } : {
    title: '調試用戶檔案',
    description: '檢查任何用戶在數據庫中的管理員狀態',
    emailLabel: '用戶郵箱',
    emailPlaceholder: 'user@example.com',
    checkButton: '檢查檔案',
    checking: '檢查中...',
    noResult: '尚無結果。輸入郵箱並點擊檢查檔案。',
    colonFormat: '冒號格式 (profile:userId)',
    underscoreFormat: '下劃線格式 (profile_userId)',
    exists: '存在',
    notExists: '不存在',
    isAdmin: '是管理員',
    adminLevel: '管理員級別',
    yes: '是',
    no: '否',
    none: '無',
  };

  const handleCheck = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/debug-profile/${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check profile');
      }

      const data = await response.json();
      setResult(data);
      console.log('🔍 [Debug] Profile check result:', data);
    } catch (error: any) {
      console.error('Error checking profile:', error);
      toast.error(error.message || 'Failed to check profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCheck()}
            />
          </div>
          <Button onClick={handleCheck} disabled={loading}>
            {loading ? (
              <>{t.checking}</>
            ) : (
              <><Search className="h-4 w-4 mr-2" />{t.checkButton}</>
            )}
          </Button>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.colonFormat}</span>
                <Badge variant={result.hasColonFormat ? 'default' : 'secondary'}>
                  {result.hasColonFormat ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />{t.exists}</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" />{t.notExists}</>
                  )}
                </Badge>
              </div>
              {result.hasColonFormat && (
                <div className="pl-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.isAdmin}:</span>
                    <span className={result.colonIsAdmin ? 'text-green-600 font-medium' : 'text-gray-500'}>
                      {result.colonIsAdmin ? t.yes : t.no}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.adminLevel}:</span>
                    <span className="font-mono text-xs">
                      {result.colonAdminLevel || t.none}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.underscoreFormat}</span>
                <Badge variant={result.hasUnderscoreFormat ? 'default' : 'secondary'}>
                  {result.hasUnderscoreFormat ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />{t.exists}</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" />{t.notExists}</>
                  )}
                </Badge>
              </div>
              {result.hasUnderscoreFormat && (
                <div className="pl-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.isAdmin}:</span>
                    <span className={result.underscoreIsAdmin ? 'text-green-600 font-medium' : 'text-gray-500'}>
                      {result.underscoreIsAdmin ? t.yes : t.no}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.adminLevel}:</span>
                    <span className="font-mono text-xs">
                      {result.underscoreAdminLevel || t.none}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {(result.colonIsAdmin !== result.underscoreIsAdmin) && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Admin status is inconsistent between the two profile formats. 
                  This user needs to be re-added as an admin to fix the issue.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {t.noResult}
          </div>
        )}
      </CardContent>
    </Card>
  );
}