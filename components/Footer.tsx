import { useLanguage } from '../lib/LanguageContext';
import { getTranslation } from '../lib/translations';
import { Separator } from './ui/separator';
import { useView } from '../contexts/ViewContext';

export function Footer() {
  const { language } = useLanguage();
  const { setView, setManualOverride } = useView();
  const t = getTranslation(language as any).footer;

  const scrollToContact = () => {
    setView('home');
    setManualOverride(true);
    window.location.hash = '';
    
    const scrollToElement = () => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }
      return false;
    };
    
    setTimeout(() => {
      if (!scrollToElement()) {
        setTimeout(scrollToElement, 300);
      }
    }, 100);
  };

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/Case Where.png" 
                className="h-16 w-auto" 
                alt="Case Where Logo"
              />
              <span className="text-2xl font-bold text-white whitespace-nowrap leading-none">接得準</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">{t.description}</p>
          </div>

          <div>
            <h4 className="mb-4 text-white">{t.services}</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button 
                  onClick={scrollToContact}
                  className="hover:text-white transition-colors text-left"
                >
                  {t.serviceLinks.valuation}
                </button>
              </li>
              <li>
                <button 
                  onClick={scrollToContact}
                  className="hover:text-white transition-colors text-left"
                >
                  {t.serviceLinks.succession}
                </button>
              </li>
              <li>
                <button 
                  onClick={scrollToContact}
                  className="hover:text-white transition-colors text-left"
                >
                  {t.serviceLinks.diligence}
                </button>
              </li>
              <li>
                <button 
                  onClick={scrollToContact}
                  className="hover:text-white transition-colors text-left"
                >
                  {t.serviceLinks.structuring}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-white">{t.company}</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button 
                  onClick={() => {
                    setView('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  {t.companyLinks.about}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setView('cases');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  {t.companyLinks.cases}
                </button>
              </li>
              <li>
                <button 
                  onClick={scrollToContact}
                  className="hover:text-white transition-colors text-left"
                >
                  {t.companyLinks.resources}
                </button>
              </li>
              <li>
                <button 
                  onClick={scrollToContact}
                  className="hover:text-white transition-colors text-left"
                >
                  {t.companyLinks.contact}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-gray-800 mb-8" />

        <div className="mb-8">
          <h4 className="text-white mb-4">{t.legal}</h4>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <button 
              onClick={() => {
                setView('terms-of-service');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-gray-400 hover:text-white transition-colors text-left"
            >
              {t.legalLinks.terms}
            </button>
            <button 
              onClick={() => {
                setView('privacy-policy');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-gray-400 hover:text-white transition-colors text-left"
            >
              {t.legalLinks.privacy}
            </button>
            <button 
              onClick={() => {
                setView('cookies-policy');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-gray-400 hover:text-white transition-colors text-left"
            >
              {t.legalLinks.cookies}
            </button>
            <button 
              onClick={() => {
                setView('disclaimer');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-gray-400 hover:text-white transition-colors text-left"
            >
              {t.legalLinks.disclaimer}
            </button>
          </div>
        </div>

        <div className="space-y-4 text-xs text-gray-500 mb-8">
          <p className="leading-relaxed">{t.disclaimer}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <p className="leading-relaxed">{t.dataProtection}</p>
            <p className="leading-relaxed">{t.intellectualProperty}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <p className="leading-relaxed">{t.limitationOfLiability}</p>
            <p className="leading-relaxed">{t.disputeResolution}</p>
          </div>
        </div>

        <Separator className="bg-gray-800 mb-6" />

        <div className="text-center text-gray-400 text-sm">
          <p>{t.copyright}</p>
        </div>
      </div>
    </footer>
  );
}