import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { UserPlus, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';

export function UserCreationHelper() {
  const { accessToken } = useAuth();
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);

  const checkUser = async () => {
    if (!accessToken) {
      toast.error('Please login as admin first');
      return;
    }

    setChecking(true);
    try {
      console.log('🔍 [UserCheck] Checking if user exists...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/get-user-by-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'davidjosephilai1@outlook.com' }),
        }
      );

      const data = await response.json();

      if (response.ok && data.user) {
        console.log('✅ [UserCheck] User exists:', data.user);
        setUserExists(true);
        toast.success(`用戶已存在！ID: ${data.user.id}`);
      } else {
        console.log('❌ [UserCheck] User not found');
        setUserExists(false);
        toast.error('用戶不存在，需要先創建帳號');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      toast.error('檢查失敗');
    } finally {
      setChecking(false);
    }
  };

  const createUser = async () => {
    if (!accessToken) {
      toast.error('Please login as admin first');
      return;
    }

    setCreating(true);
    try {
      console.log('🆕 [UserCreate] Creating user...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/signup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'davidjosephilai1@outlook.com',
            password: 'TempPassword123!',
            name: 'David Lai',
            user_type: 'client',
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.user) {
        console.log('✅ [UserCreate] User created:', data.user);
        toast.success(`✅ 用戶創建成功！\nID: ${data.user.id}\n臨時密碼: TempPassword123!`);
        setUserExists(true);
      } else {
        console.error('❌ [UserCreate] Failed:', data.error);
        toast.error(data.error || '創建失敗');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('創建失敗');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="border-2 border-purple-500 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <UserPlus className="h-5 w-5" />
          用戶檢查工具
        </CardTitle>
        <CardDescription>
          檢查 davidjosephilai1@outlook.com 是否存在
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={checkUser}
          disabled={checking}
          className="w-full bg-purple-600 hover:bg-purple-700"
          variant="default"
        >
          <Search className="h-4 w-4 mr-2" />
          {checking ? '檢查中...' : '檢查用戶是否存在'}
        </Button>

        {userExists === false && (
          <Button
            onClick={createUser}
            disabled={creating}
            className="w-full bg-orange-600 hover:bg-orange-700"
            variant="default"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {creating ? '創建中...' : '創建用戶帳號'}
          </Button>
        )}

        {userExists === true && (
          <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-sm text-green-900 font-medium">
              ✅ 用戶已存在，可以進行儲值
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
