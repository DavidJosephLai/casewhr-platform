import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface HealthStatus {
  status: string;
  storage: string;
  environment: {
    supabase: {
      url: string;
      serviceRoleKey: string;
    };
    aws: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
    };
  };
  timestamp: string;
}

export function EnvironmentCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Health check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    if (status.includes('✅')) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (status.includes('❌')) return <XCircle className="w-5 h-5 text-red-600" />;
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusBadge = (status: string) => {
    if (status.includes('✅')) return <Badge className="bg-green-600">Configured</Badge>;
    if (status.includes('❌')) return <Badge variant="destructive">Missing</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">環境配置檢查</h1>
        <Button onClick={checkHealth} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              連接錯誤
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-2">
              這通常表示伺服器未運行或無法訪問。
            </p>
          </CardContent>
        </Card>
      )}

      {health && (
        <>
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {health.status === 'ok' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                伺服器狀態
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>狀態</span>
                <Badge className={health.status === 'ok' ? 'bg-green-600' : 'bg-red-600'}>
                  {health.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Storage</span>
                <Badge variant={health.storage === 'available' ? 'default' : 'secondary'}>
                  {health.storage}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>最後檢查時間</span>
                <span className="text-sm text-gray-600">
                  {new Date(health.timestamp).toLocaleString('zh-TW')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Supabase Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Supabase 配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.environment.supabase.url)}
                  <span>SUPABASE_URL</span>
                </div>
                {getStatusBadge(health.environment.supabase.url)}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.environment.supabase.serviceRoleKey)}
                  <span>SUPABASE_SERVICE_ROLE_KEY</span>
                </div>
                {getStatusBadge(health.environment.supabase.serviceRoleKey)}
              </div>
            </CardContent>
          </Card>

          {/* AWS Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>AWS SES 配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.environment.aws.accessKeyId)}
                  <span>AWS_ACCESS_KEY_ID</span>
                </div>
                {getStatusBadge(health.environment.aws.accessKeyId)}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.environment.aws.secretAccessKey)}
                  <span>AWS_SECRET_ACCESS_KEY</span>
                </div>
                {getStatusBadge(health.environment.aws.secretAccessKey)}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.environment.aws.region)}
                  <span>AWS_REGION</span>
                </div>
                <span className="text-sm">{health.environment.aws.region}</span>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          {(health.environment.supabase.url.includes('❌') ||
            health.environment.supabase.serviceRoleKey.includes('❌') ||
            health.environment.aws.accessKeyId.includes('❌') ||
            health.environment.aws.secretAccessKey.includes('❌') ||
            health.environment.aws.region.includes('❌')) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  需要配置環境變數
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-yellow-700">
                  請在 Supabase 專案設置中配置以下環境變數：
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
                  <li>前往 Supabase Dashboard</li>
                  <li>選擇您的專案</li>
                  <li>點擊 Settings {'>'} Edge Functions</li>
                  <li>在 Environment Variables 區域添加缺少的變數</li>
                  <li>重新部署 Edge Functions</li>
                </ol>
                
                {health.environment.supabase.url.includes('❌') && (
                  <div className="bg-white p-3 rounded border border-yellow-300">
                    <p className="font-medium text-yellow-900 mb-1">SUPABASE_URL</p>
                    <p className="text-xs text-yellow-700">
                      您的 Supabase 專案 URL（例如：https://xxxxx.supabase.co）
                    </p>
                  </div>
                )}
                
                {health.environment.supabase.serviceRoleKey.includes('❌') && (
                  <div className="bg-white p-3 rounded border border-yellow-300">
                    <p className="font-medium text-yellow-900 mb-1">SUPABASE_SERVICE_ROLE_KEY</p>
                    <p className="text-xs text-yellow-700">
                      您的 Supabase Service Role Key（在 Settings {'>'} API 找到）
                    </p>
                  </div>
                )}
                
                {(health.environment.aws.accessKeyId.includes('❌') ||
                  health.environment.aws.secretAccessKey.includes('❌') ||
                  health.environment.aws.region.includes('❌')) && (
                  <div className="bg-white p-3 rounded border border-yellow-300">
                    <p className="font-medium text-yellow-900 mb-1">AWS SES 配置</p>
                    <p className="text-xs text-yellow-700 mb-2">
                      需要以下 AWS SES 環境變數：
                    </p>
                    <ul className="text-xs text-yellow-700 space-y-1 ml-4">
                      <li>• AWS_ACCESS_KEY_ID</li>
                      <li>• AWS_SECRET_ACCESS_KEY</li>
                      <li>• AWS_REGION（例如：us-east-1）</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Frontend Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>前端配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {projectId ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span>Project ID</span>
            </div>
            <Badge className={projectId ? 'bg-green-600' : 'bg-red-600'}>
              {projectId ? '✅ configured' : '❌ missing'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {publicAnonKey ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span>Public Anon Key</span>
            </div>
            <Badge className={publicAnonKey ? 'bg-green-600' : 'bg-red-600'}>
              {publicAnonKey ? '✅ configured' : '❌ missing'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EnvironmentCheck;