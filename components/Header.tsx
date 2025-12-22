import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useView } from '../contexts/ViewContext';

export function Header() {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { setView } = useView();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => setView('home')} className="text-2xl font-bold text-primary">
              CaseWhr
            </button>
            <nav className="hidden md:flex gap-6">
              <button onClick={() => setView('browse')} className="text-sm hover:text-primary">
                {language === 'zh-TW' ? '瀏覽案件' : language === 'en' ? 'Browse Projects' : '浏览案件'}
              </button>
              <button onClick={() => setView('pricing')} className="text-sm hover:text-primary">
                {language === 'zh-TW' ? '價格方案' : language === 'en' ? 'Pricing' : '价格方案'}
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
              <option value="zh-CN">简体中文</option>
            </select>
            {user ? (
              <button onClick={() => setView('dashboard')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">
                {language === 'zh-TW' ? '儀表板' : language === 'en' ? 'Dashboard' : '仪表板'}
              </button>
            ) : (
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm">
                {language === 'zh-TW' ? '登入' : language === 'en' ? 'Sign In' : '登录'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
