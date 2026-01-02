import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";

export function TestProjectCleaner() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    deleted_count: number;
    deleted_projects: Array<{ id: string; title: string; proposals_deleted: number }>;
  } | null>(null);

  const deleteTestProjects = async () => {
    if (!user || !accessToken) {
      toast.error(language === 'en' ? 'Please login as admin' : '請以管理員身份登入');
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      language === 'en'
        ? 'Are you sure you want to delete ALL projects with "test" in their title? This action cannot be undone.'
        : '確定要刪除所有標題包含 "test" 的項目嗎？此操作無法撤銷。'
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/projects/cleanup-test`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete test projects');
      }

      if (data.success) {
        setResult({
          deleted_count: data.deleted_count || 0,
          deleted_projects: data.deleted_projects || [],
        });

        if (data.deleted_count > 0) {
          toast.success(
            language === 'en'
              ? `Successfully deleted ${data.deleted_count} test project(s)!`
              : `成功刪除 ${data.deleted_count} 個測試項目！`
          );
        } else {
          toast.info(
            language === 'en'
              ? 'No test projects found to delete'
              : '未找到需要刪除的測試項目'
          );
        }
      }
    } catch (error) {
      console.error('Error deleting test projects:', error);
      toast.error(
        language === 'en'
          ? `Failed to delete test projects: ${error instanceof Error ? error.message : 'Unknown error'}`
          : `刪除測試項目失敗：${error instanceof Error ? error.message : '未知錯誤'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-600" />
          {language === 'en' ? 'Test Project Cleaner' : '測試項目清理器'}
        </CardTitle>
        <CardDescription>
          {language === 'en'
            ? 'Delete all projects with "test" in their title (Admin only)'
            : '刪除所有標題包含 "test" 的項目（僅限管理員）'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-900">
            <strong>{language === 'en' ? '⚠️ Warning:' : '⚠️ 警告：'}</strong>
            {' '}
            {language === 'en'
              ? 'This will permanently delete ALL projects whose titles contain "test" (case-insensitive). This action cannot be undone!'
              : '這將永久刪除所有標題包含 "test" 的項目（不區分大小寫）。此操作無法撤銷！'}
          </p>
        </div>

        {!user && (
          <div className="flex items-center gap-2 text-orange-600 p-4 bg-orange-50 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span>
              {language === 'en'
                ? 'Please login as an admin to delete test projects'
                : '請以管理員身份登入以刪除測試項目'}
            </span>
          </div>
        )}

        {result && result.deleted_count > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span>
                {language === 'en'
                  ? `Successfully deleted ${result.deleted_count} test project(s)!`
                  : `成功刪除 ${result.deleted_count} 個測試項目！`}
              </span>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
              <h4 className="text-sm mb-2">
                {language === 'en' ? 'Deleted Projects:' : '已刪除的項目：'}
              </h4>
              <ul className="text-sm space-y-1 text-gray-700">
                {result.deleted_projects.map((project) => (
                  <li key={project.id} className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span className="flex-1">
                      <strong>{project.title}</strong>
                      {project.proposals_deleted > 0 && (
                        <span className="text-gray-500 ml-2">
                          ({project.proposals_deleted}{' '}
                          {language === 'en' ? 'proposals deleted' : '個提案已刪除'})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {result && result.deleted_count === 0 && (
          <div className="flex items-center gap-2 text-blue-600 p-4 bg-blue-50 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span>
              {language === 'en'
                ? 'No test projects found in the database'
                : '數據庫中未找到測試項目'}
            </span>
          </div>
        )}

        <Button
          onClick={deleteTestProjects}
          disabled={loading || !user}
          variant="destructive"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {language === 'en' ? 'Deleting Test Projects...' : '刪除測試項目中...'}
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Delete All Test Projects' : '刪除所有測試項目'}
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          {language === 'en'
            ? 'Only projects with "test" in the title will be deleted. Regular projects are safe.'
            : '只有標題包含 "test" 的項目會被刪除。正常項目是安全的。'}
        </p>
      </CardContent>
    </Card>
  );
}