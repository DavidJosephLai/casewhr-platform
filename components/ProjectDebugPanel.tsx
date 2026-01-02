import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { isAdmin } from '../lib/adminConfig';

export function ProjectDebugPanel() {
  const { user, accessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  if (!isAdmin(user?.email)) return null;

  const checkProjects = async () => {
    setLoading(true);
    try {
      console.log('🔍 [Debug] Starting diagnostic check...');
      
      // 1. Check database for projects
      console.log('🔍 [Debug] Step 1: Checking database keys...');
      const dbResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/debug-keys`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const dbData = await dbResponse.json();
      console.log('🔍 [Debug] Database response:', dbData);

      // 2. Check projects API (正確的端點)
      console.log('🔍 [Debug] Step 2: Checking projects API...');
      const projectsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/projects`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const projectsData = await projectsResponse.json();
      console.log('🔍 [Debug] Projects API response:', projectsData);

      // 3. Check a sample project from database
      let sampleProject = null;
      if (dbData.keys) {
        const projectKey = dbData.keys.find((k: string) => k.startsWith('project:'));
        if (projectKey) {
          console.log('🔍 [Debug] Step 3: Fetching sample project:', projectKey);
          const sampleResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/debug-key?key=${encodeURIComponent(projectKey)}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          if (sampleResponse.ok) {
            sampleProject = await sampleResponse.json();
            console.log('🔍 [Debug] Sample project:', sampleProject);
          }
        }
      }

      setDebugInfo({
        database: dbData,
        projectsAPI: projectsData,
        sampleProject,
        timestamp: new Date().toISOString()
      });

      toast.success('✅ 診斷完成！');
    } catch (error: any) {
      toast.error(`❌ 診斷失敗: ${error.message}`);
      console.error('🔍 [Debug] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateProjects = async () => {
    setLoading(true);
    try {
      console.log('🎲 [Debug] Calling initialize-data API...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/initialize-data`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('🎲 [Debug] Response status:', response.status);
      const data = await response.json();
      console.log('🎲 [Debug] Response data:', data);
      
      if (response.ok) {
        const projectCount = data.created?.projects || 0;
        const verifiedCount = data.verified?.projects_in_db || 0;
        toast.success(
          `✅ 成功生成 ${projectCount} 個專案！資料庫驗證: ${verifiedCount} 個`, 
          { duration: 8000 }
        );
        // Refresh debug info after a short delay
        setTimeout(() => checkProjects(), 1000);
      } else {
        console.error('🎲 [Debug] API error:', data);
        toast.error(`❌ ${data.error || '生成失敗'}`, { duration: 10000 });
        if (data.details) {
          console.error('🎲 [Debug] Error details:', data.details);
        }
      }
    } catch (error: any) {
      console.error('🎲 [Debug] Exception:', error);
      toast.error(`❌ 異常: ${error.message}`, { duration: 10000 });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => {
          setIsOpen(true);
          checkProjects();
        }}
        className="fixed bottom-20 right-4 z-40 bg-orange-600 hover:bg-orange-700 text-white shadow-lg rounded-full h-12 w-12 p-0"
        title="專案診斷"
      >
        <Bug className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <Card className="w-96 max-h-[600px] overflow-y-auto shadow-2xl border-2 border-orange-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold">🔍 專案診斷面板</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>

          <div className="space-y-3">
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={checkProjects}
                disabled={loading}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                重新檢查
              </Button>
              <Button
                onClick={generateProjects}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <>⚡</>
                )}
                生成數據
              </Button>
            </div>

            {/* Debug Results */}
            {debugInfo && (
              <div className="space-y-3">
                {/* Database Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">📊 資料庫統計</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>總數據量:</span>
                      <Badge>{debugInfo.database?.total || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>專案 (project:):</span>
                      <Badge variant="secondary">
                        {debugInfo.database?.summary?.project_colon || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>專案 (project_):</span>
                      <Badge variant="secondary">
                        {debugInfo.database?.summary?.project_underscore || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>用戶檔案:</span>
                      <Badge variant="secondary">
                        {(debugInfo.database?.summary?.profile_colon || 0) +
                          (debugInfo.database?.summary?.profile_underscore || 0)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Public API Response */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">🌐 專案 API 回應</h4>
                  {debugInfo.projectsAPI?.projects ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>找到 {debugInfo.projectsAPI.projects.length} 個專案</span>
                      </div>
                      {debugInfo.projectsAPI.projects.slice(0, 3).map((p: any, i: number) => (
                        <div key={i} className="ml-6 text-gray-600">
                          • {p.title || p.id}
                        </div>
                      ))}
                      {debugInfo.projectsAPI.projects.length > 3 && (
                        <div className="ml-6 text-gray-400">
                          ... 還有 {debugInfo.projectsAPI.projects.length - 3} 個
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>API 沒有回傳專案</span>
                      </div>
                      {debugInfo.projectsAPI?.error && (
                        <div className="text-xs text-red-600 ml-6">
                          錯誤: {debugInfo.projectsAPI.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sample Project */}
                {debugInfo.sampleProject && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-2">📝 範例專案數據</h4>
                    <div className="text-xs space-y-1">
                      <div><strong>ID:</strong> {debugInfo.sampleProject.id}</div>
                      <div><strong>標題:</strong> {debugInfo.sampleProject.title}</div>
                      <div><strong>狀態:</strong> {debugInfo.sampleProject.status}</div>
                      <div><strong>預算:</strong> {debugInfo.sampleProject.budget || 'N/A'}</div>
                    </div>
                  </div>
                )}

                {/* Raw Data */}
                <details className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    🔧 詳細資料 (開發用)
                  </summary>
                  <pre className="text-xs mt-2 overflow-x-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>

                <div className="text-xs text-gray-500 text-center">
                  上次更新: {new Date(debugInfo.timestamp).toLocaleTimeString('zh-TW')}
                </div>
              </div>
            )}

            {!debugInfo && !loading && (
              <div className="text-center py-8 text-sm text-gray-500">
                點擊「重新檢查」開始診斷
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}