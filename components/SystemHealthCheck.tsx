import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CheckCircle2, XCircle, AlertCircle, Cloud } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../lib/supabase";
import { useLanguage } from "../lib/LanguageContext";
import { useView } from "../contexts/ViewContext";
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function SystemHealthCheck() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const { setView, setManualOverride } = useView();
  const [checks, setChecks] = useState({
    supabaseConfigured: false,
    authContextWorking: false,
    userSessionActive: false,
    awsConfigured: false,
  });
  const [checkingAWS, setCheckingAWS] = useState(false);

  useEffect(() => {
    const runChecks = async () => {
      // Check 1: Supabase configured
      const supabaseConfigured = auth.isConfigured();

      // Check 2: Auth context working
      const authContextWorking = !loading;

      // Check 3: User session
      const userSessionActive = !!user;

      // Check 4: AWS SES configured
      setCheckingAWS(true);
      let awsConfigured = false;
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/health`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          awsConfigured = data.environment?.aws?.accessKeyId?.includes('✅') &&
                         data.environment?.aws?.secretAccessKey?.includes('✅') &&
                         data.environment?.aws?.region?.includes('✅');
        }
      } catch (err) {
        console.error('AWS check failed:', err);
      }
      setCheckingAWS(false);

      setChecks({
        supabaseConfigured,
        authContextWorking,
        userSessionActive,
        awsConfigured,
      });
    };

    runChecks();
  }, [user, loading]);

  const StatusIcon = ({ status }: { status: boolean }) => {
    if (status) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const isEnglish = language === 'en';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          {isEnglish ? 'System Health Check' : '系統健康檢查'}
        </CardTitle>
        <CardDescription>
          {isEnglish 
            ? 'Diagnostic information about your application'
            : '應用程式診斷信息'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Supabase Configuration */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <StatusIcon status={checks.supabaseConfigured} />
              <div>
                <p className="font-medium">
                  {isEnglish ? 'Supabase Configuration' : 'Supabase 配置'}
                </p>
                <p className="text-xs text-gray-600">
                  {isEnglish 
                    ? 'Database connection settings'
                    : '數據庫連接設置'}
                </p>
              </div>
            </div>
            <Badge variant={checks.supabaseConfigured ? "default" : "destructive"}>
              {checks.supabaseConfigured 
                ? (isEnglish ? 'OK' : '正常') 
                : (isEnglish ? 'Not Configured' : '未配置')}
            </Badge>
          </div>

          {/* Auth Context */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <StatusIcon status={checks.authContextWorking} />
              <div>
                <p className="font-medium">
                  {isEnglish ? 'Authentication System' : '認證系統'}
                </p>
                <p className="text-xs text-gray-600">
                  {isEnglish 
                    ? 'Auth context and hooks'
                    : '認證上下文和鉤子'}
                </p>
              </div>
            </div>
            <Badge variant={checks.authContextWorking ? "default" : "destructive"}>
              {checks.authContextWorking 
                ? (isEnglish ? 'Working' : '正常') 
                : (isEnglish ? 'Loading...' : '加載中...')}
            </Badge>
          </div>

          {/* User Session */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <StatusIcon status={checks.userSessionActive} />
              <div>
                <p className="font-medium">
                  {isEnglish ? 'User Session' : '用戶會話'}
                </p>
                <p className="text-xs text-gray-600">
                  {isEnglish 
                    ? 'Current login status'
                    : '當前登入狀態'}
                </p>
              </div>
            </div>
            <Badge variant={checks.userSessionActive ? "default" : "secondary"}>
              {checks.userSessionActive 
                ? (isEnglish ? 'Logged In' : '已登入') 
                : (isEnglish ? 'Not Logged In' : '未登入')}
            </Badge>
          </div>

          {/* AWS Configuration */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <StatusIcon status={checks.awsConfigured} />
              <div>
                <p className="font-medium">
                  {isEnglish ? 'Email Service (Brevo)' : '郵件服務 (Brevo)'}
                </p>
                <p className="text-xs text-gray-600">
                  {isEnglish 
                    ? 'Email sending configuration (Brevo SMTP)'
                    : '郵件發送配置 (Brevo SMTP)'}
                </p>
              </div>
            </div>
            <Badge variant="default">
              {isEnglish ? 'Configured' : '已配置'}
            </Badge>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              {isEnglish ? 'Current User:' : '當前用戶：'}
            </p>
            <div className="text-xs text-blue-800 space-y-1">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            {isEnglish ? 'Debug Information' : '調試信息'}
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify({
              checks,
              userEmail: user?.email || 'Not logged in',
              loading,
            }, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}