import { useState, useEffect } from 'react';
import './utils/errorHandler';
import { useView, ViewProvider } from './contexts/ViewContext';
import { useLanguage, LanguageProvider } from './lib/LanguageContext';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { toast, Toaster } from 'sonner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const { language } = useLanguage();
  const { view, setView } = useView();
  const { user, loading } = useAuth();

  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/dashboard')) setView('dashboard');
    else if (path.includes('/pricing')) setView('pricing');
    else if (path.includes('/browse')) setView('browse');
    else setView('home');
  }, [setView]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {language === 'zh-TW' ? '載入中...' : language === 'en' ? 'Loading...' : '加载中...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {view === 'home' && (
          <>
            <Hero />
            <section className="py-16">
              <div className="max-w-7xl mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold mb-8">
                  {language === 'zh-TW' ? '平台功能' : language === 'en' ? 'Platform Features' : '平台功能'}
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="p-6 bg-white rounded-lg shadow-lg">
                    <div className="text-4xl mb-4">🌍</div>
                    <h3 className="text-xl font-bold mb-2">
                      {language === 'zh-TW' ? '三語言支援' : language === 'en' ? 'Multilingual Support' : '三语言支持'}
                    </h3>
                    <p className="text-muted-foreground">
                      {language === 'zh-TW' ? '繁體中文、English、简体中文' : 
                       language === 'en' ? 'Traditional Chinese, English, Simplified Chinese' : 
                       '繁体中文、English、简体中文'}
                    </p>
                  </div>
                  <div className="p-6 bg-white rounded-lg shadow-lg">
                    <div className="text-4xl mb-4">💱</div>
                    <h3 className="text-xl font-bold mb-2">
                      {language === 'zh-TW' ? '三幣種計價' : language === 'en' ? 'Multi-Currency' : '三币种计价'}
                    </h3>
                    <p className="text-muted-foreground">TWD / USD / CNY</p>
                  </div>
                  <div className="p-6 bg-white rounded-lg shadow-lg">
                    <div className="text-4xl mb-4">💳</div>
                    <h3 className="text-xl font-bold mb-2">
                      {language === 'zh-TW' ? '多支付方式' : language === 'en' ? 'Multiple Payment Methods' : '多支付方式'}
                    </h3>
                    <p className="text-muted-foreground">Stripe, PayPal, ECPay, LINE Pay</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {view === 'dashboard' && <Dashboard />}

        {view === 'pricing' && (
          <div className="max-w-7xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-center mb-12">
              {language === 'zh-TW' ? '價格方案' : language === 'en' ? 'Pricing Plans' : '价格方案'}
            </h1>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 bg-white rounded-lg shadow-lg border-2 border-transparent hover:border-primary transition-colors">
                <h3 className="text-2xl font-bold mb-4">Free</h3>
                <p className="text-4xl font-bold mb-6">$0<span className="text-lg text-muted-foreground">/月</span></p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{language === 'zh-TW' ? '基本功能' : language === 'en' ? 'Basic features' : '基本功能'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{language === 'zh-TW' ? '3個案件/月' : language === 'en' ? '3 projects/month' : '3个案件/月'}</span>
                  </li>
                </ul>
                <button className="w-full py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
                  {language === 'zh-TW' ? '開始使用' : language === 'en' ? 'Get Started' : '开始使用'}
                </button>
              </div>
              
              <div className="p-8 bg-white rounded-lg shadow-lg border-2 border-primary relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white rounded-full text-sm">
                  {language === 'zh-TW' ? '推薦' : language === 'en' ? 'Popular' : '推荐'}
                </div>
                <h3 className="text-2xl font-bold mb-4">Pro</h3>
                <p className="text-4xl font-bold mb-6">$29<span className="text-lg text-muted-foreground">/月</span></p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{language === 'zh-TW' ? '所有Free功能' : language === 'en' ? 'All Free features' : '所有Free功能'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{language === 'zh-TW' ? '無限案件' : language === 'en' ? 'Unlimited projects' : '无限案件'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{language === 'zh-TW' ? '優先支援' : language === 'en' ? 'Priority support' : '优先支持'}</span>
                  </li>
                </ul>
                <button className="w-full py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
                  {language === 'zh-TW' ? '升級至Pro' : language === 'en' ? 'Upgrade to Pro' : '升级至Pro'}
                </button>
              </div>

              <div className="p-8 bg-white rounded-lg shadow-lg border-2 border-transparent hover:border-primary transition-colors">
                <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
                <p className="text-4xl font-bold mb-6">$99<span className="text-lg text-muted-foreground">/月</span></p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{language === 'zh-TW' ? '所有Pro功能' : language === 'en' ? 'All Pro features' : '所有Pro功能'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{language === 'zh-TW' ? '企業品牌定制' : language === 'en' ? 'Custom branding' : '企业品牌定制'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{language === 'zh-TW' ? '專屬客戶經理' : language === 'en' ? 'Dedicated manager' : '专属客户经理'}</span>
                  </li>
                </ul>
                <button className="w-full py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
                  {language === 'zh-TW' ? '聯繫我們' : language === 'en' ? 'Contact Us' : '联系我们'}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'browse' && (
          <div className="max-w-7xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold mb-8">
              {language === 'zh-TW' ? '瀏覽案件' : language === 'en' ? 'Browse Projects' : '浏览案件'}
            </h1>
            <p className="text-lg text-muted-foreground text-center">
              {language === 'zh-TW' ? '案件列表即將推出...' : language === 'en' ? 'Project listings coming soon...' : '案件列表即将推出...'}
            </p>
          </div>
        )}
      </main>

      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ViewProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ViewProvider>
    </LanguageProvider>
  );
}
