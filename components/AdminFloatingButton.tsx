import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useView } from '../contexts/ViewContext';
import { useLanguage } from '../lib/LanguageContext';
import { isAnyAdmin } from '../config/admin'; // ✅ 使用統一的管理員配置

export function AdminFloatingButton() {
  const { user, profile } = useAuth(); // ✅ 同時獲取 user 和 profile
  const { setView } = useView();
  const { language } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminStatus = isAnyAdmin(user?.email, profile); // ✅ 傳入 profile
    console.log('🛡️ [AdminFloatingButton] Admin check:', { 
      email: user?.email,
      hasProfile: !!profile,
      isAdmin: adminStatus 
    });
    setIsAdmin(adminStatus);
  }, [user, profile]); // ✅ 監聽 user 和 profile 變化

  if (!isAdmin) {
    console.log('🛡️ [AdminFloatingButton] Not admin, hiding button');
    return null;
  }

  console.log('🛡️ [AdminFloatingButton] Admin button visible');

  const handleClick = () => {
    console.log('🛡️ [AdminFloatingButton] Button clicked, navigating to admin');
    // Navigate to admin page
    setView('admin');
  };

  const buttonText = language === 'zh-CN' 
    ? '管理员面板' 
    : language === 'zh-TW' 
    ? '管理員面板' 
    : 'Admin Panel';

  return (
    <Button
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full h-14 w-14 p-0 flex items-center justify-center group"
      title={buttonText}
    >
      <Shield className="h-6 w-6 group-hover:scale-110 transition-transform" />
      <span className="sr-only">
        {buttonText}
      </span>
    </Button>
  );
}

export default AdminFloatingButton;