import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function NotificationDebugPanel() {
  const { user, profile } = useAuth();
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (profile) {
      const freelancer = profile?.is_freelancer || 
        (Array.isArray(profile?.account_type) 
          ? profile.account_type.includes('freelancer') 
          : profile?.account_type === 'freelancer');
      
      const client = profile?.is_client || 
        (Array.isArray(profile?.account_type) 
          ? profile.account_type.includes('client') 
          : profile?.account_type === 'client');
      
      setIsFreelancer(freelancer);
      setIsClient(client);
    }
  }, [profile]);

  return (
    <Card className="border-yellow-400 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          🔍 通知系統偵錯資訊
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          {isFreelancer ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span>
            接案者身份：{isFreelancer ? '✅ 是' : '❌ 否'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {isClient ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span>
            客戶身份：{isClient ? '✅ 是' : '❌ 否'}
          </span>
        </div>

        <div className="mt-3 p-2 bg-white rounded border border-yellow-300">
          <p className="font-semibold mb-1">Profile 資料：</p>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({
              is_freelancer: profile?.is_freelancer,
              is_client: profile?.is_client,
              account_type: profile?.account_type,
            }, null, 2)}
          </pre>
        </div>

        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-300">
          <p className="text-xs text-blue-800">
            💡 <strong>提示：</strong>邀請通知卡片只會在「接案者身份」時顯示。
            {!isFreelancer && (
              <>
                <br />
                請到「Profile & Brand」標籤 → 「角色切換」→ 啟用「接案者」身份。
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
