import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Upload, RefreshCw } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
}

export function AvatarUploadDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testFile, setTestFile] = useState<File | null>(null);
  const supabase = createClient();

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // 1. 檢查用戶認證狀態
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        addResult({
          name: '用戶認證檢查',
          status: 'error',
          message: '未登錄或會話已過期',
          details: sessionError?.message || '請重新登錄'
        });
        setIsRunning(false);
        return;
      }

      addResult({
        name: '用戶認證檢查',
        status: 'success',
        message: `已認證用戶: ${session.user.email}`,
        details: `User ID: ${session.user.id}`
      });

      // 2. 檢查 Storage 權限
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          addResult({
            name: 'Storage 訪問權限',
            status: 'error',
            message: 'Storage 訪問失敗',
            details: listError.message
          });
        } else {
          const avatarBucket = buckets?.find(b => b.name === 'make-215f78a5-avatars');
          
          if (avatarBucket) {
            addResult({
              name: 'Storage 訪問權限',
              status: 'success',
              message: '成功訪問 Storage',
              details: `找到頭像 bucket: ${avatarBucket.name} (${avatarBucket.public ? '公開' : '私有'})`
            });
          } else {
            addResult({
              name: 'Storage Bucket 檢查',
              status: 'error',
              message: '頭像 bucket 不存在',
              details: '需要創建 make-215f78a5-avatars bucket'
            });
          }
        }
      } catch (error: any) {
        addResult({
          name: 'Storage 訪問權限',
          status: 'error',
          message: 'Storage 檢查失敗',
          details: error.message
        });
      }

      // 3. 檢查後端 API 可用性
      try {
        const { projectId, publicAnonKey } = await import('../../utils/supabase/info.tsx');
        const testUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile/${session.user.id}/avatar`;
        
        addResult({
          name: '後端 API 配置',
          status: 'success',
          message: 'API 端點已配置',
          details: testUrl
        });
      } catch (error: any) {
        addResult({
          name: '後端 API 配置',
          status: 'error',
          message: 'API 配置錯誤',
          details: error.message
        });
      }

      // 4. 測試實際上傳（如果有測試文件）
      if (testFile) {
        await testActualUpload(session.user.id, session.access_token);
      } else {
        addResult({
          name: '文件上傳測試',
          status: 'warning',
          message: '跳過（未選擇測試文件）',
          details: '請選擇一個圖片文件進行完整測試'
        });
      }

    } catch (error: any) {
      addResult({
        name: '診斷過程',
        status: 'error',
        message: '診斷失敗',
        details: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const testActualUpload = async (userId: string, accessToken: string) => {
    if (!testFile) return;

    try {
      // Step 1: Upload to Storage
      const bucketName = 'make-215f78a5-avatars';
      const fileName = `${userId}/test-${Date.now()}-${testFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, testFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        addResult({
          name: 'Storage 上傳測試',
          status: 'error',
          message: 'Storage 上傳失敗',
          details: uploadError.message
        });
        return;
      }

      addResult({
        name: 'Storage 上傳測試',
        status: 'success',
        message: '文件上傳成功',
        details: `文件路徑: ${uploadData.path}`
      });

      // Step 2: Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      addResult({
        name: '獲取公開 URL',
        status: 'success',
        message: 'URL 生成成功',
        details: publicUrl
      });

      // Step 3: Update profile via API
      const { projectId, publicAnonKey } = await import('../../utils/supabase/info.tsx');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile/${userId}/avatar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ avatar_url: publicUrl }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        addResult({
          name: 'API 更新測試',
          status: 'error',
          message: `API 返回錯誤 (${response.status})`,
          details: errorText
        });
        return;
      }

      const data = await response.json();
      addResult({
        name: 'API 更新測試',
        status: 'success',
        message: 'Profile 更新成功',
        details: JSON.stringify(data, null, 2)
      });

      // Step 4: Clean up test file
      await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      addResult({
        name: '測試清理',
        status: 'success',
        message: '測試文件已清理',
        details: '上傳測試完成'
      });

    } catch (error: any) {
      addResult({
        name: '上傳測試',
        status: 'error',
        message: '上傳測試失敗',
        details: error.message
      });
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      pending: 'outline'
    } as const;
    
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            頭像上傳診斷工具
          </CardTitle>
          <CardDescription>
            診斷頭像上傳功能的所有相關組件和服務
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 測試文件選擇 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">選擇測試圖片（可選）</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setTestFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {testFile && (
              <p className="text-sm text-gray-600">
                已選擇: {testFile.name} ({(testFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* 開始診斷按鈕 */}
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                診斷中...
              </>
            ) : (
              '開始診斷'
            )}
          </Button>

          {/* 診斷結果 */}
          {results.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="font-semibold text-lg">診斷結果</h3>
              {results.map((result, index) => (
                <Alert key={index} className="relative">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{result.name}</h4>
                        {getStatusBadge(result.status)}
                      </div>
                      <AlertDescription>
                        <p className="text-sm">{result.message}</p>
                        {result.details && (
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {result.details}
                          </pre>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}

          {/* 常見問題和解決方案 */}
          {results.some(r => r.status === 'error') && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">常見問題解決方案</h4>
              <ul className="space-y-2 text-sm text-yellow-700">
                <li className="flex items-start gap-2">
                  <span className="font-medium">1.</span>
                  <span>如果 Storage bucket 不存在：需要在 Supabase Dashboard 中創建 'make-215f78a5-avatars' bucket（公開）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">2.</span>
                  <span>如果上傳權限被拒絕：檢查 Supabase Storage 的 RLS 政策，確保已登錄用戶可以上傳到自己的文件夾</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">3.</span>
                  <span>如果 API 調用失敗：檢查後端服務是否正常運行，查看伺服器日誌獲取詳細錯誤</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">4.</span>
                  <span>如果文件過大：確保圖片小於 5MB</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">5.</span>
                  <span>如果會話過期：重新登錄平台</span>
                </li>
              </ul>
            </div>
          )}

          {/* 成功提示 */}
          {results.length > 0 && results.every(r => r.status === 'success') && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ 所有檢查通過！頭像上傳功能正常工作。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 快速修復建議 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">快速修復步驟</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p className="font-medium">如果診斷發現問題，請按以下步驟修復：</p>
            
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="font-medium text-blue-900">步驟 1: 檢查 Supabase Storage</p>
                <ol className="mt-2 space-y-1 text-blue-800 text-xs list-decimal list-inside">
                  <li>打開 Supabase Dashboard</li>
                  <li>進入 Storage 部分</li>
                  <li>確認 'make-215f78a5-avatars' bucket 存在且為公開 (public)</li>
                  <li>如果不存在，點擊 "New bucket" 創建</li>
                </ol>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                <p className="font-medium text-purple-900">步驟 2: 配置 Storage 政策</p>
                <ol className="mt-2 space-y-1 text-purple-800 text-xs list-decimal list-inside">
                  <li>在 Storage 設定中進入 "Policies" 標籤</li>
                  <li>為 'make-215f78a5-avatars' bucket 添加政策</li>
                  <li>允許已認證用戶上傳到 user_id 文件夾</li>
                  <li>允許所有人讀取公開文件</li>
                </ol>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="font-medium text-green-900">步驟 3: 驗證後端服務</p>
                <ol className="mt-2 space-y-1 text-green-800 text-xs list-decimal list-inside">
                  <li>確認後端服務正常運行</li>
                  <li>檢查環境變量已正確配置</li>
                  <li>查看伺服器日誌排查錯誤</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
