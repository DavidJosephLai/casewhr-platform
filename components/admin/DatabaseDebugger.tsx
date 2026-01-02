import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, Database, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { projectId } from '../../utils/supabase/info';
import { Badge } from '../ui/badge';

export function DatabaseDebugger() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const checkKeys = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/debug-keys`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
        console.log('🔍 Database Keys:', result);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to fetch keys:', response.status, errorData);
        alert(`Error: ${errorData.error || 'Failed to fetch keys'}`);
      }
    } catch (error) {
      console.error('❌ Exception fetching keys:', error);
      alert(`Exception: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-indigo-600" />
          Database Debugger / 數據庫調試器
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={checkKeys} 
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                檢查中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                檢查數據庫
              </>
            )}
          </Button>
        </div>

        {data && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-3">
                Total Keys in Database: {data.total}
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">profile: (冒號)</span>
                  <Badge variant={data.summary.profile_colon > 0 ? "default" : "secondary"}>
                    {data.summary.profile_colon}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">profile_ (下劃線)</span>
                  <Badge variant={data.summary.profile_underscore > 0 ? "default" : "secondary"}>
                    {data.summary.profile_underscore}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">project: (冒號)</span>
                  <Badge variant={data.summary.project_colon > 0 ? "default" : "secondary"}>
                    {data.summary.project_colon}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">project_ (下劃線)</span>
                  <Badge variant={data.summary.project_underscore > 0 ? "default" : "secondary"}>
                    {data.summary.project_underscore}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">wallet: (冒號)</span>
                  <Badge variant={data.summary.wallet_colon > 0 ? "default" : "secondary"}>
                    {data.summary.wallet_colon}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">wallet_ (下劃線)</span>
                  <Badge variant={data.summary.wallet_underscore > 0 ? "default" : "secondary"}>
                    {data.summary.wallet_underscore}
                  </Badge>
                </div>
              </div>
            </div>

            {data.keys && data.keys.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Sample Keys (First 20):</h4>
                <div className="space-y-1 text-xs font-mono">
                  {data.keys.map((key: string, index: number) => (
                    <div key={index} className="text-gray-600">
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}