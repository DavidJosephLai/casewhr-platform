import { BrandingDiagnostic } from '../components/BrandingDiagnostic';
import { useLanguage } from '../lib/LanguageContext';

export function BrandingDiagnosticPage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <BrandingDiagnostic language={language} />
      </div>
    </div>
  );
}
