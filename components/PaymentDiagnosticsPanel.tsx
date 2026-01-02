import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, Bug, Server, TestTube2 } from 'lucide-react';
import { FigmaEnvironmentWarning } from './FigmaEnvironmentWarning';
import { ServerDiagnostics } from './ServerDiagnostics';
import { PaymentDebugPanel } from './PaymentDebugPanel';
import { PayPalDiagnostics } from './PayPalDiagnostics';
import { PayPalSandboxGuide } from './PayPalSandboxGuide';
import { PayPalConfigTest } from './PayPalConfigTest';
import { PayPalCallbackDebugger } from './PayPalCallbackDebugger';
import { PayPalOriginDebugger } from './PayPalOriginDebugger';
import { useAuth } from '../contexts/AuthContext';

interface PaymentDiagnosticsPanelProps {
  language: 'en' | 'zh';
}

export function PaymentDiagnosticsPanel({ language }: PaymentDiagnosticsPanelProps) {
  const { user, accessToken } = useAuth();

  return (
    <div className="space-y-6">
      {/* Main Diagnostics Card */}
      <Card className="border-2 border-purple-200 bg-purple-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Bug className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {language === 'en' ? 'Payment Diagnostics' : '支付診斷工具'}
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                    {language === 'en' ? 'DEBUG' : '調試'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {language === 'en'
                    ? 'Comprehensive testing and debugging tools for payment systems'
                    : '支付系統的全面測試和調試工具'}
                </CardDescription>
              </div>
            </div>
            <TestTube2 className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Environment Warning */}
          <div>
            <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {language === 'en' ? 'Environment Status' : '環境狀態'}
            </h3>
            <FigmaEnvironmentWarning />
          </div>

          {/* Server Diagnostics */}
          <div className="border-t border-purple-200 pt-6">
            <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Server className="h-4 w-4" />
              {language === 'en' ? 'Server Health' : '服務器健康狀態'}
            </h3>
            <ServerDiagnostics />
          </div>

          {/* Payment Debug Panel */}
          {user && accessToken && (
            <div className="border-t border-purple-200 pt-6">
              <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <Bug className="h-4 w-4" />
                {language === 'en' ? 'Payment Debug Panel' : '支付調試面板'}
              </h3>
              <PaymentDebugPanel userId={user.id} accessToken={accessToken} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* PayPal Diagnostics Card */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <AlertCircle className="h-5 w-5" />
            {language === 'en' ? 'PayPal Configuration & Testing' : 'PayPal 配置與測試'}
          </CardTitle>
          <CardDescription>
            {language === 'en'
              ? 'Detailed PayPal integration status and debugging tools'
              : 'PayPal 整合狀態詳情和調試工具'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PayPal Configuration Status */}
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              {language === 'en' ? 'Configuration Status' : '配置狀態'}
            </h3>
            <PayPalDiagnostics />
          </div>

          {/* Sandbox Setup Guide */}
          <div className="border-t border-blue-200 pt-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              {language === 'en' ? 'Sandbox Setup Guide' : 'Sandbox 設置指南'}
            </h3>
            <PayPalSandboxGuide />
          </div>

          {/* Configuration Test */}
          <div className="border-t border-blue-200 pt-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              {language === 'en' ? 'Configuration Test' : '配置測試'}
            </h3>
            <PayPalConfigTest />
          </div>

          {/* Callback Debugger */}
          <div className="border-t border-blue-200 pt-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              {language === 'en' ? 'Callback Debugger' : '回調調試器'}
            </h3>
            <PayPalCallbackDebugger />
          </div>

          {/* Origin Debugger */}
          <div className="border-t border-blue-200 pt-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              {language === 'en' ? 'Origin Configuration' : '來源配置'}
            </h3>
            <PayPalOriginDebugger />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
