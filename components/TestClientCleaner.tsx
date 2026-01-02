import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';
import { toast } from "sonner";

// Test client emails to clean up
const TEST_CLIENT_EMAILS = [
  "client1@example.com",
  "client2@example.com",
  "client3@example.com",
  "client4@example.com",
  "client5@example.com",
];

export function TestClientCleaner() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cleanTestClients = async () => {
    if (!accessToken) {
      toast.error('需要登入才能執行此操作');
      return;
    }

    setLoading(true);
    setProgress("開始清理測試 Client 數據...");
    setResults([]);
    setError(null);

    try {
      // Step 1: Get all profiles (using freelancers endpoint which gets all account types)
      setProgress("正在獲取所有用戶資料...");
      const profilesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profiles/freelancers`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!profilesResponse.ok) {
        throw new Error('Failed to fetch profiles');
      }

      const { profiles } = await profilesResponse.json();
      console.log('📊 [TestClientCleaner] All profiles:', profiles);

      // Step 2: Find test client profiles
      const testClientProfiles = profiles.filter((profile: any) => 
        TEST_CLIENT_EMAILS.includes(profile.email)
      );

      console.log('🎯 [TestClientCleaner] Found test clients:', testClientProfiles);

      if (testClientProfiles.length === 0) {
        setProgress("未找到測試 Client 數據");
        toast.info("未找到需要清理的測試 Client");
        setLoading(false);
        return;
      }

      // Step 3: Delete each profile using admin delete user API
      const deleteResults: string[] = [];
      for (const profile of testClientProfiles) {
        setProgress(`正在刪除: ${profile.email}...`);
        
        try {
          // Delete user using admin delete API
          const deleteResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/users/${profile.user_id}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const deleteData = await deleteResponse.json();

          if (deleteResponse.ok) {
            deleteResults.push(`✅ 已刪除: ${profile.email} (${profile.full_name})`);
            console.log(`✅ Deleted profile: ${profile.email}`, deleteData);
          } else {
            deleteResults.push(`❌ 刪除失敗: ${profile.email} - ${deleteData.error || 'Unknown error'}`);
            console.error(`❌ Failed to delete: ${profile.email}`, deleteData);
          }
        } catch (err: any) {
          deleteResults.push(`❌ 錯誤: ${profile.email} - ${err.message}`);
          console.error(`❌ Error deleting ${profile.email}:`, err);
        }
      }

      setResults(deleteResults);
      setProgress(`完成！已處理 ${testClientProfiles.length} 個測試 Client`);
      
      if (deleteResults.some(r => r.startsWith('✅'))) {
        toast.success(`成功清理 ${deleteResults.filter(r => r.startsWith('✅')).length} 個測試 Client`);
      }

    } catch (err: any) {
      console.error('❌ [TestClientCleaner] Error:', err);
      setError(err.message || '清理過程中發生錯誤');
      toast.error('清理失敗：' + (err.message || '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-900">清理測試 Client 數據</CardTitle>
        </div>
        <CardDescription>
          刪除由 ProcessSeeder 創建的測試 Client 1 ~ Client 5
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-red-200">
          <p className="text-sm text-gray-700 mb-2">將刪除以下測試帳號：</p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            {TEST_CLIENT_EMAILS.map(email => (
              <li key={email}>{email}</li>
            ))}
          </ul>
        </div>

        <Button
          onClick={cleanTestClients}
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              處理中...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              清理測試 Client
            </>
          )}
        </Button>

        {progress && (
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="text-sm text-gray-700">{progress}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-white p-3 rounded border border-gray-200 space-y-1">
            <p className="text-sm font-medium mb-2">處理結果：</p>
            {results.map((result, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                {result.startsWith('✅') ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <span className={result.startsWith('✅') ? 'text-green-700' : 'text-red-700'}>
                  {result.replace(/^[✅❌]\s*/, '')}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-300 p-3 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}