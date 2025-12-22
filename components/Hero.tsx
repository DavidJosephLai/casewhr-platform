import { useLanguage } from '../lib/LanguageContext';

export function Hero() {
  const { language } = useLanguage();

  const content = {
    'zh-TW': {
      title: '專業全球接案平台',
      subtitle: '連接優秀人才與優質項目',
      cta: '開始接案'
    },
    'en': {
      title: 'Professional Global Freelance Platform',
      subtitle: 'Connecting Talented Professionals with Quality Projects',
      cta: 'Get Started'
    },
    'zh-CN': {
      title: '专业全球接案平台',
      subtitle: '连接优秀人才与优质项目',
      cta: '开始接案'
    }
  };

  const t = content[language];

  return (
    <section className="relative bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold mb-4">{t.title}</h1>
        <p className="text-xl text-muted-foreground mb-8">{t.subtitle}</p>
        <button className="px-8 py-4 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
          {t.cta}
        </button>
      </div>
    </section>
  );
}
