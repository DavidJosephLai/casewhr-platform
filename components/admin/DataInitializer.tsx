import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, Database, Users, Briefcase, MessageSquare, Star, Target, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { projectId } from '../../utils/supabase/info';
import { Badge } from '../ui/badge';

export function DataInitializer() {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const content = {
    en: {
      title: 'Data Initializer',
      description: 'Generate test data for the platform',
      warning: 'This will create sample users, projects, messages, and other data',
      generateBtn: 'Generate Test Data',
      generating: 'Generating...',
      success: 'Data generated successfully!',
      error: 'Failed to generate data',
      dataCreated: 'Data Created',
      users: 'Users',
      projects: 'Projects',
      messages: 'Messages',
      reviews: 'Reviews',
      milestones: 'Milestones',
      transactions: 'Transactions',
      note: 'Note: This will not delete existing data, only add new test data',
    },
    'zh-TW': {
      title: '數據初始化器',
      description: '為平台生成測試數據',
      warning: '這將創建範例用戶、項目、消息和其他數據',
      generateBtn: '生成測試數據',
      generating: '生成中...',
      success: '數據生成成功！',
      error: '數據生成失敗',
      dataCreated: '已創建數據',
      users: '用戶',
      projects: '項目',
      messages: '消息',
      reviews: '評價',
      milestones: '里程碑',
      transactions: '交易',
      note: '注意：這不會刪除現有數據，只會添加新的測試數據',
    },
    'zh-CN': {
      title: '数据初始化器',
      description: '为平台生成测试数据',
      warning: '这将创建范例用户、项目、消息和其他数据',
      generateBtn: '生成测试数据',
      generating: '生成中...',
      success: '数据生成成功！',
      error: '数据生成失败',
      dataCreated: '已创建数据',
      users: '用户',
      projects: '项目',
      messages: '消息',
      reviews: '评价',
      milestones: '里程碑',
      transactions: '交易',
      note: '注意：这不会删除现有数据，只会添加新的测试数据',
    }
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

  const generateData = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/initialize-data`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response data:', data);

      if (response.ok) {
        setResult(data);
        console.log('✅ Data generated successfully:', data.created);
      } else {
        const errorMsg = data.error || t.error;
        setError(errorMsg);
        console.error('❌ Error from server:', errorMsg);
      }
    } catch (err: any) {
      console.error('❌ Exception generating data:', err);
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-600" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">{t.warning}</p>
              <p className="text-xs text-yellow-600 mt-1">{t.note}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">{t.success}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-700">{t.dataCreated}:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {result.created?.users && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>{t.users}:</span>
                    <Badge variant="secondary">{result.created.users}</Badge>
                  </div>
                )}
                {result.created?.projects && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-green-600" />
                    <span>{t.projects}:</span>
                    <Badge variant="secondary">{result.created.projects}</Badge>
                  </div>
                )}
                {result.created?.messages && (
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    <span>{t.messages}:</span>
                    <Badge variant="secondary">{result.created.messages}</Badge>
                  </div>
                )}
                {result.created?.reviews && (
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span>{t.reviews}:</span>
                    <Badge variant="secondary">{result.created.reviews}</Badge>
                  </div>
                )}
                {result.created?.milestones && (
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-indigo-600" />
                    <span>{t.milestones}:</span>
                    <Badge variant="secondary">{result.created.milestones}</Badge>
                  </div>
                )}
                {result.created?.transactions && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span>{t.transactions}:</span>
                    <Badge variant="secondary">{result.created.transactions}</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={generateData} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.generating}
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              {t.generateBtn}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}