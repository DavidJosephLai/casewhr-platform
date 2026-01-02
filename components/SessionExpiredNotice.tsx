import { Card } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SessionExpiredNoticeProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function SessionExpiredNotice({ language = 'en' }: SessionExpiredNoticeProps) {
  const { signOut } = useAuth();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-100 rounded-lg">
          <AlertTriangle className="size-6 text-red-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-red-900 mb-2">
            {language === 'en' ? '🔒 Session Expired' : '🔒 登入已過期'}
          </h3>
          
          <p className="text-red-800 mb-4">
            {language === 'en' 
              ? 'Your session has expired or is invalid. Please refresh the page or sign in again to continue.' 
              : '您的登入已過期或無效。請重新整理頁面或重新登入以繼續。'}
          </p>

          <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-900">
              <strong>{language === 'en' ? 'Why did this happen?' : '為什麼會發生這種情況？'}</strong>
            </p>
            <ul className="text-sm text-red-800 mt-2 space-y-1 list-disc list-inside ml-2">
              <li>{language === 'en' ? 'You were inactive for too long' : '您長時間未操作'}</li>
              <li>{language === 'en' ? 'Your login token expired' : '您的登入憑證已過期'}</li>
              <li>{language === 'en' ? 'You signed in from another device' : '您從其他裝置登入'}</li>
              <li>{language === 'en' ? 'Security settings require re-authentication' : '安全設置要求重新驗證'}</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleRefresh}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="size-4 mr-2" />
              {language === 'en' ? 'Refresh Page' : '重新整理頁面'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleSignOut}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <LogOut className="size-4 mr-2" />
              {language === 'en' ? 'Sign Out & Return Home' : '登出並返回首頁'}
            </Button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 <strong>{language === 'en' ? 'Quick Fix:' : '快速修復：'}</strong>{' '}
              {language === 'en' 
                ? 'Try refreshing the page first. If that doesn\'t work, sign out and sign back in.' 
                : '先嘗試重新整理頁面。如果還是不行，請登出後重新登入。'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}