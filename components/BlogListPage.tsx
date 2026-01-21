/**
 * 📝 Blog 列表頁面 - 簡化測試版本
 */

import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Lock } from 'lucide-react';

export function BlogListPage() {
  const { user } = useAuth();

  // 🔒 登入檢查
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="p-6 sm:p-8 text-center shadow-2xl border-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🔒 需要會員登入
            </h2>
            
            <p className="text-gray-600 mb-4 sm:mb-6 text-base sm:text-lg">
              請登入以閱讀我們的專屬部落格內容
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  console.log('🔐 [Blog] Opening login dialog...');
                  window.dispatchEvent(new Event('openLoginDialog'));
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 sm:py-6 text-base sm:text-lg font-semibold"
              >
                立即登入
              </Button>
              
              <Button 
                onClick={() => {
                  console.log('📝 [Blog] Opening signup dialog...');
                  window.dispatchEvent(new CustomEvent('openAuthDialog', { detail: 'signup' }));
                }}
                variant="outline"
                className="w-full py-4 sm:py-6 text-base sm:text-lg font-semibold border-2 hover:bg-gray-50"
              >
                註冊帳號
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ 登入後顯示
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-black mb-4">
            📝 部落格
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            為接案者和發案者提供深度洞察、實用技巧和成功故事
          </p>
          
          <Card className="p-8">
            <p className="text-lg text-gray-700">
              ✅ Blog 系統已成功載入！
            </p>
            <p className="text-sm text-gray-500 mt-2">
              您現在已登入，可以查看所有文章內容。
            </p>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                🎉 恭喜！會員限制功能正常運作
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default BlogListPage;
