import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { language } = useLanguage();
  const { user, profile } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'zh-TW' ? '儀表板' : language === 'en' ? 'Dashboard' : '仪表板'}
      </h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-lg mb-2">
          {language === 'zh-TW' ? '歡迎回來！' : language === 'en' ? 'Welcome back!' : '欢迎回来！'}
        </p>
        {profile && <p className="text-muted-foreground">{profile.full_name}</p>}
      </div>
    </div>
  );
}
