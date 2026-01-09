import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function TransferDebug() {
  const [email, setEmail] = useState('davidlai234@hotmail.com');
  const [userId, setUserId] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [transferData, setTransferData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const findUser = async () => {
    setLoading(true);
    setError('');
    setUserData(null);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/debug/find-user-by-email?email=${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      
      const data = await response.json();
      console.log('🔍 Find user result:', data);
      setUserData(data);
      
      if (data.user?.id) {
        setUserId(data.user.id);
      }
    } catch (err: any) {
      console.error('❌ Find user error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkTransfers = async () => {
    if (!userId) {
      setError('請先查找用戶');
      return;
    }
    
    setLoading(true);
    setError('');
    setTransferData(null);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/debug/transfer-records/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      
      const data = await response.json();
      console.log('🔍 Transfer records:', data);
      setTransferData(data);
    } catch (err: any) {
      console.error('❌ Transfer records error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🐛 轉帳診斷工具</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 查找用戶 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">用戶郵箱</label>
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="輸入郵箱"
              />
              <Button onClick={findUser} disabled={loading}>
                查找用戶
              </Button>
            </div>
          </div>

          {/* 用戶信息 */}
          {userData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">用戶信息</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* 查詢轉帳記錄 */}
          {userId && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="User ID"
                />
                <Button onClick={checkTransfers} disabled={loading}>
                  查詢轉帳記錄
                </Button>
              </div>
            </div>
          )}

          {/* 轉帳記錄 */}
          {transferData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">轉帳記錄</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs max-h-96">
                  {JSON.stringify(transferData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* 錯誤信息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
              ❌ {error}
            </div>
          )}

          {/* 加載狀態 */}
          {loading && (
            <div className="text-center text-gray-500">
              載入中...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ✅ 添加 default export 以支持 lazy loading
export default TransferDebug;