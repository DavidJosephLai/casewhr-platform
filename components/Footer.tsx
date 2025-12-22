import { useLanguage } from '../lib/LanguageContext';

export function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="bg-gray-50 border-t py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© 2024 CaseWhr. {language === 'zh-TW' ? '版權所有' : language === 'en' ? 'All rights reserved' : '版权所有'}</p>
      </div>
    </footer>
  );
}
